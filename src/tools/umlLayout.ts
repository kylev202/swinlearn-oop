/**
 * Geometry for the class diagram: where the boxes go, and how the lines get
 * between them without crossing through anything.
 *
 * The first version of this put each inheritance depth on its own row, sorted
 * the row alphabetically, and drew every relation as one straight line from
 * centre to centre. That is fine for two classes and falls apart at five: the
 * lines cut across boxes, two relations between the same pair of rows land on
 * the same pixel, and the multiplicity sat wherever the midpoint happened to
 * be — often on top of another line.
 *
 * So the layout now does three things properly:
 *
 *   1. Rows are ordered by *barycentre* — a child sits under the average x of
 *      its parents — the standard Sugiyama ordering sweep. Children end up
 *      under their parents, which is how every lab handout draws it.
 *   2. Every edge gets its own **port** on the box edge. Ports are spread
 *      along the side in the order the neighbours appear, so two arrows into
 *      one class arrive at two distinct points instead of overlapping.
 *   3. Edges are routed **orthogonally** through the gap between rows, with
 *      each edge allocated a distinct channel in that gap. Labels are then
 *      placed on a known horizontal run of the path, so they can never sit on
 *      the line itself.
 */

import type { UmlClassBox, UmlModel, UmlRelation } from './uml';

/** Where a routed edge starts, turns, and ends. */
export interface RoutedEdge {
  rel: UmlRelation;
  /** Polyline in diagram coordinates, from the source box to the target box. */
  points: { x: number; y: number }[];
  /** Angle in degrees for the arrowhead at the target end. */
  endAngle: number;
  /** Anchor for the relation's own name, on a horizontal run where there is room. */
  labelAt?: { x: number; y: number };
  /** Anchor for the multiplicity, placed next to the source box as UML does. */
  multAt?: { x: number; y: number };
}

export interface LaidOutDiagram extends UmlModel {
  edges: RoutedEdge[];
}

const GAP_X = 64;
/** Tall enough to fit a routing channel per edge crossing the gap. */
const GAP_Y = 82;
const MARGIN = 28;
const CHANNEL = 11;
/** Keep ports off the box corners so the arrowhead has a flat edge to land on. */
const PORT_INSET = 16;

type Side = 'top' | 'bottom' | 'left' | 'right';

/**
 * Lay the boxes out in rows by inheritance depth, then route every relation.
 *
 * `boxes` must already carry `w`/`h`; this assigns `x`/`y`.
 */
