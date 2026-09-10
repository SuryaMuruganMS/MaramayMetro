<script lang="ts">
  import { nodeById, type Line } from '../../data/network.ts';
  import { railKm } from '../../lib/geo.ts';
  import { num, type Locale } from '../../lib/locale.ts';

  /**
   * What opens when you press a line.
   *
   * The Lines list under the map used to be twelve read-only chips with a
   * station count on each — a legend, and legends answer one question. Pressing
   * one now frames that line on the map and opens this, which answers the rest:
   * where it runs from and to, how long the drawn route is, where it meets
   * everything else, and how much of the real line is on the map at all.
   *
   * That last figure is the honest one and it is why this exists. This site
   * draws termini and interchanges, not every stop. A card that said "M4, 24
   * stations" over a drawing of six would be lying by omission; saying "6 of 24
   * drawn" makes the abstraction visible, which is the same argument the whole
   * map page is built on.
   */
  interface Props {
    line: Line;
    locale: Locale;
    labels: Record<string, string>;
    onclose: () => void;
    onstation: (id: string) => void;
  }
  const { line, locale, labels, onclose, onstation }: Props = $props();

  const stops = $derived(
    line.route.map((id) => nodeById.get(id)).filter((n): n is NonNullable<typeof n> => !!n),
  );

  /** The drawn route's length. Not the line's — the map does not draw all of it. */
  const drawnKm = $derived(
    line.route.reduce((n, id, i) => (i === 0 ? 0 : n + railKm(line.route[i - 1]!, id)), 0),
  );

  /** Where this line meets another. The decisions a passenger makes on it. */
  const meets = $derived(
    stops
      .filter((n) => n.lines.length > 1)
      .map((n) => ({
        node: n,
        others: n.lines.filter((l) => l !== line.id),
      })),
  );

  const kindLabel = $derived(labels[`kind.${line.kind}`] ?? line.kind);
  const dp = (v: number) =>
    num(v, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
</script>

<aside class="lc" aria-live="polite">
  <div class="lc__top">
    <p class="lc__eyebrow label">{labels['map.lineDetails']}</p>
    <button class="lc__x" type="button" onclick={onclose} title={labels['map.close']}>
      <span class="visually-hidden">{labels['map.close']}</span>
      <span aria-hidden="true">×</span>
    </button>
  </div>

  <div class="lc__head">
    <span class="roundel roundel--lg" style={`--line:${line.colour}`}>{line.name}</span>
    <span class="chip">{kindLabel}</span>
  </div>

  <!-- The two ends, which is what a line IS to somebody standing on a platform
       reading a departure board. -->
  <p class="lc__ends">
    <b>{stops[0]?.name}</b>
    <span aria-hidden="true">⇄</span>
    <b>{stops[stops.length - 1]?.name}</b>
  </p>

  <dl class="lc__figs">
    <div>
      <dt class="label">{labels['map.lineStations']}</dt>
      <dd class="fig">{num(line.stations, locale)}</dd>
    </div>
    <div>
      <dt class="label">{labels['map.lineDrawn']}</dt>
      <dd class="fig">{num(stops.length, locale)}</dd>
    </div>
    <div>
      <dt class="label">{labels['x.km']}</dt>
      <dd class="fig">{dp(drawnKm)}</dd>
    </div>
  </dl>
  <p class="lc__note">{labels['map.lineDrawnNote']}</p>

  <div class="lc__block">
    <p class="label">{labels['map.lineRoute']}</p>
    <ol class="lroute">
      {#each stops as n, i (n.id)}
        <li>
          <button type="button" class="lroute__stop" onclick={() => onstation(n.id)}>
            <span class="lroute__dot" style={`--line:${line.colour}`}></span>
            <span class="lroute__name">{n.name}</span>
            {#if i > 0}
              <span class="lroute__km mono"
                >{dp(railKm(line.route[i - 1]!, n.id))} {labels['x.km']}</span
              >
            {/if}
          </button>
        </li>
      {/each}
    </ol>
  </div>

  {#if meets.length}
    <div class="lc__block">
      <p class="label">{labels['map.lineMeets']}</p>
      <ul class="lmeets">
        {#each meets as m (m.node.id)}
          <li>
            <button type="button" class="lmeets__at" onclick={() => onstation(m.node.id)}>
              {m.node.name}
            </button>
            <span class="lmeets__with mono">{m.others.join(' · ')}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</aside>

<style>
  .lc {
    display: flex;
    flex-direction: column;
    gap: var(--sp-snug);
    padding: var(--sp-base);
    background: var(--surface);
    border: 1px solid var(--rule-strong);
    border-top: 3px solid var(--line, var(--accent));
    border-radius: var(--frame-r);
    max-height: 78vh;
    overflow-y: auto;
  }
  .lc__top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-snug);
  }
  .lc__eyebrow {
    margin: 0;
  }
  .lc__x {
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
  .lc__x:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .lc__head {
    display: flex;
    align-items: center;
    gap: var(--sp-tight);
    flex-wrap: wrap;
  }
  .lc__ends {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: var(--sp-tight);
    margin: 0;
    font-family: var(--f-display);
    font-size: 1.05rem;
    line-height: 1.25;
  }
  .lc__ends span {
    color: var(--ink-4);
  }

  .lc__figs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--sp-snug);
    margin: 0;
    padding-top: var(--sp-snug);
    border-top: 1px solid var(--rule-soft);
  }
  .lc__figs div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .lc__figs dd {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--ink);
  }
  .lc__note {
    margin: 0;
    font-size: var(--t-micro);
    color: var(--ink-4);
  }

  .lc__block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: var(--sp-snug);
    border-top: 1px solid var(--rule-soft);
  }
  .lc__block .label {
    margin: 0;
  }

  /* The route as a strip of line, the way it is drawn on a car's door panel. */
  .lroute {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .lroute__stop {
    display: flex;
    align-items: center;
    gap: var(--sp-snug);
    width: 100%;
    padding: 6px 2px;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
    position: relative;
  }
  .lroute__stop::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--line, var(--rule));
    opacity: 0.55;
  }
  .lroute li:first-child .lroute__stop::before {
    top: 50%;
  }
  .lroute li:last-child .lroute__stop::before {
    bottom: 50%;
  }
  .lroute__dot {
    position: relative;
    z-index: 1;
    width: 11px;
    height: 11px;
    border-radius: var(--r-capsule);
    background: var(--surface);
    box-shadow: 0 0 0 2.5px var(--line, var(--ink-3));
    flex: none;
    margin-left: 1px;
  }
  .lroute__name {
    font-weight: 500;
  }
  .lroute__stop:hover .lroute__name {
    color: var(--accent);
  }
  .lroute__km {
    margin-left: auto;
    font-size: var(--t-micro);
    color: var(--ink-4);
  }

  .lmeets {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .lmeets li {
    display: flex;
    align-items: baseline;
    gap: var(--sp-tight);
    flex-wrap: wrap;
  }
  .lmeets__at {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: var(--rule-strong);
    text-underline-offset: 3px;
  }
  .lmeets__at:hover {
    color: var(--accent);
  }
  .lmeets__with {
    font-size: var(--t-micro);
    letter-spacing: 0.08em;
    color: var(--ink-3);
  }
</style>
