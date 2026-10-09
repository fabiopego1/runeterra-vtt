// Runeterra Foundry — Scene Tracker logic.
// The Cena actor holds the marker's sizes and fills; the rules live in tracker.js (one row of spaces, like the
// Screen). Marking a space can change the scene colour, which broadcasts to every champion, antagonist and
// environment and shifts their status die. The table is told when the colour changes and when the marker ends.
import { HealthUpdate, EnvironmentUpdate } from './status.js';
import {
  trackerSizes, trackerMarked, trackerTotal, trackerClamp, trackerColor, trackerEnded, trackerUpdate,
  trackerClick, MAX_STEPS, ZONES, DEFAULT_SIZES
} from './tracker.js';

const CHAT_TEMPLATE = 'systems/runeterra/templates/chat/scenestatus.hbs';
const COLOR_KEY = { green: 'RUNETERRA.SceneNowGreen', yellow: 'RUNETERRA.SceneNowYellow', red: 'RUNETERRA.SceneNowRed' };

async function sceneStatus(actor, message = '') {
  const s = actor.system, [gt, yt, rt] = trackerSizes(s);
  const content = await foundry.applications.handlebars.renderTemplate(CHAT_TEMPLATE, {
    gc: s.greenSpace.current, yc: s.yellowSpace.current, rc: s.redSpace.current, gmax: gt, ymax: yt, rmax: rt, message
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
 * Move the marker to `marked` filled spaces (sizes optional): saves the zones' fills, broadcasts the colour when it
 * changed (or when `force`), and posts the status card — with a line when the colour changed or the marker ended.
 */
export async function setMarked(actor, marked, { sizes = null, force = false, silent = false } = {}) {
  const old = trackerSizes(actor.system), oldMarked = trackerMarked(actor.system);
  const next = sizes ?? old;
  const m = trackerClamp(marked, next);
  const before = trackerColor(oldMarked, old), color = trackerColor(m, next);
  await actor.update(trackerUpdate(m, next));
  const changed = color !== before;
  if (changed || force) await broadcastScene(color);
  if (silent) return { color, ended: trackerEnded(m, next), changed };
  const ended = trackerEnded(m, next);
  const message = ended ? game.i18n.localize('RUNETERRA.SceneEnd') : (changed ? game.i18n.localize(COLOR_KEY[color]) : '');
  await sceneStatus(actor, message);
  return { color, ended, changed };
}

/**
 * Macro/API entry: jump straight to a scene color. Actors always follow; the tracker's spaces are lined up to
 * match when one exists (Verde = nothing marked, Amarela = the green spaces, Vermelha = green + yellow).
 */
export async function setSceneColor(color) {
  if (!ZONES.includes(color)) return;
  const sc = findSceneActor();
  if (!sc) { await broadcastScene(color); return; }
  const [g, y] = trackerSizes(sc.system);
  await setMarked(sc, color === 'green' ? 0 : color === 'yellow' ? g : g + y, { force: true, silent: true });
}

/** Macro/API entry: back to green, tracker included when one exists. */
export async function resetScene() {
  const sc = findSceneActor();
  if (sc) await SceneReset(sc);
  else await broadcastScene('green');
}

export async function SceneReset(actor) {
  await setMarked(actor, 0, { force: true, silent: true });
}

export async function SetGreen() { await broadcastScene('green'); }
export async function SetYellow() { await broadcastScene('yellow'); }
export async function SetRed() { await broadcastScene('red'); }

/** A space of the tracker was clicked: zone + index inside the zone. Filled → rewind to it; empty → fill up to it. */
export async function onSetScene(actor, zone, index = null) {
  const sizes = trackerSizes(actor.system), marked = trackerMarked(actor.system);
  const z = ZONES.indexOf(zone);
  if (z < 0) return null;
  const offset = sizes.slice(0, z).reduce((a, b) => a + b, 0);
  // No space given (macro/API): advance one space, like the "Avançar" button.
  const target = index == null ? Math.min(trackerTotal(sizes), marked + 1) : trackerClick(marked, offset + Number(index));
  return setMarked(actor, target);
}

/** "Avançar um espaço" / "Voltar um" (the marker's turn). */
export const advanceScene = actor => setMarked(actor, trackerMarked(actor.system) + 1);
export const rewindScene = actor => setMarked(actor, trackerMarked(actor.system) - 1);

/** Change one zone's size (1–8): keeps what is marked (within the row), re-lines the zones and the colour. */
export async function setSceneSize(actor, zone, value) {
  const z = ZONES.indexOf(zone);
  if (z < 0) return;
  const sizes = trackerSizes(actor.system);
  sizes[z] = Math.max(1, Math.min(MAX_STEPS, Math.trunc(Number(value)) || 1));
  await setMarked(actor, trackerMarked(actor.system), { sizes, force: true, silent: true });
}

/** Post a summary card of the marker. */
export async function postSceneStatus(actor) { await sceneStatus(actor); }

/** Standard scene presets (the rulebook's: Padrão, Prolongado, Épico). */
export const SCENE_PRESETS = {
  standard: [2, 4, 2],
  prolonged: [3, 5, 3],
  epic: [1, 3, 4]
};

export async function applyPreset(actor, preset) {
  const sizes = SCENE_PRESETS[preset] ?? DEFAULT_SIZES;
  await setMarked(actor, 0, { sizes: [...sizes], force: true, silent: true });
}
