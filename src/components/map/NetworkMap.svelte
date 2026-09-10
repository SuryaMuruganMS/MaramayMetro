<script lang="ts">
  import { LINES, NODES, nodeById, type Node } from '../../data/network.ts';
  import { WINDOW } from '../../data/geography.ts';
  import {
    ISTANBUL,
    WORLD_W,
    WORLD_X0,
    UNITS_PER_DEG,
    WORLD_URL,
    type WorldData,
  } from '../../data/world.ts';
  import { haversine } from '../../lib/geo.ts';
  import LineCard from './LineCard.svelte';
  import { GEO, GEO_H, LAND, SHORE, ISLANDS, LAKES } from '../../data/geography.ts';
  import StationCard from './StationCard.svelte';
  import { num, type Locale } from '../../lib/locale.ts';
  import type { Route } from '../../lib/route.ts';

  /**
   * The network in two registers.
   *
   * A transit diagram is a lie that works: Beck threw away geography so the
   * decisions would be legible. Showing both registers and animating between
   * them makes that trade visible instead of asking the reader to take it on
   * trust - and it is genuinely informative, because you can see exactly which
   * parts of the city the diagram compresses and which it inflates.
   *
   * THE GEOGRAPHIC REGISTER IS A REAL MAP.
   * Coastline from OpenStreetMap, stations at their platforms' own coordinates,
   * Web Mercator like every other map you have used. It used to be positions
   * placed by eye and labelled indicative, which made the morph a comparison
   * between a diagram and a guess. Now it compares a diagram with the ground.
   *
   * Both registers share one set of station nodes, so the morph is a
   * position tween rather than a crossfade between two pictures. Nothing is
   * redrawn; the same stations move. The frame grows taller as it goes, because
   * İstanbul is not the shape of a transit diagram.
   */
  interface Props {
    locale: Locale;
    labels: Record<string, string>;
    /**
     * One journey, lit through the network.
     *
     * When this is set the component is the planner's map rather than the map
     * page's: no register toggle, no lines list, no station table, and the
     * route drawn over the top of everything with the rest of the network
     * stepped back behind it. The camera, the world layer, the zoom and the
     * pan are all exactly the same, because a reader who has learnt the map on
     * one page should not have to learn a different one on the other.
     */
    route?: Route | null;
  }
  const { locale, labels, route = null }: Props = $props();
  const isRouteMap = $derived(!!route);

  /*
     Two registers, not three.

     The section came off: it draws the Marmaray spine's vertical alignment,
     which the crossing already draws far better across a whole screen, and
     having it here meant a third of the control was a worse copy of the
     landing page. The step-free filter came off with it — it dimmed lines and
     hid stations to answer a question the table below answers precisely.
  */
  type Register = 'geographic' | 'diagram';

  /*
     The map opens on the ground.

     It opened on Beck's diagram, which is the more beautiful drawing and the
     wrong first answer: a reader arriving at a map page wants to know where
     things are, and only then how the network is shaped. The diagram is one
     press away and the morph between them is still the point.
  */
  let register = $state<Register>('geographic');
  let focused = $state<string | null>(null);
  let selected = $state<string | null>(null);
  /** 0 = diagram, 1 = geographic. Tweened, so the two registers morph. */
  let morph = $state(1);

  const W = 100;
  /**
   * The diagram's drawing area, not its coordinate space.
   *
   * Nodes are placed on a 100x70 grid, but nothing sits below y=50 - the tallest
   * thing down there is Sabiha Gökçen. Rendering the full 70 left a third of the
   * frame empty under the diagram. The viewBox is cropped to what is actually
   * drawn, plus room for the labels that hang below the spine.
   */
  const DIAG_H = 56;

  /** The frame's height follows the morph, so neither register is squashed. */
  const H = $derived(DIAG_H + (GEO_H - DIAG_H) * morph);

  function pos(n: Node): { x: number; y: number } {
    const g = GEO[n.id];
    if (!g) return { x: n.x, y: n.y };
    return { x: n.x + (g.x - n.x) * morph, y: n.y + (g.y - n.y) * morph };
  }

  /**
   * The coast fades in over the second half of the morph.
   *
   * It cannot be tweened - a coastline has no schematic equivalent to morph
   * from - so it arrives instead, and late enough that the stations have mostly
   * finished moving by the time there is anything to read them against.
   */
  const coastAlpha = $derived(Math.max(0, (morph - 0.4) / 0.6));

  /**
   * Dots and strokes thin out as the map becomes real.
   *
   * Beck's diagram spreads its stations so a fat dot has room; the ground does
   * not. Eight stations sit inside two kilometres of Karaköy, and at the
   * diagram's weights they merged into one black smear over the Golden Horn.
   * Same drawing, same units — the ink just gets finer as the geometry gets
   * denser, which is what a cartographer would do.
   */
  const ink = $derived(1 - 0.45 * morph);

  /**
   * The table is sorted by name in the reader's locale. Turkish collates
   * ç, ğ, ı, i, ö, ş, ü in its own order, so a default sort would file Ümraniye
   * and Üsküdar in the wrong place for exactly the readers most likely to be
   * looking for them.
   */
  const byName = $derived([...NODES].sort((a, b) => a.name.localeCompare(b.name, locale)));

  const shown = $derived(NODES);
  const shownIds = $derived(new Set(shown.map((n) => n.id)));

  // ---------------------------------------------------------------- labels
  /**
   * WHERE THE NAMES GO.
   *
   * This is the hard part of any transit map and it got harder the moment the
   * geographic register became real. On the diagram the stations are spread out
   * because Beck spread them out; on the ground, eight of them are inside two
   * kilometres of Karaköy, and right-anchored labels ran straight through each
   * other — Levent over Gayrettepe, Şişhane over Karaköy.
   *
   * So the names are placed the way a cartographer places them: each station
   * gets a list of positions it would ACCEPT, in order of preference, and is
   * offered them in turn. The first one that collides with nothing already
   * placed wins. If none of them fits, the name is not drawn — because at this
   * scale it genuinely does not fit, and a map that admits that is more useful
   * than one that prints both names on top of each other.
   *
   * Order matters, so it is deliberate: the crossing's own stations are placed
   * first because this site is about them, then interchanges by how many lines
   * they carry, then everything else. The station a reader has hovered or
   * selected is placed last and unconditionally — they asked for that one, and
   * it draws over the top of everything.
   */
  const SPINE_Y = 40;
  const spineOrder = NODES.filter((n) => n.y === SPINE_Y)
    .sort((a, b) => a.x - b.x)
    .map((n) => n.id);

  const FS = 1.7;
  /**
   * The shape of a drawn name, in viewBox units, without measuring it.
   *
   * Measuring text properly means `getBBox()`, which means a layout pass per
   * label per frame of the morph. These constants are calibrated against the
   * real rendered boxes instead, and calibrated GENEROUSLY: the first cut used
   * the em height and the mean advance width, and the layout gate immediately
   * found three collisions — Pendik over Kartal, Hacıosman over İstanbul
   * Havalimanı, Atatürk Havalimanı over Ataköy — because a text box is taller
   * than its em and Turkish names run wider than an average Latin advance.
   *
   * Erring wide costs a label that could just have fitted. Erring narrow costs
   * two names printed on top of each other, which is the bug this exists to
   * prevent, so the bias goes one way on purpose.
   */
  const CHAR_W = 0.56;
  const PAD = 0.25;

  interface Box {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  }
  interface Place {
    x: number;
    y: number;
    anchor: 'start' | 'middle' | 'end';
  }

  /**
   * Everything here is multiplied by `px`, and that is the whole point.
   *
   * A station's dot, its hit circle and its name are all drawn at a constant
   * size on screen — `r={1.5 * px}`, `font-size={FS * px}` — but this box was
   * measured in raw viewBox units, so the collision test was only correct at
   * zoom 1. Pulled back to a regional view the real names were four times the
   * size of the boxes being compared, every candidate "fitted", and thirty-two
   * station names printed through each other in a heap over the Bosphorus.
   *
   * Solving in the space the labels are actually drawn in fixes it at every
   * zoom, and changes nothing at zoom 1, where `px` is 1.
   */
  const boxOf = (name: string, p: Place): Box => {
    const w = name.length * CHAR_W * FS * px;
    const pad = PAD * px;
    const x0 = p.anchor === 'middle' ? p.x - w / 2 : p.anchor === 'end' ? p.x - w : p.x;
    return {
      x0: x0 - pad,
      x1: x0 + w + pad,
      y0: p.y - FS * 1.05 * px - pad,
      y1: p.y + FS * 0.5 * px + pad,
    };
  };
  const overlaps = (a: Box, b: Box): boolean =>
    a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

  /** Positions a name will accept, best first. */
  function candidates(n: Node): Place[] {
    const p = pos(n);
    const i = spineOrder.indexOf(n.id);
    // Screen-constant, for the same reason `boxOf` is: the offset has to match
    // where the name is actually drawn, not where it would be at zoom 1.
    const gap = (1.2 + 1.2 * ink) * px;
    const above: Place = { x: p.x, y: p.y - gap - 1.1 * px, anchor: 'middle' };
    const below: Place = { x: p.x, y: p.y + gap + 2.5 * px, anchor: 'middle' };
    const right: Place = { x: p.x + gap, y: p.y + 0.7 * px, anchor: 'start' };
    const left: Place = { x: p.x - gap, y: p.y + 0.7 * px, anchor: 'end' };
    // On the spine, alternate above and below first: consecutive stations take
    // turns, which doubles the room each name has without moving a station.
    if (i >= 0) {
      return i % 2 === 0 ? [above, below, right, left] : [below, above, right, left];
    }
    return [right, left, above, below];
  }

  const placedLabels = $derived.by(() => {
    const order = [...shown].sort((a, b) => {
      const sa = spineOrder.indexOf(a.id) >= 0 ? 1 : 0;
      const sb = spineOrder.indexOf(b.id) >= 0 ? 1 : 0;
      if (sa !== sb) return sb - sa;
      return b.lines.length - a.lines.length;
    });

    const taken: Box[] = [];
    // Station dots are obstacles too: a name printed across a neighbouring
    // station's dot is as unreadable as one printed across another name.
    for (const n of shown) {
      const p = pos(n);
      const r = (n.lines.length > 1 ? 1.7 : 1.2) * ink * px;
      taken.push({ x0: p.x - r, x1: p.x + r, y0: p.y - r, y1: p.y + r });
    }

    /* eslint-disable-next-line svelte/prefer-svelte-reactivity --
       Local scratch inside a pure derivation, thrown away on every recompute.
       A SvelteMap here would wrap a per-frame allocation in proxies for a
       reactivity nothing reads. */
    const out = new Map<string, Place>();
    for (const n of order) {
      for (const c of candidates(n)) {
        const b = boxOf(n.name, c);
        if (taken.some((t) => overlaps(t, b))) continue;
        taken.push(b);
        out.set(n.id, c);
        break;
      }
    }
    return out;
  });

  /** The one the reader is pointing at always gets a name, wherever it lands. */
  const labelFor = (n: Node): Place | null =>
    placedLabels.get(n.id) ??
    (focused === n.id || selected === n.id ? candidates(n)[0]! : null);

  const selectedNode = $derived(selected ? (nodeById.get(selected) ?? null) : null);

  /** Lines calling at the selected station. Everything else steps back. */
  const litLines = $derived(new Set(selectedNode ? selectedNode.lines : []));

  function routePath(routeIds: string[]): string {
    const pts = routeIds
      .map((id) => nodeById.get(id))
      .filter((n): n is Node => !!n)
      .map((n) => pos(n));
    if (pts.length < 2) return '';
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');
  }

  function setRegister(next: Register) {
    if (next === register) return;
    register = next;
    tweenTo(next === 'geographic' ? 1 : 0);
  }

  let raf = 0;
  function tweenTo(target: number) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      morph = target;
      return;
    }
    const from = morph;
    const start = performance.now();
    const dur = 900;
    cancelAnimationFrame(raf);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      // Ease so stations settle rather than arriving at full speed.
      const e = 1 - Math.pow(1 - t, 3);
      morph = from + (target - from) * e;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function pick(id: string) {
    selected = selected === id ? null : id;
    if (selected) selectedLine = null;
  }

  // ==========================================================================
  // ZOOM AND PAN
  // ==========================================================================
  /**
   * The viewBox is the camera.
   *
   * Not a CSS transform on a wrapper: an SVG scaled by transform is a bitmap
   * blown up, and this map's whole argument is that it is drawn from
   * coordinates rather than photographed. Moving the viewBox re-rasterises
   * every path at the new size, so a coastline at eight times magnification is
   * as sharp as it is at one.
   *
   * It also keeps the maths honest. One viewBox unit is a fixed number of
   * metres on the ground at every zoom, so the scale bar below is a
   * measurement rather than a decoration.
   */
  /*
     THE ZOOM RANGE GOES TO THE PLANET.

     `world.ts` projects Natural Earth's coastline with this map's own Web
     Mercator, so the world is not a second map to swap in — it is the same map
     from further away. Pulling all the way out is one continuous movement, and
     a reader who has never heard of this railway can see where on Earth it is.

     The floor is the zoom at which 360 degrees of longitude fits the frame.
     Derived, not typed: change the window in geography.ts and this follows.
  */
  const MIN_Z = W / WORLD_W;
  const MAX_Z = 14;

  let zoom = $state(1);
  /** Centre of the view, in viewBox units. */
  let cx = $state(W / 2);
  let cy = $state(GEO_H / 2);

  const viewW = $derived(W / zoom);
  const viewH = $derived(H / zoom);

  /**
   * How wide the view is, in degrees of longitude.
   *
   * Every decision the world layer makes is really a decision about scale, and
   * scale is a distance, not a zoom factor. Working in degrees means the
   * thresholds in `dunya.json` — which say "draw this country's name once the
   * view is narrower than 110 degrees" — are read in the units they were
   * written in, and they stay right if the İstanbul window ever changes shape.
   */
  const degW = $derived(viewW / UNITS_PER_DEG);

  /**
   * The world is the ground, not a bookend.
   *
   * It used to fade out as soon as the reader came in past about twenty
   * degrees, on the theory that it was a "where on Earth" gesture and the
   * network took over from there. That left a dead band — three degrees across
   * is the Sea of Marmara and half of Thrace, and the map showed neither: the
   * world had gone and the İstanbul window is under one degree wide.
   *
   * Now it holds full strength until the window itself fills the frame, and
   * the window's own coastline — a hundred times more accurate — simply paints
   * over the top of it inside its own rectangle. Same sea colour, same land
   * colour, so the join does not show.
   */
  const worldAlpha = $derived(Math.max(0, Math.min(1, (degW - 0.95) / 0.55)));
  const netAlpha = $derived(Math.max(0, Math.min(1, (zoom - 0.05) / 0.12)));

  /**
   * The world, fetched rather than bundled.
   *
   * Natural Earth 1:50m with borders, names and cities is most of a megabyte,
   * and a reader who never pulls back never needs a byte of it. It is
   * requested the first time the layer would be visible, and prefetched when
   * the browser is otherwise idle so that in practice it has almost always
   * already arrived by then.
   */
  let world = $state<WorldData | null>(null);
  let worldPending = false;
  function loadWorld() {
    if (world || worldPending) return;
    worldPending = true;
    fetch(WORLD_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j) world = j as WorldData;
      })
      .catch(() => {
        // A map that cannot reach its own data still draws the network. The
        // world layer simply never appears, which is a smaller failure than an
        // error state over a working map.
      })
      .finally(() => {
        worldPending = false;
      });
  }
  $effect(() => {
    if (worldAlpha > 0) loadWorld();
  });

  /**
   * Which copies of the planet are on screen.
   *
   * İstanbul sits at 29 degrees east, so one copy leaves the Pacific torn down
   * the middle of the frame. Repeating the land either side is what every
   * slippy map does; drawing all three at every zoom is not, so the ones
   * entirely off screen are skipped.
   */
  const copies = $derived.by(() => {
    const l = cx - viewW / 2,
      r = cx + viewW / 2;
    const out: number[] = [];
    for (const k of [-1, 0, 1]) {
      const a = WORLD_X0 + k * WORLD_W;
      if (a < r && a + WORLD_W > l) out.push(k);
    }
    return out.length ? out : [0];
  });

  /** Country names come in all four of this site's languages. */
  const countryName = (n: { en: string; tr: string; ar: string; ru: string }) =>
    n[locale as keyof typeof n] ?? n.en;

  /** Only what the current scale asks for, so the map fills in as you lean in. */
  const shownCountries = $derived(world ? world.countries.filter((c) => degW <= c.t) : []);
  const shownCities = $derived(world ? world.cities.filter((c) => degW <= c.t) : []);

  /**
   * The world's names, decluttered — the same greedy pass the stations get.
   *
   * A scale threshold alone is not enough, and the first cut proved it: at
   * planet zoom ninety-four country names passed the threshold and western
   * Europe came out as one illegible block with UNITED KINGDOM, BELGIUM,
   * GERMANY and FRANCE printed through each other. Natural Earth's LABELRANK
   * says which names deserve the room. It cannot know whether there is any.
   *
   * So importance decides the ORDER and geometry decides the OUTCOME: work
   * down from the most prominent name to the least and draw each one only if
   * its box is still clear. That is what a cartographer does, and it is why an
   * atlas of Europe names Luxembourg and a globe does not.
   *
   * Culled to the view first. Placing names for the far side of the planet
   * costs exactly as much as placing the ones on screen and buys nothing, and
   * this runs on every frame of a drag.
   */
  const MAX_LABELS = 140;
  interface WorldLabel {
    city: boolean;
    cap: boolean;
    x: number;
    y: number;
    text: string;
    fs: number;
  }
  const worldLabels = $derived.by(() => {
    const out: WorldLabel[] = [];
    if (!world || worldAlpha <= 0) return out;

    // One rect covering every copy of the planet currently on screen, so a
    // name belonging to the copy left of centre is not culled by the
    // untranslated coordinates it is stored in.
    const pad = viewW * 0.06;
    const lo = Math.min(...copies.map((k) => cx - viewW / 2 - k * WORLD_W)) - pad;
    const hi = Math.max(...copies.map((k) => cx + viewW / 2 - k * WORLD_W)) + pad;
    const top = cy - viewH / 2 - pad;
    const bot = cy + viewH / 2 + pad;
    const seen = (x: number, y: number) => x > lo && x < hi && y > top && y < bot;

    const fsC = Math.min(2.3, 0.95 + degW / 240) * px;
    const fsT = 1.3 * px;
    const taken: Box[] = [];

    // The subject reserves its room before anything else is placed. It is the
    // reason this layer exists; nothing gets to print over it.
    taken.push({
      x0: ISTANBUL.x - 1.6 * px,
      x1: ISTANBUL.x + 2 * px + 'İstanbul'.length * 0.6 * 3.1 * px,
      y0: ISTANBUL.y - 2.6 * px,
      y1: ISTANBUL.y + 1.8 * px,
    });

    type Cand = {
      t: number;
      c?: (typeof shownCountries)[number];
      p?: (typeof shownCities)[number];
    };
    const cands: Cand[] = [];
    for (const c of shownCountries) if (seen(c.x, c.y)) cands.push({ t: c.t, c });
    for (const q of shownCities) if (seen(q.x, q.y)) cands.push({ t: q.t, p: q });
    cands.sort((a, b) => b.t - a.t);

    for (const cand of cands) {
      if (out.length >= MAX_LABELS) break;
      if (cand.c) {
        const text = countryName(cand.c.n);
        const w = text.length * 0.62 * fsC;
        const b = {
          x0: cand.c.x - w / 2,
          x1: cand.c.x + w / 2,
          y0: cand.c.y - fsC * 0.82,
          y1: cand.c.y + fsC * 0.36,
        };
        if (taken.some((t) => overlaps(t, b))) continue;
        taken.push(b);
        out.push({ city: false, cap: false, x: cand.c.x, y: cand.c.y, text, fs: fsC });
      } else if (cand.p) {
        const text = cand.p.n;
        const w = text.length * 0.55 * fsT;
        const b = {
          x0: cand.p.x - 0.5 * px,
          x1: cand.p.x + 0.66 * px + w,
          y0: cand.p.y - fsT * 0.72,
          y1: cand.p.y + fsT * 0.62,
        };
        if (taken.some((t) => overlaps(t, b))) continue;
        taken.push(b);
        out.push({
          city: true,
          cap: cand.p.c === 1,
          x: cand.p.x,
          y: cand.p.y,
          text,
          fs: fsT,
        });
      }
    }
    return out;
  });

  /**
   * Kept inside the drawing.
   *
   * Which drawing depends on how far out you are: inside the İstanbul window
   * while the network is what you are looking at, and inside the planet once
   * the world layer has taken over. Clamping to the window at world zoom would
   * pin the camera to a rectangle a thousandth of the frame wide.
   */
  function clamp() {
    const hw = viewW / 2;
    const hh = viewH / 2;
    if (viewW > W) {
      // Wider than İstanbul: let the reader roam the planet, in longitude only.
      cx = Math.min(ISTANBUL.x + WORLD_W / 2, Math.max(ISTANBUL.x - WORLD_W / 2, cx));
      cy = Math.min(ISTANBUL.y + WORLD_W / 6, Math.max(ISTANBUL.y - WORLD_W / 6, cy));
      return;
    }
    cx = Math.min(W - hw, Math.max(hw, cx));
    cy = Math.min(H - hh, Math.max(hh, cy));
  }
  $effect(() => {
    // H changes with the morph, so the clamp has to run again when it does.
    void H;
    clamp();
  });

  const viewBox = $derived(
    `${(cx - viewW / 2).toFixed(3)} ${(cy - viewH / 2).toFixed(3)} ${viewW.toFixed(3)} ${viewH.toFixed(3)}`,
  );

  /**
   * Ink is measured in SCREEN units, not drawing units.
   *
   * Zoom the viewBox and everything in it grows, including the hairlines and
   * the station names — so at eight times magnification a 1.7-unit label is
   * the size of a building. Dividing every width and font size by the zoom
   * holds them at a constant size on screen, which is what every map does and
   * the reason zooming in reveals detail rather than magnifying it.
   */
  const px = $derived(1 / zoom);

  let svgEl = $state<SVGSVGElement | null>(null);

  /** Where a pointer is, in viewBox units. */
  function toView(clientX: number, clientY: number) {
    const r = svgEl!.getBoundingClientRect();
    return {
      x: cx - viewW / 2 + ((clientX - r.left) / r.width) * viewW,
      y: cy - viewH / 2 + ((clientY - r.top) / r.height) * viewH,
    };
  }

  /** Zoom about a fixed point, so what is under the cursor stays under it. */
  function zoomAt(factor: number, clientX?: number, clientY?: number) {
    const next = Math.min(MAX_Z, Math.max(MIN_Z, zoom * factor));
    if (next === zoom) return;
    if (clientX !== undefined && clientY !== undefined && svgEl) {
      const p = toView(clientX, clientY);
      const k = 1 - zoom / next;
      cx += (p.x - cx) * k;
      cy += (p.y - cy) * k;
    }
    zoom = next;
    clamp();
  }

  let dragging = $state(false);
  let dragged = $state(false);
  let last = { x: 0, y: 0 };

  /**
   * CAPTURE LATE.
   *
   * The first cut called `setPointerCapture` on pointerdown, which is the
   * textbook way to keep a drag alive outside the element — and it broke every
   * station and every line on the map. With the pointer captured by the <svg>,
   * the release is delivered to the <svg> too, so the browser never sees a
   * press and a release on the same <g> and never synthesises a click. The map
   * panned perfectly and nothing on it could be opened.
   *
   * So capture is deferred until the pointer has actually moved. A press is a
   * press until it becomes a drag, at which point the capture takes over and
   * the drag survives leaving the frame.
   */
  let downId: number | null = null;
  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    dragging = true;
    dragged = false;
    downId = e.pointerId;
    last = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging || !svgEl) return;
    if (!dragged && Math.abs(e.clientX - last.x) + Math.abs(e.clientY - last.y) > 4) {
      dragged = true;
      if (downId !== null) {
        try {
          (e.currentTarget as Element).setPointerCapture(downId);
        } catch {
          /* the pointer is already gone */
        }
      }
    }
    if (!dragged) return;
    const r = svgEl.getBoundingClientRect();
    const dx = ((e.clientX - last.x) / r.width) * viewW;
    const dy = ((e.clientY - last.y) / r.height) * viewH;
    cx -= dx;
    cy -= dy;
    last = { x: e.clientX, y: e.clientY };
    clamp();
  }
  function onPointerUp(e: PointerEvent) {
    dragging = false;
    downId = null;
    // Let the click that follows through, then forget the drag.
    setTimeout(() => (dragged = false), 0);
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* the pointer was already gone */
    }
  }

  /**
   * The wheel zooms, and the page does not scroll while it does.
   *
   * Hijacking the wheel is normally the wrong answer, and on a map it is the
   * expected one — but only over the map itself, only when it is already
   * magnified or the reader means to magnify it, and never as a substitute for
   * the page's own scrolling. `passive: false` is required to be able to
   * refuse the scroll at all.
   */
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    zoomAt(e.deltaY < 0 ? 1.16 : 1 / 1.16, e.clientX, e.clientY);
  }

  function resetView() {
    zoom = 1;
    cx = W / 2;
    cy = H / 2;
  }

  /** Frame a station: zoom in and put it in the middle. */
  function flyTo(id: string, z = 5) {
    const p = pos(nodeById.get(id)!);
    zoom = Math.min(MAX_Z, z);
    cx = p.x;
    cy = p.y;
    clamp();
  }

  /**
   * The scale bar, which is why the zoom had to be honest.
   *
   * One viewBox unit is a known number of metres, so a bar of N units is a
   * real distance. This picks the roundest distance that fits comfortably in
   * the frame at the current zoom — 1, 2, 5, 10, 20 km and so on — which is
   * exactly how a paper map's scale bar is chosen.
   */
  const UNIT_KM = $derived(
    // The window is 100 units wide and spans this many kilometres of ground.
    (haversine(WINDOW.south, WINDOW.west, WINDOW.south, WINDOW.east) / W) * (morph || 1),
  );
  const scale = $derived.by(() => {
    const wantUnits = viewW * 0.22;
    const wantKm = wantUnits * UNIT_KM;
    const steps = [0.5, 1, 2, 5, 10, 20, 50];
    const km = steps.find((k) => k >= wantKm) ?? 50;
    return { km, units: km / UNIT_KM };
  });

  // ==========================================================================
  // LINES
  // ==========================================================================
  let selectedLine = $state<string | null>(null);
  const selectedLineObj = $derived(
    selectedLine ? (LINES.find((l) => l.id === selectedLine) ?? null) : null,
  );

  function pickLine(id: string) {
    selectedLine = selectedLine === id ? null : id;
    if (selectedLine) {
      selected = null;
      frameLine(id);
    }
  }

  /** Put the whole of a line in the frame, with a margin. */
  function frameLine(id: string) {
    const l = LINES.find((x) => x.id === id);
    if (!l) return;
    const pts = l.route.map((n) => pos(nodeById.get(n)!));
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const w = Math.max(6, Math.max(...xs) - Math.min(...xs)) * 1.35;
    const h = Math.max(6, Math.max(...ys) - Math.min(...ys)) * 1.35;
    zoom = Math.min(MAX_Z, Math.max(MIN_Z, Math.min(W / w, H / h)));
    cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    clamp();
  }

  /**
   * Frame an arbitrary set of stations, the way `frameLine` frames one line.
   *
   * The margin is generous on purpose: a route framed tight to its own extent
   * has its end labels hanging off the edge, and the two names a reader most
   * wants to read on a journey map are the ones at the ends.
   */
  function frameStops(ids: string[]) {
    const pts = ids
      .map((n) => nodeById.get(n))
      .filter(Boolean)
      .map((n) => pos(n!));
    if (pts.length < 1) return;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const w = Math.max(10, Math.max(...xs) - Math.min(...xs)) * 1.6;
    const h = Math.max(10, Math.max(...ys) - Math.min(...ys)) * 1.6;
    zoom = Math.min(MAX_Z, Math.max(MIN_Z, Math.min(W / w, H / h)));
    cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    clamp();
  }

  /** The journey as one path per leg, each in its own line's colour. */
  const routeLegs = $derived(
    route
      ? route.legs.map((leg) => ({
          line: leg.line,
          colour: LINES.find((l) => l.id === leg.line)?.colour ?? 'var(--accent)',
          d: routePath(leg.stops),
        }))
      : [],
  );
  /** Every stop on it, for the dots and for framing. */
  const routeStops = $derived(route ? [route.from, ...route.hops.map((h) => h.node)] : []);

  /*
     Re-frame when the journey changes, and only then.

     A reader who has zoomed in on their interchange and then changes the
     passenger type should not be thrown back out to the whole route; a reader
     who picks a different destination should. Keying on the two ends is the
     difference — it is the same test the planner itself uses to decide whether
     it is showing a new journey or the same one priced differently.
  */
  let framedKey = '';
  $effect(() => {
    if (!route) return;
    const key = `${route.from}>${route.to}`;
    if (key === framedKey) return;
    framedKey = key;
    frameStops(routeStops);
  });

  /** Which lines are drawn at full strength. */
  const litLinesAll = $derived(
    route
      ? /*
           Every line stepped back, including the route's own.

           Lighting the route's line at full strength looked right in the code
           and wrong on the page: Marmaray runs Halkalı to Gebze, the journey
           was Yenikapı to Üsküdar, and both were drawn in the same red at
           nearly the same width — so the map appeared to be recommending the
           whole line. The route is drawn separately, over the top, with a
           casing. Everything underneath it is context.
        */
        new Set<string>()
      : selectedLine
        ? new Set([selectedLine])
        : selectedNode
          ? litLines
          : null,
  );

  const REGISTERS: Array<{ id: Register; key: string }> = [
    { id: 'geographic', key: 'reg.geographic' },
    { id: 'diagram', key: 'reg.diagram' },
  ];
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && selected) selected = null;
  }}
