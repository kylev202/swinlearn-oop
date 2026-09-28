/**
 * Week 8 — SwinAdventure Iteration 5, and Good Object-Oriented Design.
 *
 * Sources: Week 8 lecture (W8a deck, 24 slides, plus the recording), Quiz 8,
 * OOP Lab8.pdf. Lecture 7's live-coded Player/save-load walkthrough is also a
 * source here — the *design* half of it is Week 7's lesson 5, and the code it
 * was building is Task 8.1/8.2, which is this week.
 *
 * Four things about the source material a future session should not have to
 * rediscover:
 *
 * 1. **The UML changed the API, and this week is where the app catches up.**
 *    Lab8.pdf's Iteration 5 diagram marks `ShortDescription` and
 *    `FullDescription` as `<<readonly, property>>`, and so — checking back —
 *    did Lab5.pdf's Iteration 4 diagram. `week4.ts` built them as *methods*,
 *    following the lecture transcript rather than the task sheet. Rather than
 *    rewrite Weeks 4 and 5 (which would break every student's saved editor
 *    contents mid-semester), Week 8 teaches the change explicitly as its first
 *    step: read the new UML, convert the two methods to read-only properties,
 *    and notice that the stereotype in the diagram was telling you all along.
 *    `ItemList` was already a property, so it is unaffected.
 * 2. **Task 8.2's file format comes from a screenshot**, not from prose.
 *    Lab8.pdf page 7 shows `TestPlayer.txt` as three lines — name,
 *    description, then the item descriptions **separated by commas** — which
 *    is why step 13 asks for `ItemList` to be reformatted. Lecture 7 adds the
 *    method names: `SaveObject(writer)` and `LoadFrom(reader)`, declared
 *    `virtual` on `GameObject` so every future subclass inherits save support.
 * 3. **Lecture 8's `Bag` is Week 9's lab, taught here.** The lecture live-codes
 *    the composite pattern and `IHaveInventory` in full, including the three
 *    unit tests and the deliberate failure of the nested-bag search. There is
 *    no Lab 9 sheet in the resources folder, so this is built from the lecture
 *    alone, and the recursive fix the lecture leaves as an exercise is built
 *    as one here.
 * 4. **The nested-bag test is *supposed* to fail.** `Inventory.HasItem` and
 *    `Fetch` only look at the identifiers of their direct contents, so an
 *    apple inside a food bag inside a tool bag cannot be found from the tool
 *    bag. The lecture uses that failure as the teaching point, so the lesson
 *    shows it failing before it shows the fix.
 *
 * Engine notes for this week:
 *   - `StreamWriter`, `StreamReader` and `File` were added to the engine while
 *     writing this week (`src/engine/fileio.ts`). Files live in a Map for the
 *     length of one run: write-then-read inside one program behaves exactly as
 *     it does on disk, and nothing survives pressing Run again. There are no
 *     `using` *statements* in this parser, so every example closes its writer
 *     by hand — which is what Lab8.pdf's own screenshots do anyway.
 *   - A `StreamReader` opened on a path nothing has written throws a catchable
 *     `FileNotFoundException`.
 *
 * Authoring note: markdown lives in template literals, so every inline-code
 * backtick must be escaped as \` — otherwise it closes the string.
 */

import type { InterviewQuestion, Week } from './types';

/*
 * The classes every Task 8.1/8.2 exercise builds on.
 *
 * Kept in one constant rather than pasted into eight harnesses, because the
 * property refactor in the first step changes them and the rest of the week
 * has to agree with it. `ShortDescription` and `FullDescription` are
 * properties here, per Lab8.pdf's Iteration 5 UML.
 */
const FOUNDATION = `public class IdentifiableObject
{
    private List<string> _identifiers = new List<string>();

    public IdentifiableObject(string[] ids)
    {
        foreach (string id in ids) { _identifiers.Add(id); }
    }

    public bool AreYou(string id) { return _identifiers.Contains(id); }
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
}`;

/**
 * The same classes once Task 8.2 step 12 has been done.
 *
 * Every exercise *after* the save methods are written needs a `GameObject`
 * that already has them, or an override in `Player` has nothing to override.
 */
const FOUNDATION_SAVE = FOUNDATION.replace(
  '    public virtual string FullDescription { get { return description; } }',
  `    public virtual string FullDescription { get { return description; } }

    public virtual void SaveObject(StreamWriter writer)
    {
        writer.WriteLine(name);
        writer.WriteLine(description);
    }

    public virtual void LoadFrom(StreamReader reader)
    {
        name = reader.ReadLine();
        description = reader.ReadLine();
    }`,
);

/** The Iteration 4 Inventory, with ItemList still in its Week 4 tabbed form. */
const INVENTORY_TABBED = `public class Inventory
{
    private List<Item> _items = new List<Item>();

    public void Put(Item itm) { _items.Add(itm); }

    public bool HasItem(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { return true; } }
        return false;
    }

    public Item Take(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { _items.Remove(i); return i; } }
        return null;
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
            foreach (Item i in _items) { result = result + "\\t" + i.ShortDescription + "\\n"; }
            return result;
        }
    }
}`;

