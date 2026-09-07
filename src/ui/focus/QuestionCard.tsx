/**
 * One multiple-choice question, in both the modes it is asked in.
 *
 * A drill reveals the answer the moment one is picked, because a wrong answer
 * is only worth anything if the correction arrives while the reasoning is
 * still in mind. A mock paper reveals nothing until it is submitted, because
 * the real paper does not, and knowing you got question 3 wrong changes how
 * you sit questions 4 to 10.
 *
 * Same component either way — `reveal` is the only difference — so a question
 * cannot look like one thing in practice and another under the clock.
 */

import type { FocusQuestion } from '@/content/focus/types';
import { CONCEPT_BY_ID } from '@/content/focus/concepts';

import { InlineMd } from '../Markdown';
import { CodeBlock } from '../CodeBlock';

/*
 * The question stem, the options and their A-D markers reuse the lesson
 * quiz's own classes (`quiz-q`, `quiz-opt`, `quiz-marker`) rather than
 * focus-mode copies of them. They are the same component doing the same job,
 * and two rules styled alike today drift apart the first time one is touched.
 * Only `picked` — an option chosen but not yet marked, which a lesson quiz
 * never has because it marks immediately — is new.
 */

export function QuestionCard({
  question,
  chosen,
  reveal,
  onChoose,
  index,
  total,
}: {
  question: FocusQuestion;
  chosen?: number;
  /** Show right/wrong and the explanation. Off during a mock paper. */
  reveal: boolean;
  onChoose: (choice: number) => void;
  index?: number;
  total?: number;
}) {
  const answered = chosen !== undefined;
  const correct = chosen === question.answer;
  const concept = CONCEPT_BY_ID[question.conceptId];

  return (
    <div className="fq" data-qid={question.id}>
      <div className="fq-head">
        {index !== undefined && total !== undefined && (
          <span className="fq-count">
            {index + 1} <span>/ {total}</span>
          </span>
        )}
        {/* Only once the answer is out. On a live paper the concept name
            would narrow the options in a way the real paper never does. */}
        {reveal && concept && <span className="fq-concept">{concept.title}</span>}
        {question.stretch && (
          <span className="fq-stretch" title="Harder than a typical revision-quiz question">
            harder
          </span>
        )}
      </div>

      <div className="quiz-q">
        <InlineMd md={question.question} />
      </div>

      {question.code && <CodeBlock code={question.code} />}

      <div className="fq-opts">
        {question.options.map((opt, i) => {
          // During a paper the only signal is "this is the one I picked".
          const state = !reveal
            ? chosen === i
              ? ' picked'
              : ''
            : !answered
              ? ''
              : i === question.answer
                ? ' correct'
                : chosen === i
                  ? ' wrong'
                  : '';
          return (
            <button
              key={i}
              className={`quiz-opt${state}`}
              disabled={reveal && answered}
              aria-pressed={chosen === i}
              onClick={() => onChoose(i)}
            >
              <span className="quiz-marker">{String.fromCharCode(65 + i)}</span>
              <span className="fq-opt-text">
                <InlineMd md={opt} />
              </span>
            </button>
          );
        })}
      </div>

      {reveal && answered && (
        <div className={`fq-feedback${correct ? ' ok' : ' miss'}`}>
          <div className="fq-verdict">
            {correct ? 'Correct' : `Not quite — the answer is ${String.fromCharCode(65 + question.answer)}`}
          </div>

          {/* The specific miss first. A student who picked C needs to know
              what C would have been true of, not merely that it was not A. */}
          {!correct && question.why?.[chosen] && (
            <p className="fq-why">
              <InlineMd md={question.why[chosen]} />
            </p>
          )}

          <p className="fq-explain">
            <InlineMd md={question.explain} />
          </p>

          <div className="fq-source">{question.source}</div>
        </div>
      )}
    </div>
  );
}
