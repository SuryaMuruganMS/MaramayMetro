import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

/**
 * Ground-truth screenshots.
 *
 * The embedded preview pane could not capture this page - it returned a flat
 * fill even for elements outside the animated subtree, which is a capture
 * failure rather than a paint failure. A real headless Chromium settles it.
 *
 * Usage: node scripts/shot.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? 'http://localhost:4330';
const OUT = 'shots';
mkdirSync(OUT, { recursive: true });

/**
 * Targets are the STATION chainages, which are each panel's left edge - the
 * only position at which a panel is fully in frame. Aiming at a panel's
 * midpoint photographs the gap between two panels, which is what the first
 * run of this script did.
 */
const SHOTS = [
  { name: '01-open', ch: null },
  { name: '02-kazlicesme', ch: 0 },
  { name: '03-run-descent', ch: 1600 },
  { name: '04-yenikapi', ch: 3000 },
  { name: '05-sirkeci', ch: 5250 },
  { name: '06-approach', ch: 5650 },
  { name: '07b-divide', ch: 6700 },
  { name: '07-crossing', ch: 6200 },
  { name: '08-uskudar', ch: 7900 },
  { name: '09-ayrilik', ch: 9600 },
  { name: '10-sogutlucesme', ch: 13_400 },
  { name: '11-arrival', ch: 13_600 },
];

const browser = await chromium.launch();

for (const service of ['day', 'night']) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 860 },
    deviceScaleFactor: 1,
    locale: 'tr-TR',
  });
  const page = await ctx.newPage();

  for (const s of SHOTS) {
    const url = s.ch === null ? BASE : `${BASE}/?ch=${s.ch}`;
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate((svc) => {
      document.documentElement.setAttribute('data-service', svc);
      try {
        localStorage.setItem('marmaray-service', svc);
      } catch {
        /* ignore */
      }
    }, service);
    if (s.extra) await page.evaluate((n) => window.scrollBy(0, n), s.extra);
    // Two frames: one for the scroll-driven animation to settle, one to paint.
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
    await page.waitForTimeout(220);
    await page.screenshot({ path: `${OUT}/${service}-${s.name}.png` });
  }
  await ctx.close();
}

await browser.close();
console.log(`\n  ${SHOTS.length * 2} screenshots in ${OUT}/\n`);
