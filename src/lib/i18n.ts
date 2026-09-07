import type { Locale } from './locale.ts';
import { pagesEn, pagesTr } from './i18n-pages.ts';

/**
 * Strings, in both languages, from the start.
 *
 * Türkçe is written first in every entry because it is the primary language of
 * the site, not a translation of the English. Retrofitting i18n is how sites end
 * up half-translated with the important half in the wrong language.
 *
 * Register: this is a public body writing to the people who use its railway.
 * Plain, specific, no marketing voice. "Trains are not running" beats "service
 * is currently experiencing an interruption".
 */

type Dict = Record<string, string>;

const tr: Dict = {
  // ---------------------------------------------------------------- identity
  'site.name': 'Geçiş',
  'site.full': 'Marmaray Geçişi',
  'site.tagline': 'Avrupa’dan Asya’ya, Boğaz’ın altmış metre altından.',
  'site.description':
    'Marmaray’ın merkez tünel kesiti: 13,6 kilometre, altı istasyon ve deniz seviyesinin 60 metre altında bir batırma tüp geçit.',

  // ------------------------------------------------------------- disclosure
  'disclosure.label': 'Kavramsal çalışma',
  'disclosure.body':
    'Bu bir tasarım örneğidir; Metro İstanbul, TCDD veya İETT ile bağlantısı yoktur. Gerçek sefer ve ücret bilgisi için resmî siteye bakın.',
  'disclosure.link': 'Resmî site',

  // ------------------------------------------------------------------- nav
  'nav.journey': 'Geçiş',
  'nav.map': 'Harita',
  'nav.dig': 'Kazı',
  'nav.plan': 'Sefer',
  'nav.fares': 'Ücret',
  'nav.access': 'Erişilebilirlik',
  'nav.build': 'İnşaat',
  'nav.tunel': 'Tünel 1875',
  'nav.data': 'Açık veri',
  'nav.colours': 'Renkler',
  'nav.skip': 'İçeriğe geç',

  // --------------------------------------------------------------- controls
  'ctl.service': 'Servis',
  'ctl.day': 'Gündüz',
  'ctl.night': 'Gece',
  'ctl.view': 'Görünüm',
  'ctl.section': 'Kesit',
  'ctl.planview': 'Düz liste',
  'ctl.planview.on': 'Düz listeye geç',
  'ctl.planview.off': 'Kesit görünümüne dön',
  'ctl.lang': 'English',
  'ctl.sound': 'Ses',
  'ctl.soundOn': 'Sesi aç',
  'ctl.soundOff': 'Sesi kapat',

  // ---------------------------------------------------------------- readout
  'ro.chainage': 'KM',
  'ro.level': 'KOT',
  'ro.grade': 'EĞİM',
  'ro.element': 'ELEMAN',
  'ro.overhead': 'ÜSTÜNDE',
  'ro.rock': 'zemin',
  'ro.water': 'su',

  // ---------------------------------------------------------------- journey
  'j.start': 'Avrupa yakası',
  'j.end': 'Asya yakası',
  'j.divide': 'Kıta sınırı',
  'j.europe': 'AVRUPA',
  'j.asia': 'ASYA',
  'j.underStrait': 'Boğaz’ın altında',
  'j.immersed': 'Batırma tüp',
  'j.bored': 'Delme tünel',
  'j.cut': 'Aç-kapa',
  'j.arrival': 'Geçiş tamamlandı',
  'j.arrival.body':
    'Kazlıçeşme’den Söğütlüçeşme’ye 13,6 kilometre. Bir kıtadan diğerine, denizin altmış metre altından.',
  'j.record': 'Geçiş kaydını indir',
  'j.stepFree': 'Engelsiz erişim',
  'j.interchange': 'Aktarma',

  // ------------------------------------------------------------------- dig
  'dig.title': 'Yenikapı kazısı',
  'dig.lede':
    'Bu istasyonu kazmak, şehrin sekiz bin beş yüz yılını dikey bir kesit hâlinde ortaya çıkardı.',
  'dig.scrollDown': 'Aşağı inin',
  'dig.present': 'Bugün',
  'dig.ships': 'gemi',
  'dig.artefacts': 'buluntu',

  // ------------------------------------------------------------------- map
  'reg.label': 'Harita türü',
  'reg.diagram': 'Şema',
  'reg.geographic': 'Coğrafi',
  'reg.section': 'Kesit',
  'map.title': 'Ağ haritası',
  'map.lede':
    'Aynı ağ, üç ayrı okumada. Şema, kararları okunur kılmak için coğrafyayı atar; coğrafi görünüm neyin ne kadar çarpıtıldığını gösterir; kesit ise Marmaray’ın gerçek düşey hattıdır.',
  'map.stepFree': 'Yalnızca engelsiz istasyonlar',
  'map.alt': 'İstanbul raylı sistem ağı: on bir metro hattı, Marmaray, tramvay ve Tünel.',
  'map.geoCaveat':
    'Coğrafi konumlar yaklaşıktır — şehrin biçimine göre yerleştirilmiştir, ölçüm değildir.',
  'map.sectionCaveat':
    'Kesit yalnızca Marmaray merkez tünel kesitini gösterir; diğer hatların kot verisi yoktur.',
  'map.tableToggle': 'Haritayı tablo olarak aç',
  'map.tableCaption': 'Çizilen her istasyon: hatlar, kıta ve engelsiz erişim durumu.',
  'map.station': 'İstasyon',
  'map.lines': 'Hatlar',
  'map.continent': 'Kıta',
  'map.access': 'Engelsiz',
  'map.yes': 'Evet',
  'map.no': 'Hayır',
  'map.notAll':
    'Bu şema uç istasyonlarını ve tüm aktarma noktalarını gösterir — yolcunun karar verdiği duraklar. Ara duraklar sayıya dahildir ama çizilmemiştir.',

  // ------------------------------------------------------------------ misc
  'x.source': 'Kaynak',
  'x.indicative': 'Yaklaşık değer',
  'x.indicative.long': 'Yayımlanmış kesit çiziminden ölçeklenmiştir; ölçüm değildir.',
  'x.measured': 'Ölçülmüş',
  'x.more': 'Devamı',
  'x.back': 'Geri',
  'x.close': 'Kapat',
  'x.of': '/',
  'x.metres': 'metre',
  'x.km': 'km',
  'x.min': 'dk',
  'x.stations': 'istasyon',
  'x.lines': 'hat',
  'x.opens': 'açılış',
  'x.notFound': 'Sayfa bulunamadı',
  'x.notFound.body': 'Aradığınız sayfa burada değil. Hattın başına dönüp yeniden deneyin.',
  'x.home': 'Başa dön',
};

