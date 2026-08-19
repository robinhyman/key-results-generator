import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { ESLint } from 'eslint';

function git(args, cwd, allowFail = false) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (allowFail) return '';
    throw error;
  }
}

function codeFiles(cwd) {
  const output = git(['ls-files', '--cached'], cwd, true);
  return output.split('\n').filter((file) => /\.(?:js|mjs)$/.test(file));
}

export function changedFiles(cwd, mode) {
  if (mode === 'commit') {
    return git(['diff', '--cached', '--name-only', '--diff-filter=ACM'], cwd, true).split('\n').filter(Boolean);
  }
  const base = git(['merge-base', 'HEAD', 'origin/main'], cwd, true);
  const branchChanges = base && base !== git(['rev-parse', 'HEAD'], cwd, true)
    ? git(['diff', '--name-only', '--diff-filter=ACM', `${base}...HEAD`], cwd, true).split('\n')
    : [];
  const worktreeChanges = git(['diff', '--name-only', '--diff-filter=ACM', 'HEAD'], cwd, true).split('\n');
  return [...new Set([...branchChanges, ...worktreeChanges].filter(Boolean))];
}

export function readFileFromMergeBase(cwd, file) {
  const base = git(['merge-base', 'HEAD', 'origin/main'], cwd, true);
  return base ? git(['show', `${base}:${file}`], cwd, true) : '';
}

export function repositoryFileContent(cwd, file, mode) {
  return mode === 'commit'
    ? git(['show', `:${file}`], cwd, true)
    : readFileSync(resolve(cwd, file), 'utf8');
}

function lineCount(content) {
  const lines = content.split('\n');
  return lines.at(-1) === '' ? lines.length - 1 : lines.length;
}

function findingMaximum(messages, ruleId, pattern) {
  return messages
    .filter((message) => message.ruleId === ruleId)
    .map((message) => Number(message.message.match(pattern)?.[1] ?? 0))
    .reduce((maximum, value) => Math.max(maximum, value), 0);
}

function importsFor(file, content, allFiles) {
  const imports = [];
  const pattern = /(?:\bfrom\s+|^\s*import\s*)['"]([^'"]+)['"]/gm;
  for (const match of content.matchAll(pattern)) {
    if (!match[1].startsWith('.')) continue;
    const raw = normalize(join(dirname(file), match[1])).split(sep).join('/');
    const candidates = [raw, `${raw}.js`, `${raw}.mjs`, `${raw}/index.js`, `${raw}/index.mjs`];
    const target = candidates.find((candidate) => allFiles.has(candidate));
    if (target) imports.push(target);
  }
  return [...new Set(imports)].sort();
}

function canonicalCycle(nodes) {
  const ring = nodes.slice(0, -1);
  const rotations = ring.map((_, index) => [...ring.slice(index), ...ring.slice(0, index)]);
  const best = rotations.map((items) => items.join(' -> ')).sort()[0];
  const start = best.split(' -> ')[0];
  return `${best} -> ${start}`;
}

function dependencyCycles(files) {
  const cycles = new Set();
  const visiting = [];
  const visited = new Set();

  function visit(file) {
    const activeIndex = visiting.indexOf(file);
    if (activeIndex >= 0) {
      cycles.add(canonicalCycle([...visiting.slice(activeIndex), file]));
      return;
    }
    if (visited.has(file)) return;
    visiting.push(file);
    for (const dependency of files[file]?.imports ?? []) visit(dependency);
    visiting.pop();
    visited.add(file);
  }

  for (const file of Object.keys(files).sort()) visit(file);
  return [...cycles].sort().map((cycle) => cycle.split(' -> '));
}

export async function collectMetrics(cwd = process.cwd(), mode = 'push') {
  const paths = codeFiles(cwd);
  const allFiles = new Set(paths);
  const eslint = new ESLint({
    cwd,
    overrideConfig: {
      rules: {
        complexity: ['warn', 0],
        'max-lines-per-function': ['warn', { max: 1, skipBlankLines: true, skipComments: true, IIFEs: true }],
      },
    },
  });
  const files = {};

  for (const file of paths.sort()) {
    const content = repositoryFileContent(cwd, file, mode);
    const [lint] = await eslint.lintText(content, { filePath: resolve(cwd, file) });
    if (lint.errorCount > 0) {
      const details = lint.messages.filter((message) => message.severity === 2).map((message) => `${file}:${message.line} ${message.message}`).join('\n');
      throw new Error(`ESLint errors must be fixed before maintainability can be assessed:\n${details}`);
    }
    files[file] = {
      lines: lineCount(content),
      maxComplexity: findingMaximum(lint.messages, 'complexity', /complexity of (\d+)/i),
      maxFunctionLines: findingMaximum(lint.messages, 'max-lines-per-function', /\((\d+)\)/),
      imports: importsFor(file, content, allFiles),
    };
  }

  return { files, cycles: dependencyCycles(files) };
}
