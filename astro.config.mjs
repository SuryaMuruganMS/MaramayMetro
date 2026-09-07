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
  site: 'https://marmaray.continuumstudios.co',
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
    },
  },
});
