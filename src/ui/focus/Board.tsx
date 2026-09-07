/**
 * The readiness board — what Concept Focus opens on.
 *
 * The organising question is "what should I do in the next twenty minutes",
 * and the page answers it in one place before showing anything else. Below
 * that, the five weeks are laid out as a grid of concept tiles rather than a
 * percentage, because a student four days out needs to see *which* ideas are
 * red, not how close to a number they are.
 *
 * Mistakes come before weeks, and weeks before mock papers, in the order the
 * time is actually best spent.
 */

import { CONCEPTS, FOCUS_WEEKS } from '@/content/focus/concepts';
import { CONCEPT_BY_ID } from '@/content/focus/concepts';
import { BANK, MOCK_MINUTES, SITTINGS, questionsOfWeek, sittingLength } from '@/content/focus/bank';
import { notesOfWeek } from '@/content/focus/notes';
import {
  MASTERY_LABEL,
  conceptStats,
  nextAction,
  openFixes,
  overallReadiness,
  scoreMock,
  weekReadiness,
  type FocusState,
  type NextAction,
} from '@/state/focus';

export function Board({
  focus,
  onOpenNotes,
  onDrillWeek,
  onFix,
  onMock,
  onReviewMock,
}: {
  focus: FocusState;
  onOpenNotes: (week: number, conceptId?: string) => void;
  /** `rounds` is questions per concept; omitted means the short sweep. */
  onDrillWeek: (week: number, rounds?: number) => void;
  onFix: (conceptId: string) => void;
  onMock: (paper: number) => void;
  onReviewMock: (index: number) => void;
}) {
  const readiness = Math.round(overallReadiness(focus) * 100);
  const action = nextAction(focus);
  const fixes = openFixes(focus);

  const run = (a: NextAction) => {
    if (a.kind === 'fix') onFix(a.conceptId);
    else if (a.kind === 'drill') onDrillWeek(a.week);
    else if (a.kind === 'notes') onOpenNotes(a.week);
    else onMock(a.paper);
  };

  const actionLabel: Record<NextAction['kind'], string> = {
    fix: 'Fix it →',
    drill: 'Start the quiz →',
    notes: 'Read the notes →',
    mock: 'Sit the paper →',
  };

  return (
    <div className="board">
      <div className="board-eyebrow">COS20007 · Midterm test, Week 6</div>
      <h1 className="board-title">Everything the paper can ask, and where you stand on it.</h1>

      <div className="board-facts">
        <span>10 multiple-choice questions</span>
        <span>{MOCK_MINUTES} minutes</span>
        <span>Closed book</span>
        <span>Weeks 1–5 only</span>
        <span>10% of your mark</span>
      </div>

      <div className="board-top">
        <div className="readiness">
          <Ring pct={readiness} />
          <div className="readiness-text">
            <strong>{readiness}% ready</strong>
            <span>
              {CONCEPTS.filter((c) => conceptStats(focus, c.id).mastery === 'solid').length} of{' '}
              {CONCEPTS.length} concepts solid
            </span>
          </div>
        </div>

        <div className="do-next">
          <div className="do-next-label">Do this next</div>
          <p className="do-next-why">{action.reason}</p>
          <button className="primary" onClick={() => run(action)}>
            {actionLabel[action.kind]}
          </button>
        </div>
      </div>

      {fixes.length > 0 && (
        <>
          <SectionHeading title={`Mistakes to clear (${fixes.length})`} />
          <p className="board-note">
            A wrong answer stays here until you have read the note for it <em>and</em> answered two
            more questions on the same idea correctly. That is the whole point of the mode.
          </p>
          <div className="fix-list">
            {fixes.map((fix) => {
              const concept = CONCEPT_BY_ID[fix.conceptId];
              if (!concept) return null;
              return (
                <div key={fix.conceptId} className={`fix-card${fix.revised ? ' revised' : ''}`}>
                  <div className="fix-week">W{concept.week}</div>
                  <div className="fix-body">
                    <strong>{concept.title}</strong>
                    <p>{concept.oneLiner}</p>
                    <div className="fix-state">
                      {fix.revised ? (
                        <>
                          <span className="fix-tick">✓ Revised</span>
                          <span>
                            {fix.streak} of 2 correct since
                          </span>
                        </>
                      ) : (
                        <span className="fix-todo">Read the note first</span>
                      )}
                    </div>

                    {/* Under the body and side by side, the way a week card on
                        the home page lays its actions out. Stacked at the
                        right they made every card three buttons tall. */}
                    <div className="fix-actions">
                      <button
                        className={fix.revised ? '' : 'primary'}
                        onClick={() => onOpenNotes(concept.week, concept.id)}
                      >
                        {fix.revised ? 'Re-read the note' : 'Read the note'}
                      </button>
                      <button
                        className={fix.revised ? 'primary' : ''}
                        onClick={() => onFix(concept.id)}
                      >
                        Test me
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <SectionHeading title="The five weeks" />
      <div className="legend">
        {(['untested', 'shaky', 'revising', 'partial', 'solid'] as const).map((m) => (
          <span key={m} className="legend-item">
            <span className={`tile tile-${m} legend-swatch`} aria-hidden />
            {MASTERY_LABEL[m]}
          </span>
        ))}
      </div>

      {FOCUS_WEEKS.map((week) => {
        const notes = notesOfWeek(week);
        const pct = Math.round(weekReadiness(focus, week) * 100);
        const concepts = CONCEPTS.filter((c) => c.week === week);
        return (
          <div className="week-row" key={week}>
            <div className="week-row-head">
              <div className="week-row-num">W{week}</div>
              <div className="week-row-title">
                <strong>{notes?.title ?? `Week ${week}`}</strong>
                <span>{notes?.gist}</span>
              </div>
              <div className="week-row-pct">
                <div className="progress-track">
                  <div
                    className={`progress-fill${pct === 100 ? ' full' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span>{pct}%</span>
              </div>
            </div>

            <div className="tile-grid">
              {concepts.map((c) => {
                const stats = conceptStats(focus, c.id);
                return (
                  <button
                    key={c.id}
                    className={`tile tile-${stats.mastery}`}
                    onClick={() => onFix(c.id)}
                    title={`${MASTERY_LABEL[stats.mastery]} — ${stats.correct}/${stats.asked} correct`}
                  >
                    {c.title}
                  </button>
                );
              })}
            </div>

            {/*
              * Three lengths rather than one button.
              *
              * The bank holds sixty to eighty questions a week, and the sitting
              * a student wants depends entirely on how far out the test is: a
              * sweep to find the gaps, a longer set to close them, the whole
              * week when it is the one still failing. Each draw is fresh, so
              * none of them is the same quiz twice.
              */}
            <div className="week-row-actions">
              <button onClick={() => onOpenNotes(week)}>Revision notes</button>
              {/* One control with three lengths, not three more buttons: the
                  choice here is how long a sitting to take, and a joined group
                  says that where four peers in a row would not. */}
              <div className="sittings" role="group" aria-label={`Week ${week} quiz length`}>
                <span className="sittings-label">Quiz</span>
                {SITTINGS.map((s) => (
                  <button key={s.id} title={s.blurb} onClick={() => onDrillWeek(week, s.rounds)}>
                    {s.label}
                    <em>{sittingLength(week, s.rounds)}</em>
                  </button>
                ))}
              </div>
            </div>
            <div className="week-row-bank">
              Drawn fresh each sitting from {questionsOfWeek(week).length} questions on this week.
            </div>
          </div>
        );
      })}

      <SectionHeading title="Mock papers" />
      <p className="board-note">
        Ten questions, {MOCK_MINUTES} minutes, no feedback until you submit. Each paper draws
        different questions from the same bank, two per week — the same spread as the real one.
      </p>

      <div className="mock-list">
        {focus.mocks.map((m, i) => {
          const { correct, total } = scoreMock(m);
          return (
            <button key={i} className="mock-past" onClick={() => onReviewMock(i)}>
              <span className="mock-past-no">Paper {m.paper}</span>
              <span className={`mock-past-score${correct >= 7 ? ' good' : correct >= 5 ? ' ok' : ' poor'}`}>
                {correct}/{total}
              </span>
              <span className="mock-past-when">
                {new Date(m.submittedAt).toLocaleDateString()}
              </span>
            </button>
          );
        })}
        <button className="mock-new" onClick={() => onMock(focus.nextPaper)}>
          <strong>Sit paper {focus.nextPaper}</strong>
          <span>{MOCK_MINUTES} minutes, from now</span>
        </button>
      </div>

      <div className="board-foot">
        {BANK.length} questions, built from the Week 1–5 lectures and the five revision quizzes.
        Everything here is scored on
        this machine and never leaves it — the mistakes list is yours alone.
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="board-heading">
      <h2>{title}</h2>
      <span className="rule" />
    </div>
  );
}

/**
 * A readiness dial.
 *
 * A ring rather than a bar because this one number is the page's anchor and
 * needs to read as a state of preparedness, not as another progress bar among
 * the six others further down.
 */
function Ring({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 80 80" width="80" height="80" aria-hidden>
      <circle cx="40" cy="40" r={r} className="ring-track" />
      {/* A round cap paints a dot even at zero length, which would read as
          progress that has not happened. Draw nothing instead. */}
      {pct > 0 && (
        <circle
          cx="40"
          cy="40"
          r={r}
          className="ring-fill"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      )}
    </svg>
  );
}
