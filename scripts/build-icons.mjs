// Draws the Super 3T mark once and writes every asset made from it: the header mark and favicon
// (SVG), the favicon.ico, the apple-touch and manifest icons (PNG) and the social preview (PNG).
// The outputs are committed; rerun after changing the drawing: `npm run icons`.
// Needs Playwright's Chromium (`npx playwright install chromium`) and ImageMagick (`magick`).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';
import { chromium } from '@playwright/test';

const PUBLIC = 'public';
const ICONS = join(PUBLIC, 'icons');

// Brand palette (DESIGN.md): Raven ground and tiles, Apricot Flare, Chalk.
const C = {
  ground: '#16292b',
  tile: '#0f1f21',
  tileTop: '#172c2f',
  small: '#1a3033',
  smallTop: '#22393c',
  ink: '#050b0c',
  accent: '#ff8a1f',
  light: '#ffc07a',
  chalk: '#dce6e1',
  seagrass: '#9fb3ab',
};

const THREE =
  'M-6.5 -9 H6 L-0.5 -1.5 C5 -1.5 7.5 1.5 7.5 4.8 C7.5 8.6 4.5 10.5 0.5 10.5 ' +
  'C-2.6 10.5 -5.2 9.4 -6.8 7.2';
const T = 'M31 31 H77 M54 31 V77';

/**
 * The mark on its flap tile, in a 100×100 box. `radius` rounds the tile (0 for full-bleed icons
 * the platform masks itself); `scale` shrinks the drawing around the centre to fit a safe zone.
 */
function mark({ radius = 22, scale = 1, title = true } = {}) {
  // The T with its halo and a faint light along the top edge of the bar (the bar only).
  const letter = `
    <g filter="url(#drop)" fill="none" stroke-linecap="round">
      <path d="${T}" stroke="${C.tile}" stroke-width="16"/>
      <path d="${T}" stroke="${C.accent}" stroke-width="11"/>
    </g>
    <path d="M31 27 H77" mask="url(#ink)" fill="none" stroke="${C.light}" stroke-width="3"
      stroke-linecap="round" opacity=".5"/>`;
  // The 3 on its own small tile, tilted, casting its shadow on the T.
  const digit = `
    <g transform="translate(23 25) rotate(-12)" filter="url(#drop)">
      <g clip-path="url(#small)">
        <rect x="-13" y="-15" width="26" height="30" fill="${C.small}"/>
        <rect x="-13" y="-15" width="26" height="15" fill="${C.smallTop}"/>
        <path d="${THREE}" transform="scale(0.92)" fill="none" stroke="${C.chalk}" stroke-width="3.6"
          stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="-13" y="-0.35" width="26" height="0.7" fill="${C.ink}" opacity=".85"/>
      </g>
    </g>`;
  const fit = (part) =>
    scale === 1
      ? part
      : `<g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${part}</g>`;
  // The flap's split runs edge to edge whatever the scale, cutting the T but not the 3 above it.
  const split = `<rect y="49.6" width="100" height="0.8" fill="${C.ink}" opacity=".85"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${title ? '\n  <title>Super 3T</title>' : ''}
  <defs>
    <clipPath id="tile"><rect width="100" height="100" rx="${radius}"/></clipPath>
    <filter id="drop" x="-25%" y="-25%" width="150%" height="160%">
      <feDropShadow dx="0" dy="1.6" stdDeviation="1.6" flood-color="${C.ink}" flood-opacity=".8"/>
    </filter>
    <mask id="ink"><path d="${T}" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/></mask>
    <clipPath id="small"><rect x="-13" y="-15" width="26" height="30" rx="4.5"/></clipPath>
  </defs>
  <g clip-path="url(#tile)">
    <rect width="100" height="100" fill="${C.tile}"/>
    <rect width="100" height="50" fill="${C.tileTop}"/>${fit(letter)}
    ${split}${fit(digit)}
  </g>
</svg>
`;
}

/** The small 3: about 78 % of the T's height, tilted -10°, so it stays the smaller, falling one. */
const SMALL_THREE = `<path d="M1.75 3.25 H5.75 L3.75 6.25 C5.6 6.25 6.5 7.3 6.5 8.75 C6.5 10.55 5.25 11.5 3.75 11.5 C2.7 11.5 1.9 11.05 1.5 10.25"
    fill="none" stroke="${C.chalk}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
    transform="translate(4.1 8.2) rotate(-10) scale(0.86) translate(-4 -7.4)"/>`;
const SMALL_T = `<path d="M8.25 3.75 H14.5 M11.4 3.75 V13" fill="none" stroke="${C.accent}" stroke-width="2.5" stroke-linecap="round"/>`;

/**
 * Below 48 px the full mark turns to mud, so small sizes use two drawings on a 16 px grid, with no
 * 3 tile, halo or light and thicker strokes on half pixels:
 * - SMALL_FLAT (16 px: favicon.svg in tabs, the 16 frame of favicon.ico): plain ground, since the
 *   tone split blurs the 3 at that size;
 * - SMALL_FLAP (32 and 48 px frames, the header lockup): the flap tile's two halves, with the split
 *   hairline running behind the T only, never through the 3.
 */
const SMALL_FLAT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <title>Super 3T</title>
  <rect width="16" height="16" rx="3.5" fill="${C.tile}"/>
  ${SMALL_THREE}
  ${SMALL_T}
