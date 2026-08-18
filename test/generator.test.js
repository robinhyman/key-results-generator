import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

import {
  applyClarifications,
  exploreKeyResultSets,
  generateCausalMetricsGraph,
  generateKeyResultsModel,
  indicatorTypeForVariable,
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
    model.variables.map((variable) => [variable.id, variable]),
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

test("generateAiCausalMetricsGraph normalizes mocked AI graph output", async () => {
  const graph = await generateAiCausalMetricsGraph("Improve onboarding activation", {
    apiKey: "test-key",
    fetch: async () => jsonResponse(richAiGraphResponse()),
  });

  assert.equal(graph.objective, "Improve onboarding activation");
  assert.equal(graph.generation.mode, "ai");
  assert.equal(graph.nodes.length, 4);
  assert.equal(graph.edges.length, 3);
  assert.equal(graph.fullGraph.nodes.length, 6);
  assert.equal(graph.planningGraph.nodes.length, 4);
  assert.ok(graph.rankings.some((variable) => variable.id === "time-to-value"));
});

test("generateAiCausalMetricsGraph sends approved rich-map and convergence instructions", async () => {
  let requestBody;
  await generateAiCausalMetricsGraph("Improve onboarding activation", {
    apiKey: "test-key",
    fetch: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return jsonResponse(richAiGraphResponse());
    },
  });

  const schema = requestBody.text.format.schema;

  assert.deepEqual(schema.required, ["summary", "fullGraph", "planningGraph"]);
  assert.equal(schema.properties.fullGraph.properties.nodes.minItems, 20);
  assert.equal(schema.properties.fullGraph.properties.nodes.maxItems, 70);
  assert.equal(schema.properties.planningGraph.properties.nodes.minItems, 4);
  assert.equal(schema.properties.planningGraph.properties.nodes.maxItems, 20);
  assert.equal(schema.properties.planningGraph.properties.edges.maxItems, 32);
  assert.ok(schema.properties.planningGraph.properties.nodes.items.properties.convergenceRationale);
  assert.match(requestBody.input[0].content, /OKR planning analyst/);
  assert.match(requestBody.input[0].content, /graph-backed OKR planning data/);
  assert.match(requestBody.input[0].content, /do not invent external facts/);
  assert.match(requestBody.input[1].content, /rich causal map/);
  assert.match(requestBody.input[1].content, /fullGraph/);
  assert.match(requestBody.input[1].content, /planningGraph/);
  assert.match(requestBody.input[1].content, /40 to 60 nodes/);
  assert.match(requestBody.input[1].content, /12 to 18 nodes/);
  assert.doesNotMatch(requestBody.input[1].content, /8 to 10 nodes/);
  assert.match(requestBody.input[1].content, /downstream outcome/);
  assert.match(requestBody.input[1].content, /failure modes/);
  assert.match(requestBody.input[1].content, /domain-specific variables/);
  assert.match(requestBody.input[1].content, /concrete measurable factors/);
  assert.match(requestBody.input[1].content, /vanity metrics/);
  assert.match(requestBody.input[1].content, /duplicate, vague, non-measurable, activity-shaped, and disconnected nodes/);
  assert.match(requestBody.input[1].content, /Preserve causal branch coverage/);
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

test("normalizeAiGraph keeps the rich full graph while using planning graph for rankings", () => {
  const graph = normalizeAiGraph("Improve onboarding activation", richAiGraphResponse());

  assert.deepEqual(
    graph.nodes.map((node) => node.id),
    ["activation", "time-to-value", "setup-completion", "guided-help"],
  );
  assert.equal(graph.fullGraph.nodes.length, 6);
  assert.equal(graph.fullGraph.edges.length, 5);
  assert.equal(graph.planningGraph.nodes.length, 4);
  assert.equal(graph.rankings.some((variable) => variable.id === "qualitative-comment"), false);
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
  assert.equal(model.keyResults[0].indicatorType, "leading");
  assert.equal(model.keyResults[0].assessment.influenceability, 5);
  assert.equal(model.graph.assessments["time-to-value"].gap, 5);
  assertValidIndicatorMix(model.keyResults);
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
  assertValidIndicatorMix(model.keyResults);
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
  assert.ok(requestBody.text.format.schema.properties.keyResults.items.required.includes("indicatorType"));
  assert.deepEqual(
    requestBody.text.format.schema.properties.keyResults.items.properties.indicatorType.enum,
    ["leading", "lagging"],
  );
  assert.match(requestBody.input[1].content, /Generate 3 to 5 final key results/);
  assert.match(requestBody.input[1].content, /Set indicatorType to either leading or lagging/);
  assert.match(requestBody.input[1].content, /1 or 2 lagging KRs/);
  assert.match(requestBody.input[1].content, /2 or 3 leading KRs/);
  assert.match(requestBody.input[1].content, /existing non-outcome graph variables/);
  assert.match(requestBody.input[1].content, /influenceability and perceived-gap ratings/);
  assert.match(requestBody.input[1].content, /measurable, time-bounded, and outcome-oriented/);
  assert.match(requestBody.input[1].content, /rather than an activity checklist/);
});

test("generateAiKeyResultsModel serializes clarification assessments into the provider request", async () => {
  let requestBody;
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  await generateAiKeyResultsModel(graph, {
    "cycle-time": { influenceability: 5, gap: 4 },
    "failure-rate": { influenceability: 3, gap: 2 },
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

  const serializedGraph = JSON.parse(requestBody.input[1].content.slice(requestBody.input[1].content.indexOf("{")));
  assert.deepEqual(serializedGraph.assessments["cycle-time"], { influenceability: 5, gap: 4 });
  assert.deepEqual(serializedGraph.assessments["failure-rate"], { influenceability: 3, gap: 2 });
});

test("generateAiKeyResultsModel records provider HTTP fallback diagnostics", async () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    fetch: async () => ({
      ok: false,
      status: 503,
      async json() {
        return {};
      },
    }),
  });

  assert.equal(model.generation.mode, "fallback");
  assert.equal(model.generation.reasonCode, "provider_http_error");
  assert.equal(model.keyResults.length, 4);
  assertValidIndicatorMix(model.keyResults);
});

test("generateAiKeyResultsModel records invalid JSON fallback diagnostics", async () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    fetch: async () => textResponse("not json"),
  });

  assert.equal(model.generation.mode, "fallback");
  assert.equal(model.generation.reasonCode, "invalid_provider_output");
  assert.equal(model.keyResults.length, 4);
  assertValidIndicatorMix(model.keyResults);
});

