import { hasValidIndicatorMix } from "./kr-contracts.js";
import { indicatorTypeForVariable, rankVariables } from "./ranking.js";

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
    .filter((candidate) => hasValidIndicatorMix(candidate.variables))
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
  let best = { distance: Infinity, strength: 0, nodeIds: [startId] };

  while (queue.length > 0) {
    queue.sort(comparePath);
    const current = queue.shift();

    if (outcomeIds.has(current.id)) {
      best = current;
      break;
    }

    for (const edge of outgoing.get(current.id) ?? []) {
      if (current.nodeIds.includes(edge.target)) {
        continue;
      }
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

function comparePath(left, right) {
  return left.distance - right.distance ||
    right.strength - left.strength ||
    left.nodeIds.join("|").localeCompare(right.nodeIds.join("|"));
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
