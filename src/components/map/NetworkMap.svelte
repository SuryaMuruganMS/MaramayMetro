<script lang="ts">
  import { LINES, NODES, nodeById, type Node } from '../../data/network.ts';
  import { PROFILE, STOPS, CH_END } from '../../data/alignment.ts';
  import { GEO, GEO_H, LAND, SHORE, ISLANDS, LAKES } from '../../data/geography.ts';
  import StationCard from './StationCard.svelte';
  import type { Locale } from '../../lib/locale.ts';

  /**
   * The network in three registers.
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
   * All three registers share one set of station nodes, so the morph is a
   * position tween rather than a crossfade between two pictures. Nothing is
   * redrawn; the same stations move. The frame grows taller as it goes, because
   * İstanbul is not the shape of a transit diagram.
   */
  interface Props {
    locale: Locale;
    labels: Record<string, string>;
  }
  const { locale, labels }: Props = $props();

  type Register = 'diagram' | 'geographic' | 'section';

  let register = $state<Register>('diagram');
  let stepFreeOnly = $state(false);
  let focused = $state<string | null>(null);
  let selected = $state<string | null>(null);
  /** 0 = diagram, 1 = geographic. Tweened, so the two registers morph. */
  let morph = $state(0);

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
  const H = $derived(register === 'section' ? DIAG_H : DIAG_H + (GEO_H - DIAG_H) * morph);

  // The section register is a different projection entirely: chainage across,
  // real elevation down. It only has data for the Marmaray spine, and says so.
  const SPINE = new Set(STOPS.map((s) => s.id));

  function sectionPos(n: Node): { x: number; y: number } | null {
    const stop = STOPS.find((s) => s.id === n.id);
    if (!stop) return null;
    return {
      x: 6 + (stop.ch / CH_END) * 88,
      // +10 m at the top of the box, -65 m at the bottom.
      y: 8 + ((10 - stop.level) / 75) * 54,
    };
  }

  function pos(n: Node): { x: number; y: number } {
    if (register === 'section') return sectionPos(n) ?? { x: n.x, y: n.y };
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
  const coastAlpha = $derived(register === 'section' ? 0 : Math.max(0, (morph - 0.4) / 0.6));

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

  const shown = $derived(NODES.filter((n) => !stepFreeOnly || n.stepFree));
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
    if (i >= 0 && register !== 'section') {
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
      if (register === 'section' && !SPINE.has(n.id)) continue;
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
      if (register === 'section' && !SPINE.has(n.id)) continue;
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
      .filter((n) => register !== 'section' || SPINE.has(n.id))
      .map((n) => pos(n));
    if (pts.length < 2) return '';
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');
  }

  /** The section register draws the real vertical alignment, not straight hops. */
  const sectionAlignment = $derived(
    PROFILE.map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'}${(6 + (p.ch / CH_END) * 88).toFixed(2)},${(
          8 +
          ((10 - p.level) / 75) * 54
        ).toFixed(2)}`,
    ).join(' '),
  );

  function setRegister(next: Register) {
    if (next === register) return;
    const wasSection = register === 'section';
    register = next;
    if (next === 'section' || wasSection) {
      // No tween into or out of a different projection: chainage and geography
      // are not the same axis, and interpolating between them would draw a
      // shape that is neither.
      morph = next === 'geographic' ? 1 : 0;
      return;
    }
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
  }
  const REGISTERS: Array<{ id: Register; key: string }> = [
    { id: 'diagram', key: 'reg.diagram' },
    { id: 'geographic', key: 'reg.geographic' },
    { id: 'section', key: 'reg.section' },
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

    <label class="switch">
      <input type="checkbox" bind:checked={stepFreeOnly} />
      <span class="switch__track" aria-hidden="true"><span class="switch__knob"></span></span>
      <span class="switch__txt">{labels['map.stepFree']}</span>
    </label>
  </div>

  <p class="netmap__caveat mono">
    {#if register === 'geographic'}
      {labels['map.geoCaveat']}
    {:else if register === 'section'}
      {labels['map.sectionCaveat']}
    {:else}
      {labels['map.click']}
    {/if}
  </p>

  <div class="netmap__stage" class:is-open={!!selectedNode}>
    <div class="netmap__frame" style={`--ar:${(W / H).toFixed(4)}`}>
      <svg viewBox={`0 0 ${W} ${H}`} class="netmap__svg" aria-label={labels['map.alt']}>
        <!--
          THE GROUND.

          Sea is the background and land is painted onto it, which is the way
          round OpenStreetMap's coastline data actually supports: its ways are
          directed with land on the left and are not closed, so the land was
          closed against the window edge when the data was built and the sea
          needs no shape of its own.
        -->
        {#if coastAlpha > 0}
          <g class="geo" opacity={coastAlpha}>
            <rect x="0" y="0" width={W} height={GEO_H} class="geo__sea" />
            {#each LAND as d, i (i)}<path {d} class="geo__land" />{/each}
            {#each ISLANDS as d, i (i)}<path {d} class="geo__land" />{/each}
            {#each LAKES as l (l.name)}<path d={l.d} class="geo__sea" />{/each}
            {#each SHORE as d, i (i)}<path {d} class="geo__shore" />{/each}
          </g>
        {/if}

        <!-- The Bosphorus, schematic. It hands over to the real coastline as
             that fades in, rather than being drawn on top of it. -->
        {#if register !== 'section' && coastAlpha < 1}
          <path
            d="M53,0 L53,56"
            stroke="var(--turquoise)"
            stroke-width={2.4}
            fill="none"
            opacity={0.34 * (1 - coastAlpha)}
          />
        {/if}

        {#if register === 'section'}
          <!-- Sea level, and the alignment as it really runs. -->
          <line
            x1="6"
            y1={8 + (10 / 75) * 54}
            x2="94"
            y2={8 + (10 / 75) * 54}
            stroke="var(--turquoise)"
            stroke-width="0.5"
            opacity="0.7"
          />
          <path
            d={sectionAlignment}
            stroke="var(--accent)"
            stroke-width="1.1"
            fill="none"
            stroke-linejoin="round"
          />
        {:else}
          {#each LINES as line (line.id)}
            <path
              d={routePath(line.route)}
              stroke={line.colour}
              stroke-width={(line.kind === 'rail' ? 1.5 : 1.1) * ink}
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
              opacity={stepFreeOnly ? 0.35 : selectedNode && !litLines.has(line.id) ? 0.34 : 1}
            />
          {/each}
        {/if}

        <!-- Stations. Interchanges are larger because they are where a decision
             gets made; everything else is a stop. -->
        {#each shown as n (n.id)}
          {@const p = pos(n)}
          {#if register !== 'section' || SPINE.has(n.id)}
            <g
              class="stn"
              class:is-focused={focused === n.id}
              class:is-selected={selected === n.id}
              class:is-dimmed={!!selectedNode && selected !== n.id}
              role="button"
              tabindex="0"
              aria-pressed={selected === n.id}
              aria-label={n.name}
              onmouseenter={() => (focused = n.id)}
              onmouseleave={() => (focused = null)}
              onfocus={() => (focused = n.id)}
              onblur={() => (focused = null)}
              onclick={() => pick(n.id)}
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
              <circle cx={p.x} cy={p.y} r="2.6" class="stn__hit" fill="transparent" />
              {#if selected === n.id}
                <circle cx={p.x} cy={p.y} r="3.2" class="stn__halo" />
              {/if}
              <circle
                cx={p.x}
                cy={p.y}
                r={(n.lines.length > 1 ? 1.5 : 1) * ink}
                class="stn__dot"
                fill="var(--surface)"
                stroke="var(--ink)"
                stroke-width={(n.lines.length > 1 ? 0.7 : 0.5) * ink}
              />
              {#if labelFor(n)}
                {@const l = labelFor(n)!}
                <text x={l.x} y={l.y} text-anchor={l.anchor} class="stn__label" font-size={FS}
                  >{n.name}</text
                >
              {/if}
            </g>
          {/if}
        {/each}
      </svg>

      {#if register === 'geographic' && coastAlpha > 0.8}
        <p class="netmap__attr mono">{labels['map.source']}</p>
      {/if}
    </div>

    {#if selectedNode}
      <StationCard node={selectedNode} {locale} {labels} onclose={() => (selected = null)} />
    {:else}
      <p class="netmap__prompt">{labels['map.pickPrompt']}</p>
    {/if}
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

  .switch {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-tight);
    cursor: pointer;
    font-size: var(--t-small);
    color: var(--ink-2);
  }
  .switch input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  .switch__track {
    width: 40px;
    height: 23px;
    border-radius: var(--r-capsule);
    background: color-mix(in oklab, var(--ink) 16%, transparent);
    padding: 3px;
    transition: background-color var(--d-ui) var(--ease-out);
  }
  .switch__knob {
    display: block;
    width: 17px;
    height: 17px;
    border-radius: var(--r-capsule);
    background: var(--surface);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.24);
    transition: translate var(--d-ui) var(--ease-mech);
  }
  .switch input:checked + .switch__track {
    background: var(--ok);
  }
  .switch input:checked + .switch__track .switch__knob {
    translate: 17px 0;
  }
  .switch input:focus-visible + .switch__track {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
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
