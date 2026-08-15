# Model Policy

Use the cheapest model that can reliably complete the role. Escalate capability when uncertainty, risk, or integration complexity increases.

Cost control is an operating requirement, not a preference. The Lead must actively look for work that can be delegated to cheaper/faster worker models and should reserve high-capability models for leadership, architecture, ambiguity, integration judgement, and final review.

## Default Tiers

### High-Capability Model

Use for:

- Project Lead on substantial work
- Architecture decisions
- Ambiguous requirements
- Multi-file integration
- Final review before PR or handoff
- Security, auth, billing, data loss, deployment, or migration work
- Deciding whether to split or create GitHub issues

Avoid using for:

- Routine file edits with clear acceptance criteria
- Running tests, builds, lint, or smoke checks
- Straightforward documentation updates
- Mechanical issue comments, summaries, or state-file updates
- Simple UI copy/layout tweaks after the design intent is clear

### Mid-Capability Model

Use for:

- Feature implementation with clear scope
- Bug fixes with reproducible behavior
- Refactors inside known boundaries
- Debugging with logs or failing tests
- Local demo setup

### Low-Cost Worker Model

Use for:

- Test writing from clear acceptance criteria
- Running routine test, lint, build, and smoke checks
- Lint and formatting fixes
- Documentation drafts
- Simple UI copy or layout adjustments
- Issue summarization
- Repetitive checks
- Mechanical updates with low blast radius

## Escalation Rules

Escalate to a stronger model when:

- The task touches architecture, data models, authentication, payments, permissions, deployment, or destructive operations.
- The worker reports uncertainty.
- Tests fail for unclear reasons.
- The verification plan is ambiguous or the risk of missing coverage is high.
- Multiple issues appear coupled.
- A change would affect many files or shared behavior.

## Delegation Rules

- Before implementation begins, the Lead must identify which parts of the increment can be delegated to mid-capability or low-cost workers.
- For every product increment, the Lead must delegate at least one routine worker task to a cheaper/faster model before the increment is reported for review or completion, unless a documented exception applies.
- Default delegated tasks are routine verification, build/test runs, focused review, documentation checks, release-note drafts, issue/PR summaries, and mechanical updates with clear inputs, bounded scope, and low blast radius.
- The Lead may skip delegation only when delegation overhead would exceed the task cost, the task is too small to split, no subagent/tooling path is available, or the task requires continuous architectural judgement.
- Any skipped delegation must be recorded in the increment report and PR with the reason, risk, and what will be delegated next time.
- If the Lead keeps substantial worker work on a high-capability model, the increment report and PR must explain why.
- Worker briefs must include a suggested model tier and enough context to avoid making the worker read the full project history.
- Worker outputs must be reviewed by the Lead before merge, release, or Done status.

## Token Efficiency Rules

- Fresh sessions read compact state files before reading long issue threads.
- Workers receive task briefs, not the entire project history.
- Agents summarize findings into durable files rather than relying on chat.
- Completed or obsolete detail should be archived or replaced by concise current state.
- Do not ask every agent to read every team document.
- Prefer short worker sessions over long all-purpose sessions.
- Preserve enough state for a fresh cheap worker to continue without replaying expensive reasoning.

## Increment Cost Report

Every substantial increment report should include:

- Which role or task used which model tier.
- Which tasks were delegated to cheaper/faster workers.
- The exact cheaper/faster model tier used for each delegated task.
- Evidence returned by each worker, such as commands run, files inspected, bugs found, or gaps identified.
- Which tasks used a high-capability model and why.
- Whether the required delegation gate was satisfied or an exception was used.
- Any obvious missed opportunity to use a cheaper model next time.
