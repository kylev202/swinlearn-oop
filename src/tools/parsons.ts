/**
 * The starting order for a Parsons problem.
 *
 * Derived from the lines themselves rather than randomised, for three reasons:
 * the author does not have to hand-write a permutation, two students looking
 * at one screen see the same puzzle, and a test can assert that the scramble
 * is never accidentally already solved.
 *
 * The shuffle is a Fisher-Yates driven by a small xorshift seeded from a hash
 * of the content — the point is determinism, not cryptography.
 */

function hash(lines: string[]): number {
  let h = 0x811c9dc5;
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      h ^= line.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= 0x0a;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Indices into `lines`, in the order the student first sees them. */
export function scrambleOf(lines: string[]): number[] {
  const order = lines.map((_, i) => i);
  if (order.length < 2) return order;

  let seed = hash(lines) || 1;
  const next = () => {
    // xorshift32
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 0x100000000;
  };

  for (let round = 0; round < 8; round++) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    // A scramble that is already the answer is not a puzzle. Reshuffling with
    // the same stream stays deterministic, so this still terminates the same
    // way every time.
    if (order.some((v, i) => v !== i)) return order;
  }

  // Unreachable for any real input, but never hand back the solved order.
  return order.slice().reverse();
}

/** How many leading spaces a line carries, for the indent guide. */
export function indentOf(line: string): number {
  return /^ */.exec(line)![0].length;
}
