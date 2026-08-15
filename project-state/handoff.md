# Handoff

Last updated: 2026-08-15

## Summary

The initial team operating model has been drafted and pushed to a private GitHub repository: `robinhyman/key-results-generator`.

GitHub Project: `Key Results Generator` at `https://github.com/users/robinhyman/projects/4`

GitHub issue `#1 Set up AI agent team operating system` is complete, closed, and has `Agent Status: Done`.

GitHub issue `#2 Build first local MVP for objective-to-key-results generation` is complete. It was merged via PR `#3`, closed, and set to `Agent Status: Done`.

GitHub issue `#4 Add AI-guided clarification step before key result generation` is reopened and ready. PR `#5 Add clarification step before final KRs` merged useful groundwork, but it did not complete the issue because the causal/metrics tree and final KR generation are still deterministic/local rather than AI-driven.

Clarified product flow: the app should not jump directly from objective input to final key results. It should first use AI to generate a causal/metrics tree, then ask the user which high-impact metrics are most influenceable and where the user perceives the biggest gaps, then use those answers to generate final KRs.

Architecture clarification: the causal/metrics graph is now treated as a first-class intermediate artefact, not disposable render state. It is represented as serializable structured data with nodes, edges, rankings, user influenceability/gap assessments, and traceable links to the final KRs. For this local-first increment, database persistence remains out of scope, but the model is ready to persist later without redesign.

Issue `#4` implementation status: partial. The generator now exports `generateCausalMetricsGraph`, `applyClarifications`, and `generateKeyResultsModel`; the UI now renders objective -> graph -> clarification controls -> final KRs. Final KRs are not populated until the clarification form is submitted. The missing acceptance criterion is real AI-backed graph generation and AI-synthesized final KRs.

AI credential status: the API key path was provided in a GitHub issue `#4` comment and the local file exists at that path. The `keys/` directory is ignored by Git and must remain untracked. Do not print, commit, or copy the key value into repo state, logs, issue comments, or chat.

The constitution and GitHub workflow now explicitly require `Agent Status` to reflect reality, including moving an issue to `In Progress` as soon as meaningful work starts.

The team now has an explicit increment workflow and Increment Definition Of Done in `ai-team/workflows/increment.md`, plus an increment report template at `ai-team/templates/increment-report.md`.

Important rule: an increment is not `Done` unless it is available in the target demonstration environment and the completion notice includes a checked working link the user can open.

Testing rule: each increment must define a verification plan, follow `ai-team/workflows/testing.md`, and report automated checks, manual checks, skipped checks, known failures, and follow-up bugs.

TDD rule: prefer test-first development for behaviorally clear work. If skipped for a behavior change, explain why in the increment report.

Cost-control rule: future increments must make a lightweight model-use plan before implementation. Use cheaper/faster worker models for bounded build, test, documentation, release, issue-summary, and mechanical-update tasks whenever practical. Reserve high-capability models for Lead/Architect judgement, ambiguity, integration, escalation, and final review. If substantial worker work stays on the Lead model, explain why in the increment report.

Intake rule: use `ai-team/workflows/intake-and-specification.md` and `ai-team/templates/issue-spec.md` when turning goals or discoveries into GitHub issues.

Continuous improvement rule: after each increment, run `ai-team/workflows/retrospective.md`. Any constitutional or workflow improvement must be approved by the user before being applied, and approved changes should be committed before the next increment.

Role specs now include Project Lead, Architect, Builder, Tester, Reviewer, Release Agent, and Documentarian.

Documentation rule: use `ai-team/workflows/documentation.md` to assess docs on every increment. Required documentation updates are part of `Done`.

Reusable baseline repo: `robinhyman/ai-team-operating-system`, tagged `v0.1`.

This project is tagged at `ai-team-os-v0.1` as the pre-product baseline.

## Next Best Actions

