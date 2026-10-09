// Loads the web dataset (data/*.js, classic scripts) into a fake `window`, like the Foundry
// `scripts` list does. Import this BEFORE any module/*.js that reads window globals.
import fs from 'node:fs';
import vm from 'node:vm';
import manifest from '../system.json' with { type: 'json' };

const win = {}; globalThis.window = win; win.window = win;
const ctx = vm.createContext(win);
for (const f of manifest.scripts) {
  vm.runInContext(fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f });
}
export const dataset = win;
export const FIXTURE = process.env.WEB_FIXTURE ?? 'D:/FoundryVTT/runeterra-work/runeterra-web/tests/fixtures/champion.json';
