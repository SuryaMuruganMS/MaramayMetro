<script lang="ts">
  import { LINES, nodeById, lineById, type Node } from '../../data/network.ts';
  import { STOPS } from '../../data/alignment.ts';
  import { GEO } from '../../data/geography.ts';
  import { findRoute } from '../../lib/route.ts';
  import { fareFor, toLira } from '../../data/fares.ts';
  import { formatLevel, formatCh } from '../../lib/chainage.ts';
  import { lira, num, href, type Locale } from '../../lib/locale.ts';

  /**
   * What opens when you click a station.
   *
   * A pin with a name on it is not information — the reader can already see the
   * name. So this answers the questions the map itself cannot: which trains
   * stop here and where they go, how deep the platform is if it is under the
   * strait, whether you can get to it in a wheelchair, and the one thing this
   * whole site is about — how far it is from here to the other continent, how
   * long that takes and what it costs.
   *
   * That last block is computed live from the same routing and fare code as the
   * planner, not written down. Change the tariff and this card changes with it.
   */
  interface Props {
    node: Node;
    locale: Locale;
    labels: Record<string, string>;
    onclose: () => void;
  }
  const { node, locale, labels, onclose }: Props = $props();

  /** Its place on the crossing, if it has one. Nine stations do. */
  const stop = $derived(STOPS.find((s) => s.id === node.id) ?? null);

  /**
   * Where the platform sits in the little section drawing: sea level at y=10,
   * the seabed at y=32. Computed here rather than in the markup because
   * `{@const}` is only legal as the direct child of a control block, and this
   * one sits inside an `<svg>`.
   */
  const sliceY = $derived(stop ? 10 + (Math.abs(Math.min(0, stop.level)) / 65) * 22 : 10);
  const geo = $derived(GEO[node.id] ?? null);

  /**
   * The first station on the other continent, along the spine.
   *
   * Not the nearest station in a straight line — that would be across the water
   * with no way to reach it. The crossing's two portals are Sirkeci and
   * Üsküdar, so from Europe you are heading for Üsküdar and from Asia for
   * Sirkeci, and the router works out the rest.
   */
  const target = $derived(node.continent === 'EU' ? 'uskudar' : 'sirkeci');
  const crossing = $derived(node.id === target ? null : findRoute(node.id, target));
  const crossFare = $derived(crossing ? fareFor(crossing, 'full') : null);

  const calls = $derived(
    node.lines
      .map((id) => lineById.get(id))
      .filter((l): l is (typeof LINES)[number] => !!l)
      .map((l) => ({
        id: l.id,
        name: l.name,
        colour: l.colour,
        // Where this line goes from here: its two ends, as drawn.
        ends: [l.route[0], l.route[l.route.length - 1]]
          .map((t) => nodeById.get(t!)?.name)
          .filter((n): n is string => !!n && n !== node.name),
      })),
  );

  const money = (kurus: number) => lira(toLira(kurus), locale);
  const dp = (v: number, d = 1) =>
    num(v, locale, { minimumFractionDigits: d, maximumFractionDigits: d });
</script>

