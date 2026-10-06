// P0 zone-lock tests: effective zone + table locks for every
// health-zone x scene-color combination (SCRPG reference rule).
// Run: node scripts/test-zone-locks.mjs
import { effectiveZone, zoneOf } from '../module/rules.js';
import { resolveStatusDie } from '../module/status.js';

const RANK = { green: 0, yellow: 1, red: 2 };
// Mirrors RuneterraCharacterSheet._zoneTables lock logic.
const locks = (eff) => {
  const cur = eff === 'out' ? -1 : (RANK[eff] ?? 0);
  return { green: 0 > cur, yellow: 1 > cur, red: 2 > cur, outActive: eff === 'out' };
};

// [healthZone, scene, expectedEffective, expectedLocks{green,yellow,red locked}, outActive]
const CASES = [
  ['green', 'green', 'green', [false, true, true], false],
  ['green', 'yellow', 'yellow', [false, false, true], false],
  ['green', 'red', 'red', [false, false, false], false],
  ['yellow', 'green', 'yellow', [false, false, true], false],
  ['yellow', 'yellow', 'yellow', [false, false, true], false],
  ['yellow', 'red', 'red', [false, false, false], false],
  ['red', 'green', 'red', [false, false, false], false],
  ['red', 'yellow', 'red', [false, false, false], false],
  ['red', 'red', 'red', [false, false, false], false],
  ['out', 'green', 'out', [true, true, true], true],
  ['out', 'yellow', 'out', [true, true, true], true],
  ['out', 'red', 'out', [true, true, true], true],
];

const SNAP = { greenLow: 21, yellowLow: 11, status: { green: 'd10', yellow: 'd8', red: 'd6' } };
const HP = { green: 33, yellow: 15, red: 5, out: 0 };

let fail = 0;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const [hz, scene, expEff, expLock, expOut] of CASES) {
  const eff = effectiveZone(hz, scene);
  const lk = locks(eff);
  const gotLock = [lk.green, lk.yellow, lk.red];
  // resolveStatusDie with snapshot-only actor must agree on the effective zone name.
  const r = resolveStatusDie(null, HP[hz], scene, SNAP);
  const ok = eff === expEff && eq(gotLock, expLock) && lk.outActive === expOut && r.name === expEff;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} vida=${hz} cena=${scene} -> efetiva=${eff} (esp ${expEff}) travas[G,Y,R]=${gotLock} (esp ${expLock}) out=${lk.outActive} statusDie=${r.die}/${r.name}`);
}
// zoneOf boundaries (greenLow=21, yellowLow=11).
for (const [hp, exp] of [[33, 'green'], [21, 'green'], [20, 'yellow'], [11, 'yellow'], [10, 'red'], [1, 'red'], [0, 'out']]) {
  const z = zoneOf(hp, SNAP);
  const ok = z === exp;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} zoneOf(${hp})=${z} (esp ${exp})`);
}
console.log(fail ? `\n${fail} FALHA(S)` : '\nTODOS OS TESTES PASSARAM');
process.exit(fail ? 1 : 0);
