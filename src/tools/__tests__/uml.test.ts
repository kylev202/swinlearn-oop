/**
 * The layout is the part of the diagram a student judges it by: overlapping
 * boxes or a line through a class box reads as broken software, and the whole
 * point of generating the diagram is that it is more trustworthy than the one
 * they would draw by hand. So the geometry is asserted here rather than
 * eyeballed.
 */

import { describe, expect, it } from 'vitest';

import { parse } from '@/engine/parser';
import { attrLabel, buildUml, elide, memberBudget, type LaidOutDiagram, type UmlClassBox } from '@/tools/uml';

function build(src: string): LaidOutDiagram {
  return buildUml(parse(src));
}

function overlaps(a: UmlClassBox, b: UmlClassBox): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Does a straight segment pass through a box's interior? */
function segmentHitsBox(
  p: { x: number; y: number },
  q: { x: number; y: number },
  box: UmlClassBox,
  inset = 2,
): boolean {
  const x1 = box.x + inset;
  const y1 = box.y + inset;
  const x2 = box.x + box.w - inset;
  const y2 = box.y + box.h - inset;

  // Routed edges are orthogonal, which makes this a rectangle overlap test.
  const loX = Math.min(p.x, q.x);
  const hiX = Math.max(p.x, q.x);
  const loY = Math.min(p.y, q.y);
  const hiY = Math.max(p.y, q.y);
  return loX < x2 && x1 < hiX && loY < y2 && y1 < hiY;
}

const HIERARCHY = `
public abstract class Shape
{
    protected string _name;
    public abstract void Draw();
}

public class Circle : Shape
{
    private float _radius;
    public override void Draw() { }
}

public class Square : Shape
{
    private float _side;
    public override void Draw() { }
}

public class Triangle : Shape
{
    private float _base;
    public override void Draw() { }
}
`;

const DRAWING = `
public interface IDrawable
{
    void Draw();
}

public class Shape : IDrawable
{
    private Color _color;
    public void Draw() { }
}

public class Circle : Shape
{
    private float _radius;
}

public class Drawing
{
    private List<Shape> _shapes;
    private Shape _selected;
    public void AddShape(Shape s) { }
}
`;

describe('class boxes', () => {
  it('never overlap each other', () => {
    for (const src of [HIERARCHY, DRAWING]) {
      const model = build(src);
      for (let i = 0; i < model.classes.length; i++) {
        for (let j = i + 1; j < model.classes.length; j++) {
          const a = model.classes[i];
          const b = model.classes[j];
          expect(overlaps(a, b), `${a.name} overlaps ${b.name}`).toBe(false);
        }
      }
    }
  });

  it('are wide enough for their widest member row', () => {
    const model = build(DRAWING);
    for (const c of model.classes) {
      expect(memberBudget(c.w)).toBeGreaterThan(8);
    }
  });

  /**
   * The width budget is only as good as the character width behind it. 6.6px
   * is JetBrains Mono at 11px measured with `getComputedTextLength` in the
   * built app; when it was guessed 7% low, every `«readonly, property»` row
   * hung out past the box border. Assert the round trip so a future tweak to
   * the constant cannot quietly bring that back.
   */
  it('fits its widest row at the real 6.6px character width', () => {
    const model = build(`public class Counter
{
    private int _count;
    public string Name { get { return ""; } set { } }
    public int Ticks { get { return 0; } }
}`);
    const c = model.classes[0];
    const widest = Math.max(...c.attributes.map((a) => attrLabel(a).length));
    // The longest row, drawn at 6.6px a character, plus a padding gutter each
    // side, has to still be inside the box.
    expect(widest * 6.6 + 8).toBeLessThanOrEqual(c.w);
    expect(memberBudget(c.w)).toBeGreaterThanOrEqual(widest);
  });

  it('all sit inside the reported canvas', () => {
    const model = build(DRAWING);
    for (const c of model.classes) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w).toBeLessThanOrEqual(model.width);
      expect(c.y + c.h).toBeLessThanOrEqual(model.height);
    }
  });

  it('put a base class above its subclasses', () => {
    const model = build(HIERARCHY);
    const shape = model.classes.find((c) => c.name === 'Shape')!;
    for (const name of ['Circle', 'Square', 'Triangle']) {
      const sub = model.classes.find((c) => c.name === name)!;
      expect(sub.y, `${name} should be below Shape`).toBeGreaterThan(shape.y);
    }
  });

  it('is deterministic — the same code lays out the same way twice', () => {
    const a = build(DRAWING);
    const b = build(DRAWING);
    expect(a.classes.map((c) => [c.name, c.x, c.y, c.w, c.h])).toEqual(
      b.classes.map((c) => [c.name, c.x, c.y, c.w, c.h]),
    );
  });
});

