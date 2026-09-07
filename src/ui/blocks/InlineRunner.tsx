/**
 * A demo you can run without leaving the sentence that introduced it.
 *
 * Code, a Run button and the tool the block is teaching with, all inline in
 * the reading flow — which is the whole complaint about having a lecture PDF
 * and a lab PDF open side by side.
 */

import { useCallback, useEffect, useState } from 'react';
import type { Tool } from '@/content/types';
import type { StudentProfile } from '@/content/personalize';
import { runProgram, type RunResult } from '@/engine/runner';

import { highlightCsharp } from '../CodeBlock';
import { CanvasPanel } from '../panels/CanvasPanel';
import { RunOutcome } from './RunOutcome';

export function InlineRunner({
  code,
  caption,
  tool,
  autoRun,
  student,
}: {
  code: string;
  caption?: string;
  tool: Tool;
  autoRun?: boolean;
  student: StudentProfile;
}) {
  const [source] = useState(code);
  const [result, setResult] = useState<RunResult | null>(null);
  const [open, setOpen] = useState(false);
  const [canvasRunning, setCanvasRunning] = useState(false);

  const run = useCallback(() => {
    if (tool === 'canvas') {
      setCanvasRunning(true);
      setOpen(true);
      return;
    }
    setResult(runProgram(source, { trace: tool === 'memory' || tool === 'sequence', student }));
    setOpen(true);
  }, [source, student, tool]);

  // autoRun demos show their result immediately, once per block.
  useEffect(() => {
    if (autoRun) run();
  }, [autoRun, run]);

  return (
    <div className="code-card">
      <div className="code-card-head">
        <span>{caption ?? 'Try it'}</span>
        <span style={{ flex: 1 }} />
        <button className="primary" style={{ padding: '3px 12px', fontSize: 12.5 }} onClick={run}>
          Run ▸
        </button>
        {open && (
          <button
            className="ghost"
            style={{ padding: '3px 9px', fontSize: 12.5 }}
            onClick={() => {
              setOpen(false);
              setCanvasRunning(false);
            }}
          >
            Hide
          </button>
        )}
      </div>

      <pre style={{ margin: 0, borderRadius: 0, border: 'none', maxHeight: 340, overflow: 'auto' }}>
        <code>{highlightCsharp(source)}</code>
      </pre>

      {open && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 460,
          }}
        >
          <RunOutcome
            result={result}
            tool={tool}
            canvas={
              tool === 'canvas' ? (
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 340 }}>
                  <CanvasPanel
                    source={source}
                    running={canvasRunning}
                    onStopped={() => setCanvasRunning(false)}
                    student={student}
                  />
                </div>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
