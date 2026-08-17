const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "in",
  "of",
  "on",
  "our",
  "the",
  "to",
  "with",
]);

const VARIABLE_BLUEPRINTS = [
  {
    id: "outcome",
    type: "outcome",
    label: ({ objective }) => objective,
    description: "The downstream outcome the objective is trying to create.",
    impact: 100,
    confidence: 88,
    influenceable: false,
    stage: 4,
  },
  {
    id: "primary-result",
    type: "evidence",
    label: ({ focus }) => `${focus} success rate`,
    description: "Direct evidence that the objective is being achieved for the intended audience.",
    impact: 92,
    confidence: 84,
    influenceable: true,
    stage: 3,
    direction: "increase",
  },
  {
    id: "experience-quality",
    type: "experience",
    label: ({ focus }) => `${focus} user experience quality`,
    description: "How reliably the people affected by the objective experience the desired result.",
    impact: 86,
    confidence: 78,
    influenceable: true,
    stage: 3,
    direction: "increase",
  },
  {
    id: "throughput",
    type: "driver",
    label: ({ focus }) => `${focus} throughput`,
    description: "The volume of valuable outcomes completed in the target operating rhythm.",
    impact: 82,
    confidence: 80,
    influenceable: true,
    stage: 2,
    direction: "increase",
  },
  {
    id: "cycle-time",
    type: "driver",
    label: ({ focus }) => `${focus} cycle time`,
    description: "How long it takes for work or demand to move from start to completed value.",
    impact: 78,
    confidence: 82,
    influenceable: true,
    stage: 2,
    direction: "reduce",
  },
  {
    id: "failure-rate",
    type: "failure-mode",
    label: ({ focus }) => `${focus} failure rate`,
    description: "The share of attempts that disappoint users, miss expectations, or need rework.",
    impact: 88,
    confidence: 86,
    influenceable: true,
    stage: 2,
    direction: "reduce",
  },
  {
    id: "capacity",
    type: "upstream-driver",
    label: ({ focus }) => `${focus} team capacity`,
    description: "The staffing, tools, and available attention needed to improve the system.",
    impact: 72,
    confidence: 70,
    influenceable: true,
    stage: 1,
    direction: "increase",
  },
  {
    id: "process-quality",
    type: "upstream-driver",
    label: ({ focus }) => `${focus} process quality`,
    description: "The quality of routines that prevent defects and keep work flowing.",
    impact: 76,
    confidence: 74,
    influenceable: true,
    stage: 1,
    direction: "improve",
  },
  {
    id: "feedback-signal",
    type: "upstream-driver",
    label: ({ focus }) => `${focus} feedback signal quality`,
    description: "The freshness and usefulness of feedback that guides improvement decisions.",
    impact: 74,
    confidence: 72,
    influenceable: true,
    stage: 1,
    direction: "improve",
  },
  {
    id: "trust",
    type: "experience",
    label: ({ focus }) => `${focus} stakeholder trust`,
    description: "Whether stakeholders believe the improved outcome will hold up over time.",
    impact: 80,
    confidence: 76,
    influenceable: true,
    stage: 3,
    direction: "increase",
  },
];

const RELATIONSHIP_BLUEPRINTS = [
  ["capacity", "throughput", "More available capacity raises the system's ability to deliver valuable outcomes."],
  ["process-quality", "cycle-time", "Better process quality removes avoidable waits and rework."],
  ["process-quality", "failure-rate", "Better process quality prevents misses, defects, and reversals."],
  ["feedback-signal", "experience-quality", "Sharper feedback helps teams improve the experience users actually notice."],
  ["throughput", "primary-result", "Higher throughput increases the amount of observable objective progress."],
  ["cycle-time", "experience-quality", "Shorter cycle time makes the outcome feel more dependable and useful."],
  ["failure-rate", "experience-quality", "Fewer failures improve the lived experience around the objective."],
  ["experience-quality", "trust", "Consistent experience creates confidence that the improvement is real."],
  ["primary-result", "outcome", "Direct evidence rolls up to the objective."],
  ["trust", "outcome", "Stakeholder trust reinforces the objective's durable impact."],
  ["experience-quality", "outcome", "The objective is strongest when users experience the improvement directly."],
];

