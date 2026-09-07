/**
 * Live SplashKit canvas.
 *
 * Runs the student's game loop frame by frame on requestAnimationFrame and
 * feeds real mouse and keyboard events back into SplashKit.ProcessEvents, so
 * ShapeDrawer is genuinely interactive without installing MSYS2 or the SDK.
 */

import { useEffect, useRef, useState } from 'react';
import { InteractiveRun } from '@/engine/runner';
import type { DrawCommand, RGBA } from '@/engine/splashkit';
import type { CompileError } from '@/engine/runner';
import type { StudentProfile } from '@/content/personalize';

const css = (c: RGBA) => `rgba(${c.r}, ${c.g}, ${c.b}, ${(c.a ?? 255) / 255})`;

function paint(ctx: CanvasRenderingContext2D, commands: DrawCommand[], w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  for (const cmd of commands) {
    ctx.fillStyle = css(cmd.color);
    ctx.strokeStyle = css(cmd.color);
    ctx.lineWidth = 1;
    switch (cmd.c) {
      case 'clear':
        ctx.fillRect(0, 0, w, h);
        break;
      case 'fillRect':
        ctx.fillRect(cmd.x, cmd.y, cmd.w, cmd.h);
        break;
      case 'drawRect':
        ctx.strokeRect(cmd.x + 0.5, cmd.y + 0.5, cmd.w, cmd.h);
        break;
      case 'fillCircle':
        ctx.beginPath();
        ctx.arc(cmd.x, cmd.y, Math.abs(cmd.r), 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'drawCircle':
        ctx.beginPath();
        ctx.arc(cmd.x, cmd.y, Math.abs(cmd.r), 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'fillEllipse':
      case 'drawEllipse':
        ctx.beginPath();
        ctx.ellipse(cmd.x + cmd.w / 2, cmd.y + cmd.h / 2, Math.abs(cmd.w) / 2, Math.abs(cmd.h) / 2, 0, 0, Math.PI * 2);
        if (cmd.c === 'fillEllipse') ctx.fill();
        else ctx.stroke();
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(cmd.x1, cmd.y1);
        ctx.lineTo(cmd.x2, cmd.y2);
        ctx.stroke();
        break;
      case 'text':
        ctx.font = `${cmd.size}px ui-monospace, monospace`;
        ctx.textBaseline = 'top';
        ctx.fillText(cmd.text, cmd.x, cmd.y);
        break;
    }
  }
}

export function CanvasPanel({
  source,
  running,
  onStopped,
  student,
}: {
  source: string;
  running: boolean;
  onStopped: () => void;
  student: StudentProfile;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runRef = useRef<InteractiveRun | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<CompileError | undefined>();
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [output, setOutput] = useState('');

  useEffect(() => {
    if (!running) return;

    const run = new InteractiveRun(source, { student });
    runRef.current = run;
    setError(run.error);
    setOutput('');

    if (run.error) {
      onStopped();
      return;
    }

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const r = runRef.current;
      if (!r) return;

      r.stepFrame();

      const sk = r.splashkit;
      if (sk) {
        if (sk.width !== size.w || sk.height !== size.h) setSize({ w: sk.width, h: sk.height });
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) paint(ctx, sk.frame, canvas.width, canvas.height);
      }

      if (r.finished) {
        setOutput(r.output);
        setError(r.error);
        onStopped();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      runRef.current?.requestClose();
      runRef.current = null;
    };
    // A new run starts only when `running` flips or the source changes.

  }, [running, source]);

  // Feed real input into the shim's queued state.
  const queue = () => runRef.current?.splashkit?.queued;

  const buttonName = (b: number) => (b === 0 ? 'LeftButton' : b === 2 ? 'RightButton' : 'MiddleButton');

  return (
    <>
      <div
        className="sk-stage"
        tabIndex={0}
        onKeyDown={(e) => {
          const q = queue();
          if (!q) return;
          q.typed.add(e.key);
          q.keysDown.add(e.key);
          if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
        }}
        onKeyUp={(e) => queue()?.keysDown.delete(e.key)}
      >
        <canvas
          ref={canvasRef}
          className="sk-canvas"
          width={size.w}
          height={size.h}
          onMouseMove={(e) => {
            const q = queue();
            if (!q) return;
            const r = e.currentTarget.getBoundingClientRect();
            q.mouseX = ((e.clientX - r.left) / r.width) * size.w;
            q.mouseY = ((e.clientY - r.top) / r.height) * size.h;
          }}
          onMouseDown={(e) => {
            const q = queue();
            if (!q) return;
            q.clicked.add(buttonName(e.button));
            q.down.add(buttonName(e.button));
            e.currentTarget.parentElement?.focus();
          }}
          onMouseUp={(e) => queue()?.down.delete(buttonName(e.button))}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {error && (
        <div className="err-box">
          <div className="err-title">{error.message}</div>
          {error.line > 0 && <div className="err-loc">line {error.line}, column {error.col}</div>}
          {error.hint && <div className="err-hint">{error.hint}</div>}
        </div>
      )}

      {output && !error && (
        <div className="console" style={{ flex: '0 0 auto', maxHeight: 120 }}>
          {output}
        </div>
      )}

      <div className="sk-hint">
        {running
          ? 'Click the canvas to focus it, then use your mouse and keyboard — the events reach your event loop.'
          : 'Press Run to start your game loop.'}
      </div>
    </>
  );
}
