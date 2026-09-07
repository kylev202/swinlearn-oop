/**
 * Mastery tracking for Concept Focus.
 *
 * Everything here is a pure function over a plain data structure, so the rules
 * that decide "you are not done with this yet" can be tested without a browser
 * and read without one either. `progress.ts` owns persistence; this file owns
 * the meaning.
 *
 * The rule the whole mode turns on:
 *
 *   A wrong answer opens a **fix-up** against the concept it tested. The
 *   fix-up closes only when the student has (a) read the revision note for
 *   that concept and (b) answered two further questions on it correctly.
 *
 * Both halves are deliberate. Without the reading requirement a student can
 * clear a fix-up by guessing again until it lands, which teaches nothing.
 * Without the two-correct requirement, reading the note is enough, and reading
 * something is not evidence you understood it. Progress is still visible while
 * the note is unread — the streak counts up — so the requirement reads as a
 * gate rather than a punishment.
 */

import { CONCEPTS, CONCEPT_BY_ID } from '@/content/focus/concepts';
import { QUESTION_BY_ID, questionsOfConcept } from '@/content/focus/bank';
import { MOCK_MINUTES } from '@/content/focus/bank';

/** How many consecutive correct answers close a fix-up, once revised. */
export const CLEAR_STREAK = 2;
/** How many correct answers make a concept count as solid. */
export const SOLID_CORRECT = 2;

export type DrillMode = 'drill' | 'fix' | 'mock';

export interface Attempt {
  /** The option index chosen. */
  choice: number;
  correct: boolean;
  /** Epoch milliseconds, so the review can order things sensibly. */
  at: number;
  mode: DrillMode;
}

/** An outstanding mistake, tracked per concept rather than per question. */
export interface FixUp {
  conceptId: string;
  /** When the miss that opened this happened. */
  since: number;
  /** Question ids missed while it has been open — shown in the review. */
  missed: string[];
  /** Has the revision note been read since the miss? */
  revised: boolean;
  /** Consecutive correct answers on this concept since it opened. */
  streak: number;
}

export interface MockAttempt {
  /** 1-based paper number, which is also the seed for its questions. */
  paper: number;
  questionIds: string[];
  /** Index chosen per question, `null` for left blank. */
  answers: (number | null)[];
  startedAt: number;
  submittedAt: number;
  /** Seconds allowed when it was sat, so an old result stays readable. */
  seconds: number;
}

export interface FocusState {
  attempts: Record<string, Attempt[]>;
  fixes: Record<string, FixUp>;
  mocks: MockAttempt[];
  /** Note section id → when it was last read. */
  readSections: Record<string, number>;
  /** Which paper number to hand out next. */
  nextPaper: number;
}

export const EMPTY_FOCUS: FocusState = {
  attempts: {},
  fixes: {},
  mocks: [],
  readSections: {},
  nextPaper: 1,
};

/** Fill in anything a saved file predates. */
export function hydrateFocus(saved: Partial<FocusState> | undefined): FocusState {
  if (!saved) return EMPTY_FOCUS;
  return {
    attempts: saved.attempts ?? {},
    fixes: saved.fixes ?? {},
    mocks: saved.mocks ?? [],
    readSections: saved.readSections ?? {},
    nextPaper: saved.nextPaper ?? (saved.mocks?.length ?? 0) + 1,
  };
}

// ---------------------------------------------------------------- answering

/**
 * Record one answer and return the new state.
 *
 * Called from every mode, including a mock paper — a question missed under
 * exam conditions is exactly as much of a gap as one missed in a drill, and
 * arguably more.
 */
export function recordAnswer(
  state: FocusState,
  questionId: string,
  choice: number,
  mode: DrillMode,
  now = Date.now(),
): FocusState {
  const question = QUESTION_BY_ID[questionId];
  if (!question) return state;

  const correct = choice === question.answer;
  const attempts = {
    ...state.attempts,
    [questionId]: [...(state.attempts[questionId] ?? []), { choice, correct, at: now, mode }],
  };

  const conceptId = question.conceptId;
  const open = state.fixes[conceptId];
  const fixes = { ...state.fixes };

  if (!correct) {
    // A fresh miss reopens the gate even on a fix-up that was nearly closed:
    // getting one right then wrong again is not evidence of understanding.
    fixes[conceptId] = {
      conceptId,
      since: open?.since ?? now,
      missed: [...new Set([...(open?.missed ?? []), questionId])],
      revised: false,
      streak: 0,
    };
  } else if (open) {
    const streak = open.streak + 1;
    if (open.revised && streak >= CLEAR_STREAK) delete fixes[conceptId];
    else fixes[conceptId] = { ...open, streak };
  }

  return { ...state, attempts, fixes };
}

