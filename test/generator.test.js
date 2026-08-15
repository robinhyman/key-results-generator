import test from "node:test";
import assert from "node:assert/strict";

import { generateKeyResultsModel, rankVariables } from "../src/generator.js";

test("generateKeyResultsModel creates an inspectable graph and key results", () => {
  const model = generateKeyResultsModel("Improve dependable rail service");

  assert.equal(model.objective, "Improve dependable rail service");
  assert.ok(model.summary.includes("Improve dependable rail service"));
  assert.ok(model.variables.length >= 9);
  assert.ok(model.relationships.length >= 8);
  assert.equal(model.keyResults.length, 4);

  const outcome = model.variables.find((variable) => variable.type === "outcome");
  assert.equal(outcome.label, "Improve dependable rail service");

  for (const keyResult of model.keyResults) {
    assert.match(keyResult.text, /^Increase|^Reduce|^Improve/);
    assert.ok(keyResult.variableId);
    assert.ok(keyResult.rationale.length > 20);
    assert.ok(keyResult.relatedDrivers.length >= 1);
  }
});

test("generated key results come from high-impact, influenceable graph variables", () => {
  const model = generateKeyResultsModel("Expand enterprise customer retention");
  const variableById = new Map(
    model.variables.map((variable) => [variable.id, variable]),
  );

  const selectedVariables = model.keyResults.map((keyResult) =>
    variableById.get(keyResult.variableId),
  );

  assert.ok(selectedVariables.every((variable) => variable.influenceable));
  assert.ok(selectedVariables.every((variable) => variable.impact >= 70));
  assert.deepEqual(
    selectedVariables.map((variable) => variable.id),
    [...new Set(selectedVariables.map((variable) => variable.id))],
  );
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
