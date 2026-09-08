/**
 * The right-hand working pane: editor, run controls, and the tool tabs.
 *
 * Laid out the way an IDE is — file tab and toolbar on top, editor in the
 * middle, a resizable results panel underneath — because the students using
 * this will spend the rest of the unit in Visual Studio, and every hour spent
 * here should transfer. The tab set is still driven by what the step is
 * teaching, so the memory visualiser sits next to the aliasing step and the
 * canvas next to ShapeDrawer.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { runChecks, type CheckResult } from '@/engine/checks';
import { runProgram, type CompileError, type RunResult } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { buildUml, type UmlModel } from '@/tools/uml';
import { buildSequence } from '@/tools/sequence';
import type { Check, Exercise, Tool } from '@/content/types';
import type { StudentProfile } from '@/content/personalize';

import { CodeEditor } from './editor/CodeEditor';
import { SplitPane } from './SplitPane';
import { MemoryPanel } from './panels/MemoryPanel';
import { UmlView } from './panels/UmlView';
import { SequenceView } from './panels/SequenceView';
import { CanvasPanel } from './panels/CanvasPanel';

const TAB_LABELS: Record<Tool, string> = {
  console: 'Output',
  tests: 'Checks',
  memory: 'Memory',
  uml: 'Diagram',
  sequence: 'Sequence',
  canvas: 'Canvas',
};

const TAB_ICONS: Record<Tool, string> = {
  console: '▤',
  tests: '✓',
  memory: '▦',
  uml: '◫',
  sequence: '⇄',
  canvas: '◐',
};

export interface WorkbenchProps {
  /** Present for exercises; absent for read-only runnable samples. */
  exercise?: Exercise;
  /** Code for a runnable sample when there is no exercise. */
  sampleCode?: string;
  /** Tabs to offer, first one is the default. */
  tools: Tool[];
  code: string;
  onCodeChange: (code: string) => void;
  student: StudentProfile;
  onSolved?: () => void;
  /** How many hints have been revealed, persisted so leaving the step and coming back does not hand them back for free. */
  hintsShown?: number;
  onHintsChange?: (hintsShown: number) => void;
  /** Run as soon as it mounts, for demo blocks. */
  autoRun?: boolean;
  dark?: boolean;
}

interface RunStats {
  ms: number;
  steps: number;
  ok: boolean;
}

