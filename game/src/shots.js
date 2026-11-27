// Gobble Dash — staged scenes for screenshots. One job: put the game in
// a photogenic, deterministic pose per ?shot=N, then freeze the simulation
// so the frame the camera takes is the frame that was staged.
//   1 = title screen (the cover: turkey, farmer, knife, oven, title)
//   2 = farmyard chase: turkey mid-jump over a fence, Ezekiel on its tail
//   3 = kitchen: dash past a hot oven while Mabel chases, knife falling
//   4 = escaped end screen with the score card and confetti
import { GROUND_Y, STAGES } from './config.js';
import { FARMER_STATES } from './farmer.js';
import { makeHazard, makePickup } from './obstacles.js';
import { confetti } from './particles.js';

export function stageShot(s, n) {
  s.frozen = true;
  if (n === 1) {
    s.screen = 'title';
    return;
  }
  if (n === 4) {
    s.screen = 'escaped';
    // Backdrop: the kitchen the turkey just escaped from.
    s.stageIndex = 2;
    const stage = s.buildStage(2);
    s.stage = stage;
    s.hazards = stage.hazards;
    s.pickups = stage.pickups;
    s.farmer = stage.farmer;
    s.turkey.x = 300;
    s.farmer.x = 180;
    s.cameraX = 0;
    s.score = 2480;
    s.distanceYards = 2700;
    s.stats = { corn: 41, knivesDodged: 9, jumps: 57, dashes: 12, hides: 3 };
    s.lives = 2;
    confetti(s.particles, 480, 200);
    return;
  }

  s.screen = 'play';
  if (n === 2) {
    s.stageIndex = 0;
    const stage = s.buildStage(0);
    s.stage = stage;
    s.hazards = stage.hazards;
    s.pickups = stage.pickups;
    s.farmer = stage.farmer;
    // Turkey mid-jump over a fence, corn ahead, knife incoming.
    s.turkey.x = 940;
    s.turkey.y = GROUND_Y - 110;
    s.turkey.vy = -120;
    s.turkey.grounded = false;
    s.turkey.facing = 1;
    s.turkey.vx = 250;
    s.turkey.runPhase = 2.4;
    s.hazards.push(makeHazard('fence', 990));
    s.hazards.push(makeHazard('haybale', 830));
    const knife = makeHazard('knife', 1120, { seed: 3 });
    knife.warn = 0.35;
    knife.y = 120;
    s.hazards.push(knife);
    s.pickups.push(makePickup('corn', 1060, GROUND_Y - 120));
    s.pickups.push(makePickup('corn', 1100, GROUND_Y - 120));
    s.pickups.push(makePickup('corn', 1140, GROUND_Y - 120));
    s.farmer.x = 700;
    s.farmer.state = FARMER_STATES.CHASE;
    s.farmer.stateTime = 0.4;
    s.farmer.facing = 1;
    s.farmer.vx = 218;
    s.farmer.shout = 'HEY! MY DINNER!';
    s.farmer.shoutTime = 999;
    s.alert = 1;
    s.score = 730;
    s.distanceYards = 812;
    s.cameraX = 480;
  } else if (n === 3) {
    s.stageIndex = 2;
    const stage = s.buildStage(2);
    s.stage = stage;
    s.hazards = stage.hazards;
    s.pickups = stage.pickups;
    s.farmer = stage.farmer;
    // Dash past a hot oven, Mabel closing in, knife falling.
    s.turkey.x = 940;
    s.turkey.y = GROUND_Y;
    s.turkey.vx = 430;
    s.turkey.dashing = true;
    s.turkey.stamina = 58;
    s.turkey.facing = 1;
    s.turkey.runPhase = 4.1;
    const oven = makeHazard('oven', 1060, { seed: 5 });
    oven.doorOpen = 0.8;
    s.hazards.push(oven);
    const knife = makeHazard('knife', 1180, { seed: 9 });
    knife.warn = 0.3;
    knife.y = 90;
    s.hazards.push(knife);
    s.hazards.push(makeHazard('haybale', 820));
    s.pickups.push(makePickup('pie', 1120, GROUND_Y - 150));
    s.farmer.x = 730;
    s.farmer.state = FARMER_STATES.CHASE;
    s.farmer.stateTime = 0.8;
    s.farmer.facing = 1;
    s.farmer.vx = 252;
    s.farmer.shout = 'DINNER\'S READY!';
    s.farmer.shoutTime = 999;
    s.alert = 1;
    s.score = 1840;
    s.distanceYards = 2140;
    s.lives = 2;
    s.cameraX = 480;
  }
  s.banner = null;
}
