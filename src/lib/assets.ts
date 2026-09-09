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

/**
 * The film band and the finds clips, one mode at a time.
 *
 * Unlike a still, a clip is allowed to arrive alone. Footage is slower and
 * dearer to make than a photograph, and the night cuts landed first — so
 * requiring the pair would have meant showing neither, which is the wrong
 * answer when one of them is finished and good.
 *
 * A mode with no clip falls back to its poster still, which is a frame of the
 * same shot: the page is complete, the reader gets the picture rather than a
 * hole, and the moment the other cut lands it starts moving. Neither present
 * and the component draws its own panel.
 */
export interface ModeFilm {
  day?: string;
  night?: string;
}

export function filmAsset(stem: string): ModeFilm {
  return {
    day: hasAsset(`${stem}-day.mp4`) ? `${stem}-day.mp4` : undefined,
    night: hasAsset(`${stem}-night.mp4`) ? `${stem}-night.mp4` : undefined,
  };
}

/** Poster stills, per mode, on the same convention. */
export function posterAsset(stem: string): ModeFilm {
  return {
    day: hasAsset(`${stem}-day.webp`) ? `${stem}-day.webp` : undefined,
    night: hasAsset(`${stem}-night.webp`) ? `${stem}-night.webp` : undefined,
  };
}
