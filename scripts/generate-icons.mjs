// Run with Node 22.18+ and sharp available (locally or via NODE_PATH).
// All raster assets are derived from the same vector mark as the in-app logo.
import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { logoMark } from '../src/ui/logoMark.ts';

const sharp = createRequire(import.meta.url)('sharp');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = '#101214';
const colors = { body: '#F2F5F4', pips: brand, accent: '#4FE3C1' };

function svg({ background, inset = 0, monochrome = false, round = false } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 96 96">
    ${round ? '<defs><clipPath id="round"><circle cx="48" cy="48" r="48"/></clipPath></defs><g clip-path="url(#round)">' : ''}
    ${background ? `<rect width="96" height="96" fill="${background}"/>` : ''}
    <g transform="translate(${inset} ${inset}) scale(${(96 - 2 * inset) / 96})">${logoMark(colors, monochrome)}</g>
    ${round ? '</g>' : ''}
  </svg>`;
}

async function render(path, artwork, size) {
  await mkdir(dirname(path), { recursive: true });
  const pipeline = sharp(Buffer.from(artwork)).resize(size, size);
  if (path.endsWith('.webp')) await pipeline.webp({ lossless: true }).toFile(path);
  else await pipeline.png().toFile(path);
}

const assets = join(root, 'assets');
const icon = svg({ background: brand, inset: 16 });
// Adaptive icons use a 108dp canvas with the mark inside its 66dp safe circle.
const foreground = svg({ inset: 22 });
const monochrome = svg({ inset: 22, monochrome: true });
const splash = svg({ inset: 0 });
const background = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${brand}"/></svg>`;

await writeFile(join(assets, 'logo.svg'), svg());
await render(join(assets, 'icon.png'), icon, 1024);
await render(join(assets, 'android-icon-foreground.png'), foreground, 1024);
await render(join(assets, 'android-icon-monochrome.png'), monochrome, 1024);
await render(join(assets, 'android-icon-background.png'), background, 1024);
await render(join(assets, 'splash-icon.png'), splash, 1024);
await render(join(assets, 'favicon.png'), svg({ background: brand, inset: 8 }), 64);

// Keep the existing Android project in sync without running destructive prebuild.
const res = join(root, 'android', 'app', 'src', 'main', 'res');
for (const [density, scale] of Object.entries({
  mdpi: 1,
  hdpi: 1.5,
  xhdpi: 2,
  xxhdpi: 3,
  xxxhdpi: 4,
})) {
  const mipmap = join(res, `mipmap-${density}`);
  await render(join(mipmap, 'ic_launcher.webp'), icon, 48 * scale);
  await render(
    join(mipmap, 'ic_launcher_round.webp'),
    svg({ background: brand, inset: 16, round: true }),
    48 * scale,
  );
  await render(join(mipmap, 'ic_launcher_foreground.webp'), foreground, 108 * scale);
  await render(join(mipmap, 'ic_launcher_monochrome.webp'), monochrome, 108 * scale);
  await render(join(mipmap, 'ic_launcher_background.webp'), background, 108 * scale);
  await render(join(res, `drawable-${density}`, 'splashscreen_logo.png'), splash, 120 * scale);
}

console.log('Generated app, adaptive, monochrome, splash and favicon assets.');
