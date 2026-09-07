import type { Route } from '../lib/route.ts';

/**
 * FARES. EVERY FIGURE ON THIS PAGE IS INVENTED.
 *
 * That warning is first because it is the most important thing in the file, and
 * it is repeated in the interface next to every amount, in a dedicated
 * information panel on /ucret, and in the concept bar at the top of every page.
 * A fares table is the one part of a transport site a person acts on with money
 * in their hand. Getting it wrong is not a cosmetic bug, so a demonstration
 * build has no business publishing numbers that could be mistaken for real
 * ones.
 *
 * WHAT IS REAL HERE IS THE STRUCTURE
 * İstanbul's tariff has three properties worth modelling, and all three are
 * reproduced faithfully:
 *
 *   1. Most of the network is a FLAT fare - one price for a metro, tram or
 *      funicular ride, however far you go.
 *   2. Marmaray is DISTANCE-BASED. You tap in and you also tap out, and what
 *      you pay depends on how far you went. This is why Marmaray gates read
 *      your card twice when the metro gates read it once.
 *   3. Changes made soon after the first tap are charged at a REDUCED rate,
 *      and the discount deepens with each further change.
 *
 * And one more thing that is real and matters more than any of the above: three
 * groups of passengers travel free. That is not a rounding detail, it is
 * policy, and it is stated plainly rather than buried in a footnote.
 *
 * WHAT IS INVENTED is every amount. The real numbers move with inflation
 * several times a year; ours are round, deliberately unlike the published ones,
 * and chosen only so the arithmetic on the page is interesting to follow.
 *
 * ARITHMETIC IN KURUŞ
 * Everything below is integer kuruş - hundredths of a lira - and only the
 * formatter ever sees a decimal. Money in floating point accumulates error the
 * moment you add three legs together, and a fare table that prints ₺48.99 where
 * the sum of its parts is ₺49.00 undermines the one thing a table like this has
 * to be, which is arithmetically checkable by the reader.
 */

// ---------------------------------------------------------------------------
// Passenger types
// ---------------------------------------------------------------------------

export type PassengerId = 'full' | 'student' | 'teacher' | 'senior' | 'child' | 'disabled';

export interface Passenger {
  id: PassengerId;
  /** Dictionary key for the name, so all four languages come from one place. */
  key: string;
  /**
   * Share of the full fare, in percent. `0` means this pass travels free —
   * expressed as a rate rather than a flag so the arithmetic has one path.
   */
  rate: number;
  /** Free travel is an entitlement, not a discount. It gets its own note. */
  free: boolean;
}

export const PASSENGERS: Passenger[] = [
  { id: 'full', key: 'fare.full', rate: 100, free: false },
  { id: 'student', key: 'fare.student', rate: 50, free: false },
  { id: 'teacher', key: 'fare.teacher', rate: 70, free: false },
  { id: 'senior', key: 'fare.senior', rate: 0, free: true },
  { id: 'child', key: 'fare.child', rate: 0, free: true },
  { id: 'disabled', key: 'fare.disabled', rate: 0, free: true },
];

export const passengerById = new Map(PASSENGERS.map((p) => [p.id, p]));

/** The types that actually pay something, and so need a column in the table. */
export const PAYING = PASSENGERS.filter((p) => !p.free);
/** The passes that travel free. Listed together, once, prominently. */
export const FREE_PASSES = PASSENGERS.filter((p) => p.free);

// ---------------------------------------------------------------------------
// The tariff — invented amounts, real shape
// ---------------------------------------------------------------------------

/** Flat fare for one ride on a metro, tram or funicular line. */
export const FLAT_KURUS = 3000;

/** Marmaray: what it costs to be on the train at all, before you move. */
export const MR_BOARD_KURUS = 2000;

/** Marmaray: added for each kilometre travelled. */
export const MR_PER_KM_KURUS = 47;

/**
 * The cap. Chosen so that it bites at exactly the full Halkalı–Gebze run:
 * 2000 + 76.6 × 47 = 5600. Nobody can pay more than the whole railway costs,
 * which is both the sane rule and a tidy one to explain.
 */
export const MR_CAP_KURUS = 5600;

