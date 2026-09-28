/**
 * The Final exam tab, before there is a final exam to revise for.
 *
 * A tab that exists and does nothing is worse than no tab, so this page is
 * built around the one useful thing it can honestly say: the notes written for
 * the midsemester test are still notes, the final still covers that material,
 * and here is the door to them. Everything it does not know — the date, the
 * format, whether Weeks 6-8 are examinable the same way — it says it does not
 * know, rather than filling the space with a plausible placeholder somebody
 * might revise against.
 *
 * Built entirely out of the board's own parts (`.board`, `.week-row`,
 * `.board-note`) so that switching tabs reads as changing what the page is
 * about, not as arriving in a different app. The one new piece is the
 * `.gap-row`, which is a week row with the ink turned down — it has to look
 * like the rows above it and be visibly not one of them.
 *
 * When Week 9+ material arrives and the final's scope is announced, the work
 * is to give `exams.ts` a real `weeks` list and let this hand over to the same
 * `Board` the midsemester tab already uses.
 */

import { EXAM_BY_ID } from '@/content/focus/exams';
import { notesOfWeek } from '@/content/focus/notes';
import { questionsOfWeek } from '@/content/focus/bank';
import { CONCEPTS } from '@/content/focus/concepts';

export function FinalView({
  onOpenNotes,
  onSwitchToMidsem,
}: {
  onOpenNotes: (week: number) => void;
  onSwitchToMidsem: () => void;
}) {
  const final = EXAM_BY_ID.final;
  const carried = EXAM_BY_ID.midsem.weeks.filter((w) => notesOfWeek(w));

  return (
    <div className="board">
      <div className="board-eyebrow">COS20007 · Final exam</div>
      <h1 className="board-title">Nothing built yet — and exactly what is missing.</h1>

      <div className="board-facts">
        <span>{final.when}</span>
        <span>{final.format}</span>
        <span>Covers {final.scope.toLowerCase()}</span>
      </div>

      <p className="board-note">
        Concept Focus was written for the Week&nbsp;6 test — {CONCEPTS.length} concepts, a question
        bank and a set of revision notes, all scoped to Weeks&nbsp;1&ndash;5 because that is what
        that paper examined. The final covers more than that, and the extra has not been written.
        No lecture up to Week&nbsp;8 has announced the final&apos;s date or format either, so
        nothing here guesses at one.
      </p>

      <SectionHeading title="What you can revise right now" />
      <p className="board-note">
        These were written for the midsemester test, and nothing in them has stopped being true.
        Weeks&nbsp;1&ndash;5 are the foundation the rest of the unit is built on, so they are worth
        keeping warm whatever shape the final turns out to be.
      </p>

      {carried.map((week) => {
        const notes = notesOfWeek(week)!;
        return (
          <div className="week-row" key={week}>
            <div className="week-row-head">
              <div className="week-row-num">W{week}</div>
              <div className="week-row-title">
                <strong>{notes.title}</strong>
                <span>{notes.gist}</span>
              </div>
            </div>
            <button className="week-row-revise" onClick={() => onOpenNotes(week)}>
              Revise the Week {week} notes
              <span aria-hidden>&#8594;</span>
            </button>
          </div>
        );
      })}

      <SectionHeading title="What is not here" />
      <p className="board-note">
        The <em>lessons</em> for these weeks exist in the main portal and are complete. What does
        not exist is the second cut of them — the concept map, the revision notes and the question
        bank that let you study by idea rather than by week.
      </p>

      {final.missing.map((week) => (
        <div className="week-row gap-row" key={week}>
          <div className="week-row-head">
            <div className="week-row-num">W{week}</div>
            <div className="week-row-title">
              <strong>Week {week}</strong>
              <span>Lessons built · revision notes not written · 0 questions in the bank</span>
            </div>
          </div>
        </div>
      ))}

      <div className="board-foot">
        {carried.reduce((n, w) => n + questionsOfWeek(w).length, 0)} questions exist, all of them
        about Weeks&nbsp;1&ndash;5. Until the final&apos;s scope is announced, the honest advice is
        to keep working through the weekly lessons and use the midsemester material to hold on to
        the first half.
        <div className="board-foot-actions">
          <button className="primary" onClick={onSwitchToMidsem}>
            Go to the midsemester revision &rarr;
          </button>
        </div>
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
