import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  changedFiles,
  collectMetrics,
  readFileFromMergeBase,
  repositoryFileContent,
} from './maintainability-metrics.mjs';

export { collectMetrics } from './maintainability-metrics.mjs';

const BASELINE_PATH = 'ai-team/maintainability-baseline.json';
const DEFAULT_THRESHOLDS = {
  source: { warningLines: 400, maximumLines: 600, maximumComplexity: 15, maximumFunctionLines: 100 },
  test: { warningLines: 700, maximumLines: 1000, maximumComplexity: 20, maximumFunctionLines: 150 },
};
const METRICS = ['lines', 'maxComplexity', 'maxFunctionLines'];

function kindFor(file) {
  return /^(?:test|e2e)\//.test(file) ? 'test' : 'source';
}

function debtFor(file, metrics, thresholds) {
  const limits = thresholds[kindFor(file)];
  return metrics.lines > limits.warningLines ||
    metrics.maxComplexity > limits.maximumComplexity ||
    metrics.maxFunctionLines > limits.maximumFunctionLines;
}

function sameMetrics(left, right) {
  return METRICS.every((metric) => (left?.[metric] ?? 0) === (right?.[metric] ?? 0));
}

function cycleKey(cycle) {
  return cycle.join(' -> ');
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateThresholdSchema(thresholds) {
  if (!isPlainObject(thresholds)) return false;
  for (const [kind, expected] of Object.entries(DEFAULT_THRESHOLDS)) {
    if (!isPlainObject(thresholds[kind])) return false;
    const actualKeys = Object.keys(thresholds[kind]).sort();
    const expectedKeys = Object.keys(expected).sort();
    if (actualKeys.join() !== expectedKeys.join()) return false;
    if (actualKeys.some((key) => !Number.isFinite(thresholds[kind][key]) || thresholds[kind][key] <= 0)) return false;
  }
  return Object.keys(thresholds).sort().join() === Object.keys(DEFAULT_THRESHOLDS).sort().join();
}

function validateBaselineFileMetrics(files, label) {
  const failures = [];
  for (const [file, metrics] of Object.entries(files)) {
    if (!isPlainObject(metrics) || METRICS.some((metric) => !Number.isFinite(metrics[metric]) || metrics[metric] < 0)) {
      failures.push({ file, message: `${label} maintainability baseline has invalid file metrics.` });
    }
  }
  return failures;
}

function validateBaselineCycles(cycles, label) {
  return cycles.some((cycle) => !Array.isArray(cycle) || cycle.length < 2)
    ? [{ file: BASELINE_PATH, message: `${label} maintainability baseline has an invalid dependency cycle.` }]
    : [];
}

function validateBaselineSchema(baseline, label = 'Current') {
  const failures = [];
  if (!isPlainObject(baseline) || baseline.version !== 1) {
    return [{ file: BASELINE_PATH, message: `${label} maintainability baseline must use schema version 1.` }];
  }
  if (!validateThresholdSchema(baseline.thresholds)) {
    failures.push({ file: BASELINE_PATH, message: `${label} maintainability threshold schema is incomplete or contains unknown limits.` });
  }
  if (!isPlainObject(baseline.files) || !Array.isArray(baseline.cycles)) {
    failures.push({ file: BASELINE_PATH, message: `${label} maintainability baseline files and cycles have invalid shapes.` });
  }
  if (isPlainObject(baseline.files)) failures.push(...validateBaselineFileMetrics(baseline.files, label));
  if (Array.isArray(baseline.cycles)) failures.push(...validateBaselineCycles(baseline.cycles, label));
  return failures;
}

function validateBaselineFiles(metrics, baselineFiles, thresholds) {
  const failures = [];
  for (const [file, fileMetrics] of Object.entries(metrics.files)) {
    const hasDebt = debtFor(file, fileMetrics, thresholds);
    const recorded = baselineFiles[file];
    if (hasDebt && !recorded) {
      failures.push({ file, message: 'Maintainability debt is missing from the baseline.' });
    } else if (hasDebt && !sameMetrics(fileMetrics, recorded)) {
      failures.push({ file, message: 'Baseline does not match current debt; regenerate it so improvements ratchet down.' });
    } else if (!hasDebt && recorded) {
      failures.push({ file, message: 'Baseline contains resolved debt; regenerate it to remove the stale entry.' });
    }
  }

  for (const file of Object.keys(baselineFiles)) {
    if (!metrics.files[file]) failures.push({ file, message: 'Baseline contains a file that no longer exists.' });
  }
  return failures;
}

function validateCycles(metrics, baseline) {
  const failures = [];
  const currentCycles = new Set((metrics.cycles ?? []).map(cycleKey));
  const baselineCycles = new Set((baseline.cycles ?? []).map(cycleKey));
  for (const cycle of currentCycles) {
    if (!baselineCycles.has(cycle)) failures.push({ file: cycle, message: 'A new dependency cycle is not allowed.' });
  }
  for (const cycle of baselineCycles) {
    if (!currentCycles.has(cycle)) failures.push({ file: cycle, message: 'Baseline contains a resolved dependency cycle; regenerate it.' });
  }
  return failures;
}

function validateThresholds(thresholds, previousThresholds) {
  const failures = [];
  for (const kind of ['source', 'test']) {
    for (const limit of Object.keys(thresholds[kind])) {
      if (thresholds[kind][limit] > previousThresholds[kind][limit]) {
        failures.push({ file: BASELINE_PATH, message: `Maintainability threshold was relaxed: ${kind}.${limit}.` });
      }
    }
  }
  return failures;
}

function validateMonotonicCycles(baseline, previousBaseline) {
  const failures = [];
  const previousCycles = new Set((previousBaseline.cycles ?? []).map(cycleKey));
  for (const cycle of (baseline.cycles ?? []).map(cycleKey)) {
    if (!previousCycles.has(cycle)) {
      failures.push({ file: cycle, message: 'Maintainability baseline increased with a new dependency cycle.' });
    }
  }
  return failures;
}

function validateMonotonicFiles(baseline, previousBaseline) {
  const failures = [];
  for (const [file, current] of Object.entries(baseline.files ?? {})) {
    const previous = previousBaseline.files?.[file];
    if (!previous) {
      failures.push({ file, message: 'Maintainability baseline increased with a new debt entry.' });
      continue;
    }
    for (const metric of METRICS) {
      if ((current[metric] ?? 0) > (previous[metric] ?? 0)) {
        failures.push({ file, message: `Maintainability baseline increased for ${metric}.` });
      }
    }
  }
  return failures;
}

function validateMonotonicBaseline(baseline, previousBaseline) {
  if (!previousBaseline) return [];
  return [
    ...validateThresholds(baseline.thresholds, previousBaseline.thresholds),
    ...validateMonotonicCycles(baseline, previousBaseline),
    ...validateMonotonicFiles(baseline, previousBaseline),
  ];
}

function fileRisk(file, metrics, thresholds) {
  const limits = thresholds[kindFor(file)];
  if (debtFor(file, metrics, thresholds)) {
    const severe = metrics.lines > limits.maximumLines ||
      metrics.maxComplexity > limits.maximumComplexity * 1.5 ||
      metrics.maxFunctionLines > limits.maximumFunctionLines * 1.5;
    return {
      risk: severe ? 'red' : 'amber',
      reason: severe ? `${file} contains severe existing debt.` : `${file} contains grandfathered maintainability debt.`,
    };
  }
  if (metrics.lines > limits.warningLines * 0.8 ||
      metrics.maxComplexity > limits.maximumComplexity * 0.8 ||
      metrics.maxFunctionLines > limits.maximumFunctionLines * 0.8) {
    return { risk: 'amber', reason: `${file} is approaching a maintainability budget.` };
  }
  return { risk: 'green', reason: null };
}

function classifyRisk(metrics, thresholds, changedFiles, hasFailures) {
  let risk = hasFailures ? 'red' : 'green';
  const reasons = [];
  const changedCode = changedFiles.filter((file) => metrics.files[file]);
  for (const file of changedCode) {
    const signal = fileRisk(file, metrics.files[file], thresholds);
    if (signal.risk === 'red' || (signal.risk === 'amber' && risk === 'green')) risk = signal.risk;
    if (signal.reason) reasons.push(signal.reason);
  }
  if (changedCode.length >= 5 && risk === 'green') {
    risk = 'amber';
    reasons.push(`${changedCode.length} code files changed.`);
  }
  if (risk !== 'green' && reasons.length === 0) {
    reasons.push('Blocking static-analysis findings require architectural attention.');
  }
  return { risk, reasons };
}

export function evaluateMaintainability({ metrics, baseline, previousBaseline = null, changedFiles = [] }) {
  const schemaFailures = [
    ...validateBaselineSchema(baseline),
    ...(previousBaseline ? validateBaselineSchema(previousBaseline, 'Previous') : []),
  ];
  if (schemaFailures.length > 0) {
    return {
      status: 'fail',
      risk: 'red',
      llmReview: 'architect',
      failures: schemaFailures,
      warnings: [{ message: 'Use Architect review only after blocking findings are resolved.' }],
      reasons: ['The maintainability baseline schema is invalid, so analysis failed closed.'],
    };
  }
  const thresholds = baseline.thresholds ?? DEFAULT_THRESHOLDS;
  const failures = [
    ...validateBaselineFiles(metrics, baseline.files ?? {}, thresholds),
    ...validateCycles(metrics, baseline),
    ...validateMonotonicBaseline(baseline, previousBaseline),
  ];
  const { risk, reasons } = classifyRisk(metrics, thresholds, changedFiles, failures.length > 0);
  const warnings = [];
  if (risk === 'amber') {
    warnings.push({ message: 'Use one bounded low-cost review of the diff and static report.' });
  }
  if (risk === 'red') {
    warnings.push({ message: 'Use Architect review only after blocking findings are resolved.' });
  }

  return {
    status: failures.length > 0 ? 'fail' : 'pass',
    risk,
    llmReview: risk === 'green' ? 'none' : risk === 'amber' ? 'low-cost' : 'architect',
    failures,
    warnings,
    reasons,
  };
}

function baselineFromMetrics(metrics, thresholds = DEFAULT_THRESHOLDS) {
  return {
    version: 1,
    thresholds,
    files: Object.fromEntries(
      Object.entries(metrics.files)
        .filter(([file, fileMetrics]) => debtFor(file, fileMetrics, thresholds))
        .map(([file, fileMetrics]) => [file, Object.fromEntries(METRICS.map((metric) => [metric, fileMetrics[metric]]))]),
    ),
    cycles: metrics.cycles,
  };
}

function readPreviousBaseline(cwd) {
  const content = readFileFromMergeBase(cwd, BASELINE_PATH);
  return content ? JSON.parse(content) : null;
}

export async function runMaintainabilityCheck({ cwd, mode = 'push', writeBaseline = false }) {
  const metrics = await collectMetrics(cwd, mode);
  if (writeBaseline) {
    const baseline = baselineFromMetrics(metrics);
    writeFileSync(resolve(cwd, BASELINE_PATH), `${JSON.stringify(baseline, null, 2)}\n`);
    return { status: 'pass', wroteBaseline: true, baseline, metrics, changedFiles: [] };
  }
  if (mode !== 'commit' && !existsSync(resolve(cwd, BASELINE_PATH))) {
    throw new Error(`Missing ${BASELINE_PATH}; run with --write-baseline.`);
  }
  const baselineContent = repositoryFileContent(cwd, BASELINE_PATH, mode);
  if (!baselineContent) throw new Error(`Missing ${BASELINE_PATH}; run with --write-baseline.`);
  const baseline = JSON.parse(baselineContent);
  const changed = changedFiles(cwd, mode);
  const result = evaluateMaintainability({
    metrics,
    baseline,
    previousBaseline: readPreviousBaseline(cwd),
    changedFiles: changed,
  });
  return { ...result, metrics, changedFiles: changed };
}
