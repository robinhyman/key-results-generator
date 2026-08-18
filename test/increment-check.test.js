// Tests for the process gate itself. The checker enforces the hard gates, so
// it is production code: a false pass here is a hard gate that silently stopped
// working. Issue #31.
//
// evaluateReport is imported directly rather than run as a subprocess — the
// checker's ci mode runs `npm run build`, which runs these tests.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateReport, evaluateStateCoherence } from '../ai-team/bin/increment-check.mjs';

const fixtures = JSON.parse(
  readFileSync(new URL('./fixtures/pr-bodies.json', import.meta.url), 'utf8')
);

test('PR-body fixture table', async (t) => {
  for (const fixture of fixtures) {
    await t.test(`${fixture.expect}: ${fixture.name}`, () => {
      const result = evaluateReport(fixture.body, fixture.event ?? 'pull_request');
      const actual = result ? 'fail' : 'pass';
      assert.equal(
        actual,
        fixture.expect,
        `expected ${fixture.expect} (${fixture.reason})` +
          (result ? `, but the gate reported: ${result.message}` : ', but the gate passed it')
      );
    });
  }
});

test('fixture table covers both outcomes and the known bypasses', () => {
  assert.ok(fixtures.length >= 40, 'fixture table should stay comprehensive');
  assert.ok(fixtures.some((f) => f.expect === 'pass'), 'needs passing cases');
  assert.ok(fixtures.some((f) => f.expect === 'fail'), 'needs failing cases');
});

// The two bypasses an external audit demonstrated against the pre-#31 gate.
// Pinned separately from the table so they cannot be lost in a fixture edit.
test('regression: an empty PR body fails on a pull_request', () => {
  const result = evaluateReport('', 'pull_request');
  assert.ok(result, 'empty body must not pass');
  assert.match(result.message, /empty/i);
});

test('regression: empty headings plus stray evidence elsewhere fails', () => {
  const body = [
    '## Verification',
    '',
    '## Demonstration',
    '',
    '## Model Use',
    '',
    '## Documentation',
    '',
    'https://example.com/anything',
    'Delegated to a cheaper worker.',
  ].join('\n');
  const result = evaluateReport(body, 'pull_request');
  assert.ok(result, 'four empty sections must not pass');
  assert.match(result.message, /empty section/i);
});

test('evidence must sit in the section that claims it', () => {
  const base = (demo, modelUse, processReview = 'Low-cost worker checked the increment report against the DoD; no gaps found.') =>
    [
      '## Verification',
      'npm run build passed.',
      '## Demonstration',
      demo,
      '## Review',
      'Lead reviewed the diff.',
      '## Process Review',
      processReview,
      '## Model Use',
      modelUse,
      '## Documentation',
      'No doc impact.',
    ].join('\n');

  assert.ok(
    evaluateReport(base('Nothing to show.', 'Delegated the smoke check to a cheap worker.'), 'pull_request'),
    'a Demonstration section with neither link nor declaration must fail'
  );
  assert.ok(
    evaluateReport(base('http://127.0.0.1:5173/', 'Kept everything on the lead model.'), 'pull_request'),
    'a Model Use section with no delegation claim must fail'
  );
  assert.ok(
    evaluateReport(
      base('http://127.0.0.1:5173/ — checked, graph renders.', 'Delegated fixtures to a low-cost worker.'),
      'pull_request'
    ),
    'a user-facing link without durable evidence must fail'
  );
  assert.ok(
    evaluateReport(
      base(
        'http://127.0.0.1:5173/ — checked, graph renders. Committed changes include the UI.',
        'Delegated fixtures to a low-cost worker.'
      ),
      'pull_request'
    ),
    'a generic committed-change sentence must not count as durable demo evidence'
  );
  assert.equal(
    evaluateReport(
      base(
        'http://127.0.0.1:5173/ — checked, graph renders. Durable evidence: committed screenshot in project-state/evidence/41.png.',
        'Delegated fixtures to a low-cost worker.'
      ),
      'pull_request'
    ),
    null,
    'a user-facing link with durable evidence must pass'
  );
  assert.ok(
    evaluateReport(
      base(
        'Not user-facing.',
        'Delegated fixtures to a low-cost worker.',
        ''
      ),
      'pull_request'
    ),
    'a missing Process Review claim must fail'
  );
  assert.ok(
    evaluateReport(
      base(
        'Not user-facing.',
        'Delegated fixtures to a low-cost worker.',
        'Looks good.'
      ),
      'pull_request'
    ),
    'a weak nonempty Process Review claim must fail'
  );
  assert.ok(
    evaluateReport(
      [
        '## Verification',
        'Low-cost worker checked the process evidence.',
        '## Demonstration',
        'Not user-facing.',
        '## Review',
        'Lead reviewed the diff.',
        '## Process Review',
        'Evidence:',
        '## Model Use',
        'Delegated fixtures to a low-cost worker.',
        '## Documentation',
        'Updated docs.',
      ].join('\n'),
      'pull_request'
    ),
    'process-review evidence in the wrong section or only scaffold must fail'
  );
  assert.equal(
    evaluateReport(
      [
        '## Verification',
        'npm run build passed.',
        '## Demonstration',
        'Not user-facing.',
        '## Process Review',
        'Reviewer/model tier: low-cost worker.',
        'Checklist: increment Definition of Done and PR report sections.',
        'Evidence returned: inspected changed files and confirmed process evidence.',
        'Unresolved process concerns: none.',
        '## Model Use',
        'Delegated fixtures to a low-cost worker.',
        '## Documentation',
        'Updated docs.',
      ].join('\n'),
      'pull_request'
    ),
    null,
    'structured Process Review evidence must pass'
  );
});

