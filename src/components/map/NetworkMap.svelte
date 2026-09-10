<script lang="ts">
  import { LINES, NODES, nodeById, type Node } from '../../data/network.ts';
  import { WINDOW } from '../../data/geography.ts';
  import { WORLD, ISTANBUL, WORLD_W } from '../../data/world.ts';
  import { haversine } from '../../lib/geo.ts';
  import LineCard from './LineCard.svelte';
  import { GEO, GEO_H, LAND, SHORE, ISLANDS, LAKES } from '../../data/geography.ts';
  import StationCard from './StationCard.svelte';
  import { num, type Locale } from '../../lib/locale.ts';

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
  }
  const { locale, labels }: Props = $props();

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

  const boxOf = (name: string, p: Place): Box => {
    const w = name.length * CHAR_W * FS;
    const x0 = p.anchor === 'middle' ? p.x - w / 2 : p.anchor === 'end' ? p.x - w : p.x;
    return {
      x0: x0 - PAD,
      x1: x0 + w + PAD,
      y0: p.y - FS * 1.05 - PAD,
      y1: p.y + FS * 0.5 + PAD,
    };
  };
  const overlaps = (a: Box, b: Box): boolean =>
    a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

  /** Positions a name will accept, best first. */
  function candidates(n: Node): Place[] {
    const p = pos(n);
    const i = spineOrder.indexOf(n.id);
    const gap = 1.2 + 1.2 * ink;
    const above: Place = { x: p.x, y: p.y - gap - 1.1, anchor: 'middle' };
    const below: Place = { x: p.x, y: p.y + gap + 2.5, anchor: 'middle' };
    const right: Place = { x: p.x + gap, y: p.y + 0.7, anchor: 'start' };
    const left: Place = { x: p.x - gap, y: p.y + 0.7, anchor: 'end' };
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
      const r = (n.lines.length > 1 ? 1.7 : 1.2) * ink;
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

  /** Below 0.28 the world reads; above it, the network. They cross-fade. */
  const worldAlpha = $derived(Math.max(0, Math.min(1, (0.28 - zoom) / 0.24)));
  const netAlpha = $derived(Math.max(0, Math.min(1, (zoom - 0.05) / 0.12)));

  const viewW = $derived(W / zoom);
  const viewH = $derived(H / zoom);

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

  /** Which lines are drawn at full strength. */
  const litLinesAll = $derived(
    selectedLine ? new Set([selectedLine]) : selectedNode ? litLines : null,
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

  <div class="netmap__stage" class:is-open={!!selectedNode || !!selectedLineObj}>
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
        {#if worldAlpha > 0}
          <g class="world" opacity={worldAlpha}>
            <rect
              x={ISTANBUL.x - WORLD_W}
              y={ISTANBUL.y - WORLD_W}
              width={WORLD_W * 2}
              height={WORLD_W * 2}
              class="geo__sea"
            />
            {#each WORLD as d, i (i)}<path {d} class="world__land" />{/each}
            <circle
              cx={ISTANBUL.x}
              cy={ISTANBUL.y}
              r={Math.max(viewW * 0.012, 6)}
              class="world__pin"
              stroke-width={viewW * 0.004}
            />
            <text
              x={ISTANBUL.x + viewW * 0.02}
              y={ISTANBUL.y + viewW * 0.006}
              class="world__label"
              font-size={viewW * 0.026}>İstanbul</text
            >
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

    {#if selectedNode}
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
    The map as a table. Required by WCAG 1.1.1, and in practice the fastest way
    to answer "which lines call at Yenikapı" - which no amount of hovering a
    diagram will beat. The names are buttons, so the table is also the way to
    open a station without hitting a two-pixel dot.
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
  .world__land {
    fill: color-mix(in oklab, var(--gold) 10%, var(--ground-2));
    stroke: color-mix(in oklab, var(--turquoise) 55%, transparent);
    stroke-width: 0;
  }
  .world__pin {
    fill: var(--accent);
    stroke: var(--surface);
  }
  .world__label {
    fill: var(--ink);
    font-family: var(--f-display);
    font-weight: 700;
    paint-order: stroke;
    stroke: var(--surface);
    stroke-width: 0.5%;
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
