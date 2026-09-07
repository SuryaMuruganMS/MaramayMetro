import { CH_END, clampCh } from './chainage.ts';

/**
 * Where in the train you are.
 *
 * The crossing already maps scroll to distance along the tunnel. This maps the
 * same scroll to distance along the TRAIN: at Kazlıçeşme you are in the leading
 * cab, and by Söğütlüçeşme you have walked the whole formation to the trailing
 * one. One gesture, two journeys — through the tunnel and through the train.
 *
 * It costs nothing and it earns the readout: a bar at the bottom naming your
 * compartment is only interesting if the compartment actually changes.
 *
 * The formation is a real one. Five cars, driving cabs at both ends so the
 * train reverses without turning, open gangways between, a bogie under each car
 * end, and one pantograph on the roof of the centre car.
 */

export type PartId = 'cab' | 'doors' | 'saloon' | 'gangway' | 'bogie' | 'pantograph';

export interface Part {
  id: PartId;
  /** Dictionary key for the name shown to the reader. */
  key: string;
  /** Which car of five this part belongs to, 1-5. */
  car: number;
  /** Share of the walk this part occupies. Relative, normalised below. */
  weight: number;
}

/**
 * Front to back. Weights are roughly proportional to how much of a real train's
 * length each part takes up: a saloon is most of a car, a gangway is a stride.
 */
export const FORMATION: Part[] = [
  { id: 'cab', key: 'car.cab', car: 1, weight: 2.0 },
  { id: 'doors', key: 'car.doors', car: 1, weight: 1.0 },
  { id: 'saloon', key: 'car.saloon', car: 1, weight: 3.4 },
  { id: 'bogie', key: 'car.bogie', car: 1, weight: 1.0 },
  { id: 'gangway', key: 'car.gangway', car: 2, weight: 0.8 },
  { id: 'saloon', key: 'car.saloon2', car: 2, weight: 3.4 },
  { id: 'doors', key: 'car.doors', car: 2, weight: 1.0 },
  { id: 'gangway', key: 'car.gangway', car: 3, weight: 0.8 },
  { id: 'pantograph', key: 'car.pantograph', car: 3, weight: 2.6 },
  { id: 'saloon', key: 'car.saloon', car: 3, weight: 2.6 },
  { id: 'gangway', key: 'car.gangway', car: 4, weight: 0.8 },
  { id: 'bogie', key: 'car.bogie', car: 4, weight: 1.0 },
  { id: 'saloon', key: 'car.saloon2', car: 4, weight: 3.4 },
  { id: 'doors', key: 'car.doors', car: 4, weight: 1.0 },
  { id: 'gangway', key: 'car.gangway', car: 5, weight: 0.8 },
  { id: 'saloon', key: 'car.saloon', car: 5, weight: 3.4 },
  { id: 'cab', key: 'car.cab', car: 5, weight: 2.0 },
];

export const CARS = 5;

const TOTAL = FORMATION.reduce((n, p) => n + p.weight, 0);

/** Cumulative start of each part, as a fraction of the whole walk. */
export const PART_STARTS: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (const p of FORMATION) {
    out.push(acc / TOTAL);
    acc += p.weight;
  }
  return out;
})();

export interface Where {
  part: Part;
  index: number;
  /** 0 at the front of the train, 1 at the back. */
  along: number;
  /** 0 at the start of this part, 1 at its end. */
  within: number;
}

/** Which part of the train the given chainage puts you in. */
export function partAt(ch: number): Where {
  const along = clampCh(ch) / CH_END;
  for (let i = FORMATION.length - 1; i >= 0; i--) {
    if (along >= PART_STARTS[i]! || i === 0) {
      const start = PART_STARTS[i]!;
      const end = i + 1 < FORMATION.length ? PART_STARTS[i + 1]! : 1;
      const span = end - start;
      return {
        part: FORMATION[i]!,
        index: i,
        along,
        within: span === 0 ? 0 : Math.min(1, Math.max(0, (along - start) / span)),
      };
    }
  }
  return { part: FORMATION[0]!, index: 0, along, within: 0 };
}