test('a negated delegation claim is not delegation evidence', () => {
  const body = (modelUse) =>
    [
      '## Verification',
      'Tests pass.',
      '## Demonstration',
      'Not user-facing.',
      '## Review',
      'Lead reviewed the diff.',
      '## Process Review',
      'Low-cost worker checked the report against the increment DoD; no process concerns found.',
      '## Model Use',
      modelUse,
      '## Documentation',
      'None.',
    ].join('\n');

  assert.ok(evaluateReport(body('No delegation was needed here.'), 'pull_request'));
  assert.ok(evaluateReport(body('Completed without delegation.'), 'pull_request'));
  assert.equal(
    evaluateReport(
      body('No delegation of the design, but the fixture sweep was handed to a cheaper worker.'),
      'pull_request'
    ),
    null,
    'a body that both declines and performs delegation has delegated'
  );
});

// The template is prefilled into every PR body by GitHub. If submitting it
// unchanged passed the gate, the gate would be decorative.
test('the unfilled PR template does not satisfy the gate', () => {
  const template = readFileSync(
    new URL('../.github/pull_request_template.md', import.meta.url),
    'utf8'
  );
  const result = evaluateReport(template, 'pull_request');
  assert.ok(result, 'an unedited template must not pass');
  assert.match(result.message, /empty section/i);
});

test('template guidance in HTML comments is not evidence', () => {
  const body = [
    '## Verification',
    'Tests pass.',
    '## Demonstration',
    '<!-- If there is no user-facing change, say so explicitly here. -->',
    '## Model Use',
    'Delegated the sweep to a cheaper worker.',
    '## Documentation',
    'None.',
  ].join('\n');
  const result = evaluateReport(body, 'pull_request');
  assert.ok(result, 'a comment must not satisfy the demonstration gate');
  assert.match(result.message, /empty section|no link/i);
});

