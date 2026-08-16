// Tests for the process gate itself. The checker enforces the hard gates, so
// it is production code: a false pass here is a hard gate that silently stopped
// working. Issue #31.
//
// evaluateReport is imported directly rather than run as a subprocess — the
// checker's ci mode runs `npm run build`, which runs these tests.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateReport } from '../ai-team/bin/increment-check.mjs';

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
  const base = (demo, modelUse) =>
    [
      '## Verification',
      'npm run build passed.',
      '## Demonstration',
      demo,
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
  assert.equal(
    evaluateReport(
      base('http://127.0.0.1:5173/ — checked, graph renders.', 'Delegated fixtures to a low-cost worker.'),
      'pull_request'
    ),
    null,
    'evidence in the right sections must pass'
  );
});

test('a negated delegation claim is not delegation evidence', () => {
  const body = (modelUse) =>
    [
      '## Verification',
      'Tests pass.',
      '## Demonstration',
      'Not user-facing.',
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
