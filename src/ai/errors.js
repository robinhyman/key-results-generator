export function providerError(reasonCode, message, cause) {
  const error = new Error(message);
  error.reasonCode = reasonCode;
  if (cause) {
    error.cause = cause;
  }
  return error;
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
    provider_http_error: "AI provider returned an unsuccessful response; used the local deterministic generator.",
    invalid_provider_output: "AI provider returned invalid structured output; used the local deterministic generator.",
  }[reasonCode] ?? defaultReason;
}
