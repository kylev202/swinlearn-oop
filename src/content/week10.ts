/**
 * Week 10 — SwinAdventure Iteration 7: the Look command.
 *
 * Sources: `OOP Lab10.pdf` (Tasks 10.1 and 10.2, including both sequence
 * diagrams and the full error-message spec), and the student's own
 * `lab10/10.1` source — which is the authoritative reading wherever the sheet
 * and Lecture 9's live-coded reconstruction differ.
 *
 * Four things about the source material a future session should not have to
 * rediscover:
 *
 * 1. **The sheet's error strings are not Lecture 9's.** The lecture transcript
 *    reconstructs messages like `"I cannot find the " + thingId`; Lab10.pdf
 *    page 3 and the student's code both say **`"I can't find the "`**, and the
 *    unit tests assert on it exactly. The sheet wins, and the tests here
 *    assert the sheet's spelling. Getting this wrong fails five of the eight
 *    named tests on a string comparison.
 * 2. **There are two distinct "cannot find" messages**, and conflating them is
 *    the classic bug. A missing *container* gives `"I can't find the bag"`
 *    from `Execute`; a missing *item* gives `"I can't find the gem"` from
 *    `LookAtIn`. Both are "I can't find the X" — the difference is which X,
 *    and which method is speaking.
 * 3. **`LookCommand`'s constructor takes no arguments.** The UML says
 *    `+ Look Command ( )`, and the student's code is
 *    `public LookCommand() : base(new string[] { "look" })`. The identifiers
 *    are baked in, because a look command is always identified by "look".
 *    Lab10.pdf page 6's *template* shows `LookCommand(string[] ids)`, which
 *    contradicts its own diagram; the diagram and the working code agree, so
 *    they win.
 * 4. **Verification Task 10 is case-insensitivity.** The tutor asks for
 *    `Look`, `LOOK` and `lOoK` to all work. The student solves it by copying
 *    `text` into a lowercased `words` array once, at the top of `Execute`,
 *    rather than sprinkling `.ToLower()` through the comparisons — which is
 *    also the better answer, and the one the last lesson teaches.
 *
 * Note on the abstract `Command`: this is the **Command pattern**, and
 * Lecture 10 names it as such. The theory lives in Concept Focus (Week 10
 * revision notes); this week is the build.
 *
 * Authoring note: markdown lives in template literals, so every inline-code
 * backtick must be escaped as \` — otherwise it closes the string.
 */

import type { InterviewQuestion, Week } from './types';

/*
 * Everything Iteration 6 left behind, which every Week 10 exercise needs.
 *
 * `Player` and `Bag` both implement `IHaveInventory` here — that was Task 9.2,
 * and the whole look command is written against it.
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
}

public interface IHaveInventory
{
    GameObject Locate(string id);
    string Name { get; }
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

    public override string FullDescription
    {
        get { return "In the " + Name + " you can see:\\n" + Inventory.ItemList; }
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

    public override string FullDescription
    {
        get { return "You are " + Name + ", " + description + "\\nYou are carrying:\\n" + _inventory.ItemList; }
    }
}`;

/** The abstract Command, once step 1 has written it. */
const COMMAND = `public abstract class Command : IdentifiableObject
{
    public Command(string[] ids) : base(ids) { }

    public abstract string Execute(Player p, string[] text);
}`;

/** The finished Task 10.1 LookCommand, for later steps and the test fixture. */
const LOOK_COMMAND = `public class LookCommand : Command
{
    public LookCommand() : base(new string[] { "look" }) { }

    public override string Execute(Player p, string[] text)
    {
        IHaveInventory container;

        if (text.Length != 3 && text.Length != 5)
        {
            return "I don't know how to look like that";
        }

        if (text[0].ToLower() != "look")
        {
            return "Error in look input";
        }

        if (text[1].ToLower() != "at")
        {
            return "What do you want to look at?";
        }

        if (text.Length == 5)
        {
            if (text[3].ToLower() != "in")
            {
                return "What do you want to look in?";
            }

            container = FetchContainer(p, text[4].ToLower());
            if (container == null)
            {
                return "I can't find the " + text[4].ToLower();
            }
        }
        else
        {
            container = p;
        }

        return LookAtIn(text[2].ToLower(), container);
    }

    private IHaveInventory FetchContainer(Player p, string containerId)
    {
        GameObject obj = p.Locate(containerId);
        return obj as IHaveInventory;
    }

    private string LookAtIn(string thingId, IHaveInventory container)
    {
        GameObject itm = container.Locate(thingId);
        if (itm == null)
        {
            return "I can't find the " + thingId;
        }
        return itm.FullDescription;
    }
}`;

