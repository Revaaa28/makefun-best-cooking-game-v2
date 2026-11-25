// Saffron Hour — Rooftop Kitchen: the hand-in program (Node 22, standard
// library only). The game itself is the static site in game/ — index.html
// plus its ES modules, no build step, no network. This program copies game/
// and screenshots/ into the output directory and writes dossier.json there
// with the vendored make.fun library, exactly as the kit's starter does.
//
// Run it locally the way the grader does, twice if you like — both runs
// write the same bytes:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own (see the kit's gate reference): at most 4
// screenshots of 256 KiB each, at most 993 files and 48 MiB under game/,
// no game path over 1,000 bytes, and the dossier text capped at 160 KiB.
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