// State coherence — issue #32. Freshness proves a file was edited today, not
// that it agrees with its neighbours.
test('state coherence: index must not contradict the ledger', () => {
  const index = (active) => `# Index\n\n## Active work\n\n${active}\n\n## Next action\n\nSomething.\n`;
  const ledger = (active) => `# Task Ledger\n\n## Active\n\n${active}\n\n## Blocked\n\n- None.\n`;

  // The exact contradiction found on main on 2026-08-16.
  const drifted = evaluateStateCoherence(
    index('Issue #24: compact project-state. Branch `chore/24-state-compaction`.'),
    ledger('- None. The operating-model audit is complete through #28.')
  );
  assert.ok(drifted, 'a stale active-work claim in index.md must fail');
  assert.match(drifted.message, /#24/);

  assert.equal(
    evaluateStateCoherence(index('See `project-state/task-ledger.md`.'), ledger('- None.')),
    null,
    'pointing at the ledger instead of restating it must pass'
  );
  assert.equal(
    evaluateStateCoherence(index('Issue #31 is active.'), ledger('- `#31` Harden the gate.')),
    null,
    'agreement must pass'
  );
  assert.ok(
    evaluateStateCoherence(index('Issues #31 and #32 are active.'), ledger('- `#31` Harden the gate.')),
    'a partially stale list must fail'
  );
  assert.equal(
    evaluateStateCoherence(null, ledger('- None.')),
    null,
    'a missing file is the freshness check\'s problem, not this one'
  );
});

test('commit-mode integration catches staged secrets and stale state stamps', () => {
  const repo = fixtureRepo();
  writeFileSync(join(repo, '.env'), 'OPENAI_API_KEY=' + 'sk-' + 'thislookssecret000000000000\n');
  writeFileSync(
    join(repo, 'project-state/status.md'),
    '# Status\n\nLast updated: 2000-01-01\n'
  );
  execFileSync('git', ['add', '.'], { cwd: repo });

  const result = runIncrementCheck(repo, 'commit');
  assert.notEqual(result.status, 0);
  assert.match(result.output, /secrets/);
  assert.match(result.output, /stateFreshness/);
});

test('push-mode integration catches state budget violations', () => {
  const repo = fixtureRepo();
  writeFileSync(
    join(repo, 'project-state/handoff.md'),
    '# Handoff\n\nLast updated: ' + todayForTest() + '\n\n' + Array.from({ length: 90 }, (_, index) => `- line ${index}`).join('\n')
  );

  const result = runIncrementCheck(repo, 'push');
  assert.notEqual(result.status, 0);
  assert.match(result.output, /stateBudget/);
});

test('push-mode integration catches duplicate hard-gate section variants', () => {
  const repo = fixtureRepo();
  writeFileSync(join(repo, 'docs.md'), '# Docs\n\n### Hard Gates Summary\n\n- Do not restate these.\n');
  execFileSync('git', ['add', 'docs.md'], { cwd: repo });
  execFileSync('git', ['commit', '-m', 'add duplicated gates'], { cwd: repo, stdio: 'ignore' });

  const result = runIncrementCheck(repo, 'push');
  assert.notEqual(result.status, 0);
  assert.match(result.output, /hardGateRestatements/);
});

function fixtureRepo() {
  const repo = mkdtempSync(join(tmpdir(), 'increment-check-'));
  mkdirSync(join(repo, 'ai-team/bin'), { recursive: true });
  mkdirSync(join(repo, 'project-state'), { recursive: true });
  writeFileSync(join(repo, 'package.json'), '{"type":"module","scripts":{"lint":"node --version","build":"node --version"}}\n');
  writeFileSync(join(repo, 'ai-team/README.md'), '# AI Team\n\n## Hard gates\n\n- Canonical.\n');
  for (const file of [
    'index.md',
    'status.md',
    'handoff.md',
    'task-ledger.md',
    'verification.md',
    'decisions.md',
  ]) {
    writeFileSync(join(repo, 'project-state', file), `# ${file}\n\nLast updated: ${todayForTest()}\n\n## Active\n\n- None.\n`);
  }
  writeFileSync(join(repo, 'project-state/index.md'), `# Index\n\nLast updated: ${todayForTest()}\n\n## Active work\n\nSee ledger.\n`);
  execFileSync('git', ['init'], { cwd: repo, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repo });
  execFileSync('git', ['add', '.'], { cwd: repo });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: repo, stdio: 'ignore' });
  return repo;
}

function runIncrementCheck(cwd, mode) {
  try {
    const output = execFileSync(
      process.execPath,
      [new URL('../ai-team/bin/increment-check.mjs', import.meta.url).pathname, `--mode=${mode}`],
      { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return { status: 0, output };
  } catch (error) {
    return {
      status: error.status ?? 1,
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
    };
  }
}

function todayForTest() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
