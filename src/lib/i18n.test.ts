import { describe, expect, it } from 'vitest';
import { LOCALES } from './locale.ts';
import { keysFor, t } from './i18n.ts';

describe('translations', () => {
  it('has the same keys in every language', () => {
    const base = new Set(keysFor('tr'));
    for (const loc of LOCALES) {
      const here = new Set(keysFor(loc));
      const missing = [...base].filter((k) => !here.has(k));
      const extra = [...here].filter((k) => !base.has(k));
      expect(missing, `missing in ${loc}`).toEqual([]);
      expect(extra, `only in ${loc}`).toEqual([]);
    }
  });

  it('never returns an empty string', () => {
    for (const loc of LOCALES) {
      for (const k of keysFor(loc)) {
        expect(t(loc, k).trim().length, `${loc}:${k}`).toBeGreaterThan(0);
      }
    }
  });

  it('returns the key itself when one is missing, so a gap is loud', () => {
    expect(t('tr', 'no.such.key')).toBe('no.such.key');
  });

  it('keeps Turkish diacritics — an ASCII-only Turkish string is a bug', () => {
    // Every one of these was written without diacritics at some point during
    // the build, which is a misspelling rather than a style choice.
    const needsDiacritics = [
      'map.title',
      'map.station',
      'reg.diagram',
      'reg.geographic',
      'map.continent',
      'map.no',
    ];
    for (const k of needsDiacritics) {
      expect(/[çğıİöşüÇĞÖŞÜ]/.test(t('tr', k)), `${k} has no Turkish letters`).toBe(true);
    }
  });
});
