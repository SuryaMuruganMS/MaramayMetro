import type { Locale } from './locale.ts';

/**
 * Page-level strings.
 *
 * Split from the interface dictionary purely for size: the two are merged
 * before anything reads them, and `t()` cannot tell them apart. Keeping the
 * chrome vocabulary separate from page prose also makes the chrome file
 * scannable, which matters when checking a label appears in both languages.
 */

type Dict = Record<string, string>;

export const pagesTr: Dict = {
  // ------------------------------------------------------- service board
  'svc.checking': 'Saat kontrol ediliyor…',
  'svc.running': 'Marmaray şu anda çalışıyor.',
  'svc.shut': 'Marmaray şu anda kapalı.',
  'svc.istanbul': 'İSTANBUL',
  'svc.first': 'ilk tren',
  'svc.modelled':
    'Kalkış saatleri modellenmiştir — servis saatlerine uygulanmış sabit arayla üretilir, gerçek tarife değildir.',

  // ------------------------------------------------------------- opening
  'open.tunnel': 'Tünel',
  'open.deepest': 'En derin nokta',
  'open.immersed': 'Batırma tüp',
  'open.network': 'Ağ',

  // ---------------------------------------------------------------- planner
  'plan.title': 'Sefer planlayıcı',
  'plan.lede':
    'İki istasyon seçin; ağ üzerinden en kısa yolu, aktarmaları ve inilen en derin noktayı hesaplar.',
  'plan.from': 'Nereden',
  'plan.to': 'Nereye',
  'plan.go': 'Hesapla',
  'plan.swap': 'Yön değiştir',
  'plan.duration': 'Süre',
  'plan.changes': 'Aktarma',
  'plan.deepest': 'En derin nokta',
  'plan.route': 'Güzergâh',
  'plan.same': 'Başlangıç ve varış aynı istasyon.',
  'plan.none': 'Bu iki istasyon arasında çizili bir güzergâh yok.',
  'plan.stepFreeOk': 'Bu güzergâhtaki tüm istasyonlarda engelsiz erişim var.',
  'plan.stepFreeNo': 'Dikkat: bu güzergâhta engelsiz erişimi olmayan istasyon var.',
  'plan.indicative':
    'Süreler yaklaşıktır; şema üzerindeki mesafelerden türetilmiştir, tarife verisi değildir.',
  'plan.noJs':
    'Planlayıcı için JavaScript gerekir. Hatları harita sayfasında tablo olarak görebilirsiniz.',

  // ------------------------------------------------------------------ fares
  'fare.title': 'Ücret ve bölgeler',
  'fare.lede':
    'İstanbulkart ile ödeme yapılır. Aşağıdaki tutarlar gösterim amaçlıdır — gerçek tarife için resmî siteye bakın.',
  'fare.calc': 'Ücret hesapla',
  'fare.full': 'Tam',
  'fare.student': 'Öğrenci',
  'fare.transfer': 'Aktarma indirimi',
  'fare.transferBody':
    'İlk biniş sonrası 120 dakika içinde yapılan aktarmalarda indirimli tarife uygulanır. Bu kural gerçektir; buradaki tutarlar değildir.',
  'fare.card': 'İstanbulkart',
  'fare.cardBody':
    'Ağın tamamında geçerli tek kart. İstasyon gişelerinden ve bayilerden alınır, yüklenir ve turnikede okutulur.',
  'fare.notReal': 'Gösterim amaçlı tutar',

  // ---------------------------------------------------------- accessibility
  'acc.title': 'Erişilebilirlik',
  'acc.lede':
    'Bu sayfa iki şeyi ayrı ayrı anlatır: istasyonlara erişim ve bu web sitesine erişim.',
  'acc.stations': 'İstasyonlarda erişim',
  'acc.stationsBody':
    'Çizili istasyonların engelsiz erişim durumu aşağıdadır. Harita sayfasındaki anahtar, engelsiz olmayanları tamamen gizler — bir istasyonu kullanamıyorsanız onu görmek zorunda kalmamalısınız.',
  'acc.site': 'Bu sitede erişim',
  'acc.conformance': 'Uygunluk',
  'acc.conformanceBody':
    'WCAG 2.1 AA hedeflenmiştir. Yatay geçiş görünümü, içeriğin sunumudur; içeriğin kendisi düşeydir. 1024 pikselin altında, %400 yakınlaştırmada, hareket azaltma tercihinde ve “Düz liste” anahtarıyla sayfa sıradan bir düşey belge olarak açılır. Aynı DOM, aynı sıra, aynı içerik.',
  'acc.known': 'Bilinen sınırlar',
  'acc.knownBody':
    'Geçiş sayfasındaki kesit görünümü, dar ekranlarda hiç kurulmaz. Kesit çubuğu bir kaydırma çubuğudur ve klavyeyle çalışır; ayrıca her istasyona doğrudan bağlantı verir.',
  'acc.contact': 'Bir sorun bulursanız',
  'acc.contactBody':
    'Bu kavramsal bir çalışmadır ve bir kurumun destek hattı yoktur. Gerçek erişilebilirlik bildirimi için resmî siteye bakın.',

  // ------------------------------------------------------------------ build
  'build.title': 'Nasıl yapıldı',
  'build.lede':
    'Boğaz’ın altına bir tünel koymanın üç yolu vardır. Marmaray üçünü de kullandı.',
  'build.cut': 'Aç-kapa',
  'build.cutBody':
    'Yüzeyden kazılır, yapı içine kurulur, üzeri kapatılır. Hattın iki ucunda, tünelin sığ olduğu yerlerde kullanıldı.',
  'build.bored': 'Delme tünel',
  'build.boredBody':
    'Tünel açma makinesiyle zeminin içinden geçilir. Tarihî yarımadanın ve Üsküdar’ın altındaki derin kesimler böyle yapıldı.',
  'build.immersed': 'Batırma tüp',
  'build.immersedBody':
    'On bir hazır beton eleman karada döküldü, uçları kapatılıp yüzdürülerek getirildi ve deniz tabanına açılan hendeğe tek tek indirildi. Sonra su boşaltılıp birleştirildi. Boğaz geçişinin 1.387 metresi budur.',
  'build.why': 'Neden batırma tüp',
  'build.whyBody':
    'Boğaz bu noktada hem derin hem de güçlü akıntılı. Deniz tabanına oturtulan bir tüp, aynı derinlikte delinecek bir tünelden hem daha sığ kalır hem de daha az riskle inşa edilir.',
  'build.delay': 'Dört yıllık gecikme',
  'build.delayBody':
    'Yenikapı’daki kazı, Theodosius Limanı’nı ortaya çıkardı ve projeyi yaklaşık dört yıl geciktirdi. Nedenini yazmak, gecikmeyi gizlemekten iyidir.',

  // ------------------------------------------------------------------ tünel
  'tunel.title': 'Tünel, 1875',
  'tunel.lede':
    'Dünyanın ikinci en eski yeraltı demiryolu. Karaköy ile Beyoğlu arasında 573 metre, doksan saniye — ve hâlâ çalışıyor.',
  'tunel.run': 'Doksan saniyeyi çalıştır',
  'tunel.stop': 'Durdur',
  'tunel.reset': 'Başa al',
  'tunel.karakoy': 'Karaköy',
  'tunel.beyoglu': 'Beyoğlu',
  'tunel.body':
    'Fransız mühendis Eugène Henri Gavand’ın girişimiyle yapıldı ve 17 Ocak 1875’te açıldı. Amacı basitti: Haliç kıyısındaki iş yerleriyle tepedeki Pera konutları arasındaki dik yokuşu ortadan kaldırmak. Bugünün Marmaray’ı da aynı işi yapıyor — sadece yatay olarak, bir kıtadan diğerine.',
  'tunel.same': 'Bu sayfa gerçek zamanlı çalışır: doksan saniye, gerçekten doksan saniyedir.',

  // ---------------------------------------------------------------- colours
  'col.title': 'Renkler',
  'col.lede':
    'Bu sitedeki hat renkleri bizimdir, işletmecinin değil. Nedenini açıkça yazmak gerekiyor.',
  'col.whyTitle': 'Neden resmî renkler kullanılmadı',
  'col.whyBody':
    'Gerçek bir ağın resmî signage renklerini kaynak gösteremeden yayımlamak, kavramsal bir çalışmanın işi değildir. Makul görünen bir renk uydurmak ise sitenin her yerinde kaçındığı sessiz yanlışlığın ta kendisi olurdu. Bu yüzden palet İznik çinisinden türetildi: kobalt, turkuaz, Ermeni bolu kırmızısı ve altın.',
  'col.iznik': 'İznik paleti',
  'col.iznikBody':
    'On altıncı yüzyıl Osmanlı çinisinin belgelenmiş dört rengi, beyaz astar üzerine. Şehrin kendi malzemesinden gelen bir palet, keyfî bir marka renginden daha dürüst.',
  'col.strata': 'Derinlik bantları',
  'col.strataBody':
    'Zemin rengi kesintisiz değil, basamaklıdır. Geçtiğiniz her sınırı görebilirsiniz — sürekli bir geçiş bunu gizler.',

  // ---------------------------------------------------------------- sources
  'src.title': 'Kaynaklar',
  'src.lede':
    'Bu sitede yayımlanan her sayı ya bir kaynağa bağlıdır ya da açıkça “yaklaşık” olarak işaretlenir. Üçüncü bir seçenek yok.',
  'src.covers': 'Neyi belirler',
  'src.confidence': 'Güven',
  'src.measured': 'Ölçülmüş',
  'src.derived': 'Türetilmiş',
  'src.indicativeC': 'Yaklaşık',
  'src.howTitle': 'Nasıl gösterilir',
  'src.howBody':
    'Ölçülmüş bir değer düz yazılır. Türetilmiş bir değerin önünde yaklaşıklık işareti bulunur. Yaklaşık bir değer soluk, noktalı çizgili ve yıldızlıdır. Bir devlet sitesi görünümündeki sayfada hangi sayıya güvenileceğini okurun bir bakışta anlaması gerekir.',

  // -------------------------------------------------------------- open data
  'data.title': 'Açık veri',
  'data.lede':
    'Bu sitenin çalıştığı verinin tamamı burada. Kamu parasıyla üretilmiş veri kamuya açık olmalıdır; bu kavramsal bir çalışma olsa da kural aynı.',
  'data.graph': 'Ağ grafiği',
  'data.graphBody': 'İstasyonlar, hatlar, aktarmalar ve engelsiz erişim durumu.',
  'data.alignment': 'Düşey hat',
  'data.alignmentBody': 'Marmaray merkez kesitinin kot kontrol noktaları.',
  'data.strata': 'Kazı katmanları',
  'data.strataBody': 'Yenikapı kesitinin katmanları ve dönem aralıkları.',
  'data.download': 'JSON indir',
  'data.licence': 'Lisans',
  'data.licenceBody':
    'Veri kaynakları üçüncü taraflara aittir; bu sitedeki derleme ve şema serbestçe kullanılabilir.',
};

