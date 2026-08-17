# Offline Graph Generation Increment

Last updated: 2026-08-17

GitHub was unavailable when this increment started, so this file is the local shadow issue and increment report. Backfill it into GitHub when service returns.

## Shadow Issue

Summary: Characterize current graph generation before changing graph quality.

User outcome: The next graph-generation improvement should target a named failure mode instead of making broad prompt or fallback changes.

Acceptance criteria:

- [x] Current graph-generation path is mapped from browser/API to AI and deterministic fallback.
- [x] Deterministic fallback output is sampled across several objectives.
- [x] Concrete improvement candidates are identified and ordered for the next increment.
- [x] Verification plan and GitHub outage handling are recorded locally.

Verification plan:

- Automated: run `npm run check` after state updates.
- Manual: inspect `src/generator.js`, `src/ai-service.js`, `server.js`, and graph tests; sample fallback graphs for several objectives.
- Test-first: skipped because this increment characterizes existing behavior and does not change product behavior.
- Demo: not required for a non-behavioral characterization increment.

Scope:

- In scope: current generation mechanics, quality risks, local handoff.
- Out of scope: behavior changes, live AI quality evaluation, GitHub issue/project updates while GitHub is down.

Model use:

- Lead model: Codex.
- Delegation gate exception: no subagent used because the user is at 0% included usage, GitHub is unavailable, and current session instructions do not explicitly request subagents. Risk: less independent review; mitigated by keeping the increment read-only and running local checks.

## Current Generation Map

Browser: `public/app.js` calls `generateGraph`, which posts the objective to `/api/graph`.

API: `server.js` validates a non-empty objective, then calls `generateAiCausalMetricsGraph`.

AI path: `src/ai-service.js` sends a system instruction plus graph task prompt to the Responses API using strict JSON schema. It then normalizes nodes, edges, ids, stages, scores, directions, and returns rankings from local `rankVariables`.

Fallback path: if credentials are missing, the provider fails, or output is invalid, `src/generator.js` creates a deterministic graph from fixed node and edge blueprints.

Clarification path: user influenceability and gap ratings are applied after graph generation. They affect rankings and final KR selection, not the original generated graph structure.

## Findings

1. Deterministic fallback is structurally stable but too generic. Across objectives like onboarding activation, enterprise churn, and developer productivity, the node ids, edge topology, impacts, confidences, and ranking order are identical; only labels change.
2. Objective parsing is shallow. `extractFocus` removes a few verbs and stop words, then uses up to three remaining words. This creates awkward labels such as "enterprise churn success rate" for a reduction objective.
3. AI prompt asks for domain-specific variables, but normalization does not enforce quality beyond schema shape. It accepts disconnected edges, multiple outcome nodes, missing outcome edges, weak stage ordering, and thin domain coverage if the schema passes.
4. Ranking is local and formulaic. AI-supplied scores are not accepted as rankings; local ranking recomputes from impact, confidence, influenceability, gap, and type weight. This is good for consistency but can flatten domain nuance.
5. Tests cover structure, fallback diagnostics, instruction presence, KR mix, and trace redaction. They do not yet pin graph-quality expectations such as one outcome, connectedness to outcome, stage-forward edges, objective-sensitive fallback labels, or domain-specific diversity.

## Recommended Next Increment

Start with graph normalization quality gates, not prompt tuning. Add tests and validation for exactly one outcome node, all non-outcome nodes connected to the outcome through directed edges, no stage-regressing edges, and at least one evidence or experience path into the outcome. This improves both AI and fallback safety without live-provider spend.

After that, improve fallback objective sensitivity so reduction objectives produce natural labels and directions, then tune the AI prompt if needed.

## GitHub Backfill

When GitHub is back:

- Create issue: "Characterize current graph generation quality".
- Add to Project 4.
- Set Agent Status to `Review` if no code changes are added, or `In Progress` if the next behavior increment starts on this branch.
- Link branch `feature/0-graph-generation-characterization`.
- Paste this file as the issue context or completion comment.
