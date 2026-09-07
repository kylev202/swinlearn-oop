/**
 * Stack and heap visualiser with a time-travel scrubber.
 *
 * This is the tool the site exists for. Week 3 assesses the stack/heap split,
 * reference-versus-value semantics and garbage collection (Quiz 3 Q1, Q3, Q7,
 * Q8, Q12, Q13), and Week 2's Counter task hides an aliasing trap that the
 * PDF never draws. Here the student scrubs through their own execution and
 * watches the arrows.
 */

import { useEffect, useState } from 'react';
import type { MemorySnapshot } from '@/engine/runner';

export function MemoryPanel({ snapshots }: { snapshots: MemorySnapshot[] }) {
  const [index, setIndex] = useState(snapshots.length - 1);
  const [focused, setFocused] = useState<number | null>(null);

  // A fresh run should land on the final state, not a stale index.
  useEffect(() => {
    setIndex(snapshots.length - 1);
    setFocused(null);
  }, [snapshots]);

  if (!snapshots.length) {
    return (
      <div className="diagram-wrap">
        <p className="mem-empty">
          Run your code with tracing on to see the stack and the heap here.
        </p>
      </div>
    );
  }

  const clamped = Math.min(Math.max(index, 0), snapshots.length - 1);
  const snap = snapshots[clamped];

  const step = (delta: number) => setIndex((i) => Math.min(Math.max(i + delta, 0), snapshots.length - 1));

  return (
    <>
      <div className="scrubber">
        <button className="ghost" onClick={() => step(-1)} disabled={clamped === 0} title="Previous step">
          ←
        </button>
        <input
          type="range"
          min={0}
          max={snapshots.length - 1}
          value={clamped}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label="Execution step"
        />
        <button
          className="ghost"
          onClick={() => step(1)}
          disabled={clamped === snapshots.length - 1}
          title="Next step"
        >
          →
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
          {clamped + 1}/{snapshots.length}
          {snap.line > 0 && ` · line ${snap.line}`}
        </span>
      </div>

      {snap.note && <div className="scrub-note">{snap.note}</div>}

      <div className="diagram-wrap">
        <div className="mem">
          <div className="mem-col">
            <div className="mem-col-head">
              Stack
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                — one frame per active call
              </span>
            </div>
            {snap.frames.length === 0 && <p className="mem-empty">No active calls.</p>}
            {[...snap.frames].reverse().map((f, i) => (
              <div key={`${f.label}-${i}`} className={`frame${i === 0 ? ' top' : ''}`}>
                <div className="frame-head">
                  <span>{f.label}</span>
                  <span className="heap-id">line {f.line}</span>
                </div>
                {f.thisId !== undefined && (
                  <div className="slot">
                    <span className="slot-name">this</span>
                    <button
                      className="slot-ref"
                      onClick={() => setFocused(f.thisId!)}
                      title="Highlight this object on the heap"
                    >
                      →#{f.thisId}
                    </button>
                  </div>
                )}
                {f.locals.length === 0 && f.thisId === undefined && (
                  <div className="slot">
                    <span className="slot-name" style={{ fontStyle: 'italic' }}>
                      no locals yet
                    </span>
                  </div>
                )}
                {f.locals.map((l) => (
                  <div className="slot" key={l.name}>
                    <span className="slot-name">{l.name}</span>
                    {l.refId !== undefined ? (
                      <button
                        className="slot-ref"
                        onClick={() => setFocused(l.refId!)}
                        title={`Points at heap object #${l.refId}`}
                      >
                        →#{l.refId}
                      </button>
                    ) : (
                      <span className="slot-val">{l.value}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mem-col">
            <div className="mem-col-head">
              Heap
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                — objects created with new
              </span>
            </div>
            {snap.heap.length === 0 && <p className="mem-empty">Nothing allocated yet.</p>}
            {snap.heap.map((h) => (
              <div
                key={h.id}
                className={[
                  'heap-obj',
                  h.reachable ? '' : 'unreachable',
                  focused === h.id ? 'highlight' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="heap-head">
                  <span>{h.type}</span>
                  <span className="heap-id">
                    #{h.id}
                    {!h.reachable && ' · garbage'}
                  </span>
                </div>
                {h.fields.length === 0 && (
                  <div className="slot">
                    <span className="slot-val">{h.summary}</span>
                  </div>
                )}
                {h.fields.slice(0, 24).map((f, i) => (
                  <div className="slot" key={`${f.name}-${i}`}>
                    <span className="slot-name">{f.name}</span>
                    {f.refId !== undefined ? (
                      <button className="slot-ref" onClick={() => setFocused(f.refId!)}>
                        →#{f.refId}
                      </button>
                    ) : (
                      <span className="slot-val">{f.value}</span>
                    )}
                  </div>
                ))}
                {h.fields.length > 24 && (
                  <div className="slot">
                    <span className="slot-name">…{h.fields.length - 24} more</span>
                  </div>
                )}
              </div>
            ))}
            {snap.heap.some((h) => !h.reachable) && (
              <p className="mem-empty">
                Faded objects are unreachable — nothing on the stack points at them any more, so the
                garbage collector is free to reclaim them.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
