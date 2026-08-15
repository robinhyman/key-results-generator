# Increment Workflow

An increment is a small, coherent unit of product progress that can be planned, built, reviewed, demonstrated, and either shipped or cleanly handed off.

The increment is the team's default unit of delivery. Avoid open-ended work. If a goal is too large for one increment, split it into smaller GitHub issues before implementation begins.

## Increment Lifecycle

1. Select or create one primary GitHub issue.
2. Confirm the issue has clear acceptance criteria.
3. Add the issue to the GitHub Project.
4. Set `Agent Status` to `In Progress` as soon as meaningful work starts.
5. Plan the smallest coherent change that satisfies the acceptance criteria.
6. Define the verification plan using `ai-team/workflows/testing.md`.
7. Delegate bounded worker tasks only when the work can be split safely.
8. Build, test, and review the change.
9. Deploy or start the target demonstration environment.
10. Check the linked app or demo and confirm the increment works there.
11. Capture follow-up work as separate GitHub issues when it is real, actionable, and out of scope.
12. Update project state files and the GitHub issue.
13. Move `Agent Status` to `Review`, `Blocked`, or `Done` according to the real current state.

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

- The verification plan from `ai-team/workflows/testing.md` has been followed or explicitly revised.
- Relevant tests pass.
- Behavior changes include automated test coverage unless the increment report explains why not.
- Build, lint, typecheck, or equivalent checks have run when applicable.
- For web work, the app has been run locally and the affected user flow has been checked.
- Known failures are classified as blocking, unrelated, or follow-up work.
- Skipped checks are documented with a reason.

### Demo Or Deployment Is Available

- The increment is deployed to, or running in, the target demonstration environment for the current project stage.
- The Lead has opened the app/demo link and confirmed the affected behavior works there.
- The completion report includes a working link the user can open.
- If the target environment is unavailable, the increment is not `Done`; it is `Blocked` or `Review` with the missing deployment/demo step documented.

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

- User-facing work has a verified app/demo link plus supporting evidence such as a screenshot, test result, or written verification note.
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
- Use `Done` only when the Increment Definition Of Done is satisfied and the user has a checked working link to verify the result.

## Increment Report

At the end of each increment, add a concise report to the GitHub issue and update `project-state/handoff.md`. A `Done` report must include the checked app/demo link.

Use `ai-team/templates/increment-report.md` when the work is substantial or when another session will continue from the result.
