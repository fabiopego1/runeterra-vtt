// Runeterra Foundry — status die resolution (ported from SCRPG status.js, adapted to
// Runeterra: status dice come from the Temperament and the zone follows current health).
import { zoneOf } from './rules.js';

const ZONE_DIE_FIELD = { green: 'green', yellow: 'yellow', red: 'red' };

/**
 * Update the actor's third (status) die from its current health zone.
 * The scene color (greenSpace tracker) overrides the zone, mirroring SCRPG behavior.
 */
export async function HealthUpdate(actor) {
  const sys = actor.system;
  const current = sys.play?.current;
  const zone = zoneOf(current, sys.derived ?? {});
  const scene = sys.scene ?? 'green';

  let dieName = zone;
  if (scene === 'red') dieName = 'red';
  else if (scene === 'yellow' && zone === 'green') dieName = 'yellow';

  const die = sys.derived?.status?.[ZONE_DIE_FIELD[dieName]] ?? 'd8';
  await actor.update({
    'system.thirdDie': die,
    'system.thirdDieName': dieName
  });
}
