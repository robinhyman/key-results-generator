import test from "node:test";
import assert from "node:assert/strict";

import {
  applyClarifications,
  generateCausalMetricsGraph,
  generateKeyResultsModel,
  indicatorTypeForVariable,
  rankVariables,
} from "../src/generator.js";
import { assertValidIndicatorMix } from "./helpers/generator-fixtures.js";

test("generateKeyResultsModel creates an inspectable graph and key results", () => {
  const model = generateKeyResultsModel("Improve dependable rail service");

  assert.equal(model.objective, "Improve dependable rail service");
  assert.ok(model.summary.includes("Improve dependable rail service"));
  assert.equal(model.graph.objective, "Improve dependable rail service");
  assert.ok(model.graph.nodes.length >= 9);
  assert.ok(model.graph.edges.length >= 8);
  assert.ok(model.keyResults.length >= 3);
  assert.ok(model.keyResults.length <= 5);

  const outcome = model.graph.nodes.find((variable) => variable.type === "outcome");
  assert.equal(outcome.label, "Improve dependable rail service");

  for (const keyResult of model.keyResults) {
    assert.match(keyResult.text, /^Increase|^Reduce|^Improve/);
    assert.ok(keyResult.variableId);
    assert.match(keyResult.indicatorType, /^(leading|lagging)$/);
    assert.ok(keyResult.rationale.length > 20);
    assert.ok(keyResult.relatedDrivers.length >= 1);
  }
  assertValidIndicatorMix(model.keyResults);
});

test("generateCausalMetricsGraph returns a serializable clarification-ready graph", () => {
  const graph = generateCausalMetricsGraph("Improve dependable rail service");

  assert.equal(graph.objective, "Improve dependable rail service");
  assert.ok(graph.nodes.length >= 9);
  assert.ok(graph.edges.length >= 8);
  assert.deepEqual(graph.assessments, {});
  assert.ok(graph.rankings.every((ranking) => ranking.nodeId));

  const roundTripped = JSON.parse(JSON.stringify(graph));
  assert.deepEqual(roundTripped, graph);
});

test("applyClarifications keeps graph structure and records user assessments", () => {
  const graph = generateCausalMetricsGraph("Improve dependable rail service");
  const clarified = applyClarifications(graph, {
    "cycle-time": { influenceability: 5, gap: 5 },
    "primary-result": { influenceability: 1, gap: 1 },
  });

  assert.notEqual(clarified, graph);
  assert.deepEqual(
    clarified.nodes.map((node) => node.id),
    graph.nodes.map((node) => node.id),
  );
  assert.equal(clarified.assessments["cycle-time"].influenceability, 5);
  assert.equal(clarified.assessments["cycle-time"].gap, 5);
  assert.equal(clarified.nodes.find((node) => node.id === "cycle-time").userGap, 5);
  assert.equal(
    clarified.nodes.find((node) => node.id === "primary-result").userInfluenceability,
    1,
  );
});

test("generated key results prefer clarified influenceability and perceived gaps", () => {
  const model = generateKeyResultsModel("Expand enterprise customer retention", {
    "cycle-time": { influenceability: 5, gap: 5 },
    "feedback-signal": { influenceability: 5, gap: 5 },
    "primary-result": { influenceability: 1, gap: 1 },
  });

  const keyResultVariableIds = model.keyResults.map((keyResult) => keyResult.variableId);

  assert.equal(keyResultVariableIds[0], "cycle-time");
  assert.equal(model.candidateKeyResultSets[0].assessments["cycle-time"].gap, 5);
  assert.ok(model.keyResults[0].rationale.includes("your clarification"));
  assert.equal(model.graph.assessments["cycle-time"].gap, 5);
});

test("generated key results use the top algorithmic candidate set", () => {
  const model = generateKeyResultsModel("Expand enterprise customer retention");

  assert.deepEqual(
    model.keyResults.map((keyResult) => keyResult.variableId),
    model.candidateKeyResultSets[0].variableIds,
  );
  assertValidIndicatorMix(model.keyResults);
  assert.ok(model.candidateKeyResultSets[0].metrics.branchCount >= 2);
});

test("generateKeyResultsModel exposes ranked algorithmic candidate sets", () => {
  const model = generateKeyResultsModel("Expand enterprise customer retention");

  assert.ok(model.candidateKeyResultSets.length > 0);
  assert.deepEqual(
    model.keyResults.map((keyResult) => keyResult.variableId),
    model.candidateKeyResultSets[0].variableIds,
  );
  assertValidIndicatorMix(model.candidateKeyResultSets[0].variables);
  assert.ok(model.candidateKeyResultSets[0].rationale.includes("branches"));
});

test("generated key results come from high-impact, influenceable graph variables", () => {
  const model = generateKeyResultsModel("Expand enterprise customer retention");
  const variableById = new Map(
    model.graph.nodes.map((variable) => [variable.id, variable]),
  );

  const selectedVariables = model.keyResults.map((keyResult) =>
    variableById.get(keyResult.variableId),
  );

  assert.ok(selectedVariables.every((variable) => variable.influenceable));
  assert.ok(selectedVariables.every((variable) => variable.impact >= 70));
  assertValidIndicatorMix(model.keyResults);
  assert.deepEqual(
    selectedVariables.map((variable) => variable.id),
    [...new Set(selectedVariables.map((variable) => variable.id))],
  );
});

test("indicatorTypeForVariable classifies evidence and experience as lagging", () => {
  assert.equal(indicatorTypeForVariable({ type: "evidence" }), "lagging");
  assert.equal(indicatorTypeForVariable({ type: "experience" }), "lagging");
  assert.equal(indicatorTypeForVariable({ type: "driver" }), "leading");
  assert.equal(indicatorTypeForVariable({ type: "failure-mode" }), "leading");
  assert.equal(indicatorTypeForVariable({ type: "upstream-driver" }), "leading");
});

test("rankVariables sorts by KR suitability and excludes the top outcome", () => {
  const variables = [
    {
      id: "outcome",
      label: "Outcome",
      type: "outcome",
      impact: 100,
      confidence: 90,
      influenceable: false,
    },
    {
      id: "driver",
      label: "Direct driver",
      type: "driver",
      impact: 85,
      confidence: 75,
      influenceable: true,
    },
    {
      id: "evidence",
      label: "Evidence metric",
      type: "evidence",
      impact: 70,
      confidence: 95,
      influenceable: true,
    },
    {
      id: "weak",
      label: "Weak signal",
      type: "failure-mode",
      impact: 40,
      confidence: 70,
      influenceable: true,
    },
  ];

  const ranked = rankVariables(variables);

  assert.deepEqual(
    ranked.map((variable) => variable.id),
    ["driver", "evidence", "weak"],
  );
  assert.ok(ranked[0].score > ranked[1].score);
});
