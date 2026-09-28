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
 * words. **No lecture up to and including Week 8 has announced the final's
 * date or format**, so this file does not invent one, and the Final tab says
 * so rather than showing a plausible-looking placeholder a student might
 * revise against.
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
  },
  {
    id: 'final',
    name: 'Final exam',
    short: 'Final',
    when: 'Date not announced yet',
    format: 'Format not announced yet',
    blurb:
      'Everything the unit covers, not just the first half. Nothing has been built here yet — the midsemester notes are still the closest thing there is.',
    scope: 'The whole unit',
    weeks: [],
    missing: [6, 7, 8],
    ready: false,
  },
];

export const EXAM_BY_ID: Record<ExamId, Exam> = {
  midsem: EXAMS[0],
  final: EXAMS[1],
};

/** The exam a student should land on by default: the first one not yet sat. */
export const DEFAULT_EXAM: ExamId = 'midsem';
