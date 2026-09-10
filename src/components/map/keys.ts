/**
 * Every string `NetworkMap` can render.
 *
 * The map is an island: it gets a plain object of resolved strings rather than
 * the translator, so the dictionary does not have to be shipped to the browser.
 * That works exactly as long as whoever mounts it hands over the right keys.

 * It stopped working the moment the journey planner started mounting the same
 * component. The planner had its own list — the twenty-odd strings a planner
 * says — so the map came up with a nameless station card and empty chips where
 * "ASIA" and "Step-free: Yes" should have been. Nothing failed; the strings
 * were simply not there.
 *
 * One list, imported by both pages, is the fix. A key added for the map is now
 * a key the planner gets too, without anybody having to remember.
 */
export const MAP_KEYS = [
  'reg.label',
  'reg.diagram',
  'reg.geographic',
  'reg.section',
  'map.stepFree',
  'map.alt',
  'map.geoCaveat',
  'map.sectionCaveat',
  'map.click',
  'map.tableToggle',
  'map.tableCaption',
  'map.station',
  'map.lines',
  'map.continent',
  'map.access',
  'map.yes',
  'map.no',
  'map.notAll',
  'map.pickPrompt',
  'map.source',
  'map.zoom',
  'map.zoomIn',
  'map.zoomOut',
  'map.reset',
  'map.drag',
  'map.centre',
  'map.lineDetails',
  'map.lineStations',
  'map.lineDrawn',
  'map.lineDrawnNote',
  'map.lineRoute',
  'map.lineMeets',
  'map.linesHeading',
  'kind.metro',
  'kind.rail',
  'kind.tram',
  'kind.funicular',
  'x.stations',
  // the station card
  'map.openStation',
  'map.close',
  'map.calls',
  'map.depth',
  'map.notOnLine',
  'map.otherSide',
  'map.hereAlready',
  'map.coords',
  'map.planFrom',
  'map.faresFrom',
  'plan.duration',
  'plan.changes',
  'plan.fare',
  'x.km',
  'x.min',
  'j.europe',
  'j.asia',
] as const;