export function generateKeyResultsModel(rawObjective, clarifications = {}) {
  const graph = applyClarifications(generateCausalMetricsGraph(rawObjective), clarifications);
  const candidateKeyResultSets = exploreKeyResultSets(graph, { setSizes: [4] });
  const selectedVariables = candidateKeyResultSets[0]?.variables ?? selectKeyResultVariables(graph.rankings);
  const keyResults = selectedVariables.map((variable, index) =>
    toKeyResult(variable, graph.edges, graph.nodes, index, graph.assessments[variable.id]),
  );

  return {
    objective: graph.objective,
    summary: graph.summary,
    graph,
    variables: graph.nodes,
    relationships: graph.edges,
    rankedVariables: graph.rankings,
    candidateKeyResultSets,
    keyResults,
  };
}

export function generateCausalMetricsGraph(rawObjective) {
  const objective = normalizeObjective(rawObjective);
  const focus = extractFocus(objective);
  const context = { objective, focus };
  const nodes = VARIABLE_BLUEPRINTS.map((blueprint) => ({
    id: blueprint.id,
    type: blueprint.type,
    label: blueprint.label(context),
    description: blueprint.description,
    impact: blueprint.impact,
    confidence: blueprint.confidence,
    influenceable: blueprint.influenceable,
    stage: blueprint.stage,
    direction: blueprint.direction ?? "improve",
  }));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = RELATIONSHIP_BLUEPRINTS.filter(
    ([source, target]) => nodeIds.has(source) && nodeIds.has(target),
  ).map(([source, target, rationale], index) => ({
    id: `rel-${index + 1}`,
    source,
    target,
    rationale,
    strength: relationshipStrength(source, target, nodes),
  }));

  return {
    objective,
    summary: `A causal metrics model for "${objective}" that works backward from the outcome to direct evidence, operating drivers, upstream causes, experience factors, and failure modes.`,
    nodes,
    edges,
    rankings: rankVariables(nodes),
    assessments: {},
  };
}

export function applyClarifications(graph, clarifications = {}) {
  const assessments = normalizeAssessments(clarifications);
  const nodes = graph.nodes.map((node) => {
    const assessment = assessments[node.id];
    if (!assessment) {
      return { ...node };
    }

    return {
      ...node,
      userInfluenceability: assessment.influenceability,
      userGap: assessment.gap,
    };
  });

  return {
    ...graph,
    nodes,
    edges: graph.edges.map((edge) => ({ ...edge })),
    assessments,
    rankings: rankVariables(nodes),
  };
}

export function rankVariables(variables) {
  return variables
    .filter((variable) => variable.type !== "outcome")
    .map((variable) => ({
      ...variable,
      nodeId: variable.id,
      score: Math.round(
        variable.impact * 0.55 +
          variable.confidence * 0.25 +
          influenceabilityScore(variable) +
          gapScore(variable) +
          typeWeight(variable.type),
      ),
    }))
    .sort((left, right) => right.score - left.score || right.impact - left.impact);
}

function normalizeObjective(rawObjective) {
  const objective = String(rawObjective ?? "").replace(/\s+/g, " ").trim();
  if (!objective) {
    return "Improve a meaningful outcome";
  }
  return objective.charAt(0).toUpperCase() + objective.slice(1);
}

function extractFocus(objective) {
  const words = objective
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  const trimmedWords = words.filter(
    (word) => !["improve", "increase", "reduce", "grow", "expand", "build"].includes(word),
  );
  const focusWords = trimmedWords.length > 0 ? trimmedWords : words;
  return focusWords.slice(0, 3).join(" ") || "objective";
}

function typeWeight(type) {
  return {
    evidence: 10,
    driver: 7,
    "failure-mode": 8,
    experience: 5,
    "upstream-driver": 3,
  }[type] ?? 0;
}

