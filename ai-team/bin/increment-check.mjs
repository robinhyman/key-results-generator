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
import { pathToFileURL } from 'node:url';

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
    stateCoherence: 'fail',
    hardGateRestatements: 'fail',
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
    // On the mandatory read path since issue #26, so it carries a budget even
    // though it is not a state file and has no Last updated stamp.
    'ai-team/README.md': 80,
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
  requiredReportSections: [
    'Verification',
    'Demonstration',
    'Process Review',
    'Model Use',
    'Documentation',
  ],

  // Paths that must never be committed, regardless of .gitignore state.
  forbiddenPaths: [/^keys\//, /^logs\//, /(^|\/)\.env$/, /(^|\/)ai-traces\.jsonl$/],

  // Credential material. Deliberately narrow: bare mentions of the env var
  // name appear throughout the docs and must not trip the check.
  secretPatterns: [
    { re: /\bsk-[A-Za-z0-9_-]{20,}/, label: 'OpenAI-style API key' },
    { re: /OPENAI_API_KEY\s*[=:]\s*['"]?sk-/, label: 'assigned OPENAI_API_KEY value' },
    { re: /Authorization:\s*Bearer\s+[A-Za-z0-9._-]{20,}/i, label: 'Bearer credential' },
  ],

  canonicalHardGatePath: 'ai-team/README.md',
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

// Which commits this run is responsible for.
//
// On a branch, that is everything since it left main, so merge-base works. On a
// push to main it does not: HEAD *is* main, merge-base returns HEAD, and the
// diff is empty — which silently turned the secrets scan into a no-op that
// reported "0 changed file(s) clean". The pushed range has to come from the
// event payload instead.
//
//   { kind: 'range' }   a real commit range to diff
//   { kind: 'none' }    HEAD is the default branch and nothing was pushed
//   { kind: 'unknown' } no origin/main to compare against; callers fail safe
function diffScope() {
  const before = process.env.PUSH_BEFORE ?? '';
  if (before && !/^0+$/.test(before)) {
    // Absent after a force-push or on a branch's first commit; fall through.
    const exists = git(['rev-parse', '--verify', '--quiet', `${before}^{commit}`], { allowFail: true });
    if (exists) return { kind: 'range', value: `${before}..HEAD` };
  }
  const base = git(['merge-base', 'HEAD', 'origin/main'], { allowFail: true });
  if (!base) return { kind: 'unknown' };
  if (base === git(['rev-parse', 'HEAD'], { allowFail: true })) return { kind: 'none' };
  return { kind: 'range', value: `${base}...HEAD` };
}

function diffNames(range, extraArgs = []) {
  const out = git(['diff', '--name-only', ...extraArgs, range], { allowFail: true });
  return out ? out.split('\n').filter(Boolean) : [];
}

function trackedFiles() {
  const out = git(['ls-files'], { allowFail: true });
  return out ? out.split('\n').filter(Boolean) : [];
}

function changedStateFiles(mode) {
  if (mode === 'commit') {
    return stagedFiles().filter((f) => CONFIG.stateFiles.includes(f));
  }
  // push / ci: any state file that differs from the upstream default branch.
  const scope = diffScope();
  // No remote to compare against: assume every state file is in play rather
  // than let an unverifiable stamp through.
  if (scope.kind === 'unknown') return CONFIG.stateFiles.filter((f) => existsSync(f));
  if (scope.kind === 'none') return [];
  const changed = diffNames(scope.value);
  return CONFIG.stateFiles.filter((f) => changed.includes(f));
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

// Files changed against the default branch, for modes where nothing is staged.
// When there is no range to diff, scan the whole tracked tree: a secrets check
// that examines nothing must not be able to report a pass.
function changedFiles() {
  const scope = diffScope();
  if (scope.kind !== 'range') return trackedFiles();
  return diffNames(scope.value, ['--diff-filter=ACM']);
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

// State freshness proves a file was touched today, not that it is true. On
// 2026-08-16 index.md named issue #24 as active work with a live branch while
// the ledger said nothing was active and the handoff said #24 was merged — all
// three stamped that day, all three passing. A fresh agent got three answers.
//
// task-ledger.md owns active work. This check does not ask index.md to repeat
// it; it only forbids index.md from contradicting it.
export function evaluateStateCoherence(indexText, ledgerText) {
  if (indexText === null || ledgerText === null) return null;

  const issueRefs = (text) => new Set([...text.matchAll(/#(\d+)/g)].map((m) => m[1]));

  const indexActive = sectionBody(parseSections(indexText), 'Active work');
  const ledgerActive = sectionBody(parseSections(ledgerText), 'Active');
  if (indexActive === null || ledgerActive === null) return null;

  const claimed = issueRefs(indexActive);
  const owned = issueRefs(ledgerActive);
  const contradicted = [...claimed].filter((n) => !owned.has(n));

  if (contradicted.length > 0) {
    return {
      message: `index.md calls issue(s) ${contradicted.map((n) => `#${n}`).join(', ')} active, but task-ledger.md does not list them as active.`,
      offender: `project-state/index.md (Active work) vs project-state/task-ledger.md (Active)`,
      fix: 'task-ledger.md owns active work. Update it, or point index.md at it instead of restating the list.',
      rule: 'ai-team/README.md hard gate 8 (a fresh agent can continue from project-state alone)',
    };
  }
  return null;
}

function checkStateCoherence(mode) {
  const read = (path) => {
    if (mode === 'commit') {
      const staged = stagedContent(path);
      if (staged) return staged;
    }
    return existsSync(path) ? readFileSync(path, 'utf8') : null;
  };

  const failure = evaluateStateCoherence(
    read('project-state/index.md'),
    read('project-state/task-ledger.md')
  );

  if (failure) {
    problem('stateCoherence', failure);
    return;
  }
  pass('stateCoherence', 'index.md and task-ledger.md agree on active work');
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

function checkHardGateRestatements() {
  const offenders = trackedFiles().filter((file) => {
    if (file === CONFIG.canonicalHardGatePath) return false;
    if (!existsSync(file)) return false;
    const content = readFileSync(file, 'utf8');
    return /^#{2,6}\s+Hard gates?\b/im.test(content);
  });

  if (offenders.length > 0) {
    problem('hardGateRestatements', {
      message: 'Hard-gate sections must not be restated outside the canonical operating-system README.',
      offender: offenders.join('\n'),
      fix: `Point readers to ${CONFIG.canonicalHardGatePath} or reference stable gate IDs instead of restating the hard gates.`,
      rule: 'ai-team/README.md hard gate authority',
    });
    return;
  }

  pass('hardGateRestatements', 'no duplicate hard-gate sections found');
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

// ---------------------------------------------------------------------------
// Increment report gate
//
// The report lives in the PR body, so only CI can see it. The gate reads
// evidence *within* the section that is supposed to carry it. Matching the
// whole body instead — as this did until issue #31 — meant a stray URL anywhere
// satisfied the demo gate and a stray sentence anywhere satisfied the
// delegation gate, so four empty headings plus one line passed.
// ---------------------------------------------------------------------------

// Body split into { heading text (lowercased) -> lines beneath it }.
function parseSections(body) {
  const sections = new Map();
  let current = null;
  for (const line of body.split('\n')) {
    const heading = line.match(/^#{1,4}\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1].toLowerCase();
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (current !== null) sections.get(current).push(line);
  }
  return sections;
}

// Headings may carry trailing words ("## Model Use And Cost"), so match on
// prefix rather than equality.
function sectionBody(sections, name) {
  const key = [...sections.keys()].find((k) => k.startsWith(name.toLowerCase()));
  return key === undefined ? null : sections.get(key).join('\n');
}

// A heading above the template's own unfilled labels is not evidence of
// anything. Drop blank lines and bare "Label:" scaffold before deciding
// whether a section actually says something.
const SCAFFOLD_LINE = /^[-*]?\s*[A-Za-z][A-Za-z0-9 /(),'`-]{0,60}:$/;

function substantive(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line !== '-' && line !== '*' && !SCAFFOLD_LINE.test(line))
    .join('\n')
    .trim();
}

// Permissive on phrasing, strict on negation. The gate exists to catch silence,
// not to police wording — a delegation worker found the narrow first version
// rejected "handed off verification to a cheaper model". Broadening it then
// admitted "no delegation was needed" as evidence *of* delegation, so each
// match is checked for a preceding negator.
const NEGATOR = /\b(no|not|without|never|didn'?t|cannot|can'?t|skipp?ed?|instead of|rather than|lacked?|absent)\b[^.\n]{0,30}$/i;

function hasUnnegated(text, re) {
  for (const match of text.matchAll(re)) {
    if (!NEGATOR.test(text.slice(Math.max(0, match.index - 40), match.index))) return true;
  }
  return false;
}

function evaluateProcessReview(processReview) {
  const text = substantive(processReview);
  if (!text) {
    return 'Process Review section has no substantive evidence.';
  }

  const namesReviewerOrExemption =
    /\b(process reviewer|reviewer|worker|subagent|independent|delegat\w*|handed to|assigned to)\b/i.test(text) ||
    /\b(exempt|exemption|exception)\b/i.test(text);
  const namesTierOrModel =
    /\b(model tier|tier|low-cost|cheaper|cheap|mid-capability|high-capability|gpt-[\w.-]+|haiku|luna|sonnet|opus|codex)\b/i.test(text) ||
    /\b(exempt|exemption|exception)\b/i.test(text);
  const namesChecklist = /\b(checklist|rule set|rules checked|definition of done|DoD|process gates?|increment report|PR report)\b/i.test(text);
  const givesEvidence = /\b(evidence|checked|inspected|ran|reviewed|found|reported|verified|confirmed)\b/i.test(text);
  const statesConcerns = /\b(no unresolved|none|unresolved|remaining|concerns?|gaps?|issues?|failures?|passed?|clean)\b/i.test(text);

  const missing = [];
  if (!namesReviewerOrExemption) missing.push('reviewer or exemption');
  if (!namesTierOrModel) missing.push('model tier or exemption');
  if (!namesChecklist) missing.push('checklist or rule set');
  if (!givesEvidence) missing.push('evidence returned');
  if (!statesConcerns) missing.push('unresolved-concerns status');

  return missing.length > 0 ? `Process Review section is missing: ${missing.join(', ')}.` : null;
}

// Returns null when the report passes, or the problem detail when it does not.
export function evaluateReport(rawBody, event) {
  // Template guidance is not evidence. Left in, an unfilled PR template would
  // pass on its own instructions — the comment reminding the author to declare
  // non-user-facing work reads as that declaration.
  const body = rawBody.replace(/<!--[\s\S]*?-->/g, '');

  if (!body.trim()) {
    // An empty body used to skip the entire gate, which made submitting no
    // report at all the cheapest way to satisfy it.
    if (event === 'pull_request') {
      return {
        message: 'Pull request body is empty, so the increment report is missing entirely.',
        offender: '(pull request body)',
        fix: 'Fill in ai-team/templates/increment-report.md as the PR body.',
        rule: 'ai-team/workflows/branch-and-pr.md (PR Requirements)',
      };
    }
    return null;
  }

  const sections = parseSections(body);
  const missing = [];
  const blank = [];

  for (const name of CONFIG.requiredReportSections) {
    const content = sectionBody(sections, name);
    if (content === null) missing.push(name);
    else if (!substantive(content)) blank.push(name);
  }

  if (missing.length > 0 || blank.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing section(s): ${missing.join(', ')}`);
    if (blank.length > 0) parts.push(`empty section(s): ${blank.join(', ')}`);
    return {
      message: `Increment report incomplete — ${parts.join('; ')}.`,
      offender: '(pull request body)',
      fix: 'Populate every required section using ai-team/templates/increment-report.md. A heading with no content below it does not count.',
      rule: 'ai-team/workflows/branch-and-pr.md (PR Requirements)',
    };
  }

  const processReviewFailure = evaluateProcessReview(sectionBody(sections, 'Process Review'));
  if (processReviewFailure) {
    return {
      message: processReviewFailure,
      offender: '(pull request body, Process Review section)',
      fix: 'Record the process reviewer and model tier or exemption, checklist/rule set checked, evidence returned, and unresolved concerns.',
      rule: 'ai-team/workflows/increment.md (Review Has Happened)',
    };
  }

  // Delegation is a hard gate. The exemption path must be an explicit written
  // claim, not silence — three increments in a row were exempted quietly
  // before this check existed.
  const modelUse = sectionBody(sections, 'Model Use');
  const hasDelegationEvidence =
    hasUnnegated(modelUse, /\b(delegat\w*|handed off|handed to|assigned to)/gi) ||
    hasUnnegated(modelUse, /\b(low-cost|cheaper|cheap|mid-capability)\s+(worker|model|tier)/gi) ||
    hasUnnegated(modelUse, /\bworker\b[^\n]{0,40}\b(tier|model|ran|inspected|verified|reported|found)/gi);
  const declaredExemption = /delegation (gate )?[^\n]*\b(not satisfied|exempt|exemption|exception)\b/i.test(modelUse);

  if (!hasDelegationEvidence && !declaredExemption) {
    return {
      message: 'Model Use section shows neither delegation evidence nor an explicit exemption.',
      offender: '(pull request body, Model Use section)',
      fix: 'Record the worker model tier and what it returned, or name which exemption in ai-team/model-policy.md applied.',
      rule: 'ai-team/README.md hard gate 11 (delegate or record the exemption)',
    };
  }

  // A "Demonstration" heading with no link is the failure mode that let issue
  // #4 be marked Done without a working demo. The rule applies to user-facing
  // work only, so an explicit written opt-out is accepted — but silence is
  // not, which keeps the exemption auditable rather than assumed.
  const demonstration = sectionBody(sections, 'Demonstration');
  const hasLink = /https?:\/\/\S+/.test(demonstration);
  const declaredNotUserFacing =
    /\bno (app\/demo|demo|app) link applies\b/i.test(demonstration) ||
    /\bnot user-facing\b/i.test(demonstration) ||
    // Unambiguous anywhere in the section: "change" makes it a claim about the
    // increment, not a passing remark.
    /\bno user-facing (product )?behaviou?r(al)? change/i.test(demonstration) ||
    // Bare "no user-facing behaviour" is also a declaration, but only anchored
    // to the start of a line (optionally after a template label) — otherwise an
    // embedded clause such as "confirmed no user-facing regressions" would
    // quietly become an exemption.
    /^[\s>*-]*(?:[a-z /()]{0,40}:\s*)?no user-facing\b/im.test(demonstration);

  if (!hasLink && !declaredNotUserFacing) {
    return {
      message: 'Demonstration section has no link and no explicit non-user-facing declaration.',
      offender: '(pull request body, Demonstration section)',
      fix: 'Add the checked demo link, or state explicitly that no app/demo link applies and why.',
      rule: 'ai-team/workflows/increment.md (Demo Or Deployment Is Available)',
    };
  }

  const hasDurableEvidence =
    /\b(durable evidence|evidence path)\s*:\s*\S+/i.test(demonstration) ||
    /\b(screenshot|screen shot|recording|video|artifact|artefact|log file|trace)\b[^\n]*(\b(attached|uploaded|committed)\b|https?:\/\/|[\w./-]+\.(png|jpe?g|webm|mp4|mov|jsonl|log)\b)/i.test(demonstration);

  if (hasLink && !declaredNotUserFacing && !hasDurableEvidence) {
    return {
      message: 'Demonstration section has a user-facing link but no durable evidence reference.',
      offender: '(pull request body, Demonstration section)',
      fix: 'Add a screenshot, recording, artifact, committed evidence path, or log/trace reference for the checked demo.',
      rule: 'ai-team/workflows/increment.md (Evidence Exists)',
    };
  }

  return null;
}

function checkReportSections() {
  const body = process.env.PR_BODY ?? '';
  const event = process.env.GITHUB_EVENT_NAME ?? '';
  const failure = evaluateReport(body, event);

  if (failure) {
    problem('reportSections', failure);
    return;
  }
  if (!body.trim()) {
    pass('reportSections', `no PR body and event is "${event || 'none'}"; skipped`);
    return;
  }
  pass('reportSections', 'all required report sections carry evidence');
}

// ---------------------------------------------------------------------------
// Runner
//
// Guarded so that test/increment-check.test.js can import the gate logic
// without running the checks — importing unguarded would re-enter `npm run
// build`, which runs the tests, which import this file.
// ---------------------------------------------------------------------------

function main() {
const mode = (process.argv.find((a) => a.startsWith('--mode=')) ?? '--mode=push').split('=')[1];

if (!['commit', 'push', 'ci'].includes(mode)) {
  console.error(`increment-check: unknown mode "${mode}" (expected commit, push, or ci)`);
  process.exit(2);
}

checkSecrets(mode);
checkStateFields();
checkStateFreshness(mode);
checkStateCoherence(mode);
checkHardGateRestatements();
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
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
