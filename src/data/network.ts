/**
 * The network, as a graph and as a diagram.
 *
 * WHAT THIS IS AND IS NOT
 * İstanbul has 169 metro stations. Drawing all of them legibly at one zoom is
 * not a design problem, it is a wall - Beck's map works because London's
 * network in 1933 had far fewer decision points than this one has now. So this
 * carries the eleven metro lines plus Marmaray, the tram and the Tünel, with
 * their termini and every interchange between them: the stations a passenger
 * actually makes a decision at. Intermediate stops are counted, not drawn, and
 * the page says so rather than implying the network is smaller than it is.
 *
 * COORDINATES
 * Schematic, on a 100x70 grid, in Beck's grammar: horizontal, vertical and 45°
 * only. Europe left, Asia right, the Bosphorus down the middle. Positions are a
 * readable abstraction of real geography, which is the entire point of a transit
 * diagram and the reason /harita also offers a geographic register.
 *
 * The real positions live in `geography.ts` and are surveyed, not estimated.
 * Keeping the two apart is deliberate: this file is a drawing and that one is a
 * measurement, and the moment they share a field somebody will edit one meaning
 * the other.
 *
 * COLOURS are ours, from the İznik palette, not the operator's signage. A
 * concept build has no business publishing line colours it cannot source, and
 * inventing plausible ones for a real network is the quiet kind of dishonesty
 * this project avoids. Said outright on /renkler.
 */

import { railKm, minutesFor } from '../lib/geo.ts';

export interface Node {
  id: string;
  name: string;
  /** Schematic position, Beck grammar. */
  x: number;
  y: number;
  /*
   * There is no geographic position here any more.
   *
   * It used to be a pair of numbers placed by eye, labelled indicative. Real
   * coordinates for every one of these platforms are in `geography.ts`, taken
   * from OpenStreetMap and projected properly, so the geographic register is
   * now a map rather than an impression of one — and the morph between the two
   * registers shows a real distortion instead of an imagined one.
   */
  /** Lines calling here. Two or more makes it an interchange. */
  lines: string[];
  continent: 'EU' | 'AS';
  stepFree: boolean;
}

export interface Line {
  id: string;
  name: string;
  /** Node ids in running order. */
  route: string[];
  /** Total stations on the real line, including ones not drawn here. */
  stations: number;
  colour: string;
  kind: 'metro' | 'rail' | 'tram' | 'funicular';
}

