// Build packs/macros.db from packs/_source/macros.json (stable _ids live in source).
// Usage: node scripts/build-macros.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const macros = JSON.parse(readFileSync(join(root, 'packs', '_source', 'macros.json'), 'utf8'));

const seen = new Set();
const lines = macros.map((m, i) => {
  if (!/^[A-Za-z0-9]{16}$/.test(m._id)) throw new Error(`bad _id: ${m._id}`);
  if (seen.has(m._id)) throw new Error(`duplicate _id: ${m._id}`);
  seen.add(m._id);
  if (!m.command || !m.name) throw new Error(`macro ${i} needs name + command`);
  return JSON.stringify({
    _id: m._id,
    name: m.name,
    type: 'script',
    scope: 'global',
    author: '',
    img: m.img || 'icons/svg/dice-target.svg',
    command: m.command,
    ownership: { default: 0 },
    folder: null,
    sort: i * 100000,
    flags: {}
  });
});
writeFileSync(join(root, 'packs', 'macros.db'), lines.join('\n') + '\n');
console.log(`macros.db: ${lines.length} macros`);
