// Runeterra Foundry — the GM Screen's twist generator ("Gerador de reviravoltas"), as a GM-only chat card.
// The twist tables (15 regions, minor/major) live in the sealed vault module gm-twists; they are read
// after the GM unlocks the vault. Same rules as the Screen: the region's own list, plus (for a
// specific region) the two first generic ones; never the same text twice in a row.

import { ensureVaultModules } from './vault.js';
import { catalog } from './data/catalog.js';

export const TWIST_KINDS = ['minor', 'major'];
export const ANY_REGION = 'any';

/**
 * Pure: pick a twist text. `T` is window.GM_TWISTS ({ any: {minor[], major[]}, <region>: {…} }).
 * `last` is the previous text (avoided when there is another choice); `rnd` is injectable for tests.
 */
export function pickTwist(T, region, kind, last = null, rnd = Math.random) {
  if (!TWIST_KINDS.includes(kind)) throw new Error(`Tipo de reviravolta "${kind}" desconhecido (minor|major).`);
  const here = T?.[region] ?? T?.any;
  if (!here?.[kind]?.length) throw new Error('As tabelas de reviravolta estão vazias.');
  const pool = here[kind].concat(region === ANY_REGION || !T.any ? [] : T.any[kind].slice(0, 2));
  let text;
  let guard = 0;
  do { text = pool[Math.floor(rnd() * pool.length)]; } while (pool.length > 1 && text === last && ++guard < 50);
  return text;
}

/** Regions that have their own list, in the dataset's order (names are the pt-BR ones). */
export function twistRegions(T) {
  return catalog.regions().filter(r => T?.[r.id]).map(r => ({ id: r.id, name: r.name }));
}

const lastByRegion = new Map();

/**
 * Roll a twist and post it as a card whispered to the GMs. GM only (the vault is the GM's).
 * Returns { ok, text?, where?, kind?, error? }.
 */
export async function rollTwist({ region = ANY_REGION, kind = 'minor' } = {}) {
  const r = await ensureVaultModules(['gm-twists']);
  if (!r.ok) return { ok: false, error: r.error };
  const T = window.GM_TWISTS;
  const key = `${region}|${kind}`;
  let text;
  try { text = pickTwist(T, region, kind, lastByRegion.get(key)); } catch (e) { return { ok: false, error: e.message }; }
  lastByRegion.set(key, text);
  const reg = catalog.regions().find(x => x.id === region);
  const where = reg ? reg.name : game.i18n.localize('RUNETERRA.TwistAnywhere');
  const content = await foundry.applications.handlebars.renderTemplate('systems/runeterra/templates/chat/gmtwist.hbs', {
    kind, kindLabel: game.i18n.localize(kind === 'major' ? 'RUNETERRA.TwistMajor' : 'RUNETERRA.TwistMinor'), where, text
  });
  await ChatMessage.create({
    user: game.user.id,
    speaker: { alias: game.i18n.localize('RUNETERRA.TwistSpeaker') },
    content,
    whisper: ChatMessage.getWhisperRecipients('GM').map(u => u.id)
  });
  return { ok: true, text, where, kind };
}
