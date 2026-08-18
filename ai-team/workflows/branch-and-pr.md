# Branch And PR Policy

Tier: guidance. Hard gates are in `ai-team/README.md`.

This policy defines how code increments move from local work to reviewable change.

## Default Policy

- Use a branch or worktree per non-trivial code increment.
- Use direct commits to `main` only for project operating docs, tiny setup changes, or when the user explicitly approves direct-to-main work.
- Prefer draft PRs for code increments before final review.
- Link PRs to their GitHub issue.
- Do not merge or close the issue until the Increment Definition Of Done is satisfied.
- Routine low- and medium-risk PRs may be merged autonomously after `ai-team/workflows/merge-closeout.md` passes and no human-approval trigger applies.

## Branch Naming

Use short descriptive names:

- `feature/<issue-number>-short-name`
- `bug/<issue-number>-short-name`
- `chore/<issue-number>-short-name`
- `docs/<issue-number>-short-name`

If GitHub is unavailable and no issue number exists, use `ai-team/workflows/offline-backfill.md`.
A temporary `feature/0-short-name`, `bug/0-short-name`, `chore/0-short-name`, or `docs/0-short-name` branch is allowed only during that outage path.
Rename it to the real issue number before opening a PR, unless the report records why renaming was impractical.

## PR Requirements

Each PR should include:

- Linked issue.
- Summary of change.
- Acceptance criteria status.
- Test-first status.
- Verification run.
- Process-review evidence.
- Model use summary, including cheaper/faster worker tasks delegated, worker model tier, worker evidence, and any delegation exception.
- Demo/deployment link when available, plus durable evidence for user-facing changes.
- Project-status check result before merge/Done.
- Known risks or skipped checks.
- Follow-up issues.

## Human Approval

Ask for human approval before:

- Merging high-risk changes.
- Production deployment.
- Credential or secret changes.
- Destructive data operations.
- Billing, legal, or permission-impacting changes.
- Any change the Lead cannot confidently verify.

Robin approval is not required for routine low- or medium-risk increments when CI, process review, verification, Project status, and closeout checks pass, including operating-model maintenance covered by the standing autonomous-maintenance authority.

## Merge Guidance

Merge only when:

- Review is complete.
- Required checks pass or skipped checks are justified.
- The required cheaper/faster worker delegation evidence is present, or a documented delegation exception is justified.
- The target demo/deployment link has been checked.
- Durable demo evidence is present for user-facing changes, or the PR explicitly declares that no user-facing change applies.
- GitHub Project status and issue comments are current.
- `ai-team/workflows/merge-closeout.md` has passed.
