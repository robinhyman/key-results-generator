# Model Policy

Use the cheapest model that can reliably complete the role. Escalate capability when uncertainty, risk, or integration complexity increases.

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

## Token Efficiency Rules

- Fresh sessions read compact state files before reading long issue threads.
- Workers receive task briefs, not the entire project history.
- Agents summarize findings into durable files rather than relying on chat.
- Completed or obsolete detail should be archived or replaced by concise current state.
- Do not ask every agent to read every team document.
