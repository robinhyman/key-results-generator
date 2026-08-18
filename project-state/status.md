# Project Status

Last updated: 2026-08-18

What the product is and how it is built. For what to do next see `handoff.md`; for history see `archive/`.

## Product

A local-first web app that turns an objective into graph-backed key results.

Flow: objective input, then AI-generated causal metrics graph, then a clarification step asking which high-impact metrics are most influenceable and where the user perceives the biggest gaps, then final key results generated from the graph plus those answers.

The graph is a first-class serializable artefact — nodes, edges, rankings, user assessments, algorithmic candidate KR sets, and traceable links to the final KRs — not disposable render state. It is ready to persist later without redesign.

Final KRs are a set of 3-5, each carrying an explicit `indicatorType` of `leading` or `lagging`, validated against a target mix of 1-2 lagging and 2-3 leading.

## Architecture

- `server.js` exports `handleRequest` for sandbox-friendly API tests, validates request bodies, serves only files under `public/`, and returns structured JSON errors. There is no static `/src/*` exposure.
- `src/generator.js` is the deterministic local generator: structured graph, clarification application, and the fallback KR path.
- `src/ai-service.js` is the thin server-side AI generation facade. Focused modules under `src/ai/` own prompts, schemas, provider transport, output normalization, trace logging, and fallback diagnostics.
- The browser calls `/api/graph` and `/api/key-results` and never imports generator logic or reads credentials. Browser code is native ES modules: `public/api.js`, `app.js`, `format.js`, `render.js`. No framework, no build step.

## Configuration

- Model defaults to `gpt-5-mini`; override with `OPENAI_MODEL` or `AI_MODEL`.
- Credentials come from `OPENAI_API_KEY`, a configured key-path env var, or a local ignored `keys/key.txt`. Never print, commit, or copy the key value.
- `AI_TRACE_LOG=1` appends JSONL request/response traces to `logs/ai-traces.jsonl`, overridable with `AI_TRACE_LOG_PATH`. Traces are local-only, git-ignored, and redact credential material.

## Operating model

Delivery unit is the increment, one primary GitHub issue each, tracked in the `Key Results Generator` GitHub Project via the `Agent Status` field.

Process gates are mechanical as of issue #22: `ai-team/bin/increment-check.mjs` runs from `.githooks/pre-commit`, `.githooks/pre-push`, and `.github/workflows/process.yml`. It fails on staged credential material, missing or stale state stamps, non-conforming branch names, and lint/build failures, and enforces state-file line budgets plus PR report sections including process-review evidence.

Rules live only in `ai-team/`. No harness-specific instruction file may contain a rule, so the model works identically under Codex, Claude, or OpenClaw.

Reusable baseline: `robinhyman/ai-team-operating-system` at `v0.1`. This repo is tagged `ai-team-os-v0.1` as its pre-product baseline.

## Repository

- GitHub: `robinhyman/key-results-generator`
- Project: https://github.com/users/robinhyman/projects/4

## Open questions

- What hosted deployment target should be used?
- Is durable persistence or graph editing the next product increment?
