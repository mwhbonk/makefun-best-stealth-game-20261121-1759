// Shadowlight Heist — walking the halls. One clear job: find a walkable route between two
// tiles and walk it. Guards use it for patrol legs and for investigating a noise; the
// screenshot autopilot uses it too. Breadth-first search on the tile grid, four neighbours.

import { isWalkable } from './levels.js';

export function findPath(level, from, to) {
  const fx = Math.floor(from.x);
  const fy = Math.floor(from.y);
  const tx = Math.floor(to.x);
  const ty = Math.floor(to.y);
  if (fx === tx && fy === ty) return [];
  if (!isWalkable(level, tx, ty)) return null;
  const key = (x, y) => y * 1000 + x;
  const prev = new Map();
  const seen = new Set([key(fx, fy)]);
  const queue = [{ x: fx, y: fy }];
  while (queue.length > 0) {
    const cur = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const k = key(nx, ny);
      if (seen.has(k) || !isWalkable(level, nx, ny)) continue;
      seen.add(k);
      prev.set(k, cur);
      if (nx === tx && ny === ty) {
        const path = [{ x: tx, y: ty }];
        let node = { x: tx, y: ty };
        while (!(node.x === fx && node.y === fy)) {
          node = prev.get(key(node.x, node.y));
          path.unshift({ x: node.x, y: node.y });
        }
        return path.slice(1);
      }
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

// Walk an entity (in tile-float coordinates) along a tile path at `speed` tiles per second.
// Returns true when the path is finished.
export function walkPath(entity, path, speed, dt) {
  if (!path || path.length === 0) return true;
  const target = path[0];
  const cx = target.x + 0.5;
  const cy = target.y + 0.5;
  const dx = cx - entity.x;
  const dy = cy - entity.y;
  const dist = Math.hypot(dx, dy);
  const step = speed * dt;
  if (dist <= step) {
    entity.x = cx;
    entity.y = cy;
    path.shift();
    return path.length === 0;
  }
  entity.x += (dx / dist) * step;
  entity.y += (dy / dist) * step;
  entity.facingX = dx / dist;
  entity.facingY = dy / dist;
  return false;
}
