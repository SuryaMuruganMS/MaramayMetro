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

/**
 * The three lines of a field record.
 *
 * A section drawing is never just a coloured band with a date on it. Every
 * layer on a real one carries the same three notes, in the same order, because
 * they are the three things an excavator has to write down before they cut into
 * it: what the ground is made of, what it holds, and how it was reached.
 *
 * They exist here for a second reason as well. The bands are sized to real
 * excavated depth, so the thick ones ran a screen deep with four lines of text
 * in them and the rest was empty ground. Filling that with decoration would
 * have been the easy answer; filling it with the rest of the record is the
 * honest one.
 */
export interface LayerCopy {
  name: string;
  period: string;
  body: string;
  /** What the ground physically is at this level. */
  matrix: string;
  /** What was recovered from it. */
  holds: string;
  /** How the excavation got through it. */
  method: string;
}

export interface Layer {
  id: string;
  /** Metres below present ground level. Indicative. */
  depthM: [number, number];
  /** Calendar range, for the axis. Negative is BCE. */
  years: [number, number];
  tr: LayerCopy;
  en: LayerCopy;
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
      matrix: 'Asfalt, mıcır ve moloz dolgu. Çalışan bir şehrin defalarca altüst ettiği zemin.',
      holds:
        'Yirminci yüzyıl altyapısı: su, gaz ve kablo hatları. Bu banttan arkeolojik bir beklenti yok.',
      method: 'Makineyle kazı, arkeolojik gözetim altında.',
    },
    en: {
      name: 'Today',
      period: '1923 – 2026',
      body: 'Asphalt, services and made ground. Where the excavation began, and the level the station sits at now.',
      matrix:
        'Asphalt, ballast and rubble fill — the ground of a working city, turned over and put back many times.',
      holds:
        'Twentieth-century services: water, gas and cable runs. Nothing archaeological is expected at this level.',
      method: 'Machine excavation under an archaeological watching brief.',
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
      matrix:
        'Bostan toprağı ve yapı molozu; dolmuş liman havzasının üzerine serilmiş kuru zemin.',
      holds:
        'Ev temelleri, sarnıçlar, kuyular, sırlı kap kacak ve lüle parçaları. Bir mahallenin gündelik döküntüsü.',
      method: 'Duvarlar çıktığı anda makine bırakıldı; el kazısına geçildi.',
    },
    en: {
      name: 'Ottoman',
      period: '1453 – 1922',
      body: 'By now the harbour has silted up entirely and been built over as market gardens and housing. From this layer up, the shoreline is no longer where the sea is.',
      matrix:
        'Garden soil and building rubble — dry ground laid over the filled basin of the harbour.',
      holds:
        'House foundations, cisterns and wells, glazed tableware and pipe bowls. The ordinary refuse of a neighbourhood.',
      method: 'Machine excavation stopped as soon as walls appeared; hand-dug from there.',
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
      matrix:
        'İnce, koyu, suya doymuş liman çamuru. Lykos deresinin yüzyıllar boyunca havzaya taşıdığı alüvyon — limanı önce sığlaştıran, sonra da içindeki her şeyi koruyan malzeme.',
      holds:
        'Otuz yedi tekne, ahşap iskeleler ve rıhtım duvarları, çapalar, halat, deri, amfora ve sekiz yüzyıllık yükleme boşaltma artığı.',
      method:
        'Islak kazı. Açığa çıkan ahşap, çıktığı andan itibaren sürekli ıslak tutuldu; kayıt yerinde alındı.',
    },
    en: {
      name: 'The Theodosian Harbour',
      period: '4th – 12th century',
      body: 'The heart of the excavation. Constantinople’s grain harbour: jetties, quay structures, and thirty-seven vessels found sunk where they settled. Most of the finds come from this band.',
      matrix:
        'Fine, dark, waterlogged harbour silt — carried into the basin by the Lykos stream season after season. The same material that shoaled the harbour is the reason everything in it survived.',
      holds:
        'Thirty-seven vessels, timber jetties and quay walls, anchors, rope, leather, amphorae, and eight centuries of loading and unloading.',
      method:
        'Excavated wet and recorded in place. Exposed timber was kept saturated from the moment it came out of the mud.',
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
      matrix: 'Deniz kumu ve kavkı bantları. Liman kazılmadan önceki doğal koyun tabanı.',
      holds:
        'Yapı yok denecek kadar az. Dağınık seramik ve su kıyısındaki ilk kullanım izleri.',
      method:
        'Bu kottan aşağısı sürekli su altında. Kazı boyunca kesintisiz susuzlaştırma yapıldı.',
    },
    en: {
      name: 'Pre-harbour shore',
      period: '2nd c. BCE – 4th c. CE',
      body: 'The natural inlet before the harbour was cut into it. Seabed sediments and the first traces of use along the shore.',
      matrix:
        'Marine sand and shell beds — the floor of the natural inlet, before anyone made a harbour out of it.',
      holds:
        'Almost nothing built. Scattered pottery and the earliest traces of use along the water’s edge.',
      method:
        'Everything below this level is under the water table. The trench was pumped continuously from here down.',
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
      matrix:
        'Koyu, organik, hava almayan kil. Ahşabın, hasırın ve çamura basılmış ayak izlerinin bugüne kalmasının tek sebebi bu.',
      holds:
        'Eski çamur yüzeyine basılmış insan ve hayvan ayak izleri, ahşap yapı kalıntıları, mezarlar ve bir kıyı yerleşiminin çanak çömleği.',
      method: 'Kesintisiz pompaj altında, kazının en dibinde, tamamen el aletiyle.',
    },
    en: {
      name: 'Neolithic shore',
      period: 'about 6500 BCE',
      body: 'The base of the excavation. A shoreline occupied when the sea stood lower than it does now: footprints, timber structures and burials. It moved the known history of İstanbul back by thousands of years.',
      matrix:
        'Dark organic clay, sealed and airless. It is the only reason wood, matting and a footprint pressed into mud are still here to find.',
      holds:
        'Human and animal footprints in the old mud surface, timber structures, burials, and the pottery of a settlement thousands of years older than any city on this site.',
      method: 'Hand tools only, at the floor of the trench, under continuous pumping.',
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
