import test from "node:test";
import assert from "node:assert/strict";

import { applyClarifications, exploreKeyResultSets } from "../src/generator.js";
import { assertValidIndicatorMix, graphForSetExploration } from "./helpers/generator-fixtures.js";

test("exploreKeyResultSets ranks valid non-outcome KR sets with branch coverage metadata", () => {
  const graph = graphForSetExploration();
  const candidateSets = exploreKeyResultSets(graph, { setSizes: [4], limit: 5 });

  assert.ok(candidateSets.length > 0);
  assert.deepEqual(candidateSets[0].variableIds, ["primary-result", "quality-driver", "speed-result", "capacity-driver"]);
  assert.equal(candidateSets[0].variables.some((variable) => variable.type === "outcome"), false);
  assertValidIndicatorMix(candidateSets[0].variables);
  assert.equal(candidateSets[0].metrics.branchCount, 3);
  assert.ok(candidateSets[0].metrics.redundancyPenalty > 0);
  assert.ok(candidateSets[0].score >= candidateSets[1].score);
  assert.deepEqual(
    candidateSets.map((candidateSet) => candidateSet.variableIds.join("|")),
    [...new Set(candidateSets.map((candidateSet) => candidateSet.variableIds.join("|")))],
  );
});

test("exploreKeyResultSets uses clarification scores to re-rank candidate sets", () => {
  const graph = applyClarifications(graphForSetExploration(), {
    "support-driver": { influenceability: 5, gap: 5 },
  });
  const candidateSets = exploreKeyResultSets(graph, { setSizes: [4], limit: 5 });

  assert.ok(candidateSets[0].variableIds.includes("support-driver"));
  assert.equal(candidateSets[0].assessments["support-driver"].gap, 5);
});

test("exploreKeyResultSets only returns valid 3, 4, and 5 item indicator mixes", () => {
  const graph = graphForSetExploration();
  const candidateSets = exploreKeyResultSets(graph, { setSizes: [3, 4, 5], limit: 20 });

  assert.ok(candidateSets.some((candidateSet) => candidateSet.variables.length === 3));
  assert.ok(candidateSets.some((candidateSet) => candidateSet.variables.length === 4));
  assert.ok(candidateSets.some((candidateSet) => candidateSet.variables.length === 5));
  assert.ok(candidateSets.every((candidateSet) => {
    const lagging = candidateSet.variables.filter((variable) => variable.indicatorType === "lagging").length;
    const leading = candidateSet.variables.filter((variable) => variable.indicatorType === "leading").length;
    return lagging >= 1 && lagging <= 2 && leading >= 2 && leading <= 3;
  }));
});

test("exploreKeyResultSets path scoring is stable when graph edges are reordered", () => {
  const graph = graphForPathTieBreaks();
  const reversed = {
    ...graph,
    edges: [...graph.edges].reverse(),
  };

  assert.deepEqual(
    exploreKeyResultSets(graph, { setSizes: [3], limit: 5 }).map((candidateSet) => ({
      variableIds: candidateSet.variableIds,
      score: candidateSet.score,
      metrics: candidateSet.metrics,
    })),
    exploreKeyResultSets(reversed, { setSizes: [3], limit: 5 }).map((candidateSet) => ({
      variableIds: candidateSet.variableIds,
      score: candidateSet.score,
      metrics: candidateSet.metrics,
    })),
  );
});

test("exploreKeyResultSets prefers the stronger equal-length bottleneck path and terminates cycles", () => {
  const graph = graphForPathTieBreaks();
  const candidateSet = exploreKeyResultSets(graph, { setSizes: [3], limit: 1 })[0];

  assert.ok(candidateSet.variableIds.includes("ambiguous-driver"));
  assert.equal(candidateSet.metrics.branchCount, 2);
  assert.equal(candidateSet.metrics.nodeQuality, 106);
});

function graphForPathTieBreaks() {
  const nodes = [
    node("outcome", "outcome", 100, 90, 4, false),
    node("strong-result", "evidence", 88, 84, 3),
    node("weak-result", "experience", 88, 84, 3),
    node("ambiguous-driver", "driver", 88, 84, 2),
    node("support-driver", "upstream-driver", 84, 80, 1),
  ];

  return {
    objective: "Improve path stability",
    summary: "Fixture graph for path tie-breaks.",
    nodes,
    edges: [
      edge("ambiguous-driver", "weak-result", 20),
      edge("ambiguous-driver", "strong-result", 95),
      edge("strong-result", "outcome", 90),
      edge("weak-result", "outcome", 20),
      edge("support-driver", "ambiguous-driver", 80),
      edge("strong-result", "ambiguous-driver", 50),
    ],
    rankings: nodes
      .filter((candidate) => candidate.type !== "outcome")
      .map((candidate) => ({ ...candidate, nodeId: candidate.id, score: candidate.impact })),
    assessments: {},
  };
}

function node(id, type, impact, confidence, stage, influenceable = true) {
  return {
    id,
    type,
    label: id,
    description: `${id} description.`,
    impact,
    confidence,
    influenceable,
    stage,
    direction: "increase",
  };
}

function edge(source, target, strength) {
  return {
    id: `${source}-to-${target}`,
    source,
    target,
    rationale: `${source} affects ${target}.`,
    strength,
  };
}
