/**
 * A mock paper, sat under the real conditions.
 *
 * The point of this screen is not the questions — the drills have those. It is
 * everything around them that the drills deliberately remove: a clock that
 * does not stop, ten questions you can move between in any order, no feedback
 * until you commit to the lot, and a paper you cannot un-submit. Most students
 * lose midterm marks to pacing rather than to content, and pacing is only
 * practisable against a clock.
 *
 * Twenty minutes and ten questions, from Lecture 5's midterm logistics.
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import { MOCK_MINUTES, QUESTION_BY_ID, buildMockPaper, weekOf } from '@/content/focus/bank';
import { CONCEPT_BY_ID } from '@/content/focus/concepts';
import { displayIndex, paperSeed, shuffleChoices } from '@/content/shuffle';
import { scoreMock, type MockAttempt } from '@/state/focus';

import { QuestionCard } from './QuestionCard';

const SECONDS = MOCK_MINUTES * 60;

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ------------------------------------------------------------ sitting one

export function MockTest({
  paper,
  avoid,
  onSubmit,
  onLeave,
}: {
  paper: number;
  /** Question ids already met on earlier papers. */
  avoid: string[];
  onSubmit: (attempt: MockAttempt) => void;
  onLeave: () => void;
}) {
  /*
   * Options are shuffled per paper rather than per sitting, because the answer
   * sheet outlives the sitting: it is stored and re-rendered in the review, and
   * a review that reshuffled would tell a student they picked an option that
   * was never in that position. A different paper number still means a
   * different order, which is what a re-sit needs.
   */
  const questions = useMemo(
    () => buildMockPaper(paper, avoid).map((q) => shuffleChoices(q, paperSeed(q.id, paper))),
    [paper, avoid],
  );
  const [started, setStarted] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [at, setAt] = useState(0);
  const [left, setLeft] = useState(SECONDS);

  // The clock has to read the answers without being re-created every time one
  // changes, so the latest set lives in a ref alongside the state.
  const latest = useRef(answers);
  latest.current = answers;

  // Submitting is shared by the button and the clock running out, and must not
  // fire twice — a paper submitted on the final tick while the student is also
  // pressing the button would otherwise be recorded as two attempts.
  const sent = useRef(false);
  const submit = () => {
    if (sent.current || started === null) return;
    sent.current = true;
    onSubmit({
      paper,
      questionIds: questions.map((q) => q.id),
      // Whatever is on the page when time runs out is what gets marked, just
      // as it would be if an invigilator took the sheet away. Written down as
      // the option was authored, not as it was shown, so the sheet keeps its
      // meaning independently of the shuffle that produced it.
      answers: latest.current.map((a, i) => (a === null ? null : questions[i].order[a])),
      startedAt: started,
      submittedAt: Date.now(),
      seconds: SECONDS,
    });
  };
  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    if (started === null) return;
    const tick = setInterval(() => {
      const remaining = SECONDS - Math.floor((Date.now() - started) / 1000);
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        submitRef.current();
      }
    }, 250);
    return () => clearInterval(tick);
  }, [started]);

  if (started === null) {
    return (
      <div className="mock-brief">
        <div className="mock-paper-no">Paper {paper}</div>
        <h1>Sit it like the real one</h1>
        <table className="mock-rules">
          <tbody>
            <tr>
              <th>Questions</th>
              <td>10 multiple choice, Weeks 1–5</td>
            </tr>
            <tr>
              <th>Time</th>
              <td>{MOCK_MINUTES} minutes, counting down and not pausing</td>
            </tr>
            <tr>
              <th>Feedback</th>
              <td>Nothing until you submit — same as the paper</td>
            </tr>
            <tr>
              <th>Unanswered</th>
              <td>Marked wrong, but not counted as a misconception</td>
            </tr>
          </tbody>
        </table>
        <p className="mock-tip">
          The lecturer&rsquo;s advice: answer what you are sure of first, mark the rest, come back.
          Most students finish inside 15 of the 20 minutes.
        </p>
        <div className="mock-brief-actions">
          <button className="primary" onClick={() => setStarted(Date.now())}>
            Start the clock →
          </button>
          <button className="ghost" onClick={onLeave}>
            Not yet
          </button>
        </div>
      </div>
    );
  }

  const answered = answers.filter((a) => a !== null).length;
  const low = left <= 120;

  return (
    <div className="mock">
      <div className={`mock-bar${low ? ' low' : ''}`}>
        <div className="mock-clock" role="timer" aria-live="off">
          {clock(left)}
        </div>
        <div className="mock-answered">
          {answered} of {questions.length} answered
        </div>
        <span className="spacer" />
        <button className="primary" onClick={() => submit()}>
          Submit paper
        </button>
      </div>

      <div className="mock-grid" role="group" aria-label="Question navigator">
        {questions.map((q, i) => (
          <button
            key={q.id}
            className={`mock-cell${i === at ? ' here' : ''}${answers[i] !== null ? ' done' : ''}`}
            onClick={() => setAt(i)}
            aria-label={`Question ${i + 1}${answers[i] !== null ? ', answered' : ', not answered'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <QuestionCard
        key={questions[at].id}
        question={questions[at]}
        chosen={answers[at] ?? undefined}
        reveal={false}
        index={at}
        total={questions.length}
        onChoose={(choice) =>
          setAnswers((a) => a.map((v, i) => (i === at ? (v === choice ? null : choice) : v)))
        }
      />

      <div className="drill-nav">
        <button disabled={at === 0} onClick={() => setAt(at - 1)}>
          ← Back
        </button>
        <span className="spacer" />
        <button disabled={at === questions.length - 1} onClick={() => setAt(at + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- reviewing

export function MockReview({
  attempt,
  onDone,
  onRevise,
}: {
  attempt: MockAttempt;
  onDone: () => void;
  onRevise: (conceptId: string) => void;
}) {
  const { correct, total } = scoreMock(attempt);
  // Rebuilt from the paper number, so every question comes back in the exact
  // order it was sat in and "you picked C" still points at the same option.
  const views = useMemo(
    () =>
      Object.fromEntries(
        attempt.questionIds.map((id) => {
          const q = QUESTION_BY_ID[id];
          return [id, q ? shuffleChoices(q, paperSeed(id, attempt.paper)) : undefined];
        }),
      ),
    [attempt.questionIds, attempt.paper],
  );
  const minutes = Math.max(1, Math.round((attempt.submittedAt - attempt.startedAt) / 60000));

  // Per-week breakdown, because "6/10" says nothing about where to spend the
  // next hour and "both Week 3 questions wrong" says everything.
  const byWeek = [1, 2, 3, 4, 5].map((week) => {
    const idx = attempt.questionIds
      .map((id, i) => ({ id, i }))
      .filter(({ id }) => {
        const q = QUESTION_BY_ID[id];
        return q && weekOf(q) === week;
      });
    const got = idx.filter(({ id, i }) => attempt.answers[i] === QUESTION_BY_ID[id]?.answer).length;
    return { week, got, of: idx.length };
  });

  return (
    <div className="mock-review">
      <div className="mock-result">
        <div className={`mock-score${correct >= 7 ? ' good' : correct >= 5 ? ' ok' : ' poor'}`}>
          <strong>{correct}</strong>
          <span>/ {total}</span>
        </div>
        <div>
          <h1>Paper {attempt.paper}</h1>
          <p>
            Finished in about {minutes} minute{minutes === 1 ? '' : 's'} of the {Math.round(attempt.seconds / 60)} available.
            {attempt.answers.some((a) => a === null) &&
              ` ${attempt.answers.filter((a) => a === null).length} left blank.`}
          </p>
        </div>
      </div>

      <div className="mock-weeks">
        {byWeek.map(({ week, got, of }) => (
          <div key={week} className={`mock-week${of > 0 && got === of ? ' full' : got === 0 ? ' none' : ''}`}>
            <span className="mock-week-n">W{week}</span>
            <span className="mock-week-score">
              {got}/{of}
            </span>
          </div>
        ))}
      </div>

      <h2 className="mock-h2">Every question, and what it was testing</h2>

      {attempt.questionIds.map((id, i) => {
        const q = QUESTION_BY_ID[id];
        if (!q) return null;
        const view = views[id];
        const chosen = attempt.answers[i];
        const right = chosen === q.answer;
        return (
          <div key={id} className="mock-review-item">
            <div className={`mock-review-mark${right ? ' ok' : chosen === null ? ' blank' : ' miss'}`}>
              {right ? '✓' : chosen === null ? '–' : '✗'}
            </div>
            <div className="mock-review-body">
              <QuestionCard
                question={view ?? q}
                chosen={view && chosen != null ? displayIndex(view.order, chosen) : undefined}
                reveal
                onChoose={() => {}}
              />
              {!right && (
                <button className="mock-revise" onClick={() => onRevise(q.conceptId)}>
                  Revise {CONCEPT_BY_ID[q.conceptId]?.title ?? q.conceptId} →
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="drill-nav">
        <button className="primary" onClick={onDone}>
          Back to the board
        </button>
      </div>
    </div>
  );
}
