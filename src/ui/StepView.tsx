/**
 * Renders one step's content blocks.
 *
 * Everything interactive lives inline in the reading flow — a demo you can run
 * where it is introduced, a prediction the page waits for, an ordering puzzle,
 * a blank page asking you to explain it back. That keeps the explanation and
 * the evidence for it in one place, which is the whole complaint about having
 * a lecture PDF and a lab PDF open side by side.
 *
 * Block state (quiz answers, predictions, orderings, recall notes) is keyed by
 * block index and lives in the step's saved state, so nothing a student does
 * here is lost by navigating away.
 */

import { useMemo } from 'react';
import type { Block } from '@/content/types';
import { personalize, type ResolvedTokens, type StudentProfile } from '@/content/personalize';
import { blockSeed, shuffleChoices } from '@/content/shuffle';
import { parse } from '@/engine/parser';
import { buildUml } from '@/tools/uml';
import type { StepState } from '@/state/progress';

import { InlineMd, Markdown } from './Markdown';
import { CodeBlock, highlightCsharp } from './CodeBlock';
import { UmlView } from './panels/UmlView';
import { InlineRunner } from './blocks/InlineRunner';
import { PredictBlock } from './blocks/PredictBlock';
import { ParsonsBlock } from './blocks/ParsonsBlock';
import { RecallBlock } from './blocks/RecallBlock';

const CALLOUT_TITLES: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  warn: 'Watch out',
  trap: 'Common trap',
  key: 'Key idea',
};

/**
 * Blocks that ask the student for something.
 *
 * A concept step is finished when all of these have an answer against them,
 * not when it has been scrolled past — progress should mean engagement, and a
 * "Mark as read" button on a step full of questions is an invitation to skip.
 */
export function asksOf(blocks: Block[]): number[] {
  const kinds = new Set(['quiz', 'predict', 'recall', 'parsons']);
  return blocks.map((b, i) => (kinds.has(b.t) ? i : -1)).filter((i) => i >= 0);
}

function isAnswered(block: Block, i: number, saved: StepState): boolean {
  switch (block.t) {
    case 'quiz':
      return saved.quiz?.[i] !== undefined;
    case 'predict':
      return saved.predict?.[i] !== undefined;
    case 'recall':
      return saved.recall?.[i]?.shown === true;
    case 'parsons': {
      const order = saved.parsons?.[i];
      return !!order && order.length === block.lines.length && order.every((v, j) => v === j);
    }
    default:
      return true;
  }
}

/** How many asks this step has, and how many are still open. */
export function askStatus(blocks: Block[], saved: StepState): { total: number; open: number } {
  const asks = asksOf(blocks);
  return {
    total: asks.length,
    open: asks.filter((i) => !isAnswered(blocks[i], i, saved)).length,
  };
}

export function StepView({
  stepId,
  blocks,
  tokens,
  student,
  saved,
  onPatch,
}: {
  /** Seeds the option order of every quiz and predict block on the step. */
  stepId: string;
  blocks: Block[];
  tokens: ResolvedTokens;
  student: StudentProfile;
  saved: StepState;
  onPatch: (patch: Partial<StepState>) => void;
}) {
  return (
    <>
      {blocks.map((b, i) => (
        <BlockView
          key={i}
          stepId={stepId}
          block={b}
          index={i}
          tokens={tokens}
          student={student}
          saved={saved}
          onPatch={onPatch}
        />
      ))}
    </>
  );
}

