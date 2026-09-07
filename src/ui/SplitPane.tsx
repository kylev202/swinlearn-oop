/**
 * A draggable divider between two panes.
 *
 * Remembers its position per key, because the ratio a student wants between
 * prose and editor is a preference, not a per-step decision. The handle is a
 * real ARIA separator: arrow keys move it, so this is not mouse-only.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

const KEY_PREFIX = 'swinlearn.split.';

function readStored(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function SplitPane({
  direction,
  storageKey,
  initial = 50,
  min = 20,
  max = 80,
  first,
  second,
  /** Hide the second pane and the handle entirely. */
  collapsed = false,
  label,
}: {
  direction: 'horizontal' | 'vertical';
  storageKey: string;
  initial?: number;
  min?: number;
  max?: number;
  first: ReactNode;
  second: ReactNode;
  collapsed?: boolean;
  label: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [pct, setPct] = useState(() => readStored(storageKey, initial));
  const [dragging, setDragging] = useState(false);

  const clamp = useCallback((n: number) => Math.min(max, Math.max(min, n)), [min, max]);

  const commit = useCallback(
    (n: number) => {
      const v = clamp(n);
      setPct(v);
      try {
        localStorage.setItem(KEY_PREFIX + storageKey, String(Math.round(v * 10) / 10));
      } catch {
        // Blocked storage just means the ratio resets next visit.
      }
    },
    [clamp, storageKey],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    const next =
      direction === 'horizontal'
        ? ((e.clientX - box.left) / box.width) * 100
        : ((e.clientY - box.top) / box.height) * 100;
    commit(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setDragging(false);
  };

  // While dragging, nothing else should take the pointer or show a text caret.
  useEffect(() => {
    if (!dragging) return;
    const prev = document.body.style.cursor;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.classList.add('is-dragging');
    return () => {
      document.body.style.cursor = prev;
      document.body.classList.remove('is-dragging');
    };
  }, [dragging, direction]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const back = direction === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const fwd = direction === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    if (e.key === back) commit(pct - step);
    else if (e.key === fwd) commit(pct + step);
    else if (e.key === 'Home') commit(min);
    else if (e.key === 'End') commit(max);
    else return;
    e.preventDefault();
  };

  const size = collapsed ? '100%' : `${pct}%`;

  return (
    <div ref={wrapRef} className={`split split-${direction}${dragging ? ' dragging' : ''}`}>
      <div
        className="split-pane"
        style={direction === 'horizontal' ? { width: size } : { height: size }}
      >
        {first}
      </div>

      {!collapsed && (
        <div
          className="split-handle"
          role="separator"
          tabIndex={0}
          aria-label={label}
          aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
          aria-valuenow={Math.round(pct)}
          aria-valuemin={min}
          aria-valuemax={max}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={() => commit(initial)}
          onKeyDown={onKeyDown}
        >
          <span className="split-grip" aria-hidden />
        </div>
      )}

      {!collapsed && <div className="split-pane split-rest">{second}</div>}
    </div>
  );
}
