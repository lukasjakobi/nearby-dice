// Fails when dev-only code (src/dev: bots, scenarios) reaches a release bundle.
// `src/app/_layout.tsx` requires it behind `__DEV__`, which a production export folds to false.
import { execFileSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** `CHANNEL_PREFIX` in src/dev/Table.ts; nothing outside src/dev contains it. */
const DEV_MARKER = 'nearbydice-scenario-';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = await mkdtemp(join(tmpdir(), 'nearby-dice-release-'));

try {
  // Plain JavaScript instead of Hermes bytecode, so the bundle can be searched.
  execFileSync(
    'npx',
    ['expo', 'export', '--platform', 'android', '--no-bytecode', '--output-dir', out],
    { cwd: root, stdio: 'inherit' },
  );
  const bundles = join(out, '_expo/static/js/android');
  const leaks = [];
  for (const file of await readdir(bundles)) {
    if ((await readFile(join(bundles, file), 'utf8')).includes(DEV_MARKER)) leaks.push(file);
  }

  if (leaks.length > 0) {
    console.error(`Dev code (src/dev) is in the release bundle: ${leaks.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log('The release bundle has no dev code.');
  }
} finally {
  await rm(out, { recursive: true, force: true });
}
