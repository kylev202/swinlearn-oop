/** All five weeks of revision notes, plus lookups by week and by concept. */

import type { NoteSection, WeekNotes } from '../types';
import { NOTES_WEEK1 } from './week1';
import { NOTES_WEEK2 } from './week2';
import { NOTES_WEEK3 } from './week3';
import { NOTES_WEEK4 } from './week4';
import { NOTES_WEEK5 } from './week5';

export const NOTES: WeekNotes[] = [
  NOTES_WEEK1,
  NOTES_WEEK2,
  NOTES_WEEK3,
  NOTES_WEEK4,
  NOTES_WEEK5,
];

export function notesOfWeek(week: number): WeekNotes | undefined {
  return NOTES.find((n) => n.week === week);
}

/**
 * The section that explains a concept, with the week it lives in.
 *
 * This is what a wrong answer turns into: not "go and revise Week 3" but the
 * two hundred words that actually cover the thing that was missed.
 */
export function sectionForConcept(
  conceptId: string,
): { week: number; section: NoteSection } | undefined {
  for (const notes of NOTES) {
    const section = notes.sections.find((s) => s.concepts.includes(conceptId));
    if (section) return { week: notes.week, section };
  }
  return undefined;
}
