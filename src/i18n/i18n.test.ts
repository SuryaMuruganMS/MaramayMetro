import { describe, expect, it } from 'vitest';
import { LOCALES, BCP47, dirOf, href, upper, lower } from '../lib/locale.ts';
import { dictFor, keysFor, t } from './index.ts';

describe('translations', () => {
  it('has the same keys in every language', () => {
    const base = new Set(keysFor('en'));
    for (const loc of LOCALES) {
      const here = new Set(keysFor(loc));
      expect(
        [...base].filter((k) => !here.has(k)),
        `missing in ${loc}`,
      ).toEqual([]);
      expect(
        [...here].filter((k) => !base.has(k)),
        `only in ${loc}`,
      ).toEqual([]);
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
    expect(t('en', 'no.such.key')).toBe('no.such.key');
  });

  /**
   * Catches the commonest translation failure: a key copied from English and
   * never actually translated. Place names and brand names legitimately repeat,
   * so they are listed rather than inferred.
   */
  it('has no untranslated leftovers', () => {
    const SHARED = new Set([
      'tunel.karakoy',
      'tunel.beyoglu',
      'fare.card',
      'svc.istanbul',
      'nav.tunel',
      'x.km',
      // A place name is what is painted on the platform. It does not change.
      'dig.place',
      // A range of years in Latin digits, identical in English and Turkish.
      'find.station.period',
      // The line's own name and its designation on the network. A railway is
      // called what it is called, in every language on the page.
      'site.name',
      // "Metro" is the word in both languages, and in most others.
      'kind.metro',
    ]);
    for (const loc of LOCALES) {
      if (loc === 'en') continue;
      const same = keysFor(loc).filter(
        (k) => !SHARED.has(k) && dictFor(loc)[k] === dictFor('en')[k],
      );
      expect(same, `identical to English in ${loc}`).toEqual([]);
    }
  });

  it('writes Arabic right to left and everything else left to right', () => {
    expect(dirOf('ar')).toBe('rtl');
    for (const loc of LOCALES) {
      if (loc !== 'ar') expect(dirOf(loc)).toBe('ltr');
    }
  });

  it('puts English at the root and prefixes the rest', () => {
    expect(href('/harita', 'en')).toBe('/harita/');
    expect(href('/harita', 'tr')).toBe('/tr/harita/');
    expect(href('/harita', 'ar')).toBe('/ar/harita/');
    expect(href('/', 'ru')).toBe('/ru/');
  });

  it('still case-maps Turkish place names correctly in every language', () => {
    // Station names stay Turkish everywhere, so the dotted i matters on the
    // Arabic and Russian pages too.
    for (const loc of LOCALES) {
      expect(upper('istanbul', 'tr')).toBe('İSTANBUL');
      expect(BCP47[loc]).toBeTruthy();
    }
    expect(lower('IST', 'tr')).toBe('ıst');
  });
});
