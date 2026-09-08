/**
 * A week's revision notes.
 *
 * Rendered through the same block renderer the lessons use, so a comparison
 * table or a UML diagram looks identical here to where it was first taught —
 * recognising a diagram you have seen before is most of what revision is.
 *
 * The one thing this page adds is the read marker. It is an explicit button
 * rather than a scroll heuristic: the marker unlocks half of a fix-up, so it
 * has to mean "I read this", not "this passed under my cursor".
 */

import { useEffect, useMemo, useRef } from 'react';

import type { WeekNotes } from '@/content/focus/types';
import { CONCEPT_BY_ID, FOCUS_WEEKS } from '@/content/focus/concepts';
import { notesOfWeek } from '@/content/focus/notes';
import { resolveTokens, type StudentProfile } from '@/content/personalize';
import type { FocusState } from '@/state/focus';

import { StepView } from '../StepView';

export function NotesView({
  notes,
  focus,
  student,
  highlightConcept,
  onBack,
  onOpenWeek,
  onMarkRead,
  onDrill,
  onDrillWeek,
}: {
  notes: WeekNotes;
  focus: FocusState;
  student: StudentProfile;
  /** Scroll to and outline the section covering this concept, after a miss. */
  highlightConcept?: string;
  onBack: () => void;
  onOpenWeek: (week: number) => void;
  onMarkRead: (sectionId: string, conceptIds: string[]) => void;
  onDrill: (conceptId: string) => void;
  onDrillWeek: (week: number) => void;
}) {
  const tokens = useMemo(() => resolveTokens(student), [student]);
  const target = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (highlightConcept && target.current) {
      target.current.scrollIntoView({ block: 'start' });
    } else {
      document.querySelector('.focus-scroll')?.scrollTo({ top: 0 });
    }
  }, [notes.week, highlightConcept]);

  const at = FOCUS_WEEKS.indexOf(notes.week);
  const prev = notesOfWeek(FOCUS_WEEKS[at - 1]);
  const next = notesOfWeek(FOCUS_WEEKS[at + 1]);

  return (
    <div className="notes">
      {/* The rail is the way back on a wide screen and is not there on a
          phone, so the page carries its own. */}
      <button className="focus-back" onClick={onBack}>
        <span aria-hidden>&#8592;</span> Readiness board
      </button>

      <div className="notes-head">
        <div className="notes-week">Week {notes.week}</div>
        <h1>{notes.title}</h1>
        <p className="notes-gist">{notes.gist}</p>
        <div className="notes-sources">From {notes.sources.join(' · ')}</div>
      </div>

      {notes.sections.map((section) => {
        const read = focus.readSections[section.id];
        const fixes = section.concepts.filter((c) => focus.fixes[c]);
        const isTarget = !!highlightConcept && section.concepts.includes(highlightConcept);

        return (
          <section
            key={section.id}
            ref={isTarget ? target : undefined}
            className={`note-section${isTarget ? ' targeted' : ''}${fixes.length ? ' has-fix' : ''}`}
          >
            <div className="note-section-head">
              <h2>{section.title}</h2>
              <div className="note-chips">
                {section.concepts.map((id) => {
                  const concept = CONCEPT_BY_ID[id];
                  if (!concept) return null;
                  const shaky = !!focus.fixes[id];
                  return (
                    <button
                      key={id}
                      className={`note-chip${shaky ? ' shaky' : ''}`}
                      onClick={() => onDrill(id)}
                      title={shaky ? 'You got this wrong — drill it' : 'Test yourself on this'}
                    >
                      {concept.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {fixes.length > 0 && (
              <div className="note-fix-banner">
                This is the one you missed. Read it, then answer two more questions on it to clear it.
              </div>
            )}

            <StepView
              stepId={`note:${section.id}`}
              blocks={section.blocks}
              tokens={tokens}
              student={student}
              saved={{}}
              onPatch={() => {}}
            />

            <div className="note-foot">
              {read ? (
                <span className="note-read">✓ Marked as revised</span>
              ) : (
                <button
                  className={fixes.length ? 'primary' : ''}
                  onClick={() => onMarkRead(section.id, section.concepts)}
                >
                  I have read this
                </button>
              )}
              {section.concepts.length === 1 && (
                <button className="ghost" onClick={() => onDrill(section.concepts[0])}>
                  Test me on it →
                </button>
              )}
            </div>
          </section>
        );
      })}

      {/* The notes are revision for a test — reading them should end with an
          offer to sit it, not just with the next page to read. */}
      <div className="do-next notes-test-cta">
        <div className="do-next-label">Ready for this week</div>
        <p className="do-next-why">
          Take the Week {notes.week} quiz — one question on each concept above, drawn fresh
          each sitting.
        </p>
        <button className="primary" onClick={() => onDrillWeek(notes.week)}>
          Take the Week {notes.week} quiz &#8594;
        </button>
      </div>

      {/* Reading a week's notes usually ends with reading the next week's, so
          the two neighbours are here rather than only in the rail. */}
      <nav className="notes-nav" aria-label="Other weeks">
        {prev && (
          <button className="notes-step" onClick={() => onOpenWeek(prev.week)}>
            <span className="notes-step-dir">&#8592; Week {prev.week}</span>
            <span className="notes-step-title">{prev.title}</span>
          </button>
        )}
        {next && (
          <button className="notes-step notes-step-next" onClick={() => onOpenWeek(next.week)}>
            <span className="notes-step-dir">Week {next.week} &#8594;</span>
            <span className="notes-step-title">{next.title}</span>
          </button>
        )}
      </nav>
    </div>
  );
}
