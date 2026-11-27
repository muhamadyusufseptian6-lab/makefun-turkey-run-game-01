// Gobble Dash — every pixel the player sees. One job: draw the world,
// the turkey, the farmers, the hazards, the HUD and the screens, all
// procedural canvas art in one autumn palette. No images, no network.
import { VIEW_W, VIEW_H, GROUND_Y, STAGES, MAX_LIVES } from './config.js';
import { FARMER_STATES } from './farmer.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold', font = 'Georgia, serif') {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function outlineText(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `bold ${size}px Georgia, serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(40,16,4,0.85)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ---- backgrounds -------------------------------------------------------

function drawSky(ctx, stage, camX, time) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, stage.skyTop);
  g.addColorStop(0.62, stage.skyBottom);
  g.addColorStop(1, '#3a2412');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Low autumn sun.
  ctx.fillStyle = '#fff3c4';
  ellipse(ctx, VIEW_W - 130, 86, 34, 34);
  ctx.fillStyle = 'rgba(255,243,196,0.35)';
  ellipse(ctx, VIEW_W - 130, 86, 52, 52);
  // Drifting clouds.
  ctx.fillStyle = 'rgba(255,244,220,0.75)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 317 - camX * 0.12 + time * 6) % (VIEW_W + 240) + VIEW_W + 240) % (VIEW_W + 240) - 120;
    ellipse(ctx, cx, 70 + i * 26, 46, 15);
    ellipse(ctx, cx + 30, 76 + i * 26, 34, 12);
  }
  // Distant hills / barn roofline.
  ctx.fillStyle = 'rgba(90,48,20,0.45)';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y - 40);
  for (let x = 0; x <= VIEW_W; x += 60) {
    ctx.lineTo(x, GROUND_Y - 40 - Math.sin((x + camX * 0.3) * 0.008) * 26);
  }
  ctx.lineTo(VIEW_W, GROUND_Y + 4);
  ctx.lineTo(0, GROUND_Y + 4);
  ctx.closePath();
  ctx.fill();
}

function drawKitchenWall(ctx, stage, camX) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, stage.skyTop);
  g.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Tile lines.
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let y = 40; y < GROUND_Y; y += 56) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); ctx.stroke();
  }
  for (let x = -((camX * 0.5) % 56); x < VIEW_W; x += 56) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND_Y); ctx.stroke();
  }
  // Hanging pots and a window with the woods outside.
  ctx.fillStyle = '#2c4a6e';
  rr(ctx, 60, 60, 150, 110, 8); ctx.fill();
  // Sky pane inside the frame.
  ctx.fillStyle = '#8fc3e8';
  ctx.fillRect(66, 66, 138, 98);
  // A couple of drifting clouds.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ellipse(ctx, 100, 84, 16, 6);
  ellipse(ctx, 172, 78, 13, 5);
  // Round tree canopies with brown trunks — woods, not a mountain.
  const trees = [[92, 138, 24, '#3a7a2a'], [138, 128, 29, '#4a8a34'], [182, 140, 22, '#2e6a24']];
  for (const [tx, ty, tr, tc] of trees) {
    ctx.fillStyle = '#6a4520';
    ctx.fillRect(tx - 3, ty + tr * 0.4, 6, 164 - (ty + tr * 0.4));
    ctx.fillStyle = tc;
    ellipse(ctx, tx, ty, tr, tr * 0.85);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ellipse(ctx, tx - tr * 0.3, ty - tr * 0.35, tr * 0.4, tr * 0.3);
  }
  // Grass at the foot of the pane.
  ctx.fillStyle = '#4a8a34';
  ctx.fillRect(66, 156, 138, 8);
  // Window crossbars + sill so it reads as a window.
  ctx.fillStyle = '#2c4a6e';
  ctx.fillRect(133, 66, 4, 98);
  ctx.fillRect(66, 114, 138, 4);
  ctx.fillStyle = '#e8e0c8';
  rr(ctx, 54, 170, 162, 8, 3); ctx.fill();
  // Dark pill behind the label so it reads on any wall tint.
  ctx.fillStyle = 'rgba(30,12,4,0.55)';
  rr(ctx, 60, 186, 116, 20, 10); ctx.fill();
  ctx.fillStyle = '#f7f7f7';
  text(ctx, 'THE WOODS →', 66, 200, 13, '#fff', 'left');
  for (let i = 0; i < 3; i++) {
    const px = 330 + i * 90;
    ctx.strokeStyle = '#3a2412';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px, 30); ctx.lineTo(px, 70); ctx.stroke();
    ctx.fillStyle = i === 1 ? '#c9c9c9' : '#8a5a2b';
    ellipse(ctx, px, 92, 26, 20);
  }
}

function drawBarnInterior(ctx, stage, camX) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, stage.skyTop);
  g.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Wooden beams.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < 5; i++) {
    const bx = ((i * 260 - camX * 0.6) % (VIEW_W + 200) + VIEW_W + 200) % (VIEW_W + 200) - 100;
    ctx.fillRect(bx, 0, 26, GROUND_Y);
  }
  ctx.fillRect(0, 120, VIEW_W, 16);
  // Hayloft window with light shaft.
  ctx.fillStyle = 'rgba(255,220,140,0.5)';
  ctx.beginPath();
  ctx.moveTo(700, 40); ctx.lineTo(780, 40); ctx.lineTo(900, GROUND_Y); ctx.lineTo(720, GROUND_Y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  rr(ctx, 700, 40, 80, 60, 4); ctx.fill();
  ctx.strokeStyle = '#3a2412';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(740, 40); ctx.lineTo(740, 100); ctx.moveTo(700, 70); ctx.lineTo(780, 70); ctx.stroke();
}

function drawGround(ctx, stage, camX) {
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
  // Scattered leaves / floor marks scrolling with the world.
  for (let i = 0; i < 26; i++) {
    const lx = ((i * 173 - camX) % (VIEW_W + 80) + VIEW_W + 80) % (VIEW_W + 80) - 40;
    const ly = GROUND_Y + 16 + ((i * 53) % 66);
    ctx.fillStyle = i % 3 === 0 ? '#d95f2b' : i % 3 === 1 ? '#e8b23a' : '#a33d1e';
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate((i * 1.7) % 3);
    ellipse(ctx, 0, 0, 7, 3);
    ctx.restore();
  }
}

// ---- the turkey --------------------------------------------------------

export function drawTurkey(ctx, t, time) {
  const x = t.x;
  const feetY = t.y;
  const squashX = 1 + (t.squash || 0);
  const squashY = 1 - (t.squash || 0);
  const blink = (t.invuln > 0 && Math.floor(time * 14) % 2 === 0);
  ctx.save();
  ctx.translate(x, feetY);
  ctx.scale(t.facing * squashX, squashY);
  if (blink) ctx.globalAlpha = 0.35;

  const legSwing = t.grounded && Math.abs(t.vx) > 20 ? Math.sin(t.runPhase) * 7 : 0;
  const airTuck = !t.grounded;
  // Legs.
  ctx.strokeStyle = '#e8a34c';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -16); ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(6, -16); ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();
  // Tail fan: five proud feathers.
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.32 - 0.1);
    ctx.fillStyle = i % 2 === 0 ? '#7a4a21' : '#8a5a2b';
    ellipse(ctx, -26, -34, 7, 22);
    ctx.fillStyle = '#d95f2b';
    ellipse(ctx, -26, -50, 4, 8);
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = '#6e3f1c';
  ellipse(ctx, 0, -26, 24, 22);
  ctx.fillStyle = '#8a5a2b';
  ellipse(ctx, 2, -24, 19, 17);
  // Wing, flapping when airborne.
  const flap = airTuck ? Math.sin(time * 18) * 0.5 - 0.4 : Math.sin(t.runPhase) * 0.12;
  ctx.save();
  ctx.translate(-2, -28);
  ctx.rotate(flap);
  ctx.fillStyle = '#5a3416';
  ellipse(ctx, -4, 0, 13, 8);
  ctx.restore();
  // Neck + head.
  ctx.fillStyle = '#6e3f1c';
  ctx.fillRect(12, -52, 9, 26);
  ctx.fillStyle = '#e8e8e8';
  ellipse(ctx, 18, -56, 10, 10);
  // Beak.
  ctx.fillStyle = '#f08c1e';
  ctx.beginPath();
  ctx.moveTo(26, -58); ctx.lineTo(38, -54); ctx.lineTo(26, -51);
  ctx.closePath(); ctx.fill();
  // Wattle: the red dangly bit, the turkey's pride.
  ctx.fillStyle = '#d92b2b';
  ellipse(ctx, 24, -48, 4, 7);
  // Eye.
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 20, -58, 2.2, 2.8);
  ctx.fillStyle = '#fff';
  ellipse(ctx, 21, -59, 0.9, 0.9);
  ctx.restore();
}

function drawHiddenTurkey(ctx, t) {
  // Only eyes and a beak poke out of the haystack.
  ctx.fillStyle = '#fff';
  ellipse(ctx, t.x - 6, t.y - 58, 4, 4);
  ellipse(ctx, t.x + 6, t.y - 58, 4, 4);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, t.x - 6, t.y - 58, 1.8, 2.2);
  ellipse(ctx, t.x + 6, t.y - 58, 1.8, 2.2);
  ctx.fillStyle = '#f08c1e';
  ctx.beginPath();
  ctx.moveTo(t.x - 2, t.y - 54); ctx.lineTo(t.x + 10, t.y - 51); ctx.lineTo(t.x - 2, t.y - 48);
  ctx.closePath(); ctx.fill();
}

// ---- the farmers -------------------------------------------------------

export function drawFarmer(ctx, f, time) {
  const x = f.x;
  const feetY = f.y;
  ctx.save();
  ctx.translate(x, feetY);
  ctx.scale(f.facing, 1);
  const step = Math.abs(f.vx) > 10 ? Math.sin(f.walkPhase) * 6 : 0;
  // Legs (overalls).
  ctx.strokeStyle = '#2c4a6e';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -34); ctx.lineTo(-6 + step, 0);
  ctx.moveTo(6, -34); ctx.lineTo(6 - step, 0);
  ctx.stroke();
  // Body: shirt + apron.
  ctx.fillStyle = f.shirt;
  rr(ctx, -17, -66, 34, 36, 8); ctx.fill();
  ctx.fillStyle = f.apron;
  rr(ctx, -12, -58, 24, 30, 5); ctx.fill();
  // Arm + pitchfork when chasing or noticing.
  const armed = f.state === FARMER_STATES.CHASE || f.state === FARMER_STATES.NOTICE || f.state === FARMER_STATES.CORNER;
  ctx.strokeStyle = '#f0c08a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(10, -58); ctx.lineTo(24, armed ? -40 : -30);
  ctx.stroke();
  if (armed) {
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(26, -78); ctx.lineTo(26, -8); ctx.stroke();
    ctx.strokeStyle = '#c9c9c9';
    ctx.lineWidth = 2.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(26 + i * 5, -78); ctx.lineTo(26 + i * 5, -90); ctx.stroke();
    }
  }
  // Head + straw hat.
  ctx.fillStyle = f.skin;
  ellipse(ctx, 0, -74, 12, 12);
  ctx.fillStyle = '#e8c96a';
  ellipse(ctx, 0, -82, 19, 5);
  ctx.fillStyle = '#d9b34c';
  ctx.beginPath();
  ctx.arc(0, -82, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = f.hat;
  ctx.fillRect(-11, -84, 22, 4);
  // Moustache + angry brows when chasing.
  ctx.fillStyle = '#3a2412';
  ctx.fillRect(-7, -70, 14, 3);
  if (f.state === FARMER_STATES.CHASE || f.state === FARMER_STATES.NOTICE) {
    ctx.fillRect(-9, -80, 7, 2.5);
    ctx.fillRect(2, -80, 7, 2.5);
  }
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, -4, -76, 1.6, 2);
  ellipse(ctx, 4, -76, 1.6, 2);
  ctx.restore();
  // Shout / alert bubble.
  if (f.shoutTime > 0 && f.shout) {
    ctx.font = 'bold 15px Georgia, serif';
    const w = ctx.measureText(f.shout).width + 18;
    ctx.fillStyle = '#fff8e8';
    rr(ctx, x - w / 2, feetY - 132, w, 26, 8); ctx.fill();
    ctx.strokeStyle = '#3a2412';
    ctx.lineWidth = 2;
    rr(ctx, x - w / 2, feetY - 132, w, 26, 8); ctx.stroke();
    text(ctx, f.shout, x, feetY - 114, 15, '#3a2412', 'center');
  } else if (f.state === FARMER_STATES.NOTICE) {
    outlineText(ctx, '!', x, feetY - 108, 34, '#ff3b30');
  } else if (f.state === FARMER_STATES.SEARCH) {
    outlineText(ctx, '?', x, feetY - 108, 30, '#ffd94d');
  }
}

// ---- hazards & pickups -------------------------------------------------

function drawHazard(ctx, h, time) {
  const x = h.x;
  if (h.kind === 'fence') {
    ctx.fillStyle = '#7a4a21';
    ctx.fillRect(x - 17, h.y - 52, 7, 52);
    ctx.fillRect(x + 10, h.y - 52, 7, 52);
    ctx.fillStyle = '#a06a35';
    ctx.fillRect(x - 22, h.y - 46, 44, 7);
    ctx.fillRect(x - 22, h.y - 28, 44, 7);
  } else if (h.kind === 'haybale') {
    ctx.fillStyle = '#e8b23a';
    rr(ctx, x - 37, h.y - 56, 74, 56, 10); ctx.fill();
    ctx.strokeStyle = '#c98a3d';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(x - 30 + i * 18, h.y - 52); ctx.lineTo(x - 30 + i * 18, h.y - 4); ctx.stroke();
    }
    ctx.fillStyle = '#f6d47a';
    ellipse(ctx, x, h.y - 56, 20, 6);
  } else if (h.kind === 'snare') {
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, h.y - 8, 24, 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 24, h.y - 8); ctx.lineTo(x + 40, h.y - 2); ctx.stroke();
    ctx.fillStyle = '#5a3416';
    ellipse(ctx, x + 42, h.y - 2, 5, 4);
  } else if (h.kind === 'knife') {
    if (h.falling && h.warn > 0) {
      // Telegraph: a growing shadow + a glint where it will land, and the
      // knife itself visibly descending from the top of the frame.
      const fallProgress = 1 - h.warn / 0.7;
      const a = 0.25 + 0.55 * fallProgress;
      ctx.fillStyle = `rgba(60,10,10,${a})`;
      ellipse(ctx, x, GROUND_Y + 4, 18, 5);
      ctx.fillStyle = `rgba(255,60,40,${0.4 + 0.4 * Math.sin(time * 16)})`;
      text(ctx, '!', x, GROUND_Y - 60, 26, `rgba(255,60,40,${0.7})`, 'center');
      ctx.fillStyle = '#c9c9c9';
      ctx.save();
      ctx.translate(x, 70 + fallProgress * 150);
      ctx.rotate(0.5);
      ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(7, 4); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a3416';
      ctx.fillRect(-5, 4, 10, 14);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(x, h.y);
      ctx.rotate(h.falling ? 0.35 : 0.12);
      ctx.fillStyle = '#d9d9d9';
      ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(7, 4); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a3416';
      ctx.fillRect(-5, 4, 10, 14);
      ctx.restore();
    }
  } else if (h.kind === 'oven') {
    ctx.fillStyle = '#3a3a3a';
    rr(ctx, x - 48, h.y - 84, 96, 84, 6); ctx.fill();
    ctx.fillStyle = '#222';
    rr(ctx, x - 38, h.y - 70, 76, 48, 4); ctx.fill();
    const glow = h.doorOpen > 0 ? 1 : 0.35;
    ctx.fillStyle = `rgba(255,${Math.floor(120 + 80 * glow)},30,${0.5 + 0.5 * glow})`;
    rr(ctx, x - 32, h.y - 64, 64, 36, 3); ctx.fill();
    ctx.fillStyle = '#ffb03a';
    text(ctx, '375°F', x, h.y - 76, 11, '#ffb03a', 'center');
    if (h.doorOpen > 0) {
      ctx.fillStyle = `rgba(255,140,40,${0.55})`;
      ellipse(ctx, x + 44, h.y - 30, 26, 18);
      // Above the oven's top-right corner: clear of the body and of "375°F".
      text(ctx, 'HOT!', x + 58, h.y - 94, 13, '#ff5a3c', 'center');
    }
    // Dials.
    ctx.fillStyle = '#c9c9c9';
    ellipse(ctx, x - 28, h.y - 8, 4, 4);
    ellipse(ctx, x - 14, h.y - 8, 4, 4);
  } else if (h.kind === 'pumpkin') {
    ctx.save();
    ctx.translate(x, h.y - 24);
    ctx.rotate(h.roll);
    ctx.fillStyle = '#e8722a';
    ellipse(ctx, 0, 0, 26, 24);
    ctx.strokeStyle = '#c95a1a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 24, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 24, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#5a8a2a';
    ctx.fillRect(-2, -30, 4, 10);
    ctx.restore();
  }
}

function drawPickup(ctx, p, time) {
  const y = p.y + Math.sin(p.bob + time * 2) * 4;
  if (p.kind === 'corn') {
    ctx.fillStyle = '#ffd94d';
    ellipse(ctx, p.x, y, 9, 14);
    ctx.fillStyle = '#e8b23a';
    for (let i = 0; i < 3; i++) ellipse(ctx, p.x - 4 + i * 4, y - 6 + (i % 2) * 8, 1.6, 2.4);
    ctx.fillStyle = '#7bc950';
    ctx.beginPath(); ctx.moveTo(p.x, y + 12); ctx.lineTo(p.x - 7, y + 22); ctx.lineTo(p.x + 7, y + 22); ctx.closePath(); ctx.fill();
  } else if (p.kind === 'pie') {
    ctx.fillStyle = '#c97b2a';
    ctx.beginPath(); ctx.moveTo(p.x - 16, y + 10); ctx.lineTo(p.x + 16, y + 10); ctx.lineTo(p.x, y - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a34c';
    ctx.beginPath(); ctx.moveTo(p.x - 12, y + 10); ctx.lineTo(p.x + 12, y + 10); ctx.lineTo(p.x, y - 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a2f2f';
    ellipse(ctx, p.x, y + 2, 3, 3);
  } else if (p.kind === 'goldenFeather') {
    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(Math.sin(time * 2) * 0.3);
    ctx.fillStyle = `rgba(255,217,77,${0.4 + 0.3 * Math.sin(time * 4)})`;
    ellipse(ctx, 0, 0, 18, 18);
    ctx.fillStyle = '#ffd94d';
    ellipse(ctx, 0, -8, 5, 14);
    ctx.fillStyle = '#fff3c4';
    ellipse(ctx, 0, 6, 3, 8);
    ctx.restore();
  }
}

// ---- HUD ----------------------------------------------------------------

function drawFeatherIcon(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.4);
  ctx.fillStyle = filled ? '#fff' : 'rgba(255,255,255,0.25)';
  ellipse(ctx, 0, 0, 4, 10);
  ctx.fillStyle = filled ? '#e8a34c' : 'rgba(255,255,255,0.15)';
  ellipse(ctx, 0, 8, 2, 5);
  ctx.restore();
}

export function drawHUD(ctx, s) {
  ctx.fillStyle = 'rgba(30,12,4,0.55)';
  rr(ctx, 10, 10, VIEW_W - 20, 52, 10); ctx.fill();
  text(ctx, `SCORE ${s.score}`, 24, 32, 19, '#ffd94d');
  text(ctx, `${s.distanceYards} yd`, 24, 52, 13, '#fff');
  text(ctx, s.stage.def.name, VIEW_W / 2, 32, 16, '#fff', 'center');
  text(ctx, `STAGE ${s.stageIndex + 1} / 3`, VIEW_W / 2, 52, 12, '#ffd94d', 'center');
  for (let i = 0; i < MAX_LIVES; i++) drawFeatherIcon(ctx, VIEW_W - 40 - i * 26, 30, i < s.lives);
  text(ctx, 'LIVES', VIEW_W - 40 - MAX_LIVES * 26 - 8, 34, 11, '#fff', 'right');
  // Stamina bar.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  rr(ctx, VIEW_W - 150, 46, 120, 8, 4); ctx.fill();
  ctx.fillStyle = s.turkey.stamina > 25 ? '#7bc950' : '#ff5a3c';
  rr(ctx, VIEW_W - 150, 46, 120 * (s.turkey.stamina / 100), 8, 4); ctx.fill();
  text(ctx, 'DASH', VIEW_W - 156, 54, 10, '#fff', 'right');
  // Alert strip.
  if (s.alert > 0.45) {
    ctx.fillStyle = 'rgba(255,40,30,0.85)';
    rr(ctx, VIEW_W / 2 - 70, 68, 140, 24, 12); ctx.fill();
    text(ctx, 'SPOTTED! RUN!', VIEW_W / 2, 85, 14, '#fff', 'center');
  } else if (s.turkey.hiding) {
    ctx.fillStyle = 'rgba(60,160,60,0.85)';
    rr(ctx, VIEW_W / 2 - 70, 68, 140, 24, 12); ctx.fill();
    text(ctx, 'HIDDEN… shhh', VIEW_W / 2, 85, 14, '#fff', 'center');
  }
  if (s.muted) text(ctx, 'MUTED (M)', VIEW_W - 24, VIEW_H - 16, 12, 'rgba(255,255,255,0.7)', 'right');
}

// ---- screens ------------------------------------------------------------

export function drawTitle(ctx, s, time) {
  const stage = STAGES[0];
  drawSky(ctx, stage, 0, time);
  drawGround(ctx, stage, 0);
  // A little farmhouse + the woods gate on the horizon.
  ctx.fillStyle = '#a33d1e';
  ctx.fillRect(90, GROUND_Y - 110, 130, 110);
  ctx.fillStyle = '#5a3416';
  ctx.beginPath(); ctx.moveTo(80, GROUND_Y - 108); ctx.lineTo(155, GROUND_Y - 160); ctx.lineTo(230, GROUND_Y - 108); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(120, GROUND_Y - 80, 24, 24);
  ctx.fillRect(170, GROUND_Y - 80, 24, 24);
  // Woods gate far right.
  ctx.fillStyle = '#3a5a2a';
  ctx.fillRect(820, GROUND_Y - 120, 90, 120);
  ctx.fillStyle = '#7bc950';
  ellipse(ctx, 865, GROUND_Y - 130, 60, 40);
  text(ctx, 'THE WOODS', 865, GROUND_Y - 176, 13, '#fff', 'center');
  // The turkey, posing.
  const pose = { ...s.turkey, x: 430, y: GROUND_Y, vx: 0, facing: 1, runPhase: 0, squash: Math.sin(time * 3) * 0.03 };
  drawTurkey(ctx, pose, time);
  // Ezekiel, mid-chase, far left.
  const fpose = { ...s.farmer, x: 250, y: GROUND_Y, vx: 0, facing: 1, state: FARMER_STATES.CHASE, shout: '', shoutTime: 0, walkPhase: time * 6 };
  drawFarmer(ctx, fpose, time);
  // A knife stuck in the ground + an oven, so the brief reads at a glance.
  drawHazard(ctx, { kind: 'knife', x: 600, y: GROUND_Y - 30, falling: false, warn: 0 }, time);
  drawHazard(ctx, { kind: 'oven', x: 700, y: GROUND_Y, doorOpen: 0.4, doorTimer: 2 }, time);
  // Title block.
  ctx.fillStyle = 'rgba(30,12,4,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  outlineText(ctx, 'GOBBLE DASH', VIEW_W / 2, 108, 64, '#ffd94d');
  text(ctx, '3 stages · 2 farmers · 1 very nervous turkey', VIEW_W / 2, 142, 19, '#fff', 'center');
  text(ctx, 'Thanksgiving is Thursday. You are the main course. NOT TODAY.', VIEW_W / 2, 172, 16, '#ffe9a8', 'center');
  text(ctx, 'Farmyard  →  Barn  →  Kitchen  →  the woods gate', VIEW_W / 2, 200, 15, '#fff', 'center');
  const pulse = 0.65 + 0.35 * Math.sin(time * 4);
  text(ctx, 'PRESS ENTER OR CLICK TO RUN', VIEW_W / 2, 300, 22, `rgba(255,217,77,${pulse})`, 'center');
  text(ctx, '← → / A D move    SPACE jump (twice = flap)    SHIFT dash    S hide in haystacks', VIEW_W / 2, 336, 15, '#fff', 'center');
  text(ctx, 'Dodge fences, snares, falling knives and hot ovens. Eat corn. Do not get caught.', VIEW_W / 2, 362, 14, '#ffe9a8', 'center');
  text(ctx, 'M mute · P pause · R restart', VIEW_W / 2, VIEW_H - 24, 13, 'rgba(255,255,255,0.75)', 'center');
}

export function drawEnd(ctx, s, time) {
  const escaped = s.screen === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(20,60,20,0.55)' : 'rgba(60,10,4,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (escaped) {
    outlineText(ctx, 'ESCAPED!', VIEW_W / 2, 130, 64, '#7bc950');
    text(ctx, 'Giblet made it to the woods. Thanksgiving is cancelled — for you.', VIEW_W / 2, 168, 18, '#fff', 'center');
    text(ctx, 'Ezekiel is still checking the haystacks.', VIEW_W / 2, 196, 15, '#ffe9a8', 'center');
  } else {
    outlineText(ctx, 'CAUGHT!', VIEW_W / 2, 130, 64, '#ff5a3c');
    text(ctx, '“Gotcha, dinner.” — Ezekiel, probably', VIEW_W / 2, 168, 18, '#fff', 'center');
    text(ctx, 'The oven was already preheated. Awkward.', VIEW_W / 2, 196, 15, '#ffe9a8', 'center');
  }
  // Score card.
  ctx.fillStyle = 'rgba(30,12,4,0.7)';
  rr(ctx, VIEW_W / 2 - 210, 230, 420, 168, 12); ctx.fill();
  text(ctx, 'SCORE CARD', VIEW_W / 2, 262, 18, '#ffd94d', 'center');
  text(ctx, `Score            ${s.score}`, VIEW_W / 2, 296, 17, '#fff', 'center');
  text(ctx, `Distance         ${s.distanceYards} yd of ${s.totalYards} yd`, VIEW_W / 2, 322, 15, '#fff', 'center');
  text(ctx, `Corn eaten       ${s.stats.corn}`, VIEW_W / 2, 346, 15, '#fff', 'center');
  text(ctx, `Knives dodged    ${s.stats.knivesDodged}`, VIEW_W / 2, 370, 15, '#fff', 'center');
  const pulse = 0.65 + 0.35 * Math.sin(time * 4);
  text(ctx, 'PRESS R OR CLICK TO RUN AGAIN', VIEW_W / 2, 440, 20, `rgba(255,217,77,${pulse})`, 'center');
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20,10,4,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  outlineText(ctx, 'PAUSED', VIEW_W / 2, VIEW_H / 2, 48, '#fff');
  text(ctx, 'P to resume · the turkey is holding its breath', VIEW_W / 2, VIEW_H / 2 + 36, 15, '#ffe9a8', 'center');
}

export function drawBanner(ctx, banner) {
  if (!banner || banner.t <= 0) return;
  const a = Math.min(1, banner.t * 2);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(30,12,4,0.75)';
  rr(ctx, VIEW_W / 2 - 330, 120, 660, 84, 12); ctx.fill();
  text(ctx, banner.title, VIEW_W / 2, 156, 26, '#ffd94d', 'center');
  if (banner.sub) text(ctx, banner.sub, VIEW_W / 2, 184, 15, '#fff', 'center');
  ctx.restore();
}

// ---- world frame --------------------------------------------------------

export function drawWorld(ctx, s, time) {
  const stage = s.stage.def;
  const camX = s.cameraX;
  ctx.save();
  if (s.stageIndex === 2) drawKitchenWall(ctx, stage, camX);
  else if (s.stageIndex === 1) drawBarnInterior(ctx, stage, camX);
  else drawSky(ctx, stage, camX, time);
  drawGround(ctx, stage, camX);

  ctx.save();
  ctx.translate(-camX, 0);
  // Woods gate at the end of stage 3.
  if (s.stageIndex === 2) {
    const gx = stage.length - 120;
    ctx.fillStyle = '#3a5a2a';
    ctx.fillRect(gx - 10, GROUND_Y - 130, 130, 130);
    ctx.fillStyle = '#7bc950';
    ellipse(ctx, gx + 55, GROUND_Y - 140, 70, 44);
    text(ctx, 'FREEDOM →', gx + 55, GROUND_Y - 186, 15, '#fff', 'center');
  }
  // Stage-start signpost.
  ctx.fillStyle = '#5a3416';
  ctx.fillRect(180, GROUND_Y - 90, 8, 90);
  ctx.fillStyle = '#e8e0c8';
  rr(ctx, 150, GROUND_Y - 116, 120, 30, 4); ctx.fill();
  ctx.fillStyle = '#3a2412';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(stage.id.toUpperCase(), 210, GROUND_Y - 97);

  for (const h of s.hazards) drawHazard(ctx, h, time);
  for (const p of s.pickups) drawPickup(ctx, p, time);
  if (s.turkey.hiding) drawHiddenTurkey(ctx, s.turkey);
  else drawTurkey(ctx, s.turkey, time);
  drawFarmer(ctx, s.farmer, time);
  drawParticles(ctx, s.particles);
  ctx.restore();

  drawHUD(ctx, s);
  drawBanner(ctx, s.banner);
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.feather) ellipse(ctx, 0, 0, p.size * 0.6, p.size);
    else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
}
