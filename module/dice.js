// Runeterra Foundry — dice (ported from the SCRPG foundation's dice.js, V14-clean APIs).
// Core mechanic preserved: three dice (Poder / Qualidade / Status) rolled as one pool
// "{a,b,c}", sorted → Máx/Méd/Mín. Mods (bonus/penalty items) included.

function collectMods(actor) {
  const all = (actor?.items ?? []).filter(i => i.type === 'mod');
  const selected = all.filter(m => m.system.selected);
  const bonus = selected.filter(m => (m.system.value ?? 0) > 0).reduce((s, m) => s + m.system.value, 0);
  const penalty = selected.filter(m => (m.system.value ?? 0) < 0).reduce((s, m) => s + m.system.value, 0);
  // Forgotten-penalty reminder: a usable non-persistent penalty was left unselected.
  const forgotPenalty = all.some(m => !m.system.selected && (m.system.value ?? 0) < 0 && !m.system.persistent);
  return { mods: selected, bonus, penalty, forgotPenalty };
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
export async function TaskCheck(actor) {
  const sys = actor.system;
  const names = [sys.firstDieName, sys.secondDieName, sys.thirdDieName];
  const formula = `{${sys.firstDie},${sys.secondDie},${sys.thirdDie}}`;
  const rollResult = await new Roll(formula).evaluate();
  const dice = rollResult.dice.sort((a, b) =>
    (b.total - a.total) || (b.faces - a.faces));
  const positions = ['Max', 'Mid', 'Min'];
  dice.forEach((d, i) => {
    d.dicePosition = game.i18n.localize(`RUNETERRA.Dice${positions[i]}`);
    d.img = 'icons/svg/d' + d.faces + '-grey.svg';
    d.imgClass = game.settings.get('runeterra', 'coloredDice') ? ('d' + d.faces) : '';
  });

  const { mods, bonus, penalty, forgotPenalty } = collectMods(actor);

  const render = await foundry.applications.handlebars.renderTemplate(
    'systems/runeterra/templates/chat/mainroll.hbs',
    { dice, names, mods, bonus, penalty, forgotPenalty });
  await rollResult.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: render,
    flavorIsHTML: false
  });
  await consumeMods(actor);
  return rollResult;
}

/**
 * Single-die roll (power / quality / status).
 */
export async function SingleCheck(roll, rollType, rollName, actor) {
  const rollResult = await new Roll(roll).evaluate();
  rollResult.rollType = rollType;
  rollResult.rollName = rollName;
  rollResult.img = 'icons/svg/d' + (rollResult.dice[0]?.faces ?? 4) + '-grey.svg';
  rollResult.imgClass = game.settings.get('runeterra', 'coloredDice')
    ? ('d' + (rollResult.dice[0]?.faces ?? 4)) : '';

  const { mods, bonus, penalty, forgotPenalty } = collectMods(actor);

  const render = await foundry.applications.handlebars.renderTemplate(
    'systems/runeterra/templates/chat/minorroll.hbs',
    { rollResult, mods, bonus, penalty, forgotPenalty });
  await rollResult.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: render,
    flavorIsHTML: false
  });
  await consumeMods(actor);
  return rollResult;
}

/**
 * Ability card: no dice, just the rules text in chat.
 */
export async function ItemRoll(item) {
  const raw = item.system.gameText ?? item.system.description ?? '';
  const gameText = await foundry.applications.ux.TextEditor.implementation.enrichHTML(raw);
  const render = await foundry.applications.handlebars.renderTemplate(
    'systems/runeterra/templates/chat/abilityroll.hbs', { item, gameText });
  await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor: item.actor ?? undefined }),
    content: render
  });
}
