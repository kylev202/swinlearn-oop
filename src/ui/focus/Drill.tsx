/**
 * A run of questions with immediate feedback — used for both the weekly quiz
 * and a fix-up on a single concept.
 *
 * One question on screen at a time. A page of twenty questions invites
 * skimming ahead and answering the easy ones first, which is a fine exam
 * tactic and a terrible revision one: the whole value here is being made to
 * commit before seeing whether you were right.
 *
 * The run ends on a summary rather than dropping the student back at the
 * board, because "which of these did I get wrong" is the only part of a
 * practice quiz worth re-reading.
 */

import { useMemo, useState } from 'react';

import type { FocusQuestion } from '@/content/focus/types';
import { CONCEPT_BY_ID } from '@/content/focus/concepts';
import type { DrillMode } from '@/state/focus';

import { QuestionCard } from './QuestionCard';

export interface DrillSpec {
  mode: DrillMode;
  title: string;
  subtitle: string;
  questions: FocusQuestion[];
  /** Shown above the first question — why this particular run exists. */
  brief?: string;
}

export function Drill({
  spec,
  onAnswer,
  onDone,
  onRevise,
}: {
  spec: DrillSpec;
  onAnswer: (questionId: string, choice: number, mode: DrillMode) => void;
  onDone: () => void;
  /** Open the revision note for a concept, from the summary. */
  onRevise: (conceptId: string) => void;
}) {
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const question = spec.questions[at];
  const chosen = question ? answers[question.id] : undefined;
  const finished = at >= spec.questions.length;

  const missed = useMemo(
    () => spec.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== q.answer),
    [answers, spec.questions],
  );

  if (!spec.questions.length) {
    return (
      <div className="drill">
        <p className="focus-empty">There are no questions here yet.</p>
        <button className="primary" onClick={onDone}>
          Back to the board
        </button>
      </div>
    );
  }

  if (finished) {
    const scored = spec.questions.length;
    const right = scored - missed.length;
    return (
      <div className="drill">
        <div className="drill-done">
          <div className="drill-score">
            <strong>{right}</strong>
            <span>/ {scored}</span>
          </div>
          <h2>{right === scored ? 'All correct.' : `${missed.length} to go back over.`}</h2>
          <p>
            {right === scored
              ? 'Nothing from this run needs revisiting. The board has moved.'
              : 'Each of these has been added to your mistakes. Read the note, then answer two more on the same idea to clear it.'}
          </p>
        </div>

        {missed.length > 0 && (
          <ul className="drill-missed">
            {missed.map((q) => {
              const concept = CONCEPT_BY_ID[q.conceptId];
              return (
                <li key={q.id}>
                  <div>
                    <strong>{concept?.title ?? q.conceptId}</strong>
                    <span>{concept?.oneLiner}</span>
                  </div>
                  <button onClick={() => onRevise(q.conceptId)}>Revise →</button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="drill-nav">
          <button className="primary" onClick={onDone}>
            Back to the board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="drill">
      <div className="drill-head">
        <div>
          <h1>{spec.title}</h1>
          <p>{spec.subtitle}</p>
        </div>
        <button className="ghost" onClick={onDone}>
          Leave
        </button>
      </div>

      {spec.brief && at === 0 && chosen === undefined && (
        <div className="drill-brief">{spec.brief}</div>
      )}

      <div className="drill-progress" aria-hidden>
        <div
          className="drill-progress-fill"
          style={{ width: `${(at / spec.questions.length) * 100}%` }}
        />
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        chosen={chosen}
        reveal
        index={at}
        total={spec.questions.length}
        onChoose={(choice) => {
          if (answers[question.id] !== undefined) return;
          setAnswers((a) => ({ ...a, [question.id]: choice }));
          onAnswer(question.id, choice, spec.mode);
        }}
      />

      <div className="drill-nav">
        <button disabled={at === 0} onClick={() => setAt(at - 1)}>
          ← Back
        </button>
        <span className="spacer" />
        <button className="primary" disabled={chosen === undefined} onClick={() => setAt(at + 1)}>
          {at === spec.questions.length - 1 ? 'Finish' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
