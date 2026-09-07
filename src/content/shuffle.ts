/**
 * Option shuffling — the layer between how a question is *written* and how it
 * is *asked*.
 *
 * Every multiple-choice question in this repo is authored with the correct
 * option first, and that is a good convention: the answer reads at the top of
 * the array, `why[0]` is the empty string by rule, and a reviewer checking a
 * question never has to count down a list. Three hundred and fifty-three of
 * the bank's questions are written that way, which is exactly the problem —
 * asked in that order, the answer is always A, and a student stops reading the
 * options and starts reading the layout.
 *
 * So the source order stays canonical and the *presentation* is permuted. That
 * split is what makes the rest of the system safe: everything persisted — a
 * recorded attempt, a mock paper's answer sheet, a saved lesson quiz — stores
 * the canonical index, so a permutation can change tomorrow without turning
 * yesterday's saved answers into nonsense.
 *
 * The permutation is uniform rather than a derangement. Forcing the answer off
 * A would only replace one tell with a better one: "never the first" is far
 * easier to exploit than "usually the first".
 */

/** A thing with options and one right one — a bank question or a lesson block. */
export interface Choices {
  options: string[];
  /** Index into `options`. */
  answer: number;
  /** Index-aligned with `options`. */
  why?: string[];
}

/** What a shuffle adds: display index → the index it had in the source. */
export interface Ordered {
  order: number[];
}

// ------------------------------------------------------------------ seeding

/**
 * Mulberry32 — a tiny seeded PRNG.
 *
 * Seeded rather than random everywhere it is used, because every draw in this
 * app has to be reproducible by something: a mock paper is the same paper when
 * reopened, and a submitted answer sheet has to be readable back in the same
 * option order it was filled in.
 */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a over the parts, joined by a separator so that ('ab', 'c') and
 * ('a', 'bc') are different seeds — question ids and step ids sit next to
 * numbers here, and two questions must never share a permutation by accident.
 */
export function seedFrom(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    }
    h = Math.imul(h ^ 0x1f, 0x01000193);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------- permuting

/** A uniformly random permutation of `[0, n)`. */
export function permutation(n: number, next: () => number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** The same permutation applied to a list of things. */
export function shuffled<T>(items: readonly T[], next: () => number): T[] {
  return permutation(items.length, next).map((from) => items[from]);
}

/**
 * A question or block as it should be shown, for one particular seed.
 *
 * Everything index-aligned moves together — the options, the per-option
 * feedback, and the answer — so the result is an ordinary `Choices` that every
 * existing renderer already knows how to draw. What is added is `order`, which
 * maps back: `order[displayIndex]` is the index that option was written at,
 * and is what gets recorded when a student picks it.
 */
export function shuffleChoices<T extends Choices>(item: T, seed: number): T & Ordered {
  const order = permutation(item.options.length, rng(seed));
  const view = {
    ...item,
    options: order.map((from) => item.options[from]),
    answer: order.indexOf(item.answer),
    order,
    // The cast is the one place the index bookkeeping is not provable to the
    // compiler: `T` may narrow `options` or `answer` beyond what we can
    // reconstruct from a spread.
  } as T & Ordered;
  if (item.why) view.why = order.map((from) => item.why![from]);
  return view;
}

/** Where a source index ended up on screen — the inverse of `order`. */
export function displayIndex(order: readonly number[], canonical: number): number {
  return order.indexOf(canonical);
}

// ------------------------------------------------------------------- seeds
//
// Each surface needs a different guarantee, and the guarantee is the seed.

/**
 * A question in one sitting of a drill.
 *
 * `salt` is captured when the drill opens and thrown away when it closes, so
 * re-sitting a week's quiz genuinely reshuffles: a student who has met a
 * question before has to read it again rather than remember that it was C.
 */
export function drillSeed(questionId: string, salt: number): number {
  return seedFrom('drill', questionId, salt);
}

/**
 * A question on a mock paper.
 *
 * Fixed to the paper number, because the answer sheet is stored by index and
 * then re-rendered in the review: if the review shuffled differently, "you
 * picked B" would point at an option the student never saw. Different papers
 * still get different orders, which is what matters for a repeat sitting.
 */
export function paperSeed(questionId: string, paper: number): number {
  return seedFrom('paper', paper, questionId);
}

/**
 * A quiz or predict block inside a lesson step.
 *
 * Fixed to where the block lives, for the same reason as a mock paper: the
 * choice is saved against the step and shown back as "you said C" on every
 * later visit. A lesson block is answered once, so a stable order costs
 * nothing — spreading the answers across positions is the whole win here.
 */
export function blockSeed(stepId: string, index: number): number {
  return seedFrom('block', stepId, index);
}
