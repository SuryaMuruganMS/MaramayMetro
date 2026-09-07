import {
  CH_END,
  CH_START,
  DIVIDE_CH,
  IMMERSED_END,
  IMMERSED_START,
  PROFILE,
  STOPS,
  STRAIT,
  type Continent,
  type Medium,
  type Stop,
} from '../data/alignment.ts';

/**
 * The alignment engine.
 *
 * One input: chainage, in metres from Kazlıçeşme. Everything the site draws is a
 * pure function of it - elevation, gradient, continent, construction method, what
 * is overhead, which stop you are near, how fast you are going.
 *
 * WHY PURE FUNCTIONS AND NOT STATE
 * Scroll-driven sites normally accumulate a dozen independent triggers that fight
 * each other, desynchronise on resize, and break on deep links. There is nothing
 * here to reconcile: feed the same number in, get the same world out. It also
 * means the physics is testable without a browser, which is how the light
 * absorption bug got caught on the last project.
 *
 * Chainage is clamped, never wrapped. Scrolling past the end of a tunnel does not
 * put you back at the start of it.
 */

/**
 * The axis bounds, re-exported.
 *
 * They live in the data file, but this module IS the axis, so callers should
 * not have to know that. Importing `CH_END` from here silently yielded
 * `undefined` before this existed, which turned every position into NaN and
 * made the train-formation readout report the leading cab everywhere.
 */
export { CH_START, CH_END } from '../data/alignment.ts';

export const clampCh = (ch: number): number => Math.min(CH_END, Math.max(CH_START, ch));

/** 0 at Kazlıçeşme, 1 at Söğütlüçeşme. The scroll progress. */
export const toProgress = (ch: number): number => clampCh(ch) / CH_END;
export const fromProgress = (t: number): number => clampCh(t * CH_END);

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Metres relative to mean sea level. Linear between control points, which is
 * honest: the source is a drawing, and pretending to a smooth spline would imply
 * precision the data does not have.
 */
export function elevation(ch: number): number {
  const c = clampCh(ch);
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const a = PROFILE[i]!;
    const b = PROFILE[i + 1]!;
    if (c >= a.ch && c <= b.ch) {
      const span = b.ch - a.ch;
      return span === 0 ? a.level : lerp(a.level, b.level, (c - a.ch) / span);
    }
  }
  return PROFILE[PROFILE.length - 1]!.level;
}

/** Depth below sea level as a positive number. Zero at and above the surface. */
export const depth = (ch: number): number => Math.max(0, -elevation(ch));

/**
 * Slope in per cent, signed. Positive is climbing in the direction of travel.
 * Sampled over a 40 m window rather than differentiated at a point, so a control
 * point does not produce a spike.
 */
export function gradient(ch: number): number {
  const h = 20;
  const a = clampCh(ch - h);
  const b = clampCh(ch + h);
  const run = b - a;
  if (run === 0) return 0;
  return ((elevation(b) - elevation(a)) / run) * 100;
}

/** Which continent you are on. The crossing happens at the strait's midpoint. */
export const continent = (ch: number): Continent => (clampCh(ch) < DIVIDE_CH ? 'EU' : 'AS');

/** Distance to the divide, signed. Negative approaching, positive past it. */
export const toDivide = (ch: number): number => clampCh(ch) - DIVIDE_CH;

/** How this length of tunnel was built. Real methods, real boundaries. */
export function medium(ch: number): Medium {
  const c = clampCh(ch);
  if (c >= IMMERSED_START && c <= IMMERSED_END) return 'immersed';
  if (c < 700 || c > 12_600) return 'cut';
  return 'bored';
}

/** Which of the eleven precast elements you are inside, 1-11, or null. */
export function element(ch: number): number | null {
  const c = clampCh(ch);
  if (c < IMMERSED_START || c > IMMERSED_END) return null;
  const span = IMMERSED_END - IMMERSED_START;
  return Math.min(11, Math.floor(((c - IMMERSED_START) / span) * 11) + 1);
}

export interface Overburden {
  /** Metres of rock and fill between the tunnel crown and the seabed or ground. */
  ground: number;
  /** Metres of water directly overhead. Zero on land. */
  water: number;
  total: number;
}

/**
 * What is above your head, itemised.
 *
 * Nothing conveys sixty metres like watching the water component climb from zero
 * to forty-five and back. On land the whole figure is ground; over the strait it
 * splits, and the split is the point.
 */