const en: Dict = {
  'site.name': 'The Crossing',
  'site.full': 'The Marmaray Crossing',
  'site.tagline': 'Europe to Asia, sixty metres under the Bosphorus.',
  'site.description':
    'The central tunnel section of the Marmaray: 13.6 kilometres, six stations, and an immersed tube 60 metres below sea level.',

  'disclosure.label': 'Concept build',
  'disclosure.body':
    'A design demonstration, not affiliated with Metro İstanbul, TCDD or İETT. For real service and fare information, use the official site.',
  'disclosure.link': 'Official site',

  'nav.journey': 'The crossing',
  'nav.map': 'Map',
  'nav.dig': 'The dig',
  'nav.plan': 'Journey planner',
  'nav.fares': 'Fares',
  'nav.access': 'Accessibility',
  'nav.build': 'How it was built',
  'nav.tunel': 'Tünel 1875',
  'nav.data': 'Open data',
  'nav.colours': 'Colours',
  'nav.skip': 'Skip to content',

  'ctl.service': 'Service',
  'ctl.day': 'Day',
  'ctl.night': 'Night',
  'ctl.view': 'View',
  'ctl.section': 'Section',
  'ctl.planview': 'Plan view',
  'ctl.planview.on': 'Switch to plan view',
  'ctl.planview.off': 'Back to section view',
  'ctl.lang': 'Türkçe',
  'ctl.sound': 'Sound',
  'ctl.soundOn': 'Turn sound on',
  'ctl.soundOff': 'Turn sound off',

  'ro.chainage': 'CH',
  'ro.level': 'LEVEL',
  'ro.grade': 'GRADE',
  'ro.element': 'ELEMENT',
  'ro.overhead': 'OVERHEAD',
  'ro.rock': 'ground',
  'ro.water': 'water',

  'j.start': 'European side',
  'j.end': 'Asian side',
  'j.divide': 'Continental divide',
  'j.europe': 'EUROPE',
  'j.asia': 'ASIA',
  'j.underStrait': 'Under the strait',
  'j.immersed': 'Immersed tube',
  'j.bored': 'Bored tunnel',
  'j.cut': 'Cut and cover',
  'j.arrival': 'Crossing complete',
  'j.arrival.body':
    'Kazlıçeşme to Söğütlüçeşme, 13.6 kilometres. One continent to another, sixty metres under the sea.',
  'j.record': 'Download your crossing record',
  'j.stepFree': 'Step-free access',
  'j.interchange': 'Interchange',

  'dig.title': 'The Yenikapı excavation',
  'dig.lede':
    'Digging this station opened a vertical section through eight and a half thousand years of the city.',
  'dig.scrollDown': 'Go down',
  'dig.present': 'Today',
  'dig.ships': 'ships',
  'dig.artefacts': 'artefacts',

  // ------------------------------------------------------------------- map
  'reg.label': 'Map register',
  'reg.diagram': 'Diagram',
  'reg.geographic': 'Geographic',
  'reg.section': 'Section',
  'map.title': 'Network map',
  'map.lede':
    'One network, three readings. The diagram throws away geography so the decisions are legible; the geographic register shows how much that distorts; the section is the Marmaray real vertical alignment.',
  'map.stepFree': 'Step-free stations only',
  'map.alt': 'The Istanbul rail network: eleven metro lines, Marmaray, tram and the Tunel.',
  'map.geoCaveat':
    'Geographic positions are approximate - placed from the shape of the city, not surveyed.',
  'map.sectionCaveat':
    'The section covers only the Marmaray central tunnel; there is no level data for the other lines.',
  'map.tableToggle': 'Open the map as a table',
  'map.tableCaption': 'Every drawn station: lines, continent and step-free status.',
  'map.station': 'Station',
  'map.lines': 'Lines',
  'map.continent': 'Continent',
  'map.access': 'Step-free',
  'map.yes': 'Yes',
  'map.no': 'No',
  'map.notAll':
    'This diagram carries the termini and every interchange - the stops a passenger makes a decision at. Intermediate stations are counted but not drawn.',

  'x.source': 'Source',
  'x.indicative': 'Indicative',
  'x.indicative.long': 'Scaled off the published section drawing. Not a survey.',
  'x.measured': 'Measured',
  'x.more': 'More',
  'x.back': 'Back',
  'x.close': 'Close',
  'x.of': 'of',
  'x.metres': 'metres',
  'x.km': 'km',
  'x.min': 'min',
  'x.stations': 'stations',
  'x.lines': 'lines',
  'x.opens': 'opens',
  'x.notFound': 'Page not found',
  'x.notFound.body': 'That page is not here. Go back to the start of the line and try again.',
  'x.home': 'Back to the start',
};

// Chrome vocabulary and page prose are authored separately and merged here,
// so `t()` never has to know which file a key came from.
const DICTS: Record<Locale, Dict> = {
  tr: { ...tr, ...pagesTr },
  en: { ...en, ...pagesEn },
};

/**
 * A missing key returns the key itself rather than an empty string, so a gap
 * is loud in the interface instead of silently rendering nothing. The
 * `missingKeys` check in the test suite fails the build on any gap anyway.
 */
export function t(locale: Locale, key: string): string {
  return DICTS[locale][key] ?? DICTS.tr[key] ?? key;
}

/** Bound translator, so templates read `tt('nav.map')`. */
export const translator =
  (locale: Locale) =>
  (key: string): string =>
    t(locale, key);

export const allKeys = (): string[] => Object.keys(DICTS.tr);
export const keysFor = (locale: Locale): string[] => Object.keys(DICTS[locale]);
