import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

/**
 * Build public/veri/dunya.json — the world, in this map's own coordinates.
 *
 * WHY THE SAME COORDINATES
 * The map already has one projection: Web Mercator, normalised so the İstanbul
 * window is 100 units wide. Applying that same formula to any point on Earth
 * gives a position in the same space — a very large number, but the same
 * space. So the world is not a second map that has to be swapped in, it is the
 * same map seen from further away, and zooming between them is one continuous
 * movement rather than a mode change.
 *
 * One degree of longitude is about 108.7 units here, so the whole world is
 * roughly 39,000 units across: a zoom range of about 1:5400 from the network
 * to the planet, which SVG handles without complaint because every path is
 * re-rasterised at the size it is drawn.
 *
 * WHY A FILE AND NOT A MODULE
 * It used to be `src/data/world.ts`, which meant Natural Earth's geometry was
 * bundled into the map's JavaScript and counted against a 150 KB budget. At
 * 110m coastline-only that was survivable. At 50m with borders, names and
 * cities it is not, and the honest fix is not to ship less map — it is to stop
 * shipping the map as code. It is data, it is fetched the first time a reader
 * pulls back far enough to want it, and it is cached like the picture it is.
 *
 * WHAT IS IN IT
 *   countries  outline and border of every admin-0 country, its label anchor,
 *              its name in all four of this site's languages, and the width of
 *              view at which that name starts being worth drawing
 *   lakes      the large ones, painted in the sea colour
 *   cities     populated places, with the same view-width threshold
 *
 * Sources, all Natural Earth 1:50m, all public domain:
 *   ne_50m_admin_0_countries, ne_50m_lakes, ne_10m_populated_places_simple
 *
 *   node scripts/build-world.mjs .cache
 */
const DIR = process.argv[2] ?? '.cache';
/**
 * Simplification tolerance, in degrees. 0.015 degrees is about 1.7 km.
 *
 * It was 0.04 — four and a half kilometres — which is invisible at planet zoom
 * and embarrassing at regional zoom, where the Sea of Marmara came out as a
 * couple of straight diagonals under an accurate İstanbul coastline. The world
 * layer is now the ground at every scale between the two, so it has to hold up
 * at the scale a country fills the frame, not only at the scale a continent
 * does.
 */
const EPS = Number(process.argv[3] ?? 0.015);

const W_LON = 28.6,
  E_LON = 29.52,
  N_LAT = 41.31;

const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));
const XS = 100 / (E_LON - W_LON);
const YS = XS * (180 / Math.PI);
const Y1 = merc(N_LAT);
// Mercator runs to infinity at the poles; clamp where every atlas clamps.
const LAT_MAX = 83;
const px = (lat, lon) => [
  (lon - W_LON) * XS,
  (Y1 - merc(Math.max(-LAT_MAX, Math.min(LAT_MAX, lat)))) * YS,
];

// ---------------------------------------------------------------- simplify
/**
 * Ramer–Douglas–Peucker, iteratively.
 *
 * The recursive form is shorter and blows the stack: a 50m coastline ring can
 * be twenty thousand points long and Canada is worse than that.
 */
function rdp(pts, eps) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop();
    let maxD = 0,
      idx = -1;
    for (let i = lo + 1; i < hi; i++) {
      const d = perp(pts[i], pts[lo], pts[hi]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > eps && idx > 0) {
      keep[idx] = 1;
      stack.push([lo, idx], [idx, hi]);
    }
  }
  const out = [];
  for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i]);
  return out;
}
function perp(p, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const den = dx * dx + dy * dy;
  if (den === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / den));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

const f1 = (n) => Number(n.toFixed(1));
const ringArea = (r) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++)
    a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]);
  return Math.abs(a / 2);
};

