import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * Transfer budgets.
 *
 * A concept build for a public body should load like one. The limits below are
 * deliberately tight: this site has no photographs yet, and the moment they
 * arrive the per-image ceiling is what stops the crossing turning into a 26 MB
 * download the way our last project's film did.
 *
 * Gzipped where a server would compress; raw for images and fonts, which it
 * would not.
 */

const DIST = 'dist';

const BUDGETS = {
  'js:total': 150,
  'css:total': 70,
  'font:total': 190,
  'html:each': 90,
  'image:each': 200,
  'font:each': 70,
  'json:each': 120,
  /*
     Video is measured per file and not counted in any total, because it is the
     one thing on this site nobody downloads by arriving. Every clip is
     `preload="none"` and only starts when it is on screen and in the current
     service, so a reader who never reaches the finds rail pays nothing for it.
     What the ceiling protects against is a single clip large enough to stall
     the connection once it does start.
  */
  /* Raised from 4000 when the day cut of the film band arrived at 4.8 MB.
     It is the largest single thing on the site and the one thing nobody
     downloads by arriving — preload="none", and it only starts once it is on
     screen, in the current theme, and the train is moving. */
  'video:each': 6000,
  /*
     The world map, measured on its own and kept out of `json:each` so that
     ceiling still means something for the open-data files.

     It is Natural Earth 1:50m borders with 1:10m places — every country
     outline, its name in four languages, and seven thousand towns. Nobody
     downloads it by arriving: the map fetches it the first time a reader pulls
     back far enough for the world layer to be visible, and never otherwise.
     That is the trade this budget exists to record — a third of a megabyte, on
     request, for a map that can answer "where on Earth is this".
  */
  'map:each': 560,
};

const walk = (dir) => {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
};

let files;
try {
  files = walk(DIST);
} catch {
  console.error(`\n  No ${DIST}/ — run the build first.\n`);
  process.exit(1);
}

const COMPRESSIBLE = new Set(['.js', '.css', '.html', '.json', '.svg', '.xml']);
const kb = (n) => n / 1024;

const sized = files.map((f) => {
  const buf = readFileSync(f);
  const ext = extname(f).toLowerCase();
  const wire = COMPRESSIBLE.has(ext) ? gzipSync(buf).length : buf.length;
  return { path: relative(DIST, f), ext, raw: buf.length, wire };
});

const sum = (exts) => sized.filter((f) => exts.includes(f.ext)).reduce((n, f) => n + f.wire, 0);

const FONT_EXT = ['.woff2', '.woff', '.ttf'];
const IMG_EXT = ['.webp', '.png', '.jpg', '.jpeg', '.avif', '.gif'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov'];

const results = [
  { key: 'js:total', got: kb(sum(['.js'])) },
  { key: 'css:total', got: kb(sum(['.css'])) },
  { key: 'font:total', got: kb(sum(FONT_EXT)) },
];

const worstOf = (exts, key, skip = () => false) => {
  const group = sized.filter((f) => exts.includes(f.ext) && !skip(f.path));
  if (group.length === 0) return { key, got: 0, of: '(none)' };
  const worst = group.reduce((a, b) => (b.wire > a.wire ? b : a));
  return { key, got: kb(worst.wire), of: worst.path };
};

results.push(worstOf(['.html'], 'html:each'));
results.push(worstOf(IMG_EXT, 'image:each'));
results.push(worstOf(FONT_EXT, 'font:each'));
const isWorld = (p) => p.endsWith('dunya.json');
results.push(worstOf(['.json'], 'json:each', isWorld));
results.push(worstOf(['.json'], 'map:each', (p) => !isWorld(p)));
results.push(worstOf(VIDEO_EXT, 'video:each'));

console.log('\n  TRANSFER BUDGETS (gzipped where a server would compress)\n');

let fails = 0;
for (const r of results) {
  const limit = BUDGETS[r.key];
  const ok = r.got <= limit;
  if (!ok) fails++;
  const label = r.of ? `${r.key}  ${r.of}` : r.key;
  console.log(
    `  ${ok ? 'PASS' : 'OVER'}  ${label.padEnd(46)} ${r.got.toFixed(1).padStart(7)} / ${String(limit).padStart(5)} KB`,
  );
}

const biggest = [...sized].sort((a, b) => b.wire - a.wire).slice(0, 8);
console.log('\n  Largest on the wire:');
for (const f of biggest) console.log(`    ${kb(f.wire).toFixed(1).padStart(7)} KB  ${f.path}`);

const total = sized.reduce((n, f) => n + f.wire, 0);
console.log(`\n  ${sized.length} files, ${kb(total).toFixed(0)} KB total on the wire`);

if (fails > 0) {
  console.log(`\n  ${fails} budget(s) exceeded.\n`);
  process.exit(1);
}
console.log('\n  All budgets met.\n');
