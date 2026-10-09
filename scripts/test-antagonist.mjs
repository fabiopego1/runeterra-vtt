// Antagonist import: vault unlock + model + import build, against the sealed GM vault.
// The vault password is NEVER stored in the repo: run with  GM_PASSWORD='…' node scripts/test-antagonist.mjs
// Without GM_PASSWORD only the vault-is-sealed checks run (and the script still exits 0).
import fs from 'node:fs';
import { dataset as W } from './_load-dataset.mjs';
new Function('window', fs.readFileSync(new URL('../data/gm-vault.js', import.meta.url), 'utf8'))(W);
const vault = await import('../module/vault.js');
const ant = await import('../module/antagonist.js');

let fail = 0;
const check = (name, ok, extra = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`); };

// --- the vault ships sealed: no GM text in plain sight ---
const raw = fs.readFileSync(new URL('../data/gm-vault.js', import.meta.url), 'utf8');
check('vault file is ciphertext (no villain text in clear)', !/Brutamontes|Adaptável|Maestria da/.test(raw));
check('villain data not loaded before unlocking', !vault.villainData());
const bad = await vault.unlockVillainData({ password: 'senha-errada' });
check('wrong password does not unlock', bad.ok === false && bad.needPassword === true);
check('still sealed after a failed attempt', !vault.villainData());

// --- pure helpers that need no vault ---
check('zonesFor(55)', JSON.stringify(ant.zonesFor(55)) === '["55−38","37−17","16−1"]');
check('zoneBounds with Máx', JSON.stringify(ant.zoneBounds('Máx−75', 110)) === '[110,75]');
check('zoneIndexOf: 55 max → 40 green, 30 yellow, 10 red', [ant.zoneIndexOf(40, 55), ant.zoneIndexOf(30, 55), ant.zoneIndexOf(10, 55)].join() === '0,1,2');
check('isAntagonistJson', ant.isAntagonistJson('{"app":"runeterra-antagonist","v":1}') && !ant.isAntagonistJson('{"v":1}') && !ant.isAntagonistJson('nope'));
check('parse rejects champion JSON', ant.parseAntagonist({ v: 1, bg: {} }).errors.length > 0);
check('parse rejects wrong version', ant.parseAntagonist({ app: 'runeterra-antagonist', v: 9, ap: 'x', arch: 'y', name: 'n' }).errors.some(e => /versão 9/.test(e)));
check('old export (rp without rpOk) counts as confirmed', ant.normalizeAntagonist({ rp: 'Nome' }).rpOk === true);

if (!process.env.GM_PASSWORD) {
  console.log('SKIP vault-dependent tests (set GM_PASSWORD to run them)');
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED (sealed checks only)');
  process.exit(fail ? 1 : 0);
}

const ok = await vault.unlockVillainData({ password: process.env.GM_PASSWORD });
check('right password unlocks the vault', ok.ok === true, JSON.stringify(ok));
const VD = vault.villainData();
check('vault exposes approaches/archetypes/upgrades/masteries', VD?.approaches?.length > 10 && VD.archetypes.length > 10 && VD.upgrades.length > 5 && VD.masteries.length > 5);

// Build a complete antagonist from the vault's own data (no hand-typed rules text).
const powerKeys = Object.entries(W.TRAIT_CATEGORIES).filter(([k]) => k.startsWith('P:')).flatMap(([, c]) => c.items.map(i => i[0]));
const qualKeys = Object.entries(W.TRAIT_CATEGORIES).filter(([k]) => k.startsWith('Q:')).flatMap(([, c]) => c.items.map(i => i[0]));
const TOK = /\[(poder\/qualidade|energia\/elemento|poder|qualidade)\]/g;
function make(apId, arId, { up = {}, n = 4, cur = '' } = {}) {
  const ap = VD.approaches.find(a => a.id === apId), ar = VD.archetypes.find(a => a.id === arId);
  const S = ant.normalizeAntagonist({ name: 'TESTE Antagonista', alias: 'Título', n, ap: apId, arch: arId, rp: 'Presença', rpDesc: 'imponente', rpOk: true, up, play: { cur } });
  ap.P.forEach((d, i) => { S.P[i] = powerKeys[i]; });
  ap.Q.forEach((d, i) => { S.Q[i] = qualKeys[i]; });
  const pool = ar.ab.filter(a => a.n !== ar.gain);
  const picks = [
    ...ap.ab.slice(0, ap.pick).map((a, i) => ['a:' + i, a]),
    ...pool.slice(0, ar.pick).map(a => ['r:' + ar.ab.indexOf(a), a]),
    ...ar.ab.filter(a => a.n === ar.gain).map(a => ['g:' + a.n, a])
  ];
  for (const [id, a] of picks) {
    if (!id.startsWith('g:')) S.ab[id] = true;
    for (const t of new Set([...a.x.matchAll(TOK)].map(m => m[1]))) S.tk[id + '|' + t] = t === 'qualidade' ? qualKeys[0] : powerKeys[0];
  }
  return { json: { app: 'runeterra-antagonist', v: 1, ...S }, ap, ar };
}

const { json, ap, ar } = make('adaptive', 'bruiser');
const r = ant.buildAntagonistImport(json, VD);
check('build ok', r.ok === true, JSON.stringify(r.errors));
check('no warnings for a complete antagonist', r.warnings.length === 0, JSON.stringify(r.warnings));
const hp = ap.hp + ar.hp + 5 * 4;
check('Health = approach + archetype + 5×campeões', r.actorData.system.health.max === hp && r.actorData.system.derived.healthMax === hp, String(r.actorData.system.health.max));
check('actor is a villain named after the antagonist', r.actorData.type === 'villain' && r.actorData.name === 'TESTE Antagonista');
check('power dice come from the approach', Object.values(r.actorData.system.derived.powers).join() === ap.P.join());
check('quality dice come from the approach', Object.values(r.actorData.system.derived.qualities).slice(0, ap.Q.length).join() === ap.Q.join());
check('interpretation quality is a d8', r.actorData.system.derived.qualities['rp-quality'] === 'd8');
check('Brutamontes status follows Health zone, starts green', r.actorData.system.antagonist.zoned === true && r.actorData.system.thirdDie === ar.status[0][1]);
check('zone bounds are ordered', r.actorData.system.derived.greenLow > r.actorData.system.derived.yellowLow && r.actorData.system.derived.yellowLow > r.actorData.system.derived.redHigh);
check('one ability item per pick (+ free ability)', r.items.length === ap.pick + ar.pick + (ar.gain ? 1 : 0), String(r.items.length));
check('ability text is filled with trait names (no open [tokens])', r.items.every(i => !/\[(poder|qualidade|poder\/qualidade)\]/.test(i.system.gameText)));
check('items are tagged as imported (iid) and grouped', r.items.every(i => i.system.iid.startsWith('ant:') && i.system.group.startsWith('antagonist-')));
check('portrait stays out of actor data', !('portrait' in r.actorData.system.antagonist.state));

// A scene-driven archetype is not zoned: the GM chooses the Status row.
const sq = make('adaptive', 'squad');
const rs = ant.buildAntagonistImport(sq.json, VD);
check('Esquadrão is not zoned and has 3 status rows', rs.ok && rs.actorData.system.antagonist.zoned === false && rs.actorData.system.antagonist.status.length === 3);

// Current Health is honoured and clamped.
const low = ant.buildAntagonistImport({ ...json, play: { cur: '5' } }, VD);
check('current Health kept; red zone → red status die', low.actorData.system.health.value === 5 && low.actorData.system.thirdDie === ar.status[2][1]);
check('current Health clamps to max', ant.buildAntagonistImport({ ...json, play: { cur: '9999' } }, VD).actorData.system.health.value === hp);

// Upgrades: power upgrade raises dice and adds Health.
const upg = VD.upgrades.find(u => u.id === 'power');
const withUp = ant.buildAntagonistImport({ ...json, up: { power: true } }, VD);
check('power upgrade: +Health and one die size up', withUp.actorData.system.health.max === hp + upg.hp && Object.values(withUp.actorData.system.derived.powers)[0] === ant.bump(ap.P[0]));

// Incomplete sheets warn instead of failing; broken ones are rejected whole.
const incomplete = ant.buildAntagonistImport({ ...json, P: {}, rpOk: false }, VD);
check('missing dice/quality → warnings, import still ok', incomplete.ok && incomplete.warnings.length >= 2, JSON.stringify(incomplete.warnings));
const unknown = ant.buildAntagonistImport({ ...json, ap: 'nao-existe' }, VD);
check('unknown approach → rejected (all-or-nothing)', unknown.ok === false && unknown.errors.length === 1);

check('key derivation is deterministic', (await vault.deriveRawKey(process.env.GM_PASSWORD)) === (await vault.deriveRawKey(process.env.GM_PASSWORD)));
console.log(fail ? `${fail} FAILED` : 'ALL PASSED');
process.exit(fail ? 1 : 0);
