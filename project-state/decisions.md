# Decisions

Last updated: 2026-08-16

## 2026-08-14: Use Documented State Over Chat Memory

Decision: Persist project state in repo files so fresh sessions can resume cheaply.

Reason: Token efficiency matters, and long chat histories are expensive and fragile as operational memory.

## 2026-08-14: Use GitHub As Work Queue And Audit Trail

Decision: Use GitHub issues/projects to track work, bugs, acceptance criteria, progress, and PR links.

Reason: GitHub provides observability and portable context for Codex now and OpenClaw later.

## 2026-08-14: Start In Codex, Preserve OpenClaw Migration Path

Decision: Pilot the team in Codex using a Lead chat, short-lived subagents, and worktrees where useful.

Reason: Codex provides the lowest-friction local build, test, and review loop. OpenClaw can be considered later for always-on, multi-channel operation.

## 2026-08-14: Create Private GitHub Repository

Decision: Create `robinhyman/key-results-generator` as a private GitHub repository.

Reason: The project needs GitHub issues and future project tracking for observability while the agent team is developed.

## 2026-08-14: Require Agent Issues To Live In GitHub Project

Decision: Agent-managed issues should be added to the `Key Results Generator` GitHub Project and tracked with a custom `Agent Status` field.

Reason: Issues hold detailed context, while the Project gives a visible queue and workflow state for human observability.

## 2026-08-14: Keep GitHub Project Status Truthful

Decision: Move issues to `In Progress` as soon as meaningful work starts and keep `Agent Status` aligned with reality throughout the run.

Reason: The Project is the user's live observability surface, so stale statuses undermine trust in the agent team.

## 2026-08-15: Deliver Work In Increments

Decision: Use increments as the team's default delivery unit, with an explicit Increment Definition Of Done in `ai-team/workflows/increment.md`.

Reason: Increment boundaries prevent open-ended agent work, make verification clearer, and ensure each unit of progress can survive a fresh session.

## 2026-08-15: Done Requires A Checked Demonstration Link

Decision: An increment may be called `Done` only when it is deployed to, or running in, the target demonstration environment and the user receives a checked working app/demo link.

Reason: The user must be able to verify every completed increment directly. Implemented but unavailable work should remain `In Progress`, `Review`, or `Blocked`.

## 2026-08-15: Make Testing A First-Class Increment Gate

Decision: Every increment must define a verification plan and follow `ai-team/workflows/testing.md`.

Reason: General "relevant tests pass" language is too easy for agents to interpret loosely. Testing needs explicit ownership, reporting, skipped-check rules, and failure handling.

## 2026-08-15: Prefer Test-First For Clear Behavior

Decision: Prefer test-first development for behaviorally clear work, especially bugs, business logic, validation, APIs, regressions, and workflows.

Reason: Failing tests give worker agents concrete targets, reduce requirement drift, improve handoffs, and let cheaper agents implement against executable acceptance criteria.

## 2026-08-15: Require Ready Criteria For Agent Tickets

Decision: Use `ai-team/workflows/intake-and-specification.md` to turn goals and discoveries into GitHub issues, and mark issues `Ready` only when a fresh agent can start without hidden chat context.

Reason: Good agent execution depends on clear, bounded, observable tickets. Ready Criteria prevent vague or underspecified work from being handed to worker agents.

## 2026-08-15: Define First Operating Roles And Web Profile

Decision: Add lightweight role specs for Project Lead, Builder, Tester, Reviewer, and Release Agent, plus branch/PR policy and a web app local-first project profile.

Reason: The team needs enough role, code-flow, and project-specific guidance to start work without over-designing every possible future role.

## 2026-08-15: Require Retrospectives And User-Approved Improvements

Decision: Run a retrospective after each increment. Suggested constitutional or workflow improvements require user approval before application and should be committed before the next increment starts.

Reason: The team should improve continuously while preserving user control over the operating system.

## 2026-08-15: Treat Documentation As Part Of Done

Decision: Assess documentation impact on every increment and require needed documentation updates before `Done`.

Reason: Fresh sessions, users, and future maintainers need durable repository truth rather than hidden chat context or stale instructions.

## 2026-08-15: Extract Reusable AI Team Operating System

