/**
 * The rules that decide when a student is done with a concept.
 *
 * These are the promises the mode makes — "we will not let you skip past
 * something you got wrong" — so they are worth pinning down precisely rather
 * than trusting to the UI to enforce.
 */

import { describe, expect, it } from 'vitest';

import { QUESTION_BY_ID, questionsOfConcept } from '@/content/focus/bank';
import {
  CLEAR_STREAK,
  EMPTY_FOCUS,
  conceptStats,
  fixUpQuestions,
  hydrateFocus,
  markSectionRead,
  nextAction,
  openFixes,
  overallReadiness,
  recordAnswer,
  recordMock,
  scoreMock,
  weekReadiness,
  type FocusState,
} from '../focus';

/** Two questions on one concept, used throughout. */
const CONCEPT = 'constructors';
const [Q1, Q2, Q3] = questionsOfConcept(CONCEPT);

const right = (id: string) => QUESTION_BY_ID[id].answer;
const wrong = (id: string) => (QUESTION_BY_ID[id].answer + 1) % QUESTION_BY_ID[id].options.length;

function answer(state: FocusState, id: string, ok: boolean, mode: 'drill' | 'fix' | 'mock' = 'drill') {
  return recordAnswer(state, id, ok ? right(id) : wrong(id), mode);
}

describe('recording an answer', () => {
  it('opens a fix-up against the concept when the answer is wrong', () => {
    const state = answer(EMPTY_FOCUS, Q1.id, false);
    expect(state.fixes[CONCEPT]).toBeDefined();
    expect(state.fixes[CONCEPT].missed).toEqual([Q1.id]);
    expect(state.fixes[CONCEPT].revised).toBe(false);
    expect(conceptStats(state, CONCEPT).mastery).toBe('shaky');
  });

  it('leaves no fix-up behind when the answer is right', () => {
    const state = answer(EMPTY_FOCUS, Q1.id, true);
    expect(state.fixes[CONCEPT]).toBeUndefined();
    expect(conceptStats(state, CONCEPT).mastery).toBe('partial');
  });

  it('counts a concept as solid after two correct answers', () => {
    let state = answer(EMPTY_FOCUS, Q1.id, true);
    state = answer(state, Q2.id, true);
    expect(conceptStats(state, CONCEPT).mastery).toBe('solid');
  });

  it('ignores a question id that is not in the bank', () => {
    expect(recordAnswer(EMPTY_FOCUS, 'no-such-question', 0, 'drill')).toBe(EMPTY_FOCUS);
  });
});

describe('clearing a fix-up', () => {
  it('refuses to close on correct answers alone, without the revision note', () => {
    // The point of the mode: getting it right by guessing again is not
    // evidence of understanding, so the gate stays shut.
    let state = answer(EMPTY_FOCUS, Q1.id, false);
    for (const q of questionsOfConcept(CONCEPT)) state = answer(state, q.id, true, 'fix');

    expect(state.fixes[CONCEPT]).toBeDefined();
    expect(state.fixes[CONCEPT].streak).toBeGreaterThanOrEqual(CLEAR_STREAK);
    expect(conceptStats(state, CONCEPT).mastery).toBe('shaky');
  });

  it('does not close on the revision note alone either', () => {
    let state = answer(EMPTY_FOCUS, Q1.id, false);
    state = markSectionRead(state, 'n1-constructors', [CONCEPT]);

    expect(state.fixes[CONCEPT]).toBeDefined();
    expect(conceptStats(state, CONCEPT).mastery).toBe('revising');
  });

  it('closes once the note is read and CLEAR_STREAK answers are right', () => {
    let state = answer(EMPTY_FOCUS, Q1.id, false);
    state = markSectionRead(state, 'n1-constructors', [CONCEPT]);
    state = answer(state, Q2.id, true, 'fix');
    expect(state.fixes[CONCEPT]).toBeDefined();

    state = answer(state, Q3.id, true, 'fix');
    expect(state.fixes[CONCEPT]).toBeUndefined();
    expect(conceptStats(state, CONCEPT).mastery).toBe('solid');
  });

  it('closes immediately if the streak was already earned before reading', () => {
    // Progress made while the note was unread is not thrown away — the note
    // is a gate, not a punishment.
    let state = answer(EMPTY_FOCUS, Q1.id, false);
    state = answer(state, Q2.id, true, 'fix');
    state = answer(state, Q3.id, true, 'fix');
    state = markSectionRead(state, 'n1-constructors', [CONCEPT]);

    expect(state.fixes[CONCEPT]).toBeUndefined();
  });

  it('reopens the gate on a fresh miss, even mid-streak', () => {
    let state = answer(EMPTY_FOCUS, Q1.id, false);
    state = markSectionRead(state, 'n1-constructors', [CONCEPT]);
    state = answer(state, Q2.id, true, 'fix');
    state = answer(state, Q3.id, false, 'fix');

    expect(state.fixes[CONCEPT].streak).toBe(0);
    expect(state.fixes[CONCEPT].revised).toBe(false);
    expect(state.fixes[CONCEPT].missed).toContain(Q3.id);
  });

  it('leaves other concepts alone when a note is read', () => {
    let state = answer(EMPTY_FOCUS, Q1.id, false);
    state = markSectionRead(state, 'n3-memory', ['stack-heap']);
    expect(state.fixes[CONCEPT].revised).toBe(false);
  });
});

