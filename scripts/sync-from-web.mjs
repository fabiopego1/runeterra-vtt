// Sync the rules dataset from the Runeterra web app clone into data/ (read-only on the clone,
// except the optional --pull). The Foundry system keeps its own copies of the web's data files;
// this keeps them from drifting. Never commits; review `git diff` afterwards.
//
//   node scripts/sync-from-web.mjs            copy changed files + sanity check
//   node scripts/sync-from-web.mjs --check    only report differences (writes nothing)
//   node scripts/sync-from-web.mjs --pull     `git pull --ff-only` in the clone first
//   node scripts/sync-from-web.mjs --test     run the Node test suite afterwards
//   --web <dir> (or env WEB_REPO) overrides the clone path.
//
// Not copied: files the system does not load (see system.json "scripts") and the web's sealed
// GM vault (js/gm-vault.js) — antagonist data is out of scope here.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import manifest from '../system.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = f => args.includes(f);
const webIdx = args.indexOf('--web');
const WEB = path.resolve(webIdx >= 0 ? args[webIdx + 1] : (process.env.WEB_REPO ?? 'D:/FoundryVTT/runeterra-work/runeterra-web'));
if (!fs.existsSync(path.join(WEB, 'js', 'data-rules.js'))) {
  console.error(`Clone do site não encontrado em ${WEB} (use --web <dir> ou WEB_REPO).`); process.exit(2);
}

// `safe.directory` is passed per command: the clone sits on a filesystem without ownership info.
const git = (...a) => execFileSync('git', ['-c', `safe.directory=${WEB.replaceAll('\\', '/')}`, '-C', WEB, ...a], { encoding: 'utf8' }).trim();

try {
  if (flag('--pull')) {
    console.log(git('status', '--porcelain') ? 'AVISO: o clone tem mudanças locais — pull pode falhar.' : '');
    console.log(git('pull', '--ff-only'));
  } else {
    git('fetch', 'origin');
    const behind = Number(git('rev-list', '--count', 'HEAD..origin/main'));
    if (behind > 0) console.log(`⚠ O clone do site está ${behind} commit(s) atrás de origin/main. Rode com --pull para atualizar.\n`);
  }
  console.log(`Site: ${git('log', '-1', '--format=%h %ad %s', '--date=short')}\n`);
} catch (e) {
  console.error('git falhou no clone do site:', e.stderr?.toString().trim() || e.message);
  if (flag('--pull')) process.exit(3);
  console.error('(seguindo com o que há no clone)\n');
}

// Files the system loads as data (system.json scripts under data/), mapped to the web's js/ tree.
const targets = manifest.scripts.filter(s => s.startsWith('data/'));
let changed = 0;
const lines = t => t.split('\n');
for (const t of targets) {
  const src = path.join(WEB, 'js', t.slice('data/'.length));
  const dst = path.join(root, t);
  if (!fs.existsSync(src)) { console.log(`  = ${t} (próprio do VTT, sem equivalente no site)`); continue; }
  const a = fs.readFileSync(src, 'utf8');
  const b = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8') : '';
  if (a === b) { console.log(`  ✓ ${t}`); continue; }
  const sa = new Set(lines(a)), sb = new Set(lines(b));
  const add = lines(a).filter(l => !sb.has(l)).length, del = lines(b).filter(l => !sa.has(l)).length;
  console.log(`  ${flag('--check') ? '≠' : '↻'} ${t}  (+${add} −${del} linhas)`);
  if (!flag('--check')) fs.writeFileSync(dst, a);
  changed++;
}
console.log(`\n${changed} arquivo(s) ${flag('--check') ? 'diferem' : 'atualizados'}.`);

// Sanity: the dataset must still load and expose what the system code reads.
if (!flag('--check')) {
  const { dataset } = await import('./_load-dataset.mjs');
  const need = ['ABILITIES', 'PRINCIPLES', 'BACKGROUNDS', 'POWER_SOURCES', 'ARCHETYPES', 'PERSONALITIES', 'HEALTH_TABLE', 'TRAIT_CATEGORIES', 'RETCONS', 'PRINCIPLE_LORE'];
  const missing = need.filter(k => dataset[k] == null);
  if (missing.length) { console.error(`✗ Dataset sem: ${missing.join(', ')} — o formato do site pode ter mudado.`); process.exit(4); }
  console.log('✓ Dataset carrega e expõe os catálogos esperados.');
}

if (flag('--test')) {
  for (const t of ['test-retcon', 'test-import-fixture', 'test-rules-text', 'test-zone-locks', 'test-divided']) {
    console.log(`\n▶ ${t}`);
    try { execFileSync('node', [path.join(root, 'scripts', `${t}.mjs`)], { stdio: 'inherit' }); }
    catch { console.error(`✗ ${t} falhou`); process.exitCode = 5; }
  }
}
