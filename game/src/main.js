// Shadowlight Heist — boot. One clear job: start the game and run its loop.
// The loop ticks at a fixed 1/60 s so a staged screenshot always plays out the same way.
// A ?shot=start|play|near|end URL parameter stages a deterministic scene for screenshots
// (see shots.js); without it, the game opens on its title screen.

import { VIEW_W, VIEW_H } from './config.js';
import { makeWorld, updateWorld } from './world.js';
import { makeInput, attachInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 1);
const shot = params.get('shot');

const world = makeWorld(seed);
const input = makeInput();
attachInput(input, canvas);

if (shot) {
  const result = stageShot(shot, world);
  render(ctx, world);
  window.__shotResult = result;
} else {
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  function frame(now) {
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    while (acc >= STEP) {
      updateWorld(world, input, STEP);
      acc -= STEP;
    }
    render(ctx, world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
