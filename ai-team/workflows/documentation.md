# Documentation Workflow

Tier: guidance. Hard gates are in `ai-team/README.md`.

Documentation is part of delivery when an increment changes behavior, setup, architecture, deployment, user workflow, or operating rules.

## Core Rules

- Durable truth belongs in the repository, not chat.
- Keep documentation short, current, and action-oriented.
- Update existing docs before creating new ones.
- Avoid duplicating the same truth across multiple files.
- Remove or correct stale docs when discovered.
- If documentation is affected but not updated, explain why in the increment report.
- Constitution, workflow, role, model-policy, and project-profile changes from retrospectives require user approval before editing.

## Documentation Impact Check

Every increment should answer:

- Does this change user behavior?
- Does this change setup, build, test, deployment, or operations?
- Does this change architecture, data flow, dependencies, or constraints?
- Does this change how agents should work?
- Does this make existing docs wrong or incomplete?

If yes to any, update docs or record why not.

## Where To Put Information

- Team operating rules: `ai-team/constitution.md`
- Role behavior: `ai-team/roles/`
- Workflows: `ai-team/workflows/`
- Reusable templates: `ai-team/templates/`
- Project-specific delivery rules: `ai-team/project-profiles/`
- Current project truth: `project-state/status.md`
- Next-session handoff: `project-state/handoff.md`
- Durable decisions: `project-state/decisions.md`
- Verification history and gaps: `project-state/verification.md`
- Task state: `project-state/task-ledger.md`
- App usage/setup docs: app README or app docs once application code exists

## Decision Records

Update `project-state/decisions.md` when a decision:

- Changes architecture or data flow.
- Changes deployment or operations.
- Changes team operating rules.
- Has meaningful tradeoffs.
- Would be expensive or confusing to rediscover later.

Do not record every minor implementation choice as a durable decision.

## Increment Documentation Checks

Before an increment can be `Done`:

- Documentation impact has been assessed.
- Required docs are updated.
- Stale or conflicting docs are fixed or captured as follow-up issues.
- Skipped documentation is explained.
- State files are updated for fresh-session continuity.

## Reporting

Every increment report must include:

- Docs affected.
- Docs updated.
- Docs skipped and why.
- Stale docs found.
- Documentation follow-up issues.

