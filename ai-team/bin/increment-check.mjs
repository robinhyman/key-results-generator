#!/usr/bin/env node
// Process enforcement for the AI team operating system.
//
// Harness-agnostic: plain Node, no dependencies, driven by git hooks and CI.
// An agent that never read the operating docs still cannot violate an enforced
// gate; it is blocked with a message naming the rule and the fix.
//
// Usage:
//   node ai-team/bin/increment-check.mjs --mode=commit   (pre-commit: fast, staged files)
//   node ai-team/bin/increment-check.mjs --mode=push     (pre-push: full tree + build)
//   node ai-team/bin/increment-check.mjs --mode=ci       (CI: everything + PR body)
//
// Exit 0 = pass (warnings allowed), exit 1 = one or more failures.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Config. Severity is per check so gates can be introduced as `warn` and
// tightened to `fail` once the repo is compliant.
// ---------------------------------------------------------------------------

const CONFIG = {
  severity: {
    secrets: 'fail',
    stateFields: 'fail',
    stateFreshness: 'fail',
    branchName: 'fail',
    lint: 'fail',
    build: 'fail',
    // Enforced as failures since issue #24 compacted the state files.
    stateBudget: 'fail',
    reportSections: 'fail',
  },

  // Line budgets. decisions.md is legitimately append-only durable truth, so it
  // gets a high ceiling; the rest are continuation state and must stay compact.
  budgets: {
    // The index carries orientation, run commands, a routing table, and the
    // hard gates. ~50 lines is its working size; 75 leaves headroom for the
    // active-work section to change within an increment without churn.
    'project-state/index.md': 75,
    'project-state/status.md': 80,
    'project-state/handoff.md': 80,
    'project-state/task-ledger.md': 80,
    'project-state/verification.md': 120,
    'project-state/decisions.md': 300,
  },

  stateFiles: [
    'project-state/index.md',
    'project-state/status.md',
    'project-state/handoff.md',
    'project-state/task-ledger.md',
    'project-state/verification.md',
    'project-state/decisions.md',
  ],

  branchPattern: /^(feature|bug|chore|docs)\/\d+(-\d+)*-[a-z0-9-]+$/,
  exemptBranches: ['main'],

  // Increment report sections required in a PR body (checked in CI only).
  requiredReportSections: ['Verification', 'Demonstration', 'Model Use', 'Documentation'],

  // Paths that must never be committed, regardless of .gitignore state.
  forbiddenPaths: [/^keys\//, /^logs\//, /(^|\/)\.env$/, /(^|\/)ai-traces\.jsonl$/],

  // Credential material. Deliberately narrow: bare mentions of the env var
  // name appear throughout the docs and must not trip the check.
  secretPatterns: [
    { re: /\bsk-[A-Za-z0-9_-]{20,}/, label: 'OpenAI-style API key' },
    { re: /OPENAI_API_KEY\s*[=:]\s*['"]?sk-/, label: 'assigned OPENAI_API_KEY value' },
    { re: /Authorization:\s*Bearer\s+[A-Za-z0-9._-]{20,}/i, label: 'Bearer credential' },
  ],
};

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const results = [];

function record(check, status, detail) {
  results.push({ check, status, ...detail });
}

function pass(check, message) {
  record(check, 'pass', { message });
}

function problem(check, { message, offender, fix, rule }) {
  const severity = CONFIG.severity[check] ?? 'fail';
  record(check, severity, { message, offender, fix, rule });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function git(args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (allowFail) return '';
    throw error;
  }
}

function npm(script) {
  execFileSync('npm', ['run', script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function stagedFiles() {
  const out = git(['diff', '--cached', '--name-only', '--diff-filter=ACM'], { allowFail: true });
  return out ? out.split('\n').filter(Boolean) : [];
}

function stagedContent(path) {
  return git(['show', `:${path}`], { allowFail: true });
}

function changedStateFiles(mode) {
  if (mode === 'commit') {
    return stagedFiles().filter((f) => CONFIG.stateFiles.includes(f));
  }
  // push / ci: any state file that differs from the upstream default branch.
  const base = git(['merge-base', 'HEAD', 'origin/main'], { allowFail: true });
  if (!base) return CONFIG.stateFiles.filter((f) => existsSync(f));
  const out = git(['diff', '--name-only', `${base}...HEAD`], { allowFail: true });
  const changed = out ? out.split('\n').filter(Boolean) : [];
  return CONFIG.stateFiles.filter((f) => changed.includes(f));
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

// Files changed against the default branch, for modes where nothing is staged.
function changedFiles() {
  const base = git(['merge-base', 'HEAD', 'origin/main'], { allowFail: true });
  if (!base) return [];
  const out = git(['diff', '--name-only', '--diff-filter=ACM', `${base}...HEAD`], { allowFail: true });
  return out ? out.split('\n').filter(Boolean) : [];
}

// Credential and artefact material must never enter history. The repo handles
// live OpenAI keys and writes AI traces to disk, so this is a real path.
//
// Runs in every mode: pre-commit is bypassable with --no-verify, so CI must
// re-check the whole branch rather than trusting the hook.
function checkSecrets(mode) {
  const files = mode === 'commit' ? stagedFiles() : changedFiles();
  const readFile = (f) =>
    mode === 'commit' ? stagedContent(f) : existsSync(f) ? readFileSync(f, 'utf8') : '';

  let clean = true;

  for (const file of files) {
    for (const re of CONFIG.forbiddenPaths) {
      if (re.test(file)) {
        clean = false;
        problem('secrets', {
          message: 'A forbidden path is staged for commit.',
          offender: file,
          fix: `git restore --staged ${file}   # and confirm it stays ignored`,
          rule: 'ai-team/constitution.md §17 (credential handling)',
        });
      }
    }

    const content = readFile(file);
    if (!content) continue;
    for (const { re, label } of CONFIG.secretPatterns) {
      if (re.test(content)) {
        clean = false;
        problem('secrets', {
          message: `Staged content looks like credential material (${label}).`,
          offender: file,
          fix: 'Remove the value, rotate the credential if it was real, and re-stage.',
          rule: 'ai-team/constitution.md §17 (credential handling)',
        });
      }
    }
  }

  if (clean) pass('secrets', `${files.length} changed file(s) clean`);
}

// Every state file must carry the stamp at all. decisions.md currently has no
// "Last updated" field while the other four do.
function checkStateFields() {
  let clean = true;
  for (const file of CONFIG.stateFiles) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, 'utf8');
    if (!/^Last updated:\s*\d{4}-\d{2}-\d{2}\s*$/m.test(content)) {
      clean = false;
      problem('stateFields', {
        message: 'State file is missing a well-formed "Last updated: YYYY-MM-DD" line.',
        offender: file,
        fix: `Add "Last updated: ${today()}" near the top of ${file}`,
        rule: 'ai-team/workflows/session-close.md steps 1-5',
      });
    }
  }
  if (clean) pass('stateFields', 'all state files carry a Last updated stamp');
}

// A state file being changed must claim the current date. This is the exact
// drift found on main: four files claimed 2026-08-15 while carrying 08-16 work.
function checkStateFreshness(mode) {
  const changed = changedStateFiles(mode);
  if (changed.length === 0) {
    pass('stateFreshness', 'no state files changed');
    return;
  }

  const now = today();
  let clean = true;

  for (const file of changed) {
    const content = mode === 'commit' ? stagedContent(file) : readFileSync(file, 'utf8');
    const match = content.match(/^Last updated:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
    if (!match) continue; // reported by checkStateFields
    if (match[1] !== now) {
      clean = false;
      problem('stateFreshness', {
        message: `State file changed but still claims "Last updated: ${match[1]}" (today is ${now}).`,
        offender: file,
        fix: `Set "Last updated: ${now}" in ${file}`,
        rule: 'ai-team/workflows/session-close.md steps 1-5',
      });
    }
  }

  if (clean) pass('stateFreshness', `${changed.length} changed state file(s) current`);
}

// Continuation state must stay compact. Without a ceiling, the cleanup decays:
// handoff.md grew 4.1x and verification.md 6.8x, monotonically, in 20 issues.
function checkStateBudget() {
  let clean = true;
  for (const [file, limit] of Object.entries(CONFIG.budgets)) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, 'utf8').split('\n').length;
    if (lines > limit) {
      clean = false;
      problem('stateBudget', {
        message: `State file is over budget: ${lines} lines (limit ${limit}).`,
        offender: file,
        fix: `Archive closed-increment detail to project-state/archive/, leaving current state only.`,
        rule: 'ai-team/model-policy.md (Token Efficiency Rules)',
      });
    } else if (lines > limit * 0.8) {
      record('stateBudget', 'warn', {
        message: `Approaching budget: ${lines}/${limit} lines.`,
        offender: file,
        fix: 'Consider archiving closed-increment detail soon.',
        rule: 'ai-team/model-policy.md (Token Efficiency Rules)',
      });
    }
  }
  if (clean) pass('stateBudget', 'all state files within budget');
}

function checkBranchName() {
  // CI checks out a detached HEAD, so the real branch must come from the
  // event payload. Without this, branch policy would be enforced only by the
  // bypassable hook and never by the binding CI gate.
  const branch =
    process.env.PR_HEAD_REF || git(['rev-parse', '--abbrev-ref', 'HEAD'], { allowFail: true });
  if (!branch || branch === 'HEAD') {
    pass('branchName', 'detached HEAD and no PR_HEAD_REF; skipped');
    return;
  }
  if (CONFIG.exemptBranches.includes(branch)) {
    pass('branchName', `on exempt branch "${branch}"`);
    return;
  }
  if (!CONFIG.branchPattern.test(branch)) {
    problem('branchName', {
      message: 'Branch name does not match the required pattern.',
      offender: branch,
      fix: 'Rename to feature|bug|chore|docs/<issue-number>-<short-name>, e.g. feature/21-graph-editing',
      rule: 'ai-team/workflows/branch-and-pr.md (Branch Naming)',
    });
    return;
  }
  pass('branchName', `"${branch}" matches policy`);
}

function checkCode(script, checkName) {
  try {
    npm(script);
    pass(checkName, `npm run ${script} passed`);
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
    const tail = output.split('\n').slice(-12).join('\n');
    problem(checkName, {
      message: `npm run ${script} failed.`,
      offender: tail || '(no output captured)',
      fix: `Run "npm run ${script}" locally and fix the failures before continuing.`,
      rule: 'ai-team/workflows/increment.md (Verification Has Run)',
    });
  }
}

// The increment report lives in the PR body, so only CI can see it.
function checkReportSections() {
  const body = process.env.PR_BODY ?? '';
  if (!body) {
    pass('reportSections', 'no PR body available; skipped');
    return;
  }

  const missing = CONFIG.requiredReportSections.filter(
    (section) => !new RegExp(`^#{1,4}\\s*${section}\\b`, 'im').test(body)
  );

  if (missing.length > 0) {
    problem('reportSections', {
      message: `PR body is missing required increment-report section(s): ${missing.join(', ')}.`,
      offender: '(pull request body)',
      fix: 'Populate the missing sections using ai-team/templates/increment-report.md',
      rule: 'ai-team/workflows/branch-and-pr.md (PR Requirements)',
    });
    return;
  }

  // A "Demonstration" heading with no link is the failure mode that let issue
  // #4 be marked Done without a working demo. The rule applies to user-facing
  // work only, so an explicit written opt-out is accepted — but silence is
  // not, which keeps the exemption auditable rather than assumed.
  const hasLink = /https?:\/\/\S+/.test(body);
  const declaredNotUserFacing =
    /\bno (app\/demo|demo|app) link applies\b/i.test(body) ||
    /\bnot user-facing\b/i.test(body) ||
    /\bno user-facing (product )?behavior(al)? change/i.test(body);

  if (!hasLink && !declaredNotUserFacing) {
    problem('reportSections', {
      message: 'PR body has no link and no explicit non-user-facing declaration.',
      offender: '(pull request body)',
      fix: 'Add the checked demo link, or state explicitly that no app/demo link applies and why.',
      rule: 'ai-team/workflows/increment.md (Demo Or Deployment Is Available)',
    });
    return;
  }

  pass('reportSections', 'all required report sections present');
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const mode = (process.argv.find((a) => a.startsWith('--mode=')) ?? '--mode=push').split('=')[1];

if (!['commit', 'push', 'ci'].includes(mode)) {
  console.error(`increment-check: unknown mode "${mode}" (expected commit, push, or ci)`);
  process.exit(2);
}

checkSecrets(mode);
checkStateFields();
checkStateFreshness(mode);
checkBranchName();

if (mode === 'commit') {
  checkCode('lint', 'lint');
} else {
  checkStateBudget();
  checkCode('build', 'build');
}

if (mode === 'ci') {
  checkReportSections();
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const failures = results.filter((r) => r.status === 'fail');
const warnings = results.filter((r) => r.status === 'warn');
const passes = results.filter((r) => r.status === 'pass');

console.log(`\nincrement-check (mode: ${mode})\n${'─'.repeat(52)}`);

for (const r of passes) {
  console.log(`  ok   ${r.check} — ${r.message}`);
}

for (const r of [...warnings, ...failures]) {
  const tag = r.status === 'fail' ? 'FAIL' : 'warn';
  console.log(`\n  ${tag} ${r.check}`);
  console.log(`       ${r.message}`);
  if (r.offender) {
    const lines = String(r.offender).split('\n');
    console.log(`       offender: ${lines[0]}`);
    for (const line of lines.slice(1)) console.log(`                 ${line}`);
  }
  if (r.fix) console.log(`       fix:  ${r.fix}`);
  if (r.rule) console.log(`       rule: ${r.rule}`);
}

console.log(`\n${'─'.repeat(52)}`);
console.log(`${passes.length} passed, ${warnings.length} warning(s), ${failures.length} failure(s)\n`);

if (failures.length > 0) {
  console.log('Blocked. Fix the failures above, or read the named rule if the gate looks wrong.');
  console.log('Operating model: ai-team/README.md\n');
  process.exit(1);
}

process.exit(0);
