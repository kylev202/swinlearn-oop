/**
 * Content validation for Week 2.
 *
 * Every exercise gets a reference solution here and must pass its own checks.
 * These solutions live in the test file only — they are never imported by the
 * app, so nothing ships a "show me the answer" button for an assessed task.
 *
 * This suite also guards the opposite direction: a near-miss solution (the
 * mistake the step is actually about) must FAIL, otherwise the check is
 * decorative.
 */

import { describe, expect, it } from 'vitest';
import { week2 } from '../week2';
import { runChecks } from '@/engine/checks';
import { runProgram } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { scrambleOf } from '@/tools/parsons';
import { personalize, resolveTokens } from '../personalize';
import type { Block, Exercise, Step } from '../types';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };
const TOKENS = resolveTokens(PROFILE);

function allSteps(): Step[] {
  return week2.lessons.flatMap((l) => l.steps);
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

const COUNTER_FULL = `public class Counter
{
    private int _count;
    private string _name;

    public Counter(string name)
    {
        _name = name;
        _count = 0;
    }

    public void Increment() { _count = _count + 1; }
    public void Reset() { _count = 0; }

    public string Name
    {
        get { return _name; }
        set { _name = value; }
    }

    public int Ticks
    {
        get { return _count; }
    }
}`;

describe('Week 2 structure', () => {
  it('every lesson has steps and every exercise has checks and hints', () => {
    for (const lesson of week2.lessons) {
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

  it('no hint gives away a complete solution line', () => {
    // Hints may describe shape, never paste the answer.
    for (const step of allSteps()) {
      for (const hint of step.exercise?.hints ?? []) {
        expect(hint, `${step.id} hint looks like an answer`).not.toMatch(/_count\s*=\s*_count\s*\+\s*1;/);
        expect(hint).not.toMatch(/return\s+_count\s*;/);
      }
    }
  });

  it('editable regions point at real lines in the seed', () => {
    for (const step of allSteps()) {
      const ex = step.exercise;
      if (!ex?.editable) continue;
      const lines = ex.seed.split('\n').length;
      expect(ex.editable.from, `${step.id} editable.from`).toBeGreaterThanOrEqual(1);
      expect(ex.editable.to, `${step.id} editable.to out of range (seed has ${lines} lines)`).toBeLessThanOrEqual(lines);
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
});

describe('Task 2.1 exercises are solvable', () => {
  it('create the class', () => {
    expectPass('w2-21-class', 'public class Counter\n{\n}');
  });

  it('the fields', () => {
    expectPass(
      'w2-21-fields',
      'public class Counter\n{\n    private int _count;\n    private string _name;\n}',
    );
  });

  it('rejects public fields', () => {
    expectFail(
      'w2-21-fields',
      'public class Counter\n{\n    public int _count;\n    public string _name;\n}',
    );
  });

  it('rejects the PDF typo of _name as int', () => {
    expectFail(
      'w2-21-fields',
      'public class Counter\n{\n    private int _count;\n    private int _name;\n}',
    );
  });

  it('the constructor', () => {
    expectPass(
      'w2-21-ctor',
      `public class Counter
{
    private int _count;
    private string _name;

    public Counter(string name)
    {
        _name = name;
        _count = 0;
    }
}`,
    );
  });

  it('Increment and Reset', () => {
    expectPass(
      'w2-21-methods',
      `public class Counter
{
    private int _count;
    private string _name;

    public Counter(string name) { _name = name; _count = 0; }

    public void Increment() { _count = _count + 1; }
    public void Reset() { _count = 0; }
}`,
    );
  });

  it('the Name property', () => {
    expectPass('w2-21-prop-name', COUNTER_FULL);
  });

  it('Ticks is read-only', () => {
    expectPass('w2-21-prop-ticks', COUNTER_FULL);
  });

  it('rejects a Ticks that has a setter', () => {
    expectFail(
      'w2-21-prop-ticks',
      COUNTER_FULL.replace(
        'public int Ticks\n    {\n        get { return _count; }\n    }',
        'public int Ticks\n    {\n        get { return _count; }\n        set { _count = value; }\n    }',
      ),
    );
  });

  it('PrintCounters', () => {
    expectPass(
      'w2-21-print',
      `public class Counter
{
    private int _count;
    private string _name;
    public Counter(string name) { _name = name; _count = 0; }
    public void Increment() { _count = _count + 1; }
    public void Reset() { _count = 0; }
    public string Name { get { return _name; } set { _name = value; } }
    public int Ticks { get { return _count; } }
}

public class Program
{
    private static void PrintCounters(Counter[] counters)
    {
        foreach (Counter c in counters)
        {
            Console.WriteLine("{0} is {1}", c.Name, c.Ticks);
        }
    }

    static void Main()
    {
        Counter[] cs = new Counter[2];
        cs[0] = new Counter("Counter 1");
        cs[1] = new Counter("Counter 2");
        cs[0].Increment();
        cs[0].Increment();
        cs[1].Increment();
        PrintCounters(cs);
    }
}`,
    );
  });

  it('ResetByDefault and the overflow behaviour', () => {
    expectPass(
      'w2-21-overflow',
      `public class Counter
{
    private int _count;
    private string _name;
    public Counter(string name) { _name = name; _count = 0; }
    public void Increment() { _count = _count + 1; }
    public void Reset() { _count = 0; }
    public string Name { get { return _name; } set { _name = value; } }
    public int Ticks { get { return _count; } }

    public void ResetByDefault() { _count = int.MaxValue; }
}`,
    );
  });

  it('the complete Task 2.1', () => {
    expectPass(
      'w2-21-final',
      `${COUNTER_FULL}

public class Program
{
    private static void PrintCounters(Counter[] counters)
    {
        foreach (Counter c in counters)
        {
            Console.WriteLine("{0} is {1}", c.Name, c.Ticks);
        }
    }

    static void Main()
    {
        Counter[] myCounters = new Counter[3];
        myCounters[0] = new Counter("Counter 1");
        myCounters[1] = new Counter("Counter 2");
        myCounters[2] = myCounters[0];

        for (int i = 1; i <= 9; i++)  { myCounters[0].Increment(); }
        for (int i = 1; i <= 14; i++) { myCounters[1].Increment(); }

        PrintCounters(myCounters);
        myCounters[2].Reset();
        PrintCounters(myCounters);
    }
}`,
    );
  });

  it('catches the aliasing mistake — a third new Counter breaks the output', () => {
    expectFail(
      'w2-21-final',
      `${COUNTER_FULL}

public class Program
{
    private static void PrintCounters(Counter[] counters)
    {
        foreach (Counter c in counters)
        {
            Console.WriteLine("{0} is {1}", c.Name, c.Ticks);
        }
    }

    static void Main()
    {
        Counter[] myCounters = new Counter[3];
        myCounters[0] = new Counter("Counter 1");
        myCounters[1] = new Counter("Counter 2");
        myCounters[2] = new Counter("Counter 1");

        for (int i = 1; i <= 9; i++)  { myCounters[0].Increment(); }
        for (int i = 1; i <= 14; i++) { myCounters[1].Increment(); }

        PrintCounters(myCounters);
        myCounters[2].Reset();
        PrintCounters(myCounters);
    }
}`,
    );
  });
});

describe('Task 2.2 exercises are solvable', () => {
  const SHAPE_FIELDS = `public class Shape
{
    private string _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape(int param)
    {
        _color = "Color.{{color2}}";
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }
}`;

  it('fields and constructor', () => {
    expectPass('w2-22-build', SHAPE_FIELDS);
  });

  it('IsAt', () => {
    expectPass(
      'w2-22-isat',
      `public class Shape
{
    private string _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape(int param)
    {
        _color = "Color.{{color2}}";
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }

    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }

    public bool IsAt(int xInput, int yInput)
    {
        return xInput > _x && xInput < _x + _width
            && yInput > _y && yInput < _y + _height;
    }
}`,
    );
  });

  it('catches the documented IsAt bug (using _width as the right edge)', () => {
    expectFail(
      'w2-22-isat',
      `public class Shape
{
    private string _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape(int param)
    {
        _color = "Color.{{color2}}";
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }

    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }

    public bool IsAt(int xInput, int yInput)
    {
        return xInput > _x && xInput < _width
            && yInput > _y && yInput < _height;
    }
}`,
    );
  });

  it('Draw and the finished task', () => {
    expectPass(
      'w2-22-draw',
      `public class Shape
{
    private string _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape(int param)
    {
        _color = "Color.{{color2}}";
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }

    public string Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public int Width { get { return _width; } set { _width = value; } }
    public int Height { get { return _height; } set { _height = value; } }

    public bool IsAt(int xInput, int yInput)
    {
        return xInput > _x && xInput < _x + _width
            && yInput > _y && yInput < _y + _height;
    }

    public void Draw()
    {
        Console.WriteLine("Color is " + _color);
        Console.WriteLine("Position X is " + _x);
        Console.WriteLine("Position Y is " + _y);
        Console.WriteLine("Width is " + _width);
        Console.WriteLine("Height is " + _height);
    }
}

public class Program
{
    static void Main()
    {
        Shape myShape = new Shape({{shapeParam}});
        myShape.Draw();
    }
}`,
    );
  });
});

describe('personalisation', () => {
  it('derives every lab value from name and student ID', () => {
    const t = resolveTokens({ firstName: 'Amy', studentId: '104321987' });
    expect(t.X).toBe('7');
    expect(t.XX).toBe('87');
    expect(t.XXXX).toBe('1987');
    expect(t.shapeParam).toBe('187');
    expect(t.outlineWidth).toBe('12');
    expect(t.color2).toBe('Azure');
    expect(t.color4).toBe('Azure');
  });

  it('applies the A-L versus A-K split correctly', () => {
    // 'L' is inside Lab 2.2's A-L range but outside Lab 4.1's A-K range.
    const lee = resolveTokens({ firstName: 'Lee', studentId: '1234' });
    expect(lee.color2).toBe('Azure');
    expect(lee.color4).toBe('Chocolate');

    const zoe = resolveTokens({ firstName: 'Zoe', studentId: '1234' });
    expect(zoe.color2).toBe('Chocolate');
    expect(zoe.color4).toBe('Chocolate');
  });

  it('flags that the PDF reset literal cannot fit in an int', () => {
    const t = resolveTokens({ firstName: 'Amy', studentId: '104321987' });
    expect(t.resetLiteral).toBe('214748361987');
    expect(t.resetLiteralFitsInt).toBe(false);
  });

  it('substitutes tokens into seeds and checks', () => {
    const t = resolveTokens({ firstName: 'Zoe', studentId: '55' });
    expect(personalize('new Shape({{shapeParam}})', t)).toBe('new Shape(155)');
    expect(personalize('"Color.{{color2}}"', t)).toBe('"Color.Chocolate"');
  });
});

// ------------------------------------------------------- concept material

/**
 * The concept blocks are checked against the interpreter, not against the
 * author's memory.
 *
 * A predict block that claims a program prints one thing while the engine
 * prints another is the worst bug this repo could ship: the student commits to
 * an answer, is told they were wrong, and is taught something false. So every
 * one of them declares what really happens and that claim is executed here.
 */

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
      const code = personalize(block.code, TOKENS);
      const r = runProgram(code, { student: PROFILE });

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

      // The answer is in range, and the options are distinct.
      expect(block.answer).toBeGreaterThanOrEqual(0);
      expect(block.answer).toBeLessThan(block.options.length);
      expect(new Set(block.options).size).toBe(block.options.length);

      // An option written as program output has to BE the program output when
      // it is the right one, and must not be when it is not.
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

      // Per-option feedback is index-aligned, and says nothing about the one
      // that was right — that is what `explain` is for.
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
      // The solved order has to be real, compilable C#, or the puzzle is
      // teaching a shape that does not exist.
      expect(() => parse(block.lines.join('\n'))).not.toThrow();

      // Two identical lines make "this one is in the right slot" ambiguous.
      expect(new Set(block.lines).size, 'duplicate lines').toBe(block.lines.length);
      expect(block.lines.length).toBeGreaterThanOrEqual(4);

      // And the puzzle must not open already solved.
      const start = scrambleOf(block.lines);
      expect(start.length).toBe(block.lines.length);
      expect(new Set(start).size).toBe(block.lines.length);
      expect(start.every((v, i) => v === i), 'starts already solved').toBe(false);
    });
  }
});

describe('recall prompts', () => {
  it('every concept lesson ends up asking for an explanation in the student\'s own words', () => {
    for (const lesson of week2.lessons) {
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
});
