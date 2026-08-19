import test from "node:test";
import assert from "node:assert/strict";

import { generateCausalMetricsGraph } from "../src/generator.js";
import { generateAiKeyResultsModel, normalizeAiGraph, normalizeAiKeyResults } from "../src/ai-service.js";
import { aiEdge, aiKeyResult, aiNode, assertValidIndicatorMix, jsonEnvelope, jsonResponse, textResponse } from "./helpers/generator-fixtures.js";

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
      ],
    }),
  });

  assert.equal(model.keyResultGeneration.mode, "ai");
  assert.equal(model.graphGeneration.mode, "unknown");
  assert.equal(model.keyResults.length, 3);
  assert.equal(model.keyResults[0].variableId, "time-to-value");
  assert.equal(model.keyResults[0].indicatorType, "leading");
  assert.equal(model.keyResults[0].assessment.influenceability, 5);
  assert.equal(model.graph.assessments["time-to-value"].gap, 5);
  assertValidIndicatorMix(model.keyResults);
});

test("generateAiKeyResultsModel separates graph and key-result provenance without duplicate aliases", async () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  graph.generation = {
    mode: "fallback",
    model: "deterministic-local",
    reasonCode: "missing_api_key",
  };

  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    fetch: async () => jsonResponse({
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "leading", "Reduce cycle time by 20%"),
        aiKeyResult("kr-2", "failure-rate", "leading", "Reduce failure rate by 20%"),
        aiKeyResult("kr-3", "primary-result", "lagging", "Increase success rate by 15%"),
      ],
    }),
  });

  assert.equal(model.graphGeneration.reasonCode, "missing_api_key");
  assert.equal(model.keyResultGeneration.mode, "ai");
  assert.equal(Object.hasOwn(model, "generation"), false);
  assert.equal(Object.hasOwn(model, "variables"), false);
  assert.equal(Object.hasOwn(model, "relationships"), false);
  assert.equal(Object.hasOwn(model, "rankedVariables"), false);
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

  assert.equal(model.keyResultGeneration.mode, "fallback");
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

  assert.equal(model.keyResultGeneration.mode, "fallback");
  assert.equal(model.keyResultGeneration.reasonCode, "provider_http_error");
  assert.equal(model.keyResults.length, 4);
  assertValidIndicatorMix(model.keyResults);
});

test("generateAiKeyResultsModel records invalid JSON fallback diagnostics", async () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    fetch: async () => textResponse("not json"),
  });

  assert.equal(model.keyResultGeneration.mode, "fallback");
  assert.equal(model.keyResultGeneration.reasonCode, "invalid_provider_output");
  assert.equal(model.keyResults.length, 4);
  assertValidIndicatorMix(model.keyResults);
});

test("generateAiKeyResultsModel records missing output fallback diagnostics", async () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    fetch: async () => jsonEnvelope({ output: [] }),
  });

  assert.equal(model.keyResultGeneration.mode, "fallback");
  assert.equal(model.keyResultGeneration.reasonCode, "invalid_provider_output");
  assert.equal(model.keyResults.length, 4);
  assertValidIndicatorMix(model.keyResults);
});

test("generateAiKeyResultsModel records timeout fallback diagnostics", async () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  const model = await generateAiKeyResultsModel(graph, {}, {
    apiKey: "test-key",
    timeoutMs: 1,
    fetch: (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    }),
  });

  assert.equal(model.keyResultGeneration.mode, "fallback");
  assert.equal(model.keyResultGeneration.reasonCode, "provider_timeout");
  assert.equal(model.keyResults.length, 4);
  assertValidIndicatorMix(model.keyResults);
});

test("generateAiKeyResultsModel rethrows unexpected programming defects", async () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  const options = {
    fetch: async () => jsonResponse({
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "Reduce cycle time by 20%"),
        aiKeyResult("kr-2", "failure-rate", "Reduce failure rate by 20%"),
        aiKeyResult("kr-3", "primary-result", "Increase success rate by 15%"),
      ],
    }),
  };
  Object.defineProperty(options, "apiKey", {
    get() {
      throw new TypeError("simulated programming defect");
    },
  });

  await assert.rejects(
    () => generateAiKeyResultsModel(graph, {}, options),
    /simulated programming defect/,
  );
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

test("normalizeAiKeyResults rejects duplicate key result ids", () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  assert.throws(
    () => normalizeAiKeyResults(graph, {
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "leading", "Reduce cycle time by 20%"),
        aiKeyResult("kr-1", "failure-rate", "leading", "Reduce failure rate by 20%"),
        aiKeyResult("kr-3", "primary-result", "lagging", "Increase success rate by 15%"),
      ],
    }),
    /id must be unique/,
  );
});

test("normalizeAiKeyResults rejects duplicate graph variables", () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  assert.throws(
    () => normalizeAiKeyResults(graph, {
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "leading", "Reduce cycle time by 20%"),
        aiKeyResult("kr-2", "cycle-time", "leading", "Reduce repeat cycle time by 20%"),
        aiKeyResult("kr-3", "primary-result", "lagging", "Increase success rate by 15%"),
      ],
    }),
    /variable must be unique/,
  );
});

test("normalizeAiKeyResults rejects three lagging key results", () => {
  const graph = generateCausalMetricsGraph("Improve onboarding activation");

  assert.throws(
    () => normalizeAiKeyResults(graph, {
      keyResults: [
        aiKeyResult("kr-1", "primary-result", "lagging", "Increase success rate by 15%"),
        aiKeyResult("kr-2", "experience-quality", "lagging", "Increase experience quality by 15%"),
        aiKeyResult("kr-3", "trust", "lagging", "Increase trust by 15%"),
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

  assert.equal(model.keyResultGeneration.mode, "fallback");
  assert.equal(model.keyResults.length, 4);
  assertValidIndicatorMix(model.keyResults);
});
