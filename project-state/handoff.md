# Handoff

Last updated: 2026-08-16

What the next session should do. For what the product is see `status.md`; for history see `archive/`.

## Read first

`project-state/index.md`. Read further state files only if the task needs them.

## Where things stand

Issues #1-#22 are closed and merged. `main` is green: `npm run build` passes 39/39, `npm run test:browser` passes 1/1, and the `Process / increment-check` CI job passes.

Issue #26 (obligation tiering) is in progress on `docs/26-obligation-tiering`.

## Next best actions

1. **Enable branch protection on `main`** requiring the `Process / increment-check` status check. This is a repository setting only the user can apply. Until it exists, CI is advisory and hooks are bypassable with `--no-verify`, so the process gates are not truly binding.
2. **Finish #24**: confirm `npm run check` is clean with `stateBudget` and `reportSections` at `fail`, then merge.
3. **Choose the next product direction** with the user: durable persistence, graph editing, or hosted deployment.

## Remaining operating-model work

From the 2026-08-16 audit, approved by the user but not yet done:

- Consider rewriting operating docs from prose to checklists. Lower value now that tiering keeps most docs off the mandatory read path — reassess before spending on it.
- Nothing keeps gate restatements in workflow and role docs consistent with the canonical text in `ai-team/README.md`. A gate change currently needs a manual sweep; consider a checker rule.
- Add a process-review task to the increment workflow so a cheap worker checks the increment report against the DoD, breaking the Lead's self-grading loop.

Port anything that proves out to `robinhyman/ai-team-operating-system`.

## Standing rules worth not rediscovering

- An increment is not `Done` without a checked demo link the user can open. If the link is local, the server must still be running when the link is handed over.
- Every increment needs a verification plan before implementation, and must report skipped checks, known failures, and follow-up bugs.
- Delegate at least one bounded routine task to a cheaper worker per increment, or document the exception with its risk.
- Operating-doc changes from a retrospective require user approval before being applied.
- The API key path exists locally and `keys/` is git-ignored. Never print, commit, or copy the value.
