// Runeterra Foundry — rules engine.
// Faithful port of the web app's derived-value formulas (app.js: assignStep/compute/
// healthCalc/zoneOf). The character definition in system.character is authoritative;
// everything here is RECALCULATED from it, never trusted from cached/imported values.

import { catalog } from './data/catalog.js';

export const dn = die => parseInt(String(die).slice(1), 10) || 4;

/**
 * One die-assignment step (web app's assignStep, app.js:343-362).
 * dice: ['d10','d8',…]; assign: {slotId: traitKey}; swap: trait keys where a bigger new die
 * upgrades the owned one and frees its old die as an extra slot (rulebook p.44).
 */
function assignStep(prefix, dice, assign, T, src, swap = []) {
  const slots = dice.map((d, i) => ({ id: prefix + i, die: d }));
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const k = assign?.[s.id];
    if (!k || !catalog.trait(k)) continue;
    s.key = k;
    if (T[k] && swap.includes(k) && dn(s.die) > dn(T[k].die) && !s.freed) {
      const old = T[k].die;
      s.swap = { from: old, to: s.die };
      T[k].die = s.die;
      slots.push({ id: 'f' + s.id, die: old, freed: true, from: k });
    } else if (T[k]) {
      // Trait already owned: the die stays as-is; creation-time validation flags duplicates.
      s.upgrade = { from: T[k].die, to: T[k].die };
    } else {
      T[k] = { key: k, die: s.die, src: [src] };
    }
  }
  return slots;
}

function applyHiDie(existing, candidate) {
  return dn(candidate) > dn(existing) ? candidate : existing;
}

/**
 * Compute the trait tables from the character definition.
 * Returns { powers: {key: 'd10',…}, qualities: {key: 'd8',…} }.
 */
export function computeTraits(character) {
  const T = {};
  const bg = character?.bg ?? {};
  const ps = character?.ps ?? {};
  const arch = character?.arch ?? {};
  const bgDef = bg.id ? catalog.background(bg.id) : null;
  const psDef = ps.id ? catalog.powerSource(ps.id) : null;
  const archDef = arch.id ? catalog.archetype(arch.id) : null;
  const baseDef = archDef && (archDef.divided || archDef.modular) && arch.base
    ? catalog.archetype(arch.base) : archDef;

  if (!bgDef || !psDef || !baseDef) return { powers: {}, qualities: {} };

  // Origin: quality dice → b-slots.
  assignStep('b', bgDef.q?.dice ?? [], bg.assign, T, 'Origem');
  // Power Source: the Origin's psDice → p-slots (powers).
  assignStep('p', bgDef.psDice ?? [], ps.assign, T, 'Fonte de Poder');

  // Source bonuses (extras).
  const extra = ps.extra ?? {};
  const psExtra = psDef.extra;
  if (psExtra?.type === 'addTrait' && extra.key && catalog.trait(extra.key)) {
    const cur = T[extra.key];
    const want = psExtra.die ?? 'd6';
    if (!cur) T[extra.key] = { key: extra.key, die: want, src: ['Fonte de Poder'] };
    else T[extra.key].die = applyHiDie(cur.die, want) === want ? want : cur.die;
  } else if (psExtra?.type === 'alien') {
    const d6s = Object.values(T).filter(t => catalog.trait(t.key).kind === 'power' && dn(t.die) === 6);
    if (extra.key && catalog.trait(extra.key)) {
      const cur = T[extra.key];
      if (cur && dn(cur.die) === 6) cur.die = 'd8';
      else if (!cur) T[extra.key] = { key: extra.key, die: 'd6', src: ['Fonte de Poder'] };
    } else if (d6s.length) {
      d6s[0].die = 'd8';
    }
  } else if (psExtra?.type === 'cosmos') {
    if (extra.down && T[extra.down] && dn(T[extra.down].die) >= 8) {
      T[extra.down].die = 'd' + Math.max(4, dn(T[extra.down].die) - 2);
    }
    if (extra.up && T[extra.up] && dn(T[extra.up].die) <= 10) {
      T[extra.up].die = 'd' + Math.min(12, dn(T[extra.up].die) + 2);
    }
  }

  // Path: the Source's archDice → a-slots, on the base Path's rules; p.44 swap on req traits.
  const reqTraits = baseDef.req?.any ? baseDef.req.any : [];
  assignStep('a', psDef.archDice ?? [], arch.assign, T, 'Caminho', reqTraits);

  // Training source: one extra d8 Path quality (slot t0).
  if (psExtra?.type === 'training') {
    assignStep('t', ['d8'], arch.assign, T, 'Fonte de Poder');
  }
  // Robot: one new Technological power at d10 (slot handled through arch.extra.key).
  if (baseDef.extra?.type === 'addTrait' && arch.extra?.key && catalog.trait(arch.extra.key)) {
    const k = arch.extra.key;
    if (!T[k]) T[k] = { key: k, die: baseDef.extra.die ?? 'd10', src: ['Caminho'] };
  }
  // Modular: up to 2 extra d6 powers (slots m0/m1) to reach the 4-power minimum.
  if (archDef?.modular) {
    const powerCount = Object.values(T).filter(t => catalog.trait(t.key).kind === 'power').length;
    const modExtra = Math.max(0, Math.min(2, 4 - powerCount));
    for (let i = 0; i < modExtra; i++) {
      const k = arch.extra?.['m' + i];
      if (k && catalog.trait(k) && !T[k]) T[k] = { key: k, die: 'd6', src: ['Caminho'] };
    }
  }

  // Temperament: the Signature Quality (synthetic trait, always d8).
  const persDef = character?.pers?.id ? catalog.personality(character.pers.id) : null;
  if (persDef) {
    T['rp-quality'] = { key: 'rp-quality', die: 'd8', src: ['Temperamento'] };
    // Impulsive-style upgrade: one trait +1 size (max d12).
    if (character.pers.upgrade && T[character.pers.upgrade]) {
      T[character.pers.upgrade].die = 'd' + Math.min(12, dn(T[character.pers.upgrade].die) + 2);
    }
  }

  const powers = {}, qualities = {};
  for (const t of Object.values(T)) {
    (catalog.trait(t.key).kind === 'power' ? powers : qualities)[t.key] = t.die;
  }
  return { powers, qualities };
}

