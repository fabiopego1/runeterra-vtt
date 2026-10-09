// Runeterra Foundry — minions ("lacaios") and lieutenants ("tenentes") from the GM Screen.
//  • "Bancada" builder: one click creates a group from the ready examples of the Bullpen
//    (the same {n, d, t, a, tac} models the Screen shows), N minions per champion in the scene,
//    half as many lieutenants. Models come from the sealed vault, opened by the GM's password.
//  • GM backup import: the Screen's "Exportar backup" file (kind: runeterra-gm-backup, sealed with the
//    same vault key) becomes actors for the foes that were on the table — registered as a Forja format.
// The pure functions (no Foundry globals) are unit-tested in Node.

import { ensureVaultModules, loadVault, keptKey, openBoxWithRawKey } from './vault.js';
import { registerForgeFormat, parseJson } from './forge.js';

export const FOE_KINDS = ['minion', 'lieutenant'];
const DICE = ['d4', 'd6', 'd8', 'd10', 'd12'];
const KIND_LABEL = { minion: 'Lacaio', lieutenant: 'Tenente' };

/** The Bullpen's ready examples, tagged by kind: { minion: [...], lieutenant: [...] } (window.GM_BULLPEN_DATA). */
export function foeModels(data) {
  if (!data?.MINIONS || !data?.LIEUTENANTS) throw new Error('A Bancada não trouxe lacaios e tenentes de exemplo.');
  return {
    minion: data.MINIONS.map(m => ({ ...m, kind: 'minion' })),
    lieutenant: data.LIEUTENANTS.map(m => ({ ...m, kind: 'lieutenant' }))
  };
}

/** How many actors a group has: one lacaio per champion; lieutenants are half as many (rounded up). */
export const defaultCount = (kind, champions) => {
  const n = Math.max(1, Math.min(12, Math.trunc(Number(champions)) || 1));
  return kind === 'lieutenant' ? Math.max(1, Math.ceil(n / 2)) : n;
};

/** Plain-text description for the sheet: what it is, its abilities, its tactics. */
export function foeDescription(model, kind) {
  const out = [];
  if (model.t) out.push(model.t);
  const abilities = kind === 'lieutenant' ? (model.a ?? []) : (model.a ? [model.a] : []);
  for (const [n, x] of abilities) out.push(`${n}: ${x}`);
  if (model.tac) out.push(`Tática: ${model.tac}`);
  return out.join('\n\n');
}

/** Actor data for a group: one minion-type actor per die (they share `group`, so the group roll finds them). */
export function foeActorData({ name, kind, dice, group = name, description = '' }) {
  const list = dice.map(d => (DICE.includes(d) ? d : 'd8'));
  return list.map((die, i) => ({
    name: list.length > 1 ? `${name} ${i + 1}` : name,
    type: 'minion',
    system: { group, dieType: die, formName: KIND_LABEL[kind] ?? KIND_LABEL.minion, description }
  }));
}

/** Actors for a Bullpen example: `count` copies of the model's die. */
export function buildFoeActors({ model, kind, count, group }) {
  const n = Math.max(1, Math.min(24, Math.trunc(Number(count)) || 1));
  return foeActorData({
    name: model.n, kind, group: (group ?? '').trim() || model.n,
    dice: Array(n).fill(model.d), description: foeDescription(model, kind)
  });
}

/**
 * Foes of a GM Screen table ({ foes: [{ name, kind, dice[] }], challenges, villains… }) as actor data.
 * Dice already lost in play are simply not there. Anything else on the table is reported, not imported.
 */
export function foesFromTable(table) {
  const actors = [];
  for (const f of table?.foes ?? []) {
    if (!f?.name || !Array.isArray(f.dice) || !f.dice.length) continue;
    const kind = f.kind === 'lieutenant' ? 'lieutenant' : 'minion';
    actors.push({ name: f.name, kind, data: foeActorData({ name: f.name, kind, dice: f.dice }) });
  }
  const warnings = [];
  const skipped = (n, what) => { if (n) warnings.push(`${n} ${what} da mesa não ${n > 1 ? 'foram importados' : 'foi importado'}.`); };
  skipped(table?.villains?.length ?? 0, 'antagonista(s) simples');
  skipped(table?.challenges?.length ?? 0, 'desafio(s)');
  if (actors.length && (table?.villains?.length ?? 0)) warnings.push('Para antagonistas completos, importe o JSON da Forja do Antagonista.');
  return { actors, warnings };
}

