/**
 * The editor, with the chrome a real IDE puts around one: a file tab, a
 * breadcrumb trail built from the student's own declarations, squiggles, an
 * autocomplete that knows their classes, and a status bar.
 *
 * None of it is decoration. The breadcrumb answers "which method am I in?" on
 * a 60-line file with no folding; the squiggle puts the compiler's teaching
 * hint on the line that caused it; the completion list is the fastest way to
 * discover that `Console` has a `WriteLine` without leaving the tab.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
  type ViewUpdate,
} from '@codemirror/view';
import { EditorState, Prec, type Extension } from '@codemirror/state';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
} from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab, toggleComment } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { lintKeymap, lintGutter } from '@codemirror/lint';

import { editorTheme, syntaxColors } from './theme';
import {
  buildIndex,
  csharpCompletions,
  csharpHover,
  csharpOverlay,
  indexChanged,
  scopeAt,
  type SymbolIndex,
} from './csharp';
import { csharpLinter, runErrorField, setRunError } from './diagnostics';
import { parse } from '@/engine/parser';
import type { CompileError } from '@/engine/runner';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');
const MOD = isMac ? '⌘' : 'Ctrl';

export interface CodeEditorProps {
  value: string;
  onChange: (next: string) => void;
  dark: boolean;
  /** Ctrl/Cmd+Enter and the toolbar button both call this. */
  onRun?: () => void;
  runLabel?: string;
  busy?: boolean;
  /** Shown as the file tab. */
  fileName?: string;
  /** Starter code, for the revert button. */
  seed?: string;
  /** Error from the last run, drawn as a squiggle on its line. */
  runError?: CompileError | null;
  /** Extra controls for the toolbar, right of Run. */
  toolbar?: React.ReactNode;
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  dark,
  onRun,
  runLabel = 'Run',
  busy,
  fileName = 'Program.cs',
  seed,
  runError,
  toolbar,
  readOnly,
}: CodeEditorProps) {
  const viewRef = useRef<EditorView | null>(null);
  const runRef = useRef(onRun);
  runRef.current = onRun;

  const [cursor, setCursor] = useState({ line: 1, col: 1, sel: 0 });
  const [wrap, setWrap] = useState(false);
  const [fontSize, setFontSize] = useState(13.5);

  // The index lags the keystroke by a beat so a half-typed line does not throw
  // away a perfectly good set of suggestions.
  const [index, setIndex] = useState<SymbolIndex>(() => buildIndex(value));
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    const id = setTimeout(() => {
      const next = buildIndex(value);
      // Keep the last index that parsed: mid-edit code almost never does.
      if (!next.parsed && indexRef.current.types.length > 0) return;
      setIndex(next);
      indexRef.current = next;
      viewRef.current?.dispatch({ effects: indexChanged.of(null) });
    }, 250);
    return () => clearTimeout(id);
  }, [value]);

  // The same parse the linter runs, kept here for the status bar's count.
  const [syntaxError, setSyntaxError] = useState<{ line: number; message: string } | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setSyntaxError(probeError(value)), 450);
    return () => clearTimeout(id);
  }, [value]);

  // Feed the last run's error into the editor state so the linter can draw it.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setRunError.of(runError ?? null) });
  }, [runError]);

  const runKeys = useMemo(
    () =>
      Prec.highest(
        keymap.of([
          {
            key: 'Mod-Enter',
            preventDefault: true,
            run: () => {
              runRef.current?.();
              return true;
            },
          },
          {
            key: 'Mod-s',
            preventDefault: true,
            run: () => {
              runRef.current?.();
              return true;
            },
          },
          { key: 'Mod-/', preventDefault: true, run: toggleComment },
          {
            // Escape releases the Tab key, so keyboard users are never trapped.
            key: 'Escape',
            run: (view) => {
              view.contentDOM.blur();
              return true;
            },
          },
        ]),
      ),
    [],
  );

  const extensions: Extension[] = useMemo(
    () => [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter({
        markerDOM: (open) => {
          const s = document.createElement('span');
          s.textContent = open ? '⌄' : '›';
          s.className = 'cm-foldMarker';
          return s;
        },
      }),
      lintGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      indentUnit.of('    '),
      bracketMatching(),
      closeBrackets(),
      rectangularSelection(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      runErrorField,
      java(),
      syntaxColors,
      csharpOverlay(() => indexRef.current),
      csharpHover(() => indexRef.current),
      csharpLinter(),
      autocompletion({
        activateOnTyping: true,
        closeOnBlur: true,
        maxRenderedOptions: 60,
        icons: true,
        override: [csharpCompletions(() => indexRef.current)],
      }),
      runKeys,
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        indentWithTab,
      ]),
      editorTheme(dark),
      ...(wrap ? [EditorView.lineWrapping] : []),
      ...(readOnly ? [EditorState.readOnly.of(true)] : []),
    ],
    [dark, wrap, readOnly, runKeys],
  );

  const onUpdate = useCallback((u: ViewUpdate) => {
    if (!u.selectionSet && !u.docChanged && !u.focusChanged) return;
    const { main } = u.state.selection;
    const line = u.state.doc.lineAt(main.head);
    setCursor({
      line: line.number,
      col: main.head - line.from + 1,
      sel: main.to - main.from,
    });
  }, []);

  const crumb = scopeAt(index, cursor.line);

  const jumpToError = () => {
    const view = viewRef.current;
    if (!view || !syntaxError) return;
    const n = Math.min(Math.max(syntaxError.line, 1), view.state.doc.lines);
    const pos = view.state.doc.line(n).from;
    view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
    view.focus();
  };

  const dirty = seed !== undefined && value !== seed;

  return (
    <div className="ide" style={{ ['--editor-size' as string]: `${fontSize}px` }}>
      <div className="ide-tabs">
        <div className="ide-tab active" title={fileName}>
          <FileIcon />
          <span>{fileName}</span>
          {dirty && <span className="ide-dot" title="Unsaved changes to the starter code" aria-hidden />}
        </div>

        <span className="spacer" />

        {toolbar}

        {seed !== undefined && (
          <button
            className="icon-btn"
            title="Restore the starter code"
            aria-label="Restore the starter code"
            disabled={!dirty}
            onClick={() => onChange(seed)}
          >
            <RevertIcon />
          </button>
        )}

        {onRun && (
          <button className="run-btn" onClick={onRun} disabled={busy} title={`${MOD}+Enter`}>
            {busy ? <Spinner /> : <PlayIcon />}
            <span>{busy ? 'Running…' : runLabel}</span>
            <span className="keys">
              <kbd>{MOD}</kbd>
              <kbd>↵</kbd>
            </span>
          </button>
        )}
      </div>

      <div className="ide-crumbs" aria-hidden>
        <span className="crumb">{fileName}</span>
        {crumb && (
          <>
            <span className="crumb-sep">›</span>
            <span className="crumb crumb-type">{crumb.type}</span>
          </>
        )}
        {crumb?.member && (
          <>
            <span className="crumb-sep">›</span>
            <span className="crumb crumb-member">{crumb.member}</span>
          </>
        )}
        {!crumb && <span className="crumb-hint">top level</span>}
      </div>

      <div className="ide-editor">
        <CodeMirror
          value={value}
          height="100%"
          basicSetup={false}
          // Without this the wrapper injects its own light theme after ours,
          // which paints the content white in dark mode.
          theme="none"
          extensions={extensions}
          onChange={onChange}
          onUpdate={onUpdate}
          onCreateEditor={(view) => {
            viewRef.current = view;
          }}
        />
      </div>

      <div className="ide-status">
        <button className="status-item" onClick={() => viewRef.current?.focus()}>
          Ln {cursor.line}, Col {cursor.col}
          {cursor.sel > 0 && <> ({cursor.sel} selected)</>}
        </button>

        {syntaxError ? (
          <button className="status-item status-bad" onClick={jumpToError} title={syntaxError.message}>
            <ErrorIcon /> 1 problem — line {syntaxError.line}
          </button>
        ) : (
          <span className="status-item status-ok">
            <CheckIcon /> No syntax errors
          </span>
        )}

        <span className="spacer" />

        <button
          className="status-item"
          onClick={() => setWrap((w) => !w)}
          title="Toggle word wrap"
        >
          Wrap: {wrap ? 'on' : 'off'}
        </button>
        <span className="status-item">Spaces: 4</span>
        <div className="status-zoom">
          <button
            className="status-item"
            onClick={() => setFontSize((s) => Math.max(11, s - 1))}
            aria-label="Smaller text"
          >
            −
          </button>
          <span className="status-item">{Math.round(fontSize)}px</span>
          <button
            className="status-item"
            onClick={() => setFontSize((s) => Math.min(20, s + 1))}
            aria-label="Larger text"
          >
            +
          </button>
        </div>
        <span className="status-item status-lang">C#</span>
      </div>
    </div>
  );
}

/** Parse purely to recover a line number and message for the status bar. */
function probeError(source: string): { line: number; message: string } | null {
  try {
    parse(source);
    return null;
  } catch (e) {
    const err = e as { line?: number; message?: string };
    return { line: err.line ?? 1, message: err.message ?? 'Syntax error' };
  }
}

// ------------------------------------------------------------------- icons

const FileIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
    <path d="M4 1.5h5L12.5 5v9.5h-8.5z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M9 1.5V5h3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
    <path d="M4 2.6l9 5.4-9 5.4z" fill="currentColor" />
  </svg>
);

const RevertIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
    <path
      d="M3 8a5 5 0 1 0 1.6-3.7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path d="M2.4 2.6v3.2h3.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden>
    <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 4.6v4.2M8 10.8v.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden>
    <path d="M3 8.4l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Spinner = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" className="spin" aria-hidden>
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
