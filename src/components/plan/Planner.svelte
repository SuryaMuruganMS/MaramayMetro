<script lang="ts">
  import { NODES, nodeById, lineById } from '../../data/network.ts';
  import { STOPS } from '../../data/alignment.ts';
  import { formatLevel } from '../../lib/chainage.ts';
  import { findRoute } from '../../lib/route.ts';
  import {
    fareFor,
    PASSENGERS,
    passengerById,
    toLira,
    type PassengerId,
  } from '../../data/fares.ts';
  import { lira, num, href, type Locale } from '../../lib/locale.ts';
  import NetworkMap from '../map/NetworkMap.svelte';

  /**
   * A real shortest path over the real graph, priced for the person taking it.
   *
   * The search itself lives in `lib/route.ts` — the fares page needs the same
   * answer, and two implementations of "how do you get there" would eventually
   * quote two different fares for one journey.
   *
   * What is here is the presentation, and one decision worth naming: the
   * passenger type sits in the FORM, next to from and to, not off in a settings
   * panel. Who you are changes the answer as much as where you are going, and a
   * planner that quotes one price to everybody is quoting the wrong price to
   * most people.
   */
  interface Props {
    locale: Locale;
    labels: Record<string, string>;
  }
  const { locale, labels }: Props = $props();

  // Turkish collates ç, ğ, ı, i, ö, ş, ü in its own order, so the station list
  // is sorted in the reader's locale rather than in a fixed one.
  const sorted = [...NODES].sort((a, b) => a.name.localeCompare(b.name, locale));

  let from = $state('yenikapi');
  let to = $state('uskudar');
  let passenger = $state<PassengerId>('full');

  /**
   * The map is opened, not shown.
   *
   * It opens shut once, on the argument that most people want the minutes and
   * the price without scrolling past a picture. That was wrong: a route is a
   * list of station names, and a list of station names is a route to somebody
   * who already knows the city and a column of words to everybody else. The
   * map is the answer to "where does that go", so it is on, and the button is
   * there for the reader who wants the numbers alone.
   */
  let showMap = $state(true);

  const result = $derived(findRoute(from, to));
  const fare = $derived(result ? fareFor(result, passenger) : null);
  const pass = $derived(passengerById.get(passenger) ?? PASSENGERS[0]!);

  /** The deepest station on the route, where we know a level for it. */
  const deepest = $derived.by(() => {
    if (!result) return null;
    const ids = [from, ...result.hops.map((h) => h.node)];
    let best: { name: string; level: number } | null = null;
    for (const id of ids) {
      const s = STOPS.find((x) => x.id === id);
      if (s && (best === null || s.level < best.level)) best = { name: s.name, level: s.level };
    }
    return best;
  });

  const allStepFree = $derived.by(() => {
    if (!result) return true;
    return [from, ...result.hops.map((h) => h.node)].every(
      (id) => nodeById.get(id)?.stepFree ?? true,
    );
  });

  function swap() {
    const a = from;
    from = to;
    to = a;
  }

  const lineName = (id: string) => lineById.get(id)?.name ?? id;
  const lineColour = (id: string) => lineById.get(id)?.colour ?? 'var(--accent)';
  const money = (kurus: number) => lira(toLira(kurus), locale);
  const km = (v: number) => num(v, locale, { maximumFractionDigits: 1 });
</script>

