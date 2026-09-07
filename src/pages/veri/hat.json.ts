import type { APIRoute } from 'astro';
import {
  CORRIDOR,
  DIVIDE_CH,
  ELEMENT_JOINTS,
  IMMERSED_END,
  IMMERSED_START,
  PROFILE,
  STOPS,
} from '../../data/alignment.ts';
import { SOURCES } from '../../data/sources.ts';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        note: 'Marmaray central tunnel section. Corridor figures are published engineering values; per-station chainage and level are indicative, scaled from the section drawing.',
        corridor: Object.fromEntries(
          Object.entries(CORRIDOR).map(([k, v]) => [
            k,
            {
              value: v.value,
              source: SOURCES[v.source].label,
              confidence: SOURCES[v.source].confidence,
            },
          ]),
        ),
        immersedTube: { startCh: IMMERSED_START, endCh: IMMERSED_END, joints: ELEMENT_JOINTS },
        continentalDivideCh: DIVIDE_CH,
        stations: STOPS.map((s) => ({
          id: s.id,
          name: s.name,
          ch: s.ch,
          levelM: s.level,
          continent: s.continent,
          stepFree: s.stepFree,
          confidence: SOURCES[s.source].confidence,
        })),
        verticalAlignment: PROFILE,
      },
      null,
      2,
    ),
    { headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
