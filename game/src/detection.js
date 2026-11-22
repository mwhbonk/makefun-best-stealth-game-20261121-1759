// Shadowlight Heist — suspicion. One clear job: the meter that decides whether the thief
// is noticed, and the four states a guard moves through.
//   calm        — suspicion low, guard patrols.
//   suspicious  — suspicion past SUSPICIOUS: guard stops, stares at the thief, "?" overhead.
//   alarm       — suspicion past ALARM: guard gives chase, "!".
//   searching   — the thief broke line of sight during a chase: guard walks to the last tile
//                 the thief was seen on, looks around, then suspicion has decayed enough to
//                 stand down and patrol again.
// The meter FILLS while the thief is seen and DECAYS while hidden — that decay is the
// recovery chance: break the cone, reach shadow, and the guard calms down.

import {
  SUSPICION_BASE,
  SUSPICION_LIT_MULT,
  SUSPICION_SNEAK_MULT,
  SUSPICION_SHRUB_MULT,
  SUSPICION_CLOSE_MULT,
  SUSPICION_DECAY,
  SUSPICION_SUSPICIOUS,
  SUSPICION_ALARM,
  SUSPICION_CAUGHT,
} from './config.js';
import { isLit, isShrub } from './levels.js';

export function suspicionRate(level, guard, player) {
  let rate = SUSPICION_BASE;
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2.5) rate *= SUSPICION_CLOSE_MULT;
  const tx = Math.floor(player.x);
  const ty = Math.floor(player.y);
  if (isLit(level, tx, ty)) rate *= SUSPICION_LIT_MULT;
  if (player.sneaking) rate *= SUSPICION_SNEAK_MULT;
  if (isShrub(level, tx, ty)) rate *= SUSPICION_SHRUB_MULT;
  return rate;
}

// Advance one guard's suspicion by dt. Returns the state the guard should be in now.
export function updateSuspicion(level, guard, player, seen, dt) {
  if (seen) {
    guard.suspicion += suspicionRate(level, guard, player) * dt;
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
    guard.lastSeenAt = guard.time;
  } else {
    guard.suspicion -= SUSPICION_DECAY * dt;
  }
  if (guard.suspicion < 0) guard.suspicion = 0;
  if (guard.suspicion > SUSPICION_CAUGHT) guard.suspicion = SUSPICION_CAUGHT;

  if (guard.state === 'alarm' && !seen && guard.suspicion < SUSPICION_SUSPICIOUS) {
    return 'searching';
  }
  if (guard.state === 'searching' && guard.suspicion <= 0) {
    return 'calm';
  }
  if (guard.suspicion >= SUSPICION_ALARM) return 'alarm';
  if (guard.suspicion >= SUSPICION_SUSPICIOUS) return 'suspicious';
  if (guard.state === 'suspicious' && guard.suspicion < SUSPICIOUS_SUSPICIOUS) return 'calm';
  return guard.state;
}

export function stateLabel(state) {
  if (state === 'suspicious') return '?';
  if (state === 'alarm') return '!';
  if (state === 'searching') return '…';
  return '';
}
