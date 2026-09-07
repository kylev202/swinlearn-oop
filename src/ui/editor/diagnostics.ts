/**
 * Squiggles in the editor.
 *
 * Two sources feed the same gutter: the parser, which runs as the student
 * types, and whatever the last run threw, pushed in from the Workbench. The
 * teaching hints the engine already writes travel with the diagnostic, so the
 * explanation is on the line that caused it rather than only in a panel below.
 */

import { linter, type Diagnostic } from '@codemirror/lint';
import { StateEffect, StateField, type EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

import { parse } from '@/engine/parser';
import type { CompileError } from '@/engine/runner';

/** Push (or clear) the error from the most recent run. */
export const setRunError = StateEffect.define<CompileError | null>();

export const runErrorField = StateField.define<CompileError | null>({
  create: () => null,
  update(value, tr) {
    for (const e of tr.effects) if (e.is(setRunError)) return e.value;
    // Any edit invalidates last run's complaint — it is about older text.
    return tr.docChanged ? null : value;
  },
});

/** 1-based line/col to a document offset, clamped to the document. */
function offsetOf(state: EditorState, line: number, col: number): number {
  const n = Math.min(Math.max(line, 1), state.doc.lines);
  const l = state.doc.line(n);
  return Math.min(l.from + Math.max(col - 1, 0), l.to);
}

/** Underline the whole token at a position, so a squiggle is visible. */
function tokenRange(state: EditorState, from: number): [number, number] {
  const line = state.doc.lineAt(from);
  const rest = line.text.slice(from - line.from);
  const m = /^[A-Za-z_]\w*|^[^\s]/.exec(rest);
  const len = m ? m[0].length : 1;
  return [from, Math.min(from + len, line.to === from ? line.to + 1 : line.to)];
}

function toDiagnostic(state: EditorState, err: CompileError, severity: 'error' | 'warning'): Diagnostic {
  const at = offsetOf(state, err.line, err.col);
  const [from, to] = tokenRange(state, at);
  return {
    from,
    to: Math.max(to, from + 1),
    severity,
    message: err.hint ? `${err.message}\n\n${err.hint}` : err.message,
    source: err.phase === 'parse' ? 'C# compiler' : 'runtime',
  };
}

export function csharpLinter() {
  return linter(
    (view: EditorView) => {
      const out: Diagnostic[] = [];
      const state = view.state;

      try {
        parse(state.doc.toString());
      } catch (e) {
        const err = e as { message?: string; line?: number; col?: number; hint?: string };
        if (typeof err.line === 'number' && err.line > 0) {
          out.push(
            toDiagnostic(
              state,
              { message: err.message ?? 'Syntax error', line: err.line, col: err.col ?? 1, hint: err.hint, phase: 'parse' },
              'error',
            ),
          );
        }
      }

      const runErr = state.field(runErrorField, false);
      // A parse error already covers the same ground; do not say it twice.
      if (runErr && runErr.line > 0 && out.length === 0) {
        out.push(toDiagnostic(state, runErr, runErr.phase === 'parse' ? 'error' : 'warning'));
      }

      return out;
    },
    { delay: 450 },
  );
}
