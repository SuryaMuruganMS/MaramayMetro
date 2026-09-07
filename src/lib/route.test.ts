import { describe, it, expect } from 'vitest';
import { findRoute, CHANGE_PENALTY } from './route.ts';
import { railKm } from './geo.ts';
import { NODES, lineById } from '../data/network.ts';

describe('findRoute', () => {
  it('refuses a journey to where you already are', () => {
    expect(findRoute('yenikapi', 'yenikapi')).toBeNull();
  });

  it('refuses a station that does not exist', () => {
    expect(findRoute('yenikapi', 'atlantis')).toBeNull();
    expect(findRoute('atlantis', 'yenikapi')).toBeNull();
  });

  it('runs Yenikapı to Üsküdar without a change of train', () => {
    const r = findRoute('yenikapi', 'uskudar')!;
    expect(r.changes).toBe(0);
    expect(r.legs).toHaveLength(1);
    expect(r.legs[0]!.line).toBe('MR');
  });

  it('starts where you asked and ends where you asked', () => {
    for (const a of ['halkali', 'taksim', 'sabiha']) {
      for (const b of ['gebze', 'kayasehir', 'ist-havalimani']) {
        const r = findRoute(a, b);
        if (!r) continue;
        expect(r.legs[0]!.from).toBe(a);
        expect(r.legs[r.legs.length - 1]!.to).toBe(b);
      }
    }
  });

  it('groups hops into one leg per train', () => {
    const r = findRoute('halkali', 'sabiha')!;
    // Legs are contiguous: each one starts where the previous ended.
    for (let i = 1; i < r.legs.length; i++) {
      expect(r.legs[i]!.from).toBe(r.legs[i - 1]!.to);
      expect(r.legs[i]!.line).not.toBe(r.legs[i - 1]!.line);
    }
    expect(r.changes).toBe(r.legs.length - 1);
  });

  it('accounts for every hop exactly once across the legs', () => {
    const r = findRoute('kayasehir', 'gebze')!;
    const hopCount = r.legs.reduce((n, l) => n + l.stops.length - 1, 0);
    expect(hopCount).toBe(r.hops.length);
  });

  it('prices a change into the journey time', () => {
    // A route with changes must be longer than the sum of its riding times, by
    // exactly the penalty per change. Without this the planner would route
    // through three changes to save two minutes.
    const r = findRoute('halkali', 'sabiha')!;
    const riding = r.hops.reduce((n, h) => n + h.minutes, 0);
    expect(r.minutes).toBe(riding + r.changes * CHANGE_PENALTY);
  });

  it('is symmetric: there and back are the same journey', () => {
    for (const [a, b] of [
      ['halkali', 'gebze'],
      ['taksim', 'kadikoy'],
      ['ist-havalimani', 'sabiha'],
    ] as const) {
      const there = findRoute(a, b)!;
      const back = findRoute(b, a)!;
      expect(back.minutes).toBe(there.minutes);
      expect(back.changes).toBe(there.changes);
      expect(back.km).toBeCloseTo(there.km, 6);
    }
  });

  it('only ever puts you on a line that actually calls at both ends of the leg', () => {
    const r = findRoute('kayasehir', 'sabiha')!;
    for (const leg of r.legs) {
      const route = lineById.get(leg.line)!.route;
      for (const stop of leg.stops) expect(route).toContain(stop);
    }
  });

  it('measures a leg as the sum of its hops, not as the crow flies', () => {
    const r = findRoute('halkali', 'gebze')!;
    const byHop = r.legs[0]!.stops.reduce(
      (n, s, i, arr) => (i === 0 ? 0 : n + railKm(arr[i - 1]!, s)),
      0,
    );
    expect(r.legs[0]!.km).toBeCloseTo(byHop, 6);
    expect(r.km).toBeCloseTo(76.6, 6);
  });

  it('reaches every station from Yenikapı', () => {
    for (const n of NODES) {
      if (n.id === 'yenikapi') continue;
      expect(findRoute('yenikapi', n.id), n.id).not.toBeNull();
    }
  });
});