function relationshipStrength(sourceId, targetId, variables) {
  const variableById = new Map(variables.map((variable) => [variable.id, variable]));
  const source = variableById.get(sourceId);
  const target = variableById.get(targetId);
  return Math.round(((source?.impact ?? 50) + (target?.impact ?? 50)) / 2);
}

function toKeyResult(variable, relationships, variables, index, assessment) {
  const inbound = relationships.filter((relationship) => relationship.target === variable.id);
  const relatedDrivers = inbound.map((relationship) => {
    const source = variables.find((candidate) => candidate.id === relationship.source);
    return source?.label ?? relationship.source;
  });
  const phrase = targetPhrase(variable, index);
  const clarificationContext = assessment
    ? `, and your clarification rated this metric ${assessment.influenceability}/5 for influenceability and ${assessment.gap}/5 for perceived gap`
    : "";

  return {
    id: `kr-${index + 1}`,
    variableId: variable.id,
    indicatorType: indicatorTypeForVariable(variable),
    text: phrase,
    rationale: `${variable.label} is a strong KR candidate because it is ${variable.influenceable ? "influenceable" : "observable"}, has high estimated impact (${variable.impact}/100), and connects the objective to ${relatedDrivers.length > 0 ? relatedDrivers.join(", ") : "the causal model"}${clarificationContext}.`,
    relatedDrivers,
    score: variable.score,
    assessment: assessment ?? null,
  };
}

