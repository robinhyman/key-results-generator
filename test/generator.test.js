import test from "node:test";
import assert from "node:assert/strict";

import {
  applyClarifications,
  generateCausalMetricsGraph,
  generateKeyResultsModel,
  rankVariables,
} from "../src/generator.js";
import {
  generateAiCausalMetricsGraph,
  generateAiKeyResultsModel,
  normalizeAiGraph,
  normalizeAiKeyResults,
} from "../src/ai-service.js";

test("generateKeyResultsModel creates an inspectable graph and key results", () => {
  const model = generateKeyResultsModel("Improve dependable rail service");

  assert.equal(model.objective, "Improve dependable rail service");
  assert.ok(model.summary.includes("Improve dependable rail service"));
  assert.equal(model.graph.objective, "Improve dependable rail service");
  assert.equal(model.graph.nodes.length, model.variables.length);
  assert.equal(model.graph.edges.length, model.relationships.length);
  assert.ok(model.variables.length >= 9);
  assert.ok(model.relationships.length >= 8);
  assert.ok(model.keyResults.length >= 3);
  assert.ok(model.keyResults.length <= 5);

  const outcome = model.variables.find((variable) => variable.type === "outcome");
  assert.equal(outcome.label, "Improve dependable rail service");

  for (const keyResult of model.keyResults) {
    assert.match(keyResult.text, /^Increase|^Reduce|^Improve/);
    assert.ok(keyResult.variableId);
    assert.ok(keyResult.rationale.length > 20);
    assert.ok(keyResult.relatedDrivers.length >= 1);
  }
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
  assert.ok(keyResultVariableIds.includes("feedback-signal"));
  assert.ok(model.keyResults[0].rationale.includes("your clarification"));
  assert.equal(model.graph.assessments["cycle-time"].gap, 5);
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

test("generateAiCausalMetricsGraph normalizes mocked AI graph output", async () => {
  const graph = await generateAiCausalMetricsGraph("Improve onboarding activation", {
    apiKey: "test-key",
    fetch: async () => jsonResponse({
      summary: "Activation depends on speed, clarity, and early value.",
      nodes: [
        aiNode("activation", "outcome", "Improve onboarding activation", 4, false),
        aiNode("time-to-value", "driver", "Time to first value", 2, true, "reduce"),
        aiNode("setup-completion", "evidence", "Setup completion rate", 3, true),
        aiNode("guided-help", "upstream-driver", "Guided help quality", 1, true),
      ],
      edges: [
        aiEdge("guided-help", "time-to-value"),
        aiEdge("time-to-value", "setup-completion"),
        aiEdge("setup-completion", "activation"),
      ],
    }),
  });

  assert.equal(graph.objective, "Improve onboarding activation");
  assert.equal(graph.generation.mode, "ai");
  assert.equal(graph.nodes.length, 4);
  assert.equal(graph.edges.length, 3);
  assert.ok(graph.rankings.some((variable) => variable.id === "time-to-value"));
});

test("generateAiCausalMetricsGraph sends approved shared and graph instructions", async () => {
  let requestBody;
  await generateAiCausalMetricsGraph("Improve onboarding activation", {
    apiKey: "test-key",
    fetch: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return jsonResponse({
        summary: "Activation depends on speed, clarity, and early value.",
        nodes: [
          aiNode("activation", "outcome", "Improve onboarding activation", 4, false),
          aiNode("time-to-value", "driver", "Time to first value", 2, true, "reduce"),
          aiNode("setup-completion", "evidence", "Setup completion rate", 3, true),
          aiNode("guided-help", "upstream-driver", "Guided help quality", 1, true),
        ],
        edges: [
          aiEdge("guided-help", "time-to-value"),
          aiEdge("time-to-value", "setup-completion"),
          aiEdge("setup-completion", "activation"),
        ],
      });
    },
  });

  assert.match(requestBody.input[0].content, /OKR planning analyst/);
  assert.match(requestBody.input[0].content, /graph-backed OKR planning data/);
  assert.match(requestBody.input[0].content, /do not invent external facts/);
  assert.match(requestBody.input[1].content, /causal metrics graph/);
  assert.match(requestBody.input[1].content, /downstream outcome/);
  assert.match(requestBody.input[1].content, /failure modes/);
  assert.match(requestBody.input[1].content, /vanity metrics/);
});

test("generateAiCausalMetricsGraph falls back when no API key is configured", async () => {
  const graph = await generateAiCausalMetricsGraph("Improve onboarding activation", {
    keyPath: "/tmp/missing-openai-key-for-test",
  });

  assert.equal(graph.generation.mode, "fallback");
  assert.equal(graph.generation.model, "deterministic-local");
  assert.ok(graph.nodes.length >= 9);
});

test("normalizeAiGraph rejects malformed graph output", () => {
  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", { nodes: [], edges: [] }),
    /at least four nodes/,
  );
});

