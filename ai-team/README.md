# AI Team Operating System

This directory defines a reusable AI software delivery team. It is designed to run first in Codex, with a later migration path to OpenClaw or another always-on agent runtime.

Core principle:

> The chat is temporary. The repository is memory. GitHub tracks work.

Start each serious session by reading:

1. `ai-team/constitution.md`
2. `ai-team/model-policy.md`
3. `ai-team/github-workflow.md`
4. `project-state/status.md`
5. `project-state/handoff.md`

Use only the extra workflow or template files that match the current task.

For product work, use `ai-team/workflows/increment.md` as the default delivery loop.

## Runtime Model

- The main Codex chat acts as Project Lead.
- The Lead may delegate bounded tasks to short-lived worker agents.
- Larger independent work can run in separate Codex tasks or worktrees.
- GitHub issues and projects provide the visible work queue.
- Project state files provide compact continuation context for fresh sessions.

## Delivery Unit

The default delivery unit is an increment: a small, coherent slice of progress represented by one primary GitHub issue, tracked in the GitHub Project, verified locally, and closed with durable state updates.

## Initial Project Profile

The first target is a web-based software project that can be built, tested, and demonstrated locally. Later, the same team should support hosted deployment.
