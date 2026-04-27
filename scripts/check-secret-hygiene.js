#!/usr/bin/env node

/**
 * Lightweight secret hygiene checks.
 * - Blocks tracked/staged `.env`
 * - Blocks frontend env secret variables (VITE_*SECRET*)
 * - Blocks hardcoded Supabase project URLs (https://<ref>.supabase.co) in JS/TS sources
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const repoRoot = process.cwd();
const stagedOnly = process.argv.includes('--staged');

const TEXT_FILE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.yml', '.yaml', '.sql',
  '.env', '.txt', '.html', '.css'
]);

const forbiddenPatterns = [
  /VITE_[A-Z0-9_]*SECRET[A-Z0-9_]*/g,
];

/** Real project refs are long alphanumeric slugs; excludes placeholders like [your-project]. */
const HARDCODED_SUPABASE_PROJECT_URL =
  /https:\/\/[a-z0-9]{15,}\.supabase\.co\b/gi;

const CODE_EXTENSIONS_SUPABASE_URL_CHECK = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
]);

function isCodeFileForSupabaseUrlCheck(filePath) {
  return CODE_EXTENSIONS_SUPABASE_URL_CHECK.has(
    path.extname(filePath).toLowerCase(),
  );
}

function lineAllowsHardcodedSupabaseUrl(line) {
  const t = line;
  if (/process\.env\.|import\.meta\.env/.test(t)) return true;
  if (/your[-_]project|placeholder|changeme|example\.ref/i.test(t)) return true;
  if (/https:\/\/\*\.supabase\.co/.test(t)) return true;
  return false;
}

function scanHardcodedSupabaseUrls(relativePaths) {
  const violations = [];
  for (const relativePath of relativePaths) {
    if (!isCodeFileForSupabaseUrlCheck(relativePath)) continue;

    const absolutePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
      continue;
    }

    const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (lineAllowsHardcodedSupabaseUrl(line)) continue;

      HARDCODED_SUPABASE_PROJECT_URL.lastIndex = 0;
      if (HARDCODED_SUPABASE_PROJECT_URL.test(line)) {
        violations.push(
          `${relativePath}:${i + 1}: hardcoded Supabase project URL — use SUPABASE_URL / VITE_SUPABASE_URL from env`,
        );
      }
    }
  }
  return violations;
}

function run(command) {
  return execSync(command, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
}

function isTextCandidate(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_FILE_EXTENSIONS.has(ext)) return true;
  return path.basename(filePath).toLowerCase() === '.env.example';
}

function getFilesToScan() {
  if (stagedOnly) {
    const output = run('git diff --cached --name-only --diff-filter=ACMRT');
    return output ? output.split('\n').filter(Boolean) : [];
  }

  const output = run('git ls-files');
  return output ? output.split('\n').filter(Boolean) : [];
}

function fail(message, details = []) {
  console.error(`\n[secret-hygiene] ${message}`);
  for (const line of details) console.error(`  - ${line}`);
  process.exit(1);
}

function main() {
  const failures = [];

  // .env must never be tracked
  try {
    run('git ls-files --error-unmatch .env');
    failures.push('.env is tracked by git. Run: git rm --cached .env');
  } catch {
    // expected when .env is not tracked
  }

  // .env should never be staged except for removal from tracking
  try {
    const stagedEnvStatus = run('git diff --cached --name-status -- .env');
    if (stagedEnvStatus && !stagedEnvStatus.startsWith('D')) {
      failures.push('.env is staged for commit. Unstage it before committing.');
    }
  } catch {
    // no staged .env
  }

  const files = getFilesToScan().filter(isTextCandidate);
  const patternViolations = [];

  for (const relativePath of files) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) continue;

    const content = fs.readFileSync(absolutePath, 'utf8');
    for (const pattern of forbiddenPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        patternViolations.push(`${relativePath}: contains forbidden frontend secret variable pattern`);
        break;
      }
    }
  }

  if (patternViolations.length) {
    failures.push(...patternViolations);
  }

  const supabaseUrlViolations = scanHardcodedSupabaseUrls(files);
  if (supabaseUrlViolations.length) {
    failures.push(...supabaseUrlViolations);
  }

  if (failures.length) {
    fail('Secret hygiene checks failed.', failures);
  }

  console.log('[secret-hygiene] Passed.');
}

main();
