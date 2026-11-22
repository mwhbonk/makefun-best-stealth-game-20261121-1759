// Shadowlight Heist — the world. One clear job: the game's state and its rules.
// Screens: title → play → (clear → next hall) → win, with caught (lose a life, respawn)
// and gameover (out of lives) on the way. A hall is cleared when every ember is taken and
// the thief stands on the exit. The world owns no DOM and no canvas: main.js draws it, and
// the screenshot staging drives it with the same update step the player gets.

import { LEVELS } from './levels.js';
import { makeGuard, updateGuard, resetGuard } from './guards.js';
import { makePlayer, updatePlayer, resetPlayer } from './player.js';
import {
  makeAudio,
  ensureAudio,
  playStep,
  playShard,
  playAlarm,
  playPebble,
  playClear,
  playCaught,
} from './audio.js';
import { START_LIVES } from './config.js';

function cloneLevel(level) {
  const copy = JSON.parse(JSON.stringify(level));
  for (const shard of copy.shards) shard.taken = false;
  return copy;
}

export function makeWorld(seed) {
  const world = {
    seed: seed || 1,
    screen: 'title',
    levelIndex: 0,
    level: cloneLevel(LEVELS[0]),
    guards: [],
    player: null,
    lives: START_LIVES,
    time: 0,
    pebbles: [],
    audio: makeAudio(),
    clearText: '',
    caughtText: '',
    winText: '',
    screenTimer: 0,
    shardsTaken: 0,
    shardsTotal: LEVELS[0].shards.length,
  };
  world.guards = world.level.guards.map((g) => makeGuard(world.level, g));
  world.player = makePlayer(world.level);
  return world;
}

export function loadLevel(world, index) {
  world.levelIndex = index;
  world.level = cloneLevel(LEVELS[index]);
  world.guards = world.level.guards.map((g) => makeGuard(world.level, g));
  world.player = makePlayer(world.level);
  world.pebbles = [];
  world.shardsTaken = 0;
  world.shardsTotal = world.level.shards.length;
}

export function startGame(world) {
  world.lives = START_LIVES;
  loadLevel(world, 0);
  world.screen = 'play';
  world.screenTimer = 0;
}

function respawn(world) {
  resetPlayer(world.level, world.player);
  for (const guard of world.guards) resetGuard(guard, world.level);
  world.pebbles = [];
}

function handleEvents(world, events) {
  for (const ev of events) {
    if (ev.type === 'shard') {
      world.shardsTaken += 1;
      playShard(world.audio);
    } else if (ev.type === 'alarm') {
      playAlarm(world.audio);
    } else if (ev.type === 'pebble') {
      world.pebbles.push({ x: ev.x, y: ev.y, age: 0 });
      const pan = Math.max(-1, Math.min(1, (ev.x + 0.5 - world.player.x) / 8));
      playPebble(world.audio, pan);
    } else if (ev.type === 'caught') {
      world.lives -= 1;
      playCaught(world.audio);
      if (world.lives <= 0) {
        world.screen = 'gameover';
        world.screenTimer = 0;
      } else {
        world.screen = 'caught';
        world.screenTimer = 0;
        world.caughtText = `${world.lives} ${world.lives === 1 ? 'life' : 'lives'} left — the hall resets.`;
        respawn(world);
      }
    }
  }
}

export function updateWorld(world, input, dt) {
  world.time += dt;
  if (input && input.anyKey) ensureAudio(world.audio);

  if (world.screen === 'title') {
    if (input && input.enter) {
      input.enter = false;
      startGame(world);
    }
    return;
  }

  if (world.screen === 'win' || world.screen === 'gameover') {
    if (input && input.enter) {
      input.enter = false;
      world.screen = 'title';
      loadLevel(world, 0);
      world.lives = START_LIVES;
    }
    return;
  }

  if (world.screen === 'caught') {
    world.screenTimer += dt;
    if (world.screenTimer > 1.6) {
      world.screen = 'play';
      world.screenTimer = 0;
    }
    return;
  }

  if (world.screen === 'clear') {
    world.screenTimer += dt;
    if (world.screenTimer > 2.2) {
      world.screenTimer = 0;
      if (world.levelIndex + 1 < LEVELS.length) {
        loadLevel(world, world.levelIndex + 1);
        world.screen = 'play';
      } else {
        world.screen = 'win';
        world.winText = 'Every ember, every hall — and no guard ever knew your name.';
        playClear(world.audio);
      }
    }
    return;
  }

  // screen === 'play'
  const events = [];
  updatePlayer(world.level, world.player, world.guards, input, dt, events);
  for (const guard of world.guards) {
    updateGuard(world.level, guard, world.player, dt, events);
    if (guard.stepped) {
      guard.stepped = false;
      const pan = Math.max(-1, Math.min(1, (guard.x - world.player.x) / 8));
      const dist = Math.hypot(guard.x - world.player.x, guard.y - world.player.y);
      playStep(world.audio, pan, dist, guard.state === 'alarm');
    }
  }
  if (world.player.stepped) {
    world.player.stepped = false;
    playStep(world.audio, 0, 0.5, false);
  }
  for (const pebble of world.pebbles) pebble.age += dt * 0.8;
  world.pebbles = world.pebbles.filter((p) => p.age < 1.2);
  handleEvents(world, events);

  // Exit: every ember taken and the thief on the exit tile.
  if (
    world.shardsTaken >= world.shardsTotal &&
    Math.floor(world.player.x) === world.level.exit.x &&
    Math.floor(world.player.y) === world.level.exit.y
  ) {
    world.screen = 'clear';
    world.screenTimer = 0;
    const next = world.levelIndex + 1 < LEVELS.length ? LEVELS[world.levelIndex + 1].name : 'the getaway';
    world.clearText =
      world.levelIndex + 1 < LEVELS.length
        ? `All embers taken — on to ${next}.`
        : 'All embers taken — time to disappear.';
    playClear(world.audio);
  }
}