export const pagesEn: Dict = {
  'svc.checking': 'Checking the clock…',
  'svc.running': 'Marmaray is running now.',
  'svc.shut': 'Marmaray is closed now.',
  'svc.istanbul': 'İSTANBUL',
  'svc.first': 'first train',
  'svc.modelled':
    'Departure times are modelled — a fixed headway across the service window, not a timetable.',

  'open.tunnel': 'Tunnel',
  'open.deepest': 'Deepest point',
  'open.immersed': 'Immersed tube',
  'open.network': 'Network',

  'plan.title': 'Journey planner',
  'plan.lede':
    'Pick two stations. It finds the shortest path across the network, the interchanges, and the deepest point you pass through.',
  'plan.from': 'From',
  'plan.to': 'To',
  'plan.go': 'Plan',
  'plan.swap': 'Reverse',
  'plan.duration': 'Duration',
  'plan.changes': 'Changes',
  'plan.deepest': 'Deepest point',
  'plan.route': 'Route',
  'plan.same': 'Start and finish are the same station.',
  'plan.none': 'There is no drawn route between those two stations.',
  'plan.stepFreeOk': 'Every station on this route has step-free access.',
  'plan.stepFreeNo': 'Warning: this route calls at a station without step-free access.',
  'plan.indicative':
    'Times are indicative, derived from schematic distances. They are not timetable data.',
  'plan.noJs': 'The planner needs JavaScript. The lines are on the map page as a table.',

  'fare.title': 'Fares and zones',
  'fare.lede':
    'Payment is by İstanbulkart. The amounts below are illustrative — use the official site for real fares.',
  'fare.calc': 'Work out a fare',
  'fare.full': 'Full',
  'fare.student': 'Student',
  'fare.transfer': 'Transfer discount',
  'fare.transferBody':
    'Changes made within 120 minutes of the first tap are charged at a reduced rate. That rule is real; the amounts here are not.',
  'fare.card': 'İstanbulkart',
  'fare.cardBody':
    'One card for the whole network. Bought and topped up at station machines and kiosks, and tapped at the gate.',
  'fare.notReal': 'Illustrative amount',

  'acc.title': 'Accessibility',
  'acc.lede':
    'This page covers two separate things: getting into the stations, and getting into this website.',
  'acc.stations': 'Access at stations',
  'acc.stationsBody':
    'Step-free status for every drawn station is below. The switch on the map page removes the ones without it entirely — if you cannot use a station you should not have to keep looking at it.',
  'acc.site': 'Access to this site',
  'acc.conformance': 'Conformance',
  'acc.conformanceBody':
    'Built to WCAG 2.1 AA. The horizontal crossing view is a presentation of the content; the content itself is vertical. Below 1024 pixels, at 400% zoom, under reduced-motion, and with the Plan view switch, the page lays out as an ordinary vertical document. Same DOM, same order, same content.',
  'acc.known': 'Known limits',
  'acc.knownBody':
    'The section view is never constructed on narrow screens at all. The section rail is a real scrollbar and works from the keyboard, and it also carries a direct link to every station.',
  'acc.contact': 'If you find a problem',
  'acc.contactBody':
    'This is a concept build and has no authority behind it. For a real accessibility statement, use the official site.',

  'build.title': 'How it was built',
  'build.lede':
    'There are three ways to put a tunnel under the Bosphorus. Marmaray used all of them.',
  'build.cut': 'Cut and cover',
  'build.cutBody':
    'Dig from the surface, build the structure inside the hole, put the ground back on top. Used at both ends of the line where the tunnel runs shallow.',
  'build.bored': 'Bored tunnel',
  'build.boredBody':
    'A tunnel boring machine drives through the ground itself. The deep sections under the historic peninsula and under Üsküdar were built this way.',
  'build.immersed': 'Immersed tube',
  'build.immersedBody':
    'Eleven precast concrete elements were cast on land, sealed, floated out, and lowered one at a time into a trench dredged in the seabed. Then they were pumped dry and joined. That is the 1,387 metres of the Bosphorus crossing.',
  'build.why': 'Why an immersed tube',
  'build.whyBody':
    'The strait is both deep and fast-running here. A tube laid into the seabed sits shallower than a bore driven at the same depth, and carries less risk to build.',
  'build.delay': 'The four-year delay',
  'build.delayBody':
    'Excavating Yenikapı uncovered the Theodosian Harbour and put the project back by about four years. Publishing why is better than burying it.',

  'tunel.title': 'The Tünel, 1875',
  'tunel.lede':
    'The world’s second-oldest underground railway. Five hundred and seventy-three metres between Karaköy and Beyoğlu, in ninety seconds — and it still runs.',
  'tunel.run': 'Run the ninety seconds',
  'tunel.stop': 'Stop',
  'tunel.reset': 'Reset',
  'tunel.karakoy': 'Karaköy',
  'tunel.beyoglu': 'Beyoğlu',
  'tunel.body':
    'Built on a concession won by the French engineer Eugène Henri Gavand and opened on 17 January 1875. The purpose was plain: remove the steep climb between the counting houses on the Golden Horn and the residences up in Pera. Marmaray does the same job today, only sideways, from one continent to another.',
  'tunel.same': 'This page runs in real time: ninety seconds is ninety seconds.',

  'col.title': 'Colours',
  'col.lede':
    'The line colours on this site are ours, not the operator’s. That needs saying plainly.',
  'col.whyTitle': 'Why not the official colours',
  'col.whyBody':
    'Publishing a real network’s signage colours without a source is not something a concept build should do, and inventing plausible ones would be exactly the quiet dishonesty this site avoids everywhere else. So the palette is derived from İznik tilework instead: cobalt, turquoise, Armenian bole red and gold.',
  'col.iznik': 'The İznik palette',
  'col.iznikBody':
    'The documented four-colour scheme of sixteenth-century Ottoman tile, on a white slip. A palette taken from the city’s own material is more honest than an arbitrary brand colour.',
  'col.strata': 'Depth bands',
  'col.strataBody':
    'The ground colour steps rather than fading. You can see every boundary you cross, which a continuous gradient hides.',

  'src.title': 'Sources',
  'src.lede':
    'Every number published on this site is either tied to a source or visibly marked as approximate. There is no third option.',
  'src.covers': 'What it establishes',
  'src.confidence': 'Confidence',
  'src.measured': 'Measured',
  'src.derived': 'Derived',
  'src.indicativeC': 'Indicative',
  'src.howTitle': 'How it is shown',
  'src.howBody':
    'A measured figure prints plainly. A derived one is prefixed with an approximation sign. An indicative one is greyed, dotted-underlined and asterisked. On a page dressed as a government site, a reader has to be able to tell at a glance which numbers to trust.',

  'data.title': 'Open data',
  'data.lede':
    'Everything this site runs on is here. Data produced with public money should be public; this is a concept, but the rule does not change.',
  'data.graph': 'Network graph',
  'data.graphBody': 'Stations, lines, interchanges and step-free status.',
  'data.alignment': 'Vertical alignment',
  'data.alignmentBody': 'Level control points for the Marmaray central section.',
  'data.strata': 'Excavation layers',
  'data.strataBody': 'The Yenikapı section: layers and their date ranges.',
  'data.download': 'Download JSON',
  'data.licence': 'Licence',
  'data.licenceBody':
    'The underlying sources belong to third parties; the compilation and schema on this site are free to use.',
};

export const pagesFor = (locale: Locale): Dict => (locale === 'tr' ? pagesTr : pagesEn);