/>

<div class="netmap">
  {#if !isRouteMap}
    <div class="netmap__bar">
      <div class="seg" role="group" aria-label={labels['reg.label']}>
        {#each REGISTERS as r (r.id)}
          <button
            type="button"
            class="seg__btn"
            aria-pressed={register === r.id}
            onclick={() => setRegister(r.id)}
          >
            {labels[r.key]}
          </button>
        {/each}
      </div>
    </div>

    <p class="netmap__caveat mono">
      {#if register === 'geographic'}
        {labels['map.geoCaveat']}
      {:else}
        {labels['map.click']}
      {/if}
    </p>
  {/if}

  <div
    class="netmap__stage"
    class:is-open={!isRouteMap && (!!selectedNode || !!selectedLineObj)}
  >
    <div class="netmap__frame" style={`--ar:${(W / H).toFixed(4)}`}>
      <!--
        role="application", because it is one.

        The drag-to-pan and wheel-to-zoom make this a thing you operate rather
        than a picture you look at, and a screen reader needs to be told that
        or it will read the whole SVG as an image and hand the keys back to the
        browser. Every station and every line inside it is still an individual
        button with a name, and the table below is still the complete
        non-visual route to the same information.
      -->
      <svg
        bind:this={svgEl}
        {viewBox}
        class="netmap__svg"
        class:is-dragging={dragging}
        role="application"
        aria-roledescription={labels['map.zoom']}
        aria-label={`${labels['map.alt']} ${labels['map.drag']}`}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
        onwheel={onWheel}
        ondblclick={(e) => zoomAt(1.9, e.clientX, e.clientY)}
      >
        <!--
          THE GROUND.

          Sea is the background and land is painted onto it, which is the way
          round OpenStreetMap's coastline data actually supports: its ways are
          directed with land on the left and are not closed, so the land was
          closed against the window edge when the data was built and the sea
          needs no shape of its own.
        -->
        <!--
          THE PLANET, under everything.

          Only painted once the reader has pulled back far enough for the
          İstanbul window to be a speck, and it fades as they come back in, so
          the two never compete. The marker is the whole point: it says where
          this railway is, which is the one question a map of the network
          cannot answer from inside itself.
        -->
        {#if worldAlpha > 0 && world}
          <g class="world" opacity={worldAlpha}>
            <rect
              x={ISTANBUL.x - WORLD_W}
              y={ISTANBUL.y - WORLD_W}
              width={WORLD_W * 2}
              height={WORLD_W * 2}
              class="geo__sea"
            />
            {#each copies as k (k)}
              <g transform={`translate(${k * WORLD_W} 0)`}>
                <!-- Land and borders in one pass. Every country is a filled
                     polygon with a hairline on it, so a shared edge is drawn
                     twice and reads as the border it is, and an unshared one
                     reads as coast. That is how a printed atlas does it. -->
                {#each world.countries as c, i (i)}
                  <path d={c.d} class="world__country" stroke-width={0.14 * px} />
                {/each}
                {#each world.lakes as d, i (i)}
                  <path {d} class="world__lake" stroke-width={0.1 * px} />
                {/each}

                <!-- Names, in the order the solver placed them, each with a
                     halo: a name on a coast has land on one side and sea on the
                     other and has to survive both. -->
                {#each worldLabels as l, i (i)}
                  {#if l.city}
                    <circle
                      cx={l.x}
                      cy={l.y}
                      r={(l.cap ? 0.32 : 0.24) * px}
                      class="world__dot"
                      class:is-capital={l.cap}
                    />
                    <text
                      x={l.x + 0.66 * px}
                      y={l.y + 0.42 * px}
                      class="world__city"
                      font-size={l.fs}
                      stroke-width={0.34 * px}>{l.text}</text
                    >
                  {:else}
                    <text
                      x={l.x}
                      y={l.y}
                      class="world__country-name"
                      font-size={l.fs}
                      stroke-width={0.5 * px}>{l.text}</text
                    >
                  {/if}
                {/each}

                <!--
                  The subject.

                  Drawn larger than any city on the map, because at planet
                  scale the question is not "which dot is bigger" but "where is
                  this thing", and a reader should be able to answer it without
                  hunting.

                  It hands over to the network exactly as the network becomes
                  legible: the moment you can see the lines, the lines ARE
                  İstanbul, and a label naming the city on top of them is both
                  redundant and in the way.
                -->
                <g opacity={1 - netAlpha}>
                  <circle
                    cx={ISTANBUL.x}
                    cy={ISTANBUL.y}
                    r={1.1 * px}
                    class="world__pin"
                    stroke-width={0.42 * px}
                  />
                  <text
                    x={ISTANBUL.x + 1.9 * px}
                    y={ISTANBUL.y + 0.75 * px}
                    class="world__label"
                    font-size={3.1 * px}
                    stroke-width={0.9 * px}>İstanbul</text
                  >
                </g>
              </g>
            {/each}
          </g>
        {/if}

        {#if coastAlpha > 0 && netAlpha > 0}
          <g class="geo" opacity={coastAlpha * netAlpha}>
            <rect x="0" y="0" width={W} height={GEO_H} class="geo__sea" />
            {#each LAND as d, i (i)}<path {d} class="geo__land" />{/each}
            {#each ISLANDS as d, i (i)}<path {d} class="geo__land" />{/each}
            {#each LAKES as l (l.name)}<path d={l.d} class="geo__sea" />{/each}
            {#each SHORE as d, i (i)}
              <path {d} class="geo__shore" stroke-width={0.22 * px} />
            {/each}
          </g>
        {/if}

        <!-- The Bosphorus, schematic. It hands over to the real coastline as
             that fades in, rather than being drawn on top of it. -->
        {#if coastAlpha < 1}
          <path
            d="M53,0 L53,56"
            stroke="var(--turquoise)"
            stroke-width={2.4 * px}
            fill="none"
            opacity={0.34 * (1 - coastAlpha)}
          />
        {/if}

        <g opacity={netAlpha}>
          {#each LINES as line (line.id)}
            <path
              d={routePath(line.route)}
              stroke={line.colour}
              stroke-width={(line.kind === 'rail' ? 1.5 : 1.1) * ink * px}
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
              opacity={litLinesAll && !litLinesAll.has(line.id) ? 0.22 : 1}
              class="netmap__line"
              role="button"
              tabindex="0"
              aria-label={line.name}
              onclick={(e) => {
                if (dragged) return;
                e.stopPropagation();
                pickLine(line.id);
              }}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  pickLine(line.id);
                }
              }}
            />
          {/each}
        </g>

        <!--
          THE JOURNEY, when there is one.

          A ground casing under a coloured core, which is how a line is drawn on
          every transit map ever printed and the reason it stays readable
          crossing a coastline. Above the network and below the stations, so the
          dots the reader is looking for sit on top of their own route.
        -->
        {#if isRouteMap}
          <g class="rt" opacity={netAlpha}>
            {#each routeLegs as leg, i (i)}
              <path
                d={leg.d}
                class="rt__casing"
                stroke-width={4.4 * ink * px}
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            {/each}
            {#each routeLegs as leg, i (i)}
              <path
                d={leg.d}
                stroke={leg.colour}
                stroke-width={2.6 * ink * px}
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            {/each}
            {#each routeStops as id, i (id)}
              {@const n = nodeById.get(id)}
              {#if n}
                {@const q = pos(n)}
                {@const end = i === 0 || i === routeStops.length - 1}
                <circle
                  cx={q.x}
                  cy={q.y}
                  r={(end ? 2.1 : 1.2) * ink * px}
                  class="rt__stop"
                  class:is-end={end}
                  stroke-width={(end ? 1 : 0.6) * ink * px}
                />
              {/if}
            {/each}
          </g>
        {/if}

        <!-- Stations. Interchanges are larger because they are where a decision
             gets made; everything else is a stop. -->
        <g opacity={netAlpha}>
          {#each shown as n (n.id)}
            {@const p = pos(n)}
            <g
              class="stn"
              class:is-focused={focused === n.id}
              class:is-selected={selected === n.id}
              class:is-dimmed={(!!selectedNode || !!selectedLine) &&
                selected !== n.id &&
                !(selectedLine && n.lines.includes(selectedLine))}
              role="button"
              tabindex="0"
              aria-pressed={selected === n.id}
              aria-label={n.name}
              onmouseenter={() => (focused = n.id)}
              onmouseleave={() => (focused = null)}
              onfocus={() => (focused = n.id)}
              onblur={() => (focused = null)}
              onclick={() => {
                // A pan that ends over a station is a pan, not a press.
                if (dragged) return;
                pick(n.id);
              }}
              onkeydown={(e) => {
                // Enter and Space, because this group is standing in for a
                // button and a button responds to both.
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  pick(n.id);
                }
              }}
            >
              <!-- A one-unit dot is a two-pixel target. This is the thing the
                   pointer actually hits; it is invisible and generous, and it
                   doubles as the keyboard focus ring. -->
              <circle cx={p.x} cy={p.y} r={2.6 * px} class="stn__hit" fill="transparent" />
              {#if selected === n.id}
                <circle cx={p.x} cy={p.y} r={3.2 * px} class="stn__halo" />
              {/if}
              <circle
                cx={p.x}
                cy={p.y}
                r={(n.lines.length > 1 ? 1.5 : 1) * ink * px}
                class="stn__dot"
                fill="var(--surface)"
                stroke="var(--ink)"
                stroke-width={(n.lines.length > 1 ? 0.7 : 0.5) * ink * px}
              />
              {#if labelFor(n)}
                {@const l = labelFor(n)!}
                <text
                  x={l.x}
                  y={l.y}
                  text-anchor={l.anchor}
                  class="stn__label"
                  font-size={FS * px}
                  stroke-width={0.55 * px}>{n.name}</text
                >
              {/if}
            </g>
          {/each}
        </g>
      </svg>

      <!--
        The camera controls.

        A map that can only be zoomed with a wheel is a map half its readers
        cannot zoom. These are real buttons: reachable by keyboard, sized for a
        thumb, and they do exactly what the wheel does.
      -->
      <div class="cam" role="group" aria-label={labels['map.zoom']}>
        <button type="button" onclick={() => zoomAt(1.6)} title={labels['map.zoomIn']}>
          <span aria-hidden="true">+</span><span class="visually-hidden"
            >{labels['map.zoomIn']}</span
          >
        </button>
        <button type="button" onclick={() => zoomAt(1 / 1.6)} title={labels['map.zoomOut']}>
          <span aria-hidden="true">−</span><span class="visually-hidden"
            >{labels['map.zoomOut']}</span
          >
        </button>
        <button
          type="button"
          class="cam__reset"
          onclick={resetView}
          title={labels['map.reset']}
          disabled={zoom === 1}
        >
          <span aria-hidden="true">⤢</span><span class="visually-hidden"
            >{labels['map.reset']}</span
          >
        </button>
      </div>

      <!-- A real scale bar. One viewBox unit is a fixed number of metres, so
           this is a measurement rather than a decoration. -->
      <div class="scalebar" aria-hidden="true">
        <span class="scalebar__bar" style={`width:${((scale.units / viewW) * 100).toFixed(2)}%`}
        ></span>
        <span class="scalebar__txt mono"
          >{scale.km < 1 ? scale.km * 1000 + ' m' : scale.km + ' km'}</span
        >
      </div>

      {#if register === 'geographic' && coastAlpha > 0.8}
        <p class="netmap__attr mono">{labels['map.source']}</p>
      {/if}
    </div>

    {#if isRouteMap}
      <!-- Nothing in the side column: this map is answering one question and
           it already knows the answer. -->
    {:else if selectedNode}
      <StationCard
        node={selectedNode}
        {locale}
        {labels}
        onclose={() => (selected = null)}
        onfly={() => flyTo(selectedNode.id)}
      />
    {:else if selectedLineObj}
      <LineCard
        line={selectedLineObj}
        {locale}
        {labels}
        onclose={() => (selectedLine = null)}
        onstation={(id) => {
          selectedLine = null;
          selected = id;
          flyTo(id);
        }}
      />
    {:else}
      <p class="netmap__prompt">{labels['map.pickPrompt']}</p>
    {/if}
  </div>

  <!--
    The lines, as buttons.

    This was a legend under the map: twelve chips with a station count on each,
    read-only, in a different component. A legend answers one question — which
    colour is which — and leaves the reader with the twelve more interesting
    ones. Pressing a chip now frames that line on the map, dims everything
    else, and opens its card.

    It moved in here because the selection is state, and state belongs with the
    thing that draws it. Keeping the list outside the island would have meant
    two components agreeing about which line is chosen, which is the kind of
    agreement that lasts until the next change.
  -->
  {#if !isRouteMap}
    <div class="lines">
      <h2 class="lines__h">{labels['map.linesHeading']}</h2>
      <ul class="lines__list">
        {#each LINES as l (l.id)}
          <li>
            <button
              type="button"
              class="lines__row"
              class:is-on={selectedLine === l.id}
              aria-pressed={selectedLine === l.id}
              onclick={() => pickLine(l.id)}
            >
              <span class="roundel" style={`--line:${l.colour}`}>{l.name}</span>
              <span class="lines__meta mono">
                {num(l.stations, locale)}
                {labels['x.stations']}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    </div>

    <!--
      The map as a table. Required by WCAG 1.1.1, and in practice the fastest
      way to answer "which lines call at Yenikapı" — which no amount of
      hovering a diagram will beat. The names are buttons, so the table is also
      the way to open a station without hitting a two-pixel dot.
    -->
    <details class="netmap__table">
      <summary>{labels['map.tableToggle']}</summary>
      <div class="tw">
        <table>
          <caption>{labels['map.tableCaption']}</caption>
          <thead>
            <tr>
              <th scope="col">{labels['map.station']}</th>
              <th scope="col">{labels['map.lines']}</th>
              <th scope="col">{labels['map.continent']}</th>
              <th scope="col">{labels['map.access']}</th>
            </tr>
          </thead>
          <tbody>
            {#each byName as n (n.id)}
              <tr class:is-dim={!shownIds.has(n.id)}>
                <th scope="row">
                  <button type="button" class="tbl__pick" onclick={() => pick(n.id)}
                    >{n.name}</button
                  >
                </th>
                <td>{n.lines.join(', ')}</td>
                <td>{n.continent === 'EU' ? labels['j.europe'] : labels['j.asia']}</td>
                <td>{n.stepFree ? labels['map.yes'] : labels['map.no']}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="netmap__note">{labels['map.notAll']}</p>
    </details>
  {/if}
</div>

<style>
  .netmap {
    display: flex;
    flex-direction: column;
    gap: var(--sp-snug);
  }
  .netmap__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-snug);
  }

  /* Segmented control as three capsules in a track - a platform indicator, not
     a set of tabs. */
  .seg {
    display: inline-flex;
    padding: 3px;
    border-radius: var(--r-capsule);
    background: color-mix(in oklab, var(--ink) 7%, transparent);
  }
  .seg__btn {
    appearance: none;
    border: none;
    background: transparent;
    border-radius: var(--r-capsule);
    padding: 7px 15px;
    font-family: var(--f-display);
    font-size: var(--t-small);
    font-weight: 600;
    color: var(--ink-3);
    cursor: pointer;
    transition:
      background-color var(--d-hover) var(--ease-out),
      color var(--d-hover) var(--ease-out);
  }
  .seg__btn:hover {
    color: var(--ink);
  }
  .seg__btn[aria-pressed='true'] {
    background: var(--accent);
    color: #fff;
  }

  .netmap__caveat {
    font-size: var(--t-micro);
    letter-spacing: 0.06em;
    color: var(--gold);
    margin: 0;
    max-width: none;
  }

  /* Map and card side by side where there is room, stacked where there is not.
     The card is a second column only while something is selected, so the map is
     not permanently narrowed to hold an empty panel. */
  .netmap__stage {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--sp-base);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .netmap__stage.is-open {
      grid-template-columns: minmax(0, 1fr) 22rem;
    }
  }

  .netmap__frame {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--r-panel);
    padding: var(--sp-snug);
    overflow-x: auto;
  }
  .netmap__svg {
    cursor: grab;
    touch-action: none;
    /* Bounded by HEIGHT, not width. A wide viewBox stretched to a 1290px column
       comes out taller than the screen, and the whole point of a network
       diagram is seeing all of it at once. The aspect ratio follows the morph,
       because İstanbul is not the shape of a transit diagram. */
    width: 100%;
    max-width: calc(70vh * var(--ar));
    max-height: 70vh;
    min-width: 620px;
    aspect-ratio: var(--ar);
    height: auto;
    display: block;
    margin-inline: auto;
  }

  /* Water carries the turquoise; land is paper with the faintest warmth in it.
     The first cut used the depth-band tokens, which are backgrounds — the sea
     came out barely a shade off the frame and the map read as pale smudges. */
  .netmap__svg.is-dragging {
    cursor: grabbing;
  }
  /* Land is paper with the faintest warmth in it; the border is a hairline of
     the same ink the rest of the map draws rules with, so the world reads as
     part of this drawing rather than as an atlas pasted underneath it. */
  .world__country {
    /* Exactly `.geo__land`. The İstanbul window is painted on top of this
       inside its own rectangle, and a shade of difference would draw a
       rectangle around the city. */
    fill: color-mix(in oklab, var(--gold) 7%, var(--surface));
    stroke: color-mix(in oklab, var(--ink) 34%, transparent);
    stroke-linejoin: round;
    vector-effect: none;
  }
  .world__lake {
    fill: color-mix(in oklab, var(--turquoise) 30%, var(--surface));
    stroke: color-mix(in oklab, var(--turquoise) 55%, transparent);
  }
  .world__dot {
    fill: var(--ink-3);
  }
  .world__dot.is-capital {
    fill: var(--ink);
    stroke: var(--ground-2);
    stroke-width: 0;
  }
  .world__city {
    fill: var(--ink-2);
    font-family: var(--f-body);
    font-weight: 500;
    paint-order: stroke;
    stroke: color-mix(in oklab, var(--ground-2) 82%, transparent);
    stroke-linejoin: round;
  }
  .world__country-name {
    fill: var(--ink-3);
    font-family: var(--f-body);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-anchor: middle;
    text-transform: uppercase;
    paint-order: stroke;
    stroke: color-mix(in oklab, var(--ground-2) 82%, transparent);
    stroke-linejoin: round;
  }
  .world__pin {
    fill: var(--accent);
    stroke: var(--surface);
  }

  /* The journey. A casing of the page's own ground under a coloured core, so
     the route survives crossing a coastline, a lake and six other lines. */
  .rt__casing {
    stroke: var(--ground);
    opacity: 0.9;
  }
  .rt__stop {
    fill: var(--surface);
    stroke: var(--ink);
  }
  .rt__stop.is-end {
    stroke: var(--accent);
  }
  .world__label {
    fill: var(--ink);
    font-family: var(--f-display);
    font-weight: 700;
    paint-order: stroke;
    stroke: var(--surface);
    stroke-linejoin: round;
  }
  .geo__sea {
    fill: color-mix(in oklab, var(--turquoise) 30%, var(--surface));
  }
  .geo__land {
    fill: color-mix(in oklab, var(--gold) 7%, var(--surface));
  }
  .geo__shore {
    fill: none;
    stroke: var(--turquoise);
    stroke-width: 0.22;
    stroke-linejoin: round;
    opacity: 0.75;
  }

  /* ----------------------------------------------------------- the camera */
  .cam {
    position: absolute;
    inset-inline-end: var(--sp-snug);
    top: var(--sp-snug);
    display: flex;
    flex-direction: column;
    gap: 1px;
    border-radius: var(--frame-r-sm);
    overflow: hidden;
    border: 1px solid var(--rule-strong);
    background: var(--rule-strong);
    box-shadow: var(--lift-tile);
  }
  .cam button {
    width: 34px;
    height: 34px;
    border: 0;
    background: color-mix(in oklab, var(--surface) 92%, transparent);
    backdrop-filter: blur(8px);
    color: var(--ink-2);
    font-family: var(--f-mono);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
  }
  .cam button:hover:not(:disabled) {
    background: var(--accent);
    color: #fff;
  }
  .cam button:disabled {
    color: var(--ink-4);
    cursor: default;
  }
  .cam__reset {
    font-size: 13px;
  }

  /* ---------------------------------------------------------- the scale bar */
  .scalebar {
    position: absolute;
    inset-inline-start: var(--sp-snug);
    bottom: var(--sp-snug);
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 7px;
    border-radius: 4px;
    background: color-mix(in oklab, var(--surface) 78%, transparent);
    pointer-events: none;
  }
  .scalebar__bar {
    display: block;
    height: 5px;
    min-width: 22px;
    max-width: 40%;
    border: 1px solid var(--ink-3);
    border-top: 0;
  }
  .scalebar__txt {
    font-size: 9px;
    letter-spacing: 0.08em;
    color: var(--ink-3);
  }

  /* A line is a control. It is also two pixels wide, so the cursor and the
     focus ring do the work of telling you so. */
  .netmap__line {
    cursor: pointer;
    transition: opacity var(--d-ui) var(--ease-out);
  }
  .netmap__line:focus-visible {
    outline: none;
    stroke-dasharray: 2 1.4;
  }

  .netmap__attr {
    position: absolute;
    inset-inline-end: var(--sp-snug);
    bottom: var(--sp-snug);
    margin: 0;
    font-size: 9px;
    letter-spacing: 0.06em;
    color: var(--ink-4);
    background: color-mix(in oklab, var(--surface) 78%, transparent);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .netmap__prompt {
    margin: 0;
    font-size: var(--t-small);
    color: var(--ink-3);
  }

  .stn {
    cursor: pointer;
  }
  /* Both states, not just :focus-visible.
     Chromium draws the UA outline on a focused SVG <g> as a rectangle around
     the group's bounding box, and a click focuses it — so selecting a station
     painted a black square across the map. The focus indicator is drawn below
     instead, as a ring on the element's own geometry. */
  .stn:focus,
  .stn:focus-visible {
    outline: none;
  }
  .stn:focus-visible .stn__hit {
    stroke: var(--accent);
    stroke-width: 0.5;
    stroke-dasharray: 1.1 0.9;
  }
  .stn:focus-visible .stn__label {
    fill: var(--accent);
  }
  .stn:focus-visible .stn__dot {
    stroke: var(--accent);
  }
  .stn__label {
    fill: var(--ink-2);
    font-family: var(--f-body);
    font-weight: 600;
    paint-order: stroke;
    stroke: var(--surface);
    stroke-width: 0.55;
    stroke-linejoin: round;
  }
  .stn.is-focused .stn__label {
    fill: var(--accent);
  }
  .stn.is-focused .stn__dot {
    stroke: var(--accent);
  }
  /* Everything that is not the selected station steps back rather than
     disappearing: the point of selecting one is seeing it in its network. */
  .stn.is-dimmed {
    opacity: 0.55;
  }
  .stn.is-selected .stn__label {
    fill: var(--accent);
  }
  .stn__halo {
    fill: none;
    stroke: var(--accent);
    stroke-width: 0.55;
    opacity: 0.85;
  }
  @media (prefers-reduced-motion: no-preference) {
    .stn__halo {
      animation: ping 2.4s var(--ease-out) infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
  }
  @keyframes ping {
    0% {
      scale: 0.72;
      opacity: 0.9;
    }
    70% {
      scale: 1.25;
      opacity: 0;
    }
    100% {
      scale: 1.25;
      opacity: 0;
    }
  }

  /* ------------------------------------------------------------- the lines */
  .lines {
    display: flex;
    flex-direction: column;
    gap: var(--sp-snug);
    padding-top: var(--sp-base);
  }
  .lines__h {
    font-size: var(--t-h3);
    margin: 0;
  }
  .lines__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: var(--sp-tight);
  }
  .lines__row {
    display: flex;
    align-items: center;
    gap: var(--sp-tight);
    width: 100%;
    padding: 7px 10px;
    border: 1px solid var(--rule-strong);
    border-radius: var(--r-capsule);
    background: var(--surface);
    color: inherit;
    font: inherit;
    min-width: 0;
    cursor: pointer;
    transition:
      border-color var(--d-hover) var(--ease-out),
      background-color var(--d-hover) var(--ease-out);
  }
  .lines__row:hover {
    border-color: var(--accent);
  }
  .lines__row.is-on {
    border-color: var(--accent);
    background: color-mix(in oklab, var(--accent) 12%, var(--surface));
  }
  .lines__meta {
    font-size: var(--t-micro);
    color: var(--ink-3);
    margin-left: auto;
    white-space: nowrap;
  }

  .netmap__table summary {
    cursor: pointer;
    font-family: var(--f-display);
    font-size: var(--t-small);
    font-weight: 600;
    padding: var(--sp-tight) 0;
  }
  .netmap__table tr.is-dim {
    opacity: 0.4;
  }
  .tbl__pick {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 600;
    text-align: start;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: var(--rule-strong);
    text-underline-offset: 3px;
  }
  .tbl__pick:hover {
    color: var(--accent);
  }
  .netmap__note {
    font-size: var(--t-small);
    color: var(--ink-3);
    padding-top: var(--sp-snug);
  }
</style>
