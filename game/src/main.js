// Gobble Dash — the game loop and the state machine.
// One job: own the run (title -> play -> caught/escaped), wire input,
// audio and the world callbacks together, and keep score.
import { VIEW_W, VIEW_H, GROUND_Y, STAGES, SCORE, MAX_LIVES } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createTurkey, updateTurkey, turkeyBox, boxesOverlap } from './turkey.js';
import { updateFarmer, farmerBox } from './farmer.js';
import { updateHazards, collideTurkeyHazards, landOnTop, collectPickups } from './obstacles.js';
import { buildStage, stageDistanceYards, totalYards } from './stages.js';
import { createParticles, updateParticles, burst, featherBurst, dustPuff, cornSparkle, confetti } from './particles.js';
import { drawWorld, drawTitle, drawEnd, drawPaused } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = createInput(canvas);
const audio = createAudio();

function newRun() {
  const stage = buildStage(0);
  return {
    screen: 'title',
    stageIndex: 0,
    stage,
    turkey: createTurkey(),
    farmer: stage.farmer,
    hazards: stage.hazards,
    pickups: stage.pickups,
    particles: createParticles(),
    score: 0,
    lives: MAX_LIVES,
    distanceYards: 0,
    totalYards: totalYards(),
    alert: 0,
    banner: null,
    cameraX: 0,
    time: 0,
    muted: false,
    frozen: false,
    stats: { corn: 0, knivesDodged: 0, jumps: 0, dashes: 0, hides: 0 },
    buildStage,
  };
}

let s = newRun();

function setBanner(title, sub, seconds = 2.4) {
  s.banner = { title, sub, t: seconds };
}

function startRun() {
  s = newRun();
  s.screen = 'play';
  audio.unlock();
  audio.gobble();
  setBanner(STAGES[0].name, STAGES[0].intro, 3.0);
}

function nextStage() {
  s.score += SCORE.stageClear;
  audio.stageClear();
  if (s.stageIndex >= STAGES.length - 1) {
    escapeRun();
    return;
  }
  s.stageIndex++;
  const stage = buildStage(s.stageIndex);
  s.stage = stage;
  s.turkey = createTurkey();
  s.farmer = stage.farmer;
  s.hazards = stage.hazards;
  s.pickups = stage.pickups;
  s.alert = 0;
  setBanner(stage.def.name, stage.def.intro, 3.0);
}

function escapeRun() {
  s.score += SCORE.escapeBonus;
  s.screen = 'escaped';
  audio.escaped();
  confetti(s.particles, VIEW_W / 2, 140);
}

function caughtRun(farmerName) {
  if (s.screen !== 'play') return;
  s.screen = 'caught';
  s.caughtBy = farmerName;
  audio.caught();
  featherBurst(s.particles, s.turkey.x - s.cameraX, s.turkey.y);
}

function hurtTurkey() {
  if (s.turkey.invuln > 0) return;
  s.lives--;
  s.turkey.invuln = 1.6;
  audio.hurt();
  featherBurst(s.particles, s.turkey.x - s.cameraX, s.turkey.y);
  if (s.lives <= 0) {
    s.screen = 'caught';
    s.caughtBy = 'the kitchen itself';
    audio.caught();
  }
}

// ---- world callbacks: the turkey / farmer / hazard modules call back here.
const world = {
  stageEndX() { return s.stage.def.length; },
  nearHaystack(t) {
    return s.hazards.find((h) => h.kind === 'haybale' && Math.abs(h.x - t.x) < 46) || null;
  },
  haystackNear(x, r) {
    return s.hazards.find((h) => h.kind === 'haybale' && Math.abs(h.x - x) < r) || null;
  },
  onHideStart() { s.stats.hides++; audio.hide(); },
  onHideEnd() {},
  onDashStart() { s.stats.dashes++; audio.dash(); dustPuff(s.particles, s.turkey.x - s.cameraX, GROUND_Y); },
  onJump(doubleJump) { s.stats.jumps++; if (doubleJump) audio.doubleJump(); else audio.jump(); },
  onFarmerSpotted() { s.alert = 1; audio.spotted(); },
  onCaught(f) { caughtRun(f.name); },
  onKnifeLanded(h) {
    audio.knifeThud();
    dustPuff(s.particles, h.x - s.cameraX, GROUND_Y);
    if (Math.abs(s.turkey.x - h.x) < 120 && s.turkey.invuln <= 0) s.stats.knivesDodged++;
  },
  onOvenPuff() { audio.ovenSizzle(); },
  onPickup(p) {
    if (p.kind === 'corn') {
      s.score += SCORE.corn;
      s.stats.corn++;
      audio.corn();
      cornSparkle(s.particles, p.x - s.cameraX, p.y);
    } else if (p.kind === 'pie') {
      s.score += SCORE.pie;
      audio.pie();
      cornSparkle(s.particles, p.x - s.cameraX, p.y);
      setBanner('PUMPKIN PIE! +50', 'Worth every calorie. Keep running.', 1.6);
    } else if (p.kind === 'goldenFeather') {
      s.score += SCORE.goldenFeather;
      if (s.lives < MAX_LIVES) s.lives++;
      audio.pie();
      featherBurst(s.particles, p.x - s.cameraX, p.y);
      setBanner('GOLDEN FEATHER! +1 LIFE', 'Somewhere, a goose is jealous.', 1.8);
    }
  },
};

