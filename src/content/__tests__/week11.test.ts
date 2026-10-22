/**
 * Content validation for Week 11.
 *
 * Same contract as week2-10. Two things this file guards that no other week
 * does:
 *
 * **The bare-look branch has to come first.** A one-word command is neither 3
 * nor 5 words, so placing the new branch after the existing length check means
 * the feature silently never fires *and every older test still passes*. The
 * near-miss below puts it in the wrong place and asserts that it fails.
 *
 * **`Path` moves the player, not `MoveCommand`.** Lab11.pdf asks for it that
 * way and gives the reason — lockable paths. Lecture 10's reconstruction has
 * the command assign `player.Location` directly. Both behave identically
 * today, so no output check can tell them apart; the structure check on
 * `Path.Move` is what holds the design to the sheet.
 */

import { describe, expect, it } from 'vitest';
import { week11, week11Interview } from '../week11';
import { runChecks } from '@/engine/checks';
import { runProgram } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { personalize, resolveTokens } from '../personalize';
import type { Block, Exercise, Step } from '../types';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };
const TOKENS = resolveTokens(PROFILE);

function allSteps(): Step[] {
  return week11.lessons.flatMap((l) => l.steps);
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

/** Just enough of the cast to run a standalone search-order check. */
const FOUNDATION_FOR_ORDER = `public class IdentifiableObject
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
}

public interface IHaveInventory
{
    GameObject Locate(string id);
    string Name { get; }
}`;

const LOCATION = `public class Location : GameObject, IHaveInventory
{
    private Inventory _inventory = new Inventory();

    public Location(string[] ids, string name, string desc) : base(ids, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.Fetch(id);
    }

    public override string FullDescription
    {
        get { return "You are in " + Name + ".\\n Here, you can see :\\n" + _inventory.ItemList; }
    }
}`;

const PLAYER_WITH_LOCATION = `public class Player : GameObject, IHaveInventory
{
    private Inventory _inventory = new Inventory();
    private Location _location;

    public Player(string name, string desc)
        : base(new string[] { "me", "inventory" }, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public Location Location
    {
        get { return _location; }
        set { _location = value; }
    }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }

        Item found = _inventory.Fetch(id);
        if (found != null) { return found; }

        if (_location != null) { return _location.Locate(id); }

        return null;
    }

    public override string FullDescription
    {
        get { return "You are " + Name + ", " + description + "\\nYou are carrying:\\n" + _inventory.ItemList; }
    }
}`;

const BARE_LOOK = `        if (text.Length == 1 && text[0].ToLower() == "look")
        {
            if (p.Location != null) { return p.Location.FullDescription; }
            return "You are not anywhere.";
        }`;

const PATH = `public class Path : GameObject
{
    private Location _destination;

    public Path(string[] ids, string name, string desc, Location destination)
        : base(ids, name, desc)
    {
        _destination = destination;
    }

    public Location Destination { get { return _destination; } }

    public void Move(Player p) { p.Location = _destination; }
}`;

const MOVE = `public class MoveCommand : Command
{
    public MoveCommand() : base(new string[] { "move", "go", "head", "leave" }) { }

    public override string Execute(Player p, string[] text)
    {
        if (text.Length != 2) { return "I don't know how to move like that"; }

        if (p.Location == null) { return "You are not anywhere."; }

        Path path = p.Location.GetPath(text[1].ToLower());
        if (path == null) { return "You can't go that way."; }

        path.Move(p);
        return "You arrive at " + p.Location.Name;
    }
}`;

// ------------------------------------------------------------------- shape

describe('week 11 shape', () => {
  it('is numbered 11 and names its sources', () => {
    expect(week11.number).toBe(11);
    expect(week11.sources.join(' ')).toMatch(/Lab11\.pdf/);
  });

  it('has unique step ids', () => {
    const ids = allSteps().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks task 11.2 as the challenging one', () => {
    const t112 = week11.lessons.find((l) => l.id === 'w11-task112');
    expect(t112?.assessment).toMatch(/challenging/i);
  });

  it('parses every code and runnable block that is a whole program', () => {
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
        const ex = step.exercise as Exercise | undefined;
        let classes = ex?.harness
          ? personalize(ex.harness, TOKENS).replace(/public class __Check[\s\S]*$/, '')
          : '';
        // Predict blocks sit before their step's exercise, so whatever the
        // student is about to write is missing from the harness.
        if (!/class\s+Player\b/.test(classes)) classes += `\n\n${PLAYER_WITH_LOCATION}`;
        if (!/class\s+Path\b/.test(classes) && /\bPath\b/.test(b.code)) classes += `\n\n${PATH}`;
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

// -------------------------------------------------------------- task 11.1

describe('task 11.1 — the Location', () => {
  it('accepts the Location from the UML', () => {
    expectPass('w11-111-location', LOCATION);
  });

  it('rejects a Location that does not answer to its own identifiers', () => {
    expectFail(
      'w11-111-location',
      LOCATION.replace('if (AreYou(id)) { return this; }\n        ', ''),
    );
  });

  it('accepts the Player with a location searched last', () => {
    expectPass('w11-111-player', PLAYER_WITH_LOCATION);
  });

  it('rejects a Locate that skips the null check and crashes', () => {
    // Lecture 10 names this as the mistake it sees every year.
    expectFail(
      'w11-111-player',
      PLAYER_WITH_LOCATION.replace(
        'if (_location != null) { return _location.Locate(id); }',
        'return _location.Locate(id);',
      ),
    );
  });

  it('still finds the carried item when the location holds one with the same id', () => {
    /*
     * The sheet specifies the search *order* — self, inventory, location — but
     * with distinct identifiers every order gives the same answers, so no
     * output check can tell them apart. This is the case that can: a gem in
     * the pocket and a gem on the ground. "Inventory before location" means
     * the one you are carrying wins.
     *
     * It is asserted here rather than in the lesson's own checks because the
     * exercise harness uses distinct ids, matching the sheet's own examples.
     */
    const world = `${FOUNDATION_FOR_ORDER}

${LOCATION}

${PLAYER_WITH_LOCATION}

public class __P
{
    public static void Main()
    {
        Location swin = new Location(new string[] { "swinburne" }, "Swinburne", "A university.");
        swin.Inventory.Put(new Item(new string[] { "gem" }, "A Ground Gem", "Dusty."));

        Player p = new Player("Amy", "an explorer");
        p.Inventory.Put(new Item(new string[] { "gem" }, "A Pocket Gem", "Shiny."));
        p.Location = swin;

        Console.WriteLine(p.Locate("gem").Name);
    }
}`;
    const r = runProgram(world);
    expect(r.error?.message ?? '').toBe('');
    expect((r.output ?? '').trim()).toBe('A Pocket Gem');
  });

  it('rejects a Location property with no setter — moving needs one', () => {
    expectFail(
      'w11-111-player',
      PLAYER_WITH_LOCATION.replace(
        `    public Location Location
    {
        get { return _location; }
        set { _location = value; }
    }`,
        '    public Location Location { get { return _location; } }',
      ),
    );
  });
});

describe('task 11.1 — a bare look', () => {
  it('accepts the branch placed before the length check', () => {
    const ex = stepById('w11-111-look').exercise as Exercise;
    expectPass('w11-111-look', ex.seed.replace('\n\n        if (text.Length != 3', `\n${BARE_LOOK}\n\n        if (text.Length != 3`));
  });

  it('rejects the branch placed after the length check, where it never fires', () => {
    // The whole point of the step. A one-word command is refused by the
    // length check before it can ever reach a branch placed below it — and
    // every pre-existing test still passes, which is what makes it insidious.
    const ex = stepById('w11-111-look').exercise as Exercise;
    expectFail(
      'w11-111-look',
      ex.seed.replace(
        `        if (text.Length != 3 && text.Length != 5)
        {
            return "I don't know how to look like that";
        }`,
        `        if (text.Length != 3 && text.Length != 5)
        {
            return "I don't know how to look like that";
        }

${BARE_LOOK}`,
      ),
    );
  });

  it('rejects a branch that fires on any one-word command', () => {
    const ex = stepById('w11-111-look').exercise as Exercise;
    expectFail(
      'w11-111-look',
      ex.seed.replace(
        '\n\n        if (text.Length != 3',
        `
        if (text.Length == 1)
        {
            if (p.Location != null) { return p.Location.FullDescription; }
            return "You are not anywhere.";
        }

        if (text.Length != 3`,
      ),
    );
  });
});

// -------------------------------------------------------------- task 11.2

describe('task 11.2 — Path and the move command', () => {
  it('accepts the Path from the worked design', () => {
    expectPass('w11-112-path', PATH);
  });

  it('rejects a Path whose Destination can be reassigned', () => {
    expectFail(
      'w11-112-path',
      PATH.replace(
        'public Location Destination { get { return _destination; } }',
        'public Location Destination { get { return _destination; } set { _destination = value; } }',
      ),
    );
  });

  it('rejects a Path with no Move — the sheet requires the path to do the moving', () => {
    expectFail('w11-112-path', PATH.replace('    public void Move(Player p) { p.Location = _destination; }\n', ''));
  });

  it('accepts the move command', () => {
    expectPass('w11-112-move', MOVE);
  });

  it('rejects a move command that moves the player on an invalid direction', () => {
    // The sheet's fourth required behaviour: "players remain in the same
    // location when they leave with an invalid path identifier". Dropping the
    // null guard sends them to a null location instead of refusing.
    expectFail(
      'w11-112-move',
      MOVE.replace(`        if (path == null) { return "You can't go that way."; }\n\n`, ''),
    );
  });

  it('rejects confirming a move that reports the old location', () => {
    // `p.Location.Name` is read *after* the move, so it names where they now
    // are. Capturing it beforehand reports where they left.
    expectFail(
      'w11-112-move',
      MOVE.replace(
        `        path.Move(p);
        return "You arrive at " + p.Location.Name;`,
        `        string before = p.Location.Name;
        path.Move(p);
        return "You arrive at " + before;`,
      ),
    );
  });

  it('rejects a move command that answers to only one word', () => {
    expectFail(
      'w11-112-move',
      MOVE.replace(
        'base(new string[] { "move", "go", "head", "leave" })',
        'base(new string[] { "move" })',
      ),
    );
  });

  it('rejects skipping the no-location guard', () => {
    expectFail(
      'w11-112-move',
      MOVE.replace('        if (p.Location == null) { return "You are not anywhere."; }\n\n', ''),
    );
  });

  it('accepts the whole world, walked both ways', () => {
    const ex = stepById('w11-112-diagrams').exercise as Exercise;
    expectPass(
      'w11-112-diagrams',
      ex.seed.replace(
        `        Location cbd = new Location(new string[] { "cbd", "city" }, "The CBD", "Busy.");
`,
        `        Location cbd = new Location(new string[] { "cbd", "city" }, "The CBD", "Busy.");

        swin.AddPath(new Path(new string[] { "north" }, "North Road", "Leads north.", cbd));
        cbd.AddPath(new Path(new string[] { "south" }, "South Road", "Leads south.", swin));
`,
      ),
    );
  });

  it('rejects a one-way world, where the player cannot get back', () => {
    const ex = stepById('w11-112-diagrams').exercise as Exercise;
    expectFail(
      'w11-112-diagrams',
      ex.seed.replace(
        `        Location cbd = new Location(new string[] { "cbd", "city" }, "The CBD", "Busy.");
`,
        `        Location cbd = new Location(new string[] { "cbd", "city" }, "The CBD", "Busy.");

        swin.AddPath(new Path(new string[] { "north" }, "North Road", "Leads north.", cbd));
`,
      ),
    );
  });
});

// --------------------------------------------------------------- interview

describe('the interview drill', () => {
  it('only points at steps that exist', () => {
    const ids = new Set(allSteps().map((s) => s.id));
    for (const q of week11Interview) {
      if (q.aboutStep) expect(ids.has(q.aboutStep), `${q.id} -> ${q.aboutStep}`).toBe(true);
    }
  });
});
