# Key Results Generator

Local-first MVP for generating key results from an objective through an inspectable causal metrics model.

## Run Locally

Requirements:

- Node.js 20 or newer

Commands:

```bash
npm start
```

Then open:

```text
http://127.0.0.1:5173/
```

## Checks

```bash
npm run build
```

The build script runs syntax checks and unit tests for the generation and ranking logic.

## Current Product Behavior

The app lets a user enter a plain-language objective, then generates:

- the objective as the downstream outcome
- an inspectable causal metrics graph
- ranked model variables with impact, confidence, and baseline influenceability
- a clarification step for rating high-impact metrics by influenceability and perceived gap
- four final key results with rationales, related drivers, and links back to clarified graph variables

The local generator in `src/generator.js` now treats the causal metrics graph as a first-class structured artefact with nodes, edges, rankings, user assessments, and traceable key result links. It does not call an external AI service, require API keys, store user data, or persist projects.

## Current Limitations

- Generation is template-driven and deterministic.
- The graph is inspectable but not editable.
- Clarification ratings are kept in browser memory for the current generated model only.
- There is no persistence, authentication, hosted deployment, or external AI integration.