export const week10: Week = {
  number: 10,
  title: 'The look command',
  subtitle: 'SwinAdventure Iteration 7 — an abstract Command, and the first one that works',
  outcomes: [
    'Write an abstract Command class, and say why it is abstract',
    'Parse a tokenised command: validate length, keywords and shape before acting',
    'Resolve a container through IHaveInventory, and cast safely with `as`',
    'Tell the two "I can’t find the X" messages apart, and return each from the right place',
    'Write the eight LookCommand unit tests the sheet names',
    'Make the whole command case-insensitive — the verification task',
  ],
  sources: ['OOP Lab10.pdf', 'lab10/10.1 source', 'Lecture 9 §3 (the live-coded walkthrough)'],
  lessons: [
    {
      id: 'w10-task101',
      title: 'Task 10.1 — the look command',
      kind: 'lab',
      minutes: 60,
      assessment: '2% of your final grade',
      summary:
        'An abstract Command, then the first real one. Most of the work is validating what the user typed before touching a single object.',
      steps: [
        {
          id: 'w10-101-command',
          title: 'Why Command is abstract',
          blocks: [
            {
              t: 'text',
              md: `The game will have several commands — look, move, pick up, drop. They all need two things in common: a set of **identifiers** (so the parser can ask each one *"are you 'look'?"*), and a way to **run**.

That is a base class. And it is \`abstract\`, because a bare \`Command\` has no behaviour to run — there is nothing sensible for \`Execute\` to do until a subclass says what kind of command it is.`,
            },
            {
              t: 'umlSpec',
              caption: 'Lab10.pdf page 2 — the new abstract class',
              source: `public abstract class Command : IdentifiableObject
{
    public Command(string[] ids) : base(ids) { }
    public abstract string Execute(Player p, string[] text);
}

public class LookCommand : Command
{
    public LookCommand() : base(new string[] { "look" }) { }
    public override string Execute(Player p, string[] text) { return null; }
}`,
            },
            {
              t: 'table',
              headers: ['Decision', 'Why'],
              rows: [
                [
                  '`Command : IdentifiableObject`',
                  'Every command must be findable by its first word. The sheet: *"with ‘look at pen’ each Command would be asked ‘Are You look’"*.',
                ],
                [
                  '`abstract class`',
                  'A plain `Command` cannot be instantiated — and should not be, because it has no `Execute` to run.',
                ],
                [
                  '`public abstract string Execute(...)`',
                  'Declared, never implemented. The semicolon in place of a body is what forces every subclass to supply one.',
                ],
                [
                  'Returns `string`',
                  'A command answers with text for the player, rather than printing it itself. That keeps the command testable — a unit test reads the return value.',
                ],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Returning the message instead of printing it',
              md: 'This is the single most important design decision in the week. If `Execute` called `Console.WriteLine` itself you could not unit test it — you would have to capture console output. Returning a `string` means every one of the eight tests is a plain `Assert.That(result, Is.EqualTo(...))`.',
            },
            {
              t: 'quiz',
              question: 'Why does `LookCommand`’s constructor take no parameters?',
              options: [
                'A look command is always identified by "look", so the identifier is baked in and passed to base',
                'Because abstract base classes cannot have constructor parameters',
                'Because the identifiers are set later, by the parser',
                'Because C# requires a parameterless constructor on every subclass',
              ],
              answer: 0,
              why: [
                '',
                '`Command(string[] ids)` has one right there.',
                'Nothing sets them afterwards — `IdentifiableObject` takes them once, on construction.',
                'No such rule exists.',
              ],
              explain:
                '`public LookCommand() : base(new string[] { "look" })`. The caller does not get to choose what a look command answers to. (Lab10.pdf page 6’s code *template* shows a `string[] ids` parameter, contradicting its own UML on page 2 — the diagram and the working solution agree, so follow those.)',
            },
          ],
          exercise: {
            prompt:
              'Write the abstract Command class and a LookCommand that inherits it. Execute can return an empty string for now — the next step fills it in.',
            seed: `public abstract class Command : IdentifiableObject
{

}

public class LookCommand : Command
{

}`,
            editable: { from: 2, to: 8 },
            tests: [
              {
                kind: 'structure',
                label: 'Command is abstract and inherits IdentifiableObject',
                rule: {
                  on: 'class',
                  name: 'Command',
                  isAbstract: true,
                  baseType: 'IdentifiableObject',
                },
              },
              {
                kind: 'structure',
                label: 'Execute is declared abstract on Command',
                rule: {
                  on: 'method',
                  inClass: 'Command',
                  name: 'Execute',
                  params: 2,
                  returns: 'string',
                  isAbstract: true,
                },
              },
              {
                kind: 'structure',
                label: 'LookCommand inherits Command and overrides Execute',
                rule: { on: 'class', name: 'LookCommand', baseType: 'Command' },
              },
              {
                kind: 'output',
                label: 'A LookCommand answers to "look" and nothing else',
                expect: 'look: True\nmove: False',
              },
            ],
            harness: `${FOUNDATION}

public class __Check
{
    public static void Main()
    {
        LookCommand cmd = new LookCommand();
        Console.WriteLine("look: " + cmd.AreYou("look"));
        Console.WriteLine("move: " + cmd.AreYou("move"));
    }
}`,
            hints: [
              '`Command`’s constructor passes its ids straight up: `public Command(string[] ids) : base(ids) { }`.',
              'An abstract method has no body at all — `public abstract string Execute(Player p, string[] text);` ends in a semicolon.',
              '`LookCommand`’s constructor takes nothing and supplies the identifier itself: `public LookCommand() : base(new string[] { "look" }) { }`.',
              '`Execute` must be marked `override` in the subclass, and for now can just `return "";`.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w10-101-parse',
          title: 'Validating before acting',
          blocks: [
            {
              t: 'text',
              md: `The command arrives already split into words. \`look at gem in bag\` is \`[ "look", "at", "gem", "in", "bag" ]\`.

Only two shapes are legal, and everything else must be refused **before** any object is touched:`,
            },
            {
              t: 'table',
              headers: ['Shape', 'Example', 'Container'],
              rows: [
                ['3 words', '`look at gem`', 'The **player** — the default'],
                ['5 words', '`look at gem in bag`', 'Whatever word 5 names'],
              ],
            },
            {
              t: 'text',
              md: '**The validation sequence, from Lab10.pdf page 3.** Each check has its own message, and the order matters:',
            },
            {
              t: 'table',
              headers: ['#', 'Check', 'Message if it fails'],
              rows: [
                ['1', 'Length is exactly 3 or 5', '`I don’t know how to look like that`'],
                ['2', 'Word 1 is `look`', '`Error in look input`'],
                ['3', 'Word 2 is `at`', '`What do you want to look at?`'],
                ['4', 'If 5 words, word 4 is `in`', '`What do you want to look in?`'],
              ],
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Check the length first, or you will crash',
              md: 'Reading `text[1]` before you know the array has two elements throws `IndexOutOfRangeException`. The length check is not politeness — it is what makes every later index safe. This is the input-validation discipline from Week 7, and the lecture compares skipping it to the mistake behind SQL injection.',
            },
            {
              t: 'predict',
              question: 'What does `look around` return?',
              code: `LookCommand cmd = new LookCommand();
Player p = new Player("Amy", "an explorer");
Console.WriteLine(cmd.Execute(p, new string[] { "look", "around" }));`,
              options: [
                "I don't know how to look like that",
                'Error in look input',
                'What do you want to look at?',
                'It throws an IndexOutOfRangeException',
              ],
              answer: 0,
              why: [
                '',
                'Word 1 *is* `look`, so that check passes — but it is never reached, because the length check comes first.',
                'That is the word-2 message, and again the length check fires before it.',
                'Only if you had skipped the length check. That is exactly what it prevents.',
              ],
              explain:
                'Two words is neither 3 nor 5, so the very first check refuses it. Getting this order right is what keeps every later `text[n]` safe.',
              expect: { output: "I don't know how to look like that" },
            },
          ],
          exercise: {
            prompt:
              'Write the validation half of Execute: the four checks in order, each returning the exact message the sheet specifies. Return "ok" at the end for now.',
            seed: `public class LookCommand : Command
{
    public LookCommand() : base(new string[] { "look" }) { }

    public override string Execute(Player p, string[] text)
    {

        return "ok";
    }
}`,
            editable: { from: 6, to: 7 },
            tests: [
              {
                kind: 'output',
                label: 'Each malformed command gets its own message, and valid shapes pass through',
                expect:
                  "look around: I don't know how to look like that\nempty: I don't know how to look like that\nfour words: I don't know how to look like that\nhello at gem: Error in look input\nlook for gem: What do you want to look at?\nlook at gem on bag: What do you want to look in?\nlook at gem: ok\nlook at gem in bag: ok",
              },
            ],
            harness: `${FOUNDATION}

${COMMAND}

public class __Check
{
    public static void Main()
    {
        LookCommand cmd = new LookCommand();
        Player p = new Player("Amy", "an explorer");

        Console.WriteLine("look around: " + cmd.Execute(p, new string[] { "look", "around" }));
        Console.WriteLine("empty: " + cmd.Execute(p, new string[] { }));
        Console.WriteLine("four words: " + cmd.Execute(p, new string[] { "look", "at", "gem", "in" }));
        Console.WriteLine("hello at gem: " + cmd.Execute(p, new string[] { "hello", "at", "gem" }));
        Console.WriteLine("look for gem: " + cmd.Execute(p, new string[] { "look", "for", "gem" }));
        Console.WriteLine("look at gem on bag: " + cmd.Execute(p, new string[] { "look", "at", "gem", "on", "bag" }));
        Console.WriteLine("look at gem: " + cmd.Execute(p, new string[] { "look", "at", "gem" }));
        Console.WriteLine("look at gem in bag: " + cmd.Execute(p, new string[] { "look", "at", "gem", "in", "bag" }));
    }
}`,
            hints: [
              "First: `if (text.Length != 3 && text.Length != 5) { return \"I don't know how to look like that\"; }` — note the straight apostrophe, not a curly one, in the real string.",
              'Then word 1, then word 2, each with its own message from the table.',
              'The `in` check only applies when there are 5 words, so it goes inside `if (text.Length == 5) { ... }`.',
              'Compare with `.ToLower()` on the word, so `Look` and `LOOK` behave the same — the verification task asks for exactly this.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w10-101-fetch',
          title: 'Two helpers, two different "I can’t find"',
          blocks: [
            {
              t: 'text',
              md: `With the input validated, the command does two things:

1. **Resolve the container.** Three words → the container is the player. Five words → ask the player to locate word 5, and treat what comes back as an \`IHaveInventory\`.
2. **Look up the item** (always word 3) inside that container.

Each step can fail, and the sheet gives each failure its own message.`,
            },
            {
              t: 'compare',
              title: 'The two failures, and who reports them',
              left: {
                title: 'Container not found — in Execute',
                tone: 'neutral',
                md: '`look at gem in bag`, and the player has no bag.\n\n→ `I can\'t find the bag`\n\nReported by `Execute`, right after `FetchContainer` returns null. The word reported is **word 5**.',
              },
              right: {
                title: 'Item not found — in LookAtIn',
                tone: 'neutral',
                md: '`look at gem in bag`, there is a bag, but no gem in it.\n\n→ `I can\'t find the gem`\n\nReported by `LookAtIn`, when `container.Locate` returns null. The word reported is **word 3**.',
              },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'These are the same sentence about different things',
              md: 'Both read "I can\'t find the …". Returning the wrong one — or reporting the item\'s name when the container was what went missing — fails `LookAtItemInNoBag` and `LookAtNothingInBag` on a string comparison, and they are two of the eight named tests.\n\nNote the apostrophe too: the sheet and the tests say **`can\'t`**, not "cannot". Lecture 9\'s transcript reconstructs it as "cannot"; the sheet wins.',
            },
            {
              t: 'code',
              caption: 'FetchContainer — the safe cast the sheet asks for',
              code: `private IHaveInventory FetchContainer(Player p, string containerId)
{
    GameObject obj = p.Locate(containerId);
    return obj as IHaveInventory;
}`,
            },
            {
              t: 'text',
              md: `**Why \`as\` and not a cast.** \`p.Locate\` returns a \`GameObject\`, and not every game object can hold things — a plain \`Item\` cannot. A hard cast \`(IHaveInventory)obj\` would throw on \`look at gem in hammer\`. \`as\` yields \`null\` instead, which is exactly the signal \`Execute\` already knows how to report.

It also handles \`obj\` being null already: \`null as IHaveInventory\` is just null. One expression covers both "no such thing" and "that thing is not a container".`,
            },
            {
              t: 'predict',
              question:
                'The player has a hammer but no bag. What does `look at gem in hammer` return?',
              code: `LookCommand cmd = new LookCommand();
Player p = new Player("Amy", "an explorer");
p.Inventory.Put(new Item(new string[] { "hammer" }, "A Hammer", "Heavy."));

Console.WriteLine(cmd.Execute(p, new string[] { "look", "at", "gem", "in", "hammer" }));`,
              options: [
                "I can't find the hammer",
                "I can't find the gem",
                'A Hammer',
                'It throws an InvalidCastException',
              ],
              answer: 0,
              why: [
                '',
                'That message is for a missing *item* inside a container that was found. Here the container itself is unusable.',
                'The hammer is found, but it is not a container, so nothing is looked at inside it.',
                'It would, with a hard cast. `as` returns null instead, which is the whole reason the sheet specifies it.',
              ],
              explain:
                'The hammer exists, so `p.Locate("hammer")` finds it — but an `Item` does not implement `IHaveInventory`, so `as` gives null, and `Execute` reports the container it could not use. "I can\'t find the hammer" is a slight fib (it found it, it just cannot look inside it) but it is what the sheet specifies.',
              expect: { output: "I can't find the hammer" },
            },
          ],
          exercise: {
            prompt:
              'Finish Execute: resolve the container (player for 3 words, FetchContainer for 5), report a missing container, then hand off to LookAtIn. Write both private helpers.',
            seed: `public class LookCommand : Command
{
    public LookCommand() : base(new string[] { "look" }) { }

    public override string Execute(Player p, string[] text)
    {
        IHaveInventory container;

        if (text.Length != 3 && text.Length != 5)
        {
            return "I don't know how to look like that";
        }

        if (text[0].ToLower() != "look")
        {
            return "Error in look input";
        }

        if (text[1].ToLower() != "at")
        {
            return "What do you want to look at?";
        }

        if (text.Length == 5)
        {
            if (text[3].ToLower() != "in")
            {
                return "What do you want to look in?";
            }

        }
        else
        {
            container = p;
        }

        return LookAtIn(text[2].ToLower(), container);
    }

}`,
            editable: { from: 29, to: 30 },
            tests: [
              {
                kind: 'structure',
                label: 'FetchContainer is private and returns an IHaveInventory',
                rule: {
                  on: 'method',
                  inClass: 'LookCommand',
                  name: 'FetchContainer',
                  params: 2,
                  returns: 'IHaveInventory',
                  visibility: 'private',
                },
              },
              {
                kind: 'structure',
                label: 'LookAtIn is private and returns a string',
                rule: {
                  on: 'method',
                  inClass: 'LookCommand',
                  name: 'LookAtIn',
                  params: 2,
                  returns: 'string',
                  visibility: 'private',
                },
              },
              {
                kind: 'output',
                label: 'All eight behaviours from the sheet’s test table',
                expect:
                  "at inventory: You are Amy, an explorer\nYou are carrying:\nA Ruby (gem), \nat gem: A bright Pink ruby\nat gem missing: I can't find the gem\ngem in inventory: A bright Pink ruby\ngem in bag: A bright Pink ruby\ngem in no bag: I can't find the bag\nnothing in bag: I can't find the gem\nin a non-container: I can't find the hammer",
              },
              {
                kind: 'forbid',
                label: 'Cast the container with `as`, not with a hard cast',
                pattern: '\\(\\s*IHaveInventory\\s*\\)',
                message:
                  'A hard cast throws when the object is not a container — `look at gem in hammer` would crash. The sheet asks for `obj as IHaveInventory`, which yields null instead.',
              },
            ],
            harness: `${FOUNDATION}

${COMMAND}

public class __Check
{
    public static void Main()
    {
        LookCommand cmd = new LookCommand();

        Player p1 = new Player("Amy", "an explorer");
        Item gem1 = new Item(new string[] { "gem", "ruby" }, "A Ruby", "A bright Pink ruby");
        p1.Inventory.Put(gem1);
        Console.WriteLine("at inventory: " + cmd.Execute(p1, new string[] { "look", "at", "inventory" }));
        Console.WriteLine("at gem: " + cmd.Execute(p1, new string[] { "look", "at", "gem" }));

        Player p2 = new Player("Amy", "an explorer");
        Console.WriteLine("at gem missing: " + cmd.Execute(p2, new string[] { "look", "at", "gem" }));

        Console.WriteLine("gem in inventory: " + cmd.Execute(p1, new string[] { "look", "at", "gem", "in", "inventory" }));

        Player p3 = new Player("Amy", "an explorer");
        Bag bag3 = new Bag(new string[] { "bag", "money" }, "Money Bag", "Valuables.");
        bag3.Inventory.Put(new Item(new string[] { "gem", "ruby" }, "A Ruby", "A bright Pink ruby"));
        p3.Inventory.Put(bag3);
        Console.WriteLine("gem in bag: " + cmd.Execute(p3, new string[] { "look", "at", "gem", "in", "bag" }));

        Player p4 = new Player("Amy", "an explorer");
        p4.Inventory.Put(new Item(new string[] { "gem" }, "A Ruby", "A bright Pink ruby"));
        Console.WriteLine("gem in no bag: " + cmd.Execute(p4, new string[] { "look", "at", "gem", "in", "bag" }));

        Player p5 = new Player("Amy", "an explorer");
        p5.Inventory.Put(new Bag(new string[] { "bag", "money" }, "Money Bag", "Valuables."));
        Console.WriteLine("nothing in bag: " + cmd.Execute(p5, new string[] { "look", "at", "gem", "in", "bag" }));

        Player p6 = new Player("Amy", "an explorer");
        p6.Inventory.Put(new Item(new string[] { "hammer" }, "A Hammer", "Heavy."));
        Console.WriteLine("in a non-container: " + cmd.Execute(p6, new string[] { "look", "at", "gem", "in", "hammer" }));
    }
}`,
            hints: [
              "Inside the 5-word branch, after the `in` check: `container = FetchContainer(p, text[4].ToLower());` then `if (container == null) { return \"I can't find the \" + text[4].ToLower(); }`.",
              '`FetchContainer` is two lines: locate the id on the player, then `return obj as IHaveInventory;`.',
              "`LookAtIn` locates the thing in the container; if it is null return `\"I can't find the \" + thingId`, otherwise return `itm.FullDescription`.",
              'Both helpers are `private` — the UML marks them with a leading `-`, and only `Execute` ever calls them.',
            ],
            tool: 'tests',
          },
        },
      ],
    },
    {
      id: 'w10-task102',
      title: 'Task 10.2 — the console application',
      kind: 'lab',
      minutes: 35,
      assessment: '2% of your final grade',
      summary:
        'Wire the command to a real player and a real loop, so someone can type at it. Plus the eight unit tests, and the case-insensitivity your tutor asks for.',
      steps: [
        {
          id: 'w10-102-tests',
          title: 'The eight unit tests',
          blocks: [
            {
              t: 'text',
              md: 'Lab10.pdf page 7 names eight tests and gives the fixture. Every one of them is a single `Assert.That(result, Is.EqualTo(...))` — which is only possible because `Execute` **returns** its message rather than printing it.',
            },
            {
              t: 'code',
              caption: 'The fixture, from Lab10.pdf page 7',
              code: `public class LookCommandTests
{
    private Item _testItem;
    private Player _testPlayer;
    private Bag _testMoneyBag;
    private LookCommand _testLookCommand;

    [SetUp]
    public void Setup()
    {
        _testLookCommand = new LookCommand();
        _testPlayer = new Player("HarryPotter", "a student");

        _testItem = new Item(new string[] { "gem", "Ruby" }, "A Ruby", "A bright Pink ruby");
        _testMoneyBag = new Bag(new string[] { "bag", "money" }, "Money Bag", "A bag that contains Valuables");

        _testPlayer.Inventory.Put(_testItem);
    }
}`,
            },
            {
              t: 'table',
              headers: ['Test', 'Command', 'Expected'],
              rows: [
                ['`LookAtPlayer`', '`look at inventory`', 'the player’s `FullDescription`'],
                ['`LookAtItem`', '`look at gem`', 'the gem’s `FullDescription`'],
                ['`LookAtNothing`', '`look at gem`, gem removed first', '`I can\'t find the gem`'],
                ['`LookAtItemInPlayer`', '`look at gem in inventory`', 'the gem’s `FullDescription`'],
                ['`LookAtItemInBag`', '`look at gem in bag`, gem moved into the bag', 'the gem’s `FullDescription`'],
                ['`LookAtItemInNoBag`', '`look at gem in bag`, no bag held', '`I can\'t find the bag`'],
                ['`LookAtNothingInBag`', '`look at gem in bag`, empty bag held', '`I can\'t find the gem`'],
                ['`InvalidLook`', '`look around`, `hello …`, `look at …`', 'the matching error message'],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'The fixture does the arranging, so the tests stay one line',
              md: 'Notice that `LookAtNothing` starts by *removing* the gem the fixture just added — `_testPlayer.Inventory.Take("gem")`. Several tests rearrange the shared setup rather than building their own. That is what `[SetUp]` running fresh before **every** test makes safe.',
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Why `look at inventory` returns the *player*',
              md: '`Player`’s identifiers are `"me"` and `"inventory"`. So `Locate("inventory")` hits `AreYou` and the player returns **itself** — which is why the first test expects the player’s own description, not a list of items. It surprises people every year.',
            },
          ],
          exercise: {
            prompt:
              'Write LookAtItemInBag: take the gem out of the player, put it in the money bag, put the bag in the player, then assert that "look at gem in bag" returns the gem’s full description.',
            seed: `[TestFixture]
public class LookCommandTests
{
    private Item _testItem;
    private Player _testPlayer;
    private Bag _testMoneyBag;
    private LookCommand _testLookCommand;

    [SetUp]
    public void Setup()
    {
        _testLookCommand = new LookCommand();
        _testPlayer = new Player("HarryPotter", "a student");
        _testItem = new Item(new string[] { "gem", "Ruby" }, "A Ruby", "A bright Pink ruby");
        _testMoneyBag = new Bag(new string[] { "bag", "money" }, "Money Bag", "Valuables");
        _testPlayer.Inventory.Put(_testItem);
    }

    [Test]
    public void LookAtItemInBag()
    {

    }
}`,
            editable: { from: 21, to: 22 },
            tests: [
              {
                kind: 'nunit',
                label: 'The test passes against a correct LookCommand',
                source: `${FOUNDATION}

${COMMAND}

${LOOK_COMMAND}`,
              },
              {
                kind: 'forbid',
                label: 'Assert on the command’s result, not on the bag directly',
                pattern: 'Inventory\\s*\\.\\s*Fetch',
                message:
                  'The test is about `LookCommand.Execute`. Asserting on the inventory would still pass if the command were broken.',
              },
            ],
            hints: [
              'Three lines of arranging first: `_testPlayer.Inventory.Take("gem");`, `_testMoneyBag.Inventory.Put(_testItem);`, `_testPlayer.Inventory.Put(_testMoneyBag);`.',
              'Then run it: `string result = _testLookCommand.Execute(_testPlayer, new string[] { "look", "at", "gem", "in", "bag" });`.',
              'Then assert: `Assert.That(result, Is.EqualTo(_testItem.FullDescription));` — compare against the item’s own property rather than a hand-typed string, so the test survives a reworded description.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w10-102-program',
          title: 'The command loop',
          blocks: [
            {
              t: 'text',
              md: `Task 10.2 is the first time the game is something a person can use. Five steps, from Lab10.pdf page 8:

1. Read the player's name and description, and build a \`Player\`.
2. Create two items and put them in the player's inventory.
3. Create a bag and put it in the player's inventory.
4. Create another item and put it in the bag.
5. Loop: read a command, run it, print the answer.`,
            },
            {
              t: 'code',
              caption: 'The loop, from Lab10.pdf page 8',
              code: `bool finished = false;
LookCommand cmd = new LookCommand();

while (!finished)
{
    Console.WriteLine("Enter a command");
    string command = Console.ReadLine();

    if (command.ToLower() == "exit")
    {
        finished = true;
        break;
    }

    string[] split = command.Split(" ");

    Console.WriteLine(cmd.Execute(player, split));
}`,
              lang: 'csharp',
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Split is what makes Execute’s signature make sense',
              md: '`Execute` takes a `string[]`, and nothing in Task 10.1 explained where that array comes from. Here it is: `command.Split(" ")` turns `"look at gem in bag"` into exactly the five-element array the command spent all that validation on. The sheet calls this out — *"the conversion of the text from a single string to a list will be handled elsewhere"*. This is elsewhere.',
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Two ways out of the loop, and one is redundant',
              md: 'The sheet’s own sample sets `finished = true;` **and** calls `break;`. Either alone would do. It is harmless, but worth noticing rather than copying blind — a `break` in a `while (!finished)` loop makes the flag pointless, and a reviewer will ask.',
            },
          ],
          exercise: {
            prompt:
              'Write the setup half of Program.Main: read the name and description from the console, build the player, and stock the inventory as the sheet describes.',
            seed: `public class Program
{
    public static void Main()
    {
        Console.WriteLine("What is your name?");
        string name = Console.ReadLine();
        Console.WriteLine("Describe yourself");
        string desc = Console.ReadLine();

        Player player = new Player(name, desc);

        Console.WriteLine(player.FullDescription);

        LookCommand cmd = new LookCommand();
        Console.WriteLine("coin in the bag: " + cmd.Execute(player, new string[] { "look", "at", "coin", "in", "bag" }));
        Console.WriteLine("coin held directly: " + cmd.Execute(player, new string[] { "look", "at", "coin" }));
    }
}`,
            editable: { from: 10, to: 11 },
            stdin: ['Amy', 'an explorer'],
            tests: [
              {
                kind: 'outputContains',
                label: 'The player is built from what was typed',
                expect: 'You are Amy, an explorer',
              },
              {
                kind: 'outputContains',
                label: 'Two items are in the player’s own inventory',
                expect: 'A Ruby (gem)',
              },
              {
                kind: 'outputContains',
                label: 'A bag is in the inventory too',
                expect: 'Money Bag (bag)',
              },
              {
                // The coin is deliberately absent from the player's own list —
                // it is in the bag. `look at coin in bag` is what proves it is
                // there, and that it is one level down rather than beside it.
                kind: 'outputContains',
                label: 'And a fourth item is inside the bag, reachable through it',
                expect: 'coin in the bag: Shiny.',
              },
              {
                kind: 'outputContains',
                label: 'The coin is not loose in the player’s own inventory',
                expect: 'coin held directly: I can\'t find the coin',
              },
            ],
            harness: `${FOUNDATION}

${COMMAND}

${LOOK_COMMAND}

public class __Check
{
    public static void Main()
    {
        Program.Main();
    }
}`,
            hints: [
              'Two items for the player: `player.Inventory.Put(new Item(new string[] { "gem", "ruby" }, "A Ruby", "A bright Pink ruby"));` and a second of your own.',
              'The grader looks the coin up through the bag, so give it the identifier `coin` and the description `Shiny.`',
              'The bag goes in the same inventory: `Bag bag = new Bag(new string[] { "bag", "money" }, "Money Bag", "Valuables"); player.Inventory.Put(bag);`.',
              'The fourth item goes into the **bag’s** inventory, not the player’s: `bag.Inventory.Put(new Item(new string[] { "coin" }, "A Gold Coin", "Shiny."));`.',
              'Printing `player.FullDescription` at the end lists what the player holds — the coin will not appear there, because it is inside the bag.',
            ],
            tool: 'console',
          },
        },
        {
          id: 'w10-102-verify',
          title: 'Verification task — any case',
          blocks: [
            {
              t: 'callout',
              tone: 'note',
              title: 'This is the bit your tutor asks for in the lab',
              md: 'The numbered tasks above are what you submit. This is the extra set on the day, and the short interview is about it.',
            },
            {
              t: 'text',
              md: `**The task.** \`Look\`, \`LOOK\` and \`lOoK\` should all work, and so should \`GEM\` and \`BAG\`. A player typing at a console does not care about your capitalisation.

There are two ways to do it, and one is clearly better.`,
            },
            {
              t: 'compare',
              title: 'Where to put the lowercasing',
              left: {
                title: 'Sprinkled through the comparisons',
                tone: 'bad',
                code: `if (text[0].ToLower() != "look") { ... }
if (text[1].ToLower() != "at") { ... }
if (text[3].ToLower() != "in") { ... }
container = FetchContainer(p, text[4].ToLower());
return LookAtIn(text[2].ToLower(), container);`,
              },
              right: {
                title: 'Once, at the top',
                tone: 'good',
                code: `string[] words = new string[text.Length];
for (int i = 0; i < text.Length; i++)
{
    words[i] = text[i].ToLower();
}

// ... then use words[n] everywhere below`,
              },
            },
            {
              t: 'text',
              md: `The left-hand version is what you already wrote, and it works. The right-hand version is what the solution in \`lab10/10.1\` does, and it is better for one reason: **you cannot forget one.**

With five separate \`.ToLower()\` calls, adding a sixth index later means remembering the rule again. With one normalising pass, every index below it is already safe — including ones you have not written yet.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why copy into a new array rather than modify text',
              md: 'The caller handed you `text`. Writing into it would mutate an array someone else owns — and they may still be using it. Building `words` leaves the caller\'s data alone, which is the same instinct as the read-only properties in Week 9.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'There is a second verification task, on identifiers',
              md: 'Some tutors also ask that `gem`, `Gem` and `GEM` be treated as the **same identifier**, so adding all three leaves one item. That is already true if `IdentifiableObject` lowercases on the way in — which is what `_identifiers.Add(id.ToLower())` and `Contains(id.ToLower())` are for. Worth checking yours does both.',
            },
          ],
          exercise: {
            prompt:
              'Make the whole command case-insensitive with one normalising pass: build a lowercased copy of text at the top of Execute, and use it for every index below.',
            seed: `public class LookCommand : Command
{
    public LookCommand() : base(new string[] { "look" }) { }

    public override string Execute(Player p, string[] text)
    {
        IHaveInventory container;

        if (text.Length != 3 && text.Length != 5)
        {
            return "I don't know how to look like that";
        }


        if (words[0] != "look")
        {
            return "Error in look input";
        }

        if (words[1] != "at")
        {
            return "What do you want to look at?";
        }

        if (words.Length == 5)
        {
            if (words[3] != "in")
            {
                return "What do you want to look in?";
            }

            container = FetchContainer(p, words[4]);
            if (container == null)
            {
                return "I can't find the " + words[4];
            }
        }
        else
        {
            container = p;
        }

        return LookAtIn(words[2], container);
    }

    private IHaveInventory FetchContainer(Player p, string containerId)
    {
        GameObject obj = p.Locate(containerId);
        return obj as IHaveInventory;
    }

    private string LookAtIn(string thingId, IHaveInventory container)
    {
        GameObject itm = container.Locate(thingId);
        if (itm == null)
        {
            return "I can't find the " + thingId;
        }
        return itm.FullDescription;
    }
}`,
            editable: { from: 13, to: 14 },
            tests: [
              {
                kind: 'output',
                label: 'The same command works in any capitalisation',
                expect:
                  'lower: A bright Pink ruby\nTitle: A bright Pink ruby\nUPPER: A bright Pink ruby\nmIxEd: A bright Pink ruby\nbag in inventory: In the Money Bag you can see:\nA Ruby (gem), \nstill rejects nonsense: Error in look input',
              },
              {
                kind: 'forbid',
                label: 'Normalise once, rather than calling ToLower at each comparison',
                pattern: 'words\\[\\d\\]\\s*\\.\\s*ToLower',
                message:
                  'The point of the normalising pass is that the indices below it are already lowercase. A `.ToLower()` on `words[n]` means the copy is not doing its job.',
              },
            ],
            harness: `${FOUNDATION}

${COMMAND}

public class __Check
{
    public static void Main()
    {
        LookCommand cmd = new LookCommand();
        Player p = new Player("HarryPotter", "a student");
        Bag bag = new Bag(new string[] { "bag", "money" }, "Money Bag", "Valuables");
        bag.Inventory.Put(new Item(new string[] { "gem", "ruby" }, "A Ruby", "A bright Pink ruby"));
        p.Inventory.Put(bag);

        Console.WriteLine("lower: " + cmd.Execute(p, new string[] { "look", "at", "gem", "in", "bag" }));
        Console.WriteLine("Title: " + cmd.Execute(p, new string[] { "Look", "At", "Gem", "In", "Bag" }));
        Console.WriteLine("UPPER: " + cmd.Execute(p, new string[] { "LOOK", "AT", "GEM", "IN", "BAG" }));
        Console.WriteLine("mIxEd: " + cmd.Execute(p, new string[] { "lOoK", "aT", "gEm", "iN", "bAg" }));
        Console.WriteLine("bag in inventory: " + cmd.Execute(p, new string[] { "LOOK", "at", "BAG", "in", "INVENTORY" }));
        Console.WriteLine("still rejects nonsense: " + cmd.Execute(p, new string[] { "hello", "at", "gem" }));
    }
}`,
            hints: [
              'Declare the array with the same length as the input: `string[] words = new string[text.Length];`.',
              'Then fill it: `for (int i = 0; i < text.Length; i++) { words[i] = text[i].ToLower(); }`.',
              'Everything below already reads `words[n]` — once the copy exists, the rest of the method is correct as written.',
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
 * Lab10.pdf: "In the lab, there will be a verification task and short
 * interview." Q2 and Q5 are the ones that separate students who followed the
 * sheet from students who followed the lecture video — the error strings and
 * the safe cast are both places where the two sources differ.
 */
export const week10Interview: InterviewQuestion[] = [
  {
    id: 'w10-q1',
    question: 'Why is Command abstract, and why does Execute return a string rather than print?',
    lookingFor: [
      'A bare `Command` has no behaviour to run, so it should not be instantiable',
      '`abstract` on `Execute` forces every subclass to supply its own',
      'Returning the message keeps the command **testable** — a unit test reads the return value',
      'Printing inside `Execute` would mean capturing console output to test it',
      'It inherits `IdentifiableObject` so the parser can ask each command "are you ‘look’?"',
    ],
    aboutStep: 'w10-101-command',
  },
  {
    id: 'w10-q2',
    question:
      'Walk me through what happens to "look at gem in bag" from the moment Execute is called.',
    lookingFor: [
      'Length check first — 3 or 5, otherwise refuse before touching any index',
      'Word 1 is `look`, word 2 is `at`, and for 5 words, word 4 is `in`',
      'Five words → `FetchContainer(p, words[4])`; three words → the container is the player',
      'Then `LookAtIn(words[2], container)` looks the item up and returns its `FullDescription`',
      'Each failure has its own specified message, and the order of the checks is what makes the indices safe',
    ],
    aboutStep: 'w10-101-parse',
  },
  {
    id: 'w10-q3',
    question:
      'There are two different "I can\'t find the X" messages. What is the difference, and where does each come from?',
    lookingFor: [
      'A missing **container** is reported by `Execute`, naming word 5 — `I can\'t find the bag`',
      'A missing **item** is reported by `LookAtIn`, naming word 3 — `I can\'t find the gem`',
      'Returning the wrong one fails `LookAtItemInNoBag` or `LookAtNothingInBag` on a string comparison',
      'Bonus: the sheet says `can\'t`, and the tests assert on it exactly',
    ],
    aboutStep: 'w10-101-fetch',
  },
  {
    id: 'w10-q4',
    question: 'Why `obj as IHaveInventory` rather than `(IHaveInventory)obj`?',
    lookingFor: [
      '`p.Locate` returns a `GameObject`, and not every game object can hold things',
      'A hard cast **throws** on `look at gem in hammer`; `as` yields null instead',
      'Null is the signal `Execute` already knows how to report',
      'It also covers `obj` being null already — one expression, two failure modes',
    ],
    aboutStep: 'w10-101-fetch',
  },
  {
    id: 'w10-q5',
    question: 'Why does `look at inventory` return the player’s description rather than a list?',
    lookingFor: [
      '`Player`’s identifiers are `"me"` and `"inventory"`',
      'So `Locate("inventory")` matches `AreYou` and the player returns **itself**',
      'Then `FullDescription` on the player is what gets returned',
      'The player’s own `FullDescription` does list what it carries, which is why it looks similar',
    ],
    aboutStep: 'w10-102-tests',
  },
  {
    id: 'w10-q6',
    question: 'How did you make the command case-insensitive, and why that way?',
    lookingFor: [
      'One normalising pass at the top of `Execute`, building a lowercased `words` array',
      'Rather than a `.ToLower()` at each comparison — which you can forget one of',
      'Every index below the copy is then already safe, including ones added later',
      'Copying rather than mutating `text`, because the caller still owns that array',
    ],
    aboutStep: 'w10-102-verify',
  },
  {
    id: 'w10-q7',
    question:
      'Execute takes a string[]. Where does that array come from, and what builds it?',
    lookingFor: [
      '`Program.cs` — `Console.ReadLine()` then `command.Split(" ")`',
      'The sheet says the string-to-list conversion is "handled elsewhere"; the loop is elsewhere',
      'Keeping parsing out of the command is what lets a unit test pass an array directly',
      'The loop also handles `exit`, so there is a way out that is not a command',
    ],
    aboutStep: 'w10-102-program',
  },
];