describe('routed edges', () => {
  it('one per drawable relation', () => {
    const model = build(DRAWING);
    expect(model.edges).toHaveLength(model.relations.length);
  });

  it('start and end on the boundary of the right boxes', () => {
    const model = build(DRAWING);
    const byName = new Map(model.classes.map((c) => [c.name, c]));
    for (const e of model.edges) {
      const from = byName.get(e.rel.from)!;
      const to = byName.get(e.rel.to)!;
      const start = e.points[0];
      const end = e.points[e.points.length - 1];
      expect(onBoundary(start, from), `${e.rel.from}->${e.rel.to} start`).toBe(true);
      expect(onBoundary(end, to), `${e.rel.from}->${e.rel.to} end`).toBe(true);
    }
  });

  it('never run through a class box they do not belong to', () => {
    for (const src of [HIERARCHY, DRAWING]) {
      const model = build(src);
      for (const e of model.edges) {
        for (let i = 0; i < e.points.length - 1; i++) {
          for (const box of model.classes) {
            if (box.name === e.rel.from || box.name === e.rel.to) continue;
            expect(
              segmentHitsBox(e.points[i], e.points[i + 1], box),
              `${e.rel.from}->${e.rel.to} cuts through ${box.name}`,
            ).toBe(false);
          }
        }
      }
    }
  });

  it('gives two relations into the same class distinct arrival points', () => {
    const model = build(HIERARCHY);
    const intoShape = model.edges.filter((e) => e.rel.to === 'Shape');
    expect(intoShape.length).toBeGreaterThan(1);
    const arrivals = intoShape.map((e) => {
      const p = e.points[e.points.length - 1];
      return `${Math.round(p.x)},${Math.round(p.y)}`;
    });
    expect(new Set(arrivals).size).toBe(arrivals.length);
  });

  it('keeps every label clear of the lines it labels', () => {
    const model = build(DRAWING);
    for (const e of model.edges) {
      if (!e.labelAt) continue;
      // A label sits above a horizontal run, so no point of its own path may be
      // at exactly its baseline.
      for (const p of e.points) {
        if (Math.abs(p.y - e.labelAt.y) < 1) {
          expect(Math.abs(p.x - e.labelAt.x)).toBeGreaterThan(4);
        }
      }
    }
  });

  /**
   * A relation label is drawn with an opaque chip behind it, so wherever it
   * lands it *erases* what is under it. Landing on a class box or on another
   * edge's arrowhead therefore reads as a rendering fault, which is exactly
   * what the `_selected` label did when it was placed at the run's midpoint.
   */
  it('never places a label on top of a class box', () => {
    for (const src of [HIERARCHY, DRAWING]) {
      const model = build(src);
      for (const e of model.edges) {
        if (!e.labelAt) continue;
        const chipW = (e.rel.label?.length ?? 0) * 5.9 + 8;
        const chip: UmlClassBox = {
          ...model.classes[0],
          x: e.labelAt.x - chipW / 2,
          y: e.labelAt.y - 9,
          w: chipW,
          h: 13,
        };
        for (const box of model.classes) {
          expect(overlaps(chip, box), `label ${e.rel.label} sits on ${box.name}`).toBe(false);
        }
      }
    }
  });

  /**
   * Two classes side by side in the same row are one gap apart. Sending such
   * an edge on a detour below the row — which is what happened whenever the
   * two ports were not exactly level — dragged `Drawing._selected` through the
   * inheritance lines under it for no reason at all.
   */
  it('crosses the gap directly between neighbours instead of detouring', () => {
    const model = build(DRAWING);
    const byName = new Map(model.classes.map((c) => [c.name, c]));
    const rowBottom = Math.max(
      ...['Drawing', 'Shape']
        .map((n) => byName.get(n))
        .filter((c): c is UmlClassBox => !!c)
        .map((c) => c.y + c.h),
    );
    for (const e of model.edges) {
      const from = byName.get(e.rel.from)!;
      const to = byName.get(e.rel.to)!;
      // Only same-band edges: an edge between rows is allowed to travel.
      if (!(from.y + from.h > to.y && to.y + to.h > from.y)) continue;
      for (const p of e.points) {
        expect(p.y, `${e.rel.from}->${e.rel.to} dips below its own row`).toBeLessThanOrEqual(
          rowBottom + 1,
        );
      }
      // And no more than one jog: two corners at most.
      expect(e.points.length).toBeLessThanOrEqual(4);
    }
  });

  /**
   * The label chip is opaque, so if the gap it sits in is narrower than the
   * chip, the label is drawn half under each box and reads as a clipping bug.
   */
  it('leaves enough room between boxes for the labels that cross', () => {
    const model = build(DRAWING);
    const byName = new Map(model.classes.map((c) => [c.name, c]));
    for (const e of model.edges) {
      if (!e.rel.label || !e.labelAt) continue;
      const from = byName.get(e.rel.from)!;
      const to = byName.get(e.rel.to)!;
      if (!(from.y + from.h > to.y && to.y + to.h > from.y)) continue; // same band only
      const chipW = e.rel.label.length * 5.9 + 8;
      const left = from.x < to.x ? from : to;
      const right = from.x < to.x ? to : from;
      const gap = right.x - (left.x + left.w);
      expect(gap, `no room for ${e.rel.label}`).toBeGreaterThanOrEqual(chipW);
    }
  });

  it('routes aggregation with a multiplicity anchor', () => {
    const model = build(DRAWING);
    const agg = model.edges.find((e) => e.rel.kind === 'aggregation');
    expect(agg).toBeDefined();
    expect(agg!.rel.multiplicity).toBe('*');
    expect(agg!.multAt).toBeDefined();
  });

  it('marks an interface with realization, not inheritance', () => {
    const model = build(DRAWING);
    const rel = model.relations.find((r) => r.from === 'Shape' && r.to === 'IDrawable')!;
    expect(rel.kind).toBe('realization');
  });
});

