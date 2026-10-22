/**
 * The exams Concept Focus prepares for.
 *
 * Concept Focus was built for one exam — the Week 6 midsemester test — and
 * everything in `concepts.ts`, `bank/` and `notes/` is scoped to it: Weeks 1-5,
 * ten multiple-choice questions, twenty minutes, closed book. That scoping is
 * the mode's whole value, so the answer to "the final is coming too" is not to
 * widen the existing material until it covers both. It is to say out loud that
 * there are two exams, show which one each piece of revision belongs to, and
 * be honest that the second one has nothing behind it yet.
 *
 * What is recorded here is only what the unit has actually said. Lecture 5
 * gave the midsemester test's date, format, weight and coverage in as many
 * words. The final's details went unannounced until the **released mockup
 * paper** (`Final_Mockup Sample (2).pdf`) stated them in its own header: 20
 * questions, 40 minutes, closed book, Weeks 1-11, in-class in the first hour
 * of Week 12. Lecture 11 walks through that same paper and agrees, with one
 * wobble worth knowing while revising:
 *
 *   The lecturer says "20 questions" and later "22", and the mockup handed
 *   out has only 12. **20 is the number used here**, because it is the one
 *   the paper's own printed header gives. Expect a couple either way.
 *
 * One more thing from Lecture 11 shapes the whole final bank: the paper is
 * *not* Weeks 6-11 only. "Theoretical content from Weeks 6-11, but coding
 * analysis questions from Week 1-11." So the final's `weeks` is the entire
 * unit, and the 353 questions written for the midsemester are not dead
 * weight — they are the code-analysis half of the final.
 */

export type ExamId = 'midsem' | 'final';

export interface Exam {
  id: ExamId;
  /** Full name, for headings. */
  name: string;
  /** Two or three letters, for the tab. */
  short: string;
  /** When it happens, or what is known about when. */
  when: string;
  /** Format in one line, or what is known about the format. */
  format: string;
  /** One sentence for the card on the home page. */
  blurb: string;
  /**
   * Weeks the exam covers. For the final this is the unit as a whole, which
   * runs past what the app has been built up to.
   */
  scope: string;
  /**
   * Weeks with revision notes and a question bank behind them. Empty means
   * the tab has nothing to study yet and says so.
   */
  weeks: number[];
  /**
   * Weeks the exam covers that have no revision material written. Shown on
   * the Final tab so the gap is visible rather than implied.
   */
  missing: number[];
  ready: boolean;
  /** How many questions a mock paper for this exam holds. */
  length: number;
  /** How long a mock paper for this exam allows, in minutes. */
  minutes: number;
  /**
   * How many of a mock paper's questions come from each week.
   *
   * Written out per week rather than computed, because the two papers are
   * shaped differently on purpose: the midsem spreads evenly over five
   * weeks, while the final is weighted toward Weeks 6-11, which is where its
   * theory comes from. Must sum to `length`.
   */
  blueprint: Record<number, number>;
}

export const EXAMS: Exam[] = [
  {
    id: 'midsem',
    name: 'Midsemester test',
    short: 'Midsem',
    when: 'Week 6',
    format: '10 multiple-choice questions · 20 minutes · closed book',
    // Deliberately not a restatement of `format` — the card shows both, one
    // under the other, and saying "ten questions in twenty minutes" twice was
    // the first thing that looked wrong on screen.
    blurb:
      'Revision notes for all five weeks, a quiz per week, and mock papers under the clock — and anything you get wrong stays on a list until you have revised it and proved it.',
    scope: 'Weeks 1–5',
    weeks: [1, 2, 3, 4, 5],
    missing: [],
    ready: true,
    length: 10,
    minutes: 20,
    blueprint: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 },
  },
  {
    id: 'final',
    name: 'Final-term test',
    short: 'Final',
    when: 'Week 12, first hour of the lab',
    format: '20 questions · 40 minutes · closed book',
    blurb:
      'Twice the paper the midsemester was, over the whole unit. Theory from Weeks 6–11, code analysis from anywhere in Weeks 1–11 — which is why the first half is still on it.',
    scope: 'Weeks 1–11',
    weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    missing: [],
    ready: true,
    length: 20,
    minutes: 40,
    /*
     * Twelve from Weeks 6-11, eight from Weeks 1-5.
     *
     * That is Lecture 11's own split made literal — "theoretical content from
     * Weeks 6-11, but coding analysis questions from Week 1-11" — rather than
     * twenty questions spread flat over eleven weeks, which would have made
     * the second half of the unit a minority of its own paper. Two per week
     * for the theory weeks, and the earlier weeks share the remaining eight,
     * weighted to Weeks 3-5: the released mockup's only Weeks 1-5 question is
     * Q7, on passing an object to a method, which is Week 3 memory material.
     */
    blueprint: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2 },
  },
];

export const EXAM_BY_ID: Record<ExamId, Exam> = {
  midsem: EXAMS[0],
  final: EXAMS[1],
};

/** The exam a student should land on by default: the first one not yet sat. */
export const DEFAULT_EXAM: ExamId = 'midsem';
