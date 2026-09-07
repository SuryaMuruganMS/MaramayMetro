import { describe, expect, it } from 'vitest';
import { CARS, FORMATION, PART_STARTS, partAt } from './formation.ts';
import { CH_END } from './chainage.ts';
import { en } from '../i18n/en.ts';

describe('the train formation', () => {
  it('has a driving cab at each end and nowhere else', () => {
    const cabs = FORMATION.map((p, i) => ({ p, i })).filter(({ p }) => p.id === 'cab');
    expect(cabs).toHaveLength(2);
    expect(cabs[0]!.i).toBe(0);
    expect(cabs[1]!.i).toBe(FORMATION.length - 1);
  });

  it('numbers cars 1 to 5, in order, without gaps', () => {
    const seen = [...new Set(FORMATION.map((p) => p.car))];
    expect(seen).toEqual([1, 2, 3, 4, 5]);
    expect(seen).toHaveLength(CARS);
    let last = 0;
    for (const p of FORMATION) {
      expect(p.car).toBeGreaterThanOrEqual(last);
      last = p.car;
    }
  });

  it('carries exactly one pantograph', () => {
    expect(FORMATION.filter((p) => p.id === 'pantograph')).toHaveLength(1);
  });

  it('names every part with a key that exists', () => {
    for (const p of FORMATION) {
      expect(Object.keys(en), `${p.key} is not a real key`).toContain(p.key);
    }
  });

  it('starts at the front and ends at the back', () => {
    expect(PART_STARTS[0]).toBe(0);
    expect(partAt(0).index).toBe(0);
    expect(partAt(CH_END).index).toBe(FORMATION.length - 1);
  });

  it('walks the train once, forwards only', () => {
    let prev = -1;
    for (let ch = 0; ch <= CH_END; ch += 25) {
      const w = partAt(ch);
      expect(w.index).toBeGreaterThanOrEqual(prev);
      expect(w.within).toBeGreaterThanOrEqual(0);
      expect(w.within).toBeLessThanOrEqual(1);
      prev = w.index;
    }
    // And it reaches every part - no segment is so thin it is skipped at this
    // sampling rate, which would make the readout flicker past it.
    const visited = new Set<number>();
    for (let ch = 0; ch <= CH_END; ch += 25) visited.add(partAt(ch).index);
    expect(visited.size).toBe(FORMATION.length);
  });

  it('clamps outside the tunnel rather than falling off the train', () => {
    expect(partAt(-5000).index).toBe(0);
    expect(partAt(CH_END * 3).index).toBe(FORMATION.length - 1);
  });
});
