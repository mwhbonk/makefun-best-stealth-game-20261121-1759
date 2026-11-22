// Shadowlight Heist — shared tuning and palette. One clear job: every number the game
// balances on lives here, so a tweak never means hunting through the other modules.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = ROWS * TILE; // 720

// Movement speeds in tiles per second.
export const PLAYER_WALK = 3.4;
export const PLAYER_SNEAK = 1.9;
export const GUARD_PATROL = 1.55;
export const GUARD_CHASE = 2.9;
export const GUARD_SEARCH = 1.9;
export const GUARD_INVESTIGATE = 2.1;

// Vision: how far a guard sees, and how wide the cone is.
export const GUARD_SIGHT = 6.4; // tiles
export const GUARD_CONE_HALF = 0.62; // radians either side of facing (~71 degrees total)
export const GUARD_HEAR = 7.0; // tiles: a pebble landing closer than this is heard

// Detection: suspicion 0..100. Rates are points per second while the thief is visible.
export const SUSPICION_BASE = 26;
export const SUSPICION_LIT_MULT = 1.8; // standing in lamplight fills faster
export const SUSPICION_SNEAK_MULT = 0.45; // sneaking fills slower
export const SUSPICION_SHRUB_MULT = 0.25; // hidden in a shrub fills much slower
export const SUSPICION_CLOSE_MULT = 1.6; // within 2.5 tiles the guard is surer
export const SUSPICION_DECAY = 9; // points per second while unseen
export const SUSPICION_SUSPICIOUS = 35; // guard pauses and looks: "?"
export const SUSPICION_ALARM = 70; // guard gives chase: "!"
export const SUSPICION_CAUGHT = 100; // caught

// Guard behaviour timers (seconds).
export const SUSPICIOUS_PAUSE = 1.6; // how long a suspicious guard stares
export const SEARCH_TIME = 4.0; // how long a guard searches the last seen tile
export const INVESTIGATE_TIME = 2.2; // how long a guard stares at a pebble landing
export const CATCH_GRACE = 0.55; // seconds of contact before the catch lands

export const PEBBLES_PER_LEVEL = 3;
export const START_LIVES = 3;
export const PEBBLE_RANGE = 9.0; // tiles: how far a thrown pebble flies

// Palette — a lamplit gallery at night: deep blue stone, warm lamp gold, ember orange.
export const COLORS = {
  floor: '#23232e',
  floorAlt: '#20202a',
  shadowFloor: '#15151d',
  wall: '#3a3a4d',
  wallTop: '#4b4b63',
  crate: '#6b4f2a',
  crateTop: '#8a6a3a',
  shrub: '#1e3d24',
  shrubLeaf: '#2c5a33',
  lampGlow: 'rgba(255, 190, 90, 0.20)',
  lampCore: '#ffd27a',
  ember: '#ff9a3c',
  emberCore: '#ffe1a1',
  exit: '#7fe0c3',
  exitGlow: 'rgba(127, 224, 195, 0.25)',
  thief: '#39c5bb',
  thiefDark: '#1e7a74',
  guard: '#e05a4e',
  guardDark: '#8f2f28',
  coneCalm: 'rgba(255, 214, 110, 0.20)',
  coneSuspicious: 'rgba(255, 170, 60, 0.34)',
  coneAlarm: 'rgba(255, 70, 60, 0.38)',
  hudText: '#e8e2d0',
  hudDim: '#9a94a8',
  titleGold: '#ffd27a',
};
