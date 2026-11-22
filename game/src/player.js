// Shadowlight Heist — the thief. One clear job: the player.
// Walks with WASD or arrows, sneaks while Shift is held (slower, quieter, harder to spot),
// throws pebbles with a mouse click (three per hall) to lure guards away, gathers ember
// shards by walking over them, and reaches the exit once every shard is taken. Movement
// collides with walls and crates on a circle, so the thief slides along cover instead of
// sticking to it.

import {
  PLAYER_WALK,
  PLAYER_SNEAK,
  PEBBLE_RANGE,
  PEBBLES_PER_LEVEL,
  CATCH_GRACE,
} from './config.js';
import { isWalkable } from './levels.js';
import { guardsHearPebble } from './guards.js';

export function makePlayer(level) {
  return {
    x: level.start.x + 0.5,
    y: level.start.y + 0.5,
    facingX: 1,
    facingY: 0,
    sneaking: false,
    moving: false,
    pebbles: PEBBLES_PER_LEVEL,
    catchTimer: 0,
    stepTime: 0,
    stepped: false,
  };
}

function collides(level, x, y) {
  const r = 0.3;
  const tiles = [
    [Math.floor(x - r), Math.floor(y - r)],
    [Math.floor(x + r), Math.floor(y - r)],
    [Math.floor(x - r), Math.floor(y + r)],
    [Math.floor(x + r), Math.floor(y + r)],
  ];
  for (const [tx, ty] of tiles) {
    if (!isWalkable(level, tx, ty)) return true;
  }
  return false;
}

export function updatePlayer(level, player, guards, input, dt, events) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  const len = Math.hypot(mx, my);
  player.moving = len > 0;
  player.sneaking = !!input.sneak && len > 0;
  if (len > 0) {
    mx /= len;
    my /= len;
    const speed = player.sneaking ? PLAYER_SNEAK : PLAYER_WALK;
    const nx = player.x + mx * speed * dt;
    const ny = player.y + my * speed * dt;
    if (!collides(level, nx, player.y)) player.x = nx;
    if (!collides(level, player.x, ny)) player.y = ny;
    player.facingX = mx;
    player.facingY = my;
    player.stepTime += dt * speed;
    if (player.stepTime > 1.9) {
      player.stepTime = 0;
      player.stepped = true;
    }
  }

  if (input.click) {
    const tx = Math.floor(input.clickX);
    const ty = Math.floor(input.clickY);
    const dx = tx + 0.5 - player.x;
    const dy = ty + 0.5 - player.y;
    if (player.pebbles > 0 && Math.hypot(dx, dy) <= PEBBLE_RANGE && isWalkable(level, tx, ty)) {
      player.pebbles -= 1;
      events.push({ type: 'pebble', x: tx, y: ty });
      guardsHearPebble(level, guards, tx, ty);
    }
    input.click = null;
  }

  // Ember shards: walk over one to take it.
  for (const shard of level.shards) {
    if (!shard.taken && Math.floor(player.x) === shard.x && Math.floor(player.y) === shard.y) {
      shard.taken = true;
      events.push({ type: 'shard', shard });
    }
  }

  // Caught: a guard on alarm touching the thief.
  let touched = false;
  for (const guard of guards) {
    if (guard.state === 'alarm' && Math.hypot(guard.x - player.x, guard.y - player.y) < 0.62) {
      touched = true;
    }
  }
  if (touched) {
    player.catchTimer += dt;
    if (player.catchTimer >= CATCH_GRACE) {
      player.catchTimer = 0;
      events.push({ type: 'caught' });
    }
  } else {
    player.catchTimer = 0;
  }
}

export function resetPlayer(level, player) {
  player.x = level.start.x + 0.5;
  player.y = level.start.y + 0.5;
  player.facingX = 1;
  player.facingY = 0;
  player.pebbles = PEBBLES_PER_LEVEL;
  player.catchTimer = 0;
}
