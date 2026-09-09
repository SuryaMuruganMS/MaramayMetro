import sharp from 'sharp';
import { readdirSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';

/**
 * Bring generated artwork into `public/`.
 *
 * The generator hands back PNGs of two to three megabytes each with timestamps
 * for names. The site wants WebP under two hundred kilobytes at a known path,
 * because the budget gate refuses the build otherwise and because a filename
 * has to say what the picture is.
 *
 * Run by hand after a batch of generations, and commit the result:
 *
 *   node scripts/import-assets.mjs "../maramay pics"
 *
 * ORDER IS THE CONTRACT. The images are matched to paths by their position in
 * the folder listing, which works because they were generated straight down the
 * asset register in day/night pairs. That is fragile and deliberately so — a
 * mismatch is loud (the wrong picture on the wrong page) rather than quiet, and
 * the alternative is asking a person to rename twenty-eight files by hand. The
 * script prints what it matched; check the list before committing.
 */

const SRC = process.argv[2] ?? '../maramay pics';
const MAX_KB = 190; // the budget gate's image ceiling is 200
const PUBLIC = 'public';

/** Position in the source listing → path in `public/`, without extension. */
const IMAGES = [
  'img/hero-day',
  'img/hero-night',
  'img/film-poster-day',
  'img/film-poster-night',
  'img/travel-gate-day',
  'img/travel-gate-night',
  'img/travel-safety-day',
  'img/travel-safety-night',
  'img/travel-cab-day',
  'img/travel-cab-night',
  'img/build-cut-day',
  'img/build-cut-night',
  'img/build-bored-day',
  'img/build-bored-night',
  'img/build-immersed-day',
  'img/build-immersed-night',
  'finds/harbour-day',
  'finds/harbour-night',
  'finds/hulls-day',
  'finds/hulls-night',
  'finds/galleys-day',
  'finds/galleys-night',
  'finds/mud-day',
  'finds/mud-night',
  'finds/neolithic-day',
  'finds/neolithic-night',
  'finds/station-day',
  'finds/station-night',
];

/**
 * Clips, matched by shape and length rather than by position, because three
 * files is few enough to identify and their names carry no order.
 *   1366x768 / ~6s  — the station concourse
 *   1280x720 / ~10s — the train in the tunnel
 *   720x1280 / ~10s — the conservation table, the only portrait one
 */
const VIDEO_BY_SHAPE = {
  portrait: 'finds/mud-night.mp4',
  short: 'finds/station-night.mp4',
  wide: 'film/crossing-night.mp4',
};

/** Longest edge of the output. Beyond this nobody can see the difference. */
const LONG_EDGE = 1600;

const kb = (p) => statSync(p).size / 1024;

/**
 * Quality AND size are searched, not guessed.
 *
 * A flat quality number produces a 90 KB picture of a dark tunnel and a 400 KB
 * picture of a bright quayside, and only the second one breaks the budget. So
 * quality walks down first, because a slightly softer picture at full size
 * beats a crisp one at half.
 *
 * Some pictures cannot be bought at any quality. The excavation shots are the
 * whole frame filled with fine random texture — wet mud, broken stone, timber
 * grain — which is exactly what a lossy codec cannot throw away, and five of
 * them were still over budget at the bottom of the quality ladder. For those
 * the resolution comes down too. They are displayed at about 550 CSS px tall,
 * so 1100 px is still two device pixels per CSS pixel and nobody will see it.
 */
async function encode(src, out) {
  mkdirSync(dirname(out), { recursive: true });
  const meta = await sharp(src).metadata();
  const longest = Math.max(meta.width, meta.height);
  const base = Math.min(1, LONG_EDGE / longest);

  let last = null;
  for (const shrink of [1, 0.88, 0.78, 0.7]) {
    const w = Math.round(meta.width * base * shrink);
    for (const q of [86, 80, 74, 68, 62, 56, 50]) {
      await sharp(src).resize(w).webp({ quality: q, effort: 6 }).toFile(out);
      last = { q, kb: kb(out), w };
      if (last.kb <= MAX_KB) return last;
    }
  }
  return { ...last, over: true };
}

const files = readdirSync(SRC);
const pngs = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
const vids = files.filter((f) => /\.(mp4|webm|mov)$/i.test(f)).sort();

if (pngs.length !== IMAGES.length) {
  console.error(
    `\n  ${pngs.length} images in the folder but ${IMAGES.length} slots in the register.` +
      `\n  Nothing written — fix the batch, or edit IMAGES in this script.\n`,
  );
  process.exit(1);
}

console.log(`\n  IMPORT — ${pngs.length} stills, ${vids.length} clips\n`);

let over = 0;
for (let i = 0; i < pngs.length; i++) {
  const out = join(PUBLIC, IMAGES[i] + '.webp');
  const r = await encode(join(SRC, pngs[i]), out);
  if (r.over) over++;
  console.log(
    `  ${r.over ? 'OVER' : ' ok '}  ${IMAGES[i].padEnd(26)} ${String(r.w).padStart(4)}px  q${r.q}  ${r.kb.toFixed(0)} KB`,
  );
}

// ------------------------------------------------------------------- clips
// Copied, not transcoded: there is no encoder on this machine, and the files
// arrive as H.264 in an MP4 already. If one ever needs shrinking that is a job
// for ffmpeg, by hand, not for this script pretending it can.
for (const v of vids) {
  const shape = await videoShape(join(SRC, v));
  const dest = VIDEO_BY_SHAPE[shape];
  if (!dest) {
    console.log(`  skip  ${v} — no slot for a ${shape} clip`);
    continue;
  }
  const out = join(PUBLIC, dest);
  mkdirSync(dirname(out), { recursive: true });
  copyFileSync(join(SRC, v), out);
  console.log(`  ok    ${dest.padEnd(26)} ${(kb(out) / 1024).toFixed(1)} MB  (${shape})`);
}

/**
 * Shape without a decoder.
 *
 * Walks the MP4 box tree — moov → trak → tkhd — and reads the track's display
 * size. It has to be a real walk rather than a scan for the four letters
 * "tkhd": in a file of three megabytes those bytes turn up inside the
 * compressed video data by chance, and the first cut of this believed one of
 * them and filed all three clips under the same name.
 */
async function videoShape(path) {
  const { readFileSync } = await import('node:fs');
  const buf = readFileSync(path);

  /** Every child box of the range, as {type, start, end} of its payload. */
  function* boxes(from, to) {
    let p = from;
    while (p + 8 <= to) {
      let size = buf.readUInt32BE(p);
      const type = buf.toString('latin1', p + 4, p + 8);
      let head = 8;
      if (size === 1) {
        // 64-bit size. Only the low half can matter at these file sizes.
        size = Number(buf.readBigUInt64BE(p + 8));
        head = 16;
      } else if (size === 0) {
        size = to - p; // runs to the end of its parent
      }
      if (size < head || p + size > to) return;
      yield { type, start: p + head, end: p + size };
      p += size;
    }
  }

  const find = (from, to, path) => {
    for (const b of boxes(from, to)) {
      if (b.type !== path[0]) continue;
      if (path.length === 1) return b;
      const hit = find(b.start, b.end, path.slice(1));
      if (hit) return hit;
    }
    return null;
  };

  let best = null;
  const moov = find(0, buf.length, ['moov']);
  if (moov) {
    for (const trak of boxes(moov.start, moov.end)) {
      if (trak.type !== 'trak') continue;
      const tkhd = find(trak.start, trak.end, ['tkhd']);
      if (!tkhd) continue;
      // Width and height are the last eight bytes of the tkhd payload, as
      // 16.16 fixed point. The payload is 84 bytes at version 0 and 96 at
      // version 1, where the times and duration widen to 64 bits.
      const version = buf[tkhd.start];
      const at = tkhd.start + (version === 1 ? 88 : 76);
      if (at + 8 > tkhd.end) continue;
      const w = buf.readUInt32BE(at) / 65536;
      const h = buf.readUInt32BE(at + 4) / 65536;
      // Sound tracks carry a zero size; the one with pixels is the picture.
      if (w > 0 && h > 0 && (!best || w * h > best.w * best.h)) best = { w, h };
    }
  }
  if (!best) throw new Error('no video track found in ' + path);
  if (best.h > best.w) return 'portrait';
  return best.w >= 1360 ? 'short' : 'wide';
}

console.log(
  over
    ? `\n  ${over} file(s) still over ${MAX_KB} KB at the lowest quality. Crop or resize them.\n`
    : `\n  All stills inside the ${MAX_KB} KB budget.\n`,
);
