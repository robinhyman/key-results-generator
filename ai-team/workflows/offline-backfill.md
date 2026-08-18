# Offline Backfill Workflow

Tier: guidance. Hard gates are in `ai-team/README.md`.

Use this only when GitHub issues, Projects, or PRs are unavailable and waiting would block useful local progress.

## Before Local Work

1. Confirm GitHub is unavailable or the required permission/API path is blocked.
2. Create a local shadow issue/report in `project-state/`. It must use the normal `Last updated: YYYY-MM-DD` stamp and stay compact enough to preserve the state-file budget discipline. Include:
   - summary and user outcome;
   - acceptance criteria;
   - verification plan;
   - target demonstration expectation;
   - model-use plan;
   - explicit GitHub backfill checklist.
3. Use a temporary branch name only if no issue number is available: `feature/0-short-name`, `bug/0-short-name`, `chore/0-short-name`, or `docs/0-short-name`.
4. Record the outage and shadow issue path in `project-state/handoff.md`.
5. Update `project-state/task-ledger.md` so active work still has one authoritative owner while GitHub is unavailable.

## During Local Work

- Keep the shadow report current enough that a fresh agent can continue without chat.
- Preserve the normal increment discipline: verification plan first, scoped changes, model-use evidence, process review, and state updates.
- Do not call the increment `Done` until GitHub backfill is complete, unless the user explicitly accepts a local-only result.

## Backfill When GitHub Returns

1. Create or update the real GitHub issue from the shadow report.
2. Add the issue to the GitHub Project and set `Agent Status` truthfully.
3. Rename the branch to use the real issue number before opening the PR, or record why it was impractical.
4. Open or update the PR with the shadow report content.
5. Link the PR and issue, update Project fields, and close the shadow report loop in `project-state/`. Archive completed shadow detail when it is no longer current state.
6. Run `npm run check` after state updates.

## Report

The final increment report must say:

- why the offline path was used;
- where the shadow issue/report lived;
- what was backfilled to GitHub;
- whether any branch-name or Project-status exception remains.
