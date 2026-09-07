import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Build src/data/geography.ts from raw OpenStreetMap extracts.
 *
 * Run by hand, and commit the result. The site is static and this is survey
 * data that changes on a scale of decades; fetching it during `npm run build`
 * would add a network dependency in exchange for nothing.
 *
 * It is kept in the repository because the alternative — a generated file with
 * no generator — is a file nobody can ever correct. To rebuild it, fetch the
 * two extracts into this directory and run the script:
 *
 *   curl -X POST https://overpass-api.de/api/interpreter --data-urlencode  *     'data=[out:json][timeout:250];
 *      way["natural"="coastline"](40.70,28.50,41.35,29.60); out geom;' > coast.json
 *
 *   curl -X POST https://overpass-api.de/api/interpreter --data-urlencode  *     'data=[out:json][timeout:200];
 *      (way["natural"="water"]["name"](40.74,28.60,41.31,29.52);
 *       relation["natural"="water"]["name"](40.74,28.60,41.31,29.52);); out geom;' > water.json
 *
 *   node scripts/build-geography.mjs [simplification-in-degrees]
 *
 * The station coordinates below were picked by hand from a third Overpass
 * query for railway stations in the same box: several names appear more than
 * once and only a person can say which platform a node means.
 */

const W_LON = 28.6,
  E_LON = 29.52,
  S_LAT = 40.74,
  N_LAT = 41.31;
const EPS = Number(process.argv[2] ?? 0.0009);

// --------------------------------------------------------------- projection
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));
const XS = 100 / (E_LON - W_LON);
const YS = XS * (180 / Math.PI);
const Y1 = merc(N_LAT);
const H = (Y1 - merc(S_LAT)) * YS;
const px = (lat, lon) => [(lon - W_LON) * XS, (Y1 - merc(lat)) * YS];
const f = (n) => Number(n.toFixed(2));

// ---------------------------------------------------------------- utilities
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let maxD = 0,
    idx = 0;
  const a = pts[0],
    b = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perp(pts[i], a, b);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= eps) return [a, b];
  return rdp(pts.slice(0, idx + 1), eps)
    .slice(0, -1)
    .concat(rdp(pts.slice(idx), eps));
}
function perp(p, a, b) {
  const dx = b.lon - a.lon,
    dy = b.lat - a.lat;
  const den = dx * dx + dy * dy;
  if (den === 0) return Math.hypot(p.lon - a.lon, p.lat - a.lat);
  const t = Math.max(0, Math.min(1, ((p.lon - a.lon) * dx + (p.lat - a.lat) * dy) / den));
  return Math.hypot(p.lon - (a.lon + t * dx), p.lat - (a.lat + t * dy));
}

const near = (a, b, tol = 2e-4) =>
  Math.abs(a.lat - b.lat) < tol && Math.abs(a.lon - b.lon) < tol;

const path = (pts, close) => {
  let d = '',
    last = null;
  for (const p of pts) {
    const [x, y] = px(p.lat, p.lon).map(f);
    if (last && last[0] === x && last[1] === y) continue;
    d += (d === '' ? 'M' : 'L') + x + ',' + y;
    last = [x, y];
  }
  return d + (close ? 'Z' : '');
};

// =========================================================== COASTLINE ======
let chains = JSON.parse(readFileSync('coast.json', 'utf8'))
  .elements.filter((w) => w.geometry?.length > 1)
  .map((w) => w.geometry.slice());

// Stitch with a tolerance. Exact matching left the European coast in two
// pieces, which would have closed into two overlapping land polygons.
for (let pass = 0; pass < 12; pass++) {
  let joined = false;
  for (let i = 0; i < chains.length; i++) {
    const a = chains[i];
    if (!a) continue;
    for (let j = 0; j < chains.length; j++) {
      if (i === j) continue;
      const b = chains[j];
      if (!b) continue;
      if (near(a[a.length - 1], b[0])) {
        chains[i] = a.concat(b.slice(1));
        chains[j] = null;
        joined = true;
        break;
      }
    }
  }
  chains = chains.filter(Boolean);
  if (!joined) break;
}

// Clip to the window, splitting where a coast leaves and returns.
const inBox = (p) => p.lon >= W_LON && p.lon <= E_LON && p.lat >= S_LAT && p.lat <= N_LAT;
const clipped = [];
for (const c of chains) {
  let run = [];
  for (const p of c) {
    if (inBox(p)) run.push(p);
    else {
      if (run.length > 2) clipped.push(run);
      run = [];
    }
  }
  if (run.length > 2) clipped.push(run);
}

const simplified = clipped
  .map((c) => rdp(c, EPS))
  .filter((c) => c.length > 3)
  .map((c) => {
    const lons = c.map((p) => p.lon),
      lats = c.map((p) => p.lat);
    return {
      pts: c,
      span: Math.max(
        Math.max(...lons) - Math.min(...lons),
        Math.max(...lats) - Math.min(...lats),
      ),
    };
  })
  .filter((c) => c.span > 0.008)
  .sort((a, b) => b.span - a.span);

