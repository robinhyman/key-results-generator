import test from "node:test";
import assert from "node:assert/strict";

import { generateAiCausalMetricsGraph, normalizeAiGraph } from "../src/ai-service.js";
import {
  aiEdge,
  aiNode,
  jsonResponse,
  richAiGraphResponse,
} from "./helpers/generator-fixtures.js";

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

test("normalizeAiGraph rejects duplicate node and edge ids", () => {
  const duplicateNode = richAiGraphResponse();
  duplicateNode.planningGraph.nodes.push({
    ...duplicateNode.planningGraph.nodes[1],
  });

  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", duplicateNode),
    /duplicate node id/,
  );

  const duplicateEdge = richAiGraphResponse();
  duplicateEdge.planningGraph.edges[1].id = duplicateEdge.planningGraph.edges[0].id;

  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", duplicateEdge),
    /duplicate edge id/,
  );
});

test("normalizeAiGraph requires exactly one stage-4 outcome in the planning graph", () => {
  const graph = richAiGraphResponse();
  graph.planningGraph.nodes[1] = {
    ...graph.planningGraph.nodes[1],
    type: "outcome",
    stage: 4,
  };

  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", graph),
    /exactly one stage-4 outcome/,
  );
});

test("normalizeAiGraph rejects disconnected and cyclic planning graphs", () => {
  const disconnected = richAiGraphResponse();
  disconnected.planningGraph.edges = disconnected.planningGraph.edges.filter((edge) => edge.source !== "guided-help");

  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", disconnected),
    /connect every node/,
  );

  const cyclic = richAiGraphResponse();
  cyclic.fullGraph.edges.push(aiEdge("activation", "guided-help"));
  cyclic.planningGraph.edges.push(aiEdge("activation", "guided-help"));

  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", cyclic),
    /acyclic/,
  );
});

test("normalizeAiGraph rejects provider edges that reference unknown or identical nodes", () => {
  const unknown = richAiGraphResponse();
  unknown.fullGraph.edges.push(aiEdge("unknown-node", "activation"));

  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", unknown),
    /invalid nodes/,
  );

  const selfReference = richAiGraphResponse();
  selfReference.planningGraph.edges.push(aiEdge("guided-help", "guided-help"));

  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", selfReference),
    /invalid nodes/,
  );
});

test("normalizeAiGraph permits disconnected full-graph discovery nodes but rejects full-graph cycles", () => {
  const disconnectedDiscovery = richAiGraphResponse();
  disconnectedDiscovery.fullGraph.nodes.push(
    aiNode("discovery-only", "driver", "Discovery-only node", 2, true),
  );

  assert.doesNotThrow(() =>
    normalizeAiGraph("Improve onboarding activation", disconnectedDiscovery),
  );

  const fullCycle = richAiGraphResponse();
  fullCycle.fullGraph.edges.push(aiEdge("activation", "qualitative-comment"));

  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", fullCycle),
    /acyclic/,
  );
});

test("normalizeAiGraph requires planning graph nodes and edges to come from the full graph", () => {
  const missingNode = richAiGraphResponse();
  missingNode.planningGraph.nodes.push(
    aiNode("planning-only-node", "driver", "Planning-only node", 2, true),
  );
  missingNode.planningGraph.edges.unshift(aiEdge("planning-only-node", "time-to-value"));

  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", missingNode),
    /missing from the full graph/,
  );

  const missingEdge = richAiGraphResponse();
  missingEdge.planningGraph.edges[0] = aiEdge("guided-help", "setup-completion");

  assert.throws(
    () => normalizeAiGraph("Improve onboarding activation", missingEdge),
    /missing from the full graph/,
  );
});

test("generateAiCausalMetricsGraph falls back when semantic graph validation fails", async () => {
  const invalidGraph = richAiGraphResponse();
  invalidGraph.planningGraph.edges = [];

  const graph = await generateAiCausalMetricsGraph("Improve onboarding activation", {
    apiKey: "test-key",
    fetch: async () => jsonResponse(invalidGraph),
  });

  assert.equal(graph.generation.mode, "fallback");
  assert.equal(graph.generation.reasonCode, "invalid_provider_output");
  assert.ok(graph.nodes.length >= 9);
});

test("generateAiCausalMetricsGraph falls back when provider graph edges are malformed", async () => {
  const invalidGraph = richAiGraphResponse();
  invalidGraph.fullGraph.edges.push(aiEdge("unknown-node", "activation"));

  const graph = await generateAiCausalMetricsGraph("Improve onboarding activation", {
    apiKey: "test-key",
    fetch: async () => jsonResponse(invalidGraph),
  });

  assert.equal(graph.generation.mode, "fallback");
  assert.equal(graph.generation.reasonCode, "invalid_provider_output");
});