export function overburden(ch: number): Overburden {
  const c = clampCh(ch);
  const tunnelLevel = elevation(c);
  const overWater = c >= STRAIT.from && c <= STRAIT.to;

  if (!overWater) {
    // Indicative surface profile: the historic peninsula rises to about +40 m,
    // the Asian shore climbs away from the water more steeply.
    const surface = c < DIVIDE_CH ? surfaceEurope(c) : surfaceAsia(c);
    const ground = Math.max(0, surface - tunnelLevel);
    return { ground, water: 0, total: ground };
  }

  // Over the strait the seabed dips toward the centre; water fills the rest.
  const t = (c - STRAIT.from) / (STRAIT.to - STRAIT.from);
  const dip = Math.sin(Math.PI * t);
  const seabed = lerp(-12, STRAIT.seabedLevel, dip);
  const ground = Math.max(0, seabed - tunnelLevel);
  const water = Math.max(0, 0 - seabed);
  return { ground, water, total: ground + water };
}

const surfaceEurope = (ch: number): number => {
  if (ch < 600) return lerp(6, 22, ch / 600);
  if (ch < 3200) return lerp(22, 38, (ch - 600) / 2600);
  if (ch < 5450) return lerp(38, 14, (ch - 3200) / 2250);
  return lerp(14, 0, Math.min(1, (ch - 5450) / 450));
};

const surfaceAsia = (ch: number): number => {
  if (ch < 8100) return lerp(0, 18, Math.max(0, (ch - 7500) / 600));
  if (ch < 9800) return lerp(18, 46, (ch - 8100) / 1700);
  return lerp(46, 30, Math.min(1, (ch - 9800) / 3800));
};

/** True while the tunnel is genuinely beneath open water. */
export const isUnderStrait = (ch: number): boolean => overburden(ch).water > 0.5;

export interface Nearby {
  stop: Stop;
  /** Signed metres to it. Negative means it is still ahead. */
  delta: number;
  /** 1 exactly at the platform, falling to 0 by `range` metres away. */
  proximity: number;
}

/** The nearest stop, and how close you are to it. Drives deceleration and dwell. */
export function nearestStop(ch: number, range = 420): Nearby {
  const c = clampCh(ch);
  let best = STOPS[0]!;
  let bestAbs = Infinity;
  for (const s of STOPS) {
    const d = Math.abs(s.ch - c);
    if (d < bestAbs) {
      bestAbs = d;
      best = s;
    }
  }
  return {
    stop: best,
    delta: c - best.ch,
    proximity: Math.max(0, 1 - bestAbs / range),
  };
}

/** Stops already passed, in order. Used for the crossing record. */
export const stopsBehind = (ch: number): Stop[] => STOPS.filter((s) => s.ch <= clampCh(ch));

// ---------------------------------------------------------------------------
// Strata: the discrete depth bands the palette steps through
// ---------------------------------------------------------------------------

export type Band = 'surface' | 'shallow' | 'deep' | 'seabed' | 'abyssal';

/**
 * Stepped, not interpolated. You should be able to see the horizon you crossed,
 * which a continuous ramp hides. This is the deliberate opposite of Kestrel's
 * smooth OKLCH path, and the reason the two sites cannot be confused.
 */
export function band(ch: number): Band {
  const d = depth(ch);
  if (d < 1) return 'surface';
  if (d < 20) return 'shallow';
  if (d < 40) return 'deep';
  if (d < 55) return 'seabed';
  return 'abyssal';
}

export const BAND_ORDER: Band[] = ['surface', 'shallow', 'deep', 'seabed', 'abyssal'];

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** U+2212 MINUS SIGN, not a hyphen. Depths are quantities, not hyphenations. */
export const formatLevel = (m: number): string => {
  const r = Math.round(m);
  return r < 0 ? `−${Math.abs(r)} m` : `+${r} m`;
};

export const formatCh = (m: number): string => {
  // Round to the metre FIRST. Splitting 2999.6 into floor and remainder prints
  // "2+999" for a position that is, to the metre, 3+000.
  const whole = Math.round(m);
  const km = Math.floor(whole / 1000);
  return `${km}+${String(whole - km * 1000).padStart(3, '0')}`;
};

export const formatGradient = (pct: number): string =>
  `${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(1)}%`;
