// Shadowlight Heist — screenshot staging. One clear job: drive the game, with no human,
// into the four scenes the screenshots show, deterministically from a seed.
//   start — the title screen over Hall I.
//   play  — twelve seconds of careful play: the thief sneaks to the nearest ember along
//           routes the cones do not watch, and holds one ember of four.
//   near  — a careless run straight at an ember: a guard spots the thief, suspicion climbs
//           past half, and the thief ducks behind cover while the guard stares, "?".
//   end   — the whole of Hall I played well: every ember, then the exit, "HALL CLEARED".
// The autopilot plans with Dijkstra over tiles, charging a high cost for tiles inside a
// guard's cone and a smaller one for lamplight, and replans often; on alarm it flees to the
// safest tile it can reach until the guards calm down. Everything runs through the same
// updateWorld step the player gets, at a fixed 1/60 s.

import { startGame, updateWorld, loadLevel } from './world.js';
import { findPath } from './patrol.js';
import { tileConed } from './vision.js';
import { isLit, isWalkable } from './levels.js';
import { makeInput } from './input.js';

const STEP = 1 / 60;
const PLAY_SECONDS = 8;

function dijkstraCost(level, guards, from, to, avoidCones) {
  const fx = Math.floor(from.x);
  const fy = Math.floor(from.y);
  const tx = Math.floor(to.x);
  const ty = Math.floor(to.y);
  if (fx === tx && fy === ty) return [];
  if (!isWalkable(level, tx, ty)) return null;
  const key = (x, y) => y * 1000 + x;
  const cost = new Map([[key(fx, fy), 0]]);
  const prev = new Map();
  const open = [{ x: fx, y: fy, c: 0 }];
  const closed = new Set();
  const tileCost = (x, y) => {
    let c = 1;
    if (avoidCones && tileConed(level, guards, x, y)) c += 9;
    if (isLit(level, x, y)) c += 2;
    return c;
  };
  while (open.length > 0) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (open[i].c < open[best].c) best = i;
    const cur = open.splice(best, 1)[0];
    const ck = key(cur.x, cur.y);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.x === tx && cur.y === ty) {
      const path = [{ x: tx, y: ty }];
      let node = { x: tx, y: ty };
      while (!(node.x === fx && node.y === fy)) {
        node = prev.get(key(node.x, node.y));
        path.unshift({ x: node.x, y: node.y });
      }
      return path.slice(1);
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (!isWalkable(level, nx, ny)) continue;
      const nk = key(nx, ny);
      const nc = cost.get(ck) + tileCost(nx, ny);
      if (nc < (cost.get(nk) ?? Infinity)) {
        cost.set(nk, nc);
        prev.set(nk, { x: cur.x, y: cur.y });
        open.push({ x: nx, y: ny, c: nc });
      }
    }
  }
  return null;
}

