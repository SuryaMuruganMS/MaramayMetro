<script lang="ts">
  import { onMount } from 'svelte';
  import { progressToCh, chToProgress, SCRUB_VW, TRACK_VW } from '../../lib/panels.ts';
  import {
    band,
    continent,
    depth,
    element,
    elevation,
    formatCh,
    formatLevel,
    gradient,
    medium,
    nearestStop,
    overburden,
  } from '../../lib/chainage.ts';
  import { CH_END, STOPS } from '../../data/alignment.ts';
  import { partAt, FORMATION } from '../../lib/formation.ts';

  interface Props {
    labels: Record<string, string>;
  }
  // No locale: everything here is either a number or a label passed in already
  // translated, so there is nothing for this component to localise.
  const { labels }: Props = $props();

  /**
   * The alignment engine.
   *
   * It reads scroll position and writes derived state. It never *sets* scroll
   * position except when the reader asks it to - a deep link, or a drag on the
   * section rail. Nothing here calls preventDefault, and no wheel event is
   * touched, which is what keeps both scrollbars genuinely native.
   *
   * Everything continuous - the track's translate - is done in CSS on the
   * compositor. This island only handles what CSS cannot express: a lookup
   * table, semantic state, and the numbers in the readout.
   */

  let ch = $state(0);
  let vel = $state(0);
  let planView = $state(false);
  /**
   * Whether the sticky pin is actually engaged.
   *
   * The readout and the car bar describe a position on the crossing. Above the
   * journey, on the opening screen, there is no position to describe — and
   * showing them there put a fixed panel over the hero image and claimed you
   * were in the driving cab before you had boarded.
   */
  let inJourney = $state(false);

  const lvl = $derived(elevation(ch));
  const dep = $derived(depth(ch));
  const ob = $derived(overburden(ch));
  const near = $derived(nearestStop(ch));
  const el = $derived(element(ch));
  const grad = $derived(gradient(ch));

  /**
   * The same scroll walks you through the train as well as through the tunnel:
   * leading cab at Kazlıçeşme, trailing cab at Söğütlüçeşme. The bar at the
   * bottom names where you are standing.
   */
  const where = $derived(partAt(ch));

  // Bar proportions, against the deepest overburden anywhere on the line so the
  // bar is comparable at every chainage rather than rescaling as you move.
  const OB_MAX = 62;
  const groundPct = $derived(Math.min(100, (ob.ground / OB_MAX) * 100));
  const waterPct = $derived(Math.min(100 - groundPct, (ob.water / OB_MAX) * 100));

  onMount(() => {
    const root = document.documentElement;
    const journey = document.getElementById('journey');
    const rail = document.getElementById('rail') as HTMLElement | null;
    if (!journey) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = window.matchMedia('(max-width: 1023px)');

    // Browsers without scroll timelines still get the movement, from here.
    const hasTimeline = CSS.supports('animation-timeline', 'scroll()');
    if (!hasTimeline) journey.dataset.fallback = '1';

    let railMax = 0;
    let lastRailWrite = -1;
    let railOwnsUntil = 0;
    let raf = 0;
    let lastCh = -1;
    let lastStamp = performance.now();
    let lastElement = -1;
    const elementNodes = Array.from(document.querySelectorAll<HTMLElement>('.elements__e'));
    const railWindow = document.getElementById('rail-window');
    // A screenful is 100vw of a TRACK_VW-wide track. Fixed, so it is set once.
    railWindow?.style.setProperty('--win-width', ((100 / TRACK_VW) * 100).toFixed(3));

    const isPlan = () => reduced.matches || narrow.matches || root.dataset.view === 'plan';

    function measure() {
      railMax = rail ? rail.scrollWidth - rail.clientWidth : 0;
    }

    /** Scroll progress across the sticky pin's travel. Matches `animation-range: contain`. */
    function progress(): number {
      const rect = journey!.getBoundingClientRect();
      // Engaged once the pin has reached the top and until the section leaves.
      inJourney = rect.top <= 1 && rect.bottom > window.innerHeight * 0.5;
      const scrubPx = journey!.offsetHeight - window.innerHeight;
      if (scrubPx <= 0) return 0;
      const travelled = Math.min(scrubPx, Math.max(0, -rect.top));
      return travelled / scrubPx;
    }

    function apply(t: number) {
      const next = progressToCh(t);
      const now = performance.now();
      const dt = Math.max(16, now - lastStamp);

      // Metres per second, smoothed. Drives motion blur and the variable-font
      // width axis, so a spike would read as a glitch rather than as speed.
      const raw = Math.abs(next - lastCh) / (dt / 1000);
      vel = vel * 0.82 + Math.min(4000, raw) * 0.18;
      lastStamp = now;

      ch = next;

      // Discrete state as attributes, written only on change. Writing every
      // frame would invalidate style for the whole document sixty times a
      // second for no reason.
      const b = band(next);
      const c = continent(next);
      const m = medium(next);
      if (root.dataset.band !== b) root.dataset.band = b;
      if (root.dataset.continent !== c) root.dataset.continent = c;
      if (root.dataset.medium !== m) root.dataset.medium = m;

      root.style.setProperty('--depth-t', (depth(next) / 60).toFixed(4));
      root.style.setProperty('--vel', (vel / 1200).toFixed(3));

      // The eleven precast elements. Everything behind you stays lit, the one
      // you are inside is marked. Toggled directly rather than through a custom
      // property, because CSS cannot compare :nth-child to a variable.
      const e = element(next) ?? 0;
      if (e !== lastElement) {
        lastElement = e;
        elementNodes.forEach((node, i) => {
          node.classList.toggle('is-lit', i + 1 <= e);
          node.classList.toggle('is-here', i + 1 === e);
        });
      }

      if (!hasTimeline) {
        journey!.style.setProperty(
          '--fallback-x',
          `${-t * SCRUB_VW * (window.innerWidth / 100)}px`,
        );
      }

      // The window shows which slice of the line is on screen.
      railWindow?.style.setProperty(
        '--win-left',
        (((t * SCRUB_VW) / TRACK_VW) * 100).toFixed(3),
      );

      // Mirror to the rail, unless the reader is currently dragging it.
      if (rail && railMax > 0 && now > railOwnsUntil) {
        const target = Math.round(t * railMax);
        if (Math.abs(rail.scrollLeft - target) > 1) {
          lastRailWrite = target;
          rail.scrollLeft = target;
        }
      }

      lastCh = next;
    }

    function tick() {
      raf = 0;
      if (isPlan()) return;
      apply(progress());
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    }

    /**
     * The rail is a real scroll container, so this is not hijacking: the
     * browser has already scrolled it, and we are mirroring the result onto the
     * page. The guard distinguishes the reader's scroll from our own write, so
     * the two cannot drive each other in a loop.
     */
    function onRailScroll() {
      if (!rail || railMax <= 0 || isPlan()) return;
      if (Math.abs(rail.scrollLeft - lastRailWrite) <= 1) return; // our own write
      railOwnsUntil = performance.now() + 140;
      const t = rail.scrollLeft / railMax;
      const scrubPx = journey!.offsetHeight - window.innerHeight;
      const top = journey!.offsetTop + t * scrubPx;
      window.scrollTo({ top, behavior: 'instant' });
    }

    /** ?ch=6700 or #istasyon-uskudar, restored before the first frame is drawn. */
    function restoreDeepLink() {
      const params = new URLSearchParams(location.search);
      const raw = params.get('ch');
      if (raw === null) return;
      const want = Math.min(CH_END, Math.max(0, Number(raw)));
      if (!Number.isFinite(want)) return;
      const scrubPx = journey!.offsetHeight - window.innerHeight;
      if (scrubPx <= 0) return;
      // Native, synchronous, before anything reads scroll position. A smooth
      // scroll here would animate from the top and land late.
      window.scrollTo({
        top: journey!.offsetTop + chToProgress(want) * scrubPx,
        behavior: 'instant',
      });
    }

    /**
     * Somebody pressed a station.
     *
     * The rail dispatches a chainage and this is the only place that knows what
     * a chainage means in scroll pixels. Smooth, because this one IS a
     * navigation the reader asked for and watching the train run there is the
     * point — unlike the deep-link restore, which has to be instant or the page
     * opens at the wrong place and then slides.
     */
    function onGoto(e: Event) {
      const ch = (e as CustomEvent<{ ch: number }>).detail?.ch;
      if (!Number.isFinite(ch)) return;
      const want = Math.min(CH_END, Math.max(0, ch));
      if (isPlan()) {
        // No horizontal track to travel: go to the station's own panel.
        const el = document.getElementById(`istasyon-${nearestStopId(want)}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const scrubPx = journey!.offsetHeight - window.innerHeight;
      if (scrubPx <= 0) return;
      window.scrollTo({
        top: journey!.offsetTop + chToProgress(want) * scrubPx,
        behavior: 'smooth',
      });
    }

    /** The stop a chainage belongs to, for the vertical fallback. */
    function nearestStopId(ch: number): string {
      let best = STOPS[0]!;
      for (const s of STOPS) if (Math.abs(s.ch - ch) < Math.abs(best.ch - ch)) best = s;
      return best.id;
    }

    function syncPlanFlag() {
      planView = isPlan();
      if (planView) {
        // Leaving the horizontal world: clear anything that only makes sense
        // inside it, so the linear page is not styled by a stale depth.
        root.dataset.band = 'surface';
        root.style.setProperty('--vel', '0');
      } else {
        measure();
        apply(progress());
      }
    }

    window.addEventListener('crossing:goto', onGoto);

    measure();
    restoreDeepLink();
    // First paint is synchronous. A background tab issues no frames, so waiting
    // for rAF here would leave a deep link showing the wrong world until the
    // reader came back to it.
    apply(progress());
    syncPlanFlag();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      syncPlanFlag();
    });
    rail?.addEventListener('scroll', onRailScroll, { passive: true });
    reduced.addEventListener('change', syncPlanFlag);
    narrow.addEventListener('change', syncPlanFlag);

    const observer = new MutationObserver(syncPlanFlag);
    observer.observe(root, { attributeFilter: ['data-view'] });

    return () => {
      window.removeEventListener('scroll', onScroll);
      rail?.removeEventListener('scroll', onRailScroll);
      reduced.removeEventListener('change', syncPlanFlag);
      narrow.removeEventListener('change', syncPlanFlag);
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  });
</script>

{#if !planView && inJourney}
  <!--
    A live region would announce on every frame, which is unusable. The readout
    is decorative duplication of information that is also in the panel headings,
    so it is hidden from assistive technology and the headings carry the meaning.
  -->
  <aside class="readout" aria-hidden="true">
    <div class="readout__row">
      <span class="readout__k">{labels.chainage}</span>
      <span class="readout__v">{formatCh(ch)}</span>
    </div>
    <div class="readout__row">
      <span class="readout__k">{labels.level}</span>
      <span class="readout__v" class:readout__v--deep={dep > 40}>{formatLevel(lvl)}</span>
    </div>
    <div class="readout__row">
      <span class="readout__k">{labels.grade}</span>
      <span class="readout__v">{grad >= 0 ? '+' : '−'}{Math.abs(grad).toFixed(1)}%</span>
    </div>
    {#if el !== null}
      <div class="readout__row">
        <span class="readout__k">{labels.element}</span>
        <span class="readout__v">{el} / 11</span>
      </div>
    {/if}
    <div class="readout__row">
      <span class="readout__k">{labels.overhead}</span>
      <span class="readout__v">{Math.round(ob.total)} m</span>
    </div>
    <div class="readout__bar">
      <span class="readout__ground" style="width:{groundPct}%"></span>
      <span class="readout__water" style="width:{waterPct}%"></span>
    </div>
    <div class="readout__row" style="margin-top:5px">
      <span class="readout__k">{near.stop.name}</span>
      <span class="readout__v">{Math.abs(Math.round(near.delta))} m</span>
    </div>
  </aside>

  <!--
    Which part of the train you are in, live.

    Hidden from assistive technology: it duplicates nothing a screen reader
    needs and would announce on every frame. It is atmosphere for people
    watching the film, and the panel headings carry the actual content.
  -->
  <aside class="carbar" aria-hidden="true">
    <span class="carbar__k">{labels.car}</span>
    <span class="carbar__v">{labels[where.part.key] ?? where.part.key}</span>
    <span class="carbar__form">
      {#each FORMATION as p, i (i)}
        <span
          class="carbar__seg"
          class:is-here={i === where.index}
          class:is-cab={p.id === 'cab'}
          style={`--w:${p.weight}`}
        ></span>
      {/each}
    </span>
    <span class="carbar__car mono">{where.part.car} / 5</span>
  </aside>
{/if}

<style>
  /* Layout for these lives in journey.css so the plan-view overrides can reach
     it from one place; only the pieces that are genuinely local sit here. */
  .readout__ground,
  .readout__water {
    display: block;
    height: 100%;
  }
</style>