/** One SVG path from every ring of a feature, projected and de-duplicated. */
function toPath(polys, eps, minArea = 0) {
  let d = '';
  for (const poly of polys) {
    for (const ring of poly) {
      if (ringArea(ring) < minArea) continue;
      const simple = rdp(ring, eps);
      if (simple.length < 4) continue;
      let last = null,
        seg = '';
      for (const [lon, lat] of simple) {
        const [x, y] = px(lat, lon).map(f1);
        if (last && last[0] === x && last[1] === y) continue;
        seg += (seg === '' ? 'M' : 'L') + x + ',' + y;
        last = [x, y];
      }
      if (seg.length > 12) d += seg + 'Z';
    }
  }
  return d;
}
const ringsOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);

// ----------------------------------------------------------------- countries
/**
 * At what view width a name is worth drawing.
 *
 * Natural Earth's LABELRANK is an editor's judgement about how prominent a
 * country is on a printed map: 1 for Russia, 8 for Liechtenstein. Turning it
 * into a threshold in degrees of visible longitude makes the map fill in the
 * way an atlas does as you lean closer — continents first, then the countries
 * inside them, then the ones you have to look for.
 */
const RANK_DEG = [400, 400, 400, 330, 190, 110, 60, 32, 18, 10, 6];
const degFor = (rank, table) => table[Math.max(0, Math.min(table.length - 1, rank | 0))];

const countriesGeo = JSON.parse(readFileSync(`${DIR}/countries.json`, 'utf8'));
const countries = [];
for (const f of countriesGeo.features) {
  const p = f.properties;
  const d = toPath(ringsOf(f.geometry), EPS, 0.02);
  if (!d) continue;
  const anchor = px(p.LABEL_Y ?? 0, p.LABEL_X ?? 0);
  countries.push({
    d,
    // Natural Earth ships a hand-placed label anchor. A polygon centroid puts
    // Norway's name in the North Sea and Chile's in Argentina.
    x: f1(anchor[0]),
    y: f1(anchor[1]),
    t: degFor(p.LABELRANK ?? 5, RANK_DEG),
    n: {
      en: p.NAME_EN || p.NAME,
      tr: p.NAME_TR || p.NAME,
      ar: p.NAME_AR || p.NAME,
      ru: p.NAME_RU || p.NAME,
    },
  });
}

// --------------------------------------------------------------------- lakes
const lakesGeo = JSON.parse(readFileSync(`${DIR}/ne_50m_lakes.json`, 'utf8'));
const lakes = [];
for (const f of lakesGeo.features) {
  // The small ones are subpixel at every zoom this layer is visible at, and
  // four hundred of them would be a quarter of the file for nothing.
  if ((f.properties.scalerank ?? 9) > 2) continue;
  const d = toPath(ringsOf(f.geometry), EPS, 0.05);
  if (d) lakes.push(d);
}

// -------------------------------------------------------------------- cities
/**
 * Population, not scalerank.
 *
 * Natural Earth's `scalerank` for places is lumpy — three thousand towns share
 * rank 7 and exactly two are rank 5 — so using it as a ladder gives a map that
 * shows nothing and then everything. Population is continuous and is what a
 * reader is actually asking about when they wonder whether a dot is worth a
 * name, so the threshold comes off `pop_max`, in the same units as the country
 * table: the width of view, in degrees, at which this place starts being drawn.
 *
 * The 1:10m set, not the 1:50m one. The 50m file has 1,251 places on Earth,
 * which is Bursa and nothing else within a hundred and fifty kilometres of
 * İstanbul — so at regional zoom the map was an accurate coastline with no
 * places on it. 10m has 7,342, which is İzmit, Tekirdağ, Edirne, Bolu and
 * Çanakkale where they belong.
 */
