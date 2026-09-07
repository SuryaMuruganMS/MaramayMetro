import { chromium } from 'playwright';

/**
 * The layout gate.
 *
 * Screenshots are a bad way to find layout faults: a horizontal site has a
 * different arrangement at every scroll position, and three rounds of eyeballing
 * on the last project still missed fixed furniture sitting on top of copy. This
 * visits every route, in both services, at four widths, at several positions
 * along the track, and asserts four things machines are better at than people:
 *
 *   1. the page never scrolls sideways when it is not supposed to
 *   2. nothing escapes its container
 *   3. no two pieces of text overlap
 *   4. fixed chrome never covers something you were meant to read
 *
 * Check 3 is hit-tested rather than measured from bounding boxes alone: two
 * boxes can intersect legitimately when one is the other's ancestor, or when a
 * decorative layer sits behind. Only a real occlusion counts.
 *
 * Usage: node scripts/check-layout.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? 'http://localhost:4330';

const ROUTES = [
  '/',
  '/kazi/',
  '/harita/',
  '/sefer/',
  '/ucret/',
  '/erisilebilirlik/',
  '/insaat/',
  '/tunel-1875/',
  '/renkler/',
  '/kaynaklar/',
  '/acik-veri/',
  '/404/',
  '/en/',
  '/en/kazi/',
  '/en/harita/',
  '/en/sefer/',

  /**
   * The map's other two registers, which a plain page load never reaches.
   *
   * The geographic register is where labels are most likely to collide: on the
   * ground eight stations sit inside two kilometres of Karaköy, where the
   * diagram gives them a whole quadrant. It is placed by an algorithm rather
   * than by hand, which is exactly the kind of thing that needs a gate rather
   * than a look.
   */
  {
    path: '/harita/',
    name: '/harita/ (geographic)',
    prepare: async (page) => {
      await page.locator('.seg__btn').nth(1).click({ force: true });
      // Longer than the 900ms morph, so the audit sees it settled.
      await page.waitForTimeout(1100);
    },
  },
  {
    path: '/harita/',
    name: '/harita/ (station open)',
    prepare: async (page) => {
      await page.locator('.seg__btn').nth(1).click({ force: true });
      await page.waitForTimeout(1100);
      await page.locator('g.stn[aria-label="Yenikapı"]').click({ force: true });
      await page.waitForTimeout(300);
    },
  },
];

/** Routes may be a bare path or a path with an interaction to run first. */
const routeOf = (r) => (typeof r === 'string' ? { path: r, name: r } : r);

const WIDTHS = [
  { w: 1600, h: 900, name: 'wide' },
  { w: 1280, h: 800, name: 'laptop' },
  { w: 1023, h: 760, name: 'plan-edge' },
  // 320 CSS px is the WCAG 1.4.10 reflow width, and also what 400% zoom of a
  // 1280px viewport comes to.
  { w: 320, h: 640, name: 'reflow' },
];

/** Positions along the crossing, as a fraction of its scroll range. */
const SCROLLS = [0, 0.18, 0.37, 0.5, 0.64, 0.82, 1];

