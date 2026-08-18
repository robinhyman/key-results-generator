# Verification

Last updated: 2026-08-18

Current verification posture and known gaps. Per-increment verification history is in `archive/`.

## Current posture

- On the current local branch, `npm test` passes 95/95 unit, API, and process-checker tests. Covers the deterministic generator, graph and KR contracts, rich `fullGraph` plus converged `planningGraph` AI response contract, algorithmic KR-set exploration, server routing and validation, path-traversal rejection, AI instruction composition, 3-5 KR normalization, provider fallback diagnostics, indicator-type validation, and trace redaction.
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
- The process gates cannot verify truthfulness. An agent can write "Demo link checked" above a URL it never opened. Only an independent process-review step closes this, and only partially.
- Demo-link evidence is not durable. The demonstration link for this project is `http://127.0.0.1:5173/`, which is dead to anyone reading the PR later, so the gate can be audited only while the server is up. A committed screenshot or recording would outlive the link.
- No browser test for manually tampered slider payloads. Malformed input is covered at the server request-shape boundary only.
- AI output *quality* is not automatically evaluated. Schema, instruction composition, and indicator mix are tested; whether the KRs are good is not.
- Hosted deployment is unverified and out of scope.
- `increment-check`'s report and state-coherence gates are covered by `test/increment-check.test.js` as of issues #31 and #32. Its git-range, secrets, budget, and freshness checks are still verified only by manual runs — they need fixture repositories.
- The PR-report gate accepts an explicit written declaration that an increment is not user-facing, in place of a demo link. Silence still fails, but a false declaration would pass — this is one of the truthfulness limits above.
- Hard gates are authoritative in `ai-team/README.md`, but workflow and role docs still restate them in context — the demo-link gate appears in nine files. Nothing enforces that those restatements stay consistent with the canonical text, so a gate change needs a manual sweep.
- Issue #28 delegation-gate evidence: a low-cost `haiku` Tester worker checked policy consistency across `model-policy.md`, `increment.md`, and `README.md` (no contradictions found), then exercised the gate against sample PR bodies. It found five phrasings the first regex wrongly rejected, and after broadening, found two it wrongly accepted — "no delegation was needed" and "without delegation" were being read as evidence *of* delegation. A negation guard was added; 11 cases now behave correctly, including a mixed body that both delegates and declines to delegate.
- The delegation gate verifies that a claim was made, not that it is true. A Model Use section can assert delegation that did not happen and will pass. It catches silence, which is how the gate previously failed three increments running.

## Verification rules

- Every increment needs a verification plan before implementation, per `ai-team/workflows/testing.md`.
- Prefer test-first for behaviorally clear work; explain any skip for a behavior change.
- Passing automated tests are necessary but not sufficient for user-facing work — a checked demo link is also required.
- Skipped checks must record the check, the reason, the risk, and whether `Done` is still possible.
- Failures are blocking unless there is evidence they are unrelated. Real out-of-scope failures become GitHub issues.
