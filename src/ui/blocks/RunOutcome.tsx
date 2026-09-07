/**
 * What a run produced: the error, the console, or the tool panel it earned.
 *
 * Shared by the inline demos and the predict-then-run blocks, because those
 * two show a result the same way and only differ in what happens before it.
 */

import { useMemo, type ReactNode } from 'react';
import type { Tool } from '@/content/types';
import type { RunResult } from '@/engine/runner';
import { buildSequence } from '@/tools/sequence';

import { MemoryPanel } from '../panels/MemoryPanel';
import { SequenceView } from '../panels/SequenceView';

export function RunOutcome({
  result,
  tool,
  canvas,
}: {
  result: RunResult | null;
  tool: Tool;
  /** The canvas panel, which owns a running loop and so is built by the caller. */
  canvas?: ReactNode;
}) {
  const sequence = useMemo(
    () => (tool === 'sequence' && result ? buildSequence(result.calls) : null),
    [result, tool],
  );

  return (
    <>
      {result?.error && (
        <div className="err-box">
          <div className="err-title">{result.error.message}</div>
          {result.error.line > 0 && (
            <div className="err-loc">
              line {result.error.line}, column {result.error.col}
            </div>
          )}
          {result.error.hint && <div className="err-hint">{result.error.hint}</div>}
        </div>
      )}

      {tool === 'console' && result && !result.error && (
        <div className="console" style={{ maxHeight: 260 }}>
          {result.output || <span className="console-empty">(printed nothing)</span>}
        </div>
      )}

      {tool === 'memory' && result && (
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 440, minHeight: 300 }}>
          <MemoryPanel snapshots={result.snapshots} />
        </div>
      )}

      {tool === 'sequence' && sequence && (
        <div className="diagram-wrap" style={{ maxHeight: 420 }}>
          <SequenceView model={sequence} />
        </div>
      )}

      {canvas}

      {/* A memory or sequence run still printed something; show it underneath
          rather than making the student switch panels to find it. */}
      {result && !result.error && tool !== 'console' && result.output && (
        <div
          className="console"
          style={{ flex: '0 0 auto', maxHeight: 120, borderTop: '1px solid var(--border)' }}
        >
          {result.output}
        </div>
      )}
    </>
  );
}
