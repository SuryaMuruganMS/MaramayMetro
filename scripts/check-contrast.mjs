import { readFileSync } from 'node:fs';

/**
 * The contrast gate.
 *
 * This site changes its ground colour five times as you descend and again
 * between day and night service - forty combinations of ink and ground that a
 * person would have to check by eye, one at a time, and would not.
 *
 * On the last project a secondary ink shipped at 3.99:1 because the failure
 * only happened BETWEEN two named colour stops, where nobody had looked. Here
 * the bands are discrete, so every combination can simply be enumerated.
 *
 * No dependencies: the token file is parsed directly, and sRGB relative
 * luminance is eleven lines of arithmetic.
 */

const AA_TEXT = 4.5;
const AA_LARGE = 3.0;

const css = readFileSync('src/styles/tokens.css', 'utf8');

/**
 * Read the variables from exactly one CSS rule.
 *
 * The first version sliced from a start marker to an end marker, which quietly
 * ran the "day" slice straight through the `prefers-color-scheme: dark` block
 * and picked up the dark values. Day and night then reported identical ratios -
 * the gate was checking night twice and had never once looked at day. Balanced
 * brace matching is the only way to be sure a rule is the rule you asked for.
 */
function ruleVars(selector) {
  const at = css.indexOf(selector + ' {');
  if (at < 0) throw new Error(`rule not found: ${selector}`);
  let i = css.indexOf('{', at);
  let depth = 0;
  const from = i + 1;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const body = css.slice(from, i);
  const out = {};
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const hexToRgb = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

// Day is the bare :root rule. Night is the explicit [data-service='night'] rule,
// which mirrors the prefers-color-scheme block; testing the explicit one is
// enough because the two are kept identical by `check-service-parity` below.
const dayAll = ruleVars(':root');
const night = ruleVars(":root[data-service='night']");

const BANDS = ['surface', 'shallow', 'deep', 'seabed', 'abyssal'];

/** Ink roles and the minimum each has to clear. */
const INKS = [
  { name: 'ink', min: AA_TEXT },
  { name: 'ink-2', min: AA_TEXT },
  { name: 'ink-3', min: AA_TEXT },
  /*
   * ink-4 is held to the full text minimum, not the 3:1 non-text one.
   *
   * It was exempted at first on the grounds that it only carries micro labels.
   * That is exactly the reasoning that lets small grey text ship at 3.5:1, and
   * the accessibility page on this site claims AA - so the claim sets the bar,
   * not convenience.
   */
  { name: 'ink-4', min: AA_TEXT },
];

const rows = [];
let worst = { r: Infinity };
let fails = 0;

for (const [service, vars] of [
  ['day', { ...dayAll }],
  ['night', { ...dayAll, ...night }],
]) {
  for (const band of BANDS) {
    const ground = vars[`band-${band}`];
    if (!ground) throw new Error(`missing --band-${band} for ${service}`);
    for (const ink of INKS) {
      const fg = vars[ink.name];
      const r = ratio(fg, ground);
      const pass = r >= ink.min;
      if (!pass) fails++;
      if (r < worst.r) worst = { r, service, band, ink: ink.name };
      rows.push({ service, band, ink: ink.name, r, min: ink.min, pass });
    }

    // Pigments carrying text on the band ground: the accent is used for live
    // readout values against it.
    for (const pig of ['accent', 'gold', 'turquoise', 'cobalt']) {
      const fg = vars[pig];
      if (!fg) continue;
      const r = ratio(fg, ground);
      const pass = r >= AA_LARGE;
      if (!pass) fails++;
      if (r < worst.r) worst = { r, service, band, ink: pig };
      rows.push({ service, band, ink: pig, r, min: AA_LARGE, pass });
    }
  }

  // White on pigment: every capsule, roundel and tile button.
  for (const pig of ['accent', 'cobalt', 'turquoise', 'bole']) {
    const bg = vars[pig];
    const fg = vars['ink-on-pigment'];
    if (!bg || !fg) continue;
    const r = ratio(fg, bg);
    const pass = r >= AA_LARGE;
    if (!pass) fails++;
    if (r < worst.r) worst = { r, service, band: 'on-pigment', ink: pig };
    rows.push({
      service,
      band: 'on-pigment',
      ink: `${pig} + ink-on-pigment`,
      r,
      min: AA_LARGE,
      pass,
    });
  }
}

/**
 * Night is defined twice - once under prefers-color-scheme, once under the
 * explicit [data-service='night'] attribute - because a viewer has three
 * states, not two. The gate measures only the explicit rule, so if the two ever
 * drift, half the readers get colours nothing has checked.
 */
const mediaNight = (() => {
  const at = css.indexOf('@media (prefers-color-scheme: dark)');
  const end = css.indexOf(":root[data-service='night']", at);
  const body = css.slice(at, end);
  const out = {};
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out[m[1]] = m[2];
  return out;
})();

const parity = [];
for (const k of new Set([...Object.keys(mediaNight), ...Object.keys(night)])) {
  if (mediaNight[k] !== night[k]) {
    parity.push(
      `  --${k}: media ${mediaNight[k] ?? '(absent)'} vs attribute ${night[k] ?? '(absent)'}`,
    );
  }
}
if (parity.length) {
  console.log('\n  NIGHT SERVICE IS DEFINED TWICE AND THE TWO DISAGREE:\n');
  console.log(parity.join('\n'));
  console.log('\n  Readers on a dark OS get the first set; readers who pressed');
  console.log('  the switch get the second. Only one has been checked.\n');
  process.exit(1);
}

console.log(`\n  CONTRAST — ${rows.length} pairs across 5 depth bands x 2 services`);
console.log('  night service: media-query and attribute definitions agree\n');

for (const row of rows.filter((x) => !x.pass)) {
  console.log(
    `  FAIL  ${row.service.padEnd(6)} ${row.band.padEnd(11)} ${row.ink.padEnd(24)} ${row.r.toFixed(2)}:1  needs ${row.min}`,
  );
}

console.log(
  `  worst ${worst.r.toFixed(2)}:1  (${worst.service} · ${worst.band} · ${worst.ink})`,
);

if (fails > 0) {
  console.log(`\n  ${fails} pair(s) below the minimum.\n`);
  process.exit(1);
}
console.log('\n  All pairs meet WCAG AA for their role.\n');
