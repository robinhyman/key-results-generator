# Handoff

Last updated: 2026-08-15

## Summary

The initial team operating model has been drafted and pushed to a private GitHub repository: `robinhyman/key-results-generator`.

GitHub Project: `Key Results Generator` at `https://github.com/users/robinhyman/projects/4`

GitHub issue `#2 Build first local MVP for objective-to-key-results generation` is the first product increment. It has been implemented in draft PR #3 and is in the Project with `Agent Status: Review`.

GitHub issue `#4 Add AI-guided clarification step before key result generation` captures the clarified target product flow and is in the Project with `Agent Status: Ready`.

Clarified product flow: the app should not jump directly from objective input to final key results. It should first use AI to generate a causal/metrics tree, then ask the user which high-impact metrics are most influenceable and where the user perceives the biggest gaps, then use those answers to generate final KRs.

The constitution and GitHub workflow now explicitly require `Agent Status` to reflect reality, including moving an issue to `In Progress` as soon as meaningful work starts.

The team now has an explicit increment workflow and Increment Definition Of Done in `ai-team/workflows/increment.md`, plus an increment report template at `ai-team/templates/increment-report.md`.

Important rule: an increment is not `Done` unless it is available in the target demonstration environment and the completion notice includes a checked working link the user can open.

Testing rule: each increment must define a verification plan, follow `ai-team/workflows/testing.md`, and report automated checks, manual checks, skipped checks, known failures, and follow-up bugs.

TDD rule: prefer test-first development for behaviorally clear work. If skipped for a behavior change, explain why in the increment report.

Intake rule: use `ai-team/workflows/intake-and-specification.md` and `ai-team/templates/issue-spec.md` when turning goals or discoveries into GitHub issues.

Continuous improvement rule: after each increment, run `ai-team/workflows/retrospective.md`. Any constitutional or workflow improvement must be approved by the user before being applied, and approved changes should be committed before the next increment.

Role specs now include Project Lead, Architect, Builder, Tester, Reviewer, Release Agent, and Documentarian.

Documentation rule: use `ai-team/workflows/documentation.md` to assess docs on every increment. Required documentation updates are part of `Done`.

Reusable baseline repo: `robinhyman/ai-team-operating-system`, tagged `v0.1`.

This project is tagged at `ai-team-os-v0.1` as the pre-product baseline.

## Next Best Actions

1. Review PR #3 and issue `#2`.
2. Start the next implementation increment from issue `#4` after deciding whether PR #3 should be merged first.
3. Move issue `#4` to `Agent Status: In Progress` as soon as work begins.
4. Use the increment workflow, testing workflow, documentation workflow, branch/PR policy, and web app local-first profile.
5. Deliver a checked local app link before marking the increment `Done`.

## Resume Instructions

A fresh Lead should read:

- `ai-team/README.md`
- `ai-team/constitution.md`
- `ai-team/model-policy.md`
- `ai-team/github-workflow.md`
- `ai-team/workflows/increment.md`, when doing product work
- `ai-team/workflows/testing.md`, when doing product work
- `ai-team/workflows/intake-and-specification.md`, when creating or refining issues
- `ai-team/workflows/branch-and-pr.md`, when changing code
- `ai-team/workflows/documentation.md`, when behavior, setup, architecture, deployment, user workflow, or operating rules may change
- `ai-team/workflows/retrospective.md`, after each increment
- `ai-team/project-profiles/web-app-local-first.md`, for the first web app
- `project-state/status.md`
- `project-state/handoff.md`

Then work on issue `#4` unless the user redirects.
