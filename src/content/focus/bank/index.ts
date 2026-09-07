/**
 * The whole question bank, plus the rules for drawing questions out of it.
 *
 * Two different draws are needed and they have opposite goals:
 *
 *   A weekly quiz wants *coverage* — every concept in that week, so a student
 *   finishes knowing which parts of the week they are shaky on.
 *
 *   A mock paper wants *representativeness* — 10 questions spread across all
 *   five weeks in the same proportions as the real thing, including a couple
 *   that are harder than the revision quiz, because the lecturer says 2-3 of
 *   the real ten will be.
 *
 * Neither draw is adaptive. A practice paper that quietly asks you only what
 * you are bad at is useless as a score you can trust, and trusting the score
 * is the entire point of sitting one.
 */

import type { FocusQuestion } from '../types';
import { rng, shuffled } from '../../shuffle';
import { WEEK1 } from './week1';
import { WEEK2 } from './week2';
import { WEEK3 } from './week3';
import { WEEK4 } from './week4';
import { WEEK5 } from './week5';
import { CONCEPT_BY_ID } from '../concepts';

export const BANK: FocusQuestion[] = [...WEEK1, ...WEEK2, ...WEEK3, ...WEEK4, ...WEEK5];

export const QUESTION_BY_ID: Record<string, FocusQuestion> = Object.fromEntries(
  BANK.map((q) => [q.id, q]),
);

/** Which week a question belongs to, via the concept it tests. */
export function weekOf(q: FocusQuestion): number {
  return CONCEPT_BY_ID[q.conceptId]?.week ?? 0;
}

export function questionsOfWeek(week: number): FocusQuestion[] {
  return BANK.filter((q) => weekOf(q) === week);
}

export function questionsOfConcept(conceptId: string): FocusQuestion[] {
  return BANK.filter((q) => q.conceptId === conceptId);
}

// ------------------------------------------------------------- shuffling

/*
 * Question order is seeded rather than random so that "mock paper 3" is the
 * same ten questions every time it is opened. A student who runs out of time
 * and comes back, or who wants to re-sit the same paper after revising, gets
 * the same paper; a fresh paper number gets a genuinely different one.
 *
 * The generator and the Fisher-Yates over it are shared with option shuffling
 * in `content/shuffle.ts` — same job, and two copies of a shuffle drift apart
 * the first time one is touched.
 */

// ---------------------------------------------------------- weekly quiz

/**
 * Every question for one week, ordered so each concept gets an airing before
 * any concept is asked twice.
 *
 * The round-robin matters: the banks are written concept by concept, so
 * playing them in file order would ask four constructor questions in a row
 * and let a student coast on one idea being fresh in mind.
 */
export function weeklyQuiz(week: number, seed = 1, rounds?: number): FocusQuestion[] {
  const byConcept = new Map<string, FocusQuestion[]>();
  for (const q of questionsOfWeek(week)) {
    const list = byConcept.get(q.conceptId) ?? [];
    list.push(q);
    byConcept.set(q.conceptId, list);
  }

  const next = rng(seed + week * 977);
  const queues = shuffled([...byConcept.values()], next).map((qs) => shuffled(qs, next));

  const total = queues.reduce((n, q) => n + q.length, 0);
  const limit = rounds ?? Math.max(...queues.map((q) => q.length));

  const out: FocusQuestion[] = [];
  let round = 0;
  while (out.length < total && round < limit) {
    for (const queue of queues) if (queue[round]) out.push(queue[round]);
    round++;
  }
  return out;
}

/** How many distinct concepts a week has — the length of one full round. */
export function conceptCountOfWeek(week: number): number {
  return new Set(questionsOfWeek(week).map((q) => q.conceptId)).size;
}

// ----------------------------------------------------------- mock paper

/** The real paper: 10 questions, Weeks 1-5, 20 minutes. */
export const MOCK_LENGTH = 10;
export const MOCK_MINUTES = 20;

/**
 * How many of the ten come from each week.
 *
 * Two per week is the honest reading of "Week 1 to Week 5 content", and it is
 * what the seven-row mock-test walkthrough in Lecture 5 roughly works out to.
 * Weeks 1 and 4 get the extra weight in practice simply because they own the
 * most concepts, which the stretch rule below leaves room for.
 */
const BLUEPRINT: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 };

/** At least this many questions harder than a revision-quiz question. */
const MIN_STRETCH = 2;

/**
 * Assemble mock paper `n` (1-based).
 *
 * `avoid` holds question ids the student has already met on an earlier paper.
 * They are pushed to the back of each week's pool rather than removed: with
 * roughly twenty questions a week the bank runs out eventually, and repeating
 * a question a student has already seen once beats handing them a short paper.
 */
export function buildMockPaper(n: number, avoid: readonly string[] = []): FocusQuestion[] {
  const next = rng(9001 + n * 7919);
  const seen = new Set(avoid);
  const picked: FocusQuestion[] = [];

  for (const [week, count] of Object.entries(BLUEPRINT)) {
    const pool = shuffled(questionsOfWeek(Number(week)), next);
    const fresh = pool.filter((q) => !seen.has(q.id));
    const rest = pool.filter((q) => seen.has(q.id));
    picked.push(...[...fresh, ...rest].slice(0, count));
  }

  // Trade the easiest picks for stretch questions until the paper has enough
  // of them — the real one is not ten softballs.
  const stretchShort = MIN_STRETCH - picked.filter((q) => q.stretch).length;
  if (stretchShort > 0) {
    const chosen = new Set(picked.map((q) => q.id));
    // Respect `avoid` here too, or the swap quietly reintroduces a question
    // the week-by-week draw had just taken care to skip.
    const pool = shuffled(
      BANK.filter((q) => q.stretch && !chosen.has(q.id)),
      next,
    );
    const spares = [...pool.filter((q) => !seen.has(q.id)), ...pool.filter((q) => seen.has(q.id))]
      .slice(0, stretchShort);

    for (const spare of spares) {
      // Swap within the same week so the blueprint still holds.
      const target = picked.findIndex((q) => !q.stretch && weekOf(q) === weekOf(spare));
      if (target >= 0) picked[target] = spare;
    }
  }

  return shuffled(picked, next).slice(0, MOCK_LENGTH);
}

export { WEEK1, WEEK2, WEEK3, WEEK4, WEEK5 };