const isRing = (c) => near(c.pts[0], c.pts[c.pts.length - 1], 1e-5);

/**
 * Close an open coast against the window edge.
 *
 * OSM draws coastline with LAND ON THE LEFT, so the land polygon is the way
 * followed forwards and then the window boundary walked anticlockwise (in
 * lon/lat, where north is up) from the way's end back to its start. Walking the
 * other way round would fill the sea instead.
 */
const CORNERS = [
  { lon: E_LON, lat: S_LAT },
  { lon: E_LON, lat: N_LAT },
  { lon: W_LON, lat: N_LAT },
  { lon: W_LON, lat: S_LAT },
];
function edgeT(p) {
  const eS = Math.abs(p.lat - S_LAT),
    eN = Math.abs(p.lat - N_LAT),
    eW = Math.abs(p.lon - W_LON),
    eE = Math.abs(p.lon - E_LON);
  const m = Math.min(eS, eN, eW, eE);
  if (m === eS) return 0 + (p.lon - W_LON) / (E_LON - W_LON); // bottom, W→E
  if (m === eE) return 1 + (p.lat - S_LAT) / (N_LAT - S_LAT); // right, S→N
  if (m === eN) return 2 + (E_LON - p.lon) / (E_LON - W_LON); // top, E→W
  return 3 + (N_LAT - p.lat) / (N_LAT - S_LAT); // left, N→S
}
function closeToLand(pts) {
  const tEnd = edgeT(pts[pts.length - 1]);
  const tStart = edgeT(pts[0]);
  const out = pts.slice();
  let t = Math.ceil(tEnd + 1e-9);
  let guard = 0;
  const target = tStart > tEnd ? tStart : tStart + 4;
  while (t < target && guard++ < 8) {
    out.push(CORNERS[(t - 1 + 4) % 4]);
    t += 1;
  }
  return out;
}

const openChains = simplified.filter((c) => !isRing(c));
const rings = simplified.filter(isRing);

const land = openChains.map((c) => path(closeToLand(c.pts), true));
const islands = rings.map((c) => path(c.pts, true));
// The visible shoreline, stroked separately so it can be a hairline that does
// not follow the window edge the fills are closed along.
const shore = openChains.map((c) => path(c.pts, false));

// =============================================================== LAKES ======
const waterRaw = JSON.parse(readFileSync('water.json', 'utf8'));
const ringArea = (g) => {
  let a = 0;
  for (let i = 0; i < g.length; i++) {
    const p = g[i],
      q = g[(i + 1) % g.length];
    a += p.lon * q.lat - q.lon * p.lat;
  }
  return Math.abs(a / 2);
};
/**
 * One shape per lake, not one per fragment.
 *
 * A reservoir in OSM is a multipolygon whose outer ring arrives as a dozen
 * separate ways, and pushing each of them produced nine shapes all called
 * Ömerli Baraj Gölü. Only the largest closed ring of each named body is kept,
 * which at this scale is the lake and the rest is detail below the line width.
 * Watercourses are excluded outright: a river drawn as a filled blob is a lie
 * about its shape.
 */
const SKIP = /Deresi|Çayı|Nehri/;
const byName = new Map();
for (const e of waterRaw.elements) {
  const name = e.tags?.name;
  if (!name || SKIP.test(name)) continue;
  const parts =
    e.type === 'way' && e.geometry
      ? [e.geometry]
      : (e.members ?? [])
          .filter((m) => m.role === 'outer' && m.geometry)
          .map((m) => m.geometry);
  for (const g of parts) {
    const a = ringArea(g);
    if (a < 2e-4) continue;
    const prev = byName.get(name);
    if (!prev || a > prev.a) byName.set(name, { a, g });
  }
}
const lakes = [];
for (const [name, { g }] of byName) {
  const s = rdp(g, EPS);
  if (s.length < 4) continue;
  lakes.push({ name, d: path(s, true) });
}

// =========================================================== STATIONS =======
/**
 * Chosen by hand from the Overpass results, because several names appear more
 * than once: the M3 and Marmaray both call somewhere named Bakırköy, and they
 * are two kilometres apart. Each of these is the platform our node represents.
 */