/**
 * Mark a revision-note section as read, which satisfies the reading half of
 * every fix-up on the concepts that section covers.
 */
export function markSectionRead(
  state: FocusState,
  sectionId: string,
  conceptIds: readonly string[],
  now = Date.now(),
): FocusState {
  const fixes = { ...state.fixes };
  for (const id of conceptIds) {
    const open = fixes[id];
    if (!open || open.revised) continue;
    // Reading can complete a fix-up outright if the student already answered
    // enough questions correctly while the note was still unread.
    if (open.streak >= CLEAR_STREAK) delete fixes[id];
    else fixes[id] = { ...open, revised: true };
  }
  return { ...state, readSections: { ...state.readSections, [sectionId]: now }, fixes };
}

// ----------------------------------------------------------------- mastery

export type Mastery = 'untested' | 'shaky' | 'revising' | 'partial' | 'solid';

export const MASTERY_LABEL: Record<Mastery, string> = {
  untested: 'Not tried',
  shaky: 'Got it wrong',
  revising: 'Revised — prove it',
  partial: 'One right so far',
  solid: 'Solid',
};

/** How much each state is worth when scoring readiness, 0..1. */
const MASTERY_WEIGHT: Record<Mastery, number> = {
  untested: 0,
  shaky: 0,
  revising: 0.35,
  partial: 0.7,
  solid: 1,
};

export interface ConceptStats {
  conceptId: string;
  mastery: Mastery;
  asked: number;
  correct: number;
  fix?: FixUp;
}

export function conceptStats(state: FocusState, conceptId: string): ConceptStats {
  let asked = 0;
  let correct = 0;
  for (const q of questionsOfConcept(conceptId)) {
    for (const a of state.attempts[q.id] ?? []) {
      asked++;
      if (a.correct) correct++;
    }
  }

  const fix = state.fixes[conceptId];
  let mastery: Mastery;
  if (fix) mastery = fix.revised ? 'revising' : 'shaky';
  else if (asked === 0) mastery = 'untested';
  else if (correct >= SOLID_CORRECT) mastery = 'solid';
  else mastery = 'partial';

  return { conceptId, mastery, asked, correct, fix };
}

export function allConceptStats(state: FocusState): ConceptStats[] {
  return CONCEPTS.map((c) => conceptStats(state, c.id));
}

/** Readiness for one week, 0..1 — the mean weight of its concepts. */
export function weekReadiness(state: FocusState, week: number): number {
  const ids = CONCEPTS.filter((c) => c.week === week);
  if (!ids.length) return 0;
  const total = ids.reduce((n, c) => n + MASTERY_WEIGHT[conceptStats(state, c.id).mastery], 0);
  return total / ids.length;
}

/** Readiness across all five weeks, 0..1. */
export function overallReadiness(state: FocusState): number {
  const stats = allConceptStats(state);
  if (!stats.length) return 0;
  return stats.reduce((n, s) => n + MASTERY_WEIGHT[s.mastery], 0) / stats.length;
}

/** Open fix-ups, worst first: unrevised before revised, then oldest. */
export function openFixes(state: FocusState): FixUp[] {
  return Object.values(state.fixes).sort((a, b) => {
    if (a.revised !== b.revised) return a.revised ? 1 : -1;
    return a.since - b.since;
  });
}

// ------------------------------------------------------------ what to do next

export type NextAction =
  | { kind: 'notes'; week: number; reason: string }
  | { kind: 'drill'; week: number; reason: string }
  | { kind: 'fix'; conceptId: string; reason: string }
  | { kind: 'mock'; paper: number; reason: string };

