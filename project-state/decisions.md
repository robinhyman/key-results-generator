# Decisions

Last updated: 2026-08-19

Current durable decisions only. Detailed pre-compaction history is archived in `project-state/archive/2026-08-decisions-pre-closeout-compaction.md`.

## Operating Model

- Use documented repository state over chat memory. Fresh agents start from `project-state/index.md` and read detail on demand.
- Use GitHub issues and Project 4 as the work queue, audit trail, and visible workflow state.
- Deliver work in small increments with one primary issue, acceptance criteria, a verification plan, review, state updates, and a report.
- `Done` requires a checked demonstration link for user-facing work. Local links must still be running when handed over.
- User-facing increments also need durable demo evidence, such as a screenshot, recording, artifact, committed evidence path, log, or trace reference.
- Testing is a first-class gate. Prefer test-first for clear behavior and report skipped checks with risk.
- Documentation impact is assessed every increment; required docs are part of `Done`.
- Retrospectives are tiered: every increment gets a three-field delta retro; full multi-role retros run only on named triggers.

## Enforcement

- Process enforcement lives in `ai-team/bin/increment-check.mjs`, run by git hooks and the `Process / increment-check` CI job.
- Maintainability enforcement uses free local static analysis and a monotonic checked-in baseline. Deterministic green/amber/red routing suppresses additional maintainability LLM review for green changes, bounds amber review to one low-cost pass, and reserves Architect review for red changes after blockers are resolved.
- Branch protection is active for `main`: PR required, `increment-check` required, force-push/deletion blocked, no bypass actors.
- The checker enforces credential scans, state stamps, state budgets, active-work coherence, branch naming, hard-gate section duplication, build/lint, required PR-report sections, process-review evidence, delegation evidence, and durable demo evidence for user-facing links.
- Treat `increment-check` as production code. PR-body gate logic and state coherence are covered by automated tests; fixture-repo tests cover secrets, state freshness, state budget, and hard-gate section duplication.
- `project-state/task-ledger.md` owns active, blocked, and next work. Other state files should point at it rather than duplicating active-work truth.

## Model Use

- Use the cheapest model that can reliably complete the role.
- Delegate routine checks, process review, test-gap analysis, documentation drafts, summaries, and mechanical edits by default unless a named exemption applies.
- Stronger models remain for Lead work, architecture, ambiguity, high-risk changes, integration judgement, and final review.
- Reports include lightweight model-use telemetry: Lead role, worker count, delegated tasks, evidence returned, skipped delegation or expensive reruns.
- Exact token counts are optional and recorded only when the harness exposes them reliably. When unavailable, reports use compact observable proxies: Lead turns, worker count by tier, delegated task count, and expensive reruns or restarts.

## Autonomous Closeout

- Routine low- and medium-risk increments should be merged by the AI team after closeout checks pass.
- Robin approval remains required for production deploys, credentials/secrets/auth/permissions, destructive or irreversible data changes, billing/legal/commercial commitments, high-risk architecture or migrations, ambiguous verification, or anything Robin explicitly asks to review.
- Before merge, run the merge-closeout workflow: CI, process review, verification, durable demo evidence where applicable, Project-status check, and fresh project-state.
- After merge, move Project status to Done, confirm/close the issue, pull `main`, and update state if the next-session truth changed.

## GitHub Outage Path

- If GitHub is unavailable, use a compact local shadow issue/report in `project-state/` with acceptance criteria, verification plan, model use, process review, and a backfill checklist.
- Temporary `*/0-*` branches are allowed only for the offline path and should be renamed to the real issue number before PR unless impractical and recorded.
- Do not call the increment `Done` until GitHub issue, Project, PR, and state backfill are complete, unless Robin explicitly accepts a local-only result.

## Product Architecture

- The app is local-first and dependency-light: Node server, native browser modules, no frontend framework or build step.
- AI generation runs server-side through the OpenAI Responses API with structured JSON output and deterministic local fallback.
- The browser never reads credentials. Keys come from environment or ignored local key path only.
- Trace logging is opt-in, local-only, git-ignored, redacts credential material, and rotates bounded JSONL files.
- The graph is a first-class serializable artifact with a rich `fullGraph`, converged `planningGraph`, rankings, user assessments, algorithmic candidate KR sets, and traceable final KRs. The server model DTO uses canonical `graph`, `candidateKeyResultSets`, `keyResults`, `graphGeneration`, and `keyResultGeneration` fields; browser-only aliases are derived in `public/format.js`.
- The local #52-#68 architecture backlog decomposes the generator, hardens provider/API/server behavior, and adds graph/KR/path/DTO contracts. Publish/PR closeout remains before those GitHub issues are closed.

## Current Product Direction

- Publish and close out the local #52-#68 architecture backlog, then resume candidate-set rendering/inspection.