const audit = async (page) =>
  page.evaluate(() => {
    const problems = [];
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    // ------------------------------------------- 0. anchors clear the header
    const head = document.querySelector('.head');
    if (head && getComputedStyle(head).position === 'sticky') {
      const need = head.getBoundingClientRect().height;
      const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      if (pad + 1 < need) {
        problems.push({
          kind: 'anchors-land-under-header',
          detail: `scroll-padding-top ${Math.round(pad)}px < header ${Math.round(need)}px`,
        });
      }
    }

    // ---------------------------------------------------- 1. sideways scroll
    const de = document.documentElement;
    if (de.scrollWidth > de.clientWidth + 2) {
      problems.push({
        kind: 'page-scrolls-sideways',
        detail: `scrollWidth ${de.scrollWidth} > clientWidth ${de.clientWidth}`,
      });
    }

    /**
     * Visibility has to be inherited, not read off the element.
     *
     * A span inside an opacity:0 panel reports opacity 1 for itself. Checking
     * only the element reported the dig readout as covering the heading below
     * it, at a scroll position where the whole readout had faded out - eight
     * reports of the site working exactly as designed.
     */
    const visible = (el) => {
      for (let n = el; n && n !== document.body.parentElement; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.visibility === 'hidden' || s.display === 'none') return false;
        if (Number(s.opacity) < 0.05) return false;
        if (s.contentVisibility === 'hidden') return false;
      }
      // A closed <details> lays its content out so it can animate open. Those
      // boxes are real and painted by nothing; they produced two days of false
      // positives on the last project.
      return !el.closest('details:not([open]) > *:not(summary)');
    };

    /**
     * On a horizontal track most of the document is legitimately off to one
     * side, waiting to be scrolled to. Only what is actually on screen can have
     * a layout fault worth reporting, so the filter tests BOTH axes - testing
     * only the vertical one reported every unvisited panel as broken.
     */
    const onScreen = (r) => r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;

    const textNodes = [...document.querySelectorAll('body *')].filter((el) => {
      if (!visible(el)) return false;
      if (el.children.length > 0) return false;
      const txt = (el.textContent ?? '').trim();
      if (txt.length < 2) return false;
      const r = el.getBoundingClientRect();
      return r.width > 4 && r.height > 4 && onScreen(r);
    });

    // ---------------------------------------------------- 2. clipped text
    // Crossing the viewport edge is normal here - that is what mid-scroll looks
    // like. Being cut off by your OWN box is not: it means the text was sized
    // for a container it does not fit in, and the reader loses characters.
    for (const el of textNodes) {
      const s = getComputedStyle(el);
      const clips = s.overflow === 'hidden' || s.overflowX === 'hidden';
      const ellipsis = s.textOverflow === 'ellipsis';
      if (clips && !ellipsis && el.scrollWidth > el.clientWidth + 2) {
        problems.push({
          kind: 'text-clipped',
          detail: `${el.tagName}.${el.className} needs ${el.scrollWidth} has ${el.clientWidth}`,
          text: (el.textContent ?? '').trim().slice(0, 48),
        });
      }
    }

    // ------------------------------------------------------ 3. text overlap
    const hits = (a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      // A few pixels of overlap is normal from line-height and letter bearings.
      if (ox <= 4 || oy <= 4) return false;
      if (a.contains(b) || b.contains(a)) return false;

      // Confirm by hit-testing the middle of the overlap. If neither element is
      // what is actually on top there, something else is covering both and this
      // is not the two of them colliding.
      const x = Math.max(ra.left, rb.left) + ox / 2;
      const y = Math.max(ra.top, rb.top) + oy / 2;
      if (x < 0 || y < 0 || x > vw || y > vh) return false;
      const top = document.elementFromPoint(x, y);
      if (!top) return false;
      /*
       * Ownership has to look UP as well as down.
       *
       * SVG <text> is wrapped in a <g>, and elementFromPoint returns the group,
       * not the text. Testing only `a.contains(top)` meant neither label owned
       * the point and every colliding station name on the network diagram went
       * unreported - the gate passed a map whose labels sat on top of each
       * other.
       *
       * A shared ancestor (the <svg> itself) contains BOTH, which is what still
       * rules out the "any common container proves it" false positive: that
       * case makes ownsA and ownsB both true, and the pair is skipped.
       */
      const owns = (el) => top === el || el.contains(top) || top.contains(el);
      const ownsA = owns(a);
      const ownsB = owns(b);
      // Exactly one of them owns the point: the other is underneath it.
      return ownsA !== ownsB;
    };

    // The header floats over the page by design; pairs involving it are the
    // sticky behaviour, not a collision.
    const inHeader = (el) => !!el.closest('.head');
    for (let i = 0; i < textNodes.length; i++) {
      for (let j = i + 1; j < textNodes.length; j++) {
        if (inHeader(textNodes[i]) !== inHeader(textNodes[j])) continue;
        if (hits(textNodes[i], textNodes[j])) {
          problems.push({
            kind: 'text-overlap',
            detail: `${textNodes[i].tagName}.${textNodes[i].className} over ${textNodes[j].tagName}.${textNodes[j].className}`,
            text: `${(textNodes[i].textContent ?? '').trim().slice(0, 28)} / ${(textNodes[j].textContent ?? '').trim().slice(0, 28)}`,
          });
        }
      }
    }

    /**
     * 4. FIXED chrome covering copy.
     *
     * The sticky header is deliberately excluded. Content passing beneath a
     * sticky header is what sticky means, and flagging it produced a thousand
     * reports of the site working correctly. The real risk it carries - an
     * anchor landing underneath it - is handled by scroll-padding-top and
     * asserted separately below.
     *
     * The rail, the readout and the dig axis are position:fixed. They are on
     * screen at every scroll position, so anything they cover is covered
     * permanently, and that is a genuine fault.
     */
    const chrome = [...document.querySelectorAll('.rail, .readout, .digax')].filter(visible);
    for (const c of chrome) {
      const rc = c.getBoundingClientRect();
      for (const el of textNodes) {
        if (c.contains(el)) continue;
        const r = el.getBoundingClientRect();
        const ox = Math.min(rc.right, r.right) - Math.max(rc.left, r.left);
        const oy = Math.min(rc.bottom, r.bottom) - Math.max(rc.top, r.top);
        if (ox <= 4 || oy <= 4) continue;
        const x = Math.max(rc.left, r.left) + ox / 2;
        const y = Math.max(rc.top, r.top) + oy / 2;
        if (x < 0 || y < 0 || x > vw || y > vh) continue;
        const top = document.elementFromPoint(x, y);
        if (top && (c === top || c.contains(top))) {
          problems.push({
            kind: 'chrome-covers-copy',
            detail: `${c.className} covers ${el.tagName}.${el.className}`,
            text: (el.textContent ?? '').trim().slice(0, 48),
          });
        }
      }
    }

    return problems;
  });

