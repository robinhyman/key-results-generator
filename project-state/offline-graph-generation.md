# Offline Graph Generation Increment

Last updated: 2026-08-18

GitHub was unavailable when this work started, so this file is the local shadow issue and increment report. Backfill it into GitHub when service returns.

## Shadow Issue

Summary: Refactor AI graph generation toward rich-map-then-converge behavior, then explore algorithmic KR-set selection.

User outcome: The next graph-generation improvement should make the AI-generated causal map richer and closer to the user’s manual Miro-style exploration, then converge that map into a usable planning graph.

Acceptance criteria:

- [x] Current AI graph-generation instructions, prompt size limits, schema limits, and normalization behavior are mapped.
- [x] The current 8-10 node prompt limit is identified as the likely cause of undersized graphs.
- [x] Rich-map-then-converge design choice is recorded for implementation.
- [x] Verification plan and GitHub outage handling are recorded locally.
- [x] Graph-generation tests pin the provider prompt and schema contract for `fullGraph` plus `planningGraph`.
- [x] `src/ai/prompts.js` asks for a broad `fullGraph` and converged `planningGraph`, not 8-10 compressed nodes.
- [x] `src/ai/schemas.js` supports the richer graph response contract.
- [x] Normalization preserves `fullGraph`, uses `planningGraph` for current nodes/rankings, and keeps the current UI/KR path working.
- [x] Add an algorithmic KR-set explorer that enumerates candidate sets and scores set quality, not just individual node rank.
- [x] Expose ranked candidate KR-set alternatives with score components for node quality, indicator mix, branch coverage, connectedness, redundancy, and externality.
- [x] Use the top algorithmic 4-KR candidate set for the deterministic KR path while keeping the explorer capable of 3-5 item alternatives.
- [x] GitHub backfill is complete: issue #38, Project status, branch push, and draft PR #39 are backfilled.

Verification plan:

- Test-first: add failing mocked-provider tests for graph prompt/schema expectations and normalization of `fullGraph` plus `planningGraph`; add failing local tests for algorithmic candidate-set ranking, branch coverage, clarification re-ranking, and exposure in the KR model.
- Automated: run targeted node tests, `npm run build`, then `npm run check` after state updates.
- Manual: inspect `src/ai/prompts.js`, `src/ai/schemas.js`, `src/ai/normalize.js`, `src/generator.js`, `src/ai-service.js`, and the local graph/KR request path.
- Browser: skip `npm run test:browser` because this slice changes the server-side AI response contract and preserves the existing rendered planning graph shape.
- Demo: no user-facing demo link is required for this server-side contract slice; do not call the increment `Done` until GitHub backfill is possible.

Scope:

- In scope: AI graph prompt, response schema, mocked-provider normalization, algorithmic candidate KR-set exploration, local state/report updates.
- Out of scope: live AI quality evaluation, UI for inspecting `fullGraph` or candidate sets, browser changes, GitHub issue/project updates while GitHub is down.

Model use:

- Lead model: Codex.
- Delegated worker: `gpt-5.6-luna` subagent "Godel" performed a read-only cross-check of tests/state/process needs. It recommended pinning `fullGraph`/`planningGraph`, ranking from `planningGraph`, retaining convergence metadata, and updating this local report plus verification/handoff/ledger state.
- Delegated worker: `gpt-5.6-luna` subagent "Ptolemy" performed a read-only cross-check for the KR-set explorer. It recommended tests for unique candidate enumeration, indicator-mix scoring, branch coverage, redundancy penalties, ranked distinct alternatives, and process/state updates.

## Implementation Report

Status: Done. GitHub backfill is complete, PR #39 is merged, issue #38 is closed, and Project 4 is Done.

Changed files:

