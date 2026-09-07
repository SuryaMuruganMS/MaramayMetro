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
    // Türkçe is the default and carries no prefix; English sits under /en/.
    // A transit site in İstanbul that defaults to English would be telling on
    // itself about who it thinks the user is.
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
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
