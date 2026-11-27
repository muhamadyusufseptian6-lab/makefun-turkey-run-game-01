// Gobble Dash — hazards and pickups. One job: everything on the ground
// (and falling from the sky) that is not the turkey or a farmer.
// Fence: jump it. Hay bale: jump on it, hide in it. Snare: jump it or get
// stuck. Knife: falls with a shadow warning, then sticks in the dirt.
// Oven: a hot box you jump, whose door puffs heat. Pumpkin: rolls at you.
// Corn: +10. Pie: +50. Golden feather: +1 life.
import { GROUND_Y } from './config.js';
import { boxesOverlap } from './turkey.js';

export function makeHazard(kind, x, opts = {}) {
  const base = { kind, x, y: GROUND_Y, w: 40, h: 40, vx: 0, vy: 0, t: 0, hit: false, dead: false, seed: opts.seed || 0 };
  switch (kind) {
    case 'fence': return { ...base, w: 34, h: 52 };
    case 'haybale': return { ...base, w: 74, h: 56, hideSpot: true };
    case 'snare': return { ...base, w: 56, h: 14, y: GROUND_Y };
    case 'knife': return { ...base, w: 26, h: 58, y: -80, vy: 0, falling: true, warn: 0.7 };
    case 'oven': return { ...base, w: 96, h: 84, doorTimer: 1.2 + (opts.seed % 10) / 10, doorOpen: 0 };
    case 'pumpkin': return { ...base, w: 52, h: 48, vx: -90 - (opts.seed % 60), roll: 0 };
    default: return base;
  }
}

export function makePickup(kind, x, y) {
  return { kind, x, y, taken: false, bob: Math.random() * 6.28 };
}

export function hazardBox(h) {
  if (h.kind === 'snare') return { x: h.x - h.w / 2, y: GROUND_Y - h.h, w: h.w, h: h.h };
  if (h.kind === 'knife' && h.falling) return { x: h.x - 8, y: h.y, w: 16, h: 30 };
  return { x: h.x - h.w / 2, y: h.y - h.h, w: h.w, h: h.h };
}

export function updateHazards(hazards, dt, world) {
  for (const h of hazards) {
    h.t += dt;
    if (h.kind === 'knife' && h.falling) {
      if (h.warn > 0) {
        h.warn -= dt;
      } else {
        h.vy += 2600 * dt;
        h.y += h.vy * dt;
        if (h.y >= GROUND_Y - 30) {
          h.y = GROUND_Y - 30;
          h.falling = false;
          world.onKnifeLanded(h);
        }
      }
    } else if (h.kind === 'pumpkin') {
      h.x += h.vx * dt;
      h.roll += dt * 4;
      if (h.x < world.cameraX - 120) h.dead = true;
    } else if (h.kind === 'oven') {
      h.doorTimer -= dt;
      if (h.doorTimer <= 0) {
        h.doorOpen = 0.8;
        h.doorTimer = 2.4 + ((h.seed * 7) % 10) / 10;
        world.onOvenPuff(h);
      }
      if (h.doorOpen > 0) h.doorOpen -= dt;
    }
  }
  return hazards.filter((h) => !h.dead);
}

// Resolve turkey vs hazards. Returns 'hurt' | 'snared' | null.
export function collideTurkeyHazards(turkey, hazards, world) {
  if (turkey.invuln > 0 || turkey.hiding) return null;
  const tb = { x: turkey.x - turkey.w / 2 + 4, y: turkey.y - turkey.h + 4, w: turkey.w - 8, h: turkey.h - 6 };
  for (const h of hazards) {
    if (h.hit) continue;
    if (h.kind === 'haybale') continue; // solid-ish: you land on it, you hide in it.
    if (h.kind === 'knife' && h.falling && h.warn > 0) continue;
    const hb = hazardBox(h);
    if (!boxesOverlap(tb, hb)) continue;
    if (h.kind === 'snare') {
      h.hit = true;
      return 'snared';
    }
    if (h.kind === 'oven' && h.doorOpen > 0) {
      h.hit = true;
      return 'hurt';
    }
    if (h.kind === 'oven' && h.doorOpen <= 0) {
      // Touching a closed oven still burns a little: bounce off with damage.
      h.hit = true;
      return 'hurt';
    }
    h.hit = true;
    return 'hurt';
  }
  return null;
}

// Landing on hay bales and fences: stand on top instead of passing through.
export function landOnTop(turkey, hazards) {
  if (turkey.vy < 0) return;
  for (const h of hazards) {
    if (h.kind !== 'haybale' && h.kind !== 'fence' && h.kind !== 'oven') continue;
    const top = h.y - h.h;
    const prevFeet = turkey.y - turkey.vy * 0.016;
    if (turkey.x > h.x - h.w / 2 - 10 && turkey.x < h.x + h.w / 2 + 10 &&
        turkey.y >= top && prevFeet <= top + 6 && turkey.y <= top + 26) {
      turkey.y = top;
      turkey.vy = 0;
      turkey.grounded = true;
      turkey.jumpsUsed = 0;
      return;
    }
  }
}

export function collectPickups(turkey, pickups, world) {
  const tb = { x: turkey.x - turkey.w / 2, y: turkey.y - turkey.h, w: turkey.w, h: turkey.h + 20 };
  for (const p of pickups) {
    if (p.taken) continue;
    const bobY = p.y + Math.sin(p.bob) * 4;
    if (Math.abs(turkey.x - p.x) < 34 && Math.abs((turkey.y - 26) - bobY) < 44) {
      p.taken = true;
      world.onPickup(p);
    }
  }
  return pickups.filter((p) => !p.taken);
}
