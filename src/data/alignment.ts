import { cite, type Cited, type SourceKey } from './sources.ts';

/**
 * The spine: the Marmaray central bored-and-immersed section.
 *
 * Kazlıçeşme in Europe to Söğütlüçeşme in Asia. This is the one piece of the
 * network the landing page travels, and every visual state on that page is a
 * pure function of a single number - chainage, in metres from Kazlıçeşme.
 *
 * WHAT IS MEASURED AND WHAT IS NOT
 * The corridor length, the tunnel length, the immersed-tube length and the
 * crossing depth are published engineering figures. Individual station chainages
 * and platform levels are scaled off the published long-section, which is a
 * drawing, not a survey - so they carry the indicative source and the interface
 * renders them as uncertain. This distinction is the whole reason the data layer
 * exists in this shape.
 */

export const CH_START = 0;
export const CH_END = 13_600;

/** Verified network and corridor figures, for the places that quote them. */
export const CORRIDOR = {
  totalKm: cite(76.6, 'marmaray-engineering'),
  tunnelKm: cite(13.6, 'marmaray-engineering'),
  immersedM: cite(1387, 'marmaray-engineering'),
  immersedElements: cite(11, 'immersed-tube'),
  elementWidthM: cite(15.3, 'immersed-tube'),
  deepestM: cite(-60, 'marmaray-engineering'),
  opened: cite(2013, 'marmaray-engineering'),
} as const;

export const NETWORK = {
  metroLines: cite(11, 'metro-istanbul-network'),
  stations: cite(169, 'metro-istanbul-network'),
  routeKm: cite(265.1, 'metro-istanbul-network'),
} as const;

export const DIG = {
  artefacts: cite(100_000, 'yenikapi-excavation'),
  hulls: cite(37, 'yenikapi-excavation'),
  oldestBCE: cite(6500, 'yenikapi-excavation'),
} as const;

export const TUNEL = {
  opened: cite(1875, 'tunel-1875'),
  lengthM: cite(573, 'tunel-1875'),
  seconds: cite(90, 'tunel-1875'),
} as const;

export const CLIMATE = {
  snowDaysLow: cite(3, 'istanbul-climate'),
  snowDaysHigh: cite(7, 'istanbul-climate'),
} as const;

// ---------------------------------------------------------------------------
// The alignment itself
// ---------------------------------------------------------------------------

export type Continent = 'EU' | 'AS';

/** How the tunnel was built at a given chainage. Real construction methods. */
export type Medium = 'cut' | 'bored' | 'immersed';

export interface Stop {
  id: string;
  /** Turkish name, which is the name. English pages do not translate place names. */
  name: string;
  /** Metres from Kazlıçeşme. */
  ch: number;
  /** Metres relative to mean sea level. Negative is below. */
  level: number;
  continent: Continent;
  /** Step-free from street to platform. */
  stepFree: boolean;
  interchange: string[];
  /**
   * Platform photograph, once one exists. Optional by design: the frame draws
   * an İznik tile panel when there is nothing to hang in it, so a station
   * without a picture still looks finished rather than broken.
   */
  photo?: string;
  source: SourceKey;
}

/**
 * Six stops. Chainage and level are indicative; the order, the names, the
 * continent each sits on and the interchanges are not.
 */
export const STOPS: Stop[] = [
  {
    id: 'kazlicesme',
    name: 'Kazlıçeşme',
    ch: 0,
    level: 3,
    continent: 'EU',
    stepFree: true,
    interchange: ['T1'],
    source: 'alignment-indicative',
  },
  {
    id: 'yenikapi',
    name: 'Yenikapı',
    ch: 3000,
    level: -27,
    continent: 'EU',
    stepFree: true,
    interchange: ['M1A', 'M1B', 'M2', 'ferry'],
    source: 'alignment-indicative',
  },
  {
    id: 'sirkeci',
    name: 'Sirkeci',
    ch: 5250,
    level: -35,
    continent: 'EU',
    stepFree: true,
    interchange: ['T1'],
    source: 'alignment-indicative',
  },
  {
    id: 'uskudar',
    name: 'Üsküdar',
    ch: 7900,
    level: -35,
    continent: 'AS',
    stepFree: true,
    interchange: ['M5', 'ferry'],
    source: 'alignment-indicative',
  },
  {
    id: 'ayrilik-cesmesi',
    name: 'Ayrılık Çeşmesi',
    ch: 9600,
    level: -12,
    continent: 'AS',
    stepFree: true,
    interchange: ['M4'],
    source: 'alignment-indicative',
  },
  {
    id: 'sogutlucesme',
    name: 'Söğütlüçeşme',
    ch: 13_400,
    level: 4,
    continent: 'AS',
    stepFree: true,
    interchange: ['T3', 'metrobus'],
    source: 'alignment-indicative',
  },
];

/**
 * The immersed tube, placed so its length is the published 1,387 m and its
 * midpoint is the deepest point of the crossing. Element joints are evenly
 * spaced across it - the real elements varied slightly in length, which is a
 * refinement to make if a segment schedule ever surfaces.
 */
export const IMMERSED_START = 6006;
export const IMMERSED_END = IMMERSED_START + CORRIDOR.immersedM.value; // 7393
export const DEEPEST_CH = Math.round((IMMERSED_START + IMMERSED_END) / 2); // 6700

/** Where Europe stops being Europe. The strait's midpoint. */
export const DIVIDE_CH = DEEPEST_CH;

export const ELEMENT_JOINTS: number[] = Array.from(
  { length: CORRIDOR.immersedElements.value - 1 },
  (_, i) =>
    Math.round(
      IMMERSED_START + ((i + 1) * CORRIDOR.immersedM.value) / CORRIDOR.immersedElements.value,
    ),
);

/**
 * Control points for the vertical alignment, including the ones between
 * stations that give the profile its shape. This is the geometry every derived
 * quantity reads, and the same array the SVG path is generated from - so the
 * drawing and the numbers cannot disagree.
 */
export const PROFILE: Array<{ ch: number; level: number }> = [
  { ch: 0, level: 3 },
  { ch: 900, level: -8 },
  { ch: 2000, level: -20 },
  { ch: 3000, level: -27 },
  { ch: 4200, level: -31 },
  { ch: 5250, level: -35 },
  { ch: IMMERSED_START, level: -49 },
  { ch: DEEPEST_CH, level: -60 },
  { ch: IMMERSED_END, level: -49 },
  { ch: 7900, level: -35 },
  { ch: 9600, level: -12 },
  { ch: 11_400, level: -4 },
  { ch: 13_600, level: 4 },
];

/**
 * Sea and seabed above the crossing, so the site can show what is overhead
 * rather than merely asserting a depth. Indicative bathymetry.
 */
export const STRAIT = {
  /** Chainage range over open water. */
  from: 5900,
  to: 7500,
  /** Metres of water at the deepest point, above the seabed. */
  seabedLevel: -45,
} as const;

export const stopAt = (id: string): Stop | undefined => STOPS.find((s) => s.id === id);

export type CitedNumber = Cited<number>;
