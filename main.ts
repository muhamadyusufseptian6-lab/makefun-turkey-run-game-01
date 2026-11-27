// Gobble Dash — entry program (Node 22, standard library only).
// Copies this directory's game/ and screenshots/ to /output and writes
// /output/dossier.json with the vendored make.fun library, exactly as the
// kit's starter does. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// Copy game/ fresh, skipping dotfiles (the scorer refuses an output that
// holds one) and symlinks (the gate refuses those too).
function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src, { withFileTypes: true })) {
    if (name.name.startsWith('.')) continue;
    if (name.isSymbolicLink()) continue;
    const from = join(src, name.name);
    const to = join(dest, name.name);
    if (name.isDirectory()) copyTree(from, to);
    else if (name.isFile()) cpSync(from, to);
  }
}

const outGame = join(out, 'game');
if (existsSync(outGame)) rmSync(outGame, { recursive: true, force: true });
copyTree(join(here, 'game'), outGame);

const outShots = join(out, 'screenshots');
if (existsSync(outShots)) rmSync(outShots, { recursive: true, force: true });
mkdirSync(outShots, { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  copyTree(join(here, 'screenshots'), outShots);
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files, in
// all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
