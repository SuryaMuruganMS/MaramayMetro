# Deploying IstanMetro to Cloudflare

The site is a fully static Astro build. There is no server, no adapter and no
Worker script — Cloudflare serves the files from its edge, which costs nothing
against the request quota and has no cold start. `wrangler.jsonc` is the whole
configuration.

## From this machine

```bash
npx wrangler login     # once, opens a browser
npm run deploy         # builds, then uploads dist/
```

`npm run deploy` runs `astro build` first on purpose. Deploying a stale `dist/`
is the easiest mistake to make here and the hardest to notice, because the
deploy succeeds.

To check what would be uploaded without uploading it:

```bash
npm run deploy:dry
```

## From the Cloudflare dashboard (Git-connected)

Workers → Create → Import a repository → `SuryaMuruganMS/MaramayMetro`, then:

| Setting        | Value                     |
| -------------- | ------------------------- |
| Build command  | `npm run build`           |
| Deploy command | `npx wrangler deploy`     |
| Root directory | `/`                       |
| Node version   | `22` (read from `.nvmrc`) |

Nothing else. No build output directory — `wrangler.jsonc` already points at
`./dist`, and giving the dashboard a second, disagreeing answer is how a deploy
ends up serving an empty site.

## What is in wrangler.jsonc, and why

- **`name: "maramaymetro"`** — this decides the address. The Worker already
  exists at `https://maramaymetro.suryamuruganms40.workers.dev` and the
  Continuum portfolio links to it, so changing this name means creating a
  second Worker and updating `liveUrl` in
  `strata/src/content/work/istanmetro.md`. Do both or neither.
- **`html_handling: "auto-trailing-slash"`** — `astro.config.mjs` sets
  `trailingSlash: 'always'`, so the build emits `/harita/index.html`. Without
  this a request for `/harita` is a 404 rather than a redirect.
- **`not_found_handling: "404-page"`** — Astro builds `src/pages/404.astro` to
  `dist/404.html` and this is what serves it.

## Things that will bite

**Secrets.** There are none. This site talks to nothing.

**The world basemap.** `public/veri/dunya.json` is about 1.3 MB and is the
largest file in the build. It is well inside the 25 MiB per-asset limit, and it
is fetched only when a reader zooms the map out past the city.

**`public/_headers`.** Workers Static Assets reads it exactly as Pages did:
hashed assets for a year, HTML always revalidated, `/veri/*` served with CORS
because it is published open data.

**Check the gates before deploying.** `npm run verify` covers tests, lint,
types, contrast and budgets. `npm run check:layout` needs the built site
served first:

```bash
npm run build
npx astro preview --port 4399
node scripts/check-layout.mjs
```

It refuses to run against a dev server, and that refusal is deliberate — see
the note at the top of `scripts/check-layout.mjs`.
