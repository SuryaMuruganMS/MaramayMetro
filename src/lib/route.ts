import { GRAPH, LINES, nodeById, type Node } from '../data/network.ts';

/**
 * Finding a way across the network.
 *
 * This used to live inside the planner component. It moved out when the fares
 * page needed the same answer: a fare is a property of a ROUTE, not of a pair
 * of stations, because what you pay depends on which trains you were on and how
 * many times you changed. Two implementations of "how do you get there" would
 * have drifted, and the fare quoted on /ucret would eventually have stopped
 * matching the one quoted on /sefer for the same journey.
 *
 * Dijkstra with an interchange penalty. The penalty is the whole trick: a
 * change of train costs a passenger far more than the four minutes a timetable
 * admits to - platform, stairs, waiting, the risk of missing it - and a planner
 * without one will cheerfully route you through three changes to save two
 * minutes. Five minutes is the usual working figure and it is what we use.
 *
 * The search state is (station, arriving line) rather than just (station), so
 * arriving at Yenikapı on the M2 and arriving on Marmaray are different
 * situations and the cost of continuing differs between them. That is the only
 * way a change can be priced at all.
 */

export const CHANGE_PENALTY = 5;

export interface Hop {
  /** Station arrived at. */
  node: string;
  /** Line ridden to get here. */
  line: string;
  minutes: number;
}

/** One continuous ride on one line, before you get off and change. */
export interface Leg {
  line: string;
  /** Station boarded at. */
  from: string;
  /** Station alighted at. */
  to: string;
  /** Every station called at, boarding station first. */
  stops: string[];
  minutes: number;
  /** Route distance, kilometres. See `distance.ts` for how this is scaled. */
  km: number;
}

export interface Route {
  from: string;
  to: string;
  hops: Hop[];
  legs: Leg[];
  /** Journey time including the interchange penalty, minutes. */
  minutes: number;
  /** Number of changes of train. One fewer than the number of legs. */
  changes: number;
  km: number;
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

/**
 * How long is a grid unit?
 *
 * The geographic coordinates in `network.ts` are placed by eye, on a 100x70
 * grid, and are honest about being indicative. But their SHAPE is right, and
 * one distance on this network is known exactly: Marmaray is 76.6 km from
 * Halkalı to Gebze. So rather than typing a scale factor and hoping, the scale
 * is DERIVED - measure the Marmaray spine in grid units, divide the real length
 * by it, and every other distance on the map inherits that calibration.
 *
 * It also means the constant cannot go stale. Nudge a station to make a label
 * fit and the scale re-derives on the next build; nothing silently drifts.
 */
const MARMARAY_KM = 76.6;

const gridLength = (ids: string[]): number => {
  let d = 0;
  for (let i = 0; i < ids.length - 1; i++) {
    const a = nodeById.get(ids[i]!)!;
    const b = nodeById.get(ids[i + 1]!)!;
    d += Math.hypot(a.gx - b.gx, a.gy - b.gy);
  }
  return d;
};

export const KM_PER_UNIT: number = (() => {
  const mr = LINES.find((l) => l.id === 'MR')!;
  return MARMARAY_KM / gridLength(mr.route);
})();

/** Distance between two adjacent drawn stations, kilometres. */
export function hopKm(a: string, b: string): number {
  const na = nodeById.get(a);
  const nb = nodeById.get(b);
  if (!na || !nb) return 0;
  return Math.hypot(na.gx - nb.gx, na.gy - nb.gy) * KM_PER_UNIT;
}

// ---------------------------------------------------------------------------
// The search
// ---------------------------------------------------------------------------

export function findRoute(from: string, to: string): Route | null {
  if (from === to) return null;
  if (!nodeById.has(from) || !nodeById.has(to)) return null;

  const key = (n: string, l: string) => `${n}|${l}`;
  const dist = new Map<string, number>();
  const prev = new Map<string, { k: string; hop: Hop }>();

  const start = key(from, '');
  dist.set(start, 0);
  const queue: Array<{ k: string; node: string; line: string; d: number }> = [
    { k: start, node: from, line: '', d: 0 },
  ];

  let bestEnd: string | null = null;
  let bestD = Infinity;

  while (queue.length) {
    queue.sort((x, y) => x.d - y.d);
    const cur = queue.shift()!;
    if (cur.d > (dist.get(cur.k) ?? Infinity)) continue;
    if (cur.node === to && cur.d < bestD) {
      bestD = cur.d;
      bestEnd = cur.k;
      continue;
    }
    for (const e of GRAPH.get(cur.node) ?? []) {
      const change = cur.line !== '' && e.line !== cur.line ? CHANGE_PENALTY : 0;
      const nd = cur.d + e.minutes + change;
      const nk = key(e.to, e.line);
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        prev.set(nk, { k: cur.k, hop: { node: e.to, line: e.line, minutes: e.minutes } });
        queue.push({ k: nk, node: e.to, line: e.line, d: nd });
      }
    }
  }

  if (!bestEnd) return null;

  // Walk the predecessor chain back to the start. The annotation on `step` is
  // required: without it TypeScript infers its type from `k`, which is being
  // assigned from `step` on the next line, and gives up with a circularity.
  const hops: Hop[] = [];
  let k: string | undefined = bestEnd;
  while (k !== undefined && prev.has(k)) {
    const step: { k: string; hop: Hop } = prev.get(k)!;
    hops.unshift(step.hop);
    k = step.k;
  }

  const legs = toLegs(from, hops);
  return {
    from,
    to,
    hops,
    legs,
    minutes: bestD,
    changes: Math.max(0, legs.length - 1),
    km: legs.reduce((n, l) => n + l.km, 0),
  };
}

/**
 * Group hops into rides.
 *
 * A passenger does not experience eleven hops, they experience "Marmaray to
 * Ayrılık Çeşmesi, then the M4". Fares are charged per ride, the platform
 * announcements are per ride, and the route diagram draws one stroke per ride,
 * so this grouping is what nearly everything downstream actually wants.
 */
function toLegs(from: string, hops: Hop[]): Leg[] {
  const legs: Leg[] = [];
  let cur: Leg | null = null;
  let at = from;

  for (const h of hops) {
    if (!cur || cur.line !== h.line) {
      cur = { line: h.line, from: at, to: h.node, stops: [at], minutes: 0, km: 0 };
      legs.push(cur);
    }
    cur.stops.push(h.node);
    cur.to = h.node;
    cur.minutes += h.minutes;
    cur.km += hopKm(at, h.node);
    at = h.node;
  }
  return legs;
}

/** Every station, sorted the way the reader's language sorts. */
export const stationsSorted = (locale: string, nodes: Node[]): Node[] =>
  [...nodes].sort((a, b) => a.name.localeCompare(b.name, locale));
