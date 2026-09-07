import { describe, expect, it } from 'vitest';
import { GRAPH, LINES, NODES, lineById, nodeById } from './network.ts';

describe('the network graph', () => {
  it('has no dangling line reference on any node', () => {
    for (const n of NODES) {
      for (const l of n.lines) {
        expect(lineById.has(l), `${n.id} claims line ${l}`).toBe(true);
      }
    }
  });

  it('has no dangling node reference on any route', () => {
    for (const l of LINES) {
      for (const id of l.route) {
        expect(nodeById.has(id), `${l.id} routes through ${id}`).toBe(true);
      }
    }
  });

  it('agrees both ways: a route calling here means the node says so', () => {
    for (const l of LINES) {
      for (const id of l.route) {
        expect(nodeById.get(id)!.lines, `${id} vs ${l.id}`).toContain(l.id);
      }
    }
    for (const n of NODES) {
      for (const lid of n.lines) {
        expect(lineById.get(lid)!.route, `${lid} vs ${n.id}`).toContain(n.id);
      }
    }
  });

  it('is fully connected — every station reachable from every other', () => {
    const seen = new Set<string>(['yenikapi']);
    const queue = ['yenikapi'];
    while (queue.length) {
      for (const e of GRAPH.get(queue.pop()!) ?? []) {
        if (!seen.has(e.to)) {
          seen.add(e.to);
          queue.push(e.to);
        }
      }
    }
    const stranded = NODES.filter((n) => !seen.has(n.id)).map((n) => n.id);
    expect(stranded).toEqual([]);
  });

  it('is symmetric — every edge exists in both directions', () => {
    for (const [from, edges] of GRAPH) {
      for (const e of edges) {
        const back = (GRAPH.get(e.to) ?? []).find((x) => x.to === from && x.line === e.line);
        expect(back, `${from} -> ${e.to} on ${e.line} has no return`).toBeDefined();
        expect(back!.minutes).toBe(e.minutes);
      }
    }
  });

  it('never claims a hop takes no time', () => {
    for (const [, edges] of GRAPH) {
      for (const e of edges) expect(e.minutes).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps every node inside the drawing area, in both registers', () => {
    for (const n of NODES) {
      for (const [ax, ay] of [
        [n.x, n.y],
        [n.gx, n.gy],
      ]) {
        expect(ax).toBeGreaterThanOrEqual(0);
        expect(ax).toBeLessThanOrEqual(100);
        expect(ay).toBeGreaterThanOrEqual(0);
        expect(ay).toBeLessThanOrEqual(70);
      }
    }
  });

  it('puts Asian stations east of the strait in the schematic', () => {
    for (const n of NODES) {
      if (n.continent === 'AS') expect(n.x).toBeGreaterThan(52);
      else expect(n.x).toBeLessThan(54);
    }
  });
});