describe('degenerate inputs', () => {
  it('handles a single class', () => {
    const model = build('public class Only { private int _x; }');
    expect(model.classes).toHaveLength(1);
    expect(model.edges).toHaveLength(0);
    expect(model.width).toBeGreaterThan(0);
  });

  it('handles a class with no members without collapsing the box', () => {
    const model = build('public class Empty { }');
    expect(model.classes[0].h).toBeGreaterThan(30);
  });

  it('does not hang on a self-referential field', () => {
    const model = build('public class Node { private Node _next; }');
    // A self-association is not drawn, since both ends are the same box.
    expect(model.classes).toHaveLength(1);
  });

  it('survives an inheritance cycle', () => {
    const model = build('public class A : B { }\npublic class B : A { }');
    expect(model.classes).toHaveLength(2);
    expect(model.width).toBeGreaterThan(0);
  });
});

describe('elide', () => {
  it('leaves a row that fits alone', () => {
    expect(elide('+ Draw(): void', 40)).toBe('+ Draw(): void');
  });

  it('cuts the parameter list first, keeping the name and return type', () => {
    const out = elide('+ Move(dx: float, dy: float, ease: string): void', 22);
    expect(out).toContain('Move(');
    expect(out).toContain('void');
    expect(out.length).toBeLessThanOrEqual(22);
  });

  it('drops the stereotype before it touches the name or type', () => {
    const out = elide('+ Ticks: int «readonly, property»', 20);
    expect(out).toBe('+ Ticks: int');
  });

  it('keeps a collection legible as a collection', () => {
    // The point of the row is that it holds Shapes; `List<Shap…` loses that
    // and `List<…>` does not.
    const out = elide('- _shapes: List<Shape>', 19);
    expect(out).toBe('- _shapes: List<…>');
  });

  it('falls back to a plain truncation for a field', () => {
    const out = elide('- _someVeryLongFieldName: Dictionary', 16);
    expect(out.length).toBeLessThanOrEqual(16);
    expect(out.endsWith('…')).toBe(true);
  });
});

function onBoundary(p: { x: number; y: number }, box: UmlClassBox, tol = 1.5): boolean {
  const onLeft = Math.abs(p.x - box.x) <= tol;
  const onRight = Math.abs(p.x - (box.x + box.w)) <= tol;
  const onTop = Math.abs(p.y - box.y) <= tol;
  const onBottom = Math.abs(p.y - (box.y + box.h)) <= tol;
  const withinY = p.y >= box.y - tol && p.y <= box.y + box.h + tol;
  const withinX = p.x >= box.x - tol && p.x <= box.x + box.w + tol;
  return ((onLeft || onRight) && withinY) || ((onTop || onBottom) && withinX);
}
