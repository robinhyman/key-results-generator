import test from "node:test";
import assert from "node:assert/strict";
import { rm, stat } from "node:fs/promises";
import { dirname } from "node:path";

import { generateCausalMetricsGraph } from "../src/generator.js";
import { generateAiCausalMetricsGraph, generateAiKeyResultsModel } from "../src/ai-service.js";
import { aiEdge, aiKeyResult, aiNode, jsonResponse, readTraceLines, tempTracePath } from "./helpers/generator-fixtures.js";

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
  assert.equal(model.keyResultGeneration.mode, "fallback");
  assert.equal(lines.length, 1);
  assert.equal(lines[0].provider.ok, false);
  assert.equal(lines[0].provider.status, 503);
  assert.equal(lines[0].provider.reasonCode, "provider_http_error");
  assert.deepEqual(lines[0].responseBody, { error: { message: "unavailable" } });
  await rm(dirname(traceLogPath), { recursive: true, force: true });
});

test("AI trace logging rotates bounded local trace files", async () => {
  const traceLogPath = await tempTracePath();
  const graph = generateCausalMetricsGraph("Improve onboarding activation");
  const options = {
    apiKey: "test-key",
    traceEnabled: true,
    traceLogPath,
    traceMaxBytes: 100_000,
    fetch: async () => jsonResponse({
      keyResults: [
        aiKeyResult("kr-1", "cycle-time", "leading", "Reduce cycle time by 20%"),
        aiKeyResult("kr-2", "failure-rate", "leading", "Reduce failure rate by 20%"),
        aiKeyResult("kr-3", "primary-result", "lagging", "Increase success rate by 15%"),
      ],
    }),
  };

  await generateAiKeyResultsModel(graph, {}, options);
  const firstTraceStats = await stat(traceLogPath);
  await generateAiKeyResultsModel(graph, {}, {
    ...options,
    traceMaxBytes: firstTraceStats.size + 10,
  });

  const currentLines = await readTraceLines(traceLogPath);
  const rotatedLines = await readTraceLines(`${traceLogPath}.1`);
  assert.equal(currentLines.length, 1);
  assert.equal(rotatedLines.length, 1);
  assert.equal(currentLines[0].operation, "key-results");
  assert.equal(rotatedLines[0].operation, "key-results");
  await rm(dirname(traceLogPath), { recursive: true, force: true });
});

test("AI trace logging bounds oversized single trace records", async () => {
  const traceLogPath = await tempTracePath();

  await generateAiCausalMetricsGraph("Improve onboarding activation", {
    apiKey: "test-key",
    traceEnabled: true,
    traceLogPath,
    traceMaxBytes: 50,
    fetch: async () => {
      throw new Error("x".repeat(500));
    },
  });

  const traceStats = await stat(traceLogPath);
  const lines = await readTraceLines(traceLogPath);
  assert.ok(traceStats.size <= 50);
  assert.equal(lines[0].traceTruncated, true);
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
  assert.equal(model.keyResultGeneration.mode, "fallback");
  assert.equal(model.keyResultGeneration.reasonCode, "invalid_provider_output");
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
