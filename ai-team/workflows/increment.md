# Increment Workflow

An increment is a small, coherent unit of product progress that can be planned, built, reviewed, demonstrated, and either shipped or cleanly handed off.

The increment is the team's default unit of delivery. Avoid open-ended work. If a goal is too large for one increment, split it into smaller GitHub issues before implementation begins.

## Increment Lifecycle

1. Select or create one primary GitHub issue.
2. Confirm the issue has clear acceptance criteria.
3. Add the issue to the GitHub Project.
4. Set `Agent Status` to `In Progress` as soon as meaningful work starts.
5. Plan the smallest coherent change that satisfies the acceptance criteria.
6. Delegate bounded worker tasks only when the work can be split safely.
7. Build, test, and review the change.
8. Capture follow-up work as separate GitHub issues when it is real, actionable, and out of scope.
9. Update project state files and the GitHub issue.
10. Move `Agent Status` to `Review`, `Blocked`, or `Done` according to the real current state.

## Increment Definition Of Done

An increment is done only when all applicable checks below are true.

### Scope Is Closed

- The linked GitHub issue has clear acceptance criteria.
- The implemented change matches the agreed scope.
- Out-of-scope discoveries are either deliberately ignored or captured as separate GitHub issues.
- No hidden partial implementation remains.

### Implementation Is Complete

- The intended behavior exists.
- The change is integrated locally or prepared in a PR.
- The work can be understood from the repository, issue, and state files without reading the chat.

### Verification Has Run

- Relevant tests pass.
- Build, lint, typecheck, or equivalent checks have run when applicable.
- For web work, the app has been run locally and the affected user flow has been checked.
- Skipped checks are documented with a reason.

### Review Has Happened

- The Lead or Reviewer has inspected the changed files.
- Risks, regressions, missing tests, and UX issues have been considered.
- Higher-risk work has stronger-model or human review.

### GitHub Reflects Reality

- The issue is in the GitHub Project.
- `Agent Status` is accurate.
- The issue has a concise progress or completion comment.
- Any PR is linked from the issue or uses GitHub closing keywords.
- Follow-up issues exist for discovered work that should not block the increment.

### State Is Persisted

- `project-state/status.md` reflects the current project state.
- `project-state/handoff.md` tells a fresh Lead what to do next.
- `project-state/task-ledger.md` reflects completed, active, blocked, and next tasks.
- `project-state/verification.md` records checks run and remaining gaps.
- `project-state/decisions.md` is updated when a durable decision was made.

### Evidence Exists

- User-facing work has a local demo, screenshot, test result, or written evidence showing the increment works.
- Non-visual work has test output, logs, or another concrete verification artifact.

### Next Increment Is Clear

- The next useful issue is identified or created.
- The current increment does not depend on hidden chat context.

## Status Guidance

- Use `Inbox` for raw work that has not been triaged.
- Use `Ready` when the issue has acceptance criteria and can be picked up.
- Use `In Progress` from the moment meaningful work begins.
- Use `Blocked` when progress cannot continue without external input or a dependency.
- Use `Review` when implementation is complete but review, approval, or final verification remains.
- Use `Done` only when the Increment Definition Of Done is satisfied.

## Increment Report

At the end of each increment, add a concise report to the GitHub issue and update `project-state/handoff.md`.

Use `ai-team/templates/increment-report.md` when the work is substantial or when another session will continue from the result.

