# Offline Graph Generation Increment

Last updated: 2026-08-17

GitHub was unavailable when this increment started, so this file is the local shadow issue and increment report. Backfill it into GitHub when service returns.

## Shadow Issue

Summary: Characterize and improve the AI graph-generation prompt before changing graph behavior.

User outcome: The next graph-generation improvement should make the AI-generated causal map richer and closer to the user’s manual Miro-style exploration, then converge that map into a usable planning graph.

Acceptance criteria:

- [x] Current AI graph-generation instructions, prompt size limits, schema limits, and normalization behavior are mapped.
- [x] The current 8-10 node prompt limit is identified as the likely cause of undersized graphs.
- [x] Rich-map-then-converge design choice is recorded for implementation.
- [x] Verification plan and GitHub outage handling are recorded locally.

Verification plan:

- Automated: run `npm run check` after state updates.
- Manual: inspect `src/ai-service.js`, graph prompt/schema tests, and the local graph request path.
- Test-first: skipped because this increment characterizes existing behavior and does not change product behavior.
- Demo: not required for a non-behavioral characterization increment.

Scope:

- In scope: current AI prompt mechanics, graph size constraints, convergence design, local handoff.
- Out of scope: behavior changes, live AI quality evaluation, GitHub issue/project updates while GitHub is down.

Model use:

- Lead model: Codex.
- Delegation gate exception: no subagent used because the user is at 0% included usage, GitHub is unavailable, and current session instructions do not explicitly request subagents. Risk: less independent review; mitigated by keeping the increment read-only and running local checks.

## Current Generation Map

Browser: `public/app.js` calls `generateGraph`, which posts the objective to `/api/graph`.

API: `server.js` validates a non-empty objective, then calls `generateAiCausalMetricsGraph`.

AI path: `src/ai-service.js` sends a system instruction plus graph task prompt to the Responses API using strict JSON schema. It then normalizes nodes, edges, ids, stages, scores, directions, and returns rankings from local `rankVariables`.

Fallback path: if credentials are missing, the provider fails, or output is invalid, `src/generator.js` creates a deterministic graph. This is not the focus of the next improvement.

Clarification path: user influenceability and gap ratings are applied after graph generation. They affect rankings and final KR selection, not the original generated graph structure.

## Findings

1. The AI graph prompt explicitly says: "Use 8 to 10 nodes, including exactly one outcome node at stage 4." This is probably too small for the intended causal-discovery workflow.
2. The schema allows 4 to 12 nodes and up to 16 edges, so both prompt and schema are biased toward a compact graph.
3. The product direction should support divergent causal mapping before convergence. The user’s manual Miro graph had roughly 52 nodes, so an 8-10 node AI graph is too much compression too early.
4. Convergence should be explicit: remove weak nodes, score planning usefulness, preserve causal branch coverage, keep useful paths, deduplicate by meaning, then let user clarification re-rank the shortlist.
5. The deterministic fallback is secondary for this work. Optimize the AI prompt and response contract first.

## Recommended Next Increment

Start with prompt/schema redesign for rich AI graph generation:

- ask for a rich `fullGraph` around 40-60 nodes;
- ask for a converged `planningGraph` around 12-18 nodes;
- require the model to explain why planning nodes survived convergence;
- preserve coverage across outcome evidence, experience measures, operating drivers, upstream constraints or capabilities, and failure modes;
- update tests to pin the exact graph prompt and schema limits before making live AI calls.

Then implement local convergence validation/scoring if model-only convergence is too unstable.

## GitHub Backfill

When GitHub is back:

- Create issue: "Characterize current graph generation quality".
- Add to Project 4.
- Set Agent Status to `Review` if no code changes are added, or `In Progress` if the next behavior increment starts on this branch.
- Link branch `feature/0-graph-generation-characterization`.
- Paste this file as the issue context or completion comment.
