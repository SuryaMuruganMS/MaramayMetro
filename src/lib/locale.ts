/**
 * Language, direction, and the dotted i.
 *
 * ENGLISH IS PRIMARY
 * It was Turkish first, which read well as a principle and failed in practice:
 * visitors arriving with browser translation on got the site machine-translated
 * out of Turkish, and machine translation does not know that KOT is a surveying
 * abbreviation for elevation. It rendered as "JEANS" — kot being denim in
 * Turkish — on a depth readout. English default, real translations for the
 * rest, and nothing is left to a translation engine to guess at.
 *
 * PLACE NAMES ARE NEVER TRANSLATED
 * Üsküdar is Üsküdar in all four languages. A station name is what is painted
 * on the platform, and a visitor matching a sign to a screen needs the same
 * string in both places.
 *
 * THE DOTTED I
 * Turkish has four i's - ı I and i İ - and they do not case-map the way every
 * other Latin-script language's do. `'istanbul'.toUpperCase()` yields ISTANBUL,
 * which is a misspelling; the correct form is İSTANBUL. Since place names stay
 * Turkish in every language, this matters on the Arabic and Russian pages too.
 * `upper()` and `lower()` below are the only sanctioned way to change case, and
 * eslint bans the bare methods outright.
 */

export const LOCALES = ['en', 'tr', 'ar', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

/** English, because most people arriving at this site do not read Turkish. */
export const DEFAULT_LOCALE: Locale = 'en';

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

/** What each language calls itself. Never translated into the others. */
export const LOCALE_NAME: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
  ar: 'العربية',
  ru: 'Русский',
};

/** Short tag for the switcher, where there is no room for the full name. */
export const LOCALE_TAG: Record<Locale, string> = {
  en: 'EN',
  tr: 'TR',
  ar: 'AR',
  ru: 'RU',
};

/**
 * Writing direction.
 *
 * Arabic sets the document to RTL, which flips reading order, alignment and
 * every logical margin. It does NOT flip the crossing: that track runs west to
 * east because the railway does, and a compass bearing is not a text direction.
 * The track is pinned back to `direction: ltr` in CSS for exactly that reason.
 */
export const dirOf = (locale: Locale): 'ltr' | 'rtl' => (locale === 'ar' ? 'rtl' : 'ltr');

/** The BCP-47 tag, for `Intl` and for `lang`. */
export const BCP47: Record<Locale, string> = {
  en: 'en-GB',
  tr: 'tr-TR',
  ar: 'ar',
  ru: 'ru-RU',
};

/** Uppercase, correctly, in the locale the text is actually in. */
export const upper = (s: string, locale: Locale = DEFAULT_LOCALE): string =>
  s.toLocaleUpperCase(BCP47[locale]);

export const lower = (s: string, locale: Locale = DEFAULT_LOCALE): string =>
  s.toLocaleLowerCase(BCP47[locale]);

/**
 * Place names are not translated. This exists so that leaving one untranslated
 * is a decision with a name on it rather than an oversight.
 */
export const placeName = (s: string): string => s;

/** Locale-aware URL. English is unprefixed; the rest live under their tag. */
export function href(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
  return locale === DEFAULT_LOCALE ? withSlash : `/${locale}${withSlash}`;
}

/** The same page in another language. */
export const switchTo = (path: string, to: Locale): string => href(path, to);

/** Every language's URL for one page, for the switcher and for hreflang. */
export const allHrefs = (path: string): Array<{ locale: Locale; href: string }> =>
  LOCALES.map((l) => ({ locale: l, href: href(path, l) }));

/** Numbers in the reader's convention: 1,234.5 / 1.234,5 / ١٬٢٣٤٫٥ */
export const num = (n: number, locale: Locale, opts: Intl.NumberFormatOptions = {}): string =>
  new Intl.NumberFormat(BCP47[locale], opts).format(n);

/** Currency, for the fare tables. */
export const lira = (n: number, locale: Locale): string =>
  new Intl.NumberFormat(BCP47[locale], {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(n);
