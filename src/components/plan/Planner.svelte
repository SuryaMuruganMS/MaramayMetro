<script lang="ts">
  import { GRAPH, NODES, nodeById, lineById } from '../../data/network.ts';
  import { STOPS } from '../../data/alignment.ts';
  import { formatLevel } from '../../lib/chainage.ts';
  import type { Locale } from '../../lib/locale.ts';

  /**
   * A real shortest path over the real graph.
   *
   * Dijkstra, with an interchange penalty - because changing trains costs a
   * passenger far more than the four minutes a timetable admits to, and a
   * planner that ignores it will happily route you through three changes to
   * save two minutes. Five minutes per change is the usual working figure.
   *
   * It reports the deepest point on the route, which no other planner does and
   * this one can, because the alignment data is right there.
   */
  interface Props {
    locale: Locale;
    labels: Record<string, string>;
  }
  const { locale, labels }: Props = $props();

  const CHANGE_PENALTY = 5;

  // Turkish collates ç, ğ, ı, i, ö, ş, ü in its own order, so the station list
  // is sorted in the reader's locale rather than in a fixed one.
  const sorted = [...NODES].sort((a, b) => a.name.localeCompare(b.name, locale));

  let from = $state('yenikapi');
  let to = $state('uskudar');

  interface Hop {
    node: string;
    line: string;
    minutes: number;
  }

  function plan(a: string, b: string): { hops: Hop[]; minutes: number } | null {
    if (a === b) return null;
    // State is (node, arriving-line), so a change can be priced.
    const key = (n: string, l: string) => `${n}|${l}`;
    /* eslint-disable svelte/prefer-svelte-reactivity --
       These are local scratch inside a pure function, not reactive state.
       A SvelteMap here would add proxy overhead to a hot search loop for a
       reactivity nobody reads. */
    const dist = new Map<string, number>();
    const prev = new Map<string, { k: string; hop: Hop }>();
    /* eslint-enable svelte/prefer-svelte-reactivity */
    const start = key(a, '');
    dist.set(start, 0);
    const queue: Array<{ k: string; node: string; line: string; d: number }> = [
      { k: start, node: a, line: '', d: 0 },
    ];

    let bestEnd: string | null = null;
    let bestD = Infinity;

    while (queue.length) {
      queue.sort((x, y) => x.d - y.d);
      const cur = queue.shift()!;
      if (cur.d > (dist.get(cur.k) ?? Infinity)) continue;
      if (cur.node === b && cur.d < bestD) {
        bestD = cur.d;
        bestEnd = cur.k;
        continue;
      }
      for (const e of GRAPH.get(cur.node) ?? []) {
        const change = cur.line !== '' && e.line !== cur.line ? CHANGE_PENALTY : 0;
        const nd = cur.d + e.minutes + change;
        const nk = key(e.to, e.line);
        if (nd < (dist.get(nk) ?? Infinity)) {
          dist.set(nk, nd);
          prev.set(nk, { k: cur.k, hop: { node: e.to, line: e.line, minutes: e.minutes } });
          queue.push({ k: nk, node: e.to, line: e.line, d: nd });
        }
      }
    }

    if (!bestEnd) return null;
    // Walk the predecessor chain back to the start. The annotation on `step` is
    // required: without it TypeScript infers its type from `k`, which is being
    // assigned from `step` on the next line, and gives up with a circularity.
    const hops: Hop[] = [];
    let k: string | undefined = bestEnd;
    while (k !== undefined && prev.has(k)) {
      const step: { k: string; hop: Hop } = prev.get(k)!;
      hops.unshift(step.hop);
      k = step.k;
    }
    return { hops, minutes: bestD };
  }

  const result = $derived(plan(from, to));

  const changes = $derived(
    result
      ? result.hops.reduce(
          (n, h, i) => (i > 0 && h.line !== result.hops[i - 1]!.line ? n + 1 : n),
          0,
        )
      : 0,
  );

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
          <dd class="mono">{changes}</dd>
        </div>
        {#if deepest}
          <div>
            <dt class="label">{labels['plan.deepest']}</dt>
            <dd class="mono">{formatLevel(deepest.level)} · {deepest.name}</dd>
          </div>
        {/if}
      </dl>

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
  .planner__access {
    font-size: var(--t-small);
    color: var(--ok);
  }
  .planner__access.is-warn {
    color: var(--warn);
    font-weight: 600;
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
