# Verification

Last updated: 2026-08-18

Current verification posture and known gaps. Per-increment verification history is in `archive/`.

## Current posture

- Issue #43 / PR #44 is merged. `npm test` passed 102/102, `npm run build` passed, `npm run check` passed 8/8 with no warnings, and Project closeout was verified.
- Issue #41 / PR #42 is merged; process-review evidence is now part of the baseline PR-report gate.
- On the current local branch, `npm test` passes 102/102 unit, API, process-checker, and Project-status checker tests. Covers the deterministic generator, graph and KR contracts, rich `fullGraph` plus converged `planningGraph` AI response contract, algorithmic KR-set exploration, server routing and validation, path-traversal rejection, AI instruction composition, 3-5 KR normalization, provider fallback diagnostics, indicator-type validation, trace redaction, and process gate regressions.
- `npm run test:browser` passes 1/1 Playwright test covering objective submission, slider adjustment, final-KR submission, repeated generation, the rendered Leading/Lagging label, and console/page/request failures. Requires `npx playwright install chromium` first; a missing binary is a setup failure, not a product failure.
- `npm run check` enforces the process gates. Failing gates: credential material, state stamp presence and freshness, branch naming, lint/build. Budget and PR-report gates are enforced as failures as of issue #24.
- **CI is binding.** The `main: require increment-check` repository ruleset is active as of 2026-08-16: pull requests are required, `increment-check` is a required status check, force-pushes and deletion are blocked, and there are no bypass actors. Hooks remain bypassable with `--no-verify`, but nothing reaches `main` without CI passing.
- The PR-report gate reads evidence within the section that claims it, not anywhere in the body, as of issue #31. Both bypasses found by the 2026-08-16 external audit — an empty body, and four empty headings plus a stray URL and delegation sentence — are pinned as regression tests. HTML comments are stripped before evaluation, so `.github/pull_request_template.md` cannot satisfy the gate with its own guidance text; a test asserts the unfilled template fails.
- State coherence is checked as of issue #32: `index.md` may not name an issue as active that `task-ledger.md` does not list as active. This catches the class of drift that date stamps cannot — three state files stamped the same day giving three different answers.
- Live provider smoke checks pass with `gpt-5-mini`: `/api/graph` and `/api/key-results` return HTTP 200 in AI mode, 4 KRs, indicator types `lagging, lagging, leading, leading`, with clarification traceability preserved.
- Trace logging verified: JSONL records carry operation, model, schema, request, response, parsed output, and endpoint host, with no `Authorization` or Bearer material.

## Known gaps

- Graph-generation quality is not yet automatically evaluated. The 2026-08-17 offline implementation now asks the AI for a rich `fullGraph` followed by a converged `planningGraph`, but no automated quality suite yet checks whether live AI output is actually good.
- Graph convergence validation is still thin. Tests pin prompt/schema shape and mocked normalization, but local code does not yet enforce branch coverage, connectivity, full/planning subset quality, or exactly-one-outcome invariants beyond schema/prompt guidance.
- Algorithmic KR-set selection is implemented as an explorable heuristic, not yet a proven optimizer. It enumerates and scores candidate sets with explainable components, but the weights still need human review against live rich graphs and product judgment.
- The process gates cannot fully verify truthfulness. Issue #41 adds independent process-review evidence to make self-grading harder, but a determined false claim can still pass.
- Demo-link evidence must now be durable for user-facing PRs. Residual risk: the checker validates a durable-evidence reference, not the artifact's truth.
- No browser test for manually tampered slider payloads. Malformed input is covered at the server request-shape boundary only.
- AI output *quality* is not automatically evaluated. Schema, instruction composition, and indicator mix are tested; whether the KRs are good is not.
- Hosted deployment is unverified and out of scope.
- `increment-check`'s report and state-coherence gates are covered by `test/increment-check.test.js` as of issues #31 and #32. Issue #43 adds fixture-repo coverage for secrets, freshness, budget, and duplicate hard-gate sections.
- The PR-report gate accepts an explicit written declaration that an increment is not user-facing, in place of a demo link. Silence still fails, but a false declaration would pass — this is one of the truthfulness limits above.
- Hard gates are authoritative in `ai-team/README.md`, and issue #43 adds a checker to block duplicate `## Hard gates` sections outside that canonical file.
- Issue #28 delegation-gate evidence: a low-cost `haiku` Tester worker checked policy consistency across `model-policy.md`, `increment.md`, and `README.md` (no contradictions found), then exercised the gate against sample PR bodies. It found five phrasings the first regex wrongly rejected, and after broadening, found two it wrongly accepted — "no delegation was needed" and "without delegation" were being read as evidence *of* delegation. A negation guard was added; 11 cases now behave correctly, including a mixed body that both delegates and declines to delegate.
- The delegation and process-review gates verify that a claim was made, not that it is true. They catch silence and weak reports, not deliberate misreporting.

## Verification rules

- Every increment needs a verification plan before implementation, per `ai-team/workflows/testing.md`.
- Prefer test-first for behaviorally clear work; explain any skip for a behavior change.
- Passing automated tests are necessary but not sufficient for user-facing work — a checked demo link is also required.
- Skipped checks must record the check, the reason, the risk, and whether `Done` is still possible.
- Failures are blocking unless there is evidence they are unrelated. Real out-of-scope failures become GitHub issues.
