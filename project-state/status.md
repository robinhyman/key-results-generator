# Project Status

Last updated: 2026-08-15

## Current State

This repository contains the initial AI team operating artefacts plus the first local web-app MVP for objective-to-key-results generation, now merged into `main`.

The MVP is a dependency-free Node/local browser app. It can be started with `npm start` and opened at `http://127.0.0.1:5173/`.

The app lets a user enter an objective, generates an inspectable causal metrics graph, ranks influenceable variables, and produces four graph-backed key results with rationales.

The first generator is deterministic and local. It does not use external AI APIs, persistence, accounts, or hosting.

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

Closed GitHub issue: `#1 Set up AI agent team operating system`, `Agent Status: Done`.

Closed GitHub issue: `#2 Build first local MVP for objective-to-key-results generation`, merged via PR #3 and set to `Agent Status: Done`.

Active product increment: `#4 Add AI-guided clarification step before key result generation`, implemented on branch `feature/4-clarification-flow` with draft PR `#5`.

Merged pull request: `#3 Build local objective-to-KR MVP`

Open draft pull request: `#5 Add clarification step before final KRs`

Open follow-up issue: `#6 Add browser-level tests for clarification flow`

Open follow-up issue: `#7 Improve GitHub Project status update tooling`

## Active Goal

Finish issue `#4`: objective input, AI-generated causal/metrics tree, user clarification on influenceability and perceived gaps, then final KR generation.

Local implementation separates graph generation from final KR generation. `src/generator.js` exports a serializable graph step, applies user influenceability/gap assessments, and ranks final KRs from the clarified graph. The browser UI now shows the graph and clarification controls before final KRs are generated.

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
- Cost control is now explicit: future increments should use cheaper/faster worker models whenever possible and reserve stronger models for Lead, Architect, ambiguity, integration, escalation, and final review.
- Product requirements now explicitly include a clarification step before final KRs: the app asks the user which high-impact metrics are most influenceable and where the biggest perceived gaps are.
- The causal/metrics graph is treated as a first-class intermediate artefact: serializable structured data with nodes, edges, rankings, user influenceability/gap assessments, and links to final KRs.
- GitHub issue `#4` has a progress comment and draft PR `#5`. The current connector exposed issue comments and PR creation but not the GitHub Project `Agent Status` field update, so the Project field may still need manual or later-tool update to `Review`.

## Open Questions

- What hosted deployment target should be used for a future increment?
- Which AI provider/model and credential path should be used for the first real AI-backed generation increment?
- Should the next increment address browser-level clarification-flow tests (`#6`), GitHub Project status tooling (`#7`), durable persistence for clarified graph data, or real AI provider integration?