export function layoutDiagram(classes: UmlClassBox[], relations: UmlRelation[]): LaidOutDiagram {
  const byName = new Map(classes.map((c) => [c.name, c]));
  const known = (n: string) => byName.has(n);

  // Only relations whose both ends exist can be drawn or influence the layout.
  const rels = relations.filter((r) => known(r.from) && known(r.to));

  const rows = assignRows(classes, rels);
  orderRows(rows, rels);
  positionRows(rows, gapSizer(rows, rels));

  const edges = routeEdges(rows, rels, byName);

  let maxX = 0;
  let maxY = 0;
  for (const c of classes) {
    maxX = Math.max(maxX, c.x + c.w);
    maxY = Math.max(maxY, c.y + c.h);
  }
  // Labels and multiplicities hang a little past the boxes.
  for (const e of edges) {
    for (const p of e.points) {
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  return {
    classes,
    relations,
    edges,
    width: Math.max(maxX + MARGIN, 320),
    height: Math.max(maxY + MARGIN, 200),
  };
}

// --------------------------------------------------------------- 1. rows

/**
 * Which row each class goes on.
 *
 * Inheritance decides the backbone: a base class is always above the classes
 * that extend it, because that is the one thing a class diagram's vertical
 * axis is allowed to mean.
 *
 * A class that extends nothing but *owns* other classes — `Drawing` holding a
 * `List<Shape>` — would otherwise land on the top row next to the interfaces,
 * and its edges would then have to cross the entire hierarchy to get back down
 * to `Shape`. So after the inheritance ranking, an ownerless owner is pulled
 * down to sit one row above the shallowest class it references. Aggregation
 * still reads top-down, and the long crossing edges disappear.
 */
function assignRows(classes: UmlClassBox[], rels: UmlRelation[]): UmlClassBox[][] {
  const parents = new Map<string, string[]>();
  const owns = new Map<string, string[]>();
  for (const r of rels) {
    if (r.kind === 'inheritance' || r.kind === 'realization') {
      parents.set(r.from, [...(parents.get(r.from) ?? []), r.to]);
    } else {
      owns.set(r.from, [...(owns.get(r.from) ?? []), r.to]);
    }
  }

  const cache = new Map<string, number>();
  const depthOf = (name: string, path = new Set<string>()): number => {
    const hit = cache.get(name);
    if (hit !== undefined) return hit;
    if (path.has(name)) return 0; // A cycle is not legal C#, but never hang on one.
    path.add(name);
    const ps = parents.get(name) ?? [];
    const d = ps.length ? Math.max(...ps.map((p) => depthOf(p, path) + 1)) : 0;
    path.delete(name);
    cache.set(name, d);
    return d;
  };

  const depth = new Map<string, number>();
  for (const c of classes) depth.set(c.name, depthOf(c.name));

  // Pull each ownerless owner down to just above what it owns. Iterating lets a
  // chain of owners (a Game owning a Drawing owning Shapes) settle, and the cap
  // guarantees termination whatever the reference graph looks like.
  for (let pass = 0; pass < classes.length; pass++) {
    let moved = false;
    for (const c of classes) {
      if ((parents.get(c.name) ?? []).length) continue; // Inheritance wins.
      const targets = (owns.get(c.name) ?? []).filter((t) => depth.has(t) && t !== c.name);
      if (!targets.length) continue;
      const want = Math.min(...targets.map((t) => depth.get(t)!)) - 1;
      if (want > depth.get(c.name)!) {
        depth.set(c.name, want);
        moved = true;
      }
    }
    if (!moved) break;
  }

  // Depths can now be negative or leave gaps; compact them into dense rows so
  // the vertical spacing has no empty bands in it.
  const used = [...new Set(depth.values())].sort((a, b) => a - b);
  const rowIndex = new Map(used.map((d, i) => [d, i]));

  const rows: UmlClassBox[][] = used.map(() => []);
  for (const c of classes) rows[rowIndex.get(depth.get(c.name)!)!].push(c);
  return rows.filter((r) => r.length);
}

// ------------------------------------------------------------ 2. ordering

/**
 * Barycentre ordering. Sweep down putting each class near the average slot of
 * its parents, then sweep up doing the same against its children, twice — far
 * short of a full Sugiyama but enough to untangle the diagrams a lab produces.
 */
function orderRows(rows: UmlClassBox[][], rels: UmlRelation[]): void {
  const rowOf = new Map<string, number>();
  rows.forEach((row, i) => row.forEach((c) => rowOf.set(c.name, i)));

  const up = new Map<string, string[]>(); // class -> neighbours in the row above
  const down = new Map<string, string[]>();
  const push = (m: Map<string, string[]>, k: string, v: string) => {
    const list = m.get(k);
    if (list) list.push(v);
    else m.set(k, [v]);
  };
  for (const r of rels) {
    const a = rowOf.get(r.from)!;
    const b = rowOf.get(r.to)!;
    if (a === b) continue;
    const [lower, upper] = a > b ? [r.from, r.to] : [r.to, r.from];
    push(up, lower, upper);
    push(down, upper, lower);
  }

  // Alphabetical is the stable starting point: the same code always draws the
  // same diagram, which matters when a student compares with a classmate.
  for (const row of rows) row.sort((a, b) => a.name.localeCompare(b.name));

  const slots = new Map<string, number>();
  const reindex = () => rows.forEach((row) => row.forEach((c, i) => slots.set(c.name, i)));
  reindex();

  const sweep = (neighbours: Map<string, string[]>, order: number[]) => {
    for (const i of order) {
      const row = rows[i];
      const key = new Map<string, number>();
      row.forEach((c, idx) => {
        const ns = (neighbours.get(c.name) ?? []).map((n) => slots.get(n)).filter((v): v is number => v !== undefined);
        key.set(c.name, ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : idx);
      });
      row.sort((a, b) => key.get(a.name)! - key.get(b.name)! || a.name.localeCompare(b.name));
      reindex();
    }
  };

  const downward = rows.map((_, i) => i).slice(1);
  const upward = rows.map((_, i) => i).slice(0, -1).reverse();
  for (let pass = 0; pass < 2; pass++) {
    sweep(up, downward);
    sweep(down, upward);
  }
}

// ----------------------------------------------------------- 3. positions

/**
 * Centre each row on the widest one, so the diagram reads as a tree.
 *
 * The gap after a box is widened when a labelled relation has to cross it: a
 * `_shapes` label in a 64px gap is drawn half-under both boxes, which looks
 * like a clipping bug rather than a tight layout.
 */
function positionRows(rows: UmlClassBox[][], gapAfter: (c: UmlClassBox) => number): void {
  const rowWidth = (row: UmlClassBox[]) =>
    row.reduce((sum, c, i) => sum + c.w + (i < row.length - 1 ? gapAfter(c) : 0), 0);

  const widest = Math.max(...rows.map(rowWidth), 0);

  let y = MARGIN;
  for (const row of rows) {
    let x = MARGIN + (widest - rowWidth(row)) / 2;
    let tallest = 0;
    for (const c of row) {
      c.x = Math.round(x);
      c.y = Math.round(y);
      x += c.w + gapAfter(c);
      tallest = Math.max(tallest, c.h);
    }
    y += tallest + GAP_Y;
  }
}

/**
 * How much room each box needs after it: the default gap, or enough for the
 * widest label on a relation leaving it sideways, plus the arrowhead.
 */
function gapSizer(rows: UmlClassBox[][], rels: UmlRelation[]): (c: UmlClassBox) => number {
  const rowOf = new Map<string, number>();
  const indexOf = new Map<string, number>();
  rows.forEach((row, r) => row.forEach((c, i) => { rowOf.set(c.name, r); indexOf.set(c.name, i); }));

  const need = new Map<string, number>();
  for (const r of rels) {
    if (rowOf.get(r.from) !== rowOf.get(r.to)) continue; // Only same-row edges.
    const label = r.label ?? '';
    if (!label) continue;
    // The chip is ~5.9px a character; add the arrowhead and a little air.
    const want = label.length * 5.9 + 44;
    // Charge it to whichever of the pair sits on the left.
    const left = (indexOf.get(r.from) ?? 0) <= (indexOf.get(r.to) ?? 0) ? r.from : r.to;
    need.set(left, Math.max(need.get(left) ?? 0, want));
  }

  return (c) => Math.max(GAP_X, need.get(c.name) ?? 0);
}

// -------------------------------------------------------------- 4. routing

interface PortRequest {
  edgeIndex: number;
  /** Which end of that edge this port is: 'a' is the source, 'b' the target. */
  end: 'a' | 'b';
  /** Sort key along the side: the other box's centre, so lines do not cross. */
  along: number;
}

function centreX(c: UmlClassBox) {
  return c.x + c.w / 2;
}
function centreY(c: UmlClassBox) {
  return c.y + c.h / 2;
}

/**
 * Pick which side of each box an edge leaves from and arrives at.
 *
 * Between rows the edge always goes bottom→top (child up to parent) or
 * top→bottom, which is what makes the inheritance triangles line up. Within a
 * row it goes side to side.
 */
function sidesFor(from: UmlClassBox, to: UmlClassBox): { out: Side; in: Side } {
  const sameBand = from.y + from.h > to.y && to.y + to.h > from.y;
  if (sameBand) {
    return centreX(to) >= centreX(from) ? { out: 'right', in: 'left' } : { out: 'left', in: 'right' };
  }
  return to.y < from.y ? { out: 'top', in: 'bottom' } : { out: 'bottom', in: 'top' };
}

function routeEdges(
  rows: UmlClassBox[][],
  rels: UmlRelation[],
  byName: Map<string, UmlClassBox>,
): RoutedEdge[] {
  // Collect the port requests per box side before assigning any coordinates,
  // so ports can be spread evenly and in a non-crossing order.
  const requests = new Map<string, PortRequest[]>();
  const sideKey = (name: string, side: Side) => `${name}|${side}`;
  const add = (name: string, side: Side, req: PortRequest) => {
    const k = sideKey(name, side);
    const list = requests.get(k) ?? [];
    list.push(req);
    requests.set(k, list);
  };

  const plans = rels.map((rel, edgeIndex) => {
    const from = byName.get(rel.from)!;
    const to = byName.get(rel.to)!;
    const { out, in: inn } = sidesFor(from, to);
    // Order ports by where the *other* end sits, which is what keeps the fan
    // of lines into a base class from braiding.
    add(rel.from, out, {
      edgeIndex,
      end: 'a',
      along: out === 'left' || out === 'right' ? centreY(to) : centreX(to),
    });
    add(rel.to, inn, {
      edgeIndex,
      end: 'b',
      along: inn === 'left' || inn === 'right' ? centreY(from) : centreX(from),
    });
    return { rel, from, to, out, inn, edgeIndex };
  });

  // Resolve every side's requests into concrete points.
  const portOf = new Map<string, { x: number; y: number }>();
  const portKey = (edgeIndex: number, end: 'a' | 'b') => `${edgeIndex}${end}`;

  for (const [key, list] of requests) {
    const [name, side] = key.split('|') as [string, Side];
    const box = byName.get(name)!;
    list.sort((p, q) => p.along - q.along);

    const horizontal = side === 'top' || side === 'bottom';
    const span = horizontal ? box.w : box.h;
    const usable = Math.max(span - PORT_INSET * 2, span * 0.4);
    const start = (span - usable) / 2;

    list.forEach((req, i) => {
      const t = list.length === 1 ? 0.5 : i / (list.length - 1);
      const offset = start + usable * t;
      const point = horizontal
        ? { x: box.x + offset, y: side === 'top' ? box.y : box.y + box.h }
        : { x: side === 'left' ? box.x : box.x + box.w, y: box.y + offset };
      portOf.set(portKey(req.edgeIndex, req.end), point);
    });
  }

  // Channels: each edge that crosses a vertical gap gets its own lane, so two
  // edges never share a horizontal run.
  const bandTop = new Map<number, number>(); // row index -> y of the row's top
  const bandBottom = new Map<number, number>();
  rows.forEach((row, i) => {
    bandTop.set(i, Math.min(...row.map((c) => c.y)));
    bandBottom.set(i, Math.max(...row.map((c) => c.y + c.h)));
  });
  const rowOf = new Map<string, number>();
  rows.forEach((row, i) => row.forEach((c) => rowOf.set(c.name, i)));

  /** How many lanes are already taken in the gap above row `i`. */
  const laneUse = new Map<number, number>();

  const edges: RoutedEdge[] = [];

  for (const plan of plans) {
    const a = portOf.get(portKey(plan.edgeIndex, 'a'))!;
    const b = portOf.get(portKey(plan.edgeIndex, 'b'))!;
    const vertical = plan.out === 'top' || plan.out === 'bottom';

    let points: { x: number; y: number }[];
    let endAngle: number;
    let labelAt: { x: number; y: number } | undefined;
    let multAt: { x: number; y: number } | undefined;

    if (vertical) {
      // Turn in the gap between the two rows. The lane index keeps concurrent
      // edges apart; which gap depends on which way the edge points.
      const upward = plan.out === 'top';
      const lowerRow = upward ? rowOf.get(plan.rel.from)! : rowOf.get(plan.rel.to)!;
      const gapEnd = bandTop.get(lowerRow) ?? Math.min(a.y, b.y);
      const gapStart = bandBottom.get(lowerRow - 1) ?? gapEnd - GAP_Y;

      const lane = laneUse.get(lowerRow) ?? 0;
      laneUse.set(lowerRow, lane + 1);
      const room = Math.max(gapEnd - gapStart - 16, CHANNEL);
      const midY = gapStart + 8 + ((lane * CHANNEL) % room);

      if (Math.abs(a.x - b.x) < 1.5) {
        points = [a, b]; // Already aligned: a straight drop reads best.
      } else {
        points = [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b];
        // Sit the label a third of the way along the horizontal run, from the
        // source end. The midpoint is where the *other* edges in this gap are
        // most likely to be crossing, and the end nearest the target is where
        // the arrowheads converge — a third of the way in is clear of both.
        labelAt = { x: a.x + (b.x - a.x) / 3, y: midY - 5 };
      }
      endAngle = upward ? -90 : 90;
      multAt = { x: a.x + 7, y: upward ? a.y - 7 : a.y + 14 };
    } else {
      // Same row: step out sideways, run along a lane below the tallest box in
      // the band, and come back in. A straight line here would cut through
      // whatever sits between the two.
      const rowIndex = rowOf.get(plan.rel.from)!;
      const neighbours = adjacentInRow(rows[rowIndex], plan.from, plan.to);
      if (neighbours) {
        // Neighbours: cross the gap directly. A straight line when the ports
        // happen to align, otherwise a single jog at the middle of the gap.
        // The old code sent any misaligned pair on a detour below the whole
        // row, which put `_selected` on a long S-bend through the inheritance
        // lines for no reason — the two boxes are side by side.
        const midGap = (a.x + b.x) / 2;
        points =
          Math.abs(a.y - b.y) < 1.5
            ? [a, b]
            : [a, { x: midGap, y: a.y }, { x: midGap, y: b.y }, b];
        // The arrowhead eats ~16px of the target end of the gap, so the label
        // goes in the third nearest the source — the only reliably empty part
        // of a short run.
        labelAt = { x: a.x + (b.x - a.x) * 0.3, y: a.y - 6 };
      } else {
        const lane = laneUse.get(rowIndex + 100) ?? 0;
        laneUse.set(rowIndex + 100, lane + 1);
        const runY = bandBottom.get(rowIndex)! + 14 + lane * CHANNEL;
        const stub = 16;
        const ax = plan.out === 'right' ? a.x + stub : a.x - stub;
        const bx = plan.inn === 'right' ? b.x + stub : b.x - stub;
        points = [
          a,
          { x: ax, y: a.y },
          { x: ax, y: runY },
          { x: bx, y: runY },
          { x: bx, y: b.y },
          b,
        ];
        labelAt = { x: ax + (bx - ax) / 3, y: runY - 5 };
      }
      endAngle = plan.inn === 'left' ? 0 : 180;
      // UML puts the multiplicity at the end it describes, right against the
      // source box, and below the line so it never shares space with a label.
      multAt = { x: plan.out === 'right' ? a.x + 6 : a.x - 16, y: a.y + 13 };
    }

    edges.push({ rel: plan.rel, points, endAngle, labelAt, multAt });
  }

  return edges;
}

function adjacentInRow(row: UmlClassBox[] | undefined, a: UmlClassBox, b: UmlClassBox): boolean {
  if (!row) return false;
  const i = row.indexOf(a);
  const j = row.indexOf(b);
  return i >= 0 && j >= 0 && Math.abs(i - j) === 1;
}

/** An SVG path with softened corners, so the elbows do not look pixel-snapped. */
export function edgePath(points: { x: number; y: number }[], radius = 6): string {
  if (points.length < 2) return '';
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const r1 = Math.min(radius, dist(prev, cur) / 2);
    const r2 = Math.min(radius, dist(cur, next) / 2);
    const r = Math.min(r1, r2);
    const p1 = towards(cur, prev, r);
    const p2 = towards(cur, next, r);
    d += ` L ${p1.x} ${p1.y} Q ${cur.x} ${cur.y} ${p2.x} ${p2.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function towards(from: { x: number; y: number }, to: { x: number; y: number }, by: number) {
  const d = dist(from, to);
  if (d === 0) return { ...from };
  return { x: from.x + ((to.x - from.x) / d) * by, y: from.y + ((to.y - from.y) / d) * by };
}
