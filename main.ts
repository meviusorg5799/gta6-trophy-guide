// Leonida Trophy Guide — entrypoint.
// Copies app/ and screenshots/ into the output directory and writes
// /output/dossier.json with the kit's vendored buildDossier. Node 22,
// standard library only. MAKEFUN_OUTPUT_DIR stands in for /output
// outside the grader.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_DIR = resolve(fileURLToPath(new URL('.', import.meta.url)));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

// Fail early with a clear message when the entry is incomplete, rather
// than letting the copy step fail halfway through the output directory.
import { existsSync, statSync } from 'node:fs';
for (const needed of ['app/index.html', 'app/data/trophies.json', 'screenshots']) {
  if (!existsSync(join(REPO_DIR, needed))) {
    throw new Error(`main.ts: missing ${needed} — the entry is incomplete`);
  }
}
if (statSync(join(REPO_DIR, 'screenshots')).isFile()) {
  throw new Error('main.ts: screenshots must be a directory');
}

// Clear the output trees first so stale files from an earlier run cannot linger.
rmSync(join(OUTPUT_DIR, 'app'), { recursive: true, force: true });
rmSync(join(OUTPUT_DIR, 'screenshots'), { recursive: true, force: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

cpSync(join(REPO_DIR, 'app'), join(OUTPUT_DIR, 'app'), { recursive: true });
cpSync(join(REPO_DIR, 'screenshots'), join(OUTPUT_DIR, 'screenshots'), { recursive: true });

const dossier = buildDossier(OUTPUT_DIR, CAPS);
writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);

console.log(`Wrote ${OUTPUT_DIR}/dossier.json (${dossier.length} bytes)`);
