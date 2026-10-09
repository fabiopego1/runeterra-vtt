// Twist of Fate (Retcon) tests against the real dataset + the web app's champion fixture.
// Run: node scripts/test-retcon.mjs   (WEB_FIXTURE=path to override the fixture)
import fs from 'node:fs';
import { dataset, FIXTURE } from './_load-dataset.mjs';
const { derive, effectivePrincipleId, dn } = await import('../module/rules.js');
const { catalog } = await import('../module/data/catalog.js');
const { stateWarnings } = await import('../module/import.js');

const base = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
let fail = 0;
const check = (name, ok, extra = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
const clone = o => JSON.parse(JSON.stringify(o));
const none = { ...clone(base), retcon: { type: null } };
const d0 = derive(none, null);
check('base derives', !!d0);

const red = derive({ ...clone(base), retcon: { type: 'red-up' } }, null);
check('red-up: red status +1 size', dn(red.status[2]) === Math.min(12, dn(d0.status[2]) + 2), `${d0.status[2]}→${red.status[2]}`);
check('red-up: health max follows red die', red.health.max >= d0.health.max, `${d0.health.max}→${red.health.max}`);

const pw = Object.keys(d0.powers);
if (pw.length >= 2 && d0.powers[pw[0]] !== d0.powers[pw[1]]) {
  const sw = derive({ ...clone(base), retcon: { type: 'swap-powers', a: pw[0], b: pw[1] } }, null);
  check('swap-powers swaps dice', sw.powers[pw[0]] === d0.powers[pw[1]] && sw.powers[pw[1]] === d0.powers[pw[0]]);
} else console.log('SKIP swap-powers (fixture has <2 distinct power dice)');

const k = Object.keys(catalog.traits).find(x => !(x in d0.powers) && !(x in d0.qualities) && x !== 'rp-quality');
const ad = derive({ ...clone(base), retcon: { type: 'add-d6', key: k } }, null);
check('add-d6 adds trait at d6', (ad.powers[k] ?? ad.qualities[k]) === 'd6', k);

const pid = base.bg.principle;
check('principle unchanged without retcon', effectivePrincipleId(none, 'bg') === pid);
const other = dataset.PRINCIPLES.find(p => p.id !== pid && p.id !== base.arch.principle).id;
const cp = { ...none, retcon: { type: 'change-principle', which: 'bg', principle: other } };
check('change-principle swaps the chosen slot', effectivePrincipleId(cp, 'bg') === other && effectivePrincipleId(cp, 'arch') === base.arch.principle);
check('evo overlay wins', effectivePrincipleId({ ...none, evo: { principles: { bg: 'x' } } }, 'bg') === 'x');

// stateWarnings: valid state is quiet; broken choices are reported instead of silently ignored.
check('no warnings on the fixture', stateWarnings(base).length === 0, JSON.stringify(stateWarnings(base)));
check('warns unknown principle', stateWarnings({ ...none, bg: { ...none.bg, principle: 'duty' } }).length === 1);
check('warns unknown retcon', stateWarnings({ ...none, retcon: { type: 'nope' } }).length === 1);
check('warns swap with bad traits', stateWarnings({ ...none, retcon: { type: 'swap-powers', a: 'x', b: 'y' } }).length === 1);
check('warns change-principle to unknown id', stateWarnings({ ...none, retcon: { type: 'change-principle', which: 'bg', principle: 'duty' } }).some(m => /Reviravolta/.test(m)));
check('warns extra-red without ability', stateWarnings({ ...none, retcon: { type: 'extra-red' } }).length === 1);
check('valid change-principle is quiet', stateWarnings(cp).length === 0);
console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); process.exit(fail ? 1 : 0);