const STATION_LL = {
  halkali: [41.0184, 28.7665],
  bakirkoy: [40.9804, 28.8724],
  kazlicesme: [40.9927, 28.9169],
  yenikapi: [41.0052, 28.9516],
  sirkeci: [41.0136, 28.9771],
  uskudar: [41.0256, 29.0131],
  'ayrilik-cesmesi': [41.0001, 29.0303],
  sogutlucesme: [40.9906, 29.0379],
  bostanci: [40.9539, 29.0949],
  pendik: [40.8802, 29.2317],
  gebze: [40.7839, 29.4108],
  vezneciler: [41.0123, 28.9597],
  sishane: [41.0283, 28.9727],
  taksim: [41.0368, 28.9866],
  mecidiyekoy: [41.0652, 28.9955],
  gayrettepe: [41.069, 29.0111],
  levent: [41.0769, 29.0138],
  hacisoman: [41.1398, 29.0305],
  kirazli: [41.0318, 28.8423],
  ataturk: [40.9797, 28.8211],
  otogar: [41.0402, 28.8946],
  kayasehir: [41.1191, 28.7663],
  mahmutbey: [41.0551, 28.8306],
  atakoy: [40.9802, 28.8562],
  olimpiyat: [41.0796, 28.7672],
  hisarustu: [41.0851, 29.0456],
  'ist-havalimani': [41.2559, 28.7426],
  yildiz: [41.0541, 29.0097],
  karakoy: [41.0229, 28.974],
  kadikoy: [40.9906, 29.022],
  kozyatagi: [40.9754, 29.0997],
  kartal: [40.8887, 29.1911],
  sabiha: [40.9066, 29.3115],
  unalan: [40.9981, 29.06],
  samandira: [40.9837, 29.2314],
  umraniye: [41.0246, 29.0848],
  parseller: [41.0312, 29.1527],
  'bostanci-m8': [40.9789, 29.1119],
};

const MARMARAY_KM = 76.6;
const SPINE_IDS = [
  'halkali',
  'bakirkoy',
  'kazlicesme',
  'yenikapi',
  'sirkeci',
  'uskudar',
  'ayrilik-cesmesi',
  'sogutlucesme',
  'bostanci',
  'pendik',
  'gebze',
];

const stations = Object.fromEntries(
  Object.entries(STATION_LL).map(([id, [lat, lon]]) => {
    const [x, y] = px(lat, lon);
    return [id, { lat, lon, x: f(x), y: f(y) }];
  }),
);

// ================================================================ EMIT ======
const ts = `/**
 * REAL GEOGRAPHY.
 *
 * Everything in this file is measured, not drawn by eye. The coastline is
 * OpenStreetMap's, simplified to about ${Math.round(EPS * 111000)} metres so it fits in a page; the
 * station positions are the platforms' own coordinates from the same source.
 *
 * That is the point of it. The schematic diagram elsewhere on this site is a
 * deliberate distortion - Beck's trade, legibility for geography - and the only
 * way to show what the distortion COSTS is to have the truth to morph against.
 *
 * GENERATED. Rebuilt by hand from an Overpass extract, not at build time: this
 * is survey data that changes on a scale of decades, and fetching it during
 * \`npm run build\` would buy nothing for a network dependency.
 *
 * Source: OpenStreetMap contributors, ODbL. Attributed on /kaynaklar.
 */

/** The window, in degrees. Wide enough for Gebze and İstanbul Havalimanı. */
export const WINDOW = {
  west: ${W_LON},
  east: ${E_LON},
  south: ${S_LAT},
  north: ${N_LAT},
} as const;

/** The drawing is 100 units across; Web Mercator sets the height. */
export const GEO_W = 100;
export const GEO_H = ${f(H)};

/**
 * Land, as filled polygons.
 *
 * OSM coastline is directed with land on the left and is not closed, so each
 * coast was followed forwards and then closed anticlockwise along the window
 * edge. Sea is the background these are painted onto, not a shape of its own.
 */
export const LAND: string[] = ${JSON.stringify(land, null, 2)};

/** The shoreline itself, unclosed, so the hairline does not run along the frame. */
export const SHORE: string[] = ${JSON.stringify(shore, null, 2)};

/** Closed coastline rings inside the window: the Princes' Islands. */
export const ISLANDS: string[] = ${JSON.stringify(islands, null, 2)};

/** Inland water. Reservoirs, mostly, and the Küçükçekmece lagoon. */
export const LAKES: Array<{ name: string; d: string }> = ${JSON.stringify(lakes, null, 2)};

/** Station platforms: real coordinates, and their position in the drawing. */
export interface GeoPoint {
  lat: number;
  lon: number;
  x: number;
  y: number;
}

export const GEO: Record<string, GeoPoint> = ${JSON.stringify(stations, null, 2)};

/**
 * The Marmaray spine, in running order.
 *
 * Here rather than in \`network.ts\` because it is used to calibrate distance,
 * and the calibration has to be able to run without importing the network -
 * which imports the calibration. One published number anchors the whole scale:
 * this railway is ${MARMARAY_KM} km from end to end.
 */
export const MARMARAY_ROUTE: string[] = ${JSON.stringify(SPINE_IDS)};
export const MARMARAY_KM = ${MARMARAY_KM};
`;

writeFileSync('geography.ts', ts);
console.log('window 100 x', f(H));
console.log(
  'land',
  land.length,
  'shore',
  shore.length,
  'islands',
  islands.length,
  'lakes',
  lakes.length,
);
console.log('lake names:', lakes.map((l) => l.name).join(', '));
console.log('bytes', ts.length);
