/**
 * The two-pane lesson view: explanation on the left, work on the right.
 *
 * A step with an exercise gets the workbench; a pure-concept step gets the
 * full width so the prose and its inline demos have room to breathe. The
 * divider between them is draggable, because how much editor a student wants
 * changes with the step and with the size of their screen.
 */

import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import type { InterviewQuestion, Lesson, Step, Tool, Week } from '@/content/types';
import { personalize, resolveTokens, type StudentProfile } from '@/content/personalize';
import { stepState, type AppState } from '@/state/progress';

import { StepView, askStatus } from './StepView';
import { InterviewDrill } from './InterviewDrill';
import { SplitPane } from './SplitPane';

// CodeMirror is over half the bundle and only concept steps do without it, so
// the editor arrives on the first step that actually asks for one.
const Workbench = lazy(() => import('./Workbench').then((m) => ({ default: m.Workbench })));

function toolsFor(step: Step): Tool[] {
  const ex = step.exercise;
  if (!ex) return [];
  const primary = ex.tool ?? 'tests';
  const set: Tool[] = ['tests', 'console'];
  if (!set.includes(primary)) set.unshift(primary);
  // Always offer the class diagram: it is free, and it is assessed every week.
  set.push('uml');
  // Order so the step's own tool leads.
  return [primary, ...set.filter((t) => t !== primary)];
}

