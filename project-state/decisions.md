# Decisions

## 2026-08-14: Use Documented State Over Chat Memory

Decision: Persist project state in repo files so fresh sessions can resume cheaply.

Reason: Token efficiency matters, and long chat histories are expensive and fragile as operational memory.

## 2026-08-14: Use GitHub As Work Queue And Audit Trail

Decision: Use GitHub issues/projects to track work, bugs, acceptance criteria, progress, and PR links.

Reason: GitHub provides observability and portable context for Codex now and OpenClaw later.

## 2026-08-14: Start In Codex, Preserve OpenClaw Migration Path

Decision: Pilot the team in Codex using a Lead chat, short-lived subagents, and worktrees where useful.

Reason: Codex provides the lowest-friction local build, test, and review loop. OpenClaw can be considered later for always-on, multi-channel operation.

## 2026-08-14: Create Private GitHub Repository

Decision: Create `robinhyman/key-results-generator` as a private GitHub repository.

Reason: The project needs GitHub issues and future project tracking for observability while the agent team is developed.

## 2026-08-14: Require Agent Issues To Live In GitHub Project

Decision: Agent-managed issues should be added to the `Key Results Generator` GitHub Project and tracked with a custom `Agent Status` field.

Reason: Issues hold detailed context, while the Project gives a visible queue and workflow state for human observability.

## 2026-08-14: Keep GitHub Project Status Truthful

Decision: Move issues to `In Progress` as soon as meaningful work starts and keep `Agent Status` aligned with reality throughout the run.

Reason: The Project is the user's live observability surface, so stale statuses undermine trust in the agent team.

## 2026-08-15: Deliver Work In Increments

Decision: Use increments as the team's default delivery unit, with an explicit Increment Definition Of Done in `ai-team/workflows/increment.md`.

Reason: Increment boundaries prevent open-ended agent work, make verification clearer, and ensure each unit of progress can survive a fresh session.

## 2026-08-15: Done Requires A Checked Demonstration Link

Decision: An increment may be called `Done` only when it is deployed to, or running in, the target demonstration environment and the user receives a checked working app/demo link.

Reason: The user must be able to verify every completed increment directly. Implemented but unavailable work should remain `In Progress`, `Review`, or `Blocked`.