<aside class="card" aria-live="polite">
  <div class="card__top">
    <p class="card__eyebrow label">{labels['map.openStation']}</p>
    <button class="card__x" type="button" onclick={onclose} title={labels['map.close']}>
      <span class="visually-hidden">{labels['map.close']}</span>
      <span aria-hidden="true">×</span>
    </button>
  </div>

  <!-- The nameboard. Set the way a platform sign is set, because that is the
       object a passenger matches this against when they arrive. -->
  <h3 class="card__name">{node.name}</h3>

  <ul class="card__chips">
    <li class="chip">{node.continent === 'EU' ? labels['j.europe'] : labels['j.asia']}</li>
    <li class="chip" class:is-no={!node.stepFree}>
      {labels['map.access']}: {node.stepFree ? labels['map.yes'] : labels['map.no']}
    </li>
  </ul>

  <!-- Lines, with where they run to. A roundel on its own says which line calls
       here; it does not say which direction is which. -->
  <div class="card__block">
    <p class="label">{labels['map.calls']}</p>
    <ul class="calls">
      {#each calls as c (c.id)}
        <li>
          <span class="roundel" style={`--line:${c.colour}`}>{c.name}</span>
          <span class="calls__to">{c.ends.join(' · ')}</span>
        </li>
      {/each}
    </ul>
  </div>

  <!-- Depth. Only nine stations have it, and saying so is better than an
       empty field or a zero that reads as sea level. -->
  <div class="card__block">
    <p class="label">{labels['map.depth']}</p>
    {#if stop}
      <p class="card__level">
        <span class="fig">{formatLevel(stop.level)}</span>
        <span class="card__ch mono">CH {formatCh(stop.ch)}</span>
      </p>
      <!-- A slice of the section, drawn to the same scale as /harita's third
           register: sea level across the top, this platform below it. -->
      <svg class="slice" viewBox="0 0 100 34" role="img" aria-hidden="true">
        <rect x="0" y="0" width="100" height="10" fill="var(--band-shallow)" />
        <line x1="0" y1="10" x2="100" y2="10" stroke="var(--turquoise)" stroke-width="0.8" />
        <rect
          x="0"
          y="10"
          width="100"
          height="24"
          fill="color-mix(in oklab, var(--ink) 7%, transparent)"
        />
        <line
          x1="50"
          y1="10"
          x2="50"
          y2={sliceY}
          stroke="var(--accent)"
          stroke-width="0.7"
          stroke-dasharray="1.6 1.4"
        />
        <circle cx="50" cy={sliceY} r="2.4" fill="var(--accent)" />
      </svg>
    {:else}
      <p class="card__none">{labels['map.notOnLine']}</p>
    {/if}
  </div>

  <!-- The question the site exists to answer, asked from wherever you are. -->
  <div class="card__block card__block--cross">
    <p class="label">{labels['map.otherSide']}</p>
    {#if !crossing}
      <p class="card__none">{labels['map.hereAlready']}</p>
    {:else}
      <dl class="cross">
        <div>
          <dt>{labels['x.km']}</dt>
          <dd class="fig">{dp(crossing.km)}</dd>
        </div>
        <div>
          <dt>{labels['plan.duration']}</dt>
          <dd class="fig">~{crossing.minutes} {labels['x.min']}</dd>
        </div>
        <div>
          <dt>{labels['plan.changes']}</dt>
          <dd class="fig">{crossing.changes === 0 ? '—' : crossing.changes}</dd>
        </div>
        {#if crossFare}
          <div>
            <dt>{labels['plan.fare']}</dt>
            <dd class="fig">{money(crossFare.kurus)}</dd>
          </div>
        {/if}
      </dl>
      <p class="card__to mono">→ {nodeById.get(target)?.name}</p>
    {/if}
  </div>

  {#if geo}
    <p class="card__coords mono">
      {labels['map.coords']}
      <span>{dp(geo.lat, 4)}, {dp(geo.lon, 4)}</span>
    </p>
  {/if}

  <div class="card__links">
    <a class="tile tile--sm" href={href('/sefer', locale)}>{labels['map.planFrom']}</a>
    <a class="tile tile--sm tile--ghost" href={href('/ucret', locale)}>
      {labels['map.faresFrom']}
    </a>
  </div>
</aside>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--sp-snug);
    padding: var(--sp-base);
    background: var(--surface);
    border: 1px solid var(--rule);
    border-top: 3px solid var(--accent);
    border-radius: var(--r-panel);
  }
  .card__top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-snug);
  }
  .card__eyebrow {
    margin: 0;
  }
  .card__x {
    width: 28px;
    height: 28px;
    flex: none;
    border: 1px solid var(--rule);
    border-radius: var(--r-capsule);
    background: transparent;
    color: var(--ink-3);
    font-size: 17px;
    line-height: 1;
    cursor: pointer;
  }
  .card__x:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .card__name {
    margin: 0;
    font-family: var(--f-display);
    font-size: clamp(1.4rem, 2.4vw, 1.9rem);
    font-weight: 700;
    letter-spacing: var(--tr-display);
    line-height: 1.05;
  }

  .card__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-tight);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .chip.is-no {
    color: var(--warn);
    border-color: color-mix(in oklab, var(--warn) 45%, transparent);
  }

  .card__block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: var(--sp-snug);
    border-top: 1px solid var(--rule-soft);
  }
  .card__block .label {
    margin: 0;
  }
  .card__block--cross {
    border-top-color: var(--accent);
  }

  .calls {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .calls li {
    display: flex;
    align-items: center;
    gap: var(--sp-tight);
    min-width: 0;
  }
  .calls__to {
    font-size: var(--t-small);
    color: var(--ink-3);
    overflow-wrap: anywhere;
  }

  .card__level {
    display: flex;
    align-items: baseline;
    gap: var(--sp-snug);
    margin: 0;
  }
  .card__level .fig {
    font-size: 1.5rem;
    font-weight: 600;
  }
  .card__ch {
    font-size: var(--t-micro);
    letter-spacing: 0.08em;
    color: var(--ink-4);
  }
  .slice {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 4px;
    overflow: hidden;
  }
  .card__none {
    margin: 0;
    font-size: var(--t-small);
    color: var(--ink-3);
  }

  .cross {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr));
    gap: var(--sp-snug);
    margin: 0;
  }
  .cross div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .cross dt {
    font-family: var(--f-mono);
    font-size: var(--t-micro);
    letter-spacing: 0.1em;
    color: var(--ink-3);
  }
  .cross dd {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--ink);
  }
  .card__to {
    margin: 0;
    font-size: var(--t-micro);
    letter-spacing: 0.08em;
    color: var(--accent);
  }

  .card__coords {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-tight);
    margin: 0;
    padding-top: var(--sp-snug);
    border-top: 1px solid var(--rule-soft);
    font-size: var(--t-micro);
    letter-spacing: 0.06em;
    color: var(--ink-4);
  }
  .card__coords span {
    color: var(--ink-2);
  }

  .card__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-tight);
  }
</style>
