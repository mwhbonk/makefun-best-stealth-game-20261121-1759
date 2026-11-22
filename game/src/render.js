// Shadowlight Heist — rendering. One clear job: paint everything on the canvas.
// Top-down view, one tile = 40 px, 1280x720. The floor is dark stone; lamps throw warm
// pools of light; vision cones are translucent wedges that change colour with the guard's
// state; cover (crates, shrubs) and the thief read at a glance against the floor.

import { TILE, COLS, ROWS, COLORS } from './config.js';
import { tileAt, isLit } from './levels.js';
import { stateLabel } from './detection.js';

function conePath(ctx, guard, range, halfAngle) {
  const px = guard.x * TILE;
  const py = guard.y * TILE;
  const facing = Math.atan2(guard.facingY, guard.facingX);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, range * TILE, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, level, guard) {
  const range = 6.4;
  const half = 0.62;
  let fill = COLORS.coneCalm;
  if (guard.state === 'alarm') fill = COLORS.coneAlarm;
  else if (guard.state === 'suspicious') fill = COLORS.coneSuspicious;
  else if (guard.state === 'searching' || guard.state === 'investigating') fill = COLORS.coneSuspicious;
  ctx.fillStyle = fill;
  conePath(ctx, guard, range, half);
  ctx.fill();
}

