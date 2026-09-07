import type { APIRoute } from 'astro';
import { HULLS, LAYERS } from '../../data/strata.ts';
import { DIG } from '../../data/alignment.ts';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        note: 'Yenikapı excavation. Layer order and date ranges follow the published record; boundary depths are indicative readings of section drawings.',
        headline: {
          artefacts: DIG.artefacts.value,
          hulls: DIG.hulls.value,
          oldestBCE: DIG.oldestBCE.value,
        },
        layers: LAYERS.map((l) => ({
          id: l.id,
          depthM: l.depthM,
          years: l.years,
          tr: l.tr,
          en: l.en,
        })),
        catalogued: HULLS,
      },
      null,
      2,
    ),
    { headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
