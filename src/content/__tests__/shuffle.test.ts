/**
 * The shuffle is load-bearing in a way most presentation code is not: get it
 * wrong and the app tells a student they were wrong when they were right, or
 * marks a mock paper against the wrong option. So the properties it has to
 * hold are asserted directly rather than inferred from the screens using it.
 *
 * The last test is the one that motivated the whole thing — every question in
 * the bank is authored with the answer first, so asked as written the answer
 * is A three hundred and fifty-three times running.
 */

import { describe, expect, it } from 'vitest';

import { BANK } from '../focus/bank';
import { week2 } from '../week2';
import { week3 } from '../week3';
import { week4 } from '../week4';
import { week5 } from '../week5';
import type { Block } from '../types';
import {
  type Choices,
  blockSeed,
  displayIndex,
  drillSeed,
  paperSeed,
  permutation,
  rng,
  seedFrom,
  shuffleChoices,
} from '../shuffle';

/** Every quiz and predict block in the lessons, with where it sits. */
function lessonChoices(): { stepId: string; index: number; block: Block }[] {
  const out: { stepId: string; index: number; block: Block }[] = [];
  for (const week of [week2, week3, week4, week5]) {
    for (const lesson of week.lessons) {
      for (const step of lesson.steps) {
        step.blocks.forEach((block, index) => {
          if (block.t === 'quiz' || block.t === 'predict') out.push({ stepId: step.id, index, block });
        });
      }
    }
  }
  return out;
}

describe('permutation', () => {
  it('is a permutation — every index once, none invented', () => {
    for (let n = 1; n <= 6; n++) {
      for (let seed = 0; seed < 40; seed++) {
        const order = permutation(n, rng(seed));
        expect(order).toHaveLength(n);
        expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
      }
    }
  });

  it('lands each source index in each position about equally often', () => {
    const n = 4;
    const runs = 12000;
    const counts = Array.from({ length: n }, () => Array(n).fill(0));
    for (let seed = 0; seed < runs; seed++) {
      permutation(n, rng(seed)).forEach((from, at) => counts[from][at]++);
    }
    const expected = runs / n;
    for (const row of counts) {
      for (const c of row) expect(Math.abs(c - expected) / expected).toBeLessThan(0.1);
    }
  });
});

describe('seedFrom', () => {
  it('separates the parts, so two questions cannot collide by concatenation', () => {
    expect(seedFrom('ab', 'c')).not.toBe(seedFrom('a', 'bc'));
    expect(seedFrom('q1', 3)).not.toBe(seedFrom('q1', 4));
    expect(seedFrom('q1', 3)).toBe(seedFrom('q1', 3));
  });

  it('gives each surface its own stream for the same question', () => {
    expect(drillSeed('w1-q1', 5)).not.toBe(paperSeed('w1-q1', 5));
    expect(paperSeed('w1-q1', 5)).not.toBe(blockSeed('w1-q1', 5));
  });
});

describe('shuffleChoices', () => {
  const q = {
    options: ['right', 'wrong one', 'wrong two', 'wrong three'],
    answer: 0,
    why: ['', 'because one', 'because two', 'because three'],
    keep: 'untouched',
  };

  it('keeps the answer, its feedback and the options in step', () => {
    for (let seed = 0; seed < 200; seed++) {
      const view = shuffleChoices(q, seed);
      expect(view.options[view.answer]).toBe(q.options[q.answer]);
      view.options.forEach((opt, i) => {
        expect(view.why![i]).toBe(q.why[q.options.indexOf(opt)]);
      });
    }
  });

  it('maps every shown option back to the one it was written as', () => {
    const view = shuffleChoices(q, 7);
    view.options.forEach((opt, i) => {
      expect(q.options[view.order[i]]).toBe(opt);
      expect(displayIndex(view.order, view.order[i])).toBe(i);
    });
  });

  it('leaves everything that is not index-aligned alone', () => {
    expect(shuffleChoices(q, 3).keep).toBe('untouched');
    const noFeedback: Choices = { options: ['a', 'b'], answer: 1 };
    expect(shuffleChoices(noFeedback, 3).why).toBeUndefined();
  });

  it('is the same order for the same seed and a different one for the next', () => {
    expect(shuffleChoices(q, 42).options).toEqual(shuffleChoices(q, 42).options);
    // Not a guarantee for any single pair, but across a hundred seeds a stuck
    // shuffle would show up immediately.
    const orders = new Set(
      Array.from({ length: 100 }, (_, s) => shuffleChoices(q, s).order.join('')),
    );
    expect(orders.size).toBeGreaterThan(12);
  });
});

describe('the answer is no longer always A', () => {
  /** How often the answer lands in each position, as a share of the whole. */
  function spread(answers: number[], width: number): number[] {
    const counts = Array(width).fill(0);
    for (const a of answers) counts[a]++;
    return counts.map((c) => c / answers.length);
  }

  it('is exactly what the bank does when asked as written', () => {
    expect(BANK.every((q) => q.answer === 0)).toBe(true);
  });

  /** The first question with the usual four options. */
  function four() {
    return BANK.find((q) => q.options.length === 4)!;
  }

  it('spreads a mock paper question across positions as the paper changes', () => {
    const q = four();
    const seen = new Set(
      Array.from({ length: 20 }, (_, i) => shuffleChoices(q, paperSeed(q.id, i + 1)).answer),
    );
    expect(seen.size).toBeGreaterThan(1);
  });

  it('spreads the whole bank roughly evenly in any one sitting', () => {
    // Four options for all but the handful written as true/false.
    const four = BANK.filter((q) => q.options.length === 4);
    expect(four.length).toBeGreaterThan(300);

    for (const salt of [1, 2, 3]) {
      const answers = four.map((q) => shuffleChoices(q, drillSeed(q.id, salt)).answer);
      for (const share of spread(answers, 4)) {
        expect(share).toBeGreaterThan(0.18);
        expect(share).toBeLessThan(0.32);
      }
    }
  });

  it('reshuffles a drill question between one sitting and the next', () => {
    const q = four();
    const seen = new Set(
      Array.from({ length: 20 }, (_, i) => shuffleChoices(q, drillSeed(q.id, 1000 + i)).answer),
    );
    // Four positions, twenty sittings: anything less than all four would mean
    // the salt is not reaching the shuffle.
    expect(seen.size).toBe(4);
  });

  it('spreads the lesson quiz and predict blocks too, and does it stably', () => {
    const blocks = lessonChoices();
    expect(blocks.length).toBeGreaterThan(100);

    const answers = blocks.map(({ stepId, index, block }) => {
      const choices = block as Extract<Block, { options: string[]; answer: number }>;
      const view = shuffleChoices(choices, blockSeed(stepId, index));
      expect(view.options[view.answer]).toBe(choices.options[choices.answer]);
      // Two options through to five; scale to a common footing so one spread
      // covers the lot.
      return view.answer / (choices.options.length - 1);
    });

    // Authored, more than four in five sit at 0. Shuffled, no third of the
    // range should hold much more than its share.
    const low = answers.filter((a) => a < 1 / 3).length / answers.length;
    expect(low).toBeLessThan(0.5);

    // And a second pass gives the same answer, because a saved choice depends
    // on it: the order is fixed to the block, not to the visit.
    const again = blocks.map(({ stepId, index, block }) =>
      shuffleChoices(block as Extract<Block, { options: string[]; answer: number }>, blockSeed(stepId, index)),
    );
    again.forEach((view, i) => {
      const choices = blocks[i].block as Extract<Block, { options: string[]; answer: number }>;
      expect(view.answer / (choices.options.length - 1)).toBe(answers[i]);
    });
  });
});