function safestTile(level, guards, player) {
  let best = null;
  let bestScore = -Infinity;
  for (let y = 1; y < level.map.length - 1; y++) {
    for (let x = 1; x < level.map[y].length - 1; x++) {
      if (!isWalkable(level, x, y)) continue;
      let minGuard = Infinity;
      for (const g of guards) {
        minGuard = Math.min(minGuard, Math.hypot(g.x - (x + 0.5), g.y - (y + 0.5)));
      }
      let score = minGuard * 2;
      if (!tileConed(level, guards, x, y)) score += 10;
      if (!isLit(level, x, y)) score += 2;
      const dPlayer = Math.hypot(player.x - (x + 0.5), player.y - (y + 0.5));
      score -= dPlayer * 0.1;
      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
  }
  return best;
}

function drive(world, input, target, avoidCones, sneak) {
  // One autopilot step: steer the input toward the next tile of the planned route.
  const player = world.player;
  const path = dijkstraCost(world.level, world.guards, player, target, avoidCones);
  input.up = input.down = input.left = input.right = false;
  input.sneak = sneak;
  if (!path || path.length === 0) return false;
  const next = path[0];
  const cx = next.x + 0.5;
  const cy = next.y + 0.5;
  const dx = cx - player.x;
  const dy = cy - player.y;
  if (dx > 0.08) input.right = true;
  if (dx < -0.08) input.left = true;
  if (dy > 0.08) input.down = true;
  if (dy < -0.08) input.up = true;
  return true;
}

function nearestShard(world) {
  let best = null;
  let bestDist = Infinity;
  for (const shard of world.level.shards) {
    if (shard.taken) continue;
    const d = Math.hypot(shard.x + 0.5 - world.player.x, shard.y + 0.5 - world.player.y);
    if (d < bestDist) {
      bestDist = d;
      best = shard;
    }
  }
  return best;
}

function maxSuspicion(world) {
  let worst = 0;
  for (const g of world.guards) worst = Math.max(worst, g.suspicion);
  return worst;
}

function anyAlarm(world) {
  return world.guards.some((g) => g.state === 'alarm');
}

function runSteps(world, input, steps) {
  for (let i = 0; i < steps; i++) {
    updateWorld(world, input, STEP);
    if (world.screen !== 'play') break;
  }
}

export function stageShot(name, world) {
  const input = makeInput();
  if (name === 'start') {
    loadLevel(world, 0);
    world.screen = 'title';
    world.time = 2;
    return { shot: 'start', screen: world.screen, shards: 0, lives: world.lives };
  }

  startGame(world);
  input.enter = false;

  if (name === 'play') {
    let steps = 0;
    const total = PLAY_SECONDS * 60;
    while (steps < total && world.screen === 'play') {
      const target = nearestShard(world);
      if (!target) break;
      drive(world, input, target, true, true);
      runSteps(world, input, 1);
      steps++;
    }
    return {
      shot: 'play',
      screen: world.screen,
      shards: world.shardsTaken,
      lives: world.lives,
      suspicion: Math.round(maxSuspicion(world)),
    };
  }

  if (name === 'near') {
    let steps = 0;
    let seen = false;
    while (steps < 60 * 40 && world.screen === 'play') {
      const target = nearestShard(world);
      if (!target) break;
      if (!seen) {
        drive(world, input, target, false, false);
      } else {
        // Spotted: duck behind cover — nearest tile no cone watches.
        const safe = safestTile(world.level, world.guards, world.player);
        drive(world, input, safe, false, true);
      }
      runSteps(world, input, 1);
      steps++;
      if (maxSuspicion(world) >= 50) seen = true;
      if (seen && maxSuspicion(world) >= 50 && steps > 60) {
        // Hold the moment: guard staring, thief half-seen behind cover.
        runSteps(world, input, 20);
        break;
      }
    }
    return {
      shot: 'near',
      screen: world.screen,
      shards: world.shardsTaken,
      lives: world.lives,
      suspicion: Math.round(maxSuspicion(world)),
    };
  }

  if (name === 'end') {
    let steps = 0;
    while (steps < 60 * 240 && world.screen === 'play') {
      if (anyAlarm(world)) {
        const safe = safestTile(world.level, world.guards, world.player);
        drive(world, input, safe, true, true);
      } else if (world.shardsTaken >= world.shardsTotal) {
        drive(world, input, world.level.exit, true, true);
      } else {
        const target = nearestShard(world);
        if (!target) break;
        drive(world, input, target, true, true);
      }
      runSteps(world, input, 1);
      steps++;
      // Let a clear screen settle for a few frames so the banner reads.
      if (world.screen === 'clear') {
        runSteps(world, input, 30);
        break;
      }
    }
    return {
      shot: 'end',
      screen: world.screen,
      shards: world.shardsTaken,
      lives: world.lives,
      suspicion: Math.round(maxSuspicion(world)),
    };
  }

  return { shot: name, screen: world.screen, shards: 0, lives: world.lives };
}