test("generateAiKeyResultsModel records missing output fallback diagnostics", async () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    fetch: async () => jsonEnvelope({ output: [] }),
  });

  assert.equal(model.generation.mode, "fallback");
  assert.equal(model.generation.reasonCode, "invalid_provider_output");
  assert.equal(model.keyResults.length, 4);
  assertValidIndicatorMix(model.keyResults);
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

test("normalizeAiKeyResults caps provider output at five key results", () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  assert.deepEqual(
    normalizeAiKeyResults(graph, {
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "Reduce cycle time by 20%"),
        aiKeyResult("kr-2", "failure-rate", "Reduce failure rate by 20%"),
        aiKeyResult("kr-3", "primary-result", "Increase success rate by 15%"),
        aiKeyResult("kr-4", "experience-quality", "Increase experience quality by 15%"),
        aiKeyResult("kr-5", "throughput", "Increase throughput by 15%"),
        aiKeyResult("kr-6", "capacity", "Increase capacity by 15%"),
      ],
    }).map((keyResult) => keyResult.id),
    ["kr-1", "kr-2", "kr-3", "kr-4", "kr-5"],
  );
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

test("normalizeAiKeyResults rejects outcome graph references", () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  assert.throws(
    () => normalizeAiKeyResults(graph, {
      keyResults: [
        aiKeyResult("kr-1", "outcome", "Improve the objective directly"),
        aiKeyResult("kr-2", "cycle-time", "Reduce cycle time by 20%"),
        aiKeyResult("kr-3", "failure-rate", "Reduce failure rate by 20%"),
      ],
    }),
    /unknown variable/,
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

test("normalizeAiKeyResults rejects invalid indicator types and mixes", () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  assert.throws(
    () => normalizeAiKeyResults(graph, {
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "near-term", "Reduce cycle time by 20%"),
        aiKeyResult("kr-2", "failure-rate", "leading", "Reduce failure rate by 20%"),
        aiKeyResult("kr-3", "primary-result", "lagging", "Increase success rate by 15%"),
      ],
    }),
    /invalid indicatorType/,
  );

  assert.throws(
    () => normalizeAiKeyResults(graph, {
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "leading", "Reduce cycle time by 20%"),
        aiKeyResult("kr-2", "failure-rate", "leading", "Reduce failure rate by 20%"),
        aiKeyResult("kr-3", "throughput", "leading", "Increase throughput by 15%"),
      ],
    }),
    /indicator mix is invalid/,
  );
});

