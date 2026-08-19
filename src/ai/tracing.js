import { appendFile, mkdir, rename, rm, stat } from "node:fs/promises";
import { dirname } from "node:path";

import { defaultEndpoint, defaultTraceMaxBytes, defaultTracePath } from "./constants.js";

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
  const maxBytes = traceMaxBytes(options);
  const line = traceRecordLine(record, maxBytes);

  try {
    await mkdir(dirname(tracePath), { recursive: true });
    await rotateTraceFileIfNeeded(tracePath, Buffer.byteLength(line, "utf8"), maxBytes);
    await appendFile(tracePath, line, "utf8");
  } catch {
    // Trace logging must never break generation.
  }
}

function traceRecordLine(record, maxBytes) {
  const fullLine = `${JSON.stringify(record)}\n`;
  if (!Number.isFinite(maxBytes) || maxBytes <= 0 || Buffer.byteLength(fullLine, "utf8") <= maxBytes) {
    return fullLine;
  }

  const compactRecord = {
    timestamp: record.timestamp,
    operation: record.operation,
    model: record.model,
    schemaName: record.schemaName,
    endpointHost: record.endpointHost,
    provider: record.provider,
    traceTruncated: true,
  };
  const compactLine = `${JSON.stringify(compactRecord)}\n`;
  if (Buffer.byteLength(compactLine, "utf8") <= maxBytes) {
    return compactLine;
  }

  const minimalLine = `${JSON.stringify({ traceTruncated: true })}\n`;
  return Buffer.byteLength(minimalLine, "utf8") <= maxBytes ? minimalLine : "";
}

async function rotateTraceFileIfNeeded(tracePath, nextRecordBytes, maxBytes) {
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
    return;
  }

  let currentSize = 0;
  try {
    currentSize = (await stat(tracePath)).size;
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  if (currentSize + nextRecordBytes <= maxBytes) {
    return;
  }

  const rotatedPath = `${tracePath}.1`;
  await rm(rotatedPath, { force: true });
  await rename(tracePath, rotatedPath);
}

function traceMaxBytes(options) {
  const configured = options.traceMaxBytes ?? process.env.AI_TRACE_MAX_BYTES;
  if (configured === undefined) {
    return defaultTraceMaxBytes;
  }

  const parsed = Number(configured);
  return Number.isFinite(parsed) ? parsed : defaultTraceMaxBytes;
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
