// Gobble Dash — the turkey. One job: Giblet's body, physics and verbs
// (run, jump, double-jump, dash, duck, hide in a haystack).
import { GRAVITY, GROUND_Y, TURKEY_RUN_SPEED, TURKEY_DASH_SPEED, TURKEY_JUMP_SPEED, TURKEY_DOUBLE_JUMP_SPEED, VIEW_W } from './config.js';

export function createTurkey() {
  return {
    x: 120,
    y: GROUND_Y,
    w: 46,
    h: 52,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    jumpsUsed: 0,
    dashing: false,
    dashTime: 0,
    stamina: 100,
    hiding: false,
    hideTarget: null,
    invuln: 0,
    stuck: 0,
    runPhase: 0,
    squash: 0,
  };
}

export function updateTurkey(t, input, dt, world) {
  const speed = TURKEY_RUN_SPEED;
  let move = 0;
  if (input.left()) move -= 1;
  if (input.right()) move += 1;

  // Hiding: hold Down while overlapping a haystack. Frozen, invisible to farmers.
  const hay = world.nearHaystack(t);
  if (input.down() && hay && t.grounded && !t.dashing) {
    if (!t.hiding) world.onHideStart();
    t.hiding = true;
    t.hideTarget = hay;
    t.vx = 0;
  } else {
    if (t.hiding) world.onHideEnd();
    t.hiding = false;
    t.hideTarget = null;
  }

  if (t.stuck > 0) {
    t.stuck -= dt;
    t.vx = 0;
    move = 0;
  }

  // Dash: Shift, costs stamina, only while moving.
  const wantDash = input.dashHeld() && move !== 0 && t.stamina > 12 && !t.hiding;
  if (wantDash && !t.dashing) world.onDashStart();
  t.dashing = wantDash;
  if (t.dashing) {
    t.stamina = Math.max(0, t.stamina - 55 * dt);
    t.dashTime += dt;
  } else {
    t.stamina = Math.min(100, t.stamina + 26 * dt);
    t.dashTime = 0;
  }

  const targetSpeed = t.dashing ? TURKEY_DASH_SPEED : speed;
  const accel = t.grounded ? 2600 : 1700;
  const desired = move * targetSpeed;
  if (t.vx < desired) t.vx = Math.min(desired, t.vx + accel * dt);
  else if (t.vx > desired) t.vx = Math.max(desired, t.vx - accel * dt);
  if (move !== 0) t.facing = move;

  // Jumping: one jump on the ground, one more in the air (a frantic flap).
  if (input.jumpPressed() && !t.hiding && t.stuck <= 0) {
    if (t.grounded) {
      t.vy = -TURKEY_JUMP_SPEED;
      t.grounded = false;
      t.jumpsUsed = 1;
      t.squash = -0.18;
      world.onJump(false);
    } else if (t.jumpsUsed < 2) {
      t.vy = -TURKEY_DOUBLE_JUMP_SPEED;
      t.jumpsUsed = 2;
      world.onJump(true);
    }
  }

  t.vy += GRAVITY * dt;
  t.x += t.vx * dt;
  t.y += t.vy * dt;
  if (t.x < 40) t.x = 40;
  if (t.x > world.stageEndX() - 60) t.x = world.stageEndX() - 60;

  if (t.y >= GROUND_Y) {
    if (!t.grounded && t.vy > 500) t.squash = 0.22;
    t.y = GROUND_Y;
    t.vy = 0;
    t.grounded = true;
    t.jumpsUsed = 0;
  } else {
    t.grounded = false;
  }

  if (t.invuln > 0) t.invuln -= dt;
  t.squash *= Math.pow(0.001, dt);
  if (Math.abs(t.vx) > 20 && t.grounded) t.runPhase += dt * Math.abs(t.vx) * 0.045;
  return t;
}

// Axis-aligned box of the turkey in world space (feet at y).
export function turkeyBox(t) {
  return { x: t.x - t.w / 2, y: t.y - t.h, w: t.w, h: t.h };
}

export function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
