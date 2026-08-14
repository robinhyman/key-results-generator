# GitHub Workflow

GitHub provides the work queue, discussion record, and observable progress trail.

All agent-managed issues should live inside the repository's GitHub Project. Standalone issues are allowed only as a temporary fallback when the project is unavailable or the Lead lacks permission to update it.

## Issue Usage

Use GitHub issues for:

- Features
- Bugs
- Chores
- Technical debt worth tracking
- Deployment tasks
- Research spikes
- Product decisions
- Follow-up work discovered during implementation or testing

Do not create issues for:

- Duplicate work
- Vague ideas without a next action
- Tiny fixes that can be handled inside the current task
- Speculative refactors without user or technical value

## Recommended Project Statuses

Use the custom GitHub Project single-select field `Agent Status` for agent workflow state.

- Inbox
- Ready
- In Progress
- Review
- Blocked
- Done

## Project Rules

- Every actionable issue created by the Lead should be added to the GitHub Project.
- The GitHub Project status is the primary visible state for agent work.
- Issue comments should explain important progress, blockers, and verification results.
- Labels describe type, risk, and agent suitability; Project fields describe flow state and priority.
- If the Lead cannot add an issue to the Project, it must note that in the issue comment or session handoff.

## Recommended Labels

- `agent:ready`
- `agent:needs-human`
- `agent:blocked`
- `agent:small`
- `agent:medium`
- `agent:large`
- `type:feature`
- `type:bug`
- `type:chore`
- `type:docs`
- `risk:low`
- `risk:medium`
- `risk:high`

## Lead Authority

The Lead may:

- Create issues for actionable discovered work.
- Add agent-managed issues to the GitHub Project.
- Split large issues into smaller issues.
- Comment progress summaries on active issues.
- Link PRs to issues.
- Mark work blocked with a clear reason.
- Close issues only after acceptance criteria are verified.

The Lead must ask the user before:

- Creating a large backlog from a vague idea.
- Closing issues whose acceptance criteria changed materially.
- Changing project structure or labels in a way that affects existing workflow.

## Issue Template

```markdown
## Summary
What needs to be done.

## Why It Matters
The impact, user value, or risk.

## Acceptance Criteria
- [ ] Observable condition 1
- [ ] Observable condition 2

## Context
Links to related issue, PR, file, test, or session handoff.

## Suggested Owner
Lead / Architect / Builder / Tester / Reviewer / Release / Human

## Suggested Labels
type:feature, agent:ready, risk:low
```

## Bug Template

```markdown
## Bug
What went wrong.

## Reproduction
Steps or conditions that revealed it.

## Expected
What should happen.

## Actual
What happened.

## Evidence
Test output, screenshot, logs, file reference, or PR link.

## Scope
Whether this blocks the current task or should be handled separately.
```

## Agent Run Flow

1. Select or create a GitHub issue.
2. Confirm acceptance criteria.
3. Update issue status to In Progress.
4. Create a small task brief for any worker agent.
5. Implement, test, and review.
6. Update project state files.
7. Comment a concise result on the issue.
8. Open or update a PR when code is ready.
9. Move the issue to Review or Done only when verified.