export function LessonPlayer({
  week,
  lesson,
  stepIndex,
  state,
  student,
  interviewQuestions,
  onStepChange,
  onUpdateStep,
  onJumpToStep,
}: {
  week: Week;
  lesson: Lesson;
  stepIndex: number;
  state: AppState;
  student: StudentProfile;
  interviewQuestions: InterviewQuestion[];
  onStepChange: (index: number) => void;
  onUpdateStep: (stepId: string, patch: Partial<ReturnType<typeof stepState>>) => void;
  onJumpToStep: (stepId: string) => void;
}) {
  const tokens = useMemo(() => resolveTokens(student), [student]);
  const step = lesson.steps[Math.min(stepIndex, lesson.steps.length - 1)];
  const saved = stepState(state, step.id);

  const seed = step.exercise ? personalize(step.exercise.seed, tokens) : '';
  const [code, setCode] = useState(saved.code ?? seed);

  // Swap the editor contents when the student moves to another step.
  useEffect(() => {
    setCode(stepState(state, step.id).code ?? seed);
    // Scroll the reading pane back to the top on navigation.
    document.querySelector('.pane-read')?.scrollTo({ top: 0 });
  }, [step.id]);

  // Personalise the checks the same way the prose is personalised.
  const exercise = useMemo(() => {
    if (!step.exercise) return undefined;
    return {
      ...step.exercise,
      prompt: personalize(step.exercise.prompt, tokens),
      seed,
      harness: step.exercise.harness ? personalize(step.exercise.harness, tokens) : undefined,
      hints: step.exercise.hints.map((h) => personalize(h, tokens)),
      tests: JSON.parse(personalize(JSON.stringify(step.exercise.tests), tokens)),
    };
  }, [step.id, tokens, seed]);

  const hasWork = !!step.exercise;

  // A concept step earns its tick by being answered, not by being scrolled
  // past. Steps with no questions in them keep the explicit "Mark as read".
  const asks = askStatus(step.blocks, saved);
  const answeredAll = asks.total > 0 && asks.open === 0;
  useEffect(() => {
    if (!hasWork && answeredAll && !saved.completed) onUpdateStep(step.id, { completed: true });
  }, [answeredAll, hasWork, saved.completed, step.id]);

  if (lesson.kind === 'interview') {
    return (
      <div className="panes">
        <div className="pane-read full">
          <InterviewDrill
            questions={interviewQuestions}
            ratings={saved.rated ?? {}}
            onRate={(id, rating) =>
              onUpdateStep(step.id, { rated: { ...(saved.rated ?? {}), [id]: rating } })
            }
            onJumpToStep={onJumpToStep}
          />
        </div>
      </div>
    );
  }

  const isLast = stepIndex >= lesson.steps.length - 1;
  const pct = ((stepIndex + 1) / lesson.steps.length) * 100;

  // In a lab, a step with work to check must be passed before the next one is
  // readable — otherwise the next step's seed code, which usually continues
  // from this step's solution, gives the answer away. A pure-reading step has
  // nothing to hide, so it never blocks.
  const gated = lesson.kind === 'lab' && (hasWork || asks.total > 0);
  const locked = gated && !saved.completed;

  const reading = (
    <div className={`pane-read${hasWork ? '' : ' full'}`}>
      <div className="reader">
        <div className="step-kicker">
          <span className="kicker-week">Week {week.number}</span>
          <span className="kicker-sep">·</span>
          {lesson.title}
          <span className="kicker-sep">·</span>
          <span className="kicker-step">
            step {stepIndex + 1} of {lesson.steps.length}
          </span>
        </div>
        <h1 className="step-h1">{step.title}</h1>

        <StepView
          stepId={step.id}
          blocks={step.blocks}
          tokens={tokens}
          student={student}
          saved={saved}
          onPatch={(patch) => onUpdateStep(step.id, patch)}
        />

        <div className="step-nav">
          <button disabled={stepIndex === 0} onClick={() => onStepChange(stepIndex - 1)}>
            ← Back
          </button>
          <span className="spacer" />
          {saved.completed && <span className="done-flag">✓ Done</span>}
          {!saved.completed && asks.open > 0 && (
            <span className="asks-left">
              {asks.open} to answer on this step
            </span>
          )}
          {locked && hasWork && asks.open === 0 && (
            <span className="asks-left">Pass the tests to continue</span>
          )}
          {!hasWork && !saved.completed && asks.total === 0 && (
            <button onClick={() => onUpdateStep(step.id, { completed: true })}>Mark as read</button>
          )}
          <button
            className="primary"
            disabled={isLast || locked}
            title={locked ? 'Finish this step before moving on' : undefined}
            onClick={() => {
              if (!hasWork && asks.total === 0) onUpdateStep(step.id, { completed: true });
              onStepChange(stepIndex + 1);
            }}
          >
            {isLast ? 'End of lesson' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );

  const work = hasWork ? (
    <Suspense fallback={<WorkbenchSkeleton />}>
      <Workbench
        key={step.id}
        exercise={exercise}
        tools={toolsFor(step)}
        code={code}
        dark={state.theme === 'dark'}
        onCodeChange={(next) => {
          setCode(next);
          onUpdateStep(step.id, { code: next });
        }}
        student={student}
        onSolved={() => onUpdateStep(step.id, { completed: true })}
        hintsShown={saved.hintsShown ?? 0}
        onHintsChange={(hintsShown) => onUpdateStep(step.id, { hintsShown })}
      />
    </Suspense>
  ) : null;

  return (
    <>
      <div className="lesson-progress" aria-hidden>
        <div className="lesson-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {hasWork ? (
        <SplitPane
          direction="horizontal"
          storageKey="lesson"
          initial={52}
          min={26}
          max={74}
          label="Resize the reading and working panes"
          first={reading}
          second={work}
        />
      ) : (
        <div className="panes">{reading}</div>
      )}
    </>
  );
}

/** Editor chrome without the editor, so the pane does not jump when it lands. */
function WorkbenchSkeleton() {
  return (
    <div className="pane-work">
      <div className="ide">
        <div className="ide-tabs">
          <div className="ide-tab active">
            <span>Program.cs</span>
          </div>
        </div>
        <div className="ide-editor skeleton">
          <div className="skeleton-line" style={{ width: '46%' }} />
          <div className="skeleton-line" style={{ width: '22%' }} />
          <div className="skeleton-line" style={{ width: '64%' }} />
          <div className="skeleton-line" style={{ width: '38%' }} />
          <div className="skeleton-line" style={{ width: '52%' }} />
        </div>
        <div className="ide-status">
          <span className="status-item">Loading the editor…</span>
        </div>
      </div>
    </div>
  );
}
