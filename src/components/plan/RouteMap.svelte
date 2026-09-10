<script lang="ts">
  import { nodeById, lineById } from '../../data/network.ts';
  import { GEO, GEO_H, LAND, SHORE, ISLANDS, LAKES } from '../../data/geography.ts';
  import type { Route } from '../../lib/route.ts';
  import { num, type Locale } from '../../lib/locale.ts';

  /**
   * The planned journey, drawn on the ground.
   *
   * The planner already said everything true about a route — the time, the
   * changes, the fare, the deepest point — and none of it answered "where does
   * that actually go". A list of station names is a route to somebody who
   * knows the city and a list of words to everybody else.
   *
   * It reuses the map page's geography rather than a picture of it: the same
   * coastline, the same projection, the same station coordinates. Two drawings
   * of İstanbul on one site that disagreed by a kilometre would be worse than
   * one drawing used twice.
   *
   * WHAT IT DOES NOT DO
   * It does not pan or zoom. This is a diagram of one journey, framed to that
   * journey, and a camera on it would be a second thing to learn for no
   * answer the full map does not already give better. There is a link to that
   * map instead.
   */
  interface Props {
    route: Route;
    locale: Locale;
    labels: Record<string, string>;
  }
  const { route, locale, labels }: Props = $props();

  const stops = $derived([route.from, ...route.hops.map((h) => h.node)]);

  /** One <path> per leg, so each ride is drawn in its own line's colour. */
  const legPaths = $derived(
    route.legs.map((leg) => ({
      line: leg.line,
      colour: lineById.get(leg.line)?.colour ?? 'var(--accent)',
      d: leg.stops
        .map((id) => GEO[id])
        .filter(Boolean)
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p!.x},${p!.y}`)
        .join(' '),
    })),
  );

  /**
   * Frame the journey, not the city.
   *
   * A route from Sirkeci to Üsküdar occupies three per cent of the network's
   * bounding box; drawn at the full extent it is a dash. The viewBox is the
   * route's own bounds plus a margin, floored so a very short hop does not
   * come out magnified past the point where the coastline means anything.
   */
  const box = $derived.by(() => {
    const pts = stops.map((id) => GEO[id]).filter((p): p is NonNullable<typeof p> => !!p);
    if (!pts.length) return { x: 0, y: 0, w: 100, h: GEO_H };
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 6;
    let w = Math.max(22, maxX - minX + pad * 2);
    let h = Math.max(14, maxY - minY + pad * 2);
    // Hold the frame's own proportions, or the coastline comes out stretched.
    const AR = 100 / 52;
    if (w / h < AR) w = h * AR;
    else h = w / AR;
    const x = Math.max(0, Math.min(100 - w, (minX + maxX) / 2 - w / 2));
    const y = Math.max(0, Math.min(GEO_H - h, (minY + maxY) / 2 - h / 2));
    return { x, y, w, h };
  });

  /** Ink held at a constant size on screen, as on the full map. */
  const px = $derived(box.w / 100);
  const dp = (v: number) =>
    num(v, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
</script>

<figure class="rmap">
  <svg
    viewBox={`${box.x.toFixed(2)} ${box.y.toFixed(2)} ${box.w.toFixed(2)} ${box.h.toFixed(2)}`}
    role="img"
    aria-label={`${nodeById.get(route.from)?.name} → ${nodeById.get(route.to)?.name}`}
  >
    <rect x="0" y="0" width="100" height={GEO_H} class="rmap__sea" />
    {#each LAND as d, i (i)}<path {d} class="rmap__land" />{/each}
    {#each ISLANDS as d, i (i)}<path {d} class="rmap__land" />{/each}
    {#each LAKES as l (l.name)}<path d={l.d} class="rmap__sea" />{/each}
    {#each SHORE as d, i (i)}
      <path {d} class="rmap__shore" stroke-width={0.22 * px} />
    {/each}

    <!-- The route: a wide dark casing under a coloured core, which is how a
         line is drawn on every transit map ever printed, and the reason it
         stays readable crossing a coastline. -->
    {#each legPaths as leg, i (i)}
      <path
        d={leg.d}
        fill="none"
        stroke="var(--ground)"
        stroke-width={2.6 * px}
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.85"
      />
    {/each}
    {#each legPaths as leg, i (i)}
      <path
        d={leg.d}
        fill="none"
        stroke={leg.colour}
        stroke-width={1.5 * px}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {/each}

    {#each stops as id, i (id)}
      {@const p = GEO[id]}
      {#if p}
        {@const isEnd = i === 0 || i === stops.length - 1}
        <circle
          cx={p.x}
          cy={p.y}
          r={(isEnd ? 1.7 : 1) * px}
          fill="var(--surface)"
          stroke={isEnd ? 'var(--accent)' : 'var(--ink)'}
          stroke-width={(isEnd ? 0.9 : 0.55) * px}
        />
        {#if isEnd}
          <text
            x={p.x + 2.4 * px}
            y={p.y + 0.7 * px}
            class="rmap__label"
            font-size={2.2 * px}
            stroke-width={0.7 * px}>{nodeById.get(id)?.name}</text
          >
        {/if}
      {/if}
    {/each}
  </svg>

  <figcaption class="rmap__cap mono">
    {dp(route.km)}
    {labels['x.km']} · {labels['map.source']}
  </figcaption>
</figure>

<style>
  .rmap {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-tight);
  }
  .rmap svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 46vh;
    aspect-ratio: 100 / 52;
    border: 1px solid var(--rule-strong);
    border-radius: var(--frame-r);
    background: var(--surface);
  }
  /*
     Stronger than the full map's, on purpose.

     At a third of the size and framed to one journey, the land and sea were a
     shade apart in the dark theme and the first cut read as a coloured line
     over a black rectangle. A small map has to carry the same information in
     fewer pixels, so it gets more contrast, not the same.
  */
  .rmap__sea {
    fill: color-mix(in oklab, var(--turquoise) 52%, var(--surface));
  }
  .rmap__land {
    fill: color-mix(in oklab, var(--gold) 14%, var(--ground-2));
  }
  .rmap__shore {
    fill: none;
    stroke: var(--turquoise);
    stroke-linejoin: round;
    opacity: 0.75;
  }
  .rmap__label {
    fill: var(--ink);
    font-family: var(--f-body);
    font-weight: 600;
    paint-order: stroke;
    stroke: var(--surface);
    stroke-linejoin: round;
  }
  .rmap__cap {
    font-size: var(--t-micro);
    letter-spacing: 0.06em;
    color: var(--ink-4);
  }
</style>