test("generateAiKeyResultsModel falls back when AI indicator mix is invalid", async () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    fetch: async () => jsonResponse({
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "leading", "Reduce cycle time by 20%"),
        aiKeyResult("kr-2", "failure-rate", "leading", "Reduce failure rate by 20%"),
        aiKeyResult("kr-3", "throughput", "leading", "Increase throughput by 15%"),
      ],
    }),
  });

  assert.equal(model.generation.mode, "fallback");
  assert.equal(model.keyResults.length, 4);
  assertValidIndicatorMix(model.keyResults);
});

test("AI trace logging is disabled by default", async () => {
  const traceLogPath = await tempTracePath();
  await generateAiCausalMetricsGraph("Improve onboarding activation", {
    apiKey: "test-key",
    traceLogPath,
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

  await assert.rejects(() => stat(traceLogPath), /ENOENT/);
  await rm(dirname(traceLogPath), { recursive: true, force: true });
});

test("AI trace logging writes request and response JSONL without credentials", async () => {
  const traceLogPath = await tempTracePath();

  await generateAiKeyResultsModel(generateCausalMetricsGraph("Improve onboarding activation"), {}, {
    apiKey: "super-secret-test-key",
    traceEnabled: true,
    traceLogPath,
    fetch: async (_url, options) => {
      assert.match(options.headers.Authorization, /super-secret-test-key/);
      return jsonResponse({
        keyResults: [
          aiKeyResult("kr-1", "cycle-time", "leading", "Reduce cycle time by 20%"),
          aiKeyResult("kr-2", "failure-rate", "leading", "Reduce failure rate by 20%"),
          aiKeyResult("kr-3", "primary-result", "lagging", "Increase success rate by 15%"),
        ],
      });
    },
  });

  const lines = await readTraceLines(traceLogPath);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].operation, "key-results");
  assert.equal(lines[0].schemaName, "key_results");
  assert.equal(lines[0].provider.ok, true);
  assert.equal(lines[0].requestBody.input[0].role, "system");
  assert.equal(lines[0].parsedOutput.keyResults[0].indicatorType, "leading");
  assert.doesNotMatch(JSON.stringify(lines), /super-secret-test-key|Authorization/);
  await rm(dirname(traceLogPath), { recursive: true, force: true });
});

