#!/usr/bin/env node

import { runMaintainabilityCheck } from '../lib/maintainability.mjs';

const args = new Set(process.argv.slice(2));
const mode = process.argv.find((arg) => arg.startsWith('--mode='))?.split('=')[1] ?? 'push';

runMaintainabilityCheck({
  cwd: process.cwd(),
  mode,
  writeBaseline: args.has('--write-baseline'),
}).then((result) => {
  if (result.wroteBaseline) {
    console.log(`Wrote ai-team/maintainability-baseline.json with ${Object.keys(result.baseline.files).length} debt entries and ${result.baseline.cycles.length} cycles.`);
  } else if (args.has('--format=json')) {
    const changedMetrics = Object.fromEntries(
      result.changedFiles.filter((file) => result.metrics.files[file]).map((file) => [file, result.metrics.files[file]]),
    );
    console.log(JSON.stringify({
      status: result.status,
      risk: result.risk,
      llmReview: result.llmReview,
      failures: result.failures,
      warnings: result.warnings,
      reasons: result.reasons,
      summary: { filesAnalyzed: Object.keys(result.metrics.files).length, cycles: result.metrics.cycles.length },
      changedFiles: changedMetrics,
    }, null, 2));
  } else {
    const icon = result.status === 'pass' ? 'PASS' : 'FAIL';
    console.log(`${icon} maintainability: risk=${result.risk}, llm-review=${result.llmReview}, files=${Object.keys(result.metrics.files).length}, cycles=${result.metrics.cycles.length}`);
    for (const failure of result.failures) console.log(`  FAIL ${failure.file}: ${failure.message}`);
    for (const reason of result.reasons) console.log(`  ${result.risk.toUpperCase()} ${reason}`);
  }
  if (result.status === 'fail') process.exitCode = 1;
}).catch((error) => {
  console.error(`FAIL maintainability: ${error.message}`);
  process.exitCode = 1;
});