/**
 * The transfer ladder: what share of a leg's price you pay when it is your
 * second, third, fourth ride within the transfer window. The last value
 * continues for any further changes, so the table cannot be walked off the end.
 */
export const TRANSFER_RATE = [35, 25, 15, 10];

/** How long the discount lasts, in minutes, from the first tap. */
export const TRANSFER_WINDOW_MIN = 120;

/**
 * Distance bands.
 *
 * The tariff is continuous, not banded — these exist to describe a journey in
 * words ("a medium-distance run") rather than to compute anything, and the page
 * says so. A band that quietly rounded the fare would be a different tariff
 * wearing this one's clothes.
 */
export interface DistanceBand {
  id: string;
  key: string;
  /** Lower bound, kilometres, inclusive. */
  from: number;
  /** Upper bound, kilometres, exclusive. `Infinity` on the last. */
  to: number;
}

export const BANDS: DistanceBand[] = [
  { id: 'b1', key: 'fare.band1', from: 0, to: 5 },
  { id: 'b2', key: 'fare.band2', from: 5, to: 15 },
  { id: 'b3', key: 'fare.band3', from: 15, to: 30 },
  { id: 'b4', key: 'fare.band4', from: 30, to: 50 },
  { id: 'b5', key: 'fare.band5', from: 50, to: Infinity },
];

export const bandFor = (km: number): DistanceBand =>
  BANDS.find((b) => km >= b.from && km < b.to) ?? BANDS[BANDS.length - 1]!;

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

/** Which lines charge by distance. Marmaray, and on this network only it. */
export const isDistanceLine = (line: string): boolean => line === 'MR';

/** Undiscounted price of one ride, before any passenger rate or transfer. */
export function legKurus(line: string, km: number): number {
  if (!isDistanceLine(line)) return FLAT_KURUS;
  return Math.min(MR_CAP_KURUS, MR_BOARD_KURUS + Math.round(km * MR_PER_KM_KURUS));
}

/** Apply a passenger rate. Rounds to the kuruş, so totals stay checkable. */
const atRate = (kurus: number, rate: number): number => Math.round((kurus * rate) / 100);

export interface FareLeg {
  line: string;
  km: number;
  /** What this ride would cost on its own, at this passenger's rate. */
  fullKurus: number;
  /** What it actually costs in this journey, after any transfer discount. */
  kurus: number;
  /** Percent paid: 100 on the first leg, then down the transfer ladder. */
  rate: number;
  /** True for every leg after the first. */
  isTransfer: boolean;
}

export interface Fare {
  passenger: PassengerId;
  legs: FareLeg[];
  /** Total, in kuruş. */
  kurus: number;
  /** What the same journey costs at the full adult fare, for comparison. */
  fullKurus: number;
  /** Free by entitlement — not merely zero because the journey was short. */
  free: boolean;
  km: number;
  band: DistanceBand;
}

/**
 * Price a route for one passenger type.
 *
 * First ride at the passenger's rate, every subsequent ride at the passenger's
 * rate AND the transfer rate for its position in the journey. The two discounts
 * compound, which is what "the discount deepens" means when a student changes
 * trains twice.
 */
export function fareFor(route: Route, passenger: PassengerId): Fare {
  const p = passengerById.get(passenger) ?? PASSENGERS[0]!;
  const legs: FareLeg[] = route.legs.map((leg, i) => {
    const base = legKurus(leg.line, leg.km);
    const transfer =
      i === 0 ? 100 : (TRANSFER_RATE[Math.min(i - 1, TRANSFER_RATE.length - 1)] ?? 10);
    const full = atRate(base, transfer);
    return {
      line: leg.line,
      km: leg.km,
      fullKurus: full,
      kurus: p.free ? 0 : atRate(full, p.rate),
      rate: transfer,
      isTransfer: i > 0,
    };
  });

  return {
    passenger,
    legs,
    kurus: legs.reduce((n, l) => n + l.kurus, 0),
    fullKurus: legs.reduce((n, l) => n + l.fullKurus, 0),
    free: p.free,
    km: route.km,
    band: bandFor(route.km),
  };
}

/** Kuruş to lira, for the formatter. Never used for arithmetic. */
export const toLira = (kurus: number): number => kurus / 100;