1. Implement real AI-backed causal/metrics tree generation and final KR synthesis for issue `#4`.
2. Choose the concrete AI model during implementation and record it in the increment report.
3. Preserve the existing structured graph and clarification UI from PR `#5` as groundwork.
4. Consider follow-up issue `#6 Add browser-level tests for clarification flow`, now in the Project with `Agent Status: Ready`.
5. Consider follow-up issue `#7 Improve GitHub Project status update tooling`, now in the Project with `Agent Status: Ready`.
6. Keep the local demo server running only while the user still needs the local app link.

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

Then continue issue `#4` unless the user redirects.

Current verification for issue `#4`:

- Test-first status: generator tests were added first and failed for the expected missing exports before implementation.
- Automated checks: `npm run build` passed after implementation.
- Low-cost worker evidence: `gpt-5.6-luna` Tester/Reviewer worker independently ran `npm run build`, confirmed 6/6 tests passed, inspected PR `#5` clarification flow and local-demo-server rule, and reported no merge-blocking bugs.
- Local demo: app server started at `http://127.0.0.1:5173/`.
- Local link check: HTTP `200`, page includes the clarification form and final key results section.
- Generator contract check: clarified `cycle-time` with influenceability/gap `5/5` becomes the first KR variable and graph assessments survive serialization-compatible model flow.
- Remaining coverage gap: no browser-level automated tests for slider submission, repeated objective generation, or malformed assessment inputs.
- Completion gap: no actual AI provider call or AI-backed generation path exists yet; PR `#5` should be treated as partial groundwork, not done.

## Issue #4 Retrospective

- Role inputs: Lead/Architect/Builder/Documentarian/Release perspectives were provided by the Lead; Tester/Reviewer input came from a low-cost `gpt-5.6-luna` worker.
- What went well: the clarified graph-first product requirement translated cleanly into test-first generator contracts; the local deterministic generator stayed dependency-free and serializable; the user feedback loop exposed operating gaps while there was still time to fix them.
- What went wrong or was harder than expected: the final local URL was initially reported after the server had been stopped; cheaper-worker delegation happened only after the user challenged the lack of evidence; GitHub Project status updates were not available through the exposed connector; most importantly, issue `#4` was incorrectly marked done even though no AI-driven generation had been implemented.
- Process gaps discovered: local demo links must be treated as live-process commitments, not historical verification notes; cheaper-worker delegation needed to be a hard gate; Project status update tooling needs documentation for the GitHub CLI fallback.
- Documentation gaps: the local-first profile, session-close workflow, model policy, increment workflow, branch/PR workflow, increment report template, and decisions log were updated after user approval.
- Improvements applied: local demo servers must remain running when sharing local URLs; product increments and PRs now require cheaper/faster worker delegation evidence or a documented exception.
- Follow-up issues created and added to the GitHub Project with `Agent Status: Ready`: `#6 Add browser-level tests for clarification flow`; `#7 Improve GitHub Project status update tooling`.
- Suggested further operating changes: none pending approval from this retrospective.

## Issue #2 Local Verification

- Local app URL checked: `http://127.0.0.1:5173/`
- Example objective submitted: `Expand enterprise customer retention`
- Browser check confirmed objective output, graph/model view, generated key results, ranking view, and no console errors.
- Automated checks passed with `npm run build`.
- PR `#3` merged into `main`.
- Final main-branch checks passed with `npm run build`.
- Final main-branch local app URL checked: `http://127.0.0.1:5173/`.
- Final HTML order confirmed: Objective, Generated key results, then Causal metrics graph.

## Issue #2 Retrospective

- What went well: the issue spec was strong enough to build without human clarification; test-first worked well for the deterministic graph/ranking logic; the no-dependency stack kept the local demo reliable.
- What was harder than expected: browser screenshot capture needed adjustment because full-page capture duplicated sticky content, and the sandbox required approvals for local server and Git metadata operations.
- Gaps discovered: future increments need a clearer product decision on external AI versus graph editing priority.
- Suggested operating changes: none applied. No constitution, workflow, template, role, model-policy, or profile change is proposed from this increment.