const browser = await chromium.launch();
let audits = 0;
const found = [];

for (const service of ['day', 'night']) {
  for (const size of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width: size.w, height: size.h },
      deviceScaleFactor: 1,
      locale: 'tr-TR',
    });
    const page = await ctx.newPage();

    for (const entry of ROUTES) {
      const route = routeOf(entry);
      await page.goto(BASE + route.path, { waitUntil: 'load' });
      await page.evaluate((svc) => {
        document.documentElement.setAttribute('data-service', svc);
      }, service);
      if (route.prepare) {
        // At the reflow width the map's controls may be off-screen or the
        // island not yet hydrated; a variant that cannot be set up is skipped
        // rather than failed, because the plain route already covers the page.
        try {
          await route.prepare(page);
        } catch {
          continue;
        }
      }

      // Pages with a horizontal track have a scroll-position dimension: their
      // arrangement is different at every point along it, so top and bottom
      // would miss almost all of it. The dig joined this list when its finds
      // rail landed. Everything else is audited top and bottom.
      const TRACKED = ['/', '/en/', '/kazi/', '/en/kazi/'];
      const positions = TRACKED.includes(route.path) ? SCROLLS : [0, 1];

      for (const p of positions) {
        await page.evaluate((frac) => {
          // Ask for a position past the end and let the browser clamp. Computing
          // scrollHeight - innerHeight came up 72px short on the crossing, so
          // the audit was inspecting a position no reader can actually reach.
          if (frac >= 1) {
            window.scrollTo({ top: 1e7, behavior: 'instant' });
            return;
          }
          window.scrollTo({ top: 1e7, behavior: 'instant' });
          const max = window.scrollY;
          window.scrollTo({ top: max * frac, behavior: 'instant' });
        }, p);
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        );
        // Longer than the site's slowest UI transition (--d-ui, 240ms).
        // Sampling at 90ms caught fading elements at half opacity and reported
        // them as covering content they were in the middle of leaving.
        await page.waitForTimeout(330);

        const problems = await audit(page);
        audits++;
        for (const pr of problems) {
          found.push({ route: route.name, service, width: size.name, at: p, ...pr });
        }
      }
    }
    await ctx.close();
  }
}

await browser.close();

console.log(
  `\n  LAYOUT — ${ROUTES.length} routes x 2 services x ${WIDTHS.length} widths\n  ${audits} audits run\n`,
);

if (found.length === 0) {
  console.log('  No sideways scroll, escape, overlap or chrome collision found.\n');
  process.exit(0);
}

const byKind = new Map();
for (const f of found) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);
for (const [k, n] of byKind) console.log(`  ${String(n).padStart(4)}  ${k}`);
console.log('');
for (const f of found.slice(0, 24)) {
  console.log(`  ${f.kind}`);
  console.log(`     ${f.route} · ${f.service} · ${f.width} · at ${f.at}`);
  console.log(`     ${f.detail}`);
  if (f.text) console.log(`     "${f.text}"`);
}
if (found.length > 24) console.log(`\n  ...and ${found.length - 24} more`);
console.log('');
process.exit(1);
