// Runeterra Foundry — dice (ported from the SCRPG foundation's dice.js, V14-clean APIs).
// Core mechanic preserved: three dice (Poder / Qualidade / Status) rolled as one pool
// "{a,b,c}", sorted → Máx/Méd/Mín. Mods (bonus/penalty items) included.
import { catalog } from './data/catalog.js';
import { decorateRulesHtml } from './rules-text.js';
import { resolveStatusDie } from './status.js';
import { slotKinds } from './rules.js';

function collectMods(actor) {
  const all = (actor?.items ?? []).filter(i => i.type === 'mod');
  const selected = all.filter(m => m.system.selected);
  const bonus = selected.filter(m => (m.system.value ?? 0) > 0).reduce((s, m) => s + m.system.value, 0);
  const penalty = selected.filter(m => (m.system.value ?? 0) < 0).reduce((s, m) => s + m.system.value, 0);
  // Forgotten-penalty reminder: a usable non-persistent penalty was left unselected.
  const forgotPenalty = all.some(m => !m.system.selected && (m.system.value ?? 0) < 0 && !m.system.persistent);
  return { mods: selected, bonus, penalty, forgotPenalty };
}

/** The status die is stored as a zone key ('green'…/'out') — show the localized zone. */
const ZONE_LABEL_KEY = { green: 'RUNETERRA.ZoneGreen', yellow: 'RUNETERRA.ZoneYellow', red: 'RUNETERRA.ZoneRed' };
function statusDisplayName(raw) {
  if (ZONE_LABEL_KEY[raw]) return game.i18n.localize(ZONE_LABEL_KEY[raw]);
  if (raw === 'out') return game.i18n.localize('RUNETERRA.Knockout');
  return raw ?? '';
}

/** After a roll: non-persistent mods are consumed; persistent ones stay, unselected. */
async function consumeMods(actor) {
  const used = (actor?.items ?? []).filter(i => i.type === 'mod' && i.system.selected);
  for (const m of used) {
    if (m.system.persistent) await m.update({ 'system.selected': false }, { render: false });
    else await m.delete();
  }
}

/**
 * Combined Power + Quality + Status roll.
 */
export async function TaskCheck(actor, { abilityId = null } = {}) {
  const sys = actor.system;
  // Each name rides along with its own die through the Max/Mid/Min sort, so the
  // label under a die always belongs to that die (fixed-order rows misaligned).
  const slotNames = [sys.firstDieName, sys.secondDieName, statusDisplayName(sys.thirdDieName)];
  // Divided Psyche swaps slot kinds by form (civilian = two qualities, heroic = two powers).
  const [k1, k2] = slotKinds(sys.character, sys.dividedMode);
  const kindLabel = (k) => game.i18n.localize(k === 'quality' ? 'RUNETERRA.DiceQuality' : 'RUNETERRA.DicePower');
  const slotTypes = [
    kindLabel(k1),
    kindLabel(k2),
    game.i18n.localize('RUNETERRA.DiceStatus')
  ];
  const formula = `{${sys.firstDie},${sys.secondDie},${sys.thirdDie}}`;
  const rollResult = await new foundry.dice.Roll(formula).evaluate();
  rollResult.dice.forEach((d, i) => {
    d.slotName = slotNames[i] ?? '';
    d.slotType = slotTypes[i] ?? '';
  });
  const dice = rollResult.dice.sort((a, b) =>
    (b.total - a.total) || (b.faces - a.faces));
  const positions = ['Max', 'Mid', 'Min'];
  dice.forEach((d, i) => {
    d.dicePosition = game.i18n.localize(`RUNETERRA.Dice${positions[i]}`);
    d.img = 'icons/svg/d' + d.faces + '-grey.svg';
    d.imgClass = game.settings.get('runeterra', 'coloredDice') ? ('d' + d.faces) : '';
  });

  const { mods, bonus, penalty, forgotPenalty } = collectMods(actor);

  const st = sys.antagonist?.state?.ap
    ? { zone: sys.antagonist.zone ?? 'green' }
    : resolveStatusDie(sys.character, sys.play?.current, sys.scene ?? 'green', sys.derived);
  const zoneColor = st.zone === 'out' ? 'red' : st.zone;
  const render = await foundry.applications.handlebars.renderTemplate(
    'systems/runeterra/templates/chat/mainroll.hbs',
    { dice, mods, bonus, penalty, forgotPenalty, zoneColor });
  // The last ability clicked rides on the roll card — its text goes above the dice.
  let flavor = render;
  const ability = abilityId ? actor.items.get(abilityId) : null;
  if (ability) {
    const gameText = await foundry.applications.ux.TextEditor.implementation
      .enrichHTML(ability.system.gameText ?? ability.system.description ?? '')
      .then(decorateRulesHtml);
    flavor = (await foundry.applications.handlebars.renderTemplate(
      'systems/runeterra/templates/chat/abilityroll.hbs', { item: ability, gameText })) + render;
  }
  const messageData = {
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor,
    flavorIsHTML: false
  };
  // toMessage drops messageData.whisper in v14 — GM secrecy goes through rollMode.
  const options = isGmOnly(actor) ? { rollMode: 'blindroll' } : {};
  await rollResult.toMessage(messageData, options);
  await consumeMods(actor);
  return rollResult;
}

