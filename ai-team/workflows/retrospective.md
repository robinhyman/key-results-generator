# Retrospective Workflow

Tier: guidance. Hard gates are in `ai-team/README.md`.

Run a retrospective after each completed, blocked, or paused increment before starting the next increment.

The retrospective exists to improve the team's operating system without silently changing it.

## Inputs

Collect concise inputs from each role that materially participated:

- Project Lead
- Builder
- Tester
- Reviewer
- Release Agent
- Documentarian, if documentation changed
- Architect, if architecture was involved

For roles not separately staffed, the Lead may provide that perspective, but must label it clearly.

## Questions

Each participating role should answer:

- What went well?
- What went wrong or was harder than expected?
- What slowed the increment down?
- What risks, defects, or gaps were discovered?
- Were the issue spec, acceptance criteria, and verification plan good enough?
- Were documentation updates sufficient and in the right place?
- Did the GitHub Project status reflect reality throughout?
- Did the checked demo/deployment link requirement work cleanly?
- Should any operating rule, template, workflow, or role spec change?

## Improvement Proposals

Suggested improvements should be specific and actionable.

Each proposal must include:

- The problem observed.
- The proposed change.
- The file or process to update.
- Expected benefit.
- Possible downside or cost.
- Whether it should apply immediately or later.

## User Approval Required

The Lead must not change the constitution, workflows, templates, role specs, project profile, or model policy based on a retrospective without user approval.

The Lead may prepare a proposed patch or summary, but must ask the user to approve the improvement before applying it.

If approved, update the relevant operating files before starting the next increment.

If rejected or deferred, record the outcome in the retrospective report or issue comment.

## Reporting

Add the retrospective summary to the completed increment's GitHub issue.

Use `ai-team/templates/retrospective-report.md` when the increment involved code, multiple roles, unexpected issues, or suggested constitutional changes.
