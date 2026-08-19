import { exploreKeyResultSets } from "./candidate-sets.js";
import {
  hasValidIndicatorMix,
  validateKeyResultSet,
} from "./kr-contracts.js";
import { indicatorTypeForVariable } from "./ranking.js";

export function generateKeyResultsForGraph(graph, options = {}) {
  const count = options.count ?? 4;
  const candidateKeyResultSets = exploreKeyResultSets(graph, { setSizes: [count] });
  const selectedVariables = candidateKeyResultSets[0]?.variables ?? selectKeyResultVariables(graph.rankings, count, graph);
  const keyResults = selectedVariables.map((variable, index) =>
    toKeyResult(variable, graph.edges, graph.nodes, index, graph.assessments[variable.id], options),
  );
  validateKeyResultSet(keyResults);

  return {
    candidateKeyResultSets,
    keyResults,
  };
}

export function selectKeyResultVariables(rankedVariables, count = 4, graph = null) {
  if (graph) {
    const candidateSet = exploreKeyResultSets(graph, { setSizes: [count], limit: 1 })[0];
    if (candidateSet) {
      return candidateSet.variables;
    }
  }

  const available = rankedVariables.filter((variable) => variable.type !== "outcome");
  const topRanked = available.slice(0, count);
  if (hasValidIndicatorMix(topRanked)) {
    return topRanked;
  }

  const lagging = available.filter((variable) => indicatorTypeForVariable(variable) === "lagging");
  const leading = available.filter((variable) => indicatorTypeForVariable(variable) === "leading");
  const targetLagging = Math.min(2, lagging.length, Math.max(1, count - Math.min(3, leading.length)));
  const targetLeading = Math.min(3, leading.length, count - targetLagging);
  const selectedIds = new Set([
    ...lagging.slice(0, targetLagging).map((variable) => variable.id),
    ...leading.slice(0, targetLeading).map((variable) => variable.id),
  ]);

  for (const variable of available) {
    if (selectedIds.size >= count) {
      break;
    }
    selectedIds.add(variable.id);
  }

  return available.filter((variable) => selectedIds.has(variable.id)).slice(0, count);
}

function toKeyResult(variable, relationships, variables, index, assessment, options) {
  const relatedDrivers = relatedDriverLabels(variable.id, { edges: relationships, nodes: variables });
  const fallbackStyle = options.style === "fallback";
  const clarificationContext = assessment
    ? fallbackStyle
      ? ` Your clarification rated it ${assessment.influenceability}/5 for influenceability and ${assessment.gap}/5 for perceived gap.`
      : `, and your clarification rated this metric ${assessment.influenceability}/5 for influenceability and ${assessment.gap}/5 for perceived gap`
    : "";

  return {
    id: `kr-${index + 1}`,
    variableId: variable.id,
    indicatorType: indicatorTypeForVariable(variable),
    text: targetPhrase(variable, index, fallbackStyle),
    rationale: fallbackStyle
      ? `${variable.label} remains a strong candidate in the clarified causal model.${clarificationContext}`
      : `${variable.label} is a strong KR candidate because it is ${variable.influenceable ? "influenceable" : "observable"}, has high estimated impact (${variable.impact}/100), and connects the objective to ${relatedDrivers.length > 0 ? relatedDrivers.join(", ") : "the causal model"}${clarificationContext}.`,
    relatedDrivers,
    score: variable.score,
    assessment: assessment ?? null,
  };
}

export function relatedDriverLabels(variableId, graph) {
  return graph.edges
    .filter((edge) => edge.target === variableId)
    .map((edge) => graph.nodes.find((node) => node.id === edge.source)?.label)
    .filter(Boolean);
}

function targetPhrase(variable, index, fallbackStyle) {
  const timeframe = fallbackStyle
    ? "the next 90 days"
    : ["next quarter", "the next 90 days", "this quarter", "the next planning cycle"][index % 4];

  if (variable.direction === "reduce") {
    return `Reduce ${variable.label} by 20% in ${timeframe}`;
  }

  if (variable.direction === "increase") {
    return `Increase ${variable.label} by 15% in ${timeframe}`;
  }

  return `Improve ${variable.label} to a clearly measured green status in ${timeframe}`;
}
