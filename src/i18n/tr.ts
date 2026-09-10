import type { Keys } from './en.ts';

/** Türkçe. The city's own language, and the one every place name stays in. */
export const tr: Record<Keys, string> = {
  'site.name': 'IstanMetro',
  'site.full': 'IstanMetro — Boğaz geçişi',
  'theme.label': 'Tema',
  'theme.light': 'Açık',
  'theme.dark': 'Koyu',
  'theme.toLight': 'Açık temaya geç',
  'theme.toDark': 'Koyu temaya geç',
  'site.tagline': 'Avrupa’dan Asya’ya, Boğaz’ın altmış metre altından.',
  'site.description':
    'Marmaray’ın merkez tünel kesiti: 13,6 kilometre, altı istasyon ve deniz seviyesinin 60 metre altında bir batırma tüp geçit.',

  'disclosure.label': 'Kavramsal çalışma',
  'disclosure.body':
    'Bu bir tasarım örneğidir; Metro İstanbul, TCDD veya İETT ile bağlantısı yoktur. Gerçek sefer ve ücret bilgisi için resmî siteye bakın.',
  'disclosure.link': 'Resmî site',

  'nav.journey': 'Geçiş',
  'nav.map': 'Harita',
  'nav.dig': 'Kazı',
  'nav.plan': 'Sefer planlayıcı',
  'nav.fares': 'Ücret',
  'nav.travel': 'Yolculuk',
  'nav.access': 'Erişilebilirlik',
  'nav.build': 'İnşaat',
  'nav.tunel': 'Tünel 1875',
  'nav.data': 'Açık veri',
  'nav.colours': 'Renkler',
  'nav.skip': 'İçeriğe geç',

  'ctl.service': 'Servis',
  'ctl.day': 'Gündüz',
  'ctl.night': 'Gece',
  'ctl.view': 'Görünüm',
  'ctl.section': 'Kesit',
  'ctl.planview': 'Düz liste',
  'ctl.lang': 'Dil',
  'ctl.langPick': 'Bir dil seçin',

  'ro.chainage': 'KM',
  'ro.level': 'KOT',
  'ro.grade': 'EĞİM',
  'ro.element': 'ELEMAN',
  'ro.overhead': 'ÜSTÜNDE',
  'ro.car': 'VAGON',
  'ro.rock': 'zemin',
  'ro.water': 'su',

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
  'j.record': 'Geçiş kaydını indir',
  'j.stepFree': 'Engelsiz erişim',
  'j.interchange': 'Aktarma',

  'car.title': 'Bulunduğunuz yer',
  'car.cab': 'Sürüş kabini',
  'car.saloon': 'Yolcu salonu, 1. vagon',
  'car.saloon2': 'Yolcu salonu, 2. vagon',
  'car.gangway': 'Vagonlar arası geçiş',
  'car.doors': 'Kapı sahanlığı',
  'car.bogie': 'Boji üzerinde',
  'car.pantograph': 'Pantograf altında',

  'dig.title': 'Yenikapı kazısı',
  'dig.lede':
    'Bu istasyonu kazmak, şehrin sekiz bin beş yüz yılını bir kesit hâlinde ortaya çıkardı.',
  'dig.scrollDown': 'Aşağı inin',
  // ----------------------------------------------------------------- the finds
  'find.title': 'Topraktan çıkanlar',
  'find.lede':
    'Yukarıdaki katmanlar aşağı doğru iner; çünkü Yenikapı’da derinlik zamandır. Bu bölüm yana doğru gider: altta ne olduğu değil, oradan ne çıkarıldığı.',
  'find.cue': 'Kaydırmaya devam edin — buluntular geçiyor',
  'find.of': '/',
  'find.layer': 'Katman:',
  'find.imagery':
    'Görseller bu kavramsal çalışma için üretilmiştir. Anlattığı kayıt ise gerçektir.',

  'find.harbour.period': '4. – 12. yüzyıl',
  'find.harbour.title': 'Theodosius Limanı',
  'find.harbour.body':
    'Konstantinopolis’in tahıl limanı; 4. yüzyıl sonunda Lykos vadisinin güneyindeki kıyıya açıldı. Şehir sekiz yüz yıl boyunca buradan beslendi. Sonra dere, havzayı taranabileceğinden hızlı doldurdu; rıhtımlar terk edildi ve liman bostana dönüştü.',
  'find.harbour.stat': 'yıl kullanımda',

  'find.hulls.period': '5. – 11. yüzyıl',
  'find.hulls.title': 'Otuz yedi gemi',
  'find.hulls.body':
    'Dünyada tek bir kazıda bulunmuş en büyük orta çağ gemi topluluğu. Tahıl ve şarap taşıyan yuvarlak gövdeli ticaret tekneleri; kimi bağlı olduğu yerde batmış, kimi çamura terk edilmiş. Her biri, yapıldığı yüzyılda tersanenin nasıl çalıştığının fotoğrafı.',
  'find.hulls.stat': 'gemi çıkarıldı',

  'find.galleys.period': '10. – 11. yüzyıl',
  'find.galleys.title': 'Savaş kadırgaları',
  'find.galleys.body':
    'Ticaret tekneleri arasından uzun ve dar kürekli gövdeler çıktı: bugüne dek bulunmuş ilk Bizans savaş gemileri. Bu çamurdan çıkana kadar, şehri bin yıl koruyan donanma yalnızca yazılı kaynaklardan ve resimlerinden biliniyordu.',
  'find.galleys.stat': 'kadırga, bir ilk',

  'find.mud.period': 'Kapalı, bozulmamış',
  'find.mud.title': 'Çamurun sakladıkları',
  'find.mud.body':
    'Liman çamurunda oksijen yoktur; oksijen yoksa hiçbir şey çürümez. Böylece asla kalmayan şeyler kaldı: halat yumakları, dikişi sağlam deri sandaletler, ahşap taraklar, sepetler, bir gemi ustasının aletleri. Sıradan nesneler — başka hiçbir yerde bulunmamalarının nedeni de tam olarak bu.',
  'find.mud.stat': 'kadar buluntu',

  'find.neolithic.period': 'MÖ ~6500',
  'find.neolithic.title': 'Limanın altında',
  'find.neolithic.body':
    'Bizans siltinin altında kazı, onu örten denizden daha eski bir kıyıya ulaştı: direk çukurları, ocaklar, mezarlar ve şehrin ilk surlarından dört bin yıl önce burada yaşayan insanların ıslak zemine bastığı ayak izleri.',
  'find.neolithic.stat': 'yıllık yerleşim',

  'find.station.period': '2004 – 2013',
  'find.station.title': 'Üstündeki istasyon',
  'find.station.body':
    'Kazı, demiryolunu yaklaşık dört yıl durdurdu. Yenikapı, Marmaray ile iki metro hattının aktarma noktası olarak açıldı; bulunanların bir bölümü dağıtım katında sergileniyor. Yolcular her sabah limanın üzerinden geçiyor.',
  'find.station.stat': 'yıl gecikme',
  'dig.scrollRight': 'Geriye gidin — kaydırdıkça daha derine ve daha eskiye',
  'dig.present': 'Bugün',
  'dig.ships': 'gemi',
  'dig.artefacts': 'buluntu',
  'dig.place': 'Yenikapı',
  'dig.k.artefacts': 'Buluntu',
  'dig.k.hulls': 'Gemi',
  'dig.k.oldest': 'En eski katman',
  'dig.k.delay': 'Gecikme',
  'dig.v.delay': '~4 yıl',
  'dig.depthAxis': 'DERİNLİK',
  'dig.periodAxis': 'DÖNEM',
  'dig.bce': 'MÖ {n}',
  'dig.century': 'yy',
  'dig.f.matrix': 'Zemin',
  'dig.f.holds': 'Ne barındırıyor',
  'dig.f.method': 'Nasıl kazıldı',
  'dig.colTitle': 'Bu tabaka kesitin neresinde',
  'dig.colCap': 'Kesitin tamamı, {n} m. Bu bant vurgulu.',
  'dig.floor': 'Kazının tabanı. Bunun altı el değmemiş zemin.',
  'dig.moreHulls': 've adı ayrıca kayda geçmemiş {n} tekne daha',
  'dig.why': 'Demiryolu neden gecikti',
  'dig.whyBody':
    'Kazı, projeyi yaklaşık dört yıl geciktirdi. Bir altyapı işinin bu kadar uzaması normalde savunulacak bir şey değildir; burada karşılığında şehrin sekiz bin beş yüz yıllık kesiti ve yüz bine yakın buluntu çıktı. Gecikmeyi gizlemek yerine ne uğruna olduğunu yazmak, kamu kurumunun işidir.',
  'dig.respect':
    'Kazıda insan kalıntıları da bulundu. Bu sayfada görselleştirilmemiştir; kayda geçmiş bir gerçek olarak anılır, o kadar.',
  'dig.back': 'Geçişe dön',

  'reg.label': 'Harita türü',
  'reg.diagram': 'Şema',
  'reg.geographic': 'Coğrafi',
  'reg.section': 'Kesit',
  'map.title': 'Ağ haritası',
  'map.lede':
    'Aynı ağ, üç ayrı okumada. Şema, kararları okunur kılmak için coğrafyayı atar; coğrafi görünüm her istasyonu gerçek kıyı çizgisine geri koyar; kesit ise Marmaray’ın gerçek düşey hattıdır.',
  'map.stepFree': 'Yalnızca engelsiz istasyonlar',
  'map.alt': 'İstanbul raylı sistem ağı: on bir metro hattı, Marmaray, tramvay ve Tünel.',
  'map.geoCaveat':
    'Kıyı çizgisi ve istasyon konumları OpenStreetMap’ten. Kıyı yaklaşık yüz metreye sadeleştirildi; her istasyon kendi peronunun koordinatıdır.',
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
  'map.click': 'Açmak için bir istasyon seçin',
  'map.close': 'Kapat',
  'map.openStation': 'İstasyon bilgisi',
  'map.zone': 'Ücret bölgesi',
  'map.opened': 'Açılış',
  'map.depth': 'Peron kotu',
  'map.connections': 'Bağlantılar',
  'map.planFrom': 'Buradan sefer planla',
  'map.calls': 'Buraya uğrayan hatlar',
  'map.otherSide': 'Boğaz’ın karşısına',
  'map.otherSideBody': 'Bu istasyondan diğer kıtaya en kısa yol.',
  'map.coords': 'Koordinatlar',
  'map.faresFrom': 'Buradan ücretler',
  'map.notOnLine': 'Marmaray merkez tünelinde değil; bu yüzden burada kot bilgisi yok.',
  'map.hereAlready': 'Bu istasyon zaten geçişin üzerinde.',
  'map.linesHeading': 'Hatlar',
  'map.drawnNote':
    'Ağda toplam {all} istasyon var; burada {drawn} tanesi çizili — {interchanges} aktarma noktasının tamamı dahil.',
  'map.pickPrompt': 'Açmak için haritadan bir istasyon seçin.',
  'map.source': 'Coğrafya: OpenStreetMap katkıcıları, ODbL.',
  'map.zoom': 'Yakınlaştırma',
  'map.zoomIn': 'Yakınlaştır',
  'map.zoomOut': 'Uzaklaştır',
  'map.reset': 'Tüm ağı sığdır',
  'map.drag':
    'Kaydırmak için sürükleyin · yakınlaştırmak için tekerlek · hatta ya da istasyona basın',
  'map.centre': 'Bu istasyonu ortala',
  'map.lineDetails': 'Hat',
  'map.lineStations': 'İstasyon',
  'map.lineDrawn': 'Burada çizili',
  'map.lineDrawnNote':
    'Bu harita her durağı değil, uç istasyonları ve aktarma noktalarını — yolcunun karar verdiği yerleri — çizer. Kilometre, hattın değil çizili güzergâhın uzunluğudur.',
  'map.lineRoute': 'Çizili güzergâh',
  'map.lineMeets': 'Diğer hatlarla kesiştiği yerler',
  'kind.metro': 'Metro',
  'kind.rail': 'Banliyö demiryolu',
  'kind.tram': 'Tramvay',
  'kind.funicular': 'Füniküler',

  'plan.title': 'Sefer planlayıcı',
  'plan.lede':
    'İki istasyon seçin; ağ üzerindeki en kısa yolu, aktarmaları, ücreti ve inilen en derin noktayı hesaplar.',
  'plan.from': 'Nereden',
  'plan.to': 'Nereye',
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
  'plan.fare': 'Ücret',
  'plan.passenger': 'Yolcu tipi',
  'plan.zones': 'Geçilen bölge',
  'plan.firstTap': 'İlk biniş',
  'plan.transfers': 'Aktarmalar',
  'plan.travelsFree':
    'Bu kart ücretsiz seyahat eder. Tam ücret karşılaştırma için gösterilmiştir.',
  'plan.fareBreak': 'Ücret neyden oluşuyor',
  'plan.ride': 'Biniş',
  'plan.fareNote': 'Kurgusal ücret.',
  'plan.fullFare': 'Tam ücretle',
  'plan.showMap': 'Güzergâhı haritada göster',
  'plan.hideMap': 'Haritayı gizle',
  'plan.fullMap': 'Tüm ağ haritasını aç',

  'fare.title': 'Ücretler',
  'fare.lede':
    'Her istasyon, her yolcu tipi. Ödeme İstanbulkart ile, turnikede okutularak yapılır.',
  'fare.full': 'Tam',
  'fare.student': 'Öğrenci',
  'fare.child': 'Çocuk (7 yaş altı)',
  'fare.senior': '65 yaş ve üzeri',
  'fare.teacher': 'Öğretmen',
  'fare.disabled': 'Engelli kartı',
  'fare.transfer': 'Aktarma indirimi',
  'fare.transferBody':
    'İlk binişten sonraki 120 dakika içinde yapılan aktarmalar indirimli tarifeye tabidir ve bu süre içindeki her aktarmada indirim artar. Kural, gerçek ağın işleyişidir.',
  'fare.card': 'İstanbulkart',
  'fare.cardBody':
    'Ağın tamamında geçerli tek kart. İstasyon gişelerinden ve bayilerden alınır, yüklenir; giriş ve çıkışta turnikede okutulur.',
  'fare.fictional': 'Bu fiyatlar kurgusaldır',
  'fare.fictionalBody':
    'Bu sayfadaki tutarlar bir tasarım çalışması için uydurulmuştur. Gerçek tarifenin yapısı örnek alınmıştır — yolcu tipine göre taban ücret, Marmaray’da mesafe kademeleri ve kademeli aktarma indirimi — ancak buradaki hiçbir rakam gerçek bir ücret değildir ve güncel tutulmaz. Yolculuktan önce resmî siteye bakın.',
  'fare.info': 'Bu fiyatlar hakkında',
  'fare.perStation': 'İstasyon başına ücret',
  'fare.zone': 'Bölge',
  'fare.base': 'Taban ücret',
  'fare.band': 'Mesafe kademesi',
  'fare.free': 'Ücretsiz',
  'fare.table': 'Ücret tablosu',
  'fare.pickOrigin': 'Şuradan ücretler',
  'fare.works': 'Ücret nasıl hesaplanır',
  'fare.flat': 'Sabit ücret',
  'fare.flatBody':
    'Metro, tramvay ve füniküler yolculukları ne kadar uzun olursa olsun tek fiyat. Girişte turnikeye bir kez basılır.',
  'fare.distance': 'Mesafeli ücret',
  'fare.distanceBody':
    'Marmaray gidilen mesafeye göre ücretlendirir: bir biniş bedeli, ardından her kilometre için bir tutar; tavan ise hattın uçtan uca fiyatıdır.',
  'fare.tapOut': 'Girişte de çıkışta da basın',
  'fare.tapOutBody':
    'Marmaray turnikelerinin kartı iki kez, metro turnikelerinin bir kez okumasının nedeni budur. Turnike, nerede indiğinizi bilmeden ne yazacağını bilemez.',
  'fare.freeTitle': 'Üç kart ücretsiz seyahat eder',
  'fare.freeBody':
    '65 yaş üstü yolcular, yedi yaşından küçük çocuklar ve engelli kart sahipleri ücret ödemez. Bu, bir ücrete uygulanan indirim değildir — uygulanacak bir ücret yoktur.',
  'fare.boarding': 'Biniş bedeli',
  'fare.perKm': 'Kilometre başına',
  'fare.cap': 'En yüksek tutar',
  'fare.capNote':
    'Tavan, Halkalı–Gebze tam hattının fiyatıdır; kimse hattın tamamından fazlasını ödemez.',
  'fare.rate': 'Tam ücrete oranı',
  'fare.ladder': 'Aktarma kademeleri',
  'fare.change1': 'Birinci aktarma',
  'fare.change2': 'İkinci aktarma',
  'fare.change3': 'Üçüncü aktarma',
  'fare.change4': 'Dördüncü ve sonrası',
  'fare.window': 'İlk basıştan sonraki 120 dakika içinde',
  'fare.to': 'Varış',
  'fare.origin': 'Bu istasyondan ücretler',
  'fare.noRoute': 'güzergâh yok',
  'fare.changesCol': 'Aktarma',
  'fare.tariff': 'Tarife',
  'fare.passengers': 'Yolcu tipleri',
  'fare.bandsNote':
    'Tarife kademeli değil, süreklidir. Bu adlar yolculuğu sözle tanımlar; ücreti değiştirmez.',
  'fare.band1': 'Yerel',
  'fare.band2': 'Kısa',
  'fare.band3': 'Orta',
  'fare.band4': 'Uzun',
  'fare.band5': 'Uçtan uca',

  'travel.title': 'Metroda yolculuk',
  'travel.lede':
    'Hattın nasıl kullanıldığı, trenin nelerden oluştuğu ve bir şey ters gittiğinde ne yapılacağı.',
  'travel.how': 'Yolculuk yapmak',
  'travel.howBody':
    'İstasyon holündeki makineden İstanbulkart alın veya yükleyin. Girişte kartı turnikedeki okuyucuya okutun. Marmaray’da çıkışta da okutmanız gerekir; ücret gidilen mesafeye göre hesaplanır. Peron kenarındaki hissedilebilir şeridin gerisinde durun, binmeden önce inenlerin inmesini bekleyin ve kapıların önünde birikmek yerine vagonun içine ilerleyin.',
  'travel.safety': 'Güvenlik',
  'travel.safetyBody':
    'Her vagonda doğrudan makiniste bağlanan bir acil durum interkomu ve yalnızca tren durduğunda, görevlinin söylemesi hâlinde kullanılacak bir kapı açma kolu bulunur. İkisini de istasyonlar arasında seyir hâlindeyken kullanmak durumu kötüleştirir: tünel içinde durmuş bir treni tahliye etmek, bir sonraki perona ulaşmış bir trene göre çok daha zordur.',
  'travel.parts': 'Trenin bölümleri',
  'travel.partsBody':
    'Bir Marmaray dizisi, açık geçişlerle birbirine bağlanmış birkaç vagondan oluşur; baştan sona yürüyebilirsiniz. Her vagonun iki ucunda, zeminin altında tekerlekleri, süspansiyonu ve cer motorlarını taşıyan bir boji vardır. Üstte pantograf, katener hattından akımı alır. Sürüş kabini her iki uçta bulunur; böylece tren dönmeden yön değiştirir.',
  'travel.cab': 'Kabin',
  'travel.cabBody':
    'Makinistin önünde cer ve fren kumandası, kapı durumu ile ceri gösteren bir tren yönetim ekranı ve izin verilen hızı bildiren sinyalizasyon göstergesi bulunur. Ölü adam pedalı sürekli basınç ister; bırakılırsa frenler devreye girer. Marmaray otomatik tren koruma ile çalışır: makinist frene basmazsa sinyalizasyon sistemi treni kendisi durdurur.',
  'travel.rules': 'Kurallar',
  'travel.rule1': 'Girişte ve çıkışta kart okutun. Marmaray’da ücret mesafeye göredir.',
  'travel.rule2': 'Öncelikli koltukları ihtiyacı olanlara bırakın.',
  'travel.rule3': 'İstasyonda ve trende, elektronik sigara dahil, sigara içilmez.',
  'travel.rule4': 'Tren durana kadar hissedilebilir şeridin gerisinde kalın.',
  'travel.rule5': 'Bisiklet yalnızca yoğun olmayan saatlerde; katlanır bisiklet her saatte.',
  'travel.rule6': 'Yeme içme önerilmez, peron kenarında yasaktır.',
  'travel.diagram': 'Dizi düzeni',
  'travel.cabAlt': 'Modern bir elektrikli banliyö treninin sürüş kabini.',
  'travel.partsAlt': 'Bojileri, geçişleri ve pantografı gösteren banliyö treni kesiti.',

  'open.tunnel': 'Tünel',
  'open.deepest': 'En derin nokta',
  'open.immersed': 'Batırma tüp',
  'open.network': 'Ağ',

  'acc.title': 'Erişilebilirlik',
  'acc.lede':
    'Bu sayfa iki şeyi ayrı ayrı anlatır: istasyonlara erişim ve bu web sitesine erişim.',
  'acc.stations': 'İstasyonlarda erişim',
  'acc.stationsBody':
    'Çizili istasyonların engelsiz erişim durumu aşağıdadır. Harita sayfasındaki anahtar, engelsiz olmayanları tamamen gizler — bir istasyonu kullanamıyorsanız onu görmek zorunda kalmamalısınız.',
  'acc.site': 'Bu sitede erişim',
  'acc.conformance': 'Uygunluk',
  'acc.conformanceBody':
    'WCAG 2.1 AA hedeflenmiştir. Yatay geçiş görünümü içeriğin sunumudur; içeriğin kendisi düşeydir. 1024 pikselin altında, %400 yakınlaştırmada, hareket azaltma tercihinde ve “Düz liste” anahtarıyla sayfa sıradan bir düşey belge olarak açılır. Aynı DOM, aynı sıra, aynı içerik.',
  'acc.known': 'Bilinen sınırlar',
  'acc.knownBody':
    'Kesit görünümü dar ekranlarda hiç kurulmaz. Kesit çubuğu gerçek bir kaydırma çubuğudur ve klavyeyle çalışır; ayrıca her istasyona doğrudan bağlantı verir.',
  'acc.contact': 'Bir sorun bulursanız',
  'acc.contactBody':
    'Bu kavramsal bir çalışmadır ve arkasında bir kurum yoktur. Gerçek erişilebilirlik bildirimi için resmî siteye bakın.',

  'build.title': 'Nasıl yapıldı',
  'build.lede': 'Boğaz’ın altına tünel koymanın üç yolu vardır. Marmaray üçünü de kullandı.',
  'build.cut': 'Aç-kapa',
  'build.cutBody':
    'Yüzeyden kazılır, yapı çukurun içinde kurulur, üzeri kapatılır. Hattın iki ucunda, tünelin sığ olduğu yerlerde kullanıldı.',
  'build.bored': 'Delme tünel',
  'build.boredBody':
    'Tünel açma makinesi zeminin içinden ilerler. Tarihî yarımadanın ve Üsküdar’ın altındaki derin kesimler böyle yapıldı.',
  'build.immersed': 'Batırma tüp',
  'build.immersedBody':
    'On bir hazır beton eleman karada döküldü, uçları kapatılıp yüzdürülerek getirildi ve deniz tabanına açılan hendeğe tek tek indirildi. Sonra suyu boşaltılıp birleştirildi. Boğaz geçişinin 1.387 metresi budur.',
  'build.why': 'Neden batırma tüp',
  'build.whyBody':
    'Boğaz bu noktada hem derin hem de güçlü akıntılı. Deniz tabanına oturtulan bir tüp, aynı derinlikte delinecek bir tünelden hem daha sığ kalır hem de daha az riskle inşa edilir.',
  'build.delay': 'Dört yıllık gecikme',
  'build.delayBody':
    'Yenikapı’daki kazı, Theodosius Limanı’nı ortaya çıkardı ve projeyi yaklaşık dört yıl geciktirdi. Nedenini yazmak, gecikmeyi gizlemekten iyidir.',

  'tunel.title': 'Tünel, 1875',
  'tunel.lede':
    'Dünyanın ikinci en eski yeraltı demiryolu. Karaköy ile Beyoğlu arasında 573 metre, doksan saniye — ve hâlâ çalışıyor.',
  'tunel.run': 'Doksan saniyeyi çalıştır',
  'tunel.stop': 'Durdur',
  'tunel.reset': 'Başa al',
  'tunel.karakoy': 'Karaköy',
  'tunel.beyoglu': 'Beyoğlu',
  'tunel.body':
    'Fransız mühendis Eugène Henri Gavand’ın aldığı imtiyazla yapıldı ve 17 Ocak 1875’te açıldı. Amacı basitti: Haliç kıyısındaki iş yerleriyle tepedeki Pera konutları arasındaki dik yokuşu ortadan kaldırmak. Bugünün Marmaray’ı da aynı işi yapıyor — sadece yatay olarak, bir kıtadan diğerine.',
  'tunel.same': 'Bu sayfa gerçek zamanlı çalışır: doksan saniye, gerçekten doksan saniyedir.',

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

  'data.title': 'Açık veri',
  'data.lede':
    'Bu sitenin çalıştığı verinin tamamı burada. Kamu parasıyla üretilmiş veri kamuya açık olmalıdır; bu kavramsal bir çalışma olsa da kural aynı.',
  'data.graph': 'Ağ grafiği',
  'data.graphBody': 'İstasyonlar, hatlar, aktarmalar ve engelsiz erişim durumu.',
  'data.alignment': 'Düşey hat',
  'data.alignmentBody': 'Marmaray merkez kesitinin kot kontrol noktaları.',
  'data.strata': 'Kazı katmanları',
  'data.strataBody': 'Yenikapı kesitinin katmanları ve dönem aralıkları.',
  'data.world': 'Dünya altlığı',
  'data.worldBody':
    'Ülke sınırları, büyük göller ve yedi bin yerleşim noktası; bu haritanın kendi koordinatlarına yansıtılmış hâlde. Natural Earth, kamu malı.',
  'data.download': 'JSON indir',
  'data.licence': 'Lisans',
  'data.licenceBody':
    'Veri kaynakları üçüncü taraflara aittir; bu sitedeki derleme ve şema serbestçe kullanılabilir.',

  'svc.checking': 'Saat kontrol ediliyor…',
  'svc.running': 'Marmaray şu anda çalışıyor.',
  'svc.shut': 'Marmaray şu anda kapalı.',
  'svc.istanbul': 'İSTANBUL',
  'svc.first': 'ilk tren',
  'svc.modelled':
    'Kalkış saatleri modellenmiştir — servis saatlerine uygulanmış sabit arayla üretilir, gerçek tarife değildir.',

  'band.surface': 'Yüzey',
  'band.shallow': 'Sığ',
  'band.deep': 'Derin',
  'band.seabed': 'Deniz tabanı',
  'band.abyssal': 'En derin',
  'pig.cobalt': 'Kobalt',
  'pig.turquoise': 'Turkuaz',
  'pig.bole': 'Bolu kırmızısı',
  'pig.gold': 'Altın',
  'pig.use.cobalt': 'Yapı',
  'pig.use.turquoise': 'Su',
  'pig.use.bole': 'Vurgu',
  'pig.use.gold': 'Mühendislik kaydı',
  'col.lines': 'Hat renkleri',

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
