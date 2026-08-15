# Session Close Workflow

Before ending a serious work session:

1. Update `project-state/status.md` with the current truth.
2. Update `project-state/handoff.md` with the next-session summary.
3. Update `project-state/task-ledger.md` with completed, active, blocked, and next tasks.
4. Update `project-state/verification.md` with checks run and remaining gaps.
5. Update `project-state/decisions.md` if any durable decisions were made.
6. Update the relevant GitHub issue or PR if one exists.
7. For product increments, confirm the Increment Definition Of Done in `ai-team/workflows/increment.md` is satisfied or record exactly what remains.
8. Record testing performed, skipped checks, known failures, and follow-up bugs in `project-state/verification.md`.
9. Record documentation impact, docs updated, docs skipped, and documentation follow-ups when applicable.
10. If the final response gives the user a local app/demo URL, confirm the server is still running immediately before responding and leave it running. If it is not running or cannot remain running, do not describe the URL as live.
11. For completed increments, run or record the retrospective before starting another increment.

The handoff must be short enough for a fresh Lead to read quickly.
