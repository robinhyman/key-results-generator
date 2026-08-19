import test from "node:test";
import assert from "node:assert/strict";
import { rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import {
  handleRequest,
  maxObjectiveLength,
} from "../server.js";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const serverSourcePath = fileURLToPath(new URL("../server.js", import.meta.url));

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

test("ignores malformed Host headers when parsing local request URLs", async () => {
  const response = await request({
    method: "GET",
    url: "/",
    headers: { host: "http://bad host" },
  });

  assert.equal(response.status, 200);
  assert.match(response.body, /Key Results Generator/);
});

test("returns a controlled response for malformed absolute request targets", async () => {
  const response = await request({
    method: "GET",
    url: "http://bad host/",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body, "Bad request");
});

test("rejects public symlinks that resolve outside the static directory", async () => {
  const symlinkPath = join(publicDir, "escaping-static-link.js");

  await rm(symlinkPath, { force: true });
  try {
    await symlink(serverSourcePath, symlinkPath);
    const response = await request({ method: "GET", url: "/escaping-static-link.js" });

    assert.equal(response.status, 404);
    assert.doesNotMatch(response.body, /createServer/);
  } finally {
    await rm(symlinkPath, { force: true });
  }
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

test("accepts objective text at the documented length limit", async () => {
  await withTemporaryNoAiCredentials(async () => {
    const response = await request({
      method: "POST",
      url: "/api/graph",
      body: JSON.stringify({ objective: "a".repeat(maxObjectiveLength) }),
    });
    const body = JSON.parse(response.body);

    assert.equal(response.status, 200);
    assert.equal(body.graph.generation.mode, "fallback");
  });
});

test("rejects objective text over the documented length limit", async () => {
  const response = await request({
    method: "POST",
    url: "/api/graph",
    body: JSON.stringify({ objective: "a".repeat(maxObjectiveLength + 1) }),
  });
  const body = JSON.parse(response.body);

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "OBJECTIVE_TOO_LONG");
});

test("validates key-results request object shape", async () => {
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

test("validates key-results graph nodes at the HTTP boundary", async () => {
  const cases = [
    {},
    { nodes: [], edges: [] },
    { nodes: "bad", edges: [] },
    { nodes: [{ id: "one" }, { id: "two" }, { id: "three" }, {}], edges: [] },
  ];

  for (const graph of cases) {
    const response = await request({
      method: "POST",
      url: "/api/key-results",
      body: JSON.stringify({ graph, clarifications: {} }),
    });
    const body = JSON.parse(response.body);

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "INVALID_GRAPH");
  }
});

test("validates key-results graph edges at the HTTP boundary", async () => {
  const graph = {
    nodes: [
      { id: "outcome" },
      { id: "driver" },
      { id: "evidence" },
      { id: "upstream" },
    ],
    edges: [{ source: "driver" }],
  };
  const response = await request({
    method: "POST",
    url: "/api/key-results",
    body: JSON.stringify({ graph, clarifications: {} }),
  });
  const body = JSON.parse(response.body);

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_GRAPH");
});

test("rejects key-results graph edges with unknown or identical endpoints", async () => {
  const baseGraph = {
    nodes: [
      { id: "outcome" },
      { id: "driver" },
      { id: "evidence" },
      { id: "upstream" },
    ],
    edges: [],
  };

  for (const edge of [
    { source: "driver", target: "unknown" },
    { source: "driver", target: "driver" },
  ]) {
    const response = await request({
      method: "POST",
      url: "/api/key-results",
      body: JSON.stringify({ graph: { ...baseGraph, edges: [edge] }, clarifications: {} }),
    });
    const body = JSON.parse(response.body);

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "INVALID_GRAPH");
  }
});

test("accepts valid key-results graph payloads", async () => {
  await withTemporaryNoAiCredentials(async () => {
    const graph = {
      objective: "Improve onboarding activation",
      summary: "A valid browser graph.",
      nodes: [
        graphNode("outcome", "outcome", false),
        graphNode("cycle-time", "driver"),
        graphNode("failure-rate", "failure-mode"),
        graphNode("primary-result", "evidence"),
        graphNode("feedback-signal", "upstream-driver"),
      ],
      edges: [
        { source: "feedback-signal", target: "cycle-time" },
        { source: "cycle-time", target: "primary-result" },
        { source: "failure-rate", target: "primary-result" },
        { source: "primary-result", target: "outcome" },
      ],
      assessments: {},
      generation: {
        mode: "fallback",
        model: "deterministic-local",
        reasonCode: "missing_api_key",
      },
    };
    const response = await request({
      method: "POST",
      url: "/api/key-results",
      body: JSON.stringify({ graph, clarifications: {} }),
    });
    const body = JSON.parse(response.body);

    assert.equal(response.status, 200);
    assert.equal(body.model.graphGeneration.reasonCode, "missing_api_key");
    assert.equal(body.model.keyResultGeneration.mode, "fallback");
    assert.equal(body.model.keyResults.length, 4);
    assert.equal(Object.hasOwn(body.model, "generation"), false);
    assert.equal(Object.hasOwn(body.model, "variables"), false);
    assert.equal(Object.hasOwn(body.model, "relationships"), false);
    assert.equal(Object.hasOwn(body.model, "rankedVariables"), false);
  });
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

async function request({ method, url, body = "", headers = { host: "127.0.0.1" } }) {
  const incoming = Readable.from(body ? [body] : []);
  incoming.method = method;
  incoming.url = url;
  incoming.headers = headers;

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

function graphNode(id, type, influenceable = true) {
  return {
    id,
    type,
    label: id,
    description: `${id} description.`,
    impact: 80,
    confidence: 75,
    influenceable,
    stage: type === "outcome" ? 4 : 2,
    direction: "improve",
  };
}
