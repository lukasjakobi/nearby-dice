// Screenshots of the web build for agents and reviewers (docs/technical-design.md, Browser harness).
//
//   npm run web:shot -- game-my-turn                 a scenario (see --list)
//   npm run web:shot -- game-six-players --tap Spielstand
//   npm run web:shot -- home --param radio=bluetooth-off --tap Beitreten
//   options: --dark  --en  --size 390x844  --seed 7  --param key=value  --out .screenshots
//
// Uses the dev server on WEB_URL (default http://localhost:8081) and starts one if none answers.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { chromium } from '@playwright/test';

import { readScenarios } from './scenarios.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = process.env.WEB_URL ?? 'http://localhost:8081';
const SERVER_TIMEOUT_MS = 180_000;
const SCENARIO_TIMEOUT_MS = 90_000;
/** Lets a tap's sheet or screen change finish before the next step. */
const SETTLE_MS = 800;
/** react-native-svg hands `accessible` to the DOM; React reports it on every web screen. */
const KNOWN_NOISE = ['for a non-boolean attribute'];

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    list: { type: 'boolean' },
    param: { type: 'string', multiple: true, default: [] },
    tap: { type: 'string', multiple: true, default: [] },
    dark: { type: 'boolean' },
    en: { type: 'boolean' },
    size: { type: 'string', default: '390x844' },
    seed: { type: 'string' },
    out: { type: 'string', default: '.screenshots' },
  },
});

async function answers(url) {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

/** Starts `expo start --web` unless a server already answers; returns a stop function. */
async function ensureServer() {
  if (await answers(baseUrl)) return () => {};
  const port = new URL(baseUrl).port || '8081';
  console.log(`Starting the web dev server on ${baseUrl} …`);
  const server = spawn('npx', ['expo', 'start', '--web', '--port', port], {
    cwd: root,
    stdio: 'ignore',
    detached: true,
  });
  const deadline = Date.now() + SERVER_TIMEOUT_MS;
  while (!(await answers(baseUrl))) {
    if (Date.now() > deadline) throw new Error(`No web server on ${baseUrl}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return () => process.kill(-server.pid);
}

async function shoot(page, url) {
  const problems = [];
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !KNOWN_NOISE.some((noise) => text.includes(noise)))
      problems.push(`console error: ${text}`);
  });

  await page.goto(url);
  const settled = page.locator('html[data-scenario="ready"], html[data-scenario="failed"]');
  await settled.waitFor({ state: 'attached', timeout: SCENARIO_TIMEOUT_MS });
  if ((await page.locator('html').getAttribute('data-scenario')) === 'failed') {
    const detail = await page.locator('html').getAttribute('data-scenario-error');
    throw new Error(`The scenario failed: ${detail}`);
  }

  await page.evaluate(() => document.fonts.ready);
  // The launch splash covers the first 1.5 s after load.
  await page.waitForFunction(() => performance.now() > 2000);
  await page.waitForTimeout(SETTLE_MS);
  for (const name of values.tap) {
    // Screens left behind stay in the DOM, hidden.
    await page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
    await page.waitForTimeout(SETTLE_MS);
  }

  return problems;
}

async function main() {
  const known = await readScenarios(root);
  if (values.list) {
    console.log(known.join('\n'));

    return;
  }

  const [scenario] = positionals;
  if (!known.includes(scenario)) throw new Error(`Name a scenario: ${known.join(', ')}`);

  const [width, height] = values.size.split('x').map(Number);
  const url = new URL('/', baseUrl);
  url.searchParams.set('scenario', scenario);
  if (values.seed) url.searchParams.set('seed', values.seed);
  for (const param of values.param) url.searchParams.set(...param.split('='));
  const name = [
    scenario,
    ...values.param.map((param) => param.replace('=', '-')),
    ...values.tap.map((label) => label.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-')),
    values.dark && 'dark',
    values.en && 'en',
  ]
    .filter(Boolean)
    .join('-');
  const file = join(root, values.out, `${name}.png`);

  const stopServer = await ensureServer();
  // The headless shell crashes on this app; full Chromium runs headless too.
  const browser = await chromium.launch({ channel: 'chromium' });
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      locale: values.en ? 'en-US' : 'de-DE',
      colorScheme: values.dark ? 'dark' : 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const problems = await shoot(page, url.href);
    await mkdir(dirname(file), { recursive: true });
    await page.screenshot({ path: file });
    console.log(relative(process.cwd(), file));
    for (const problem of problems) console.warn(problem);
  } finally {
    await browser.close();
    stopServer();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
