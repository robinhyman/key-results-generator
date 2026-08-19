# Maintainability Workflow

Tier: mechanically enforced where stated; otherwise guidance. Hard gates are in `ai-team/README.md`.

Use deterministic analysis to find routine structural risk. Spend model tokens only where the resulting signal needs judgement.

## Binding Checks

`npm run check:maintainability` uses ESLint plus the repository checker to measure:

- JavaScript syntax and selected correctness errors;
- cyclomatic complexity and function length;
- source and test file length;
- static relative-import dependency cycles;
- regressions against `ai-team/maintainability-baseline.json`.

The baseline records existing debt, not acceptable targets. A new violation, a worsened metric, a new cycle, a stale debt entry, or a relaxed threshold fails. Regenerate the baseline after an improvement so the lower value becomes the new ceiling:

```bash
node ai-team/bin/maintainability-check.mjs --write-baseline
```

CI compares a proposed baseline with the baseline on `main`, so regenerating it cannot silently admit more debt.

## Review Funnel

The checker emits one risk and one review recommendation:

| Risk | Meaning | Additional maintainability review |
|---|---|---|
| Green | Bounded change with no objective structural signal | None |
| Amber | Near a budget, touches grandfathered debt, or has a broad code-file surface | One bounded low-cost review |
| Red | Blocking regression or severe grandfathered debt is involved | Resolve failures, then Architect review |

This recommendation governs the additional maintainability review. It does not replace the increment's normal Lead review, process review, or delegation gate.

When the signal is amber, combine the bounded maintainability check with the required independent process review when one worker can handle both from the same compact brief. Do not create a second review turn by default.

For amber or red, give the reviewer only:

- the changed diff;
- `npm run check:maintainability:json` output;
- directly affected public interfaces and tests;
- any decision record relevant to the boundary.

Do not ask several models to repeat the same analysis or send raw historical logs.

## Thresholds

Thresholds live with the baseline so the report is reproducible:

- Source: warn/debt above 400 lines, severe above 600, complexity above 15, function length above 100.
- Tests: warn/debt above 700 lines, severe above 1000, complexity above 20, function length above 150.
- Files above 80% of their line budget produce an amber early-warning signal when changed.

These are tripwires, not a definition of good design. A file can be unhealthy below a threshold or cohesive above one; the bounded model review handles that residual judgement only when deterministic risk warrants it.

## Limits

Static import-cycle analysis covers relative `import` declarations. It does not infer dynamic imports, runtime coupling, responsibility cohesion, or whether names express the domain well. Those remain review concerns when the funnel triggers.

All tooling in this workflow is local and open source. No paid analysis service or automatic paid-model CI call is required.
