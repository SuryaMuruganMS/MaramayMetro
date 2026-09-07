<script lang="ts">
  import { TUNEL } from '../../data/alignment.ts';
  import type { Locale } from '../../lib/locale.ts';

  /**
   * The Tünel, in real time.
   *
   * Five hundred and seventy-three metres in ninety seconds, opened in 1875 and
   * still running. The one thing this page can do that a paragraph cannot is
   * make you sit through it: the counter is not sped up, and ninety seconds is
   * genuinely ninety seconds.
   *
   * That is a deliberate demand on the reader's patience, so it never
   * autoplays, it can be stopped at any point, and the page is complete without
   * it having been run at all.
   */
  interface Props {
    locale: Locale;
    labels: Record<string, string>;
  }
  const { locale, labels }: Props = $props();

  const DURATION = TUNEL.seconds.value;
  const LENGTH = TUNEL.lengthM.value;

  let elapsed = $state(0);
  let running = $state(false);
  let raf = 0;
  let startedAt = 0;
  let baseline = 0;

  const t = $derived(Math.min(1, elapsed / DURATION));
  const metres = $derived(Math.round(t * LENGTH));
  const remaining = $derived(Math.max(0, DURATION - elapsed));

  function frame(now: number) {
    elapsed = baseline + (now - startedAt) / 1000;
    if (elapsed >= DURATION) {
      elapsed = DURATION;
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function toggle() {
    if (running) {
      running = false;
      cancelAnimationFrame(raf);
      return;
    }
    if (elapsed >= DURATION) elapsed = 0;
    baseline = elapsed;
    startedAt = performance.now();
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function reset() {
    running = false;
    cancelAnimationFrame(raf);
    elapsed = 0;
  }

  const mmss = (s: number) => {
    const whole = Math.ceil(s);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  };
</script>

<div class="tunel">
  <!-- The incline, drawn to the real gradient: 573 m of run for about 60 m of
       rise between the Golden Horn and Pera. -->
  <div class="tunel__shaft">
    <div class="tunel__slope" aria-hidden="true"></div>
    <div class="tunel__car" style={`--t:${t}`} aria-hidden="true">
      <span class="tunel__body"></span>
    </div>
    <span class="tunel__end tunel__end--low mono">{labels['tunel.karakoy']}</span>
    <span class="tunel__end tunel__end--high mono">{labels['tunel.beyoglu']}</span>
  </div>

  <div class="tunel__ctl">
    <button class="tile" type="button" onclick={toggle}>
      {running ? labels['tunel.stop'] : labels['tunel.run']}
    </button>
    <button class="tile tile--ghost" type="button" onclick={reset} disabled={elapsed === 0}>
      {labels['tunel.reset']}
    </button>

    <dl class="tunel__read mono" aria-live="off">
      <div>
        <dt>{locale === 'tr' ? 'KALAN' : 'REMAINING'}</dt>
        <dd>{mmss(remaining)}</dd>
      </div>
      <div>
        <dt>{locale === 'tr' ? 'MESAFE' : 'DISTANCE'}</dt>
        <dd>{metres} m</dd>
      </div>
      <div>
        <dt>{locale === 'tr' ? 'YIL' : 'YEAR'}</dt>
        <dd>{TUNEL.opened.value}</dd>
      </div>
    </dl>
  </div>

  {#if elapsed >= DURATION}
    <p class="tunel__done">
      {locale === 'tr'
        ? 'Vardınız. 1875’ten beri aynı doksan saniye.'
        : 'Arrived. The same ninety seconds since 1875.'}
    </p>
  {/if}
</div>

<style>
  .tunel {
    display: flex;
    flex-direction: column;
    gap: var(--sp-base);
  }
  .tunel__shaft {
    position: relative;
    height: 190px;
    border: 1px solid var(--rule);
    border-radius: var(--r-panel);
    background: var(--surface);
    overflow: hidden;
  }
  /* The bore. A single 45-degree-ish stroke, because the real thing is a
     straight inclined shaft, not a curve. */
  .tunel__slope {
    position: absolute;
    left: 6%;
    right: 6%;
    bottom: 26%;
    height: 3px;
    background: var(--line-f2, var(--cobalt));
    transform-origin: left center;
    rotate: -11deg;
    border-radius: 2px;
    opacity: 0.6;
  }
  .tunel__car {
    position: absolute;
    left: calc(6% + (88% * var(--t)));
    bottom: calc(26% + (17% * var(--t)));
    translate: -50% 0;
    /* No CSS transition: the position is driven per frame from the real clock,
       so easing it would put the car somewhere the clock is not. */
  }
  .tunel__body {
    display: block;
    width: 34px;
    height: 17px;
    border-radius: 4px 4px 3px 3px;
    background: var(--accent);
    box-shadow: inset 0 2px 0 rgb(255 255 255 / 0.28);
    rotate: -11deg;
  }
  .tunel__end {
    position: absolute;
    font-size: var(--t-micro);
    letter-spacing: 0.1em;
    color: var(--ink-3);
  }
  .tunel__end--low {
    left: 5%;
    bottom: 14%;
  }
  .tunel__end--high {
    right: 5%;
    top: 22%;
  }

  .tunel__ctl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-snug);
  }
  .tunel__ctl button[disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .tunel__read {
    display: flex;
    gap: var(--sp-base);
    margin: 0 0 0 auto;
  }
  .tunel__read div {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .tunel__read dt {
    font-size: 9px;
    letter-spacing: 0.14em;
    color: var(--ink-4);
  }
  .tunel__read dd {
    margin: 0;
    font-size: var(--t-body);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .tunel__done {
    font-size: var(--t-small);
    color: var(--ok);
    font-weight: 600;
  }
  @media (max-width: 620px) {
    .tunel__read {
      margin-left: 0;
    }
  }
</style>
