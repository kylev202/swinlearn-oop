/**
 * Content model for Concept Focus — the midterm study mode.
 *
 * The lesson player teaches a week at a time, in order, with an editor open.
 * The midterm is the opposite shape: 20 minutes, 10 multiple-choice questions,
 * closed book, drawn from anywhere in Weeks 1-5 (Lecture 5, "Midterm Test —
 * Logistics"). Preparing for it is not "do the lessons again" — it is *find
 * the handful of ideas you are still shaky on, and fix those*.
 *
 * So this model is indexed by concept rather than by week: a concept is the
 * unit a question tests, the unit a revision note explains, and the unit the
 * app tracks mastery of. Weeks are just a grouping over concepts, kept because
 * that is how the student thinks about where material came from.
 */

import type { Block } from '../types';

/**
 * One examinable idea.
 *
 * Deliberately small — "stack vs heap" is a concept, "memory" is not. If a
 * student misses a question, the app has to be able to point at exactly what
 * to re-read, and "memory" is not an answer to that.
 */
export interface Concept {
  id: string;
  /** Which week it was taught in, for grouping and for the source line. */
  week: number;
  title: string;
  /** The single sentence a student should be able to say back. Shown on the
   *  fix-up card before anything longer, because that is what an MCQ tests. */
  oneLiner: string;
  /**
   * Ids of steps in the main lesson content that teach this properly.
   * A fix-up offers these as "go and actually re-learn it" — the revision
   * note is a reminder, not a replacement for the lesson.
   */
  lessonSteps?: string[];
}

/**
 * One question in the bank.
 *
 * Every question is single-answer multiple choice, because that is the format
 * of the real paper. True/false questions are modelled the same way with two
 * options rather than as a separate kind — one renderer, one scoring rule.
 */
export interface FocusQuestion {
  id: string;
  conceptId: string;
  /** Optional C# the question is about, shown above the options. */
  code?: string;
  question: string;
  options: string[];
  answer: number;
  /**
   * Per-option feedback, index-aligned with `options`. Shown for the option
   * the student actually picked: being told "not B" teaches nothing, being
   * told what B *would* have been true of teaches the distinction.
   */
  why?: string[];
  /** The idea itself, shown after every answer, right or wrong. */
  explain: string;
  /**
   * Where this came from — "Quiz 3 Q8", "Lecture 5 mock walkthrough". Shown
   * in the review so a student can weigh how likely it is to reappear.
   */
  source: string;
  /**
   * Harder than a typical revision-quiz question. The lecturer says 2-3 of the
   * 10 real questions are harder than the revision quiz, so a mock paper
   * deliberately includes some of these rather than sampling flat.
   */
  stretch?: boolean;
}

/**
 * A week's revision notes.
 *
 * Reuses the lesson `Block` type, so tables, callouts, code samples, compare
 * panes and UML all render through the existing StepView machinery — a note
 * about stack vs heap gets the same two-column comparison the lesson uses.
 *
 * Notes are split into sections that each name the concepts they cover, which
 * is what lets a fix-up jump to the exact paragraph rather than the top of a
 * page.
 */
export interface WeekNotes {
  week: number;
  title: string;
  /** What this week contributes to the midterm, in one line. */
  gist: string;
  /** The resource documents these were distilled from. */
  sources: string[];
  sections: NoteSection[];
}

export interface NoteSection {
  id: string;
  title: string;
  /** Concepts explained here. Drives the "revise this" jump from a miss. */
  concepts: string[];
  blocks: Block[];
}
