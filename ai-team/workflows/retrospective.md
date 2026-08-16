# Retrospective Workflow

Tier: guidance. Hard gates are in `ai-team/README.md`.

The retrospective exists to improve the team's operating system without silently changing it.

Retrospectives come in two sizes. The default is small enough to run every time; the full version is reserved for increments that earned it.

## Delta Retrospective — the default

Run after every completed, blocked, or paused increment, before the next one starts. Three fields, written into the increment report or the issue comment. It should take a minute.

- **What slowed this down?** The specific friction, not a summary of the work.
- **What would you change in the operating model?** A file and a change, or "nothing".
- **Carried forward.** Any proposal worth acting on, or "none". Proposals still need user approval before anything is applied.

That is the whole ceremony. Do not expand it by habit.

## Full Retrospective — by trigger only

Run the full multi-role retrospective below when any of these is true:

- The increment failed, was blocked, or needed rework after review.
- A defect escaped to `main`.
- The work was high-risk: credentials, security, deployment, data loss, or architecture.
- A hard gate was violated, or a gate was found not to be working.
- Five increments have passed since the last full retrospective.
- The user asks for one.

Otherwise the delta retro is sufficient and the full one is waste.

The rule was previously "a full retrospective after every increment". Four increments in a row — #22, #24, #26, #28 — owed one and none ran, which is the same failure #28 diagnosed for the delegation gate: an obligation whose cost exceeds its convenience gets skipped, and the skipping becomes the norm. Tiering is the fix that keeps the cheap version enforceable.

## Inputs

The rest of this file describes the full retrospective. Skip it for a delta retro.

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

Add the retrospective summary to the completed increment's GitHub issue. A delta retro lives in the increment report; it does not need its own comment.

Use `ai-team/templates/retrospective-report.md` for a full retrospective. A delta retro needs no template — it is three fields.
