// Gobble Run — build & handover entrypoint (Node 22+, stdlib only).
// Validates gate caps on game/ and screenshots/, copies them to MAKEFUN_OUTPUT_DIR (or /output),
// generates dossier.json via vendor/makefun-game.ts, and prints a concise build summary.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function walkFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile()) {
      results.push({ path: full, size: statSync(full).size });
    }
  }
  return results;
}

function validateTree(gameDir, shotsDir) {
  if (!existsSync(join(gameDir, 'index.html'))) {
    throw new Error(`Missing ${join(gameDir, 'index.html')}`);
  }
  const gameFiles = walkFiles(gameDir);
  const gameBytes = gameFiles.reduce((sum, f) => sum + f.size, 0);

  if (gameFiles.length > CAPS.game_max_files) {
    throw new Error(`game/ file count ${gameFiles.length} exceeds cap ${CAPS.game_max_files}`);
  }
  if (gameBytes > CAPS.game_max_bytes) {
    throw new Error(`game/ byte size ${gameBytes} exceeds cap ${CAPS.game_max_bytes}`);
  }
  for (const f of gameFiles) {
    const relLen = Buffer.byteLength(relative(gameDir, f.path), 'utf8');
    if (relLen > CAPS.game_path_max_bytes) {
      throw new Error(`Path too long (${relLen} bytes): ${f.path}`);
    }
  }

  const shotFiles = existsSync(shotsDir) ? walkFiles(shotsDir) : [];
  if (shotFiles.length > CAPS.screenshots.max) {
    throw new Error(`Screenshot count ${shotFiles.length} exceeds max ${CAPS.screenshots.max}`);
  }
  for (const s of shotFiles) {
    if (s.size > CAPS.screenshots.max_bytes) {
      throw new Error(`Screenshot ${s.path} (${s.size} bytes) exceeds ${CAPS.screenshots.max_bytes}`);
    }
  }

  return { gameFiles: gameFiles.length, gameBytes, shotFiles: shotFiles.length };
}

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameSrc = join(here, 'game');
const shotsSrc = join(here, 'screenshots');

const stats = validateTree(gameSrc, shotsSrc);

rmSync(join(outDir, 'game'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsSrc)) {
  cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });
}

const dossierJson = buildDossier(outDir, CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossierJson);

const dossierBytes = Buffer.byteLength(dossierJson, 'utf8');
console.log(
  `[gobble-run] handover ready at ${outDir}: ${stats.gameFiles} game files (${stats.gameBytes} B), ${stats.shotFiles} screenshots, dossier.json (${dossierBytes} / ${CAPS.text_max_bytes} B)`,
);
