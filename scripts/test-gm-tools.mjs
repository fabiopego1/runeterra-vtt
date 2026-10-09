// GM Screen features in the VTT: Forja format registry, twist generator, Bullpen minions/lieutenants
// and the Screen's sealed table backup. The vault password is NEVER stored in the repo:
//   GM_PASSWORD='…' node scripts/test-gm-tools.mjs        (without it, only the no-vault checks run)
import fs from 'node:fs';
import { dataset as W, FIXTURE } from './_load-dataset.mjs';
new Function('window', fs.readFileSync(new URL('../data/gm-vault.js', import.meta.url), 'utf8'))(W);
const vault = await import('../module/vault.js');
const forge = await import('../module/forge.js');
const twists = await import('../module/twists.js');
globalThis.foundry = { utils: { deepClone: structuredClone, mergeObject: () => {} } };
const challenges = await import('../module/challenges.js');
const foes = await import('../module/foes.js');       // registers the gm-backup format
await import('../module/import.js');                    // registers champion + antagonist

let fail = 0;
const check = (name, ok, extra = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`); };

// ---------------- Forja format registry
const champion = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
check('registry knows champion, antagonist and gm-backup', ['champion', 'antagonist', 'gm-backup'].every(id => forge.forgeFormat(id)));
check('sniff: champion fixture', forge.sniffForge(champion)?.id === 'champion');
check('sniff: champion as text', forge.sniffForge(JSON.stringify(champion))?.id === 'champion');
check('sniff: antagonist export', forge.sniffForge({ app: 'runeterra-antagonist', v: 1 })?.id === 'antagonist');
check('sniff: GM backup', forge.sniffForge({ kind: 'runeterra-gm-backup', v: 1, iv: 'x', ct: 'y' })?.id === 'gm-backup');
check('sniff: unknown / not JSON → null', forge.sniffForge({ hello: 1 }) === null && forge.sniffForge('nope') === null);
forge.registerForgeFormat({ id: 'boom', label: 'quebrado', detect: () => { throw new Error('x'); }, create: async () => ({}) });
forge.registerForgeFormat({ id: 'future', label: 'Futuro', detect: o => o?.app === 'runeterra-future', create: async () => ({ ok: true }) });
check('a new Forja export plugs in by registering; a broken detector hides nothing', forge.sniffForge({ app: 'runeterra-future' })?.id === 'future' && forge.sniffForge(champion)?.id === 'champion');
check('registering without create is refused', (() => { try { forge.registerForgeFormat({ id: 'x', label: 'x', detect: () => true }); return false; } catch (e) { return true; } })());

// ---------------- twists (pure)
const T = { any: { minor: ['a1', 'a2', 'a3'], major: ['A1', 'A2'] }, noxus: { minor: ['n1', 'n2'], major: ['N1'] } };
const seq = list => { let i = 0; return () => list[i++ % list.length]; };
check('twist: region pool = region + first 2 generic', ['n1', 'n2', 'a1', 'a2'].includes(twists.pickTwist(T, 'noxus', 'minor')));
check('twist: "any" uses only generic', ['a1', 'a2', 'a3'].includes(twists.pickTwist(T, 'any', 'minor')));
check('twist: unknown region falls back to generic', ['A1', 'A2'].includes(twists.pickTwist(T, 'atlantis', 'major')));
check('twist: never repeats the last text when there is a choice', Array.from({ length: 40 }, () => twists.pickTwist(T, 'any', 'minor', 'a1')).every(x => x !== 'a1'));
check('twist: a pool of one may repeat', twists.pickTwist({ any: { minor: ['só'] } }, 'any', 'minor', 'só') === 'só');
check('twist: bad kind throws', (() => { try { twists.pickTwist(T, 'any', 'huge'); return false; } catch (e) { return true; } })());

// ---------------- foes (pure)
const mModel = { n: 'Modelo Lacaio', d: 'd6', t: 'Resumo do modelo.', a: ['Habilidade A', 'Efeito A.'], tac: 'Tática do modelo.' };
const lModel = { n: 'Modelo Tenente', d: 'd8', t: 'Resumo do tenente.', a: [['Habilidade B', 'Efeito B.'], ['Habilidade C', 'Efeito C.']], tac: 'Tática do tenente.' };
check('description: lacaio (one ability)', foes.foeDescription(mModel, 'minion') === 'Resumo do modelo.\n\nHabilidade A: Efeito A.\n\nTática: Tática do modelo.');
check('description: tenente (two abilities)', foes.foeDescription(lModel, 'lieutenant').split('\n\n').length === 4);
check('description: no ability, no tactics', foes.foeDescription({ n: 'x', d: 'd4', t: 'só texto', a: null }, 'minion') === 'só texto');
const group = foes.buildFoeActors({ model: mModel, kind: 'minion', count: 3 });
check('group: 3 minion actors sharing the group, die and form', group.length === 3 && group.every(a => a.type === 'minion' && a.system.group === 'Modelo Lacaio' && a.system.dieType === 'd6' && a.system.formName === 'Lacaio'));
check('group: numbered names; a single one keeps its name', group[0].name === 'Modelo Lacaio 1' && foes.buildFoeActors({ model: lModel, kind: 'lieutenant', count: 1 })[0].name === 'Modelo Tenente');
check('group: custom group name', foes.buildFoeActors({ model: mModel, kind: 'minion', count: 2, group: '  Patrulha 1 ' })[0].system.group === 'Patrulha 1');
check('group: bad die falls back to d8', foes.foeActorData({ name: 'x', kind: 'minion', dice: ['d99'] })[0].system.dieType === 'd8');
const table = { foes: [{ name: 'Capangas', kind: 'minion', dice: ['d8', 'd6'], out: 1 }, { name: 'Chefe', kind: 'lieutenant', dice: ['d10'] }, { name: 'Vazio', kind: 'minion', dice: [] }], villains: [{ name: 'V' }], challenges: [{ name: 'C' }, { name: 'D' }], tracker: {} };
const ft = foes.foesFromTable(table);
check('backup table: groups with remaining dice only', ft.actors.length === 2 && ft.actors[0].data.map(a => a.system.dieType).join() === 'd8,d6' && ft.actors[1].kind === 'lieutenant');
check('backup table: reports the simple antagonists it does not import', ft.warnings.some(w => /antagonista/.test(w)) && !ft.warnings.some(w => /desafio/.test(w)), JSON.stringify(ft.warnings));
check('backup table: nothing to import', foes.foesFromTable({}).actors.length === 0);

// ---------------- challenges (Desafios): same rules as the Screen
let n = 0; const ids = () => 'c' + (++n);
let L = challenges.addChallenge([], { name: '  Vazamento de gás ', need: '3', timer: '4' }, ids);
check('challenge: add trims the name and keeps need/timer', L.length === 1 && L[0].name === 'Vazamento de gás' && L[0].need === 3 && L[0].timer === 4 && L[0].done === 0 && L[0].ticks === 0, JSON.stringify(L));
check('challenge: a nameless one is refused (list unchanged)', challenges.addChallenge(L, { name: '   ' }, ids) === L);
check('challenge: limits (need 1–5, timer 0–8, defaults)', (() => { const c = challenges.normalizeChallenge({ name: 'x', need: 99, timer: -3, done: 50, ticks: 9 }, ids); return c.need === 5 && c.timer === 0 && c.done === 5 && c.ticks === 0; })());
check('challenge: bad numbers fall back to 1 / 0', (() => { const c = challenges.normalizeChallenge({ name: 'x', need: 'abc', timer: 'zz' }, ids); return c.need === 1 && c.timer === 0; })());
const id = L[0].id;
L = challenges.toggleDone(L, id, 0); check('challenge: click box 0 → 1 success', L[0].done === 1);
L = challenges.toggleDone(L, id, 2); check('challenge: click box 2 → fills up to 3', L[0].done === 3);
check('challenge: three of three = resolved', challenges.challengeState(L[0]) === 'ok');
L = challenges.toggleDone(L, id, 1); check('challenge: click a filled box undoes down to it', L[0].done === 1);
L = challenges.toggleTick(L, id, 3); check('challenge: timer boxes fill the same way', L[0].ticks === 4);
check('challenge: timer full before the successes = fired', challenges.challengeState(L[0]) === 'bad');
L = challenges.toggleDone(L, id, 2); check('challenge: resolved wins over fired', challenges.challengeState(L[0]) === 'ok');
check('challenge: timer 0 never fires', challenges.challengeState({ need: 2, done: 0, timer: 0, ticks: 0 }) === '');
check('challenge: view has the boxes', (() => { const v = challenges.challengeView({ id: 'a', name: 'x', need: 3, done: 2, timer: 2, ticks: 1 }); return v.doneBoxes.map(b => +b.on).join('') === '110' && v.tickBoxes.map(b => +b.on).join('') === '10' && !v.resolved && !v.fired; })());
check('challenge: remove', challenges.removeChallenge(L, id).length === 0);
check('challenge: from a Screen table (nameless dropped)', challenges.challengesFromTable({ challenges: [{ id: 'z', name: 'A', need: 2, done: 1, timer: 3, ticks: 3 }, { name: '' }] }, ids).length === 1);
check('challenge: Screen table with no challenges', challenges.challengesFromTable({}, ids).length === 0);


if (!process.env.GM_PASSWORD) {
  console.log('SKIP vault-dependent tests (set GM_PASSWORD to run them)');
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED (no-vault checks only)');
  process.exit(fail ? 1 : 0);
}

// ---------------- with the vault open
const ok = await vault.unlockModules(['gm-twists'], { password: process.env.GM_PASSWORD });
check('vault opens the twist tables', ok.ok === true && !!W.GM_TWISTS, JSON.stringify(ok));
check('foes are NOT read from the vault (export only): no Bullpen module is defined', !('gm-bullpen' in vault.VAULT_MODULES) && !('openFoeBuilder' in foes));
check('twist tables: generic + every region has minor and major', Object.entries(W.GM_TWISTS).every(([, v]) => v.minor?.length && v.major?.length) && Object.keys(W.GM_TWISTS).length >= 15);
check('every dataset region has its own twist list', W.REGIONS.every(r => W.GM_TWISTS[r.id]), W.REGIONS.filter(r => !W.GM_TWISTS[r.id]).map(r => r.id).join());
check('twistRegions lists the regions with their pt names', twists.twistRegions(W.GM_TWISTS).length === W.REGIONS.length);
check('twist: real tables give text for every region/kind', W.REGIONS.every(r => ['minor', 'major'].every(k => typeof twists.pickTwist(W.GM_TWISTS, r.id, k) === 'string')));

// The Screen's backup: sealed with the vault key, opened here, foes become actors' data.
const raw = await vault.deriveRawKey(process.env.GM_PASSWORD);
const key = await crypto.subtle.importKey('raw', Uint8Array.from(atob(raw), c => c.charCodeAt(0)), 'AES-GCM', false, ['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ notes: 'n', table })));
const b64 = u => btoa(String.fromCharCode(...new Uint8Array(u)));
const backup = { kind: 'runeterra-gm-backup', v: 1, salt: W.GM_VAULT.salt, iv: b64(iv), ct: b64(ct) };
const opened = await vault.openBoxWithRawKey(raw, backup);
check('backup opens with the vault key', opened?.table?.foes?.length === 3);
check('backup opened with a wrong key is refused', (await vault.openBoxWithRawKey(await vault.deriveRawKey('outra'), backup)) === null);
check('backup → actors', foes.foesFromTable(opened.table).actors.length === 2);

console.log(fail ? `${fail} FAILED` : 'ALL PASSED');
process.exit(fail ? 1 : 0);
