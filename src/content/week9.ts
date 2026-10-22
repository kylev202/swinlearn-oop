/**
 * Week 9 — SwinAdventure Iteration 6: Bag and IHaveInventory.
 *
 * Sources: `OOP Lab9.pdf` (Tasks 9.1 and 9.2), the student's own `lab9/9.1`
 * and `lab9/9.2` source, and Lecture 8 §0 — which live-codes this same
 * material a week early. Lecture 9's GRASP theory is *not* a source for this
 * week's lessons: it went into Concept Focus instead, because no task here
 * needs it.
 *
 * Three things about the source material a future session should not have to
 * rediscover:
 *
 * 1. **The sheet and the lecture disagree about `Bag.Locate`, and the sheet
 *    wins.** Lab9.pdf page 3's "Test Bag in Bag" says, in bold, that `b1`
 *    **can not** locate items inside `b2`, and its last test turns that into a
 *    security property: a privileged item inside `b2` must stay invisible to
 *    `b1`. So `Locate` is *flat* — check yourself, check your own inventory,
 *    give up. The Week 8 lecture frames the same shallow search as a bug and
 *    leaves recursion as an exercise, which is how `week8.ts` originally
 *    taught it. `w8-comp-fix` was rewritten (2026-10-22) to teach flat as the
 *    graded answer and keep recursion as a labelled extension. Do not "fix"
 *    either file back without re-reading Lab9.pdf page 3.
 * 2. **`Bag` is built on the Week 4 `Item`, not a new one.** The sheet's UML
 *    gives `Bag(string[] ids, string name, string desc)` chaining straight to
 *    `base`, and `Item` already takes exactly that. The only new state is the
 *    private `Inventory`.
 * 3. **Task 9.2's interface is tiny on purpose.** `Locate` plus a read-only
 *    `Name`, and nothing else — because the only client that needs it is the
 *    `LookCommand` in Week 10, which needs exactly those two. The temptation
 *    to put `Inventory` on the interface is worth resisting and is covered as
 *    a quiz: exposing the container's storage would couple every caller to how
 *    containment is implemented.
 *
 * The verification task is real and is the last lesson: the tutor asks for
 * `IdentifierCount` on `IHaveInventory`, then a polymorphic list sorted by it.
 * It is in `lab9/9.2/SwinAdventure/Program.cs` and `GameObject.cs`.
 *
 * Authoring note: markdown lives in template literals, so every inline-code
 * backtick must be escaped as \` — otherwise it closes the string.
 */

import type { InterviewQuestion, Week } from './types';

/*
 * The Iteration 5 classes every Week 9 exercise starts from.
 *
 * This is where Week 8 left off: `ShortDescription` and `FullDescription` are
 * read-only properties (the Week 8 conversion), and `GameObject` is abstract.
 * `Inventory` is the comma-separated `ItemList` form Task 8.2 reformatted it
 * into, because Lab9.pdf's "Test Bag Full Description" reads the bag's
 * description straight out of it.
 */
const FOUNDATION = `public class IdentifiableObject
{
    private List<string> _identifiers = new List<string>();

    public IdentifiableObject(string[] ids)
    {
        foreach (string id in ids) { _identifiers.Add(id.ToLower()); }
    }

    public bool AreYou(string id) { return _identifiers.Contains(id.ToLower()); }
    public string FirstID() { return _identifiers[0]; }
    public void AddIdentifier(string id) { _identifiers.Add(id.ToLower()); }
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
            foreach (Item i in _items) { result = result + i.ShortDescription + ", "; }
            return result;
        }
    }
}`;

/** The finished Task 9.1 Bag, for every exercise after it is built. */
const BAG = `public class Bag : Item
{
    private Inventory _inventory;

    public Bag(string[] ids, string name, string desc) : base(ids, name, desc)
    {
        _inventory = new Inventory();
    }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        else if (_inventory.HasItem(id)) { return _inventory.Fetch(id); }
        else { return null; }
    }

    public override string FullDescription
    {
        get { return "In the " + Name + " you can see:\\n" + Inventory.ItemList; }
    }
}`;

/**
 * Bag and Player once Task 9.2 has added the interface to their headers.
 *
 * Deliberately identical to `BAG`/`PLAYER` below apart from the header: the
 * whole point of the task is that implementing the interface requires **no
 * change to either body**, and a harness that quietly rewrote them would
 * undercut the lesson that says so.
 */
const BAG_WITH_INTERFACE = `public class Bag : Item, IHaveInventory
{
    private Inventory _inventory = new Inventory();

    public Bag(string[] ids, string name, string desc) : base(ids, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        else if (_inventory.HasItem(id)) { return _inventory.Fetch(id); }
        else { return null; }
    }

    public override string FullDescription
    {
        get { return "In the " + Name + " you can see:\\n" + Inventory.ItemList; }
    }
}`;

const PLAYER_WITH_INTERFACE = `public class Player : GameObject, IHaveInventory
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

    public override string FullDescription
    {
        get { return "You are " + Name + ", " + description + "\\nYou are carrying:\\n" + _inventory.ItemList; }
    }
}`;

