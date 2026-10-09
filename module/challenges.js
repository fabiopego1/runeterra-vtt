// Runeterra Foundry — scene challenges ("Desafios") from the GM Screen's table tools.
// A challenge is an obstacle the champions beat with Overcome: it needs N successes (1–5) and may
// have a timer (0–8 turns). Resolved = successes reached; "fired" = the timer ran out first.
// Same model as the Screen's table ({ id, name, need, done, timer, ticks }), so the challenges of an
// exported Screen backup import as they are. Pure functions: the Cena sheet stores the list.

const clamp = (v, lo, hi, def) => {
  const x = Number.parseInt(v, 10);
  return Number.isNaN(x) ? def : Math.max(lo, Math.min(hi, x));
};
const randomId = () => Math.random().toString(36).slice(2, 10);

/** A well-formed challenge (limits as the Screen: need 1–5, timer 0–8, progress within bounds). */
export function normalizeChallenge(c, newId = randomId) {
  const need = clamp(c?.need, 1, 5, 1), timer = clamp(c?.timer, 0, 8, 0);
  return {
    id: String(c?.id || newId()),
    name: String(c?.name ?? '').trim().slice(0, 50),
    need, done: clamp(c?.done, 0, need, 0),
    timer, ticks: clamp(c?.ticks, 0, timer, 0)
  };
}

/** New challenge appended to a list (empty names are refused: the list comes back unchanged). */
export function addChallenge(list, { name, need, timer }, newId = randomId) {
  const c = normalizeChallenge({ name, need, timer }, newId);
  return c.name ? [...list, c] : list;
}

/** Click on success box `i`: clicking a filled box undoes down to it, an empty one fills up to it. */
export function toggleDone(list, id, i) {
  return list.map(c => (c.id === id ? { ...c, done: i < c.done ? i : Math.min(c.need, i + 1) } : c));
}

/** Same for the timer boxes. */
export function toggleTick(list, id, i) {
  return list.map(c => (c.id === id ? { ...c, ticks: i < c.ticks ? i : Math.min(c.timer, i + 1) } : c));
}

export const removeChallenge = (list, id) => list.filter(c => c.id !== id);

/** 'ok' resolved · 'bad' timer fired · '' still open (resolved wins if both hold). */
export function challengeState(c) {
  if (c.done >= c.need) return 'ok';
  if (c.timer && c.ticks >= c.timer) return 'bad';
  return '';
}

/** Challenges of a Screen table (backup import), normalized; nameless ones are dropped. */
export function challengesFromTable(table, newId = randomId) {
  return (table?.challenges ?? []).map(c => normalizeChallenge(c, newId)).filter(c => c.name);
}

/** Sheet view: the challenge plus its boxes, ready for the template. */
export function challengeView(c) {
  const state = challengeState(c);
  return {
    ...c, state,
    resolved: state === 'ok', fired: state === 'bad',
    doneBoxes: Array.from({ length: c.need }, (_, i) => ({ i, on: i < c.done })),
    tickBoxes: Array.from({ length: c.timer }, (_, i) => ({ i, on: i < c.ticks }))
  };
}
