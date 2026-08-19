import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { extname, join, normalize, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  generateAiCausalMetricsGraph,
  generateAiKeyResultsModel,
} from "./src/ai-service.js";
import {
  maxObjectiveLength,
  validateGraphRequest,
  validateKeyResultsRequest,
} from "./src/request-validation.js";

export { maxObjectiveLength };

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

export async function handleRequest(request, response) {
  let url;
  try {
    url = new URL(request.url ?? "/", "http://127.0.0.1");
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }

  if (url.pathname === "/api/graph" && request.method === "POST") {
    await handleGraphRequest(request, response);
    return;
  }

  if (url.pathname === "/api/key-results" && request.method === "POST") {
    await handleKeyResultsRequest(request, response);
    return;
  }

  try {
    const filePath = await resolveFilePath(url.pathname);
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] ?? "text/plain; charset=utf-8",
    });
    response.end(body);
  } catch (error) {
    if (error.statusCode === 404) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

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
    validateGraphRequest(body);
    const graph = await generateAiCausalMetricsGraph(body.objective);
    sendJson(response, 200, { graph });
  } catch (error) {
    sendError(response, error, "Unable to generate a causal metrics graph.");
  }
}

async function handleKeyResultsRequest(request, response) {
  try {
    const body = await readJsonBody(request);
    validateKeyResultsRequest(body);
    const model = await generateAiKeyResultsModel(body.graph, body.clarifications);
    sendJson(response, 200, { model });
  } catch (error) {
    sendError(response, error, "Unable to generate key results from the clarified graph.");
  }
}

async function resolveFilePath(pathname) {
  if (pathname === "/" || pathname === "/index.html") {
    return containedPublicPath(join(publicDir, "index.html"));
  }

  return containedPublicPath(safeJoin(publicDir, pathname.slice(1)));
}

function safeJoin(baseDir, requestedPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestedPath);
  } catch {
    throw httpError("Requested file path is invalid.", "NOT_FOUND", 404);
  }
  const filePath = normalize(join(baseDir, decodedPath));
  const relativePath = relative(baseDir, filePath);
  if (relativePath === "" || relativePath.startsWith("..") || relativePath.startsWith(sep)) {
    throw httpError("Requested file is outside the public directory.", "NOT_FOUND", 404);
  }
  return filePath;
}

async function containedPublicPath(filePath) {
  const [realBaseDir, realFilePath] = await Promise.all([
    realpath(publicDir),
    realpath(filePath),
  ]);
  const relativePath = relative(realBaseDir, realFilePath);
  if (relativePath === "" || relativePath.startsWith("..") || relativePath.startsWith(sep)) {
    throw httpError("Requested file is outside the public directory.", "NOT_FOUND", 404);
  }
  return realFilePath;
}

async function readJsonBody(request) {
  let rawBody = "";
  for await (const chunk of request) {
    rawBody += chunk;
    if (rawBody.length > 100_000) {
      throw httpError("Request body too large.", "REQUEST_TOO_LARGE", 413);
    }
  }

  try {
    return rawBody ? JSON.parse(rawBody) : {};
  } catch {
    throw httpError("Request body must be valid JSON.", "INVALID_JSON", 400);
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function sendError(response, error, fallbackMessage) {
  const status = error.statusCode ?? 500;
  const code = error.code ?? "SERVER_ERROR";
  const message = error.expose ? error.message : fallbackMessage;
  sendJson(response, status, { error: { code, message } });
}

function httpError(message, code, statusCode) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.expose = true;
  return error;
}
