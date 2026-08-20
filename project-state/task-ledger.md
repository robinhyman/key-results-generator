# Task Ledger

Last updated: 2026-08-20

Active, blocked, and next work. Completed increments live in `archive/`.

This file owns active, blocked, and next work. `index.md` points here rather than restating it.

## Active

- None.

## Blocked

- None.

## Next

### Ordered refactor

1. #52 split the generator test monolith by subsystem.
2. #53 extract deterministic graph construction.
3. #54 extract clarification and variable ranking.
4. #55 extract candidate-set exploration and path analysis.
5. #56 consolidate KR selection/fallback composition and leave a slim generator facade.

Keep #52-#56 behavior-preserving. Do not mix graph-quality or scoring changes into those extraction PRs.

### Independently startable fixes

- #57 provider timeout/cancellation; #58 expected-provider-only fallback.
- #59 HTTP graph validation; #60 objective length limit; #61 stale browser state.
- #67 trace retention; #68 request URL and static containment hardening.

### Fixes that benefit from the refactor boundary

- #62 semantic graph invariants; #63 KR identity and indicator-mix contracts; #64 deterministic strength-aware paths.
- #65 generation provenance; #66 canonical model contract.

After the architecture backlog, resume the product increment to render/inspect algorithmic candidate sets. Graph quality gates are now specified by #62 rather than hidden in state prose.

## Completed

Issues #1-#43, #46, #49, and #72 are closed. They delivered the local MVP, graph-first AI and deterministic generation, browser/API coverage, algorithmic KR-set exploration, the enforced AI-team operating model, and the solution-design workflow for preventive code quality. Per-issue detail, verification, retrospectives, and worker evidence are in `archive/`.
