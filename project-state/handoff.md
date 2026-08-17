# Handoff

Last updated: 2026-08-17

What the next session should do. For what the product is see `status.md`; for history see `archive/`.

## Read first

`project-state/index.md`. Read further state files only if the task needs them.

## Where things stand

Issues #1-#28 are closed and merged. `main` is green: `npm run build` passes, `npm run test:browser` passes 1/1, and the `Process / increment-check` CI job passes.

All four operating-model audit increments are merged: #22 mechanical enforcement, #24 state compaction, #26 obligation tiering, #28 delegate-by-default.

Branch protection is enabled as of 2026-08-16: the `main: require increment-check` ruleset requires a PR and a passing `increment-check`, with no bypass actors. CI is now genuinely binding, which was the largest known enforcement gap.

GitHub was unavailable on 2026-08-17, so graph-generation work started locally on `feature/0-graph-generation-characterization`. The shadow issue, characterization findings, verification plan, and backfill steps are in `project-state/offline-graph-generation.md`.

## Next best actions

1. **Backfill the offline graph-generation characterization.** Create the GitHub issue, add it to Project 4, and set Agent Status to match the real state once GitHub is available.
2. **Start the next graph-generation improvement.** Recommended first behavior slice: add normalization quality gates for exactly one outcome, outcome connectivity, stage-forward edges, and evidence/experience paths.
3. **Run a delta retro on every increment.** Three fields in the increment report, per the tiered principle 10 adopted in #35. The full multi-role retrospective now runs only on a named trigger. No retrospectives are owed.

## Remaining operating-model work

From the 2026-08-16 audits, approved by the user but not yet done:

- Consider rewriting operating docs from prose to checklists. Lower value now that tiering keeps most docs off the mandatory read path — reassess before spending on it.
- Nothing keeps gate restatements in workflow and role docs consistent with the canonical text in `ai-team/README.md`. A gate change currently needs a manual sweep; consider a checker rule.
- Add a process-review task to the increment workflow so a cheap worker checks the increment report against the DoD, breaking the Lead's self-grading loop.
- Make demo evidence durable — a committed screenshot or recording rather than a `127.0.0.1` link that dies with the server.

### Deliberately deferred

Proposed by the 2026-08-16 external audit and declined for now, with reasons, so they are not silently rediscovered:

- **Structured YAML/JSON evidence manifest.** Section-scoped validation (#31) gets most of the benefit without a second format to keep in sync with the markdown template.
- **Generating `index`/`handoff`/`ledger` from one machine-readable source.** Over-engineered for six small files; #32 removes the duplicate ownership instead.
- **AI-output quality evaluation suite.** Real value, but it is its own project and premature before the next product direction is chosen.
- **Model cost and routing telemetry.** Token counts are not reliably observable from inside a session, and no decision currently waits on them.

Port anything that proves out to `robinhyman/ai-team-operating-system`.

## Standing rules worth not rediscovering

- An increment is not `Done` without a checked demo link the user can open. If the link is local, the server must still be running when the link is handed over.
- Every increment needs a verification plan before implementation, and must report skipped checks, known failures, and follow-up bugs.
- Delegate at least one bounded routine task to a cheaper worker per increment, or document the exception with its risk.
- Operating-doc changes from a retrospective require user approval before being applied.
- The API key path exists locally and `keys/` is git-ignored. Never print, commit, or copy the value.
