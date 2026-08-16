# Branch And PR Policy

Tier: guidance. Hard gates are in `ai-team/README.md`.

This policy defines how code increments move from local work to reviewable change.

## Default Policy

- Use a branch or worktree per non-trivial code increment.
- Use direct commits to `main` only for project operating docs, tiny setup changes, or when the user explicitly approves direct-to-main work.
- Prefer draft PRs for code increments before final review.
- Link PRs to their GitHub issue.
- Do not merge or close the issue until the Increment Definition Of Done is satisfied.

## Branch Naming

Use short descriptive names:

- `feature/<issue-number>-short-name`
- `bug/<issue-number>-short-name`
- `chore/<issue-number>-short-name`
- `docs/<issue-number>-short-name`

## PR Requirements

Each PR should include:

- Linked issue.
- Summary of change.
- Acceptance criteria status.
- Test-first status.
- Verification run.
- Model use summary, including cheaper/faster worker tasks delegated, worker model tier, worker evidence, and any delegation exception.
- Demo/deployment link when available.
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

## Merge Guidance

Merge only when:

- Review is complete.
- Required checks pass or skipped checks are justified.
- The required cheaper/faster worker delegation evidence is present, or a documented delegation exception is justified.
- The target demo/deployment link has been checked.
- GitHub Project status and issue comments are current.
