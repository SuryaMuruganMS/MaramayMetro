<script lang="ts">
  import { LINES, NODES, nodeById, type Node } from '../../data/network.ts';
  import { PROFILE, STOPS, CH_END } from '../../data/alignment.ts';
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
   * All three registers share one set of station nodes, so the morph is a
   * position tween rather than a crossfade between two pictures. Nothing is
   * redrawn; the same stations move.
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
  /** 0 = diagram, 1 = geographic. Tweened, so the two registers morph. */
  let morph = $state(0);

  const W = 100;
  /**
   * The drawing area, not the coordinate space.
   *
   * Nodes are placed on a 100x70 grid, but nothing sits below y=50 - the tallest
   * thing down there is Sabiha Gökçen. Rendering the full 70 left a third of the
   * frame empty under the diagram. The viewBox is cropped to what is actually
   * drawn, plus room for the labels that hang below the spine.
   */
  const H = 56;

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
    if (register === 'section') {
      return sectionPos(n) ?? { x: n.x, y: n.y };
    }
    return {
      x: n.x + (n.gx - n.x) * morph,
      y: n.y + (n.gy - n.y) * morph,
    };
  }

  /**
   * The table is sorted by name in the reader's locale. Turkish collates
   * ç, ğ, ı, i, ö, ş, ü in its own order, so a default sort would file Ümraniye
   * and Üsküdar in the wrong place for exactly the readers most likely to be
   * looking for them.
   */
  const byName = $derived([...NODES].sort((a, b) => a.name.localeCompare(b.name, locale)));

  /**
   * Label placement along the Marmaray spine.
   *
   * Eleven stations sit on one horizontal line, and right-anchored labels ran
   * straight through each other - Bakırköy over Kazlıçeşme over Yenikapı. Real
   * transit diagrams solve this by alternating sides of the line, so that is
   * what happens here: consecutive spine stations take turns above and below,
   * which doubles the room each name has without moving a single station.
   */
  const SPINE_Y = 40;
  const spineOrder = NODES.filter((n) => n.y === SPINE_Y)
    .sort((a, b) => a.x - b.x)
    .map((n) => n.id);

  function label(n: Node): { x: number; y: number; anchor: string } {
    const p = pos(n);
    const i = spineOrder.indexOf(n.id);
    if (i >= 0 && register !== 'section') {
      // Above on even, below on odd. Centred, so the name grows either side of
      // its own station rather than into the next one.
      return { x: p.x, y: i % 2 === 0 ? p.y - 2.8 : p.y + 4.2, anchor: 'middle' };
    }
    return { x: p.x + 2.2, y: p.y + 0.7, anchor: 'start' };
  }

  const shown = $derived(NODES.filter((n) => !stepFreeOnly || n.stepFree));
  const shownIds = $derived(new Set(shown.map((n) => n.id)));

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
    const dur = 760;
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

  const REGISTERS: Array<{ id: Register; key: string }> = [
    { id: 'diagram', key: 'reg.diagram' },
    { id: 'geographic', key: 'reg.geographic' },
    { id: 'section', key: 'reg.section' },
  ];
</script>

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

  {#if register === 'geographic'}
    <p class="netmap__caveat mono">{labels['map.geoCaveat']}</p>
  {:else if register === 'section'}
    <p class="netmap__caveat mono">{labels['map.sectionCaveat']}</p>
  {/if}

  <div class="netmap__frame">
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class="netmap__svg"
      role="img"
      aria-label={labels['map.alt']}
    >
      <!-- The Bosphorus. In the diagram it is a straight channel; in geography
           it bends, which is one of the things the morph shows. -->
      {#if register !== 'section'}
        <path
          d={morph < 0.5 ? 'M53,0 L53,56' : 'M55,0 C53,12 57,24 54,34 C52,42 56,50 53,56'}
          stroke="var(--turquoise)"
          stroke-width={2.4}
          fill="none"
          opacity="0.34"
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
            stroke-width={line.kind === 'rail' ? 1.5 : 1.1}
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
            opacity={stepFreeOnly ? 0.35 : 1}
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
            role="listitem"
            onmouseenter={() => (focused = n.id)}
            onmouseleave={() => (focused = null)}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={n.lines.length > 1 ? 1.5 : 1}
              fill="var(--surface)"
              stroke="var(--ink)"
              stroke-width={n.lines.length > 1 ? 0.7 : 0.5}
            />
            {#if n.lines.length > 1 || register === 'section' || focused === n.id}
              {@const l = label(n)}
              <text
                x={l.x}
                y={l.y}
                text-anchor={l.anchor}
                class="stn__label"
                font-size="1.7">{n.name}</text
              >
            {/if}
          </g>
        {/if}
      {/each}
    </svg>
  </div>

  <!--
    The map as a table. Required by WCAG 1.1.1, and in practice the fastest way
    to answer "which lines call at Yenikapı" - which no amount of hovering a
    diagram will beat.
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
              <th scope="row">{n.name}</th>
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

  .netmap__frame {
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--r-panel);
    padding: var(--sp-snug);
    overflow-x: auto;
  }
  .netmap__svg {
    /* Bounded by HEIGHT, not width. A 100x70 viewBox stretched to a 1290px
       column comes out 900px tall and runs off the bottom of the screen; the
       whole point of a network diagram is seeing all of it at once. */
    width: 100%;
    max-width: calc(64vh * (100 / 56));
    max-height: 64vh;
    min-width: 620px;
    aspect-ratio: 100 / 56;
    height: auto;
    display: block;
    margin-inline: auto;
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
  .stn.is-focused circle {
    stroke: var(--accent);
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
  .netmap__note {
    font-size: var(--t-small);
    color: var(--ink-3);
    padding-top: var(--sp-snug);
  }
</style>
