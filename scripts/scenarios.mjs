import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** The `Scenario` values in src/dev/scenario.ts (Node cannot run a TypeScript enum directly). */
export async function readScenarios(root) {
  const source = await readFile(join(root, 'src/dev/scenario.ts'), 'utf8');

  return [...source.matchAll(/^\s+\w+ = '([a-z-]+)',$/gm)].map((match) => match[1]);
}