Decision: Tag this repository at `ai-team-os-v0.1` and create a separate private reusable repository, `robinhyman/ai-team-operating-system`, tagged `v0.1`.

Reason: The operating system is reusable across future projects and should be preserved before this repository accumulates product-specific code and decisions.

## 2026-08-15: First Product Increment Is Objective-To-KR MVP

Decision: Create issue `#2 Build first local MVP for objective-to-key-results generation` as the first product increment.

Reason: It exercises the core product loop: objective input, graph-backed metrics model generation, KR selection, local demo, testing, documentation, and retrospective.

## 2026-08-15: Use Deterministic Local Generation For The First MVP

Decision: Implement the first objective-to-key-results generator as deterministic local logic in `src/generator.js`, without external AI APIs or credentials.

Reason: Issue `#2` requires a demonstrable local MVP and explicitly allows a local/mock generation path when API keys are unavailable. A deterministic generator makes the core graph-backed flow testable, reliable, and runnable without setup friction.

## 2026-08-15: Treat Metrics Graph As A First-Class Artefact

Decision: Represent the causal/metrics graph as serializable structured data, with nodes, edges, rankings, user influenceability/gap assessments, and traceable links to final KRs.

Reason: The product workflow requires an intermediate clarification step between objective input and final KR generation. The AI-generated graph must survive that step so final recommendations can be explained, refined, persisted later, and audited against the objective and user answers.

## 2026-08-15: Require Explicit Cost-Conscious Model Use

Decision: Future increments must make a lightweight model-use plan before implementation, delegate bounded routine work to cheaper/faster worker models whenever practical, and report model-tier usage in the increment report.

Reason: The first product run validated the process but did not visibly use cheaper workers for builder, tester, documentation, or release tasks. Cost efficiency is a core requirement for the team, so model allocation must be observable and reviewed.

## 2026-08-15: Keep Local Demo Servers Running When Sharing Local URLs

Decision: When a completion or review response gives the user a local app/demo URL, the local server must still be running at final response time and should be left running unless the user explicitly says they do not need it.

Reason: A local URL is only useful while its server process is active. Reporting a checked local URL after stopping the server creates a false demo link and violates the intent of the checked-link rule.

## 2026-08-15: Make Cheaper-Worker Delegation A Required Gate

Decision: Product increments must delegate at least one bounded routine task to a cheaper/faster worker model before review or completion, unless a documented exception applies. PRs and increment reports must show the worker task, model tier, evidence, and any skipped-delegation reason.

Reason: Cost-conscious model use should happen automatically, not only after user reminders. Making delegation a review gate gives the user visible evidence that routine work is being moved off the Lead model whenever practical.

## 2026-08-15: Keep AI Generation Server-Side With Deterministic Fallback

Decision: AI-backed graph generation and final KR synthesis run through server-side endpoints backed by `src/ai-service.js`. The browser never reads API keys. The service calls the OpenAI Responses API with structured JSON output, validates the returned graph/KR shapes, preserves clarification traceability, and falls back to the deterministic local generator when credentials, quota, provider availability, or output validity fail.

Reason: Issue `#4` requires real AI-backed generation, but local-first development still needs a reliable demo and safe credential handling. Server-side validation treats AI output as untrusted while keeping the existing graph model serializable and ready for later persistence.

Current default: `OPENAI_MODEL` / `AI_MODEL` can override the model; otherwise the service uses `gpt-5-mini`. Credentials are read from `OPENAI_API_KEY`, configured key path env vars, or ignored local `keys/key.txt`.

## 2026-08-15: Harden Local MVP Before Product Expansion

Decision: Before adding larger product features, harden the local MVP by validating server API request shapes, serving only files under `public/`, removing static `/src/*` exposure, and returning safe structured fallback diagnostics from the AI boundary.

Reason: The architecture review found that the MVP had a good core shape but overly forgiving boundaries. Explicit validation and diagnostics make failures easier to test and debug without exposing credentials or provider payloads.

## 2026-08-15: Use Native Browser Modules Until Framework Pressure Is Real

Decision: Keep the browser dependency-free at runtime and split `public/app.js` into native ES modules for API access, rendering, formatting, and workflow orchestration.

