/**
 * Content validation for Week 9.
 *
 * Same contract as week2-8: every exercise gets a reference solution that must
 * pass its own checks, a near-miss must fail, and every predict block's claimed
 * output is executed against the real interpreter.
 *
 * The thing this file guards that no other week does: **`Bag.Locate` is flat,
 * and that is deliberate.** Lab9.pdf's own "Test Bag in Bag" requires that
 * `b1` cannot locate items inside `b2`, and its last test turns that into a
 * security property. Week 8's lecture frames the same shallow search as a bug.
 * The near-miss below asserts that a *recursive* `Locate` **fails** this
 * week's checks — so if anyone ever "fixes" the lesson back toward the
 * lecture, this test says no.
 */

import { describe, expect, it } from 'vitest';
import { week9, week9Interview } from '../week9';
import { runChecks } from '@/engine/checks';
import { runProgram } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { personalize, resolveTokens } from '../personalize';
import type { Block, Exercise, Step } from '../types';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };
const TOKENS = resolveTokens(PROFILE);

function allSteps(): Step[] {
  return week9.lessons.flatMap((l) => l.steps);
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

/**
 * The standing cast, for predict blocks in steps that have no exercise of
 * their own (and so no harness to borrow the classes from).
 */
const FOUNDATION_FOR_PREDICT = `public class IdentifiableObject
{
    private List<string> _identifiers = new List<string>();

    public IdentifiableObject(string[] ids)
    {
        foreach (string id in ids) { _identifiers.Add(id.ToLower()); }
    }

    public bool AreYou(string id) { return _identifiers.Contains(id.ToLower()); }
    public string FirstID() { return _identifiers[0]; }
}

public abstract class GameObject : IdentifiableObject
{
    protected string name;
    protected string description;

    public GameObject(string[] ids, string name, string description) : base(ids)
    {
        this.name = name;
        this.description = description;
    }

    public string Name { get { return name; } }
    public string ShortDescription { get { return name + " (" + FirstID() + ")"; } }
    public virtual string FullDescription { get { return description; } }
}

public class Item : GameObject
{
    public Item(string[] idents, string name, string desc) : base(idents, name, desc) { }
}

public class Inventory
{
    private List<Item> _items = new List<Item>();

    public void Put(Item itm) { _items.Add(itm); }

    public bool HasItem(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { return true; } }
        return false;
    }

    public Item Fetch(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { return i; } }
        return null;
    }

    public string ItemList
    {
        get
        {
            string result = "";
            foreach (Item i in _items) { result = result + i.ShortDescription + ", "; }
            return result;
        }
    }
}`;

/** The Bag exactly as Lab9.pdf page 2 specifies it: flat Locate. */
const BAG_FLAT = `public class Bag : Item
{
    private Inventory _inventory;

    public Bag(string[] ids, string name, string desc) : base(ids, name, desc)
    {
        _inventory = new Inventory();
    }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id))
        {
            return this;
        }
        else if (_inventory.HasItem(id))
        {
            return _inventory.Fetch(id);
        }
        else
        {
            return null;
        }
    }

    public override string FullDescription
    {
        get { return "In the " + Name + " you can see:\\n" + Inventory.ItemList; }
    }
}`;

const BAG_LOCATES_ITEMS_TEST = `        _testToolBag.Inventory.Put(_testItem1);
        Assert.That(_testToolBag.Locate("hammer"), Is.SameAs(_testItem1));
        Assert.That(_testToolBag.Locate("hammer"), Is.SameAs(_testItem1));`;

// ------------------------------------------------------------------- shape

describe('week 9 shape', () => {
  it('is numbered 9 and names its sources', () => {
    expect(week9.number).toBe(9);
    expect(week9.sources.join(' ')).toMatch(/Lab9\.pdf/);
  });

  it('has unique step ids', () => {
    const ids = allSteps().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every lab lesson an assessment weight', () => {
    for (const l of week9.lessons.filter((x) => x.kind === 'lab')) {
      expect(l.assessment, l.id).toBeTruthy();
    }
  });

  it('parses every code and runnable block that is a whole program', () => {
    // Same rule as week8.test.ts: a read-only `code` block is only required to
    // parse when it *is* a program. Some are deliberate fragments — the NUnit
    // `[Test]` methods lifted out of the student's own BagTests.cs, which have
    // no enclosing class because the point is the body.
    const bad: string[] = [];
    for (const step of allSteps()) {
      for (const b of step.blocks as Block[]) {
        if (b.t === 'code' && (b.lang ?? 'csharp') !== 'csharp') continue;
        if (b.t !== 'code' && b.t !== 'runnable' && b.t !== 'umlSpec') continue;
        const src = b.t === 'umlSpec' ? b.source : b.code;
        if (b.t === 'code' && !/^\s*public\s+(abstract\s+)?(class|interface)\s/.test(src)) continue;
        try {
          parse(personalize(src, TOKENS));
        } catch (e) {
          bad.push(`${step.id}: ${(e as Error).message}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

// ------------------------------------------------------------- predictions

describe('every predict block tells the truth', () => {
  it('runs each one against the interpreter', () => {
    for (const step of allSteps()) {
      for (const b of step.blocks as Block[]) {
        if (b.t !== 'predict') continue;
        // Predict blocks are snippets, not whole programs. The step's own
        // exercise harness supplies the classes where there is one; where
        // there is not, the week's standing cast does.
        const ex = step.exercise as Exercise | undefined;
        const harness = ex?.harness
          ? personalize(ex.harness, TOKENS).replace(/public class __Check[\s\S]*$/, '')
          : FOUNDATION_FOR_PREDICT;
        // A predict block sits *before* the exercise, so the class the student
        // is about to write is not in the harness — supply the reference one.
        const classes = /class\s+Bag\b/.test(harness) ? harness : `${harness}\n\n${BAG_FLAT}`;
        const src = `${classes}

public class __P
{
    public static void Main()
    {
${personalize(b.code, TOKENS)
  .split('\n')
  .map((l) => '        ' + l)
  .join('\n')}
    }
}`;
        const r = runProgram(src);
        if (b.expect.errorContains) {
          // Some predict blocks are about code that does *not* compile or run.
          expect(r.error?.message ?? '', `${step.id} predict should fail`).toContain(
            b.expect.errorContains,
          );
          continue;
        }
        expect(r.error?.message ?? '', `${step.id} predict should run`).toBe('');
        expect((r.output ?? '').trim(), `${step.id} predict output`).toBe(
          (b.expect.output ?? '').trim(),
        );
      }
    }
  });
});

// -------------------------------------------------------------- task 9.1

describe('task 9.1 — the Bag', () => {
  it('accepts the Bag from the task sheet', () => {
    expectPass('w9-91-flat', BAG_FLAT);
  });

  it('rejects a Bag whose Inventory property has a setter', () => {
    // The UML says <<readonly, property>>. A settable Inventory would let a
    // caller swap a bag's contents wholesale.
    expectFail(
      'w9-91-flat',
      BAG_FLAT.replace(
        'public Inventory Inventory { get { return _inventory; } }',
        'public Inventory Inventory { get { return _inventory; } set { _inventory = value; } }',
      ),
    );
  });

  it('rejects a Locate built on Take, which empties the bag as it searches', () => {
    expectFail('w9-91-flat', BAG_FLAT.replace('_inventory.Fetch(id)', '_inventory.Take(id)'));
  });

  it('rejects a Bag that never answers to its own identifiers', () => {
    expectFail(
      'w9-91-flat',
      BAG_FLAT.replace(
        `if (AreYou(id))
        {
            return this;
        }
        else if`,
        'if',
      ),
    );
  });

  it('rejects a RECURSIVE Locate — the lab wants the flat one', () => {
    // This is the whole point of the week, and the one place the task sheet
    // and the Week 8 lecture disagree. Lab9.pdf: "Test that b1 can not locate
    // items in b2." If this test ever starts passing, the lesson has drifted
    // back toward the lecture and away from what is graded.
    const recursive = BAG_FLAT.replace(
      `else if (_inventory.HasItem(id))
        {
            return _inventory.Fetch(id);
        }
        else
        {
            return null;
        }`,
      `else if (_inventory.HasItem(id))
        {
            return _inventory.Fetch(id);
        }
        else
        {
            foreach (Item i in _inventory.Everything())
            {
                if (i is Bag)
                {
                    Bag b = (Bag)i;
                    GameObject found = b.Locate(id);
                    if (found != null) { return found; }
                }
            }
            return null;
        }`,
    );
    expectFail('w9-91-flat', recursive);
  });

  it('accepts the BagLocatesItems unit test', () => {
    const step = stepById('w9-91-tests');
    const ex = step.exercise as Exercise;
    const solution = ex.seed.replace(
      `    public void BagLocatesItems()
    {

    }`,
      `    public void BagLocatesItems()
    {
${BAG_LOCATES_ITEMS_TEST}
    }`,
    );
    expectPass('w9-91-tests', solution);
  });
});

// -------------------------------------------------------------- task 9.2

describe('task 9.2 — IHaveInventory', () => {
  const INTERFACE = `public interface IHaveInventory
{
    GameObject Locate(string id);
    string Name { get; }
}`;

  it('accepts the interface from the UML', () => {
    expectPass('w9-92-why', INTERFACE);
  });

  it('rejects an interface missing Name, which the look command needs', () => {
    expectFail(
      'w9-92-why',
      `public interface IHaveInventory
{
    GameObject Locate(string id);
}`,
    );
  });

  it('accepts the polymorphic loop', () => {
    expectPass(
      'w9-92-polymorphism',
      `public class Program
{
    public static void Main()
    {
        Player player = new Player("James", "an explorer");
        Bag toolBag = new Bag(new string[] { "bag", "tool" }, "Tools Bag", "A bag of tools");
        Item stew = new Item(new string[] { "stew", "beef" }, "A Beef Stew", "Hearty.");
        toolBag.Inventory.Put(stew);

        List<IHaveInventory> myContainers = new List<IHaveInventory>();
        myContainers.Add(player);
        myContainers.Add(toolBag);

        foreach (IHaveInventory c in myContainers)
        {
            GameObject found = c.Locate("stew");
            if (found == null)
            {
                Console.WriteLine(c.Name + ": nothing");
            }
            else
            {
                Console.WriteLine(c.Name + ": " + found.Name);
            }
        }
    }
}`,
    );
  });

  it('rejects a loop that iterates the concrete type instead of the contract', () => {
    expectFail(
      'w9-92-polymorphism',
      `public class Program
{
    public static void Main()
    {
        Player player = new Player("James", "an explorer");
        Bag toolBag = new Bag(new string[] { "bag", "tool" }, "Tools Bag", "A bag of tools");
        Item stew = new Item(new string[] { "stew", "beef" }, "A Beef Stew", "Hearty.");
        toolBag.Inventory.Put(stew);

        List<IHaveInventory> myContainers = new List<IHaveInventory>();
        myContainers.Add(player);
        myContainers.Add(toolBag);

        List<Bag> bags = new List<Bag>();
        bags.Add(toolBag);
        Console.WriteLine("James: nothing");
        foreach (Bag c in bags)
        {
            Console.WriteLine(c.Name + ": " + c.Locate("stew").Name);
        }
    }
}`,
    );
  });

  it('accepts IdentifierCount on IdentifiableObject, where the data lives', () => {
    const step = stepById('w9-92-verify');
    const ex = step.exercise as Exercise;
    expectPass(
      'w9-92-verify',
      ex.seed.replace(
        `    public void AddIdentifier(string id) { _identifiers.Add(id.ToLower()); }

}`,
        `    public void AddIdentifier(string id) { _identifiers.Add(id.ToLower()); }

    public int IdentifierCount { get { return _identifiers.Count; } }
}`,
      ),
    );
  });

  it('rejects an IdentifierCount with a setter', () => {
    const step = stepById('w9-92-verify');
    const ex = step.exercise as Exercise;
    expectFail(
      'w9-92-verify',
      ex.seed.replace(
        `    public void AddIdentifier(string id) { _identifiers.Add(id.ToLower()); }

}`,
        `    public void AddIdentifier(string id) { _identifiers.Add(id.ToLower()); }

    public int IdentifierCount { get { return _identifiers.Count; } set { } }
}`,
      ),
    );
  });
});

// --------------------------------------------------------------- interview

describe('the interview drill', () => {
  it('only points at steps that exist', () => {
    const ids = new Set(allSteps().map((s) => s.id));
    for (const q of week9Interview) {
      if (q.aboutStep) expect(ids.has(q.aboutStep), `${q.id} -> ${q.aboutStep}`).toBe(true);
    }
  });
});
