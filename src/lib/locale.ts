/**
 * Language, and the dotted i.
 *
 * Turkish has four i's - ı I and i İ - and they do not case-map the way every
 * other Latin-script language's do. `'istanbul'.toUpperCase()` yields ISTANBUL,
 * which is simply a misspelling; the correct form is İSTANBUL. Lowercasing runs
 * the same way: 'I'.toLowerCase() should give 'ı', not 'i'.
 *
 * Transit interfaces are full of uppercase place names - platform indicators,
 * departure boards, signage - so on this site every one of those strings passes
 * through a case-mapping call. Getting it wrong would misspell station names on
 * a page about İstanbul, which is not a defect anyone should have to report.
 *
 * `upper()` and `lower()` below are the only sanctioned way to change case, and
 * `npm test` fails if a naive call would have produced a different answer. The
 * eslint config bans the bare methods outright.
 */

export const LOCALES = ['tr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'tr';

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

/** Uppercase, correctly, in the locale the text is actually in. */
export const upper = (s: string, locale: Locale = DEFAULT_LOCALE): string =>
  s.toLocaleUpperCase(locale);

export const lower = (s: string, locale: Locale = DEFAULT_LOCALE): string =>
  s.toLocaleLowerCase(locale);

/**
 * Place names are not translated. Üsküdar is Üsküdar in every language, and a
 * transit site that anglicises its own station names is telling the reader it
 * was not made where it claims to be. This exists to make that a decision rather
 * than an oversight.
 */
export const placeName = (s: string): string => s;

/** Locale-aware URL for a path. Türkçe is unprefixed; English lives under /en/. */
export function href(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
  return locale === DEFAULT_LOCALE ? withSlash : `/en${withSlash}`;
}

/** The same page in the other language. */
export function alternate(path: string, locale: Locale): string {
  return href(path, locale === 'tr' ? 'en' : 'tr');
}

/** Numbers, in the reader's convention. 1.234,5 in Türkçe; 1,234.5 in English. */
export const num = (n: number, locale: Locale, opts: Intl.NumberFormatOptions = {}): string =>
  new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', opts).format(n);
