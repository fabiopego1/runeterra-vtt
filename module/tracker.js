// Runeterra Foundry — the scene marker ("marcador de cena") as pure functions (no Foundry globals, unit-tested).
// Same model as the Screen's tracker: ONE row of spaces — Verde, then Amarelo, then Vermelho — and a single
// number `marked` of filled spaces. The scene colour and each zone's fill are derived from it, so they can never
// disagree: marked ≥ green → Amarela; marked ≥ green + yellow → Vermelha; marked = every space → the scene ends.

export const MAX_STEPS = 8;
export const ZONES = ['green', 'yellow', 'red'];
export const DEFAULT_SIZES = [2, 4, 2];

const clamp = (n, lo, hi, d) => {
  const v = Math.trunc(Number(n));
  return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d;
};

/** [green, yellow, red] sizes from a Scene actor's system data (or defaults). */
export const trackerSizes = sys => ZONES.map((z, i) => clamp(sys?.[`${z}Space`]?.setting, 1, MAX_STEPS, DEFAULT_SIZES[i]));

/** Filled spaces: the sum of the zones' fills (each within its zone). Heals older, inconsistent saves. */
export function trackerMarked(sys) {
  const sizes = trackerSizes(sys);
  return ZONES.reduce((n, z, i) => n + clamp(sys?.[`${z}Space`]?.current, 0, sizes[i], 0), 0);
}

export const trackerTotal = sizes => sizes[0] + sizes[1] + sizes[2];
export const trackerClamp = (marked, sizes) => clamp(marked, 0, trackerTotal(sizes), 0);

/** The scene colour at `marked` filled spaces. */
export function trackerColor(marked, sizes) {
  if (marked >= sizes[0] + sizes[1]) return 'red';
  if (marked >= sizes[0]) return 'yellow';
  return 'green';
}

/** The last Red space is filled: something bad happens and the scene ends. */
export const trackerEnded = (marked, sizes) => marked >= trackerTotal(sizes);

/** Per-zone { setting, current } for `marked` filled spaces (zones fill in order). */
export function trackerSpaces(marked, sizes) {
  let left = trackerClamp(marked, sizes);
  return sizes.map(setting => {
    const current = Math.min(setting, left);
    left -= current;
    return { setting, current };
  });
}

/** Actor update data for a state. */
export function trackerUpdate(marked, sizes) {
  const out = {};
  trackerSpaces(marked, sizes).forEach((s, i) => {
    out[`system.${ZONES[i]}Space.setting`] = s.setting;
    out[`system.${ZONES[i]}Space.current`] = s.current;
  });
  return out;
}

/** Clicking space `index` (0-based, along the whole row): a filled one rewinds to it, an empty one fills up to it. */
export const trackerClick = (marked, index) => (index < marked ? index : index + 1);

/** The Screen's tracker `{ g, y, r, marked }` → { sizes, marked } (sizes 1–8, marked within the row). */
export function trackerFromScreen(t) {
  const sizes = [t?.g, t?.y, t?.r].map((n, i) => clamp(n, 1, MAX_STEPS, DEFAULT_SIZES[i]));
  return { sizes, marked: trackerClamp(t?.marked, sizes) };
}

/** Does a Screen tracker differ from the fresh table (2/4/2, nothing marked)? Then it is worth carrying over. */
export function trackerIsCustom(t) {
  if (!t || typeof t !== 'object') return false;
  const { sizes, marked } = trackerFromScreen(t);
  return marked > 0 || sizes.some((n, i) => n !== DEFAULT_SIZES[i]);
}

/** The `system` object (greenSpace/yellowSpace/redSpace) for a new Cena actor. */
export function trackerSystem(marked, sizes) {
  const out = {};
  trackerSpaces(marked, sizes).forEach((s, i) => { out[`${ZONES[i]}Space`] = s; });
  return out;
}
