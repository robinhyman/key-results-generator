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
