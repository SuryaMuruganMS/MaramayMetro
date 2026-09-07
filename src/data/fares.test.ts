import { describe, it, expect } from 'vitest';
import { findRoute } from '../lib/route.ts';
import { railKm, RAIL_FACTOR, chordKm } from '../lib/geo.ts';
import { MARMARAY_ROUTE } from './geography.ts';
import {
  fareFor,
  legKurus,
  bandFor,
  PASSENGERS,
  PAYING,
  FREE_PASSES,
  FLAT_KURUS,
  MR_BOARD_KURUS,
  MR_PER_KM_KURUS,
  MR_CAP_KURUS,
  TRANSFER_RATE,
} from './fares.ts';
import { NODES } from './network.ts';

/**
 * These tests guard two different things.
 *
 * The arithmetic ones are ordinary: a total is the sum of its parts, a discount
 * is applied once, nothing goes negative.
 *
 * The others guard a PROMISE. This site tells the reader that the fares are
 * invented and that the structure is real, and several of the tests below exist
 * to make sure a later edit cannot quietly break that deal — that the cap
 * really is the end-to-end price, that a free pass really is free everywhere
 * rather than free on short journeys, and that no station is left without a
 * price because the graph could not reach it.
 */

describe('distance scale', () => {
  it('calibrates against the one length we know exactly', () => {
    // Marmaray is 76.6 km, so summing the spine at this scale must return it.
    let km = 0;
    for (let i = 0; i < MARMARAY_ROUTE.length - 1; i++) {
      km += railKm(MARMARAY_ROUTE[i]!, MARMARAY_ROUTE[i + 1]!);
    }
    expect(km).toBeCloseTo(76.6, 6);
  });

  it('makes track longer than the straight line, but not absurdly so', () => {
    // A factor under 1 would mean the trains cut corners; much over 1.3 would
    // mean the station coordinates are wrong rather than the track being bendy.
    expect(RAIL_FACTOR).toBeGreaterThan(1);
    expect(RAIL_FACTOR).toBeLessThan(1.3);
  });

  it('measures real ground distances', () => {
    // Sirkeci to Üsküdar is the crossing itself: a shade over three kilometres
    // of Bosphorus, which is a figure anybody can check on a map.
    expect(chordKm('sirkeci', 'uskudar')).toBeGreaterThan(2.8);
    expect(chordKm('sirkeci', 'uskudar')).toBeLessThan(3.8);
    // Halkalı to Gebze as the crow flies is well short of the railway's 76.6.
    expect(chordKm('halkali', 'gebze')).toBeGreaterThan(50);
    expect(chordKm('halkali', 'gebze')).toBeLessThan(70);
  });
});

describe('leg pricing', () => {
  it('charges a flat fare off Marmaray, whatever the distance', () => {
    expect(legKurus('M2', 1)).toBe(FLAT_KURUS);
    expect(legKurus('M2', 40)).toBe(FLAT_KURUS);
  });

  it('charges boarding plus distance on Marmaray', () => {
    expect(legKurus('MR', 0)).toBe(MR_BOARD_KURUS);
    expect(legKurus('MR', 10)).toBe(MR_BOARD_KURUS + 10 * MR_PER_KM_KURUS);
  });

  it('caps at the price of the whole railway', () => {
    expect(legKurus('MR', 76.6)).toBe(MR_CAP_KURUS);
    expect(legKurus('MR', 500)).toBe(MR_CAP_KURUS);
  });

  it('sets the cap exactly where the full run lands, not above or below it', () => {
    // If someone changes the per-km rate without moving the cap, the cap either
    // bites early - charging short journeys the maximum - or never bites at all.
    const full = MR_BOARD_KURUS + Math.round(76.6 * MR_PER_KM_KURUS);
    expect(full).toBe(MR_CAP_KURUS);
  });
});

