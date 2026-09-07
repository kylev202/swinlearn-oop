/**
 * A Parsons problem — the right lines, the wrong order.
 *
 * Ordering code exercises the same mental model as writing it while charging
 * none of the syntax tax, which is exactly what a concept lesson wants: the
 * student proves they know what a constructor is for without also having to
 * remember where the semicolons go. It is also why this block earns its place
 * in a lesson that deliberately does not load the editor.
 *
 * Two ways to move a line, because one of them has to work without a mouse:
 * drag it, or use the arrows.
 */

import { useState } from 'react';
import type { Parsons } from '@/content/types';
import { indentOf, scrambleOf } from '@/tools/parsons';

import { highlightCsharp } from '../CodeBlock';
import { Markdown } from '../Markdown';

export function ParsonsBlock({
  block,
  order,
  onReorder,
}: {
  block: Parsons;
  /** Indices into `block.lines`, in the student's current order. */
  order?: number[];
  onReorder: (next: number[]) => void;
}) {
  const start = order ?? scrambleOf(block.lines);
  const [checked, setChecked] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);

  const solved = start.every((v, i) => v === i);
  const rightCount = start.filter((v, i) => v === i).length;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= start.length || from === to) return;
    const next = start.slice();
    const [line] = next.splice(from, 1);
    next.splice(to, 0, line);
    setChecked(false);
    onReorder(next);
  };

  return (
    <div className={`ask parsons${checked && solved ? ' is-solved' : ''}`}>
      <div className="ask-head">
        <span className="ask-badge">Put it in order</span>
        {block.caption && <span className="ask-caption">{block.caption}</span>}
      </div>

      <div className="parsons-prompt">
        <Markdown md={block.prompt} />
      </div>

      <ol className="parsons-list">
        {start.map((lineIndex, slot) => {
          const line = block.lines[lineIndex];
          const mark = !checked ? '' : lineIndex === slot ? ' ok' : ' off';
          return (
            <li
              key={lineIndex}
              className={`parsons-row${mark}${dragging === slot ? ' dragging' : ''}`}
              draggable={!(checked && solved)}
              onDragStart={() => setDragging(slot)}
              onDragEnd={() => setDragging(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragging !== null) move(dragging, slot);
                setDragging(null);
              }}
            >
              <span className="parsons-slot">{slot + 1}</span>
              <span className="parsons-grip" aria-hidden>
                ⠿
              </span>
              <code
                className="parsons-code"
                style={{ paddingLeft: indentOf(line) * 7.6 }}
              >
                {highlightCsharp(line.trimStart())}
              </code>
              <span className="parsons-moves">
                <button
                  aria-label={`Move line ${slot + 1} up`}
                  disabled={slot === 0 || (checked && solved)}
                  onClick={() => move(slot, slot - 1)}
                >
                  ▲
                </button>
                <button
                  aria-label={`Move line ${slot + 1} down`}
                  disabled={slot === start.length - 1 || (checked && solved)}
                  onClick={() => move(slot, slot + 1)}
                >
                  ▼
                </button>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="parsons-foot">
        <button className="primary" onClick={() => setChecked(true)}>
          Check the order
        </button>
        {checked && (
          <span className={`parsons-score${solved ? ' ok' : ''}`}>
            {solved
              ? 'That is the order.'
              : `${rightCount} of ${start.length} lines are in the right place.`}
          </span>
        )}
      </div>

      {checked && solved && block.explain && (
        <div className="parsons-explain">
          <Markdown md={block.explain} />
        </div>
      )}
    </div>
  );
}