function BlockView({
  stepId,
  block,
  index,
  tokens,
  student,
  saved,
  onPatch,
}: {
  stepId: string;
  block: Block;
  index: number;
  tokens: ResolvedTokens;
  student: StudentProfile;
  saved: StepState;
  onPatch: (patch: Partial<StepState>) => void;
}) {
  const p = (s: string) => personalize(s, tokens);

  switch (block.t) {
    case 'text':
      return <Markdown md={p(block.md)} />;

    case 'callout':
      return (
        <div className={`callout callout-${block.tone}`}>
          <div className="callout-title">{block.title ?? CALLOUT_TITLES[block.tone]}</div>
          <Markdown md={p(block.md)} />
        </div>
      );

    case 'code':
      return <CodeBlock code={p(block.code)} caption={block.caption} />;

    case 'runnable':
      return (
        <InlineRunner
          code={p(block.code)}
          caption={block.caption}
          tool={block.tool ?? 'console'}
          autoRun={block.autoRun}
          student={student}
        />
      );

    case 'predict':
      return (
        <PredictBlock
          block={block}
          seed={blockSeed(stepId, index)}
          code={p(block.code)}
          chosen={saved.predict?.[index]}
          onChoose={(choice) => onPatch({ predict: { ...(saved.predict ?? {}), [index]: choice } })}
          student={student}
        />
      );

    case 'parsons':
      return (
        <ParsonsBlock
          block={block}
          order={saved.parsons?.[index]}
          onReorder={(next) => onPatch({ parsons: { ...(saved.parsons ?? {}), [index]: next } })}
        />
      );

    case 'recall':
      return (
        <RecallBlock
          block={block}
          state={saved.recall?.[index]}
          onChange={(next) => onPatch({ recall: { ...(saved.recall ?? {}), [index]: next } })}
        />
      );

    case 'compare':
      return (
        <div className="compare">
          {[block.left, block.right].map((pane, i) => (
            <div key={i} className={`compare-pane compare-${pane.tone ?? 'neutral'}`}>
              <div className="compare-head">{pane.title}</div>
              {pane.code && (
                <pre>
                  <code>{highlightCsharp(p(pane.code))}</code>
                </pre>
              )}
              {pane.md && (
                <div className="compare-body">
                  <Markdown md={p(pane.md)} />
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case 'umlSpec':
      return <UmlSpecView source={p(block.source)} caption={block.caption} />;

    case 'table':
      return (
        <div className="table-wrap">
          {block.caption && <div className="table-caption">{block.caption}</div>}
          <table className="data-table">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i}>
                    <InlineMd md={p(h)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>
                      <Markdown md={p(cell)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'quiz': {
      /*
       * Options are shown in a permuted order, keyed to where this block sits
       * rather than to the visit, because the choice is saved: a student who
       * comes back to a finished step has to see the same four options in the
       * same four places they answered against. Fixed per block is enough to
       * do the job anyway — what makes the answer guessable is every question
       * on the step putting it first, not one question keeping it in place.
       */
      const view = shuffleChoices(block, blockSeed(stepId, index));
      const chosen = saved.quiz?.[index];
      const answered = chosen !== undefined;
      const shown = answered ? view.order.indexOf(chosen) : undefined;
      return (
        <div className="quiz">
          <div className="quiz-q">{p(view.question)}</div>
          {view.options.map((opt, i) => {
            const cls = !answered ? '' : i === view.answer ? ' correct' : shown === i ? ' wrong' : '';
            return (
              <button
                key={i}
                className={`quiz-opt${cls}`}
                disabled={answered}
                // Saved as the option was authored, so the record survives any
                // later change to how the step is shuffled.
                onClick={() => onPatch({ quiz: { ...(saved.quiz ?? {}), [index]: view.order[i] } })}
              >
                <span className="quiz-marker">{String.fromCharCode(65 + i)}</span>
                <span>
                  <InlineMd md={p(opt)} />
                </span>
              </button>
            );
          })}
          {answered && (
            <div className={`quiz-explain${chosen === block.answer ? '' : ' miss'}`}>
              {/* The specific miss first: a student who picked C needs to know
                  what C would have been true of, not only that it was not B. */}
              {chosen !== block.answer && block.why?.[chosen] && (
                <div className="quiz-why">
                  <InlineMd md={p(block.why[chosen])} />
                </div>
              )}
              {chosen === block.answer ? '' : 'Not quite. '}
              <InlineMd md={p(block.explain)} />
            </div>
          )}
        </div>
      );
    }
  }
}

// ------------------------------------------------------------- uml target

function UmlSpecView({ source, caption }: { source: string; caption?: string }) {
  const model = useMemo(() => {
    try {
      return buildUml(parse(source));
    } catch {
      return null;
    }
  }, [source]);

  if (!model) return null;

  return (
    <div className="code-card" style={{ background: 'var(--bg-raised)' }}>
      <div className="code-card-head">
        <span>{caption ?? 'UML class diagram'}</span>
      </div>
      <div style={{ padding: 14, overflowX: 'auto', background: 'var(--bg-sunken)' }}>
        <UmlView model={model} />
      </div>
    </div>
  );
}
