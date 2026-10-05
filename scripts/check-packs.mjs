// Validate packs/macros.db: JSON lines, required fields, and node --check on each command.
// Usage: node scripts/check-packs.mjs (exit 1 on failure)
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lines = readFileSync(join(root, 'packs', 'macros.db'), 'utf8').trim().split('\n');
let fail = 0;
lines.forEach((line, i) => {
  let m;
  try {
    m = JSON.parse(line);
  } catch (e) {
    console.log(`FAIL line ${i + 1}: not JSON`);
    fail++;
    return;
  }
  for (const k of ['_id', 'name', 'type', 'scope', 'command']) {
    if (!m[k]) {
      console.log(`FAIL ${m.name ?? i}: missing ${k}`);
      fail++;
    }
  }
  if (m.type !== 'script' || m.scope !== 'global') {
    console.log(`FAIL ${m.name}: type/scope must be script/global`);
    fail++;
  }
  const tmp = join(tmpdir(), `macro-check-${i}.mjs`);
  writeFileSync(tmp, m.command);
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
    console.log(`PASS ${m.name}`);
  } catch (e) {
    console.log(`FAIL ${m.name}: command syntax error`);
    fail++;
  } finally {
    try {
      unlinkSync(tmp);
    } catch { /* noop */ }
  }
});
console.log(fail ? `${fail} FAILURES` : 'ALL PACK CHECKS PASSED');
process.exit(fail ? 1 : 0);
