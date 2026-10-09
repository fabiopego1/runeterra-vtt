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
check('count: lacaios = champions, tenentes = half rounded up', [foes.defaultCount('minion', 4), foes.defaultCount('lieutenant', 4), foes.defaultCount('lieutenant', 5), foes.defaultCount('minion', 0), foes.defaultCount('minion', 99)].join() === '4,2,3,1,12');
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
check('backup table: reports what it does not import', ft.warnings.some(w => /2 desafio/.test(w)) && ft.warnings.some(w => /antagonista/.test(w)), JSON.stringify(ft.warnings));
check('backup table: nothing to import', foes.foesFromTable({}).actors.length === 0);

// ---------------- the Bullpen patch is guarded
check('bullpen patch adds one line before the export', vault.exposeBullpenData('const MINIONS=[];const LIEUTENANTS=[];\n  window.GM_BULLPEN = {x:1}').includes('window.GM_BULLPEN_DATA = { MINIONS, LIEUTENANTS };'));
check('bullpen patch refuses a changed book', (() => { try { vault.exposeBullpenData('window.GM_BULLPEN = {}'); return false; } catch (e) { return /mudou de formato/.test(e.message); } })());

if (!process.env.GM_PASSWORD) {
  console.log('SKIP vault-dependent tests (set GM_PASSWORD to run them)');
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED (no-vault checks only)');
  process.exit(fail ? 1 : 0);
}

// ---------------- with the vault open
const ok = await vault.unlockModules(['gm-twists', 'gm-bullpen'], { password: process.env.GM_PASSWORD });
check('vault opens twists + bullpen (and villain data it needs)', ok.ok === true && !!W.GM_TWISTS && !!W.GM_BULLPEN_DATA && !!W.GM_VDATA, JSON.stringify(ok));
check('twist tables: generic + every region has minor and major', Object.entries(W.GM_TWISTS).every(([, v]) => v.minor?.length && v.major?.length) && Object.keys(W.GM_TWISTS).length >= 15);
check('every dataset region has its own twist list', W.REGIONS.every(r => W.GM_TWISTS[r.id]), W.REGIONS.filter(r => !W.GM_TWISTS[r.id]).map(r => r.id).join());
check('twistRegions lists the regions with their pt names', twists.twistRegions(W.GM_TWISTS).length === W.REGIONS.length);
check('twist: real tables give text for every region/kind', W.REGIONS.every(r => ['minor', 'major'].every(k => typeof twists.pickTwist(W.GM_TWISTS, r.id, k) === 'string')));
const models = foes.foeModels(W.GM_BULLPEN_DATA);
check('bullpen models: lacaios and tenentes with dice', models.minion.length >= 10 && models.lieutenant.length >= 4 && [...models.minion, ...models.lieutenant].every(m => ['d4', 'd6', 'd8', 'd10', 'd12'].includes(m.d) && m.n));
check('bullpen: tenentes have ability pairs, lacaios at most one', models.lieutenant.every(m => Array.isArray(m.a) && m.a.every(p => p.length === 2)) && models.minion.every(m => m.a === null || m.a.length === 2));
const real = foes.buildFoeActors({ model: models.minion[0], kind: 'minion', count: foes.defaultCount('minion', 4) });
check('real model → 4 actors with the model die', real.length === 4 && real.every(a => a.system.dieType === models.minion[0].d));

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
