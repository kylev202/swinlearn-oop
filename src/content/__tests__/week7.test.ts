/**
 * Content validation for Week 7.
 *
 * Same contract as week2-6: every exercise gets a reference solution that must
 * pass its own checks, a near-miss must fail, and every predict block's claimed
 * behaviour is executed against the real interpreter.
 *
 * Week 7 is the first week with **no lab**, because `OOP Lab7.pdf` is a
 * byte-identical copy of `OOP Lab6.pdf`. The structure test below asserts that
 * absence deliberately rather than leaving it to be noticed as a gap — if a
 * real Week 7 task sheet ever appears, that assertion is the thing that should
 * fail and send someone back to this file.
 *
 * Three of the predict blocks here exist only because the interpreter learned
 * to reject duplicate method signatures while this week was written. If that
 * check regresses, `w7-contract-names` and `w7-contract-return` both start
 * claiming an error that no longer happens, and these tests catch it.
 */

import { describe, expect, it } from 'vitest';
import { week7, week7Interview } from '../week7';
import { runChecks } from '@/engine/checks';
import { runProgram } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { scrambleOf } from '@/tools/parsons';
import { personalize, resolveTokens } from '../personalize';
import type { Block, Exercise, Step } from '../types';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };
const TOKENS = resolveTokens(PROFILE);

function allSteps(): Step[] {
  return week7.lessons.flatMap((l) => l.steps);
}

function stepById(id: string): Step {
  const s = allSteps().find((x) => x.id === id);
  if (!s) throw new Error(`No step '${id}'`);
  return s;
}

function check(stepId: string, solution: string) {
  const step = stepById(stepId);
  const ex = step.exercise as Exercise;
  expect(ex, `step ${stepId} has no exercise`).toBeDefined();
  return runChecks(
    ex.tests.map((t) => JSON.parse(personalize(JSON.stringify(t), TOKENS))),
    {
      source: personalize(solution, TOKENS),
      harness: ex.harness ? personalize(ex.harness, TOKENS) : undefined,
      stdin: ex.stdin,
      student: PROFILE,
    },
  );
}

function expectPass(stepId: string, solution: string) {
  const r = check(stepId, solution);
  const failed = r.results.filter((x) => !x.passed);
  expect(
    failed.map((f) => `${f.label}: ${f.detail ?? ''}`).join('\n') || (r.error?.message ?? ''),
    `reference solution for ${stepId} should pass`,
  ).toBe('');
  expect(r.allPassed).toBe(true);
}

function expectFail(stepId: string, solution: string) {
  const r = check(stepId, solution);
  expect(r.allPassed, `this solution should NOT pass ${stepId}`).toBe(false);
}

// ---------------------------------------------------------------- solutions

const GREETER = `public class Greeter
{
    public void Greet(string name, string greeting)
    {
        Console.WriteLine(greeting + ", " + name + "!");
    }

    public void Greet(string name)
    {
        Greet(name, "Hello");
    }
}`;

const COUNTER_FIXED = `public class Counter
{
    private int _count;

    public void Bump(int _count)
    {
        this._count = this._count + _count;
    }

    public int Count
    {
        get { return _count; }
    }
}`;

const PLAYER_CTOR_FIXED = `public class Player
{
    private Inventory _inventory;

    public Player(string name)
    {
        Console.WriteLine(name + " enters the cave");
        _inventory = new Inventory();
    }

    public void Pickup(Item itm)
    {
        _inventory.Put(itm);
    }

    public int Carrying
    {
        get { return _inventory.Count; }
    }
}`;

const MUSIC_PLAYERS = `public interface IMusicPlayer
{
    void Play();
}

public class CdPlayer : IMusicPlayer
{
    public void Play() { Console.WriteLine("spinning the disc"); }
}

public class PhonePlayer : IMusicPlayer
{
    public void Play() { Console.WriteLine("streaming from the phone"); }
}`;

const INVENTORY_FETCH = `public class Inventory
{
    private List<Item> _items = new List<Item>();

    public void Put(Item itm)
    {
        _items.Add(itm);
    }

    public bool HasItem(string id)
    {
        foreach (Item i in _items)
        {
            if (i.AreYou(id)) { return true; }
        }
        return false;
    }

    public Item Fetch(string id)
    {
        foreach (Item i in _items)
        {
            if (i.AreYou(id)) { return i; }
        }
        return null;
    }

    public int Count
    {
        get { return _items.Count; }
    }
}`;

// ---------------------------------------------------------------- structure

