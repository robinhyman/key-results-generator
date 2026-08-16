# Session Start Workflow

## Always

1. Read `project-state/index.md`. It is the only state file required at startup.
2. Read `ai-team/README.md`.
3. Identify the active GitHub issue, or ask the user for one if no safe default exists.
4. State the intended next action, verification target, and model-use plan.

## Then, only what the task needs

| If the session will | Read |
|---|---|
| Deliver product progress | `ai-team/workflows/increment.md`, `ai-team/workflows/testing.md` |
| Create, refine, split, or triage issues | `ai-team/workflows/intake-and-specification.md` |
| Change code | `ai-team/workflows/branch-and-pr.md`, the relevant project profile |
| Change behavior, setup, architecture, deployment, user workflow, or operating rules | `ai-team/workflows/documentation.md` |
| Touch GitHub issues or Project fields | `ai-team/github-workflow.md` |
| Delegate substantial work | `ai-team/model-policy.md` |
| Need the full operating rules | `ai-team/constitution.md` |
| Need detail on a closed increment | `project-state/archive/` |

Keep startup context small. The mandatory read set is deliberately under 2,000 words; do not expand it by habit. Do not read old chats or long issue threads unless they are directly relevant to the active task.

Much of the process is enforced mechanically by `npm run check`, which also runs from the git hooks and CI. A rule that the checker enforces does not need to be read to be obeyed.

For product increments, the Lead should explicitly identify which tasks can be handled by cheaper/faster workers before implementation begins. If the Lead keeps routine builder, tester, documentation, or release work on a high-capability model, it must explain why in the increment report or handoff.
