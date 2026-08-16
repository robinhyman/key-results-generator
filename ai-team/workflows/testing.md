# Testing Workflow

Tier: guidance. Hard gates are in `ai-team/README.md`.

Testing is a first-class part of every increment. The Lead owns verification, even when a Tester agent performs the work.

## Core Rules

- Every increment must have a verification plan before implementation begins.
- Prefer test-first development when the desired behavior is clear enough to specify.
- Behavior changes should add or update automated tests unless there is a clear reason not to.
- Passing automated tests are necessary but not sufficient for user-facing work.
- User-facing work also requires a checked app/demo link and evidence that the relevant flow works there.
- `Done` is forbidden while relevant tests are failing, unrun, or skipped without a documented reason.
- Bugs found during testing should be fixed inside the increment when in scope.
- Bugs outside the increment scope should be filed as GitHub issues and added to the Project.
- Known failing tests must be classified as blocking, unrelated, or follow-up work.

## Test-First Preference

Use test-first development as the default for behaviorally clear work. A failing test gives worker agents a concrete target, reduces drift, and makes handoffs easier for fresh sessions.

Prefer test-first for:

- Business logic.
- Data transforms.
- Validation rules.
- API behavior.
- Bug fixes with reproducible behavior.
- Permission and edge-case behavior.
- Regressions.
- State machines and workflows.
- Utility functions.
- Parser or generator behavior.

For bug fixes, reproduce the bug with a failing test before changing implementation when practical.

The test-first loop is:

1. Confirm acceptance criteria.
2. Write or update a test that captures the desired behavior.
3. Run the test and confirm it fails for the expected reason.
4. Implement the smallest change that makes the test pass.
5. Run the full relevant verification set.
6. Check the target app/demo link when user-facing behavior is affected.

The Lead or Reviewer should check that test-first tests express user, business, or contract behavior rather than implementation trivia.

Test-first may be skipped when:

- The work is exploratory UI or product discovery.
- Visual design is being shaped before behavior is stable.
- The task is deployment plumbing or third-party setup.
- A useful test would mostly duplicate implementation details.
- The increment is documentation-only or otherwise non-behavioral.

If test-first is skipped for a behavior change, the increment report must explain why and still include appropriate test-after or manual verification.

## Verification Plan

Before implementation, the Lead should identify:

- The behavior being protected.
- Existing tests that should pass.
- New or changed tests that are expected.
- Manual checks needed for confidence.
- The target demo environment and link requirement.
- Any high-risk areas needing stronger review.

For small documentation-only or configuration-only increments, the verification plan may be brief, but it must still exist.

## Default Web Project Checks

For web-based increments, use these checks when applicable:

- Dependency install or lockfile sanity check.
- Unit or component tests for isolated behavior.
- Integration tests for cross-module behavior.
- End-to-end or browser smoke test for critical user flows.
- Build check.
- Lint and typecheck.
- Local run check.
- Checked app/demo link in the target environment.
- Screenshot or visual confirmation for UI changes.
- Console and network error check where practical.
- Basic accessibility sanity check for interactive UI.

When adding or updating Playwright browser tests, verify that the required browser binary is installed before treating the test result as meaningful. For Chromium-only coverage, the standard setup command is:

```bash
npx playwright install chromium
```

If the first browser run fails because the browser binary is missing, install the binary and rerun the browser test before recording the check as failed product behavior.

## Tester Role

Use a Tester agent when verification can be performed independently from implementation.

The Tester should:

- Read the issue acceptance criteria and task brief.
- Run relevant existing checks.
- Add or suggest missing tests when behavior changed.
- Try edge cases and likely failure paths.
- Report exact commands, results, evidence, and gaps.
- Avoid changing implementation files unless explicitly assigned that scope.

For non-trivial increments, prefer a Tester who did not write the implementation.

## Skipped Checks

Skipped checks must be explicit. Record:

- The skipped check.
- Why it was skipped.
- The risk created by skipping it.
- Whether the increment can still be `Done`.
- Any follow-up issue needed.

An increment cannot be `Done` if a skipped check prevents the user from verifying the result.

## Failures

When a check fails:

- Treat it as blocking unless there is evidence it is unrelated.
- Record the failure in `project-state/verification.md`.
- Fix it inside the increment if it is in scope.
- File a GitHub issue if it is real but out of scope.
- Do not hide failures in summaries.

## Reporting

Every increment report must include:

- Test plan.
- Test-first status, or why test-first was skipped.
- Automated checks run.
- Manual checks run.
- Demo link checked.
- Known failures.
- Skipped checks and reasons.
- Follow-up bugs or testing gaps.