describe('Week 7 structure', () => {
  it('every lesson has steps and every exercise has checks and hints', () => {
    for (const lesson of week7.lessons) {
      expect(lesson.steps.length, `${lesson.id} has no steps`).toBeGreaterThan(0);
      for (const step of lesson.steps) {
        expect(step.blocks.length + (step.exercise ? 1 : 0)).toBeGreaterThan(0);
        if (step.exercise) {
          expect(step.exercise.tests.length, `${step.id} has no checks`).toBeGreaterThan(0);
          expect(step.exercise.hints.length, `${step.id} has no hints`).toBeGreaterThanOrEqual(2);
          expect(step.exercise.prompt.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it('step ids are unique across the week', () => {
    const ids = allSteps().map((s) => s.id);
    expect(new Set(ids).size, 'duplicate step id').toBe(ids.length);
  });

  it('editable regions point at real lines in the seed', () => {
    for (const step of allSteps()) {
      const ex = step.exercise;
      if (!ex?.editable) continue;
      const lines = ex.seed.split('\n').length;
      expect(ex.editable.from, `${step.id} editable.from`).toBeGreaterThanOrEqual(1);
      expect(
        ex.editable.to,
        `${step.id} editable.to out of range (seed has ${lines} lines)`,
      ).toBeLessThanOrEqual(lines);
      expect(ex.editable.from).toBeLessThanOrEqual(ex.editable.to);
    }
  });

  it('quiz answers are in range and explained', () => {
    for (const step of allSteps()) {
      for (const b of step.blocks) {
        if (b.t !== 'quiz') continue;
        expect(b.answer).toBeGreaterThanOrEqual(0);
        expect(b.answer).toBeLessThan(b.options.length);
        expect(b.explain.length).toBeGreaterThan(20);
      }
    }
  });

  it('the week is wired up with the metadata the home card needs', () => {
    expect(week7.number).toBe(7);
    expect(week7.outcomes.length).toBeGreaterThanOrEqual(4);
    expect(week7.sources.length).toBeGreaterThanOrEqual(2);
    expect(week7.lessons.some((l) => l.kind === 'quiz')).toBe(true);
    expect(week7.lessons.some((l) => l.kind === 'interview')).toBe(true);
  });

  /*
   * Deliberate, not an oversight. `OOP Lab7.pdf` is md5-identical to
   * `OOP Lab6.pdf` — the Week 6 Drawing Program sheet — so the unit has no
   * Week 7 task of its own, and the Week 7 lab session is the verification
   * interview for Task 8.1/8.2, which live in week8.ts.
   */
  it('has no lab lesson, and says so where a student will read it', () => {
    expect(week7.lessons.some((l) => l.kind === 'lab')).toBe(false);
    const prose = allSteps()
      .flatMap((s) => s.blocks)
      .map((b) => ('md' in b ? b.md : ''))
      .join('\n');
    expect(prose).toContain('no lab sheet');
  });

  it('interview questions point at steps that exist', () => {
    const ids = new Set(allSteps().map((s) => s.id));
    expect(week7Interview.length).toBeGreaterThanOrEqual(4);
    for (const q of week7Interview) {
      expect(q.lookingFor.length, q.id).toBeGreaterThanOrEqual(3);
      if (q.aboutStep) expect(ids.has(q.aboutStep), `${q.id} -> ${q.aboutStep}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------- exercises

describe('Week 7 exercises are solvable', () => {
  it('two Greet overloads, the short one delegating', () => {
    expectPass('w7-contract-valid', GREETER);
  });

  it('rejects a short overload that rebuilds the sentence itself', () => {
    expectFail(
      'w7-contract-valid',
      GREETER.replace('Greet(name, "Hello");', 'Console.WriteLine("Hello, " + name + "!");'),
    );
  });

  it('rejects a Greeter with only the two-parameter form', () => {
    expectFail(
      'w7-contract-valid',
      `public class Greeter
{
    public void Greet(string name, string greeting)
    {
        Console.WriteLine(greeting + ", " + name + "!");
    }
}`,
    );
  });

  it('this._count reaches past the shadowing parameter', () => {
    expectPass('w7-scope-param-shadow', COUNTER_FIXED);
  });

  it('rejects the original, which updates only the parameter', () => {
    expectFail(
      'w7-scope-param-shadow',
      COUNTER_FIXED.replace('this._count = this._count + _count;', '_count = _count + 1;'),
    );
  });

  it('rejects a fix that assigns rather than accumulates', () => {
    expectFail(
      'w7-scope-param-shadow',
      COUNTER_FIXED.replace('this._count = this._count + _count;', 'this._count = _count;'),
    );
  });

  it('allocating the inventory in the constructor', () => {
    expectPass('w7-err-wrongline', PLAYER_CTOR_FIXED);
  });

  it('rejects a null guard in Pickup instead of a fix in the constructor', () => {
    expectFail(
      'w7-err-wrongline',
      `public class Player
{
    private Inventory _inventory;

    public Player(string name)
    {
        Console.WriteLine(name + " enters the cave");
    }

    public void Pickup(Item itm)
    {
        if (_inventory == null) { return; }
        _inventory.Put(itm);
    }

    public int Carrying
    {
        get { return 0; }
    }
}`,
    );
  });

  it('an interface and two implementers driven by one polymorphic loop', () => {
    expectPass('w7-rdd-coupling', MUSIC_PLAYERS);
  });

  it('rejects a class that declares Play without implementing the interface', () => {
    expectFail(
      'w7-rdd-coupling',
      MUSIC_PLAYERS.replace('public class CdPlayer : IMusicPlayer', 'public class CdPlayer'),
    );
  });

  it('Fetch returns the item and leaves it in the inventory', () => {
    expectPass('w7-pd-fetch', INVENTORY_FETCH);
  });

  it('rejects a Fetch that removes the item, which is what Take is for', () => {
    expectFail(
      'w7-pd-fetch',
      INVENTORY_FETCH.replace(
        'if (i.AreYou(id)) { return i; }',
        'if (i.AreYou(id)) { _items.Remove(i); return i; }',
      ),
    );
  });

  it('rejects a Fetch that returns a bool instead of the item', () => {
    expectFail(
      'w7-pd-fetch',
      INVENTORY_FETCH.replace(
        `    public Item Fetch(string id)
    {
        foreach (Item i in _items)
        {
            if (i.AreYou(id)) { return i; }
        }
        return null;
    }`,
        `    public bool Fetch(string id)
    {
        return HasItem(id);
    }`,
      ),
    );
  });
});

// ------------------------------------------------------- concept material

function conceptBlocks<T extends Block['t']>(t: T): Extract<Block, { t: T }>[] {
  return allSteps().flatMap((s) => s.blocks.filter((b): b is Extract<Block, { t: T }> => b.t === t));
}

describe('predict blocks agree with the interpreter', () => {
  const predicts = conceptBlocks('predict');

  it('there are some', () => {
    expect(predicts.length).toBeGreaterThan(4);
  });

  for (const block of predicts) {
    it(`"${block.question.slice(0, 62)}"`, () => {
      const r = runProgram(personalize(block.code, TOKENS), { student: PROFILE });

      expect(
        block.expect.output !== undefined || block.expect.errorContains !== undefined,
        'a predict block must declare what really happens',
      ).toBe(true);

      if (block.expect.errorContains !== undefined) {
        expect(r.error, 'this block claims the program is rejected').toBeTruthy();
        expect(`${r.error?.message} ${r.error?.hint ?? ''}`).toContain(block.expect.errorContains);
      }

      if (block.expect.output !== undefined) {
        expect(r.error?.message ?? '', 'this block claims the program runs').toBe('');
        expect(r.output).toBe(block.expect.output);
      }

      expect(block.answer).toBeGreaterThanOrEqual(0);
      expect(block.answer).toBeLessThan(block.options.length);
      expect(new Set(block.options).size).toBe(block.options.length);

      block.options.forEach((opt, i) => {
        if (i === block.answer && opt.includes('\n')) {
          expect(opt, 'the correct option should be exactly what the program prints').toBe(
            block.expect.output,
          );
        }
        if (i !== block.answer && block.expect.output !== undefined) {
          expect(opt, 'a wrong option must not be the real output').not.toBe(block.expect.output);
        }
      });

      if (block.why) {
        expect(block.why.length).toBe(block.options.length);
        expect(block.why[block.answer]).toBe('');
        block.why.forEach((w, i) => {
          if (i !== block.answer) expect(w.length, `why[${i}] is empty`).toBeGreaterThan(20);
        });
      }

      expect(block.explain.length).toBeGreaterThan(40);
    });
  }
});

describe('parsons problems', () => {
  const puzzles = conceptBlocks('parsons');

  it('there are some', () => {
    expect(puzzles.length).toBeGreaterThan(0);
  });

  for (const block of puzzles) {
    it(`"${block.prompt.slice(0, 56)}"`, () => {
      expect(() => parse(block.lines.join('\n'))).not.toThrow();
      expect(new Set(block.lines).size, 'duplicate lines').toBe(block.lines.length);
      expect(block.lines.length).toBeGreaterThanOrEqual(4);
      expect(block.lines.join('\n')).not.toContain('{{');

      const start = scrambleOf(block.lines);
      expect(start.length).toBe(block.lines.length);
      expect(new Set(start).size).toBe(block.lines.length);
      expect(start.every((v, i) => v === i), 'starts already solved').toBe(false);
    });
  }
});

describe('recall prompts', () => {
  it("every concept lesson ends by asking for an explanation in the student's own words", () => {
    for (const lesson of week7.lessons) {
      if (lesson.kind !== 'concept') continue;
      const recalls = lesson.steps.flatMap((s) => s.blocks.filter((b) => b.t === 'recall'));
      expect(recalls.length, `${lesson.id} has no recall block`).toBeGreaterThan(0);
    }
  });

  it('each one has a checklist worth marking against', () => {
    for (const block of conceptBlocks('recall')) {
      expect(block.points.length).toBeGreaterThanOrEqual(3);
      for (const p of block.points) expect(p.length).toBeGreaterThan(15);
      expect(block.prompt.length).toBeGreaterThan(40);
      expect(block.points.join('\n') + block.prompt).not.toContain('{{');
    }
  });
});

describe('quiz feedback', () => {
  it('per-option feedback is aligned, and blank for the right answer', () => {
    for (const block of conceptBlocks('quiz')) {
      if (!block.why) continue;
      expect(block.why.length, block.question).toBe(block.options.length);
      expect(block.why[block.answer], block.question).toBe('');
      block.why.forEach((w, i) => {
        if (i !== block.answer) expect(w.length, `${block.question} why[${i}]`).toBeGreaterThan(20);
      });
    }
  });

  it('no two options on a question are the same', () => {
    for (const block of conceptBlocks('quiz')) {
      expect(new Set(block.options).size, block.question).toBe(block.options.length);
    }
  });
});

describe('umlSpec and runnable blocks are self-consistent', () => {
  it('umlSpec sources parse', () => {
    for (const block of conceptBlocks('umlSpec')) {
      expect(() => parse(block.source)).not.toThrow();
    }
  });

  it('runnable code runs clean', () => {
    const runnables = conceptBlocks('runnable');
    expect(runnables.length).toBeGreaterThan(0);
    for (const block of runnables) {
      const r = runProgram(personalize(block.code, TOKENS), { student: PROFILE });
      expect(r.error?.message ?? '', `${block.caption ?? 'runnable'} should run without error`).toBe(
        '',
      );
    }
  });

  it('the Locate demo really does find three different things', () => {
    const demo = conceptBlocks('runnable').find((b) => b.code.includes('Locate'));
    expect(demo, 'the Player design lesson should end with a runnable Locate').toBeDefined();
    const r = runProgram(personalize(demo!.code, TOKENS), { student: PROFILE });
    expect(r.output).toBe(
      [
        'locate me     -> Robin',
        'locate torch  -> a brass torch',
        'locate club   -> True',
        'still holding -> 1',
      ].join('\n'),
    );
  });

  /*
   * Teaching code a student only reads still has to be real C#. The one
   * deliberate exception is the `Ring(true)` example, which is a *comment*
   * about a call the real compiler rejects rather than a class declaration,
   * so it is skipped by the "whole programs" filter below.
   */
  it('read-only code blocks that are whole programs still parse', () => {
    for (const block of conceptBlocks('code')) {
      if (block.lang && block.lang !== 'csharp') continue;
      if (!/^\s*public\s+(abstract\s+)?class\s/.test(block.code)) continue;
      expect(() => parse(personalize(block.code, TOKENS)), block.caption ?? 'code block').not.toThrow();
    }
  });

  it('warns that the playground does not type-check arguments, where it shows one', () => {
    const warned = allSteps().some((step) => {
      const shows = step.blocks.some((b) => b.t === 'code' && b.code.includes('Ring(true)'));
      const explains = step.blocks.some(
        (b) => b.t === 'callout' && `${b.title ?? ''} ${b.md}`.includes('will not compile in Visual Studio'),
      );
      return shows && explains;
    });
    expect(warned, 'the lenient-argument example needs a callout saying so').toBe(true);
  });
});

// -------------------------------------------------------------- provenance

describe('sourcing', () => {
  it('cites Quiz 7 question by question, the way earlier weeks do', () => {
    const explains = [
      ...conceptBlocks('quiz').map((b) => b.explain),
      ...conceptBlocks('predict').map((b) => b.explain),
    ].join('\n');
    const cited = new Set(Array.from(explains.matchAll(/Quiz 7 Q(\d+)/g)).map((m) => Number(m[1])));
    for (let q = 1; q <= 8; q++) {
      expect(cited.has(q), `Quiz 7 Q${q} is not used anywhere in Week 7`).toBe(true);
    }
  });

  it('reopens the RDD material Week 6 told students to skip', () => {
    const prose = allSteps()
      .flatMap((s) => s.blocks)
      .map((b) => ('md' in b ? b.md : ''))
      .join('\n')
      .toLowerCase();
    expect(prose).toContain('midterm');
    expect(prose).toContain('custom program');
  });
});
