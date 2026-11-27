// Gobble Dash — shared constants and the three stages of the escape.
// One job: every number the rest of the game agrees on lives here.
export const VIEW_W = 960;
export const VIEW_H = 540;
export const GROUND_Y = 452;
export const GRAVITY = 2100;
export const TURKEY_RUN_SPEED = 250;
export const TURKEY_DASH_SPEED = 430;
export const TURKEY_JUMP_SPEED = 760;
export const TURKEY_DOUBLE_JUMP_SPEED = 640;
export const MAX_LIVES = 3;
export const STAGE_LENGTH_PX = 3600;
export const PX_PER_YARD = 4;

// Stage list: the escape runs farmyard -> barn -> kitchen -> woods gate.
export const STAGES = [
  {
    id: 'farmyard',
    name: 'STAGE 1 — THE FARMYARD',
    subtitle: 'Ezekiel is sharpening something. Run.',
    skyTop: '#f9c86e',
    skyBottom: '#f6a45c',
    ground: '#8a5a2b',
    grass: '#c98a3d',
    accent: '#d95f2b',
    length: STAGE_LENGTH_PX,
    farmerSpeed: 218,
    farmerSight: 330,
    hazardMix: ['fence', 'haybale', 'snare', 'pumpkin'],
    hazardGapMin: 340,
    hazardGapMax: 560,
    cornEvery: 260,
    intro: 'Thanksgiving is Thursday. You are the main course. NOT TODAY.',
  },
  {
    id: 'barn',
    name: 'STAGE 2 — THE BARN',
    subtitle: 'Dark, dusty, full of snares. Mabel set the traps herself.',
    skyTop: '#7a4a2e',
    skyBottom: '#4a2c1c',
    ground: '#5e3a1e',
    grass: '#7d5a30',
    accent: '#e8b23a',
    length: STAGE_LENGTH_PX,
    farmerSpeed: 236,
    farmerSight: 380,
    hazardMix: ['fence', 'haybale', 'snare', 'snare', 'knife', 'pumpkin'],
    hazardGapMin: 300,
    hazardGapMax: 500,
    cornEvery: 240,
    intro: 'The barn door is open. The knives are not the only thing falling.',
  },
  {
    id: 'kitchen',
    name: 'STAGE 3 — THE KITCHEN',
    subtitle: 'The oven is preheated to 375°F. The carving knife is out.',
    skyTop: '#b8452a',
    skyBottom: '#6e2418',
    ground: '#4a2a1a',
    grass: '#6e3a22',
    accent: '#ffb03a',
    length: STAGE_LENGTH_PX,
    farmerSpeed: 252,
    farmerSight: 420,
    hazardMix: ['oven', 'knife', 'knife', 'fence', 'snare', 'pumpkin'],
    hazardGapMin: 280,
    hazardGapMax: 470,
    cornEvery: 220,
    cornEveryPie: 900,
    intro: 'One door left: the woods gate. The oven door is NOT an option.',
  },
];

export const SCORE = {
  corn: 10,
  pie: 50,
  goldenFeather: 100,
  stageClear: 250,
  escapeBonus: 500,
  yardPerPoint: 1,
};

export const FARMERS = [
  { name: 'EZEKIEL', hat: '#7a4a21', shirt: '#3e6b34', skin: '#f0c08a', apron: '#e8e0c8' },
  { name: 'MABEL', hat: '#5a3a6e', shirt: '#8a2f2f', skin: '#f0c08a', apron: '#f2e6d0' },
];
