/**
 * Renders a UML class diagram as inline SVG, pannable and zoomable.
 *
 * Notation follows the lab handouts so the picture on screen matches the
 * picture on the PDF: hollow triangle for inheritance, dashed line + hollow
 * triangle for interface realization, hollow diamond for aggregation with a
 * multiplicity, open arrowhead for a plain association.
 *
 * The geometry — box sizes, row order, and the routed elbow paths — all comes
 * from `tools/uml`; this file only draws it and handles the viewport. Keeping
 * the split there means the layout is unit-testable without a DOM, and the
 * same model can be rendered twice (yours vs the target) with no recompute.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  attrLabel,
  edgePath,
  elide,
  HEADER_H,
  memberBudget,
  opLabel,
  ROW_H,
  SECTION_PAD,
  type LaidOutDiagram,
  type RelationKind,
  type RoutedEdge,
  type UmlClassBox,
} from '@/tools/uml';

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3;

/** One text row inside a class box, already positioned and elided. */
interface MemberRow {
  text: string;
  y: number;
  italic: boolean;
  /** Static members are underlined in UML. */
  underline: boolean;
}

function memberRows(c: UmlClassBox): { rows: MemberRow[]; dividerY: number | null } {
  const budget = memberBudget(c.w);
  const rows: MemberRow[] = [];
  let y = c.y + HEADER_H + SECTION_PAD + 12;

  for (const a of c.attributes) {
    rows.push({ text: elide(attrLabel(a), budget), y, italic: false, underline: a.isStatic });
    y += ROW_H;
  }

  let dividerY: number | null = null;
  if (c.attributes.length && c.operations.length) {
    dividerY = y - ROW_H + SECTION_PAD + 4;
    y = dividerY + SECTION_PAD + 12;
  }

  for (const o of c.operations) {
    rows.push({ text: elide(opLabel(o), budget), y, italic: o.isAbstract, underline: o.isStatic });
    y += ROW_H;
  }

  return { rows, dividerY };
}

// -------------------------------------------------------------- relations

const MARKER: Record<RelationKind, string> = {
  inheritance: 'triangle',
  realization: 'triangle',
  aggregation: 'diamond',
  association: 'arrow',
};

function Relation({ edge }: { edge: RoutedEdge }) {
  const { rel, points } = edge;
  const dashed = rel.kind === 'realization';
  const end = points[points.length - 1];

  return (
    <g className={`uml-edge uml-edge-${rel.kind}`}>
      <path
        className="uml-rel"
        d={edgePath(points)}
        strokeDasharray={dashed ? '6 4' : undefined}
        // The head is drawn separately rather than as a marker so it can be
        // filled from the page background: a marker inherits the dash pattern
        // on some engines, which made realization triangles come out striped.
      />
      <Head kind={rel.kind} at={end} angle={edge.endAngle} />

      {rel.multiplicity && edge.multAt && (
        <text className="uml-mult" x={edge.multAt.x} y={edge.multAt.y}>
          {rel.multiplicity}
        </text>
      )}
      {rel.label && edge.labelAt && (
        <EdgeLabel text={rel.label} at={edge.labelAt} />
      )}
    </g>
  );
}

/**
 * A label sitting on a routed line needs to knock a hole in it, or the line
 * strikes the text through. An opaque rect behind the text does that without
 * needing to shorten the path.
 */
