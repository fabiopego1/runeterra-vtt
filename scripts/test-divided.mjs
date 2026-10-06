// P2 Divided tests: mode resolution, psyche slot swap, civilian status dice.
// Run: node scripts/test-divided.mjs
// catalog.js reads the browser dataset globals; stub the two archetypes used here.
globalThis.window = { ARCHETYPES: [{ id: 'divided', divided: true }, { id: 'armored' }] };
import { dividedModeOf, hasDividedPsyche, slotKinds } from '../module/rules.js';
import { resolveStatusDie } from '../module/status.js';

let fail = 0;
const check = (name, got, exp) => {
  const ok = JSON.stringify(got) === JSON.stringify(exp);
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${JSON.stringify(got)} (esp ${JSON.stringify(exp)})`);
};

const plain = { arch: { id: 'armored' }, sel: {} };
const divNoPsy = { arch: { id: 'divided' }, sel: {} };
const divPsy = { arch: { id: 'divided' }, sel: { 'arch-divafter': [{ name: 'Divided Psyche' }] } };

check('non-divided mode', dividedModeOf({}, plain), 'heroic');
check('divided default mode', dividedModeOf({}, divPsy), 'heroic');
check('divided civilian kept', dividedModeOf({ dividedMode: 'civilian' }, divPsy), 'civilian');
check('non-divided ignores civilian flag', dividedModeOf({ dividedMode: 'civilian' }, plain), 'heroic');
check('psyche detected', hasDividedPsyche(divPsy), true);
check('psyche absent', hasDividedPsyche(divNoPsy), false);
check('plain slots', slotKinds(plain, 'heroic'), ['power', 'quality']);
check('divided no-psyche slots', slotKinds(divNoPsy, 'civilian'), ['power', 'quality']);
check('psyche heroic slots', slotKinds(divPsy, 'heroic'), ['power', 'power']);
check('psyche civilian slots', slotKinds(divPsy, 'civilian'), ['quality', 'quality']);

const SNAP = {
  greenLow: 21, yellowLow: 11,
  status: { green: 'd10', yellow: 'd8', red: 'd6' },
  status2: ['d6', 'd8', 'd10']
};
const rH = resolveStatusDie(null, 33, 'green', SNAP, 'heroic');
const rC = resolveStatusDie(null, 33, 'green', SNAP, 'civilian');
check('heroic status die', [rH.die, rH.name], ['d10', 'green']);
check('civilian status die (status2)', [rC.die, rC.name], ['d6', 'green']);
// No status2 → civilian falls back to primary dice.
const SNAP1 = { ...SNAP, status2: null };
const rC1 = resolveStatusDie(null, 33, 'green', SNAP1, 'civilian');
check('civilian fallback without status2', [rC1.die, rC1.name], ['d10', 'green']);

console.log(fail ? `\n${fail} FALHA(S)` : '\nTODOS OS TESTES PASSARAM');
process.exit(fail ? 1 : 0);
