// Import pipeline against the web app's own fixture (champion.json), no Foundry needed:
// parseChampion → buildChampionImport → expected derived values and ability items.
// Golden values were confirmed in a live Foundry world (2026-10-09). Run: node scripts/test-import-fixture.mjs
import fs from 'node:fs';
import { FIXTURE } from './_load-dataset.mjs';
const deepMerge = (a, b) => { for (const [k, v] of Object.entries(b)) { if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object') deepMerge(a[k], v); else a[k] = v; } return a; };
globalThis.foundry = { utils: { deepClone: structuredClone, mergeObject: deepMerge } };
const { parseChampion, buildChampionImport, mergeForReimport, staleDeletes } = await import('../module/import.js');

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
// Re-import drops what the new JSON no longer has (Foundry merges objects on update).
const oldSys = { derived: { powers: { cosmic: 'd10', agility: 'd6' }, qualities: { conviction: 'd10' } }, character: { sel: { red: [], 'red-extra': [] } } };
const newSys = { derived: { powers: { cosmic: 'd10' }, qualities: { conviction: 'd10' } }, character: { sel: { red: [] } } };
check('staleDeletes lists only vanished keys', staleDeletes(oldSys, newSys, ['derived.powers', 'derived.qualities', 'character.sel']), { derived: { powers: { '-=agility': null } }, character: { sel: { '-=red-extra': null } } });
check('staleDeletes: nothing stale → empty', staleDeletes(newSys, newSys, ['derived.powers', 'character.sel']), {});
check('staleDeletes ignores missing paths/arrays', staleDeletes({ a: [1] }, { a: [] }, ['a', 'x.y']), {});
const staleActor = { system: { play: { current: '10' }, derived: { powers: { ...built.actorData.system.derived.powers, vanished: 'd8' }, qualities: {} }, character: {} } };
const merged = mergeForReimport(built, staleActor, true);
check('re-import payload carries the delete for a vanished trait', merged.system.derived.powers['-=vanished'], null);
check('re-import first fill has no delete markers', JSON.stringify(mergeForReimport(built, staleActor, false)).includes('-='), false);
console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); process.exit(fail ? 1 : 0);
