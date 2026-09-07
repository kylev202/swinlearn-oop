/**
 * Concept Focus — the midterm study mode.
 *
 * Its own little app inside the app, with its own rail and its own routing,
 * because it is a different activity from working through a lesson: no editor,
 * no split pane, no week-by-week order. A student opens this in the days
 * before the Week 6 test and wants three things — notes to re-read, questions
 * to be tested on, and an honest account of what they keep getting wrong.
 *
 * All five views are here rather than in App.tsx so that adding a sixth does
 * not touch the shell the lessons live in.
 */

import { useMemo, useState } from 'react';

import { CONCEPT_BY_ID, FOCUS_WEEKS } from '@/content/focus/concepts';
import { conceptCountOfWeek, questionsOfConcept, questionsOfWeek, weeklyQuiz } from '@/content/focus/bank';
import { QUESTION_BY_ID } from '@/content/focus/bank';
import { notesOfWeek, sectionForConcept } from '@/content/focus/notes';
import type { StudentProfile } from '@/content/personalize';
import {
  fixUpQuestions,
  markSectionRead,
  openFixes,
  overallReadiness,
  weekReadiness,
  recordAnswer,
  recordMock,
  seenOnMocks,
  type DrillMode,
  type FocusState,
} from '@/state/focus';

import { Board } from './Board';
import { Drill, type DrillSpec } from './Drill';
import { MockReview, MockTest } from './MockTest';
import { NotesView } from './NotesView';

/*
 * Both question-asking views carry their own `questionIds` and `salt`.
 *
 * Neither list may be derived during render, because both derivations read
 * the answers so far: a fix-up sorts by "least recently attempted", and a
 * weekly quiz seeds its choice on how much of the week has been tried. Derived
 * live, either one re-shuffles itself the instant an answer is recorded — so
 * question 2 becomes a different question between reading it and pressing
 * Next, and the answer just given lands on whatever moved into its place.
 *
 * `salt` is the same rule one level down, for the order of the options within
 * each question. Fresh per sitting, so coming back to a question already met
 * means reading the options again rather than remembering it was the third.
 *
 * Capturing both when the view opens is what makes a sitting a sitting.
 */
type View =
  | { name: 'board' }
  | { name: 'notes'; week: number; concept?: string }
  | { name: 'drill'; week: number; questionIds: string[]; salt: number }
  | { name: 'fix'; conceptId: string; questionIds: string[]; salt: number }
  | { name: 'mock'; paper: number }
  | { name: 'review'; index: number };