export function indicatorTypeForVariable(variable) {
  return ["evidence", "experience"].includes(variable?.type) ? "lagging" : "leading";
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

export function exploreKeyResultSets(graph, options = {}) {
  const setSizes = options.setSizes ?? [3, 4, 5];
  const limit = options.limit ?? 10;
  const maxPoolSize = options.maxPoolSize ?? 20;
  const normalizedGraph = normalizeExplorationGraph(graph);
  const rankedVariables = normalizedGraph.rankings
    .filter((variable) => variable.type !== "outcome")
    .slice(0, maxPoolSize);
  const pathInfo = buildPathInfo(normalizedGraph);
  const candidates = [];

  for (const size of setSizes) {
    if (size < 1 || size > rankedVariables.length) {
      continue;
    }
    for (const variables of combinations(rankedVariables, size)) {
      candidates.push(scoreKeyResultSet(variables, normalizedGraph, pathInfo));
    }
  }

  return candidates
    .filter((candidate) => candidate.metrics.laggingCount >= 1 && candidate.metrics.leadingCount >= 2)
    .sort((left, right) => right.score - left.score || right.metrics.nodeQuality - left.metrics.nodeQuality)
    .slice(0, limit)
    .map((candidate, index) => ({
      ...candidate,
      id: `kr-set-${index + 1}`,
      variables: candidate.variables.map((variable) => ({
        ...variable,
        indicatorType: indicatorTypeForVariable(variable),
      })),
    }));
}

function hasValidIndicatorMix(variables) {
  const laggingCount = variables.filter((variable) => indicatorTypeForVariable(variable) === "lagging").length;
  const leadingCount = variables.filter((variable) => indicatorTypeForVariable(variable) === "leading").length;
  return laggingCount >= 1 && laggingCount <= 2 && leadingCount >= 2 && leadingCount <= 3;
}

function normalizeExplorationGraph(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  return {
    nodes,
    edges,
    rankings: Array.isArray(graph?.rankings) && graph.rankings.length > 0
      ? graph.rankings
      : rankVariables(nodes),
    assessments: graph?.assessments && typeof graph.assessments === "object" ? graph.assessments : {},
  };
}

function scoreKeyResultSet(variables, graph, pathInfo) {
  const branches = new Set(variables.map((variable) => pathInfo.branchById.get(variable.id) ?? variable.id));
  const laggingCount = variables.filter((variable) => indicatorTypeForVariable(variable) === "lagging").length;
  const leadingCount = variables.length - laggingCount;
  const nodeQuality = Math.round(
    average(
      variables.map((variable) =>
        nodeExplorationScore(variable, pathInfo),
      ),
    ),
  );
  const mixScore = indicatorMixScore(laggingCount, leadingCount);
  const branchCoverageScore = branches.size * 12;
  const connectedPairCount = countConnectedPairs(variables, pathInfo);
  const connectednessScore = Math.min(connectedPairCount * 5, 20);
  const redundancyPenalty = redundancyPenaltyFor(variables, pathInfo);
  const externalityPenalty = variables.filter((variable) => !variable.influenceable).length * 12;
  const score = Math.round(
    nodeQuality +
      mixScore +
      branchCoverageScore +
      connectednessScore -
      redundancyPenalty -
      externalityPenalty,
  );
  const variableIds = variables.map((variable) => variable.id);

  return {
    variableIds,
    variables,
    score,
    metrics: {
      nodeQuality,
      mixScore,
      branchCoverageScore,
      branchCount: branches.size,
      connectedPairCount,
      connectednessScore,
      redundancyPenalty,
      externalityPenalty,
      laggingCount,
      leadingCount,
    },
    assessments: Object.fromEntries(
      variableIds
        .map((variableId) => [variableId, graph.assessments[variableId]])
        .filter(([, assessment]) => assessment),
    ),
    rationale: `Selected ${laggingCount} lagging and ${leadingCount} leading candidates across ${branches.size} causal branches, with ${connectedPairCount} selected causal connection${connectedPairCount === 1 ? "" : "s"} and ${redundancyPenalty} redundancy penalty points.`,
  };
}

function nodeExplorationScore(variable, pathInfo) {
  const distance = pathInfo.distanceToOutcomeById.get(variable.id);
  const pathStrength = pathInfo.pathStrengthById.get(variable.id) ?? 0;
  const proximityScore = distance ? Math.max(0, 24 - distance * 5) : 0;
  const disconnectedPenalty = distance === Infinity || distance === undefined ? 25 : 0;
  return Math.round(
    (variable.score ?? variable.impact ?? 50) +
      proximityScore +
      pathStrength * 0.08 -
      disconnectedPenalty,
  );
}

function indicatorMixScore(laggingCount, leadingCount) {
  if (laggingCount >= 1 && laggingCount <= 2 && leadingCount >= 2 && leadingCount <= 3) {
    return 35;
  }

  return -60;
}

function buildPathInfo(graph) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const outgoing = new Map(graph.nodes.map((node) => [node.id, []]));
  for (const edge of graph.edges) {
    if (!outgoing.has(edge.source)) {
      outgoing.set(edge.source, []);
    }
    outgoing.get(edge.source).push(edge);
  }

  const outcomeIds = new Set(graph.nodes.filter((node) => node.type === "outcome").map((node) => node.id));
  const branchById = new Map();
  const distanceToOutcomeById = new Map();
  const pathStrengthById = new Map();
  const reachesById = new Map();

  for (const node of graph.nodes) {
    const path = bestPathToOutcome(node.id, outgoing, outcomeIds);
    distanceToOutcomeById.set(node.id, path.distance);
    pathStrengthById.set(node.id, path.strength);
    reachesById.set(node.id, new Set(path.nodeIds));
    branchById.set(node.id, branchIdFor(node, path.nodeIds, nodeById));
  }

  return {
    branchById,
    distanceToOutcomeById,
    pathStrengthById,
    reachesById,
  };
}

function bestPathToOutcome(startId, outgoing, outcomeIds) {
  const queue = [{ id: startId, distance: 0, strength: 0, nodeIds: [startId] }];
  const visited = new Set();
  let best = { distance: Infinity, strength: 0, nodeIds: [startId] };

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current.id)) {
      continue;
    }
    visited.add(current.id);

    if (outcomeIds.has(current.id)) {
      best = current;
      break;
    }

    for (const edge of outgoing.get(current.id) ?? []) {
      const nextStrength = current.distance === 0
        ? edge.strength
        : Math.min(current.strength, edge.strength);
      queue.push({
        id: edge.target,
        distance: current.distance + 1,
        strength: nextStrength,
        nodeIds: [...current.nodeIds, edge.target],
      });
    }
  }

  return best;
}

