// Import pipeline against the web app's own fixture (champion.json), no Foundry needed:
// parseChampion → buildChampionImport → expected derived values and ability items.
// Golden values were confirmed in a live Foundry world (2026-10-09). Run: node scripts/test-import-fixture.mjs
import fs from 'node:fs';
import { FIXTURE } from './_load-dataset.mjs';
globalThis.foundry = { utils: { deepClone: structuredClone } };
const { parseChampion, buildChampionImport, mergeForReimport } = await import('../module/import.js');

let fail = 0;
const canon = v => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const check = (name, got, exp) => {
  const ok = JSON.stringify(canon(got)) === JSON.stringify(canon(exp));
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : `: ${JSON.stringify(got)} (esp ${JSON.stringify(exp)})`}`);
};
const raw = fs.readFileSync(FIXTURE, 'utf8');

const parsed = parseChampion(raw);
check('fixture parses without errors', parsed.errors, []);

const built = await buildChampionImport(raw);
check('build ok', built.ok, true);
check('no warnings', built.warnings, []);
const d = built.actorData.system.derived;
check('status (Vontade de Ferro: red d8→d10)', d.status, { green: 'd8', yellow: 'd8', red: 'd10' });
check('health max', d.healthMax, 32);
check('powers', d.powers, { cosmic: 'd10', flight: 'd6', illusions: 'd8', 'remote-viewing': 'd8', transmutation: 'd8' });
check('qualities', d.qualities, { conviction: 'd10', history: 'd8', 'magical-lore': 'd10', 'otherworldly-mythos': 'd10', 'rp-quality': 'd8' });
check('retcon kept on the actor', built.actorData.system.character.retcon, { type: 'red-up' });

const byZone = z => built.items.filter(i => i.system.zone === z && i.system.group !== 'principle').length;
check('ability items: 2 yellow+1 yellow, 3 green, 2 red', [byZone('green'), byZone('yellow'), byZone('red')], [2, 3, 2]);
check('principle items', built.items.filter(i => i.system.group === 'principle').map(i => i.system.iid), ['pr:bg', 'pr:arch']);
check('all-or-nothing: bad ability name rejects', (await buildChampionImport(raw.replace('Subdue', 'Nope'))).ok, false);
check('wrong version rejected', (await buildChampionImport(raw.replace('"v":1', '"v":2'))).ok, false);
// Re-import keeps Foundry-only state (current Health, portrait); a first fill takes the JSON's.
const actor = h => ({ system: { play: { current: String(h) }, health: { value: h } } });
const first = mergeForReimport(built, actor(5), false);
check('first fill: takes JSON health (max) and its img', [first.system.health.value, first.img], [32, built.actorData.img]);
const kept = mergeForReimport(built, actor(20), true);
check('re-import: keeps current Health', [kept.system.health, kept.system.play.current], [{ value: 20, max: 32 }, '20']);
check('re-import: keeps portrait when JSON has none', 'img' in kept, false);
check('re-import: clamps Health to the new max', mergeForReimport(built, actor(99), true).system.health.value, 32);
check('re-import: unknown Health falls back to max', mergeForReimport(built, { system: {} }, true).system.health.value, 32);
check('re-import: knocked out stays 0', mergeForReimport(built, actor(0), true).system.health.value, 0);
check('re-import with portrait in JSON takes it', mergeForReimport({ ...built, hasPortrait: true }, actor(9), true).img, built.actorData.img);
console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); process.exit(fail ? 1 : 0);
