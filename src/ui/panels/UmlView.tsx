/**
 * Renders a UML class diagram as inline SVG.
 *
 * Notation follows the lab handouts so the picture on screen matches the
 * picture on the PDF: hollow triangle for inheritance, dashed line + triangle
 * for interface realization, hollow diamond for aggregation with multiplicity.
 */

import { attrLabel, opLabel, type UmlClassBox, type UmlModel, type UmlRelation } from '@/tools/uml';

const ROW_H = 17;
const HEADER_H = 30;

function memberRows(c: UmlClassBox) {
  const rows: { text: string; y: number; italic?: boolean }[] = [];
  let y = c.y + HEADER_H + 13;
  for (const a of c.attributes) {
    rows.push({ text: attrLabel(a), y });
    y += ROW_H;
  }
  const dividerY = c.attributes.length ? y - ROW_H + 8 : 0;
  if (c.attributes.length && c.operations.length) y += 8;
  for (const o of c.operations) {
    rows.push({ text: opLabel(o), y, italic: o.isAbstract });
    y += ROW_H;
  }
  return { rows, dividerY };
}

/** Where a line from `from` should meet the edge of box `to`. */
function anchor(from: UmlClassBox, to: UmlClassBox) {
  const fx = from.x + from.w / 2;
  const fy = from.y + from.h / 2;
  const tx = to.x + to.w / 2;
  const ty = to.y + to.h / 2;

  const dx = tx - fx;
  const dy = ty - fy;

  // Prefer a vertical connection when the boxes are stacked, as with inheritance.
  if (Math.abs(dy) * to.w > Math.abs(dx) * to.h) {
    const y = dy > 0 ? to.y : to.y + to.h;
    const sy = dy > 0 ? from.y + from.h : from.y;
    return { x1: fx, y1: sy, x2: tx, y2: y };
  }
  const x = dx > 0 ? to.x : to.x + to.w;
  const sx = dx > 0 ? from.x + from.w : from.x;
  return { x1: sx, y1: fy, x2: x, y2: ty };
}

function Relation({ rel, from, to }: { rel: UmlRelation; from: UmlClassBox; to: UmlClassBox }) {
  const { x1, y1, x2, y2 } = anchor(from, to);
  const dashed = rel.kind === 'realization';
  const marker =
    rel.kind === 'inheritance' || rel.kind === 'realization'
      ? 'url(#triangle)'
      : rel.kind === 'aggregation'
        ? 'url(#diamond)'
        : 'url(#arrow)';

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <line
        className="uml-rel"
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        markerEnd={marker}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      {rel.multiplicity && (
        <text className="uml-mult" x={midX + 5} y={midY - 4}>
          {rel.multiplicity}
        </text>
      )}
      {rel.label && (
        <text className="uml-mult" x={midX + 5} y={midY + 9}>
          {rel.label}
        </text>
      )}
    </g>
  );
}

export function UmlView({ model }: { model: UmlModel }) {
  if (!model.classes.length) {
    return <p className="mem-empty">No classes yet — write one and the diagram appears here.</p>;
  }

  const byName = new Map(model.classes.map((c) => [c.name, c]));

  return (
    <svg
      width={model.width}
      height={model.height}
      viewBox={`0 0 ${model.width} ${model.height}`}
      style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="UML class diagram generated from your code"
    >
      <defs>
        <marker id="triangle" markerWidth="13" markerHeight="11" refX="12" refY="5.5" orient="auto">
          <path d="M 0 0 L 12 5.5 L 0 11 z" fill="var(--bg-raised)" stroke="var(--text-faint)" />
        </marker>
        <marker id="diamond" markerWidth="15" markerHeight="11" refX="14" refY="5.5" orient="auto">
          <path d="M 0 5.5 L 7 0 L 14 5.5 L 7 11 z" fill="var(--bg-raised)" stroke="var(--text-faint)" />
        </marker>
        <marker id="arrow" markerWidth="10" markerHeight="9" refX="9" refY="4.5" orient="auto">
          <path d="M 0 0 L 9 4.5 L 0 9" fill="none" stroke="var(--text-faint)" />
        </marker>
      </defs>

      {model.relations.map((r, i) => {
        const from = byName.get(r.from);
        const to = byName.get(r.to);
        if (!from || !to) return null;
        return <Relation key={i} rel={r} from={from} to={to} />;
      })}

      {model.classes.map((c) => {
        const { rows, dividerY } = memberRows(c);
        const stereo =
          c.kind === 'interface' ? '«interface»' : c.kind === 'enum' ? '«enum»' : c.isAbstract ? '«abstract»' : null;
        return (
          <g key={c.name}>
            <rect className="uml-box" x={c.x} y={c.y} width={c.w} height={c.h} rx={5} />
            <rect className="uml-box uml-head" x={c.x} y={c.y} width={c.w} height={HEADER_H} rx={5} />
            <rect className="uml-head" x={c.x} y={c.y + HEADER_H - 6} width={c.w} height={6} stroke="none" />
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
              fontStyle={c.isAbstract ? 'italic' : undefined}
            >
              {c.name}
            </text>
            {dividerY > 0 && c.operations.length > 0 && (
              <line className="uml-line" x1={c.x} y1={dividerY} x2={c.x + c.w} y2={dividerY} />
            )}
            {rows.map((r, i) => (
              <text
                key={i}
                className="uml-member"
                x={c.x + 9}
                y={r.y}
                fontStyle={r.italic ? 'italic' : undefined}
              >
                {r.text.length > 46 ? r.text.slice(0, 45) + '…' : r.text}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
