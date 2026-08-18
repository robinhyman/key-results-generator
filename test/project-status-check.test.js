import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const script = new URL('../ai-team/bin/project-status-check.mjs', import.meta.url).pathname;

test('project-status-check passes when issue and expected statuses match flattened gh output', () => {
  const result = runProjectStatusCheck(
    ['--issue=43', '--agent-status=Review', '--status=In Progress'],
    {
      items: [
        {
          'agent Status': 'Review',
          status: 'In Progress',
          content: { number: 43 },
        },
      ],
    }
  );

  assert.equal(result.status, 0);
  assert.match(result.output, /issue #43 is in Project 4/);
});

test('project-status-check passes when issue and expected statuses match fieldValues output', () => {
  const result = runProjectStatusCheck(
    ['--issue=43', '--agent-status=Done', '--status=Done'],
    {
      items: [
        {
          content: { number: 43 },
          fieldValues: [
            { fieldName: 'Agent Status', value: 'Done' },
            { fieldName: 'Status', value: 'Done' },
          ],
        },
      ],
    }
  );

  assert.equal(result.status, 0);
});

test('project-status-check fails when the issue is missing from the Project', () => {
  const result = runProjectStatusCheck(['--issue=43', '--agent-status=Review'], {
    items: [{ 'agent Status': 'Review', content: { number: 42 } }],
  });

  assert.notEqual(result.status, 0);
  assert.match(result.output, /issue #43 is not in Project 4/);
});

test('project-status-check fails on status mismatches', () => {
  const result = runProjectStatusCheck(['--issue=43', '--agent-status=Review', '--status=Done'], {
    items: [{ 'agent Status': 'In Progress', status: 'Todo', content: { number: 43 } }],
  });

  assert.notEqual(result.status, 0);
  assert.match(result.output, /Agent Status is "In Progress", expected "Review"/);
  assert.match(result.output, /Status is "Todo", expected "Done"/);
});

function runProjectStatusCheck(args, fixture) {
  try {
    const output = execFileSync(process.execPath, [script, ...args], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PROJECT_STATUS_ITEMS_JSON: JSON.stringify(fixture),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, output };
  } catch (error) {
    return {
      status: error.status ?? 1,
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
    };
  }
}