- `test/generator.test.js`: added mocked-provider tests for rich graph prompt/schema and normalization preserving `fullGraph` while ranking `planningGraph`.
- `src/ai/prompts.js`: replaced the 8-10 node instruction with a 40-60 node `fullGraph` and 12-18 node `planningGraph`, with explicit convergence criteria and branch coverage.
- `src/ai/schemas.js`: changed graph response schema to require `summary`, `fullGraph`, and `planningGraph`; `planningGraph` nodes require `convergenceRationale`.
- `src/ai/normalize.js`: normalizes both graph layers, caps `fullGraph` at 70 nodes/120 edges and `planningGraph` at 20 nodes/32 edges, and keeps existing `nodes`, `edges`, and `rankings` derived from the planning graph.
- `src/generator.js`: adds `exploreKeyResultSets`, enumerating candidate KR sets and ranking them by node quality, leading/lagging mix, branch coverage, selected causal connections, redundancy penalties, externality penalties, and user clarification scores.
- `src/ai-service.js`: includes local algorithmic candidate sets in KR models and uses the same algorithmic selector for fallback KRs.

Verification results so far:

- Targeted rich graph contract tests: passed after implementation.
- Targeted algorithmic KR-set tests: passed after implementation.
- `npm test`: passed 95/95.
- `npm run build`: passed 95/95.
- `npm run check`: passed.
- PR #39 `increment-check`: passed on GitHub.
- PR #39: merged on 2026-08-18.
- `npm run test:browser`: skipped; no browser behavior changed.

## Current Generation Map

Browser: `public/app.js` calls `generateGraph`, which posts the objective to `/api/graph`.

API: `server.js` validates a non-empty objective, then calls `generateAiCausalMetricsGraph`.

AI path: `src/ai-service.js` sends a system instruction plus graph task prompt to the Responses API using strict JSON schema. It then normalizes nodes, edges, ids, stages, scores, directions, and returns rankings from local `rankVariables`.

Fallback path: if credentials are missing, the provider fails, or output is invalid, `src/generator.js` creates a deterministic compact planning graph. This is not the focus of this improvement.

Clarification path: user influenceability and gap ratings are applied after graph generation. They affect rankings and final KR selection over the planning graph, not the rich `fullGraph`. The KR model now also carries `candidateKeyResultSets`, a local algorithmic ranking of alternative 3-5 KR sets.

## Findings

1. The AI graph prompt explicitly says: "Use 8 to 10 nodes, including exactly one outcome node at stage 4." This is probably too small for the intended causal-discovery workflow.
2. The schema allows 4 to 12 nodes and up to 16 edges, so both prompt and schema are biased toward a compact graph.
3. The product direction should support divergent causal mapping before convergence. The user’s manual Miro graph had roughly 52 nodes, so an 8-10 node AI graph is too much compression too early.
4. Convergence should be explicit: remove weak nodes, score planning usefulness, preserve causal branch coverage, keep useful paths, deduplicate by meaning, then let user clarification re-rank the shortlist.
5. The deterministic fallback is secondary for this work. Optimize the AI prompt and response contract first.

## Recommended Next Increment

Implement an inspection surface for algorithmic KR-set alternatives:

- render the top candidate sets and their score components;
- compare the algorithmic top set against any AI-selected KRs;
- add normalization quality gates for graph shape/connectivity, branch coverage, subset quality, and exactly-one-outcome validation;
- decide whether final KR selection should always be algorithmic, AI-critiqued, or user-selected from alternatives.

## GitHub Backfill

Completed on 2026-08-18:

- Create issue: "Generate rich causal map and explore algorithmic KR-set selection". Backfilled as issue #38 on 2026-08-18.
- Add to Project 4. Completed on 2026-08-18.
- Set Agent Status to `Review`. Completed on 2026-08-18.
- Link branch `feature/0-graph-generation-characterization`. Completed on 2026-08-18.
- Push the branch. Completed on 2026-08-18.
- Open a PR with this file as the issue context or completion comment. Completed as draft PR #39 on 2026-08-18: https://github.com/robinhyman/key-results-generator/pull/39.
- Merge PR #39, close issue #38, and move Project status to Done. Completed on 2026-08-18.
