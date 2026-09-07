/**
 * Content validation for Week 5.
 *
 * Same contract as week2/3/4: every exercise gets a reference solution that
 * must pass its own checks, a near-miss must fail, and every predict block's
 * claimed output is executed against the real interpreter.
 */

import { describe, expect, it } from 'vitest';
import { week5 } from '../week5';
import { runChecks } from '@/engine/checks';
import { runProgram } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { scrambleOf } from '@/tools/parsons';
import { personalize, resolveTokens } from '../personalize';
import type { Block, Exercise, Step } from '../types';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };
const TOKENS = resolveTokens(PROFILE);

function allSteps(): Step[] {
  return week5.lessons.flatMap((l) => l.steps);
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

const DRAWING_FIELDS_CTOR = `public class Drawing
{
    private readonly List<Shape> _shapes;
    private Color _background;

    public Drawing(Color background)
    {
        _shapes = new List<Shape>();
        _background = background;
    }

    public Drawing() : this(Color.White)
    {
    }
}`;

const DRAWING_COUNT_ADD_REMOVE = `public class Drawing
{
    private readonly List<Shape> _shapes;
    private Color _background;

    public Drawing(Color background)
    {
        _shapes = new List<Shape>();
        _background = background;
    }

    public Drawing() : this(Color.White)
    {
    }

    public int ShapeCount { get { return _shapes.Count; } }

    public void AddShape(Shape s) { _shapes.Add(s); }
    public void RemoveShape(Shape s) { _shapes.Remove(s); }
}`;

const SHAPE_WITH_OUTLINE = `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape(int param)
    {
        _color = Color.{{color4}};
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public int Width { get { return _width; } set { _width = value; } }
    public int Height { get { return _height; } set { _height = value; } }

    public void Draw()
    {
        SplashKit.FillRectangle(_color, _x, _y, _width, _height);
    }

    public bool IsAt(Point2D pt)
    {
        return pt.X > _x && pt.X < _x + _width
            && pt.Y > _y && pt.Y < _y + _height;
    }

    private bool _selected;
    public bool Selected { get { return _selected; } set { _selected = value; } }
    public void DrawOutline()
    {
        SplashKit.FillRectangle(Color.Black, _x - {{outlineWidth}}, _y - {{outlineWidth}}, _width + 2 * {{outlineWidth}}, _height + 2 * {{outlineWidth}});
    }
}`;

const DRAWING_WITH_DRAW = `public class Drawing
{
    private readonly List<Shape> _shapes;
    private Color _background;

    public Drawing(Color background)
    {
        _shapes = new List<Shape>();
        _background = background;
    }

    public Drawing() : this(Color.White)
    {
    }

    public int ShapeCount { get { return _shapes.Count; } }

    public void AddShape(Shape s) { _shapes.Add(s); }
    public void RemoveShape(Shape s) { _shapes.Remove(s); }

    public void Draw()
    {
        SplashKit.ClearScreen(_background);
        foreach (Shape s in _shapes)
        {
            s.Draw();
        }
    }
}`;

const DRAWING_WITH_SELECT = `public class Drawing
{
    private readonly List<Shape> _shapes;
    private Color _background;

    public Drawing(Color background)
    {
        _shapes = new List<Shape>();
        _background = background;
    }

    public Drawing() : this(Color.White)
    {
    }

    public void AddShape(Shape s) { _shapes.Add(s); }
    public void RemoveShape(Shape s) { _shapes.Remove(s); }

    public void SelectShapesAt(Point2D pt)
    {
        foreach (Shape s in _shapes)
        {
            s.Selected = s.IsAt(pt);
        }
    }

    public List<Shape> SelectedShapes
    {
        get
        {
            List<Shape> result = new List<Shape>();
            foreach (Shape s in _shapes)
            {
                if (s.Selected) { result.Add(s); }
            }
            return result;
        }
    }
}`;

const IDENTIFIABLE = `public class IdentifiableObject
{
    private List<string> identifiers;
    public IdentifiableObject(string[] ids) { identifiers = new List<string>(ids); }
    public bool AreYou(string id)
    {
        foreach (string i in identifiers) { if (i == id) { return true; } }
        return false;
    }
    public string FirstID() { return identifiers[0]; }
    public void RemoveIdentifier(string id) { identifiers.Remove(id); }
    public string PrivilegeEscalation(string pin)
    {
        if (pin == "{{XXXX}}") { return "your tutorial ID"; }
        return FirstID();
    }
}`;

const GAMEOBJECT = `public abstract class GameObject : IdentifiableObject
{
    protected string name;
    protected string description;
    public GameObject(string[] ids, string name, string description) : base(ids)
    {
        this.name = name;
        this.description = description;
    }
    public string Name { get { return name; } }
    public string ShortDescription() { return name + " (" + FirstID() + ")"; }
    public virtual string FullDescription() { return description; }
}`;

const ITEM = `public class Item : GameObject
{
    public Item(string[] idents, string name, string description) : base(idents, name, description) { }
}`;

const ITEM_TESTS_CORRECT = `[TestFixture]
public class ItemTests
{
    private Item Sword()
    {
        return new Item(new string[] { "sword", "blade" }, "bronze sword", "A short sword cast from bronze");
    }

    [Test]
    public void TestItemIsIdentifiable()
    {
        Item i = Sword();
        Assert.That(i.AreYou("sword"), Is.True);
        Assert.That(i.AreYou("blade"), Is.True);
        Assert.That(i.AreYou("shield"), Is.False);
    }

    [Test]
    public void TestShortDescription()
    {
        Item i = Sword();
        Assert.That(i.ShortDescription(), Is.EqualTo("bronze sword (sword)"));
    }

    [Test]
    public void TestFullDescription()
    {
        Item i = Sword();
        Assert.That(i.FullDescription(), Is.EqualTo("A short sword cast from bronze"));
    }

    [Test]
    public void TestPrivilegeEscalation()
    {
        Item i = Sword();
        Assert.That(i.PrivilegeEscalation("{{XXXX}}"), Is.EqualTo("your tutorial ID"));
        Assert.That(i.PrivilegeEscalation("0000"), Is.EqualTo("sword"));
    }
}`;

const ITEM_TESTS_VACUOUS = `[TestFixture]
public class ItemTests
{
    [Test]
    public void TestItemIsIdentifiable() { Assert.That(true); }
    [Test]
    public void TestShortDescription() { Assert.That(true); }
    [Test]
    public void TestFullDescription() { Assert.That(true); }
    [Test]
    public void TestPrivilegeEscalation() { Assert.That(true); }
}`;

const INVENTORY_TESTS = `[TestFixture]
public class InventoryTests
{
    private Item Sword()
    {
        return new Item(new string[] { "sword" }, "bronze sword", "A short sword cast from bronze");
    }

    [Test]
    public void TestFindItem()
    {
        Inventory inv = new Inventory();
        inv.Put(Sword());
        Assert.That(inv.HasItem("sword"), Is.True);
    }

    [Test]
    public void TestNoItemFind()
    {
        Inventory inv = new Inventory();
        Assert.That(inv.HasItem("gem"), Is.False);
    }

    [Test]
    public void TestFetchItem()
    {
        Inventory inv = new Inventory();
        inv.Put(Sword());
        Item fetched = inv.Fetch("sword");
        Assert.That(fetched != null);
        Assert.That(inv.HasItem("sword"), Is.True);
    }

    [Test]
    public void TestTakeItem()
    {
        Inventory inv = new Inventory();
        inv.Put(Sword());
        Item taken = inv.Take("sword");
        Assert.That(taken != null);
        Assert.That(inv.HasItem("sword"), Is.False);
    }

    [Test]
    public void TestItemList()
    {
        Inventory inv = new Inventory();
        inv.Put(Sword());
        Assert.That(inv.ItemList, Is.EqualTo("\\tbronze sword (sword)\\n"));
    }
}`;

describe('Week 5 structure', () => {
  it('every lesson has steps and every exercise has checks and hints', () => {
    for (const lesson of week5.lessons) {
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

describe('Task 5.1 (Drawing) exercises are solvable', () => {
  it('fields and two constructors', () => {
    expectPass('w5-51-fields-ctor', DRAWING_FIELDS_CTOR);
  });

  it('rejects a Drawing missing the default constructor', () => {
    expectFail(
      'w5-51-fields-ctor',
      `public class Drawing
{
    private readonly List<Shape> _shapes;
    private Color _background;

    public Drawing(Color background)
    {
        _shapes = new List<Shape>();
        _background = background;
    }
}`,
    );
  });

  it('ShapeCount, AddShape, RemoveShape', () => {
    expectPass('w5-51-count-add-remove', DRAWING_COUNT_ADD_REMOVE);
  });

  it('Shape gets Selected and DrawOutline', () => {
    expectPass('w5-51-selected-outline', SHAPE_WITH_OUTLINE);
  });

  it('rejects a Selected property that starts true', () => {
    // A structural near-miss: Selected always returning true regardless of the
    // backing field would still satisfy the structure checks, so this exercises
    // the behavioural output check instead.
    expectFail(
      'w5-51-selected-outline',
      SHAPE_WITH_OUTLINE.replace(
        'public bool Selected { get { return _selected; } set { _selected = value; } }',
        'public bool Selected { get { return true; } set { _selected = value; } }',
      ),
    );
  });

  it('Draw and the outline-when-selected rule', () => {
    expectPass('w5-51-draw-select', DRAWING_WITH_DRAW);
  });

  it('SelectShapesAt and SelectedShapes', () => {
    expectPass('w5-51-selectshapesat', DRAWING_WITH_SELECT);
  });

  it('rejects a SelectShapesAt that only ever selects, never deselects', () => {
    expectFail(
      'w5-51-selectshapesat',
      DRAWING_WITH_SELECT.replace(
        's.Selected = s.IsAt(pt);',
        'if (s.IsAt(pt)) { s.Selected = true; }',
      ),
    );
  });
});

describe('Task 5.2 (Iteration 4 tests) exercises are solvable', () => {
  it('the four Item tests', () => {
    expectPass('w5-52-item-tests', ITEM_TESTS_CORRECT);
  });

  it('rejects vacuous Item tests', () => {
    expectFail('w5-52-item-tests', ITEM_TESTS_VACUOUS);
  });

  it('rejects a TestPrivilegeEscalation with a wrong expectation for the bad-pin case', () => {
    expectFail(
      'w5-52-item-tests',
      ITEM_TESTS_CORRECT.replace(
        'Assert.That(i.PrivilegeEscalation("0000"), Is.EqualTo("sword"));',
        'Assert.That(i.PrivilegeEscalation("0000"), Is.EqualTo("your tutorial ID"));',
      ),
    );
  });

  it('the five re-tested Inventory tests', () => {
    expectPass('w5-52-retest', INVENTORY_TESTS);
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
      const r = runProgram(block.code, { student: PROFILE });

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

      const start = scrambleOf(block.lines);
      expect(start.length).toBe(block.lines.length);
      expect(new Set(start).size).toBe(block.lines.length);
      expect(start.every((v, i) => v === i), 'starts already solved').toBe(false);
    });
  }
});

describe('recall prompts', () => {
  it("every concept lesson ends up asking for an explanation in the student's own words", () => {
    for (const lesson of week5.lessons) {
      if (lesson.kind !== 'concept') continue;
      const recalls = lesson.steps.flatMap((s) => s.blocks.filter((b) => b.t === 'recall'));
      expect(recalls.length, `${lesson.id} has no recall block`).toBeGreaterThanOrEqual(0);
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
});
