/**
 * The citation registry.
 *
 * A site that looks like a government transit site is the worst possible place
 * for a plausible invented number. Someone reads "sixty metres" and believes it,
 * because the page is wearing the clothes of an authority.
 *
 * So every figure this site publishes carries one of two things: a key into this
 * registry, or the `indicative` flag. There is no third option, and the contrast
 * gate is not the only thing that fails the build - `scripts/check-sources.mjs`
 * walks the data and rejects any published quantity with neither.
 *
 * `confidence` is not decoration either. It drives how a figure renders: `measured`
 * prints plainly, `derived` prints with a tilde, `indicative` prints greyed with a
 * dotted underline and a tooltip saying so. The reader can tell at a glance which
 * numbers to trust, which is more than most real government sites manage.
 */

export type Confidence = 'measured' | 'derived' | 'indicative';

export interface Source {
  /** Short label shown inline, e.g. "Railway Technology". */
  label: string;
  /** What this source actually establishes. Written for a reader, not a bibliography. */
  covers: string;
  confidence: Confidence;
}

export const SOURCES = {
  'marmaray-engineering': {
    label: 'Marmaray project engineering record',
    covers:
      'Corridor and tunnel lengths, the immersed-tube section, crossing depth, opening date.',
    confidence: 'measured',
  },
  'immersed-tube': {
    label: 'Immersed tunnel construction record',
    covers: 'Eleven precast elements, their dimensions, and the seabed trench method.',
    confidence: 'measured',
  },
  'yenikapi-excavation': {
    label: 'Yenikapı rescue excavation reports',
    covers:
      'The Theodosian Harbour, the recovered Byzantine hulls, the artefact count, and the Neolithic horizon.',
    confidence: 'measured',
  },
  'metro-istanbul-network': {
    label: 'Metro İstanbul network statement',
    covers: 'Line count, station count, and route kilometres in service.',
    confidence: 'measured',
  },
  'tunel-1875': {
    label: 'İETT Tünel historical record',
    covers: 'Opening date, route length, journey time, and the funicular arrangement.',
    confidence: 'measured',
  },
  'istanbul-climate': {
    label: 'İstanbul climate normals',
    covers: 'Mean annual days with lying snow.',
    confidence: 'derived',
  },
  'alignment-indicative': {
    label: 'Reconstructed from the published long-section',
    covers:
      'Per-station chainage and platform level. Scaled off the published section drawing, not surveyed. Treat as indicative.',
    confidence: 'indicative',
  },
} as const satisfies Record<string, Source>;

export type SourceKey = keyof typeof SOURCES;

/** A quantity that knows where it came from. Nothing else may be published. */
export interface Cited<T> {
  value: T;
  source: SourceKey;
}

export const cite = <T>(value: T, source: SourceKey): Cited<T> => ({ value, source });

export const confidenceOf = (key: SourceKey): Confidence => SOURCES[key].confidence;

/** True when a figure must be rendered as visibly uncertain. */
export const isIndicative = (key: SourceKey): boolean =>
  SOURCES[key].confidence === 'indicative';
