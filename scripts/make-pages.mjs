import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';

/**
 * Route scaffolding.
 *
 * Every page exists four times — English at /slug/ and the rest under their
 * language tag — and the four differ only in one constant. Hand-writing forty
 * near-identical files is how one of them quietly drifts, so they are generated
 * from this manifest and the real content lives in the component each mounts.
 *
 * Slugs stay Turkish in every language. A URL is an identity, and translating
 * it would give the same page four names and four sets of inbound links.
 */
const LOCALES = ['en', 'tr', 'ar', 'ru'];
const DEFAULT = 'en';

const PAGES = [
  {
    slug: '',
    comp: 'journey/Crossing',
    title: 'site.full',
    desc: 'site.description',
    bare: true,
  },
  { slug: 'harita', comp: 'map/MapPage', title: 'map.title', desc: 'map.lede' },
  { slug: 'kazi', comp: 'dig/Dig', title: 'dig.title', desc: 'dig.lede', bare: true },
  { slug: 'sefer', comp: 'plan/PlannerPage', title: 'plan.title', desc: 'plan.lede' },
  { slug: 'ucret', comp: 'fares/FaresPage', title: 'fare.title', desc: 'fare.lede' },
  { slug: 'yolculuk', comp: 'travel/TravelPage', title: 'travel.title', desc: 'travel.lede' },
  { slug: 'erisilebilirlik', comp: 'access/AccessPage', title: 'acc.title', desc: 'acc.lede' },
  { slug: 'insaat', comp: 'build/BuildPage', title: 'build.title', desc: 'build.lede' },
  { slug: 'tunel-1875', comp: 'tunel/TunelPage', title: 'tunel.title', desc: 'tunel.lede' },
  { slug: 'renkler', comp: 'colours/ColoursPage', title: 'col.title', desc: 'col.lede' },
  { slug: 'kaynaklar', comp: 'sources/SourcesPage', title: 'src.title', desc: 'src.lede' },
  { slug: 'acik-veri', comp: 'data/DataPage', title: 'data.title', desc: 'data.lede' },
];

// Old layout: Turkish at root, English under /en/. Clear both so a stale file
// cannot survive the move and serve a page nothing generates any more.
for (const dir of ['en', 'tr', 'ar', 'ru']) {
  if (existsSync(`src/pages/${dir}`)) rmSync(`src/pages/${dir}`, { recursive: true });
}
for (const p of PAGES) {
  const f = `src/pages/${p.slug || 'index'}.astro`;
  if (existsSync(f)) rmSync(f);
}

const page = (p, locale) => {
  const atRoot = locale === DEFAULT;
  const up = atRoot ? '..' : '../..';
  const path = p.slug ? `/${p.slug}` : '/';
  return `---
import Base from '${up}/layouts/Base.astro';
import Body from '${up}/components/${p.comp}.astro';
import { translator } from '${up}/i18n/index.ts';
import type { Locale } from '${up}/lib/locale.ts';

const locale: Locale = '${locale}';
const tt = translator(locale);
---

<Base
  locale={locale}
  path="${path}"
  title={${p.slug ? `tt('${p.title}') + ' \\u2014 ' + tt('site.full')` : `tt('site.full') + ' \\u2014 ' + tt('site.tagline')`}}
  description={tt('${p.desc}')}
>
  <Body locale={locale} />
</Base>
`;
};

let n = 0;
for (const locale of LOCALES) {
  const dir = locale === DEFAULT ? 'src/pages' : `src/pages/${locale}`;
  mkdirSync(dir, { recursive: true });
  for (const p of PAGES) {
    writeFileSync(`${dir}/${p.slug || 'index'}.astro`, page(p, locale), 'utf8');
    n++;
  }
}
console.log(`  ${n} route files — ${PAGES.length} pages x ${LOCALES.length} languages`);