test("AI trace logging records provider error diagnostics", async () => {
  const traceLogPath = await tempTracePath();
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    traceEnabled: true,
    traceLogPath,
    fetch: async () => ({
      ok: false,
      status: 503,
      async json() {
        return { error: { message: "unavailable" } };
      },
    }),
  });

  const lines = await readTraceLines(traceLogPath);
  assert.equal(model.generation.mode, "fallback");
  assert.equal(lines.length, 1);
  assert.equal(lines[0].provider.ok, false);
  assert.equal(lines[0].provider.status, 503);
  assert.equal(lines[0].provider.reasonCode, "provider_http_error");
  assert.deepEqual(lines[0].responseBody, { error: { message: "unavailable" } });
  await rm(dirname(traceLogPath), { recursive: true, force: true });
});

test("AI trace logging records parsed output validation failures", async () => {
  const traceLogPath = await tempTracePath();
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    traceEnabled: true,
    traceLogPath,
    fetch: async () => jsonResponse({
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "leading", "Reduce cycle time by 20%"),
        aiKeyResult("kr-2", "failure-rate", "leading", "Reduce failure rate by 20%"),
        aiKeyResult("kr-3", "throughput", "leading", "Increase throughput by 15%"),
      ],
    }),
  });

  const lines = await readTraceLines(traceLogPath);
  assert.equal(model.generation.mode, "fallback");
  assert.equal(model.generation.reasonCode, "invalid_provider_output");
  assert.equal(lines.length, 1);
  assert.equal(lines[0].provider.ok, false);
  assert.equal(lines[0].provider.reasonCode, "invalid_provider_output");
  assert.match(lines[0].provider.error, /indicator mix is invalid/);
  assert.equal(lines[0].parsedOutput.keyResults.length, 3);
  await rm(dirname(traceLogPath), { recursive: true, force: true });
});

test("AI trace logging redacts credentials from endpoints and provider diagnostics", async () => {
  const traceLogPath = await tempTracePath();
  const secret = "super-secret-test-key";
  const endpointSecret = "endpoint-token";

  await generateAiCausalMetricsGraph("Improve onboarding activation", {
    apiKey: secret,
    endpoint: `https://example.test/responses?token=${endpointSecret}`,
    traceEnabled: true,
    traceLogPath,
    fetch: async () => {
      throw new Error(`failed with Bearer ${secret} and token ${endpointSecret}`);
    },
  });

  const lines = await readTraceLines(traceLogPath);
  const traceText = JSON.stringify(lines);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].endpointHost, "example.test");
  assert.equal(lines[0].endpoint, undefined);
  assert.doesNotMatch(traceText, new RegExp(`${secret}|${endpointSecret}`));
  assert.match(lines[0].provider.error, /Bearer \[redacted\]/);
  await rm(dirname(traceLogPath), { recursive: true, force: true });
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

function graphForSetExploration() {
  const nodes = [
    {
      id: "outcome",
      type: "outcome",
      label: "Improve activation",
      description: "The outcome.",
      impact: 100,
      confidence: 90,
      influenceable: false,
      stage: 4,
      direction: "improve",
    },
    testNode("primary-result", "evidence", "Activation rate", 94, 86, 3),
    testNode("quality-result", "experience", "Setup quality", 88, 80, 3),
    testNode("speed-result", "experience", "Setup speed", 87, 80, 3, "reduce"),
    testNode("quality-driver", "driver", "Guidance quality", 86, 78, 2),
    testNode("speed-driver", "driver", "Time to first action", 85, 78, 2, "reduce"),
    testNode("capacity-driver", "upstream-driver", "Instrumentation coverage", 84, 76, 1),
    testNode("support-driver", "upstream-driver", "Support response time", 68, 62, 1, "reduce"),
    testNode("duplicate-speed", "driver", "Time to first action duplicate", 84, 77, 2, "reduce"),
  ];
  const edges = [
    testEdge("primary-result", "outcome", 95),
    testEdge("quality-result", "primary-result", 88),
    testEdge("speed-result", "primary-result", 87),
    testEdge("quality-driver", "quality-result", 86),
    testEdge("speed-driver", "speed-result", 86),
    testEdge("capacity-driver", "primary-result", 84),
    testEdge("support-driver", "quality-result", 70),
    testEdge("duplicate-speed", "speed-result", 84),
  ];

  return {
    objective: "Improve activation",
    summary: "Fixture graph for KR set exploration.",
    nodes,
    edges,
    rankings: rankVariables(nodes),
    assessments: {},
  };
}

