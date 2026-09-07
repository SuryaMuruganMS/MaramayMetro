import { CH_END } from '../data/alignment.ts';

/**
 * The horizontal track, as a table of panels.
 *
 * ONE SOURCE FOR TWO CONSUMERS
 * The CSS lays the track out from these widths, and the engine maps scroll
 * progress to chainage from these ranges. If they came from two places they
 * would drift, and the site would claim a depth it was not drawing — which is
 * precisely the class of bug the cited-figures discipline exists to prevent.
 *
 * WHY STOPS ARE WIDE AND RUNS ARE NARROW
 * A stop panel occupies a full screen but only two to four hundred metres of
 * chainage. A run panel occupies less screen and covers kilometres. That is
 * dwell: the train slows into a station and accelerates away, and here it falls
 * out of the layout rather than being animated on top of it.
 *
 * The crossing gets 200vw for 2,250 m because it is the reason the site exists.
 */

export type PanelKind = 'stop' | 'run' | 'crossing' | 'arrival';

export interface Panel {
  id: string;
  kind: PanelKind;
  /** Width in viewport widths. */
  vw: number;
  chFrom: number;
  chTo: number;
  /** Stop panels carry the stop id they belong to. */
  stop?: string;
}

export const PANELS: Panel[] = [
  { id: 'p-kazlicesme', kind: 'stop', vw: 100, chFrom: 0, chTo: 200, stop: 'kazlicesme' },
  { id: 'p-run-1', kind: 'run', vw: 70, chFrom: 200, chTo: 3000 },
  { id: 'p-yenikapi', kind: 'stop', vw: 100, chFrom: 3000, chTo: 3400, stop: 'yenikapi' },
  { id: 'p-run-2', kind: 'run', vw: 60, chFrom: 3400, chTo: 5250 },
  { id: 'p-sirkeci', kind: 'stop', vw: 100, chFrom: 5250, chTo: 5650, stop: 'sirkeci' },
  { id: 'p-crossing', kind: 'crossing', vw: 200, chFrom: 5650, chTo: 7900 },
  { id: 'p-uskudar', kind: 'stop', vw: 100, chFrom: 7900, chTo: 8300, stop: 'uskudar' },
  { id: 'p-run-3', kind: 'run', vw: 55, chFrom: 8300, chTo: 9600 },
  {
    id: 'p-ayrilik',
    kind: 'stop',
    vw: 100,
    chFrom: 9600,
    chTo: 10_000,
    stop: 'ayrilik-cesmesi',
  },
  { id: 'p-run-4', kind: 'run', vw: 70, chFrom: 10_000, chTo: 13_400 },
  {
    id: 'p-sogutlucesme',
    kind: 'stop',
    vw: 100,
    chFrom: 13_400,
    chTo: CH_END,
    stop: 'sogutlucesme',
  },
  /**
   * The closing screen, and a structural necessity rather than an afterthought.
   *
   * Travel stops when the LAST panel's left edge reaches the viewport's left
   * edge - so without a panel after it, the final stop is displayed but never
   * scrolled through, and chainage tops out 200 m short of Söğütlüçeşme. It
   * carries no distance of its own; it is where the journey has already ended.
   */
  { id: 'p-arrival', kind: 'arrival', vw: 100, chFrom: CH_END, chTo: CH_END },
];

/** Total track width, in viewport widths. */
export const TRACK_VW = PANELS.reduce((n, p) => n + p.vw, 0);

/** How far the track travels: everything except the last screenful. */
export const SCRUB_VW = TRACK_VW - 100;

/** Cumulative left edge of each panel, in vw. */
export const PANEL_OFFSETS: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (const p of PANELS) {
    out.push(acc);
    acc += p.vw;
  }
  return out;
})();

/**
 * Scroll progress (0-1 across the whole scrub) to chainage.
 *
 * Progress is measured in travelled vw, so the panel a given progress falls in
 * is found by walking the offsets. Within a panel the mapping is linear.
 */
export function progressToCh(t: number): number {
  const travelled = Math.min(SCRUB_VW, Math.max(0, t * SCRUB_VW));
  for (let i = 0; i < PANELS.length; i++) {
    const p = PANELS[i]!;
    const left = PANEL_OFFSETS[i]!;
    const right = left + p.vw;
    if (travelled < right || i === PANELS.length - 1) {
      const within = p.vw === 0 ? 0 : Math.min(1, Math.max(0, (travelled - left) / p.vw));
      return p.chFrom + (p.chTo - p.chFrom) * within;
    }
  }
  return CH_END;
}

/** The inverse, for deep links and for driving the rail. */
export function chToProgress(ch: number): number {
  const c = Math.min(CH_END, Math.max(0, ch));
  for (let i = 0; i < PANELS.length; i++) {
    const p = PANELS[i]!;
    // Zero-length panels carry no chainage and must never absorb a lookup.
    if (p.chTo === p.chFrom) continue;
    if (c <= p.chTo || i === PANELS.length - 1) {
      const span = p.chTo - p.chFrom;
      const within = span === 0 ? 0 : (c - p.chFrom) / span;
      const travelled = PANEL_OFFSETS[i]! + within * p.vw;
      return Math.min(1, Math.max(0, travelled / SCRUB_VW));
    }
  }
  return 1;
}

/**
 * Where a panel is fully readable.
 *
 * Its LEFT edge against the viewport's left edge - not its midpoint. Panel
 * content is left-aligned, so at the midpoint half of it has already travelled
 * off-screen. Getting this wrong made every deep link land on the tail of the
 * station it was pointing at.
 */
export const panelProgress = (index: number): number =>
  Math.min(1, Math.max(0, (PANEL_OFFSETS[index] ?? 0) / SCRUB_VW));

/** Snap targets and deep-link anchors: one per panel worth stopping at. */
export const PANEL_ANCHORS: Array<{ id: string; stop?: string; t: number }> = PANELS.map(
  (p, i) => ({ id: p.id, stop: p.stop, t: panelProgress(i) }),
).filter((_, i) => PANELS[i]!.kind !== 'run');

export const STOP_PROGRESS: Array<{ stop: string; t: number }> = PANELS.map((p, i) => ({
  p,
  i,
}))
  .filter(({ p }) => p.kind === 'stop')
  .map(({ p, i }) => ({ stop: p.stop!, t: panelProgress(i) }));