function update(dt) {
  s.time += dt;
  if (s.banner) {
    s.banner.t -= dt;
    if (s.banner.t <= 0) s.banner = null;
  }

  if (s.screen === 'title') {
    if (input.startPressed() || input.consumeClick()) startRun();
    return;
  }
  if (s.screen === 'caught' || s.screen === 'escaped') {
    s.particles = updateParticles(s.particles, dt);
    if (input.restartPressed() || input.consumeClick()) startRun();
    return;
  }
  if (s.screen === 'paused') {
    if (input.pausePressed() || input.consumeClick()) s.screen = 'play';
    return;
  }

  // Playing.
  if (input.pausePressed()) { s.screen = 'paused'; return; }
  if (input.mutePressed()) { s.muted = audio.toggleMute(); }

  updateTurkey(s.turkey, input, dt, world);
  landOnTop(s.turkey, s.hazards);
  updateFarmer(s.farmer, s.turkey, dt, world);
  s.hazards = updateHazards(s.hazards, dt, world);
  s.pickups = collectPickups(s.turkey, s.pickups, world);
  s.particles = updateParticles(s.particles, dt);

  // Farmer touch = caught (only when not hiding and not mid-notice).
  const fb = farmerBox(s.farmer);
  const tb = turkeyBox(s.turkey);
  if (!s.turkey.hiding && boxesOverlap(tb, fb)) {
    caughtRun(s.farmer.name);
    return;
  }

  const hit = collideTurkeyHazards(s.turkey, s.hazards, world);
  if (hit === 'hurt') hurtTurkey();
  else if (hit === 'snared') {
    s.turkey.stuck = 1.2;
    s.turkey.invuln = Math.max(s.turkey.invuln, 0.6);
    audio.hurt();
    setBanner('SNARED!', 'Wiggle free — Ezekiel heard that.', 1.4);
  }

  // Alert decays when the farmer loses the trail.
  if (s.farmer.state === 'patrol') s.alert = Math.max(0, s.alert - dt * 0.5);

  // Score ticks up with every yard run.
  const yards = stageDistanceYards(s.stageIndex, s.turkey.x);
  if (yards > s.distanceYards) {
    s.score += yards - s.distanceYards;
    s.distanceYards = yards;
  }

  // Camera follows the turkey.
  s.cameraX = Math.max(0, Math.min(s.turkey.x - 300, s.stage.def.length - VIEW_W));

  // Reached the end of the stage?
  if (s.turkey.x >= s.stage.def.length - 80) nextStage();
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (s.screen === 'title') drawTitle(ctx, s, s.time);
  else if (s.screen === 'caught' || s.screen === 'escaped') {
    drawWorld(ctx, s, s.time);
    drawEnd(ctx, s, s.time);
  } else {
    drawWorld(ctx, s, s.time);
    if (s.screen === 'paused') drawPaused(ctx);
  }
}

// Fixed-step loop at 60 Hz, clamped so a slow frame never jumps the turkey.
let last = performance.now();
let acc = 0;
const STEP = 1 / 60;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!s.frozen) {
    acc += dt;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
  } else {
    s.time += dt;
    s.particles = updateParticles(s.particles, dt);
  }
  render();
  input.endFrame();
  requestAnimationFrame(frame);
}

// Staged screenshot mode: ?shot=1..4 freezes a composed scene.
const shotParam = new URLSearchParams(window.location.search).get('shot');
if (shotParam) {
  const n = parseInt(shotParam, 10);
  if (n >= 1 && n <= 4) stageShot(s, n);
}

function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

requestAnimationFrame(frame);
window.__ready = true;
// Read-only debug handle for the local playtest harness (no network, no
// gameplay effect): exposes the run's headline state.
window.__debug = {
  getState() {
    return {
      screen: s.screen,
      score: s.score,
      distanceYards: s.distanceYards,
      lives: s.lives,
      stageIndex: s.stageIndex,
      turkeyX: Math.round(s.turkey.x),
      farmerState: s.farmer.state,
      hazards: s.hazards.length,
      pickups: s.pickups.length,
    };
  },
};