function testNode(id, type, label, impact, confidence, stage, direction = "increase") {
  return {
    id,
    type,
    label,
    description: `${label} description.`,
    impact,
    confidence,
    influenceable: true,
    stage,
    direction,
  };
}

function testEdge(source, target, strength) {
  return {
    id: `${source}-to-${target}`,
    source,
    target,
    rationale: `${source} affects ${target}.`,
    strength,
  };
}

function richAiGraphResponse() {
  const fullNodes = [
    aiNode("activation", "outcome", "Improve onboarding activation", 4, false),
    aiNode("time-to-value", "driver", "Time to first value", 2, true, "reduce"),
    aiNode("setup-completion", "evidence", "Setup completion rate", 3, true),
    aiNode("guided-help", "upstream-driver", "Guided help quality", 1, true),
    aiNode("qualitative-comment", "experience", "Qualitative comments about onboarding", 3, true),
    aiNode("support-backlog", "failure-mode", "Support backlog from onboarding confusion", 1, true, "reduce"),
  ];
  const fullEdges = [
    aiEdge("support-backlog", "guided-help"),
    aiEdge("guided-help", "time-to-value"),
    aiEdge("time-to-value", "setup-completion"),
    aiEdge("setup-completion", "activation"),
    aiEdge("qualitative-comment", "activation"),
  ];

  return {
    summary: "Activation depends on speed, clarity, and early value.",
    fullGraph: {
      summary: "A broad causal map with discarded and retained discovery nodes.",
      nodes: fullNodes,
      edges: fullEdges,
    },
    planningGraph: {
      summary: "A converged planning graph for clarification and KR selection.",
      nodes: fullNodes.slice(0, 4).map((node) => ({
        ...node,
        convergenceRationale: `${node.label} remains measurable, influenceable, and causally useful.`,
      })),
      edges: fullEdges.slice(1, 4),
    },
  };
}

function aiKeyResult(id, variableId, indicatorTypeOrText, maybeText) {
  const text = maybeText ?? indicatorTypeOrText;
  const indicatorType = maybeText
    ? indicatorTypeOrText
    : ["primary-result", "experience-quality", "setup-completion"].includes(variableId)
      ? "lagging"
      : "leading";

  return {
    id,
    variableId,
    indicatorType,
    text,
    rationale: `Selected because ${variableId} was highly ranked and matched the user clarification.`,
    relatedDrivers: ["Guided help quality"],
  };
}

function jsonResponse(data) {
  return jsonEnvelope({
    output: [
      {
        content: [
          {
            text: JSON.stringify(data),
          },
        ],
      },
    ],
  });
}

function jsonEnvelope(body) {
  return {
    ok: true,
    status: 200,
    async json() {
      return body;
    },
  };
}

function textResponse(text) {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        output: [
          {
            content: [{ text }],
          },
        ],
      };
    },
  };
}

function assertValidIndicatorMix(keyResults) {
  const lagging = keyResults.filter((keyResult) => keyResult.indicatorType === "lagging").length;
  const leading = keyResults.filter((keyResult) => keyResult.indicatorType === "leading").length;
  assert.ok(lagging >= 1 && lagging <= 2, `expected 1-2 lagging KRs, got ${lagging}`);
  assert.ok(leading >= 2 && leading <= 3, `expected 2-3 leading KRs, got ${leading}`);
}

async function tempTracePath() {
  const dir = await mkdtemp(join(tmpdir(), "kr-ai-trace-"));
  return join(dir, "ai-traces.jsonl");
}

async function readTraceLines(traceLogPath) {
  return (await readFile(traceLogPath, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