describe('a priced journey', () => {
  it('totals to the sum of its legs', () => {
    const route = findRoute('halkali', 'sabiha')!;
    const fare = fareFor(route, 'full');
    expect(fare.legs.length).toBeGreaterThan(1);
    expect(fare.kurus).toBe(fare.legs.reduce((n, l) => n + l.kurus, 0));
  });

  it('charges the first ride in full and later ones down the ladder', () => {
    const route = findRoute('halkali', 'sabiha')!;
    const fare = fareFor(route, 'full');
    expect(fare.legs[0]!.rate).toBe(100);
    expect(fare.legs[0]!.isTransfer).toBe(false);
    for (let i = 1; i < fare.legs.length; i++) {
      expect(fare.legs[i]!.isTransfer).toBe(true);
      expect(fare.legs[i]!.rate).toBe(TRANSFER_RATE[Math.min(i - 1, TRANSFER_RATE.length - 1)]);
    }
  });

  it('never makes a change cost more than the ride before it', () => {
    for (let i = 1; i < TRANSFER_RATE.length; i++) {
      expect(TRANSFER_RATE[i]!).toBeLessThanOrEqual(TRANSFER_RATE[i - 1]!);
    }
    expect(TRANSFER_RATE[0]!).toBeLessThan(100);
  });

  it('charges a student less than an adult for the same journey', () => {
    const route = findRoute('yenikapi', 'gebze')!;
    expect(fareFor(route, 'student').kurus).toBeLessThan(fareFor(route, 'full').kurus);
    expect(fareFor(route, 'student').kurus).toBeLessThan(fareFor(route, 'teacher').kurus);
  });

  it('charges nothing at all to a free pass, on every journey there is', () => {
    // Free is an entitlement, not a small number. A journey that costs a free
    // pass one kuruş anywhere on the network is a bug in the tariff, not a
    // rounding artefact, so this checks the whole matrix rather than a sample.
    for (const p of FREE_PASSES) {
      for (const a of NODES) {
        for (const b of NODES) {
          if (a.id === b.id) continue;
          const route = findRoute(a.id, b.id);
          if (!route) continue;
          expect(fareFor(route, p.id).kurus).toBe(0);
        }
      }
    }
  });

  it('still reports what a free journey would have cost', () => {
    const route = findRoute('halkali', 'gebze')!;
    const fare = fareFor(route, 'senior');
    expect(fare.free).toBe(true);
    expect(fare.kurus).toBe(0);
    expect(fare.fullKurus).toBeGreaterThan(0);
  });

  it('is never negative and never free by accident', () => {
    for (const p of PAYING) {
      for (const a of NODES) {
        for (const b of NODES) {
          if (a.id === b.id) continue;
          const route = findRoute(a.id, b.id);
          if (!route) continue;
          const fare = fareFor(route, p.id);
          expect(fare.kurus).toBeGreaterThan(0);
          expect(fare.free).toBe(false);
        }
      }
    }
  });

  it('prices the longest journey on the network above the shortest', () => {
    const short = fareFor(findRoute('uskudar', 'ayrilik-cesmesi')!, 'full');
    const long = fareFor(findRoute('halkali', 'gebze')!, 'full');
    expect(long.kurus).toBeGreaterThan(short.kurus);
  });

  it('charges the cap, and only the cap, for the full railway', () => {
    const fare = fareFor(findRoute('halkali', 'gebze')!, 'full');
    expect(fare.legs).toHaveLength(1);
    expect(fare.kurus).toBe(MR_CAP_KURUS);
  });
});

describe('passenger table', () => {
  it('has exactly one full-fare reference', () => {
    expect(PASSENGERS.filter((p) => p.rate === 100)).toHaveLength(1);
  });

  it('splits cleanly into paying and free, with nothing in between', () => {
    expect(PAYING.length + FREE_PASSES.length).toBe(PASSENGERS.length);
    for (const p of PAYING) expect(p.rate).toBeGreaterThan(0);
    for (const p of FREE_PASSES) expect(p.rate).toBe(0);
  });

  it('gives every passenger type a dictionary key rather than a literal name', () => {
    for (const p of PASSENGERS) expect(p.key.startsWith('fare.')).toBe(true);
  });
});

describe('distance bands', () => {
  it('covers the line without a gap or an overlap', () => {
    expect(bandFor(0).id).toBe('b1');
    expect(bandFor(4.9).id).toBe('b1');
    expect(bandFor(5).id).toBe('b2');
    expect(bandFor(76.6).id).toBe('b5');
    expect(bandFor(1000).id).toBe('b5');
  });

  it('names every band from the dictionary', () => {
    const seen = new Set<string>();
    for (let km = 0; km <= 90; km += 0.5) seen.add(bandFor(km).id);
    expect(seen.size).toBe(5);
  });
});

describe('coverage', () => {
  it('can price a journey from every station to every other one', () => {
    // If a station is unreachable the fares table renders a blank row, which
    // reads as "free" rather than "we could not work it out".
    const unreachable: string[] = [];
    for (const a of NODES) {
      for (const b of NODES) {
        if (a.id === b.id) continue;
        if (!findRoute(a.id, b.id)) unreachable.push(`${a.id}->${b.id}`);
      }
    }
    expect(unreachable).toEqual([]);
  });
});
