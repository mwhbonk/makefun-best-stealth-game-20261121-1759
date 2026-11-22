// Shadowlight Heist — the three halls. One clear job: the maps, and only the maps.
// Legend: '#' wall, '.' floor, ',' shadow floor (dark, hides the thief), '~' shrub (hides the
// thief while standing in it), 'C' crate (cover, blocks movement and sight), 'L' lamp (lit floor
// around it: the thief is spotted faster there), 'S' thief start, 'E' exit, '*' ember shard.
// Guard waypoints are tile coordinates; guards walk between them with BFS pathfinding, so a leg
// only needs its endpoints on walkable floor and the hall connected.

const L1_MAP = [
  '################################',
  '#S............................*#',
  '#..............................#',
  '#....CC...........L............#',
  '#..............................#',
  '#..........*...................#',
  '#....C.........................#',
  '#.................CC...........#',
  '#..............................#',
  '#..L..........C..........*.....#',
  '#..............................#',
  '#.......CC.....................#',
  '#..............................#',
  '#............*.........C.......#',
  '#..............................#',
  '#..~~...................~~.....#',
  '#...........................E..#',
  '################################',
];

const L2_MAP = [
  '################################',
  '#S..........................*..#',
  '#......C...............C.......#',
  '#..............................#',
  '#...*.......L......C.......*...#',
  '#..............................#',
  '#.........CC........CC.........#',
  '#..............................#',
  '#..C............*............C.#',
  '#..............................#',
  '#......L...........C...........#',
  '#..............................#',
  '#...*..........................#',
  '#.........C........C...........#',
  '#..............................#',
  '#..~~..........L..........~~...#',
  '#..........................E...#',
  '################################',
];

const L3_MAP = [
  '################################',
  '#S....C..................*.....#',
  '#..............................#',
  '#..*......C..........L.........#',
  '#..............................#',
  '#.......CC......*......CC......#',
  '#..............................#',
  '#..C..........L...........C....#',
  '#..............................#',
  '#.....*...........C........*...#',
  '#..............................#',
  '#..CC..........*.........CC....#',
  '#..............................#',
  '#.......L..........C...........#',
  '#..............................#',
  '#..~~.......C..........~~......#',
  '#..........................E...#',
  '################################',
];

export const WALKABLE = new Set(['.', ',', '~', 'L', 'S', 'E', '*']);
export const BLOCKS_SIGHT = new Set(['#', 'C']);

function parseLevel(def) {
  const map = def.map;
  const shards = [];
  const lamps = [];
  let start = null;
  let exit = null;
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const ch = map[y][x];
      if (ch === 'S') start = { x, y };
      else if (ch === 'E') exit = { x, y };
      else if (ch === '*') shards.push({ x, y, taken: false });
      else if (ch === 'L') lamps.push({ x, y });
    }
  }
  return {
    name: def.name,
    sub: def.sub,
    map,
    shards,
    lamps,
    start,
    exit,
    guards: def.guards.map((g) => ({ waypoints: g.waypoints.map(([x, y]) => ({ x, y })), offset: g.offset })),
  };
}

export const LEVELS = [
  parseLevel({
    name: 'Hall I — The Vestibule',
    sub: 'Four embers. Two guards. Learn the patrols.',
    map: L1_MAP,
    guards: [
      { waypoints: [[4, 2], [26, 2], [26, 6], [4, 6]], offset: 0 },
      { waypoints: [[8, 12], [24, 12], [24, 14], [8, 14]], offset: 0.5 },
    ],
  }),
  parseLevel({
    name: 'Hall II — The Gallery',
    sub: 'Five embers. Three guards. The lamps watch the middle.',
    map: L2_MAP,
    guards: [
      { waypoints: [[4, 2], [27, 2], [27, 5], [4, 5]], offset: 0 },
      { waypoints: [[9, 10], [22, 10], [22, 14], [9, 14]], offset: 0.33 },
      { waypoints: [[5, 15], [14, 15], [14, 16], [5, 16]], offset: 0.66 },
    ],
  }),
  parseLevel({
    name: 'Hall III — The Vault',
    sub: 'Six embers. Four guards. No room for a mistake.',
    map: L3_MAP,
    guards: [
      { waypoints: [[4, 2], [16, 2], [16, 4], [4, 4]], offset: 0 },
      { waypoints: [[20, 6], [28, 6], [28, 8], [20, 8]], offset: 0.25 },
      { waypoints: [[6, 12], [14, 12], [14, 14], [6, 14]], offset: 0.5 },
      { waypoints: [[20, 13], [27, 13], [27, 15], [20, 15]], offset: 0.75 },
    ],
  }),
];

export function tileAt(level, x, y) {
  if (y < 0 || y >= level.map.length) return '#';
  if (x < 0 || x >= level.map[y].length) return '#';
  return level.map[y][x];
}

export function isWalkable(level, x, y) {
  return WALKABLE.has(tileAt(level, x, y));
}

export function isShrub(level, x, y) {
  return tileAt(level, x, y) === '~';
}

export function isShadow(level, x, y) {
  return tileAt(level, x, y) === ',';
}

export function isLit(level, x, y) {
  for (const lamp of level.lamps) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy <= 6.25) return true;
  }
  return false;
}
