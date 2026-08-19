import test from "node:test";
import assert from "node:assert/strict";

import { createOpenAiClient } from "../src/ai/client.js";
import { jsonResponse, richAiGraphResponse } from "./helpers/generator-fixtures.js";

test("provider requests abort after the configured timeout", async () => {
  const client = await createOpenAiClient({
    apiKey: "test-key",
    timeoutMs: 1,
    fetch: (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    }),
  });

  await assert.rejects(
    () => client.createJsonResponse({
      operation: "graph",
      schemaName: "causal_metrics_graph",
      schema: {},
      prompt: { system: "system", user: "user" },
    }),
    (error) => error.reasonCode === "provider_timeout",
  );
});

test("provider timeout cleanup runs after a successful response", async () => {
  let timeoutId = 0;
  const clearedTimeouts = [];
  const client = await createOpenAiClient({
    apiKey: "test-key",
    timeoutMs: 1000,
    setTimeout: () => {
      timeoutId += 1;
      return timeoutId;
    },
    clearTimeout: (id) => {
      clearedTimeouts.push(id);
    },
    fetch: async () => jsonResponse(richAiGraphResponse()),
  });

  await client.createJsonResponse({
    operation: "graph",
    schemaName: "causal_metrics_graph",
    schema: {},
    prompt: { system: "system", user: "user" },
  });

  assert.deepEqual(clearedTimeouts, [1, 2]);
});

test("provider response body reads abort after the configured timeout", async () => {
  const client = await createOpenAiClient({
    apiKey: "test-key",
    timeoutMs: 1,
    fetch: async () => ({
      ok: true,
      status: 200,
      json: () => new Promise(() => {}),
    }),
  });

  await assert.rejects(
    () => client.createJsonResponse({
      operation: "graph",
      schemaName: "causal_metrics_graph",
      schema: {},
      prompt: { system: "system", user: "user" },
    }),
    (error) => error.reasonCode === "provider_timeout",
  );
});
