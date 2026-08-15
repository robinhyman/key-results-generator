# Project Status

Last updated: 2026-08-15

## Current State

This repository contains the initial AI team operating artefacts. No application code has been created yet.

The team now has an explicit increment workflow and Increment Definition Of Done in `ai-team/workflows/increment.md`.

An increment is not `Done` unless it is available in the target demonstration environment and reported with a checked working link.

Testing is a first-class increment gate. Use `ai-team/workflows/testing.md` for verification planning and failure handling.

Test-first development is preferred for behaviorally clear work and should be reported per increment.

Lead intake and ticket creation are governed by `ai-team/workflows/intake-and-specification.md`.

Role specs, branch/PR policy, web local-first project profile, and retrospective workflow are now defined.

Documentation standards are defined in `ai-team/workflows/documentation.md`, with a Documentarian role spec in `ai-team/roles/documentarian.md`.

Reusable baseline: `robinhyman/ai-team-operating-system` at tag `v0.1`.

This repository is tagged at `ai-team-os-v0.1` before product-specific work begins.

GitHub repository: `robinhyman/key-results-generator`

GitHub Project: `Key Results Generator` at `https://github.com/users/robinhyman/projects/4`

Active GitHub issue: `#2 Build first local MVP for objective-to-key-results generation`

## Active Goal

Build the first local MVP for objective-to-key-results generation using the AI team operating system.

## Current Runtime Assumption

- Codex main chat acts as Project Lead.
- Short-lived subagents handle bounded worker tasks.
- GitHub issues inside the `Key Results Generator` GitHub Project provide work tracking and observability.
- Repo state files provide compact continuation memory.
- Product work should be delivered in increments, each tied to one primary GitHub issue.
- Any `Done` notification for product work must include a checked app/demo link the user can open.
- Each increment must define and report its verification plan.
- New actionable tickets should use `ai-team/templates/issue-spec.md` and meet Ready Criteria before `Agent Status: Ready`.
- Each completed, blocked, or paused increment must have a retrospective before the next increment starts.
- Retrospective improvement proposals require user approval before operating files are changed.
- Documentation impact must be assessed for every increment, and required docs are part of `Done`.
- Future reusable operating-system improvements should be considered for `robinhyman/ai-team-operating-system`.

## Open Questions

- Should the first MVP use an external AI API if credentials are available, or keep the first increment deterministic/local?
