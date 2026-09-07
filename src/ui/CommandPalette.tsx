/**
 * Ctrl/Cmd+K: jump anywhere.
 *
 * A week is thirty-odd steps. Scrolling a sidebar to find "the one about
 * aliasing" is slower than typing "alias", and the palette is the interaction
 * every editor the students will meet next already has.
 */

import { useEffect, useMemo, useRef, useState } from 'react';

export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  group: string;
  hint?: string;
  run: () => void;
}

/** Subsequence match, so "biobj" finds "Basic Objects". */
function score(query: string, text: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const direct = t.indexOf(q);
  if (direct >= 0) return 1000 - direct;

  let qi = 0;
  let hits = 0;
  let lastHit = -1;
  let streak = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      hits++;
      streak += lastHit === ti - 1 ? 2 : 0;
      lastHit = ti;
      qi++;
    }
  }
  return qi === q.length ? 100 + hits + streak : 0;
}

export function CommandPalette({
  open,
  commands,
  onClose,
}: {
  open: boolean;
  commands: Command[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // Focus after the element exists in the tree.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const matches = useMemo(() => {
    const scored = commands
      .map((c) => ({ c, s: Math.max(score(query, c.title), score(query, `${c.group} ${c.title}`) - 5) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40);
    return scored.map((x) => x.c);
  }, [commands, query]);

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(matches.length - 1, 0)));
  }, [matches.length]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  if (!open) return null;

  const choose = (i: number) => {
    const cmd = matches[i];
    if (!cmd) return;
    onClose();
    cmd.run();
  };

  return (
    <div className="palette-scrim" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="palette-input">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            placeholder="Jump to a lesson, a step, or a setting…"
            aria-label="Search commands"
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => (a + 1) % Math.max(matches.length, 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => (a - 1 + matches.length) % Math.max(matches.length, 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                choose(active);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />
          <kbd>Esc</kbd>
        </div>

        <div className="palette-list" ref={listRef}>
          {matches.length === 0 && <div className="palette-empty">Nothing matches “{query}”.</div>}
          {matches.map((c, i) => (
            <button
              key={c.id}
              data-index={i}
              className={`palette-row${i === active ? ' active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <span className="palette-group">{c.group}</span>
              <span className="palette-title">{c.title}</span>
              {c.subtitle && <span className="palette-sub">{c.subtitle}</span>}
              {c.hint && <kbd className="palette-hint">{c.hint}</kbd>}
            </button>
          ))}
        </div>

        <div className="palette-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>↵</kbd> to open
          </span>
          <span className="spacer" />
          <span>{matches.length} results</span>
        </div>
      </div>
    </div>
  );
}

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
    <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.4 10.4L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