function branchIdFor(node, pathNodeIds, nodeById) {
  if (["evidence", "experience"].includes(node.type)) {
    return node.id;
  }

  const downstreamBranch = pathNodeIds
    .slice(1)
    .map((nodeId) => nodeById.get(nodeId))
    .find((candidate) => ["evidence", "experience"].includes(candidate?.type));

  return downstreamBranch?.id ?? pathNodeIds.at(-1) ?? node.id;
}

function countConnectedPairs(variables, pathInfo) {
  let count = 0;
  for (const [left, right] of unorderedPairs(variables)) {
    const leftReachesRight = pathInfo.reachesById.get(left.id)?.has(right.id);
    const rightReachesLeft = pathInfo.reachesById.get(right.id)?.has(left.id);
    if (leftReachesRight || rightReachesLeft) {
      count += 1;
    }
  }
  return count;
}

function redundancyPenaltyFor(variables, pathInfo) {
  return unorderedPairs(variables).reduce((penalty, [left, right]) => {
    const sameBranch = pathInfo.branchById.get(left.id) === pathInfo.branchById.get(right.id);
    const sameIndicatorType = indicatorTypeForVariable(left) === indicatorTypeForVariable(right);
    const related = pathInfo.reachesById.get(left.id)?.has(right.id) || pathInfo.reachesById.get(right.id)?.has(left.id);
    const semanticOverlap = labelOverlap(left.label, right.label);
    return penalty + (sameBranch && sameIndicatorType ? 10 : 0) + (related ? 6 : 0) + (semanticOverlap ? 8 : 0);
  }, 0);
}

function combinations(items, size, start = 0, prefix = []) {
  if (prefix.length === size) {
    return [prefix];
  }

  const sets = [];
  for (let index = start; index <= items.length - (size - prefix.length); index += 1) {
    sets.push(...combinations(items, size, index + 1, [...prefix, items[index]]));
  }
  return sets;
}

function unorderedPairs(items) {
  const pairs = [];
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      pairs.push([items[left], items[right]]);
    }
  }
  return pairs;
}

function average(numbers) {
  return numbers.length > 0
    ? numbers.reduce((total, number) => total + number, 0) / numbers.length
    : 0;
}

function labelOverlap(leftLabel, rightLabel) {
  const leftWords = significantWords(leftLabel);
  const rightWords = significantWords(rightLabel);
  return [...leftWords].filter((word) => rightWords.has(word)).length >= 2;
}

function significantWords(label) {
  return new Set(
    String(label ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word)),
  );
}

function targetPhrase(variable, index) {
  const timeframe = ["next quarter", "the next 90 days", "this quarter", "the next planning cycle"][
    index % 4
  ];

  if (variable.direction === "reduce") {
    return `Reduce ${variable.label} by 20% in ${timeframe}`;
  }

  if (variable.direction === "increase") {
    return `Increase ${variable.label} by 15% in ${timeframe}`;
  }

  return `Improve ${variable.label} to a clearly measured green status in ${timeframe}`;
}

function normalizeAssessments(clarifications) {
  return Object.fromEntries(
    Object.entries(clarifications)
      .map(([nodeId, assessment]) => [
        nodeId,
        {
          influenceability: clampAssessment(assessment?.influenceability),
          gap: clampAssessment(assessment?.gap),
        },
      ])
      .filter(([, assessment]) => assessment.influenceability > 0 || assessment.gap > 0),
  );
}

function clampAssessment(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(1, Math.min(5, Math.round(number)));
}

function influenceabilityScore(variable) {
  if (variable.userInfluenceability) {
    return variable.userInfluenceability * 5;
  }

  return variable.influenceable ? 18 : 0;
}

function gapScore(variable) {
  return variable.userGap ? variable.userGap * 4 : 0;
}
