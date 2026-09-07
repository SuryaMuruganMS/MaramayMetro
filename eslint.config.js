import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

/**
 * Deliberately small. `astro check` and `svelte-check` do the type work; this
 * catches the correctness mistakes a type checker cannot see.
 *
 * The one rule worth reading is the Turkish case-mapping ban at the bottom.
 */
const browser = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  performance: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  matchMedia: 'readonly',
  location: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  MutationObserver: 'readonly',
  CSS: 'readonly',
  Response: 'readonly',
  Request: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  HTMLElement: 'readonly',
  HTMLButtonElement: 'readonly',
  Element: 'readonly',
  innerWidth: 'readonly',
  innerHeight: 'readonly',
  scrollY: 'readonly',
  process: 'readonly',
};

export default tseslint.config(
  { ignores: ['dist/**', '.astro/**', 'node_modules/**', '.wrangler/**', 'shots/**'] },

  // The gate scripts run in Node but their audit bodies are serialised into
  // the page, so they legitimately reference browser globals.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { ...browser, getComputedStyle: 'readonly' } },
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,mts,js,mjs}'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: browser },
  },

  ...astro.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: { globals: browser },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^(_|Astro)' },
      ],
    },
  },

  ...svelte.configs.recommended,
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.svelte'] },
      globals: browser,
    },
  },

  /**
   * The dotless i.
   *
   * `'istanbul'.toUpperCase()` yields ISTANBUL, which is a misspelling in
   * Turkish - the correct form is İSTANBUL. This site puts station names through
   * a case mapper on every platform indicator and departure board, so a bare
   * call is a bug waiting to be shipped. `upper()` and `lower()` in lib/locale
   * pass the locale explicitly and are the only sanctioned route.
   */
  {
    files: ['src/**/*.{ts,astro,svelte}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='toUpperCase'][arguments.length=0]",
          message:
            'Use upper() from lib/locale. Bare toUpperCase() turns "istanbul" into ISTANBUL, not İSTANBUL.',
        },
        {
          selector: "CallExpression[callee.property.name='toLowerCase'][arguments.length=0]",
          message:
            'Use lower() from lib/locale. Bare toLowerCase() turns "I" into "i", not "ı".',
        },
      ],
    },
  },

  // The locale helpers are where the locale-aware calls actually live.
  {
    files: ['src/lib/locale.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
);