export function FocusMode({
  focus,
  student,
  railOpen,
  navOpen,
  onUpdate,
  onLeave,
  onCloseNav,
}: {
  focus: FocusState;
  student: StudentProfile;
  /** Wide screens: whether the rail column is showing at all. */
  railOpen: boolean;
  /** Narrow screens: whether the rail is out as a drawer over the page. */
  navOpen: boolean;
  onUpdate: (fn: (f: FocusState) => FocusState) => void;
  onLeave: () => void;
  onCloseNav: () => void;
}) {
  const [view, setView] = useState<View>({ name: 'board' });

  /*
   * Every destination goes through here.
   *
   * Choosing something is also the signal that the drawer has done its job, so
   * closing it belongs with the navigation rather than on each of the eleven
   * buttons in the rail.
   */
  const go = (next: View) => {
    setView(next);
    onCloseNav();
  };

  const board = () => go({ name: 'board' });

  /** Open the revision note that covers a concept, scrolled to its section. */
  const revise = (conceptId: string) => {
    const found = sectionForConcept(conceptId);
    if (found) go({ name: 'notes', week: found.week, concept: conceptId });
  };

  const answer = (questionId: string, choice: number, mode: DrillMode) =>
    onUpdate((f) => recordAnswer(f, questionId, choice, mode));

  /** Open a concept drill, freezing the question order as it stands now. */
  const drillConcept = (conceptId: string) =>
    go({
      name: 'fix',
      conceptId,
      questionIds: focus.fixes[conceptId]
        ? fixUpQuestions(focus, conceptId)
        : questionsOfConcept(conceptId).map((q) => q.id),
      salt: Date.now(),
    });

  /**
   * Open a week's quiz: one question on each concept the week owns.
   *
   * One length rather than a menu of them. A week holds sixty to eighty
   * questions and the sitting that is always worth taking is the sweep — it
   * names the shaky ideas, and the tiles and the mistakes list are how those
   * then get drilled one at a time.
   *
   * The seed moves with how much of the week has already been attempted, so a
   * second sitting asks different questions about the same concepts — but it
   * is read once, here, rather than on every render.
   */
  const drillWeek = (week: number) => {
    const seen = questionsOfWeek(week).filter((q) => focus.attempts[q.id]).length;
    go({
      name: 'drill',
      week,
      questionIds: weeklyQuiz(week, 1 + seen, 1).map((q) => q.id),
      salt: Date.now(),
    });
  };

  const spec = useMemo<DrillSpec | null>(() => {
    if (view.name === 'drill') {
      const notes = notesOfWeek(view.week);
      const questions = view.questionIds.map((id) => QUESTION_BY_ID[id]).filter(Boolean);
      const perConcept = Math.round(questions.length / Math.max(conceptCountOfWeek(view.week), 1));
      return {
        mode: 'drill',
        title: `Week ${view.week} quiz`,
        subtitle: notes?.title ?? '',
        questions,
        salt: view.salt,
        brief: `${questions.length} questions${
          perConcept > 1 ? `, about ${perConcept} on each` : ', one on each'
        } concept this week that the paper can ask about. They are drawn fresh each sitting and the options reshuffle, so coming back gets you different ones. Anything you miss goes on the mistakes list, which is where the useful revision happens.`,
      };
    }
    if (view.name === 'fix') {
      const concept = CONCEPT_BY_ID[view.conceptId];
      if (!concept) return null;
      const open = focus.fixes[view.conceptId];
      return {
        mode: open ? 'fix' : 'drill',
        title: concept.title,
        subtitle: `Week ${concept.week} · ${concept.oneLiner}`,
        questions: view.questionIds.map((id) => QUESTION_BY_ID[id]).filter(Boolean),
        salt: view.salt,
        brief: open
          ? open.revised
            ? `You have read the note. Two correct in a row clears this — you are ${open.streak} in.`
            : 'You can answer these now, but the mistake only clears once you have also read the revision note for it.'
          : undefined,
      };
    }
    return null;
  }, [view, focus]);

  const fixCount = openFixes(focus).length;
  const readiness = Math.round(overallReadiness(focus) * 100);

  return (
    <div className="focus">
      {/*
        * The lesson sidebar, in this mode's own terms.
        *
        * It is the same panel doing the same job — where am I, what is in this
        * section, how far through am I — so it is built from the same parts
        * rather than from a second set that merely resembles them: `.sidebar`
        * for the box, a sticky `.side-week` header with a progress bar,
        * `.side-heading` for the group labels, and `.lesson-link` for every
        * destination. Switching between lessons and focus should feel like
        * changing what the panel lists, not like changing app.
        */}
      {(railOpen || navOpen) && (
      <aside className={`sidebar focus-rail${navOpen ? ' nav-open' : ''}`}>
        <div className="side-week">
          <button className="side-week-back" onClick={onLeave}>
            ← Lessons
          </button>
          <div className="side-week-title">Concept focus</div>
          <div className="side-progress">
            <div className="progress-track">
              <div
                className={`progress-fill${readiness === 100 ? ' full' : ''}`}
                style={{ width: `${readiness}%` }}
              />
            </div>
            <span>{readiness}%</span>
          </div>
        </div>

        <nav aria-label="Concept focus">
          <div className="lesson-group">
            <button
              className={`lesson-link${view.name === 'board' ? ' active' : ''}`}
              onClick={board}
            >
              <span className="lesson-title">Readiness board</span>
              <span className="lesson-meta">
                {fixCount > 0 ? (
                  <span className="kind-chip meta-fix">
                    {fixCount} to clear
                  </span>
                ) : (
                  <span>Where you stand</span>
                )}
              </span>
            </button>
          </div>

          <div className="side-heading">Revision notes</div>
          {FOCUS_WEEKS.map((week) => (
            <div className="lesson-group" key={week}>
              <button
                className={`lesson-link${view.name === 'notes' && view.week === week ? ' active' : ''}`}
                onClick={() => go({ name: 'notes', week })}
              >
                <span className="lesson-title">Week {week}</span>
                <span className="lesson-meta">
                  <span>{notesOfWeek(week)?.title}</span>
                </span>
              </button>
            </div>
          ))}

          <div className="side-heading">Test yourself</div>
          {FOCUS_WEEKS.map((week) => {
            const pct = Math.round(weekReadiness(focus, week) * 100);
            return (
              <div className="lesson-group" key={week}>
                <button
                  className={`lesson-link${view.name === 'drill' && view.week === week ? ' active' : ''}`}
                  onClick={() => drillWeek(week)}
                >
                  <span className="lesson-title">Week {week} quiz</span>
                  <span className="lesson-meta">
                    {/* The rail hands out the short sweep; the board is where
                        the longer sittings are chosen. The second number is
                        there so the depth behind it is not a secret. */}
                    <span>
                      {conceptCountOfWeek(week)} of {questionsOfWeek(week).length}
                    </span>
                    {pct > 0 && <span className={pct === 100 ? 'meta-done' : ''}>· {pct}%</span>}
                  </span>
                  {pct > 0 && (
                    <span className="lesson-bar" aria-hidden>
                      <span className="lesson-bar-fill" style={{ width: `${pct}%` }} />
                    </span>
                  )}
                </button>
              </div>
            );
          })}

          <div className="lesson-group">
            <button
              className={`lesson-link${view.name === 'mock' ? ' active' : ''}`}
              onClick={() => go({ name: 'mock', paper: focus.nextPaper })}
            >
              <span className="lesson-title">Mock paper {focus.nextPaper}</span>
              <span className="lesson-meta">
                <span>10 questions · 20 min</span>
                {focus.mocks.length > 0 && <span>· {focus.mocks.length} sat</span>}
              </span>
            </button>
          </div>
        </nav>
      </aside>
      )}

      <div className="focus-scroll">
        {view.name === 'board' && (
          <Board
            focus={focus}
            onOpenNotes={(week, concept) => go({ name: 'notes', week, concept })}
            onDrillWeek={drillWeek}
            onFix={drillConcept}
            onMock={(paper) => go({ name: 'mock', paper })}
            onReviewMock={(index) => go({ name: 'review', index })}
          />
        )}

        {view.name === 'notes' &&
          (() => {
            const notes = notesOfWeek(view.week);
            if (!notes) return null;
            return (
              <NotesView
                key={`${view.week}-${view.concept ?? ''}`}
                notes={notes}
                onBack={board}
                onOpenWeek={(week) => go({ name: 'notes', week })}
                focus={focus}
                student={student}
                highlightConcept={view.concept}
                onMarkRead={(sectionId, conceptIds) =>
                  onUpdate((f) => markSectionRead(f, sectionId, conceptIds))
                }
                onDrill={drillConcept}
              />
            );
          })()}

        {(view.name === 'drill' || view.name === 'fix') && spec && (
          <Drill
            key={view.name === 'drill' ? `w${view.week}` : view.conceptId}
            spec={spec}
            onAnswer={answer}
            onDone={board}
            onRevise={revise}
          />
        )}

        {view.name === 'mock' && (
          <MockTest
            key={view.paper}
            paper={view.paper}
            avoid={seenOnMocks(focus)}
            onSubmit={(attempt) => {
              onUpdate((f) => recordMock(f, attempt));
              // The index is where recordMock will have appended it.
              go({ name: 'review', index: focus.mocks.length });
            }}
            onLeave={board}
          />
        )}

        {view.name === 'review' &&
          (focus.mocks[view.index] ? (
            <MockReview attempt={focus.mocks[view.index]} onDone={board} onRevise={revise} />
          ) : null)}
      </div>
    </div>
  );
}