/**
 * The single thing the overview tells the student to do.
 *
 * One recommendation, not a menu. A student with four days left and eleven
 * amber tiles does not need options — they need to be told where to start, in
 * an order that does not waste the time they have.
 */
export function nextAction(state: FocusState): NextAction {
  // 1. Clear mistakes first. They are the highest-value minutes available:
  //    a concept you got wrong is one you would get wrong again on the paper.
  const fixes = openFixes(state);
  if (fixes.length) {
    const fix = fixes[0];
    const title = CONCEPT_BY_ID[fix.conceptId]?.title ?? fix.conceptId;
    return {
      kind: 'fix',
      conceptId: fix.conceptId,
      reason: fix.revised
        ? `You have revised ${title} — now prove it with ${CLEAR_STREAK - fix.streak} more correct.`
        : `You missed a question on ${title}. Read the note, then try it again.`,
    };
  }

  // 2. Then any week not yet drilled at all — coverage before polish.
  for (const week of [1, 2, 3, 4, 5]) {
    const stats = CONCEPTS.filter((c) => c.week === week).map((c) => conceptStats(state, c.id));
    if (stats.every((s) => s.mastery === 'untested')) {
      return { kind: 'drill', week, reason: `Week ${week} is untouched. Its quiz covers every concept on the paper from that week.` };
    }
  }

  // 3. Then the weakest week that is not finished.
  const weakest = [1, 2, 3, 4, 5]
    .map((week) => ({ week, r: weekReadiness(state, week) }))
    .filter((w) => w.r < 1)
    .sort((a, b) => a.r - b.r)[0];
  if (weakest && weakest.r < 0.85) {
    return {
      kind: 'drill',
      week: weakest.week,
      reason: `Week ${weakest.week} is your weakest at ${Math.round(weakest.r * 100)}%.`,
    };
  }

  // 4. Everything is green: sit a paper under the clock, which is a different
  //    skill from knowing the material.
  return {
    kind: 'mock',
    paper: state.nextPaper,
    reason:
      state.mocks.length === 0
        ? `You know the content. Now do it in ${MOCK_MINUTES} minutes with no notes.`
        : `Sit paper ${state.nextPaper} — same format, different questions.`,
  };
}

// ------------------------------------------------------------ question order

/**
 * Order a concept's questions for a fix-up drill.
 *
 * Unseen questions first — re-answering the one they already got wrong proves
 * they remember an answer, not that they understand the idea. Among questions
 * already seen, the least recently attempted comes first.
 */
export function fixUpQuestions(state: FocusState, conceptId: string): string[] {
  return questionsOfConcept(conceptId)
    .map((q) => {
      const attempts = state.attempts[q.id] ?? [];
      return { id: q.id, seen: attempts.length > 0, last: attempts.at(-1)?.at ?? 0 };
    })
    .sort((a, b) => (a.seen === b.seen ? a.last - b.last : a.seen ? 1 : -1))
    .map((q) => q.id);
}

// ----------------------------------------------------------------- mock papers

export function scoreMock(attempt: MockAttempt): { correct: number; total: number } {
  let correct = 0;
  attempt.questionIds.forEach((id, i) => {
    const q = QUESTION_BY_ID[id];
    if (q && attempt.answers[i] === q.answer) correct++;
  });
  return { correct, total: attempt.questionIds.length };
}

/** Every question id the student has already met on a mock paper. */
export function seenOnMocks(state: FocusState): string[] {
  return state.mocks.flatMap((m) => m.questionIds);
}

export function recordMock(state: FocusState, attempt: MockAttempt): FocusState {
  let next: FocusState = {
    ...state,
    mocks: [...state.mocks, attempt],
    nextPaper: Math.max(state.nextPaper, attempt.paper + 1),
  };
  // Fold every answer through the normal machinery, so a question missed on a
  // paper opens a fix-up exactly like one missed in a drill. Blanks are left
  // alone: not answering is a timing problem, not a misconception, and marking
  // it as one would fill the board with red the student cannot act on.
  attempt.questionIds.forEach((id, i) => {
    const choice = attempt.answers[i];
    if (choice !== null && choice !== undefined) {
      next = recordAnswer(next, id, choice, 'mock', attempt.submittedAt);
    }
  });
  return next;
}
