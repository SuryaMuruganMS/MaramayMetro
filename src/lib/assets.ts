import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Does this asset actually exist?
 *
 * Every image on this site has a designed fallback — an İznik tile panel, a
 * drawn gradient — precisely so the page is complete before the photographs
 * arrive. That only works if the component KNOWS the file is missing. Passing a
 * path to a file that is not there produces a broken-image icon and the alt
 * text, which is worse than either the photograph or the fallback.
 *
 * Astro builds statically, so this is a filesystem check at build time and
 * costs nothing at runtime. It also means adding a picture is genuinely just
 * dropping the file in `public/` — nothing to wire up, and the site picks it up
 * on the next build.
 */
const PUBLIC = 'public';

export const hasAsset = (path: string): boolean =>
  existsSync(join(PUBLIC, path.replace(/^\//, '')));

/** The path if the file is there, otherwise undefined so the fallback runs. */
export const asset = (path: string): string | undefined => (hasAsset(path) ? path : undefined);

/**
 * A two-mode image stem. Both files have to exist, because showing one mode's
 * photograph against the other mode's palette looks like a bug rather than a
 * missing asset.
 */
export function modeAsset(stem: string): string | undefined {
  return hasAsset(`${stem}-day.webp`) && hasAsset(`${stem}-night.webp`) ? stem : undefined;
}

/** Same rule for the film band, which needs a day and a night cut. */
export function filmAsset(stem: string): string | undefined {
  return hasAsset(`${stem}-day.mp4`) && hasAsset(`${stem}-night.mp4`) ? stem : undefined;
}
