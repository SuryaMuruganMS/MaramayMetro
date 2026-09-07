/**
 * The finds rail: the excavation, read sideways.
 *
 * The strata section on the same page runs DOWN, because at Yenikapı depth and
 * time are the same axis and pretending otherwise would throw away the one
 * thing that site is famous for. This runs ACROSS, and it is a different
 * question: not "what was underneath" but "what came out".
 *
 * A gallery is the right shape for that. Each panel is one class of find, with
 * the picture or the footage large and the text beside it, and you move through
 * them the way you would move along a display case — which is also, not
 * incidentally, how the material is shown at the station today.
 *
 * WHAT IS REAL
 * Everything factual: the harbour's dates and the reason it silted, the
 * thirty-seven hulls, the galleys being the first Byzantine warships ever
 * excavated, the anaerobic mud that preserved rope and leather, the Neolithic
 * horizon at the base, and the four-year delay. The imagery is generated for a
 * concept build and the page says so; the record it illustrates is not.
 */

export type FindMedia = 'image' | 'video';

export interface Find {
  id: string;
  /** Dictionary prefix. Each panel needs `.period`, `.title`, `.body`, `.stat`. */
  key: string;
  /** Asset stem under `public/`. Two modes are expected: `-day` and `-night`. */
  stem: string;
  media: FindMedia;
  /**
   * The figure printed large beside the caption.
   *
   * A number, not a formatted string. It was a string, and "100 000" came out
   * of the mono face looking like two numbers with a gap between them — while
   * also being wrong in three of the four languages, which group and separate
   * digits differently. The unit belongs to `<key>.stat`; the grouping belongs
   * to Intl.
   */
  figure: number;
  /** Which layer of the section this find came out of, for the tie-back. */
  layer: string;
}

export const FINDS: Find[] = [
  {
    id: 'harbour',
    key: 'find.harbour',
    stem: '/finds/harbour',
    media: 'image',
    figure: 800,
    layer: 'byzantine',
  },
  {
    id: 'hulls',
    key: 'find.hulls',
    stem: '/finds/hulls',
    media: 'image',
    figure: 37,
    layer: 'byzantine',
  },
  {
    id: 'galleys',
    key: 'find.galleys',
    stem: '/finds/galleys',
    media: 'image',
    figure: 6,
    layer: 'byzantine',
  },
  {
    id: 'mud',
    key: 'find.mud',
    stem: '/finds/mud',
    media: 'video',
    figure: 100_000,
    layer: 'byzantine',
  },
  {
    id: 'neolithic',
    key: 'find.neolithic',
    stem: '/finds/neolithic',
    media: 'image',
    figure: 8500,
    layer: 'neolithic',
  },
  {
    id: 'station',
    key: 'find.station',
    stem: '/finds/station',
    media: 'video',
    figure: 4,
    layer: 'modern',
  },
];

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/**
 * The same arrangement as the crossing, at gallery scale.
 *
 * One source for the widths, because CSS lays the panels out and the progress
 * control maps scroll position onto them, and those two disagreeing is how a
 * tick ends up pointing at the gap between two panels.
 */
export const FIND_VW = 58;
/** A strip of ground before the first panel, so it arrives rather than starts. */
export const FINDS_LEAD = 6;
/** And after the last, so the final panel can sit fully in frame. */
export const FINDS_TAIL = 100 - FIND_VW;

export const FINDS_TRACK_VW = FINDS_LEAD + FINDS.length * FIND_VW + FINDS_TAIL;
/** How far the track travels. The runway is this tall, plus one viewport. */
export const FINDS_SCRUB_VW = FINDS_TRACK_VW - 100;

/** Left edge of a panel, in vw from the start of the track. */
export const findOffset = (i: number): number => FINDS_LEAD + i * FIND_VW;

/**
 * Where a panel sits in the scroll, 0 to 1.
 *
 * Used by the progress ticks to jump to a panel, and by the reader to know
 * where they are. Clamped, because the last panel's offset exceeds the scrub
 * distance by the width of the tail.
 */
export const findProgress = (i: number): number =>
  Math.min(1, Math.max(0, findOffset(i) / FINDS_SCRUB_VW));
