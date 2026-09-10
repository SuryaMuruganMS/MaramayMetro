/**
 * English — the reference dictionary.
 *
 * Every other language is checked against this one's key set by
 * `src/i18n/i18n.test.ts`, so a gap fails the build rather than rendering a raw
 * key at a reader.
 *
 * Register: a public body writing to the people who use its railway. Plain,
 * specific, no marketing voice. "Trains are not running" beats "service is
 * currently experiencing an interruption".
 */
export const en = {
  // ------------------------------------------------------------------ identity
  'site.name': 'Boğaziçi Hattı',
  'site.full': 'Boğaziçi Hattı — the Bosphorus Line',
  'site.sub': 'B1 · İSTANBUL',
  'theme.label': 'Theme',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.toLight': 'Switch to the light theme',
  'theme.toDark': 'Switch to the dark theme',
  'site.tagline': 'Europe to Asia, sixty metres under the Bosphorus.',
  'site.description':
    'The central tunnel section of the Marmaray: 13.6 kilometres, six stations, and an immersed tube 60 metres below sea level.',

  // ---------------------------------------------------------------- disclosure
  'disclosure.label': 'Concept build',
  'disclosure.body':
    'A design demonstration, not affiliated with Metro İstanbul, TCDD or İETT. For real service and fare information, use the official site.',
  'disclosure.link': 'Official site',

  // ----------------------------------------------------------------------- nav
  'nav.journey': 'The crossing',
  'nav.map': 'Map',
  'nav.dig': 'The dig',
  'nav.plan': 'Journey planner',
  'nav.fares': 'Fares',
  'nav.travel': 'Travelling',
  'nav.access': 'Accessibility',
  'nav.build': 'How it was built',
  'nav.tunel': 'Tünel 1875',
  'nav.data': 'Open data',
  'nav.colours': 'Colours',
  'nav.skip': 'Skip to content',

  // ------------------------------------------------------------------ controls
  'ctl.service': 'Service',
  'ctl.day': 'Day',
  'ctl.night': 'Night',
  'ctl.view': 'View',
  'ctl.section': 'Section',
  'ctl.planview': 'Plan view',
  'ctl.lang': 'Language',
  'ctl.langPick': 'Choose a language',

  // ------------------------------------------------------------------- readout
  'ro.chainage': 'CH',
  'ro.level': 'LEVEL',
  'ro.grade': 'GRADE',
  'ro.element': 'ELEMENT',
  'ro.overhead': 'OVERHEAD',
  'ro.car': 'CAR',
  'ro.rock': 'ground',
  'ro.water': 'water',

  // ------------------------------------------------------------------- journey
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
  'j.record': 'Download your crossing record',
  'j.stepFree': 'Step-free access',
  'j.interchange': 'Interchange',

  // -------------------------------------------------------- where you are sat
  'car.title': 'Where you are',
  'car.cab': 'Driving cab',
  'car.saloon': 'Saloon, car 1',
  'car.saloon2': 'Saloon, car 2',
  'car.gangway': 'Gangway between cars',
  'car.doors': 'Door vestibule',
  'car.bogie': 'Over the bogie',
  'car.pantograph': 'Under the pantograph',

  // ----------------------------------------------------------------------- dig
  'dig.title': 'The Yenikapı excavation',
  'dig.lede':
    'Digging this station opened a section through eight and a half thousand years of the city.',
  'dig.scrollDown': 'Go down',
  // ----------------------------------------------------------------- the finds
  'find.title': 'What came out of the ground',
  'find.lede':
    'The strata above run downwards, because at Yenikapı depth is time. This runs across: not what was underneath, but what was carried out of it.',
  'find.cue': 'Scroll on — the finds move past',
  'find.of': 'of',
  'find.layer': 'Layer:',
  'find.imagery': 'Imagery generated for this concept build. The record it illustrates is not.',

  'find.harbour.period': '4th – 12th century',
  'find.harbour.title': 'The Theodosian Harbour',
  'find.harbour.body':
    'Constantinople’s grain port, cut into the shore south of the Lycus valley in the late fourth century. For eight hundred years the city ate through it. Then the river silted the basin faster than anyone could dredge it, the quays were abandoned, and the harbour became market gardens.',
  'find.harbour.stat': 'years in use',

  'find.hulls.period': '5th – 11th century',
  'find.hulls.title': 'Thirty-seven ships',
  'find.hulls.body':
    'The largest group of medieval vessels ever excavated anywhere. Round-hulled merchantmen that carried grain and wine, sunk at their moorings or abandoned in the silt, each one a snapshot of how a shipwright worked in the century it was built.',
  'find.hulls.stat': 'hulls recovered',

  'find.galleys.period': '10th – 11th century',
  'find.galleys.title': 'The war galleys',
  'find.galleys.body':
    'Among the merchantmen were long, narrow oared hulls — the first Byzantine warships ever found. Until they came out of this mud, the navy that held the city for a thousand years was known only from written accounts and pictures of it.',
  'find.galleys.stat': 'galleys, the first ever found',

  'find.mud.period': 'Sealed, undisturbed',
  'find.mud.title': 'What the mud kept',
  'find.mud.body':
    'Harbour silt holds no oxygen, and without oxygen nothing rots. So the things that never survive survived: coils of rope, leather sandals with the stitching intact, wooden combs, baskets, a shipwright’s tools. Ordinary objects, which is exactly why almost none of them exist anywhere else.',
  'find.mud.stat': 'artefacts, roughly',

  'find.neolithic.period': 'c. 6500 BCE',
  'find.neolithic.title': 'Below the harbour',
  'find.neolithic.body':
    'Under the Byzantine silt the diggers reached a shoreline older than the sea that covered it: post-holes, hearths, burials, and footprints pressed into wet ground by people who lived here four thousand years before the first walls of the city.',
  'find.neolithic.stat': 'years of settlement',

  'find.station.period': '2004 – 2013',
  'find.station.title': 'The station above it',
  'find.station.body':
    'The excavation stopped the railway for about four years. Yenikapı opened as the interchange between Marmaray and two metro lines, with part of what was found displayed in the concourse — passengers walk over the harbour every morning.',
  'find.station.stat': 'years of delay',
  'dig.scrollRight': 'Travel back — scroll to go deeper and further into the past',
  'dig.present': 'Today',
  'dig.ships': 'ships',
  'dig.artefacts': 'artefacts',
  'dig.place': 'Yenikapı',
  'dig.k.artefacts': 'Artefacts',
  'dig.k.hulls': 'Hulls',
  'dig.k.oldest': 'Oldest layer',
  'dig.k.delay': 'Delay',
  'dig.v.delay': '~4 years',
  'dig.depthAxis': 'DEPTH',
  'dig.periodAxis': 'PERIOD',
  'dig.bce': '{n} BCE',
  'dig.century': 'c.',
  'dig.moreHulls': 'and {n} more hulls, not individually catalogued here',
  'dig.why': 'Why the railway was late',
  'dig.whyBody':
    'The excavation delayed the project by about four years. On most infrastructure jobs that would be indefensible; here it bought a vertical section through eight and a half thousand years of the city and close to a hundred thousand artefacts. Publishing what the delay was for is more useful than burying it.',
  'dig.respect':
    'Human remains were recovered during the excavation. They are not illustrated on this page. They are recorded as a fact and left there.',
  'dig.back': 'Back to the crossing',

  // ----------------------------------------------------------------------- map
  'reg.label': 'Map register',
  'reg.diagram': 'Diagram',
  'reg.geographic': 'Geographic',
  'reg.section': 'Section',
  'map.title': 'Network map',
  'map.lede':
    'One network, three readings. The diagram throws away geography so the decisions are legible; the geographic register puts every station back on the real coastline; the section is the Marmaray’s true vertical alignment.',
  'map.stepFree': 'Step-free stations only',
  'map.alt': 'The İstanbul rail network: eleven metro lines, Marmaray, tram and the Tünel.',
  'map.geoCaveat':
    'Coastline and station positions are OpenStreetMap\u2019s. The coast is simplified to about a hundred metres; each station is its own platform\u2019s coordinates.',
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
    'This diagram carries the termini and every interchange — the stops a passenger makes a decision at. Intermediate stations are counted but not drawn.',
  'map.click': 'Select any station to open it',
  'map.close': 'Close',
  'map.openStation': 'Station details',
  'map.zone': 'Fare zone',
  'map.opened': 'Opened',
  'map.depth': 'Platform level',
  'map.connections': 'Connections',
  'map.planFrom': 'Plan a journey from here',
  'map.calls': 'Lines calling here',
  'map.otherSide': 'Across the Bosphorus',
  'map.otherSideBody': 'The shortest way from this station to the other continent.',
  'map.coords': 'Coordinates',
  'map.faresFrom': 'Fares from here',
  'map.notOnLine': 'Not on the Marmaray central tunnel, so there is no level for it here.',
  'map.hereAlready': 'This station is on the crossing itself.',
  'map.linesHeading': 'Lines',
  'map.drawnNote':
    'The network has {all} stations; {drawn} are drawn here, including all {interchanges} interchanges.',
  'map.pickPrompt': 'Select a station on the map to open it.',
  'map.source': 'Geography: OpenStreetMap contributors, ODbL.',

  // ------------------------------------------------------------------- planner
  'plan.title': 'Journey planner',
  'plan.lede':
    'Pick two stations. It finds the shortest path across the network, the interchanges, the fare, and the deepest point you pass through.',
  'plan.from': 'From',
  'plan.to': 'To',
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
  'plan.fare': 'Fare',
  'plan.passenger': 'Passenger',
  'plan.zones': 'Zones crossed',
  'plan.firstTap': 'First tap',
  'plan.transfers': 'Transfers',
  'plan.travelsFree': 'This pass travels free. The full fare is shown for comparison.',
  'plan.fareBreak': 'How the fare is made up',
  'plan.ride': 'Ride',
  'plan.fareNote': 'Fictional fare.',
  'plan.fullFare': 'At full fare',

  // --------------------------------------------------------------------- fares
  'fare.title': 'Fares',
  'fare.lede':
    'Every station, every passenger type. Payment is by İstanbulkart, tapped at the gate.',
  'fare.full': 'Full',
  'fare.student': 'Student',
  'fare.child': 'Child (under 7)',
  'fare.senior': '65 and over',
  'fare.teacher': 'Teacher',
  'fare.disabled': 'Disabled pass',
  'fare.transfer': 'Transfer discount',
  'fare.transferBody':
    'Changes made within 120 minutes of the first tap are charged at a reduced rate, and the discount deepens with each further change in that window. The rule is how the real network works.',
  'fare.card': 'İstanbulkart',
  'fare.cardBody':
    'One card for the whole network. Bought and topped up at station machines and kiosks, and tapped at the gate on entry and exit.',
  'fare.fictional': 'These prices are fictional',
  'fare.fictionalBody':
    'The amounts on this page are invented for a design demonstration. They are modelled on how the real tariff is structured — a base fare by passenger type, distance bands on Marmaray, and a sliding transfer discount — but no figure here is a real fare and none of them is kept up to date. Check the official site before you travel.',
  'fare.info': 'About these prices',
  'fare.perStation': 'Fare from each station',
  'fare.zone': 'Zone',
  'fare.base': 'Base fare',
  'fare.band': 'Distance band',
  'fare.free': 'Free',
  'fare.table': 'Fare table',
  'fare.pickOrigin': 'Fares from',
  'fare.works': 'How the fare is worked out',
  'fare.flat': 'Flat fare',
  'fare.flatBody':
    'One price for a metro, tram or funicular ride, however far you go. Tap once, at the gate on the way in.',
  'fare.distance': 'Distance fare',
  'fare.distanceBody':
    'Marmaray charges by how far you travel: a boarding charge, then an amount for each kilometre, up to a ceiling set at the price of the whole railway end to end.',
  'fare.tapOut': 'Tap out as well as in',
  'fare.tapOutBody':
    'This is why the Marmaray gates read your card twice and the metro gates read it once. A gate cannot know what to charge until it knows where you got off.',
  'fare.freeTitle': 'Three passes travel free',
  'fare.freeBody':
    'Over-65s, children under seven and holders of a disabled pass travel without paying. This is not a discount applied to a fare — there is no fare to apply it to.',
  'fare.boarding': 'Boarding charge',
  'fare.perKm': 'Each kilometre',
  'fare.cap': 'Most you can pay',
  'fare.capNote':
    'The ceiling is the price of the full Halkalı–Gebze run, so nobody pays more than the whole railway costs.',
  'fare.rate': 'Share of full fare',
  'fare.ladder': 'Transfer ladder',
  'fare.change1': 'First change',
  'fare.change2': 'Second change',
  'fare.change3': 'Third change',
  'fare.change4': 'Fourth change onward',
  'fare.window': 'Within 120 minutes of the first tap',
  'fare.to': 'To',
  'fare.origin': 'Fares from this station',
  'fare.noRoute': 'no route',
  'fare.changesCol': 'Changes',
  'fare.tariff': 'The tariff',
  'fare.passengers': 'Passenger types',
  'fare.bandsNote':
    'The tariff is continuous, not banded. These names describe a journey in words; they do not change what it costs.',
  'fare.band1': 'Local',
  'fare.band2': 'Short',
  'fare.band3': 'Medium',
  'fare.band4': 'Long',
  'fare.band5': 'End to end',

  // ----------------------------------------------------------------- travelling
  'travel.title': 'Travelling on the metro',
  'travel.lede':
    'How to use the railway, what the train is made of, and what to do when something goes wrong.',
  'travel.how': 'Making a journey',
  'travel.howBody':
    'Buy or top up an İstanbulkart at a machine in the station hall. Tap the card on the reader at the gate to enter. On Marmaray you also tap on the way out, because the fare depends on how far you went. Stand clear of the platform edge behind the tactile strip, let passengers off before boarding, and move down inside the car rather than crowding the doors.',
  'travel.safety': 'Safety',
  'travel.safetyBody':
    'Every car has a passenger emergency intercom that speaks directly to the driver, and a door release for use only when the train is stopped and staff have told you to. Pulling either while running between stations makes things worse: a train stopped inside a tunnel is far harder to evacuate than one that reaches the next platform.',
  'travel.parts': 'Parts of the train',
  'travel.partsBody':
    'A Marmaray set is several cars joined by open gangways, so you can walk the whole length. Under the floor at each end of a car sits a bogie carrying the wheels, suspension and traction motors. Above, the pantograph collects current from the overhead line. The driving cab is at each end, so the train reverses without turning round.',
  'travel.cab': 'The cab',
  'travel.cabBody':
    'The driver faces a traction and brake controller, a train management screen showing door state and traction, and the signalling display that tells them their permitted speed. The dead man’s device requires constant pressure and applies the brakes if it is released. Marmaray runs under automatic train protection: the signalling system will brake the train itself if the driver does not.',
  'travel.rules': 'Rules',
  'travel.rule1': 'Tap in and tap out. On Marmaray the fare depends on distance.',
  'travel.rule2': 'Give up priority seats to those who need them.',
  'travel.rule3': 'No smoking anywhere in the station or on the train, including e-cigarettes.',
  'travel.rule4': 'Keep behind the tactile strip until the train has stopped.',
  'travel.rule5': 'Bicycles at off-peak times only; folding bicycles at any time.',
  'travel.rule6': 'Eating and drinking are discouraged, and prohibited on the platform edge.',
  'travel.diagram': 'Train formation',
  'travel.cabAlt': 'The driving position of a modern electric commuter train.',
  'travel.partsAlt': 'A commuter train in section, showing bogies, gangways and pantograph.',

  // ---------------------------------------------------------------- opening
  'open.tunnel': 'Tunnel',
  'open.deepest': 'Deepest point',
  'open.immersed': 'Immersed tube',
  'open.network': 'Network',

  // ---------------------------------------------------------- accessibility
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

  // ----------------------------------------------------------------- build
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

  // ----------------------------------------------------------------- tünel
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

  // --------------------------------------------------------------- colours
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

  // --------------------------------------------------------------- sources
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

  // ------------------------------------------------------------- open data
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

  // --------------------------------------------------------- service board
  'svc.checking': 'Checking the clock…',
  'svc.running': 'Marmaray is running now.',
  'svc.shut': 'Marmaray is closed now.',
  'svc.istanbul': 'İSTANBUL',
  'svc.first': 'first train',
  'svc.modelled':
    'Departure times are modelled — a fixed headway across the service window, not a timetable.',

  // ------------------------------------------------------------------ misc
  'band.surface': 'Surface',
  'band.shallow': 'Shallow',
  'band.deep': 'Deep',
  'band.seabed': 'Seabed',
  'band.abyssal': 'Abyssal',
  'pig.cobalt': 'Cobalt',
  'pig.turquoise': 'Turquoise',
  'pig.bole': 'Bole red',
  'pig.gold': 'Gold',
  'pig.use.cobalt': 'Structure',
  'pig.use.turquoise': 'Water',
  'pig.use.bole': 'Accent',
  'pig.use.gold': 'Engineering record',
  'col.lines': 'Line colours',

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

export type Keys = keyof typeof en;
