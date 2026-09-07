import type { Locale } from '../lib/locale.ts';

/**
 * The words on the track.
 *
 * Government register: plain, specific, and never selling anything. A transit
 * authority telling you what is under your feet, not a brand telling you how it
 * feels about connection.
 *
 * Türkçe is written first and the English follows it, rather than the other way
 * round, because that is the order the site is actually in.
 */

export interface StopCopy {
  /** Big signage word. Usually one or two lines. */
  head: string;
  /** Two or three sentences. This is the substance of the stop. */
  body: string;
  /** Short facts, rendered as a definition list beside the body. */
  facts: Array<{ k: string; v: string }>;
  /** Where this stop leads, if anywhere. */
  link?: { label: string; to: string };
}

export interface RunCopy {
  /** A single line, set large, read at speed. */
  line: string;
  /** Optional footnote in mono. */
  note?: string;
}

type Bundle = {
  intro: { head: string; lede: string; scroll: string; both: string };
  stops: Record<string, StopCopy>;
  runs: Record<string, RunCopy>;
  crossing: {
    approach: string;
    head: string;
    body: string;
    divide: string;
    after: string;
    elements: string;
    above: string;
  };
  arrival: { head: string; body: string; again: string };
};

const tr: Bundle = {
  intro: {
    head: 'Bir kıtadan\ndiğerine',
    lede: 'Kazlıçeşme’den Söğütlüçeşme’ye 13,6 kilometre. Yolun ortasında, Boğaz’ın altmış metre altında, dünyanın en derin batırma tüp geçidi var.',
    scroll: 'Aşağı kaydırın — tren batıya doğru ilerler',
    both: 'İki kaydırma çubuğu da çalışır: aşağıdaki kesit çubuğunu sürükleyebilirsiniz.',
  },
  stops: {
    kazlicesme: {
      head: 'Kazlıçeşme',
      body: 'Hat burada yüzeydedir. Marmara kıyısındaki bu noktadan sonra tünel inmeye başlar ve bir daha Asya yakasına kadar gün ışığı görmez. Eski deri fabrikalarının bulunduğu semt, hattın Avrupa yakasındaki ilk merkez istasyonudur.',
      facts: [
        { k: 'Kot', v: '+3 m' },
        { k: 'Yapım', v: 'Aç-kapa' },
        { k: 'Aktarma', v: 'T1 tramvay' },
      ],
    },
    yenikapi: {
      head: 'Yenikapı',
      body: 'Bu istasyonu kazarken Konstantinopolis’in Theodosius Limanı bulundu. Otuz yedi Bizans gemisi, yaklaşık yüz bin buluntu ve en altta Neolitik döneme ait izler. İstasyon dört yıl gecikti; karşılığında şehrin sekiz bin beş yüz yıllık dikey kesiti çıktı.',
      facts: [
        { k: 'Kot', v: '−27 m' },
        { k: 'Buluntu', v: '~100.000' },
        { k: 'Gemi', v: '37' },
      ],
      link: { label: 'Kazıya inin', to: '/kazi' },
    },
    sirkeci: {
      head: 'Sirkeci',
      body: 'Orient Express’in doğu ucu. Paris’ten kalkan tren burada dururdu; bugün aynı noktanın otuz beş metre altından geçen hat, Asya’ya kesintisiz devam ediyor. Yüz elli yıl önce hayal edilen geçiş, buradan başlıyor.',
      facts: [
        { k: 'Kot', v: '−35 m' },
        { k: 'Yapım', v: 'Delme tünel' },
        { k: 'Aktarma', v: 'T1 tramvay' },
      ],
    },
    uskudar: {
      head: 'Üsküdar',
      body: 'Asya yakasındaki ilk istasyon. Boğaz’ın altından geçtiniz: bu noktada başınızın üzerinde kırk metre su ve on beş metre zemin var. İskele hemen yukarıda; aynı geçişi vapurla, yüzeyden de yapabilirsiniz.',
      facts: [
        { k: 'Kot', v: '−35 m' },
        { k: 'Kıta', v: 'Asya' },
        { k: 'Aktarma', v: 'M5, vapur' },
      ],
      link: { label: 'İki geçiş yolu', to: '/harita' },
    },
    'ayrilik-cesmesi': {
      head: 'Ayrılık Çeşmesi',
      body: 'Adını, hacca ve sefere çıkanların şehirden uğurlandığı çeşmeden alır. Yüzyıllarca Anadolu’ya giden yolun başlangıç noktasıydı; bugün de öyle. Hat burada yüzeye yaklaşır.',
      facts: [
        { k: 'Kot', v: '−12 m' },
        { k: 'Aktarma', v: 'M4' },
        { k: 'Engelsiz', v: 'Evet' },
      ],
    },
    sogutlucesme: {
      head: 'Söğütlüçeşme',
      body: 'Merkez tünel kesiti burada biter ve hat yeniden gün ışığına çıkar. Marmaray buradan Gebze’ye kadar yüzeyden devam eder — toplam yetmiş altı buçuk kilometre.',
      facts: [
        { k: 'Kot', v: '+4 m' },
        { k: 'Yapım', v: 'Aç-kapa' },
        { k: 'Aktarma', v: 'Metrobüs, T3' },
      ],
    },
  },
  runs: {
    'p-run-1': {
      line: 'Tünel inmeye başlar.',
      note: 'Tarihî yarımadanın altında, aç-kapa yerini delme tünele bırakır.',
    },
    'p-run-2': {
      line: 'Yarımadanın altında,\notuz beş metre derinde.',
      note: 'Üstünüzde otuz sekiz metre zemin var.',
    },
    'p-run-3': {
      line: 'Zemin yükselir,\ntünel yüzeye döner.',
    },
    'p-run-4': {
      line: 'Kadıköy’ün altından\ndoğuya doğru.',
      note: 'Hat burada yeniden aç-kapa yapıya girer.',
    },
  },
  crossing: {
    approach: 'Kıyı çizgisi geçildi. Artık başınızın üzerinde deniz var.',
    head: 'Boğaz',
    body: 'Bin üç yüz seksen yedi metrelik batırma tüp, on bir hazır beton elemandan oluşur. Her biri karada dökülüp yüzdürülerek getirildi ve deniz tabanına açılan hendeğe indirildi. Dünyanın bu yöntemle yapılmış en derin tüneli.',
    divide: 'Kıta sınırı',
    after: 'Asya. Su çekilmeye başlar.',
    elements: 'Eleman',
    above: 'Yukarıda',
  },
  arrival: {
    head: 'Geçtiniz.',
    body: 'Kazlıçeşme’den Söğütlüçeşme’ye 13,6 kilometre; altı istasyon; en derin nokta deniz seviyesinin altmış metre altı. Bir kıtadan diğerine, hiç yüzeye çıkmadan.',
    again: 'Başa dön',
  },
};

