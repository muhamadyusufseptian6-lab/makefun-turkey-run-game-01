# Gobble Dash — a turkey escape game

[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/muhamadyusufseptian6-lab/makefun-turkey-run-game-01/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/muhamadyusufseptian6-lab/makefun-turkey-run-game-01/reward.svg)](https://make.fun/c/turkey-run-game-01)

**3 stages · 2 farmers · 1 very nervous turkey.**

Thanksgiving is Thursday. You are the main course. NOT TODAY.

Giblet the turkey escapes the farmyard, sneaks through the barn, and dashes
past a preheated oven in the kitchen to reach the woods gate — chased the
whole way by Ezekiel and Mabel, two farmers with a pitchfork, a carving
knife, and strong opinions about dinner.

## How to play

Open `game/index.html` in a desktop browser (or `node serve.ts`, then
http://localhost:8080). No network, no install.

- **← → / A D** — run
- **Space** — jump (press twice: a frantic flap, a second jump)
- **Shift** — dash (drains the stamina bar)
- **S / ↓** — hide in a haystack while a farmer searches
- **M** mute · **P** pause · **R** restart

## The escape

1. **The Farmyard** — fences, snares, rolling pumpkins. Ezekiel patrols,
   notices you with a frozen half-second of disbelief, then chases.
2. **The Barn** — darker, tighter, knives start falling from the rafters.
3. **The Kitchen** — the oven is preheated to 375°F and the carving knife
   is out. Mabel is faster than Ezekiel. Reach the woods gate and
   Thanksgiving is cancelled — for you.

Eat corn (+10), grab pumpkin pie (+50), find the golden feather (+1 life).
Lose all 3 feather-lives to knives, ovens and snares — or let a farmer
touch you — and you are dinner.

## The farmers' brain

A small finite state machine, decide → steer → path:

- **Patrol** — walks its beat until the turkey is in sight.
- **Notice** — a comic half-second freeze ("HEY! MY DINNER!").
- **Chase** — runs at the turkey, slightly slower than a dash.
- **Search** — goes to the last place the turkey was seen and looks around.
- **Corner** — checks the haystack the turkey vanished beside. Still
  hiding when the lid lifts? Dinner is served.

## Files

- `game/index.html` + `game/style.css` — page shell.
- `game/src/config.js` — constants and the three stage definitions.
- `game/src/random.js` — seeded RNG, so every stage layout is deterministic.
- `game/src/input.js` — keyboard + mouse.
- `game/src/audio.js` — all sound synthesized with Web Audio (gobbles included).
- `game/src/turkey.js` — Giblet: run, jump, double-jump, dash, hide.
- `game/src/farmer.js` — the farmer chase state machine.
- `game/src/obstacles.js` — fences, hay bales, snares, knives, ovens, pumpkins, pickups.
- `game/src/stages.js` — stage layouts from seeds.
- `game/src/particles.js` — feathers, dust, sparkles, confetti.
- `game/src/render.js` — all procedural canvas art.
- `game/src/shots.js` — staged screenshot scenes (`?shot=1..4`).
- `game/src/main.js` — game loop, screens, scoring.
- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes
  `dossier.json` with the vendored make.fun library.

## Screenshots

Real renders of this game's own code, taken headless in Chromium
(`tests/shots.mjs`): title, farmyard chase, kitchen dash, escaped.

---

Built for [make.fun](https://make.fun) — turkey-run-game-01.
Referral code: `515temp1`
