# Model Policy

Tier: guidance. Hard gates are in `ai-team/README.md`.

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

Delegation is the default, not a decision. The Lead does not weigh it up per increment; it happens for the task types below unless an enumerated exemption applies.

### Delegated by default

Send these to a cheaper worker automatically, without deliberation:

- Running build, test, lint, or smoke checks and reporting the results.
- Verifying a completed change against a written checklist or acceptance criteria.
- Independent test-gap analysis on a diff.
- Cross-file consistency checks, including whether docs, code, and issues agree.
- Documentation drafts and documentation-impact checks.
- Issue summaries, PR summaries, and release notes.
- Mechanical repo-wide edits with clear inputs and low blast radius.

### What "cheaper" means

Cheaper is not model price. It is whether **writing the brief plus reviewing the output costs less than doing the task directly.**

Delegation is cheaper when the task is specifiable in a brief, its evidence is mechanical — commands run, files inspected, findings listed — and it does not need the session's accumulated context. It is more expensive when explaining the task would take longer than performing it.

### Exemptions

Skip delegation only when one of these is true, and record which one:

1. **Transfer cost exceeds task cost.** The brief would take longer to write than the task takes to do.
2. **Continuous judgement.** The task cannot be reduced to a brief because it requires architectural decisions that emerge while doing it.
3. **No worker path.** The harness cannot spawn a worker in this session. Record this as a harness limitation, not a property of the task — the same increment in another harness would delegate it.
4. **Indivisible.** The task is the increment itself and splitting it would create more coordination than work.

An exemption is a claim that must be written down, not a silence. `increment-check` fails a PR whose Model Use section shows neither delegation evidence nor an explicit exemption.

### Worker briefs and review

- Briefs state the model tier, the bounded scope, what is out of scope, and exactly what evidence to return.
- Briefs carry enough context that the worker never needs to read the full project history.
- The Lead reviews every worker output before merge, release, or `Done`. Delegation moves the work, not the accountability.
- If substantial builder, tester, documentation, or release work stays on a high-capability model, the increment report and PR explain why.

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