const en: Bundle = {
  intro: {
    head: 'One continent\nto another',
    lede: 'Kazlıçeşme to Söğütlüçeşme, 13.6 kilometres. Halfway along, sixty metres beneath the Bosphorus, is the deepest immersed tube tunnel ever built.',
    scroll: 'Scroll down — the train travels east',
    both: 'Both scrollbars work: the section rail below can be dragged.',
  },
  stops: {
    kazlicesme: {
      head: 'Kazlıçeşme',
      body: 'The line is at the surface here. From this point on the Marmara shore the tunnel begins to descend, and it does not see daylight again until the Asian side. The district of the old tanneries is the first central station on the European leg.',
      facts: [
        { k: 'Level', v: '+3 m' },
        { k: 'Method', v: 'Cut and cover' },
        { k: 'Interchange', v: 'T1 tram' },
      ],
    },
    yenikapi: {
      head: 'Yenikapı',
      body: 'Digging this station uncovered the Theodosian Harbour of Constantinople. Thirty-seven Byzantine ships, roughly a hundred thousand artefacts, and at the bottom, Neolithic remains. The station was four years late; what came out of the ground was a vertical section through eight and a half thousand years of the city.',
      facts: [
        { k: 'Level', v: '−27 m' },
        { k: 'Artefacts', v: '~100,000' },
        { k: 'Ships', v: '37' },
      ],
      link: { label: 'Go down into the dig', to: '/kazi' },
    },
    sirkeci: {
      head: 'Sirkeci',
      body: 'The eastern end of the Orient Express. Trains from Paris terminated here; today the line passing thirty-five metres beneath that same platform carries straight on into Asia. The crossing people imagined a hundred and fifty years ago starts here.',
      facts: [
        { k: 'Level', v: '−35 m' },
        { k: 'Method', v: 'Bored tunnel' },
        { k: 'Interchange', v: 'T1 tram' },
      ],
    },
    uskudar: {
      head: 'Üsküdar',
      body: 'The first station in Asia. You have been under the Bosphorus: at that point there were forty metres of water and fifteen of seabed over your head. The ferry pier is directly above — you can make the same crossing on the surface, in the open air.',
      facts: [
        { k: 'Level', v: '−35 m' },
        { k: 'Continent', v: 'Asia' },
        { k: 'Interchange', v: 'M5, ferry' },
      ],
      link: { label: 'Two ways across', to: '/harita' },
    },
    'ayrilik-cesmesi': {
      head: 'Ayrılık Çeşmesi',
      body: 'Named for the fountain where pilgrims and soldiers were seen off out of the city. For centuries this was where the road into Anatolia began, and in a sense it still is. The line climbs back toward the surface here.',
      facts: [
        { k: 'Level', v: '−12 m' },
        { k: 'Interchange', v: 'M4' },
        { k: 'Step-free', v: 'Yes' },
      ],
    },
    sogutlucesme: {
      head: 'Söğütlüçeşme',
      body: 'The central tunnel section ends and the line returns to daylight. From here Marmaray runs on the surface all the way to Gebze — seventy-six and a half kilometres in total.',
      facts: [
        { k: 'Level', v: '+4 m' },
        { k: 'Method', v: 'Cut and cover' },
        { k: 'Interchange', v: 'Metrobüs, T3' },
      ],
    },
  },
  runs: {
    'p-run-1': {
      line: 'The tunnel begins to descend.',
      note: 'Beneath the historic peninsula, cut-and-cover gives way to bored tunnel.',
    },
    'p-run-2': {
      line: 'Under the peninsula,\nthirty-five metres down.',
      note: 'Thirty-eight metres of ground overhead.',
    },
    'p-run-3': {
      line: 'The ground rises,\nthe tunnel climbs with it.',
    },
    'p-run-4': {
      line: 'East, beneath\nKadıköy.',
      note: 'The line returns to cut-and-cover construction here.',
    },
  },
  crossing: {
    approach: 'Past the shoreline. There is sea above you now.',
    head: 'The Bosphorus',
    body: 'The 1,387-metre immersed tube is eleven precast concrete elements. Each was cast on land, floated out, and sunk into a trench dredged in the seabed. It is the deepest tunnel of its kind anywhere.',
    divide: 'Continental divide',
    after: 'Asia. The water starts to thin.',
    elements: 'Element',
    above: 'Overhead',
  },
  arrival: {
    head: 'You crossed.',
    body: 'Kazlıçeşme to Söğütlüçeşme: 13.6 kilometres, six stations, and a deepest point sixty metres below sea level. One continent to another without once surfacing.',
    again: 'Back to the start',
  },
};

export const journeyCopy = (locale: Locale): Bundle => (locale === 'tr' ? tr : en);
