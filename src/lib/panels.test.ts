import { describe, expect, it } from 'vitest';
import {
  PANELS,
  PANEL_OFFSETS,
  SCRUB_VW,
  STOP_PROGRESS,
  TRACK_VW,
  panelProgress,
  chToProgress,
  progressToCh,
} from './panels.ts';
import { CH_END, STOPS } from '../data/alignment.ts';

describe('the panel table', () => {
  it('is contiguous: no gap and no overlap in chainage', () => {
    expect(PANELS[0]!.chFrom).toBe(0);
    for (let i = 1; i < PANELS.length; i++) {
      expect(PANELS[i]!.chFrom).toBe(PANELS[i - 1]!.chTo);
    }
    expect(PANELS[PANELS.length - 1]!.chTo).toBe(CH_END);
  });

  it('never runs backwards, and only the arrival panel carries no distance', () => {
    for (const p of PANELS) {
      expect(p.chTo).toBeGreaterThanOrEqual(p.chFrom);
      if (p.kind !== 'arrival') expect(p.chTo).toBeGreaterThan(p.chFrom);
    }
    // Exactly one, at the end. More than one zero-length panel would make the
    // reverse lookup ambiguous about which to land in.
    const zero = PANELS.filter((p) => p.chTo === p.chFrom);
    expect(zero).toHaveLength(1);
    expect(zero[0]!.kind).toBe('arrival');
    expect(PANELS[PANELS.length - 1]!.kind).toBe('arrival');
  });

  it('agrees with its own offsets', () => {
    expect(PANEL_OFFSETS[0]).toBe(0);
    expect(TRACK_VW).toBe(PANEL_OFFSETS[PANELS.length - 1]! + PANELS[PANELS.length - 1]!.vw);
    expect(SCRUB_VW).toBe(TRACK_VW - 100);
  });

  it('has a panel for every stop, and a stop for every stop panel', () => {
    const panelStops = PANELS.filter((p) => p.kind === 'stop').map((p) => p.stop);
    expect(panelStops).toHaveLength(STOPS.length);
    for (const s of STOPS) expect(panelStops).toContain(s.id);
  });

  it('puts each station at the START of its panel, not the middle', () => {
    // Panel content is left-aligned, so a panel is only readable when its left
    // edge meets the viewport's left edge. Placing a station at its panel's
    // midpoint made every deep link land on the tail of the station it pointed
    // at, with the text already half off-screen.
    for (const p of PANELS) {
      if (p.kind !== 'stop') continue;
      const s = STOPS.find((x) => x.id === p.stop)!;
      expect(s.ch).toBe(p.chFrom);
    }
  });

  it('shows a whole panel when linked to its station', () => {
    for (const p of PANELS) {
      if (p.kind !== 'stop') continue;
      const i = PANELS.indexOf(p);
      const s = STOPS.find((x) => x.id === p.stop)!;
      // Deep-linking to the station must scroll to that panel's left edge.
      expect(chToProgress(s.ch)).toBeCloseTo(panelProgress(i), 9);
    }
  });
});

describe('progress mapping', () => {
  it('anchors both ends', () => {
    expect(progressToCh(0)).toBe(0);
    expect(progressToCh(1)).toBeCloseTo(CH_END, 6);
    expect(chToProgress(0)).toBe(0);
    expect(chToProgress(CH_END)).toBeCloseTo(1, 6);
  });

  it('round-trips within a metre across the whole line', () => {
    for (let ch = 0; ch <= CH_END; ch += 50) {
      expect(progressToCh(chToProgress(ch))).toBeCloseTo(ch, 3);
    }
  });

  it('is monotonic — scrolling right never moves you back up the line', () => {
    let prev = -1;
    for (let t = 0; t <= 1.0001; t += 0.002) {
      const ch = progressToCh(Math.min(1, t));
      expect(ch).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = ch;
    }
  });

  it('clamps rather than extrapolating', () => {
    expect(progressToCh(-3)).toBe(0);
    expect(progressToCh(9)).toBeCloseTo(CH_END, 6);
  });

  it('gives stops real dwell: a full screen buys under 500 m', () => {
    for (const p of PANELS) {
      if (p.kind !== 'stop') continue;
      expect(p.chTo - p.chFrom).toBeLessThanOrEqual(500);
      expect(p.vw).toBe(100);
    }
  });

  it('gives the crossing the most screen of any panel', () => {
    const crossing = PANELS.find((p) => p.kind === 'crossing')!;
    for (const p of PANELS) expect(crossing.vw).toBeGreaterThanOrEqual(p.vw);
  });
});

describe('stop progress markers', () => {
  it('produces one ascending marker per stop, all in range', () => {
    expect(STOP_PROGRESS).toHaveLength(STOPS.length);
    let prev = -1;
    for (const m of STOP_PROGRESS) {
      expect(m.t).toBeGreaterThanOrEqual(0);
      expect(m.t).toBeLessThanOrEqual(1);
      expect(m.t).toBeGreaterThan(prev);
      prev = m.t;
    }
  });
});
