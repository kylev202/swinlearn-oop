/**
 * Content validation for Week 8.
 *
 * Same contract as week2-7: every exercise gets a reference solution that must
 * pass its own checks, a near-miss must fail, and every predict block's claimed
 * output is executed against the real interpreter.
 *
 * Two things this file guards that no other week does.
 *
 * **The property refactor.** `week4.ts` built `ShortDescription` and
 * `FullDescription` as methods, following the lecture transcript; both
 * Lab5.pdf and Lab8.pdf draw them as `<<readonly, property>>`. Week 8 converts
 * them, so the near-miss tests below check that leaving them as methods really
 * does fail — otherwise the step is decoration.
 *
 * **The deliberately failing nested search.** Lecture 8 makes a teaching point
 * of `Bag.Locate` not finding an item two levels down. `w8-comp-nested` asserts
 * that failure against the interpreter, so if `Fetch` ever grows recursion by
 * accident the lesson stops lying.
 */

import { describe, expect, it } from 'vitest';
import { week8, week8Interview } from '../week8';
import { runChecks } from '@/engine/checks';
import { runProgram } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { scrambleOf } from '@/tools/parsons';
import { personalize, resolveTokens } from '../personalize';
import type { Block, Exercise, Step } from '../types';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };
const TOKENS = resolveTokens(PROFILE);