/** Status dice from the Temperament (green/yellow/red); second set for Divided heroes. */
export function computeStatus(character) {
  const pers = character?.pers?.id ? catalog.personality(character.pers.id) : null;
  if (!pers) return { status: null, status2: null };
  const status = pers.status.slice();
  let status2 = null;
  if (character.pers.id2 && character.pers.id2 !== character.pers.id) {
    const pers2 = catalog.personality(character.pers.id2);
    if (pers2) status2 = pers2.status.slice();
  }
  return { status, status2 };
}

/**
 * Health: max = 8 + max(red status die) + best eligible trait die (else d4) + (roll or 4).
 * Eligible: best P:athletic / Q:mental trait; archetype healthAlt categories; any trait if
 * the Temperament has healthAny. Zones from the HEALTH_TABLE (clamped 17–40).
 */
export function computeHealth(character, status) {
  if (!status) return null;
  const archDef = character?.arch?.id ? catalog.archetype(character.arch.id) : null;
  const persDef = character?.pers?.id ? catalog.personality(character.pers.id) : null;
  const { powers, qualities } = computeTraits(character);
  const all = { ...powers, ...qualities };

  let elig = Object.entries(all)
    .filter(([k]) => ['P:athletic', 'Q:mental'].includes(catalog.trait(k)?.cat))
    .map(([k, die]) => ({ key: k, die }));
  if (archDef?.healthAlt) {
    elig = elig.concat(Object.entries(all)
      .filter(([k]) => archDef.healthAlt.includes(catalog.trait(k)?.cat))
      .map(([k, die]) => ({ key: k, die })));
  }
  if (persDef?.healthAny) elig = Object.entries(all).map(([k, die]) => ({ key: k, die }));

  const sorted = elig.sort((a, b) => dn(b.die) - dn(a.die));
  const chosen = sorted.find(t => t.key === character?.health?.trait) ?? sorted[0] ?? null;
  const traitMax = chosen ? dn(chosen.die) : 4;
  const roll = character?.health?.mode === 'roll' && character.health.roll ? character.health.roll : 4;
  const red = dn(status[2]);
  const max = 8 + red + traitMax + roll;
  const row = catalog.healthRow(max);
  return {
    max,
    greenLow: row[0], yellowHigh: row[1], yellowLow: row[2], redHigh: row[3],
    chosenTrait: chosen?.key ?? null, traitMax, roll, red
  };
}

/** Zone of the current health value: green / yellow / red / out. */
export function zoneOf(healthValue, derived) {
  if (healthValue == null || healthValue === '' || isNaN(parseInt(healthValue, 10))) return 'green';
  const c = parseInt(healthValue, 10);
  if (c >= derived.greenLow) return 'green';
  if (c >= derived.yellowLow) return 'yellow';
  if (c >= 1) return 'red';
  return 'out';
}

/**
 * Effective zone for ability locks and the Status die (SCRPG reference:
 * getAbilitiesEnabledFromStatusClass — scene red/yellow unlocks as if the
 * actor were in that zone, but the scene can only push DOWN, never up).
 * Knockout ('out') stays out: everything locks except the Out ability.
 * Pure — covered by scripts/test-zone-locks.mjs.
 */
export function effectiveZone(healthZone, scene) {
  if (healthZone === 'out') return 'out';
  if (scene === 'red') return 'red';
  if (scene === 'yellow' && healthZone === 'green') return 'yellow';
  return healthZone ?? 'green';
}

/**
 * Full derivation for a champion actor: traits, status, health, zone.
 * Returns null when the character definition is incomplete.
 */
export function derive(character, currentHealth) {
  const complete = !!(character?.bg?.id && character?.ps?.id && character?.arch?.id && character?.pers?.id);
  if (!complete) return null;
  const { powers, qualities } = computeTraits(character);
  const { status, status2 } = computeStatus(character);
  const health = computeHealth(character, status);
  return { powers, qualities, status, status2, health, zone: zoneOf(currentHealth, { greenLow: health.greenLow, yellowLow: health.yellowLow }) };
}
