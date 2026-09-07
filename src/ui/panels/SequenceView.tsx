/**
 * Renders a UML sequence diagram as inline SVG.
 *
 * Notation matches Week 3's slides: a box per lifeline, a dashed lifeline
 * dropping from it, activation boxes for the time a method is on the stack,
 * solid arrows for calls and dashed arrows for returns.
 */

import type { SequenceModel } from '@/tools/sequence';

const HEAD_W = 132;
const HEAD_H = 30;
const ACT_W = 11;

export function SequenceView({ model }: { model: SequenceModel }) {
  if (!model.lifelines.length) {
    return (
      <p className="mem-empty">
        No method calls were recorded. Call a method on an object and the diagram appears here.
      </p>
    );
  }

  const xOf = new Map(model.lifelines.map((l) => [l.id, l.x]));

  return (
    <svg
      width={model.width}
      height={model.height}
      viewBox={`0 0 ${model.width} ${model.height}`}
      style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="UML sequence diagram generated from your run"
    >
      <defs>
        <marker id="seqArrow" markerWidth="9" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--text-dim)" />
        </marker>
        <marker id="seqArrowOpen" markerWidth="9" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8" fill="none" stroke="var(--text-faint)" />
        </marker>
      </defs>

      {/* lifelines */}
      {model.lifelines.map((l) => (
        <g key={l.id}>
          <rect
            className="seq-head"
            x={l.x - HEAD_W / 2}
            y={8}
            width={HEAD_W}
            height={HEAD_H}
            rx={5}
          />
          <text className="seq-label" x={l.x} y={28} textAnchor="middle">
            {l.label.length > 20 ? l.label.slice(0, 19) + '…' : l.label}
          </text>
          <line className="seq-line" x1={l.x} y1={8 + HEAD_H} x2={l.x} y2={model.height - 10} />
        </g>
      ))}

      {/* activation boxes */}
      {model.activations.map((a, i) => {
        const x = xOf.get(a.lifeline);
        if (x === undefined) return null;
        return (
          <rect
            key={i}
            className="seq-act"
            x={x - ACT_W / 2 + Math.min(a.depth, 3) * 4}
            y={a.top}
            width={ACT_W}
            height={Math.max(a.bottom - a.top, 8)}
            rx={2}
          />
        );
      })}

      {/* messages */}
      {model.messages.map((m, i) => {
        const x1 = xOf.get(m.from);
        const x2 = xOf.get(m.to);
        if (x1 === undefined || x2 === undefined) return null;

        if (m.self) {
          const loopW = 30;
          return (
            <g key={i}>
              <path
                className={`seq-msg${m.kind === 'return' ? ' seq-msg-ret' : ''}`}
                d={`M ${x1 + 6} ${m.y} h ${loopW} v 14 h -${loopW}`}
                markerEnd={m.kind === 'return' ? 'url(#seqArrowOpen)' : 'url(#seqArrow)'}
              />
              <text className="seq-text" x={x1 + loopW + 12} y={m.y + 4}>
                {m.label}
              </text>
            </g>
          );
        }

        const forward = x2 > x1;
        const startX = x1 + (forward ? 6 : -6);
        const endX = x2 + (forward ? -6 : 6);
        const textX = (startX + endX) / 2;

        return (
          <g key={i}>
            <line
              className={`seq-msg${m.kind === 'return' ? ' seq-msg-ret' : ''}`}
              x1={startX}
              y1={m.y}
              x2={endX}
              y2={m.y}
              markerEnd={m.kind === 'return' ? 'url(#seqArrowOpen)' : 'url(#seqArrow)'}
            />
            <text className="seq-text" x={textX} y={m.y - 6} textAnchor="middle">
              {m.label.length > 30 ? m.label.slice(0, 29) + '…' : m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
