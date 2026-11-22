// Shadowlight Heist — seeing. One clear job: decide whether a guard can see a tile.
// A guard sees the thief when the thief is inside the vision cone (range + angle) and the
// line of sight is not cut by a wall or a crate. Shrubs and shadow do not block sight — they
// slow suspicion instead (see detection.js).

import { GUARD_SIGHT, GUARD_CONE_HALF } from './config.js';
import { BLOCKS_SIGHT, tileAt } from './levels.js';

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

export function inCone(guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_SIGHT) return false;
  if (dist < 0.4) return true; // nose to nose: always seen
  const facing = Math.atan2(guard.facingY, guard.facingX);
  return angleDiff(angleTo(guard.x, guard.y, px, py), facing) <= GUARD_CONE_HALF;
}

export function hasLineOfSight(level, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist * 4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor(ax + dx * t);
    const ty = Math.floor(ay + dy * t);
    if (BLOCKS_SIGHT.has(tileAt(level, tx, ty))) return false;
  }
  return true;
}

export function canSee(level, guard, px, py) {
  return inCone(guard, px, py) && hasLineOfSight(level, guard.x, guard.y, px, py);
}

// For the autopilot: is this tile inside any guard's cone right now?
export function tileConed(level, guards, tx, ty) {
  const cx = tx + 0.5;
  const cy = ty + 0.5;
  for (const g of guards) {
    if (canSee(level, g, cx, cy)) return true;
  }
  return false;
}
