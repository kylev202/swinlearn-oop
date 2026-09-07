/**
 * Content invariants for Concept Focus.
 *
 * A study mode is only worth using if the material behind it is not quietly
 * broken, and the failures that matter here are silent ones: a question tagged
 * with a concept that no longer exists, a fix-up pointing at a lesson step
 * somebody renamed, a concept with too few questions for its own fix-up rule
 * to ever be satisfiable. None of those throw. They just leave a student stuck.
 */

import { describe, expect, it } from 'vitest';

import { week2 } from '@/content/week2';
import { week3 } from '@/content/week3';
import { week4 } from '@/content/week4';
import { week5 } from '@/content/week5';

import { CONCEPTS, CONCEPT_BY_ID, FOCUS_WEEKS } from '../concepts';
import {
  BANK,
  MOCK_LENGTH,
  buildMockPaper,
  conceptCountOfWeek,
  questionsOfConcept,
  questionsOfWeek,
  weekOf,
  weeklyQuiz,
} from '../bank';
import { NOTES, sectionForConcept } from '../notes';
import { CLEAR_STREAK, SOLID_CORRECT } from '@/state/focus';

const ALL_STEP_IDS = new Set(
  [week2, week3, week4, week5].flatMap((w) => w.lessons.flatMap((l) => l.steps.map((s) => s.id))),
);

describe('the concept map', () => {
  it('has unique ids', () => {
    const ids = CONCEPTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only points at lesson steps that exist', () => {
    // A fix-up offers "go and re-learn this properly" as a link. A dead link
    // there is worse than no link, so renaming a step must fail here.
    const dead: string[] = [];
    for (const c of CONCEPTS) {
      for (const step of c.lessonSteps ?? []) {
        if (!ALL_STEP_IDS.has(step)) dead.push(`${c.id} -> ${step}`);
      }
    }
    expect(dead).toEqual([]);
  });

  it('covers every week the midterm draws from', () => {
    for (const week of FOCUS_WEEKS) {
      expect(CONCEPTS.filter((c) => c.week === week).length).toBeGreaterThan(0);
    }
  });
});

describe('the question bank', () => {
  it('has unique question ids', () => {
    const ids = BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tags every question with a real concept', () => {
    const orphans = BANK.filter((q) => !CONCEPT_BY_ID[q.conceptId]).map((q) => q.id);
    expect(orphans).toEqual([]);
  });

  it('has a valid answer index and matching feedback for every question', () => {
    for (const q of BANK) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.id).toBeLessThan(q.options.length);
      // `why` is index-aligned with options — a short array would silently
      // stop explaining the later distractors, which are the interesting ones.
      if (q.why) expect(q.why.length, q.id).toBe(q.options.length);
      expect(q.explain.length, q.id).toBeGreaterThan(0);
      expect(q.source.length, q.id).toBeGreaterThan(0);
    }
  });

  it('gives every concept enough questions to clear a fix-up with', () => {
    // Clearing a fix-up takes CLEAR_STREAK correct answers *after* the one
    // that was missed. With only CLEAR_STREAK questions on a concept, the
    // student would have to re-answer the very question they just had the
    // answer explained to them, which tests recall of an answer rather than
    // understanding of the idea. So: one more than the streak.
    const need = Math.max(CLEAR_STREAK + 1, SOLID_CORRECT);
    const thin = CONCEPTS.filter((c) => questionsOfConcept(c.id).length < need).map((c) => c.id);
    expect(thin).toEqual([]);
  });

  it('files every question under the week its concept belongs to', () => {
    for (const week of FOCUS_WEEKS) {
      for (const q of questionsOfWeek(week)) expect(weekOf(q)).toBe(week);
    }
    expect(FOCUS_WEEKS.flatMap((w) => questionsOfWeek(w)).length).toBe(BANK.length);
  });
});