function EdgeLabel({ text, at }: { text: string; at: { x: number; y: number } }) {
  const w = text.length * 5.9 + 8;
  return (
    <g>
      <rect className="uml-label-bg" x={at.x - w / 2} y={at.y - 9} width={w} height={13} rx={3} />
      <text className="uml-mult" x={at.x} y={at.y} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

/** Arrowheads, drawn in place so they sit flush on the box edge. */
function Head({
  kind,
  at,
  angle,
}: {
  kind: RelationKind;
  at: { x: number; y: number };
  angle: number;
}) {
  const transform = `translate(${at.x} ${at.y}) rotate(${angle})`;
  switch (MARKER[kind]) {
    case 'triangle':
      // Hollow closed triangle — generalization and realization.
      return <path className="uml-head-hollow" d="M 0 0 L -12 -7 L -12 7 Z" transform={transform} />;
    case 'diamond':
      // Hollow diamond at the *whole* end. The layout puts the whole (the
      // owning class) at the target, matching how the labs draw it.
      return (
        <path
          className="uml-head-hollow"
          d="M 0 0 L -8 -5.5 L -16 0 L -8 5.5 Z"
          transform={transform}
        />
      );
    default:
      // Open arrowhead — a plain directed association.
      return <path className="uml-head-open" d="M -9 -5 L 0 0 L -9 5" transform={transform} />;
  }
}

// ------------------------------------------------------------- class boxes

function ClassBox({ c }: { c: UmlClassBox }) {
  const { rows, dividerY } = memberRows(c);
  const stereo =
    c.kind === 'interface' ? '«interface»' : c.kind === 'enum' ? '«enumeration»' : c.isAbstract ? '«abstract»' : null;

  return (
    <g className={`uml-class uml-class-${c.kind}`}>
      <rect className="uml-box" x={c.x} y={c.y} width={c.w} height={c.h} rx={4} />
      {/* Header fill is a separate rect clipped to the top so the rounded
          corners stay rounded without a clipPath per box. */}
      <path
        className="uml-head-fill"
        d={`M ${c.x + 4} ${c.y} h ${c.w - 8} a 4 4 0 0 1 4 4 v ${HEADER_H - 4} h ${-c.w} v ${-(HEADER_H - 4)} a 4 4 0 0 1 4 -4 z`}
      />
      <line className="uml-line" x1={c.x} y1={c.y + HEADER_H} x2={c.x + c.w} y2={c.y + HEADER_H} />

      {stereo && (
        <text className="uml-stereo" x={c.x + c.w / 2} y={c.y + 12} textAnchor="middle">
          {stereo}
        </text>
      )}
      <text
        className="uml-name"
        x={c.x + c.w / 2}
        y={c.y + (stereo ? 24 : 20)}
        textAnchor="middle"
        fontStyle={c.isAbstract || c.kind === 'interface' ? 'italic' : undefined}
      >
        {c.name}
      </text>

      {dividerY !== null && (
        <line className="uml-line uml-line-soft" x1={c.x} y1={dividerY} x2={c.x + c.w} y2={dividerY} />
      )}

      {rows.map((r, i) => (
        <text
          key={i}
          className="uml-member"
          x={c.x + 10}
          y={r.y}
          fontStyle={r.italic ? 'italic' : undefined}
          textDecoration={r.underline ? 'underline' : undefined}
        >
          {r.text}
        </text>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------- viewport

interface Viewport {
  zoom: number;
  x: number;
  y: number;
}

/**
 * The smallest a diagram may be auto-fitted to.
 *
 * The results panel is short — a third of the pane, under the editor — so
 * fitting a tall diagram into its height alone lands around 16%, where the
 * member rows are a grey smear. Below this floor it is better to fill the
 * width and let the student scroll down through it, which is what they would
 * do with a paper handout.
 */
const FIT_FLOOR = 0.55;

/**
 * Fit the diagram into the available box, never magnifying past 1:1 — a
 * two-class diagram blown up to fill a tall panel looks like a mistake — and
 * never shrinking below the point where the text stops being readable.
 */
function fitViewport(model: LaidOutDiagram, w: number, h: number): Viewport {
  if (!w || !h) return { zoom: 1, x: 0, y: 0 };
  const both = Math.min(w / model.width, h / model.height);
  // Under the floor, fit the width instead and start at the top of the
  // diagram, so the first thing on screen is the first class.
  const zoom = Math.min(1, both < FIT_FLOOR ? Math.max(both, Math.min(1, w / model.width)) : both);
  const scaledH = model.height * zoom;
  return {
    zoom,
    x: (w - model.width * zoom) / 2,
    y: scaledH > h ? 0 : (h - scaledH) / 2,
  };
}

export interface UmlViewProps {
  model: LaidOutDiagram;
  /** Turns off pan/zoom for the inline target diagrams in the reading pane. */
  interactive?: boolean;
  /** Extra class on the wrapper, for the side-by-side compare. */
  className?: string;
}

export function UmlView({ model, interactive = true, className }: UmlViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<Viewport>({ zoom: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);
  /** Until the student pans or zooms, the view re-fits as the panel resizes. */
  const touched = useRef(false);

  const fit = useCallback(() => {
    const el = hostRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    setView(fitViewport(model, w, h));
    touched.current = false;
  }, [model]);

  // Track the host size so fit-to-view knows what it is fitting into.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Re-fit on a new model or a resize, but never yank a view the student moved.
  useEffect(() => {
    if (touched.current) return;
    if (!size.w || !size.h) return;
    setView(fitViewport(model, size.w, size.h));
  }, [model, size.w, size.h]);

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    touched.current = true;
    setView((v) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor));
      const k = zoom / v.zoom;
      // Keep the point under the cursor fixed: the whole trick of a usable zoom.
      return { zoom, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  }, []);

  // A non-passive wheel listener, because React's onWheel cannot preventDefault
  // and the page would scroll out from under the diagram.
  useEffect(() => {
    const el = hostRef.current;
    if (!el || !interactive) return;
    const onWheel = (e: WheelEvent) => {
      // Plain scroll should still scroll the page; ctrl/⌘ or a pinch zooms.
      // Trackpad pinch arrives as a wheel event with ctrlKey set.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [interactive, zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive || e.button !== 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    touched.current = true;
    setView((v) => ({ ...v, x: d.vx + (e.clientX - d.px), y: d.vy + (e.clientY - d.py) }));
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return;
    const step = e.shiftKey ? 90 : 30;
    const nudge = (dx: number, dy: number) => {
      touched.current = true;
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    };
    switch (e.key) {
      case 'ArrowLeft': nudge(step, 0); break;
      case 'ArrowRight': nudge(-step, 0); break;
      case 'ArrowUp': nudge(0, step); break;
      case 'ArrowDown': nudge(0, -step); break;
      case '+': case '=': zoomAt(1.2, size.w / 2, size.h / 2); break;
      case '-': case '_': zoomAt(1 / 1.2, size.w / 2, size.h / 2); break;
      case '0': fit(); break;
      default: return;
    }
    e.preventDefault();
  };

  if (!model.classes.length) {
    return <p className="mem-empty">No classes yet — write one and the diagram appears here.</p>;
  }

  if (!interactive) {
    // Static render for the reading pane: scale to the column, no controls.
    return (
      <svg
        className="uml-svg"
        viewBox={`0 0 ${model.width} ${model.height}`}
        width={model.width}
        height={model.height}
        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={describe(model)}
      >
        <Scene model={model} />
      </svg>
    );
  }

  return (
    <div className={`uml-stage${className ? ` ${className}` : ''}`}>
      <div
        ref={hostRef}
        className={`uml-canvas${dragging ? ' dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={fit}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="application"
        aria-label={`${describe(model)} Drag to pan; ctrl and scroll to zoom; arrow keys to pan; plus and minus to zoom; 0 to fit.`}
      >
        <svg width="100%" height="100%" aria-hidden>
          <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
            <Scene model={model} />
          </g>
        </svg>
      </div>

      <div className="uml-controls" role="group" aria-label="Diagram view">
        <button
          type="button"
          className="uml-ctl"
          onClick={() => zoomAt(1 / 1.25, size.w / 2, size.h / 2)}
          aria-label="Zoom out"
          title="Zoom out (−)"
        >
          <span aria-hidden>−</span>
        </button>
        <button
          type="button"
          className="uml-ctl uml-ctl-zoom"
          onClick={fit}
          title="Fit to view (0, or double-click)"
        >
          {Math.round(view.zoom * 100)}%
        </button>
        <button
          type="button"
          className="uml-ctl"
          onClick={() => zoomAt(1.25, size.w / 2, size.h / 2)}
          aria-label="Zoom in"
          title="Zoom in (+)"
        >
          <span aria-hidden>+</span>
        </button>
      </div>
    </div>
  );
}

/** Boxes and edges, shared by the interactive and static renders. */
function Scene({ model }: { model: LaidOutDiagram }) {
  return (
    <>
      {/* Edges first, so a box always covers the stub that runs under it. */}
      {model.edges.map((e, i) => (
        <Relation key={i} edge={e} />
      ))}
      {model.classes.map((c) => (
        <ClassBox key={c.name} c={c} />
      ))}
    </>
  );
}

/** A sentence a screen reader can read instead of the picture. */
function describe(model: LaidOutDiagram): string {
  const names = model.classes.map((c) => c.name);
  const rels = model.relations.map((r) => `${r.from} ${RELATION_WORDS[r.kind]} ${r.to}`);
  const parts = [`UML class diagram with ${names.length} ${names.length === 1 ? 'class' : 'classes'}: ${names.join(', ')}.`];
  if (rels.length) parts.push(`Relationships: ${rels.join('; ')}.`);
  return parts.join(' ');
}

const RELATION_WORDS: Record<RelationKind, string> = {
  inheritance: 'inherits from',
  realization: 'implements',
  aggregation: 'holds a collection of',
  association: 'has a',
};

/**
 * The notation key. Students are marked on the notation, so the meaning of
 * each line is spelled out next to the picture rather than in a tooltip.
 */
const LEGEND: { kind: RelationKind; label: string }[] = [
  { kind: 'inheritance', label: 'inherits from' },
  { kind: 'realization', label: 'implements' },
  { kind: 'aggregation', label: 'has many' },
  { kind: 'association', label: 'has one' },
];

export function UmlLegend({ model }: { model: LaidOutDiagram }) {
  const kinds = new Set(model.relations.map((r) => r.kind));
  if (!kinds.size) return null;

  const items = LEGEND.filter((i) => kinds.has(i.kind));

  return (
    <ul className="uml-key">
      {items.map((i) => (
        <li key={i.kind}>
          <svg width="46" height="12" aria-hidden className="uml-key-svg">
            <line
              className="uml-rel"
              x1="1"
              y1="6"
              x2={i.kind === 'aggregation' ? 28 : i.kind === 'association' ? 36 : 32}
              y2="6"
              strokeDasharray={i.kind === 'realization' ? '5 3' : undefined}
            />
            <Head kind={i.kind} at={{ x: 45, y: 6 }} angle={0} />
          </svg>
          {i.label}
        </li>
      ))}
    </ul>
  );
}