function drawGuard(ctx, guard) {
  const px = guard.x * TILE;
  const py = guard.y * TILE;
  ctx.fillStyle = COLORS.guardDark;
  ctx.beginPath();
  ctx.arc(px, py, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(px, py, 11, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick: which way the guard looks.
  ctx.strokeStyle = '#ffd9d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + guard.facingX * 16, py + guard.facingY * 16);
  ctx.stroke();
  // Helmet crest.
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath();
  ctx.arc(px - guard.facingY * 4, py + guard.facingX * 4, 3, 0, Math.PI * 2);
  ctx.fill();
  const label = stateLabel(guard.state);
  if (label) {
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = guard.state === 'alarm' ? '#ff6b5e' : '#ffc46b';
    ctx.fillText(label, px, py - 22);
  }
}

function drawThief(ctx, player, time) {
  const px = player.x * TILE;
  const py = player.y * TILE;
  const bob = player.moving ? Math.sin(time * 14) * 1.5 : 0;
  ctx.fillStyle = COLORS.thiefDark;
  ctx.beginPath();
  ctx.arc(px, py + bob, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(px, py + bob, 10, 0, Math.PI * 2);
  ctx.fill();
  // Hood point: which way the thief faces.
  ctx.fillStyle = COLORS.thiefDark;
  ctx.beginPath();
  ctx.moveTo(px + player.facingX * 10, py + player.facingY * 10 + bob);
  ctx.lineTo(px - player.facingY * 6, py + player.facingX * 6 + bob);
  ctx.lineTo(px + player.facingY * 6, py - player.facingX * 6 + bob);
  ctx.closePath();
  ctx.fill();
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(57, 197, 187, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py + bob, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawShard(ctx, shard, time) {
  const px = (shard.x + 0.5) * TILE;
  const py = (shard.y + 0.5) * TILE;
  const pulse = 0.75 + Math.sin(time * 3 + shard.x) * 0.25;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.emberCore;
  ctx.beginPath();
  ctx.arc(px, py, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ember;
  ctx.beginPath();
  ctx.moveTo(px, py - 12);
  ctx.lineTo(px + 6, py);
  ctx.lineTo(px, py + 12);
  ctx.lineTo(px - 6, py);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function render(ctx, world) {
  const level = world.level;
  const time = world.time;
  ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);

  // Floor.
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = tileAt(level, x, y);
      if (ch === '#') continue;
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      if (ch === ',') ctx.fillStyle = COLORS.shadowFloor;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  // Lamp glow pools (under everything else).
  for (const lamp of level.lamps) {
    const px = (lamp.x + 0.5) * TILE;
    const py = (lamp.y + 0.5) * TILE;
    const grad = ctx.createRadialGradient(px, py, 8, px, py, 110);
    grad.addColorStop(0, COLORS.lampGlow);
    grad.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px - 110, py - 110, 220, 220);
  }

  // Exit glow.
  const ex = (level.exit.x + 0.5) * TILE;
  const ey = (level.exit.y + 0.5) * TILE;
  const egrad = ctx.createRadialGradient(ex, ey, 8, ex, ey, 90);
  egrad.addColorStop(0, COLORS.exitGlow);
  egrad.addColorStop(1, 'rgba(127, 224, 195, 0)');
  ctx.fillStyle = egrad;
  ctx.fillRect(ex - 90, ey - 90, 180, 180);

  // Walls, crates, shrubs, lamps.
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = tileAt(level, x, y);
      const px = x * TILE;
      const py = y * TILE;
      if (ch === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px, py, TILE, 6);
      } else if (ch === 'C') {
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = COLORS.crateTop;
        ctx.fillRect(px + 4, py + 4, TILE - 8, 6);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
      } else if (ch === '~') {
        ctx.fillStyle = COLORS.shrub;
        ctx.beginPath();
        ctx.arc(px + 12, py + 14, 10, 0, Math.PI * 2);
        ctx.arc(px + 26, py + 12, 11, 0, Math.PI * 2);
        ctx.arc(px + 20, py + 26, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.shrubLeaf;
        ctx.beginPath();
        ctx.arc(px + 14, py + 12, 5, 0, Math.PI * 2);
        ctx.arc(px + 26, py + 24, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (ch === 'L') {
        ctx.fillStyle = '#2a2a35';
        ctx.fillRect(px + TILE / 2 - 2, py + 10, 4, 22);
        ctx.fillStyle = COLORS.lampCore;
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + 10, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Exit door.
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(ex - 12, ey - 14, 24, 28);
  ctx.fillStyle = '#0e2a22';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', ex, ey + 5);

  // Ember shards.
  for (const shard of level.shards) {
    if (!shard.taken) drawShard(ctx, shard, time);
  }

  // Pebbles and their ripples.
  for (const pebble of world.pebbles) {
    const px = (pebble.x + 0.5) * TILE;
    const py = (pebble.y + 0.5) * TILE;
    ctx.strokeStyle = `rgba(232, 226, 208, ${Math.max(0, 1 - pebble.age)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 6 + pebble.age * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#c9c2ae';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vision cones, then guards, then the thief.
  for (const guard of world.guards) drawCone(ctx, level, guard);
  for (const guard of world.guards) drawGuard(ctx, guard);
  if (world.screen === 'play' || world.screen === 'clear' || world.screen === 'caught') {
    drawThief(ctx, world.player, time);
  }

  drawHud(ctx, world);
  if (world.screen === 'title') drawTitle(ctx, world);
  if (world.screen === 'clear') drawBanner(ctx, 'HALL CLEARED', world.clearText, COLORS.exit);
  if (world.screen === 'caught') drawBanner(ctx, 'CAUGHT!', world.caughtText, '#ff6b5e');
  if (world.screen === 'win') drawBanner(ctx, 'CLEAN GETAWAY', world.winText, COLORS.titleGold);
  if (world.screen === 'gameover') drawBanner(ctx, 'THE GALLERY WINS', 'Out of lives — the heist ends here.', '#ff6b5e');
}

function drawHud(ctx, world) {
  const level = world.level;
  ctx.fillStyle = 'rgba(10, 10, 16, 0.72)';
  ctx.fillRect(0, 0, COLS * TILE, 34);
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText(level.name, 12, 22);
  const taken = level.shards.filter((s) => s.taken).length;
  ctx.fillText(`Embers ${taken}/${level.shards.length}`, 330, 22);
  ctx.fillText(`Lives ${'♥'.repeat(world.lives)}${'♡'.repeat(Math.max(0, 3 - world.lives))}`, 480, 22);
  ctx.fillText(`Pebbles ${world.player.pebbles}`, 600, 22);
  ctx.fillText(`Hall ${world.levelIndex + 1}/3`, 720, 22);
  // Suspicion: the highest guard suspicion, as "Seen: NN%".
  let worst = 0;
  for (const g of world.guards) worst = Math.max(worst, g.suspicion);
  const pct = Math.round(worst);
  ctx.fillStyle = pct >= 70 ? '#ff6b5e' : pct >= 35 ? '#ffc46b' : COLORS.hudDim;
  ctx.fillText(`Seen: ${pct}%`, 830, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(920, 10, 180, 14);
  ctx.fillStyle = pct >= 70 ? '#ff6b5e' : pct >= 35 ? '#ffc46b' : '#39c5bb';
  ctx.fillRect(920, 10, Math.round(180 * (worst / 100)), 14);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(8, 8, 14, 0.78)';
  ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.titleGold;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('SHADOWLIGHT HEIST', COLS * TILE / 2, 250);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '22px Georgia, serif';
  ctx.fillText('Three halls. Every ember. Unseen.', COLS * TILE / 2, 300);
  ctx.font = '17px sans-serif';
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText('WASD or arrows to move · Hold Shift to sneak · Click to throw a pebble', COLS * TILE / 2, 350);
  ctx.fillText('Stay out of the golden cones. Lamps see you faster; shadow and shrubs hide you.', COLS * TILE / 2, 378);
  ctx.fillText('Fill the suspicion meter and the guards give chase. Break line of sight to cool down.', COLS * TILE / 2, 406);
  ctx.fillStyle = COLORS.titleGold;
  ctx.font = 'bold 20px sans-serif';
  const blink = Math.sin(world.time * 3) > 0 ? 1 : 0.35;
  ctx.globalAlpha = blink;
  ctx.fillText('Press ENTER to begin the heist', COLS * TILE / 2, 470);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawBanner(ctx, title, sub, color) {
  ctx.fillStyle = 'rgba(8, 8, 14, 0.72)';
  ctx.fillRect(0, ROWS * TILE / 2 - 90, COLS * TILE, 180);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(title, COLS * TILE / 2, ROWS * TILE / 2 - 10);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '20px sans-serif';
  ctx.fillText(sub, COLS * TILE / 2, ROWS * TILE / 2 + 38);
  ctx.textAlign = 'left';
}
