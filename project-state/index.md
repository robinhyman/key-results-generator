# Index

Last updated: 2026-08-18

The only state file a session must read. Everything else is read on demand.

## Project

Local-first web app that turns an objective into graph-backed key results. The user enters an objective, the app generates a causal metrics graph, asks which metrics are most influenceable and where the gaps are, then synthesises 3-5 key results with explicit `leading`/`lagging` types and rationales. The app also explores algorithmic KR-set selection by ranking candidate sets from the planning graph.

AI generation runs server-side against the OpenAI Responses API with a deterministic local fallback. No persistence, accounts, or hosting.

## Run and verify

```
npm install          # also installs git hooks via prepare
npm start            # http://127.0.0.1:5173/
npm run build        # lint + unit/API/process tests
npm run test:browser # Playwright, needs: npx playwright install chromium
npm run check        # process gates (also run by git hooks and CI)
```

## Current state

`main` is green. Issues #1-#38 are closed. Process gates are enforced mechanically by `ai-team/bin/increment-check.mjs` via git hooks and the `Process / increment-check` CI job. Branch protection is active, so CI is binding.

Graph-generation work from the offline branch is merged: issue #38 is closed, PR #39 is merged, and Project 4 is Done. The shadow issue/report is in `project-state/offline-graph-generation.md`.

## Active work

See `project-state/task-ledger.md`, which owns active, blocked, and next work.

## Next action

Issue #43 is active on branch `chore/43-autonomous-closeout-evidence`: autonomous closeout, stronger evidence gates, Project status checks, and state compaction.

## Where things live

| Need | File |
|---|---|
| What the product is and how it is built | `project-state/status.md` |
| What the next session should do | `project-state/handoff.md` |
| Active, blocked, and next work items | `project-state/task-ledger.md` |
| Verification posture and known gaps | `project-state/verification.md` |
| Durable decisions and their reasons | `project-state/decisions.md` |
| History for closed increments #1-#22 | `project-state/archive/` |
| Team operating rules | `ai-team/README.md` |

## Operating guardrails

Read canonical hard gates in `ai-team/README.md`. `npm run check` enforces the mechanical subset; the rest is on the Lead and closeout review.
