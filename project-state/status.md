# Project Status

Last updated: 2026-08-15

## Current State

This repository contains the initial AI team operating artefacts plus the first local web-app MVP for objective-to-key-results generation, now merged into `main`.

The MVP is a dependency-free Node/local browser app. It can be started with `npm start` and opened at `http://127.0.0.1:5173/`.

The app lets a user enter an objective, generates an inspectable causal metrics graph, ranks influenceable variables, and produces graph-backed key results with rationales.

The first generator is deterministic and local. It does not use external AI APIs, persistence, accounts, or hosting.

The team now has an explicit increment workflow and Increment Definition Of Done in `ai-team/workflows/increment.md`.

An increment is not `Done` unless it is available in the target demonstration environment and reported with a checked working link.

Testing is a first-class increment gate. Use `ai-team/workflows/testing.md` for verification planning and failure handling.

Test-first development is preferred for behaviorally clear work and should be reported per increment.

Lead intake and ticket creation are governed by `ai-team/workflows/intake-and-specification.md`.

Role specs, branch/PR policy, web local-first project profile, and retrospective workflow are now defined.

Documentation standards are defined in `ai-team/workflows/documentation.md`, with a Documentarian role spec in `ai-team/roles/documentarian.md`.

Reusable baseline: `robinhyman/ai-team-operating-system` at tag `v0.1`.

This repository is tagged at `ai-team-os-v0.1` before product-specific work begins.

GitHub repository: `robinhyman/key-results-generator`

GitHub Project: `Key Results Generator` at `https://github.com/users/robinhyman/projects/4`

Closed GitHub issue: `#1 Set up AI agent team operating system`, `Agent Status: Done`.

Closed GitHub issue: `#2 Build first local MVP for objective-to-key-results generation`, merged via PR #3 and set to `Agent Status: Done`.

Closed GitHub issue: `#4 Add AI-guided clarification step before key result generation`, completed by PR #8 and set to `Agent Status: Done`.

Merged pull request: `#3 Build local objective-to-KR MVP`

Merged pull request: `#5 Add clarification step before final KRs` as partial groundwork for issue `#4`.

Closed follow-up issue: `#6 Add browser-level tests for clarification flow`, completed by PR #13 and set to `Agent Status: Done`.

Closed follow-up issue: `#7 Improve GitHub Project status update tooling`, completed by PR #13 and set to `Agent Status: Done`.

Closed architecture hardening issue: `#9 Harden server routing, validation, and AI fallback diagnostics`, completed by PR #13 and set to `Agent Status: Done`.

Closed architecture hardening issue: `#10 Split frontend workflow into focused browser modules`, completed by PR #13 and set to `Agent Status: Done`.

Closed duplicate issue: `#11 Add browser-level tests for the clarification workflow`, duplicate of `#6`, with `Agent Status: Done`.

Closed architecture hardening closeout issue: `#12 Document architecture hardening decisions and close the review iteration`, completed by PR #13 and set to `Agent Status: Done`.

Closed specification issue: `#14 Specify AI instructions for graph-first OKR generation`, approved by the user and set to `Agent Status: Done`.

Closed issue: `#15 Implement approved AI instruction structure in the generation service`, completed by PR #17 and set to `Agent Status: Done`.

Ready issue: `#16 Add regression checks for AI instruction and output quality`, unblocked after PR #17 and set to `Agent Status: Ready`.

## Active Goal

No active product increment. Issue `#15` is complete; issue `#16` is ready as the next quality/regression increment.

Local implementation separates graph generation from final KR generation. `src/generator.js` exports the deterministic structured graph and fallback KR path. `src/ai-service.js` now adds a server-side OpenAI Responses API boundary for AI-backed graph generation and AI-synthesized final KRs, validates structured output, applies user influenceability/gap assessments, and falls back to the deterministic generator when the provider is unavailable.

The browser UI calls local server endpoints instead of importing generator logic directly. It shows whether output came from AI or the local fallback. The API key remains server-only and is read from `OPENAI_API_KEY`, configured key path env vars, or ignored local `keys/key.txt`.

Current implementation includes server/API contract tests, robust public-file containment, structured JSON validation errors, safe AI fallback `reasonCode` metadata, a native ES module split for browser code, Playwright browser workflow coverage, and a documented GitHub CLI Project-status fallback.

Verification so far: for issue `#15`, `npm run build` passes with 24/24 unit/API tests, `npm run test:browser` passes with 1/1 Playwright workflow test, and the local app link `http://127.0.0.1:5176/` returns HTTP `200`.

The configured OpenAI API credential now has sufficient quota for the issue `#4` smoke checks. Real AI graph generation and final KR synthesis have been verified with `gpt-5-mini`; live local endpoints returned AI-mode graph and KR responses.

Issue `#15` updates the OpenAI Responses API request construction to use the user-approved shared system instruction, graph-generation prompt, and KR-synthesis prompt from issue `#14`. AI KR schema and normalization now accept 3 to 5 final KRs; deterministic fallback still returns 4 KRs, which remains valid. The leading/lagging KR mix is instruction-only until a future explicit `indicatorType` or classification rule is approved.

## Current Runtime Assumption

- Codex main chat acts as Project Lead.
- Short-lived subagents handle bounded worker tasks.
- GitHub issues inside the `Key Results Generator` GitHub Project provide work tracking and observability.
- Repo state files provide compact continuation memory.
- Product work should be delivered in increments, each tied to one primary GitHub issue.
- Any `Done` notification for product work must include a checked app/demo link the user can open.
- Each increment must define and report its verification plan.
- New actionable tickets should use `ai-team/templates/issue-spec.md` and meet Ready Criteria before `Agent Status: Ready`.
- Each completed, blocked, or paused increment must have a retrospective before the next increment starts.
- Retrospective improvement proposals require user approval before operating files are changed.
- Documentation impact must be assessed for every increment, and required docs are part of `Done`.
- Future reusable operating-system improvements should be considered for `robinhyman/ai-team-operating-system`.
- Cost control is now explicit: future increments should use cheaper/faster worker models whenever possible and reserve stronger models for Lead, Architect, ambiguity, integration, escalation, and final review.
- Product requirements now explicitly include a clarification step before final KRs: the app asks the user which high-impact metrics are most influenceable and where the biggest perceived gaps are.
- The causal/metrics graph is treated as a first-class intermediate artefact: serializable structured data with nodes, edges, rankings, user influenceability/gap assessments, and links to final KRs.
- GitHub issue `#4` is closed and has `Agent Status: Done`. The AI provider path is implemented and real-provider smoke checks pass. The API key path was provided in a GitHub issue comment and the local path exists; do not copy the key value into repo files, logs, issue comments, or chat.

## Open Questions

- What hosted deployment target should be used for a future increment?
- Should durable persistence or graph editing be the next product increment after architecture hardening?