Reason: The UI had grown enough to need clearer file boundaries, but not enough to justify a frontend framework or build step.

## 2026-08-15: Add Playwright For Browser Workflow Verification

Decision: Add Playwright as a dev dependency and keep browser workflow tests in a separate `npm run test:browser` command rather than the default unit/build loop.

Reason: The clarification flow needs real browser coverage for DOM events, module loading, repeated submissions, and console/page/request failures. Keeping it separate preserves a fast sandbox-friendly `npm run build` while enabling stronger local verification before marking web increments done.

## 2026-08-15: Tighten Intake, Project Status, And Browser-Test Setup

Decision: Update the operating workflow to require duplicate-issue checks before ticket creation, keep both GitHub Project `Status` and `Agent Status` aligned when both exist, retry `gh auth status` outside the sandbox before treating CLI auth as invalid, and document Playwright browser binary setup.

Reason: The architecture-hardening retrospective found avoidable process friction: a duplicate browser-test issue was created despite existing issue `#6`, Project status briefly became contradictory because only `Agent Status` was updated, sandboxed `gh auth status` initially gave a misleading auth failure, and the first Playwright verification failed because Chromium had not been installed yet. These rules reduce backlog noise, keep the Project board truthful, and make browser-test failures easier to classify.

## 2026-08-15: Use Approved Graph-First AI Instructions

Decision: Use a concise shared system instruction plus task-specific graph-generation and KR-synthesis prompts for AI calls. Final AI KRs should be generated as a set of 3 to 5, with prompt guidance targeting 1 or 2 lagging KRs and 2 or 3 leading KRs.

Reason: The prior shared system instruction was too generic to consistently express the product method. Keeping stable shared guidance separate from task-specific instructions improves token discipline while making graph-first reasoning, measurable influenceable variables, user clarification, traceability, and leading/lagging balance explicit.

Current limitation: leading/lagging mix is prompt guidance only. Enforcing it requires a later schema/model decision such as adding `indicatorType` or a reliable classification rule.

## 2026-08-16: Represent Leading/Lagging Key Results Explicitly

Decision: Add `indicatorType` to each key result with allowed values `leading` and `lagging`, require it in the AI response schema, render it in the browser, and validate the final AI KR set against the target 1-2 lagging / 2-3 leading mix.

Reason: Prompt-only guidance could not be reliably validated or displayed. Making the classification part of the structured model lets the app enforce quality contracts, fall back on invalid provider output, and support future UI/evaluation work.

## 2026-08-16: Enforce Process In Code, Not Prose

Decision: Mechanically enforce the operating model with `ai-team/bin/increment-check.mjs`, invoked from `.githooks/pre-commit`, `.githooks/pre-push`, and `.github/workflows/process.yml`. No rule may live in a harness-specific instruction file; any such file may only point at `ai-team/README.md`.

Reason: An audit found the operating model unreachable and unenforced — no CI, no hooks, no auto-loaded instructions, and no root-README reference. All 101 obligations across 24 docs were self-attested by the agent that did the work, and drift had already occurred undetected (four state files claimed `2026-08-15` while carrying 08-16 content; `decisions.md` had no stamp at all). Enforcing in code is harness-agnostic, since git and CI are indifferent to whether Codex, Claude, or OpenClaw produced the commit; it raises adherence, since a hook is a guarantee rather than a hope; and it lowers token cost, since an enforced rule need not be read to be obeyed.

Tradeoff: hooks are bypassable with `--no-verify`, so CI is the binding gate and requires branch protection on `main` to be non-advisory. Budget and PR-report checks ship as `warn` until state compaction lands, to avoid alarm fatigue that would get the whole check disabled.

## 2026-08-16: Add Local AI Request/Response Trace Logging

Decision: Add opt-in server-side JSONL trace logging for AI provider calls, enabled with `AI_TRACE_LOG=1`, with request body, response body, parsed output, provider diagnostics, operation metadata, and endpoint host.

Reason: Prompt tuning requires observing the exact runtime payloads and responses, not just source prompt builders. Traces are local-only, ignored by Git, and sanitized to avoid credential/header leakage while still making prompts and responses inspectable.
