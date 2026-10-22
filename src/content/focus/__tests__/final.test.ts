/**
 * The final-term test's own material.
 *
 * `bank.test.ts` enforces the structural invariants that apply to both exams.
 * This file is about the *final specifically*: that what the released mockup
 * paper asks is actually answerable from the bank, and that the two exams
 * stay genuinely separate now that they share one concept map.
 *
 * The mockup (`Final_Mockup Sample (2).pdf`) is the closest thing to a real
 * paper this unit has released, and Lecture 11 walks through it question by
 * question. Every one of its twelve questions should be recognisable here —
 * if a future edit drops the material behind one, this is what says so.
 */

import { describe, expect, it } from 'vitest';

import { ALL_WEEKS, CONCEPTS } from '../concepts';
import { BANK, buildMockPaper, questionsOfWeek, weekOf, weeklyQuiz } from '../bank';
import { EXAM_BY_ID } from '../exams';
import { notesOfWeek } from '../notes';

/** The theory weeks the final adds over the midsemester test. */
const NEW_WEEKS = [6, 7, 8, 9, 10, 11];

describe('the final exam', () => {
  it('covers the whole unit, not just the second half', () => {
    // Lecture 11: "theoretical content from Weeks 6-11, but coding analysis
    // questions from Week 1-11". Scoping the paper to 6-11 would drop the
    // code-analysis half of it.
    expect(EXAM_BY_ID.final.weeks).toEqual(ALL_WEEKS);
  });

  it('matches the details printed on the released mockup paper', () => {
    const final = EXAM_BY_ID.final;
    expect(final.length).toBe(20);
    expect(final.minutes).toBe(40);
    expect(final.when).toMatch(/Week 12/);
    expect(final.ready).toBe(true);
    // The gap this replaced: it used to claim nothing was announced.
    expect(final.when).not.toMatch(/not announced/i);
    expect(final.missing).toEqual([]);
  });

  it('weights the paper toward the weeks it examines for theory', () => {
    const bp = EXAM_BY_ID.final.blueprint;
    const theory = NEW_WEEKS.reduce((n, w) => n + (bp[w] ?? 0), 0);
    const code = [1, 2, 3, 4, 5].reduce((n, w) => n + (bp[w] ?? 0), 0);
    expect(theory).toBeGreaterThan(code);
    expect(theory + code).toBe(20);
  });

  it('has notes and questions for every week it covers', () => {
    for (const week of EXAM_BY_ID.final.weeks) {
      expect(notesOfWeek(week), `week ${week} notes`).toBeDefined();
      expect(questionsOfWeek(week).length, `week ${week} questions`).toBeGreaterThan(0);
    }
  });

  it('gives each new week enough questions for a meaningful sitting', () => {
    // A week's quiz is one question per concept. Fewer questions than
    // concepts would mean the sweep could not cover the week.
    for (const week of NEW_WEEKS) {
      const concepts = CONCEPTS.filter((c) => c.week === week).length;
      expect(questionsOfWeek(week).length, `week ${week}`).toBeGreaterThanOrEqual(concepts);
      expect(weeklyQuiz(week, 1, 1).length, `week ${week} sweep`).toBe(concepts);
    }
  });
});

/*
 * One assertion per mockup question, found by the distinctive wording of the
 * thing it tests. These are deliberately loose — they check the *material* is
 * present and reachable, not that any particular question id survives.
 */
describe('the released mockup paper is answerable', () => {
  const text = (q: (typeof BANK)[number]) =>
    `${q.question} ${q.options.join(' ')} ${q.explain} ${q.code ?? ''}`.toLowerCase();

  const asks = (...needles: string[]) =>
    BANK.filter((q) => needles.every((n) => text(q).includes(n.toLowerCase())));

  const cases: [string, string[]][] = [
    ['Q1 · debugging unknown errors', ['stack trace', 'root cause']],
    ['Q2 · reading API documentation', ['api documentation', 'parameters']],
    ['Q3 · why low coupling is desirable', ['coupling', 'maintain']],
    ['Q4 · the "antisocial" class', ['antisocial', 'dependencies']],
    ['Q5 · Singleton for a Logger', ['logger', 'singleton']],
    ['Q6 · Factory by its definition', ['interface for object creation', 'factory']],
    ['Q7 · passing an object to a method', ['reference', 'heap']],
    ['Q8 · the three pattern categories', ['structural', 'creational', 'behavioural']],
    ['Q9 · Protected Variations refactor', ['paymentprocessor', 'polymorphism']],
    ['Q10 · try/catch/finally', ['finally']],
    ['Q11 · the invalid overload', ['overload', 'parameter name']],
    ['Q12 · naming the pattern from a factory listing', ['enginefactory', 'factory']],
  ];

  for (const [name, needles] of cases) {
    it(name, () => {
      const found = asks(...needles);
      expect(found.length, `nothing in the bank covers ${name}`).toBeGreaterThan(0);
    });
  }
});

describe('the two exams stay separate', () => {
  it('keeps Weeks 6-11 off a midsemester paper', () => {
    // The midsem bank is a subset of the final's now. A blueprint or
    // stretch-swap bug would quietly put design patterns on a Week 6 paper.
    for (const paper of [1, 2, 3, 4, 5]) {
      for (const q of buildMockPaper(paper, [], 'midsem')) {
        expect(weekOf(q), `paper ${paper}`).toBeLessThanOrEqual(5);
      }
    }
  });

  it('puts the new weeks on a final paper', () => {
    for (const paper of [1, 2, 3]) {
      const weeks = buildMockPaper(paper, [], 'final').map(weekOf);
      expect(weeks.some((w) => NEW_WEEKS.includes(w)), `paper ${paper}`).toBe(true);
    }
  });

  it('files every new question under a week the final covers', () => {
    const scope = new Set(EXAM_BY_ID.final.weeks);
    for (const q of BANK) expect(scope.has(weekOf(q)), q.id).toBe(true);
  });
});