/** Enemies' rolls (antagonists, minions/lieutenants, environments) are for the GM's eyes only. */
export const isGmOnly = actor => ['villain', 'minion', 'environment'].includes(actor?.type);

/**
 * Single-die roll (power / quality / status).
 */
export async function SingleCheck(roll, rollType, rollName, actor) {
  const rollResult = await new foundry.dice.Roll(roll).evaluate();
  rollResult.rollType = rollType;
  rollResult.rollName = rollName;
  rollResult.img = 'icons/svg/d' + (rollResult.dice[0]?.faces ?? 4) + '-grey.svg';
  rollResult.imgClass = game.settings.get('runeterra', 'coloredDice')
    ? ('d' + (rollResult.dice[0]?.faces ?? 4)) : '';

  const { mods, bonus, penalty, forgotPenalty } = collectMods(actor);

  const cap = String(rollType).charAt(0).toUpperCase() + String(rollType).slice(1);
  if (rollType === 'status') rollName = statusDisplayName(rollName);
  const render = await foundry.applications.handlebars.renderTemplate(
    'systems/runeterra/templates/chat/minorroll.hbs',
    {
      rollResult, mods, bonus, penalty, forgotPenalty,
      typeLabel: game.i18n.localize(`RUNETERRA.Dice${cap}`),
      dieLabel: 'd' + (rollResult.dice[0]?.faces ?? 4)
    });
  await rollResult.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: render,
    flavorIsHTML: false
  }, isGmOnly(actor) ? { rollMode: 'blindroll' } : {});
  await consumeMods(actor);
  return rollResult;
}

/**
 * Out (knockout) ability card: no dice, Temperament text with the trait chip
 * filled — same content as the sheet's Out row. Only usable while knocked out;
 * the sheet only shows the button when the Out row is active.
 */
export async function OutRoll(actor) {
  const ch = actor?.system?.character;
  const pers = ch?.pers?.id ? catalog.personality(ch.pers.id) : null;
  if (!pers) return;
  const raw = window.I18N?.text?.[pers.out] ?? pers.out ?? '';
  const traitName = ch.pers.outTrait ? catalog.traitName(ch.pers.outTrait, ch) : '[…]';
  const text = raw.replace(/\[(power|quality)\]/g, `<strong>${traitName}</strong>`);
  const gameText = decorateRulesHtml(await foundry.applications.ux.TextEditor.implementation.enrichHTML(text));
  const item = { name: game.i18n.localize('RUNETERRA.Knockout'), system: { zone: 'out' } };
  const render = await foundry.applications.handlebars.renderTemplate(
    'systems/runeterra/templates/chat/abilityroll.hbs', { item, gameText });
  await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: render
  });
}

/**
 * Minion group roll (SCRPG RollAllMinions, adapted): every minion actor sharing
 * the same group name rolls its own die into a single chat card. No group set
 * (or no match) → just this minion rolls.
 */
export async function rollMinionGroup(actor, groupName = null) {
  const group = (groupName ?? actor?.system?.group ?? '').trim();
  const minions = group
    ? (game.actors?.filter(a => a.type === 'minion' && (a.system.group ?? '').trim() === group) ?? [])
    : [];
  const roster = minions.length ? minions : [actor].filter(Boolean);
  const colored = game.settings.get('runeterra', 'coloredDice');
  const rolls = [];
  for (const m of roster) {
    const die = m.system.dieType ?? 'd4';
    const r = await new foundry.dice.Roll(die).evaluate();
    const faces = r.dice[0]?.faces ?? 4;
    rolls.push({
      name: m.name, die,
      total: r.total,
      img: 'icons/svg/d' + faces + '-grey.svg',
      imgClass: colored ? ('d' + faces) : ''
    });
  }
  const render = await foundry.applications.handlebars.renderTemplate(
    'systems/runeterra/templates/chat/minionsroll.hbs', { group, rolls });
  await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: render,
    ...(isGmOnly(actor) ? { whisper: ChatMessage.getWhisperRecipients('GM').map(u => u.id), blind: true } : {})
  });
  return rolls;
}

/**
 * Macro/API entry: combined roll for every selected champion/villain token.
 * Nothing selected → warn instead of rolling blindly.
 */
export async function rollSelected() {
  const actors = (canvas.tokens?.controlled ?? [])
    .map(t => t.actor)
    .filter(a => a && (a.type === 'champion' || a.type === 'villain'));
  if (!actors.length) {
    ui.notifications.warn(game.i18n.localize('RUNETERRA.NoTokensSelected'));
    return [];
  }
  const out = [];
  for (const a of actors) out.push(await TaskCheck(a));
  return out;
}
