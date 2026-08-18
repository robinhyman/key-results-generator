# AI Team Operating System

A reusable AI software delivery team. Harness-agnostic: it behaves identically under Codex, Claude, or OpenClaw.

> The chat is temporary. The repository is memory. GitHub tracks work.

Start each session by reading `project-state/index.md` and this file. Read nothing else by default. `ai-team/workflows/session-start.md` has the routing table for what to read when.

## Obligation tiers

Obligations come in three tiers. Under context pressure, drop from the bottom up — never the top.

1. **Hard gates** — listed below. Non-negotiable. Violating one is irreversible, unsafe, or destroys the user's ability to trust agent reports. Always keep these in context.
2. **Mechanically enforced** — checked by `npm run check`. A rule the checker enforces does not need to be read to be obeyed.
3. **Guidance** — everything else in `ai-team/`. Real rules, but advisory in the moment and read on demand. Each file declares its tier in its header.

## Hard gates

This file is authoritative on what these gates *say*. Workflow and role docs apply them in context — assigning a gate to a role, or expanding it into an operational checklist — and must never contradict or quietly extend them. When a gate changes, change it here first; if a restatement elsewhere then disagrees, this file wins.

1. **`Done` requires a checked link.** An increment is `Done` only when it runs in the target demonstration environment, the Lead has opened the link and confirmed the behavior, and the report gives the user a link they can open. If the link is local, the server must still be running when it is handed over.
2. **Never handle credentials unsafely.** Never print, commit, or copy a key value into repo files, logs, issue comments, or chat.
3. **Human approval before irreversible action.** Destructive operations, credential changes, production deployment, billing, legal commitments, and irreversible data changes require the user's approval first.
4. **Operating-doc changes need explicit authority.** The Lead may change the constitution, workflows, templates, role specs, model policy, or project profiles only when Robin has approved the change or a standing autonomous-maintenance policy covers it. Major operating-model direction changes still require Robin.
5. **Never hide failures.** Failing, skipped, or unrun checks must be reported explicitly, with their risk. Do not summarise them away.
6. **GitHub Project status must reflect reality.** Move an issue to `In Progress` when work starts, and update it promptly when it becomes blocked, enters review, or completes. If the Project cannot be updated, say so in the issue and the handoff.
7. **Every increment has a verification plan before implementation.** It may be brief, but it must exist.
8. **Every session leaves a fresh agent able to continue** from `project-state/` alone, without reading the chat.
9. **`Ready` means startable without hidden context.** Mark an issue `Ready` only when a fresh agent could begin from the issue, its links, and the repository.
10. **Split work too large for one increment** into smaller issues before implementation begins.
11. **Delegate at least one routine task per increment** to a cheaper model, or record the exception with its reason and risk.
12. **No concurrent agents on the same files** unless the Lead has assigned disjoint write scopes.

## Enforced mechanically

`npm run check` runs `ai-team/bin/increment-check.mjs` from the git hooks and from CI. It blocks credential material in commits, missing or stale state stamps, over-budget state files, non-conforming branch names, incomplete PR increment reports, and lint or build failures. Install the hooks with `npm run setup`; `npm install` does it automatically.

CI is the binding gate — hooks are bypassable with `--no-verify`.

## Everything else

| Need | File |
|---|---|
| Full operating rules and roles | `constitution.md` |
| What to read when | `workflows/session-start.md` |
| Delivery loop and Definition of Done | `workflows/increment.md` |
| Verification planning and failure handling | `workflows/testing.md` |
| Turning goals into issues | `workflows/intake-and-specification.md` |
| Branch, PR, and merge policy | `workflows/branch-and-pr.md` |
| Final checks, autonomous merge, and closeout | `workflows/merge-closeout.md` |
| Model tiers and delegation | `model-policy.md` |
| Issues, Projects, labels | `github-workflow.md` |
| Working while GitHub is unavailable | `workflows/offline-backfill.md` |
| Documentation standards | `workflows/documentation.md` |
| Retrospectives | `workflows/retrospective.md` |
| Role specs | `roles/` |
| Templates | `templates/` |
| Project-specific delivery rules | `project-profiles/` |
| Current project state | `project-state/index.md` |

Prefer autonomous merge for routine low- and medium-risk increments once the gates pass and no human-approval trigger applies.

Rules live only in `ai-team/`. No harness-specific instruction file may contain a rule — at most a pointer to this file.
