/**
 * Content validation for Week 6.
 *
 * Same contract as week2/3/4/5: every exercise gets a reference solution that
 * must pass its own checks, a near-miss must fail, and every predict block's
 * claimed output is executed against the real interpreter.
 *
 * Week 6 leans on `structure` checks more than earlier weeks do, for a reason
 * worth knowing: this interpreter dispatches to a subclass method even when the
 * student omits `override`, so no output check can prove the keyword is there.
 * The near-miss tests below therefore attack the behaviour the checks *can*
 * see — a circle drawn as a rectangle, an IsAt using `<` where the task sheet
 * says "does not exceed", width left behind on the base class.
 */

import { describe, expect, it } from 'vitest';
import { week6 } from '../week6';
import { runChecks } from '@/engine/checks';
import { runProgram } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { scrambleOf } from '@/tools/parsons';
import { personalize, resolveTokens } from '../personalize';
import type { Block, Exercise, Step } from '../types';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };
const TOKENS = resolveTokens(PROFILE);

function allSteps(): Step[] {
  return week6.lessons.flatMap((l) => l.steps);
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

const MY_RECTANGLE_EMPTY = `public class MyRectangle : Shape
{
}`;

const MY_CIRCLE_DRAW = `public class MyCircle : Shape
{
    private int _radius;

    public MyCircle()
    {
        _radius = 50;
    }

    public int Radius { get { return _radius; } set { _radius = value; } }

    public override void Draw()
    {
        SplashKit.FillCircle(Color, X, Y, _radius);
    }
}`;

const MY_CIRCLE_OUTLINE = `public class MyCircle : Shape
{
    private int _radius;

    public MyCircle()
    {
        _radius = 50;
    }

    public int Radius { get { return _radius; } set { _radius = value; } }

    public override void Draw()
    {
        SplashKit.FillCircle(Color, X, Y, _radius);
    }

    public override void DrawOutline()
    {
        SplashKit.FillCircle(Color.Black, X, Y, _radius + 2);
    }
}`;

const SHAPE_SLIM = `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private bool _selected;

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public bool Selected { get { return _selected; } set { _selected = value; } }

    public Shape(Color color)
    {
        _color = color;
        _x = 0.0f;
        _y = 0.0f;
    }

    public Shape() : this(Color.Yellow) { }

    public virtual void Draw() { }
    public virtual void DrawOutline() { }
    public virtual bool IsAt(Point2D pt) { return false; }
}`;

const MY_RECTANGLE_FULL = `public class MyRectangle : Shape
{
    private int _width;
    private int _height;

    public int Width { get { return _width; } set { _width = value; } }
    public int Height { get { return _height; } set { _height = value; } }

    public MyRectangle(Color color, float x, float y, int width, int height) : base(color)
    {
        X = x;
        Y = y;
        _width = width;
        _height = height;
    }

    public MyRectangle() : this(Color.Green, 0.0f, 0.0f, {{shapeParam}}, {{shapeParam}}) { }

    public override void Draw()
    {
        SplashKit.FillRectangle(Color, X, Y, _width, _height);
    }

    public override void DrawOutline()
    {
        SplashKit.FillRectangle(Color.Black, X - 2, Y - 2, _width + 4, _height + 4);
    }

    public override bool IsAt(Point2D pt)
    {
        return pt.X > X && pt.X < X + _width && pt.Y > Y && pt.Y < Y + _height;
    }
}`;

const MY_CIRCLE_ISAT = `public class MyCircle : Shape
{
    private int _radius;

    public MyCircle(Color color, int radius) : base(color)
    {
        _radius = radius;
    }

    public MyCircle() : this(Color.Blue, {{circleRadius}}) { }

    public int Radius { get { return _radius; } set { _radius = value; } }

    public override void Draw()
    {
        SplashKit.FillCircle(Color, X, Y, _radius);
    }

    public override void DrawOutline()
    {
        SplashKit.FillCircle(Color.Black, X, Y, _radius + 2);
    }

    public override bool IsAt(Point2D pt)
    {
        double dx = pt.X - X;
        double dy = pt.Y - Y;
        return Math.Sqrt(dx * dx + dy * dy) <= _radius;
    }
}`;

const SHAPE_ABSTRACT = `public abstract class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private bool _selected;

    public Shape(Color color)
    {
        _color = color;
        _x = 0.0f;
        _y = 0.0f;
    }

    public Shape() : this(Color.Yellow) { }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public bool Selected { get { return _selected; } set { _selected = value; } }

    public abstract void Draw();
    public abstract void DrawOutline();
    public abstract bool IsAt(Point2D pt);
}`;

const MY_LINE_FULL = `public class MyLine : Shape
{
    private float _endX;
    private float _endY;

    public MyLine(Color color, float startX, float startY, float endX, float endY) : base(color)
    {
        X = startX;
        Y = startY;
        _endX = endX;
        _endY = endY;
    }

    public MyLine() : this(Color.Red, 0.0f, 0.0f, 100.0f, 50.0f) { }

    public float EndX { get { return _endX; } set { _endX = value; } }
    public float EndY { get { return _endY; } set { _endY = value; } }

    public override void Draw()
    {
        SplashKit.DrawLine(Color, X, Y, _endX, _endY);
    }

    public override void DrawOutline()
    {
        SplashKit.DrawCircle(Color.Black, X, Y, 4);
        SplashKit.DrawCircle(Color.Black, _endX, _endY, 4);
    }

    public override bool IsAt(Point2D pt)
    {
        return SplashKit.PointOnLine(pt, SplashKit.LineFrom(X, Y, _endX, _endY));
    }
}`;

// ---------------------------------------------------------------- structure

describe('Week 6 structure', () => {
  it('every lesson has steps and every exercise has checks and hints', () => {
    for (const lesson of week6.lessons) {
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
    expect(week6.number).toBe(6);
    expect(week6.outcomes.length).toBeGreaterThanOrEqual(4);
    expect(week6.sources.length).toBeGreaterThanOrEqual(2);
    expect(week6.lessons.some((l) => l.kind === 'lab')).toBe(true);
    expect(week6.lessons.some((l) => l.kind === 'quiz')).toBe(true);
    expect(week6.lessons.some((l) => l.kind === 'interview')).toBe(true);
  });
});

// ------------------------------------------------------------------ task 6.1

describe('Task 6.1 exercises are solvable', () => {
  it('a subclass that adds nothing', () => {
    expectPass('w6-61-subclass', MY_RECTANGLE_EMPTY);
  });

  it('rejects a MyRectangle that does not inherit from Shape', () => {
    expectFail('w6-61-subclass', 'public class MyRectangle\n{\n}');
  });

  it('MyCircle with a radius and an overridden Draw', () => {
    expectPass('w6-61-virtual-override', MY_CIRCLE_DRAW);
  });

  it('rejects a MyCircle whose Draw still fills a rectangle', () => {
    expectFail(
      'w6-61-virtual-override',
      MY_CIRCLE_DRAW.replace(
        'SplashKit.FillCircle(Color, X, Y, _radius);',
        'SplashKit.FillRectangle(Color, X, Y, _radius, _radius);',
      ),
    );
  });

  it('rejects a MyCircle whose constructor forgets the radius', () => {
    expectFail('w6-61-virtual-override', MY_CIRCLE_DRAW.replace('_radius = 50;', ''));
  });

  it('DrawOutline drawn as a circle', () => {
    expectPass('w6-61-drawoutline', MY_CIRCLE_OUTLINE);
  });

  it('rejects an outline drawn as a rectangle', () => {
    expectFail(
      'w6-61-drawoutline',
      MY_CIRCLE_OUTLINE.replace(
        'SplashKit.FillCircle(Color.Black, X, Y, _radius + 2);',
        'SplashKit.FillRectangle(Color.Black, X, Y, _radius, _radius);',
      ),
    );
  });

  it('Shape slimmed down to two constructors and three virtual methods', () => {
    expectPass('w6-61-shape-slim', SHAPE_SLIM);
  });

  it('rejects a Shape that keeps width and height', () => {
    expectFail(
      'w6-61-shape-slim',
      SHAPE_SLIM.replace(
        '    private bool _selected;',
        '    private bool _selected;\n    private int _width;',
      ),
    );
  });

  it('rejects a Shape whose IsAt is not virtual', () => {
    expectFail(
      'w6-61-shape-slim',
      SHAPE_SLIM.replace('public virtual bool IsAt', 'public bool IsAt'),
    );
  });

  it('rejects a default constructor that does not chain to Color.Yellow', () => {
    expectFail(
      'w6-61-shape-slim',
      SHAPE_SLIM.replace('public Shape() : this(Color.Yellow) { }', 'public Shape() : this(Color.Red) { }'),
    );
  });

  it('MyRectangle with both constructors and all three overrides', () => {
    expectPass('w6-61-rect-ctors', MY_RECTANGLE_FULL);
  });

  it('rejects a default MyRectangle sized without the personalised value', () => {
    expectFail(
      'w6-61-rect-ctors',
      MY_RECTANGLE_FULL.replace(
        'this(Color.Green, 0.0f, 0.0f, {{shapeParam}}, {{shapeParam}})',
        'this(Color.Green, 0.0f, 0.0f, 100, 100)',
      ),
    );
  });

  it('rejects a five-argument constructor that drops the colour instead of passing it up', () => {
    expectFail(
      'w6-61-rect-ctors',
      MY_RECTANGLE_FULL.replace(
        'public MyRectangle(Color color, float x, float y, int width, int height) : base(color)',
        'public MyRectangle(Color color, float x, float y, int width, int height)',
      ),
    );
  });

  it('MyCircle.IsAt by distance from the centre', () => {
    expectPass('w6-61-isat-circle', MY_CIRCLE_ISAT);
  });

  it('accepts the SplashKit shortcut the task sheet hints at', () => {
    expectPass(
      'w6-61-isat-circle',
      MY_CIRCLE_ISAT.replace(
        `        double dx = pt.X - X;
        double dy = pt.Y - Y;
        return Math.Sqrt(dx * dx + dy * dy) <= _radius;`,
        '        return SplashKit.PointInCircle(pt, SplashKit.CircleAt(X, Y, _radius));',
      ),
    );
  });

  it('rejects an IsAt that excludes the rim, where the task sheet says "does not exceed"', () => {
    expectFail(
      'w6-61-isat-circle',
      MY_CIRCLE_ISAT.replace('<= _radius;', '< _radius;'),
    );
  });

  it('rejects an IsAt that only checks a bounding box', () => {
    expectFail(
      'w6-61-isat-circle',
      MY_CIRCLE_ISAT.replace(
        `        double dx = pt.X - X;
        double dy = pt.Y - Y;
        return Math.Sqrt(dx * dx + dy * dy) <= _radius;`,
        `        return pt.X > X - _radius && pt.X < X + _radius
            && pt.Y > Y - _radius && pt.Y < Y + _radius;`,
      ),
    );
  });

  it('Shape made abstract', () => {
    expectPass('w6-61-abstract', SHAPE_ABSTRACT);
  });

  it('rejects abstract methods on a class that is still concrete', () => {
    expectFail('w6-61-abstract', SHAPE_ABSTRACT.replace('public abstract class Shape', 'public class Shape'));
  });

  it('rejects a Shape that keeps an empty virtual Draw instead of an abstract one', () => {
    expectFail(
      'w6-61-abstract',
      SHAPE_ABSTRACT.replace('public abstract void Draw();', 'public virtual void Draw() { }'),
    );
  });

  it('MyLine completing the hierarchy', () => {
    expectPass('w6-61-myline', MY_LINE_FULL);
  });

  it('rejects a MyLine.IsAt that reports true for a point well off the line', () => {
    expectFail('w6-61-myline', MY_LINE_FULL.replace('return SplashKit.PointOnLine(pt, SplashKit.LineFrom(X, Y, _endX, _endY));', 'return true;'));
  });
});

// ------------------------------------------------------- concept material

function conceptBlocks<T extends Block['t']>(t: T): Extract<Block, { t: T }>[] {
  return allSteps().flatMap((s) => s.blocks.filter((b): b is Extract<Block, { t: T }> => b.t === t));
}

describe('predict blocks agree with the interpreter', () => {
  const predicts = conceptBlocks('predict');

  it('there are some', () => {
    expect(predicts.length).toBeGreaterThan(1);
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

      // Parsons blocks are not personalised by StepView, so a token here would
      // reach the student as literal braces.
      expect(block.lines.join('\n')).not.toContain('{{');

      const start = scrambleOf(block.lines);
      expect(start.length).toBe(block.lines.length);
      expect(new Set(start).size).toBe(block.lines.length);
      expect(start.every((v, i) => v === i), 'starts already solved').toBe(false);
    });
  }
});

describe('recall prompts', () => {
  it('every concept lesson ends by asking for an explanation in the student\'s own words', () => {
    for (const lesson of week6.lessons) {
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
      // Recall blocks are not personalised either.
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

  it('non-interactive runnable code runs clean', () => {
    for (const block of conceptBlocks('runnable')) {
      if (block.tool === 'canvas') continue;
      const r = runProgram(personalize(block.code, TOKENS), { student: PROFILE });
      expect(r.error?.message ?? '', `${block.caption ?? 'runnable'} should run without error`).toBe('');
    }
  });

  it('the interactive ShapeDrawer parses and its classes are the ones the task sheet asks for', () => {
    const canvas = conceptBlocks('runnable').find((b) => b.tool === 'canvas');
    expect(canvas, 'Task 6.1 should end with a canvas demo').toBeDefined();
    const code = personalize(canvas!.code, TOKENS);
    expect(() => parse(code)).not.toThrow();
    for (const name of ['abstract class Shape', 'MyRectangle : Shape', 'MyCircle : Shape', 'MyLine : Shape']) {
      expect(code, `the demo should contain ${name}`).toContain(name);
    }
    // Nested types do not parse here, so the enum has to be top level.
    expect(code).toContain('public enum ShapeKind');
  });

  /*
   * Teaching code the student only reads still has to be real C#, so a typo in
   * it gets caught here rather than by a confused student. The one deliberate
   * exception is Lab6.pdf's nested `private enum ShapeKind`, which is valid C#
   * that this parser refuses — so that block is allowed to fail, but only with
   * that exact message, and only while the lesson still warns about it.
   */
  it('read-only code blocks that are whole programs still parse', () => {
    let nested = 0;
    for (const block of conceptBlocks('code')) {
      if (block.lang && block.lang !== 'csharp') continue;
      if (!/^\s*public\s+(abstract\s+)?class\s/.test(block.code)) continue;
      try {
        parse(personalize(block.code, TOKENS));
      } catch (e) {
        expect(String(e), block.caption ?? 'code block').toContain('Nested types are not supported');
        expect(block.code, 'only the nested-enum example may fail to parse').toContain('enum ShapeKind');
        nested++;
      }
    }
    expect(nested, 'exactly one block should be the documented nested-type example').toBe(1);
  });

  it('warns the student where that nested enum will not run', () => {
    const warned = allSteps().some((step) => {
      const hasNested = step.blocks.some((b) => b.t === 'code' && b.code.includes('private enum ShapeKind'));
      const explains = step.blocks.some(
        (b) => b.t === 'callout' && b.md.includes('nested types'),
      );
      return hasNested && explains;
    });
    expect(warned, 'the nested-enum block needs a callout saying it will not run here').toBe(true);
  });
});

// -------------------------------------------------------------- provenance

describe('sourcing', () => {
  it('cites Quiz 6 question by question, the way earlier weeks do', () => {
    const explains = conceptBlocks('quiz').map((b) => b.explain).join('\n');
    const cited = new Set(Array.from(explains.matchAll(/Quiz 6 Q(\d+)/g)).map((m) => Number(m[1])));
    // All fourteen of Quiz 6's questions should end up somewhere in the week.
    for (let q = 1; q <= 14; q++) {
      expect(cited.has(q), `Quiz 6 Q${q} is not used anywhere in Week 6`).toBe(true);
    }
  });

  it('says out loud that this week is not on the midterm', () => {
    const prose = allSteps()
      .flatMap((s) => s.blocks)
      .map((b) => ('md' in b ? b.md : ''))
      .join('\n');
    expect(prose.toLowerCase()).toContain('midterm');
  });
});
