import {
  indicatorTypeForVariable,
  rankVariables,
} from "../ranking.js";
import { maxKeyResultCount } from "./constants.js";
import { providerError } from "./errors.js";
import {
  cleanDirection,
  cleanId,
  cleanText,
  clampNumber,
  normalizeObjective,
  titleFromId,
} from "./format.js";
import {
  validateGraphSemantics,
  validatePlanningSubset,
} from "./graph-validation.js";
import { graphTypes } from "./schemas.js";
import {
  relatedDriverLabels,
} from "../key-results.js";
import { validateKeyResultSet } from "../kr-contracts.js";

export function normalizeAiGraph(objective, response) {
  if (!response || typeof response !== "object") {
    throw new Error("AI graph response must be an object.");
  }

  const fullGraph = normalizeGraphContainer(objective, response.fullGraph ?? response, {
    maxNodes: 70,
    maxEdges: 120,
    includeFallbackOutcome: true,
    rejectInvalidEdges: true,
  });
  const planningGraph = normalizeGraphContainer(objective, response.planningGraph ?? response, {
    maxNodes: 20,
    maxEdges: 32,
    includeFallbackOutcome: true,
    rejectInvalidEdges: true,
  });
  validateGraphSemantics(planningGraph, { label: "planning graph" });
  validateGraphSemantics(fullGraph, { label: "full graph", requireReachableOutcome: false });
  validatePlanningSubset(fullGraph, planningGraph);

  const nodes = planningGraph.nodes;
  const edges = planningGraph.edges;

  return {
    objective,
    summary: cleanText(response.summary) || `AI-generated causal metrics model for "${objective}".`,
    nodes,
    edges,
    rankings: rankVariables(nodes),
    assessments: {},
    fullGraph,
    planningGraph,
  };
}

export function normalizeAiKeyResults(graph, response) {
  if (!response || typeof response !== "object" || !Array.isArray(response.keyResults)) {
    throw providerError("invalid_provider_output", "AI key result response must include a keyResults array.");
  }

  if (response.keyResults.length < 3) {
    throw providerError("invalid_provider_output", "AI key result response must include at least three key results.");
  }

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const keyResults = response.keyResults.slice(0, maxKeyResultCount).map((keyResult, index) => {
    const variableId = cleanId(keyResult.variableId);
    const variable = nodeById.get(variableId);
    if (!variable || variable.type === "outcome") {
      throw providerError("invalid_provider_output", `AI key result references unknown variable: ${variableId}`);
    }

    const indicatorType = cleanIndicatorType(keyResult.indicatorType);

    const relatedDrivers = Array.isArray(keyResult.relatedDrivers)
      ? keyResult.relatedDrivers.map(cleanText).filter(Boolean).slice(0, 4)
      : relatedDriverLabels(variable.id, graph);

    return {
      id: cleanId(keyResult.id) || `kr-${index + 1}`,
      variableId,
      indicatorType,
      text: cleanText(keyResult.text) || `Improve ${variable.label} this quarter`,
      rationale: cleanText(keyResult.rationale) || `${variable.label} was selected from the clarified causal graph.`,
      relatedDrivers,
      score: variable.score ?? graph.rankings.find((candidate) => candidate.id === variableId)?.score ?? 0,
      assessment: graph.assessments[variableId] ?? null,
    };
  });

  if (keyResults.length === 0) {
    throw providerError("invalid_provider_output", "AI key result response did not include any usable key results.");
  }

  validateProviderKeyResultSet(keyResults);

  return keyResults;
}

export function normalizeGraphInput(graph) {
  if (!graph || typeof graph !== "object") {
    return null;
  }

  const nodes = normalizeNodes(graph.nodes, { maxNodes: 20 });
  const edges = normalizeEdges(graph.edges, new Set(nodes.map((node) => node.id)), { maxEdges: 32 });

  return {
    objective: normalizeObjective(graph.objective),
    summary: cleanText(graph.summary),
    nodes,
    edges,
    rankings: rankVariables(nodes),
    assessments: graph.assessments && typeof graph.assessments === "object" ? graph.assessments : {},
    generation: graph.generation && typeof graph.generation === "object" ? graph.generation : undefined,
    fullGraph: graph.fullGraph
      ? normalizeGraphContainer(normalizeObjective(graph.objective), graph.fullGraph, {
        maxNodes: 70,
        maxEdges: 120,
        includeFallbackOutcome: false,
        rejectInvalidEdges: true,
      })
      : undefined,
    planningGraph: graph.planningGraph
      ? normalizeGraphContainer(normalizeObjective(graph.objective), graph.planningGraph, {
        maxNodes: 20,
        maxEdges: 32,
        includeFallbackOutcome: false,
        rejectInvalidEdges: true,
      })
      : undefined,
  };
}

