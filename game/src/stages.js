// Gobble Dash — stage layouts. One job: build one stage's world from its
// seed (hazards, haystacks, corn, pies, farmer start) and know when the
// turkey has crossed it.
import { STAGES, GROUND_Y, PX_PER_YARD } from './config.js';
import { mulberry32, range, pick } from './random.js';
import { makeHazard, makePickup } from './obstacles.js';
import { createFarmer, FARMER_STATES } from './farmer.js';
import { FARMERS } from './config.js';

export function buildStage(index) {
  const def = STAGES[index];
  const rng = mulberry32(0x9e3779b9 + index * 7919 + 137);
  const hazards = [];
  const pickups = [];
  let x = 520;
  let n = 0;
  while (x < def.length - 420) {
    const kind = pick(rng, def.hazardMix);
    hazards.push(makeHazard(kind, x, { seed: n * 13 + index * 7 }));
    // A hay bale is a hide spot; keep one in most gaps in stages 1-2.
    if (kind !== 'haybale' && rng() < 0.45) {
      hazards.push(makeHazard('haybale', x + range(rng, 150, 240), { seed: n * 5 + 3 }));
    }
    x += range(rng, def.hazardGapMin, def.hazardGapMax);
    n++;
  }
  // Corn trail: a dotted line of snacks to follow.
  for (let cx = 380; cx < def.length - 300; cx += def.cornEvery) {
    const yy = rng() < 0.3 ? GROUND_Y - 120 : GROUND_Y - 44;
    pickups.push(makePickup('corn', cx + range(rng, -30, 30), yy));
  }
  // One pie per stage, high up where a double-jump earns it.
  pickups.push(makePickup('pie', def.length * (0.35 + rng() * 0.3), GROUND_Y - 150));
  // One golden feather per stage, far along, worth a life.
  pickups.push(makePickup('goldenFeather', def.length * (0.6 + rng() * 0.25), GROUND_Y - 130));

  // Falling knives are placed above the path, not on it.
  const knifeCount = def.hazardMix.includes('knife') ? 5 + index * 2 : 0;
  for (let i = 0; i < knifeCount; i++) {
    const kx = range(rng, 700, def.length - 500);
    hazards.push(makeHazard('knife', kx, { seed: i * 29 + index }));
  }

  const farmerDef = FARMERS[Math.min(index, FARMERS.length - 1)];
  const farmer = createFarmer(farmerDef, 60, def.farmerSpeed, def.farmerSight);
  farmer.patrolLeft = 40;
  farmer.patrolRight = 420;

  return { def, hazards, pickups, farmer, startX: 120 };
}

export function stageDistanceYards(stageIndex, turkeyX) {
  const done = stageIndex * STAGES[0].length;
  return Math.floor((done + Math.max(0, turkeyX - 120)) / PX_PER_YARD);
}

export function totalYards() {
  return Math.floor((STAGES.length * STAGES[0].length) / PX_PER_YARD);
}
