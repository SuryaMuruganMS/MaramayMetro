import { GEO, MARMARAY_ROUTE, MARMARAY_KM } from '../data/geography.ts';

/**
 * Distance on the ground.
 *
 * Separate from both `network.ts` and `route.ts` because both of them need it
 * and one of them is imported by the other. Everything here depends only on
 * `geography.ts`, which depends on nothing.
 *
 * WHY A CORRECTION FACTOR
 * The straight line between two platforms is not the distance a train covers.
 * On a diagram that only draws the decision points the difference is large:
 * ten chords across the Marmaray spine come to less than the railway's real
 * length, because track follows shorelines and valleys and a chord does not.
 *
 * So the great-circle distance is scaled, and the scale is DERIVED rather than
 * typed in. Measure the spine as chords, divide the published 76.6 km by it,
 * and the factor falls out. Move a station and it re-derives; nothing goes
 * quietly stale.
 *
 * It is a correction, not a measurement. It assumes the rest of the network
 * wanders about as much as Marmaray does — reasonable for an urban railway
 * threading the same city, and a far better answer than pretending trains fly.
 */

const R_EARTH = 6371;
const rad = (d: number): number => (d * Math.PI) / 180;

/** Great-circle distance between two points on the ground, kilometres. */
export function haversine(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Straight-line distance between two stations, kilometres. */
export function chordKm(a: string, b: string): number {
  const p = GEO[a];
  const q = GEO[b];
  if (!p || !q) return 0;
  return haversine(p.lat, p.lon, q.lat, q.lon);
}

/** How much longer the track is than the straight line. Derived, see above. */
export const RAIL_FACTOR: number = (() => {
  let chords = 0;
  for (let i = 0; i < MARMARAY_ROUTE.length - 1; i++) {
    chords += chordKm(MARMARAY_ROUTE[i]!, MARMARAY_ROUTE[i + 1]!);
  }
  return chords > 0 ? MARMARAY_KM / chords : 1;
})();

/** Distance between two stations along the track, kilometres. */
export const railKm = (a: string, b: string): number => chordKm(a, b) * RAIL_FACTOR;

/**
 * Average speed, kilometres per hour, including dwell at stations.
 *
 * These are what the services actually average end to end, not what the trains
 * are capable of. Marmaray covers its 76.6 km in about two hours, which is 40
 * km/h; a tram sharing road junctions with traffic manages a third of that.
 * Using the top speed instead would make the planner quote times no passenger
 * has ever experienced.
 */
export const SPEED_KMH: Record<string, number> = {
  rail: 40,
  metro: 34,
  tram: 14,
  funicular: 10,
};

/** Running time for a hop, minutes. Floored at two: no hop is instant. */
export function minutesFor(km: number, kind: string): number {
  const speed = SPEED_KMH[kind] ?? 30;
  return Math.max(2, Math.round((km / speed) * 60));
}
