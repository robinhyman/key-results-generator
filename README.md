# Key Results Generator

Local-first MVP for generating key results from an objective through an inspectable causal metrics model.

## Operating Model

This repository is developed by an AI delivery team with an explicit operating model. **If you are an agent working here, read `project-state/index.md` and `ai-team/README.md` before doing anything else.** The hard gates — the non-negotiable rules — are listed in `ai-team/README.md`.

Process is enforced mechanically, not by trust. `npm run check` runs from git hooks and CI and blocks credential material, stale state files, maintainability regressions and dependency cycles, non-conforming branches, incomplete increment reports, and lint or build failures. `npm install` installs the hooks.

## Run Locally

Requirements:

- Node.js 20 or newer
- An OpenAI API key with available credits for AI-backed generation

Commands:

```bash
npm start
```

Then open:

```text
http://127.0.0.1:5173/
```

## AI Configuration

The app keeps AI calls server-side so the browser never receives the API key.

Credential lookup order:

1. `OPENAI_API_KEY`
2. `OPENAI_API_KEY_PATH`
3. `AI_KEY_PATH`
4. `keys/key.txt`

The local `keys/` directory is ignored by Git. Do not commit key files.

Optional model configuration:

```bash
OPENAI_MODEL=gpt-5-mini npm start
```

The default model is `gpt-5-mini`, called through the OpenAI Responses API with structured JSON output. The server validates API request bodies and AI output before rendering it. If credentials are missing, the provider is unavailable, quota is exhausted, or the response is malformed, the app falls back to the local deterministic generator and returns safe fallback metadata such as `generation.reasonCode`. The server does not return API keys or raw provider payloads to the browser.

### AI Trace Logging

For local prompt tuning, enable JSONL traces of AI provider calls:

```bash
AI_TRACE_LOG=1 npm start
```

By default, traces are appended to `logs/ai-traces.jsonl`. Override the path with:

```bash
AI_TRACE_LOG=1 AI_TRACE_LOG_PATH=/tmp/key-results-ai-traces.jsonl npm start
```

Each trace record includes the operation name, model, endpoint host, schema name, exact Responses API request body, provider response body, parsed structured output when available, and provider error diagnostics. Trace records never include the API key or `Authorization` header.

Trace files are local debugging artifacts and are ignored by Git. Treat them as sensitive: prompts and responses can include user-entered objectives, graph data, and clarification ratings.

## Checks

```bash
npm run build
npm run check:maintainability
```

The build script runs ESLint and unit tests for the generation, AI provider boundary, server request validation, static routing, fallback diagnostics, ranking logic, process gates, and maintainability ratchet. The maintainability command prints a compact green/amber/red result; `npm run check:maintainability:json` provides bounded input for a model review only when one is recommended.

Browser workflow coverage is available separately:

```bash
npm run test:browser
```

The browser test starts the local server, opens the app in Chromium, submits objectives, changes clarification sliders, generates final KRs, checks for console/page/request failures, and does not require real OpenAI credentials. After a fresh checkout or dependency update, install the Playwright browser binary if needed:

```bash
npx playwright install chromium
```

## Structure

- `server.js`: local HTTP server, static public file serving, API request validation, and JSON endpoints.
- `src/generator.js`: deterministic graph and KR fallback logic.
- `src/ai-service.js`: thin server-side AI generation facade.
- `src/ai/`: AI prompts, schemas, provider client, output normalization, fallback diagnostics, and trace logging.
- `public/app.js`: browser workflow entrypoint.
- `public/api.js`: browser API calls.
- `public/render.js`: DOM rendering helpers.
- `public/format.js`: browser view-model and formatting helpers.
- `test/`: unit and API contract tests.
- `e2e/`: Playwright browser workflow tests.

## Current Product Behavior

The app lets a user enter a plain-language objective, then generates:

- the objective as the downstream outcome
- an AI-backed inspectable causal metrics graph when the provider is available
- ranked model variables with impact, confidence, and baseline influenceability
- a clarification step for rating high-impact metrics by influenceability and perceived gap
- AI-synthesized final key results with rationales, related drivers, and links back to clarified graph variables when the provider is available

The generator treats the causal metrics graph as a first-class structured artefact with nodes, edges, rankings, user assessments, and traceable key result links. The browser calls local server endpoints; the server may send the objective, graph, and clarification ratings to OpenAI for generation. The app does not store user data or persist projects.

## Current Limitations

- AI quality depends on the configured model, quota, and provider availability.
- The deterministic local generator is still used as a fallback when AI generation cannot complete.
- The graph is inspectable but not editable.
- Clarification ratings are kept in browser memory for the current generated model only.
- There is no persistence, authentication, or hosted deployment.
