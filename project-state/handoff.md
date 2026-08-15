# Handoff

Last updated: 2026-08-15

## Summary

The initial team operating model has been drafted and pushed to a private GitHub repository: `robinhyman/key-results-generator`.

GitHub Project: `Key Results Generator` at `https://github.com/users/robinhyman/projects/4`

GitHub issue `#2 Build first local MVP for objective-to-key-results generation` is the first product increment. It has been moved from `Ready` to `In Progress`, implemented locally on branch `feature/2-local-mvp`, and opened as draft PR `#3`.

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

1. Review draft PR `#3`: `https://github.com/robinhyman/key-results-generator/pull/3`.
2. Keep the local app running with `npm start` when handing a checked demo link to the user.
3. Merge PR `#3` and close issue `#2` only after the user is satisfied with the local demo.
4. Choose the next increment: hosted deployment, external AI-backed generation, or richer graph editing.

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

Then continue issue `#2` closeout unless the user redirects.

## Issue #2 Local Verification

- Local app URL checked: `http://127.0.0.1:5173/`
- Example objective submitted: `Expand enterprise customer retention`
- Browser check confirmed objective output, graph/model view, generated key results, ranking view, and no console errors.
- Automated checks passed with `npm run build`.

## Issue #2 Retrospective

- What went well: the issue spec was strong enough to build without human clarification; test-first worked well for the deterministic graph/ranking logic; the no-dependency stack kept the local demo reliable.
- What was harder than expected: browser screenshot capture needed adjustment because full-page capture duplicated sticky content, and the sandbox required approvals for local server and Git metadata operations.
- Gaps discovered: future increments need a clearer product decision on external AI versus graph editing priority.
- Suggested operating changes: none applied. No constitution, workflow, template, role, model-policy, or profile change is proposed from this increment.