function normalizeGraphContainer(objective, graph, { maxNodes, maxEdges, includeFallbackOutcome, rejectInvalidEdges = false }) {
  const nodes = normalizeNodes(graph?.nodes, { maxNodes });
  if (includeFallbackOutcome && !nodes.some((node) => node.type === "outcome")) {
    nodes.push({
      id: "outcome",
      type: "outcome",
      label: objective,
      description: "The downstream outcome the objective is trying to create.",
      impact: 100,
      confidence: 85,
      influenceable: false,
      stage: 4,
      direction: "improve",
    });
  }

  return {
    summary: cleanText(graph?.summary),
    nodes,
    edges: normalizeEdges(graph?.edges, new Set(nodes.map((node) => node.id)), { maxEdges, rejectInvalidEdges }),
  };
}

function normalizeNodes(nodes, { maxNodes } = {}) {
  if (!Array.isArray(nodes) || nodes.length < 4) {
    throw new Error("AI graph response must include at least four nodes.");
  }

  return nodes.slice(0, maxNodes ?? 12).map((node, index) => {
    const id = cleanId(node.id) || `metric-${index + 1}`;
    const type = graphTypes.has(node.type) ? node.type : "driver";
    const stage = clampNumber(node.stage, type === "outcome" ? 4 : 2, 1, 4);
    const convergenceRationale = cleanText(node.convergenceRationale);

    const normalizedNode = {
      id,
      type,
      label: cleanText(node.label) || titleFromId(id),
      description: cleanText(node.description) || "A measurable factor in the causal model.",
      impact: clampNumber(node.impact, 70, 1, 100),
      confidence: clampNumber(node.confidence, 70, 1, 100),
      influenceable: type === "outcome" ? false : Boolean(node.influenceable ?? true),
      stage,
      direction: cleanDirection(node.direction),
    };

    if (convergenceRationale) {
      normalizedNode.convergenceRationale = convergenceRationale;
    }

    return normalizedNode;
  });
}

function normalizeEdges(edges, nodeIds, { maxEdges, rejectInvalidEdges = false } = {}) {
  if (!Array.isArray(edges)) {
    return [];
  }

  const normalizedEdges = edges
    .slice(0, maxEdges ?? 16)
    .map((edge, index) => ({
      id: cleanId(edge.id) || `rel-${index + 1}`,
      source: cleanId(edge.source),
      target: cleanId(edge.target),
      rationale: cleanText(edge.rationale) || "This relationship contributes to the objective.",
      strength: clampNumber(edge.strength, 70, 1, 100),
    }));

  if (rejectInvalidEdges) {
    const invalidEdge = normalizedEdges.find((edge) =>
      !nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target,
    );
    if (invalidEdge) {
      throw new Error(`AI graph edge references invalid nodes: ${invalidEdge.id}`);
    }
  }

  return normalizedEdges.filter((edge) =>
    nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.source !== edge.target,
  );
}

function cleanIndicatorType(value) {
  if (value === "leading" || value === "lagging") {
    return value;
  }

  throw providerError("invalid_provider_output", `AI key result has invalid indicatorType: ${value}`);
}

function validateIndicatorMix(keyResults) {
  const laggingCount = keyResults.filter((keyResult) => keyResult.indicatorType === "lagging").length;
  const leadingCount = keyResults.filter((keyResult) => keyResult.indicatorType === "leading").length;

  if (laggingCount < 1 || laggingCount > 2 || leadingCount < 2 || leadingCount > 3) {
    throw providerError("invalid_provider_output", `AI key result indicator mix is invalid: ${laggingCount} lagging and ${leadingCount} leading.`);
  }
}

function validateProviderKeyResultSet(keyResults) {
  try {
    validateKeyResultSet(keyResults);
  } catch (error) {
    throw providerError("invalid_provider_output", error.message, error);
  }
}
