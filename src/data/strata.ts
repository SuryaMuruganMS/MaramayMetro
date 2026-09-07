import type { Locale } from '../lib/locale.ts';

/**
 * The Yenikapı section.
 *
 * Excavating this station uncovered the Theodosian Harbour of Constantinople.
 * The published record establishes the headline facts - thirty-seven Byzantine
 * hulls, roughly a hundred thousand artefacts, a Neolithic horizon at the base,
 * and a delay to the railway of about four years.
 *
 * WHAT IS AND IS NOT CLAIMED HERE
 * The layers, their order and their broad date ranges are real. The exact depth
 * of each boundary in metres is a reading of published section drawings, not a
 * survey, so `depthM` is indicative throughout and the interface says so. Where
 * a specific vessel's cargo or dimensions could not be sourced, the entry says
 * "not established" rather than filling the gap with something plausible.
 *
 * Human remains were recovered here. They are named as a fact of the record and
 * nothing more - no imagery, no dramatisation. A public body would not do
 * otherwise and neither should a concept of one.
 */

export interface Layer {
  id: string;
  /** Metres below present ground level. Indicative. */
  depthM: [number, number];
  /** Calendar range, for the axis. Negative is BCE. */
  years: [number, number];
  tr: { name: string; period: string; body: string };
  en: { name: string; period: string; body: string };
  /** Which depth tint this layer paints with. */
  tone: 'fill' | 'ottoman' | 'byzantine' | 'roman' | 'neolithic';
}

export const LAYERS: Layer[] = [
  {
    id: 'modern',
    depthM: [0, 3],
    years: [1923, 2026],
    tone: 'fill',
    tr: {
      name: 'Bugün',
      period: '1923 – 2026',
      body: 'Asfalt, altyapı ve dolgu. Kazının başladığı yer; istasyonun bugün bulunduğu kot.',
    },
    en: {
      name: 'Today',
      period: '1923 – 2026',
      body: 'Asphalt, services and made ground. Where the excavation began, and the level the station sits at now.',
    },
  },
  {
    id: 'ottoman',
    depthM: [3, 7],
    years: [1453, 1922],
    tone: 'ottoman',
    tr: {
      name: 'Osmanlı',
      period: '1453 – 1922',
      body: 'Limanın çoktan dolduğu, üzerinin bostan ve mahalleye dönüştüğü dönem. Kıyı çizgisi buradan itibaren artık denizde değil.',
    },
    en: {
      name: 'Ottoman',
      period: '1453 – 1922',
      body: 'By now the harbour has silted up entirely and been built over as market gardens and housing. From this layer up, the shoreline is no longer where the sea is.',
    },
  },
  {
    id: 'byzantine',
    depthM: [7, 13],
    years: [400, 1200],
    tone: 'byzantine',
    tr: {
      name: 'Theodosius Limanı',
      period: '4. – 12. yüzyıl',
      body: 'Kazının kalbi. Konstantinopolis’in tahıl limanı: iskeleler, rıhtım yapıları ve tabanda batmış hâlde bulunan otuz yedi gemi. Buluntuların çoğu bu bantta.',
    },
    en: {
      name: 'The Theodosian Harbour',
      period: '4th – 12th century',
      body: 'The heart of the excavation. Constantinople’s grain harbour: jetties, quay structures, and thirty-seven vessels found sunk where they settled. Most of the finds come from this band.',
    },
  },
  {
    id: 'roman',
    depthM: [13, 17],
    years: [-200, 400],
    tone: 'roman',
    tr: {
      name: 'Roma öncesi kıyı',
      period: 'MÖ 2. yy – MS 4. yy',
      body: 'Limandan önceki doğal koy. Deniz tabanı çökelleri ve kıyı kullanımının ilk izleri.',
    },
    en: {
      name: 'Pre-harbour shore',
      period: '2nd c. BCE – 4th c. CE',
      body: 'The natural inlet before the harbour was cut into it. Seabed sediments and the first traces of use along the shore.',
    },
  },
  {
    id: 'neolithic',
    depthM: [17, 22],
    years: [-6500, -5500],
    tone: 'neolithic',
    tr: {
      name: 'Neolitik kıyı',
      period: 'yaklaşık MÖ 6500',
      body: 'Kazının tabanı. Deniz seviyesi bugünkünden alçakken yerleşilmiş bir kıyı: ayak izleri, ahşap yapı kalıntıları ve mezarlar. İstanbul’un bilinen tarihini binlerce yıl geriye taşıdı.',
    },
    en: {
      name: 'Neolithic shore',
      period: 'about 6500 BCE',
      body: 'The base of the excavation. A shoreline occupied when the sea stood lower than it does now: footprints, timber structures and burials. It moved the known history of İstanbul back by thousands of years.',
    },
  },
];

/**
 * The hulls.
 *
 * Thirty-seven were recovered. A representative selection is catalogued here;
 * the rest are counted but not individually described, because inventing
 * thirty-seven distinct cargo manifests would be exactly the kind of plausible
 * fiction this site refuses elsewhere.
 */
export interface Hull {
  ref: string;
  /** Fraction of the way down the Byzantine band, 0-1. */
  at: number;
  century: string;
  tr: { type: string; note: string };
  en: { type: string; note: string };
}

export const HULLS: Hull[] = [
  {
    ref: 'YK 11',
    at: 0.22,
    century: '9.',
    tr: {
      type: 'Yuvarlak yük gemisi',
      note: 'Yelkenli ticaret teknesi; gövdenin büyük bölümü korunmuş.',
    },
    en: {
      type: 'Round-hulled merchantman',
      note: 'A sailing trader; much of the hull survived intact.',
    },
  },
  {
    ref: 'YK 14',
    at: 0.38,
    century: '9.',
    tr: {
      type: 'Kürekli galea',
      note: 'Bizans donanmasına ait uzun tekne tipi; bu türün ilk örneklerinden.',
    },
    en: {
      type: 'Oared galea',
      note: 'A long naval type. Among the first examples of it ever excavated.',
    },
  },
  {
    ref: 'YK 23',
    at: 0.55,
    century: '7.',
    tr: { type: 'Küçük yük teknesi', note: 'Amfora yüküyle birlikte bulundu.' },
    en: { type: 'Small cargo boat', note: 'Found with its amphora cargo still aboard.' },
  },
  {
    ref: 'YK 31',
    at: 0.71,
    century: '10.–11.',
    tr: { type: 'Kıyı teknesi', note: 'Yükü belirlenemedi.' },
    en: { type: 'Coastal craft', note: 'Cargo not established.' },
  },
];

export const digCopy = (locale: Locale) => ({
  layerOf: (l: Layer) => (locale === 'tr' ? l.tr : l.en),
  hullOf: (h: Hull) => (locale === 'tr' ? h.tr : h.en),
});

/** Total depth of the section, for scaling the axis. */
export const DIG_DEPTH = LAYERS[LAYERS.length - 1]!.depthM[1];
