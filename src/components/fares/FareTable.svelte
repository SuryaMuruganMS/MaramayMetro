<script lang="ts">
  import { NODES, nodeById, lineById } from '../../data/network.ts';
  import { findRoute } from '../../lib/route.ts';
  import { fareFor, toLira, PAYING, bandFor } from '../../data/fares.ts';
  import { lira, num, type Locale } from '../../lib/locale.ts';

  /**
   * Every fare from one station, to everywhere.
   *
   * A fare is not a property of a station, it is a property of a JOURNEY — so
   * "fares for all stations" can only mean a table with an origin at the top of
   * it. Pick where you are; the table prices getting to each of the others,
   * over the same route the journey planner would send you on, because it calls
   * the same routing function.
   *
   * Rows expand rather than linking away. The interesting thing about a fare on
   * this network is that it is a SUM — a first ride at full price plus onward
   * rides down the transfer ladder — and a total that cannot be taken apart is
   * a number you have to take on trust. Open a row and the arithmetic is there.
   */
  interface Props {
    locale: Locale;
    labels: Record<string, string>;
  }
  const { locale, labels }: Props = $props();

  const sorted = $derived([...NODES].sort((a, b) => a.name.localeCompare(b.name, locale)));

  let origin = $state('yenikapi');
  let order = $state<'name' | 'distance'>('name');
  let open = $state<string | null>(null);

  interface Row {
    id: string;
    name: string;
    km: number;
    changes: number;
    /** One total per paying passenger type, in kuruş, in PAYING order. */
    totals: number[];
    legs: Array<{ line: string; km: number; kurus: number; rate: number }>;
  }

  const rows = $derived.by<Row[]>(() => {
    const out: Row[] = [];
    for (const n of NODES) {
      if (n.id === origin) continue;
      const route = findRoute(origin, n.id);
      if (!route) continue;
      const full = fareFor(route, 'full');
      out.push({
        id: n.id,
        name: n.name,
        km: route.km,
        changes: route.changes,
        totals: PAYING.map((p) => fareFor(route, p.id).kurus),
        legs: full.legs.map((l) => ({
          line: l.line,
          km: l.km,
          kurus: l.kurus,
          rate: l.rate,
        })),
      });
    }
    return order === 'name'
      ? out.sort((a, b) => a.name.localeCompare(b.name, locale))
      : out.sort((a, b) => a.km - b.km);
  });

  const money = (kurus: number) => lira(toLira(kurus), locale);
  // Fixed to one decimal, not merely capped at one: a column reading 6, 17.8,
  // 24 does not line up under tabular figures, and a distance table that does
  // not line up is harder to scan than no table.
  const km = (v: number) =>
    num(v, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const lineName = (id: string) => lineById.get(id)?.name ?? id;
  const lineColour = (id: string) => lineById.get(id)?.colour ?? 'var(--accent)';
  const originName = $derived(nodeById.get(origin)?.name ?? origin);

  const toggle = (id: string) => {
    open = open === id ? null : id;
  };
</script>

<div class="ft">
  <div class="ft__bar">
    <p class="ft__field">
      <label class="label" for="ft-origin">{labels['fare.origin']}</label>
      <select id="ft-origin" bind:value={origin}>
        {#each sorted as n (n.id)}<option value={n.id}>{n.name}</option>{/each}
      </select>
    </p>

    <!-- Two orders, because they answer different questions. Alphabetical is
         for finding a station you already have in mind; by distance is for
         watching the tariff climb, which is the only way to see that it is a
         formula and not a list of prices somebody chose one at a time. -->
    <div class="ft__order" role="group" aria-label={labels['fare.table']}>
      <button
        type="button"
        class="ft__ob"
        aria-pressed={order === 'name'}
        onclick={() => (order = 'name')}>A–Z</button
      >
      <button
        type="button"
        class="ft__ob"
        aria-pressed={order === 'distance'}
        onclick={() => (order = 'distance')}
      >
        {labels['x.km']}
      </button>
    </div>
  </div>

  <div class="tw">
    <table>
      <caption>
        {labels['fare.pickOrigin']}
        <strong>{originName}</strong> · {labels['fare.fictional']}
      </caption>
      <thead>
        <tr>
          <th scope="col" class="ft__toc">{labels['fare.to']}</th>
          <th scope="col" class="ft__nc">{labels['x.km']}</th>
          <th scope="col" class="ft__nc">{labels['fare.changesCol']}</th>
          {#each PAYING as p (p.id)}
            <th scope="col" class="ft__nc">{labels[p.key]}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as r (r.id)}
          <tr class="ft__row" class:is-open={open === r.id}>
            <th scope="row">
              <button
                type="button"
                class="ft__name"
                aria-expanded={open === r.id}
                onclick={() => toggle(r.id)}
              >
                <span class="ft__caret" aria-hidden="true"></span>
                {r.name}
              </button>
            </th>
            <td class="num">{km(r.km)}</td>
            <td class="num">{r.changes === 0 ? '—' : r.changes}</td>
            {#each r.totals as k, i (PAYING[i].id)}
              <td class="num ft__money">{money(k)}</td>
            {/each}
          </tr>
          {#if open === r.id}
            <tr class="ft__detail">
              <td colspan={3 + PAYING.length}>
                <p class="label">{labels['plan.fareBreak']}</p>
                <ol class="ft__legs">
                  {#each r.legs as l, i (i)}
                    <li>
                      <span class="roundel" style={`--line:${lineColour(l.line)}`}
                        >{lineName(l.line)}</span
                      >
                      <span class="ft__legkm mono">{km(l.km)} {labels['x.km']}</span>
                      {#if l.rate < 100}
                        <span class="ft__rate mono">{l.rate}%</span>
                      {/if}
                      <span class="ft__legfare mono">{money(l.kurus)}</span>
                    </li>
                  {/each}
                </ol>
                <p class="ft__band mono">
                  {labels['fare.band']}: {labels[bandFor(r.km).key]}
                </p>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .ft {
    display: flex;
    flex-direction: column;
    gap: var(--sp-base);
  }
  .ft__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--sp-base);
  }
  .ft__field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin: 0;
    min-width: 0;
    flex: 1 1 18rem;
    max-width: 26rem;
  }
  select {
    appearance: none;
    width: 100%;
    min-height: 46px;
    padding: 0 var(--sp-base) 0 var(--sp-snug);
    border: 1px solid var(--rule-strong);
    border-radius: var(--r-capsule);
    background: var(--surface);
    color: var(--ink);
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: 500;
    cursor: pointer;
  }
  select:hover {
    border-color: var(--accent);
  }

  .ft__order {
    display: flex;
    border: 1px solid var(--rule-strong);
    border-radius: var(--r-capsule);
    overflow: hidden;
  }
  .ft__ob {
    min-height: 46px;
    padding: 0 var(--sp-base);
    border: 0;
    background: var(--surface);
    color: var(--ink-3);
    font-family: var(--f-mono);
    font-size: var(--t-micro);
    letter-spacing: 0.1em;
    cursor: pointer;
  }
  .ft__ob + .ft__ob {
    border-inline-start: 1px solid var(--rule);
  }
  .ft__ob[aria-pressed='true'] {
    background: var(--accent);
    color: var(--ink-on-pigment);
  }

  .ft__toc {
    width: 32%;
  }
  .ft__nc {
    text-align: end;
  }
  td.num {
    text-align: end;
  }
  .ft__money {
    color: var(--ink);
    font-weight: 600;
  }

  .ft__name {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 500;
    text-align: start;
    cursor: pointer;
  }
  /* Drawn, not typed. ▸ and ▾ are missing from all three of this site's faces
     and fell back to a notdef box at 10px, which reads as a rendering fault. */
  .ft__caret {
    flex: none;
    width: 0;
    height: 0;
    border-block: 4px solid transparent;
    border-inline-start: 6px solid var(--ink-4);
    border-inline-end: 0;
    transition: transform var(--d-hover) var(--ease-out);
  }
  .ft__row.is-open .ft__caret {
    transform: rotate(90deg);
  }
  .ft__name:hover .ft__caret {
    border-inline-start-color: var(--accent);
  }
  .ft__name:hover {
    color: var(--accent);
  }
  .ft__row.is-open {
    background: color-mix(in oklab, var(--accent) 6%, transparent);
  }
  .ft__row.is-open th,
  .ft__row.is-open td {
    border-bottom-color: transparent;
  }

  .ft__detail td {
    padding-top: 0;
    background: color-mix(in oklab, var(--accent) 5%, transparent);
  }
  .ft__legs {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ft__legs li {
    display: flex;
    align-items: center;
    gap: var(--sp-snug);
  }
  .ft__legkm {
    font-size: var(--t-micro);
    color: var(--ink-3);
  }
  .ft__rate {
    font-size: var(--t-micro);
    color: var(--gold);
    letter-spacing: 0.06em;
  }
  .ft__legfare {
    margin-inline-start: auto;
    font-variant-numeric: tabular-nums;
  }
  .ft__band {
    margin: var(--sp-snug) 0 0;
    font-size: var(--t-micro);
    letter-spacing: 0.08em;
    color: var(--ink-4);
  }
</style>
