/**
 * Landing view: what the unit covers, and where the student is up to.
 *
 * The desktop build makes the last line of this page true — work is on this
 * machine, in a file, and it is still there next time — so the page says where,
 * and offers to put them back where they stopped.
 */

import type { Week } from '@/content/types';
import { completionOf, whereSaved, type AppState } from '@/state/progress';
import { openFixes, overallReadiness } from '@/state/focus';
import { isDesktop } from '@/state/desktop';

/** Weeks not yet built into the app, previewed as locked cards below the available ones. */
const PLANNED: { n: number; title: string; note: string }[] = [];

export function Home({
  weeks,
  state,
  onOpen,
  onFocus,
}: {
  weeks: Week[];
  state: AppState;
  onOpen: (weekNumber: number, lessonId: string, step?: number) => void;
  onFocus: () => void;
}) {
  const resume = findResume(weeks, state);
  const readiness = Math.round(overallReadiness(state.focus) * 100);
  const fixes = openFixes(state.focus).length;
  // Readiness is deliberately 0 for someone who has answered only questions
  // they got wrong, so it cannot be the test for whether they have started.
  const started = Object.keys(state.focus.attempts).length > 0 || state.focus.mocks.length > 0;

  return (
    <div className="home">
      <div className="home-eyebrow">COS20007 · Object-Oriented Programming</div>
      <h1 className="hero-title">Learn OOP by building it, one runnable step at a time.</h1>
      <p className="hero-sub">
        Your lecture and your lab, merged. Every idea arrives with code you can run, a diagram drawn
        from what you actually wrote, and checks that tell you exactly what is missing — never the
        answer.
      </p>

      <div className="hero-facts">
        <span>C# runs right here, no SDK</span>
        <span>{isDesktop ? 'Your work stays on this computer' : 'No install, no account'}</span>
        <span>Your student ID fills in every lab</span>
      </div>

      {resume && (
        <div className="resume">
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="resume-label">Pick up where you left off</div>
            <div className="resume-what">{resume.lesson.title}</div>
            <div className="resume-where">
              Week {resume.week.number} · step {resume.step + 1} of {resume.lesson.steps.length} ·{' '}
              <b>{resume.lesson.steps[resume.step].title}</b>
            </div>
          </div>
          <button
            className="primary"
            onClick={() => onOpen(resume.week.number, resume.lesson.id, resume.step)}
          >
            Resume →
          </button>
        </div>
      )}

      <div className="focus-promo">
        <div className="focus-promo-mark" aria-hidden>
          <svg viewBox="0 0 32 32" width="30" height="30">
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="16" r="1.8" fill="currentColor" />
          </svg>
        </div>
        <div className="focus-promo-body">
          <div className="focus-promo-label">Midterm test · Week 6</div>
          <h3>Concept focus</h3>
          <p>
            Ten multiple-choice questions in twenty minutes, closed book, drawn from Weeks 1&ndash;5.
            Revision notes for all five weeks, a quiz per week, and mock papers under the clock
            &mdash; and anything you get wrong stays on a list until you have revised it and proved it.
          </p>
          {started && (
            <div className="focus-promo-stats">
              <span>
                <strong>{readiness}%</strong> ready
              </span>
              {fixes > 0 && (
                <span className="focus-promo-fixes">
                  <strong>{fixes}</strong> mistake{fixes === 1 ? '' : 's'} to clear
                </span>
              )}
              {state.focus.mocks.length > 0 && (
                <span>
                  <strong>{state.focus.mocks.length}</strong> mock paper
                  {state.focus.mocks.length === 1 ? '' : 's'} sat
                </span>
              )}
            </div>
          )}
        </div>
        <button className="primary" onClick={onFocus}>
          {started ? 'Continue' : 'Start preparing'} &rarr;
        </button>
      </div>

      <div className="home-heading">
        <h2>Available now</h2>
        <span className="rule" />
      </div>

      {weeks.map((week) => {
        const allSteps = week.lessons.flatMap((l) => l.steps.map((s) => s.id));
        const pct = Math.round(completionOf(state, allSteps) * 100);
        return (
          <div className="week-card" key={week.number}>
            <div className="week-num">
              <small>Week</small>
              {String(week.number).padStart(2, '0')}
            </div>

            <div className="week-body">
              <h3 className="week-title">{week.title}</h3>
              <div className="week-sub">{week.subtitle}</div>

              <ul className="outcome-list">
                {week.outcomes.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>

              <div className="week-progress">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="week-pct">{pct}% complete</span>
              </div>

              <div className="week-actions">
                <button className="primary" onClick={() => onOpen(week.number, week.lessons[0].id)}>
                  {pct > 0 ? 'Continue' : 'Start week ' + week.number} →
                </button>
                {week.lessons
                  .filter((l) => l.kind === 'lab')
                  .map((l) => (
                    <button key={l.id} onClick={() => onOpen(week.number, l.id)}>
                      {l.title.replace(/^Task /, 'Task ')}
                    </button>
                  ))}
                {/* The week's own test, alongside its labs — a student who
                    wants to check themselves should not have to find it by
                    scrolling the lesson rail to the bottom. */}
                {week.lessons
                  .filter((l) => l.kind === 'quiz')
                  .map((l) => (
                    <button key={l.id} onClick={() => onOpen(week.number, l.id)}>
                      Checkpoint
                    </button>
                  ))}
              </div>

              <div className="week-source">Built from {week.sources.join(' · ')}</div>
            </div>
          </div>
        );
      })}

      {PLANNED.length > 0 && (
        <>
          <div className="home-heading" style={{ marginTop: 42 }}>
            <h2>Coming next</h2>
            <span className="rule" />
          </div>

          {PLANNED.map((p, i) => (
            <div className={`week-card locked${i === PLANNED.length - 1 ? ' last' : ''}`} key={p.n}>
              <div className="week-num">{String(p.n).padStart(2, '0')}</div>
              <div className="week-body">
                <div className="week-title">{p.title}</div>
                <div className="week-sub">{p.note}</div>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="home-foot">
        {isDesktop ? (
          <>
            Everything you write is saved to this computer, in <code>{whereSaved()}</code>. Nothing
            is uploaded, and there is no account to log back into — use{' '}
            <strong>File → Export progress</strong> if you want a copy to keep or move.
          </>
        ) : (
          <>
            Your work is saved in this browser only. Clearing site data clears it, so export a copy
            from the command palette if it matters.
          </>
        )}
      </div>
    </div>
  );
}

/** The step the student was last on, if it still exists in the content. */
function findResume(weeks: Week[], state: AppState) {
  const last = state.last;
  if (!last) return null;
  const week = weeks.find((w) => w.number === last.weekNumber);
  const lesson = week?.lessons.find((l) => l.id === last.lessonId);
  if (!week || !lesson || !lesson.steps.length) return null;
  const step = Math.min(Math.max(last.step, 0), lesson.steps.length - 1);
  return { week, lesson, step };
}
