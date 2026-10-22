/**
 * Week 11 — SwinAdventure Iteration 8: Location, Path and the Move command.
 *
 * Sources: `OOP Lab11.pdf` (Tasks 11.1 and 11.2, with the extended class
 * diagram and the Player.Locate sequence diagram), and the student's own
 * `lab11/` source — which is the authoritative reading for Task 11.2, because
 * the sheet deliberately does not specify it.
 *
 * Four things about the source material a future session should not have to
 * rediscover:
 *
 * 1. **Task 11.2 is a *custom* task, and the sheet says so.** It is marked
 *    "**challenging task**" and gives requirements rather than a design: *"It
 *    is up to your custom design and implementation."* The student is asked to
 *    hand-draw a class diagram and a sequence diagram and present them. So
 *    this week teaches `Path`/`MoveCommand` as **one worked design among
 *    several defensible ones**, built from `lab11/`, and says which parts are
 *    forced by the requirements and which are choices.
 * 2. **`Path` moves the player, not the command.** The sheet's first bullet:
 *    *"Have the Path objects move the player to the new location. This will
 *    allow for flexibility like lockable paths etc."* So `Path.Move(Player)`
 *    is the specified shape, and `MoveCommand` asks the path to do it.
 *    Lecture 10's reconstruction has `MoveCommand` assign `player.Location`
 *    directly, which is simpler and *less* extensible — the sheet's rationale
 *    (lockable paths) is exactly why the indirection is there.
 * 3. **`Player.Locate` gains a third step, in a specified order.** Lab11.pdf
 *    page 3: are you what is being located, then does your inventory have it,
 *    then can your location find it. The null check on `_location` before the
 *    third step is the one the lecture flags students for missing.
 * 4. **A bare `look` shows the location.** Page 3: *"if the command input only
 *    has one word 'look', the full description of the location should be
 *    displayed"* — which means `LookCommand.Execute` grows a length-1 branch
 *    **before** the 3-or-5 length check, or the new case is refused by the old
 *    validation.
 *
 * Note: `Location.Locate` is flat, like `Bag.Locate` in Week 9 — it checks
 * itself then its own inventory, and does not descend into bags it holds.
 *
 * Authoring note: markdown lives in template literals, so every inline-code
 * backtick must be escaped as \` — otherwise it closes the string.
 */

import type { InterviewQuestion, Week } from './types';

/*
 * Iteration 7's classes, which every Week 11 exercise starts from.
 *
 * `Player` here is the Week 10 version — no `Location` yet. Task 11.1's first
 * exercise is what adds it, so the harness for that step deliberately ships
 * the *old* Player and the student supplies the new one.
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

public abstract class Command : IdentifiableObject
{
    public Command(string[] ids) : base(ids) { }

    public abstract string Execute(Player p, string[] text);
}`;

/** The Week 10 Player, before Task 11.1 gives it a location. */
const PLAYER_W10 = `public class Player : GameObject, IHaveInventory
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

/** The Task 11.1 Player: now with a location, searched last. */
const PLAYER_W11 = `public class Player : GameObject, IHaveInventory
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

/** The Task 11.1 Location. Flat Locate, like Bag's. */
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

/**
 * The Task 11.2 Location: now also the information expert on what leads out.
 *
 * Split from `PATH` below, because the step where the student writes `Path`
 * needs a harness that supplies the `Location` **without** a second `Path` —
 * two declarations of one class is a runtime error, not a silent override.
 * `Location` referring to a `Path` the harness does not define is fine: the
 * student's own class completes it.
 */
const LOCATION_WITH_PATHS = `public class Location : GameObject, IHaveInventory
{
    private Inventory _inventory = new Inventory();
    private List<Path> _paths = new List<Path>();

    public Location(string[] ids, string name, string desc) : base(ids, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public void AddPath(Path path) { _paths.Add(path); }

    public Path GetPath(string id)
    {
        foreach (Path p in _paths) { if (p.AreYou(id)) { return p; } }
        return null;
    }

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

/** The Task 11.2 Path, for the steps that come after the student writes it. */
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

/** The Task 11.2 MoveCommand, for the final build-the-world exercise. */
const MOVE_COMMAND = `public class MoveCommand : Command
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

/** The look command once Task 11.1 has taught it about locations. */
const LOOK_W11 = `public class LookCommand : Command
{
    public LookCommand() : base(new string[] { "look" }) { }

    public override string Execute(Player p, string[] text)
    {
        IHaveInventory container;

        if (text.Length == 1 && text[0].ToLower() == "look")
        {
            if (p.Location != null) { return p.Location.FullDescription; }
            return "You are not anywhere.";
        }

        if (text.Length != 3 && text.Length != 5)
        {
            return "I don't know how to look like that";
        }

        if (text[0].ToLower() != "look") { return "Error in look input"; }
        if (text[1].ToLower() != "at") { return "What do you want to look at?"; }

        if (text.Length == 5)
        {
            if (text[3].ToLower() != "in") { return "What do you want to look in?"; }

            container = FetchContainer(p, text[4].ToLower());
            if (container == null) { return "I can't find the " + text[4].ToLower(); }
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
        if (itm == null) { return "I can't find the " + thingId; }
        return itm.FullDescription;
    }
}`;