/** The same Inventory after Task 8.2 step 13 — comma separated, no newlines. */
const INVENTORY_COMMAS = `public class Inventory
{
    private List<Item> _items = new List<Item>();

    public void Put(Item itm) { _items.Add(itm); }

    public bool HasItem(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { return true; } }
        return false;
    }

    public Item Take(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { _items.Remove(i); return i; } }
        return null;
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

export const week8: Week = {
  number: 8,
  title: 'The Player, Saving to File & Good OO Design',
  subtitle:
    'SwinAdventure Iteration 5 — a player that can find its own things and write itself to a file — plus the three rules that turn a design into a good one',
  outcomes: [
    'Read a UML stereotype and build what it actually says, not what last week\'s code happened to do',
    'Build a Player that locates itself or anything in its inventory, and prove it with five unit tests',
    'Put virtual SaveObject and LoadFrom on the base class so every subclass inherits save support',
    'Write an object to a text file with StreamWriter and read it back with StreamReader',
    'Name the four design goals, and apply laziness, anti-sociality and conformity to a real class',
    'Build the composite pattern — a Bag that is an Item — and fix the nested search it breaks',
  ],
  sources: ['Week 8 lecture (W8a slides + recording)', 'Quiz 8', 'OOP Lab8.pdf'],
  lessons: [
    // ================================================================ lesson 1
    {
      id: 'w8-81',
      title: 'Task 8.1 — the Player',
      kind: 'lab',
      minutes: 30,
      assessment: '2% of your final grade',
      summary:
        'A Player that answers to "me", carries an inventory, locates what is around it, and describes itself — with the five tests the task sheet names.',
      steps: [
        {
          id: 'w8-81-brief',
          title: 'What Iteration 5 asks for',
          blocks: [
            {
              t: 'text',
              md: `Everything this task needs already exists. \`IdentifiableObject\` handles identifiers, \`GameObject\` handles names and descriptions, \`Item\` inherits both, and \`Inventory\` manages a list of items. Iteration 5 adds **one class** — \`Player\` — and the work is almost entirely about wiring the existing pieces together the way the diagram says.`,
            },
            {
              t: 'umlSpec',
              caption: 'SwinAdventure Iteration 5 (Lab8.pdf, page 2)',
              source: `${FOUNDATION}

public class Inventory
{
    private List<Item> _items;
    public bool HasItem(string id) { return false; }
    public void Put(Item itm) { }
    public Item Take(string id) { return null; }
    public Item Fetch(string id) { return null; }
    public string ItemList { get { return ""; } }
}

public class Player : GameObject
{
    private Inventory _inventory;
    public Inventory Inventory { get { return _inventory; } }
    public GameObject Locate(string id) { return null; }
    public override string FullDescription { get { return ""; } }
}`,
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Read the stereotypes — two of these changed since Week 4',
              md: 'The diagram marks `ShortDescription` as `<<readonly, property>>` and `FullDescription` as `<<virtual, readonly, property>>`. In Week 4 you wrote both as **methods**, with brackets. The task sheet has always said property; the lecture transcript we followed said method. **The task sheet is what you are graded against**, so the first step below converts them. This is Lecture 7\'s advice in practice: when a lab hands you a design, follow it step by step rather than assuming last week still applies.',
            },
            {
              t: 'compare',
              title: 'The same member, two ways',
              left: {
                title: 'Week 4 — a method',
                tone: 'bad',
                code: `public string ShortDescription()
{
    return name + " (" + FirstID() + ")";
}

// called as:  item.ShortDescription()`,
              },
              right: {
                title: 'Iteration 5 — a read-only property',
                tone: 'good',
                code: `public string ShortDescription
{
    get { return name + " (" + FirstID() + ")"; }
}

// called as:  item.ShortDescription`,
              },
            },
            {
              t: 'quiz',
              question:
                'What does `<<readonly, property>>` next to a member name in a UML class diagram tell you to write?',
              options: [
                'A property with a get accessor and no set accessor',
                'A method that takes no parameters and returns a value',
                'A public field marked with the readonly keyword',
                'A constant, declared with const',
              ],
              answer: 0,
              why: [
                '',
                'A method would be drawn with brackets after its name — `ShortDescription()` — and no `<<property>>` stereotype.',
                'A `readonly` field can only be assigned in a constructor, and it is a field, not a computed value. This member computes its answer each time it is read.',
                'A `const` must be known at compile time. This one depends on the object\'s own name and first identifier.',
              ],
              explain:
                'Stereotypes in angle brackets are UML\'s way of saying "this member is of this kind". `<<property>>` means write it as a C# property; `<<readonly>>` means give it a `get` and no `set`. Together: `public string X { get { ... } }`.',
            },
          ],
          exercise: {
            prompt:
              'Convert ShortDescription and FullDescription on GameObject into read-only properties, keeping FullDescription virtual.',
            seed: `public abstract class GameObject : IdentifiableObject
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
            editable: { from: 14, to: 22 },
            tests: [
              {
                kind: 'structure',
                label: 'ShortDescription is a read-only property',
                rule: {
                  on: 'property',
                  inClass: 'GameObject',
                  name: 'ShortDescription',
                  hasGet: true,
                  hasSet: false,
                },
              },
              {
                kind: 'structure',
                label: 'FullDescription is a read-only property, and still virtual',
                rule: {
                  on: 'property',
                  inClass: 'GameObject',
                  name: 'FullDescription',
                  hasGet: true,
                  hasSet: false,
                  isVirtual: true,
                },
              },
              {
                kind: 'output',
                label: 'Both read without brackets and give the same answers as before',
                expect: 'a brass torch (torch)\nIt flickers in the dark.',
              },
            ],
            harness: `public class IdentifiableObject
{
    private List<string> _identifiers = new List<string>();
    public IdentifiableObject(string[] ids)
    {
        foreach (string id in ids) { _identifiers.Add(id); }
    }
    public bool AreYou(string id) { return _identifiers.Contains(id); }
    public string FirstID() { return _identifiers[0]; }
}

public class Item : GameObject
{
    public Item(string[] idents, string name, string desc) : base(idents, name, desc) { }
}

public class __Check
{
    public static void Main()
    {
        Item torch = new Item(new string[] { "torch" }, "a brass torch", "It flickers in the dark.");
        Console.WriteLine(torch.ShortDescription);
        Console.WriteLine(torch.FullDescription);
    }
}`,
            hints: [
              'A property has no brackets after its name, and its body is a `get { ... }` block.',
              'The `return` statement moves inside the `get`. Nothing else about the logic changes.',
              'public string ShortDescription { get { return name + " (" + FirstID() + ")"; } } — and the same shape for FullDescription, keeping the `virtual` keyword.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w8-81-player',
          title: 'A Player is a kind of GameObject',
          blocks: [
            {
              t: 'text',
              md: `\`Player\` inherits from \`GameObject\`, so it already has a name, a description and identifier matching. The task sheet is specific about two things it adds.

First, the **constructor takes only a name and a description** — the identifiers are not a parameter, because every player answers to the same two. It supplies them itself in the \`base\` call:`,
            },
            {
              t: 'code',
              caption: 'Lab8.pdf, page 2 — copied exactly',
              code: `public class Player : GameObject
{
    public Player(string name, string desc)
        : base(new string[] { "me", "inventory" }, name, desc)
    {
    }
}`,
            },
            {
              t: 'text',
              md: `Second, a player **has** an \`Inventory\` — one of them, created by the player and exposed read-only so other code can put things in it.

That is the association from Week 7's design lesson: a single held object, so a plain solid line with no diamond.`,
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'The field must be allocated, or nothing works',
              md: 'Declaring `private Inventory _inventory;` creates a variable, not an inventory. If the constructor forgets `_inventory = new Inventory();`, the first `Put` throws a `NullReferenceException` reported inside a class that is perfectly correct — exactly the bug you traced in Week 7.',
            },
          ],
          exercise: {
            prompt:
              'Write the Player class: inherit GameObject, pass up the "me" and "inventory" identifiers, and expose a read-only Inventory.',
            seed: `public class Player : GameObject
{

}`,
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'Player inherits from GameObject',
                rule: { on: 'class', name: 'Player', baseType: 'GameObject' },
              },
              {
                kind: 'structure',
                label: 'The constructor takes just a name and a description',
                rule: { on: 'ctor', inClass: 'Player', params: 2 },
              },
              {
                kind: 'structure',
                label: 'Inventory is a read-only property',
                rule: {
                  on: 'property',
                  inClass: 'Player',
                  name: 'Inventory',
                  hasGet: true,
                  hasSet: false,
                },
              },
              {
                kind: 'output',
                label: 'A new player answers to "me" and to "inventory", and carries nothing yet',
                expect: 'me: True\ninventory: True\ntorch: False\ncarrying nothing: True',
              },
            ],
            harness: `${FOUNDATION}

${INVENTORY_TABBED}

public class __Check
{
    public static void Main()
    {
        Player p = new Player("{{first}}", "a cautious adventurer");
        Console.WriteLine("me: " + p.AreYou("me"));
        Console.WriteLine("inventory: " + p.AreYou("inventory"));
        Console.WriteLine("torch: " + p.AreYou("torch"));
        Console.WriteLine("carrying nothing: " + (p.Inventory.ItemList == ""));
    }
}`,
            hints: [
              'Three members: a private Inventory field, a constructor, and a read-only Inventory property.',
              'The base call is copied straight from the task sheet — `: base(new string[] { "me", "inventory" }, name, desc)`.',
              'Allocate the inventory in the constructor body: `_inventory = new Inventory();`. The property is just `get { return _inventory; }`.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w8-81-locate',
          title: 'Locate — the player, or something it carries',
          blocks: [
            {
              t: 'text',
              md: `You designed this in Week 7. Now write it.

\`Locate(string id)\` returns a **\`GameObject\`**, because the answer might be the player themselves or might be an item, and \`GameObject\` is the type that covers both. It checks itself first, then delegates to its inventory.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Fetch, not Take',
              md: 'Looking at something must not remove it. One of the five required tests exists specifically to catch a `Locate` that used `Take` — it locates an item and then asserts the item is **still** in the inventory.',
            },
          ],
          exercise: {
            prompt:
              'Add Locate to Player: return this if the player matches the id, otherwise whatever the inventory can fetch.',
            seed: `public class Player : GameObject
{
    private Inventory _inventory;

    public Player(string name, string desc)
        : base(new string[] { "me", "inventory" }, name, desc)
    {
        _inventory = new Inventory();
    }

    public Inventory Inventory { get { return _inventory; } }

}`,
            editable: { from: 12, to: 12 },
            tests: [
              {
                kind: 'structure',
                label: 'Locate takes one parameter and returns a GameObject',
                rule: {
                  on: 'method',
                  inClass: 'Player',
                  name: 'Locate',
                  params: 1,
                  returns: 'GameObject',
                },
              },
              {
                kind: 'output',
                label: 'It finds the player, finds the torch, returns null for a club, and takes nothing away',
                expect: 'me -> {{first}}\ninventory -> {{first}}\ntorch -> a brass torch\nclub -> null\nstill carrying the torch: True',
              },
              {
                kind: 'forbid',
                label: 'Locate does not remove the item it found',
                pattern: '_inventory\\.Take',
                message:
                  'Take removes. Locate is a lookup — use Fetch, or locating your torch will drop it.',
              },
            ],
            harness: `${FOUNDATION}

${INVENTORY_TABBED}

public class __Check
{
    public static void Main()
    {
        Player p = new Player("{{first}}", "a cautious adventurer");
        p.Inventory.Put(new Item(new string[] { "torch" }, "a brass torch", "It flickers."));

        Console.WriteLine("me -> " + p.Locate("me").Name);
        Console.WriteLine("inventory -> " + p.Locate("inventory").Name);
        Console.WriteLine("torch -> " + p.Locate("torch").Name);

        GameObject club = p.Locate("club");
        if (club == null) { Console.WriteLine("club -> null"); }
        else { Console.WriteLine("club -> " + club.Name); }

        Console.WriteLine("still carrying the torch: " + p.Inventory.HasItem("torch"));
    }
}`,
            hints: [
              'Two statements. The first is a question the player asks itself.',
              '`AreYou(id)` is inherited all the way from IdentifiableObject — you do not need to write it.',
              'if (AreYou(id)) { return this; } and then return _inventory.Fetch(id); — Fetch already returns null when nothing matches, so you do not need a third branch.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w8-81-fulldesc',
          title: 'A description that includes what you are carrying',
          blocks: [
            {
              t: 'text',
              md: `The task sheet names the exact sentence. The player's full description contains:

> You are (the player's name), (the player's description). You are carrying:

followed by the short descriptions of the items the player has, taken from the inventory's \`ItemList\`.

This is an **override**: \`GameObject.FullDescription\` is \`virtual\`, and \`Player\` replaces it with something that combines its own information with its inventory's.`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Reaching the parent\'s members',
              md: 'The override can use `Name` and `description` directly — `Name` because it is a public property on `GameObject`, `description` because it is `protected` and a subclass may touch it. Had either been `private`, the child could not reuse it at all, which is the lecture\'s own point about why those two were not private.',
            },
          ],
          exercise: {
            prompt:
              'Override FullDescription on Player so it reads "You are NAME, DESCRIPTION. You are carrying:" followed by the inventory\'s item list.',
            seed: `public class Player : GameObject
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

}`,
            editable: { from: 18, to: 18 },
            tests: [
              {
                kind: 'structure',
                label: 'FullDescription is an overriding read-only property',
                rule: {
                  on: 'property',
                  inClass: 'Player',
                  name: 'FullDescription',
                  hasGet: true,
                  hasSet: false,
                  isOverride: true,
                },
              },
              {
                kind: 'outputContains',
                label: 'It starts with the sentence the task sheet specifies',
                expect: 'You are {{first}}, a cautious adventurer. You are carrying:',
              },
              {
                kind: 'outputContains',
                label: 'It lists the torch',
                expect: 'a brass torch (torch)',
              },
              {
                kind: 'outputContains',
                label: 'It lists the gem as well',
                expect: 'a red gem (gem)',
              },
            ],
            harness: `${FOUNDATION}

${INVENTORY_TABBED}

public class __Check
{
    public static void Main()
    {
        Player p = new Player("{{first}}", "a cautious adventurer");
        p.Inventory.Put(new Item(new string[] { "torch" }, "a brass torch", "It flickers."));
        p.Inventory.Put(new Item(new string[] { "gem" }, "a red gem", "It glows faintly."));
        Console.WriteLine(p.FullDescription);
    }
}`,
            hints: [
              'It is a property, not a method, and it needs the `override` keyword because the base one is `virtual`.',
              'Build the string in pieces: "You are ", the name, ", ", the description, ". You are carrying:".',
              'public override string FullDescription { get { return "You are " + Name + ", " + description + ". You are carrying:" + Inventory.ItemList; } }',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w8-81-tests',
          title: 'The five tests the task sheet names',
          blocks: [
            {
              t: 'text',
              md: `Lab8.pdf lists exactly five test cases for \`PlayerTest\`, and your tutor will look for all five by name.`,
            },
            {
              t: 'table',
              caption: 'Player unit tests (Lab8.pdf, page 6)',
              headers: ['Test', 'What it proves'],
              rows: [
                [
                  '**Test Player is Identifiable**',
                  'The player responds correctly to "are you" for its default identifiers, `me` and `inventory`',
                ],
                [
                  '**Test Player Locates Items**',
                  'The player can locate items in its inventory — and **the item remains in the inventory**',
                ],
                [
                  '**Test Player Locates itself**',
                  'Asked to locate "me" or "inventory", the player returns itself',
                ],
                [
                  '**Test Player Locates nothing**',
                  'Asked for something it does not have, the player returns null',
                ],
                [
                  '**Test Player Full Description**',
                  'The description contains the required sentence and the short descriptions of the items',
                ],
              ],
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'The second one is the interesting test',
              md: '"and the item remains in the player\'s inventory" is not decoration. It is the assertion that distinguishes a correct `Locate` from one that used `Take`, and it is the single most likely thing your tutor asks you to point at.',
            },
          ],
          exercise: {
            prompt:
              'Write the five PlayerTest cases. Each one needs at least one real assertion about behaviour.',
            seed: `public class PlayerTests
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
    }

    [Test]
    public void TestPlayerLocatesItems()
    {
    }

    [Test]
    public void TestPlayerLocatesItself()
    {
    }

    [Test]
    public void TestPlayerLocatesNothing()
    {
    }

    [Test]
    public void TestPlayerFullDescription()
    {
    }
}`,
            editable: { from: 10, to: 34 },
            tests: [
              {
                kind: 'nunit',
                label: 'All five of your tests pass against a correct Player',
                source: '',
              },
              {
                kind: 'forbid',
                label: 'No assertion is a hard-coded, always-true no-op',
                pattern: 'Assert\\.(That\\(\\s*true\\s*\\)|Pass\\()',
                message: 'An assertion that can never fail does not test anything.',
              },
              {
                kind: 'structure',
                label: 'Test Player Locates Items checks the item is still there afterwards',
                rule: { on: 'method', inClass: 'PlayerTests', name: 'TestPlayerLocatesItems', params: 0 },
              },
            ],
            harness: `${FOUNDATION}

${INVENTORY_TABBED}

public class Player : GameObject
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
}`,
            hints: [
              'Identifiable: assert `p.AreYou("me")` is true and something like `p.AreYou("dragon")` is false.',
              'Locates itself: `Assert.That(p.Locate("me"), Is.EqualTo(p));` — the player is the object that comes back.',
              'Locates nothing: `Assert.That(p.Locate("club"), Is.Null);`',
              'Locates items: fetch the torch, assert it is not null, and then assert `p.Inventory.HasItem("torch")` is **still** true.',
              'Full description: `Assert.That(p.FullDescription.Contains("You are"), Is.True)` and that it contains "a brass torch (torch)".',
            ],
            tool: 'tests',
          },
        },
      ],
    },

    // ================================================================ lesson 2
    {
      id: 'w8-82',
      title: 'Task 8.2 — saving the player to a file',
      kind: 'lab',
      minutes: 26,
      assessment: '2% of your final grade',
      summary:
        'Three lines of text, written with a StreamWriter and read back with a StreamReader — and why the save methods belong on GameObject rather than on Player.',
      steps: [
        {
          id: 'w8-82-format',
          title: 'What the file has to look like',
          blocks: [
            {
              t: 'text',
              md: `Task 8.2 asks for the player's information to be written to a file, and for the program to read that file back and display it. Lab8.pdf shows the result — a file called \`TestPlayer.txt\` with **three lines**.`,
            },
            {
              t: 'code',
              lang: 'text',
              caption: 'TestPlayer.txt, for a player carrying two things',
              code: `{{first}}
a cautious adventurer
a brass torch (torch), a red gem (gem)`,
            },
            {
              t: 'table',
              caption: 'Line by line',
              headers: ['Line', 'Holds', 'Written by'],
              rows: [
                ['1', 'the player\'s name', '`GameObject.SaveObject`'],
                ['2', 'the player\'s description', '`GameObject.SaveObject`'],
                ['3', 'the item descriptions, **comma separated**', '`Player.SaveObject`'],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why text and not binary',
              md: '`StreamReader`/`StreamWriter` write plain text; `BinaryReader`/`BinaryWriter` write bytes you cannot read. The lecture recommends text for this course for one reason: **you can open the file and look at it**, which is how you find out your save format is wrong. A binary file that is subtly wrong looks exactly like one that is right.',
            },
          ],
        },
        {
          id: 'w8-82-itemlist',
          title: 'Reformatting ItemList',
          blocks: [
            {
              t: 'text',
              md: `Line 3 is the inventory's item list, and the current one is the wrong shape. In Week 4 you wrote \`ItemList\` to produce one tab-indented item per line, because it was being printed to a console. A file line cannot contain newlines — that would make it several lines.

Lab8.pdf step 13 says so directly: modify \`ItemList\` so the returned list is **formatted by commas**.`,
            },
            {
              t: 'compare',
              title: 'Same data, two formats',
              left: {
                title: 'Week 4 — for the console',
                tone: 'neutral',
                code: `"\\ta brass torch (torch)\\n" +
"\\ta red gem (gem)\\n"`,
              },
              right: {
                title: 'Iteration 5 — for one file line',
                tone: 'good',
                code: `"a brass torch (torch), a red gem (gem)"`,
              },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'The separator goes between, not after',
              md: 'The easy version appends `", "` after every item and leaves a trailing comma on the end. Guard it: only add the separator when the string built so far is not empty.',
            },
          ],
          exercise: {
            prompt:
              'Rewrite ItemList so it returns the short descriptions separated by ", " with no trailing separator.',
            seed: `public class Inventory
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
            foreach (Item i in _items) { result = result + "\\t" + i.ShortDescription + "\\n"; }
            return result;
        }
    }
}`,
            editable: { from: 22, to: 26 },
            tests: [
              {
                kind: 'output',
                label: 'Two items are joined by a comma, with nothing trailing',
                expect: '[a brass torch (torch), a red gem (gem)]',
              },
              {
                kind: 'forbid',
                label: 'No tabs or newlines survive in the list',
                pattern: '\\\\t|\\\\n',
                message: 'A file line cannot contain a newline, and the format in the task sheet has no tabs.',
              },
            ],
            harness: `${FOUNDATION}

public class __Check
{
    public static void Main()
    {
        Inventory bag = new Inventory();
        bag.Put(new Item(new string[] { "torch" }, "a brass torch", "It flickers."));
        bag.Put(new Item(new string[] { "gem" }, "a red gem", "It glows faintly."));
        Console.WriteLine("[" + bag.ItemList + "]");
    }
}`,
            hints: [
              'Keep the loop. Change what gets appended, and add one condition.',
              'Before appending an item, ask whether anything has been appended already — if so, add ", " first.',
              'if (result != "") { result = result + ", "; } then result = result + i.ShortDescription;',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w8-82-gameobject',
          title: 'Save support belongs on the base class',
          blocks: [
            {
              t: 'text',
              md: `The obvious place to put "write yourself to a file" is on \`Player\`, since the player is what we are saving. The lecture argues for \`GameObject\` instead.

Name and description are \`GameObject\`'s data. If \`GameObject\` knows how to write them, then **every** subclass — \`Item\`, \`Player\`, the \`Bag\` you build later this week, anything the custom program adds — gets save support it can build on, instead of each one writing the same two lines.`,
            },
            {
              t: 'code',
              caption: 'On GameObject — the two lines every game object shares',
              code: `public virtual void SaveObject(StreamWriter writer)
{
    writer.WriteLine(name);
    writer.WriteLine(description);
}

public virtual void LoadFrom(StreamReader reader)
{
    name = reader.ReadLine();
    description = reader.ReadLine();
}`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'virtual, for the same reason as always',
              md: '`virtual` is the invitation. Without it, `Player` could not override these, and a saved player would lose its inventory line. This is the same decision as `FullDescription` — the base provides a sensible default, and the subclass extends it.',
            },
            {
              t: 'quiz',
              question:
                'Why put SaveObject on GameObject rather than writing it only on Player?',
              options: [
                'Every current and future subclass of GameObject then inherits save support it can build on',
                'Because Player is not allowed to declare methods that take a StreamWriter',
                'Because GameObject is abstract, and only abstract classes may write to files',
                'Because writing to a file is faster from a base class',
              ],
              answer: 0,
              why: [
                '',
                'Nothing restricts which parameter types a class may declare. `Player` could take a `StreamWriter` perfectly well — it just should not be the only one that can.',
                'Being abstract has nothing to do with file access. An abstract class simply cannot be instantiated.',
                'Where a method is declared has no effect on speed. This is a reuse argument, not a performance one.',
              ],
              explain:
                'The lecture is explicit: name and description are `GameObject`\'s own data, so knowing how to persist them is `GameObject`\'s own responsibility. Put it there and `Item`, `Bag` and anything the custom program adds inherit it. Put it on `Player` and the next class that needs saving starts from nothing.',
            },
          ],
          exercise: {
            prompt:
              'Add virtual SaveObject and LoadFrom to GameObject, writing and reading name then description.',
            seed: `public abstract class GameObject : IdentifiableObject
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

}`,
            editable: { from: 15, to: 15 },
            tests: [
              {
                kind: 'structure',
                label: 'SaveObject is virtual and takes one parameter',
                rule: {
                  on: 'method',
                  inClass: 'GameObject',
                  name: 'SaveObject',
                  params: 1,
                  isVirtual: true,
                },
              },
              {
                kind: 'structure',
                label: 'LoadFrom is virtual and takes one parameter',
                rule: {
                  on: 'method',
                  inClass: 'GameObject',
                  name: 'LoadFrom',
                  params: 1,
                  isVirtual: true,
                },
              },
              {
                kind: 'output',
                label: 'An item saved to a file and loaded into another comes back identical',
                expect: 'a brass torch\nIt flickers in the dark.\na brass torch\nIt flickers in the dark.',
              },
            ],
            harness: `public class IdentifiableObject
{
    private List<string> _identifiers = new List<string>();
    public IdentifiableObject(string[] ids)
    {
        foreach (string id in ids) { _identifiers.Add(id); }
    }
    public bool AreYou(string id) { return _identifiers.Contains(id); }
    public string FirstID() { return _identifiers[0]; }
}

public class Item : GameObject
{
    public Item(string[] idents, string name, string desc) : base(idents, name, desc) { }
}

public class __Check
{
    public static void Main()
    {
        Item torch = new Item(new string[] { "torch" }, "a brass torch", "It flickers in the dark.");
        Console.WriteLine(torch.Name);
        Console.WriteLine(torch.FullDescription);

        StreamWriter writer = new StreamWriter("Torch.txt");
        torch.SaveObject(writer);
        writer.Close();

        Item blank = new Item(new string[] { "torch" }, "?", "?");
        StreamReader reader = new StreamReader("Torch.txt");
        blank.LoadFrom(reader);
        reader.Close();

        Console.WriteLine(blank.Name);
        Console.WriteLine(blank.FullDescription);
    }
}`,
            hints: [
              'Two methods, two lines each, both marked `virtual`.',
              '`writer.WriteLine(name);` then the same for description. Order matters — it has to match what LoadFrom reads.',
              'LoadFrom mirrors it: `name = reader.ReadLine();` then `description = reader.ReadLine();`',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w8-82-player-override',
          title: 'Player adds its third line',
          blocks: [
            {
              t: 'text',
              md: `\`Player\` overrides both methods. Each override calls **\`base\` first** and then handles the one extra line the player has that a plain game object does not.

Calling \`base\` first is not stylistic. The file is read back in the order it was written, so if \`SaveObject\` writes name, description, items and \`LoadFrom\` reads items, name, description, every field ends up holding the wrong string.`,
            },
            {
              t: 'compare',
              title: 'The two halves have to mirror each other',
              left: {
                title: 'Player.SaveObject',
                tone: 'neutral',
                code: `public override void SaveObject(
    StreamWriter writer)
{
    base.SaveObject(writer);
    writer.WriteLine(
        _inventory.ItemList);
}`,
              },
              right: {
                title: 'Player.LoadFrom',
                tone: 'neutral',
                code: `public override void LoadFrom(
    StreamReader reader)
{
    base.LoadFrom(reader);
    string items = reader.ReadLine();
    // ... rebuild from items
}`,
              },
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Rebuilding the items is the hard half, and the task does not require it',
              md: 'Turning `"a brass torch (torch), a red gem (gem)"` back into real `Item` objects means parsing the line apart — and the short description is lossy, since it never recorded the full description. Task 8.2 only asks you to **read the file content back and display it**, so reading the line and printing it is enough. The lecture\'s suggested next step, if you want to go further for the custom program, is to serialise each item to **JSON** instead.',
            },
          ],
          exercise: {
            prompt:
              'Override SaveObject and LoadFrom on Player: call base first, then write (or read) the inventory line.',
            seed: `public class Player : GameObject
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

}`,
            editable: { from: 15, to: 15 },
            tests: [
              {
                kind: 'structure',
                label: 'SaveObject is declared with the override keyword',
                rule: {
                  on: 'method',
                  inClass: 'Player',
                  name: 'SaveObject',
                  params: 1,
                  isOverride: true,
                },
              },
              {
                kind: 'structure',
                label: 'LoadFrom is declared with the override keyword',
                rule: {
                  on: 'method',
                  inClass: 'Player',
                  name: 'LoadFrom',
                  params: 1,
                  isOverride: true,
                },
              },
              {
                kind: 'output',
                label: 'The file holds three lines, and loading them back gives the same three',
                expect:
                  '--- file ---\n{{first}}\na cautious adventurer\na brass torch (torch), a red gem (gem)\n--- loaded ---\n{{first}}\na cautious adventurer\na brass torch (torch), a red gem (gem)',
              },
              {
                kind: 'outputContains',
                label: 'The name is on the first line, so base was called before the inventory was written',
                expect: '--- file ---\n{{first}}\n',
              },
            ],
            harness: `${FOUNDATION_SAVE}

${INVENTORY_COMMAS}

public class __Check
{
    public static void Main()
    {
        Player p = new Player("{{first}}", "a cautious adventurer");
        p.Inventory.Put(new Item(new string[] { "torch" }, "a brass torch", "It flickers."));
        p.Inventory.Put(new Item(new string[] { "gem" }, "a red gem", "It glows faintly."));

        StreamWriter writer = new StreamWriter("TestPlayer.txt");
        p.SaveObject(writer);
        writer.Close();

        Console.WriteLine("--- file ---");
        Console.Write(File.ReadAllText("TestPlayer.txt"));

        Player loaded = new Player("?", "?");
        StreamReader reader = new StreamReader("TestPlayer.txt");
        loaded.LoadFrom(reader);
        reader.Close();

        Console.WriteLine("--- loaded ---");
        Console.WriteLine(loaded.Name);
        Console.WriteLine(loaded.FullDescription);
        Console.WriteLine(loaded.LoadedItems);
    }
}`,
            hints: [
              'Both overrides are two statements: the base call, then the one extra line.',
              '`base.SaveObject(writer);` has to come first, or the file lines end up in an order LoadFrom does not expect.',
              'In LoadFrom, store the third line somewhere the program can print it: `LoadedItems = reader.ReadLine();`',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w8-82-roundtrip',
          title: 'The whole round trip',
          blocks: [
            {
              t: 'text',
              md: `Run it. The program builds a player, saves it, prints the raw file so you can check the format with your own eyes, then loads it into a fresh player and prints that.`,
            },
            {
              t: 'runnable',
              caption: 'Task 8.2, end to end',
              tool: 'console',
              code: `${FOUNDATION_SAVE}

${INVENTORY_COMMAS}

public class Player : GameObject
{
    private Inventory _inventory = new Inventory();

    public Player(string name, string desc)
        : base(new string[] { "me", "inventory" }, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }
    public string LoadedItems;

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.Fetch(id);
    }

    public override string FullDescription
    {
        get
        {
            return "You are " + Name + ", " + description + ". You are carrying: " + _inventory.ItemList;
        }
    }

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
}

public class Program
{
    public static void Main()
    {
        Player p = new Player("{{first}}", "a cautious adventurer");
        p.Inventory.Put(new Item(new string[] { "torch" }, "a brass torch", "It flickers."));
        p.Inventory.Put(new Item(new string[] { "gem" }, "a red gem", "It glows faintly."));

        Console.WriteLine(p.FullDescription);
        Console.WriteLine();

        StreamWriter writer = new StreamWriter("TestPlayer.txt");
        p.SaveObject(writer);
        writer.Close();

        Console.WriteLine("TestPlayer.txt now holds:");
        Console.Write(File.ReadAllText("TestPlayer.txt"));
        Console.WriteLine();

        Player loaded = new Player("unknown", "unknown");
        StreamReader reader = new StreamReader("TestPlayer.txt");
        loaded.LoadFrom(reader);
        reader.Close();

        Console.WriteLine("read back: " + loaded.Name);
        Console.WriteLine("read back: " + loaded.LoadedItems);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'warn',
              title: 'On your own machine: check where you are before you blame the code',
              md: 'A file path with no folder in it is relative to the **working directory of the terminal**, not to where `Program.cs` lives. If your project is in `.../SwinAdventure/` and you run from the folder above it, the file is written somewhere you are not looking. Run `pwd`, `cd` into the folder that actually contains the project, and confirm with `ls`.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Files here last for one run',
              md: 'This playground keeps files in memory for the length of a single Run, so writing and then reading inside one program behaves exactly as it does on disk — and pressing Run again starts from an empty folder. Opening a `StreamReader` on a file nothing has written throws a `FileNotFoundException` you can catch.',
            },
            {
              t: 'quiz',
              question: 'Why must `Player.SaveObject` call `base.SaveObject(writer)` **before** writing its own line?',
              options: [
                'So the lines are written in the order LoadFrom will read them back',
                'Because base calls are only legal as the first statement of a method',
                'Because the StreamWriter cannot be used twice in one method',
                'So the file is closed before the inventory line is added',
              ],
              answer: 0,
              why: [
                '',
                'That restriction applies to constructor chaining, not to ordinary method bodies. `base.X()` can go anywhere.',
                'A writer can be written to as many times as you like until it is closed.',
                'Nothing closes the file here — `Close()` is called by the code that opened it, after saving is finished.',
              ],
              explain:
                'Save and load are a matched pair. `LoadFrom` calls `base.LoadFrom` first, which reads two lines, and then reads the third. If `SaveObject` wrote the item list first, loading would put the item list into `name` and the name into the items. Order in a flat text format is the format.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 3
    {
      id: 'w8-design',
      title: 'What makes a design good',
      kind: 'concept',
      minutes: 18,
      summary:
        'Four goals, three rules — lazy, antisocial, conformist — and the patterns that fall out of them.',
      steps: [
        {
          id: 'w8-design-goals',
          title: 'The four goals',
          blocks: [
            {
              t: 'text',
              md: `"Good design" is not a matter of taste. The deck names four properties a design either has or does not, and they are all about what happens **later** — when a requirement changes, when the environment changes, when something fails, when a piece is needed somewhere else.`,
            },
            {
              t: 'table',
              caption: 'Good object-oriented design, in four words',
              headers: ['Goal', 'What it means', 'Example from the deck'],
              rows: [
                [
                  '**Extensibility**',
                  'New requirements can be added without rebuilding what exists',
                  'Adding `MyLine` to ShapeDrawer changed nothing in `Drawing`',
                ],
                [
                  '**Flexibility**',
                  'The application still works when the environment changes',
                  'A calculator that reads from the keyboard **or** from a text file',
                ],
                [
                  '**Robustness**',
                  'Crashes, exceptions and unexpected conditions are handled, and explained to the user',
                  'Network failure, memory exhaustion — and, in a security context, malicious input',
                ],
                [
                  '**Modularity**',
                  'Built from small reusable pieces that can be plugged in elsewhere',
                  'One `Student` class reused across a whole system',
                ],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Knowing the destination is not knowing the route',
              md: 'The deck makes a point of this: "I want extensible, flexible, robust, modular code" tells you nothing about what to type. You need **guidelines that identify design problems**, questions to ask yourself, and familiarity with common patterns. The next three steps are the guidelines.',
            },
          ],
        },
        {
          id: 'w8-design-lazy',
          title: 'Rule 1 — classes should be lazy',
          blocks: [
            {
              t: 'text',
              md: `A lazy class does its own well-defined job and **delegates everything else**. The deck's example is a deck of cards.

- *"Deal the cards"* → that is the \`Deck\`'s job. It does it.
- *"Shuffle the cards — give me a random number"* → **"that's not my job."** Randomness depends on the operating system and the machine's own state; Windows, Linux and macOS each produce it differently. A \`Deck\` has no business knowing any of that, so it asks a random number generator.`,
            },
            {
              t: 'compare',
              title: 'Is this Card lazy enough?',
              left: {
                title: 'Card does its own drawing',
                tone: 'bad',
                code: `class Card
{
    Image _front;
    Image _back;
    Suit _suit;
    int _rank;

    void Draw();
}`,
              },
              right: {
                title: 'Drawing delegated to a widget',
                tone: 'good',
                code: `class Card
{
    Suit _suit;
    int _rank;
}

class CardWidget
{
    void Draw(Card c);
}`,
              },
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'The question to ask every time',
              md: '*Should this object even know about that?* Should a `Card` know how it is rendered — in 2D, in 3D, with which graphics library? What if the game is audio-only? Baking the answer into `Card` decides all of that permanently, for a class whose real job is to be the four of spades.',
            },
            {
              t: 'quiz',
              question: 'What does it mean for a class to be "lazy" in good OO design?',
              options: [
                'It minimises its own responsibilities and delegates tasks it does not need to own',
                'It defers all its work until the first time a method is called',
                'It avoids inheriting from other classes wherever possible',
                'It keeps its fields private so nothing else can reach them',
              ],
              answer: 0,
              why: [
                '',
                'That is lazy *initialisation* — a runtime optimisation, and a completely different idea from this design rule.',
                'Laziness says nothing about inheritance. A lazy class may well have a base class.',
                'Hiding fields is the **anti-social** rule, which is the next one.',
              ],
              explain:
                'Quiz 8 Q6. A lazy class asks "is somebody else better placed to do this?" and hands the job over if the answer is yes. It is the information-expert rule from RDD wearing a different name: the responsibility goes to whoever holds the data it needs. "Each class should play a single role."',
            },
          ],
        },
        {
          id: 'w8-design-mvc',
          title: 'Laziness at application scale — MVC',
          blocks: [
            {
              t: 'text',
              md: `Apply laziness to a whole application and you get **Model-View-Controller**, which is three classes each refusing to do the other two's work.`,
            },
            {
              t: 'table',
              caption: 'Three components, three jobs',
              headers: ['Component', 'Responsibility'],
              rows: [
                [
                  '**Model**',
                  'The data and the operations on it — fetches and prepares information, whatever the underlying storage is',
                ],
                ['**View**', 'The graphical representation of the model\'s state and available operations'],
                ['**Controller**', 'Directs user input to model operations, sometimes via the view'],
              ],
            },
            {
              t: 'quiz',
              question: 'What is the advantage of the MVC pattern?',
              options: [
                'A change in one component has minimal impact on the others',
                'It binds data, display and logic together so there is one place to look',
                'It removes the need for a database',
                'It makes the user interface render faster',
              ],
              answer: 0,
              why: [
                '',
                'That is the opposite of what MVC does, and the opposite of what makes it useful.',
                'The model still talks to whatever storage exists. MVC organises the code around it, not away from it.',
                'Rendering speed is unaffected. MVC is about where change lands, not how fast frames draw.',
              ],
              explain:
                'Quiz 8 Q3. Because each part has one clear responsibility, you can change how data is displayed without touching how it is stored, and change how it is stored without touching the screen. That is extensibility and flexibility, obtained by being lazy three times.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'The arrows are one-way',
              md: 'The deck\'s diagram is directional, not bidirectional: the user *sees* the view and *uses* the controller; the controller *manipulates* the view and *updates* the model; the model *updates* the view. Keeping the direction straight is most of what stops the three collapsing back into one.',
            },
          ],
        },
        {
          id: 'w8-design-antisocial',
          title: 'Rule 2 — classes should be antisocial',
          blocks: [
            {
              t: 'text',
              md: `An antisocial class **keeps its details to itself** and exposes only what collaborators genuinely need. Back to the deck of cards:

- *"What is the card at index 8?"* → **"none of your business."** That is internal state, and exposing it means every caller now depends on the deck being an indexable list.
- The random number generator introducing itself and explaining how it works → **"I don't care, just give me a number."** The deck depends on the *contract*, not on the collaborator's internals.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'This is what access modifiers are for',
              md: '`private` hides a member from everything, including derived classes. `protected` opens it to children only. `public` opens it to everyone. Antisocial design means choosing the most restrictive one that still works — which is why `GameObject` keeps `name` and `description` `protected` rather than `public`.',
            },
            {
              t: 'quiz',
              question: 'What is the purpose of making a class "antisocial"?',
              options: [
                'To prevent excessive communication between objects and reduce dependencies',
                'To stop other developers from reading its source code',
                'To make sure it never calls a method on another object',
                'To force every field to be accessed through a property',
              ],
              answer: 0,
              why: [
                '',
                'Nothing here is about secrecy from people. It is about what other *code* is allowed to depend on.',
                'An antisocial class still collaborates — it just keeps those collaborations few and well-defined. A class that talked to nothing would do nothing.',
                'Properties are one tool for it, but the rule is about how much you expose, not the syntax you expose it with.',
              ],
              explain:
                'Quiz 8 Q1. Fewer and narrower interactions means **lower coupling**, and lower coupling means a change to one class is far less likely to ripple out and break something unrelated. Every member you make public is a promise you have to keep.',
            },
            {
              t: 'text',
              md: `Take anti-sociality to its conclusion and you get the **Strategy pattern**. A \`Context\` holds a reference to a \`Strategy\` *interface* rather than to any particular algorithm, so concrete strategies can be swapped without the context knowing or caring which one it has.`,
            },
            {
              t: 'umlSpec',
              caption: 'The Strategy pattern',
              source: `public interface ISortStrategy
{
    void Sort(List<int> values);
}

public class BubbleSort : ISortStrategy
{
    public void Sort(List<int> values) { }
}

public class MergeSort : ISortStrategy
{
    public void Sort(List<int> values) { }
}

public class SortContext
{
    private ISortStrategy _strategy;
    public void UseStrategy(ISortStrategy s) { }
    public void Run(List<int> values) { }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Where you have already seen it',
              md: 'The deck\'s two examples are a sorting interface with selection, bubble, insertion and merge sort behind it, and a chess bot that switches between defensive, aggressive and neutral play *while the game is running*. Week 7\'s `IMusicPlayer` was the same shape.',
            },
          ],
        },
        {
          id: 'w8-design-conformist',
          title: 'Rule 3 — derived classes should be conformist',
          blocks: [
            {
              t: 'text',
              md: `A derived class should behave **consistently with what its parent promises**, so that any code written against the parent still works when handed a child. Two decks — one of playing cards, one of tarot cards — both answer *"give me the top card"* the same way. Different contents, identical contract.

The classic failure is \`Square\` inheriting from \`Rectangle\`.`,
            },
            {
              t: 'predict',
              question:
                'A test written for Rectangle sets width to 5 and height to 4 and expects an area of 20. What does it report when handed a Square?',
              code: `public class Rectangle
{
    protected int _width;
    protected int _height;

    public virtual void SetWidth(int w) { _width = w; }
    public virtual void SetHeight(int h) { _height = h; }

    public int Area { get { return _width * _height; } }
}

public class Square : Rectangle
{
    public override void SetWidth(int w)
    {
        _width = w;
        _height = w;
    }

    public override void SetHeight(int h)
    {
        _width = h;
        _height = h;
    }
}

public class Program
{
    public static void Main()
    {
        Rectangle r = new Rectangle();
        r.SetWidth(5);
        r.SetHeight(4);
        Console.WriteLine("rectangle: " + r.Area);

        Rectangle s = new Square();
        s.SetWidth(5);
        s.SetHeight(4);
        Console.WriteLine("square:    " + s.Area);
    }
}`,
              options: [
                'rectangle: 20\nsquare:    16',
                'rectangle: 20\nsquare:    20',
                'rectangle: 20\nsquare:    25',
                'It is rejected — a Square cannot override SetHeight like that',
              ],
              answer: 0,
              why: [
                '',
                'The square cannot have a width of 5 and a height of 4 at once. Something has to give, and it does.',
                'That would be the answer if `SetHeight` were ignored. It is not ignored — it sets both dimensions to 4.',
                'The overrides are perfectly legal C#. The problem is behavioural, which is why the compiler cannot warn you.',
              ],
              explain:
                'Quiz 8 Q2. `Rectangle` promises that width and height can be set **independently**. `Square` cannot keep that promise and stay a square, so it breaks a test written against its parent — which is the Liskov Substitution Principle being violated in one line. The deck\'s rule of thumb is exactly this: **if a derived class breaks a unit test written for the parent, it is not conformant.**',
              expect: { output: 'rectangle: 20\nsquare:    16' },
            },
            {
              t: 'compare',
              title: 'Two ways out, and the deck shows both',
              left: {
                title: 'Keep inheritance, preserve the invariant',
                tone: 'neutral',
                md: 'Make `Square.SetWidth` change **both** dimensions, so a square is always square. Honest about what a square is — but it still surprises anyone holding it as a `Rectangle`.',
              },
              right: {
                title: 'Switch to composition',
                tone: 'good',
                md: 'Give `Square` a `_rect: Rectangle` field instead of inheriting from one. `Square` then exposes only the one dimension it actually has, and no code can hand it to a `Rectangle` test in the first place.',
              },
            },
            {
              t: 'callout',
              tone: 'key',
              title: '"is a kind of" is necessary, not sufficient',
              md: 'A square really *is* a kind of rectangle, mathematically. That is not enough. Inheritance is a promise about **behaviour under substitution**, and the only way to check it is to ask whether the parent\'s tests still pass. When they do not, composition is usually the answer.',
            },
          ],
        },
        {
          id: 'w8-design-smells',
          title: 'Signals that something is wrong',
          blocks: [
            {
              t: 'text',
              md: `The deck ends with a checklist to run over any design, in any language. Three of the signals are worth memorising because they are so easy to spot.`,
            },
            {
              t: 'table',
              caption: 'Design smells and what they usually mean',
              headers: ['Signal', 'Usual cause', 'Usual fix'],
              rows: [
                [
                  'The same code appears in several places',
                  'A responsibility with no home',
                  'Move it to an interface, a parent class, or a utility class',
                ],
                [
                  'A long if-else or switch on an object\'s type',
                  'Behaviour that belongs to the types being tested',
                  '**Polymorphism** — one overridden method per type, dispatched automatically',
                ],
                [
                  'A very deep inheritance hierarchy',
                  'Inheritance used where composition would do',
                  'Interfaces, or composition; consider the composite pattern',
                ],
              ],
            },
            {
              t: 'quiz',
              question:
                'Which principle is commonly applied to avoid large if-else or switch statements in OO design?',
              options: [
                'Polymorphism',
                'Encapsulation',
                'Abstraction',
                'Inheritance on its own',
              ],
              answer: 0,
              why: [
                '',
                'Encapsulation hides data. It has nothing to say about a branch that tests an object\'s type.',
                'Abstraction is about deciding which details matter. It is a step before this, not the mechanism that removes the branch.',
                'Inheritance alone gives you a hierarchy; it is **overriding and dynamic dispatch** — polymorphism — that makes the branch unnecessary.',
              ],
              explain:
                'Quiz 8 Q4. Each subclass supplies its own version of a shared method, and the right one is chosen at runtime from the object\'s actual type. The type-specific logic moves into the type it belongs to, and adding a new type touches no existing code — which is exactly what happened when you added `MyLine` in Week 6.',
            },
            {
              t: 'quiz',
              question: 'Why should deep inheritance hierarchies be avoided?',
              options: [
                'They make maintenance and modification harder, because a change at the top ripples all the way down',
                'They use more memory at runtime, one copy per level',
                'C# only allows three levels of inheritance',
                'They prevent a class from implementing interfaces',
              ],
              answer: 0,
              why: [
                '',
                'Depth costs nothing at runtime — methods are not copied per level.',
                'There is no such limit. The problem is human, not technical.',
                'A class can implement as many interfaces as it likes, however deep its hierarchy is.',
              ],
              explain:
                'Quiz 8 Q5. Every extra level is another place behaviour can be overridden, inherited or subtly changed, so tracing the effect of a change near the top becomes progressively harder to reason about. Flatter hierarchies, interfaces or composition are all easier to work with.',
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'Practical size rules from the end of the deck',
              md: 'Keep classes **small** — some practitioners suggest under about 300 lines, because bigger ones are harder to debug and maintain. The class\'s role should be **evident from its name**. Its methods should support **only** that role. But do not go too far the other way: a class with one trivial method is indirection with no benefit.',
            },
          ],
        },
        {
          id: 'w8-design-recall',
          title: 'In your own words',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Name the three design rules, say what each one means in a sentence, and give a concrete example of a class that breaks it.',
              nudge:
                'One rule is about how much work a class does, one about how much it shows, and one about whether a child keeps its parent\'s promises.',
              points: [
                '**Lazy** — a class does only its own job and delegates the rest; a `Card` that also knows how to draw itself breaks it',
                '**Antisocial** — a class exposes only what collaborators need; a `Deck` that answers "what card is at index 8" breaks it',
                '**Conformist** — a child behaves consistently with what its parent promises; `Square : Rectangle` with independent width and height breaks it',
                'Laziness scaled up to a whole application gives you MVC',
                'Anti-sociality taken to its conclusion gives you the Strategy pattern',
                'The three rules together are how you get extensibility, flexibility, robustness and modularity',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 4
    {
      id: 'w8-composite',
      title: 'Bags inside bags — the composite pattern',
      kind: 'practice',
      minutes: 20,
      summary:
        'A Bag that is an Item, the nested search it quietly breaks, the recursive fix, and the IHaveInventory interface that Player and Bag share.',
      steps: [
        {
          id: 'w8-comp-idea',
          title: 'The idea',
          blocks: [
            {
              t: 'callout',
              tone: 'note',
              title: 'This is next week\'s lab, taught this week',
              md: 'The Week 8 lecture live-codes all of this. There is no task sheet for it yet, so nothing here is submitted — but it is the direct continuation of what you just built, and the design questions it raises are the ones the lecture theory was preparing you for.',
            },
            {
              t: 'text',
              md: `The **composite pattern**: an object contains other objects **of the same conceptual family**, so a container can treat its contents polymorphically as just another one of itself.

Concretely: \`Bag\` inherits from \`Item\`. A bag **is** an item. \`Inventory\` holds items. So an inventory can hold bags, and a bag's inventory can hold more bags, nested as deep as you like — without \`Inventory\` learning anything new.`,
            },
            {
              t: 'umlSpec',
              caption: 'One new class, one new line on the diagram',
              source: `public abstract class GameObject
{
    public bool AreYou(string id) { return false; }
}

public class Item : GameObject
{
}

public class Inventory
{
    private List<Item> _items;
    public void Put(Item itm) { }
    public Item Fetch(string id) { return null; }
    public bool HasItem(string id) { return false; }
}

public class Bag : Item
{
    private Inventory _inventory;
    public Inventory Inventory { get { return _inventory; } }
    public GameObject Locate(string id) { return null; }
}`,
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'Where you have met this before',
              md: 'The lecture\'s analogies: a "house tools" bag nested inside a bigger "utility tools" bag in a shopping cart; a groceries bag holding separate fruit and meat bags; an auction application containing many successful bids. Folders inside folders is the same pattern.',
            },
            {
              t: 'quiz',
              question: 'Why does `Bag` inherit from `Item` rather than just holding a list?',
              options: [
                'So a Bag can be stored in any Inventory, because an Inventory already holds Items',
                'So a Bag can be created without a constructor',
                'Because Item is an interface, and Bag needs to implement it',
                'Because inheritance is faster than composition at runtime',
              ],
              answer: 0,
              why: [
                '',
                'Every class needs a constructor, and `Bag`\'s has to pass its identifiers and name up to `Item`.',
                '`Item` is an ordinary class, not an interface. `Bag` inherits from it with the same `:` syntax either way.',
                'Neither is faster. This is a structural decision about what a bag *is*, not a performance one.',
              ],
              explain:
                'That single inheritance line is the whole pattern. Because a `Bag` **is an** `Item`, everything that already accepts an `Item` — `Inventory.Put`, `Inventory.Fetch`, the player\'s inventory — accepts a bag with no changes at all. That is extensibility bought with one keyword.',
            },
          ],
        },
        {
          id: 'w8-comp-bag',
          title: 'Building the Bag',
          blocks: [
            {
              t: 'table',
              caption: 'What Bag adds, as live-coded in the lecture',
              headers: ['Member', 'Behaviour'],
              rows: [
                [
                  '`Bag(ids, name, description)`',
                  'Passes all three straight up to the parent constructor — a bag *is* an item, so let `Item` handle its own fields — then allocates its own `Inventory`',
                ],
                [
                  '`Locate(id)`',
                  'Checks itself first; if that fails, **fetches** from its own inventory; returns null if nothing matches',
                ],
                ['`FullDescription`', 'Overrides the parent: the bag\'s own name, plus its inventory\'s item list'],
                ['`Inventory`', 'A read-only property returning the private inventory'],
              ],
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Identical in shape to Player.Locate',
              md: 'Both check themselves, then delegate to an inventory, then give up. That duplication is a signal — and it is exactly what the interface two steps from here removes.',
            },
          ],
          exercise: {
            prompt:
              'Write Bag: inherit Item, pass the constructor arguments up, allocate an Inventory, and add Locate plus a FullDescription override.',
            seed: `public class Bag : Item
{

}`,
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'Bag inherits from Item',
                rule: { on: 'class', name: 'Bag', baseType: 'Item' },
              },
              {
                kind: 'structure',
                label: 'Inventory is a read-only property',
                rule: { on: 'property', inClass: 'Bag', name: 'Inventory', hasGet: true, hasSet: false },
              },
              {
                kind: 'structure',
                label: 'FullDescription overrides the one on GameObject',
                rule: {
                  on: 'property',
                  inClass: 'Bag',
                  name: 'FullDescription',
                  hasGet: true,
                  isOverride: true,
                },
              },
              {
                kind: 'output',
                label: 'A bag can be put in an inventory, answers to its own name, and describes what it holds',
                expect:
                  'the bag is an item: True\nthe bag locates itself: True\nlocate apple in the bag: a red apple\nlocate hammer in the bag: null\nIn a food bag you can see: a red apple (apple)',
              },
            ],
            harness: `${FOUNDATION}

${INVENTORY_COMMAS}

public class __Check
{
    public static void Main()
    {
        Bag food = new Bag(new string[] { "food", "bag" }, "a food bag", "A bag for food.");
        Item apple = new Item(new string[] { "apple" }, "a red apple", "Crisp and cold.");
        food.Inventory.Put(apple);

        Inventory shelf = new Inventory();
        shelf.Put(food);
        Console.WriteLine("the bag is an item: " + shelf.HasItem("food"));
        Console.WriteLine("the bag locates itself: " + (food.Locate("bag") == food));

        GameObject found = food.Locate("apple");
        Console.WriteLine("locate apple in the bag: " + found.Name);

        GameObject missing = food.Locate("hammer");
        if (missing == null) { Console.WriteLine("locate hammer in the bag: null"); }
        else { Console.WriteLine("locate hammer in the bag: " + missing.Name); }

        Console.WriteLine(food.FullDescription);
    }
}`,
            hints: [
              'The constructor takes the same three arguments as Item and passes all three up with `: base(idents, name, desc)`.',
              'Locate is the same two statements as Player.Locate — check `AreYou(id)`, then `Fetch` from the inventory.',
              'FullDescription should read: "In " then the name, then " you can see: " then the inventory\'s ItemList.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w8-comp-nested',
          title: 'The test that is supposed to fail',
          blocks: [
            {
              t: 'text',
              md: `The lecture builds three tests for \`Bag\`. The first — a bag inside a bag, located one level deep — passes. The third does not, **and the lecture means it not to**.`,
            },
            {
              t: 'predict',
              question:
                'An apple is inside a food bag, and the food bag is inside a tool bag. What does `toolBag.Locate("apple")` return?',
              code: `${FOUNDATION}

${INVENTORY_COMMAS}

public class Bag : Item
{
    private Inventory _inventory = new Inventory();

    public Bag(string[] idents, string name, string desc) : base(idents, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.Fetch(id);
    }
}

public class Program
{
    public static void Main()
    {
        Bag tools = new Bag(new string[] { "tool" }, "a tool bag", "For tools.");
        Bag food = new Bag(new string[] { "food" }, "a food bag", "For food.");
        Item apple = new Item(new string[] { "apple" }, "a red apple", "Crisp.");

        food.Inventory.Put(apple);
        tools.Inventory.Put(food);

        GameObject oneDeep = tools.Locate("food");
        Console.WriteLine("one level deep:  " + (oneDeep == food));

        GameObject twoDeep = tools.Locate("apple");
        Console.WriteLine("two levels deep: " + (twoDeep == null ? "null" : twoDeep.Name));
    }
}`,
              options: [
                'one level deep:  True\ntwo levels deep: null',
                'one level deep:  True\ntwo levels deep: a red apple',
                'one level deep:  False\ntwo levels deep: null',
                'It crashes with a NullReferenceException on the second Locate',
              ],
              answer: 0,
              why: [
                '',
                'That is what you would want, and what the fix in the next step produces — but not what this code does.',
                'One level works fine: the food bag is directly inside the tool bag\'s inventory, so `Fetch` matches its identifier.',
                '`Fetch` returns null cleanly when nothing matches; the code tests for null before using the result.',
              ],
              explain:
                '`Inventory.Fetch` walks its own list and asks each item `AreYou(id)`. The food bag is in that list and answers to "food", so one level works. But the apple is not in the tool bag\'s list — it is inside an object that *is* in the list, and `Fetch` has no idea that some of its items are containers. **The fix is to notice when an item is itself a `Bag` and search inside it.**',
              expect: { output: 'one level deep:  True\ntwo levels deep: null' },
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why this failure is worth having',
              md: 'The composite pattern gives you nesting for free at the *storage* level — a bag goes in an inventory with no changes at all. It does **not** give you nesting for free at the *search* level. Recognising which half you got for free is the point of the exercise.',
            },
          ],
        },
        {
          id: 'w8-comp-fix',
          title: 'Searching all the way down',
          blocks: [
            {
              t: 'text',
              md: `The fix is the one the lecture describes: when walking the items, ask of each one *"is this itself a \`Bag\`?"* — and if it is, search inside it rather than treating it as opaque.

That is recursion. \`Bag.Locate\` calls \`Inventory\` search, which calls \`Bag.Locate\` on any bag it finds, which calls \`Inventory\` search again, for as many levels as there are.`,
            },
            {
              t: 'compare',
              title: 'The one question that changes everything',
              left: {
                title: 'Flat — items are opaque',
                tone: 'bad',
                code: `foreach (Item i in _items)
{
    if (i.AreYou(id)) { return i; }
}
return null;`,
              },
              right: {
                title: 'Deep — bags get searched',
                tone: 'good',
                code: `foreach (Item i in _items)
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
              },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Check the item itself before recursing into it',
              md: 'A bag answers to its own identifiers too. Ask `AreYou` first and only then look inside, or `toolBag.Locate("food")` will search the food bag for something called "food" and come back empty.',
            },
          ],
          exercise: {
            prompt:
              'Add DeepFetch to Inventory: return the matching item, looking inside any item that is itself a Bag.',
            seed: `public class Inventory
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

    }
}`,
            editable: { from: 14, to: 16 },
            tests: [
              {
                kind: 'structure',
                label: 'DeepFetch takes one parameter and returns a GameObject',
                rule: {
                  on: 'method',
                  inClass: 'Inventory',
                  name: 'DeepFetch',
                  params: 1,
                  returns: 'GameObject',
                },
              },
              {
                kind: 'output',
                label: 'It finds things one, two and three levels down, in either bag, and still returns null for what is absent',
                expect:
                  'the food bag: a food bag\nthe apple, two down: a red apple\nthe crumb, three down: a crumb\nthe spanner, in the other bag: a spanner\nthe hammer: null',
              },
            ],
            harness: `${FOUNDATION}

public class Bag : Item
{
    private Inventory _inventory = new Inventory();

    public Bag(string[] idents, string name, string desc) : base(idents, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.DeepFetch(id);
    }
}

public class __Check
{
    public static void Main()
    {
        Bag tools = new Bag(new string[] { "tool" }, "a tool bag", "For tools.");
        Bag food = new Bag(new string[] { "food" }, "a food bag", "For food.");
        Bag lunch = new Bag(new string[] { "lunch" }, "a lunch box", "For lunch.");
        Bag pouch = new Bag(new string[] { "pouch" }, "a leather pouch", "For small things.");
        Item apple = new Item(new string[] { "apple" }, "a red apple", "Crisp.");
        Item crumb = new Item(new string[] { "crumb" }, "a crumb", "Tiny.");
        Item spanner = new Item(new string[] { "spanner" }, "a spanner", "Heavy.");

        lunch.Inventory.Put(crumb);
        food.Inventory.Put(apple);
        food.Inventory.Put(lunch);
        pouch.Inventory.Put(spanner);
        tools.Inventory.Put(food);
        tools.Inventory.Put(pouch);

        Console.WriteLine("the food bag: " + tools.Locate("food").Name);
        Console.WriteLine("the apple, two down: " + tools.Locate("apple").Name);
        Console.WriteLine("the crumb, three down: " + tools.Locate("crumb").Name);
        Console.WriteLine("the spanner, in the other bag: " + tools.Locate("spanner").Name);

        GameObject hammer = tools.Locate("hammer");
        if (hammer == null) { Console.WriteLine("the hammer: null"); }
        else { Console.WriteLine("the hammer: " + hammer.Name); }
    }
}`,
            hints: [
              'Start from Fetch. Same loop, same first question — the difference is what happens when the answer is no.',
              'Use `if (i is Bag)` to find out whether an item can be looked inside, then `Bag b = (Bag)i;` to treat it as one.',
              'Ask the nested bag to `Locate(id)` for you. If it hands back something that is not null, return that; otherwise carry on with the loop and `return null;` at the end.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w8-comp-interface',
          title: 'IHaveInventory — one contract, two classes',
          blocks: [
            {
              t: 'text',
              md: `\`Player\` and \`Bag\` now have the same two capabilities: they can be asked their \`Name\`, and they can \`Locate\` something. They share no useful base class — \`Player\` is a \`GameObject\`, \`Bag\` is an \`Item\` — so the shared thing has to be an **interface**.`,
            },
            {
              t: 'code',
              caption: 'The whole interface',
              code: `public interface IHaveInventory
{
    GameObject Locate(string id);
    string Name { get; }
}`,
            },
            {
              t: 'table',
              caption: 'C# interface conventions, from the lecture',
              headers: ['Rule', 'Detail'],
              rows: [
                ['Keyword', '`interface`, where a class would say `class`'],
                ['Bodies', 'Signatures only — the implementing class supplies every body'],
                ['Naming', 'Prefixed with **`I`** — `IHaveInventory`, `ISortStrategy`'],
                ['How many', 'One base **class**, but as many **interfaces** as you like'],
                ['Properties', 'Modern C# allows property declarations, not only methods — `string Name { get; }`'],
              ],
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'Both classes already satisfy it',
              md: 'This is the pleasant part. `Player` and `Bag` already have a `Locate` and already inherit `Name` from `GameObject`, so applying the interface is literally adding `, IHaveInventory` to two class declarations. No bodies change.',
            },
          ],
          exercise: {
            prompt:
              'Declare IHaveInventory with Locate and a read-only Name, and make both Player and Bag implement it.',
            seed: `public interface IHaveInventory
{

}

public class Player : GameObject
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

public class Bag : Item
{
    private Inventory _inventory = new Inventory();

    public Bag(string[] idents, string name, string desc) : base(idents, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.Fetch(id);
    }
}`,
            tests: [
              {
                kind: 'structure',
                label: 'Player implements IHaveInventory',
                rule: { on: 'class', name: 'Player', implements: 'IHaveInventory' },
              },
              {
                kind: 'structure',
                label: 'Bag implements IHaveInventory',
                rule: { on: 'class', name: 'Bag', implements: 'IHaveInventory' },
              },
              {
                kind: 'output',
                label: 'A player and a bag sit in one List<IHaveInventory> and both answer Locate',
                expect: '{{first}} finds a brass torch\na food bag finds a red apple',
              },
            ],
            harness: `${FOUNDATION}

${INVENTORY_COMMAS}

public class __Check
{
    public static void Main()
    {
        Player p = new Player("{{first}}", "a cautious adventurer");
        p.Inventory.Put(new Item(new string[] { "torch" }, "a brass torch", "It flickers."));

        Bag food = new Bag(new string[] { "food" }, "a food bag", "For food.");
        food.Inventory.Put(new Item(new string[] { "apple" }, "a red apple", "Crisp."));

        List<IHaveInventory> containers = new List<IHaveInventory>();
        containers.Add(p);
        containers.Add(food);

        Console.WriteLine(containers[0].Name + " finds " + containers[0].Locate("torch").Name);
        Console.WriteLine(containers[1].Name + " finds " + containers[1].Locate("apple").Name);
    }
}`,
            hints: [
              'The interface body is two lines, both ending in a semicolon: a method signature and a property declaration.',
              'A read-only property in an interface is written `string Name { get; }` — the `get` with no body.',
              'Player already inherits `Name` from GameObject and already has `Locate`, so it only needs `, IHaveInventory` after `GameObject`. Bag needs `: Item, IHaveInventory`.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w8-comp-polymorphism',
          title: 'One list, two kinds of thing',
          blocks: [
            {
              t: 'text',
              md: `With the interface in place, a \`List<IHaveInventory>\` can hold players and bags side by side. Iterating it calls the right \`Locate\` for each without anything having to ask which kind it is.

When you genuinely need the concrete type — to reach a member the interface does not declare — \`is\` tests it and a cast reaches it.`,
            },
            {
              t: 'runnable',
              caption: 'Polymorphism, then a downcast where it is actually needed',
              tool: 'console',
              code: `${FOUNDATION}

${INVENTORY_COMMAS}

public interface IHaveInventory
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

    public override string FullDescription
    {
        get { return "In " + Name + " you can see: " + _inventory.ItemList; }
    }
}

public class Program
{
    public static void Main()
    {
        Player p = new Player("{{first}}", "a cautious adventurer");
        p.Inventory.Put(new Item(new string[] { "torch" }, "a brass torch", "It flickers."));

        Bag food = new Bag(new string[] { "food" }, "a food bag", "For food.");
        food.Inventory.Put(new Item(new string[] { "apple" }, "a red apple", "Crisp."));

        List<IHaveInventory> containers = new List<IHaveInventory>();
        containers.Add(p);
        containers.Add(food);

        foreach (IHaveInventory c in containers)
        {
            // No branch needed for this part: the interface is enough.
            Console.WriteLine(c.Name + " can be searched through one shared method");

            // A branch only where the concrete type really adds something.
            if (c is Bag)
            {
                Bag b = (Bag)c;
                Console.WriteLine("  ... and it is a bag: " + b.FullDescription);
            }
            else if (c is Player)
            {
                Player pl = (Player)c;
                Console.WriteLine("  ... and it is a player carrying " + pl.Inventory.ItemList);
            }
        }
    }
}`,
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'A chain of `is` checks is the smell from the last lesson',
              md: 'The downcast above is legitimate — `FullDescription` on a bag and `Inventory.ItemList` on a player are genuinely different things. But if you find yourself writing `if (c is X) ... else if (c is Y) ...` to do the *same* job differently, that is the if-else chain Quiz 8 Q4 is about. Put the method on the interface and let dispatch do it.',
            },
            {
              t: 'quiz',
              question:
                'Why can a `List<IHaveInventory>` hold both a `Player` and a `Bag`, when neither inherits from the other?',
              options: [
                'Because both implement the interface, and the list is typed by the interface rather than by a class',
                'Because C# lists are untyped and accept anything',
                'Because Player and Bag both ultimately inherit from GameObject',
                'Because the compiler converts them both to IHaveInventory objects at runtime',
              ],
              answer: 0,
              why: [
                '',
                '`List<T>` is strongly typed. A `List<IHaveInventory>` rejects anything that does not implement the interface.',
                'True of these two, but it is not the reason — the list is typed as `IHaveInventory`, and something implementing the interface without inheriting `GameObject` would be just as welcome.',
                'Nothing is converted. Each object stays exactly what it is; the interface is a type it also satisfies.',
              ],
              explain:
                'An interface is a type. Implementing it means "objects of my class can be used wherever this type is expected", and that is all a `List<IHaveInventory>` asks. This is the same subtype polymorphism as `Shape myShape = new MyRectangle()`, with a contract in place of a base class.',
            },
          ],
        },
        {
          id: 'w8-comp-recall',
          title: 'In your own words',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Explain the composite pattern using Bag and Item, and say exactly which part of "bags inside bags" you get for free and which part you have to write yourself.',
              nudge:
                'One of storing and searching came free with a single inheritance line. The other did not.',
              points: [
                'A `Bag` inherits from `Item`, so a bag **is** an item and can go anywhere an item can',
                'Storage nesting is free: `Inventory` holds `Item`s, and bags are items, so no change to `Inventory` is needed',
                'Searching is **not** free: `Fetch` only asks the direct contents their identifiers',
                'An item two levels down is invisible, because the container between them is treated as opaque',
                'The fix is to test `if (i is Bag)`, cast, and recurse into that bag\'s own search',
                'Check the item\'s own identifiers before recursing, or a bag will be searched for its own name',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 5
    {
      id: 'w8-checkpoint',
      title: 'Week 8 checkpoint',
      kind: 'quiz',
      minutes: 20,
      summary:
        'Iteration 5, file formats and the three design rules — the questions your tutor will actually ask.',
      steps: [
        {
          id: 'w8-cp-warmup',
          title: 'From memory first',
          blocks: [
            {
              t: 'text',
              md: 'Before any options are visible. The verification interview does not offer four choices either.',
            },
            {
              t: 'recall',
              prompt:
                'Name the four goals of good OO design and the three rules that get you there, then say which rule the Square/Rectangle problem breaks.',
              nudge:
                'Four goals are properties the finished thing has. Three rules are things you do while writing it.',
              points: [
                'Goals: extensibility, flexibility, robustness, modularity',
                'Rules: classes should be lazy, antisocial, and conformist',
                'Square/Rectangle breaks **conformity** — the child does not keep the parent\'s promise',
                'The signal is that a unit test written for the parent fails when handed the child',
                'The usual fix is composition — Square holds a Rectangle instead of being one',
              ],
            },
          ],
        },
        {
          id: 'w8-cp-iteration5',
          title: 'Iteration 5 details',
          blocks: [
            {
              t: 'quiz',
              question: 'Why does the Player constructor take only a name and a description?',
              options: [
                'Every player answers to the same two identifiers, so the constructor supplies them itself in the base call',
                'Identifiers are optional on a GameObject',
                'The player has no identifiers — only items do',
                'Because a constructor may take at most two parameters',
              ],
              answer: 0,
              why: [
                '',
                '`GameObject`\'s constructor requires them. `Player` does not omit them — it fills them in.',
                'The player answers to "me" and "inventory", which is precisely what the identifiers hold.',
                'There is no such limit. `GameObject`\'s own constructor takes three.',
              ],
              explain:
                '`base(new string[] { "me", "inventory" }, name, desc)` — the caller has no say in the identifiers because there is no meaningful choice to offer. Anything a caller cannot usefully vary does not belong in the parameter list.',
            },
            {
              t: 'quiz',
              question:
                'The saved file has three lines. Which method writes the third, and what is on it?',
              options: [
                'Player.SaveObject, after calling base — the inventory\'s item list, comma separated',
                'GameObject.SaveObject — the item list, since GameObject owns the name and description',
                'Inventory.SaveObject — the items write themselves',
                'Player.SaveObject, before calling base — the item list has to be first so it can be read first',
              ],
              answer: 0,
              why: [
                '',
                '`GameObject` knows nothing about an inventory. It writes only the two things it owns.',
                'There is no `Inventory.SaveObject` in this design — the player writes its inventory\'s list itself.',
                'Reading mirrors writing. `LoadFrom` calls `base` first, so `SaveObject` must call `base` first too.',
              ],
              explain:
                'Base class writes what the base class owns; the subclass calls up first and then adds its own line. Getting the order wrong does not fail loudly — it loads the item list into the name field, which is far worse than a crash.',
            },
            {
              t: 'quiz',
              question:
                'Why did ItemList have to change from tab-and-newline formatting to commas?',
              options: [
                'A newline inside the string would split one file line into several',
                'Tabs are not allowed in C# string literals',
                'Commas make the string shorter, so the file is smaller',
                'StreamWriter cannot write the tab character',
              ],
              answer: 0,
              why: [
                '',
                'Tabs are perfectly legal in a string. `\\t` was exactly what Week 4 used.',
                'File size is irrelevant here, and it is not why the task sheet asks for the change.',
                '`StreamWriter` writes any character you give it, tabs included.',
              ],
              explain:
                'The save format is line-oriented: `ReadLine` reads up to the next newline. An item list containing newlines would be read back as several lines, and everything after it would be off by one. The comma is a separator that cannot be confused with a line ending.',
            },
          ],
        },
        {
          id: 'w8-cp-design',
          title: 'The three rules',
          blocks: [
            {
              t: 'quiz',
              question:
                'A `Deck` class is asked "what is the card at index 8?" and answers. Which rule is broken?',
              options: [
                'Anti-sociality — it is exposing internal state nothing outside needs',
                'Laziness — answering the question is work it should delegate',
                'Conformity — a deck should behave like its parent class',
                'None; a deck should be able to report its own contents',
              ],
              answer: 0,
              why: [
                '',
                'The work itself is trivial and genuinely the deck\'s own. The problem is not who does it but that the answer is given at all.',
                'Conformity is about derived classes honouring a base class\'s contract. No inheritance is involved here.',
                'The moment index 8 is public, every caller depends on the deck being an indexable list — and it can never be anything else.',
              ],
              explain:
                'The deck\'s own reply in the slides is "none of your business." Exposing the internal ordering makes it part of the contract. `Deal()` is the interface a deck should have; `this[8]` is an implementation detail leaking out.',
            },
            {
              t: 'quiz',
              question:
                'You have a 40-line `switch` on an enum describing a shape kind, choosing how to draw. What does the deck suggest?',
              options: [
                'Replace it with polymorphism — one overridden Draw per shape class',
                'Split the switch across several smaller methods',
                'Convert the enum to a set of constants',
                'Move the switch into the base class so it is in one place',
              ],
              answer: 0,
              why: [
                '',
                'Smaller branches are still branches. Every new shape still edits this code.',
                'The enum is not the problem — branching on it is.',
                'Putting it in the base class makes it worse: the base now has to know about every subclass that will ever exist.',
              ],
              explain:
                'Quiz 8 Q4, and it is Week 6\'s Task 6.1 in retrospect. Once `Draw` is abstract on `Shape` and overridden per subclass, the branch disappears and adding `MyLine` touches nothing that already worked.',
            },
            {
              t: 'quiz',
              question: 'What does the Strategy pattern have a Context hold?',
              options: [
                'A reference to a Strategy interface, so concrete algorithms can be swapped in and out',
                'One instance of each concrete strategy, chosen by an if-else chain',
                'A copy of the algorithm\'s source code, compiled at runtime',
                'A base Strategy class that every algorithm inherits from',
              ],
              answer: 0,
              why: [
                '',
                'That reintroduces exactly the branching the pattern exists to remove.',
                'Nothing is compiled at runtime. The strategies are ordinary classes written ahead of time.',
                'A base class would work in some designs, but the pattern is specifically drawn with an interface — a contract, not shared implementation.',
              ],
              explain:
                'The context depends on the contract and nothing else, which is anti-sociality at its logical conclusion: it does not know, and must not care, which algorithm it has. Swapping a chess bot from defensive to aggressive play mid-game is one reference assignment.',
            },
          ],
        },
        {
          id: 'w8-cp-composite',
          title: 'Composite and interfaces',
          blocks: [
            {
              t: 'quiz',
              question:
                'A `Bag` is inside an `Inventory`. Which relationships exist between `Bag` and `Item`?',
              options: [
                'Both inheritance (a Bag is an Item) and aggregation (a Bag contains Items)',
                'Only inheritance — a Bag is a kind of Item',
                'Only aggregation — a Bag contains Items',
                'Composition — the Items die with the Bag',
              ],
              answer: 0,
              why: [
                '',
                'True but incomplete. The bag also holds items, and that line is on the diagram too.',
                'True but incomplete. The bag is *also* an item, which is the whole composite pattern.',
                'Tip out a bag and the items still exist. That is aggregation, not composition.',
              ],
              explain:
                'Two different lines between the same pair of boxes, and both are real. The inheritance line is what lets a bag be stored like an item; the aggregation line is what lets a bag hold items. The pattern is the combination.',
            },
            {
              t: 'quiz',
              question:
                'Why was `IHaveInventory` an interface rather than a common base class for Player and Bag?',
              options: [
                'They already have different base classes, and a class may inherit from only one',
                'Interfaces run faster than base classes',
                'Because neither class has any implementation to share',
                'Because a base class cannot declare a property',
              ],
              answer: 0,
              why: [
                '',
                'There is no runtime difference of that kind. The choice is structural.',
                'They do share implementation — their `Locate` bodies are near-identical. It still cannot be a base class, because the slots are taken.',
                'Base classes declare properties routinely. `GameObject.Name` is one.',
              ],
              explain:
                '`Player` is a `GameObject` and `Bag` is an `Item`; C# allows one base class, and both slots are used. Interfaces have no such limit, which is exactly what they are for: a capability shared by classes whose ancestry has nothing in common.',
            },
            {
              t: 'predict',
              question: 'What does this print?',
              code: `public interface IContainer
{
    string Describe();
}

public class Chest : IContainer
{
    public string Describe() { return "a heavy chest"; }
    public int Locks { get { return 2; } }
}

public class Sack : IContainer
{
    public string Describe() { return "a cloth sack"; }
}

public class Program
{
    public static void Main()
    {
        List<IContainer> all = new List<IContainer>();
        all.Add(new Sack());
        all.Add(new Chest());

        foreach (IContainer c in all)
        {
            string extra = "";
            if (c is Chest)
            {
                Chest ch = (Chest)c;
                extra = " with " + ch.Locks + " locks";
            }
            Console.WriteLine(c.Describe() + extra);
        }
    }
}`,
              options: [
                'a cloth sack\na heavy chest with 2 locks',
                'a cloth sack with 0 locks\na heavy chest with 2 locks',
                'a heavy chest with 2 locks\na cloth sack',
                'It is rejected — a Sack cannot go in a list of IContainer',
              ],
              answer: 0,
              why: [
                '',
                '`extra` is reset to an empty string at the top of each iteration, and the sack never enters the `is Chest` branch.',
                'The list preserves insertion order, and the sack was added first.',
                '`Sack` implements `IContainer`, so it belongs in the list as much as `Chest` does.',
              ],
              explain:
                '`Describe()` is dispatched through the interface with no branching at all — that is the polymorphic part. The `is`/cast exists only for `Locks`, which the interface does not declare, and it is the pattern the lecture shows for reaching a concrete member when you genuinely need one.',
              expect: { output: 'a cloth sack\na heavy chest with 2 locks' },
            },
          ],
        },
        {
          id: 'w8-cp-parsons',
          title: 'Assemble the save override',
          blocks: [
            {
              t: 'parsons',
              prompt: 'Rebuild Player\'s save and load overrides, in an order that round-trips.',
              lines: [
                'public class Player : GameObject',
                '{',
                '    private Inventory _inventory = new Inventory();',
                '    public string LoadedItems;',
                '    public override void SaveObject(StreamWriter writer)',
                '    {',
                '        base.SaveObject(writer);',
                '        writer.WriteLine(_inventory.ItemList);',
                '    }',
                '    public override void LoadFrom(StreamReader reader) { base.LoadFrom(reader); LoadedItems = reader.ReadLine(); }',
                '}',
              ],
              explain:
                'Each override calls `base` first and then handles its own extra line, so the two halves read and write the file in the same order. Swap either base call to the end and the name field ends up holding the item list.',
            },
          ],
        },
        {
          id: 'w8-cp-exam',
          title: 'Under interview conditions',
          blocks: [
            {
              t: 'callout',
              tone: 'key',
              title: 'Four percent, decided by explaining',
              md: 'Tasks 8.1 and 8.2 are 2% each, and both are verified in your lab by a short interview. Finishing the code is the entry ticket; the marks come from the reasons.',
            },
            {
              t: 'recall',
              prompt:
                'Out loud, in under a minute each: (1) why save support went on GameObject rather than Player; (2) why the item list had to become comma separated; (3) what a Bag being an Item buys you, and what it does not.',
              nudge:
                'Each answer is one decision plus the consequence of the alternative. If you catch yourself reading out the code, you are describing rather than explaining.',
              points: [
                'Name and description are `GameObject`\'s data, so persisting them is `GameObject`\'s responsibility',
                'Putting it there means `Item`, `Bag` and anything the custom program adds inherit save support for free',
                'The format is line-oriented, so a newline inside the item list would split one line into several',
                '`ReadLine` would then return the wrong text for every field after it, silently',
                'A `Bag` being an `Item` means any `Inventory` can store it with no changes at all — nesting for free',
                'Searching is not free: `Fetch` only asks direct contents, so nested items need a recursive `is Bag` check',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 6
    {
      id: 'w8-interview',
      title: 'Interview drill',
      kind: 'interview',
      minutes: 12,
      summary:
        'Rehearse explaining Iteration 5 and the design rules before your tutor asks for them.',
      steps: [
        {
          id: 'w8-int-1',
          title: 'Same rubric as every week',
          blocks: [
            {
              t: 'callout',
              tone: 'key',
              md: 'Finishing Tasks 8.1 and 8.2 caps you at 70%. The last 30% is explaining **why** — and this week the why is split between a design the task sheet handed you and a set of rules the lecture says every good design follows.',
            },
          ],
        },
      ],
    },
  ],
};

/** Interview questions for Week 8, asked against the student's own code. */
export const week8Interview: InterviewQuestion[] = [
  {
    id: 'w8-q1',
    question:
      'Your Week 4 code had ShortDescription as a method. Why is it a property now, and how did you know to change it?',
    lookingFor: [
      'The Iteration 5 UML marks it `<<readonly, property>>`, which means a `get` and no `set`',
      'The task sheet is the specification you are graded against, so it wins over what last week happened to do',
      'Nothing about the logic changed — only the shape of the member and how callers read it',
      'Reading stereotypes rather than skimming member names is the general lesson',
    ],
    aboutStep: 'w8-81-brief',
  },
  {
    id: 'w8-q2',
    question: 'Why does Player.Locate return a GameObject, and why does it use Fetch?',
    lookingFor: [
      'The answer may be the player themselves or an item, and `GameObject` is the type that covers both',
      'A narrower `Item` return type would make returning the player impossible',
      '`Fetch` returns the item without removing it; `Take` removes it',
      '"Test Player Locates Items" asserts the item is still in the inventory afterwards, which a `Take` would fail',
    ],
    aboutStep: 'w8-81-locate',
  },
  {
    id: 'w8-q3',
    question:
      'Why did SaveObject and LoadFrom go on GameObject rather than on Player, and why are they virtual?',
    lookingFor: [
      'Name and description are `GameObject`\'s own data, so persisting them is its own responsibility',
      'Every current and future subclass then inherits save support it can extend',
      '`virtual` is what allows `Player` to override and add the inventory line',
      'Without it, a saved player would silently lose everything it was carrying',
    ],
    aboutStep: 'w8-82-gameobject',
  },
  {
    id: 'w8-q4',
    question: 'Why does each override call base first? What breaks if it does not?',
    lookingFor: [
      'The file is read back in the order it was written, so save and load have to mirror each other',
      '`LoadFrom` calls base first, which consumes two lines, then reads the third',
      'If `SaveObject` wrote the item list first, loading would put the item list into `name`',
      'It fails silently rather than crashing, which makes it harder to spot than an exception',
    ],
    aboutStep: 'w8-82-player-override',
  },
  {
    id: 'w8-q5',
    question:
      'Explain the Square and Rectangle problem, and say which of the three design rules it breaks.',
    lookingFor: [
      '`Rectangle` promises width and height can be set independently; a `Square` cannot keep that promise',
      'It breaks **conformity** — the Liskov Substitution Principle',
      'The test is behavioural: a unit test written for the parent fails when handed the child',
      'The fix is either to preserve the invariant explicitly, or to use composition instead of inheritance',
    ],
    aboutStep: 'w8-design-conformist',
  },
  {
    id: 'w8-q6',
    question:
      'A Bag is an Item. What does that one line buy you, and what does it not?',
    lookingFor: [
      'Any `Inventory` can store a bag with no changes, because an inventory already holds items',
      'Nesting at the storage level is free — bags in bags in bags',
      'Searching is **not** free: `Fetch` only checks the identifiers of its direct contents',
      'Finding something nested needs an `is Bag` test, a cast, and a recursive search',
      'The item\'s own identifiers must be checked before recursing into it',
    ],
    aboutStep: 'w8-comp-nested',
  },
];