function allSteps(): Step[] {
  return week8.lessons.flatMap((l) => l.steps);
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

const GAME_OBJECT_PROPERTIES = `public abstract class GameObject : IdentifiableObject
{
    protected string name;
    protected string description;

    public GameObject(string[] ids, string name, string description) : base(ids)
    {
        this.name = name;
        this.description = description;
    }

    public string Name { get { return name; } }

    public string ShortDescription
    {
        get { return name + " (" + FirstID() + ")"; }
    }

    public virtual string FullDescription
    {
        get { return description; }
    }
}`;

const PLAYER_BASE = `public class Player : GameObject
{
    private Inventory _inventory;

    public Player(string name, string desc)
        : base(new string[] { "me", "inventory" }, name, desc)
    {
        _inventory = new Inventory();
    }

    public Inventory Inventory { get { return _inventory; } }
}`;

const PLAYER_LOCATE = `public class Player : GameObject
{
    private Inventory _inventory;

    public Player(string name, string desc)
        : base(new string[] { "me", "inventory" }, name, desc)
    {
        _inventory = new Inventory();
    }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.Fetch(id);
    }
}`;

const PLAYER_FULLDESC = `public class Player : GameObject
{
    private Inventory _inventory;

    public Player(string name, string desc)
        : base(new string[] { "me", "inventory" }, name, desc)
    {
        _inventory = new Inventory();
    }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.Fetch(id);
    }

    public override string FullDescription
    {
        get
        {
            return "You are " + Name + ", " + description + ". You are carrying:" + Inventory.ItemList;
        }
    }
}`;

const PLAYER_TESTS = `public class PlayerTests
{
    private Player NewPlayer()
    {
        Player p = new Player("{{first}}", "a cautious adventurer");
        p.Inventory.Put(new Item(new string[] { "torch" }, "a brass torch", "It flickers."));
        return p;
    }

    [Test]
    public void TestPlayerIsIdentifiable()
    {
        Player p = NewPlayer();
        Assert.That(p.AreYou("me"), Is.True);
        Assert.That(p.AreYou("inventory"), Is.True);
        Assert.That(p.AreYou("dragon"), Is.False);
    }

    [Test]
    public void TestPlayerLocatesItems()
    {
        Player p = NewPlayer();
        GameObject found = p.Locate("torch");
        Assert.That(found, Is.Not.Null);
        Assert.That(found.Name, Is.EqualTo("a brass torch"));
        Assert.That(p.Inventory.HasItem("torch"), Is.True);
    }

    [Test]
    public void TestPlayerLocatesItself()
    {
        Player p = NewPlayer();
        Assert.That(p.Locate("me"), Is.EqualTo(p));
        Assert.That(p.Locate("inventory"), Is.EqualTo(p));
    }

    [Test]
    public void TestPlayerLocatesNothing()
    {
        Player p = NewPlayer();
        Assert.That(p.Locate("club"), Is.Null);
    }

    [Test]
    public void TestPlayerFullDescription()
    {
        Player p = NewPlayer();
        Assert.That(p.FullDescription.Contains("You are {{first}}, a cautious adventurer. You are carrying:"), Is.True);
        Assert.That(p.FullDescription.Contains("a brass torch (torch)"), Is.True);
    }
}`;

const INVENTORY_COMMA_LIST = `public class Inventory
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
            foreach (Item i in _items)
            {
                if (result != "") { result = result + ", "; }
                result = result + i.ShortDescription;
            }
            return result;
        }
    }
}`;

const GAME_OBJECT_SAVE = `public abstract class GameObject : IdentifiableObject
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

    public virtual void SaveObject(StreamWriter writer)
    {
        writer.WriteLine(name);
        writer.WriteLine(description);
    }

    public virtual void LoadFrom(StreamReader reader)
    {
        name = reader.ReadLine();
        description = reader.ReadLine();
    }
}`;

const PLAYER_SAVE = `public class Player : GameObject
{
    private Inventory _inventory;

    public Player(string name, string desc)
        : base(new string[] { "me", "inventory" }, name, desc)
    {
        _inventory = new Inventory();
    }

    public Inventory Inventory { get { return _inventory; } }

    /// Set by LoadFrom, so the program can display what was in the file.
    public string LoadedItems;

    public override void SaveObject(StreamWriter writer)
    {
        base.SaveObject(writer);
        writer.WriteLine(_inventory.ItemList);
    }

    public override void LoadFrom(StreamReader reader)
    {
        base.LoadFrom(reader);
        LoadedItems = reader.ReadLine();
    }
}`;

const BAG = `public class Bag : Item
{
    private Inventory _inventory;

    public Bag(string[] idents, string name, string desc) : base(idents, name, desc)
    {
        _inventory = new Inventory();
    }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.Fetch(id);
    }

    public override string FullDescription
    {
        get { return "In " + Name + " you can see: " + _inventory.ItemList; }
    }
}`;

const DEEP_FETCH = `public class Inventory
{
    private List<Item> _items = new List<Item>();

    public void Put(Item itm) { _items.Add(itm); }

    public Item Fetch(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { return i; } }
        return null;
    }

    public GameObject DeepFetch(string id)
    {
        foreach (Item i in _items)
        {
            if (i.AreYou(id)) { return i; }
            if (i is Bag)
            {
                Bag b = (Bag)i;
                GameObject found = b.Locate(id);
                if (found != null) { return found; }
            }
        }
        return null;
    }
}`;

const IHAVEINVENTORY = `public interface IHaveInventory
{
    GameObject Locate(string id);
    string Name { get; }
}

public class Player : GameObject, IHaveInventory
{
    private Inventory _inventory = new Inventory();

    public Player(string name, string desc)
        : base(new string[] { "me", "inventory" }, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.Fetch(id);
    }
}

public class Bag : Item, IHaveInventory
{
    private Inventory _inventory = new Inventory();

    public Bag(string[] idents, string name, string desc) : base(idents, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.Fetch(id);
    }
}`;

// ---------------------------------------------------------------- structure

describe('Week 8 structure', () => {
  it('every lesson has steps and every exercise has checks and hints', () => {
    for (const lesson of week8.lessons) {
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
    expect(week8.number).toBe(8);
    expect(week8.outcomes.length).toBeGreaterThanOrEqual(4);
    expect(week8.sources.length).toBeGreaterThanOrEqual(2);
    expect(week8.lessons.some((l) => l.kind === 'lab')).toBe(true);
    expect(week8.lessons.some((l) => l.kind === 'quiz')).toBe(true);
    expect(week8.lessons.some((l) => l.kind === 'interview')).toBe(true);
  });

  it('both assessed tasks carry their marks', () => {
    const labs = week8.lessons.filter((l) => l.kind === 'lab');
    expect(labs.length).toBe(2);
    for (const lab of labs) expect(lab.assessment, lab.id).toContain('2%');
  });

  it('interview questions point at steps that exist', () => {
    const ids = new Set(allSteps().map((s) => s.id));
    expect(week8Interview.length).toBeGreaterThanOrEqual(4);
    for (const q of week8Interview) {
      expect(q.lookingFor.length, q.id).toBeGreaterThanOrEqual(3);
      if (q.aboutStep) expect(ids.has(q.aboutStep), `${q.id} -> ${q.aboutStep}`).toBe(true);
    }
  });
});

// ------------------------------------------------------------------ task 8.1

describe('Task 8.1 exercises are solvable', () => {
  it('GameObject with read-only properties', () => {
    expectPass('w8-81-brief', GAME_OBJECT_PROPERTIES);
  });

  it('rejects the Week 4 shape, where both are still methods', () => {
    expectFail(
      'w8-81-brief',
      `public abstract class GameObject : IdentifiableObject
{
    protected string name;
    protected string description;

    public GameObject(string[] ids, string name, string description) : base(ids)
    {
        this.name = name;
        this.description = description;
    }

    public string Name { get { return name; } }

    public string ShortDescription()
    {
        return name + " (" + FirstID() + ")";
    }

    public virtual string FullDescription()
    {
        return description;
    }
}`,
    );
  });

  it('rejects a FullDescription property that forgot to stay virtual', () => {
    expectFail(
      'w8-81-brief',
      GAME_OBJECT_PROPERTIES.replace('public virtual string FullDescription', 'public string FullDescription'),
    );
  });

  it('Player inheriting GameObject with its own inventory', () => {
    expectPass('w8-81-player', PLAYER_BASE);
  });

  it('rejects a Player whose constructor forgets to allocate the inventory', () => {
    expectFail('w8-81-player', PLAYER_BASE.replace('        _inventory = new Inventory();\n', ''));
  });

  it('rejects a Player that passes up the wrong identifiers', () => {
    expectFail(
      'w8-81-player',
      PLAYER_BASE.replace('new string[] { "me", "inventory" }', 'new string[] { "player" }'),
    );
  });

  it('Locate finds the player, an item, or nothing', () => {
    expectPass('w8-81-locate', PLAYER_LOCATE);
  });

  it('rejects a Locate that uses Take, which would empty the inventory', () => {
    expectFail(
      'w8-81-locate',
      PLAYER_LOCATE.replace('return _inventory.Fetch(id);', 'return _inventory.Take(id);'),
    );
  });

  it('rejects a Locate that never checks the player itself', () => {
    expectFail(
      'w8-81-locate',
      PLAYER_LOCATE.replace('        if (AreYou(id)) { return this; }\n', ''),
    );
  });

  it('FullDescription in the exact words the task sheet uses', () => {
    expectPass('w8-81-fulldesc', PLAYER_FULLDESC);
  });

  it('rejects a FullDescription that leaves out the inventory', () => {
    expectFail(
      'w8-81-fulldesc',
      PLAYER_FULLDESC.replace('". You are carrying:" + Inventory.ItemList', '". You are carrying:"'),
    );
  });

  it('the five player tests', () => {
    expectPass('w8-81-tests', PLAYER_TESTS);
  });

  it('rejects tests that assert nothing', () => {
    expectFail(
      'w8-81-tests',
      PLAYER_TESTS.replace(/Assert\.That\([^;]*\);/g, 'Assert.That(true);'),
    );
  });
});

// ------------------------------------------------------------------ task 8.2

describe('Task 8.2 exercises are solvable', () => {
  it('ItemList separated by commas', () => {
    expectPass('w8-82-itemlist', INVENTORY_COMMA_LIST);
  });

  it('rejects a list that leaves a trailing separator', () => {
    expectFail(
      'w8-82-itemlist',
      INVENTORY_COMMA_LIST.replace(
        `                if (result != "") { result = result + ", "; }
                result = result + i.ShortDescription;`,
        '                result = result + i.ShortDescription + ", ";',
      ),
    );
  });

  it('rejects the Week 4 tab-and-newline format', () => {
    expectFail(
      'w8-82-itemlist',
      INVENTORY_COMMA_LIST.replace(
        `                if (result != "") { result = result + ", "; }
                result = result + i.ShortDescription;`,
        '                result = result + "\\t" + i.ShortDescription + "\\n";',
      ),
    );
  });

  it('virtual SaveObject and LoadFrom on GameObject', () => {
    expectPass('w8-82-gameobject', GAME_OBJECT_SAVE);
  });

  it('rejects save methods that are not virtual', () => {
    expectFail(
      'w8-82-gameobject',
      GAME_OBJECT_SAVE.replace('public virtual void SaveObject', 'public void SaveObject'),
    );
  });

  it('rejects a LoadFrom that reads the two lines in the wrong order', () => {
    expectFail(
      'w8-82-gameobject',
      GAME_OBJECT_SAVE.replace(
        `        name = reader.ReadLine();
        description = reader.ReadLine();`,
        `        description = reader.ReadLine();
        name = reader.ReadLine();`,
      ),
    );
  });

  it('Player overriding both, calling base first', () => {
    expectPass('w8-82-player-override', PLAYER_SAVE);
  });

  it('rejects a SaveObject that writes its own line before calling base', () => {
    expectFail(
      'w8-82-player-override',
      PLAYER_SAVE.replace(
        `        base.SaveObject(writer);
        writer.WriteLine(_inventory.ItemList);`,
        `        writer.WriteLine(_inventory.ItemList);
        base.SaveObject(writer);`,
      ),
    );
  });

  it('rejects overrides that never call base at all', () => {
    expectFail(
      'w8-82-player-override',
      PLAYER_SAVE.replace('        base.SaveObject(writer);\n', ''),
    );
  });
});

// --------------------------------------------------------------- composite

describe('Composite pattern exercises are solvable', () => {
  it('a Bag that is an Item', () => {
    expectPass('w8-comp-bag', BAG);
  });

  it('rejects a Bag that does not inherit from Item', () => {
    expectFail('w8-comp-bag', BAG.replace('public class Bag : Item', 'public class Bag'));
  });

  it('rejects a Bag whose Locate never checks its own identifiers', () => {
    expectFail('w8-comp-bag', BAG.replace('        if (AreYou(id)) { return this; }\n', ''));
  });

  it('DeepFetch searches inside nested bags', () => {
    expectPass('w8-comp-fix', DEEP_FETCH);
  });

  it('rejects a DeepFetch that is just a flat Fetch', () => {
    expectFail(
      'w8-comp-fix',
      DEEP_FETCH.replace(
        `        foreach (Item i in _items)
        {
            if (i.AreYou(id)) { return i; }
            if (i is Bag)
            {
                Bag b = (Bag)i;
                GameObject found = b.Locate(id);
                if (found != null) { return found; }
            }
        }
        return null;`,
        `        foreach (Item i in _items) { if (i.AreYou(id)) { return i; } }
        return null;`,
      ),
    );
  });

  /*
   * The commonest wrong recursion: returning whatever the first nested bag
   * says, rather than only returning it when it found something. With two
   * sibling bags that is the difference between finding the spanner and
   * giving up as soon as the food bag comes back empty.
   */
  it('rejects a DeepFetch that gives up after searching the first bag it opens', () => {
    expectFail(
      'w8-comp-fix',
      DEEP_FETCH.replace(
        `                GameObject found = b.Locate(id);
                if (found != null) { return found; }`,
        '                return b.Locate(id);',
      ),
    );
  });

  it('IHaveInventory implemented by both Player and Bag', () => {
    expectPass('w8-comp-interface', IHAVEINVENTORY);
  });

  it('rejects an interface that only Player implements', () => {
    expectFail(
      'w8-comp-interface',
      IHAVEINVENTORY.replace('public class Bag : Item, IHaveInventory', 'public class Bag : Item'),
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
    for (const lesson of week8.lessons) {
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

describe('umlSpec, code and runnable blocks are self-consistent', () => {
  it('umlSpec sources parse', () => {
    for (const block of conceptBlocks('umlSpec')) {
      expect(() => parse(block.source)).not.toThrow();
    }
  });

  it('runnable code runs clean', () => {
    const runnables = conceptBlocks('runnable');
    expect(runnables.length).toBeGreaterThan(1);
    for (const block of runnables) {
      const r = runProgram(personalize(block.code, TOKENS), { student: PROFILE });
      expect(r.error?.message ?? '', `${block.caption ?? 'runnable'} should run without error`).toBe(
        '',
      );
    }
  });

  it('the Task 8.2 demo writes the three lines the task sheet shows', () => {
    const demo = conceptBlocks('runnable').find((b) => b.code.includes('TestPlayer.txt'));
    expect(demo, 'Task 8.2 should end with a runnable round trip').toBeDefined();
    const r = runProgram(personalize(demo!.code, TOKENS), { student: PROFILE });
    expect(r.error?.message ?? '').toBe('');
    expect(r.output).toContain('Amy\na cautious adventurer\na brass torch (torch), a red gem (gem)');
    expect(r.output).toContain('read back: Amy');
  });

  it('read-only code blocks that are whole programs still parse', () => {
    for (const block of conceptBlocks('code')) {
      if (block.lang && block.lang !== 'csharp') continue;
      if (!/^\s*public\s+(abstract\s+)?(class|interface)\s/.test(block.code)) continue;
      expect(
        () => parse(personalize(block.code, TOKENS)),
        block.caption ?? 'code block',
      ).not.toThrow();
    }
  });
});

// -------------------------------------------------------------- provenance

describe('sourcing', () => {
  it('cites Quiz 8 question by question, the way earlier weeks do', () => {
    const explains = [
      ...conceptBlocks('quiz').map((b) => b.explain),
      ...conceptBlocks('predict').map((b) => b.explain),
    ].join('\n');
    const cited = new Set(Array.from(explains.matchAll(/Quiz 8 Q(\d+)/g)).map((m) => Number(m[1])));
    for (let q = 1; q <= 6; q++) {
      expect(cited.has(q), `Quiz 8 Q${q} is not used anywhere in Week 8`).toBe(true);
    }
  });

  it('tells the student the two members changed shape since Week 4', () => {
    const prose = allSteps()
      .flatMap((s) => s.blocks)
      .map((b) => ('md' in b ? `${'title' in b ? b.title ?? '' : ''} ${b.md}` : ''))
      .join('\n');
    expect(prose).toContain('readonly, property');
    expect(prose).toContain('Week 4');
  });

  it('says out loud that the nested-bag search is meant to fail', () => {
    const step = stepById('w8-comp-nested');
    const prose = step.blocks.map((b) => ('md' in b ? b.md : '')).join('\n');
    expect(`${prose} ${step.blocks.map((b) => (b.t === 'predict' ? b.explain : '')).join('\n')}`)
      .toContain('fix');
  });
});
