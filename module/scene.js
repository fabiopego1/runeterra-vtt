// Runeterra Foundry — Scene Tracker logic (ported from the SCRPG foundation's scene.js).
// The scene actor holds per-zone space settings/currents; filling a zone's spaces advances
// the scene color, which broadcasts to every champion and shifts their status die.
import { HealthUpdate, EnvironmentUpdate } from './status.js';

const CHAT_TEMPLATE = 'systems/runeterra/templates/chat/scenestatus.hbs';

async function sceneStatus(gc, yc, rc, gt, yt, rt) {
  const content = await foundry.applications.handlebars.renderTemplate(CHAT_TEMPLATE, {
    gc, yc, rc, gt, yt, rt
  });
  await ChatMessage.create({ user: game.user.id, content, flavor: 'Scene' });
}

/** Broadcast a scene color to every champion, villain and environment, refreshing status dice. */
async function broadcastScene(color) {
  for (const actor of game.actors.contents) {
    if (actor.type !== 'champion' && actor.type !== 'villain' && actor.type !== 'environment') continue;
    await actor.update({ 'system.scene': color }, { render: false });
    if (actor.type === 'environment') await EnvironmentUpdate(actor);
    else await HealthUpdate(actor);
  }
}

/** First scene-tracker actor in the world, if the GM created one. */
export function findSceneActor() {
  return game.actors.contents.find(a => a.type === 'scene') ?? null;
}

/**
 * Macro/API entry: jump straight to a scene color (like the old SCRPG macros).
 * Actors always follow; the tracker's spaces are lined up to match when one exists.
 */
export async function setSceneColor(color) {
  if (!['green', 'yellow', 'red'].includes(color)) return;
  await broadcastScene(color);
  const sc = findSceneActor();
  if (!sc) return;
  const g = sc.system.greenSpace?.setting ?? 0;
  const y = sc.system.yellowSpace?.setting ?? 0;
  if (color === 'green') {
    await sc.update({ 'system.greenSpace.current': 0, 'system.yellowSpace.current': 0, 'system.redSpace.current': 0 });
  } else if (color === 'yellow') {
    await sc.update({ 'system.greenSpace.current': g, 'system.yellowSpace.current': 0, 'system.redSpace.current': 0 });
  } else {
    await sc.update({ 'system.greenSpace.current': g, 'system.yellowSpace.current': y, 'system.redSpace.current': 0 });
  }
}

/** Macro/API entry: back to green, tracker included when one exists. */
export async function resetScene() {
  const sc = findSceneActor();
  if (sc) await SceneReset(sc);
  else await broadcastScene('green');
}

export async function SceneReset(actor) {
  await actor.update({
    'system.greenSpace.current': 0,
    'system.yellowSpace.current': 0,
    'system.redSpace.current': 0
  });
  await broadcastScene('green');
}

export async function SetGreen() { await broadcastScene('green'); }
export async function SetYellow() { await broadcastScene('yellow'); }
export async function SetRed() { await broadcastScene('red'); }

/**
 * Click state machine for the tracker (ported from SCRPGCharacterSheet._onSetScene).
 * Clicking a space fills it; clicking the already-current last space toggles it back.
 * Returns a short status string for the caller.
 */
export async function onSetScene(actor, zone) {
  const key = `${zone}Space`;
  const space = actor.system[key];
  const next = space.current + 1;

  if (space.current >= space.setting) {
    // Zone already full: clicking it rewinds one step and resets to this color.
    await actor.update({ [`system.${key}.current`]: space.current - 1 });
    if (zone === 'green') await SetGreen();
    if (zone === 'yellow') await SetYellow();
    if (zone === 'red') await SetRed();
    return 'rewind';
  }

  await actor.update({ [`system.${key}.current`]: next });

  if (zone === 'green' && next >= space.setting) {
    await SetYellow();
    return 'yellow';
  }
  if (zone === 'yellow' && next >= space.setting) {
    await SetRed();
    return 'red';
  }
  if (zone === 'red' && next >= space.setting) {
    return 'final';
  }

  const s = actor.system;
  await sceneStatus(
    s.greenSpace.current, s.yellowSpace.current, s.redSpace.current,
    s.greenSpace.setting, s.yellowSpace.setting, s.redSpace.setting);
  return 'step';
}

/** Post a summary card of remaining spaces. */
export async function postSceneStatus(actor) {
  const s = actor.system;
  await sceneStatus(
    s.greenSpace.current, s.yellowSpace.current, s.redSpace.current,
    s.greenSpace.setting, s.yellowSpace.setting, s.redSpace.setting);
}

/** Standard scene presets (SCRPG defaults). */
export const SCENE_PRESETS = {
  standard: [2, 4, 2],
  prolonged: [3, 5, 3],
  epic: [1, 3, 4]
};

export async function applyPreset(actor, preset) {
  const [g, y, r] = SCENE_PRESETS[preset] ?? SCENE_PRESETS.standard;
  await actor.update({
    'system.greenSpace.setting': g, 'system.greenSpace.current': 0,
    'system.yellowSpace.setting': y, 'system.yellowSpace.current': 0,
    'system.redSpace.setting': r, 'system.redSpace.current': 0
  });
  await SetGreen();
}