</svg>
`;

/**
 * The small flap drawing. Up to 48 px the hairline runs behind the T only, so it never cuts the 3;
 * shown large (`large`, the social preview) the 3 cannot blur, so the split runs edge to edge as on
 * a real flap, the 3 drawn above it.
 */
const smallFlap = ({
  large = false,
} = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <title>Super 3T</title>
  <rect width="16" height="16" rx="3.5" fill="${C.tile}"/>
  <path d="M3.5 0 H12.5 A3.5 3.5 0 0 1 16 3.5 V8 H0 V3.5 A3.5 3.5 0 0 1 3.5 0 Z" fill="${C.tileTop}"/>
  ${SMALL_T}
  ${large ? '<rect y="7.94" width="16" height="0.12"' : '<rect x="8.4" y="7.88" width="7.6" height="0.24"'} fill="${C.ink}" opacity=".85"/>
  ${SMALL_THREE}
</svg>
`;
const SMALL_FLAP = smallFlap();

const font = (weight) =>
  readFileSync(
    `node_modules/@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-${weight}-normal.woff2`,
  ).toString('base64');

/**
 * The social preview, language-neutral: the app's title exactly as the header sets it, "Super"
 * followed by the small flap mark standing for "3T" (1.6em, 0.3em after the word, so the 3 fills the
 * word's cap height and the T drops below the baseline), and the game's name under it. The lockup
 * always uses the small drawing: inside the title the mark is letters, and the full mark's small 3
 * would sit in superscript ("Super³T").
 */
const og = () => `<!doctype html><html><head><style>
  @font-face { font-family: B; font-weight: 600; src: url(data:font/woff2;base64,${font(600)}) format('woff2'); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 44px; padding-bottom: 8px;
    background: radial-gradient(ellipse 70% 60% at 30% 25%, #1d3437, transparent 70%), ${C.ground};
    font-family: B, sans-serif; color: ${C.seagrass}; }
  h1 { display: flex; align-items: center; font-size: 150px; font-weight: 600; line-height: 1.15;
    color: ${C.chalk}; }
  img { width: 1.6em; height: 1.6em; margin-inline-start: 0.3em; flex: none;
    filter: drop-shadow(0 14px 28px #050b0ccc); }
  p { font-size: 54px; font-weight: 600; line-height: 1; }
</style></head><body>
  <h1>Super<img src="data:image/svg+xml;base64,${Buffer.from(smallFlap({ large: true })).toString('base64')}" alt="3T"></h1>
  <p>Ultimate Tic Tac Toe</p>
</body></html>`;

const svgPage = (svg, size) =>
  `<!doctype html><html><body style="margin:0;background:transparent">` +
  `<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${size}" height="${size}" style="display:block">` +
  `</body></html>`;

mkdirSync(ICONS, { recursive: true });
writeFileSync(join(ICONS, 'mark.svg'), mark());
writeFileSync(join(PUBLIC, 'favicon.svg'), SMALL_FLAT);
writeFileSync(join(ICONS, 'mark-small.svg'), SMALL_FLAP);

const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 1 });
const page = await context.newPage();

/** What every shipped raster says about where it comes from (Impeccable's provenance key). */
const ORIGIN =
  'Rendered by scripts/build-icons.mjs from the authored Super 3T mark (SVG drawn by hand in ' +
  'that script, no image generation): flap tiles, Apricot T with halo, Chalk 3 on a tilted tile.';

/** Adds a PNG tEXt chunk `impeccable:prompt` with the raster's origin, just before IEND. */
function embedOrigin(file, text) {
  const png = readFileSync(file);
  const data = Buffer.concat([
    Buffer.from('impeccable:prompt\0', 'latin1'),
    Buffer.from(text, 'latin1'),
  ]);
  const type = Buffer.from('tEXt', 'latin1');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
  const end = png.length - 12; // IEND: length (4), type (4), CRC (4), no data.
  writeFileSync(
    file,
    Buffer.concat([png.subarray(0, end), length, type, data, crc, png.subarray(end)]),
  );
}

async function render(html, width, height, file) {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width, height } });
  if (file.startsWith(PUBLIC)) {
    embedOrigin(file, ORIGIN);
  }
}

// "any" icons keep the rounded tile; apple-touch and maskable icons are full bleed, the platform
// masks them (maskable content stays inside the central 80 % safe circle).
await render(svgPage(mark(), 192), 192, 192, join(ICONS, 'icon-192.png'));
await render(svgPage(mark(), 512), 512, 512, join(ICONS, 'icon-512.png'));
await render(
  svgPage(mark({ radius: 0, scale: 0.7 }), 192),
  192,
  192,
  join(ICONS, 'maskable-192.png'),
);
await render(
  svgPage(mark({ radius: 0, scale: 0.7 }), 512),
  512,
  512,
  join(ICONS, 'maskable-512.png'),
);
await render(
  svgPage(mark({ radius: 0, scale: 0.9 }), 180),
  180,
  180,
  join(ICONS, 'apple-touch-icon.png'),
);
await render(og(), 1200, 630, join(PUBLIC, 'og.png'));

const scratch = join(tmpdir(), `super-3t-favicon-${process.pid}`);
mkdirSync(scratch, { recursive: true });
const sizes = [16, 32, 48];
for (const size of sizes) {
  await render(
    svgPage(size === 16 ? SMALL_FLAT : SMALL_FLAP, size),
    size,
    size,
    join(scratch, `${size}.png`),
  );
}
await browser.close();
execFileSync('magick', [
  ...sizes.map((size) => join(scratch, `${size}.png`)),
  join(PUBLIC, 'favicon.ico'),
]);
rmSync(scratch, { recursive: true, force: true });

console.log('Icons written to public/ and public/icons/.');
