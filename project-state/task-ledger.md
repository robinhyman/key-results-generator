# Task Ledger

Last updated: 2026-08-16

Active, blocked, and next work. Completed increments live in `archive/`.

## Active

- Issue `#28 Make cheaper-worker delegation the default` on `chore/28-delegate-by-default`. Delegation is now automatic for named task types; exemptions are enumerated and must be recorded; the reporting requirement is enforced by `increment-check`.

## Blocked

- None.

## Next

- Enable branch protection on `main` requiring `Process / increment-check`. User action; blocks the process gates from being binding rather than advisory.
- Choose the next product increment: durable persistence, graph editing, or hosted deployment.
- Remaining operating-model work from the 2026-08-16 audit, listed in `handoff.md`.

## Completed

Issues `#1`-`#22` are closed. Summary of what each delivered:

- `#1` AI team operating system.
- `#2` First dependency-free local MVP for objective-to-KR generation.
- `#4` AI-guided clarification step and the server-side AI generation service.
- `#6` Playwright browser coverage for the clarification flow.
- `#7` Documented GitHub CLI fallback for Project status updates.
- `#9` Server routing, request validation, and AI fallback diagnostics.
- `#10` Frontend split into native browser modules.
- `#11` Closed as a duplicate of `#6`.
- `#12` Architecture hardening closeout and decision records.
- `#14` Approved AI instruction specification for graph-first OKR generation.
- `#15` Approved instruction structure implemented in the generation service.
- `#16` Regression checks for AI instruction and output quality.
- `#19` Explicit `leading`/`lagging` indicator types on key results.
- `#20` Env-gated AI prompt and response trace logging.
- `#22` Harness-agnostic process enforcement via `increment-check`, git hooks, and CI.

Per-issue detail, verification runs, retrospectives, and worker evidence are in `archive/2026-08-pre-compaction.md`.