export function Workbench(props: WorkbenchProps) {
  const {
    exercise,
    tools,
    code,
    onCodeChange,
    student,
    onSolved,
    hintsShown = 0,
    onHintsChange,
    autoRun,
    dark = false,
  } = props;

  const [tab, setTab] = useState<Tool>(tools[0] ?? 'console');
  const [result, setResult] = useState<RunResult | null>(null);
  const [stats, setStats] = useState<RunStats | null>(null);
  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [checkError, setCheckError] = useState<CompileError | undefined>();
  const [busy, setBusy] = useState(false);
  const [canvasRunning, setCanvasRunning] = useState(false);
  const [canvasSource, setCanvasSource] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [taskOpen, setTaskOpen] = useState(true);
  const [flash, setFlash] = useState(false);
  const solvedRef = useRef(false);

  const wantsTrace = tools.includes('memory') || tools.includes('sequence');

  const run = useCallback(() => {
    setBusy(true);
    setCollapsed(false);
    // Yield a frame so the button shows its pressed state on slow programs.
    requestAnimationFrame(() => {
      try {
        if (tools.includes('canvas')) {
          setCanvasSource(code);
          setCanvasRunning(true);
          setTab('canvas');
          return;
        }

        const started = performance.now();
        const r = runProgram(code, {
          trace: wantsTrace,
          student,
          stdin: exercise?.stdin,
        });
        setResult(r);
        setStats({ ms: performance.now() - started, steps: r.steps, ok: r.ok });

        if (exercise) {
          const c = runChecks(exercise.tests as Check[], {
            source: code,
            harness: exercise.harness,
            stdin: exercise.stdin,
            student,
          });
          setChecks(c.results);
          setCheckError(c.error);
          if (c.allPassed && !solvedRef.current) {
            solvedRef.current = true;
            setFlash(true);
            onSolved?.();
          }
          if (!c.allPassed) solvedRef.current = false;
          setTab(c.allPassed ? (tools[0] ?? 'tests') : 'tests');
        }
      } finally {
        setBusy(false);
      }
    });
  }, [code, exercise, onSolved, student, tools, wantsTrace]);

  // Reset per-step state when the exercise changes.
  useEffect(() => {
    setResult(null);
    setStats(null);
    setChecks(null);
    setCheckError(undefined);
    setCanvasRunning(false);
    setFlash(false);
    setTaskOpen(true);
    solvedRef.current = false;
    setTab(tools[0] ?? 'console');
  }, [exercise?.prompt, props.sampleCode]);

  useEffect(() => {
    if (autoRun) run();
    // Only on mount for demo blocks.
  }, [autoRun]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(false), 2600);
    return () => clearTimeout(id);
  }, [flash]);

  const uml: UmlModel | null = useMemo(() => {
    if (!tools.includes('uml')) return null;
    try {
      return buildUml(parse(code));
    } catch {
      return null;
    }
  }, [code, tools]);

  const sequence = useMemo(() => {
    if (!tools.includes('sequence') || !result) return null;
    return buildSequence(result.calls);
  }, [result, tools]);

  const passCount = checks?.filter((c) => c.passed).length ?? 0;
  const allPassed = !!checks && checks.length > 0 && passCount === checks.length;
  const runError = checkError ?? result?.error ?? null;

  const hintButton = exercise ? (
    <button
      className="tool-btn"
      onClick={() => onHintsChange?.(Math.min(hintsShown + 1, exercise.hints.length))}
      disabled={hintsShown >= exercise.hints.length}
    >
      <HintIcon />
      {hintsShown === 0 ? 'Need a hint?' : `Another hint (${hintsShown}/${exercise.hints.length})`}
    </button>
  ) : null;

  const editor = (
    <CodeEditor
      value={code}
      onChange={onCodeChange}
      dark={dark}
      onRun={run}
      runLabel={tools.includes('canvas') ? 'Run' : exercise ? 'Run & check' : 'Run'}
      busy={busy}
      seed={exercise?.seed}
      runError={runError}
      toolbar={
        <>
          {hintButton}
          {canvasRunning && (
            <button className="tool-btn" onClick={() => setCanvasRunning(false)}>
              <span aria-hidden>■</span> Stop
            </button>
          )}
        </>
      }
    />
  );

  const tabs = (
    <div className="wb-tabs" role="tablist" aria-label="Results">
      {tools.map((t) => (
        <button
          key={t}
          role="tab"
          id={`wb-tab-${t}`}
          aria-controls="wb-panel-body"
          aria-selected={tab === t}
          className={`wb-tab${tab === t && !collapsed ? ' active' : ''}`}
          onClick={() => {
            setTab(t);
            setCollapsed(false);
          }}
        >
          <span className="wb-tab-icon" aria-hidden>
            {TAB_ICONS[t]}
          </span>
          {TAB_LABELS[t]}
          {t === 'tests' && checks && (
            <span className={`wb-badge ${allPassed ? 'ok' : 'bad'}`}>
              {passCount}/{checks.length}
            </span>
          )}
        </button>
      ))}

      <span className="spacer" />

      {allPassed && (
        <span className="wb-solved" role="status">
          <span aria-hidden>✓</span> All checks passed
        </span>
      )}

      <button
        className="icon-btn"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Show the results panel' : 'Hide the results panel'}
        title={collapsed ? 'Show the results panel' : 'Hide the results panel'}
      >
        <span aria-hidden>{collapsed ? '⌃' : '⌄'}</span>
      </button>
    </div>
  );

  const body = (
    <div className="wb-body" id="wb-panel-body" role="tabpanel" aria-labelledby={`wb-tab-${tab}`}>
      {exercise &&
        exercise.hints.slice(0, hintsShown).map((h, i) => (
          <div className="hint-box" key={i}>
            <div className="hint-label">Hint {i + 1}</div>
            {h}
          </div>
        ))}

      {tab === 'tests' && <ChecksView checks={checks} error={checkError} />}

      {tab === 'console' && <ConsoleView result={result} stats={stats} />}

      {tab === 'memory' && <MemoryPanel snapshots={result?.snapshots ?? []} />}

      {tab === 'uml' && (
        <>
          <div className="diagram-note">
            Generated from the code above. Aggregation (◇) means a collection of; a plain arrow means
            one object holds one other.
          </div>
          <div className="diagram-wrap">
            {uml ? (
              <UmlView model={uml} />
            ) : (
              <p className="mem-empty">Fix the syntax errors and the diagram will appear.</p>
            )}
          </div>
        </>
      )}

      {tab === 'sequence' && (
        <>
          <div className="diagram-note">
            Recorded from your run. Solid arrows are calls, dashed are returns, and the shaded bars
            show how long each method was on the stack.
          </div>
          <div className="diagram-wrap">
            {sequence ? (
              <SequenceView model={sequence} />
            ) : (
              <p className="mem-empty">Run your code to record a call trace.</p>
            )}
          </div>
        </>
      )}

      {tab === 'canvas' && (
        <CanvasPanel
          source={canvasSource || code}
          running={canvasRunning}
          onStopped={() => setCanvasRunning(false)}
          student={student}
        />
      )}
    </div>
  );

  return (
    <div className="pane-work">
      {exercise && (
        <div className={`prompt-box${taskOpen ? '' : ' closed'}`}>
          <button className="prompt-toggle" onClick={() => setTaskOpen((o) => !o)} aria-expanded={taskOpen}>
            <span className="prompt-label">
              <span className="prompt-chevron" aria-hidden>
                {taskOpen ? '⌄' : '›'}
              </span>
              Your task
            </span>
            {!taskOpen && <span className="prompt-peek">{exercise.prompt}</span>}
          </button>
          {taskOpen && <div className="prompt-text">{exercise.prompt}</div>}
        </div>
      )}

      {collapsed ? (
        <>
          <div className="wb-editor-full">{editor}</div>
          {tabs}
        </>
      ) : (
        <SplitPane
          direction="vertical"
          storageKey="workbench"
          initial={58}
          min={24}
          max={86}
          label="Resize the editor and the results panel"
          first={editor}
          second={
            <div className="wb-panel">
              {tabs}
              {body}
            </div>
          }
        />
      )}

      {flash && (
        <div className="toast" role="status">
          <span className="toast-mark" aria-hidden>
            ✓
          </span>
          <div>
            <strong>Every check passed.</strong>
            <div className="toast-sub">This step is marked done — press Next when you are ready.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ views

function ChecksView({ checks, error }: { checks: CheckResult[] | null; error?: CompileError }) {
  if (!checks) {
    return (
      <div className="checks">
        <div className="panel-empty">
          <span className="panel-empty-mark" aria-hidden>
            ✓
          </span>
          <p>
            Press <strong>Run &amp; check</strong> to see how you are doing.
          </p>
          <p className="panel-empty-sub">Each requirement is checked separately, and says what is missing.</p>
        </div>
      </div>
    );
  }

  const passed = checks.filter((c) => c.passed).length;
  const pct = checks.length ? (passed / checks.length) * 100 : 0;

  return (
    <div className="checks">
      <div className="checks-summary">
        <div className="progress-track" style={{ flex: 1 }}>
          <div
            className={`progress-fill${passed === checks.length ? ' full' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="checks-count">
          {passed} of {checks.length} passing
        </span>
      </div>

      {error && (
        <div className="err-box" style={{ margin: '0 0 12px' }}>
          <div className="err-title">{error.message}</div>
          {error.line > 0 && (
            <div className="err-loc">
              line {error.line}, column {error.col}
            </div>
          )}
          {error.hint && <div className="err-hint">{error.hint}</div>}
        </div>
      )}

      {checks.map((c, i) => (
        <div key={i} className={`check-row ${c.passed ? 'pass' : 'fail'}`} style={{ animationDelay: `${i * 45}ms` }}>
          <span className="check-icon" aria-hidden>
            {c.passed ? (
              <svg viewBox="0 0 16 16" width="17" height="17">
                <circle cx="8" cy="8" r="7" fill="var(--ok)" />
                <path
                  d="M4.5 8.2l2.3 2.3 4.6-4.8"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="17" height="17">
                <circle cx="8" cy="8" r="7" fill="none" stroke="var(--bad)" strokeWidth="1.6" />
                <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="var(--bad)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div>{c.label}</div>
            {!c.passed && c.detail && <div className="check-detail">{c.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConsoleView({ result, stats }: { result: RunResult | null; stats: RunStats | null }) {
  if (!result) {
    return (
      <div className="term">
        <div className="term-line term-idle">
          <span className="term-prompt" aria-hidden>
            ›
          </span>
          Press Run to build and execute your program.
        </div>
      </div>
    );
  }

  return (
    <div className="term">
      <div className="term-line term-cmd">
        <span className="term-prompt" aria-hidden>
          ›
        </span>
        dotnet run
      </div>

      {result.error && (
        <div className="err-box">
          <div className="err-title">
            {result.error.phase === 'parse' ? 'The compiler could not read this' : 'Your program stopped'}
          </div>
          <div style={{ fontFamily: 'var(--sans)', marginBottom: 4 }}>{result.error.message}</div>
          {result.error.line > 0 && (
            <div className="err-loc">
              line {result.error.line}, column {result.error.col}
            </div>
          )}
          {result.error.hint && <div className="err-hint">{result.error.hint}</div>}
        </div>
      )}

      <pre className="term-out">
        {result.output || <span className="console-empty">(your program printed nothing)</span>}
      </pre>

      {stats && (
        <div className={`term-line term-exit ${stats.ok ? 'ok' : 'bad'}`}>
          <span className="term-prompt" aria-hidden>
            ›
          </span>
          {stats.ok ? 'Finished' : 'Stopped'} · {stats.steps.toLocaleString()} steps ·{' '}
          {stats.ms < 1 ? '<1' : Math.round(stats.ms)} ms
          {result.truncated && ' · trace truncated'}
        </div>
      )}
    </div>
  );
}

/** A lamp, drawn rather than borrowed from the emoji table. */
const HintIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden style={{ flex: 'none' }}>
    <path
      d="M8 1.9a4 4 0 0 0-2.4 7.2c.4.3.6.7.6 1.2v.3h3.6v-.3c0-.5.2-.9.6-1.2A4 4 0 0 0 8 1.9Z"
      fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
    />
    <path d="M6.4 12.6h3.2M7 14.2h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
