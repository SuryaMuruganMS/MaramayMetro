<script lang="ts">
  import { onMount } from 'svelte';
  import { LAYERS, DIG_DEPTH } from '../../data/strata.ts';
  import { num, type Locale } from '../../lib/locale.ts';

  /**
   * The depth-and-time readout for the dig.
   *
   * Same discipline as the alignment engine: read scroll, derive everything,
   * never intercept. The only difference is what the axis means. Here metres
   * down and years back are the same movement, which is true of this ground and
   * of almost nowhere else.
   */
  interface Props {
    locale: Locale;
    labels: { depth: string; year: string };
  }
  const { locale, labels }: Props = $props();

  let metres = $state(0);
  let visible = $state(false);

  /** Interpolate the calendar from the layer boundaries the ground actually has. */
  function yearAt(m: number): number {
    for (const l of LAYERS) {
      const [d0, d1] = l.depthM;
      if (m >= d0 && m <= d1) {
        const t = d1 === d0 ? 0 : (m - d0) / (d1 - d0);
        // Layers are listed newest first, so deeper is earlier.
        return l.years[1] + (l.years[0] - l.years[1]) * t;
      }
    }
    return LAYERS[LAYERS.length - 1]!.years[0];
  }

  const year = $derived(Math.round(yearAt(metres)));
  const layer = $derived(
    LAYERS.find((l) => metres >= l.depthM[0] && metres <= l.depthM[1]) ?? LAYERS[0]!,
  );
  const layerName = $derived(locale === 'tr' ? layer.tr.name : layer.en.name);

  const shownYear = $derived(
    year < 0
      ? locale === 'tr'
        ? `MÖ ${num(Math.abs(year), locale)}`
        : `${num(Math.abs(year), locale)} BCE`
      : num(year, locale),
  );

  onMount(() => {
    const section = document.getElementById('dig');
    if (!section) return;
    let raf = 0;

    function read() {
      raf = 0;
      const r = section!.getBoundingClientRect();
      const mid = window.innerHeight * 0.42;
      // Where the reading line crosses the section, as a fraction of its height.
      const t = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      metres = t * DIG_DEPTH;
      // On screen exactly while the reading line is inside the section. Any
      // looser test leaves the readout sitting on top of whatever follows the
      // dig, which is what a bottom-edge test did.
      visible = r.top < mid && r.bottom > mid;
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(read);
    }

    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  });
</script>

<aside class="digax" class:is-on={visible} aria-hidden="true">
  <div class="digax__row">
    <span class="digax__k">{labels.depth}</span>
    <span class="digax__v">{metres.toFixed(1)} m</span>
  </div>
  <div class="digax__row">
    <span class="digax__k">{labels.year}</span>
    <span class="digax__v digax__v--year">{shownYear}</span>
  </div>
  <p class="digax__layer">{layerName}</p>
</aside>

<style>
  .digax {
    position: fixed;
    right: var(--margin);
    top: calc(var(--head-h) + var(--sp-snug));
    z-index: 55;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 178px;
    padding: 11px 14px;
    border-radius: var(--r-panel);
    background: color-mix(in oklab, var(--surface) 90%, transparent);
    border: 1px solid var(--rule);
    backdrop-filter: blur(8px);
    font-family: var(--f-mono);
    font-variant-numeric: tabular-nums;
    font-size: var(--t-micro);
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--d-ui) var(--ease-out);
  }
  .digax.is-on {
    opacity: 1;
  }
  .digax__row {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-snug);
  }
  .digax__k {
    color: var(--ink-4);
    letter-spacing: 0.1em;
  }
  .digax__v {
    color: var(--ink);
    font-weight: 500;
  }
  .digax__v--year {
    color: var(--gold);
  }
  .digax__layer {
    margin-top: 5px;
    padding-top: 5px;
    border-top: 1px solid var(--rule-soft);
    font-family: var(--f-display);
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-2);
    max-width: none;
  }
  @media (max-width: 900px) {
    .digax {
      display: none;
    }
  }
</style>
