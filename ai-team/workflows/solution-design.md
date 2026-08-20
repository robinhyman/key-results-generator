# Solution Design Workflow

Tier: guidance. Hard gates are in `ai-team/README.md`.

Use solution design to prevent unclear, tangled, or over-broad implementation before code is written. This workflow is deliberately lightweight: the goal is enough design to guide a Builder, not a separate design phase for every small edit.

## When To Use

Every product increment must either produce a short solution design or explicitly say why the existing issue spec is enough.

Use the full checklist below when the work:

- Changes architecture, data flow, persistence shape, API contracts, module boundaries, user workflow, or deployment behavior.
- Touches more than one subsystem or crosses UI, server, AI, data, or test boundaries.
- Adds a dependency, shared abstraction, reusable utility, or new long-lived pattern.
- Changes code that is already near a maintainability budget or has recent maintainability findings.
- Requires a Builder who was not present for the original discussion.

For tiny, local, reversible fixes, a one-sentence design note is enough.

## Design Output

Before implementation, the Lead or assigned Architect records:

- User outcome and acceptance criteria the design serves.
- Affected boundary: modules, files, APIs, data structures, or user flow.
- Intended data and control flow.
- Expected implementation shape: the smallest coherent file/module changes.
- Code-quality constraints: naming, separation of concerns, cohesion, and existing patterns to preserve.
- Risks and tradeoffs, including what could become hard to change later.
- Tests and verification approach that should prove the design worked.
- Architect review requirement, or why none is needed.

The output belongs in the issue, task brief, increment report, PR body, or a decision record. Use `project-state/decisions.md` only for durable choices that meet `ai-team/workflows/documentation.md`.

## Code-Quality Standard

Builders must start from these standards, not wait for review to discover them:

- Use domain names that explain product intent; avoid vague names such as `data`, `item`, `manager`, `helper`, or `utils` when a more specific name exists.
- Keep responsibilities separated: parsing, validation, domain decisions, transport, rendering, storage, and test setup should not blur together without a clear reason.
- Prefer small named functions with one reason to change. Split when a function mixes policy, transformation, IO, and presentation.
- Keep modules cohesive. Do not create dumping-ground files for unrelated helpers or shared state.
- Follow existing repo patterns before introducing a new abstraction, dependency, or directory shape.
- Add an abstraction only when it removes real duplication, protects a boundary, or makes the domain easier to understand.
- Make state ownership explicit. Avoid hidden global mutation, stale derived state, and implicit coupling between distant files.
- Treat tests as executable behavior notes. Prefer assertions on observable behavior and contract edges over brittle implementation details.
- Leave code easier to read from the repository than from the chat. Important intent belongs in names, tests, issue notes, or durable docs.

## Architect Review

Get Architect input before implementation when:

- The design changes a durable boundary, data contract, dependency direction, or deployment shape.
- The issue is broad enough that multiple valid designs would lead to meaningfully different futures.
- The Builder would need to invent a shared abstraction or decide where a new responsibility lives.
- The maintainability workflow is red, or amber for code whose boundary is being changed.

Architect review should answer:

- Is the proposed boundary clear and consistent with the repo?
- Is the design smaller than the problem but large enough to hold the behavior?
- Are the tradeoffs and future constraints visible?
- Should this be split before implementation?
- Does any decision need a durable record?

## Builder Handoff

A Builder brief should include only the design facts needed to build:

- Scope and out of scope.
- Files or boundaries expected to change.
- Code-quality constraints relevant to this increment.
- Verification expectations.
- Escalation triggers if the implementation shape stops matching the design.

The Builder should pause and escalate when implementation requires changing the design's boundary, adding an unplanned dependency, creating a shared abstraction, or accepting maintainability debt that was not identified before build.
