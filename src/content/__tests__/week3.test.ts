/**
 * Content validation for Week 3.
 *
 * Same contract as week2.test.ts: every exercise gets a reference solution
 * here that must pass its own checks, a near-miss must fail, and every
 * predict block's claimed output is executed against the real interpreter —
 * never trusted from memory.
 */

import { describe, expect, it } from 'vitest';
import { week3 } from '../week3';
import { runChecks } from '@/engine/checks';
import { runProgram } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { scrambleOf } from '@/tools/parsons';
import type { Block, Exercise, Step } from '../types';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };

function allSteps(): Step[] {
  return week3.lessons.flatMap((l) => l.steps);
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
  return runChecks(ex.tests, {
    source: solution,
    harness: ex.harness,
    stdin: ex.stdin,
    student: PROFILE,
  });
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

const ITEM_FULL = `public class Item
{
    private string _name;
    private string _description;

    public Item(string name, string description)
    {
        _name = name;
        _description = description;
    }

    public string Name { get { return _name; } }
    public string Description { get { return _description; } }
    public bool HasId(string id) { return _name == id; }
}`;

const INVENTORY_FULL = `public class Inventory
{
    private List<Item> _items;

    public Inventory()
    {
        _items = new List<Item>();
    }

    public void PutItem(Item item)
    {
        _items.Add(item);
    }

    public bool HasItem(string id)
    {
        foreach (Item i in _items)
        {
            if (i.HasId(id))
            {
                return true;
            }
        }
        return false;
    }

    public Item TakeItem(string id)
    {
        foreach (Item i in _items)
        {
            if (i.HasId(id))
            {
                _items.Remove(i);
                return i;
            }
        }
        return null;
    }
}`;

describe('Week 3 structure', () => {
  it('every lesson has steps and every exercise has checks and hints', () => {
    for (const lesson of week3.lessons) {
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

describe('Item exercises are solvable', () => {
  it('fields', () => {
    expectPass('w3-t3-item-fields', 'public class Item\n{\n    private string _name;\n    private string _description;\n}');
  });

  it('rejects public fields', () => {
    expectFail('w3-t3-item-fields', 'public class Item\n{\n    public string _name;\n    public string _description;\n}');
  });

  it('constructor', () => {
    expectPass(
      'w3-t3-item-ctor',
      `public class Item
{
    private string _name;
    private string _description;

    public Item(string name, string description)
    {
        _name = name;
        _description = description;
    }
}`,
    );
  });

  it('rejects a one-parameter constructor', () => {
    expectFail(
      'w3-t3-item-ctor',
      `public class Item
{
    private string _name;
    private string _description;

    public Item(string name)
    {
        _name = name;
    }
}`,
    );
  });

  it('properties and HasId', () => {
    expectPass('w3-t3-item-rest', ITEM_FULL);
  });

  it('rejects a Name property with a setter', () => {
    expectFail(
      'w3-t3-item-rest',
      ITEM_FULL.replace(
        'public string Name { get { return _name; } }',
        'public string Name { get { return _name; } set { _name = value; } }',
      ),
    );
  });

  it('rejects HasId comparing the wrong field', () => {
    expectFail(
      'w3-t3-item-rest',
      ITEM_FULL.replace(
        'public bool HasId(string id) { return _name == id; }',
        'public bool HasId(string id) { return _description == id; }',
      ),
    );
  });
});

describe('Inventory exercises are solvable', () => {
  it('fields and constructor', () => {
    expectPass('w3-t3-inventory-fields', 'public class Inventory\n{\n    private List<Item> _items;\n\n    public Inventory()\n    {\n        _items = new List<Item>();\n    }\n}');
  });

  it('PutItem', () => {
    expectPass(
      'w3-t3-inventory-put',
      `public class Inventory
{
    private List<Item> _items;

    public Inventory()
    {
        _items = new List<Item>();
    }

    public void PutItem(Item item)
    {
        _items.Add(item);
    }
}`,
    );
  });

  it('HasItem', () => {
    expectPass(
      'w3-t3-inventory-hasitem',
      `public class Inventory
{
    private List<Item> _items;

    public Inventory()
    {
        _items = new List<Item>();
    }

    public void PutItem(Item item)
    {
        _items.Add(item);
    }

    public bool HasItem(string id)
    {
        foreach (Item i in _items)
        {
            if (i.HasId(id))
            {
                return true;
            }
        }
        return false;
    }
}`,
    );
  });

  it('rejects a HasItem that always returns true', () => {
    expectFail(
      'w3-t3-inventory-hasitem',
      `public class Inventory
{
    private List<Item> _items;

    public Inventory()
    {
        _items = new List<Item>();
    }

    public void PutItem(Item item)
    {
        _items.Add(item);
    }

    public bool HasItem(string id)
    {
        return true;
    }
}`,
    );
  });

  it('TakeItem', () => {
    expectPass('w3-t3-inventory-takeitem', INVENTORY_FULL);
  });

  it('rejects a TakeItem that forgets to remove the item', () => {
    expectFail(
      'w3-t3-inventory-takeitem',
      INVENTORY_FULL.replace(
        '                _items.Remove(i);\n                return i;',
        '                return i;',
      ),
    );
  });

  it('the finished task', () => {
    expectPass(
      'w3-t3-final',
      `${ITEM_FULL}

${INVENTORY_FULL}

public class Program
{
    static void Main()
    {
        Inventory inv = new Inventory();
        inv.PutItem(new Item("sword", "A bronze sword"));
        inv.PutItem(new Item("gem", "A bright red ruby"));

        Console.WriteLine(inv.HasItem("gem"));
        Item sword = inv.TakeItem("sword");
        Console.WriteLine(sword.Name);
        Console.WriteLine(inv.HasItem("sword"));
    }
}`,
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
    for (const lesson of week3.lessons) {
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

describe('sequence/uml runnables reference only classes they define', () => {
  it('umlSpec sources parse', () => {
    for (const block of conceptBlocks('umlSpec')) {
      expect(() => parse(block.source)).not.toThrow();
    }
  });

  it('runnable code runs clean', () => {
    for (const block of conceptBlocks('runnable')) {
      const r = runProgram(block.code, { student: PROFILE });
      expect(r.error?.message ?? '', `${block.caption ?? 'runnable'} should run without error`).toBe('');
    }
  });
});
