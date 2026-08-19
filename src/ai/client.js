import { readFile } from "node:fs/promises";

import {
  defaultEndpoint,
  defaultKeyPath,
  defaultModel,
  defaultProviderTimeoutMs,
} from "./constants.js";
import { providerError } from "./errors.js";
import { buildResponseInput } from "./prompts.js";
import { writeAiTrace } from "./tracing.js";

export async function createOpenAiClient(options) {
  const apiKey = options.apiKey ?? (await readApiKey(options));
  if (!apiKey) {
    throw providerError("missing_api_key", "No OpenAI API key configured.");
  }

  const model = options.model ?? process.env.OPENAI_MODEL ?? process.env.AI_MODEL ?? defaultModel;
  const endpoint = options.endpoint ?? process.env.OPENAI_RESPONSES_URL ?? defaultEndpoint;
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? defaultProviderTimeoutMs;

  if (typeof fetchImpl !== "function") {
    throw providerError("provider_unavailable", "No fetch implementation is available.");
  }

  return {
    model,
    async createJsonResponse({ operation, schemaName, schema, prompt, validateParsedOutput }) {
      const requestBody = {
        model,
        input: buildResponseInput(prompt),
        text: {
          format: {
            type: "json_schema",
            name: schemaName,
            strict: true,
            schema,
          },
        },
      };

      const response = await sendJsonRequest({
        apiKey,
        endpoint,
        fetchImpl,
        model,
        operation,
        options,
        requestBody,
        schemaName,
        timeoutMs,
      });

      return readJsonResponse({
        model,
        operation,
        options,
        requestBody,
        response,
        schemaName,
        validateParsedOutput,
      });
    },
  };
}

async function sendJsonRequest({
  apiKey,
  endpoint,
  fetchImpl,
  model,
  operation,
  options,
  requestBody,
  schemaName,
  timeoutMs,
}) {
  return withProviderTimeout({
    classifyProviderFailure: true,
    model,
    operation,
    options,
    requestBody,
    schemaName,
    timeoutMs,
  }, (signal) => fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal,
  }));
}

async function readJsonResponse({
  model,
  operation,
  options,
  requestBody,
  response,
  schemaName,
  validateParsedOutput,
}) {
  let responseBody = null;
  let parsedOutput = null;
  if (!response.ok) {
    responseBody = await withProviderTimeout({
      classifyProviderFailure: false,
      model,
      operation,
      options,
      requestBody,
      schemaName,
      timeoutMs: options.timeoutMs ?? defaultProviderTimeoutMs,
    }, () => safeReadResponseBody(response));
    await writeAiTrace(options, {
      operation,
      model,
      schemaName,
      requestBody,
      responseBody,
      provider: { ok: false, status: response.status, reasonCode: "provider_http_error" },
    });
    throw providerError("provider_http_error", `AI provider returned HTTP ${response.status}.`);
  }

  try {
    responseBody = await withProviderTimeout({
      classifyProviderFailure: false,
      model,
      operation,
      options,
      requestBody,
      schemaName,
      timeoutMs: options.timeoutMs ?? defaultProviderTimeoutMs,
    }, () => response.json());
    parsedOutput = parseResponseText(responseBody);
    if (validateParsedOutput) {
      validateParsedOutput(parsedOutput);
    }
    await writeAiTrace(options, {
      operation,
      model,
      schemaName,
      requestBody,
      responseBody,
      parsedOutput,
      provider: { ok: true, status: response.status },
    });
    return parsedOutput;
  } catch (error) {
    if (error?.reasonCode === "provider_timeout") {
      throw error;
    }
    await writeAiTrace(options, {
      operation,
      model,
      schemaName,
      requestBody,
      responseBody,
      parsedOutput,
      provider: { ok: false, status: response.status, reasonCode: "invalid_provider_output", error: error.message },
    });
    throw providerError("invalid_provider_output", "AI provider returned output that could not be parsed.", error);
  }
}

async function withProviderTimeout({
  classifyProviderFailure,
  model,
  operation,
  options,
  requestBody,
  schemaName,
  timeoutMs,
}, action) {
  const { signal, timeoutPromise, cleanup } = createTimeoutSignal(timeoutMs, options);
  try {
    const actionPromise = Promise.resolve().then(() => action(signal));
    return await (timeoutPromise
      ? Promise.race([actionPromise, timeoutPromise])
      : actionPromise);
  } catch (error) {
    const timedOut = error?.name === "AbortError" || signal?.aborted;
    if (!timedOut && !classifyProviderFailure) {
      throw error;
    }
    await writeAiTrace(options, {
      operation,
      model,
      schemaName,
      requestBody,
      provider: {
        ok: false,
        reasonCode: timedOut ? "provider_timeout" : "provider_unavailable",
        error: error.message,
      },
    });
    throw providerError(
      timedOut ? "provider_timeout" : "provider_unavailable",
      timedOut
        ? `AI provider request timed out after ${timeoutMs}ms.`
        : "AI provider request failed before a response was received.",
      error,
    );
  } finally {
    cleanup();
  }
}

function createTimeoutSignal(timeoutMs, options) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return { signal: undefined, timeoutPromise: null, cleanup: () => {} };
  }

  const controller = new AbortController();
  const setTimeoutFn = options.setTimeout ?? setTimeout;
  const clearTimeoutFn = options.clearTimeout ?? clearTimeout;
  let timeout;
  const timeoutPromise = new Promise((_resolve, reject) => {
    timeout = setTimeoutFn(() => {
      controller.abort();
      reject(new DOMException("The operation timed out.", "AbortError"));
    }, timeoutMs);
  });
  return {
    signal: controller.signal,
    timeoutPromise,
    cleanup() {
      clearTimeoutFn(timeout);
    },
  };
}

async function readApiKey(options) {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY.trim();
  }

  const keyPath = options.keyPath ?? process.env.OPENAI_API_KEY_PATH ?? process.env.AI_KEY_PATH ?? defaultKeyPath;

  try {
    return (await readFile(keyPath, "utf8")).trim();
  } catch {
    return "";
  }
}

function parseResponseText(body) {
  const outputText =
    body.output_text ??
    body.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("");

  if (!outputText) {
    throw new Error("OpenAI response did not include output text.");
  }

  return JSON.parse(outputText);
}

async function safeReadResponseBody(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
