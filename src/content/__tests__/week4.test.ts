/**
 * Content validation for Week 4.
 *
 * Same contract as week2/week3: every exercise gets a reference solution that
 * must pass its own checks, a near-miss must fail, and every predict block's
 * claimed output is executed against the real interpreter.
 */

import { describe, expect, it } from 'vitest';
import { week4 } from '../week4';
import { runChecks } from '@/engine/checks';
import { runProgram } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { scrambleOf } from '@/tools/parsons';
import { personalize, resolveTokens } from '../personalize';
import type { Block, Exercise, Step } from '../types';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };
const TOKENS = resolveTokens(PROFILE);

function allSteps(): Step[] {
  return week4.lessons.flatMap((l) => l.steps);
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

const SHAPE_FIELDS = `public class Shape
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
}`;

const SHAPE_FULL = `public class Shape
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
}`;

const IDENTIFIABLE_BASIC = `public class IdentifiableObject
{
    private List<string> identifiers;

    public IdentifiableObject(string[] ids)
    {
        identifiers = new List<string>(ids);
    }

    public bool AreYou(string id)
    {
        foreach (string i in identifiers)
        {
            if (i == id)
            {
                return true;
            }
        }
        return false;
    }
}`;

const IDENTIFIABLE_FULL = `public class IdentifiableObject
{
    private List<string> identifiers;

    public IdentifiableObject(string[] ids)
    {
        identifiers = new List<string>(ids);
    }

    public bool AreYou(string id)
    {
        foreach (string i in identifiers)
        {
            if (i == id)
            {
                return true;
            }
        }
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

const GAMEOBJECT_FULL = `public abstract class GameObject : IdentifiableObject
{
    protected string name;
    protected string description;

    public GameObject(string[] ids, string name, string description)
        : base(ids)
    {
        this.name = name;
        this.description = description;
    }

    public string Name
    {
        get { return name; }
    }

    public string ShortDescription()
    {
        return name + " (" + FirstID() + ")";
    }

    public virtual string FullDescription()
    {
        return description;
    }
}`;

const ITEM_FULL = `public class Item : GameObject
{
    public Item(string[] idents, string name, string description)
        : base(idents, name, description)
    {
    }
}`;

const INVENTORY_FULL = `public class Inventory
{
    private List<Item> _items;

    public Inventory()
    {
        _items = new List<Item>();
    }

    public void Put(Item itm)
    {
        _items.Add(itm);
    }

    public bool HasItem(string id)
    {
        foreach (Item i in _items)
        {
            if (i.AreYou(id))
            {
                return true;
            }
        }
        return false;
    }

    public Item Take(string id)
    {
        foreach (Item i in _items)
        {
            if (i.AreYou(id))
            {
                _items.Remove(i);
                return i;
            }
        }
        return null;
    }

    public Item Fetch(string id)
    {
        foreach (Item i in _items)
        {
            if (i.AreYou(id))
            {
                return i;
            }
        }
        return null;
    }

    public string ItemList
    {
        get
        {
            string result = "";
            foreach (Item i in _items)
            {
                result += "\\t" + i.ShortDescription() + "\\n";
            }
            return result;
        }
    }
}`;

const INVENTORY_TESTS_CORRECT = `[TestFixture]
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

const INVENTORY_TESTS_VACUOUS = `[TestFixture]
public class InventoryTests
{
    [Test]
    public void TestFindItem() { Assert.That(true); }
    [Test]
    public void TestNoItemFind() { Assert.That(true); }
    [Test]
    public void TestFetchItem() { Assert.That(true); }
    [Test]
    public void TestTakeItem() { Assert.That(true); }
    [Test]
    public void TestItemList() { Assert.That(true); }
}`;

describe('Week 4 structure', () => {
  it('every lesson has steps and every exercise has checks and hints', () => {
    for (const lesson of week4.lessons) {
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

describe('Task 4.1 (ShapeDrawer) exercises are solvable', () => {
  it('fields and constructor', () => {
    expectPass('w4-41-fields', SHAPE_FIELDS);
  });

  it('rejects a solution that hardcodes the wrong colour for this student', () => {
    // Amy resolves to Azure under the Week 4 A-K split; Chocolate would only
    // be correct for a student whose first name starts L-Z.
    expectFail('w4-41-draw-isat', SHAPE_FULL.replace('Color.{{color4}}', 'Color.Chocolate'));
  });

  it('Draw and IsAt', () => {
    expectPass('w4-41-draw-isat', SHAPE_FULL);
  });

  it('rejects an IsAt that never checks the far edge', () => {
    expectFail(
      'w4-41-draw-isat',
      SHAPE_FULL.replace(
        'return pt.X > _x && pt.X < _x + _width\n            && pt.Y > _y && pt.Y < _y + _height;',
        'return pt.X > _x && pt.Y > _y;',
      ),
    );
  });
});

describe('IdentifiableObject exercises are solvable', () => {
  it('fields, constructor, AreYou', () => {
    expectPass('w4-42-identifiable', IDENTIFIABLE_BASIC);
  });

  it('rejects an AreYou that always returns true', () => {
    expectFail(
      'w4-42-identifiable',
      IDENTIFIABLE_BASIC.replace(
        'foreach (string i in identifiers)\n        {\n            if (i == id)\n            {\n                return true;\n            }\n        }\n        return false;',
        'return true;',
      ),
    );
  });

  it('FirstID, RemoveIdentifier, PrivilegeEscalation', () => {
    expectPass('w4-42-firstid-remove', IDENTIFIABLE_FULL);
  });
});

describe('GameObject exercise is solvable', () => {
  it('the reference GameObject', () => {
    expectPass('w4-42-gameobject', GAMEOBJECT_FULL);
  });

  it('rejects a non-abstract GameObject', () => {
    expectFail('w4-42-gameobject', GAMEOBJECT_FULL.replace('public abstract class GameObject', 'public class GameObject'));
  });

  it('rejects a FullDescription that is not virtual', () => {
    expectFail(
      'w4-42-gameobject',
      GAMEOBJECT_FULL.replace('public virtual string FullDescription()', 'public string FullDescription()'),
    );
  });

  it('rejects code that instantiates GameObject directly', () => {
    expectFail('w4-42-gameobject', `${GAMEOBJECT_FULL}\n\npublic class __Bad { public static void Main() { var g = new GameObject(new string[]{"x"}, "n", "d"); } }`);
  });
});

describe('Item exercise is solvable', () => {
  it('the reference Item', () => {
    expectPass('w4-42-item', ITEM_FULL);
  });

  it('rejects an Item that does not inherit from GameObject', () => {
    expectFail('w4-42-item', 'public class Item\n{\n    public Item(string[] idents, string name, string description) { }\n}');
  });
});

describe('Inventory exercise is solvable', () => {
  it('the reference Inventory', () => {
    expectPass('w4-42-inventory', INVENTORY_FULL);
  });

  it('rejects an Inventory whose Take does not remove the item', () => {
    expectFail(
      'w4-42-inventory',
      INVENTORY_FULL.replace(
        '                _items.Remove(i);\n                return i;',
        '                return i;',
      ),
    );
  });

  it('rejects an Inventory whose ItemList has no separator', () => {
    expectFail(
      'w4-42-inventory',
      INVENTORY_FULL.replace(
        'result += "\\t" + i.ShortDescription() + "\\n";',
        'result += i.ShortDescription();',
      ),
    );
  });
});

describe('the student-written NUnit tests are graded correctly', () => {
  it('a correct set of five tests passes', () => {
    expectPass('w4-42-write-tests', INVENTORY_TESTS_CORRECT);
  });

  it('a vacuous set of five tests (Assert.That(true)) is rejected', () => {
    expectFail('w4-42-write-tests', INVENTORY_TESTS_VACUOUS);
  });

  it('a test that gets TestTakeItem backwards is rejected', () => {
    expectFail(
      'w4-42-write-tests',
      INVENTORY_TESTS_CORRECT.replace(
        'Assert.That(inv.HasItem("sword"), Is.False);\n    }\n\n    [Test]\n    public void TestItemList',
        'Assert.That(inv.HasItem("sword"), Is.True);\n    }\n\n    [Test]\n    public void TestItemList',
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
    for (const lesson of week4.lessons) {
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

describe('umlSpec and runnable blocks are self-consistent', () => {
  it('umlSpec sources parse', () => {
    for (const block of conceptBlocks('umlSpec')) {
      expect(() => parse(block.source)).not.toThrow();
    }
  });

  it('non-interactive runnable code runs clean', () => {
    // The Task 4.1 canvas demo has an infinite do-while game loop keyed to a
    // real window close event, which never resolves headlessly -- that one is
    // exercised visually, not asserted here.
    for (const block of conceptBlocks('runnable')) {
      if (block.tool === 'canvas') continue;
      const r = runProgram(personalize(block.code, TOKENS), { student: PROFILE });
      expect(r.error?.message ?? '', `${block.caption ?? 'runnable'} should run without error`).toBe('');
    }
  });
});
