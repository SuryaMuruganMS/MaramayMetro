import { describe, expect, it } from 'vitest';
import {
  band,
  clampCh,
  continent,
  depth,
  elevation,
  element,
  formatCh,
  formatLevel,
  gradient,
  isUnderStrait,
  medium,
  nearestStop,
  overburden,
  toProgress,
} from './chainage.ts';
import {
  CH_END,
  CORRIDOR,
  DEEPEST_CH,
  DIVIDE_CH,
  ELEMENT_JOINTS,
  IMMERSED_END,
  IMMERSED_START,
  STOPS,
} from '../data/alignment.ts';
import { lower, upper } from './locale.ts';

describe('the axis', () => {
  it('clamps rather than wraps', () => {
    expect(clampCh(-500)).toBe(0);
    expect(clampCh(CH_END + 5000)).toBe(CH_END);
  });

  it('runs 0 to 1 across the tunnel', () => {
    expect(toProgress(0)).toBe(0);
    expect(toProgress(CH_END)).toBe(1);
  });
});

describe('elevation', () => {
  it('reaches the published crossing depth, and only there', () => {
    expect(elevation(DEEPEST_CH)).toBeCloseTo(CORRIDOR.deepestM.value, 5);
    // Nowhere else on the alignment goes deeper. If a control point is ever
    // edited carelessly this is the test that catches it.
    for (let ch = 0; ch <= CH_END; ch += 25) {
      expect(elevation(ch)).toBeGreaterThanOrEqual(CORRIDOR.deepestM.value - 0.001);
    }
  });

  it('starts and ends above water', () => {
    expect(elevation(0)).toBeGreaterThan(0);
    expect(elevation(CH_END)).toBeGreaterThan(0);
  });

  it('reports depth as a positive number, zero at the surface', () => {
    expect(depth(0)).toBe(0);
    expect(depth(DEEPEST_CH)).toBeCloseTo(60, 5);
  });

  it('descends then climbs, with no reversal in between', () => {
    let seenBottom = false;
    let prev = elevation(0);
    for (let ch = 25; ch <= CH_END; ch += 25) {
      const e = elevation(ch);
      if (!seenBottom && e > prev + 0.001) seenBottom = true;
      // Once climbing, never descend again.
      if (seenBottom) expect(e).toBeGreaterThanOrEqual(prev - 0.001);
      prev = e;
    }
    expect(seenBottom).toBe(true);
  });
});

describe('gradient', () => {
  it('is negative on the descent and positive on the climb', () => {
    expect(gradient(1000)).toBeLessThan(0);
    expect(gradient(9000)).toBeGreaterThan(0);
  });

  it('stays within a plausible railway envelope everywhere', () => {
    for (let ch = 0; ch <= CH_END; ch += 25) {
      expect(Math.abs(gradient(ch))).toBeLessThan(5);
    }
  });
});

describe('the crossing', () => {
  it('changes continent exactly once, at the divide', () => {
    expect(continent(DIVIDE_CH - 1)).toBe('EU');
    expect(continent(DIVIDE_CH)).toBe('AS');

    let flips = 0;
    let prev = continent(0);
    for (let ch = 0; ch <= CH_END; ch += 10) {
      const c = continent(ch);
      if (c !== prev) flips++;
      prev = c;
    }
    expect(flips).toBe(1);
  });

  it('places the immersed tube at the published length', () => {
    expect(IMMERSED_END - IMMERSED_START).toBe(CORRIDOR.immersedM.value);
    expect(medium(IMMERSED_START + 10)).toBe('immersed');
    expect(medium(IMMERSED_START - 200)).toBe('bored');
  });

  it('numbers eleven elements, and only inside the tube', () => {
    expect(element(IMMERSED_START - 1)).toBeNull();
    expect(element(IMMERSED_END + 1)).toBeNull();
    expect(element(IMMERSED_START + 1)).toBe(1);
    expect(element(IMMERSED_END - 1)).toBe(11);
    expect(ELEMENT_JOINTS).toHaveLength(10);
  });

  it('puts water overhead only while under the strait', () => {
    expect(overburden(0).water).toBe(0);
    expect(overburden(CH_END).water).toBe(0);
    expect(isUnderStrait(DEEPEST_CH)).toBe(true);
    expect(isUnderStrait(1000)).toBe(false);
  });

  it('never reports negative material overhead', () => {
    for (let ch = 0; ch <= CH_END; ch += 25) {
      const o = overburden(ch);
      expect(o.ground).toBeGreaterThanOrEqual(0);
      expect(o.water).toBeGreaterThanOrEqual(0);
      expect(o.total).toBeCloseTo(o.ground + o.water, 6);
    }
  });
});

