# Handoff

Last updated: 2026-08-18

What the next session should do. For what the product is see `status.md`; for history see `archive/`.

## Read first

`project-state/index.md`. Read further state files only if the task needs them.

## Where things stand

Issues #1-#28 are closed and merged. `main` is green: `npm run build` passes, `npm run test:browser` passes 1/1, and the `Process / increment-check` CI job passes.

All four operating-model audit increments are merged: #22 mechanical enforcement, #24 state compaction, #26 obligation tiering, #28 delegate-by-default.

Branch protection is enabled as of 2026-08-16: the `main: require increment-check` ruleset requires a PR and a passing `increment-check`, with no bypass actors. CI is now genuinely binding, which was the largest known enforcement gap.

GitHub was unavailable on 2026-08-17, so graph-generation work continued locally on `feature/0-graph-generation-characterization`. GitHub is back as of 2026-08-18: issue #38 exists, draft PR #39 is open with `increment-check` passing, and Project 4 has `Status=In Progress`, `Agent Status=Review`. The branch has a local rich graph contract implementation: the AI graph prompt asks for `fullGraph` plus `planningGraph`, the schema requires both, and normalization preserves the rich graph while using the planning graph for current rankings/KR flow. It also has an algorithmic KR-set explorer that enumerates candidate 3-5 KR sets and scores node quality, leading/lagging mix, branch coverage, causal connectedness, redundancy, externality, and user clarification effects. The shadow issue, implementation report, verification plan, delegation evidence, and backfill record are in `project-state/offline-graph-generation.md`.

## Next best actions

1. **Review PR #39.** Handle review feedback if any, then mark ready for review or merge per user direction.
2. **Finish issue #38 after merge.** Close via PR merge and move Project `Status`/`Agent Status` to Done.
3. **Start the next graph-generation improvement.** Recommended next behavior slice: render/inspect algorithmic candidate sets, then add local normalization quality gates for graph shape/connectivity, branch coverage, full/planning subset quality, and exactly-one-outcome validation.
4. **Run a delta retro on every increment.** Three fields in the increment report, per the tiered principle 10 adopted in #35. The full multi-role retrospective now runs only on a named trigger. No retrospectives are owed.

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
