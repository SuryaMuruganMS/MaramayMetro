import type { APIRoute } from 'astro';
import { LINES, NODES } from '../../data/network.ts';
import { GEO } from '../../data/geography.ts';

/**
 * The network graph, as a file.
 *
 * The open-data page links here, so it has to resolve to something real.
 * Prerendered at build time; this site has no server.
 */
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        note: 'Concept build by Continuum Studios. Not an official dataset. Drawn subset: termini and all interchanges.',
        locationSource: 'OpenStreetMap contributors, ODbL.',
        stations: NODES.map((n) => ({
          id: n.id,
          name: n.name,
          lines: n.lines,
          continent: n.continent,
          stepFree: n.stepFree,
          schematic: { x: n.x, y: n.y },
          // Real coordinates, from OpenStreetMap. The schematic pair above is a
          // drawing; this pair is where the platform is.
          location: GEO[n.id] ? { lat: GEO[n.id]!.lat, lon: GEO[n.id]!.lon } : null,
        })),
        lines: LINES.map((l) => ({
          id: l.id,
          name: l.name,
          kind: l.kind,
          stationsOnRealLine: l.stations,
          drawnRoute: l.route,
        })),
      },
      null,
      2,
    ),
    { headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
