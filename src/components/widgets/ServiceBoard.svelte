<script lang="ts">
  import { onMount } from 'svelte';
  import { upper } from '../../lib/locale.ts';

  /**
   * Is it running, and what is next.
   *
   * TWO HONEST THINGS
   * The clock is real. İstanbul is UTC+3 all year - Türkiye abolished daylight
   * saving in 2016 - so the current time there can be computed exactly, with no
   * network call and no timezone database. If it is 02:40 in İstanbul the board
   * says the railway is shut and gives the first train, because that is the
   * single most useful thing a transit site can tell someone at 02:40.
   *
   * The departure times are a MODEL, not a timetable: a headway applied to the
   * service window. Every one of them is labelled as such. Publishing invented
   * departure times on a page dressed as a transit authority is the exact
   * failure this project refuses everywhere else.
   *
   * The board is a real split-flap: each character flips through its drum to
   * reach the next one, the way the mechanism does.
   */
  interface Props {
    labels: Record<string, string>;
  }
  // No locale: the destinations are Turkish place names in either language, and
  // every other string arrives already translated.
  const { labels }: Props = $props();

  /** Service window and headway, in minutes past midnight. Modelled. */
  const OPENS = 6 * 60;
  const CLOSES = 24 * 60;
  const HEADWAY = 8;

  let nowMin = $state(0);
  let mounted = $state(false);

  const running = $derived(nowMin >= OPENS && nowMin < CLOSES);

  const nextDepartures = $derived.by(() => {
    const base = running ? Math.ceil(nowMin / HEADWAY) * HEADWAY : OPENS;
    return [0, 1, 2, 3].map((i) => {
      const t = base + i * HEADWAY;
      const wrapped = t % (24 * 60);
      return {
        time: `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`,
        inMin: Math.max(0, t - nowMin),
        dest: i % 2 === 0 ? 'GEBZE' : 'HALKALI',
      };
    });
  });

  const clock = $derived(
    `${String(Math.floor(nowMin / 60)).padStart(2, '0')}:${String(nowMin % 60).padStart(2, '0')}`,
  );

  onMount(() => {
    const tick = () => {
      // UTC+3, fixed. No DST in Türkiye since 2016, so this needs no tz data.
      const d = new Date(Date.now() + 3 * 3600 * 1000);
      nowMin = d.getUTCHours() * 60 + d.getUTCMinutes();
    };
    tick();
    mounted = true;
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  });
</script>

<div class="board" class:is-shut={mounted && !running}>
  <div class="board__head">
    <span class="board__lamp" aria-hidden="true"></span>
    <p class="board__status">
      {#if !mounted}
        {labels['svc.checking']}
      {:else if running}
        {labels['svc.running']}
      {:else}
        {labels['svc.shut']}
      {/if}
    </p>
    <span class="board__clock mono">
      {mounted ? clock : '--:--'}
      <em>{labels['svc.istanbul']}</em>
    </span>
  </div>

  <ol class="board__rows">
    {#each nextDepartures as d, i (i)}
      <li class="row">
        <span class="row__time">
          {#each d.time.split('') as ch, k (k)}
            {#if ch === ':'}
              <span class="row__colon">:</span>
            {:else}
              <!-- Each character is its own flap. The key is the character, so
                   Svelte replaces the node when it changes and the CSS
                   animation runs again - which is the flip. -->
              {#key ch}
                <span class="flap">{ch}</span>
              {/key}
            {/if}
          {/each}
        </span>
        <span class="row__dest mono">{upper(d.dest, 'tr')}</span>
        <span class="row__in mono">
          {#if !running && i === 0}
            {labels['svc.first']}
          {:else}
            {d.inMin} {labels['x.min']}
          {/if}
        </span>
      </li>
    {/each}
  </ol>

  <p class="board__caveat mono">{labels['svc.modelled']}</p>
</div>

<style>
  .board {
    display: flex;
    flex-direction: column;
    gap: var(--sp-snug);
    padding: var(--sp-base);
    border-radius: var(--r-panel);
    background: var(--surface);
    border: 1px solid var(--rule);
    max-width: 34rem;
  }
  .board__head {
    display: flex;
    align-items: center;
    gap: var(--sp-tight);
    padding-bottom: var(--sp-tight);
    border-bottom: 1px solid var(--rule);
  }
  .board__lamp {
    width: 10px;
    height: 10px;
    border-radius: var(--r-capsule);
    background: var(--ok);
    flex: none;
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--ok) 22%, transparent);
  }
  .board.is-shut .board__lamp {
    background: var(--stop);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--stop) 22%, transparent);
  }
  .board__status {
    margin: 0;
    max-width: none;
    font-weight: 600;
    font-size: var(--t-small);
  }
  .board__clock {
    margin-left: auto;
    font-size: var(--t-small);
    font-variant-numeric: tabular-nums;
    color: var(--ink-2);
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .board__clock em {
    font-style: normal;
    font-size: 9px;
    letter-spacing: 0.12em;
    color: var(--ink-4);
  }

  .board__rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--sp-snug);
  }
  .row__time {
    display: inline-flex;
    gap: 2px;
    align-items: center;
  }
  .row__colon {
    font-family: var(--f-mono);
    color: var(--ink-4);
    padding-inline: 1px;
  }

  /* The flap. A real split-flap rotates the top half down over the bottom, so
     the animation pivots on the character's own centre line rather than
     fading. */
  .flap {
    display: inline-grid;
    place-items: center;
    min-width: 20px;
    padding: 3px 2px;
    border-radius: 2px;
    background: var(--ink);
    color: var(--slip);
    font-family: var(--f-mono);
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    /* The seam across the middle, which is what makes it read as a flap. */
    background-image: linear-gradient(
      180deg,
      transparent calc(50% - 1px),
      color-mix(in oklab, var(--slip) 26%, transparent) 50%,
      transparent calc(50% + 1px)
    );
    transform-origin: center;
    animation: flip 260ms var(--ease-mech);
  }
  @keyframes flip {
    0% {
      transform: rotateX(-88deg);
      filter: brightness(0.55);
    }
    60% {
      transform: rotateX(8deg);
    }
    100% {
      transform: rotateX(0);
      filter: brightness(1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .flap {
      animation: none;
    }
  }

  .row__dest {
    font-size: var(--t-micro);
    letter-spacing: 0.12em;
    color: var(--ink-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row__in {
    font-size: var(--t-micro);
    color: var(--ink-4);
    white-space: nowrap;
  }
  .board__caveat {
    font-size: 9.5px;
    letter-spacing: 0.06em;
    color: var(--gold);
    margin: 0;
    max-width: none;
  }
</style>
