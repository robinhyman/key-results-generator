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

Use `ai-team/workflows/intake-and-specification.md` before creating or marking issues `Ready`.

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
- The GitHub Project `Agent Status` field is the primary visible state for agent work.
- `Agent Status` must reflect reality at all times, not just at session close.
- Move an issue to `In Progress` as soon as meaningful work starts on it.
- Move an issue to `Blocked` as soon as progress is blocked by missing information, permissions, failing external services, or a dependency outside the agent's control.
- Move an issue to `Review` when implementation is complete but still needs review, approval, final verification, or a checked demonstration link.
- Move an issue to `Done` only after acceptance criteria, required verification, and checked deployment/demo availability are satisfied.
- Issue comments should explain important progress, blockers, and verification results.
- Labels describe type, risk, and agent suitability; Project fields describe flow state and priority.
- If the Lead cannot add an issue to the Project, it must note that in the issue comment or session handoff.

## Project Status Fallback With GitHub CLI

When the GitHub connector can create or comment on issues but does not expose GitHub Project v2 mutations, use the GitHub CLI if it is authenticated with `project` scope.

1. Confirm authentication and scope:

```bash
gh auth status
```

2. Read Project field and option ids:

```bash
gh project field-list 4 --owner robinhyman --format json
```

3. Add an issue to the Project:

```bash
gh project item-add 4 --owner robinhyman --url https://github.com/robinhyman/key-results-generator/issues/NUMBER --format json
```

4. Read the Project id and item ids:

```bash
gh project view 4 --owner robinhyman --format json
gh project item-list 4 --owner robinhyman --format json --limit 100
```

5. Set the `Agent Status` field:

```bash
gh project item-edit --id ITEM_ID --project-id PROJECT_ID --field-id AGENT_STATUS_FIELD_ID --single-select-option-id OPTION_ID
```

Current Project constants:

- Project id: `PVT_kwHOACPlI84BgYKU`
- `Agent Status` field id: `PVTSSF_lAHOACPlI84BgYKUzhakixk`
- `Inbox`: `465e83e4`
- `Ready`: `b2f84160`
- `In Progress`: `35dfefe5`
- `Review`: `fc90e124`
- `Blocked`: `cebb2f4c`
- `Done`: `743a4795`

If CLI authentication is unavailable or lacks `project` scope, comment on the issue and update `project-state/handoff.md` with the exact Project update that remains blocked.

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

Prefer `ai-team/templates/issue-spec.md` for new actionable issues.

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
3. Add the issue to the GitHub Project if it is not already there.
4. Update `Agent Status` to `In Progress` before meaningful implementation, testing, or delegation begins.
5. Use `ai-team/workflows/increment.md` as the default delivery loop.
6. Create a small task brief for any worker agent.
7. Implement, test, and review.
8. Update `Agent Status` whenever reality changes.
9. Update project state files.
10. Comment a concise result or increment report on the issue.
11. Open or update a PR when code is ready.
12. Move the issue to `Review` or `Done` only when that status is true. `Done` requires a checked working app/demo link in the issue comment.