describe('ordering a fix-up drill', () => {
  it('puts questions the student has not seen first', () => {
    let state = answer(EMPTY_FOCUS, Q1.id, false);
    state = markSectionRead(state, 'n1-constructors', [CONCEPT]);

    const order = fixUpQuestions(state, CONCEPT);
    // Re-answering the one they got wrong proves they remember an answer.
    expect(order.at(-1)).toBe(Q1.id);
    expect(order.length).toBe(questionsOfConcept(CONCEPT).length);
  });
});

describe('readiness', () => {
  it('is zero on a clean slate', () => {
    expect(overallReadiness(EMPTY_FOCUS)).toBe(0);
    expect(weekReadiness(EMPTY_FOCUS, 3)).toBe(0);
  });

  it('scores a wrong answer no better than never having tried', () => {
    const missed = answer(EMPTY_FOCUS, Q1.id, false);
    expect(weekReadiness(missed, 1)).toBe(0);
  });

  it('rises as concepts go solid', () => {
    let state = answer(EMPTY_FOCUS, Q1.id, true);
    state = answer(state, Q2.id, true);
    expect(weekReadiness(state, 1)).toBeGreaterThan(0);
    expect(weekReadiness(state, 1)).toBeLessThan(1);
  });
});

describe('what to do next', () => {
  it('sends an untouched student to a weekly quiz, not a mock paper', () => {
    const action = nextAction(EMPTY_FOCUS);
    expect(action.kind).toBe('drill');
  });

  it('puts an outstanding mistake ahead of everything else', () => {
    const state = answer(EMPTY_FOCUS, Q1.id, false);
    const action = nextAction(state);
    expect(action).toMatchObject({ kind: 'fix', conceptId: CONCEPT });
  });

  it('asks for proof once the note has been read', () => {
    let state = answer(EMPTY_FOCUS, Q1.id, false);
    state = markSectionRead(state, 'n1-constructors', [CONCEPT]);
    const action = nextAction(state);
    expect(action.kind).toBe('fix');
    expect(action.reason).toMatch(/prove it/i);
  });

  it('sorts unrevised mistakes ahead of revised ones', () => {
    let state = answer(EMPTY_FOCUS, Q1.id, false);
    state = markSectionRead(state, 'n1-constructors', [CONCEPT]);
    state = answer(state, questionsOfConcept('stack-heap')[0].id, false);

    expect(openFixes(state).map((f) => f.conceptId)).toEqual(['stack-heap', CONCEPT]);
  });
});

describe('a sat mock paper', () => {
  const paper = {
    paper: 1,
    questionIds: [Q1.id, Q2.id],
    answers: [right(Q1.id), wrong(Q2.id)],
    startedAt: 0,
    submittedAt: 1000,
    seconds: 1200,
  };

  it('scores by comparing against the real answers', () => {
    expect(scoreMock(paper)).toEqual({ correct: 1, total: 2 });
  });

  it('opens fix-ups for what was missed, exactly like a drill would', () => {
    const state = recordMock(EMPTY_FOCUS, paper);
    expect(state.fixes[CONCEPT]).toBeDefined();
    expect(state.fixes[CONCEPT].missed).toEqual([Q2.id]);
    expect(state.mocks.length).toBe(1);
    expect(state.nextPaper).toBe(2);
  });

  it('does not treat an unanswered question as a misconception', () => {
    // Running out of time is a pacing problem, and filling the board with red
    // the student cannot act on would bury the mistakes that matter.
    const blank = { ...paper, answers: [right(Q1.id), null] };
    const state = recordMock(EMPTY_FOCUS, blank);
    expect(state.fixes[CONCEPT]).toBeUndefined();
    expect(scoreMock(blank)).toEqual({ correct: 1, total: 2 });
  });
});

describe('loading a saved file', () => {
  it('survives a file written before this mode existed', () => {
    expect(hydrateFocus(undefined)).toEqual(EMPTY_FOCUS);
  });

  it('infers the next paper number from papers already sat', () => {
    const loaded = hydrateFocus({ mocks: [{ ...{ paper: 1, questionIds: [], answers: [], startedAt: 0, submittedAt: 0, seconds: 1200 } }] });
    expect(loaded.nextPaper).toBe(2);
  });
});