// ---------------------------------------------------------------- Foundry side

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Create the folder and the actors of a group. Returns the created actors. */
export async function createFoeGroup({ folderName, datas }) {
  const folder = await Folder.create({ name: folderName, type: 'Actor' });
  return Actor.createDocuments(datas.map(d => ({ ...d, folder: folder.id })));
}

/** The "Bancada" dialog: pick a ready lacaio/tenente model, champions in the scene, optional group name. */
export async function openFoeBuilder() {
  const r = await ensureVaultModules(['gm-bullpen']);
  if (!r.ok) { ui.notifications.warn(r.error); return null; }
  let models;
  try { models = foeModels(window.GM_BULLPEN_DATA); } catch (e) { ui.notifications.error(e.message); return null; }
  const group = (kind, label) => `<optgroup label="${esc(label)}">${models[kind].map((m, i) => `<option value="${kind}:${i}">${esc(m.n)} (${esc(m.d)})</option>`).join('')}</optgroup>`;
  const L = k => game.i18n.localize(k);
  const content = `<div class="rt-foe-builder">
    <label>${L('RUNETERRA.FoeModel')}<select name="model">${group('minion', L('RUNETERRA.FoeMinions'))}${group('lieutenant', L('RUNETERRA.FoeLieutenants'))}</select></label>
    <label>${L('RUNETERRA.FoeChampions')}<input type="number" name="n" min="1" max="12" value="4"></label>
    <label>${L('RUNETERRA.FoeGroup')}<input type="text" name="group" placeholder="${L('RUNETERRA.FoeGroupHint')}"></label>
    <p class="rt-hint"><em>${L('RUNETERRA.FoeHint')}</em></p></div>`;
  const out = await foundry.applications.api.DialogV2.prompt({
    window: { title: L('RUNETERRA.FoeBuilderTitle') },
    content,
    ok: { label: L('RUNETERRA.FoeCreate'), callback: (ev, button) => Object.fromEntries(new FormData(button.form)) },
    rejectClose: false
  });
  if (!out) return null;
  const [kind, idx] = String(out.model).split(':');
  const model = models[kind]?.[Number(idx)];
  if (!model) return null;
  const count = defaultCount(kind, out.n);
  const datas = buildFoeActors({ model, kind, count, group: out.group });
  const actors = await createFoeGroup({ folderName: `${KIND_LABEL[kind]}s: ${model.n}`, datas });
  ui.notifications.info(game.i18n.format('RUNETERRA.FoeCreated', { count: actors.length, name: model.n }));
  return actors;
}

/** Forja format "gm-backup": the Screen's encrypted table backup → minion/lieutenant actors. */
export async function importGmBackup(json) {
  const file = parseJson(json);
  const open = await ensureVaultModules([]);
  if (!open.ok) return { ok: false, errors: [open.error] };
  const v = await loadVault();
  if (file.salt && file.salt !== v.salt) return { ok: false, errors: ['Este backup foi feito com outro cofre/senha.'] };
  const data = await openBoxWithRawKey(keptKey(), file);
  if (!data) return { ok: false, errors: ['Não foi possível abrir o backup: senha diferente ou arquivo danificado.'] };
  const { actors, warnings } = foesFromTable(data.table);
  if (!actors.length) return { ok: false, errors: ['O backup não tem lacaios nem tenentes em cena.'] };
  const created = [];
  for (const g of actors) created.push(...await createFoeGroup({ folderName: `${KIND_LABEL[g.kind]}s: ${g.name}`, datas: g.data }));
  return {
    ok: true, actor: created[0], actors: created, warnings,
    message: game.i18n.format('RUNETERRA.BackupImported', { groups: actors.length, actors: created.length })
  };
}

registerForgeFormat({
  id: 'gm-backup',
  label: 'Backup do Escudo do Mestre',
  detect: o => o?.kind === 'runeterra-gm-backup',
  create: importGmBackup
});
