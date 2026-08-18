#!/usr/bin/env node
// Local GitHub Project status checker for closeout.
//
// Usage:
//   node ai-team/bin/project-status-check.mjs --issue=43 --agent-status="Review"
//   node ai-team/bin/project-status-check.mjs --issue=43 --agent-status="Done" --status="Done"

import { execFileSync } from 'node:child_process';

const PROJECT_NUMBER = '4';
const PROJECT_OWNER = 'robinhyman';

function arg(name) {
  const found = process.argv.find((item) => item.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : '';
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function fail(message) {
  console.error(`project-status-check: ${message}`);
  process.exit(1);
}

const issue = arg('issue');
const expectedAgentStatus = arg('agent-status');
const expectedStatus = arg('status');

if (!/^\d+$/.test(issue)) fail('pass --issue=<number>');
if (!expectedAgentStatus && !expectedStatus) {
  fail('pass --agent-status=<value>, --status=<value>, or both');
}

let items;
try {
  const rawItems =
    process.env.PROJECT_STATUS_ITEMS_JSON ||
    gh([
      'project',
      'item-list',
      PROJECT_NUMBER,
      '--owner',
      PROJECT_OWNER,
      '--format',
      'json',
      '--limit',
      '200',
    ]);
  items = JSON.parse(rawItems).items;
} catch (error) {
  fail(`could not read Project ${PROJECT_NUMBER}: ${error.stderr || error.message}`);
}

const item = items.find((candidate) => String(candidate.content?.number) === issue);
if (!item) fail(`issue #${issue} is not in Project ${PROJECT_NUMBER}`);

const fieldValues = Array.isArray(item.fieldValues)
  ? Object.fromEntries(item.fieldValues.map((field) => [field.fieldName, field.value]))
  : {};
const fields = { ...item, ...fieldValues };
const problems = [];

const actualAgentStatus = fields['Agent Status'] ?? fields['agent Status'];
const actualStatus = fields.Status ?? fields.status;

if (expectedAgentStatus && actualAgentStatus !== expectedAgentStatus) {
  problems.push(`Agent Status is "${actualAgentStatus || '(unset)'}", expected "${expectedAgentStatus}"`);
}

if (expectedStatus && actualStatus !== expectedStatus) {
  problems.push(`Status is "${actualStatus || '(unset)'}", expected "${expectedStatus}"`);
}

if (problems.length > 0) fail(problems.join('; '));

console.log(
  `project-status-check: issue #${issue} is in Project ${PROJECT_NUMBER}` +
    (expectedAgentStatus ? `, Agent Status=${expectedAgentStatus}` : '') +
    (expectedStatus ? `, Status=${expectedStatus}` : '')
);
