/**
 * Predict, then run.
 *
 * A worked example a student scrolls past leaves nothing behind. The same
 * example teaches a great deal once they have committed to an answer out loud
 * and been wrong — the gap between what they expected and what happened is the
 * thing they remember. So there is no Run button until a prediction is on the
 * record, and when the result arrives it is placed next to what they said
 * rather than on its own.
 */

import { useMemo } from 'react';
import type { Predict, Tool } from '@/content/types';
import type { StudentProfile } from '@/content/personalize';
import { shuffleChoices } from '@/content/shuffle';
import { runProgram } from '@/engine/runner';

import { highlightCsharp } from '../CodeBlock';
import { InlineMd, Markdown } from '../Markdown';
import { RunOutcome } from './RunOutcome';

/** Multi-line options are program output; one-liners are prose. */
function OptionText({ text }: { text: string }) {
  return text.includes('\n') ? (
    <pre className="predict-out">{text}</pre>
  ) : (
    <span>
      <InlineMd md={text} />
    </span>
  );
}

export function PredictBlock({
  block,
  seed,
  code,
  chosen,
  onChoose,
  student,
}: {
  block: Predict;
  /**
   * Fixes which order the options are offered in. Comes from where the block
   * sits rather than from the visit, because a committed prediction is saved
   * and shown back as "you said B" — that has to keep pointing at the same
   * option on every later visit to the step.
   */
  seed: number;
  /** Personalised source — the tokens are substituted by the caller. */
  code: string;
  /** The option as authored, which is how a prediction is recorded. */
  chosen?: number;
  onChoose: (choice: number) => void;
  student: StudentProfile;
}) {
  const tool: Tool = block.tool ?? 'console';
  const view = useMemo(() => shuffleChoices(block, seed), [block, seed]);
  const answered = chosen !== undefined;
  const shown = answered ? view.order.indexOf(chosen) : undefined;

  const result = useMemo(
    () =>
      answered
        ? runProgram(code, { trace: tool === 'memory' || tool === 'sequence', student })
        : null,
    [answered, code, student, tool],
  );

  const right = chosen === block.answer;

  return (
    <div className={`ask predict${answered ? (right ? ' is-right' : ' is-wrong') : ''}`}>
      <div className="ask-head">
        <span className="ask-badge">Predict first</span>
        {block.caption && <span className="ask-caption">{block.caption}</span>}
      </div>

      <div className="ask-q">
        <InlineMd md={block.question} />
      </div>

      <pre className="predict-code">
        <code>{highlightCsharp(code)}</code>
      </pre>

      <div className="predict-opts" role="group" aria-label="Your prediction">
        {view.options.map((opt, i) => {
          const state = !answered
            ? ''
            : i === view.answer
              ? ' correct'
              : shown === i
                ? ' wrong'
                : ' faded';
          return (
            <button
              key={i}
              className={`predict-opt${state}`}
              disabled={answered}
              onClick={() => onChoose(view.order[i])}
            >
              <span className="predict-marker">{String.fromCharCode(65 + i)}</span>
              <OptionText text={opt} />
            </button>
          );
        })}
      </div>

      {!answered && (
        <div className="predict-nudge">
          Commit to one. Being wrong here is worth more than being right, and it costs nothing.
        </div>
      )}

      {answered && (
        <div className="predict-reveal">
          <div className="predict-verdict">
            <span className={`verdict-flag${right ? ' ok' : ''}`}>
              {right ? 'You called it' : 'Not what happens'}
            </span>
            <span className="verdict-said">
              you said <b>{String.fromCharCode(65 + (shown ?? 0))}</b>
              {!right && (
                <>
                  {' · it was '}
                  <b>{String.fromCharCode(65 + view.answer)}</b>
                </>
              )}
            </span>
          </div>

          {!right && block.why?.[chosen] && (
            <div className="predict-why">
              <div className="predict-why-label">
                What {String.fromCharCode(65 + (shown ?? 0))} would have needed
              </div>
              <Markdown md={block.why[chosen]} />
            </div>
          )}

          <div className="predict-actual">
            <div className="predict-actual-label">What it really did</div>
            <RunOutcome result={result} tool={tool} />
          </div>

          <div className="predict-explain">
            <Markdown md={block.explain} />
          </div>
        </div>
      )}
    </div>
  );
}