<div class="planner">
  <div class="planner__form">
    <p class="planner__field">
      <label class="label" for="pl-from">{labels['plan.from']}</label>
      <select id="pl-from" bind:value={from}>
        {#each sorted as n (n.id)}<option value={n.id}>{n.name}</option>{/each}
      </select>
    </p>

    <button class="planner__swap" type="button" onclick={swap} title={labels['plan.swap']}>
      <span class="visually-hidden">{labels['plan.swap']}</span>
      <span aria-hidden="true">⇄</span>
    </button>

    <p class="planner__field">
      <label class="label" for="pl-to">{labels['plan.to']}</label>
      <select id="pl-to" bind:value={to}>
        {#each sorted as n (n.id)}<option value={n.id}>{n.name}</option>{/each}
      </select>
    </p>

    <p class="planner__field planner__field--who">
      <label class="label" for="pl-who">{labels['plan.passenger']}</label>
      <select id="pl-who" bind:value={passenger}>
        {#each PASSENGERS as p (p.id)}<option value={p.id}>{labels[p.key]}</option>{/each}
      </select>
    </p>
  </div>

  <!-- Results update as the selects change, so there is no button to press and
       nothing to submit. A planner that makes you click "go" is making you do
       its work. -->
  <div class="planner__out" aria-live="polite">
    {#if from === to}
      <p class="planner__msg">{labels['plan.same']}</p>
    {:else if !result}
      <p class="planner__msg">{labels['plan.none']}</p>
    {:else}
      <dl class="planner__stats">
        <div>
          <dt class="label">{labels['plan.duration']}</dt>
          <dd class="mono">~{result.minutes} {labels['x.min']}</dd>
        </div>
        <div>
          <dt class="label">{labels['plan.changes']}</dt>
          <dd class="mono">{result.changes}</dd>
        </div>
        <div>
          <dt class="label">{labels['x.km']}</dt>
          <dd class="mono">{km(result.km)}</dd>
        </div>
        {#if deepest}
          <div>
            <dt class="label">{labels['plan.deepest']}</dt>
            <dd class="mono">{formatLevel(deepest.level)} · {deepest.name}</dd>
          </div>
        {/if}
      </dl>

      <!-- The fare, and how it was arrived at.

           Free passes still get the breakdown, with the full fare shown beside
           it. "Free" on its own tells a pass holder nothing about the journey;
           what they usually want to know is what it would have cost, and that
           the entitlement is an entitlement rather than a short trip. -->
      {#if fare}
        <div class="fare">
          <div class="fare__head">
            <p class="label">{labels['plan.fare']}</p>
            <p class="fare__total" class:is-free={fare.free}>
              {fare.free ? labels['fare.free'] : money(fare.kurus)}
            </p>
            <p class="fare__note mono">{labels['plan.fareNote']}</p>
          </div>

          {#if fare.free}
            <p class="fare__free">
              {labels['plan.travelsFree']}
              <span class="mono">{labels['plan.fullFare']} {money(fare.fullKurus)}</span>
            </p>
          {/if}

          <ol class="fare__legs">
            {#each fare.legs as l, i (i)}
              <li>
                <span class="roundel" style={`--line:${lineColour(l.line)}`}
                  >{lineName(l.line)}</span
                >
                <span class="fare__legkm mono">{km(l.km)} {labels['x.km']}</span>
                <span class="fare__tag mono">
                  {l.isTransfer
                    ? `${labels['fare.transfer']} · ${l.rate}%`
                    : labels['plan.firstTap']}
                </span>
                <span class="fare__legfare mono"
                  >{fare.free ? money(l.fullKurus) : money(l.kurus)}</span
                >
              </li>
            {/each}
          </ol>
          <p class="fare__band mono">
            {labels['fare.band']}: {labels[fare.band.key]} · {labels['fare.rate']}
            {pass.free ? '—' : `${pass.rate}%`}
          </p>
        </div>
      {/if}

      <!-- The route on the ground. Same geography as the map page, framed to
           this journey. -->
      <div class="planner__mapbar">
        <button
          type="button"
          class="tile tile--sm"
          class:tile--ghost={showMap}
          aria-expanded={showMap}
          onclick={() => (showMap = !showMap)}
        >
          {showMap ? labels['plan.hideMap'] : labels['plan.showMap']}
        </button>
        {#if showMap}
          <a class="planner__full" href={href('/harita', locale)}>{labels['plan.fullMap']}</a>
        {/if}
      </div>
      {#if showMap}
        <div class="planner__map">
          <NetworkMap {locale} {labels} route={result} />
        </div>
      {/if}

      <p class="planner__access" class:is-warn={!allStepFree}>
        {allStepFree ? labels['plan.stepFreeOk'] : labels['plan.stepFreeNo']}
      </p>

      <ol class="route">
        <li class="route__stop">
          <span class="route__dot" style="--line: var(--ink-3)"></span>
          <span class="route__name">{nodeById.get(from)?.name}</span>
        </li>
        {#each result.hops as h, i (i)}
          {@const changed = i === 0 || h.line !== result.hops[i - 1]!.line}
          <li class="route__stop" class:is-change={changed}>
            <span class="route__dot" style={`--line:${lineColour(h.line)}`}></span>
            <span class="route__name">{nodeById.get(h.node)?.name}</span>
            {#if changed}
              <span class="roundel" style={`--line:${lineColour(h.line)}`}
                >{lineName(h.line)}</span
              >
            {/if}
            <span class="route__min mono">{h.minutes} {labels['x.min']}</span>
          </li>
        {/each}
      </ol>

      <p class="planner__caveat mono">{labels['plan.indicative']}</p>
    {/if}
  </div>
</div>

<style>
  .planner {
    display: flex;
    flex-direction: column;
    gap: var(--sp-base);
  }
  .planner__form {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: var(--sp-snug);
    max-width: 46rem;
  }
  /* The passenger select spans the row beneath from/to rather than squeezing
     into it. It is a different kind of question and reads better as one. */
  .planner__field--who {
    grid-column: 1 / -1;
    max-width: 22rem;
  }
  .planner__field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin: 0;
    min-width: 0;
    max-width: none;
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
  .planner__swap {
    width: 46px;
    height: 46px;
    border-radius: var(--r-capsule);
    border: 1px solid var(--rule-strong);
    background: var(--surface);
    color: var(--ink-2);
    font-size: 17px;
    cursor: pointer;
    flex: none;
  }
  .planner__swap:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .planner__out {
    display: flex;
    flex-direction: column;
    gap: var(--sp-snug);
  }
  .planner__msg {
    color: var(--ink-3);
  }
  .planner__stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-roomy);
    margin: 0;
    padding: var(--sp-snug) 0;
    border-block: 1px solid var(--rule);
  }
  .planner__stats div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .planner__stats dd {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
  }
  /*
     The same map the map page draws, at a width that leaves it a map rather
     than a wall. Its frame is aspect-ratio'd off the geography, so left to run
     the full column it came out over a thousand pixels tall and the fare table
     above it scrolled away.
  */
  .planner__map {
    width: min(100%, 58rem);
    margin-inline: auto;
  }
  .planner__mapbar {
    display: flex;
    align-items: center;
    gap: var(--sp-snug);
    flex-wrap: wrap;
  }
  .planner__full {
    font-size: var(--t-small);
    color: var(--ink-3);
  }
  .planner__access {
    font-size: var(--t-small);
    color: var(--ok);
  }
  .planner__access.is-warn {
    color: var(--warn);
    font-weight: 600;
  }

  /* ------------------------------------------------------------------- fare */
  .fare {
    display: flex;
    flex-direction: column;
    gap: var(--sp-snug);
    padding: var(--sp-base);
    background: var(--surface);
    border: var(--border-hair);
    border-inline-start: 3px solid var(--gold);
    border-radius: var(--r-panel);
  }
  .fare__head {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: var(--sp-snug);
  }
  .fare__head .label {
    margin: 0;
  }
  .fare__total {
    margin: 0;
    font-family: var(--f-mono);
    font-variant-numeric: tabular-nums;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--ink);
  }
  .fare__total.is-free {
    color: var(--ok);
  }
  .fare__note {
    margin: 0;
    margin-inline-start: auto;
    font-size: var(--t-micro);
    letter-spacing: 0.08em;
    color: var(--gold);
  }
  .fare__free {
    margin: 0;
    font-size: var(--t-small);
    color: var(--ink-2);
  }
  .fare__legs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .fare__legs li {
    display: flex;
    align-items: center;
    gap: var(--sp-snug);
    flex-wrap: wrap;
  }
  .fare__legkm,
  .fare__tag {
    font-size: var(--t-micro);
    color: var(--ink-3);
  }
  .fare__tag {
    letter-spacing: 0.06em;
  }
  .fare__legfare {
    margin-inline-start: auto;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .fare__band {
    margin: 0;
    font-size: var(--t-micro);
    letter-spacing: 0.08em;
    color: var(--ink-4);
  }

  .route {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .route__stop {
    display: flex;
    align-items: center;
    gap: var(--sp-snug);
    padding: 8px 0 8px 4px;
    position: relative;
  }
  /* The line drawn between stops is the route. It is one continuous stroke, so
     a change of colour is visibly a change of train. */
  .route__stop::before {
    content: '';
    position: absolute;
    left: 9px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--line, var(--rule));
  }
  .route__stop:first-child::before {
    top: 50%;
  }
  .route__stop:last-child::before {
    bottom: 50%;
  }
  .route__dot {
    position: relative;
    z-index: 1;
    width: 12px;
    height: 12px;
    border-radius: var(--r-capsule);
    background: var(--surface);
    box-shadow: 0 0 0 2.5px var(--line, var(--ink-3));
    flex: none;
  }
  .route__stop.is-change .route__dot {
    width: 15px;
    height: 15px;
    margin-left: -1.5px;
  }
  .route__name {
    font-weight: 500;
  }
  .route__min {
    margin-left: auto;
    font-size: var(--t-micro);
    color: var(--ink-4);
  }
  .planner__caveat {
    font-size: var(--t-micro);
    letter-spacing: 0.06em;
    color: var(--gold);
  }

  @media (max-width: 620px) {
    .planner__form {
      grid-template-columns: 1fr;
    }
    .planner__swap {
      justify-self: start;
    }
  }
</style>