/** The Week 8 Player, which Task 9.2 makes implement the new interface. */
const PLAYER = `public class Player : GameObject
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

    public override string FullDescription
    {
        get { return "You are " + Name + ", " + description + "\\nYou are carrying:\\n" + _inventory.ItemList; }
    }
}`;

export const week9: Week = {
  number: 9,
  title: 'Bags and shared contracts',
  subtitle: 'SwinAdventure Iteration 6 — the composite pattern, and one interface two classes keep',
  outcomes: [
    'Build a Bag: an Item that holds its own Inventory, so bags can nest inside bags',
    'Explain why the task sheet wants a flat Locate, and what that protects',
    'Write the six Bag unit tests the sheet specifies, including the two about nesting',
    'Extract IHaveInventory so Player and Bag can be treated as one kind of thing',
    'Use a List<IHaveInventory> to hold both, and cast back only where you must',
  ],
  sources: ['OOP Lab9.pdf', 'Lecture 8 §0 (the live-coded Bag)', 'Quiz 9'],
  lessons: [
    {
      id: 'w9-task91',
      title: 'Task 9.1 — the Bag',
      kind: 'lab',
      minutes: 45,
      assessment: '2% of your final grade',
      summary:
        'An Item that holds its own Inventory, so a bag can go inside a bag. Plus the unit tests the sheet asks for — two of which are about what a bag deliberately cannot see.',
      steps: [
        {
          id: 'w9-91-brief',
          title: 'What Iteration 6 adds',
          blocks: [
            {
              t: 'text',
              md: `One class this week, and it is three lines of new state. \`Bag\` **is an** \`Item\` that also **has an** \`Inventory\`.

That one sentence is the whole composite pattern. Because a \`Bag\` is an \`Item\`, any \`Inventory\` can already store one — \`Inventory\` holds \`Item\`s and does not need to learn anything new. And because a \`Bag\` has an \`Inventory\` of its own, what it stores can include more bags.`,
            },
            {
              t: 'umlSpec',
              caption: 'Lab9.pdf page 2 — the only new box on the diagram',
              source: `public class Item : GameObject
{
}

public class Inventory
{
    public bool HasItem(string id) { return false; }
    public Item Fetch(string id) { return null; }
    public void Put(Item itm) { }
}

public class Bag : Item
{
    private Inventory _inventory;
    public Bag(string[] ids, string name, string desc) : base(ids, name, desc) { }
    public GameObject Locate(string id) { return null; }
    public Inventory Inventory { get { return _inventory; } }
}`,
            },
            {
              t: 'table',
              headers: ['Member', 'Why the sheet asks for it'],
              rows: [
                ['`- _inventory : Inventory`', 'Private. A bag owns its contents; nothing reaches in from outside.'],
                [
                  '`+ Bag(string[] ids, string name, string desc)`',
                  'Identical to `Item`’s, chained straight to `base`. The only extra work is creating the inventory.',
                ],
                [
                  '`+ Locate(string id) : GameObject`',
                  'Returns **itself** if the id is one of its own, otherwise an item from its inventory, otherwise null.',
                ],
                [
                  '`+ Inventory : Inventory <<readonly, property>>`',
                  'Read-only: callers may `Put` into the inventory they are handed, but may never swap the bag’s inventory for a different one.',
                ],
                [
                  '`+ FullDescription : string <<readonly, property>>`',
                  'Overridden, so a bag describes its contents rather than just itself.',
                ],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why Locate returns GameObject, not Item',
              md: 'Because it can return **itself** — and in Task 9.2 `Player` implements the same method and returns itself too, but a `Player` is not an `Item`. `GameObject` is the nearest type covering both. That one decision is what makes the shared interface possible next task.',
            },
            {
              t: 'quiz',
              question: 'Why does `Bag` inherit from `Item` rather than from `GameObject` directly?',
              options: [
                'So a Bag can be stored in an Inventory, which already holds Items',
                'Because GameObject is abstract and cannot be inherited from',
                'Because Item is the only class with a three-argument constructor',
                'So that Bag inherits the Inventory field from Item',
              ],
              answer: 0,
              why: [
                '',
                'Abstract classes are *made* to be inherited from — `Item` itself inherits from `GameObject`.',
                '`GameObject` has one too, and `Bag` chains through `Item` to it.',
                '`Item` has no inventory. The field is new in `Bag`.',
              ],
              explain:
                'The nesting comes free from the inheritance. `Inventory.Put(Item)` accepts a bag without a single change, because a bag genuinely is an item.',
            },
          ],
        },
        {
          id: 'w9-91-flat',
          title: 'The flat search, and what it protects',
          blocks: [
            {
              t: 'callout',
              tone: 'warn',
              title: 'If you did Week 8, read this carefully',
              md: 'Week 8’s lecture built this same `Bag` and treated the shallow search as a **bug**, leaving recursion as an exercise. Lab 9 treats it as the **specification**. The sheet’s own test says so in bold:\n\n> *Test Bag in Bag — ... Test that b1 **can not** locate items in b2.*\n\nFlat is what you submit.',
            },
            {
              t: 'text',
              md: `\`Locate\` asks three questions, in order, and stops at the first yes:

1. **Are you me?** \`AreYou(id)\` → return \`this\`.
2. **Do I hold it directly?** \`_inventory.HasItem(id)\` → return \`_inventory.Fetch(id)\`.
3. Otherwise → \`null\`.

Step 2 is the flat part. \`HasItem\` and \`Fetch\` only compare the identifiers of their **direct** contents, so a bag inside this bag is checked as *an item called "food"* — not opened and searched.`,
            },
            {
              t: 'compare',
              title: 'What a flat Locate can and cannot see',
              left: {
                title: 'Can see',
                tone: 'good',
                md: 'Its **own** identifiers — `b1.Locate("bag")` returns `b1`.\n\nAnything **directly** in its inventory, including a nested bag *as an object*: `b1.Locate("food")` returns `b2`.',
              },
              right: {
                title: 'Cannot see',
                tone: 'bad',
                md: 'Anything inside a bag it contains. `b1.Locate("stew")` is `null`, even though the stew is in `b2` and `b2` is in `b1`.\n\nTo reach the stew you must go through `b2` yourself.',
              },
            },
            {
              t: 'text',
              md: `**This is a feature, and the sheet’s last test proves it.** "Test Bag in Bag with a privileged item" puts an item into \`b2\`, escalates its privilege, and then requires that \`b1\` **still cannot find it**.

A bag you are holding is not a bag you have opened. In Week 10 the player descends one container at a time — \`look at stew in food\` — and that is where nesting gets explored. If \`Locate\` searched the whole tree, holding the outer bag would be enough to reach everything inside it, privilege escalation and all.`,
            },
            {
              t: 'predict',
              question: 'Three bags, one item, flat Locate. What does this print?',
              code: `Bag b1 = new Bag(new string[] { "bag", "tool" }, "Tool Bag", "Tools.");
Bag b2 = new Bag(new string[] { "food" }, "Food Bag", "Food.");
Item stew = new Item(new string[] { "stew" }, "A Beef Stew", "Hearty.");

b2.Inventory.Put(stew);
b1.Inventory.Put(b2);

Console.WriteLine(b1.Locate("food").Name);
Console.WriteLine(b1.Locate("stew") == null);
Console.WriteLine(b2.Locate("stew").Name);`,
              options: [
                'Food Bag\nTrue\nA Beef Stew',
                'Food Bag\nFalse\nA Beef Stew',
                'Food Bag\nA Beef Stew\nA Beef Stew',
                'It crashes on the second line with a null reference',
              ],
              answer: 0,
              why: [
                '',
                'That would be the recursive version — `b1` finding something two levels down.',
                'Same again: a flat `Locate` returns `null` there, and `.Name` is never reached because the comparison is to `null` itself.',
                'The comparison `b1.Locate("stew") == null` is safe precisely because nothing is dereferenced.',
              ],
              explain:
                '`b1` finds `b2` because `b2` is directly in its inventory. It cannot find the stew, because reaching it would mean opening `b2` — which flat `Locate` never does. Ask `b2` yourself and it answers immediately.',
              expect: { output: 'Food Bag\nTrue\nA Beef Stew' },
            },
          ],
          exercise: {
            prompt:
              'Write the Bag class from the UML: the private Inventory, the constructor chaining to base, the read-only Inventory property, the flat Locate, and the overridden FullDescription.',
            seed: `public class Bag : Item
{

}`,
            editable: { from: 2, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'Bag has a private Inventory field',
                rule: { on: 'field', inClass: 'Bag', name: '_inventory', visibility: 'private' },
              },
              {
                kind: 'structure',
                label: 'Locate takes one parameter and returns a GameObject',
                rule: {
                  on: 'method',
                  inClass: 'Bag',
                  name: 'Locate',
                  params: 1,
                  returns: 'GameObject',
                },
              },
              {
                kind: 'structure',
                label: 'Inventory is a read-only property — a getter and no setter',
                rule: {
                  on: 'property',
                  inClass: 'Bag',
                  name: 'Inventory',
                  hasGet: true,
                  hasSet: false,
                },
              },
              {
                kind: 'output',
                label:
                  'It locates itself, its own items and a nested bag — and returns null for anything inside that nested bag',
                expect:
                  'itself: Tool Bag\nown item: A Hammer\nnested bag: Food Bag\ninside the nested bag: True\nb2 can: A Beef Stew\nabsent: True\nIn the Tool Bag you can see:\nA Hammer (hammer), Food Bag (food), ',
              },
            ],
            harness: `${FOUNDATION}

public class __Check
{
    public static void Main()
    {
        Bag b1 = new Bag(new string[] { "bag", "tool" }, "Tool Bag", "A bag of tools.");
        Bag b2 = new Bag(new string[] { "food", "lunch" }, "Food Bag", "A bag of food.");
        Item hammer = new Item(new string[] { "hammer" }, "A Hammer", "Heavy.");
        Item stew = new Item(new string[] { "stew", "beef" }, "A Beef Stew", "Hearty.");

        b1.Inventory.Put(hammer);
        b2.Inventory.Put(stew);
        b1.Inventory.Put(b2);

        Console.WriteLine("itself: " + b1.Locate("bag").Name);
        Console.WriteLine("own item: " + b1.Locate("hammer").Name);
        Console.WriteLine("nested bag: " + b1.Locate("food").Name);
        Console.WriteLine("inside the nested bag: " + (b1.Locate("stew") == null));
        Console.WriteLine("b2 can: " + b2.Locate("stew").Name);
        Console.WriteLine("absent: " + (b1.Locate("sword") == null));
        Console.WriteLine(b1.FullDescription);
    }
}`,
            hints: [
              'The constructor takes the same three parameters as `Item` and passes all three to `base(ids, name, desc)`. Its only body is `_inventory = new Inventory();`.',
              '`Inventory` is a read-only property: `public Inventory Inventory { get { return _inventory; } }`. No setter at all.',
              '`Locate` is three branches: `if (AreYou(id)) return this;` then `else if (_inventory.HasItem(id)) return _inventory.Fetch(id);` then `else return null;`.',
              'FullDescription needs `override`, and its text is `"In the " + Name + " you can see:\\n" + Inventory.ItemList`.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w9-91-tests',
          title: 'The Bag unit tests',
          blocks: [
            {
              t: 'text',
              md: 'Lab9.pdf page 3 names six tests and page 4 gives the fixture: two bags (`_testToolBag`, `_testFoodBag`) and two items (`_testItem1`, `_testItem2`), built fresh in `[SetUp]`.',
            },
            {
              t: 'table',
              headers: ['Test', 'What it asserts'],
              rows: [
                ['`BagLocatesItems`', 'An item put in the bag is found, **and is still in the bag afterwards** — `Locate` uses `Fetch`, not `Take`'],
                ['`BagLocatesItself`', 'Asked for one of its own identifiers, the bag returns itself'],
                ['`BagLocatesNothing`', 'Asked for something absent, it returns null'],
                ['`BagFullDescription`', 'Contains "In the …  you can see:" and the short descriptions of its items'],
                ['`BaginBag`', '`b1` finds `b2`; `b1` finds its own items; `b1` **cannot** find items in `b2`'],
                ['`BagPreviledItem`', 'A privileged item in `b2` stays invisible to `b1`'],
              ],
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'The first test has a second half people skip',
              md: '"this returns items the bag has **and the item remains in the bag’s inventory**". Assert both: that `Locate` returned the item, *and* that a second `Locate` still finds it. A `Locate` built on `Take` passes the first assertion and fails the second.',
            },
            {
              t: 'code',
              caption: 'The two nesting tests, from lab9/9.2/SwinAdventureTest/BagTests.cs',
              code: `[Test]
public void BaginBag()
{
    _testToolBag.Inventory.Put(_testFoodBag);

    Assert.Multiple(() =>
    {
        Assert.That(_testToolBag.Locate("food"), Is.SameAs(_testFoodBag));
        Assert.That(_testToolBag.Locate("hammer"), Is.SameAs(_testItem1));
        Assert.That(_testToolBag.Locate("stew"), Is.Null);
    });
}

[Test]
public void BagPreviledItem()
{
    Item privilegedItem = new Item(new string[] { "gem", "ruby" }, "A Red Gem", "A rare red gem");
    privilegedItem.PrivilegeEscalation("5390");

    _testFoodBag.Inventory.Put(privilegedItem);
    _testToolBag.Inventory.Put(_testFoodBag);

    Assert.Multiple(() =>
    {
        Assert.That(_testFoodBag.Locate("en310"), Is.SameAs(privilegedItem));
        Assert.That(_testToolBag.Locate("en310"), Is.Null);
    });
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Is.SameAs, not Is.EqualTo',
              md: '`Is.SameAs` asserts it is the *same object*, not merely an equal one. For a `Locate` that is supposed to hand back the very thing you put in, that is the stronger and more honest assertion.',
            },
          ],
          exercise: {
            prompt:
              'Write BagLocatesItems: put the hammer in the tool bag, assert Locate returns that same object, then assert it is still findable afterwards.',
            seed: `[TestFixture]
public class BagTests
{
    private Bag _testToolBag;
    private Item _testItem1;

    [SetUp]
    public void Setup()
    {
        _testToolBag = new Bag(new string[] { "bag", "tool" }, "Tool Bag", "A bag of tools.");
        _testItem1 = new Item(new string[] { "hammer" }, "A Hammer", "Heavy.");
    }

    [Test]
    public void BagLocatesItems()
    {

    }
}`,
            editable: { from: 17, to: 18 },
            tests: [
              {
                kind: 'nunit',
                label: 'The test passes against a correct Bag',
                source: `${FOUNDATION}

${BAG}`,
              },
              {
                kind: 'forbid',
                label: 'Assert on Bag.Locate, not on the inventory directly',
                pattern: 'Inventory\\s*\\.\\s*Fetch',
                message:
                  'The test is about `Bag.Locate`. Asserting on `Inventory.Fetch` tests the inventory instead, and would still pass if `Locate` were broken.',
              },
            ],
            hints: [
              'Put the item in first: `_testToolBag.Inventory.Put(_testItem1);`.',
              'Then `Assert.That(_testToolBag.Locate("hammer"), Is.SameAs(_testItem1));`.',
              'For the second half, assert again *after* that first call. A second `Locate` returning the same object proves nothing was removed.',
            ],
            tool: 'tests',
          },
        },
      ],
    },
    {
      id: 'w9-task92',
      title: 'Task 9.2 — IHaveInventory',
      kind: 'lab',
      minutes: 40,
      assessment: '2% of your final grade',
      summary:
        'Two classes already do the same job. Name that job, and the code that uses them stops caring which one it has.',
      steps: [
        {
          id: 'w9-92-why',
          title: 'The duplication that is asking for a name',
          blocks: [
            {
              t: 'text',
              md: `Look at what you have just built next to what Week 8 built.

Both \`Player\` and \`Bag\` hold items. Both answer \`Locate(string id)\` by checking themselves first and then their inventory. Both have a \`Name\`. Neither knows about the other, and they share no parent — \`Player\` extends \`GameObject\`, \`Bag\` extends \`Item\`.`,
            },
            {
              t: 'compare',
              title: 'The same two members, in two unrelated classes',
              left: {
                title: 'Player : GameObject',
                tone: 'neutral',
                code: `public GameObject Locate(string id)
{
    if (AreYou(id)) { return this; }
    return _inventory.Fetch(id);
}

public string Name { get { return name; } }`,
              },
              right: {
                title: 'Bag : Item',
                tone: 'neutral',
                code: `public GameObject Locate(string id)
{
    if (AreYou(id)) { return this; }
    else if (_inventory.HasItem(id)) { ... }
    else { return null; }
}

public string Name { get { return name; } }`,
              },
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'This is the gap interfaces fill',
              md: '"Can contain other items" is a **capability**, not an ancestry. You cannot express it with inheritance here — C# allows one base class, and both classes already have a different one. An interface says *what an object can do* without saying *what it is*.',
            },
            {
              t: 'umlSpec',
              caption: 'Lab9.pdf page 5 — two classes, one contract',
              source: `public interface IHaveInventory
{
    GameObject Locate(string id);
    string Name { get; }
}

public class Player : GameObject
{
    public GameObject Locate(string id) { return null; }
}

public class Bag : Item
{
    public GameObject Locate(string id) { return null; }
}`,
            },
            {
              t: 'quiz',
              question: 'Why is `Inventory` deliberately **not** on this interface?',
              options: [
                'Because the only client — the look command — needs to locate things and name them, not to reach into storage',
                'Because interfaces cannot declare properties',
                'Because Player and Bag store their items in different types',
                'Because Inventory is a class, and interfaces may only mention primitives',
              ],
              answer: 0,
              why: [
                '',
                'They can. `Name { get; }` right there is one.',
                'Both use `Inventory`. The reason is about design, not types.',
                'An interface member may have any type at all.',
              ],
              explain:
                'Keep an interface as small as its clients require. Exposing `Inventory` would couple every caller to *how* containment is implemented, and the whole point of the contract is that they should not know. This is low coupling and the antisocial-class instinct from Week 8, applied to an interface.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Why `Name` has to be on it at all',
              md: 'Week 10’s look command returns messages like *"I can\'t find the pen in the small bag"*. To write "small bag" it needs the container\'s name — and all it is holding is an `IHaveInventory`. Without `Name` on the contract, that message is impossible.',
            },
          ],
          exercise: {
            prompt:
              'Declare the IHaveInventory interface exactly as the UML specifies: a Locate method and a read-only Name property, and nothing else.',
            seed: `public interface IHaveInventory
{

}`,
            editable: { from: 2, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'IHaveInventory exists as an interface',
                rule: { on: 'class', name: 'IHaveInventory', exists: true },
              },
              {
                kind: 'structure',
                label: 'It declares Locate, taking an id and returning a GameObject',
                rule: {
                  on: 'method',
                  inClass: 'IHaveInventory',
                  name: 'Locate',
                  params: 1,
                  returns: 'GameObject',
                },
              },
              {
                // The interpreter does not verify interface conformance, so
                // the output check below passes with or without `Name` — the
                // concrete classes have it either way. This is what actually
                // holds the student to the UML.
                kind: 'structure',
                label: 'It declares a read-only Name property, which the look command needs',
                rule: {
                  on: 'property',
                  inClass: 'IHaveInventory',
                  name: 'Name',
                  hasGet: true,
                  hasSet: false,
                },
              },
              {
                kind: 'output',
                label: 'A Player and a Bag can both be held in an IHaveInventory variable',
                expect: 'player: Amy\nbag: Tool Bag\nlocated via contract: A Hammer',
              },
            ],
            harness: `${FOUNDATION}

${BAG_WITH_INTERFACE}

${PLAYER_WITH_INTERFACE}

public class __Check
{
    public static void Main()
    {
        IHaveInventory asPlayer = new Player("Amy", "an explorer");
        Bag bag = new Bag(new string[] { "bag", "tool" }, "Tool Bag", "Tools.");
        Item hammer = new Item(new string[] { "hammer" }, "A Hammer", "Heavy.");
        bag.Inventory.Put(hammer);
        IHaveInventory asBag = bag;

        Console.WriteLine("player: " + asPlayer.Name);
        Console.WriteLine("bag: " + asBag.Name);
        Console.WriteLine("located via contract: " + asBag.Locate("hammer").Name);
    }
}`,
            hints: [
              'An interface member has no body and no access modifier — just the signature, ending in a semicolon.',
              'The method is `GameObject Locate(string id);`.',
              'A read-only property in an interface is `string Name { get; }` — a getter and no setter.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w9-92-implement',
          title: 'Declaring that you keep the contract',
          blocks: [
            {
              t: 'text',
              md: `The sheet gives the two class headers verbatim:

- \`public class Bag : Item, IHaveInventory\`
- \`public class Player : GameObject, IHaveInventory\`

Base class first, then interfaces. And here is the part that surprises people: **neither class body changes at all.** Both already had \`Locate\` and \`Name\` with exactly the right signatures. Adding the interface to the header does not give them new work — it *records* that the work they were already doing has a name.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'What the compiler now checks for you',
              md: 'Before, `Player.Locate` and `Bag.Locate` matching each other was a coincidence maintained by hand. Now it is enforced: rename either one, or change its return type, and the class stops compiling. That is the real purchase of writing the interface down.',
            },
            {
              t: 'quiz',
              question:
                'You add `, IHaveInventory` to `Bag`’s header but its `Locate` returns `Item` rather than `GameObject`. In Visual Studio, what happens?',
              options: [
                'It will not compile — `Bag` does not satisfy `IHaveInventory`',
                'It compiles and works, since an `Item` is a `GameObject`',
                'It compiles but throws at runtime the first time `Locate` is called',
                'It compiles with a warning you can safely ignore',
              ],
              answer: 0,
              why: [
                '',
                'A return type that happens to be more specific does not satisfy the contract. C# matches interface members by **exact** signature.',
                'This is caught at compile time. The program never gets to run.',
                'It is an error, not a warning.',
              ],
              explain:
                'An interface is checked member by member, on exact signature, before anything runs. "Close enough" is not a thing — and that strictness is exactly what makes the look command safe to write against the contract next week.',
            },
            {
              t: 'callout',
              tone: 'warn',
              title: 'This playground will not catch that for you',
              md: 'The interpreter here does **not** verify that a class implements every member of an interface it declares — a missing `Name` runs quietly instead of failing. Visual Studio does, and it is a compile error there. So treat the question above as being about the real compiler, and do not rely on Run to tell you your class satisfies the contract.',
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'The order in the header is not optional',
              md: '`public class Bag : IHaveInventory, Item` does not compile. The base class, if there is one, comes first.',
            },
          ],
        },
        {
          id: 'w9-92-polymorphism',
          title: 'One list, two kinds of thing',
          blocks: [
            {
              t: 'text',
              md: `Step 8 of the sheet asks for the payoff: a \`List<IHaveInventory>\` holding a \`Player\` **and** a \`Bag\`, then a loop that prints information about each.

This is the thing you could not write yesterday. There is no type that both classes share except \`object\` — and \`object\` cannot \`Locate\` anything.`,
            },
            {
              t: 'code',
              caption: 'Lab9.pdf page 6, abbreviated',
              code: `public class Program
{
    public static void Main()
    {
        List<IHaveInventory> myContainers = new List<IHaveInventory>();

        Player testPlayer = new Player("James", "an explorer");
        myContainers.Add(testPlayer);

        Bag testToolBag = new Bag(new string[] { "bag", "tool" }, "Tools Bag", "A bag that contains tools");
        Item testItem2 = new Item(new string[] { "stew", "beef" }, "A Beef Stew", "A hearty beef stew");
        testToolBag.Inventory.Put(testItem2);
        myContainers.Add(testToolBag);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'The sheet’s own hint, and what it is really about',
              md: '> *Hint. You need to convert an object in the list to the correct type before printing out the information.*\n\nTrue only for the members that are **not** on the contract. `Name` and `Locate` need no cast at all. It is `Inventory` — which you deliberately left off — that forces one.',
            },
            {
              t: 'compare',
              title: 'Two ways to write that loop',
              left: {
                title: 'Casting back, for what the contract omits',
                tone: 'neutral',
                code: `foreach (IHaveInventory c in myContainers)
{
    Console.WriteLine(c.Name);

    if (c is Bag)
    {
        Bag b = (Bag)c;
        Console.WriteLine(b.Inventory.ItemList);
    }
}`,
              },
              right: {
                title: 'No cast needed, for what it includes',
                tone: 'good',
                code: `foreach (IHaveInventory c in myContainers)
{
    Console.WriteLine(c.Name);
    Console.WriteLine(c.Locate("stew"));
}`,
              },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'A chain of `is` checks is a smell, and Week 8 named it',
              md: 'If the loop grows an `is Player` branch beside the `is Bag` branch, you have rebuilt the type switch that polymorphism exists to delete. The question to ask is always *"should this behaviour be on the contract instead?"* — see the design-smells step in Week 8, and GRASP’s Polymorphism principle in the Week 9 revision notes.',
            },
          ],
          exercise: {
            prompt:
              'Fill in Main: build a List<IHaveInventory> holding the player and the bag, then loop over it printing each container’s name followed by what it finds for "stew".',
            seed: `public class Program
{
    public static void Main()
    {
        Player player = new Player("James", "an explorer");
        Bag toolBag = new Bag(new string[] { "bag", "tool" }, "Tools Bag", "A bag of tools");
        Item stew = new Item(new string[] { "stew", "beef" }, "A Beef Stew", "Hearty.");
        toolBag.Inventory.Put(stew);

        List<IHaveInventory> myContainers = new List<IHaveInventory>();

    }
}`,
            editable: { from: 10, to: 11 },
            tests: [
              {
                kind: 'output',
                label: 'Both containers are visited through the interface',
                expect: 'James: nothing\nTools Bag: A Beef Stew',
              },
              {
                kind: 'forbid',
                label: 'Loop over the interface, not over the concrete classes',
                pattern: 'foreach\\s*\\(\\s*(Player|Bag)\\s',
                message:
                  'Iterating as `Player` or `Bag` defeats the exercise. The list is a `List<IHaveInventory>`, so the loop variable should be an `IHaveInventory`.',
              },
            ],
            harness: `${FOUNDATION}

public interface IHaveInventory
{
    GameObject Locate(string id);
    string Name { get; }
}

${BAG_WITH_INTERFACE}

${PLAYER_WITH_INTERFACE}`,
            hints: [
              'Add both to the list first: `myContainers.Add(player);` and `myContainers.Add(toolBag);`.',
              'The loop variable is the interface type: `foreach (IHaveInventory c in myContainers)`.',
              '`Locate` returns null when nothing matches, so print `"nothing"` in that case — `GameObject found = c.Locate("stew"); if (found == null) { ... } else { ... found.Name ... }`.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w9-92-verify',
          title: 'Verification task — IdentifierCount',
          blocks: [
            {
              t: 'callout',
              tone: 'note',
              title: 'This is the bit your tutor asks for in the lab',
              md: 'The numbered tasks above are what you submit. This is the extra your lab instructor sets on the day, and the short interview is about it. It is small, and it is a genuinely good test of whether the interface makes sense to you.',
            },
            {
              t: 'text',
              md: `**The task.** Add \`IdentifierCount\` to \`IHaveInventory\` — the number of identifiers an object answers to. Then build a list of several players and bags, **sort it by that count**, and print the result.

Two things make this worth doing. First, the property has to be added in *three* places: the interface, and both implementing classes — which is the moment you feel what "contract" means. Second, sorting a \`List<IHaveInventory>\` is only possible because every element answers the same question, whatever it actually is.`,
            },
            {
              t: 'code',
              caption: 'From lab9/9.2 — GameObject.cs and IHaveInventory.cs',
              code: `public interface IHaveInventory
{
    GameObject Locate(string id);
    string Name { get; }

    //------------Verification Task 9---------------------------
    int IdentifierCount { get; }
    //----------------------------------------------------------
}`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Where the implementation goes',
              md: 'Neither `Player` nor `Bag` holds the identifier list — `IdentifiableObject` does, two levels up. So the property belongs **there**, as `public int IdentifierCount { get { return _identifiers.Count; } }`, and both classes inherit it and satisfy the interface without writing a line. Information expert, exactly as GRASP describes it.',
            },
            {
              t: 'code',
              caption: 'The sort, from lab9/9.2/SwinAdventure/Program.cs',
              code: `containers.Sort((a, b) => a.IdentifierCount.CompareTo(b.IdentifierCount));`,
            },
          ],
          exercise: {
            prompt:
              'Add IdentifierCount to IdentifiableObject so both classes satisfy the extended interface, then sort the containers by it, smallest first.',
            seed: `public class IdentifiableObject
{
    private List<string> _identifiers = new List<string>();

    public IdentifiableObject(string[] ids)
    {
        foreach (string id in ids) { _identifiers.Add(id.ToLower()); }
    }

    public bool AreYou(string id) { return _identifiers.Contains(id.ToLower()); }
    public string FirstID() { return _identifiers[0]; }
    public void AddIdentifier(string id) { _identifiers.Add(id.ToLower()); }

}`,
            editable: { from: 13, to: 14 },
            tests: [
              {
                kind: 'structure',
                label: 'IdentifierCount is a read-only property on IdentifiableObject',
                rule: {
                  on: 'property',
                  inClass: 'IdentifiableObject',
                  name: 'IdentifierCount',
                  hasGet: true,
                  hasSet: false,
                },
              },
              {
                kind: 'output',
                label: 'Both kinds of container report their count, and the list sorts by it',
                expect: 'Tool Bag 2\nAmy 3\nBig Bag 4',
              },
            ],
            harness: `public abstract class GameObject : IdentifiableObject
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
}

public interface IHaveInventory
{
    GameObject Locate(string id);
    string Name { get; }
    int IdentifierCount { get; }
}

public class Bag : Item, IHaveInventory
{
    private Inventory _inventory = new Inventory();
    public Bag(string[] ids, string name, string desc) : base(ids, name, desc) { }
    public Inventory Inventory { get { return _inventory; } }
    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        else if (_inventory.HasItem(id)) { return _inventory.Fetch(id); }
        else { return null; }
    }
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

public class __Check
{
    public static void Main()
    {
        List<IHaveInventory> containers = new List<IHaveInventory>();

        Player amy = new Player("Amy", "an explorer");
        amy.AddIdentifier("amy");

        Bag small = new Bag(new string[] { "bag", "tool" }, "Tool Bag", "Tools.");

        Bag big = new Bag(new string[] { "bag", "big", "sack", "holdall" }, "Big Bag", "Roomy.");

        containers.Add(big);
        containers.Add(amy);
        containers.Add(small);

        containers.Sort((a, b) => a.IdentifierCount.CompareTo(b.IdentifierCount));

        foreach (IHaveInventory c in containers)
        {
            Console.WriteLine(c.Name + " " + c.IdentifierCount);
        }
    }
}`,
            hints: [
              'The identifier list is private to this class, so the property belongs here rather than in `Player` or `Bag`.',
              'It is read-only: a getter, no setter.',
              '`public int IdentifierCount { get { return _identifiers.Count; } }` — and both subclasses now satisfy the interface without changing.',
            ],
            tool: 'tests',
          },
        },
      ],
    },
  ],
};

/*
 * The verification interview.
 *
 * Lab9.pdf: "In the lab, there will be a verification task and short interview
 * to verify your understanding." These are the questions that walkthrough
 * actually asks — the composite relationship, why the search is flat, and what
 * the interface buys. Q3 is the one students most often fumble, because the
 * honest answer is "the task sheet and the lecture disagree and I checked".
 */
export const week9Interview: InterviewQuestion[] = [
  {
    id: 'w9-q1',
    question: 'A Bag is an Item. What does that one line buy you?',
    lookingFor: [
      'Any `Inventory` can store a bag without a single change, because an `Inventory` already holds `Item`s',
      'So bags nest inside bags, at any depth, for free at the *storage* level',
      'It is the composite pattern: the container is itself one of the things it contains',
      'What it does **not** buy you is searching — `Fetch` still only checks direct contents',
    ],
    aboutStep: 'w9-91-brief',
  },
  {
    id: 'w9-q2',
    question: 'Walk me through Bag.Locate. Why does it return GameObject rather than Item?',
    lookingFor: [
      'Three questions in order: are you me, do I hold it directly, otherwise null',
      'It can return `this` — and in Task 9.2 `Player.Locate` returns itself too',
      'A `Player` is not an `Item`, so `Item` is too narrow a return type for a shared contract',
      '`GameObject` is the nearest type covering both, which is what makes `IHaveInventory` possible',
    ],
    aboutStep: 'w9-91-flat',
  },
  {
    id: 'w9-q3',
    question:
      'Put a stew in bag b2, put b2 in bag b1. Can b1 locate the stew? Should it?',
    lookingFor: [
      'No — and that is the specified behaviour, not a bug',
      'The task sheet’s own "Test Bag in Bag" requires `b1.Locate("stew")` to be null',
      'A bag you hold is not a bag you have opened; the player descends one container at a time',
      'The privileged-item test makes it a security property: nesting must not leak access',
      'Knowing the lecture treats the same search as a bug, and that the sheet is what is graded',
    ],
    aboutStep: 'w9-91-flat',
  },
  {
    id: 'w9-q4',
    question: 'Why an interface here, rather than a common base class?',
    lookingFor: [
      '"Can contain items" is a **capability**, not an ancestry',
      '`Player` extends `GameObject` and `Bag` extends `Item` — both base slots are already taken',
      'C# allows one base class but any number of interfaces',
      'The classes are unrelated and should stay that way; only the contract is shared',
    ],
    aboutStep: 'w9-92-why',
  },
  {
    id: 'w9-q5',
    question: 'How much did Player and Bag have to change to implement IHaveInventory?',
    lookingFor: [
      'Nothing but the header — both already had `Locate` and `Name` with the right signatures',
      'The interface *records* a contract they were already keeping',
      'What it adds is enforcement: rename either `Locate` now and the class stops compiling',
      'Bonus: the base class comes first in the header, then the interfaces',
    ],
    aboutStep: 'w9-92-implement',
  },
  {
    id: 'w9-q6',
    question:
      'Why is Inventory not on the interface, when both classes have one? And what does leaving it off cost you?',
    lookingFor: [
      'Keep an interface as small as the clients actually need — here, `Locate` and `Name`',
      'Exposing `Inventory` would couple every caller to how containment is implemented',
      'The cost: code holding an `IHaveInventory` must cast back to reach the inventory',
      'That cast is the sheet’s own hint, and a chain of `is` checks is the smell to watch for',
    ],
    aboutStep: 'w9-92-polymorphism',
  },
  {
    id: 'w9-q7',
    question:
      'You added IdentifierCount to the interface. Which class did you implement it in, and why there?',
    lookingFor: [
      '`IdentifiableObject` — it is the class that owns `_identifiers`',
      'Both `Player` and `Bag` then inherit it and satisfy the interface without writing anything',
      'Information expert: the responsibility goes to whoever holds the data',
      'Putting it in both subclasses instead would duplicate logic and reach for data it does not own',
    ],
    aboutStep: 'w9-92-verify',
  },
];
