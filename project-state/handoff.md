# Handoff

Last updated: 2026-08-19

What the next session should do. For what the product is see `status.md`; for history see `archive/`.

## Read first

`project-state/index.md`. Read further state files only if the task needs them.

## Where things stand

Issues #1-#43, #46, and #49 are closed and merged. `main` is green at the remote baseline. The current local working tree implements issues #52-#68 and passes `npm test`, `npm run test:browser`, and `npm run check`.

The application Architect review backlog is implemented locally. Highlights: focused generator/AI test files, extracted graph/ranking/candidate/KR modules, provider timeouts, expected-provider-only fallback, HTTP request validation, stale clarification invalidation, semantic graph validation, shared KR set contracts, deterministic strength-aware candidate paths, separated graph/KR generation provenance, canonical server model DTOs, bounded AI trace rotation, and realpath static containment.

The maintainability ratchet, binding CI, branch protection, graph-generation increment, and operating-model audits are merged. Closed detail is in `project-state/archive/` and `project-state/offline-graph-generation.md`.

## Next best actions

1. **Publish the local implementation.** Create/use a `codex/` branch, commit the #52-#68 changes, push, open a PR, and let CI run.
2. **Close out Project 4.** Move #52-#68 to Done only after review/CI are complete, then comment/close each issue with verification evidence.
3. **Resume product work.** Render and inspect algorithmic candidate KR sets in the UI.

## Architect review evidence

- `npm test`: 147/147 passed for the local #52-#68 implementation.
- `npm run test:browser`: 2/2 passed for the local #52-#68 implementation.
- `npm run check`: passed; maintainability risk is amber because `src/ai/graph-validation.js` is approaching a budget, with zero dependency cycles.
- Focused checks passed: `node --test test/ai-key-results.test.js test/generator-candidates.test.js`; `node --test test/ai-tracing.test.js test/server.test.js`.
- Independent subagent reviews found no blocking implementation defects in the decompositions, provider handling, graph/KR contracts, path selection, DTO/provenance, trace rotation, or server-hardening changes after the latest fixes.
- Browser demo link used by Playwright: `http://127.0.0.1:5173/`.
- Earlier Architect evidence: `npm test` 115/115, `npm run test:browser` 1/1, focused application coverage 94.09% lines / 77.51% branches / 94.55% functions, maintainability green, and no dependency cycles.

## Deferred operating work

Checklist-style operating docs, a structured evidence manifest, generated state files, full AI-output evaluation, and exact cost telemetry remain deliberately deferred. Reassess only when evidence justifies the added machinery. Port proven OS improvements to `robinhyman/ai-team-operating-system`.

## Standing rules worth not rediscovering

- An increment is not `Done` without a checked demo link the user can open. If the link is local, the server must still be running when the link is handed over.
- Every increment needs a verification plan before implementation, and must report skipped checks, known failures, and follow-up bugs.
- Delegate at least one bounded routine task to a cheaper worker per increment, or document the exception with its risk.
- Operating-doc changes from a retrospective require user approval before being applied.
- The API key path exists locally and `keys/` is git-ignored. Never print, commit, or copy the value.
