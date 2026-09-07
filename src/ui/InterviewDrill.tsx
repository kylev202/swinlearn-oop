/**
 * Lab interview rehearsal.
 *
 * The weekly rubric caps a completed task at 70% — the remaining 30% is the
 * tutor asking why the code is the way it is. Students who used the site to
 * *understand* should walk in able to answer; this makes them prove it to
 * themselves first, out loud, before anything is revealed.
 *
 * Deliberately not a quiz: there are no options to pattern-match against. The
 * student answers from memory, then self-rates against what a tutor listens
 * for. Rating "still shaky" links straight back to the step that taught it.
 */

import { useState } from 'react';
import type { InterviewQuestion } from '@/content/types';

export function InterviewDrill({
  questions,
  ratings,
  onRate,
  onJumpToStep,
}: {
  questions: InterviewQuestion[];
  ratings: Record<string, 'confident' | 'shaky'>;
  onRate: (id: string, rating: 'confident' | 'shaky') => void;
  onJumpToStep: (stepId: string) => void;
}) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const rated = questions.filter((q) => ratings[q.id]).length;
  const shaky = questions.filter((q) => ratings[q.id] === 'shaky');

  return (
    <div className="reader">
      <div className="step-kicker">Interview drill</div>
      <h1 className="step-h1">Can you explain your own code?</h1>

      <div className="callout callout-key">
        <div className="callout-title">How to use this</div>
        <div className="md">
          <p>
            Answer each question <strong>out loud</strong>, in full sentences, before you reveal
            anything. That is the actual exam condition — your tutor is listening to you speak, not
            reading your code.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 24px' }}>
        <div className="progress-track" style={{ flex: 1 }}>
          <div
            className="progress-fill"
            style={{ width: `${questions.length ? (rated / questions.length) * 100 : 0}%` }}
          />
        </div>
        <span style={{ fontSize: 12.5, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
          {rated} of {questions.length} rehearsed
        </span>
      </div>

      {questions.map((q, i) => {
        const rating = ratings[q.id];
        const isRevealed = revealed[q.id];
        return (
          <div
            key={q.id}
            className={`iv-card${rating ? ` rated-${rating}` : ''}`}
          >
            <div className="iv-q">
              <span style={{ color: 'var(--text-faint)', marginRight: 8 }}>{i + 1}.</span>
              {q.question}
            </div>

            {!isRevealed ? (
              <div className="iv-actions">
                <button onClick={() => setRevealed((r) => ({ ...r, [q.id]: true }))}>
                  I've answered — show me what a tutor listens for
                </button>
              </div>
            ) : (
              <>
                <div className="iv-reveal">
                  <div className="iv-reveal-label">A good answer covers</div>
                  <ul>
                    {q.lookingFor.map((l, j) => (
                      <li key={j}>{l}</li>
                    ))}
                  </ul>
                </div>
                <div className="iv-actions" style={{ marginTop: 14 }}>
                  <button
                    className={rating === 'confident' ? 'primary' : ''}
                    onClick={() => onRate(q.id, 'confident')}
                  >
                    I covered that
                  </button>
                  <button onClick={() => onRate(q.id, 'shaky')}>Still shaky</button>
                  {q.aboutStep && (
                    <button className="ghost" onClick={() => onJumpToStep(q.aboutStep!)}>
                      Revisit the step →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {rated === questions.length && questions.length > 0 && (
        <div className={`callout ${shaky.length ? 'callout-warn' : 'callout-tip'}`} style={{ marginTop: 22 }}>
          <div className="callout-title">
            {shaky.length ? `${shaky.length} to go back over` : 'You are ready for the interview'}
          </div>
          <div className="md">
            {shaky.length ? (
              <p>
                Revisit these before your lab:{' '}
                {shaky.map((q, i) => (
                  <span key={q.id}>
                    {i > 0 && ', '}
                    {q.aboutStep ? (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onJumpToStep(q.aboutStep!);
                        }}
                      >
                        question {questions.indexOf(q) + 1}
                      </a>
                    ) : (
                      `question ${questions.indexOf(q) + 1}`
                    )}
                  </span>
                ))}
                .
              </p>
            ) : (
              <p>
                You answered every question and matched what the tutor is listening for. Bring your
                saved project files to the lab and you are set.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
