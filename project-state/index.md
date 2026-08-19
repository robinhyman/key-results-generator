# Index

Last updated: 2026-08-19

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

`main` is green. Issues #1-#43, #46, and #49 are closed. Process and maintainability gates run through git hooks and the binding `Process / increment-check` CI job. The maintainability ratchet uses free local static analysis and deterministic green/amber/red review routing.

Graph-generation work from the offline branch is merged: issue #38 is closed, PR #39 is merged, and Project 4 is Done. The shadow issue/report is in `project-state/offline-graph-generation.md`.

The 2026-08-19 application Architect review is captured as issues #52-#68. All are in Project 4 with `Agent Status=Ready` and `Status=Todo`. Issues #52-#56 form the ordered behavior-preserving generator refactor; #57-#68 are discrete reliability, contract, algorithm, browser-state, tracing, and server-hardening increments.

## Active work

See `project-state/task-ledger.md`, which owns active, blocked, and next work.

## Next action

Start issue #52: split the generator test monolith by subsystem. Then continue the ordered refactor through #56 before taking graph- and KR-domain fixes that depend on the extracted boundaries.

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
