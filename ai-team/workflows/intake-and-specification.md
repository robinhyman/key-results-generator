# Intake And Specification Workflow

This workflow defines how the Project Lead turns goals, ideas, bugs, and discoveries into GitHub issues that agents can safely execute.

## Lead Objective

The Lead should convert unclear intent into small, observable increments without losing the user's goal.

The Lead owns:

- Requirements shaping.
- Ticket creation.
- Issue decomposition.
- Acceptance criteria.
- Readiness checks.
- Labels and Project placement.
- Escalation to the user when a decision materially affects outcome, scope, cost, risk, or irreversible direction.

## Intake Sources

The Lead may create or update issues from:

- User goals or product ideas.
- Bugs discovered during implementation, testing, review, or demo.
- Technical debt that creates delivery risk.
- Missing tests or verification gaps.
- Deployment, hosting, or release work.
- Product decisions that block implementation.
- Follow-up work discovered during an increment.

Do not create issues for vague ideas, duplicates, speculative refactors, or tiny fixes that can be handled immediately inside the active increment.

## Intake Flow

1. Capture the user goal or discovered need.
2. Determine whether it is a feature, bug, chore, docs task, research spike, or decision.
3. Identify the user/business outcome.
4. Decide whether the work can fit into one increment.
5. Split large or mixed work before implementation begins.
6. Define observable acceptance criteria.
7. Define the verification plan and target demonstration environment.
8. Identify dependencies, constraints, risks, and required user decisions.
9. Create or update GitHub issues using `ai-team/templates/issue-spec.md`.
10. Add each actionable issue to the GitHub Project.
11. Apply labels for type, risk, and agent suitability.
12. Set `Agent Status` to `Inbox`, `Ready`, or `Blocked` based on readiness.

## Ready Criteria

An issue is `Ready` only when a fresh agent can start without hidden chat context.

Ready issues must have:

- A clear summary.
- A bounded increment scope.
- Observable acceptance criteria.
- A verification plan.
- A target demonstration environment or link expectation.
- Labels for type, risk, and agent size.
- Placement in the GitHub Project.
- No unresolved product decision that blocks implementation.
- Enough context to understand the work without reading prior chat.

If any of these are missing, keep the issue in `Inbox` or `Blocked`.

Use `agent:needs-human` when human input is required before implementation can safely start.

## Decomposition Rules

Split work into multiple issues when:

- It cannot be demonstrated as one coherent increment.
- It has multiple independent user outcomes.
- It touches multiple risky or unrelated subsystems.
- Acceptance criteria are too broad for one issue.
- Part of the work is discovery and part is implementation.
- A dependency must be resolved before implementation.
- A bug fix and a broader improvement are bundled together.

Create a research spike when the Lead cannot define acceptance criteria without investigation.

Create a decision issue when implementation is blocked by product, design, cost, risk, or operational choice.

## Questioning Rules

Ask the user only when the answer materially affects:

- Product behavior.
- Scope.
- Cost or schedule.
- Data model or architecture.
- Security, privacy, or permissions.
- Deployment or hosting.
- Irreversible or hard-to-reverse direction.

Do not ask the user about details that can be safely inferred from:

- Existing repository conventions.
- Existing issue context.
- Established team policy.
- Low-risk implementation choices.

When asking, ask precise questions and explain why the answer matters.

## Specification Quality

Good issue specs should be:

- Small enough for one increment.
- Written in observable behavior.
- Clear about what is out of scope.
- Clear about how the user will verify the result.
- Clear about expected testing.
- Clear about dependencies and blockers.
- Free of hidden assumptions from the chat.

Avoid over-specifying implementation unless architecture, safety, or consistency requires it.

## Agent Suitability

Use labels to guide model and role choice:

- `agent:small`: low-risk, clearly specified, suitable for a cheaper worker.
- `agent:medium`: normal implementation, needs builder plus Lead review.
- `agent:large`: too large or risky; should be decomposed before execution.
- `agent:needs-human`: requires user input or approval.
- `risk:high`: requires stronger-model review and possibly human approval.

## Issue Creation Rules

When creating an actionable issue, the Lead must:

- Add it to the GitHub Project.
- Set `Agent Status` to `Ready` only if the Ready Criteria are satisfied.
- Otherwise set `Agent Status` to `Inbox` or `Blocked`.
- Apply labels.
- Link related issues or PRs.
- Note any unanswered questions.

If the Lead cannot update the GitHub Project, it must say so in the issue comment and `project-state/handoff.md`.

