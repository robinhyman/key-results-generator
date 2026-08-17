import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { defaultEndpoint, defaultTracePath } from "./constants.js";

export async function writeAiTrace(options, trace) {
  const enabled = options.traceEnabled ?? process.env.AI_TRACE_LOG === "1";
  if (!enabled) {
    return;
  }

  const tracePath = options.traceLogPath ?? process.env.AI_TRACE_LOG_PATH ?? defaultTracePath;
  const record = sanitizeTraceRecord({
    timestamp: new Date().toISOString(),
    ...trace,
    endpointHost: endpointHost(options.endpoint ?? process.env.OPENAI_RESPONSES_URL ?? defaultEndpoint),
  }, options);

  try {
    await mkdir(dirname(tracePath), { recursive: true });
    await appendFile(tracePath, `${JSON.stringify(record)}\n`, "utf8");
  } catch {
    // Trace logging must never break generation.
  }
}

function endpointHost(endpoint) {
  try {
    return new URL(endpoint).host;
  } catch {
    return "";
  }
}

function sanitizeTraceRecord(record, options) {
  const sensitiveValues = [
    options.apiKey,
    process.env.OPENAI_API_KEY,
  ].filter(Boolean);

  return sanitizeTraceValue(record, sensitiveValues);
}

function sanitizeTraceValue(value, sensitiveValues) {
  if (typeof value === "string") {
    return sensitiveValues.reduce(
      (text, secret) => text.replaceAll(secret, "[redacted]"),
      value
        .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
        .replace(/\b(token|secret|api[_-]?key)(\s+|=)[^\s&]+/gi, "$1$2[redacted]"),
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeTraceValue(item, sensitiveValues));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        isSensitiveTraceKey(key) ? "[redacted]" : sanitizeTraceValue(entry, sensitiveValues),
      ]),
    );
  }

  return value;
}

function isSensitiveTraceKey(key) {
  return ["authorization", "apiKey", "api_key", "token", "secret"].includes(key);
}