export const NODES: Node[] = [
  // ---------------------------------------------------------- Marmaray spine
  {
    id: 'halkali',
    name: 'Halkalı',
    x: 4,
    y: 40,
    lines: ['MR'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'bakirkoy',
    name: 'Bakırköy',
    x: 12,
    y: 40,
    lines: ['MR', 'M3'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'kazlicesme',
    name: 'Kazlıçeşme',
    x: 17,
    y: 40,
    lines: ['MR', 'T1'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'yenikapi',
    name: 'Yenikapı',
    x: 24,
    y: 40,
    lines: ['MR', 'M1A', 'M1B', 'M2'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'sirkeci',
    name: 'Sirkeci',
    x: 38,
    y: 40,
    lines: ['MR', 'T1'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'uskudar',
    name: 'Üsküdar',
    x: 58,
    y: 40,
    lines: ['MR', 'M5'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'ayrilik-cesmesi',
    name: 'Ayrılık Çeşmesi',
    x: 63,
    y: 40,
    lines: ['MR', 'M4'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'sogutlucesme',
    name: 'Söğütlüçeşme',
    x: 67,
    y: 40,
    lines: ['MR'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'bostanci',
    name: 'Bostancı',
    x: 78,
    y: 40,
    lines: ['MR', 'M8'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'pendik',
    name: 'Pendik',
    x: 88,
    y: 40,
    lines: ['MR'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'gebze',
    name: 'Gebze',
    x: 96,
    y: 40,
    lines: ['MR'],
    continent: 'AS',
    stepFree: true,
  },

  // ------------------------------------------------------------------- M2 north
  {
    id: 'vezneciler',
    name: 'Vezneciler',
    x: 30,
    y: 34,
    lines: ['M2'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'sishane',
    name: 'Şişhane',
    x: 34,
    y: 28,
    lines: ['M2', 'F2'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'taksim',
    name: 'Taksim',
    x: 36,
    y: 24,
    lines: ['M2'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'mecidiyekoy',
    name: 'Mecidiyeköy',
    x: 36,
    y: 18,
    lines: ['M2', 'M7'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'gayrettepe',
    name: 'Gayrettepe',
    x: 36,
    y: 15,
    lines: ['M2', 'M11'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'levent',
    name: 'Levent',
    x: 36,
    y: 12,
    lines: ['M2', 'M6'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'hacisoman',
    name: 'Hacıosman',
    x: 36,
    y: 4,
    lines: ['M2'],
    continent: 'EU',
    stepFree: true,
  },

  // ---------------------------------------------------------------- M1 / west
  {
    id: 'kirazli',
    name: 'Kirazlı',
    x: 12,
    y: 28,
    lines: ['M1B', 'M3'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'ataturk',
    name: 'Atatürk Havalimanı',
    x: 8,
    y: 48,
    lines: ['M1A'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'otogar',
    name: 'Otogar',
    x: 16,
    y: 34,
    lines: ['M1A', 'M1B'],
    continent: 'EU',
    stepFree: true,
  },

  // ----------------------------------------------------------------- M3 / M9
  {
    id: 'kayasehir',
    name: 'Kayaşehir Merkez',
    x: 7,
    y: 12,
    lines: ['M3'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'mahmutbey',
    name: 'Mahmutbey',
    x: 12,
    y: 22,
    lines: ['M3', 'M7'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'atakoy',
    name: 'Ataköy',
    x: 15,
    y: 46,
    lines: ['M9'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'olimpiyat',
    name: 'Olimpiyat',
    x: 11,
    y: 18,
    lines: ['M9', 'M3'],
    continent: 'EU',
    stepFree: true,
  },

  // ---------------------------------------------------------------- M6 / M11
  {
    id: 'hisarustu',
    name: 'Boğaziçi Ü. / Hisarüstü',
    x: 42,
    y: 9,
    lines: ['M6'],
    continent: 'EU',
    stepFree: true,
  },
  {
    id: 'ist-havalimani',
    name: 'İstanbul Havalimanı',
    x: 22,
    y: 6,
    lines: ['M11'],
    continent: 'EU',
    stepFree: true,
  },

  // --------------------------------------------------------------------- M7
  {
    id: 'yildiz',
    name: 'Yıldız',
    x: 42,
    y: 20,
    lines: ['M7'],
    continent: 'EU',
    stepFree: true,
  },

  // ------------------------------------------------------------------ Tünel
  {
    id: 'karakoy',
    name: 'Karaköy',
    x: 38,
    y: 33,
    lines: ['F2', 'T1'],
    continent: 'EU',
    stepFree: false,
  },

  // ------------------------------------------------------------- Asian lines
  {
    id: 'kadikoy',
    name: 'Kadıköy',
    x: 62,
    y: 46,
    lines: ['M4'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'kozyatagi',
    name: 'Kozyatağı',
    x: 76,
    y: 46,
    lines: ['M4'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'kartal',
    name: 'Kartal',
    x: 84,
    y: 46,
    lines: ['M4'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'sabiha',
    name: 'Sabiha Gökçen Havalimanı',
    x: 94,
    y: 50,
    lines: ['M4'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'unalan',
    name: 'Ünalan',
    x: 68,
    y: 44,
    lines: ['M4', 'M8'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'samandira',
    name: 'Samandıra Merkez',
    x: 82,
    y: 30,
    lines: ['M5'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'umraniye',
    name: 'Ümraniye',
    x: 70,
    y: 32,
    lines: ['M5'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'parseller',
    name: 'Parseller',
    x: 80,
    y: 24,
    lines: ['M8'],
    continent: 'AS',
    stepFree: true,
  },
  {
    id: 'bostanci-m8',
    name: 'Küçükbakkalköy',
    x: 74,
    y: 36,
    lines: ['M8'],
    continent: 'AS',
    stepFree: true,
  },
];

export const LINES: Line[] = [
  {
    id: 'MR',
    name: 'Marmaray',
    kind: 'rail',
    colour: 'var(--line-marmaray)',
    stations: 43,
    route: [
      'halkali',
      'bakirkoy',
      'kazlicesme',
      'yenikapi',
      'sirkeci',
      'uskudar',
      'ayrilik-cesmesi',
      'sogutlucesme',
      'bostanci',
      'pendik',
      'gebze',
    ],
  },
  {
    id: 'M1A',
    name: 'M1A',
    kind: 'metro',
    colour: 'var(--line-m1)',
    stations: 23,
    route: ['ataturk', 'otogar', 'yenikapi'],
  },
  {
    id: 'M1B',
    name: 'M1B',
    kind: 'metro',
    colour: 'var(--line-m1)',
    stations: 13,
    route: ['kirazli', 'otogar', 'yenikapi'],
  },
  {
    id: 'M2',
    name: 'M2',
    kind: 'metro',
    colour: 'var(--line-m2)',
    stations: 16,
    route: [
      'yenikapi',
      'vezneciler',
      'sishane',
      'taksim',
      'mecidiyekoy',
      'gayrettepe',
      'levent',
      'hacisoman',
    ],
  },
  {
    id: 'M3',
    name: 'M3',
    kind: 'metro',
    colour: 'var(--line-m3)',
    stations: 20,
    route: ['bakirkoy', 'kirazli', 'mahmutbey', 'olimpiyat', 'kayasehir'],
  },
  {
    id: 'M4',
    name: 'M4',
    kind: 'metro',
    colour: 'var(--line-m4)',
    stations: 24,
    route: ['kadikoy', 'ayrilik-cesmesi', 'unalan', 'kozyatagi', 'kartal', 'sabiha'],
  },
  {
    id: 'M5',
    name: 'M5',
    kind: 'metro',
    colour: 'var(--line-m5)',
    stations: 20,
    route: ['uskudar', 'umraniye', 'samandira'],
  },
  {
    id: 'M6',
    name: 'M6',
    kind: 'metro',
    colour: 'var(--line-m6)',
    stations: 4,
    route: ['levent', 'hisarustu'],
  },
  {
    id: 'M7',
    name: 'M7',
    kind: 'metro',
    colour: 'var(--line-m7)',
    stations: 19,
    route: ['yildiz', 'mecidiyekoy', 'mahmutbey'],
  },
  {
    id: 'M8',
    name: 'M8',
    kind: 'metro',
    colour: 'var(--line-m8)',
    stations: 13,
    route: ['bostanci', 'bostanci-m8', 'unalan', 'parseller'],
  },
  {
    id: 'M9',
    name: 'M9',
    kind: 'metro',
    colour: 'var(--line-m9)',
    stations: 12,
    route: ['atakoy', 'olimpiyat'],
  },
  {
    id: 'M11',
    name: 'M11',
    kind: 'metro',
    colour: 'var(--line-m11)',
    stations: 9,
    route: ['gayrettepe', 'ist-havalimani'],
  },
  {
    id: 'T1',
    name: 'T1',
    kind: 'tram',
    colour: 'var(--line-t1)',
    stations: 31,
    route: ['kazlicesme', 'sirkeci', 'karakoy'],
  },
  {
    id: 'F2',
    name: 'Tünel',
    kind: 'funicular',
    colour: 'var(--line-f2)',
    stations: 2,
    route: ['karakoy', 'sishane'],
  },
];

export const nodeById = new Map(NODES.map((n) => [n.id, n]));
export const lineById = new Map(LINES.map((l) => [l.id, l]));

/** Stations calling more than one line. Drawn larger; they are the decisions. */
export const INTERCHANGES = NODES.filter((n) => n.lines.length > 1);

/** Total stations across the real network, from the line records above. */
export const DRAWN_STATIONS = NODES.length;

// ---------------------------------------------------------------------------
// The graph, for the journey planner
// ---------------------------------------------------------------------------

export interface Edge {
  to: string;
  line: string;
  /** Indicative running time in minutes between two drawn nodes. */
  minutes: number;
}

/**
 * Adjacency, built from the routes.
 *
 * Times come from real distance and the service's real average speed, not from
 * the drawing. They used to be scaled off the schematic, which was fine while
 * the schematic was the only geometry we had — but it made the planner quote
 * Halkalı to Sabiha Gökçen in forty-seven minutes for seventy kilometres, an
 * average of ninety km/h on a metro. Real coordinates fixed the distance; this
 * fixes the time that follows from it.
 *
 * Still indicative, and still said to be. A real timetable has peak and
 * off-peak, junction conflicts and turnround allowances; this has an average.
 */
export const GRAPH: Map<string, Edge[]> = (() => {
  const g = new Map<string, Edge[]>();
  const add = (from: string, e: Edge) => {
    const list = g.get(from) ?? [];
    list.push(e);
    g.set(from, list);
  };
  for (const line of LINES) {
    for (let i = 0; i < line.route.length - 1; i++) {
      const a = nodeById.get(line.route[i]!)!;
      const b = nodeById.get(line.route[i + 1]!)!;
      const minutes = minutesFor(railKm(a.id, b.id), line.kind);
      add(a.id, { to: b.id, line: line.id, minutes });
      add(b.id, { to: a.id, line: line.id, minutes });
    }
  }
  return g;
})();