describe('the revision notes', () => {
  it('explains every concept somewhere', () => {
    const unexplained = CONCEPTS.filter((c) => !sectionForConcept(c.id)).map((c) => c.id);
    expect(unexplained).toEqual([]);
  });

  it('only claims to cover concepts that exist', () => {
    const bogus: string[] = [];
    for (const notes of NOTES) {
      for (const s of notes.sections) {
        for (const id of s.concepts) if (!CONCEPT_BY_ID[id]) bogus.push(`${s.id} -> ${id}`);
      }
    }
    expect(bogus).toEqual([]);
  });

  it('has unique section ids across all five weeks', () => {
    const ids = NOTES.flatMap((n) => n.sections.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps a concept and the note that explains it in the same week', () => {
    // The fix-up card says "Week 3 revision notes". If the note lived under a
    // different week from the concept, that label would be a lie.
    for (const c of CONCEPTS) {
      const found = sectionForConcept(c.id);
      expect(found?.week, c.id).toBe(c.week);
    }
  });
});

describe('a weekly quiz', () => {
  it('asks every question in the week, exactly once', () => {
    for (const week of FOCUS_WEEKS) {
      const quiz = weeklyQuiz(week);
      expect(quiz.length).toBe(questionsOfWeek(week).length);
      expect(new Set(quiz.map((q) => q.id)).size).toBe(quiz.length);
    }
  });

  it('spreads concepts out instead of asking one four times in a row', () => {
    // The banks are written concept by concept; playing them in file order
    // would let a student coast on whichever idea is still fresh in mind.
    for (const week of FOCUS_WEEKS) {
      const quiz = weeklyQuiz(week);
      const distinct = new Set(quiz.map((q) => q.conceptId)).size;
      const firstRun = quiz.slice(0, distinct).map((q) => q.conceptId);
      expect(new Set(firstRun).size, `week ${week}`).toBe(distinct);
    }
  });

  it('is the same quiz every time it is opened', () => {
    expect(weeklyQuiz(3).map((q) => q.id)).toEqual(weeklyQuiz(3).map((q) => q.id));
  });

  it('can be cut to one question per concept, which is what the UI asks for', () => {
    // A week holds 20-30 questions. The sitting a student is offered is one
    // round of the round-robin: every concept once, nothing twice.
    for (const week of FOCUS_WEEKS) {
      const round = weeklyQuiz(week, 1, 1);
      expect(round.length, `week ${week}`).toBe(conceptCountOfWeek(week));
      expect(new Set(round.map((q) => q.conceptId)).size).toBe(round.length);
    }
  });

  it('asks different questions on a second sitting', () => {
    // The seed moves with how much of the week has been attempted, so coming
    // back to a week does not replay the identical paper.
    const first = weeklyQuiz(2, 1, 1).map((q) => q.id);
    const second = weeklyQuiz(2, 5, 1).map((q) => q.id);
    expect(second).not.toEqual(first);
  });
});

describe('a mock paper', () => {
  it('is ten questions', () => {
    expect(buildMockPaper(1).length).toBe(MOCK_LENGTH);
  });

  it('takes two from every week, like the real one', () => {
    for (const paper of [1, 2, 3]) {
      const counts = new Map<number, number>();
      for (const q of buildMockPaper(paper)) {
        counts.set(weekOf(q), (counts.get(weekOf(q)) ?? 0) + 1);
      }
      for (const week of FOCUS_WEEKS) expect(counts.get(week), `paper ${paper} week ${week}`).toBe(2);
    }
  });

  it('includes questions harder than the revision quiz', () => {
    // The lecturer's own estimate: 2-3 of the real ten are harder than the
    // revision quiz. A paper of ten softballs would flatter the student.
    for (const paper of [1, 2, 3, 4]) {
      expect(buildMockPaper(paper).filter((q) => q.stretch).length, `paper ${paper}`)
        .toBeGreaterThanOrEqual(2);
    }
  });

  it('never repeats a question within one paper', () => {
    for (const paper of [1, 2, 3, 4, 5]) {
      const ids = buildMockPaper(paper).map((q) => q.id);
      expect(new Set(ids).size, `paper ${paper}`).toBe(ids.length);
    }
  });

  it('is the same paper every time it is opened', () => {
    expect(buildMockPaper(2).map((q) => q.id)).toEqual(buildMockPaper(2).map((q) => q.id));
  });

  it('is a different paper from the one before it', () => {
    const first = buildMockPaper(1).map((q) => q.id);
    const second = buildMockPaper(2, first).map((q) => q.id);
    const repeated = second.filter((id) => first.includes(id));
    expect(repeated).toEqual([]);
  });
});
