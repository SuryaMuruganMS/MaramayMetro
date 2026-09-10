// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

/**
 * The Crossing - build configuration.
 *
 * Fully static. Every page is prerendered; nothing on this site reads a request.
 * A public body's website should not fall over because a Node process died, and
 * a concept build should not cost anything to keep alive.
 *
 * No map library and no tile server. The cartography is hand-drawn SVG from real
 * coordinates, which means the site makes zero third-party requests - the only
 * honest way to publish the privacy page it ships with.
 */
export default defineConfig({
  /*
     The address this site actually answers on.

     It was `https://marmaray.continuumstudios.co`, a custom domain that has
     never resolved — so every `rel="canonical"` and every `hreflang` alternate
     in Base.astro pointed at nothing. `site` is not a wish: it is what a
     crawler is told to treat as the real copy of a page, in four languages,
     across forty-nine of them. When the domain exists, change this line and
     the rest follows.
  */
  site: 'https://istanmetro.suryamuruganms40.workers.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [svelte()],

  i18n: {
    /*
     * English is the default and carries no prefix.
     *
     * It was Turkish, on the principle that a site about İstanbul should open
     * in the city's own language. In practice visitors arrived with browser
     * translation switched on and read a machine rendering of the Turkish -
     * one that turned KOT, the surveying abbreviation for elevation, into
     * "JEANS". Shipping real translations in four languages serves that reader
     * far better than a principle they never saw.
     *
     * Place names stay Turkish in every one of them.
     */
    defaultLocale: 'en',
    locales: ['en', 'tr', 'ar', 'ru'],
    routing: { prefixDefaultLocale: false },
  },

  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },

  vite: {
    build: {
      chunkSizeWarningLimit: 110,
      cssCodeSplit: true,

      /*
         esbuild, NOT the default Lightning CSS minifier.

         Lightning composes `animation-name`, `animation-timing-function`,
         `animation-fill-mode` AND `animation-timeline` into one `animation`
         shorthand. `animation-timeline` is deliberately not part of that
         shorthand — the shorthand RESETS it to `auto` — so every scroll-driven
         animation on this site came out of the build dead.

         The crossing survived it because the engine writes `--fallback-x` for
         browsers with no scroll timelines, and a reset timeline looks exactly
         like no support. The finds rail has no such fallback, so it shipped
         frozen: the panels laid out correctly, hit-testable, and never moving.
         Every screenshot of it looked plausible because a stuck rail and a
         rail at scroll position zero are the same picture.

         esbuild does not do that composition. The cost is a few hundred bytes
         of CSS, which the budget gate has room for many times over.
      */
      cssMinify: 'esbuild',
    },
  },
});
