# Shadowlight Heist

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/mwhbonk/makefun-best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/mwhbonk/makefun-best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A top-down stealth game for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759). You are a thief in a lamplit gallery. Slip through three halls, gather every ember shard, and reach the exit unseen.

## How to play

- **WASD / arrow keys** — move.
- **Hold Shift** — sneak: slower, quieter, harder to spot.
- **Click** — throw a pebble (3 per hall). Guards close enough to hear it walk over to investigate.
- **Goal** — collect every ember shard, then reach the green EXIT door.

## The stealth

- **Guards** patrol waypoint loops with visible golden vision cones. Step into a cone and the suspicion meter fills.
- **Suspicion decays** while you are hidden — break line of sight, reach shadow or a shrub, and the guard calms down. At 35% a guard stops and stares (`?`); at 70% it gives chase (`!`); at 100% you are caught and lose a life. Three lives.
- **Lamps** light the floor around them: standing in lamplight you are spotted almost twice as fast. **Shadow floor** and **shrubs** hide you.
- **Footsteps** (synthesised WebAudio, no sound files) are panned by where the guard stands, so you hear a patrol coming before you see it.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — no build step, no network requests. `main.ts` (Node 22, standard library only) hands the entry in: it copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json`.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are deterministic renders of the game's own code: `?shot=start|play|near|end&seed=1`.
