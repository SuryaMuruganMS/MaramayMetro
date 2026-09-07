import type { Locale } from '../lib/locale.ts';
import { en, type Keys } from './en.ts';
import { tr } from './tr.ts';
import { ar } from './ar.ts';
import { ru } from './ru.ts';

/**
 * One dictionary per language, one file each.
 *
 * English is the reference: every other language is typed as
 * `Record<Keys, string>`, so a missing key is a compile error rather than a raw
 * key rendered at a reader, and an extra one is too. `i18n.test.ts` also checks
 * for strings that were left in English by accident.
 */
const DICTS: Record<Locale, Record<Keys, string>> = { en, tr, ar, ru };

export type { Keys };

/**
 * A missing key returns the key itself rather than an empty string, so a gap is
 * loud in the interface instead of rendering nothing. The type system should
 * make this unreachable; it is here for the runtime that types do not cover.
 */
export function t(locale: Locale, key: string): string {
  const d = DICTS[locale] as Record<string, string>;
  return d[key] ?? (DICTS.en as Record<string, string>)[key] ?? key;
}

/** Bound translator, so templates read `tt('nav.map')`. */
export const translator =
  (locale: Locale) =>
  (key: string): string =>
    t(locale, key);

export const keysFor = (locale: Locale): string[] => Object.keys(DICTS[locale]);
export const allKeys = (): string[] => Object.keys(DICTS.en);
export const dictFor = (locale: Locale): Record<string, string> =>
  DICTS[locale] as Record<string, string>;