const POP_DEG = [
  [8e6, 400],
  [4e6, 280],
  [2e6, 180],
  [1e6, 100],
  [5e5, 55],
  [25e4, 30],
  [1e5, 16],
  [5e4, 9],
  [0, 5],
];
const placesGeo = JSON.parse(
  readFileSync(`${DIR}/ne_10m_populated_places_simple.json`, 'utf8'),
);
const cities = [];
for (const f of placesGeo.features) {
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  // İstanbul has its own marker here. It is the subject, not a dot.
  if (/^istanbul$/i.test(p.nameascii ?? '')) continue;
  const pop = p.pop_max ?? 0;
  let t = POP_DEG[POP_DEG.length - 1][1];
  for (const [floor, deg] of POP_DEG)
    if (pop >= floor) {
      t = deg;
      break;
    }
  // A national capital earns its name earlier than its population does. Bern
  // is smaller than a hundred towns nobody outside them has heard of.
  if (p.adm0cap) t = Math.min(400, t * 2.4);
  const at = px(lat, lon);
  cities.push({
    x: f1(at[0]),
    y: f1(at[1]),
    t: Number(t.toFixed(1)),
    n: p.name ?? p.nameascii,
    c: p.adm0cap ? 1 : 0,
  });
}
// Widest threshold first, so the drawing order is importance order and a
// capital never lands on top of a bigger neighbour's name.
cities.sort((a, b) => b.t - a.t);

// --------------------------------------------------------------------- write
const out = {
  note: 'Natural Earth 1:50m, public domain. Projected with this map’s own Web Mercator: one unit is 1/108.7 of a degree of longitude. Generated by scripts/build-world.mjs.',
  unitsPerDeg: Number(XS.toFixed(4)),
  worldW: f1(360 * XS),
  istanbul: { x: f1(px(41.02, 29.05)[0]), y: f1(px(41.02, 29.05)[1]) },
  // The left edge of one copy of the planet, so the map knows which of the
  // repeated copies is on screen and can skip drawing the other two.
  x0: f1(px(0, -180)[0]),
  countries,
  lakes,
  cities,
};
mkdirSync('public/veri', { recursive: true });
const json = JSON.stringify(out);
writeFileSync('public/veri/dunya.json', json);

const ts = [
  '/**',
  ' * The numbers the camera needs before the world has been fetched.',
  ' *',
  " * Everything else — every coastline, border, lake, country name and city —",
  ' * is in `public/veri/dunya.json`, requested the first time a reader pulls',
  ' * back far enough to want it. Geometry is data, not code: bundling Natural',
  " * Earth into the map's JavaScript put most of a megabyte behind a 150 KB",
  ' * budget for a layer most readers never open.',
  ' *',
  ' * These cannot wait for a fetch, because the zoom floor is derived from the',
  ' * width of the planet and the camera has to be clamped on the first frame.',
  ' *',
  ' * GENERATED by scripts/build-world.mjs. Natural Earth is public domain.',
  ' */',
  '',
  '/** Where the network sits, for the marker drawn at world zoom. */',
  `export const ISTANBUL = { x: ${out.istanbul.x}, y: ${out.istanbul.y} };`,
  '',
  '/** The whole planet, in these units: 360 degrees of longitude. */',
  `export const WORLD_W = ${out.worldW};`,
  '',
  '/** The left edge of one copy of it: the meridian at 180 degrees west. */',
  `export const WORLD_X0 = ${out.x0};`,
  '',
  '/** Units per degree of longitude, for turning a view width into a scale. */',
  `export const UNITS_PER_DEG = ${out.unitsPerDeg};`,
  '',
  '/** Where the rest of it lives. */',
  "export const WORLD_URL = '/veri/dunya.json';",
  '',
  'export interface WorldCountry {',
  '  d: string;',
  '  x: number;',
  '  y: number;',
  '  /** Draw the name once the view is narrower than this many degrees. */',
  '  t: number;',
  '  n: { en: string; tr: string; ar: string; ru: string };',
  '}',
  'export interface WorldCity {',
  '  x: number;',
  '  y: number;',
  '  t: number;',
  '  n: string;',
  '  /** 1 if it is a national capital. */',
  '  c: number;',
  '}',
  'export interface WorldData {',
  '  countries: WorldCountry[];',
  '  lakes: string[];',
  '  cities: WorldCity[];',
  '}',
  '',
].join('\n');
writeFileSync('src/data/world.ts', ts);

console.log(
  'countries',
  countries.length,
  'lakes',
  lakes.length,
  'cities',
  cities.length,
  'json KB',
  Math.round(json.length / 1024),
);
