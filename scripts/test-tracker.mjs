// Scene marker rules (module/tracker.js): the Screen's single-row model. Pure, no Foundry needed.
import * as t from '../module/tracker.js';

let fail = 0;
const check = (name, ok, extra = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`); };
const S = [2, 4, 2];

check('sizes: defaults 2/4/2', t.trackerSizes({}).join() === '2,4,2');
check('sizes: read from the actor, clamped 1–8', t.trackerSizes({ greenSpace: { setting: 0 }, yellowSpace: { setting: 99 }, redSpace: { setting: 'x' } }).join() === '1,8,2');
check('colour: 0 → green, 1 → green', t.trackerColor(0, S) === 'green' && t.trackerColor(1, S) === 'green');
check('colour: last Green marked → yellow', t.trackerColor(2, S) === 'yellow' && t.trackerColor(5, S) === 'yellow');
check('colour: last Yellow marked → red', t.trackerColor(6, S) === 'red' && t.trackerColor(7, S) === 'red');
check('end: only when the last Red is marked', !t.trackerEnded(7, S) && t.trackerEnded(8, S));
check('spaces fill in order', JSON.stringify(t.trackerSpaces(5, S).map(z => z.current)) === '[2,3,0]');
check('spaces: past the end is clamped', JSON.stringify(t.trackerSpaces(99, S).map(z => z.current)) === '[2,4,2]');
check('click an empty space fills up to it', t.trackerClick(1, 4) === 5);
check('click a marked space rewinds to it', t.trackerClick(5, 3) === 3 && t.trackerClick(1, 0) === 0);
check('click the last marked space un-marks it', t.trackerClick(3, 2) === 2);
check('marked = sum of zone fills', t.trackerMarked({ greenSpace: { setting: 2, current: 2 }, yellowSpace: { setting: 4, current: 1 }, redSpace: { setting: 2, current: 0 } }) === 3);
check('marked heals an old inconsistent save (g0 y2 → 2)', t.trackerMarked({ greenSpace: { setting: 3, current: 0 }, yellowSpace: { setting: 4, current: 2 }, redSpace: {} }) === 2);
check('update data lines the zones up', (() => { const u = t.trackerUpdate(6, [2, 4, 2]); return u['system.greenSpace.current'] === 2 && u['system.yellowSpace.current'] === 4 && u['system.redSpace.current'] === 0 && u['system.redSpace.setting'] === 2; })());
check('shrinking a zone keeps what is marked (within the row)', (() => { const sz = [1, 4, 2]; return t.trackerClamp(5, sz) === 5 && t.trackerColor(5, sz) === 'red'; })());
check('Screen tracker → sizes + marked', (() => { const r = t.trackerFromScreen({ g: 3, y: 5, r: 3, marked: 4 }); return r.sizes.join() === '3,5,3' && r.marked === 4; })());
check('Screen tracker: out-of-range values are clamped', (() => { const r = t.trackerFromScreen({ g: 0, y: 40, r: 'x', marked: 999 }); return r.sizes.join() === '1,8,2' && r.marked === 11; })());
check('a fresh Screen tracker is not carried over', !t.trackerIsCustom({ g: 2, y: 4, r: 2, marked: 0 }) && !t.trackerIsCustom({}) && !t.trackerIsCustom(null));
check('a changed Screen tracker is carried over', t.trackerIsCustom({ g: 3, y: 5, r: 3, marked: 0 }) && t.trackerIsCustom({ g: 2, y: 4, r: 2, marked: 3 }));
check('system object for a new Cena', (() => { const s = t.trackerSystem(3, [3, 5, 3]); return s.greenSpace.current === 3 && s.yellowSpace.current === 0 && s.redSpace.setting === 3; })());

console.log(fail ? `${fail} FAILED` : 'ALL PASSED');
process.exit(fail ? 1 : 0);
