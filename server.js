import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

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

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
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
});

server.listen(port, host, () => {
  console.log(`Key Results Generator running at http://${host}:${port}`);
});

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
