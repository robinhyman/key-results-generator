# Index

Last updated: 2026-08-16

The only state file a session must read. Everything else is read on demand.

## Project

Local-first web app that turns an objective into graph-backed key results. The user enters an objective, the app generates a causal metrics graph, asks which metrics are most influenceable and where the gaps are, then synthesises 3-5 key results with explicit `leading`/`lagging` types and rationales.

AI generation runs server-side against the OpenAI Responses API with a deterministic local fallback. No persistence, accounts, or hosting.

## Run and verify

```
npm install          # also installs git hooks via prepare
npm start            # http://127.0.0.1:5173/
npm run build        # lint + 39 unit/API tests
npm run test:browser # Playwright, needs: npx playwright install chromium
npm run check        # process gates (also run by git hooks and CI)
```

## Current state

`main` is green. Issues #1-#28 are closed. Process gates are enforced mechanically by `ai-team/bin/increment-check.mjs` via git hooks and the `Process / increment-check` CI job. Branch protection is active, so CI is binding.

## Active work

See `project-state/task-ledger.md`, which owns active, blocked, and next work.

## Next action

Merge the open audit-response PRs, then choose the next product direction: durable persistence, graph editing, or hosted deployment. The retrospectives owed for #22-#28 are still outstanding — see `handoff.md`.

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

## Hard gates

An increment is not `Done` without a checked demo link, a verification report, and truthful GitHub Project status. Operating-doc changes need user approval. Never commit credentials. `npm run check` enforces the mechanical subset; the rest is on the Lead.
