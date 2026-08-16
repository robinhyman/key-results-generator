# Verification

Last updated: 2026-08-16

Current verification posture and known gaps. Per-increment verification history is in `archive/`.

## Current posture on `main`

- `npm run build` passes 39/39 unit and API tests. Covers the deterministic generator, graph and KR contracts, server routing and validation, path-traversal rejection, AI instruction composition, 3-5 KR normalization, provider fallback diagnostics, indicator-type validation, and trace redaction.
- `npm run test:browser` passes 1/1 Playwright test covering objective submission, slider adjustment, final-KR submission, repeated generation, the rendered Leading/Lagging label, and console/page/request failures. Requires `npx playwright install chromium` first; a missing binary is a setup failure, not a product failure.
- `npm run check` enforces the process gates. Failing gates: credential material, state stamp presence and freshness, branch naming, lint/build. Budget and PR-report gates are enforced as failures as of issue #24.
- Live provider smoke checks pass with `gpt-5-mini`: `/api/graph` and `/api/key-results` return HTTP 200 in AI mode, 4 KRs, indicator types `lagging, lagging, leading, leading`, with clarification traceability preserved.
- Trace logging verified: JSONL records carry operation, model, schema, request, response, parsed output, and endpoint host, with no `Authorization` or Bearer material.

## Known gaps

- **Branch protection is not enabled on `main`.** Until the `Process / increment-check` status check is required, CI is advisory and hooks are bypassable with `--no-verify`. This is the single largest hole in process enforcement.
- The process gates cannot verify truthfulness. An agent can write "Demo link checked" above a URL it never opened. Only an independent process-review step closes this, and only partially.
- No browser test for manually tampered slider payloads. Malformed input is covered at the server request-shape boundary only.
- AI output *quality* is not automatically evaluated. Schema, instruction composition, and indicator mix are tested; whether the KRs are good is not.
- Hosted deployment is unverified and out of scope.
- No test covers `increment-check` itself. Its gates were verified manually against known-bad inputs during issue #22.
- The PR-report gate accepts an explicit written declaration that an increment is not user-facing, in place of a demo link. Silence still fails, but a false declaration would pass — this is one of the truthfulness limits above.

## Verification rules

- Every increment needs a verification plan before implementation, per `ai-team/workflows/testing.md`.
- Prefer test-first for behaviorally clear work; explain any skip for a behavior change.
- Passing automated tests are necessary but not sufficient for user-facing work — a checked demo link is also required.
- Skipped checks must record the check, the reason, the risk, and whether `Done` is still possible.
- Failures are blocking unless there is evidence they are unrelated. Real out-of-scope failures become GitHub issues.