test("generateAiKeyResultsModel preserves clarification traceability from mocked AI output", async () => {
  const graph = normalizeAiGraph("Improve onboarding activation", {
    summary: "Activation depends on speed, clarity, and early value.",
    nodes: [
      aiNode("activation", "outcome", "Improve onboarding activation", 4, false),
      aiNode("time-to-value", "driver", "Time to first value", 2, true, "reduce"),
      aiNode("setup-completion", "evidence", "Setup completion rate", 3, true),
      aiNode("guided-help", "upstream-driver", "Guided help quality", 1, true),
    ],
    edges: [
      aiEdge("guided-help", "time-to-value"),
      aiEdge("time-to-value", "setup-completion"),
      aiEdge("setup-completion", "activation"),
    ],
  });

  const model = await generateAiKeyResultsModel(graph, {
    "time-to-value": { influenceability: 5, gap: 5 },
  }, {
    apiKey: "test-key",
    fetch: async () => jsonResponse({
      keyResults: [
        aiKeyResult("kr-1", "time-to-value", "Reduce time to first value by 25% this quarter"),
        aiKeyResult("kr-2", "setup-completion", "Increase setup completion rate by 15% this quarter"),
        aiKeyResult("kr-3", "guided-help", "Improve guided help quality to green status"),
        aiKeyResult("kr-4", "time-to-value", "Reduce avoidable onboarding waits by 20%"),
      ],
    }),
  });

  assert.equal(model.generation.mode, "ai");
  assert.equal(model.keyResults.length, 4);
  assert.equal(model.keyResults[0].variableId, "time-to-value");
  assert.equal(model.keyResults[0].assessment.influenceability, 5);
  assert.equal(model.graph.assessments["time-to-value"].gap, 5);
});

test("generateAiKeyResultsModel falls back when AI key results reference unknown variables", async () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    fetch: async () => jsonResponse({
      keyResults: [
        aiKeyResult("kr-1", "unknown-variable", "Improve a metric the graph does not know"),
        aiKeyResult("kr-2", "cycle-time", "Reduce cycle time by 20%"),
        aiKeyResult("kr-3", "failure-rate", "Reduce failure rate by 20%"),
      ],
    }),
  });

  assert.equal(model.generation.mode, "fallback");
  assert.equal(model.keyResults.length, 4);
  assert.ok(model.keyResults.every((keyResult) => graph.nodes.some((node) => node.id === keyResult.variableId)));
});

test("generateAiKeyResultsModel sends approved KR count and indicator mix instructions", async () => {
  let requestBody;
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  await generateAiKeyResultsModel(graph, {
    "time-to-value": { influenceability: 5, gap: 5 },
  }, {
    apiKey: "test-key",
    fetch: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return jsonResponse({
        keyResults: [
          aiKeyResult("kr-1", "cycle-time", "Reduce cycle time by 20% this quarter"),
          aiKeyResult("kr-2", "failure-rate", "Reduce failure rate by 20% this quarter"),
          aiKeyResult("kr-3", "primary-result", "Increase success rate by 15% this quarter"),
        ],
      });
    },
  });

  assert.equal(requestBody.text.format.schema.properties.keyResults.minItems, 3);
  assert.equal(requestBody.text.format.schema.properties.keyResults.maxItems, 5);
  assert.match(requestBody.input[1].content, /Generate 3 to 5 final key results/);
  assert.match(requestBody.input[1].content, /1 or 2 lagging KRs/);
  assert.match(requestBody.input[1].content, /2 or 3 leading KRs/);
  assert.match(requestBody.input[1].content, /existing non-outcome graph variables/);
  assert.match(requestBody.input[1].content, /influenceability and perceived-gap ratings/);
});

test("normalizeAiKeyResults accepts three to five key results", () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  assert.equal(normalizeAiKeyResults(graph, {
    keyResults: [
      aiKeyResult("kr-1", "cycle-time", "Reduce cycle time by 20%"),
      aiKeyResult("kr-2", "failure-rate", "Reduce failure rate by 20%"),
      aiKeyResult("kr-3", "primary-result", "Increase success rate by 15%"),
    ],
  }).length, 3);

  assert.equal(normalizeAiKeyResults(graph, {
    keyResults: [
      aiKeyResult("kr-1", "cycle-time", "Reduce cycle time by 20%"),
      aiKeyResult("kr-2", "failure-rate", "Reduce failure rate by 20%"),
      aiKeyResult("kr-3", "primary-result", "Increase success rate by 15%"),
      aiKeyResult("kr-4", "experience-quality", "Increase experience quality by 15%"),
      aiKeyResult("kr-5", "throughput", "Increase throughput by 15%"),
    ],
  }).length, 5);
});

test("normalizeAiKeyResults rejects fewer than three key results", () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  assert.throws(
    () => normalizeAiKeyResults(graph, {
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "Reduce cycle time by 20%"),
        aiKeyResult("kr-2", "failure-rate", "Reduce failure rate by 20%"),
      ],
    }),
    /at least three key results/,
  );
});

test("normalizeAiKeyResults rejects unknown graph references", () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  assert.throws(
    () => normalizeAiKeyResults(graph, {
      keyResults: [
        aiKeyResult("kr-1", "missing-node", "Improve missing node"),
        aiKeyResult("kr-2", "cycle-time", "Reduce cycle time by 20%"),
        aiKeyResult("kr-3", "failure-rate", "Reduce failure rate by 20%"),
      ],
    }),
    /unknown variable/,
  );
});

function aiNode(id, type, label, stage, influenceable, direction = "increase") {
  return {
    id,
    type,
    label,
    description: `${label} description`,
    impact: 80,
    confidence: 75,
    influenceable,
    stage,
    direction,
  };
}

function aiEdge(source, target) {
  return {
    id: `${source}-to-${target}`,
    source,
    target,
    rationale: `${source} affects ${target}`,
    strength: 78,
  };
}

function aiKeyResult(id, variableId, text) {
  return {
    id,
    variableId,
    text,
    rationale: `Selected because ${variableId} was highly ranked and matched the user clarification.`,
    relatedDrivers: ["Guided help quality"],
  };
}

function jsonResponse(data) {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        output: [
          {
            content: [
              {
                text: JSON.stringify(data),
              },
            ],
          },
        ],
      };
    },
  };
}
