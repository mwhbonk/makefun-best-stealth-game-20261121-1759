// Shadowlight Heist — input. One clear job: keyboard and mouse into a plain object.
// WASD or arrows move, Shift sneaks, Enter confirms, a mouse click throws a pebble at the
// clicked tile (the canvas is 1280x720, one tile is 40 px, so the tile is the click divided
// by 40). The object is plain data, so the screenshot staging can drive the game with the
// same shape without a keyboard.

import { TILE } from './config.js';

export function makeInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    enter: false,
    anyKey: false,
    click: null,
    clickX: 0,
    clickY: 0,
  };
}

export function attachInput(input, canvas) {
  const keys = {};
  const update = () => {
    input.up = !!(keys['KeyW'] || keys['ArrowUp']);
    input.down = !!(keys['KeyS'] || keys['ArrowDown']);
    input.left = !!(keys['KeyA'] || keys['ArrowLeft']);
    input.right = !!(keys['KeyD'] || keys['ArrowRight']);
    input.sneak = !!keys['ShiftLeft'] || !!keys['ShiftRight'];
  };
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    keys[e.code] = true;
    input.anyKey = true;
    if (e.code === 'Enter') input.enter = true;
    update();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    update();
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    input.clickX = x / TILE;
    input.clickY = y / TILE;
    input.click = true;
    input.anyKey = true;
  });
}
