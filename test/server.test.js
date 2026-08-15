import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

import { handleRequest } from "../server.js";

test("serves the app shell from the public directory", async () => {
  const response = await request({ method: "GET", url: "/" });

  assert.equal(response.status, 200);
  assert.match(response.headers["Content-Type"], /text\/html/);
  assert.match(response.body, /Key Results Generator/);
});

test("does not expose source modules through static routing", async () => {
  const response = await request({ method: "GET", url: "/src/generator.js" });

  assert.equal(response.status, 404);
});

test("rejects path traversal attempts instead of serving project files", async () => {
  const response = await request({ method: "GET", url: "/%2e%2e/server.js" });

  assert.equal(response.status, 404);
  assert.doesNotMatch(response.body, /createServer/);
});

test("rejects malformed encoded static paths", async () => {
  const response = await request({ method: "GET", url: "/%E0%A4%A" });

  assert.equal(response.status, 404);
});

test("returns structured errors for malformed JSON", async () => {
  const response = await request({
    method: "POST",
    url: "/api/graph",
    body: "{bad json",
  });
  const body = JSON.parse(response.body);

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_JSON");
});

test("validates graph generation request shape", async () => {
  const response = await request({
    method: "POST",
    url: "/api/graph",
    body: JSON.stringify({ objective: "" }),
  });
  const body = JSON.parse(response.body);

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_REQUEST");
  assert.match(body.error.message, /objective/);
});

test("validates key-results request shape", async () => {
  const response = await request({
    method: "POST",
    url: "/api/key-results",
    body: JSON.stringify({ graph: null, clarifications: [] }),
  });
  const body = JSON.parse(response.body);

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_REQUEST");
  assert.match(body.error.message, /graph/);
});

test("successful graph response includes explicit fallback diagnostics without credentials", async () => {
  await withTemporaryNoAiCredentials(async () => {
    const response = await request({
      method: "POST",
      url: "/api/graph",
      body: JSON.stringify({ objective: "Improve onboarding activation" }),
    });
    const body = JSON.parse(response.body);

    assert.equal(response.status, 200);
    assert.equal(body.graph.generation.mode, "fallback");
    assert.equal(body.graph.generation.reasonCode, "missing_api_key");
  });
});

async function request({ method, url, body = "" }) {
  const incoming = Readable.from(body ? [body] : []);
  incoming.method = method;
  incoming.url = url;
  incoming.headers = { host: "127.0.0.1" };

  const response = {
    status: null,
    headers: null,
    body: "",
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(chunk = "") {
      this.body += chunk;
    },
  };

  await handleRequest(incoming, response);
  return response;
}

async function withTemporaryNoAiCredentials(run) {
  const previousApiKey = process.env.OPENAI_API_KEY;
  const previousApiKeyPath = process.env.OPENAI_API_KEY_PATH;
  const previousAiKeyPath = process.env.AI_KEY_PATH;

  delete process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY_PATH = "/tmp/key-results-generator-missing-key";
  delete process.env.AI_KEY_PATH;

  try {
    await run();
  } finally {
    restoreEnv("OPENAI_API_KEY", previousApiKey);
    restoreEnv("OPENAI_API_KEY_PATH", previousApiKeyPath);
    restoreEnv("AI_KEY_PATH", previousAiKeyPath);
  }
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
