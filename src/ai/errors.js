export function providerError(reasonCode, message, cause) {
  const error = new Error(message);
  error.name = "ProviderError";
  error.reasonCode = reasonCode;
  error.isProviderError = true;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

export function isProviderError(error) {
  return Boolean(error?.isProviderError && typeof error.reasonCode === "string");
}

export function fallbackDiagnostic(error, defaultReason) {
  const reasonCode = error?.reasonCode ?? "provider_unavailable";
  return {
    reasonCode,
    reason: fallbackReason(reasonCode, defaultReason),
  };
}

function fallbackReason(reasonCode, defaultReason) {
  return {
    missing_api_key: "No AI API key is configured; used the local deterministic generator.",
    provider_unavailable: defaultReason,
    provider_timeout: "AI provider request timed out; used the local deterministic generator.",
    provider_http_error: "AI provider returned an unsuccessful response; used the local deterministic generator.",
    invalid_provider_output: "AI provider returned invalid structured output; used the local deterministic generator.",
  }[reasonCode] ?? defaultReason;
}
