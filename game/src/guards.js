// Shadowlight Heist — guards. One clear job: one guard's behaviour.
// A guard patrols its waypoint loop, pauses to stare when suspicious, gives chase on alarm,
// searches the last seen tile when the thief slips away, and walks over to investigate a
// pebble that lands close enough to hear. Facing follows movement; while standing still the
// guard keeps its last facing (so a cone still covers the hall it watches).

import {
  GUARD_PATROL,
  GUARD_CHASE,
  GUARD_SEARCH,
  GUARD_INVESTIGATE,
  SUSPICIOUS_PAUSE,
  SEARCH_TIME,
  INVESTIGATE_TIME,
  GUARD_HEAR,
} from './config.js';
import { findPath, walkPath } from './patrol.js';
import { canSee } from './vision.js';
import { updateSuspicion } from './detection.js';

export function makeGuard(level, def) {
  const start = def.waypoints[0];
  return {
    x: start.x + 0.5,
    y: start.y + 0.5,
    facingX: 1,
    facingY: 0,
    waypoints: def.waypoints,
    waypointIndex: 1 % def.waypoints.length,
    path: null,
    state: 'calm',
    suspicion: 0,
    lastSeenX: null,
    lastSeenY: null,
    lastSeenAt: -99,
    stateTime: 0,
    time: 0,
    stepTime: 0,
    stepped: false,
    investigateX: null,
    investigateY: null,
  };
}

function patrolTarget(guard) {
  return guard.waypoints[guard.waypointIndex];
}

function ensurePath(level, guard, tx, ty) {
  if (!guard.path || guard.path.length === 0) {
    guard.path = findPath(level, { x: guard.x, y: guard.y }, { x: tx, y: ty });
  }
}

export function updateGuard(level, guard, player, dt, events) {
  guard.time += dt;
  guard.stateTime += dt;
  const seen = canSee(level, guard, player.x, player.y);
  const next = updateSuspicion(level, guard, player, seen, dt);
  if (next !== guard.state) {
    if (next === 'alarm') events.push({ type: 'alarm', guard });
    if (next === 'suspicious') events.push({ type: 'spotted', guard });
    guard.state = next;
    guard.stateTime = 0;
    guard.path = null;
  }

  let speed = 0;
  if (guard.state === 'calm') {
    const target = patrolTarget(guard);
    ensurePath(level, guard, target.x, target.y);
    if (walkPath(guard, guard.path, GUARD_PATROL, dt)) {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      guard.path = null;
    }
    speed = GUARD_PATROL;
  } else if (guard.state === 'suspicious') {
    guard.facingX = player.x - guard.x;
    guard.facingY = player.y - guard.y;
    const len = Math.hypot(guard.facingX, guard.facingY) || 1;
    guard.facingX /= len;
    guard.facingY /= len;
    if (guard.stateTime > SUSPICIOUS_PAUSE && !seen) {
      guard.state = 'calm';
      guard.stateTime = 0;
    }
  } else if (guard.state === 'alarm') {
    if (guard.lastSeenX !== null) {
      ensurePath(level, guard, Math.floor(guard.lastSeenX), Math.floor(guard.lastSeenY));
      walkPath(guard, guard.path, GUARD_CHASE, dt);
    }
    speed = GUARD_CHASE;
  } else if (guard.state === 'searching') {
    if (guard.lastSeenX !== null) {
      ensurePath(level, guard, Math.floor(guard.lastSeenX), Math.floor(guard.lastSeenY));
      const done = walkPath(guard, guard.path, GUARD_SEARCH, dt);
      if (done && guard.stateTime > SEARCH_TIME) {
        guard.state = 'calm';
        guard.stateTime = 0;
        guard.path = null;
      }
    }
    speed = GUARD_SEARCH;
  } else if (guard.state === 'investigating') {
    ensurePath(level, guard, guard.investigateX, guard.investigateY);
    const done = walkPath(guard, guard.path, GUARD_INVESTIGATE, dt);
    if (done) {
      if (guard.stateTime > INVESTIGATE_TIME) {
        guard.state = 'calm';
        guard.stateTime = 0;
        guard.path = null;
      }
    } else {
      guard.stateTime = 0;
    }
    speed = GUARD_INVESTIGATE;
  }

  // Footstep timing for the audio layer: a step every stride while moving.
  if (speed > 0) {
    guard.stepTime += dt * speed;
    if (guard.stepTime > 1.6) {
      guard.stepTime = 0;
      guard.stepped = true;
    }
  }
}

// A pebble lands: every guard close enough to hear it turns to investigate.
export function guardsHearPebble(level, guards, tx, ty) {
  for (const guard of guards) {
    const dx = tx + 0.5 - guard.x;
    const dy = ty + 0.5 - guard.y;
    if (Math.hypot(dx, dy) <= GUARD_HEAR && guard.state !== 'alarm') {
      guard.state = 'investigating';
      guard.stateTime = 0;
      guard.investigateX = tx;
      guard.investigateY = ty;
      guard.path = null;
    }
  }
}

export function resetGuard(guard, level) {
  const start = guard.waypoints[0];
  guard.x = start.x + 0.5;
  guard.y = start.y + 0.5;
  guard.facingX = 1;
  guard.facingY = 0;
  guard.waypointIndex = 1 % guard.waypoints.length;
  guard.path = null;
  guard.state = 'calm';
  guard.suspicion = 0;
  guard.lastSeenX = null;
  guard.lastSeenY = null;
  guard.stateTime = 0;
}
