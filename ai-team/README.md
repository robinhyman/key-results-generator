# AI Team Operating System

This directory defines a reusable AI software delivery team. It is designed to run first in Codex, with a later migration path to OpenClaw or another always-on agent runtime.

Core principle:

> The chat is temporary. The repository is memory. GitHub tracks work.

Start each serious session by reading `project-state/index.md` and this file. Read nothing else by default.

`ai-team/workflows/session-start.md` has the routing table for what to read when. Use only the workflow or template files that match the current task.

Process is enforced mechanically, not by trust: `npm run check` runs `ai-team/bin/increment-check.mjs` from the git hooks and from CI, and blocks credential material, stale or missing state stamps, over-budget state files, non-conforming branch names, incomplete PR increment reports, and lint/build failures. Install the hooks with `npm run setup`; `npm install` does it automatically.

Rules live only in `ai-team/`. No harness-specific instruction file may contain a rule — at most a pointer to this file — so the operating model behaves identically under Codex, Claude, or OpenClaw.

For product work, use `ai-team/workflows/increment.md` as the default delivery loop.

For turning goals or discoveries into GitHub issues, use `ai-team/workflows/intake-and-specification.md`.

After each increment, use `ai-team/workflows/retrospective.md` before starting the next increment.

For documentation standards, use `ai-team/workflows/documentation.md`.

## Runtime Model

- The main Codex chat acts as Project Lead.
- The Lead may delegate bounded tasks to short-lived worker agents.
- Larger independent work can run in separate Codex tasks or worktrees.
- GitHub issues and projects provide the visible work queue.
- Project state files provide compact continuation context for fresh sessions.

## Delivery Unit

The default delivery unit is an increment: a small, coherent slice of progress represented by one primary GitHub issue, tracked in the GitHub Project, verified locally, and closed with durable state updates.

The initial project profile is `ai-team/project-profiles/web-app-local-first.md`.

Core role specs live in `ai-team/roles/`.

## Initial Project Profile

The first target is a web-based software project that can be built, tested, and demonstrated locally. Later, the same team should support hosted deployment.
