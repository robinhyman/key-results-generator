import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  generateAiCausalMetricsGraph,
  generateAiKeyResultsModel,
} from "./src/ai-service.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const port = Number(process.env.PORT ?? 5173);
const host = process.env.HOST ?? "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

export const server = createServer(handleRequest);

async function handleRequest(request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (url.pathname === "/api/graph" && request.method === "POST") {
    await handleGraphRequest(request, response);
    return;
  }

  if (url.pathname === "/api/key-results" && request.method === "POST") {
    await handleKeyResultsRequest(request, response);
    return;
  }

  const filePath = resolveFilePath(url.pathname);

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] ?? "text/plain; charset=utf-8",
    });
    response.end(body);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Server error");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(port, host, () => {
    console.log(`Key Results Generator running at http://${host}:${port}`);
  });
}

async function handleGraphRequest(request, response) {
  try {
    const body = await readJsonBody(request);
    const graph = await generateAiCausalMetricsGraph(body.objective);
    sendJson(response, 200, { graph });
  } catch {
    sendJson(response, 400, { error: "Unable to generate a causal metrics graph." });
  }
}

async function handleKeyResultsRequest(request, response) {
  try {
    const body = await readJsonBody(request);
    const model = await generateAiKeyResultsModel(body.graph, body.clarifications);
    sendJson(response, 200, { model });
  } catch {
    sendJson(response, 400, { error: "Unable to generate key results from the clarified graph." });
  }
}

function resolveFilePath(pathname) {
  if (pathname === "/" || pathname === "/index.html") {
    return join(publicDir, "index.html");
  }

  if (pathname.startsWith("/src/")) {
    return safeJoin(root, pathname.slice(1));
  }

  return safeJoin(publicDir, pathname.slice(1));
}

function safeJoin(baseDir, requestedPath) {
  const filePath = normalize(join(baseDir, requestedPath));
  if (!filePath.startsWith(baseDir)) {
    return join(publicDir, "index.html");
  }
  return filePath;
}

async function readJsonBody(request) {
  let rawBody = "";
  for await (const chunk of request) {
    rawBody += chunk;
    if (rawBody.length > 100_000) {
      throw new Error("Request body too large.");
    }
  }

  return rawBody ? JSON.parse(rawBody) : {};
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}