export const week11: Week = {
  number: 11,
  title: 'Locations and moving',
  subtitle: 'SwinAdventure Iteration 8 — a world to stand in, and paths out of it',
  outcomes: [
    'Add a Location that holds items, as a third implementer of IHaveInventory',
    'Extend Player.Locate to search its location last, with the null check that makes it safe',
    'Teach the look command a bare "look", without breaking its existing validation',
    'Design Path and MoveCommand yourself — the sheet gives requirements, not a diagram',
    'Say why Path moves the player, rather than the command doing it',
  ],
  sources: ['OOP Lab11.pdf', 'lab11/ source', 'Lecture 10 §3–4'],
  lessons: [
    {
      id: 'w11-task111',
      title: 'Task 11.1 — the Location',
      kind: 'lab',
      minutes: 50,
      assessment: '2% of your final grade',
      summary:
        'A third implementer of IHaveInventory, a player who stands somewhere, and a look command that learns one new word.',
      steps: [
        {
          id: 'w11-111-location',
          title: 'A third kind of container',
          blocks: [
            {
              t: 'text',
              md: `You have built this class twice already. \`Location\` holds items, answers \`Locate\`, and has a \`Name\` — which is to say it is the **third** implementer of \`IHaveInventory\`, after \`Player\` and \`Bag\`.

And here is the payoff for the work in Week 9: the look command needs **no change at all** to look inside a location. \`FetchContainer\` already returns \`IHaveInventory\`; a \`Location\` already is one.`,
            },
            {
              t: 'umlSpec',
              caption: 'Lab11.pdf page 2 — the new class, and what it joins',
              source: `public interface IHaveInventory
{
    GameObject Locate(string id);
    string Name { get; }
}

public class Location : GameObject, IHaveInventory
{
    private Inventory _inventory;
    public Location(string[] ids, string name, string desc) : base(ids, name, desc) { }
    public GameObject Locate(string id) { return null; }
    public Inventory Inventory { get { return _inventory; } }
}`,
            },
            {
              t: 'compare',
              title: 'Location next to Bag',
              left: {
                title: 'Bag : Item, IHaveInventory',
                tone: 'neutral',
                md: 'Is an **item** — so it can be carried, and stored in any `Inventory`.\n\nNests because an `Inventory` holds `Item`s.',
              },
              right: {
                title: 'Location : GameObject, IHaveInventory',
                tone: 'neutral',
                md: 'Is **not** an item — you cannot pick up Swinburne and put it in your bag.\n\nInherits `GameObject` directly, which is why it is a place rather than a thing.',
              },
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'The base class is the whole design decision',
              md: 'Everything else about `Location` is a copy of `Bag`. The one line that differs — `: GameObject` rather than `: Item` — is what makes it a place instead of a possession. Lecture 10 notes that a `Location` can still nest inside another `Location`, for the same reason a bag nests in a bag.',
            },
            {
              t: 'quiz',
              question: 'Why does `Location` inherit `GameObject` rather than `Item`?',
              options: [
                'Because a location is not something that can be carried or stored in an inventory',
                'Because GameObject is the only class with a three-argument constructor',
                'Because Item does not implement IHaveInventory',
                'Because locations need identifiers and items do not',
              ],
              answer: 0,
              why: [
                '',
                '`Item`’s constructor takes the same three arguments and chains to `GameObject` anyway.',
                'Nor does it need to — `Bag` adds the interface itself, and `Location` could have too.',
                'Both are `IdentifiableObject`s. Identifiers are not the difference.',
              ],
              explain:
                'Inheriting `Item` would make a location storable in an `Inventory`, which is nonsense for a place. The type system is being used to state what the domain allows.',
            },
          ],
          exercise: {
            prompt:
              'Write the Location class: a private Inventory, the constructor chaining to base, the read-only Inventory property, a flat Locate, and a FullDescription that reads "You are in <name>."',
            seed: `public class Location : GameObject, IHaveInventory
{

}`,
            editable: { from: 2, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'Location implements IHaveInventory',
                rule: { on: 'class', name: 'Location', implements: 'IHaveInventory' },
              },
              {
                kind: 'structure',
                label: 'Locate takes one parameter and returns a GameObject',
                rule: {
                  on: 'method',
                  inClass: 'Location',
                  name: 'Locate',
                  params: 1,
                  returns: 'GameObject',
                },
              },
              {
                kind: 'output',
                label: 'It identifies itself, finds its own items, and says where you are',
                expect:
                  'itself: Swinburne\nits item: A Club\nabsent: True\nYou are in Swinburne.\n Here, you can see :\nA Club (club), ',
              },
            ],
            harness: `${FOUNDATION}

${PLAYER_W10}

public class __Check
{
    public static void Main()
    {
        Location swin = new Location(new string[] { "swinburne", "uni" }, "Swinburne", "A university.");
        Item club = new Item(new string[] { "club" }, "A Club", "Beautiful club.");
        swin.Inventory.Put(club);

        Console.WriteLine("itself: " + swin.Locate("swinburne").Name);
        Console.WriteLine("its item: " + swin.Locate("club").Name);
        Console.WriteLine("absent: " + (swin.Locate("sword") == null));
        Console.WriteLine(swin.FullDescription);
    }
}`,
            hints: [
              'The shape is `Bag`’s, minus the nesting: a private `Inventory`, a constructor chaining all three arguments to `base`, and a read-only `Inventory` property.',
              '`Locate` is two branches: `if (AreYou(id)) { return this; }` then `return _inventory.Fetch(id);`.',
              'FullDescription needs `override`, and the text is `"You are in " + Name + ".\\n Here, you can see :\\n" + _inventory.ItemList`.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w11-111-player',
          title: 'Where the player is standing',
          blocks: [
            {
              t: 'text',
              md: `\`Player\` gains one field and one property — and \`Locate\` gains a **third** step.

Lab11.pdf page 3 gives the order exactly: *"Players locate items by checking three things (in order): first checking if they are what is to be located, second checking if they have what is being located, lastly checking if the item can be located where they are."*`,
            },
            {
              t: 'table',
              headers: ['#', 'Check', 'Returns'],
              rows: [
                ['1', '`AreYou(id)` — am I what you are asking for?', '`this`'],
                ['2', '`_inventory.Fetch(id)` — am I carrying it?', 'the item'],
                ['3', '`_location.Locate(id)` — is it here where I stand?', 'whatever the location finds'],
              ],
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'The null check the lecture says students forget',
              md: 'A player may have no location yet — `_location` is null until something sets it. Calling `_location.Locate(id)` then throws a `NullReferenceException`.\n\nSo step 3 is guarded twice: only if the inventory came up empty **and** `_location != null`. Lecture 10 calls this out explicitly as a mistake it sees every year.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Why Location has a setter when Inventory does not',
              md: 'The UML marks `Location` as `<<property>>` — not `<<readonly, property>>` like `Inventory`. That is deliberate: a player’s inventory is theirs for life, but **moving is the whole point** of Task 11.2. The path needs to be able to set it.',
            },
            {
              t: 'predict',
              question:
                'The gem is on the ground at Swinburne, not in the player’s pockets. What does this print?',
              code: `Location swin = new Location(new string[] { "swinburne" }, "Swinburne", "A university.");
swin.Inventory.Put(new Item(new string[] { "gem" }, "A Ruby", "A bright Pink ruby"));

Player p = new Player("Amy", "an explorer");
p.Location = swin;

Console.WriteLine(p.Locate("gem").Name);
Console.WriteLine(p.Locate("swinburne").Name);
Console.WriteLine(p.Locate("sword") == null);`,
              options: [
                'A Ruby\nSwinburne\nTrue',
                'A Ruby\nAmy\nTrue',
                'It throws a NullReferenceException',
                'True\nTrue\nTrue',
              ],
              answer: 0,
              why: [
                '',
                '`swinburne` is not one of the player’s identifiers, so step 1 fails and the search falls through to the location, which answers to it.',
                'Only if the location had not been set. It was, on the line above.',
                '`Locate` returns objects, not booleans — only the third line compares to null.',
              ],
              explain:
                'Step 1 misses, step 2 misses (the gem is not carried), step 3 asks the location and finds it. And `p.Locate("swinburne")` returns the location **itself**, because a `Location` answers to its own identifiers — the same self-identifying trick `Bag` and `Player` use.',
              expect: { output: 'A Ruby\nSwinburne\nTrue' },
            },
          ],
          exercise: {
            prompt:
              'Add the location to Player: a private field, a get/set property, and the third step of Locate — guarded so a player with no location does not crash.',
            seed: `public class Player : GameObject, IHaveInventory
{
    private Inventory _inventory = new Inventory();

    public Player(string name, string desc)
        : base(new string[] { "me", "inventory" }, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }

        Item found = _inventory.Fetch(id);
        if (found != null) { return found; }

        return null;
    }

    public override string FullDescription
    {
        get { return "You are " + Name + ", " + description + "\\nYou are carrying:\\n" + _inventory.ItemList; }
    }
}`,
            editable: { from: 3, to: 17 },
            tests: [
              {
                kind: 'structure',
                label: 'Player has a Location property with both a getter and a setter',
                rule: {
                  on: 'property',
                  inClass: 'Player',
                  name: 'Location',
                  hasGet: true,
                  hasSet: true,
                },
              },
              {
                kind: 'output',
                label:
                  'It searches itself, then its inventory, then its location — and survives having none',
                expect:
                  'carried: A Hammer\nin the location: A Ruby\nthe location itself: Swinburne\nnowhere: True\nno location set: True\nstill finds carried: A Hammer',
              },
            ],
            harness: `${FOUNDATION}

${LOCATION}

public class __Check
{
    public static void Main()
    {
        Location swin = new Location(new string[] { "swinburne", "uni" }, "Swinburne", "A university.");
        swin.Inventory.Put(new Item(new string[] { "gem", "ruby" }, "A Ruby", "A bright Pink ruby"));

        Player p = new Player("Amy", "an explorer");
        p.Inventory.Put(new Item(new string[] { "hammer" }, "A Hammer", "Heavy."));
        p.Location = swin;

        Console.WriteLine("carried: " + p.Locate("hammer").Name);
        Console.WriteLine("in the location: " + p.Locate("gem").Name);
        Console.WriteLine("the location itself: " + p.Locate("swinburne").Name);
        Console.WriteLine("nowhere: " + (p.Locate("sword") == null));

        Player lost = new Player("Bo", "unplaced");
        lost.Inventory.Put(new Item(new string[] { "hammer" }, "A Hammer", "Heavy."));
        Console.WriteLine("no location set: " + (lost.Locate("gem") == null));
        Console.WriteLine("still finds carried: " + lost.Locate("hammer").Name);
    }
}`,
            hints: [
              'The field goes beside the inventory: `private Location _location;`.',
              'The property has both halves: `public Location Location { get { return _location; } set { _location = value; } }`.',
              'The third step replaces `return null;` — `if (_location != null) { return _location.Locate(id); }` and then `return null;` for the case where there is no location.',
              'Both conditions matter: the inventory must have come up empty *and* a location must exist.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w11-111-look',
          title: 'Teaching look one new word',
          blocks: [
            {
              t: 'text',
              md: `Two changes to \`LookCommand\`, and the sheet asks for both.

**The easy one is already done.** \`FetchContainer\` calls \`p.Locate(containerId)\`, and \`Player.Locate\` now searches the location too — so \`look at gem in swinburne\` works without touching the command at all. That is the interface earning its keep.

**The new one is a bare \`look\`.** Page 3: *"if the command input only has one word 'look', the full description of the location should be displayed."*`,
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Where the new branch has to go',
              md: 'A one-word command is neither 3 nor 5 words, so the existing length check **refuses it** with "I don\'t know how to look like that".\n\nThe new branch therefore goes **before** that check, not after. Put it afterwards and the feature silently never fires — and the old tests still pass, which is what makes it an easy bug to ship.',
            },
            {
              t: 'code',
              caption: 'From lab11/SwinAdventure/LookCommand.cs — first thing in Execute',
              code: `if (text.Length == 1 && text[0].ToLower() == "look")
{
    if (p.Location != null)
    {
        return p.Location.FullDescription;
    }
    return "You are not anywhere.";
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Still checking the word, not just the length',
              md: 'A one-word command that is not `look` — say the player types `hello` — should not print the location. Hence `text.Length == 1 **&&** text[0].ToLower() == "look"`. The parser will eventually route by identifier, but the command still validates its own input.',
            },
          ],
          exercise: {
            prompt:
              'Add the bare-look branch to Execute, in the right place, with the fallback for a player who is nowhere.',
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

        if (text[0].ToLower() != "look") { return "Error in look input"; }
        if (text[1].ToLower() != "at") { return "What do you want to look at?"; }

        if (text.Length == 5)
        {
            if (text[3].ToLower() != "in") { return "What do you want to look in?"; }

            container = FetchContainer(p, text[4].ToLower());
            if (container == null) { return "I can't find the " + text[4].ToLower(); }
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
        if (itm == null) { return "I can't find the " + thingId; }
        return itm.FullDescription;
    }
}`,
            editable: { from: 7, to: 8 },
            tests: [
              {
                kind: 'output',
                label:
                  'A bare look shows the location, a placeless player is told so, and everything else is unchanged',
                expect:
                  'bare look: You are in Swinburne.\n Here, you can see :\nA Club (club), \nnowhere: You are not anywhere.\none word, not look: I don\'t know how to look like that\nat an item here: Beautiful club.\nin the location: Beautiful club.\nstill refuses rubbish: I don\'t know how to look like that',
              },
            ],
            harness: `${FOUNDATION}

${LOCATION}

${PLAYER_W11}

public class __Check
{
    public static void Main()
    {
        LookCommand cmd = new LookCommand();

        Location swin = new Location(new string[] { "swinburne", "uni" }, "Swinburne", "A university.");
        swin.Inventory.Put(new Item(new string[] { "club" }, "A Club", "Beautiful club."));

        Player p = new Player("Amy", "an explorer");
        p.Location = swin;

        Console.WriteLine("bare look: " + cmd.Execute(p, new string[] { "look" }));

        Player lost = new Player("Bo", "unplaced");
        Console.WriteLine("nowhere: " + cmd.Execute(lost, new string[] { "look" }));
        Console.WriteLine("one word, not look: " + cmd.Execute(p, new string[] { "hello" }));
        Console.WriteLine("at an item here: " + cmd.Execute(p, new string[] { "look", "at", "club" }));
        Console.WriteLine("in the location: " + cmd.Execute(p, new string[] { "look", "at", "club", "in", "swinburne" }));
        Console.WriteLine("still refuses rubbish: " + cmd.Execute(p, new string[] { "look", "around" }));
    }
}`,
            hints: [
              'The branch goes at the very top of `Execute`, before the 3-or-5 length check.',
              'Guard on both things: `if (text.Length == 1 && text[0].ToLower() == "look")`.',
              'Inside it, return the location’s `FullDescription` when there is one, and `"You are not anywhere."` when there is not.',
            ],
            tool: 'tests',
          },
        },
      ],
    },
    {
      id: 'w11-task112',
      title: 'Task 11.2 — Path and the move command',
      kind: 'lab',
      minutes: 55,
      // Plain text, not markdown: the sidebar renders this verbatim.
      assessment: '2% of your final grade · the challenging task',
      summary:
        'The sheet stops giving you a diagram and starts giving you requirements. One worked design, with the parts that are forced marked off from the parts that are choices.',
      steps: [
        {
          id: 'w11-112-brief',
          title: 'A task with no UML',
          blocks: [
            {
              t: 'callout',
              tone: 'warn',
              title: 'This one is different, and the sheet says so',
              md: 'Task 11.2 is marked **"challenging task"**, and instead of a class diagram it says: *"It is up to your custom design and implementation to meet the following requirements."*\n\nIt then asks you to **hand-draw** a class diagram and a sequence diagram and present them to your instructor. So the design below is **one defensible answer**, not the answer. What follows marks which parts the requirements force and which are genuinely your call.',
            },
            {
              t: 'table',
              headers: ['The sheet requires', 'What that forces', 'What is left to you'],
              rows: [
                [
                  '*"Have the **Path** objects move the player"*',
                  'A `Path` class with a method taking a `Player`',
                  'What to call it — `Move`, `Traverse`, `Walk`',
                ],
                [
                  '*"Make Path’s identifiable. The identifiers indicate the direction"*',
                  '`Path : GameObject` (or `IdentifiableObject`), with ids like `north`',
                  'Whether a path also has a name and description',
                ],
                [
                  '*"...can be used to locate the path from the location"*',
                  '`Location` holds its paths and can look one up by id',
                  '`List<Path>` vs `Dictionary`; what the lookup is called',
                ],
                [
                  '*"The Move Command is identified by ‘move’, ‘go’, ‘head’, ‘leave’"*',
                  'A `MoveCommand : Command` with several identifiers',
                  'The exact word list — the sheet ends with "..."',
                ],
              ],
            },
            {
              t: 'text',
              md: `**The four behaviours it asks you to test**, which are really the specification:

- A path can move the player to its destination
- You can get a path from a location, given one of the path's identifiers
- A player can leave a location, given a valid path identifier
- A player **stays put** when the identifier is invalid`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why Path moves the player, and not the command',
              md: 'This is the one design point the sheet argues for, and it is worth understanding rather than copying. *"Have the Path objects move the player to the new location. **This will allow for flexibility like lockable paths etc.**"*\n\nIf `MoveCommand` set `player.Location` itself, then a locked path, a toll path, or a path that only opens at night would each need a new branch **in the command**. With `Path.Move(player)` the command asks and the path decides — so a `LockedPath : Path` can refuse, and the command never changes.\n\nThat is GRASP’s Protected Variations, and the open/closed principle, in one method signature.',
            },
            {
              t: 'quiz',
              question:
                'Lecture 10 shows `MoveCommand` doing `player.Location = selectedPath.Destination;` directly. Why does the task sheet ask for something else?',
              options: [
                'Because putting the move on Path lets a subclass change the rules without touching the command',
                'Because assigning a property from another class is not allowed in C#',
                'Because Destination is read-only, so the command cannot reach it',
                'Because the command has no reference to the player',
              ],
              answer: 0,
              why: [
                '',
                'It is perfectly legal — `Location` has a public setter precisely so this works.',
                '`Destination` being read-only stops you *reassigning the path’s* destination, not reading it.',
                '`Execute(Player p, string[] text)` is handed the player directly.',
              ],
              explain:
                'Both work today. The sheet’s version keeps working when paths stop being simple — which is the whole reason it names "lockable paths" as the motivation.',
            },
          ],
        },
        {
          id: 'w11-112-path',
          title: 'Path, and the location that holds them',
          blocks: [
            {
              t: 'text',
              md: `\`Path\` is small: it is a \`GameObject\` (so it has identifiers, a name and a description for free) plus one new piece of state — where it goes.`,
            },
            {
              t: 'umlSpec',
              caption: 'One worked design for Task 11.2',
              source: `public class Location : GameObject, IHaveInventory
{
    private Inventory _inventory;
    private List<Path> _paths;
    public Location(string[] ids, string name, string desc) : base(ids, name, desc) { }
    public GameObject Locate(string id) { return null; }
    public void AddPath(Path path) { }
    public Path GetPath(string id) { return null; }
}

public class Path : GameObject
{
    private Location _destination;
    public Path(string[] ids, string name, string desc, Location destination) : base(ids, name, desc) { }
    public Location Destination { get { return _destination; } }
    public void Move(Player p) { }
}`,
            },
            {
              t: 'table',
              headers: ['Member', 'Why'],
              rows: [
                [
                  '`Path : GameObject`',
                  'The requirement is that paths are *identifiable*. `north`, `up`, `out` are its identifiers.',
                ],
                [
                  '`Destination` is read-only',
                  'The lecture’s reasoning: *"each path should have a fixed destination without dynamic update on it."* Where a path goes is set once, when the world is built.',
                ],
                [
                  '`Move(Player p)`',
                  'The sheet’s own requirement. One line today — `p.Location = _destination;` — and the hook every future path variation needs.',
                ],
                [
                  '`Location.AddPath` / `GetPath`',
                  'Somebody has to wire the world together, and the location is the information expert on what leads out of it.',
                ],
              ],
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Wiring the world is manual, for now',
              md: 'Lecture 10 is candid about this: `AddPath` is called by hand in `Program.cs`, and in a real game the paths per location would come from **configuration data** — a JSON file loaded at startup — rather than being compiled in. Worth saying in the interview.',
            },
            {
              t: 'predict',
              question: 'Two locations, one path. What does this print?',
              code: `Location swin = new Location(new string[] { "swinburne" }, "Swinburne", "A university.");
Location cbd = new Location(new string[] { "cbd" }, "The CBD", "Busy.");
Path north = new Path(new string[] { "north", "n" }, "North Road", "Leads north.", cbd);
swin.AddPath(north);

Player p = new Player("Amy", "an explorer");
p.Location = swin;

Console.WriteLine(swin.GetPath("n").Name);
north.Move(p);
Console.WriteLine(p.Location.Name);
Console.WriteLine(swin.GetPath("south") == null);`,
              options: [
                'North Road\nThe CBD\nTrue',
                'North Road\nSwinburne\nTrue',
                'North Road\nThe CBD\nFalse',
                'It throws a NullReferenceException',
              ],
              answer: 0,
              why: [
                '',
                '`Move` sets the player’s location to the path’s destination, so they are no longer at Swinburne.',
                '`GetPath("south")` finds nothing, because no path at Swinburne answers to "south".',
                'Everything here is wired up before it is used.',
              ],
              explain:
                'A path is found by any of its identifiers — `n` works as well as `north`. `Move` does the one thing it exists to do. And a direction with no path returns null, which is how `MoveCommand` knows to refuse.',
              expect: { output: 'North Road\nThe CBD\nTrue' },
            },
          ],
          exercise: {
            prompt:
              'Write Path: a GameObject with a read-only Destination and a Move that puts the player there. Then add AddPath and GetPath to Location.',
            seed: `public class Path : GameObject
{

}`,
            editable: { from: 2, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'Destination is read-only — set once, when the world is built',
                rule: {
                  on: 'property',
                  inClass: 'Path',
                  name: 'Destination',
                  hasGet: true,
                  hasSet: false,
                },
              },
              {
                kind: 'structure',
                label: 'Move takes a Player',
                rule: { on: 'method', inClass: 'Path', name: 'Move', params: 1 },
              },
              {
                kind: 'output',
                label: 'A path is found by any identifier, and moving changes where the player is',
                expect:
                  'by full name: North Road\nby short name: North Road\nno such direction: True\nbefore: Swinburne\nafter: The CBD\ndestination unchanged: The CBD',
              },
            ],
            harness: `${FOUNDATION}

${LOCATION_WITH_PATHS}

${PLAYER_W11}

public class __Check
{
    public static void Main()
    {
        Location swin = new Location(new string[] { "swinburne" }, "Swinburne", "A university.");
        Location cbd = new Location(new string[] { "cbd" }, "The CBD", "Busy.");
        Path north = new Path(new string[] { "north", "n" }, "North Road", "Leads north.", cbd);
        swin.AddPath(north);

        Player p = new Player("Amy", "an explorer");
        p.Location = swin;

        Console.WriteLine("by full name: " + swin.GetPath("north").Name);
        Console.WriteLine("by short name: " + swin.GetPath("n").Name);
        Console.WriteLine("no such direction: " + (swin.GetPath("south") == null));

        Console.WriteLine("before: " + p.Location.Name);
        north.Move(p);
        Console.WriteLine("after: " + p.Location.Name);
        Console.WriteLine("destination unchanged: " + north.Destination.Name);
    }
}`,
            hints: [
              'The constructor takes four things and passes the first three up: `public Path(string[] ids, string name, string desc, Location destination) : base(ids, name, desc)`, then stores the destination.',
              '`Destination` is read-only: a getter, no setter.',
              '`Move` is one line — set the player’s `Location` to this path’s destination.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w11-112-move',
          title: 'The move command',
          blocks: [
            {
              t: 'text',
              md: `\`MoveCommand\` is the smallest command in the game, because \`Path\` and \`Location\` are doing the work. It validates, looks up, and delegates.`,
            },
            {
              t: 'table',
              headers: ['Step', 'Failure message'],
              rows: [
                ['Exactly 2 words — `move north`', '`I don\'t know how to move like that`'],
                ['The player is somewhere at all', '`You are not anywhere.`'],
                ['The location has a path with that identifier', '`You can\'t go that way.`'],
                ['Otherwise: `path.Move(p)`, then confirm', '`You arrive at <name>`'],
              ],
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'These messages are yours to choose',
              md: 'Unlike the look command, **the sheet specifies no wording here** — Task 11.2 gives behaviour, not strings. The ones above are from `lab11/`, and they are a reasonable set. What matters for the mark is the four behaviours, not the prose; what matters for the interview is that you can say which messages you chose and why.',
            },
            {
              t: 'compare',
              title: 'The same two commands, side by side',
              left: {
                title: 'LookCommand',
                tone: 'neutral',
                md: 'Identified by `look`.\n\nValidates 1, 3 or 5 words.\n\nAsks the **player** to locate a container, then the container to locate an item.\n\nReturns a description.',
              },
              right: {
                title: 'MoveCommand',
                tone: 'neutral',
                md: 'Identified by `move`, `go`, `head`, `leave`.\n\nValidates 2 words.\n\nAsks the **location** for a path, then the path to move the player.\n\nReturns a confirmation.',
              },
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'This is why Command was abstract',
              md: 'Two commands now, both `Command` subclasses, both supplying their own `Execute`. The loop in `Program.cs` that reads input and calls `Execute` does not change to accommodate the second one — and would not change for a tenth.\n\nLecture 10 names this the **Command pattern**, and it is on the final exam. The theory is in the Week 10 revision notes; this is the build it is describing.',
            },
          ],
          exercise: {
            prompt:
              'Write MoveCommand: identified by move/go/head/leave, validating two words, refusing a player with no location or no such path, and otherwise asking the path to move them.',
            seed: `public class MoveCommand : Command
{

}`,
            editable: { from: 2, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'MoveCommand inherits Command',
                rule: { on: 'class', name: 'MoveCommand', baseType: 'Command' },
              },
              {
                kind: 'output',
                label: 'All four behaviours the sheet asks you to test',
                expect:
                  "answers to several words: True True True\nvalid move: You arrive at The CBD\nnow at: The CBD\ninvalid direction: You can't go that way.\nstill at: The CBD\nwrong word count: I don't know how to move like that\nnowhere: You are not anywhere.",
              },
            ],
            harness: `${FOUNDATION}

${LOCATION_WITH_PATHS}

${PATH}

${PLAYER_W11}

public class __Check
{
    public static void Main()
    {
        MoveCommand cmd = new MoveCommand();

        Location swin = new Location(new string[] { "swinburne" }, "Swinburne", "A university.");
        Location cbd = new Location(new string[] { "cbd" }, "The CBD", "Busy.");
        swin.AddPath(new Path(new string[] { "north", "n" }, "North Road", "Leads north.", cbd));

        Player p = new Player("Amy", "an explorer");
        p.Location = swin;

        Console.WriteLine("answers to several words: " + cmd.AreYou("move") + " " + cmd.AreYou("go") + " " + cmd.AreYou("leave"));
        Console.WriteLine("valid move: " + cmd.Execute(p, new string[] { "move", "north" }));
        Console.WriteLine("now at: " + p.Location.Name);
        Console.WriteLine("invalid direction: " + cmd.Execute(p, new string[] { "move", "west" }));
        Console.WriteLine("still at: " + p.Location.Name);
        Console.WriteLine("wrong word count: " + cmd.Execute(p, new string[] { "move" }));

        Player lost = new Player("Bo", "unplaced");
        Console.WriteLine("nowhere: " + cmd.Execute(lost, new string[] { "move", "north" }));
    }
}`,
            hints: [
              'The constructor takes nothing and supplies its own words: `public MoveCommand() : base(new string[] { "move", "go", "head", "leave" }) { }`.',
              'Validate the length first — `if (text.Length != 2)` — then that the player has a location at all.',
              'Ask the location, not the player: `Path path = p.Location.GetPath(text[1].ToLower());` and refuse when it is null.',
              'Then delegate — `path.Move(p);` — and return a confirmation naming `p.Location.Name`, which has just changed.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w11-112-diagrams',
          title: 'The two diagrams you have to draw',
          blocks: [
            {
              t: 'callout',
              tone: 'warn',
              title: 'These are graded, and they are hand-drawn',
              md: 'The sheet asks for both **on paper**, presented to your instructor:\n\n> *Draw a UML class diagram to show what needs to be added (hand drawing on paper). Present to your lab instructor.*\n> *Draw a sequence diagram to explore how moving will work. For example: execute "move north" is sent to a Move Command.*',
            },
            {
              t: 'text',
              md: `**For the class diagram**, the three relationships to get right:

| Between | Relationship | Notation |
|---|---|---|
| \`MoveCommand\` → \`Command\` | inheritance | hollow triangle, solid line |
| \`Location\` → \`Path\` | aggregation, 1 to many | **open** diamond at the Location end |
| \`Path\` → \`Location\` | association | solid line, toward the destination |

That last pair is worth noticing: \`Location\` and \`Path\` point at **each other**. A location holds the paths out of it, and each path holds the location it leads to. That is a cycle, and it is fine — it is what makes a navigable world.`,
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'Aggregation, not composition, for the paths',
              md: 'Open diamond. A `Path` names a destination `Location` that exists independently — destroying one location should not destroy the paths that led elsewhere. Week 6\'s rule: **filled** diamond means the part dies with the whole, and that is not true here.',
            },
            {
              t: 'text',
              md: `**For the sequence diagram**, \`move north\` has four participants and reads top to bottom:

\`\`\`
  : MoveCommand        p : Player      swin : Location      north : Path
        |                   |                 |                  |
  Execute(p, [...])         |                 |                  |
        |---- Location ---->|                 |                  |
        |<--- swin ---------|                 |                  |
        |------------ GetPath("north") ------>|                  |
        |<----------- north ------------------|                  |
        |------------------------------- Move(p) --------------->|
        |                   |<----- Location = cbd --------------|
        |<------------------------------------------------------ |
  "You arrive at The CBD"   |                 |                  |
\`\`\`

The detail that earns the mark: the **last call before the return** goes to the \`Path\`, and the \`Path\` is what writes to the \`Player\`. If your diagram has \`MoveCommand\` writing \`Location\` directly, it is drawing Lecture 10's design rather than the sheet's.`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'The app can draw the class diagram for you',
              md: 'Press **Run** on any of this week’s exercises and open the **UML** tab — it builds a class diagram from whatever code is in the editor, beside the target the lab specified. Useful for checking your hand drawing against your actual code, which is what the instructor will do.',
            },
          ],
          exercise: {
            prompt:
              'Build the whole world and walk it: two locations joined by a path each way, a player who starts at one, and a move command. Print where they are after each move.',
            seed: `public class Program
{
    public static void Main()
    {
        Location swin = new Location(new string[] { "swinburne", "uni" }, "Swinburne", "A university.");
        Location cbd = new Location(new string[] { "cbd", "city" }, "The CBD", "Busy.");


        Player player = new Player("Amy", "an explorer");
        player.Location = swin;

        MoveCommand move = new MoveCommand();
        LookCommand look = new LookCommand();

        Console.WriteLine(move.Execute(player, new string[] { "move", "north" }));
        Console.WriteLine(move.Execute(player, new string[] { "go", "south" }));
        Console.WriteLine(look.Execute(player, new string[] { "look" }));
    }
}`,
            editable: { from: 7, to: 8 },
            tests: [
              {
                kind: 'output',
                label: 'The player walks to the CBD and back, and sees where they end up',
                expect:
                  'You arrive at The CBD\nYou arrive at Swinburne\nYou are in Swinburne.\n Here, you can see :\n',
              },
            ],
            harness: `${FOUNDATION}

${LOCATION_WITH_PATHS}

${PATH}

${PLAYER_W11}

${LOOK_W11}

${MOVE_COMMAND}

public class __Check
{
    public static void Main()
    {
        Program.Main();
    }
}`,
            hints: [
              'Two paths, one each way: `swin.AddPath(new Path(new string[] { "north" }, "North Road", "Leads north.", cbd));`',
              'And the return journey: `cbd.AddPath(new Path(new string[] { "south" }, "South Road", "Leads south.", swin));`',
              'The second move uses `go` rather than `move` — both are identifiers of the same command, which is the point of giving it several.',
            ],
            tool: 'uml',
          },
        },
      ],
    },
  ],
};

/*
 * The verification interview.
 *
 * Task 11.2 is a *custom* task, so the interview is less about "did you write
 * the specified thing" and more about "can you justify what you chose". Q4 and
 * Q5 are the ones that matter most: the sheet gives a rationale for putting
 * the move on `Path`, and a student who can state it has understood the point
 * of the whole iteration.
 */
export const week11Interview: InterviewQuestion[] = [
  {
    id: 'w11-q1',
    question: 'Why does Location inherit GameObject, when Bag inherits Item?',
    lookingFor: [
      'A location is not something you can pick up or store in an `Inventory`',
      'Inheriting `Item` would make it storable, which is nonsense for a place',
      'Both still implement `IHaveInventory` — the capability is shared, the ancestry is not',
      'That one line is the only real difference between the two classes',
    ],
    aboutStep: 'w11-111-location',
  },
  {
    id: 'w11-q2',
    question: 'Walk me through Player.Locate now. Why is the order what it is, and what guards it?',
    lookingFor: [
      'Self, then inventory, then location — the order the sheet specifies',
      'What you are carrying wins over what is lying on the ground',
      '`_location` may be null, so step 3 is guarded with `if (_location != null)`',
      'Without that guard, a player who has not been placed yet throws a `NullReferenceException`',
    ],
    aboutStep: 'w11-111-player',
  },
  {
    id: 'w11-q3',
    question:
      'How much did LookCommand change to let you look at things in your location, and why so little?',
    lookingFor: [
      'For `look at gem in swinburne` — **nothing at all**',
      '`FetchContainer` asks `p.Locate`, which now searches the location too',
      'And it returns `IHaveInventory`, which a `Location` already implements',
      'That is the Week 9 interface paying off: a third implementer slots in with no edits',
      'The only real change is the bare `look`, and it had to go **before** the length check',
    ],
    aboutStep: 'w11-111-look',
  },
  {
    id: 'w11-q4',
    question:
      'Task 11.2 gave you no UML. Show me your class diagram and tell me which parts were forced and which were your choice.',
    lookingFor: [
      'Forced: paths are identifiable, a path moves the player, a location can look a path up by id',
      'Chosen: the method names, `List<Path>` over a `Dictionary`, the exact identifier words',
      '`MoveCommand` inherits `Command` — hollow triangle',
      '`Location` aggregates `Path` — **open** diamond, since a destination outlives any one path',
      'The cycle: a location holds paths out, and each path names a location it leads to',
    ],
    aboutStep: 'w11-112-diagrams',
  },
  {
    id: 'w11-q5',
    question:
      'Your MoveCommand calls path.Move(p) rather than setting p.Location itself. Why?',
    lookingFor: [
      'The sheet asks for it, and gives the reason: *"flexibility like lockable paths"*',
      'A `LockedPath : Path` can refuse, and `MoveCommand` never changes',
      'Otherwise every new kind of path needs a new branch **in the command**',
      'This is Protected Variations, and the open/closed principle, in one method',
      'Knowing Lecture 10 shows the other version, and why the sheet differs',
    ],
    aboutStep: 'w11-112-brief',
  },
  {
    id: 'w11-q6',
    question: 'Why is Path.Destination read-only, when Player.Location has a setter?',
    lookingFor: [
      'Where a path *goes* is fixed when the world is built — *"without dynamic update on it"*',
      'Where a player *is* changes constantly; that is the whole point of moving',
      'The UML marks one `<<readonly, property>>` and the other just `<<property>>`',
      'Reading the stereotypes rather than guessing is the general lesson',
    ],
    aboutStep: 'w11-112-path',
  },
  {
    id: 'w11-q7',
    question:
      'You now have two commands. What did adding the second one cost you, and what would a tenth cost?',
    lookingFor: [
      'Almost nothing — `MoveCommand` is a new `Command` subclass with its own `Execute`',
      'The loop in `Program.cs` reads input and calls `Execute`; it does not change',
      'This is why `Command` was abstract in Week 10 — the extension point was built first',
      'Lecture 10 names it the **Command pattern**, a behavioural pattern, and it is on the final',
    ],
    aboutStep: 'w11-112-move',
  },
];
