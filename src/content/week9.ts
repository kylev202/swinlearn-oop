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
  ],
};

export const week9Interview: InterviewQuestion[] = [];