describe('stops', () => {
  it('finds each stop exactly at its own chainage', () => {
    for (const s of STOPS) {
      const n = nearestStop(s.ch);
      expect(n.stop.id).toBe(s.id);
      expect(n.proximity).toBeCloseTo(1, 6);
    }
  });

  it('falls to zero proximity between stops', () => {
    expect(nearestStop(1800).proximity).toBe(0);
  });
});

describe('bands', () => {
  it('steps rather than interpolating, and deepens monotonically to the bottom', () => {
    const order = ['surface', 'shallow', 'deep', 'seabed', 'abyssal'];
    let maxSeen = 0;
    for (let ch = 0; ch <= DEEPEST_CH; ch += 25) {
      const i = order.indexOf(band(ch));
      expect(i).toBeGreaterThanOrEqual(0);
      maxSeen = Math.max(maxSeen, i);
    }
    expect(order[maxSeen]).toBe('abyssal');
    expect(band(0)).toBe('surface');
  });
});

describe('formatting', () => {
  it('uses a real minus sign for depths, not a hyphen', () => {
    expect(formatLevel(-60)).toBe('−' + '60 m');
    expect(formatLevel(-60)).not.toContain('-');
    expect(formatLevel(4)).toBe('+4 m');
  });

  it('formats chainage the way a long-section is annotated', () => {
    expect(formatCh(0)).toBe('0+000');
    expect(formatCh(6700)).toBe('6+700');
    expect(formatCh(13_600)).toBe('13+600');
  });
});

describe('Turkish case mapping', () => {
  it('uppercases the dotless i correctly, where the naive call does not', () => {
    expect(upper('istanbul', 'tr')).toBe('İSTANBUL');
    /* eslint-disable no-restricted-syntax --
       These two bare calls ARE the bug. The lint rule bans them in source; the
       test has to make one to prove the rule is worth having. If they ever
       agree, the runtime changed and the guard has stopped guarding. */
    expect('istanbul'.toUpperCase()).toBe('ISTANBUL');
    expect(upper('istanbul', 'tr')).not.toBe('istanbul'.toUpperCase());
    /* eslint-enable no-restricted-syntax */
  });

  it('lowercases the dotted I correctly', () => {
    expect(lower('IST', 'tr')).toBe('ıst');
    expect(lower('İST', 'tr')).toBe('ist');
  });

  it('produces precomposed I-dot, never a decomposed dot-above', () => {
    // Written as escapes on purpose. İ and İ render identically
    // in every editor, so a well-meaning tidy-up that swapped one for the other
    // would silently invert what this test checks. That already happened once.
    const PRECOMPOSED = 'İ';
    const COMBINING_DOT = '̇';

    expect(upper('Sirkeci', 'tr')).toBe('S' + PRECOMPOSED + 'RKEC' + PRECOMPOSED);

    for (const s of STOPS) {
      const u = upper(s.name, 'tr');
      // A decomposed result looks right and breaks length, sorting, and any
      // width calculation a departure board does.
      expect(u).not.toContain(COMBINING_DOT);
      expect(u).toHaveLength(s.name.length);
      expect(u.normalize('NFC')).toBe(u);
    }
  });

  it('leaves English alone', () => {
    expect(upper('istanbul', 'en')).toBe('ISTANBUL');
  });
});
