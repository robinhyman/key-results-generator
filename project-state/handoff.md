# Handoff

Last updated: 2026-08-20

What the next session should do. For what the product is see `status.md`; for history see `archive/`.

## Read first

`project-state/index.md`. Read further state files only if the task needs them.

## Where things stand

Issues #1-#43, #46, #49, and #72 are closed and merged. `main` is green: `npm run build` passes, `npm run test:browser` passes 1/1, and the `Process / increment-check` CI job passes.

The application Architect review is complete. It inspected `server.js`, all `src/**`, all `public/**`, application tests, and the browser flow. Issues #52-#68 contain the resulting refactor and fix increments; every issue has bounded scope, acceptance criteria, verification, labels, Project 4 placement, `Agent Status=Ready`, and `Status=Todo`.

The maintainability ratchet, binding CI, branch protection, graph-generation increment, and operating-model audits are merged. Closed detail is in `project-state/archive/` and `project-state/offline-graph-generation.md`.

Issue #72 added the solution-design operating-doc workflow requested by Robin on 2026-08-20. PR #73 is merged, the issue is closed, and Project 4 shows Done.

## Next best actions

1. **Start #52.** Split the 932-line generator test suite into focused subsystem tests without changing production behavior.
2. **Continue #53-#56 in order.** Extract graph construction, ranking/clarification, candidate/path analysis, then KR selection/composition. Preserve current exports and response shapes during these refactors.
3. **Take independent safety fixes when useful.** #57-#61, #67, and #68 do not require the full generator decomposition. #62-#66 should follow the relevant extracted boundary.
4. **Run a delta retro on every increment.** Three fields in the increment report, per the tiered principle 10 adopted in #35.

## Architect review evidence

- `npm test`: 115/115 passed.
- `npm run test:browser`: 1/1 passed.
- Focused application coverage: 94.09% lines, 77.51% branches, 94.55% functions.
- `npm run check:maintainability:json`: green, no additional LLM review, zero cycles.
- Independent low-cost application review corroborated provider timeout, malformed-graph 500, stale browser state, graph invariants, KR mix, path determinism, objective size, and server-routing findings.
- No application code changed during the review/backlog increment.

## Deferred operating work

Checklist-style operating docs, a structured evidence manifest, generated state files, full AI-output evaluation, and exact cost telemetry remain deliberately deferred. Reassess only when evidence justifies the added machinery. Port proven OS improvements to `robinhyman/ai-team-operating-system`.

## Standing rules worth not rediscovering

- An increment is not `Done` without a checked demo link the user can open. If the link is local, the server must still be running when the link is handed over.
- Every increment needs a verification plan before implementation, and must report skipped checks, known failures, and follow-up bugs.
- Every code-changing increment needs lightweight solution design before implementation, or an explicit note that the issue spec is enough.
- Delegate at least one bounded routine task to a cheaper worker per increment, or document the exception with its risk.
- Operating-doc changes from a retrospective require user approval before being applied.
- The API key path exists locally and `keys/` is git-ignored. Never print, commit, or copy the value.
