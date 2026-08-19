import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { collectMetrics, evaluateMaintainability, runMaintainabilityCheck } from '../ai-team/lib/maintainability.mjs';

const thresholds = {
  source: {
    warningLines: 400,
    maximumLines: 600,
    maximumComplexity: 15,
    maximumFunctionLines: 100,
  },
  test: {
    warningLines: 700,
    maximumLines: 1000,
    maximumComplexity: 20,
    maximumFunctionLines: 150,
  },
};

function report({ files, cycles = [], baselineFiles = {}, baselineCycles = [], previousBaseline = null, changedFiles = [] }) {
  const baseline = {
    version: 1,
    thresholds,
    files: baselineFiles,
    cycles: baselineCycles,
  };

  return evaluateMaintainability({
    metrics: { files, cycles },
    baseline,
    previousBaseline,
    changedFiles,
  });
}

test('a small bounded change is green and needs no LLM review', () => {
  const result = report({
    files: {
      'src/focused.js': { lines: 120, maxComplexity: 6, maxFunctionLines: 35 },
    },
    changedFiles: ['src/focused.js'],
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.risk, 'green');
  assert.equal(result.llmReview, 'none');
  assert.deepEqual(result.failures, []);
});

test('an incomplete or extended threshold schema fails closed', () => {
  const files = {
    'src/oversized.js': { lines: 700, maxComplexity: 3, maxFunctionLines: 20 },
  };
  const incomplete = evaluateMaintainability({
    metrics: { files, cycles: [] },
    baseline: { version: 1, thresholds: { source: {}, test: thresholds.test }, files: {}, cycles: [] },
    changedFiles: ['src/oversized.js'],
  });
  const extended = evaluateMaintainability({
    metrics: { files, cycles: [] },
    baseline: {
      version: 1,
      thresholds: { ...thresholds, source: { ...thresholds.source, ignoredLimit: 9999 } },
      files: {},
      cycles: [],
    },
    changedFiles: ['src/oversized.js'],
  });

  assert.equal(incomplete.status, 'fail');
  assert.equal(incomplete.llmReview, 'architect');
  assert.ok(incomplete.failures.some((failure) => /threshold schema/i.test(failure.message)));
  assert.equal(extended.status, 'fail');
  assert.ok(extended.failures.some((failure) => /threshold schema/i.test(failure.message)));
});

test('a changed file approaching a limit is amber and gets bounded cheap review', () => {
  const result = report({
    files: {
      'src/growing.js': { lines: 340, maxComplexity: 8, maxFunctionLines: 50 },
    },
    changedFiles: ['src/growing.js'],
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.risk, 'amber');
  assert.equal(result.llmReview, 'low-cost');
  assert.match(result.reasons.join(' '), /maintainability budget/i);
});

test('a changed file approaching the complexity limit is amber', () => {
  const result = report({
    files: {
      'src/branching.js': { lines: 100, maxComplexity: 13, maxFunctionLines: 40 },
    },
    changedFiles: ['src/branching.js'],
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.risk, 'amber');
  assert.equal(result.llmReview, 'low-cost');
});

test('touching severe grandfathered debt is red without failing an unchanged baseline', () => {
  const debt = { lines: 731, maxComplexity: 14, maxFunctionLines: 72 };
  const result = report({
    files: { 'ai-team/bin/large.mjs': debt },
    baselineFiles: { 'ai-team/bin/large.mjs': debt },
    previousBaseline: {
      version: 1,
      thresholds,
      files: { 'ai-team/bin/large.mjs': debt },
      cycles: [],
    },
    changedFiles: ['ai-team/bin/large.mjs'],
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.risk, 'red');
  assert.equal(result.llmReview, 'architect');
  assert.match(result.reasons.join(' '), /severe existing debt/i);
});

test('new or worsened maintainability debt fails the ratchet', () => {
  const previousDebt = { lines: 656, maxComplexity: 12, maxFunctionLines: 80 };
  const worsenedDebt = { lines: 670, maxComplexity: 16, maxFunctionLines: 105 };
  const result = report({
    files: { 'src/generator.js': worsenedDebt },
    baselineFiles: { 'src/generator.js': worsenedDebt },
    previousBaseline: {
      version: 1,
      thresholds,
      files: { 'src/generator.js': previousDebt },
      cycles: [],
    },
    changedFiles: ['src/generator.js'],
  });

  assert.equal(result.status, 'fail');
  assert.equal(result.risk, 'red');
  assert.ok(result.failures.some((failure) => /baseline increased/i.test(failure.message)));
});

test('thresholds cannot be relaxed relative to main', () => {
  const relaxed = structuredClone(thresholds);
  relaxed.source.warningLines += 1;
  const result = evaluateMaintainability({
    metrics: { files: {}, cycles: [] },
    baseline: { version: 1, thresholds: relaxed, files: {}, cycles: [] },
    previousBaseline: { version: 1, thresholds, files: {}, cycles: [] },
    changedFiles: [],
  });

  assert.equal(result.status, 'fail');
  assert.ok(result.failures.some((failure) => /threshold was relaxed/i.test(failure.message)));
});

test('a violation cannot be hidden by leaving it out of the baseline', () => {
  const result = report({
    files: {
      'src/new-large.js': { lines: 450, maxComplexity: 10, maxFunctionLines: 60 },
    },
    changedFiles: ['src/new-large.js'],
  });

  assert.equal(result.status, 'fail');
  assert.ok(result.failures.some((failure) => /missing from the baseline/i.test(failure.message)));
});

test('a new dependency cycle is a blocking red signal', () => {
  const result = report({
    files: {
      'src/a.js': { lines: 20, maxComplexity: 2, maxFunctionLines: 8 },
      'src/b.js': { lines: 20, maxComplexity: 2, maxFunctionLines: 8 },
    },
    cycles: [['src/a.js', 'src/b.js', 'src/a.js']],
    changedFiles: ['src/a.js'],
  });

  assert.equal(result.status, 'fail');
  assert.equal(result.risk, 'red');
  assert.ok(result.failures.some((failure) => /dependency cycle/i.test(failure.message)));
});

test('a new dependency cycle cannot be hidden by adding it to the baseline', () => {
  const cycle = ['src/a.js', 'src/b.js', 'src/a.js'];
  const result = report({
    files: {
      'src/a.js': { lines: 20, maxComplexity: 2, maxFunctionLines: 8 },
      'src/b.js': { lines: 20, maxComplexity: 2, maxFunctionLines: 8 },
    },
    cycles: [cycle],
    baselineCycles: [cycle],
    previousBaseline: {
      version: 1,
      thresholds,
      files: {},
      cycles: [],
    },
    changedFiles: ['src/a.js'],
  });

  assert.equal(result.status, 'fail');
  assert.ok(result.failures.some((failure) => /baseline increased with a new dependency cycle/i.test(failure.message)));
});

test('baseline entries must exactly match current debt so improvements ratchet down', () => {
  const result = report({
    files: {
      'src/improved.js': { lines: 410, maxComplexity: 10, maxFunctionLines: 50 },
    },
    baselineFiles: {
      'src/improved.js': { lines: 450, maxComplexity: 10, maxFunctionLines: 50 },
    },
    changedFiles: ['src/improved.js'],
  });

  assert.equal(result.status, 'fail');
  assert.ok(result.failures.some((failure) => /does not match current debt/i.test(failure.message)));
});

test('resolved debt cannot remain as a stale baseline entry', () => {
  const result = report({
    files: {
      'src/improved.js': { lines: 200, maxComplexity: 5, maxFunctionLines: 30 },
    },
    baselineFiles: {
      'src/improved.js': { lines: 450, maxComplexity: 10, maxFunctionLines: 50 },
    },
    changedFiles: ['src/improved.js'],
  });

  assert.equal(result.status, 'fail');
  assert.ok(result.failures.some((failure) => /resolved debt/i.test(failure.message)));
});

test('repository analysis collects ESLint metrics and static relative-import cycles', async () => {
  const repo = mkdtempSync(join(tmpdir(), 'maintainability-check-'));
  mkdirSync(join(repo, 'src'));
  writeFileSync(join(repo, 'eslint.config.mjs'), `export default [{
    files: ['**/*.js'],
    rules: {
      complexity: ['warn', 2],
      'max-lines-per-function': ['warn', { max: 4 }],
    },
  }];\n`);
  writeFileSync(join(repo, 'src/a.js'), [
    "import './b.js';",
    'export function choose(a, b) {',
    '  if (a) return 1;',
    '  if (b) return 2;',
    '  return 3;',
    '}',
  ].join('\n'));
  writeFileSync(join(repo, 'src/b.js'), "import './a.js';\nexport const value = 1;\n");
  writeFileSync(join(repo, 'src/untracked.js'), 'export const unrelated = true;\n');
  execFileSync('git', ['init'], { cwd: repo, stdio: 'ignore' });
  execFileSync('git', ['add', 'eslint.config.mjs', 'src/a.js', 'src/b.js'], { cwd: repo });

  const metrics = await collectMetrics(repo, 'commit');

  assert.equal(metrics.files['src/a.js'].maxComplexity, 3);
  assert.equal(metrics.files['src/a.js'].maxFunctionLines, 5);
  assert.deepEqual(metrics.cycles, [['src/a.js', 'src/b.js', 'src/a.js']]);
  assert.equal(metrics.files['src/untracked.js'], undefined);
  writeFileSync(join(repo, 'src/a.js'), 'export const unstaged = true;\n');
  const stagedMetrics = await collectMetrics(repo, 'commit');
  const workingMetrics = await collectMetrics(repo, 'push');
  assert.equal(stagedMetrics.files['src/a.js'].lines, 6);
  assert.equal(workingMetrics.files['src/a.js'].lines, 1);
  await assert.rejects(
    runMaintainabilityCheck({ cwd: repo, mode: 'commit' }),
    /Missing ai-team\/maintainability-baseline\.json/,
  );
});
