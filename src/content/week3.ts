/**
 * Week 3 — Object Collaboration, Memory, and UML Sequence Diagrams.
 *
 * Sources: Week 3 lecture notes, Quiz 3, OOP Lab3.pdf.
 *
 * Lab3.pdf turns out to be a byte-for-byte copy of Swin-Adventure Requirements.pdf
 * — there is no separate numbered task sheet the way Lab2 had one. The lecture's
 * own live demo (Item, Inventory — aggregation in code, built on the
 * IdentifiableObject/Item pair introduced in the Week 2 lecture but never
 * assessed) is what this week's task actually asks you to build, so Task 3
 * below follows that demo rather than a PDF numbering scheme.
 *
 * Value/reference semantics, aliasing, and passing objects to methods were
 * already covered in week2.ts's "References" lesson (it even answers Quiz 3
 * Q7 directly) — this week does not repeat that, it builds on it: the four
 * memory regions, garbage collection, and what survives a method return.
 *
 * Authoring note: markdown lives in template literals, so every inline-code
 * backtick must be escaped as \` — otherwise it closes the string.
 */

import type { InterviewQuestion, Week } from './types';

export const week3: Week = {
  number: 3,
  title: 'Collaboration, Memory & Sequence Diagrams',
  subtitle: 'Association, aggregation, dependency — plus stack, heap, and UML sequence diagrams',
  outcomes: [
    'Name the three object relationship types and tell them apart in real code: association, aggregation, dependency',
    'Explain why deciding relationships early saves rework later',
    'Say what lives on the stack and what lives on the heap, and why C# never lets you choose',
    'Explain what a garbage collector does, and name a language family that does not have one',
    'Read a UML sequence diagram: lifelines, activation boxes, calls and returns',
    'Build a small aggregation relationship — an Inventory of Items — as the first piece of the Swin-Adventure project',
  ],
  sources: ['Week 3 lecture', 'Quiz 3', 'OOP Lab3.pdf (Swin-Adventure Requirements)'],
  lessons: [
    // ================================================================ lesson 1
    {
      id: 'w3-relationships',
      title: 'How objects relate to each other',
      kind: 'concept',
      minutes: 16,
      summary: 'Three ways one object can know about another — and why the difference is worth naming.',
      steps: [
        {
          id: 'w3-rel-why',
          title: 'One object is never the whole program',
          blocks: [
            {
              t: 'text',
              md: `> "If you view any software in reality as the collections of different entities in practice, those entities will interact with each other." — Dr Vo

A single \`Counter\` or \`Shape\` sitting alone does nothing. Real programs are **many objects of different kinds** that have to collaborate: in *Escape the Invasion*, a \`Game\` has one \`Player\`, has many \`Fireballs\`, has many \`Aliens\`; the \`Player\` creates \`Fireballs\`, and \`Fireballs\` check collision against \`Aliens\`.

Before you write a line of that, it pays to decide **how** the objects relate — that decision shapes every field and method signature that follows.`,
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'Design takeaway',
              md: 'Being aware of object relationship types **early in design** saves implementation effort later. This is not theory for its own sake — get it wrong and you refactor every class that touches the mistake.',
            },
          ],
        },
        {
          id: 'w3-rel-types',
          title: 'Three relationships, one sentence test each',
          blocks: [
            {
              t: 'text',
              md: `C# code only has fields, parameters, local variables and return values — there is no keyword for "this is an association." The three relationship types below are a way of **naming what the code is already doing**, so you and your tutor can talk about a design without reading every line.`,
            },
            {
              t: 'table',
              caption: 'The three relationship types',
              headers: ['Relationship', 'Meaning', 'Sentence test', 'Example'],
              rows: [
                ['**Association**', 'One object holds a reference to another, as a field', '"X **has a** Y"', '\`BlackjackGame\` has a \`Deck\`'],
                ['**Aggregation**', 'One object holds a *collection* of another — a whole/part relationship', '"X **is made up of** Y"', 'An \`Inventory\` contains a list of \`Item\`s (0..*)'],
                ['**Dependency**', 'One object *briefly* uses another — a parameter, local variable, or return value, not a field', '"X **uses** Y"', '\`BlackjackGame\` uses a \`Card\` during play'],
              ],
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'These are not "old OOP theory"',
              md: 'Dr Vo\'s example: handing sub-tasks to several AI agents (emailing, note-taking) is **aggregation** — one coordinator, many agents it manages. Using one API key to reach a cloud service is **association** — a single, fixed reference. The vocabulary is decades old; what it describes is not.',
            },
          ],
        },
        {
          id: 'w3-rel-field-vs-temp',
          title: 'The trap: a field is never a dependency',
          blocks: [
            {
              t: 'text',
              md: `The most common mix-up (Quiz 3's own "common trap" list puts it first): confusing a **field** with a **dependency**. Here is the test — does the reference outlive the method call?`,
            },
            {
              t: 'compare',
              title: 'Same class, two different relationships to Deck',
              left: {
                title: 'Association — a field',
                tone: 'good',
                code: `public class BlackjackGame
{
    private Deck _deck;

    public BlackjackGame()
    {
        _deck = new Deck();
    }
}`,
                md: '`_deck` is stored. Every method in `BlackjackGame` can reach it, for the whole lifetime of the object. That permanence is what makes it an **association**.',
              },
              right: {
                title: 'Dependency — a parameter',
                tone: 'neutral',
                code: `public class BlackjackGame
{
    public void Shuffle(Deck deck)
    {
        // use deck, then let it go
    }
}`,
                md: '`deck` here exists only for the duration of `Shuffle`. Nothing in `BlackjackGame` remembers it afterwards — that is a **dependency**, a "uses-a", not a "has-a".',
              },
            },
            {
              t: 'code',
              caption: 'Quiz 3 Q15 — what relationship is this?',
              lang: 'csharp',
              code: `public class BlackjackGame {
    private Deck deck;
    public BlackjackGame() {
         deck = new Deck();
    }
}`,
            },
            {
              t: 'quiz',
              question: 'What relationship exists between BlackjackGame and Deck in the code above?',
              options: ['Association', 'Dependency', 'Inheritance', 'No relationship — deck is local'],
              answer: 0,
              why: [
                '',
                'A dependency would be `deck` appearing only as a method parameter or local variable. Here it is a field — it survives past any single method call.',
                'There is no `: Deck` or `extends Deck` — nothing here makes BlackjackGame a *kind of* Deck.',
                '`deck` is declared as a field of the class, so it is very much a relationship, not nothing.',
              ],
              explain: `Quiz 3 Q15. \`BlackjackGame\` keeps a field reference to \`Deck\`, so any "has-a" implemented as a class field is an **association** — permanent, for as long as the object exists. (A sharp-eyed reader will notice \`deck = new Deck()\` inside the constructor makes this a *stronger* association called composition — but composition is not one of the three categories this unit teaches, so association is the answer expected here.)`,
            },
          ],
        },
        {
          id: 'w3-rel-aggregation',
          title: 'Aggregation: a collection, and what it really stores',
          blocks: [
            {
              t: 'text',
              md: `Aggregation is a field too — the difference from association is that it holds **many**, not one: \`private List<Item> _items;\` rather than \`private Item _item;\`.

But a \`List<Item>\` is a reference type itself, and it stores **references** to \`Item\` objects, not the objects. Two slots in the list can point at the very same \`Item\` — exactly the aliasing trap from Week 2's References lesson, now one level up.`,
            },
            {
              t: 'predict',
              caption: 'One item, two slots in the bag',
              question: 'What does this print?',
              code: `public class Item
{
    private string _name;
    public Item(string name) { _name = name; }
    public string Name { get { return _name; } set { _name = value; } }
}

public class Program
{
    static void Main()
    {
        List<Item> bag = new List<Item>();
        Item sword = new Item("sword");
        bag.Add(sword);
        bag.Add(sword);

        bag[0].Name = "rusty sword";

        Console.WriteLine(bag[0].Name);
        Console.WriteLine(bag[1].Name);
        Console.WriteLine(bag.Count);
    }
}`,
              options: [
                'rusty sword\nsword\n2',
                'rusty sword\nrusty sword\n2',
                'rusty sword\nrusty sword\n1',
                'sword\nsword\n2',
              ],
              answer: 1,
              why: [
                'This assumes `bag[1]` is a second, independent Item. It is not — `Add(sword)` was called twice with the same reference, so both slots point at the one object.',
                '',
                'The list genuinely has two slots (`bag.Count` counts slots, not distinct objects) — renaming does not merge them.',
                'This assumes assigning `.Name` somehow replaced the object in slot 0 with a new one. Properties only change a field on the existing object.',
              ],
              explain: `\`bag.Add(sword)\` twice does not create a second \`Item\` — it copies the same reference into two slots. \`bag.Count\` is **2** because the list has two slots, but there is only **one** \`Item\` on the heap, so renaming it through \`bag[0]\` is visible through \`bag[1]\` too. Aggregation is a container of *references*, and a reference can be duplicated without the object being duplicated.`,
              expect: { output: 'rusty sword\nrusty sword\n2' },
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'A word you will see in Quiz 3 but not in this unit\'s three categories',
              md: '**Composition** is a *stronger* aggregation, where the parts cannot outlive the whole (a `Book`\'s `Chapter`s, say). Quiz 3 mentions it because it is a standard OOP term, but Lecture 3 teaches only the three relationships in the table above — association, aggregation, dependency. If a quiz question offers composition as an option, treat it as a specialised association/aggregation, not a fourth category to memorise separately.',
            },
          ],
        },
        {
          id: 'w3-rel-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'quiz',
              question: 'Which of these is an example of an association relationship?',
              options: [
                'A Game object has a reference to a Player object',
                'A Character object inherits from a GameEntity class',
                'A Team object contains multiple Player objects',
                'A Player object temporarily uses a HealthPotion object',
              ],
              answer: 0,
              why: [
                '',
                'That describes inheritance (an "is-a" relationship), a different concept from any of the three relationship types this week covers.',
                'A team *containing multiple* players is a whole/part relationship — that is aggregation, not association.',
                'A *temporary* use, typically via a method parameter or local variable, is the definition of a dependency.',
              ],
              explain:
                'Quiz 3 Q11. An association is a structural "has-a": one object holds a reference to a single other object as a field, for as long as it exists.',
            },
            {
              t: 'quiz',
              question: 'Why bother identifying object relationships before you start coding?',
              options: [
                'It saves implementation effort and reduces later refactoring',
                'It reduces the need for code documentation',
                'It eliminates the need for code testing',
                'It helps you avoid object-oriented programming principles',
              ],
              answer: 0,
              why: [
                '',
                'Clear design improves readability, but documentation is still needed on top of it.',
                'Relationships are a design concern; they say nothing about whether your code is correct, which is what tests check.',
                'The three relationship types are themselves how you *apply* encapsulation, low coupling and high cohesion — not a way of avoiding OOP.',
              ],
              explain:
                'Quiz 3 Q16. A modular, well-thought-out structure prevents costly redesigns and rewrites later — the entire point of naming these relationships before writing code.',
            },
            {
              t: 'recall',
              prompt:
                'In your own words: what is the difference between association, aggregation, and dependency? Use Swin-Adventure as your example — a Room holding Items, and a Player picking one up.',
              nudge:
                'Start from the sentence tests: has-a (single), is-made-up-of (many), uses (briefly). Then say which one is a field that holds many, and which one never gets stored anywhere.',
              points: [
                'Association: one object holds a reference to one other object, as a field — a long-term "has-a"',
                'Aggregation: one object holds a *collection* of others — a whole/part relationship, still a field',
                'Dependency: one object uses another briefly — a parameter, local variable, or return value, never a field',
                'A Room "is made up of" Items it contains: aggregation',
                'A Player "uses" an Item they picked up to open a door, then moves on: dependency',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 2
    {
      id: 'w3-memory',
      title: 'Memory: the stack, the heap, and who cleans up',
      kind: 'concept',
      minutes: 14,
      summary: 'Four memory regions, what goes where, and what actually happens when a method returns.',
      steps: [
        {
          id: 'w3-mem-regions',
          title: 'Four regions, one rule you already know',
          blocks: [
            {
              t: 'text',
              md: `> "If your application takes too much memory, nobody's going to use your software — regardless of how beautiful, fancy, or functional it is." — Dr Vo

Week 2's References lesson already gave you the practical rule: **\`new\` always means heap**. That rule is one line of a bigger picture — a running C# program actually has four memory regions.`,
            },
            {
              t: 'table',
              caption: 'The four memory regions',
              headers: ['Region', 'What lives there', 'Size known at…'],
              rows: [
                ['Code area', 'Compiled instructions — your method bodies', 'compile time'],
                ['Global variables', 'Anything declared globally, reachable everywhere', 'compile time'],
                ['**Stack**', 'Fixed-size data: primitives, and the *references* (arrows) that point at objects', 'compile time'],
                ['**Heap**', 'Everything created with `new` — its size is only known once the program runs', 'runtime'],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why int goes on the stack and List<Item> does not',
              md: `\`int i;\` has a fixed, known size the moment the compiler sees it — 32 bits, always. \`new List<Item>()\` might hold 0 items or 100,000 by the time the program finishes; nobody knows until runtime. That is the actual reason value types sit on the stack and everything made with \`new\` sits on the heap — it is about *when the size becomes known*, not an arbitrary rule.`,
            },
          ],
        },
        {
          id: 'w3-mem-survives-return',
          title: 'What survives when a method returns',
          blocks: [
            {
              t: 'text',
              md: `When a method finishes, its **stack frame** — its local variables and parameters — is popped and gone. In C++, that would be a dangling-pointer bug waiting to happen if you returned a pointer to something local. C# behaves differently. Predict what happens here.`,
            },
            {
              t: 'predict',
              caption: 'A local variable returned from a method',
              question: 'MakeSword\'s local variable `local` disappears when the method returns. What prints in Main?',
              code: `public class Item
{
    private string _name;
    public Item(string name) { _name = name; }
    public string Name { get { return _name; } }
}

public class Program
{
    static Item MakeSword()
    {
        Item local = new Item("sword");
        return local;
    }

    static void Main()
    {
        Item sword = MakeSword();
        Console.WriteLine(sword.Name);
    }
}`,
              options: ['sword', '(nothing prints)', 'The program crashes: local no longer exists', 'local'],
              answer: 0,
              why: [
                '',
                'This assumes the Item disappeared along with the stack frame. It did not — only the *stack slot named `local`* is gone. The object itself is on the heap.',
                'C# has no dangling-pointer problem here: the object stays alive on the heap for as long as something references it, stack frame or not.',
                'This treats `local` as if it were data that gets returned by name. What is returned is the reference the variable held, not the variable itself.',
              ],
              explain: `\`local\`'s **stack slot** disappears the instant \`MakeSword\` returns — that part is true. But \`local\` never held the object, only an arrow to it on the **heap**. \`return local;\` copies that arrow into \`Main\`'s \`sword\` variable, so the \`Item\` is still reachable and still exists. This is exactly what a garbage collector is checking for: not "did the method that created this return", but "can anything still reach it".`,
              expect: { output: 'sword' },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'This is where C# and C++ genuinely diverge',
              md: 'In C++, returning a pointer to a local **object** (not a pointer variable — the object itself, stack-allocated) is undefined behaviour, because that object really is destroyed on return. C# sidesteps the whole problem: objects are never stack-allocated in the first place, so there is nothing to destroy early. That is one concrete reason C# and Java can afford automatic memory management and C++ historically could not.',
            },
          ],
        },
        {
          id: 'w3-mem-gc',
          title: 'Garbage collection — know your language',
          blocks: [
            {
              t: 'table',
              caption: 'Who cleans up the heap',
              headers: ['Language family', 'Heap cleanup'],
              rows: [
                ['**C# and Java**', 'Automatic — a garbage collector reclaims memory nobody can reach any more'],
                ['**C++ and Objective-C**', 'Manual — freeing heap memory is your responsibility (e.g. `delete`)'],
              ],
            },
            {
              t: 'quiz',
              question: 'Which best describes the garbage collector in C#?',
              options: [
                'It automatically manages memory for objects on the heap',
                'It clears all memory immediately after an object is no longer in use',
                'It prevents memory leaks by storing all objects in a fixed stack',
                'It manually frees memory for local variables on the stack',
              ],
              answer: 0,
              why: [
                '',
                'Collection is non-deterministic — it runs on thresholds and system conditions, not the instant a reference disappears.',
                'The GC only ever manages the heap. Objects live there, not on a "fixed stack" — the two are opposites in this model.',
                'Stack memory needs no garbage collector: local variable frames are popped automatically by the runtime when a method returns.',
              ],
              explain:
                'Quiz 3 Q13. The GC runs periodically in the background, reclaiming heap memory for objects nothing can reach any more — not on a fixed schedule, and never touching the stack.',
            },
            {
              t: 'quiz',
              question: 'What actually happens when a method finishes executing in C#?',
              options: [
                'Its stack frame is removed, and control returns to the caller',
                'Every heap object it touched is immediately garbage collected',
                'Nothing — the frame stays until the program ends',
                'Its local variables move to the heap so they are not lost',
              ],
              answer: 0,
              why: [
                '',
                'Heap objects the method touched are only collected once *nothing* references them — that can be long after the method returns, or never, exactly like `MakeSword` above.',
                'Stack frames are popped, not left behind — otherwise the stack would grow forever.',
                'Local variables are simply discarded with the frame. Nothing moves anywhere unless you explicitly returned a reference, as `MakeSword` did.',
              ],
              explain:
                'Quiz 3 Q1. The stack frame — local variables and parameters — is popped when a method returns, and execution resumes right after the call. Any heap objects the method created live on independently, governed by reachability, not by which method created them.',
            },
          ],
        },
        {
          id: 'w3-mem-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Explain, out loud, what happens to `local` and to the Item it points at when MakeSword() returns. Then explain why that answer would be different in a language with no garbage collector.',
              nudge:
                'Separate the *variable* from the *object*. One is a name on the stack; the other is data on the heap. They have different lifetimes.',
              points: [
                'The stack slot named `local` is popped and gone the moment MakeSword returns',
                'The Item object itself lives on the heap and does not disappear with the frame',
                'It survives because `Main`\'s `sword` variable now holds the same reference — the object is still reachable',
                'A garbage collector only reclaims heap memory once nothing can reach it any more, not when the creating method returns',
                'Without a garbage collector (C++), a return like this would work too if it returns a pointer to something heap-allocated — the risk is only when returning a pointer to something stack-allocated',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 3
    {
      id: 'w3-sequence',
      title: 'UML sequence diagrams',
      kind: 'concept',
      minutes: 14,
      summary: 'A universal way to show which object calls which, in what order — read one, then generate one from your own code.',
      steps: [
        {
          id: 'w3-seq-purpose',
          title: 'What a sequence diagram is for',
          blocks: [
            {
              t: 'text',
              md: `> "The UML diagram is to help you visualize how the sequence of objects run... This diagram is an *iconic universal language* — regardless of whether you're a developer, software analyst, or software tester, you're expected to understand it." — Dr Vo

A **class diagram** (Week 2) shows *structure* — what fields and methods a class has. A **sequence diagram** shows *behaviour over time* — which object calls which method, in what order, and what comes back.`,
            },
            {
              t: 'quiz',
              question: 'What is the primary purpose of a UML sequence diagram?',
              options: [
                'To visualise the dynamic interactions between objects over time',
                'To describe the structure of classes and their attributes',
                'To represent the deployment of software components',
                'To illustrate the database schema for an application',
              ],
              answer: 0,
              why: [
                '',
                'That describes a class diagram — a structural diagram, not a behavioural one.',
                'That describes a deployment diagram, which is not covered in this unit.',
                'That describes an entity-relationship diagram for a database schema — unrelated.',
              ],
              explain:
                'Quiz 3 Q9. A sequence diagram is a behavioural diagram: it models the chronological order of messages exchanged between objects at runtime.',
            },
          ],
        },
        {
          id: 'w3-seq-read',
          title: 'Reading one',
          blocks: [
            {
              t: 'table',
              caption: 'The notation',
              headers: ['Symbol', 'Means'],
              rows: [
                ['Column header, `name : ClassName`', 'One participating object — an object box'],
                ['Vertical dashed line', 'A **lifeline**: that object\'s lifespan through the interaction'],
                ['Solid arrow, filled head', 'A synchronous **method call** — the sender waits for a reply'],
                ['Dashed arrow, open head', 'A **return** — a value passed back to the caller'],
                ['Thin rectangle on a lifeline', 'An **activation box**: the period that object is actively executing'],
              ],
            },
            {
              t: 'quiz',
              question: 'What does an activation box on a lifeline represent?',
              options: [
                'The duration when an object is performing an operation',
                "The object's class attributes",
                "The object's memory address",
                "The termination of an object's lifecycle",
              ],
              answer: 0,
              why: [
                '',
                'Attributes are shown in class diagrams, not on a lifeline in a sequence diagram.',
                'Sequence diagrams show *behaviour*, not runtime memory addresses.',
                'Termination is shown with a large "X" at the end of a lifeline, not an activation box.',
              ],
              explain:
                'Quiz 3 Q4. The activation box is the thin rectangle showing exactly when an object is executing an operation or waiting for a call it made to return.',
            },
            {
              t: 'quiz',
              question: "What do the vertical dashed lines (lifelines) represent?",
              options: [
                'The lifespan of an object during the interaction',
                'The static structure of a class',
                'The memory allocation of objects on the heap',
                "The inheritance hierarchy of objects",
              ],
              answer: 0,
              why: [
                '',
                'That is a class diagram\'s job.',
                'Sequence diagrams show object *interaction over time*, not low-level heap layout.',
                'Class hierarchies are shown with generalisation arrows in class diagrams, not lifelines here.',
              ],
              explain:
                "Quiz 3 Q10. A lifeline is the vertical dashed line extending down from an object's header, showing that object's existence through the interaction.",
            },
            {
              t: 'quiz',
              question: 'Which arrow represents a method call from one object to another?',
              options: [
                'A solid line with a filled arrowhead',
                'A dashed line with an open arrowhead',
                'A bold line with a triangle arrowhead',
                'A dotted line with a diamond symbol',
              ],
              answer: 0,
              why: [
                '',
                'That is a *return* message — a reply going back to the caller, not a call.',
                'Not a standard UML sequence diagram notation.',
                'A diamond marks aggregation or composition on a *class* diagram — unrelated to messages here.',
              ],
              explain:
                'Quiz 3 Q14. A solid line with a filled arrowhead is a synchronous call; the sender waits for the receiver before continuing.',
            },
          ],
        },
        {
          id: 'w3-seq-generate',
          title: 'Generate one from code you actually ran',
          blocks: [
            {
              t: 'text',
              md: `Drawing these by hand in a tool like Draw.io is how the labs usually do it — with no way to tell whether the picture matches the code. Here you get the real thing: run this small \`Inventory\`/\`Item\` collaboration and open **Sequence** to see the diagram built from the actual calls your code made.`,
            },
            {
              t: 'runnable',
              tool: 'sequence',
              autoRun: true,
              caption: 'One Inventory, one Item, three calls',
              code: `public class Item
{
    private string _name;

    public Item(string name)
    {
        _name = name;
    }

    public bool HasId(string id)
    {
        return _name == id;
    }
}

public class Inventory
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
}

public class Program
{
    static void Main()
    {
        Inventory bag = new Inventory();
        Item sword = new Item("sword");

        bag.PutItem(sword);
        Console.WriteLine(bag.HasItem("sword"));
    }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'What to look for',
              md: `Three lifelines: \`Program\`, \`Inventory\`, \`Item\`. \`HasItem\` opens an activation box on \`Inventory\` that stays open **while it calls \`HasId\` on \`Item\`** — that nested activation is exactly the "Deck tells Card, Card tells back" pattern from the lecture's Blackjack deal sequence, just with objects you built yourself.`,
            },
            {
              t: 'recall',
              prompt:
                'Explain your generated diagram to someone who has not seen the code: which lifeline calls which, in what order, and where does the aggregation from this week\'s first lesson show up in it?',
              nudge:
                'Walk it top to bottom: who does Program talk to first, what does that object do next, and when does each activation box close.',
              points: [
                'Program creates an Inventory and an Item, then calls PutItem and HasItem on the Inventory',
                'Inventory never talks to Item until HasItem runs — PutItem only adds to the list',
                'Inside HasItem, Inventory calls HasId on the Item it holds, and waits for the answer before returning',
                'The Inventory→Item call is only possible because Inventory holds a reference to Item — the aggregation from Lesson 1, now visible as an arrow between lifelines',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 4
    {
      id: 'w3-task3',
      title: 'Task 3 — Starting Swin-Adventure: Items and an Inventory',
      kind: 'lab',
      minutes: 35,
      assessment: 'Verification task + short interview in your allocated lab',
      summary:
        'The first piece of a multi-week project: an Item that knows its own identity, and an Inventory that aggregates a collection of them.',
      steps: [
        {
          id: 'w3-t3-brief',
          title: 'What Swin-Adventure is',
          blocks: [
            {
              t: 'text',
              md: `> "Swin-Adventure will provide hours of interactive fun for Swinburne students who want to be entertained during lectures on their notebooks. Swin-Adventure is a console based adventure game that allows people to explore a fantasy world instead of listening to lectures."

That is the actual opening line of the requirements document. The finished game has locations connected by paths, and each location can hold **items** the player can \`look at\`, \`pickup\`, and \`put\` into containers like a bag.

This week you are not building the whole game — you are building the two classes underneath it that the lecture's live demo introduced: \`Item\` and \`Inventory\`. Later weeks extend this same project (that is why the lecture called it "built incrementally, same approach across multiple weeks").`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'A duplication you are meant to notice, not fix yet',
              md: `The full course pairs \`Item\` with an \`IdentifiableObject\` base that also manages an identifiers list. Building both right now would duplicate the same "does this ID match" logic in two places — Dr Vo flags this as a **deliberate, temporary design smell**: the course revisits it once inheritance is available and removes the duplication then. For this task, \`Item\` manages its own identity directly.`,
            },
          ],
        },
        {
          id: 'w3-t3-uml',
          title: 'The target',
          blocks: [
            {
              t: 'text',
              md: 'Two classes, one aggregation between them: an `Inventory` is made up of `Item`s.',
            },
            {
              t: 'umlSpec',
              caption: 'Task 3 target',
              source: `public class Item
{
    private string _name;
    private string _description;
    public Item(string name, string description) { }
    public string Name { get { return ""; } }
    public string Description { get { return ""; } }
    public bool HasId(string id) { return false; }
}

public class Inventory
{
    private List<Item> _items;
    public Inventory() { }
    public void PutItem(Item item) { }
    public bool HasItem(string id) { return false; }
    public Item TakeItem(string id) { return null; }
}`,
            },
          ],
        },
        {
          id: 'w3-t3-item-fields',
          title: 'The Item class: fields',
          blocks: [
            {
              t: 'text',
              md: 'An Item knows its own name and a longer description. Both are private — the same reasoning as Week 2\'s Counter.',
            },
          ],
          exercise: {
            prompt: 'Add two private string fields to Item: _name and _description.',
            seed: 'public class Item\n{\n\n}',
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: '_name is a private string',
                rule: { on: 'field', inClass: 'Item', name: '_name', visibility: 'private', type: 'string' },
              },
              {
                kind: 'structure',
                label: '_description is a private string',
                rule: { on: 'field', inClass: 'Item', name: '_description', visibility: 'private', type: 'string' },
              },
            ],
            hints: [
              'Same shape as any field: access level, type, name, semicolon.',
              'Both fields are strings, and both are private.',
              'One per line: private string _name; then private string _description;',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w3-t3-item-ctor',
          title: 'The Item class: constructor',
          blocks: [
            {
              t: 'text',
              md: 'The constructor takes both values as parameters and stores them.',
            },
          ],
          exercise: {
            prompt: 'Write a constructor that takes name and description and stores them in _name and _description.',
            seed: `public class Item
{
    private string _name;
    private string _description;

}`,
            editable: { from: 5, to: 5 },
            tests: [
              {
                kind: 'structure',
                label: 'Item has a constructor taking two parameters',
                rule: { on: 'ctor', inClass: 'Item', params: 2 },
              },
              {
                kind: 'runsClean',
                label: 'new Item("sword", "A bronze sword") runs without an error',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        Item i = new Item("sword", "A bronze sword");
    }
}`,
            hints: [
              'public Item(string name, string description) — two parameters, same order as the prompt.',
              'Assign each parameter to its matching field: _name = name; _description = description;',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w3-t3-item-rest',
          title: 'Reading an Item, and matching its identity',
          blocks: [
            {
              t: 'text',
              md: `\`Name\` and \`Description\` are read-only properties — nothing outside the class should be able to rename an item after it is created. \`HasId\` is how an \`Inventory\` will later ask "is this the item I am looking for?" — it takes the identifier the player typed and compares it against the item's name.`,
            },
          ],
          exercise: {
            prompt:
              'Add read-only properties Name and Description, and a HasId(string id) method that returns true when id matches _name.',
            seed: `public class Item
{
    private string _name;
    private string _description;

    public Item(string name, string description)
    {
        _name = name;
        _description = description;
    }

}`,
            editable: { from: 9, to: 9 },
            tests: [
              {
                kind: 'structure',
                label: 'Name is a read-only string property',
                rule: { on: 'property', inClass: 'Item', name: 'Name', hasGet: true, hasSet: false, type: 'string' },
              },
              {
                kind: 'structure',
                label: 'Description is a read-only string property',
                rule: {
                  on: 'property', inClass: 'Item', name: 'Description', hasGet: true, hasSet: false, type: 'string',
                },
              },
              {
                kind: 'structure',
                label: 'HasId takes one parameter and returns bool',
                rule: { on: 'method', inClass: 'Item', name: 'HasId', params: 1, returns: 'bool' },
              },
              {
                kind: 'output',
                label: 'HasId matches the name, and Name/Description read back correctly',
                expect: 'True\nFalse\nsword\nA bronze sword',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        Item i = new Item("sword", "A bronze sword");
        Console.WriteLine(i.HasId("sword"));
        Console.WriteLine(i.HasId("gem"));
        Console.WriteLine(i.Name);
        Console.WriteLine(i.Description);
    }
}`,
            hints: [
              'A read-only property has a get accessor and no set accessor.',
              'public string Name { get { return _name; } } — no setter, on purpose.',
              'HasId compares its parameter against _name with ==, and returns the result directly.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w3-t3-inventory-fields',
          title: 'The Inventory class: aggregation in code',
          blocks: [
            {
              t: 'text',
              md: `An \`Inventory\` **is made up of** \`Item\`s — the aggregation from this week's first lesson, now written as a field: not one \`Item\`, but a \`List<Item>\`.`,
            },
          ],
          exercise: {
            prompt: 'Add a private List<Item> field called _items, and a constructor that initialises it to an empty list.',
            seed: 'public class Inventory\n{\n\n}',
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: '_items is a private List<Item>',
                rule: { on: 'field', inClass: 'Inventory', name: '_items', visibility: 'private', type: 'List<Item>' },
              },
              {
                kind: 'structure',
                label: 'Inventory has a no-argument constructor',
                rule: { on: 'ctor', inClass: 'Inventory', params: 0 },
              },
              {
                kind: 'runsClean',
                label: 'new Inventory() runs without an error',
              },
            ],
            harness: `public class Item
{
    private string _name;
    public Item(string name) { _name = name; }
}

public class __Check
{
    public static void Main()
    {
        Inventory inv = new Inventory();
    }
}`,
            hints: [
              'private List<Item> _items; — the aggregation is one field, holding many.',
              'The constructor body assigns _items = new List<Item>();',
              'The empty list is what makes an Inventory start out with nothing in it.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w3-t3-inventory-put',
          title: 'PutItem',
          blocks: [
            {
              t: 'text',
              md: '`PutItem` is the simplest of the three methods — it just adds to the list.',
            },
          ],
          exercise: {
            prompt: 'Add a PutItem(Item item) method that adds item to _items.',
            seed: `public class Inventory
{
    private List<Item> _items;

    public Inventory()
    {
        _items = new List<Item>();
    }

}`,
            editable: { from: 9, to: 9 },
            tests: [
              {
                kind: 'structure',
                label: 'PutItem takes one parameter and returns void',
                rule: { on: 'method', inClass: 'Inventory', name: 'PutItem', params: 1, returns: 'void' },
              },
            ],
            hints: [
              'public void PutItem(Item item) { }',
              'Inside, call the list\'s own Add method: _items.Add(item);',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w3-t3-parsons',
          title: 'HasItem, in the right order',
          blocks: [
            {
              t: 'text',
              md: 'Before you write it yourself, put this scrambled version back in order. `HasItem` asks every Item in the list "is this you?" and stops as soon as one says yes.',
            },
            {
              t: 'parsons',
              caption: 'Inventory.cs',
              prompt: 'Order the lines of a correct HasItem method.',
              lines: [
                'public class Inventory',
                '{',
                '    public bool HasItem(string id)',
                '    {',
                '        foreach (Item i in _items)',
                '        {',
                '            if (i.HasId(id))',
                '            {',
                '                return true;',
                '            }',
                '        }',
                '        return false;',
                '    }',
                '}',
              ],
              explain:
                'The loop checks each Item in turn; the moment one matches, HasItem returns true immediately without checking the rest. If the loop finishes with no match, false is returned once at the end.',
            },
          ],
        },
        {
          id: 'w3-t3-inventory-hasitem',
          title: 'HasItem, for real',
          blocks: [
            {
              t: 'text',
              md: 'Now write it in your own Inventory class.',
            },
          ],
          exercise: {
            prompt: 'Add a HasItem(string id) method that returns true if any Item in _items has that id.',
            seed: `public class Inventory
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
            editable: { from: 13, to: 13 },
            tests: [
              {
                kind: 'structure',
                label: 'HasItem takes one parameter and returns bool',
                rule: { on: 'method', inClass: 'Inventory', name: 'HasItem', params: 1, returns: 'bool' },
              },
              {
                kind: 'output',
                label: 'Finds an item that was put in, and correctly reports one that was not',
                expect: 'True\nFalse',
              },
            ],
            harness: `public class Item
{
    private string _name;
    public Item(string name) { _name = name; }
    public bool HasId(string id) { return _name == id; }
}

public class __Check
{
    public static void Main()
    {
        Inventory inv = new Inventory();
        inv.PutItem(new Item("sword"));
        Console.WriteLine(inv.HasItem("sword"));
        Console.WriteLine(inv.HasItem("gem"));
    }
}`,
            hints: [
              'foreach (Item i in _items) walks every item currently stored.',
              'Ask each one: if (i.HasId(id)) — that reuses the method Item already provides.',
              'Return true the moment you find a match; return false once only, after the loop ends.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w3-t3-inventory-takeitem',
          title: 'TakeItem',
          blocks: [
            {
              t: 'text',
              md: `\`TakeItem\` is \`HasItem\`'s sibling with two extra jobs: it has to **remove** the match from the list, and **return** it (a \`Player\` needs the actual \`Item\` object to add to what they are carrying) — or return \`null\` if nothing matched.`,
            },
            {
              t: 'callout',
              tone: 'tip',
              title: '\`List<T>.Remove\` is already safe',
              md: 'Calling `_items.Remove(i)` when `i` is genuinely in the list removes it; there is no separate check needed first — the method already answers whether anything was removed. Use that, do not write your own removal logic.',
            },
          ],
          exercise: {
            prompt:
              'Add a TakeItem(string id) method: find the matching Item, remove it from _items, and return it. Return null if nothing matches.',
            seed: `public class Inventory
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
            editable: { from: 23, to: 23 },
            tests: [
              {
                kind: 'structure',
                label: 'TakeItem takes one parameter and returns Item',
                rule: { on: 'method', inClass: 'Inventory', name: 'TakeItem', params: 1, returns: 'Item' },
              },
              {
                kind: 'output',
                label: 'Removes and returns the match; a second HasItem check confirms it is gone',
                expect: 'True\nsword\nFalse',
              },
            ],
            harness: `public class Item
{
    private string _name;
    public Item(string name) { _name = name; }
    public string Name { get { return _name; } }
    public bool HasId(string id) { return _name == id; }
}

public class __Check
{
    public static void Main()
    {
        Inventory inv = new Inventory();
        inv.PutItem(new Item("sword"));

        bool foundFirst = inv.HasItem("sword");
        Item taken = inv.TakeItem("sword");

        Console.WriteLine(foundFirst);
        Console.WriteLine(taken.Name);
        Console.WriteLine(inv.HasItem("sword"));
    }
}`,
            hints: [
              'The loop looks the same as HasItem\'s — foreach (Item i in _items), check i.HasId(id).',
              'On a match: _items.Remove(i); then return i; — remove before you return.',
              'If the loop finishes with no match, return null; once, at the end.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w3-t3-final',
          title: 'The finished task',
          blocks: [
            {
              t: 'text',
              md: 'Put it together: an Inventory carrying two Items, one taken out again — a small slice of a room the player has just searched.',
            },
          ],
          exercise: {
            prompt:
              'Write a Main that: creates an Inventory, puts in a sword and a gem, prints whether it HasItem("gem"), takes the sword out and prints its Name, then prints whether it still HasItem("sword").',
            seed: `${''}public class Item
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
}

public class Inventory
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
}

public class Program
{
    static void Main()
    {

    }
}`,
            editable: { from: 47, to: 47 },
            tests: [
              {
                kind: 'output',
                label: 'Prints the three expected lines in order',
                expect: 'True\nsword\nFalse',
              },
            ],
            hints: [
              'Create the Inventory, then two Items — a sword and a gem — and PutItem each one.',
              'Console.WriteLine(inv.HasItem("gem")); comes first, and should print True.',
              'Item sword = inv.TakeItem("sword"); then Console.WriteLine(sword.Name); then Console.WriteLine(inv.HasItem("sword"));',
            ],
            tool: 'tests',
          },
        },
      ],
    },

    // ================================================================ lesson 5
    /*
     * The week's own test — see the note on `w2-checkpoint` for why it exists
     * and why it sits between the lab and the interview drill.
     *
     * Week 3's two examinable clusters are both recognition rather than
     * recall: telling four relationships apart from a one-line scenario, and
     * saying where a given thing lives in memory. So this checkpoint is mostly
     * scenarios and traces, deliberately shuffled between the two so that
     * neither becomes a rhythm to coast on.
     */
    {
      id: 'w3-checkpoint',
      title: 'Week 3 checkpoint',
      kind: 'quiz',
      minutes: 20,
      summary:
        'Relationships, memory and sequence diagrams, asked the way the paper asks them. No new material — this is the check.',
      steps: [
        {
          id: 'w3-cp-warmup',
          title: 'From memory first',
          blocks: [
            {
              t: 'text',
              md: 'Four relationships, and the one question that separates them. Write it out before you look at any options — this is the part of Week 3 the paper leans on hardest.',
            },
            {
              t: 'recall',
              prompt:
                'Name the four object relationships, weakest to strongest, and say what distinguishes each from the one before it.',
              nudge:
                'One of them lasts a single method call. Two of them are whole–part. The difference between those two is what happens to the parts when the whole is destroyed.',
              points: [
                'Dependency — "uses-a": a parameter, local variable or return value, gone when the method returns',
                'Association — "has-a": a field, so the link outlives any one call',
                'Aggregation — weak whole–part: the container holds parts that can exist without it',
                'Composition — strong whole–part: the parts are owned, and die with the whole',
                'The code test: a field means association or stronger; a parameter means dependency',
                'The ownership test: destroy the whole — do the parts survive?',
              ],
            },
          ],
        },

        {
          id: 'w3-cp-relationships',
          title: 'Classify the scenario',
          blocks: [
            {
              t: 'quiz',
              question:
                'A `Library` object contains many `Book` objects. Destroy the library and the books still exist. Which relationship?',
              options: ['Aggregation', 'Composition', 'Dependency', 'Inheritance'],
              answer: 0,
              why: [
                '',
                'Composition would require the books to be destroyed along with the library. These survive it.',
                'The books are held long-term in a collection, not used for the length of one method call.',
                'A book is not a kind of library — that would be an is-a, which is Week 4.',
              ],
              explain:
                'Quiz 3 Q6. Aggregation is the weak whole–part: the container groups parts it does not own.',
            },
            {
              t: 'quiz',
              question:
                'A `Book` object contains `Chapter` objects that cannot exist without it. Which relationship?',
              options: ['Composition', 'Aggregation', 'Dependency', 'Association only'],
              answer: 0,
              why: [
                '',
                'Aggregation is the version where the parts outlive the whole. A chapter with no book is nothing.',
                'The chapters are held for the whole life of the book, not borrowed for a call.',
                'It is an association — but the question asks for the specific whole–part flavour, and owned parts make it composition.',
              ],
              explain:
                'Quiz 3 Q5. Composition is strong ownership: if the whole is destroyed, so are the parts.',
            },
            {
              t: 'quiz',
              question:
                'A `Student` object temporarily uses a `LoanedLaptop` passed to one of its methods. Which relationship?',
              options: ['Dependency', 'Association', 'Aggregation', 'Composition'],
              answer: 0,
              why: [
                '',
                'An association needs a **field**. Nothing here is stored past the end of the method.',
                'Aggregation is containment held over time, and nothing is being contained.',
                'Composition would mean the student created the laptop and owned its lifetime.',
              ],
              explain:
                'Quiz 3 Q2. Parameter, local variable or return value → dependency. The link ends when the method does.',
            },
            {
              t: 'code',
              caption: 'Quiz 3 Q15',
              code: `public class BlackjackGame
{
    private Deck deck;

    public BlackjackGame()
    {
        deck = new Deck();
    }
}`,
            },
            {
              t: 'quiz',
              question: 'What relationship exists between `BlackjackGame` and `Deck` above?',
              options: [
                'Association — the deck is held in a field',
                'Dependency — the deck is created inside a method',
                'Inheritance — `BlackjackGame` extends `Deck`',
                'None — creating an object is not a relationship',
              ],
              answer: 0,
              why: [
                '',
                'A constructor is a method, but the deck is **stored in a field** rather than discarded — which is exactly what lifts this above a dependency.',
                'There is no `:` and no base type anywhere in the declaration.',
                'It is a relationship, and it belongs on the class diagram.',
              ],
              explain:
                'Quiz 3 Q15. Any has-a implemented as a class field is an association. (Creating it in the constructor makes this a *composition* strictly speaking — but composition is a specialised association, and when it is not among the options, association is the answer.)',
            },
            {
              t: 'quiz',
              question: 'Why identify object relationships early in a design?',
              options: [
                'It saves implementation effort and reduces later refactoring',
                'It removes the need to document the code',
                'It removes the need to test the code',
                'It lets you avoid applying OOP principles',
              ],
              answer: 0,
              why: [
                '',
                'Clear structure helps a reader, but documentation is still documentation.',
                'Nothing about a good design removes the need for unit or integration tests.',
                'Deciding relationships directly *applies* the principles — coupling, cohesion, encapsulation.',
              ],
              explain:
                'Quiz 3 Q16. Changing "the cart owns its products" to "the cart merely refers to them" is one line on a diagram and an expensive afternoon in code.',
            },
          ],
        },

        {
          id: 'w3-cp-alias-predict',
          title: 'Predict: two names, one object',
          blocks: [
            {
              t: 'predict',
              caption: 'Reference assignment',
              question: 'What does this print?',
              code: `public class Counter
{
    private int _count;

    public void Increment()
    {
        _count = _count + 1;
    }

    public int Count { get { return _count; } }
}

public class Program
{
    static void Main()
    {
        Counter a = new Counter();
        Counter b = a;
        b.Increment();
        Console.WriteLine(a.Count);
    }
}`,
              options: ['1', '0', '2', 'It refuses to compile'],
              answer: 0,
              why: [
                '',
                'That is the answer if `Counter b = a;` had copied the object. For a reference type it copies the **reference**, so both names point at one counter.',
                'Only one call to `Increment()` happens anywhere in the program.',
                'Assigning one reference to another is completely ordinary C#.',
              ],
              explain:
                'Two variables, one object on the heap. This is aliasing, and it is the single most common surprise when moving from value thinking to reference thinking — Quiz 3 Q7 and Q8 both turn on it.',
              expect: { output: '1' },
              tool: 'memory',
            },
            {
              t: 'quiz',
              question:
                'When you pass an object to a method, what is actually passed?',
              options: [
                'A copy of the reference — both sides then see the same heap object',
                'A copy of the entire object',
                'A pointer to the object\'s memory on the stack',
                'Nothing — objects cannot be passed to methods',
              ],
              answer: 0,
              why: [
                '',
                'Nothing is duplicated. Changes made through the parameter are visible to the caller, which would be impossible with a copy.',
                'Objects built with `new` live on the **heap**. Only the reference variable sits in the stack frame.',
                'Passing objects around is what every method in Swin Adventure does.',
              ],
              explain:
                'Quiz 3 Q7. The reference itself is passed by value — so you can change the object and the caller sees it, but reassigning the parameter changes only the method\'s own copy.',
            },
          ],
        },

        {
          id: 'w3-cp-memory',
          title: 'Where does it live?',
          blocks: [
            {
              t: 'code',
              caption: 'Quiz 3 Q12',
              code: `public class Person
{
    private string Name;
}

Person p = new Person();
p.Name = "Harry Porter";`,
            },
            {
              t: 'quiz',
              question: 'Where are `p` and the `Person` object stored?',
              options: [
                '`p` is a reference on the stack; the `Person` object is on the heap',
                'The whole `Person` object is on the stack',
                'Both `p` and the object are on the stack',
                '`p` is on the heap and `Name` is on the stack',
              ],
              answer: 0,
              why: [
                '',
                'Anything created with `new` is allocated on the heap, without exception.',
                'Only the reference variable `p` is a slot in the stack frame.',
                'Exactly backwards: `p` is a local, and object fields live with the object.',
              ],
              explain:
                'Quiz 3 Q12. Two separate questions every time — where the *variable* lives, and where the *object* lives.',
            },
            {
              t: 'quiz',
              question: 'Which of these, as a local variable, is stored directly on the stack?',
              options: ['`int`', '`string`', '`List<int>`', '`object`'],
              answer: 0,
              why: [
                '',
                '`string` is a reference type in C#, however much it behaves like a value. Its data is on the heap.',
                'A class, so the list object and its contents are heap-allocated.',
                '`System.Object` is the root reference type — the variable holds an address.',
              ],
              explain:
                'Quiz 3 Q3. Value types hold their data directly. The trap: that is only true *as locals* — a value type declared as a **field** lives inside its object, on the heap.',
            },
            {
              t: 'quiz',
              question: 'What happens when a method finishes executing?',
              options: [
                'Its stack frame is popped and control returns to just after the call',
                'Every object it created is destroyed immediately',
                'Its locals are moved to the heap for safekeeping',
                'The garbage collector runs before anything else can happen',
              ],
              answer: 0,
              why: [
                '',
                'Objects on the heap become *unreachable*, which is not the same as being freed. Collection happens later.',
                'Nothing is moved. Only the objects those locals referred to were ever on the heap.',
                'Collection is non-deterministic — it runs on the runtime\'s own thresholds, not on method exit.',
              ],
              explain:
                'Quiz 3 Q1. Popping a frame is one pointer move, which is why stack memory is cheap and why nothing on it can outlive its method.',
            },
            {
              t: 'quiz',
              question: 'Which best describes the garbage collector?',
              options: [
                'It automatically reclaims heap objects nothing can reach any more',
                'It clears memory the instant an object stops being used',
                'It prevents leaks by keeping every object in a fixed stack',
                'It frees local variables on the stack',
              ],
              answer: 0,
              why: [
                '',
                'Collection is non-deterministic. Losing the last reference makes an object *collectable*, not collected.',
                'Objects live on the managed heap. The stack is managed frame by frame, with no collector involved.',
                'Stack frames pop automatically as methods return; that has never been the GC\'s job.',
              ],
              explain:
                'Quiz 3 Q13. Reachability, not scope and not a clock — and only the heap. It is also why C# has no `delete` where C++ does.',
            },
          ],
        },

        {
          id: 'w3-cp-sequence',
          title: 'Reading a sequence diagram',
          blocks: [
            {
              t: 'quiz',
              question: 'What is the primary purpose of a UML sequence diagram?',
              options: [
                'To show the dynamic interactions between objects over time',
                'To describe the structure of classes and their attributes',
                'To represent the deployment of software components',
                'To illustrate the database schema for an application',
              ],
              answer: 0,
              why: [
                '',
                'That is a class diagram — a structure diagram, with no time axis at all.',
                'That is a deployment diagram, about where code runs.',
                'That is an entity-relationship diagram, and not UML at all.',
              ],
              explain:
                'Quiz 3 Q9. The vertical time axis is the tell: anything with one is a behaviour diagram.',
            },
            {
              t: 'table',
              caption: 'The four notations Quiz 3 asks about by name',
              headers: ['Notation', 'Meaning'],
              rows: [
                ['Vertical dashed line', 'A **lifeline** — that object\'s lifespan through the interaction'],
                ['Narrow rectangle on a lifeline', 'An **activation box** — the object is executing right now'],
                ['Solid line, filled arrowhead', 'A synchronous **call**; the sender waits'],
                ['Dashed line, open arrowhead', 'A **return** of control or data to the caller'],
                ['Large X at the foot of a lifeline', 'The object is destroyed at that point'],
              ],
            },
            {
              t: 'quiz',
              question:
                'Which is the difference between a lifeline and an activation box?',
              options: [
                'The lifeline is how long the object exists; the box is the stretch where it is executing',
                'The lifeline shows execution; the box shows the object\'s lifespan',
                'They are two names for the same dashed line',
                'The lifeline shows inheritance; the box shows composition',
              ],
              answer: 0,
              why: [
                '',
                'Exactly reversed — and this is the pairing Quiz 3\'s own traps table warns about.',
                'One is a dashed line, the other a narrow rectangle drawn on top of it.',
                'Neither has anything to do with class relationships; those live on a class diagram.',
              ],
              explain:
                'Quiz 3 Q4 and Q10. Dashed line = the object exists. Rectangle on it = the object is busy.',
            },
            {
              t: 'quiz',
              question: 'Which arrow represents a method call from one object to another?',
              options: [
                'Solid line with a filled arrowhead',
                'Dashed line with an open arrowhead',
                'Solid line with a hollow triangle',
                'Dotted line with a diamond',
              ],
              answer: 0,
              why: [
                '',
                'That is the **return** message, handing control or a value back to the caller.',
                'A hollow triangle is inheritance, and it belongs on a class diagram, not here.',
                'A diamond means aggregation or composition — again a class-diagram notation.',
              ],
              explain:
                'Quiz 3 Q14. Solid and filled means "I am calling you and waiting"; dashed and open means "here is your answer back".',
            },
          ],
        },

        {
          id: 'w3-cp-parsons',
          title: 'Rebuild the collaboration',
          blocks: [
            {
              t: 'text',
              md: 'The `Inventory`/`Item` pair from the lecture demo, scrambled. This is an aggregation: the inventory holds items it did not create, and they outlive it.',
            },
            {
              t: 'parsons',
              caption: 'Inventory.cs',
              prompt: 'Order the lines of an Inventory that holds a list of items.',
              lines: [
                'public class Inventory',
                '{',
                '    private List<Item> _items;',
                '    public Inventory()',
                '    {',
                '        _items = new List<Item>();',
                '    }',
                '    public void Put(Item item) { _items.Add(item); }',
                '    public int Count { get { return _items.Count; } }',
                '}',
              ],
              explain:
                'The field is declared before the constructor fills it, and `Put` takes an item made elsewhere rather than creating one — that is what makes this aggregation and not composition. Note the two relationships in one class: `Inventory` has an association with the list, and a dependency on `Item` through `Put`\'s parameter.',
            },
          ],
        },

        {
          id: 'w3-cp-exam',
          title: 'Under exam conditions',
          blocks: [
            {
              t: 'text',
              md: 'Four in the shape the paper asks them. Twenty seconds each.',
            },
            {
              t: 'quiz',
              question:
                'What is the main difference between reference types and value types?',
              options: [
                'Reference types store a reference to data on the heap; value types store the data directly',
                'Value types are always stored on the heap',
                'Reference types are faster to access than value types',
                'Value types may only be used inside methods',
              ],
              answer: 0,
              why: [
                '',
                'Value types are on the stack as locals, and inside their object on the heap when they are fields.',
                'The reverse, if anything: reaching heap data costs a dereference that stack access does not.',
                'Both kinds work as fields, parameters, return types and locals alike.',
              ],
              explain:
                'Quiz 3 Q8. What the storage *contains* — the data, or an address — is a separate question from where that storage *is*.',
            },
            {
              t: 'quiz',
              question:
                'In which scenario is **aggregation** the most appropriate choice?',
              options: [
                'A `Library` that contains many `Book` objects',
                'A `Teacher` that assigns `Homework` to students',
                'A `Player` that uses a `Weapon` during one round',
                'A `Game` that has a reference to a `Player`',
              ],
              answer: 0,
              why: [
                '',
                'Assigning is an interaction between independent entities — an association, with no whole–part meaning.',
                'Used for the length of the round and then forgotten: a dependency.',
                'A plain association — a has-a reference with no containment implied.',
              ],
              explain:
                'Quiz 3 Q6. Aggregation needs both halves: containment, *and* parts that can exist without the container.',
            },
            {
              t: 'quiz',
              question: 'What does an activation box on a lifeline represent?',
              options: [
                'The period during which the object is performing an operation',
                'The object\'s class attributes',
                'The object\'s memory address',
                'The end of the object\'s life',
              ],
              answer: 0,
              why: [
                '',
                'Attributes are shown in a class diagram\'s second compartment, never in a sequence diagram.',
                'Memory addresses are a runtime detail no UML diagram depicts.',
                'That is the large X drawn at the foot of the lifeline.',
              ],
              explain:
                'Quiz 3 Q4. It covers the whole time the object is executing — including while it waits for a method it called to return.',
            },
            {
              t: 'quiz',
              question:
                'A method creates three objects and returns without returning any of them. What happens at the moment it returns?',
              options: [
                'The frame is popped; the objects stay on the heap until the collector reclaims them',
                'The three objects are destroyed along with the frame',
                'The objects are moved onto the caller\'s frame',
                'The runtime reports a memory leak',
              ],
              answer: 0,
              why: [
                '',
                'Nothing is destroyed at return. They become *unreachable*, which is a different thing from being freed.',
                'Objects never move onto the stack; only references to them are ever there.',
                'Unreachable objects are the completely routine case, not an error.',
              ],
              explain:
                'Quiz 3 Q1 with Q13. Returning drops the last references, so the objects become collectable — and collection then happens whenever the GC decides, not at the closing brace.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'More of these',
              md: 'Concept focus holds around seventy questions on Week 3 alone, drawn fresh each sitting, and it keeps anything you miss on a list until you have revised it and proved it. Open it from the home page.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 6
    {
      id: 'w3-interview',
      title: 'Lab interview drill',
      kind: 'interview',
      minutes: 10,
      summary: 'Rehearse explaining relationships, memory, and your Inventory out loud before your tutor asks.',
      steps: [
        {
          id: 'w3-int-1',
          title: 'Same rubric as every week',
          blocks: [
            {
              t: 'callout',
              tone: 'key',
              md: 'Finishing the code caps you at 70%. The last 30% is entirely about explaining **why** — same rubric as Week 2. The questions below rehearse it against this week\'s material.',
            },
          ],
        },
      ],
    },
  ],
};

/** Interview questions for Week 3, asked against the student's own code. */
export const week3Interview: InterviewQuestion[] = [
  {
    id: 'w3-q1',
    question: 'What relationship does Inventory have with Item, and how do you know?',
    lookingFor: [
      'Aggregation — Inventory holds a collection (List<Item>) of Items',
      'A whole/part relationship: the Inventory "is made up of" its Items',
      'It is still a field, same as an association, but it holds many rather than one',
    ],
    aboutStep: 'w3-t3-inventory-fields',
  },
  {
    id: 'w3-q2',
    question: 'If PutItem took an Item as a parameter but never stored it, what relationship would that be instead?',
    lookingFor: [
      'A dependency, not an aggregation',
      'The Item would only exist for the duration of that one method call',
      'Nothing about the class would remember it afterwards',
    ],
  },
  {
    id: 'w3-q3',
    question: 'Where does the Item object created by `new Item(...)` live in memory, and where does the variable that names it live?',
    lookingFor: [
      'The Item object itself is on the heap',
      'The variable holding a reference to it is on the stack',
      '`new` is what puts it on the heap — never the stack',
    ],
  },
  {
    id: 'w3-q4',
    question: 'In TakeItem, why does the item still exist after the method returns, even though its local loop variable `i` is gone?',
    lookingFor: [
      'The stack slot for `i` disappears, but the Item object on the heap does not',
      'The caller receives the same reference `i` held, via the return value',
      'The object survives as long as something can still reach it — reachability, not which method created it',
    ],
    aboutStep: 'w3-t3-inventory-takeitem',
  },
  {
    id: 'w3-q5',
    question: 'What does HasItem do if two different Items in the inventory would both match the id?',
    lookingFor: [
      'It returns true on the first match and stops — the loop never reaches the second one',
      'That is a `return` inside the loop body, not after it',
    ],
    aboutStep: 'w3-t3-parsons',
  },
  {
    id: 'w3-q6',
    question: 'On your generated sequence diagram, why does Inventory\'s activation box stay open while Item\'s is active?',
    lookingFor: [
      'HasItem is still running — it is waiting for HasId to return before it can decide what to do next',
      'A synchronous call means the caller\'s activation does not close until the call it made returns',
    ],
    aboutStep: 'w3-t3-inventory-hasitem',
  },
];
