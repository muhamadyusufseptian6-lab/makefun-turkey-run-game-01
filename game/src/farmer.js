// Gobble Dash — the farmers. One job: the chase brain.
// Finite state machine, three layers from the game-ai playbook:
// decide (patrol / notice / chase / search / corner) -> steer (walk toward
// a target x) -> path (flat ground, no navmesh needed).
// Ezekiel patrols the farmyard and barn; Mabel owns the kitchen.
import { GROUND_Y } from './config.js';

export const FARMER_STATES = {
  PATROL: 'patrol',
  NOTICE: 'notice',
  CHASE: 'chase',
  SEARCH: 'search',
  CORNER: 'corner',
};

export function createFarmer(def, x, speed, sight) {
  return {
    name: def.name,
    hat: def.hat,
    shirt: def.shirt,
    skin: def.skin,
    apron: def.apron,
    x,
    y: GROUND_Y,
    w: 44,
    h: 78,
    vx: 0,
    facing: -1,
    state: FARMER_STATES.PATROL,
    stateTime: 0,
    speed,
    sight,
    patrolLeft: x - 160,
    patrolRight: x + 160,
    patrolDir: 1,
    lastSeenX: x,
    searchX: x,
    walkPhase: 0,
    shout: '',
    shoutTime: 0,
  };
}

function setState(f, next, world) {
  if (f.state === next) return;
  f.state = next;
  f.stateTime = 0;
  if (next === FARMER_STATES.NOTICE) {
    world.onFarmerSpotted(f);
    f.shout = 'HEY! MY DINNER!';
    f.shoutTime = 0.9;
  } else if (next === FARMER_STATES.SEARCH) {
    f.shout = 'Where\'d it go…?';
    f.shoutTime = 1.4;
  } else if (next === FARMER_STATES.CORNER) {
    f.shout = 'I KNOW you\'re in there…';
    f.shoutTime = 1.2;
  }
}

export function updateFarmer(f, turkey, dt, world) {
  f.stateTime += dt;
  if (f.shoutTime > 0) f.shoutTime -= dt;

  const dist = Math.abs(turkey.x - f.x);
  const turkeyVisible = !turkey.hiding && dist < f.sight && turkey.y > GROUND_Y - 220;
  const canCatch = dist < 34 && Math.abs(turkey.y - GROUND_Y) < 60;

  let targetX = f.x;
  let speed = 0;

  switch (f.state) {
    case FARMER_STATES.PATROL: {
      speed = f.speed * 0.42;
      targetX = f.patrolDir > 0 ? f.patrolRight : f.patrolLeft;
      if ((f.patrolDir > 0 && f.x >= f.patrolRight) || (f.patrolDir < 0 && f.x <= f.patrolLeft)) {
        f.patrolDir *= -1;
      }
      if (turkeyVisible) {
        f.lastSeenX = turkey.x;
        setState(f, FARMER_STATES.NOTICE, world);
      }
      break;
    }
    case FARMER_STATES.NOTICE: {
      // The comic beat: a frozen half-second of disbelief, then the chase.
      speed = 0;
      if (f.stateTime > 0.55) setState(f, FARMER_STATES.CHASE, world);
      break;
    }
    case FARMER_STATES.CHASE: {
      speed = f.speed;
      targetX = turkey.x;
      if (turkeyVisible) f.lastSeenX = turkey.x;
      if (canCatch && !turkey.hiding) {
        world.onCaught(f);
        return f;
      }
      if (!turkeyVisible) {
        // Lost sight: go to the last place the turkey was seen.
        f.searchX = f.lastSeenX;
        setState(f, FARMER_STATES.SEARCH, world);
      }
      break;
    }
    case FARMER_STATES.SEARCH: {
      speed = f.speed * 0.7;
      targetX = f.searchX;
      if (Math.abs(f.x - f.searchX) < 24) {
        // Arrived: look around, then check the nearest haystack if the
        // turkey vanished suspiciously close to one.
        const hay = world.haystackNear(f.x, 120);
        if (hay && turkey.hiding && turkey.hideTarget === hay) {
          setState(f, FARMER_STATES.CORNER, world);
        } else if (f.stateTime > 2.2) {
          f.patrolLeft = f.x - 160;
          f.patrolRight = f.x + 160;
          setState(f, FARMER_STATES.PATROL, world);
        }
      }
      if (turkeyVisible) {
        f.lastSeenX = turkey.x;
        setState(f, FARMER_STATES.NOTICE, world);
      }
      break;
    }
    case FARMER_STATES.CORNER: {
      // Stands at the haystack, lifts the lid... if the turkey is still
      // inside when the check lands, dinner is served.
      speed = f.speed * 0.5;
      targetX = turkey.hideTarget ? turkey.hideTarget.x : f.x;
      if (f.stateTime > 1.1) {
        if (turkey.hiding && turkey.hideTarget && Math.abs(turkey.x - f.x) < 90) {
          world.onCaught(f);
          return f;
        }
        f.patrolLeft = f.x - 160;
        f.patrolRight = f.x + 160;
        setState(f, FARMER_STATES.PATROL, world);
      }
      break;
    }
    default:
      break;
  }

  const dir = targetX > f.x + 4 ? 1 : targetX < f.x - 4 ? -1 : 0;
  if (dir !== 0) f.facing = dir;
  f.vx = dir * speed;
  f.x += f.vx * dt;
  if (Math.abs(f.vx) > 10) f.walkPhase += dt * Math.abs(f.vx) * 0.05;
  return f;
}

export function farmerBox(f) {
  return { x: f.x - f.w / 2, y: f.y - f.h, w: f.w, h: f.h };
}
