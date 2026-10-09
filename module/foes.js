// Runeterra Foundry — minions ("lacaios") and lieutenants ("tenentes") arrive ONLY by export from the Forja.
//  • GM backup import: the Screen's "Exportar backup" file (kind: runeterra-gm-backup, sealed with the vault key)
//    becomes actors for the foes on the table (and its challenges, see challenges.js) — a registered Forja format.
//  • A future Forja export of minions/lieutenants plugs in by registering a format (forge.js) and mapping its
//    entries to { n, d, t, a, tac } (name, die, summary, ability, tactics — the Screen's model) for buildFoeActors().
// TODO (open on purpose): the Forja export of minions/lieutenants does not exist yet. When the site defines it,
// register the format here and flag what it creates with flags.runeterra.fromExport. Until then a minion/environment made
// by hand only shows the "not implemented" notice on its sheet (RUNETERRA.MinionPendingExport).
// The pure functions (no Foundry globals) are unit-tested in Node.

import { ensureVaultModules, loadVault, keptKey, openBoxWithRawKey } from './vault.js';
import { registerForgeFormat, parseJson } from './forge.js';
import { challengesFromTable } from './challenges.js';
import { trackerIsCustom, trackerFromScreen, trackerSystem } from './tracker.js';

export const FOE_KINDS = ['minion', 'lieutenant'];
const DICE = ['d4', 'd6', 'd8', 'd10', 'd12'];
const KIND_LABEL = { minion: 'Lacaio', lieutenant: 'Tenente' };

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
    system: { group, dieType: die, formName: KIND_LABEL[kind] ?? KIND_LABEL.minion, description },
    flags: { runeterra: { fromExport: true } }
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
  if (actors.length && (table?.villains?.length ?? 0)) warnings.push('Para antagonistas completos, importe o JSON da Forja do Antagonista.');
  return { actors, warnings };
}

// ---------------------------------------------------------------- Foundry side

/** Create the folder and the actors of a group. Returns the created actors. */
export async function createFoeGroup({ folderName, datas }) {
  const folder = await Folder.create({ name: folderName, type: 'Actor' });
  return Actor.createDocuments(datas.map(d => ({ ...d, folder: folder.id })));
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
  const challenges = challengesFromTable(data.table, () => foundry.utils.randomID());
  const tracker = trackerIsCustom(data.table?.tracker) ? trackerFromScreen(data.table.tracker) : null;
  if (!actors.length && !challenges.length && !tracker) return { ok: false, errors: ['O backup não tem lacaios, tenentes, desafios nem marcador de cena.'] };
  const created = [];
  for (const g of actors) created.push(...await createFoeGroup({ folderName: `${KIND_LABEL[g.kind]}s: ${g.name}`, datas: g.data }));
  if (challenges.length || tracker) {
    const system = { challenges, ...(tracker ? trackerSystem(tracker.marked, tracker.sizes) : {}) };
    const [scene] = await Actor.createDocuments([{ name: game.i18n.localize('RUNETERRA.BackupSceneName'), type: 'scene', system }]);
    created.push(scene);
  }
  return {
    ok: true, actor: created[0], actors: created, warnings,
    message: game.i18n.format('RUNETERRA.BackupImported', { groups: actors.length, actors: created.length, challenges: challenges.length })
  };
}

registerForgeFormat({
  id: 'gm-backup',
  label: 'Backup do Escudo do Mestre',
  detect: o => o?.kind === 'runeterra-gm-backup',
  create: importGmBackup
});
