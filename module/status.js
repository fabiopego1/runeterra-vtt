// Runeterra Foundry — status die resolution.
// Rule: the status die ALWAYS follows the health zone (Temperament dice
// green/yellow/red); the Scene tracker color can only push it DOWN one step
// (green→yellow when the scene is yellow, anything→red when the scene is red).
// It is never edited by hand — HealthUpdate recomputes it on every trigger
// (import, health change, scene broadcast) and the sheet re-syncs on render.

import { derive, zoneOf, effectiveZone } from './rules.js';

const ZONE_INDEX = { green: 0, yellow: 1, red: 2 };

function statusDieFrom(source, zoneName, mode = 'heroic') {
  // Civilian form uses the second Temperament's dice when they exist (Divided).
  const st = (mode === 'civilian' && source?.status2) ? source.status2 : source?.status;
  if (Array.isArray(st)) return st[ZONE_INDEX[zoneName] ?? 0] ?? 'd8';
  if (st && typeof st === 'object') return st[zoneName] ?? 'd8';
  return 'd8';
}

/**
 * Pure rule resolution (no side effects — safe to call from render paths).
 * `character` = system.character (live derive preferred); `snapshot` =
 * system.derived (fallback for incomplete actors). `mode` = 'heroic'|'civilian'
 * (Divided second form uses status2). Returns { die, name, zone }.
 * When knocked out (zone 'out') there is no status die to roll: we keep the red
 * die stored but label it 'out' so chat stays readable.
 */
export function resolveStatusDie(character, current, scene, snapshot, mode = 'heroic') {
  const live = character ? safeDerive(character, current) : null;
  const zone = live?.zone ?? zoneOf(current, snapshot ?? {});
  const effective = effectiveZone(zone, scene);
  const source = live ? { status: live.status, status2: live.status2 } : snapshot;
  if (zone === 'out') return { die: statusDieFrom(source, 'red', mode), name: 'out', zone };
  return { die: statusDieFrom(source, effective, mode), name: effective, zone };
}

function safeDerive(character, current) {
  try {
    return derive(character, current);
  } catch (e) {
    return null;
  }
}

/**
 * Recompute the actor's third (status) die from health zone + scene.
 * Also refreshes the stored derived snapshot and the token health value,
 * so legacy actors created before this rule heal themselves on first render.
 * Skips the update when everything already matches (no render loops).
 */
export async function HealthUpdate(actor) {
  if (actor.type !== 'champion' && actor.type !== 'villain') return;
  const sys = actor.system;
  const current = sys.play?.current;
  const scene = sys.scene ?? 'green';
  const mode = sys.dividedMode === 'civilian' ? 'civilian' : 'heroic';
  const r = resolveStatusDie(sys.character, current, scene, sys.derived, mode);
  const cur = parseInt(current, 10);

  const patch = {};
  if (sys.thirdDie !== r.die) patch['system.thirdDie'] = r.die;
  if (sys.thirdDieName !== r.name) patch['system.thirdDieName'] = r.name;
  if (!isNaN(cur) && sys.health?.value !== cur) patch['system.health.value'] = cur;

  // Refresh a stale stored snapshot whenever the live derive is available.
  const live = sys.character ? safeDerive(sys.character, current) : null;
  if (live) {
    const snap = {
      powers: live.powers,
      qualities: live.qualities,
      status: { green: live.status[0], yellow: live.status[1], red: live.status[2] },
      status2: live.status2,
      healthMax: live.health.max,
      greenLow: live.health.greenLow,
      yellowHigh: live.health.yellowHigh,
      yellowLow: live.health.yellowLow,
      redHigh: live.health.redHigh
    };
    for (const [k, v] of Object.entries(snap)) {
      if (JSON.stringify(sys.derived?.[k]) !== JSON.stringify(v)) patch[`system.derived.${k}`] = v;
    }
    if (sys.health?.max !== live.health.max) patch['system.health.max'] = live.health.max;
  }

  if (Object.keys(patch).length) await actor.update(patch);
}
