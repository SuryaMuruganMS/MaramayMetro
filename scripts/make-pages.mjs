import { writeFileSync, mkdirSync } from 'node:fs';

/**
 * Route scaffolding.
 *
 * Every page exists twice - Türkçe at /slug/ and English at /en/slug/ - and the
 * two differ only in one constant. Hand-writing forty near-identical files is
 * how one of them quietly drifts, so they are generated from this manifest and
 * the real content lives in the component each one mounts.
 *
 * Slugs stay Turkish in both languages. A URL is an identity, and translating
 * it would give the same page two names.
 */
const PAGES = [
  { slug: 'harita', comp: 'map/MapPage', title: 'map.title', desc: 'map.lede' },
  { slug: 'sefer', comp: 'plan/PlannerPage', title: 'plan.title', desc: 'plan.lede' },
  { slug: 'ucret', comp: 'fares/FaresPage', title: 'fare.title', desc: 'fare.lede' },
  { slug: 'erisilebilirlik', comp: 'access/AccessPage', title: 'acc.title', desc: 'acc.lede' },
  { slug: 'insaat', comp: 'build/BuildPage', title: 'build.title', desc: 'build.lede' },
  { slug: 'tunel-1875', comp: 'tunel/TunelPage', title: 'tunel.title', desc: 'tunel.lede' },
  { slug: 'renkler', comp: 'colours/ColoursPage', title: 'col.title', desc: 'col.lede' },
  { slug: 'kaynaklar', comp: 'sources/SourcesPage', title: 'src.title', desc: 'src.lede' },
  { slug: 'acik-veri', comp: 'data/DataPage', title: 'data.title', desc: 'data.lede' },
];

mkdirSync('src/pages/en', { recursive: true });

const page = (p, locale) => {
  const up = locale === 'tr' ? '..' : '../..';
  return `---
import Base from '${up}/layouts/Base.astro';
import Body from '${up}/components/${p.comp}.astro';
import { translator } from '${up}/lib/i18n.ts';
import type { Locale } from '${up}/lib/locale.ts';

const locale: Locale = '${locale}';
const tt = translator(locale);
---

<Base
  locale={locale}
  path="/${p.slug}"
  title={tt('${p.title}') + ' \u2014 ' + tt('site.full')}
  description={tt('${p.desc}')}
>
  <Body locale={locale} />
</Base>
`;
};

let n = 0;
for (const p of PAGES) {
  writeFileSync(`src/pages/${p.slug}.astro`, page(p, 'tr'), 'utf8');
  writeFileSync(`src/pages/en/${p.slug}.astro`, page(p, 'en'), 'utf8');
  n += 2;
}
console.log(`  ${n} route files for ${PAGES.length} pages`);
