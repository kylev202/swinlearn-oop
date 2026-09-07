/**
 * Week 2 — Basic Objects: Counter and Shape.
 *
 * Sources: Week 1 + Week 2 lecture notes, OOP Lab2.pdf (Tasks 2.1 and 2.2).
 *
 * The lab PDF runs eight pages and mixes theory, UML, C# syntax rules and the
 * actual instructions into single numbered steps. Here each idea is its own
 * two-minute step with a runnable check, and the theory sits immediately
 * before the step that needs it rather than four pages earlier.
 *
 * Authoring note: markdown lives in template literals, so every inline-code
 * backtick must be escaped as \` — otherwise it closes the string.
 */

import type { InterviewQuestion, Week } from './types';

export const week2: Week = {
  number: 2,
  title: 'Basic Objects',
  subtitle: 'Counter and Shape — fields, constructors, properties, encapsulation',
  outcomes: [
    'Explain the difference between a class and an object without using the car analogy',
    'Name the four kinds of class member and say which are "knows" and which are "can do"',
    'Write a class with private fields and a constructor that initialises them',
    'Use properties to expose data safely, including read-only ones and a setter that refuses',
    'Predict what happens when two variables point at the same object, and when one is passed to a method',
    'Say out loud why a field is private — the question the lab interview opens with',
  ],
  sources: ['Week 1 lecture', 'Week 2 lecture', 'OOP Lab2.pdf — Tasks 2.1 & 2.2'],
  lessons: [
    // ================================================================ lesson 1
    {
      id: 'w2-objects',
      title: 'What an object actually is',
      kind: 'concept',
      minutes: 18,
      summary: 'The blueprint idea, made concrete by predicting what it does and then running it.',
      steps: [
        {
          id: 'w2-objects-1',
          title: 'Why not just use functions?',
          blocks: [
            {
              t: 'text',
              md: `Dr Vo opened the unit with a card game. Say you are writing Blackjack and you need to track 52 cards, a dealer, and several players.

The **procedural** way is variables plus functions that pass data around. It works, right up until it does not.`,
            },
            {
              t: 'compare',
              title: 'The same job, two ways',
              left: {
                title: 'Procedural',
                tone: 'bad',
                code: `int[] cardValues = new int[52];
string[] cardSuits = new string[52];
int player1Score;
int player2Score;

// and now every function needs to be
// handed all of it, every single time
int ScoreFor(int[] values, int[] hand)
{
    // ...
}`,
                md: 'The data and the logic drift apart. To follow one bug you have to trace every function that touches the arrays.',
              },
              right: {
                title: 'Object-oriented',
                tone: 'good',
                code: `Card card = new Card(Rank.Ace, Suit.Hearts);
Deck deck = new Deck();
Player player = new Player("Amy");

player.Draw(deck);
Console.WriteLine(player.Score);`,
                md: 'Each object carries its own data **and** the operations on it. To follow a bug you look inside one class.',
              },
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'The one sentence to remember',
              md: 'An **object** bundles what it *knows* (data) with what it *can do* (behaviour). A **class** is the blueprint that says which is which.',
            },
          ],
        },
        {
          id: 'w2-objects-members',
          title: 'The four things a class can hold',
          blocks: [
            {
              t: 'text',
              md: `A class declaration is a list of **members**, and for this whole semester there are only four kinds. Two of them are what the object knows. One is what it can do. One runs at the moment the object comes into existence.`,
            },
            {
              t: 'code',
              caption: 'Every member here is one of the four',
              code: `public class Book
{
    private int _pages;                                  // field       — knows

    public Book(int pages) { _pages = pages; }           // constructor — is built

    public int Pages { get { return _pages; } }          // property    — knows, safely

    public bool IsLong() { return _pages > 400; }        // method      — can do
}`,
            },
            {
              t: 'table',
              caption: 'The four members, and how each is drawn in UML',
              headers: ['Member', 'What it is', 'In the diagram'],
              rows: [
                ['**field**', 'A variable that belongs to the object. Almost always `private`.', '`- _pages: int`'],
                ['**property**', 'A guarded way in and out of a field. Almost always `public`.', '`«property» + Pages: int`'],
                ['**constructor**', 'Runs once, at the moment `new` builds the object.', '`+ Book(pages: int)`'],
                ['**method**', 'Something the object does.', '`+ IsLong(): bool`'],
              ],
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Private field, public property',
              md: `That pairing is most of what "encapsulation" means in a Week 2 marking rubric. The field holds the value; the property is the only road to it, so the class gets a say in what happens on the way through.`,
            },
            {
              t: 'quiz',
              question: 'Which member runs exactly once, at the moment `new` is used?',
              options: ['A method called `Main`', 'The constructor', 'The first property declared', 'Whichever field is declared first'],
              answer: 1,
              why: [
                '`Main` runs once per *program*, not once per object. A hundred `new Book(...)` calls do not run `Main` a hundred times.',
                '',
                'A property runs its `get` or `set` every time something reads or writes it — which may be never, or a thousand times.',
                'Fields do not run at all. They are storage; the constructor is what fills them.',
              ],
              explain:
                'The constructor is the object’s setup: it is handed the starting values and its job is to leave the new object in a state that makes sense.',
            },
          ],
        },
        {
          id: 'w2-objects-order',
          title: 'Put one together',
          blocks: [
            {
              t: 'text',
              md: `You have read a class. Now assemble one. The typing is not the hard part — the order is, and the order is a convention your tutor will expect to find.

Put these in the order this unit uses: **what it knows, how it is built, what it exposes, what it does.**`,
            },
            {
              t: 'parsons',
              caption: 'Book.cs',
              prompt: 'Drag the lines, or use the arrows, until the class reads in the conventional order.',
              lines: [
                'public class Book',
                '{',
                '    private int _pages;',
                '    public Book(int pages) { _pages = pages; }',
                '    public int Pages { get { return _pages; } }',
                '    public bool IsLong() { return _pages > 400; }',
                '}',
              ],
              explain: `Fields, then the constructor, then properties, then methods.

C# does not enforce any of that — the compiler is happy with any order. Every example in this unit follows it anyway, and so should your submission: a tutor reading your second file expects to find things where they were in your first.`,
            },
          ],
        },
        {
          id: 'w2-objects-2',
          title: 'One blueprint, many objects',
          blocks: [
            {
              t: 'text',
              md: `Here is a tiny class and two objects made from it. Before you run it, commit to an answer about the two local variables — this is the split that Week 3 assesses.`,
            },
            {
              t: 'predict',
              tool: 'memory',
              caption: 'Two objects, one class',
              question: '`john` and `maggie` are local variables in `Main`. What is actually stored in those two stack slots?',
              options: [
                'The two `Student` objects themselves, one sitting in each slot.',
                'A reference to a `Student` — an arrow. The objects themselves are on the heap.',
                'A copy of that student’s `_name` and `_gpa` values.',
                'Nothing, until the first time each one is printed.',
              ],
              answer: 1,
              why: [
                'That is how an `int` works, and it is why `int` is called a *value* type. A class is not one: the object is too big and too long-lived to live in a stack slot that disappears when `Main` returns.',
                '',
                'The fields belong to the object on the heap, not to the variable. Copying them into the variable would mean two `Student` objects could never share anything — and would break the aliasing behaviour you will meet in Task 2.1.',
                '`new Student(...)` builds the object right there on line 1. Nothing waits for a `WriteLine`.',
              ],
              explain: `Open the **Memory** panel and step through. Two stack slots, each holding an arrow; two \`Student\` objects on the heap, each with its own \`_name\` and \`_gpa\`.

Same blueprint. Different data. That is the whole idea.`,
              expect: { output: 'John has 3.5\nMaggie has 3.6' },
              code: `public class Student
{
    private string _name;
    private double _gpa;

    public Student(string name, double gpa)
    {
        _name = name;
        _gpa = gpa;
    }

    public string Name { get { return _name; } }
    public double Gpa  { get { return _gpa; } }
}

public class Program
{
    static void Main()
    {
        Student john = new Student("John", 3.5);
        Student maggie = new Student("Maggie", 3.6);

        Console.WriteLine(john.Name + " has " + john.Gpa);
        Console.WriteLine(maggie.Name + " has " + maggie.Gpa);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'What the diagram is showing you',
              md: `\`john\` and \`maggie\` are two boxes on the stack. Each holds an **arrow**, not a student. The actual \`Student\` objects live on the heap, and each has its own \`_name\` and \`_gpa\`.

Scrub the slider back and forth: the objects appear on the heap the instant \`new\` runs, not when the variable is declared.`,
            },
          ],
        },
        {
          id: 'w2-objects-identity',
          title: 'Two objects, same values',
          blocks: [
            {
              t: 'text',
              md: `Two students with identical marks are still two students. Objects have **identity** — being *the same object* is a different question from *holding the same values*, and C# answers the first one by default.`,
            },
            {
              t: 'predict',
              caption: 'Three comparisons',
              question: '`a` and `b` are built with the same number. `c` is assigned from `a`. What do the three lines print?',
              options: ['True\nTrue\nTrue', 'True\nFalse\nTrue', 'True\nFalse\nFalse', 'False\nFalse\nTrue'],
              answer: 1,
              why: [
                'That would mean `==` compares the values inside. On a class it does not — it asks whether both sides are the same object, and `a` and `b` were built by two separate `new` calls.',
                '',
                'The last line compares `a` with `c`, and `c` was assigned *from* `a` rather than built with `new`. No second object was ever created there.',
                'The first line compares two `int` values, `3` and `3`. `int` is a value type, so that is a plain numeric comparison and it is true.',
              ],
              explain: `\`a.X == b.X\` compares two \`int\`s: same value, true.

\`a == b\` compares two references: two separate \`new\` calls made two objects, so false — even though every field matches.

\`a == c\` compares two references that hold the same arrow, so true.`,
              expect: { output: 'True\nFalse\nTrue' },
              code: `public class Point
{
    private int _x;
    public Point(int x) { _x = x; }
    public int X { get { return _x; } }
}

public class Program
{
    static void Main()
    {
        Point a = new Point(3);
        Point b = new Point(3);
        Point c = a;

        Console.WriteLine(a.X == b.X);   // same value?
        Console.WriteLine(a == b);       // same object?
        Console.WriteLine(a == c);       // same object?
    }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Later, you can change this',
              md: `A class *can* be taught to compare by value — by overriding \`Equals\` and \`==\`, which is what C#’s \`record\` types do for you. Until a class says otherwise, assume \`==\` on an object means **same object**.`,
            },
          ],
        },
        {
          id: 'w2-objects-3',
          title: 'Check yourself',
          blocks: [
            {
              t: 'quiz',
              question: 'A class is best described as…',
              options: [
                'A running instance that holds real data',
                'A blueprint describing the attributes and behaviour a category of objects shares',
                'A folder that groups related files together',
                'A function that returns data',
              ],
              answer: 1,
              why: [
                'That is the *object*. The class is the description it was built from, and it exists in the source file whether or not the program is running.',
                '',
                'A namespace groups related types; a class is one type. They are often in one file each, but the file is not what makes it a class.',
                'A class can contain methods that return data, but the class itself declares a type — it is not itself callable.',
              ],
              explain:
                'The class is the template. The object is the thing built from it, holding its own values. Quiz 1 Q3 asks this almost word for word.',
            },
            {
              t: 'quiz',
              question: 'Objects bundle together…',
              options: [
                'Only data',
                'Only behaviour',
                'Data and the behaviour that operates on it',
                'Data and the file it is stored in',
              ],
              answer: 2,
              why: [
                'Data alone is a `struct` in C, or a row in a table. The bundling with behaviour is exactly what makes it an object.',
                'Behaviour alone is a function library — the procedural approach from step 1.',
                '',
                'Where an object is stored is the runtime’s business. Objects are not tied to files.',
              ],
              explain: 'Knows plus can-do. This is Quiz 1 Q14.',
            },
            {
              t: 'recall',
              prompt: `Away from the page: **what is the difference between a class and an object?**

Write it as you would say it out loud to a tutor — and without using the word *blueprint*, because leaning on the analogy is how students get caught when the follow-up question comes.`,
              nudge: 'Start with what exists while the program is still only text in a file, and what exists once it is running.',
              points: [
                'A class is a **declaration** — it describes the members that objects of that type will have',
                'An object is a thing built from it **while the program runs**, holding its own values in its own memory',
                'One class, many objects: they share the shape, not the data',
                '`new` is the moment one becomes the other',
                'The variable holding it is a **reference** to it, not the object itself',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 2
    {
      id: 'w2-task21',
      title: 'Task 2.1 — Build the Counter',
      kind: 'lab',
      minutes: 35,
      assessment: 'Assessed · 2% of your final grade',
      summary:
        'The real lab task, one idea at a time. You write every line — this is the code your tutor will interview you on.',
      steps: [
        {
          id: 'w2-21-uml',
          title: 'Read the diagram first',
          blocks: [
            {
              t: 'text',
              md: 'Every lab starts with a UML class diagram. Learning to read one *is* part of the assessment, so here is the target for the Counter class.',
            },
            {
              t: 'umlSpec',
              caption: 'Task 2.1 target — this is what you are building',
              source: `public class Counter
{
    private int _count;
    private string _name;
    public Counter(string name) { }
    public void Increment() { }
    public void Reset() { }
    public string Name { get { return ""; } set { } }
    public int Ticks { get { return 0; } }
}`,
            },
            {
              t: 'table',
              caption: 'How to read it',
              headers: ['Symbol', 'Means', 'In C#'],
              rows: [
                ['`-`', 'private', '`private int _count;`'],
                ['`+`', 'public', '`public void Increment()`'],
                ['`: int`', 'the type comes after the name', '`int _count`'],
                ['`«property»`', 'a virtual field with get/set', '`public string Name { get; set; }`'],
              ],
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Typo in the official PDF',
              md: `The diagram in \`OOP Lab2.pdf\` lists \`- _name: int\`. That is a mistake — a name is text, so it must be \`string\`. The written instructions on the next page say \`string\`. Build it as a **string**.`,
            },
          ],
        },
        {
          id: 'w2-21-class',
          title: 'Create the class',
          blocks: [
            {
              t: 'text',
              md: 'Start with the shell. A class declaration is the keyword `class`, a name, and a pair of braces.',
            },
            {
              t: 'callout',
              tone: 'tip',
              md: 'Convention, and the tutors check it: **one class per file**, and the file name matches the class name — `Counter.cs` holds `class Counter`.',
            },
          ],
          exercise: {
            prompt: 'Declare a public class called Counter.',
            seed: '// Counter.cs\n\n',
            tests: [
              {
                kind: 'structure',
                label: 'A class called Counter exists',
                rule: { on: 'class', name: 'Counter' },
              },
            ],
            hints: [
              'A class declaration needs three things: an access level, the keyword class, and a name.',
              'The access level here is public, so other files can use it.',
              'The shape is: public class Name, followed by an opening { and a closing }.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w2-21-fields',
          title: 'What a Counter knows',
          blocks: [
            {
              t: 'text',
              md: `A Counter knows two things: **its count** and **its name**. Those become fields.

The leading underscore is a naming convention for private fields. It is not required by C#, but this unit uses it and your tutor will expect it.`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Why private?',
              md: `If \`_count\` were public, anything could set it to −9000 and skip \`Increment\` entirely. Private means the object controls its own state. That is **encapsulation**, and it is the point of the whole task.`,
            },
          ],
          exercise: {
            prompt: 'Add the two private fields from the diagram: _count (an int) and _name (a string).',
            seed: 'public class Counter\n{\n\n}',
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: '_count is a private int',
                rule: { on: 'field', inClass: 'Counter', name: '_count', visibility: 'private', type: 'int' },
              },
              {
                kind: 'structure',
                label: '_name is a private string',
                rule: { on: 'field', inClass: 'Counter', name: '_name', visibility: 'private', type: 'string' },
              },
            ],
            hints: [
              'A field declaration is: access level, type, name, semicolon.',
              'The diagram writes "- _count: int". In C# the type comes before the name.',
              'One field per line, and each line ends with a semicolon.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w2-21-ctor',
          title: 'The constructor',
          blocks: [
            {
              t: 'text',
              md: `A **constructor** runs once, when the object is created. Its job is to leave the object in a valid state.

Two rules give it away: it has the **same name as the class**, and it has **no return type** — not even \`void\`.`,
            },
            {
              t: 'code',
              caption: 'The shape',
              code: `public ClassName(parameters)
{
    // assign the fields
}`,
            },
          ],
          exercise: {
            prompt:
              'Write a constructor that takes a string name, stores it in _name, and sets _count to 0.',
            seed: `public class Counter
{
    private int _count;
    private string _name;

}`,
            editable: { from: 5, to: 5 },
            tests: [
              {
                kind: 'structure',
                label: 'Counter has a constructor taking one parameter',
                rule: { on: 'ctor', inClass: 'Counter', params: 1 },
              },
              {
                kind: 'structure',
                label: 'The constructor is public',
                rule: { on: 'ctor', inClass: 'Counter', params: 1, visibility: 'public' },
              },
              {
                kind: 'runsClean',
                label: 'new Counter("test") runs without an error',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        Counter c = new Counter("test");
    }
}`,
            hints: [
              'The constructor is named exactly Counter — same as the class.',
              'Do not write a return type. "public Counter(string name)" is the whole signature.',
              'Inside, assign the parameter to one field, then set the other to 0.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w2-21-methods',
          title: 'Increment and Reset',
          blocks: [
            {
              t: 'text',
              md: `Now the two behaviours. \`Increment()\` adds one to the count. \`Reset()\` puts it back to zero.

Both return nothing, so both are \`void\`. Both are \`public\`, because the outside world needs to call them.`,
            },
          ],
          exercise: {
            prompt: 'Add the Increment() and Reset() methods.',
            seed: `public class Counter
{
    private int _count;
    private string _name;

    public Counter(string name)
    {
        _name = name;
        _count = 0;
    }

}`,
            editable: { from: 11, to: 11 },
            tests: [
              {
                kind: 'structure',
                label: 'Increment() takes no parameters and returns void',
                rule: {
                  on: 'method', inClass: 'Counter', name: 'Increment',
                  params: 0, returns: 'void', visibility: 'public',
                },
              },
              {
                kind: 'structure',
                label: 'Reset() takes no parameters and returns void',
                rule: {
                  on: 'method', inClass: 'Counter', name: 'Reset',
                  params: 0, returns: 'void', visibility: 'public',
                },
              },
            ],
            hints: [
              'A method with no return value is declared void.',
              'Increment needs to change _count. You can read the current value and add one to it.',
              'The two bodies are a single assignment each.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w2-21-prop-name',
          title: 'The Name property',
          blocks: [
            {
              t: 'text',
              md: `The fields are private, so nothing outside can read them. A **property** is the controlled door in.

From the outside a property looks like a field. Inside, it is a pair of methods: \`get\` returns a value, \`set\` receives one through a hidden parameter called \`value\`.`,
            },
            {
              t: 'code',
              caption: 'The general shape, from the lab PDF',
              code: `public [TYPE] PropertyName
{
    get
    {
        return ...;
    }
    set
    {
        ... = value;
    }
}`,
            },
            {
              t: 'callout',
              tone: 'tip',
              md: 'You never declare `value`. C# supplies it inside `set`, holding whatever was assigned.',
            },
          ],
          exercise: {
            prompt: 'Add a public Name property with both a get and a set, backed by _name.',
            seed: `public class Counter
{
    private int _count;
    private string _name;

    public Counter(string name)
    {
        _name = name;
        _count = 0;
    }

    public void Increment() { _count = _count + 1; }
    public void Reset() { _count = 0; }

}`,
            editable: { from: 15, to: 15 },
            tests: [
              {
                kind: 'structure',
                label: 'Name is a public string property',
                rule: { on: 'property', inClass: 'Counter', name: 'Name', visibility: 'public', type: 'string' },
              },
              {
                kind: 'structure',
                label: 'Name can be read (has a get)',
                rule: { on: 'property', inClass: 'Counter', name: 'Name', hasGet: true },
              },
              {
                kind: 'structure',
                label: 'Name can be changed (has a set)',
                rule: { on: 'property', inClass: 'Counter', name: 'Name', hasSet: true },
              },
              {
                kind: 'expression',
                label: 'Setting Name, then reading it, gives the new value',
                setup: 'Counter c = new Counter("first"); c.Name = "second";',
                expr: 'c.Name',
                expect: 'second',
              },
            ],
            hints: [
              'The property is "public string Name" followed by a block containing get and set.',
              'The get must return the field.',
              'The set assigns the built-in "value" into the field.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w2-21-prop-ticks',
          title: 'A read-only property',
          blocks: [
            {
              t: 'text',
              md: `\`Ticks\` exposes the count — but the outside world must not be able to *set* it. The only legitimate ways to change a count are \`Increment()\` and \`Reset()\`.

So \`Ticks\` gets a \`get\` and **no** \`set\`. The diagram signals this by listing it without a setter.`,
            },
            {
              t: 'callout',
              tone: 'key',
              md: `This is the moment encapsulation earns its keep. \`Ticks\` is readable, not writable, and that is a **design decision** you can defend in the interview.`,
            },
          ],
          exercise: {
            prompt: 'Add a read-only Ticks property that returns _count.',
            seed: `public class Counter
{
    private int _count;
    private string _name;

    public Counter(string name)
    {
        _name = name;
        _count = 0;
    }

    public void Increment() { _count = _count + 1; }
    public void Reset() { _count = 0; }

    public string Name
    {
        get { return _name; }
        set { _name = value; }
    }

}`,
            editable: { from: 21, to: 21 },
            tests: [
              {
                kind: 'structure',
                label: 'Ticks is a public int property',
                rule: { on: 'property', inClass: 'Counter', name: 'Ticks', visibility: 'public', type: 'int' },
              },
              {
                kind: 'structure',
                label: 'Ticks has a get',
                rule: { on: 'property', inClass: 'Counter', name: 'Ticks', hasGet: true },
              },
              {
                kind: 'structure',
                label: 'Ticks has NO set — it is read-only',
                rule: { on: 'property', inClass: 'Counter', name: 'Ticks', hasSet: false },
              },
              {
                kind: 'expression',
                label: 'Incrementing twice makes Ticks report 2',
                setup: 'Counter c = new Counter("t"); c.Increment(); c.Increment();',
                expr: 'c.Ticks',
                expect: '2',
              },
            ],
            hints: [
              'Same shape as Name, but leave the set out entirely.',
              'A property with only a get is read-only.',
              'It returns _count, and its type is int.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w2-21-print',
          title: 'PrintCounters',
          blocks: [
            {
              t: 'text',
              md: `The lab gives you pseudocode:

    PrintCounters(counters)
    1: foreach c in counters
    2:   Tell Console to WriteLine with the format "{0} is {1}"
    3:   and the result of Tell c to Name
    4:   and the result of Tell c to Ticks

Two pieces of syntax you need for it.`,
            },
            {
              t: 'table',
              headers: ['Piece', 'What it does'],
              rows: [
                ['`foreach (Counter c in counters)`', 'Visits each element. The loop variable needs its type.'],
                ['`Console.WriteLine("{0} is {1}", a, b)`', '`{0}` is replaced by `a`, `{1}` by `b`.'],
                ['`static`', 'The method belongs to the class, not an object, so no `new Program()` is needed.'],
              ],
            },
          ],
          exercise: {
            prompt: 'Fill in PrintCounters so it prints one line per counter, in the form "Name is Ticks".',
            seed: `public class Counter
{
    private int _count;
    private string _name;
    public Counter(string name) { _name = name; _count = 0; }
    public void Increment() { _count = _count + 1; }
    public void Reset() { _count = 0; }
    public string Name { get { return _name; } set { _name = value; } }
    public int Ticks { get { return _count; } }
}

public class Program
{
    private static void PrintCounters(Counter[] counters)
    {

    }

    static void Main()
    {
        Counter[] cs = new Counter[2];
        cs[0] = new Counter("Counter 1");
        cs[1] = new Counter("Counter 2");
        cs[0].Increment();
        cs[0].Increment();
        cs[1].Increment();
        PrintCounters(cs);
    }
}`,
            editable: { from: 15, to: 15 },
            tests: [
              {
                kind: 'output',
                label: 'Prints each counter as "Name is Ticks"',
                expect: 'Counter 1 is 2\nCounter 2 is 1',
              },
            ],
            hints: [
              'Start with: foreach (Counter c in counters)',
              'Inside the loop, one Console.WriteLine call.',
              'Pass three things: the format string, then c.Name, then c.Ticks.',
            ],
            tool: 'console',
          },
        },
        {
          id: 'w2-21-aliasing',
          title: 'The line that catches everyone',
          blocks: [
            {
              t: 'text',
              md: `The lab's Main pseudocode has a line that looks harmless:

    myCounters[2] := myCounters[0]

Before you run this, decide what you expect. The program increments \`[0]\` nine times and \`[1]\` fourteen times, prints, then calls \`Reset()\` on \`[2]\` and prints again.

**What do you think the second block prints?**`,
            },
            {
              t: 'runnable',
              tool: 'memory',
              caption: 'Run it, then open Memory and step to the assignment',
              code: `public class Counter
{
    private int _count;
    private string _name;
    public Counter(string name) { _name = name; _count = 0; }
    public void Increment() { _count = _count + 1; }
    public void Reset() { _count = 0; }
    public string Name { get { return _name; } set { _name = value; } }
    public int Ticks { get { return _count; } }
}

public class Program
{
    private static void PrintCounters(Counter[] counters)
    {
        foreach (Counter c in counters)
        {
            Console.WriteLine("{0} is {1}", c.Name, c.Ticks);
        }
    }

    static void Main()
    {
        Counter[] myCounters = new Counter[3];
        myCounters[0] = new Counter("Counter 1");
        myCounters[1] = new Counter("Counter 2");
        myCounters[2] = myCounters[0];

        for (int i = 1; i <= 9; i++)  { myCounters[0].Increment(); }
        for (int i = 1; i <= 14; i++) { myCounters[1].Increment(); }

        PrintCounters(myCounters);
        myCounters[2].Reset();
        PrintCounters(myCounters);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why "Counter 1" resets twice',
              md: `Look at the heap in the Memory panel. There are only **two** Counter objects, not three. \`myCounters[2] = myCounters[0]\` copied the **arrow**, not the object.

So \`[0]\` and \`[2]\` are two names for one object. Resetting through \`[2]\` is resetting \`[0]\`.

This is exactly what Quiz 3 Q7 tests: *when passing an object to a method, what is actually passed?* A copy of the reference — not a copy of the object.`,
            },
            {
              t: 'quiz',
              question: 'After `myCounters[2] = myCounters[0];`, how many Counter objects exist on the heap?',
              options: ['3', '2', '1', 'It depends on the constructor'],
              answer: 1,
              explain:
                'Only two were ever created with new. The third slot holds a second reference to the first object.',
            },
          ],
        },
        {
          id: 'w2-21-overflow',
          title: 'Steps 12 and 13 — your personalised number',
          blocks: [
            {
              t: 'text',
              md: `The lab asks you to add a \`ResetByDefault\` method that sets the count to **{{resetLiteral}}** — that is \`21474836\` followed by the last four digits of your student ID ({{XXXX}}).

Then step 13 asks you to add 5 to it and explain whether the program still runs.`,
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Try the literal number first — it will not fit',
              md: `\`{{resetLiteral}}\` is far larger than an \`int\` can hold. The maximum is \`2147483647\`.

That is not you making a mistake, and it is worth raising with your tutor. It is also the doorway to what step 13 is really about, so let us go through it properly.`,
            },
            {
              t: 'runnable',
              tool: 'console',
              caption: 'Where int runs out',
              code: `public class Program
{
    static void Main()
    {
        Console.WriteLine("int.MaxValue is " + int.MaxValue);

        int atTheEdge = int.MaxValue;
        Console.WriteLine("At the edge:    " + atTheEdge);

        atTheEdge = atTheEdge + 5;
        Console.WriteLine("After adding 5: " + atTheEdge);

        long roomy = 21474836{{XXXX}};
        Console.WriteLine("As a long, your number fits: " + roomy);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'The answer step 13 is fishing for',
              md: `Adding 5 does **not** crash. By default C# compiles arithmetic in an **unchecked** context, so the value silently wraps around past the maximum and comes out negative.

Wrap the same code in \`checked { }\` and it throws an \`OverflowException\` instead. That is the distinction the linked Microsoft Learn page is teaching.

Write that explanation as a comment in your submitted code — the lab asks for it, and a tutor may well ask you to say it out loud.`,
            },
          ],
          exercise: {
            prompt:
              'Add a ResetByDefault() method to Counter that sets the count to the largest value an int can hold.',
            seed: `public class Counter
{
    private int _count;
    private string _name;
    public Counter(string name) { _name = name; _count = 0; }
    public void Increment() { _count = _count + 1; }
    public void Reset() { _count = 0; }
    public string Name { get { return _name; } set { _name = value; } }
    public int Ticks { get { return _count; } }

}`,
            editable: { from: 10, to: 10 },
            tests: [
              {
                kind: 'structure',
                label: 'ResetByDefault() exists and returns void',
                rule: { on: 'method', inClass: 'Counter', name: 'ResetByDefault', params: 0, returns: 'void' },
              },
              {
                kind: 'expression',
                label: 'After ResetByDefault(), Ticks is int.MaxValue',
                setup: 'Counter c = new Counter("t"); c.ResetByDefault();',
                expr: 'c.Ticks',
                expect: '2147483647',
              },
              {
                kind: 'expression',
                label: 'Incrementing past the maximum wraps around instead of crashing',
                setup: 'Counter c = new Counter("t"); c.ResetByDefault(); c.Increment();',
                expr: 'c.Ticks',
                expect: '-2147483648',
              },
            ],
            hints: [
              'C# gives you the limit as a built-in constant on the int type.',
              'It is int.MaxValue.',
              'The method body is a single assignment to _count.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w2-21-final',
          title: 'Put it together',
          blocks: [
            {
              t: 'text',
              md: 'One last run of the whole task, exactly as the PDF specifies it. This is what you save and bring to the lab.',
            },
          ],
          exercise: {
            prompt:
              'Write the complete Task 2.1: the Counter class, PrintCounters, and the Main from the lab pseudocode.',
            seed: `public class Counter
{
    // your Counter class
}

public class Program
{
    private static void PrintCounters(Counter[] counters)
    {
        // print each as "Name is Ticks"
    }

    static void Main()
    {
        // 1. an array of three Counter objects
        // 2. [0] = "Counter 1", [1] = "Counter 2", [2] = [0]
        // 3. increment [0] nine times, [1] fourteen times
        // 4. PrintCounters
        // 5. reset [2]
        // 6. PrintCounters again
    }
}`,
            tests: [
              {
                kind: 'structure',
                label: 'Counter still has its private _count field',
                rule: { on: 'field', inClass: 'Counter', name: '_count', visibility: 'private', type: 'int' },
              },
              {
                kind: 'structure',
                label: 'Ticks is still read-only',
                rule: { on: 'property', inClass: 'Counter', name: 'Ticks', hasSet: false },
              },
              {
                kind: 'output',
                label: 'The full program output matches the specification',
                expect: `Counter 1 is 9
Counter 2 is 14
Counter 1 is 9
Counter 1 is 0
Counter 2 is 14
Counter 1 is 0`,
              },
            ],
            hints: [
              'You have written every piece already — bring them together.',
              'A loop written "for (int i = 1; i <= 9; i++)" runs nine times. The lab asks how many iterations "for i := 1 to 4" has; the answer is four.',
              'The third slot must be assigned from the first slot, not from a new Counter.',
            ],
            tool: 'console',
          },
        },
      ],
    },

    // ================================================================ lesson 3
    {
      id: 'w2-references',
      title: 'References: two names, one object',
      kind: 'concept',
      minutes: 14,
      summary:
        'What a variable of a class type really holds — and the four bugs that follow from getting it wrong.',
      steps: [
        {
          id: 'w2-ref-value-vs-ref',
          title: 'Two camps of type',
          blocks: [
            {
              t: 'text',
              md: `You have just been caught by \`myCounters[2] = myCounters[0]\`. That was not a quirk of arrays. It follows from one rule that runs through the whole language.

C# sorts every type into two camps, and which camp a type is in decides what \`=\` does to it.`,
            },
            {
              t: 'predict',
              caption: 'One int, one object, both copied',
              question:
                '`b` is copied from `a`, and `q` is copied from `p`. Each copy is then changed. What is left in `a` and in `p`?',
              options: ['a = 5\np.Value = 5', 'a = 5\np.Value = 99', 'a = 99\np.Value = 99', 'a = 99\np.Value = 5'],
              answer: 1,
              why: [
                'That would mean `q = p` also made a second `Box`, so that changing `q` left `p` alone. Nothing in that line says `new`, and `new` is the only thing that makes an object.',
                '',
                'It would take `b = a` copying an *arrow to a 5*. `int` does not work that way — an `int` variable holds the number itself, so there is nothing to share.',
                'This is the two answers swapped: it treats `int` as the shared one and the object as the copied one. It is exactly backwards.',
              ],
              explain: `\`int\` is a **value type**: \`b = a\` copies the 5, and there are now two independent fives.

\`Box\` is a **reference type**: \`q = p\` copies the *arrow*. There is still exactly one \`Box\`, and \`q.Value = 99\` changed the only one there is.`,
              expect: { output: 'a = 5\np.Value = 99' },
              code: `public class Box
{
    public int Value { get; set; }
}

public class Program
{
    static void Main()
    {
        int a = 5;
        int b = a;
        b = 99;
        Console.WriteLine("a = " + a);

        Box p = new Box();
        p.Value = 5;
        Box q = p;
        q.Value = 99;
        Console.WriteLine("p.Value = " + p.Value);
    }
}`,
            },
            {
              t: 'table',
              caption: 'Which camp is which',
              headers: ['Type', 'Camp', 'What assignment copies'],
              rows: [
                ['`int`, `double`, `bool`, `char`', 'value', 'the value itself'],
                ['`struct` (you will meet these later)', 'value', 'the whole thing, field by field'],
                ['any `class` you write', '**reference**', 'the arrow — not the object'],
                ['arrays, `List<T>`, `Dictionary<K,V>`', '**reference**', 'the arrow — not the contents'],
                ['`string`', 'reference, but never bites you', 'a string cannot be changed once made, so sharing one is safe'],
              ],
            },
          ],
        },
        {
          id: 'w2-ref-aliasing',
          title: 'What assignment really copies',
          blocks: [
            {
              t: 'text',
              md: `Here is the Task 2.1 trap with the array taken away, so there is nowhere for it to hide. Two variables, one \`new\`.

Run it, then open **Memory** and step to the line \`Counter second = first;\`. Count the objects on the heap.`,
            },
            {
              t: 'runnable',
              tool: 'memory',
              caption: 'Two names, one counter',
              code: `public class Counter
{
    private int _count;
    private string _name;
    public Counter(string name) { _name = name; _count = 0; }
    public void Increment() { _count = _count + 1; }
    public string Name { get { return _name; } }
    public int Ticks { get { return _count; } }
}

public class Program
{
    static void Main()
    {
        Counter first = new Counter("Downstairs");
        Counter second = first;

        first.Increment();
        second.Increment();

        Console.WriteLine(first.Name + ": " + first.Ticks);
        Console.WriteLine(second.Name + ": " + second.Ticks);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'One object, two arrows',
              md: `There is one \`Counter\` on the heap. \`first\` and \`second\` are two arrows pointing at it, so the two \`Increment()\` calls both landed on the same object — hence **2**, twice, under the same name.

The heap only ever grows when something says \`new\`. Count the \`new\`s and you have counted the objects.`,
            },
            {
              t: 'quiz',
              question: 'How many objects did the line `Counter second = first;` create?',
              options: [
                'One new Counter, copied from the first',
                'None — it copied a reference',
                'Two: one for each variable',
                'It depends what the constructor does',
              ],
              answer: 1,
              why: [
                'There is no `new` on that line, and copying an object is something C# never does for you implicitly. If you want a copy you have to write one.',
                '',
                'Only one `new` appears in the whole method, on the line above.',
                'The constructor only runs when `new` runs. This line never reaches it.',
              ],
              explain:
                'Assignment between reference variables copies the reference. To get a second object you have to call `new` a second time.',
            },
          ],
        },
        {
          id: 'w2-ref-parameters',
          title: 'Handing an object to a method',
          blocks: [
            {
              t: 'text',
              md: `C# passes arguments **by value** — always. The subtlety is what the value *is*: for a class, the value being copied is the arrow.

Three methods below. One changes the object it was handed, one points its own parameter at a brand new object, and one changes a number.`,
            },
            {
              t: 'predict',
              caption: 'Which changes survive the return?',
              question: 'What does `Main` see after calling `Fill`, then `Replace`, then `Bump`?',
              options: [
                'after Fill:    99\nafter Replace: 7\nafter Bump:    101',
                'after Fill:    99\nafter Replace: 99\nafter Bump:    1',
                'after Fill:    1\nafter Replace: 1\nafter Bump:    1',
                'after Fill:    99\nafter Replace: 7\nafter Bump:    1',
              ],
              answer: 1,
              why: [
                'This assumes a method can move the caller’s variable and change the caller’s `int`. Neither is true without the `ref` keyword.',
                '',
                'This assumes the object itself is copied on the way in, so nothing a method does can be seen outside. Then no method could ever change an object it was given, and half of OOP would not work.',
                '`Replace` did point its parameter at a new `Box` with 7 in it — but at its **own copy** of the arrow. `Main`’s arrow never moved, so `box` still names the old object.',
              ],
              explain: `\`Fill\` followed the arrow it was handed and changed the object at the far end, so \`Main\` sees **99**.

\`Replace\` overwrote its own copy of the arrow. The new \`Box\` it built is unreachable the moment the method returns, and \`Main\` still points at the old one.

\`Bump\` was handed a copy of the number and threw it away.

**The reference is copied; the object it points at is not.** That is the answer to Quiz 3 Q7, which asks exactly this.`,
              expect: { output: 'after Fill:    99\nafter Replace: 99\nafter Bump:    1' },
              code: `public class Box
{
    public int Value { get; set; }
}

public class Program
{
    static void Fill(Box b)    { b.Value = 99; }
    static void Replace(Box b) { b = new Box(); b.Value = 7; }
    static void Bump(int n)    { n = n + 100; }

    static void Main()
    {
        Box box = new Box();
        box.Value = 1;
        int number = 1;

        Fill(box);
        Console.WriteLine("after Fill:    " + box.Value);

        Replace(box);
        Console.WriteLine("after Replace: " + box.Value);

        Bump(number);
        Console.WriteLine("after Bump:    " + number);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'If you really did want Replace to work',
              md: `There is a keyword for it — \`ref\` — which hands the method the caller’s variable rather than a copy of what is in it. Nothing in this unit needs it, and reaching for it is usually a sign the design wants rethinking. Know that it exists and why it would be needed.`,
            },
          ],
        },
        {
          id: 'w2-ref-null',
          title: 'An arrow pointing nowhere',
          blocks: [
            {
              t: 'text',
              md: `A reference variable that has not been given an object holds \`null\` — the arrow exists, it just points nowhere.

A field you never assign starts that way. Run this and read the error carefully; it is the single most common crash in first-year C#.`,
            },
            {
              t: 'runnable',
              tool: 'console',
              caption: 'A field the constructor forgot',
              code: `public class Team
{
    private string _captain;
    public string Captain { get { return _captain; } }
}

public class Program
{
    static void Main()
    {
        Team t = new Team();
        Console.WriteLine("Captain is: " + t.Captain);
        Console.WriteLine(t.Captain.Length);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why the first line was fine and the second was not',
              md: `Sticking \`null\` onto a string prints nothing at all — so line one succeeded and told you nothing was wrong. Line two asked \`null\` for its \`.Length\`, and there is nobody there to ask.

This is the argument for constructors doing their job: **leave the new object in a state that makes sense**. A \`Counter\` whose \`_name\` was never assigned is a \`Counter\` waiting to throw.`,
            },
            {
              t: 'quiz',
              question:
                'A `string` field that the constructor never assigns starts out holding…',
              options: ['An empty string, `""`', '`null`', 'Whatever happened to be in that memory', 'Nothing — it will not compile'],
              answer: 1,
              why: [
                'Close, and it matters: `"".Length` is `0` and perfectly safe, while `null.Length` throws. They print identically, which is what makes this bug hard to see.',
                '',
                'That is C and C++. The .NET runtime zeroes every field before a constructor runs, which for a reference type means `null`.',
                'It compiles happily. C# only refuses to let you read an unassigned **local variable**; fields get a default instead.',
              ],
              explain:
                'Reference fields default to `null`, numeric fields to `0`, `bool` to `false`. The default is never garbage — but `null` is not a usable string.',
            },
          ],
        },
        {
          id: 'w2-ref-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'quiz',
              question: 'When you pass an object to a method, what is actually passed?',
              options: [
                'A copy of the object',
                'A copy of the reference to the object',
                'The object itself, moved out of the caller',
                'Nothing — methods cannot take objects',
              ],
              answer: 1,
              why: [
                'Copying the object would mean the method could never change anything the caller sees. `Fill` in the last step proves that is not what happens.',
                '',
                'Nothing is moved. The caller still holds its own arrow to the same object the whole time.',
                'Methods take objects constantly — that is most of what a method signature is for.',
              ],
              explain:
                'Quiz 3 Q7. The reference is copied, so both the caller and the method point at one object: changes to the object show up in both, but repointing the parameter changes nothing outside.',
            },
            {
              t: 'recall',
              prompt: `Your tutor puts a finger on this line in your Task 2.1 code and asks what it does:

    myCounters[2] = myCounters[0];

Answer them. Out loud is better than in your head.`,
              nudge:
                'Say what the line creates, then say how many objects the array ends up pointing at, then say what that means for `Reset()`.',
              points: [
                'It copies a **reference**, not a Counter — there is no `new` on that line',
                'The array ends up with **two** Counter objects in three slots',
                '`[0]` and `[2]` are two names for one object',
                'So `myCounters[2].Reset()` resets the counter that `[0]` also names — which is why "Counter 1" goes to zero',
                'And `[1]` is untouched, because it is a genuinely separate object',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 4
    {
      id: 'w2-encapsulation',
      title: 'Encapsulation, and why the compiler is on your side',
      kind: 'concept',
      minutes: 16,
      summary: 'What private actually buys you — demonstrated, not asserted.',
      steps: [
        {
          id: 'w2-enc-1',
          title: 'Watch it get rejected',
          blocks: [
            {
              t: 'text',
              md: `\`Main\` below is in a different class from \`Counter\`, and it reaches straight in for the private field. Decide what happens before you find out.`,
            },
            {
              t: 'predict',
              caption: 'This is supposed to fail',
              question: '`_count` is private and `Main` is outside the class. What does `Console.WriteLine(c._count);` do?',
              options: [
                'Prints `1`. `private` is a convention, not a rule.',
                'Prints `0`, because `Main` gets its own fresh copy.',
                'Is refused before the program runs — `_count` is not visible from out there.',
                'Prints nothing and carries on to the next line.',
              ],
              answer: 2,
              why: [
                'That is how a leading underscore works in Python, where privacy really is a naming convention. C# enforces it: the compiler will not emit the program at all.',
                'Nothing about `private` copies anything. There is exactly one `_count`, sitting inside the one `Counter` object.',
                '',
                'C# has no silent failures of this kind. An access violation is a compile error, which means you find out at the earliest possible moment rather than in front of your tutor.',
              ],
              explain: `The error is the whole lesson, so read it rather than skimming it. \`_count\` exists, has the right value, and is simply not reachable from outside \`Counter\` — the compiler refused to build a program that reached it.`,
              expect: { errorContains: 'private' },
              code: `public class Counter
{
    private int _count;
    public void Increment() { _count = _count + 1; }
    public int Ticks { get { return _count; } }
}

public class Program
{
    static void Main()
    {
        Counter c = new Counter();
        c.Increment();

        Console.WriteLine(c._count);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'That is the feature, not the obstacle',
              md: `A Counter can only be changed by \`Increment()\` and \`Reset()\`. There is no path to a nonsense value, because you did not build one.

Quiz 1 Q4 asks how you stop other classes seeing what an object knows. The answer: declare the fields \`private\`, and expose only what the design actually needs.`,
            },
          ],
        },
        {
          id: 'w2-enc-words',
          title: 'The four words',
          blocks: [
            {
              t: 'text',
              md: `C# has exactly four access specifiers. Two of them you will use constantly this semester; one arrives in Week 4 with inheritance; one you will barely touch.`,
            },
            {
              t: 'table',
              caption: 'All of them',
              headers: ['Word', 'Who can see it', 'What you use it for'],
              rows: [
                ['`private`', 'only code inside this same class', 'every field, and any method that is nobody else’s business'],
                ['`public`', 'anything, anywhere', 'the members other classes are meant to use'],
                ['`protected`', 'this class, and anything that inherits from it', 'Week 4, when `Shape` gets children'],
                ['`internal`', 'anything in the same project', 'rare in this unit; it is the default for a class you declare with no word at all'],
              ],
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'And nothing else',
              md: `There is no \`secure\`, no \`friend\`, no \`package\`. If a word is not one of those four, it is not an access specifier — which is exactly the shape of the question the quiz asks.`,
            },
            {
              t: 'quiz',
              question: 'Which of these is NOT a C# access specifier?',
              options: ['public', 'private', 'protected', 'secure'],
              answer: 3,
              why: [
                '`public` is the widest of the four: visible to everything.',
                '`private` is the narrowest, and the default for a class member.',
                '`protected` is the inheritance one — this class and its descendants.',
                '',
              ],
              explain: 'Quiz 1 Q12. The four real ones are public, private, protected and internal.',
            },
            {
              t: 'quiz',
              question: 'A field written as `int _count;` — with no access word in front of it — is…',
              options: ['public', 'private', 'internal', 'a compile error'],
              answer: 1,
              why: [
                'C# defaults to the *narrowest* option, not the widest. Defaulting to public would mean a typo could expose a field.',
                '',
                '`internal` is the default for a **type** declared with no access word. For a **member** of a class, the default is `private`.',
                'It compiles. The access word is optional on members.',
              ],
              explain:
                'A class member with no access modifier is private. Write `private` anyway — the unit expects it, and it tells the next reader that you meant it rather than forgot it.',
            },
          ],
        },
        {
          id: 'w2-enc-field-or-prop',
          title: 'A field or a property?',
          blocks: [
            {
              t: 'text',
              md: `From the outside, \`acc.Balance\` looks identical whether \`Balance\` is a public field or a public property. Everything else about them differs, and the difference is the whole reason properties exist.`,
            },
            {
              t: 'compare',
              title: 'Two ways to let the outside see a balance',
              left: {
                title: 'A public field',
                tone: 'bad',
                code: `public class BankAccount
{
    public int Balance;
}

// ...and then, from anywhere at all:
acc.Balance = -1000;`,
                md: 'There is no line of code you can add that stops this. The class has no say in its own state, and nowhere to put one.',
              },
              right: {
                title: 'A private field with a property',
                tone: 'good',
                code: `public class BankAccount
{
    private int _balance;

    public int Balance
    {
        get { return _balance; }
        set { /* a rule can live here */ }
    }
}`,
                md: 'Identical at the call site. The difference is that there is now **somewhere for the rule to go** — and one place to look when the number is wrong.',
              },
            },
            {
              t: 'predict',
              caption: 'A property with a get and no set',
              question: '`Ticks` has a `get` and no `set`. What does `c.Ticks = 500;` do?',
              options: [
                'Sets the count to 500.',
                'Silently does nothing.',
                'Is refused — a property with no `set` cannot be assigned to.',
                'Sets it to 500, but only for the rest of this method.',
              ],
              answer: 2,
              why: [
                'There is nothing for the assignment to run. A property is a pair of methods wearing a field’s clothes, and this one only has the getter half.',
                'C# does not quietly discard assignments. If it cannot do what you wrote, it says so.',
                '',
                'Properties are not scoped to a method. There is only one `_count` and only one way in.',
              ],
              explain: `A read-only property is the right shape for anything the object works out for itself: \`Ticks\` on a Counter, \`Area\` on a Shape. If nothing outside should be setting it, do not write a \`set\` — and the compiler will hold you to it.`,
              expect: { errorContains: 'read-only' },
              code: `public class Counter
{
    private int _count;
    public void Increment() { _count = _count + 1; }
    public int Ticks { get { return _count; } }
}

public class Program
{
    static void Main()
    {
        Counter c = new Counter();
        c.Increment();

        c.Ticks = 500;
    }
}`,
            },
          ],
        },
        {
          id: 'w2-enc-guard',
          title: 'A setter that says no',
          blocks: [
            {
              t: 'text',
              md: `Here is the payoff. Because every change to \`_balance\` has to go through one setter, that setter can refuse.`,
            },
            {
              t: 'predict',
              caption: 'The rule lives in the setter',
              question:
                'The account is set to 250, then to −1000, and the balance is printed after each. What comes out?',
              options: [
                'Balance is 250\nBalance is still -1000',
                'Balance is 250\nRefused: a balance cannot be negative.\nBalance is still 250',
                'Refused: a balance cannot be negative.\nBalance is 250\nBalance is still 250',
                'Balance is 250\nRefused: a balance cannot be negative.\nBalance is still -1000',
              ],
              answer: 1,
              why: [
                'That is what a public field would give you — the assignment lands and nothing objects. The whole point of the setter is that this is no longer possible.',
                '',
                'The setter only runs when something assigns to `Balance`, which happens after the first `WriteLine`, not before it.',
                'The setter returns before reaching `_balance = value;`, so the field is never touched. Printing a refusal and then storing the value anyway would be the worst of both.',
              ],
              explain: `Encapsulation is not really about hiding. It is about being **the only road in**.

Once every write to \`_balance\` goes through one setter, there is exactly one place to write the rule, and exactly one place to look when the number comes out wrong. A public field gives you neither.`,
              expect: {
                output:
                  'Balance is 250\nRefused: a balance cannot be negative.\nBalance is still 250',
              },
              code: `public class BankAccount
{
    private int _balance;

    public int Balance
    {
        get { return _balance; }
        set
        {
            if (value < 0)
            {
                Console.WriteLine("Refused: a balance cannot be negative.");
                return;
            }
            _balance = value;
        }
    }
}

public class Program
{
    static void Main()
    {
        BankAccount acc = new BankAccount();

        acc.Balance = 250;
        Console.WriteLine("Balance is " + acc.Balance);

        acc.Balance = -1000;
        Console.WriteLine("Balance is still " + acc.Balance);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'The word value',
              md: `Inside a \`set\`, \`value\` is the thing being assigned. You do not declare it and you cannot rename it — C# hands it to you, the same way a method receives a parameter.`,
            },
          ],
        },
        {
          id: 'w2-enc-order',
          title: 'Build the shape of it',
          blocks: [
            {
              t: 'text',
              md: `An encapsulated class has a shape, and by now you have seen it three times. Assemble it once from memory — same convention as before: **knows, built, exposes, does.**`,
            },
            {
              t: 'parsons',
              caption: 'BankAccount.cs',
              prompt: 'A private field, a constructor that fills it, a read-only property, and one method that changes it under a rule.',
              lines: [
                'public class BankAccount',
                '{',
                '    private int _balance;',
                '    public BankAccount(int opening) { _balance = opening; }',
                '    public int Balance { get { return _balance; } }',
                '    public void Deposit(int amount) { if (amount > 0) { _balance = _balance + amount; } }',
                '}',
              ],
              explain: `Notice what the outside world can do to this account: it can read the balance, and it can deposit a positive amount. That is the entire surface, and it was a design decision rather than an accident.

This is the same shape Task 2.1 asks for — a private field, a constructor that initialises it, a read-only property, and methods that are the only way to change anything.`,
            },
          ],
        },
        {
          id: 'w2-enc-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'quiz',
              question:
                'Why expose `_count` through a read-only `Ticks` property rather than just making the field public?',
              options: [
                'It is shorter to write',
                'Other classes can read the count, but only `Counter` can change it',
                'Properties run faster than fields',
                'C# requires a property for every field',
              ],
              answer: 1,
              why: [
                'It is longer to write. That cost buys you control, which is the trade being made.',
                '',
                'They compile to roughly the same thing, and a trivial property costs nothing measurable. Speed is not the argument.',
                'It requires nothing of the kind. Public fields compile perfectly well — they are just a bad idea.',
              ],
              explain:
                'Read access and write access are separate decisions. A property lets you grant one without the other, which a field cannot do.',
            },
            {
              t: 'recall',
              prompt: `In your lab interview a tutor will point at your Counter and ask: **why is \`_count\` private rather than public?**

Write the answer you would give. Do not define encapsulation — say what would actually go wrong in *your* code if it were public.`,
              nudge:
                'Two sentences is plenty. One about what someone else could do to the counter; one about what `Increment()` and `Reset()` are for.',
              points: [
                'The object controls its own state — nothing outside can drop it to a nonsense value',
                'The only ways to change it are `Increment()` and `Reset()`, and both are ways I chose to allow',
                '`Ticks` lets other classes **read** the count without being able to **write** it',
                'If the counting rule ever changes, there is one place to change it',
                'The compiler enforces this — it is not a naming convention or a note in a comment',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 5
    {
      id: 'w2-task22',
      title: 'Task 2.2 — A Basic Shape',
      kind: 'lab',
      minutes: 25,
      assessment: 'Assessed · 2% of your final grade',
      summary:
        'A separate project you will keep extending in Weeks 4 and 5. Your personalised values are already filled in.',
      steps: [
        {
          id: 'w2-22-personal',
          title: 'Your values for this task',
          blocks: [
            {
              t: 'text',
              md: 'This task has three personalised requirements buried in the PDF prose. Here they are, already worked out for you.',
            },
            {
              t: 'table',
              headers: ['The lab says', 'For you'],
              rows: [
                [
                  'Set `_color` to "Color.Azure" if your first name starts A–L, otherwise "Color.Chocolate"',
                  '{{first}} → **"Color.{{color2}}"**',
                ],
                ['Construct with `1XX`, where XX is the last two digits of your student ID', '**{{shapeParam}}**'],
                ['`_x` and `_y` start at `0.0f`', 'The `f` makes it a `float`, not a `double`'],
              ],
            },
            {
              t: 'callout',
              tone: 'note',
              md: "In Week 4 you will swap the `string` colour for SplashKit's real `Color` type, and `Draw()` will paint an actual rectangle. Build it now so that swap is easy.",
            },
          ],
        },
        {
          id: 'w2-22-build',
          title: 'Build the Shape class',
          blocks: [
            {
              t: 'umlSpec',
              caption: 'Task 2.2 target',
              source: `public class Shape
{
    private string _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;
    public Shape(int param) { }
    public string Color { get { return ""; } set { } }
    public float X { get { return 0; } set { } }
    public float Y { get { return 0; } set { } }
    public int Width { get { return 0; } set { } }
    public int Height { get { return 0; } set { } }
    public void Draw() { }
    public bool IsAt(int x, int y) { return false; }
}`,
            },
          ],
          exercise: {
            prompt:
              'Write the five private fields, and a constructor taking int param that sets the colour to "Color.{{color2}}", x and y to 0.0f, and both width and height to param.',
            seed: 'public class Shape\n{\n\n}',
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: '_color is a private string',
                rule: { on: 'field', inClass: 'Shape', name: '_color', visibility: 'private', type: 'string' },
              },
              {
                kind: 'structure',
                label: '_x is a private float',
                rule: { on: 'field', inClass: 'Shape', name: '_x', visibility: 'private', type: 'float' },
              },
              {
                kind: 'structure',
                label: '_y is a private float',
                rule: { on: 'field', inClass: 'Shape', name: '_y', visibility: 'private', type: 'float' },
              },
              {
                kind: 'structure',
                label: '_width is a private int',
                rule: { on: 'field', inClass: 'Shape', name: '_width', visibility: 'private', type: 'int' },
              },
              {
                kind: 'structure',
                label: '_height is a private int',
                rule: { on: 'field', inClass: 'Shape', name: '_height', visibility: 'private', type: 'int' },
              },
              {
                kind: 'structure',
                label: 'The constructor takes one parameter',
                rule: { on: 'ctor', inClass: 'Shape', params: 1 },
              },
            ],
            hints: [
              'Five fields, then the constructor, in that order.',
              'The f suffix matters: 0.0f is a float, while plain 0.0 is a double and will not fit.',
              'Both _width and _height get the same value — the parameter.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w2-22-isat',
          title: 'IsAt — the maths, made visible',
          blocks: [
            {
              t: 'text',
              md: `\`IsAt(x, y)\` answers one question: *is this point inside my rectangle?*

The PDF gives you the condition but not the intuition. A point is inside when it is right of the left edge, left of the right edge, below the top, and above the bottom — **all four at once**, which is why they are joined with \`&&\`.`,
            },
            {
              t: 'code',
              caption: 'Where the edges are',
              code: `// left edge   = _x
// right edge  = _x + _width
// top edge    = _y
// bottom edge = _y + _height

xInput > _x  &&  xInput < _x + _width
&&
yInput > _y  &&  yInput < _y + _height`,
            },
            {
              t: 'callout',
              tone: 'trap',
              md: 'The PDF writes the condition with `x1`/`x2` as the *corners*. Your class stores a corner plus a **width**, so the right edge is `_x + _width`, not `_width`. Getting this wrong is the most common bug in this task.',
            },
          ],
          exercise: {
            prompt: 'Implement IsAt(int xInput, int yInput) so it returns true only for points inside the shape.',
            seed: `public class Shape
{
    private string _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape(int param)
    {
        _color = "Color.{{color2}}";
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }

    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }

}`,
            editable: { from: 20, to: 20 },
            tests: [
              {
                kind: 'structure',
                label: 'IsAt takes two parameters and returns bool',
                rule: {
                  on: 'method', inClass: 'Shape', name: 'IsAt',
                  params: 2, returns: 'bool', visibility: 'public',
                },
              },
              {
                kind: 'expression',
                label: 'A point in the middle is inside',
                setup: 'Shape s = new Shape(100);',
                expr: 's.IsAt(50, 50)',
                expect: 'True',
              },
              {
                kind: 'expression',
                label: 'A point far to the right is outside',
                setup: 'Shape s = new Shape(100);',
                expr: 's.IsAt(500, 50)',
                expect: 'False',
              },
              {
                kind: 'expression',
                label: 'A point below the shape is outside',
                setup: 'Shape s = new Shape(100);',
                expr: 's.IsAt(50, 400)',
                expect: 'False',
              },
              {
                kind: 'expression',
                label: 'It still works after the shape has moved',
                setup: 'Shape s = new Shape(100); s.X = 200.0f; s.Y = 200.0f;',
                expr: 's.IsAt(250, 250)',
                expect: 'True',
              },
            ],
            hints: [
              'One return statement, with four comparisons joined by &&.',
              'The right edge is _x + _width. The bottom edge is _y + _height.',
              'Do not write an if/else — the comparison already produces the bool you need.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w2-22-draw',
          title: 'Draw, and finish the task',
          blocks: [
            {
              t: 'text',
              md: 'For now `Draw()` prints. In Week 4 this same method becomes a real `SplashKit.FillRectangle` call and the shape appears on screen.',
            },
          ],
          exercise: {
            prompt:
              'Add the remaining properties and a Draw() that prints the colour, position and size. Then create a Shape({{shapeParam}}) in Main and draw it.',
            seed: `public class Shape
{
    private string _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape(int param)
    {
        _color = "Color.{{color2}}";
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }

    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }

    public bool IsAt(int xInput, int yInput)
    {
        return xInput > _x && xInput < _x + _width
            && yInput > _y && yInput < _y + _height;
    }

    // add Color, Width and Height properties, and Draw()
}

public class Program
{
    static void Main()
    {
        // create a Shape with your personalised parameter, and draw it
    }
}`,
            tests: [
              {
                kind: 'structure',
                label: 'Color is a public string property',
                rule: { on: 'property', inClass: 'Shape', name: 'Color', visibility: 'public', type: 'string' },
              },
              {
                kind: 'structure',
                label: 'Width is a public int property',
                rule: { on: 'property', inClass: 'Shape', name: 'Width', visibility: 'public', type: 'int' },
              },
              {
                kind: 'structure',
                label: 'Height is a public int property',
                rule: { on: 'property', inClass: 'Shape', name: 'Height', visibility: 'public', type: 'int' },
              },
              {
                kind: 'structure',
                label: 'Draw() exists and returns void',
                rule: { on: 'method', inClass: 'Shape', name: 'Draw', params: 0, returns: 'void' },
              },
              {
                kind: 'outputContains',
                label: 'Draw prints your personalised colour',
                expect: 'Color.{{color2}}',
              },
              {
                kind: 'outputContains',
                label: 'Draw prints your personalised size ({{shapeParam}})',
                expect: '{{shapeParam}}',
              },
            ],
            hints: [
              'Three more properties, following the same shape as X and Y.',
              'Draw() is several Console.WriteLine calls — one per piece of information.',
              'In Main: create the shape with new, then call Draw() on it.',
            ],
            tool: 'console',
          },
        },
      ],
    },

    // ================================================================ lesson 6
    /*
     * The week's own test.
     *
     * Every other lesson here teaches then checks; this one only checks, and
     * it checks in every form the material can be asked in — a definition, a
     * program to trace, a class to reassemble, a scenario to classify, and a
     * blank box to write into from memory. The variety is the point: a student
     * who can pick the right option out of four has not necessarily got the
     * idea, and the fastest way to find that out is to ask for the same idea
     * in a shape they have not rehearsed.
     *
     * It sits after the labs and before the interview drill because that is
     * the order the week actually happens in — do the work, prove it, then
     * explain it out loud.
     */
    {
      id: 'w2-checkpoint',
      title: 'Week 2 checkpoint',
      kind: 'quiz',
      minutes: 22,
      summary:
        'Everything from Weeks 1 and 2, asked five different ways. Nothing new is taught here — this is where you find out what did not stick.',
      steps: [
        {
          id: 'w2-cp-warmup',
          title: 'From memory first',
          blocks: [
            {
              t: 'text',
              md: 'Before any options are on screen. Recognising the right answer among four is much easier than producing it, and the midterm is the first of those — but if you cannot produce it now, recognising it later will be a coin flip.',
            },
            {
              t: 'recall',
              prompt:
                'Write down what a **class** declaration gives you, and how an **object** differs from it. Then say what "encapsulation" means, in one sentence.',
              nudge:
                'Three words to work in: blueprint, instance, and access. One of them belongs to the class, one to the object, and one to encapsulation.',
              points: [
                'A class is a template or blueprint — it defines the attributes and behaviours',
                'An object is one instance built from that class, holding its own values',
                'One class, many objects — 260 students, one Student class',
                'Encapsulation bundles data and the methods that act on it into one unit',
                'And it restricts direct access to that data, using access modifiers',
                'The fields go private; a property or method is the controlled way in',
              ],
            },
          ],
        },

        {
          id: 'w2-cp-objects',
          title: 'Objects and classes',
          blocks: [
            {
              t: 'quiz',
              question: 'Which statement is true?',
              options: [
                'A class is the blueprint; an object is an instance built from it',
                'An object is the blueprint; a class is an instance built from it',
                'A class and an object are two words for the same thing',
                'A class holds the data for all of its objects',
              ],
              answer: 0,
              why: [
                '',
                'Reversed. The class is the plan, written once; the object is what `new` produces from it.',
                'They are examined precisely because they are not — one is a definition, the other a thing that exists at runtime.',
                'The class defines *what* data exists. Each object holds its own copy of it.',
              ],
              explain:
                'Quiz 1 Q3. One class, many objects. The class says every Car has a Model; each Car decides what its own model is.',
            },
            {
              t: 'quiz',
              question:
                'A `Student` knows its name and grade, and can enrol and apply for graduation. Which pair are the **behaviours**?',
              options: [
                '`Enrol()` and `ApplyForGraduation()`',
                '`Name` and `Grade`',
                '`Name` and `Enrol()`',
                '`Student` and `Grade`',
              ],
              answer: 0,
              why: [
                '',
                'Those are the attributes — what it knows.',
                'One of each. `Name` is an attribute.',
                '`Student` is the class itself, not one of its members.',
              ],
              explain:
                'Quiz 1 Q1. Attributes are the nouns an object carries; behaviours are the verbs it performs. Parentheses and a verb means behaviour.',
            },
            {
              t: 'quiz',
              question: 'What do objects bundle together into a single unit?',
              options: [
                'Data (fields) and functionality (methods)',
                'A class and its parent class',
                'The stack frame and the heap allocation',
                'The source file and its compiled output',
              ],
              answer: 0,
              why: [
                '',
                'That is inheritance, a relationship between classes — Week 4.',
                'Those are storage regions, not what an object is made of — Week 3.',
                'That is the build process.',
              ],
              explain:
                'Quiz 1 Q14, and the sentence the definition of encapsulation is built on top of.',
            },
          ],
        },

        {
          id: 'w2-cp-hiding',
          title: 'Hiding, and what it buys',
          blocks: [
            {
              t: 'quiz',
              question:
                'How do you stop other classes from seeing what an object knows?',
              options: [
                'Declare the fields `private`',
                'Declare the fields `general`',
                'Put the class in its own file',
                'Give the fields no modifier — that makes them hidden by convention',
              ],
              answer: 0,
              why: [
                '',
                '`general` is not a C# access modifier at all. It is a made-up option, and it appears in the quiz for exactly that reason.',
                'C# visibility has nothing to do with files.',
                'No modifier *does* mean private — but "by convention" is wrong: it is enforced by the compiler, which is the whole point.',
              ],
              explain:
                'Quiz 1 Q4 and Q12. `private` restricts access to code inside the same class, and the compiler enforces it. Valid modifiers: `public`, `private`, `protected`, `internal`.',
            },
            {
              t: 'compare',
              title: 'The pair that gets confused every year',
              left: {
                title: 'Abstraction',
                tone: 'neutral',
                md: 'A **design** decision: which characteristics of the real thing matter for this system, and which do you ignore?\n\nHappens on paper, before any code. The same real student is modelled differently by an enrolment system and a social app.',
              },
              right: {
                title: 'Encapsulation',
                tone: 'neutral',
                md: 'A **language** mechanism: bundle the data with its methods, and use `private` and properties to control who can reach it.\n\nHappens in the class, and the compiler enforces it.',
              },
            },
            {
              t: 'quiz',
              question: 'Which of these is **abstraction** rather than encapsulation?',
              options: [
                'Deciding a `Student` needs an ID and enrolled units, but not a favourite colour',
                'Marking `_grade` private and adding a `Grade` property',
                'Validating a new value inside a property setter',
                'Keeping the methods that change a field in the same class as the field',
              ],
              answer: 0,
              why: [
                '',
                'That is encapsulation — the mechanism, not the decision about what exists.',
                'Also encapsulation: controlling access at the one door in.',
                'Also encapsulation: bundling data with its behaviour.',
              ],
              explain:
                'Quiz 1 Q8. Abstraction decides *what to show*; encapsulation enforces *how it is hidden*. Only the first one is a decision about which attributes exist at all.',
            },
            {
              t: 'quiz',
              question: 'What is added to a class to give controlled access to hidden data?',
              options: [
                'A property',
                'A constructor',
                'A second, public field',
                'An access modifier on the class itself',
              ],
              answer: 0,
              why: [
                '',
                'A constructor initialises the object; it is not how the data is read afterwards.',
                'A second public field is a copy that immediately drifts out of step with the real one.',
                'Class-level visibility decides who can use the class, not who can reach inside it.',
              ],
              explain:
                'Quiz 1 Q9. A property is a public get/set gateway to a private field — the one door, where a rule can be written once and hold everywhere.',
            },
          ],
        },

        {
          id: 'w2-cp-ctor-predict',
          title: 'Predict: two constructors',
          blocks: [
            {
              t: 'predict',
              caption: 'Constructor overloading — a Lecture 5 mock-test topic',
              question: 'What does this print?',
              code: `public class Counter
{
    private string _name;

    public Counter()
    {
        _name = "unnamed";
    }

    public Counter(string name)
    {
        _name = name;
    }

    public string Name { get { return _name; } }
}

public class Program
{
    static void Main()
    {
        Counter a = new Counter();
        Counter b = new Counter("ticks");
        Console.WriteLine(a.Name);
        Console.WriteLine(b.Name);
    }
}`,
              options: [
                'unnamed\nticks',
                'ticks\nticks',
                'unnamed\nunnamed',
                'It refuses to compile — a class may only have one constructor',
              ],
              answer: 0,
              why: [
                '',
                'The parameterless constructor was chosen for `a`, and nothing later changes its name.',
                '`new Counter("ticks")` matches the one-parameter overload, so `b` never sees `"unnamed"`.',
                'Overloading constructors is completely legal, and Lab 5 requires it.',
              ],
              explain:
                'Constructors overload by parameter list, exactly like methods. The argument list at the `new` decides which one runs — and only one runs, unless you explicitly chain with `: this(...)`.',
              expect: { output: 'unnamed\nticks' },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'The free constructor disappears',
              md: 'A class with **no** constructor gets a parameterless one for free. Write `Counter(string name)` and nothing else, and `new Counter()` stops compiling — the free one is gone the moment you declare any constructor of your own.',
            },
          ],
        },

        {
          id: 'w2-cp-prop-predict',
          title: 'Predict: a property that does work',
          blocks: [
            {
              t: 'predict',
              caption: 'A property is a pair of methods, not a field',
              question: 'What does this print?',
              code: `public class Person
{
    private string _name = "unset";

    public string Name
    {
        get { return _name.ToUpper(); }
        set { _name = value; }
    }
}

public class Program
{
    static void Main()
    {
        Person p = new Person();
        p.Name = "amy";
        Console.WriteLine(p.Name);
    }
}`,
              options: ['AMY', 'amy', 'unset', 'UNSET'],
              answer: 0,
              why: [
                '',
                'The setter stored `"amy"` unchanged — but the **getter** is what runs on the way out, and it upper-cases.',
                '`"unset"` was overwritten by the setter before anything was read.',
                'Same: the field no longer holds `"unset"` by the time it is read.',
              ],
              explain:
                'The stored value and the exposed value need not be the same. `p.Name = "amy"` calls the setter with `value` bound to `"amy"`; `p.Name` calls the getter, which can do anything a method can.',
              expect: { output: 'AMY' },
            },
            {
              t: 'quiz',
              question: 'Where does `value` come from inside a setter?',
              options: [
                'It is a keyword holding whatever was assigned to the property',
                'It is a field you must declare in the class',
                'It is the property\'s previous value',
                'It is a parameter you have to add to the setter',
              ],
              answer: 0,
              why: [
                '',
                'You never declare it — the compiler supplies it inside every `set` block.',
                'The old value is still in the backing field until you overwrite it.',
                'A setter has no written parameter list. `value` is the implicit one.',
              ],
              explain:
                '`p.Name = "amy";` compiles into a call to the setter with `value` bound to `"amy"`. That is why validation goes in the setter and reads `value`.',
            },
          ],
        },

        {
          id: 'w2-cp-parsons',
          title: 'Rebuild the class',
          blocks: [
            {
              t: 'text',
              md: 'Same class you built in Task 2.1, scrambled. Ordering it exercises the same knowledge as writing it, without the typing.',
            },
            {
              t: 'parsons',
              caption: 'Counter.cs',
              prompt: 'Put an encapsulated Counter back together: hidden field, constructor, read-only property.',
              lines: [
                'public class Counter',
                '{',
                '    private int _count;',
                '    public Counter(string name)',
                '    {',
                '        _count = 0;',
                '    }',
                '    public int Ticks { get { return _count; } }',
                '}',
              ],
              explain:
                'Field first, then the constructor that initialises it, then the property that exposes it. `Ticks` has a get and no set on purpose — the count may only change through `Increment()` and `Reset()`, and a setter would hand that control away.',
            },
          ],
        },

        {
          id: 'w2-cp-uml',
          title: 'Reading the diagram',
          blocks: [
            {
              t: 'quiz',
              question: 'In a UML class diagram, what does `-` before a member name mean?',
              options: ['Private', 'Public', 'Protected', 'Subtraction'],
              answer: 0,
              why: [
                '',
                'Public is the plus sign, `+` — the opposite end of the same scale.',
                'Protected is the hash, `#` — the class plus anything that inherits from it.',
                'It is a visibility marker, not an operator — the trap Quiz 2 names explicitly.',
              ],
              explain:
                'Quiz 2 Q17. `+` public, `-` private, `#` protected, `~` internal. An encapsulated class shows as a block of `-` attributes above a block of `+` operations.',
            },
            {
              t: 'table',
              caption: 'The notation worth recognising on sight',
              headers: ['Notation', 'Meaning'],
              rows: [
                ['`+ Name : string`', 'Public member, type after the colon'],
                ['`- _count : int`', 'Private member'],
                ['`# _size : int`', 'Protected — the class and anything inheriting from it'],
                ['<u>Underlined</u>', '`static` — belongs to the class, not an instance'],
                ['*Italics*', '`abstract` — no implementation here (Week 4)'],
              ],
            },
            {
              t: 'quiz',
              question:
                'You need to document which classes exist, what each holds, and how they connect. Which diagram?',
              options: [
                'Class diagram',
                'Sequence diagram',
                'Deployment diagram',
                'Activity diagram',
              ],
              answer: 0,
              why: [
                '',
                'That shows messages between objects over time — behaviour, not structure.',
                'That shows which hardware or process each component runs on.',
                'That shows a workflow of steps and decisions.',
              ],
              explain:
                'Quiz 2 Q5 and Q18. Structure diagrams (class, component, deployment) show the static layout; behaviour diagrams show what happens over time. "What exists and how is it connected" is structure.',
            },
          ],
        },

        {
          id: 'w2-cp-testing',
          title: 'Unit testing',
          blocks: [
            {
              t: 'quiz',
              question: 'Which attribute marks the **class** that holds unit tests?',
              options: ['`[TestFixture]`', '`[Test]`', '`[TestMethod]`', '`[Assert]`'],
              answer: 0,
              why: [
                '',
                '`[Test]` marks each individual test **method**.',
                '`[TestMethod]` is MSTest\'s attribute, not NUnit\'s.',
                '`Assert` is a class you call inside a test, not an attribute.',
              ],
              explain:
                'Quiz 2 Q13. `[TestFixture]` on the class, `[Test]` on each method. NUnit is the .NET framework; JUnit is Java, CPPUnit is C++.',
            },
            {
              t: 'quiz',
              question: 'What are the three steps of writing a unit test?',
              options: [
                'Setup the test, perform the operation, check the result',
                'Compile, link, run',
                'Write the code, ship it, wait for bug reports',
                'Input, process, output',
              ],
              answer: 0,
              why: [
                '',
                'Those are build stages, not test structure.',
                'That is the absence of a testing strategy.',
                'A description of any program at all.',
              ],
              explain:
                'Quiz 2 Q2 — also known as Arrange, Act, Assert. Every test in this unit has these three parts, in this order.',
            },
            {
              t: 'quiz',
              question:
                'A test contains `bool isEven = (7 % 2 == 0); Assert.IsTrue(isEven, "The number is even");`. Does it pass?',
              options: [
                'No — `7 % 2` is `1`, so `isEven` is false and the assertion fails',
                'Yes — 7 divided by 2 has no remainder',
                'No — the message argument is not allowed',
                'Yes — the message makes the assertion true',
              ],
              answer: 0,
              why: [
                '',
                '`%` is the **remainder** operator, and 7 leaves 1.',
                'A message is an optional second argument, and it is good practice.',
                'The message is only shown when the assertion *fails*. It cannot change the outcome.',
              ],
              explain:
                'Quiz 2 Q7. `Assert.IsTrue(false)` fails, and the message is what you read in the report afterwards.',
            },
            {
              t: 'callout',
              tone: 'key',
              md: 'Two Quiz 2 claims that are **false**: "only one unit test can be written per class", and "unit tests are only useful after the application is developed". A class gets as many tests as it has behaviours worth checking, and tests written *first* are the whole idea behind TDD.',
            },
          ],
        },

        {
          id: 'w2-cp-collections',
          title: 'Predict: the framework classes',
          blocks: [
            {
              t: 'predict',
              caption: 'List<T> from the .NET Base Class Library',
              question: 'What does this print?',
              code: `public class Program
{
    static void Main()
    {
        List<string> names = new List<string>();
        names.Add("Amy");
        names.Add("Ben");
        Console.WriteLine(names.Count);
        Console.WriteLine(names[0]);
    }
}`,
              options: ['2\nAmy', '2\nBen', '1\nAmy', '0\nAmy'],
              answer: 0,
              why: [
                '',
                '`names[0]` is the **first** item — indexing starts at 0, so `"Ben"` is at index 1.',
                'Two `Add` calls, so `Count` is 2.',
                'The list starts empty, but two items were added before it was counted.',
              ],
              explain:
                '`List<T>` is index-based and appends with `.Add()`. Unlike an array it grows as you add, which is why every lab in this unit uses one.',
              expect: { output: '2\nAmy' },
              tool: 'memory',
            },
            {
              t: 'quiz',
              question:
                'You need to look up a student\'s mark by their student ID. Which collection?',
              options: [
                '`Dictionary<string, double>` keyed on the ID',
                '`List<double>` in enrolment order',
                'Two parallel `List`s, one of IDs and one of marks',
                'A `List<string>` with the ID and mark joined together',
              ],
              answer: 0,
              why: [
                '',
                'You would have to search the whole list to find one student, and enrolment order is not the ID.',
                'It works until the two lists drift out of step — which is exactly the bug a dictionary makes impossible.',
                'Now every read has to split the string apart again, and nothing prevents a malformed entry.',
              ],
              explain:
                'Quiz 2 Q16. `Dictionary<K,V>` gives fast lookup by a unique key; `List<T>` gives order and position. Ask how the data will be *read*, not how it will be stored.',
            },
            {
              t: 'quiz',
              question: 'What is the .NET Base Class Library?',
              options: [
                'A set of reusable classes, interfaces and value types providing fundamental functionality',
                'The base class that every C# class must inherit from',
                'The compiler that turns C# into machine code',
                'A library you download separately before using C#',
              ],
              answer: 0,
              why: [
                '',
                'That is `System.Object` — one class *in* the BCL. The similar name is the trap.',
                'That is a different part of the toolchain entirely.',
                'It ships with .NET; there is nothing to fetch.',
              ],
              explain:
                'Quiz 2 Q10 and Q11. File I/O, collections, dates, maths — optimised, tested code for the things every program needs, so you do not write your own `List<T>`.',
            },
          ],
        },

        {
          id: 'w2-cp-exam',
          title: 'Under exam conditions',
          blocks: [
            {
              t: 'text',
              md: 'Four questions in the shape the midterm asks them: no code to run, no notes, one right answer. Give each one twenty seconds — that is the real budget, ten questions in twenty minutes.',
            },
            {
              t: 'quiz',
              question: 'Which is **NOT** a valid C# access specifier?',
              options: ['`general`', '`protected`', '`private`', '`public`'],
              answer: 0,
              why: [
                '',
                'Valid: the class itself plus anything derived from it.',
                'Valid: the same class only.',
                'Valid: any code, anywhere.',
              ],
              explain:
                'Quiz 1 Q12. The real list is `public`, `private`, `protected`, `internal`. `general` does not exist in any version of C#.',
            },
            {
              t: 'quiz',
              question: 'A constructor shares the class name and has…',
              options: [
                'no return type at all',
                '`void` as its return type',
                'the same return type as the class',
                'whatever return type you give it',
              ],
              answer: 0,
              why: [
                '',
                'Writing `void` quietly turns it into an ordinary method that happens to share the name — and the class silently gets the free default constructor instead.',
                'There is no return type to match.',
                'Any return type at all disqualifies it as a constructor.',
              ],
              explain:
                'Quiz 1 Q2, and the trap the quiz calls out by name: **no return type, not even `void`**.',
            },
            {
              t: 'quiz',
              question: 'What is the best data type for storing a phone number?',
              options: ['`string`', '`int`', '`long`', '`double`'],
              answer: 0,
              why: [
                '',
                'Drops the leading zero, and cannot hold `+`, spaces or hyphens.',
                'Bigger, and wrong in exactly the same ways.',
                'Introduces a fractional part to a value that has none.',
              ],
              explain:
                'Quiz 1 Q7. If you would never do arithmetic on it, it is an identifier, and identifiers are strings — leading zeros, `+61`, spaces and hyphens all matter.',
            },
            {
              t: 'quiz',
              question: 'What happens if a class defines no constructor at all?',
              options: [
                'A parameterless default constructor is provided for you',
                'The class cannot be instantiated',
                'The compiler reports an error',
                'Its fields are left with no values whatsoever',
              ],
              answer: 0,
              why: [
                '',
                '`new MyClass()` works fine — that is precisely what the free constructor is for.',
                'No constructor is not an error; it is the common case for a small class.',
                'Fields always start at their type\'s default: `0`, `false`, or `null`.',
              ],
              explain:
                'Quiz 1 Q10. You get the free parameterless constructor **only** until you write one of your own.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'More of these',
              md: 'Concept focus holds around eighty questions on this week alone, drawn fresh every sitting, and it tracks which ideas you keep missing until you have revised them and proved it. Open it from the home page when you want more than one pass.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 7
    {
      id: 'w2-interview',
      title: 'Lab interview drill',
      kind: 'interview',
      minutes: 10,
      summary: 'Your mark depends on explaining your own code out loud. Rehearse it here first.',
      steps: [
        {
          id: 'w2-int-1',
          title: 'How the marking actually works',
          blocks: [
            {
              t: 'table',
              caption: 'Weekly lab rubric, from the Week 1 lecture',
              headers: ['Score', 'Condition'],
              rows: [
                ['0%', 'No attendance, or tasks done but the interview skipped or every answer wrong'],
                ['10–50%', 'Partial completion of the task, verification task, or interview answers'],
                ['50–70%', 'Both tasks complete, but only moderate interview performance'],
                ['100%', 'Both tasks complete **and** every interview question answered'],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              md: 'Finishing the code caps you at 70%. The last 30% is entirely about being able to say **why**. That is what the questions below rehearse.',
            },
          ],
        },
      ],
    },
  ],
};

/** Interview questions for Week 2, asked against the student's own code. */
export const week2Interview: InterviewQuestion[] = [
  {
    id: 'w2-q1',
    question: 'Why is _count private rather than public?',
    lookingFor: [
      'Encapsulation — the object controls its own state',
      'Stops outside code setting an invalid or nonsensical count',
      'The only supported ways to change it are Increment() and Reset()',
    ],
    aboutStep: 'w2-21-fields',
  },
  {
    id: 'w2-q2',
    question: 'What is the difference between a field and a property?',
    lookingFor: [
      'A field is real storage; a property is a pair of get/set methods that looks like a field',
      'Properties let you control or validate access',
      'A property may be read-only, write-only, or read-write',
    ],
    aboutStep: 'w2-21-prop-name',
  },
  {
    id: 'w2-q3',
    question: 'Why does Ticks have a get but no set?',
    lookingFor: [
      'The count must only change through Increment() and Reset()',
      'A setter would let outside code bypass that rule',
      'It is a deliberate design decision, and it matches the UML diagram',
    ],
    aboutStep: 'w2-21-prop-ticks',
  },
  {
    id: 'w2-q4',
    question:
      'After myCounters[2] = myCounters[0], how many objects exist, and why does resetting [2] change [0]?',
    lookingFor: [
      'Only two objects — only two new calls happened',
      'The assignment copied the reference, not the object',
      'Slots [0] and [2] point at the same object on the heap',
    ],
    aboutStep: 'w2-21-aliasing',
  },
  {
    id: 'w2-q5',
    question: 'Why is Main marked static, and why is it void?',
    lookingFor: [
      'static — it runs without creating a Program object first',
      'void — it returns nothing',
      'It is the entry point the runtime calls',
    ],
  },
  {
    id: 'w2-q6',
    question: 'What does a constructor do, and how do you recognise one?',
    lookingFor: [
      'Runs once when the object is created, to set up its initial state',
      'Has the same name as the class',
      'Has no return type at all, not even void',
    ],
    aboutStep: 'w2-21-ctor',
  },
  {
    id: 'w2-q7',
    question: 'In your Shape, why is _x a float rather than an int?',
    lookingFor: [
      'Screen positions can be fractional, especially once shapes move',
      'SplashKit uses floats for coordinates',
      'The f suffix on 0.0f is what makes the literal a float',
    ],
  },
  {
    id: 'w2-q8',
    question: 'Adding 5 past int.MaxValue did not crash. Why not?',
    lookingFor: [
      'C# arithmetic is unchecked by default, so the value wraps around',
      'It silently becomes negative',
      'Wrapping it in checked { } would throw an OverflowException instead',
    ],
    aboutStep: 'w2-21-overflow',
  },
];
