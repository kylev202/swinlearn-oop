/**
 * Week 4 — Inheritance & Polymorphism.
 *
 * Sources: Week 4 lecture notes, Quiz 4, OOP Lab4.pdf.
 *
 * Lab4.pdf runs two genuinely separate tasks: 4.1 migrates Shape onto the real
 * SplashKit types (Color, Point2D) — src/engine/splashkit.ts already exists to
 * make that runnable in the browser, its own doc comment naming this exact
 * week. Task 4.2 reuses "the Item developed in Iteration 2" — but Lab4.pdf's
 * own UML gives Item a *different* constructor, `Item(string[] idents, name,
 * desc)`, than the single-name Item this app's Week 3 built. That is not a
 * mistake: Lecture 4 §3.5 explicitly motivates inheritance by removing
 * duplicated identifier-matching logic between IdentifiableObject and Item —
 * so Task 4.2 here opens by refactoring Week 3's Item onto an
 * IdentifiableObject → GameObject → Item hierarchy, which is also the
 * necessary shape for Swin-Adventure's real requirement that a thing can have
 * more than one name (Requirements.pdf's "identifiers" plural).
 *
 * Naming note: Lecture 4's transcript renders one IdentifiableObject method as
 * "RU" — almost certainly a phonetic transcription of "R U", i.e. "are you".
 * Lab4.pdf's own Inventory spec spells the same method `AreYou`, which is what
 * gets graded, so that is the name used here (flagged in a callout so the
 * lecture recording does not look wrong).
 *
 * Authoring note: markdown lives in template literals, so every inline-code
 * backtick must be escaped as \` — otherwise it closes the string.
 */

import type { InterviewQuestion, Week } from './types';

export const week4: Week = {
  number: 4,
  title: 'Inheritance & Polymorphism',
  subtitle: 'ShapeDrawer with SplashKit, and Swin-Adventure Iteration 3 — Inventory',
  outcomes: [
    'Explain generalisation and specialisation, and when to program against the general type',
    'Write a class hierarchy with `:`, and know which members a child actually inherits',
    'Say what `abstract`, `virtual`, `override`, `base(...)` and `this(...)` each do, without mixing them up',
    'Predict which override runs when a variable\'s declared type and its actual type differ',
    'Refactor duplicated identifier-matching logic into a shared IdentifiableObject base class',
    'Write NUnit tests that would actually catch a broken Inventory, not just ones that pass',
  ],
  sources: ['Week 4 lecture', 'Quiz 4', 'OOP Lab4.pdf'],
  lessons: [
    // ================================================================ lesson 1
    {
      id: 'w4-inheritance',
      title: 'Inheritance',
      kind: 'concept',
      minutes: 18,
      summary: 'Generalisation and specialisation, the is-a relationship, and why duplicated code is a design smell.',
      steps: [
        {
          id: 'w4-inh-abstraction',
          title: 'Abstraction is more than hiding fields',
          blocks: [
            {
              t: 'text',
              md: `Week 2 taught abstraction as "hide the implementation behind a class." There is a second half to it: deciding **how general or specific** a class should be.

> "What do you want to do with a shape? Do you care whether it's an ellipse, rectangle, or triangle?" — Dr Vo

If the answer is no — you just want to call \`Draw()\` — then program against the **general** type (\`Shape\`) and let each **specific** type handle its own details.`,
            },
            {
              t: 'table',
              caption: 'Two directions',
              headers: ['Direction', 'Meaning', 'Example'],
              rows: [
                ['**Generalisation** ⬆', 'Move up to a broader, shared concept', 'Rectangle, Ellipse, Triangle → **Shape**'],
                ['**Specialisation** ⬇', 'Move down to something more specific', 'Shape → **Rectangle**, which adds its own corners'],
              ],
            },
          ],
        },
        {
          id: 'w4-inh-shape',
          title: 'Inheritance: an is-a relationship',
          blocks: [
            {
              t: 'text',
              md: `> **Inheritance** models an **is-a** relationship, and lets a class inherit attributes and behaviour from a parent class.

A \`Rectangle\` **is a** \`Shape\`. That is a different kind of relationship from anything in Week 3 — association, aggregation and dependency are all ways one object *refers to* another. Inheritance is a way one *class* is built from another.`,
            },
            {
              t: 'table',
              caption: 'What a child class can do with an inherited member',
              headers: ['Action', 'Description', 'Example'],
              rows: [
                ['**Inherit**', 'Automatically gets the parent\'s feature, unchanged', 'Rectangle inherits position and size'],
                ['**Override**', 'Changes how an inherited method behaves', '`Rectangle.Draw()` draws a rectangle; `Ellipse.Draw()` draws an ellipse'],
                ['**Add**', 'Introduces a feature the parent never had', '`Rectangle.MakeSquare()`'],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'is-a vs has-a',
              md: '`is-a` (inheritance) and `has-a` (association/aggregation, Week 3) are the two structural relationships in OOP. Confusing them is a real trap: a `Car` **is a** `Vehicle` (inheritance), but a `Car` **has a** `Engine` (association) — you would never write `class Car : Engine`.',
            },
          ],
        },
        {
          id: 'w4-inh-syntax',
          title: 'The syntax, and the trap',
          blocks: [
            {
              t: 'table',
              caption: 'Declaring inheritance, across languages',
              headers: ['Language', 'Syntax'],
              rows: [
                ['**C#**', '`class Rectangle : Shape`'],
                ['C++', '`class Rectangle : public Shape`'],
                ['Java', '`class Rectangle extends Shape`'],
                ['Objective-C', '`@interface Rectangle : Shape`'],
              ],
            },
            {
              t: 'quiz',
              question: 'What is the correct way to declare that Ellipse inherits from Shape in C#?',
              options: [
                'public class Ellipse : Shape { }',
                'public class Ellipse extends Shape { }',
                'public class Ellipse : public Shape { }',
                'public class Ellipse implements Shape { }',
              ],
              answer: 0,
              why: [
                '',
                '`extends` is Java\'s keyword, not C#\'s.',
                '`: public Shape` is C++ syntax — C# never repeats an access level after the colon.',
                '`implements` does not exist in C#; `:` is used for both inheritance and interface implementation.',
              ],
              explain:
                'Quiz 4 Q14. C# uses a single colon between the derived class and the base class — no extra keyword, no visibility modifier.',
            },
            {
              t: 'quiz',
              question: 'Which pair of classes best resembles an inheritance relationship?',
              options: ['Vehicle – Car', 'Vehicle – Engine', 'Driver – Vehicle', 'Vehicle – Garage'],
              answer: 0,
              why: [
                '',
                'An Engine is part of a Vehicle — that is aggregation, not "is-a".',
                'A Driver uses a Vehicle — a dependency or association, not a type hierarchy.',
                'A Garage stores a Vehicle — again a has-a relationship, not is-a.',
              ],
              explain:
                'Quiz 4 Q2. A Car is a specific kind of Vehicle — an "is-a" relationship, with Vehicle as the base class and Car as the derived class.',
            },
            {
              t: 'predict',
              caption: 'What a child class gets for free',
              question: 'Car inherits from Vehicle but declares nothing about Brand or Honk. What prints?',
              code: `public class Vehicle
{
    public string Brand = "Ford";
    public void Honk()
    {
        Console.WriteLine("Beep!!");
    }
}

public class Car : Vehicle
{
    public string ModelName = "Mustang";
}

public class Program
{
    static void Main()
    {
        Car myCar = new Car();
        Console.WriteLine(myCar.Brand);
        myCar.Honk();
    }
}`,
              options: [
                'Ford\nBeep!!',
                '(nothing — Car never declared Brand or Honk)',
                'The program does not compile',
                'Mustang\nBeep!!',
              ],
              answer: 0,
              why: [
                '',
                'This is the misconception inheritance exists to fix: a child class does not need to redeclare a parent\'s public members to use them — it inherits them automatically.',
                'Nothing here is invalid. `myCar.Brand` and `myCar.Honk()` are exactly as legal as if Car had declared them itself.',
                'Brand was never set to "Mustang" — that is ModelName, a completely different field Car added on top of what it inherited.',
              ],
              explain:
                'Quiz 4 Q13/Q15. `Car : Vehicle` inherits every public member of Vehicle automatically — `myCar.Brand` reads the inherited field, and `myCar.Honk()` calls the inherited method, with no extra code in Car at all.',
              expect: { output: 'Ford\nBeep!!' },
            },
          ],
        },
        {
          id: 'w4-inh-access',
          title: 'What a child class can actually see',
          blocks: [
            {
              t: 'text',
              md: 'Inheritance does not switch off encapsulation. A child class only sees its parent\'s `public` and `protected` members — `private` stays exactly as hidden as it was in Week 2.',
            },
            {
              t: 'table',
              caption: 'Visibility, from a child class\'s point of view',
              headers: ['Level', 'Who can access it'],
              rows: [
                ['`public`', 'Anyone — any class at all'],
                ['`protected`', 'The declaring class, **and any class that inherits from it**'],
                ['`private`', 'Nobody else — not even a child class'],
              ],
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'When to reach for protected',
              md: 'Use `protected` when a child class genuinely needs to read or set a field directly. Use `private` when a child class should only interact through inherited methods and properties — which is the more common, more defensive default.',
            },
            {
              t: 'quiz',
              question: 'If you write a field with no access modifier at all inside a class, what does it default to?',
              options: ['private', 'public', 'protected', 'internal'],
              answer: 0,
              why: [
                '',
                'Members are never public by default — you must say so explicitly.',
                'protected is also never the default for a member.',
                'internal is the default for a **top-level class declaration**, not for a member inside one — a common mix-up.',
              ],
              explain:
                'Quiz 4 Q4. A class member (field, method, property) with no modifier defaults to private. Only a top-level class itself defaults to internal.',
            },
          ],
        },
        {
          id: 'w4-inh-why',
          title: 'Why this matters: the duplication problem',
          blocks: [
            {
              t: 'text',
              md: `Look back at Week 3's \`Item\`: it managed its own \`_name\` field and its own matching logic in \`HasId\`. If Swin-Adventure later needs a \`Room\` class that also has to be looked up by name, that same matching logic gets **copied**. Then a \`Bag\`. Then a \`Player\`.

Dr Vo's own list of what starts getting duplicated: an identifier list, a "does this match" check, a "give me your first name" accessor, a way to remove a name, a way to add one.`,
            },
            {
              t: 'table',
              caption: 'Three real costs of duplicated logic',
              headers: ['Cost', 'What actually happens'],
              rows: [
                ['**Time / money**', 'Writing the same logic in five classes takes five times as long as writing it once'],
                ['**Bugs**', 'Fix a bug in one copy, forget the other four — now they disagree'],
                ['**Maintainability**', 'A single change (e.g. how matching works) has to be found and repeated everywhere it was copied'],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              md: '"How can you optimise software to reduce cost, reduce bugs, and improve extensibility?" — Dr Vo\'s own framing of the answer this section builds toward: **inheritance**. Pull the shared logic up into one base class, once.',
            },
          ],
        },
        {
          id: 'w4-inh-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'recall',
              prompt:
                'In your own words: what does Rectangle inherit automatically from Shape, and what is the actual cost of NOT using inheritance when several classes need the same identifier-matching logic?',
              nudge: 'Separate "what inheritance buys you" from "what happens without it" — two different questions.',
              points: [
                'A child class automatically gets every public (and protected) member of its parent, with no extra code',
                'Without inheritance, the same logic (an identifier list, a match check, an accessor) gets copied into every class that needs it',
                'That duplication costs development time, creates inconsistent bugs when only some copies get fixed, and makes every future change more expensive',
                'Inheritance fixes this by putting the shared logic in one base class that every child then reuses',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 2
    {
      id: 'w4-polymorphism',
      title: 'Polymorphism',
      kind: 'concept',
      minutes: 16,
      summary: 'Same call, different behaviour — decided at runtime by what the object actually is, not by the variable\'s declared type.',
      steps: [
        {
          id: 'w4-poly-what',
          title: '"Many shapes"',
          blocks: [
            {
              t: 'text',
              md: `> **Polymorphism** (Greek: *poly* = many, *morph* = form) — using a child object wherever the parent type is expected, and having the correct, child-specific behaviour run automatically.

A \`Rectangle\` object can be referred to through a \`Rectangle\`-typed variable, a \`Shape\`-typed variable, or an \`Object\`-typed variable — the object itself does not change, only what the compiler lets that particular variable do with it.`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Why C# developers actually need this',
              md: 'At compile time you often do not know which specific shape the end user will create at runtime. You still want `s.Draw()` to "just work" no matter which one it turns out to be — that is the whole payoff.',
            },
          ],
        },
        {
          id: 'w4-poly-dispatch',
          title: 'The declared type is not the whole story',
          blocks: [
            {
              t: 'text',
              md: `\`Vehicle v = new Car();\` — \`v\`'s **declared type** is \`Vehicle\`. Its **actual type**, the object sitting on the heap, is \`Car\`. When you call \`v.Start()\`, which one decides what runs?`,
            },
            {
              t: 'predict',
              caption: 'Three vehicles, one loop',
              question: 'Vehicle declares Start() as virtual; Car and Truck each override it. What does this print?',
              code: `public class Vehicle
{
    public virtual void Start()
    {
        Console.WriteLine("Starting the vehicle!!");
    }
}

public class Car : Vehicle
{
    public override void Start()
    {
        Console.WriteLine("Starting the car!!");
    }
}

public class Truck : Vehicle
{
    public override void Start()
    {
        Console.WriteLine("Starting the truck!!");
    }
}

public class Program
{
    static void Main()
    {
        Vehicle[] vehicles = { new Car(), new Truck(), new Vehicle() };
        foreach (Vehicle v in vehicles)
        {
            v.Start();
        }
    }
}`,
              options: [
                'Starting the vehicle!!\nStarting the vehicle!!\nStarting the vehicle!!',
                'Starting the car!!\nStarting the truck!!\nStarting the vehicle!!',
                'Starting the car!!\nStarting the car!!\nStarting the car!!',
                'The program does not compile — the array holds three different types',
              ],
              answer: 1,
              why: [
                'This is what would happen if `Start` were **not** virtual — the array\'s declared element type, `Vehicle`, would decide. `virtual`/`override` exists specifically to prevent this.',
                '',
                'Each `Vehicle` slot really does hold a different object, and each one dispatches to its own override — the third slot has no override to run, so it falls back to Vehicle\'s own.',
                'An array of `Vehicle` can legally hold any object that **is a** Vehicle — Car and Truck both qualify. This is exactly what polymorphism is for.',
              ],
              explain: `Quiz 4 Q5/Q11. Because \`Start()\` is \`virtual\` in \`Vehicle\` and \`override\`-n in \`Car\`/\`Truck\`, C# resolves each call using the object's **actual runtime type**, not the array's declared element type. This is **dynamic dispatch**: the third vehicle has no override, so it runs \`Vehicle\`'s own \`Start()\`.`,
              expect: { output: 'Starting the car!!\nStarting the truck!!\nStarting the vehicle!!' },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Only virtual/abstract members can be overridden',
              md: 'If `Start()` in `Vehicle` were declared without `virtual`, `Car`\'s attempt to redefine it would **hide** it rather than override it — and the loop above would print "Starting the vehicle!!" three times, because a `Vehicle`-typed variable would always run `Vehicle`\'s version. `virtual` on the parent and `override` on the child are both required for dynamic dispatch to happen.',
            },
          ],
        },
        {
          id: 'w4-poly-abstract',
          title: 'Abstract methods: a placeholder that must be filled in',
          blocks: [
            {
              t: 'text',
              md: `\`virtual\` says "a child *may* override this." \`abstract\` says "a child **must**." An abstract method has no body at all in the parent — and a class containing one cannot be instantiated, only its concrete children can.`,
            },
            {
              t: 'code',
              caption: 'Shape forces every child to draw itself',
              code: `public abstract class Shape
{
    public abstract void Draw();   // no body — must be overridden
}

public class Rectangle : Shape
{
    public override void Draw() { /* draw a rectangle */ }
}

public class Ellipse : Shape
{
    public override void Draw() { /* draw an ellipse */ }
}`,
            },
            {
              t: 'predict',
              caption: 'What happens if you try to make one anyway',
              question: 'Shape is abstract. What happens when Main runs?',
              code: `public abstract class Shape
{
    public abstract void Draw();
}

public class Rectangle : Shape
{
    public override void Draw() { Console.WriteLine("a rectangle"); }
}

public class Program
{
    static void Main()
    {
        Shape s = new Shape();
    }
}`,
              options: [
                'It compiles and runs, printing nothing',
                'It is rejected: Shape is abstract and cannot be created directly',
                'It silently creates a Rectangle instead',
                'It prints "a rectangle"',
              ],
              answer: 1,
              why: [
                'An abstract class cannot be instantiated at all — there is no "runs and does nothing" outcome here.',
                '',
                'C# never substitutes a different type for you. If you want a Rectangle, you must write `new Rectangle()`.',
                'That would require actually calling `Draw()` on something — `new Shape()` never gets far enough to do that.',
              ],
              explain:
                'An abstract class describes what its children share, but is never a real object itself — `new Shape()` is rejected before Main gets any further. Only `new Rectangle()` or `new Ellipse()` are valid.',
              expect: { errorContains: 'abstract' },
            },
            {
              t: 'quiz',
              question: 'Which of these is a correctly declared abstract method in C#?',
              options: [
                'public abstract void Print();',
                'public abstract void Print() = 0;',
                'public abstract void Print() { }',
                'abstract public void Print(...)',
              ],
              answer: 0,
              why: [
                '',
                '`= 0;` is C++\'s pure-virtual syntax, not C#\'s.',
                'An abstract method has no body at all — empty braces are a (legal but different) virtual method with nothing in it, not an abstract one.',
                'This is not valid C# syntax at all.',
              ],
              explain:
                'Quiz 4 Q8. A C# abstract method has an access modifier, the `abstract` keyword, a signature, and a semicolon — no body, ever.',
            },
          ],
        },
        {
          id: 'w4-poly-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'quiz',
              question: 'Which statement about polymorphism in C# is FALSE?',
              options: [
                'You can achieve polymorphism without any inheritance relationship',
                'You can refer to a child object using a parent-typed reference',
                'Which override runs is resolved from the object\'s actual type, at runtime',
                'Polymorphism can work through base-class inheritance, not only interfaces',
              ],
              answer: 0,
              why: [
                '',
                'This is true — `Vehicle v = new Car();` is exactly that.',
                'This is true — that is dynamic dispatch, demonstrated above.',
                'This is true — inheriting from a base class is enough; an interface is not required.',
              ],
              explain:
                'Quiz 4 Q9. Subtype polymorphism in C# always requires an inheritance relationship of some kind — a base class or an interface. There is no polymorphism with no hierarchy at all.',
            },
            {
              t: 'quiz',
              question: 'Which statement is FALSE about inheritance in C#?',
              options: [
                'A class can inherit from multiple parent classes at once',
                'A class can implement multiple interfaces',
                'A child class inherits its parent\'s public members',
                'A class can only have one direct base class',
              ],
              answer: 0,
              why: [
                '',
                'True — this is exactly how C# gets multiple-inheritance-like flexibility without the diamond problem.',
                'True — this is the entire point of inheritance.',
                'True — this is what "single inheritance" means, and it is the reason the first option is false.',
              ],
              explain:
                'Quiz 4 Q3. C# supports single inheritance only: one base class per class. Reach for interfaces (Week 5) when you need more than one thing "is-a".',
            },
            {
              t: 'recall',
              prompt:
                'Explain dynamic dispatch to someone who has only seen the Vehicle/Car/Truck example: why does the loop print three different lines from what looks like one identical call, v.Start()?',
              nudge: 'Say what decides the outcome — the array\'s declared type, or something else.',
              points: [
                'v.Start() is the same call text on every iteration',
                'What runs is decided by each object\'s actual runtime type, not by the declared type Vehicle',
                'This only works because Start is virtual in Vehicle and overridden in Car and Truck',
                'The third vehicle has no override, so it falls back to Vehicle\'s own Start()',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 3
    {
      id: 'w4-task41',
      title: 'Task 4.1 — ShapeDrawer with SplashKit',
      kind: 'lab',
      minutes: 30,
      assessment: 'Assessed · 2% of your final grade',
      summary: 'Migrate Shape onto SplashKit\'s real Color and Point2D types, then make it draggable and clickable.',
      steps: [
        {
          id: 'w4-41-why',
          title: 'Why Shape changes again',
          blocks: [
            {
              t: 'text',
              md: `Week 2's \`Shape\` used a \`string\` to stand in for a colour, because SplashKit was not available yet. This week you migrate that same class onto SplashKit's real \`Color\` type — and \`IsAt\` now takes a real \`Point2D\` struct instead of two loose integers.

The browser here runs a shim of the real SplashKit SDK — same class names, same method names as the real thing, no MSYS2 or native toolchain required while you are learning. What you write here is the same C# you would write against the installed SDK.`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Reused from Task 2.2',
              md: `Whatever you built for Task 2.2 already has \`_x\`, \`_y\`, \`_width\`, \`_height\` and the right shape of constructor. The only real change is \`_color\`'s type, and what \`Draw\`/\`IsAt\` are built from.`,
            },
          ],
        },
        {
          id: 'w4-41-uml',
          title: 'The target',
          blocks: [
            {
              t: 'umlSpec',
              caption: 'Task 4.1 target',
              source: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;
    public Shape(int param) { }
    public Color Color { get { return _color; } set { } }
    public float X { get { return 0.0f; } set { } }
    public float Y { get { return 0.0f; } set { } }
    public int Width { get { return 0; } set { } }
    public int Height { get { return 0; } set { } }
    public void Draw() { }
    public bool IsAt(Point2D pt) { return false; }
}`,
            },
          ],
        },
        {
          id: 'w4-41-fields',
          title: 'Fields and constructor',
          blocks: [
            {
              t: 'text',
              md: `Same personalisation rule as Task 2.2, with the letter range tightened: \`Color.Azure\` if your first name starts A–**K**, otherwise \`Color.Chocolate\`. The shape parameter is the same \`1XX\` as before.`,
            },
          ],
          exercise: {
            prompt:
              'Add the five private fields, and a constructor that sets _color by your name\'s first letter and _x/_y to 0.0f, with _width and _height both set to param.',
            seed: 'public class Shape\n{\n\n}',
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: '_color is a private Color',
                rule: { on: 'field', inClass: 'Shape', name: '_color', visibility: 'private', type: 'Color' },
              },
              {
                kind: 'structure',
                label: 'Shape has a constructor taking one int parameter',
                rule: { on: 'ctor', inClass: 'Shape', params: 1 },
              },
              {
                kind: 'runsClean',
                label: 'new Shape({{shapeParam}}) runs without an error',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        Shape s = new Shape({{shapeParam}});
    }
}`,
            hints: [
              'Five fields: _color (Color), _x and _y (float), _width and _height (int) — all private.',
              'Colour depends on your first name\'s first letter: A–K get Color.Azure, everyone else gets Color.Chocolate.',
              '_x and _y are both 0.0f; _width and _height both take the value of param.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w4-41-draw-isat',
          title: 'The properties, Draw, and IsAt',
          blocks: [
            {
              t: 'text',
              md: `\`Draw\` becomes one call to SplashKit — no more \`Console.WriteLine\`. \`IsAt\` now takes a \`Point2D\`, which has \`.X\` and \`.Y\` fields, instead of two separate integers. Add the five properties from the UML diagram at the same time — the interactive version needs \`X\`, \`Y\` and \`Color\` to be settable from outside.`,
            },
            {
              t: 'code',
              caption: 'Draw, unpacked',
              code: `public void Draw()
{
    SplashKit.FillRectangle(_color, _x, _y, _width, _height);
}`,
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'float vs double — a real compiler error',
              md: `\`Point2D.X\`/\`.Y\` are \`double\`s. If you ever try to assign one straight into a \`float\` field (\`_x = pt.X;\`), C# refuses: assigning a wider type into a narrower one loses precision, and the compiler will not do that silently. Cast it — \`_x = (float)pt.X;\` — or, inside \`IsAt\`, just compare without ever assigning.`,
            },
          ],
          exercise: {
            prompt:
              'Add the five properties (Color, X, Y, Width, Height), Draw() using SplashKit.FillRectangle, and IsAt(Point2D pt).',
            seed: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape(int param)
    {
        _color = Color.{{color4}};
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }

}`,
            editable: { from: 12, to: 12 },
            tests: [
              {
                kind: 'structure',
                label: 'Color is a read-write property',
                rule: { on: 'property', inClass: 'Shape', name: 'Color', hasGet: true, hasSet: true, type: 'Color' },
              },
              {
                kind: 'structure',
                label: 'X and Y are read-write float properties',
                rule: { on: 'property', inClass: 'Shape', name: 'X', hasGet: true, hasSet: true, type: 'float' },
              },
              {
                kind: 'structure',
                label: 'Draw() takes no parameters and returns void',
                rule: { on: 'method', inClass: 'Shape', name: 'Draw', params: 0, returns: 'void' },
              },
              {
                kind: 'structure',
                label: 'IsAt takes one Point2D parameter and returns bool',
                rule: { on: 'method', inClass: 'Shape', name: 'IsAt', params: 1, returns: 'bool' },
              },
              {
                kind: 'runsClean',
                label: 'Draw() runs cleanly once a window exists',
              },
              {
                kind: 'output',
                label: 'Colour is set correctly, and IsAt reports inside and outside points',
                expect: '{{color4}}\nTrue\nFalse',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        Window w = new Window("Test", 800, 600);
        Shape s = new Shape({{shapeParam}});
        s.Draw();

        Console.WriteLine(s.Color.Name);
        Console.WriteLine(s.IsAt(new Point2D(1, 1)));
        Console.WriteLine(s.IsAt(new Point2D(9999, 9999)));
    }
}`,
            hints: [
              'Each property is the usual get/set pair over its matching field — Color, X, Y, Width, Height.',
              'Draw is one line: SplashKit.FillRectangle(_color, _x, _y, _width, _height);',
              'IsAt compares pt.X and pt.Y against the shape\'s rectangle, the same math as Task 2.2\'s IsAt. pt.X and pt.Y are doubles; comparing them against float fields with >, <, >=, <= does not need a cast — only assigning one into a float field does.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w4-41-interactive',
          title: 'Make it interactive',
          blocks: [
            {
              t: 'text',
              md: `Now the payoff: run the whole program below. Click to move the shape; hover over it and press space to recolour it. This is genuinely the same loop the real SplashKit SDK runs — \`ProcessEvents\`, \`ClearScreen\`, draw, \`RefreshScreen\`, on every frame.`,
            },
            {
              t: 'runnable',
              tool: 'canvas',
              autoRun: true,
              caption: 'Click to move, space to recolour',
              code: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape(int param)
    {
        _color = Color.{{color4}};
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }

    public void Draw()
    {
        SplashKit.FillRectangle(_color, _x, _y, _width, _height);
    }

    public bool IsAt(Point2D pt)
    {
        return pt.X > _x && pt.X < _x + _width
            && pt.Y > _y && pt.Y < _y + _height;
    }
}

public class Program
{
    static void Main()
    {
        Window w = new Window("Shape Drawer", 800, 600);
        Shape myShape = new Shape({{shapeParam}});

        do
        {
            SplashKit.ProcessEvents();
            SplashKit.ClearScreen(Color.White);

            if (SplashKit.MouseClicked(MouseButton.LeftButton))
            {
                myShape.X = SplashKit.MouseX();
                myShape.Y = SplashKit.MouseY();
            }

            if (SplashKit.KeyTyped(KeyCode.SpaceKey) && myShape.IsAt(SplashKit.MousePosition()))
            {
                myShape.Color = SplashKit.RandomColor();
            }

            myShape.Draw();
            SplashKit.RefreshScreen();
        } while (!w.CloseRequested);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Draw() has to be last',
              md: 'If `myShape.Draw()` ran before the mouse-click check, a click would move the shape one frame too late — you would always see it one step behind the cursor. Clear, react to input, *then* draw, then refresh: that ordering is not arbitrary.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 4
    {
      id: 'w4-task42',
      title: 'Task 4.2 — Swin-Adventure Iteration 3: Inventory',
      kind: 'lab',
      minutes: 40,
      assessment: 'Assessed · 2% of your final grade',
      summary: 'Refactor Item onto an IdentifiableObject → GameObject hierarchy, then build and test the Inventory the real spec asks for.',
      steps: [
        {
          id: 'w4-42-why',
          title: 'Paying off Week 3\'s design smell',
          blocks: [
            {
              t: 'text',
              md: `Week 3 flagged it and moved on: \`Item\` managed its own \`_name\` and its own \`HasId\` check, duplicated logic that would need to be copied into every future "nameable" class. This task pays that off — and at the same time fixes something Week 3's \`Item\` genuinely got wrong for the real game: **a thing can have more than one name**.

Swin-Adventure's own requirements say a sword might be called \`sword\` *or* \`blade\`. One \`_name\` string can never hold two names. A **list** of identifiers can.`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'A naming note about the recording',
              md: 'If you watch the lecture recording, Dr Vo says a method name that the transcript renders as "**RU**" — that is almost certainly "**R U**", spoken shorthand for "are you". The officially assessed name, straight from Lab4.pdf\'s own Inventory spec, is `AreYou`. That is the name used everywhere below and the one your tutor will look for.',
            },
          ],
        },
        {
          id: 'w4-42-identifiable',
          title: 'IdentifiableObject: the shared base',
          blocks: [
            {
              t: 'text',
              md: `\`IdentifiableObject\` knows one thing: a list of names it can be called by. Everything that needs "does this match?" logic — \`Item\`, and later \`Room\`, \`Bag\`, whatever else — inherits it from here instead of rewriting it.`,
            },
            {
              t: 'table',
              caption: 'IdentifiableObject\'s members',
              headers: ['Member', 'Does'],
              rows: [
                ['`AreYou(string id)`', 'True if `id` matches any identifier this object holds'],
                ['`FirstID()`', 'The first identifier — used for a short, default display name'],
                ['`RemoveIdentifier(string id)`', 'Drops one identifier from the list, if it is there'],
                ['`PrivilegeEscalation(string pin)`', 'A security joke: give it the right pin and it hands back a different identity instead of the real one'],
              ],
            },
          ],
          exercise: {
            prompt:
              'Create IdentifiableObject with a private List<string> field called identifiers, a constructor that takes a string[] and seeds the list from it, and an AreYou(string id) method that checks every identifier.',
            seed: 'public class IdentifiableObject\n{\n\n}',
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'identifiers is a private List<string>',
                rule: {
                  on: 'field', inClass: 'IdentifiableObject', name: 'identifiers', visibility: 'private', type: 'List<string>',
                },
              },
              {
                kind: 'structure',
                label: 'IdentifiableObject has a constructor taking one parameter',
                rule: { on: 'ctor', inClass: 'IdentifiableObject', params: 1 },
              },
              {
                kind: 'structure',
                label: 'AreYou takes one parameter and returns bool',
                rule: { on: 'method', inClass: 'IdentifiableObject', name: 'AreYou', params: 1, returns: 'bool' },
              },
              {
                kind: 'output',
                label: 'AreYou matches any identifier the object was given',
                expect: 'True\nTrue\nFalse',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        IdentifiableObject o = new IdentifiableObject(new string[] { "sword", "blade" });
        Console.WriteLine(o.AreYou("sword"));
        Console.WriteLine(o.AreYou("blade"));
        Console.WriteLine(o.AreYou("shield"));
    }
}`,
            hints: [
              'private List<string> identifiers; — one field, a list rather than a single string.',
              'public IdentifiableObject(string[] ids) { identifiers = new List<string>(ids); } — List<T> has a constructor that seeds itself from any existing collection.',
              'AreYou loops over identifiers with foreach and returns true the moment one equals id, same shape as Week 3\'s HasId.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w4-42-firstid-remove',
          title: 'FirstID, RemoveIdentifier, PrivilegeEscalation',
          blocks: [
            {
              t: 'text',
              md: 'FirstID and RemoveIdentifier do exactly what they sound like. PrivilegeEscalation is the odd one out — a pin-protected identity swap, named as a joke about the security term.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'What PrivilegeEscalation actually checks',
              md: 'Give it the **last four digits of your student ID** as the pin, and it hands back the string `"your tutorial ID"` instead of the real first identifier. Any other pin, and it behaves exactly like `FirstID()` — nothing escalates.',
            },
          ],
          exercise: {
            prompt:
              'Add FirstID() returning the first identifier, RemoveIdentifier(string id) removing one, and PrivilegeEscalation(string pin) that returns "your tutorial ID" if pin matches the last four digits of your student ID, or FirstID() otherwise.',
            seed: `public class IdentifiableObject
{
    private List<string> identifiers;

    public IdentifiableObject(string[] ids)
    {
        identifiers = new List<string>(ids);
    }

    public bool AreYou(string id)
    {
        foreach (string i in identifiers)
        {
            if (i == id)
            {
                return true;
            }
        }
        return false;
    }

}`,
            editable: { from: 17, to: 17 },
            tests: [
              {
                kind: 'structure',
                label: 'FirstID takes no parameters and returns string',
                rule: { on: 'method', inClass: 'IdentifiableObject', name: 'FirstID', params: 0, returns: 'string' },
              },
              {
                kind: 'structure',
                label: 'RemoveIdentifier takes one parameter',
                rule: { on: 'method', inClass: 'IdentifiableObject', name: 'RemoveIdentifier', params: 1 },
              },
              {
                kind: 'structure',
                label: 'PrivilegeEscalation takes one parameter and returns string',
                rule: { on: 'method', inClass: 'IdentifiableObject', name: 'PrivilegeEscalation', params: 1, returns: 'string' },
              },
              {
                kind: 'output',
                label: 'Escalates only with the right pin, and RemoveIdentifier still works',
                expect: 'sword\nsword\nyour tutorial ID\nTrue\nFalse',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        IdentifiableObject o = new IdentifiableObject(new string[] { "sword", "blade" });
        Console.WriteLine(o.FirstID());
        Console.WriteLine(o.PrivilegeEscalation("0000"));
        Console.WriteLine(o.PrivilegeEscalation("{{XXXX}}"));

        Console.WriteLine(o.AreYou("blade"));
        o.RemoveIdentifier("blade");
        Console.WriteLine(o.AreYou("blade"));
    }
}`,
            hints: [
              'FirstID returns identifiers[0] — the list is never empty, since the constructor always seeds it.',
              'RemoveIdentifier is a one-liner: identifiers.Remove(id);',
              'PrivilegeEscalation compares pin against the last four digits of the student ID that was entered on Onboarding — return "your tutorial ID" on a match, FirstID() otherwise.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w4-42-gameobject',
          title: 'GameObject: abstract, and virtual on purpose',
          blocks: [
            {
              t: 'text',
              md: `\`GameObject\` adds a name and a description to anything identifiable — but it is never meant to be created on its own, only through a concrete child like \`Item\`. That is what \`abstract\` on the class buys you.`,
            },
            {
              t: 'code',
              caption: 'The target shape',
              code: `public abstract class GameObject : IdentifiableObject
{
    protected string name;
    protected string description;

    public GameObject(string[] ids, string name, string description)
        : base(ids)
    {
        this.name = name;
        this.description = description;
    }

    public string Name
    {
        get { return name; }
    }

    public string ShortDescription()
    {
        return name + " (" + FirstID() + ")";
    }

    public virtual string FullDescription()
    {
        return description;
    }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Filling in a gap the transcript leaves out',
              md: 'The lecture transcript writes `ShortDescription` as `return name + FirstID();`, with no separator — almost certainly a live-coding shorthand. The game\'s own sample transcript (Requirements.pdf) shows the real expected format: `"a shovel (shovel)"`. That is the format used here.',
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Three new keywords, three different jobs',
              md: `**\`abstract\`** on the class stops \`new GameObject(...)\` from ever compiling — only a concrete child can be created. **\`base(ids)\`** hands \`ids\` up to \`IdentifiableObject\`'s own constructor, so it can build the identifier list exactly as it already knows how. **\`virtual\`** on \`FullDescription\` invites a future child to override it — \`ShortDescription\` has no such invitation, because nothing here expects it to change.`,
            },
          ],
          exercise: {
            prompt:
              'Write GameObject : IdentifiableObject — abstract, with protected name and description, a constructor that forwards ids via base(ids), a read-only Name property, ShortDescription(), and a virtual FullDescription().',
            seed: 'public abstract class GameObject : IdentifiableObject\n{\n\n}',
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'GameObject is abstract and inherits from IdentifiableObject',
                rule: { on: 'class', name: 'GameObject', isAbstract: true, baseType: 'IdentifiableObject' },
              },
              {
                kind: 'structure',
                label: 'name and description are protected strings',
                rule: { on: 'field', inClass: 'GameObject', name: 'name', visibility: 'protected', type: 'string' },
              },
              {
                kind: 'structure',
                label: 'GameObject has a constructor taking three parameters',
                rule: { on: 'ctor', inClass: 'GameObject', params: 3 },
              },
              {
                kind: 'structure',
                label: 'FullDescription is virtual',
                rule: { on: 'method', inClass: 'GameObject', name: 'FullDescription', isVirtual: true },
              },
              {
                kind: 'forbid',
                label: 'GameObject is never instantiated directly',
                pattern: 'new\\s+GameObject\\s*\\(',
                message: 'GameObject is abstract — only a concrete child of it can be created with new.',
              },
            ],
            hints: [
              'The class header is: public abstract class GameObject : IdentifiableObject',
              'The constructor signature is (string[] ids, string name, string description) : base(ids) { this.name = name; this.description = description; }',
              'Name has only a get; ShortDescription and FullDescription both return string, but only FullDescription is marked virtual.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w4-42-item',
          title: 'Item: how little is left to write',
          blocks: [
            {
              t: 'text',
              md: `This is the payoff Dr Vo promised. \`Item\` no longer needs \`_name\`, \`HasId\`, or anything about identifiers at all — every bit of that is now inherited, transitively, from \`GameObject\` and \`IdentifiableObject\`. All that is left is a constructor that forwards its arguments.`,
            },
            {
              t: 'parsons',
              caption: 'Item.cs',
              prompt: 'Order the lines of the finished Item class.',
              lines: [
                'public class Item : GameObject',
                '{',
                '    public Item(string[] idents, string name, string description)',
                '        : base(idents, name, description)',
                '    {',
                '    }',
                '}',
              ],
              explain:
                'The body is empty on purpose — everything Item needs (the identifier list, AreYou, FirstID, Name, ShortDescription, FullDescription) already exists on GameObject and IdentifiableObject. base(idents, name, description) is the only line doing real work.',
            },
          ],
          exercise: {
            prompt: 'Write Item : GameObject, with a constructor that does nothing but forward to base.',
            seed: 'public class Item : GameObject\n{\n\n}',
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'Item inherits from GameObject',
                rule: { on: 'class', name: 'Item', baseType: 'GameObject' },
              },
              {
                kind: 'structure',
                label: 'Item has a constructor taking three parameters',
                rule: { on: 'ctor', inClass: 'Item', params: 3 },
              },
              {
                kind: 'output',
                label: 'A new Item already has working AreYou, FirstID and ShortDescription — inherited, not rewritten',
                expect: 'True\nsword\nbronze sword (sword)',
              },
            ],
            harness: `public class IdentifiableObject
{
    private List<string> identifiers;
    public IdentifiableObject(string[] ids) { identifiers = new List<string>(ids); }
    public bool AreYou(string id)
    {
        foreach (string i in identifiers) { if (i == id) { return true; } }
        return false;
    }
    public string FirstID() { return identifiers[0]; }
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
    public string ShortDescription() { return name + " (" + FirstID() + ")"; }
    public virtual string FullDescription() { return description; }
}

public class __Check
{
    public static void Main()
    {
        Item i = new Item(new string[] { "sword" }, "bronze sword", "A short sword cast from bronze");
        Console.WriteLine(i.AreYou("sword"));
        Console.WriteLine(i.FirstID());
        Console.WriteLine(i.ShortDescription());
    }
}`,
            hints: [
              'public class Item : GameObject',
              'public Item(string[] idents, string name, string description) : base(idents, name, description) { }',
              'The constructor body is empty — there is genuinely nothing left for Item itself to do.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w4-42-inventory',
          title: 'Inventory, to the official spec',
          blocks: [
            {
              t: 'text',
              md: `This is the same aggregation idea as Week 3's Inventory, rebuilt against the officially assessed method names — \`Put\`, \`Take\`, and a new one, \`Fetch\`, which looks an item up **without** removing it.`,
            },
            {
              t: 'umlSpec',
              caption: 'Task 4.2 target',
              source: `public class Item
{
    public Item(string[] idents, string name, string desc) { }
}

public class Inventory
{
    private List<Item> _items;
    public Inventory() { }
    public bool HasItem(string id) { return false; }
    public void Put(Item itm) { }
    public Item Take(string id) { return null; }
    public Item Fetch(string id) { return null; }
    public string ItemList { get { return ""; } }
}`,
            },
            {
              t: 'table',
              caption: 'Take vs Fetch — the one real difference',
              headers: ['Method', 'Removes the item from the inventory?'],
              rows: [
                ['`Take(id)`', 'Yes — the caller now owns it, the inventory does not'],
                ['`Fetch(id)`', 'No — just hands back a reference; the inventory still has it too'],
              ],
            },
          ],
          exercise: {
            prompt:
              'Build Inventory: a private List<Item> field, a constructor, Put, HasItem, Take, Fetch, and a read-only ItemList property (one tab-indented ShortDescription per line).',
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
                label: 'Put takes one Item and returns void',
                rule: { on: 'method', inClass: 'Inventory', name: 'Put', params: 1, returns: 'void' },
              },
              {
                kind: 'structure',
                label: 'Take returns an Item',
                rule: { on: 'method', inClass: 'Inventory', name: 'Take', params: 1, returns: 'Item' },
              },
              {
                kind: 'structure',
                label: 'Fetch returns an Item',
                rule: { on: 'method', inClass: 'Inventory', name: 'Fetch', params: 1, returns: 'Item' },
              },
              {
                kind: 'structure',
                label: 'ItemList is a read-only string property',
                rule: { on: 'property', inClass: 'Inventory', name: 'ItemList', hasGet: true, hasSet: false, type: 'string' },
              },
              {
                kind: 'nunit',
                label: 'Matches all five of Lab4.pdf\'s own Inventory tests',
                source: `[TestFixture]
public class ReferenceInventoryTests
{
    private Item Sword()
    {
        return new Item(new string[] { "sword" }, "bronze sword", "A short sword cast from bronze");
    }

    [Test]
    public void TestFindItem()
    {
        Inventory inv = new Inventory();
        inv.Put(Sword());
        Assert.That(inv.HasItem("sword"), Is.True);
    }

    [Test]
    public void TestNoItemFind()
    {
        Inventory inv = new Inventory();
        Assert.That(inv.HasItem("gem"), Is.False);
    }

    [Test]
    public void TestFetchItem()
    {
        Inventory inv = new Inventory();
        inv.Put(Sword());
        Item fetched = inv.Fetch("sword");
        Assert.That(fetched != null);
        Assert.That(inv.HasItem("sword"), Is.True);
    }

    [Test]
    public void TestTakeItem()
    {
        Inventory inv = new Inventory();
        inv.Put(Sword());
        Item taken = inv.Take("sword");
        Assert.That(taken != null);
        Assert.That(inv.HasItem("sword"), Is.False);
    }

    [Test]
    public void TestItemList()
    {
        Inventory inv = new Inventory();
        inv.Put(Sword());
        Assert.That(inv.ItemList, Is.EqualTo("\\tbronze sword (sword)\\n"));
    }
}`,
              },
            ],
            harness: `public class IdentifiableObject
{
    private List<string> identifiers;
    public IdentifiableObject(string[] ids) { identifiers = new List<string>(ids); }
    public bool AreYou(string id)
    {
        foreach (string i in identifiers) { if (i == id) { return true; } }
        return false;
    }
    public string FirstID() { return identifiers[0]; }
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
    public string ShortDescription() { return name + " (" + FirstID() + ")"; }
    public virtual string FullDescription() { return description; }
}

public class Item : GameObject
{
    public Item(string[] idents, string name, string description) : base(idents, name, description) { }
}`,
            hints: [
              'Put is _items.Add(itm); — the simplest of the five.',
              'HasItem and Fetch both loop with foreach (Item i in _items) and check i.AreYou(id); Take does the same loop but also removes the match before returning it.',
              'ItemList builds a string: for each item, add a tab, its ShortDescription(), and a newline.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w4-42-write-tests',
          title: 'Now write the tests yourself',
          blocks: [
            {
              t: 'text',
              md: `Task 4.2's own instructions do not just say "build Inventory" — they say **"create the above unit test cases."** Writing the test *is* the graded skill here, not a bonus. Fill in the five \`[Test]\` methods below against a known-correct Inventory; each one should fail the moment its assertion stops matching what Inventory actually does.`,
            },
            {
              t: 'callout',
              tone: 'warn',
              title: 'A test that always passes is worse than no test',
              md: '`Assert.That(true)` compiles, runs green, and catches nothing. Every assertion below has to depend on what Inventory actually returns — that is the only way a broken Inventory would ever turn one of these red.',
            },
          ],
          exercise: {
            prompt:
              'Write the five NUnit tests from the lab spec: TestFindItem, TestNoItemFind, TestFetchItem, TestTakeItem, TestItemList.',
            seed: `[TestFixture]
public class InventoryTests
{
    private Item Sword()
    {
        return new Item(new string[] { "sword" }, "bronze sword", "A short sword cast from bronze");
    }

    [Test]
    public void TestFindItem()
    {
    }

    [Test]
    public void TestNoItemFind()
    {
    }

    [Test]
    public void TestFetchItem()
    {
    }

    [Test]
    public void TestTakeItem()
    {
    }

    [Test]
    public void TestItemList()
    {
    }
}`,
            editable: { from: 1, to: 30 },
            tests: [
              {
                kind: 'forbid',
                label: 'No assertion is a hard-coded, always-true no-op',
                pattern: 'Assert\\.(That\\(\\s*true\\s*\\)|Pass\\()',
                message: 'An assertion that can never fail does not test anything — assert against what Inventory actually returns.',
              },
              {
                kind: 'nunit',
                label: 'All five of your tests pass against a correct Inventory',
                source: '',
              },
            ],
            harness: `public class IdentifiableObject
{
    private List<string> identifiers;
    public IdentifiableObject(string[] ids) { identifiers = new List<string>(ids); }
    public bool AreYou(string id)
    {
        foreach (string i in identifiers) { if (i == id) { return true; } }
        return false;
    }
    public string FirstID() { return identifiers[0]; }
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
    public string ShortDescription() { return name + " (" + FirstID() + ")"; }
    public virtual string FullDescription() { return description; }
}

public class Item : GameObject
{
    public Item(string[] idents, string name, string description) : base(idents, name, description) { }
}

public class Inventory
{
    private List<Item> _items;
    public Inventory() { _items = new List<Item>(); }
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
            foreach (Item i in _items) { result += "\\t" + i.ShortDescription() + "\\n"; }
            return result;
        }
    }
}`,
            hints: [
              'TestFindItem / TestNoItemFind: Put an item then assert HasItem is true for it and false for something you never put in.',
              'TestFetchItem vs TestTakeItem: after calling one of them, assert whether HasItem is now true or false — that difference is the entire point of the two methods.',
              'TestItemList: Assert.That(inv.ItemList, Is.EqualTo(...)) against the exact tab-and-newline string one Put should produce.',
            ],
            tool: 'tests',
          },
        },
      ],
    },

    // ================================================================ lesson 5
    /*
     * The week's own test — see the note on `w2-checkpoint`.
     *
     * Week 4 is the week the paper leans on hardest, and almost none of it is
     * definitions: the questions are short programs where the answer turns on
     * one keyword being present or absent. So this checkpoint traces code
     * first and asks for words second, and every trace here differs from the
     * ones in the concept lessons by exactly the keyword under test.
     */
    {
      id: 'w4-checkpoint',
      title: 'Week 4 checkpoint',
      kind: 'quiz',
      minutes: 22,
      summary:
        'Inheritance and polymorphism, traced and classified. The heaviest week on the paper, so this is the longest checkpoint.',
      steps: [
        {
          id: 'w4-cp-warmup',
          title: 'From memory first',
          blocks: [
            {
              t: 'text',
              md: 'Two keywords decide almost every Week 4 question. Write down what each of them does before you see any options.',
            },
            {
              t: 'recall',
              prompt:
                'What does `virtual` do, what does `override` do, and what decides which implementation actually runs at a call site?',
              nudge:
                'One of them is written by the parent and one by the child. The thing that decides is neither of them — it is a property of the object at the moment of the call.',
              points: [
                '`virtual` marks a base method as overridable — the parent has to opt in',
                '`override` supplies the child\'s own implementation of it, with the identical signature',
                'Without `virtual` there is nothing to override, and the code will not compile',
                'The **actual object type** decides which implementation runs, not the variable\'s declared type',
                'That decision happens at runtime — hence "runtime polymorphism"',
                'The declared type still decides which members you are allowed to call at all',
              ],
            },
          ],
        },

        {
          id: 'w4-cp-inheritance',
          title: 'The is-a family',
          blocks: [
            {
              t: 'quiz',
              question: 'Which pair should **not** be modelled with inheritance?',
              options: [
                '`Car` and `Engine`',
                '`Vehicle` and `Car`',
                '`Shape` and `Circle`',
                '`Employee` and `Manager`',
              ],
              answer: 0,
              why: [
                '',
                'A car is a vehicle — the textbook is-a, and Quiz 4\'s own example.',
                'A circle is a shape, which is the hierarchy Lab 5 builds.',
                'A manager is an employee, so a manager class specialises an employee class.',
              ],
              explain:
                'Quiz 4 Q2. A car **has** an engine; it is not a kind of engine. Say the sentence out loud — "is-a" means inheritance, "has-a" means a field.',
            },
            {
              t: 'quiz',
              question: 'Which statement about C# inheritance is **FALSE**?',
              options: [
                'A class can inherit from several base classes at once',
                'A derived class can add members its base class does not have',
                'A derived class can be used wherever the base class is expected',
                'A class can implement several interfaces while inheriting from one base class',
              ],
              answer: 0,
              why: [
                '',
                'True — that is specialisation, and it is half of why hierarchies exist.',
                'True, and it is exactly what makes polymorphism possible.',
                'True, and it is the standard way around the single-inheritance rule.',
              ],
              explain:
                'Quiz 4 Q3. One base class only — but as many interfaces as you like, which is Week 5\'s whole subject.',
            },
            {
              t: 'quiz',
              question: 'Which is the correct C# inheritance declaration?',
              options: [
                '`public class Circle : Shape`',
                '`public class Circle extends Shape`',
                '`public class Circle :: Shape`',
                '`public class Circle inherits Shape`',
              ],
              answer: 0,
              why: [
                '',
                '`extends` is Java\'s keyword. C# uses the colon for both inheritance and interfaces.',
                '`::` is C++ scope resolution, and means something else entirely.',
                'No such keyword exists in any of the three languages.',
              ],
              explain:
                'Quiz 4 Q14. A single colon, and the same colon does interfaces too: `class Item : GameObject, IComparable`.',
            },
          ],
        },

        {
          id: 'w4-cp-ctor-predict',
          title: 'Predict: building a child',
          blocks: [
            {
              t: 'predict',
              caption: 'base(...) and construction order',
              question: 'What does this print?',
              code: `public class GameObject
{
    protected string _name;

    public GameObject(string name)
    {
        _name = name;
        Console.WriteLine("GameObject built");
    }

    public string Name { get { return _name; } }
}

public class Item : GameObject
{
    public Item(string name) : base(name)
    {
        Console.WriteLine("Item built");
    }
}

public class Program
{
    static void Main()
    {
        Item i = new Item("sword");
        Console.WriteLine(i.Name);
    }
}`,
              options: [
                'GameObject built\nItem built\nsword',
                'Item built\nGameObject built\nsword',
                'Item built\nsword',
                'GameObject built\nsword',
              ],
              answer: 0,
              why: [
                '',
                'The base constructor runs **first**, so the inherited part of the object is set up before the child adds anything of its own.',
                '`: base(name)` is not optional decoration — it runs the parent constructor, and here it prints.',
                'The `Item` constructor has a body of its own, and it runs after the base one.',
              ],
              explain:
                'Base first, then child. This is why `_name` is already set by the time `Item`\'s body starts, and why `: base(...)` is compulsory whenever the parent has no parameterless constructor — the inherited half of the object has to be initialised by somebody.',
              expect: { output: 'GameObject built\nItem built\nsword' },
            },
            {
              t: 'quiz',
              question: 'What does `: base(name)` do?',
              options: [
                'Runs the base class constructor before this constructor\'s own body',
                'Creates a second object alongside this one',
                'Calls another constructor in the same class',
                'Assigns `name` to an inherited field called `base`',
              ],
              answer: 0,
              why: [
                '',
                'One `new` makes one object. The base constructor initialises the inherited part of that single object.',
                'That is `: this(...)` — the same mechanism pointed at your own class instead of the parent.',
                '`base` is a keyword meaning the parent class; it is never a field name.',
              ],
              explain:
                'Lab 4 Task 4.2 uses exactly this. `this` means this class, `base` means the parent — and both run before the constructor body they are attached to.',
            },
          ],
        },

        {
          id: 'w4-cp-access-predict',
          title: 'Predict: what a child can reach',
          blocks: [
            {
              t: 'predict',
              caption: 'private is inherited but untouchable',
              question: 'What happens when this program runs?',
              code: `public class Shape
{
    private string _colour = "red";
    protected int _size = 3;

    public string Colour { get { return _colour; } }
}

public class Circle : Shape
{
    public void Show()
    {
        Console.WriteLine(_size);
        Console.WriteLine(_colour);
    }
}

public class Program
{
    static void Main()
    {
        Circle c = new Circle();
        c.Show();
    }
}`,
              options: [
                'It is rejected — `_colour` is private to `Shape`, so `Circle` cannot name it',
                'It prints 3 then red',
                'It prints 3, then an empty line',
                'It prints red then 3',
              ],
              answer: 0,
              why: [
                '',
                'That would need `_colour` to be `protected` as well. As written, the compiler refuses before anything runs.',
                'There is no silent fallback for a visibility violation — it is an error, not an empty value.',
                'Neither line runs; the program never gets that far.',
              ],
              explain:
                'Every `Circle` object contains a `_colour`, and `Circle`\'s own code still cannot touch it. `private` means "this class only", and a subclass is a different class. Reading it through the inherited public `Colour` property would work — that is what the property is for.',
              expect: { errorContains: '_colour' },
            },
            {
              t: 'quiz',
              question:
                'A base class needs a field every subclass can read, but no outside code should touch. Which modifier?',
              options: ['`protected`', '`public`', '`private`', 'No modifier at all'],
              answer: 0,
              why: [
                '',
                'That opens it to the entire program, not just to the family.',
                '`private` shuts the subclasses out — they inherit the field but cannot use it.',
                'No modifier means `private`, so it has exactly the same problem.',
              ],
              explain:
                'This is the situation `protected` exists for. From outside the hierarchy it behaves exactly like `private`; from inside it behaves like `public`.',
            },
            {
              t: 'quiz',
              question:
                'A field is declared inside a class with no access modifier. Who can name it?',
              options: [
                'Only the class that declares it',
                'That class and all of its subclasses',
                'Any class in the same project',
                'Any class anywhere',
              ],
              answer: 0,
              why: [
                '',
                'That is `protected`, and you have to ask for it explicitly.',
                'That is `internal` — the default for a **top-level class**, not for a member inside one.',
                'That is `public`, which C# never gives you by default.',
              ],
              explain:
                'Quiz 4 Q4, and Lecture 5 named it as a likely midterm question. Members default to `private`; only the class itself defaults to `internal`, and the mismatch is what makes the wrong answer tempting.',
            },
          ],
        },

        {
          id: 'w4-cp-poly-predict',
          title: 'Predict: extending an override',
          blocks: [
            {
              t: 'predict',
              caption: 'base.Method() inside an override',
              question: 'What does this print?',
              code: `public class Shape
{
    public virtual string Describe()
    {
        return "a shape";
    }
}

public class Circle : Shape
{
    public override string Describe()
    {
        return base.Describe() + " that is round";
    }
}

public class Program
{
    static void Main()
    {
        Shape s = new Circle();
        Console.WriteLine(s.Describe());
    }
}`,
              options: [
                'a shape that is round',
                'a shape',
                ' that is round',
                'It never finishes — base.Describe() calls itself forever',
              ],
              answer: 0,
              why: [
                '',
                'That is what a **non**-virtual method would give you through a `Shape` variable. Here it is virtual and overridden, so the object decides.',
                '`base.Describe()` really does return the parent\'s string, and it is prepended.',
                '`base.` specifically means the parent\'s implementation, so there is no loop. Writing plain `Describe()` instead is what would recurse forever.',
              ],
              explain:
                'Two things at once. The variable is a `Shape` but the object is a `Circle`, so the override runs — and an override can **extend** rather than replace, by calling `base.Method()` and adding to the result.',
              expect: { output: 'a shape that is round' },
            },
            {
              t: 'quiz',
              question:
                'A `virtual` method is overridden in a child. You call it through a variable declared as the **parent** type. Which implementation runs?',
              options: [
                'The child\'s — the actual object type decides',
                'The parent\'s — the declared type decides',
                'Whichever class was compiled last',
                'Both, parent first',
              ],
              answer: 0,
              why: [
                '',
                'That is true only when the method is *not* virtual — and then it is method hiding, not overriding.',
                'Compilation order has nothing to do with dispatch.',
                'Only one runs, unless the override explicitly calls `base`.',
              ],
              explain:
                'Quiz 4 Q11. The most examined sentence in Week 4: **the object decides, not the variable.** The declared type still limits which members you may call.',
            },
            {
              t: 'quiz',
              question: 'Which statement about polymorphism is **FALSE**?',
              options: [
                'You can achieve polymorphism without inheritance in C#',
                'You can refer to a child object through a parent-typed reference',
                'It lets derived objects be treated uniformly through a common type',
                'Overridden virtual methods are resolved at runtime',
              ],
              answer: 0,
              why: [
                '',
                'True, and it is the assignment every polymorphic call depends on.',
                'True — one loop over a `List<Shape>` instead of a chain of type checks.',
                'True: that is what makes it *runtime* polymorphism.',
              ],
              explain:
                'Quiz 4 Q9. Subtype polymorphism needs a shared type — a base class or an interface. A shared method *name* between unrelated classes creates nothing.',
            },
          ],
        },

        {
          id: 'w4-cp-parsons',
          title: 'Rebuild the override',
          blocks: [
            {
              t: 'text',
              md: 'Two classes, one overridable method. The keywords are already on the right lines — the question is which line goes where.',
            },
            {
              t: 'parsons',
              caption: 'Circle.cs — Shape already declares `public virtual double Area()`',
              prompt: 'Order the child class that specialises Shape and overrides its Area().',
              lines: [
                'public class Circle : Shape',
                '{',
                '    private double _radius;',
                '    public Circle(double radius)',
                '    {',
                '        _radius = radius;',
                '    }',
                '    public override double Area() { return 3.14 * _radius * _radius; }',
                '}',
              ],
              explain:
                '`virtual` on the parent, `override` on the child, and the signatures identical — same name, same parameters, same return type, same accessibility. Drop `virtual` and the override no longer compiles; drop `override` and you get method *hiding*, which behaves correctly right up until someone uses a `Shape`-typed variable.',
            },
          ],
        },

        {
          id: 'w4-cp-abstract',
          title: 'Abstract classes and methods',
          blocks: [
            {
              t: 'quiz',
              question: 'Which is a correct abstract method declaration in C#?',
              options: [
                '`public abstract void Print();`',
                '`public abstract void Print() { }`',
                '`public abstract void Print() = 0;`',
                '`public virtual abstract void Print();`',
              ],
              answer: 0,
              why: [
                '',
                'An abstract method may not have a body — not even an empty pair of braces.',
                '`= 0` is the C++ pure-virtual syntax. It is the language trap Quiz 4 calls out by name.',
                '`abstract` already implies overridable, so combining it with `virtual` is an error.',
              ],
              explain:
                'Quiz 4 Q8. Access modifier, `abstract`, signature, semicolon. Nothing else.',
            },
            {
              t: 'compare',
              title: 'virtual or abstract?',
              left: {
                title: 'virtual',
                tone: 'neutral',
                code: 'public virtual double Area()\n{\n    return 0.0;\n}',
                md: 'Has a body. There **is** a sensible default, and a child may replace it or leave it alone.',
              },
              right: {
                title: 'abstract',
                tone: 'neutral',
                code: 'public abstract double Area();',
                md: 'Has no body. There is **no** sensible default, so every concrete child must supply one — and the compiler enforces it.',
              },
            },
            {
              t: 'quiz',
              question:
                'Why declare a method abstract rather than giving it an empty body?',
              options: [
                'The compiler then forces every concrete subclass to supply a real implementation',
                'Abstract methods run faster than ordinary ones',
                'Empty method bodies are illegal in C#',
                'It allows the class to be instantiated',
              ],
              answer: 0,
              why: [
                '',
                'There is no performance difference at all between the two.',
                'Empty bodies are perfectly legal — which is the problem, not the fix.',
                'It has the opposite effect: any abstract member makes the class impossible to instantiate.',
              ],
              explain:
                'An empty body silently does nothing when a subclass forgets to override. `abstract` turns that omission into a compile error, which is where you want to find it.',
            },
            {
              t: 'quiz',
              question: 'Can an abstract class contain fields and fully implemented methods?',
              options: [
                'Yes — it can hold ordinary members alongside the abstract ones',
                'No — every member of an abstract class must be abstract',
                'It can hold fields but not implemented methods',
                'It can hold implemented methods but no fields',
              ],
              answer: 0,
              why: [
                '',
                'A class with only abstract members and no state is effectively an interface, but that is a choice rather than a rule.',
                'Shared implementation is half the reason to use a base class at all.',
                '`protected` fields in an abstract base are extremely common — `Shape` holds one.',
              ],
              explain:
                'This is the main difference from an interface: an abstract class can carry state and shared code and still leave some members for the children. Week 5 turns that comparison into a question.',
            },
          ],
        },

        {
          id: 'w4-cp-exam',
          title: 'Under exam conditions',
          blocks: [
            {
              t: 'text',
              md: 'Five, in the shape the paper asks them. Twenty seconds each, no scrolling back.',
            },
            {
              t: 'quiz',
              question:
                '__________ enables the use of the same method name with a different implementation for each child class.',
              options: ['Polymorphism', 'Encapsulation', 'Abstraction', 'Aggregation'],
              answer: 0,
              why: [
                '',
                'Encapsulation is about hiding data behind a controlled interface, not about many implementations.',
                'Abstraction is the design decision about which characteristics matter.',
                'Aggregation is a whole–part relationship between objects — Week 3.',
              ],
              explain:
                'Quiz 4 Q6. Polymorphism literally means "many forms": one name, one call site, an implementation chosen by the object.',
            },
            {
              t: 'quiz',
              question: 'Which best describes method overriding?',
              options: [
                'Providing a new implementation of an inherited method in a child class',
                'Defining several methods with the same name and different parameters',
                'Calling a method before it is declared',
                'Hiding a method so nothing can call it',
              ],
              answer: 0,
              why: [
                '',
                'That is method **overloading** — same name, different parameter lists, chosen at compile time.',
                'Declaration order does not affect whether a method can be called.',
                'Making a method `private` restricts access; it is unrelated to overriding.',
              ],
              explain:
                'Quiz 4 Q7. Override: same signature, different body, chosen at runtime. Overload: different signature, same name, chosen at compile time.',
            },
            {
              t: 'quiz',
              question:
                'Which statement about generalisation and specialisation is TRUE?',
              options: [
                'Generalisation represents characteristics shared among several classes',
                'Generalisation adds specific detail to a child class',
                'Specialisation removes members the parent declared',
                'They are two names for the same operation',
              ],
              answer: 0,
              why: [
                '',
                'Reversed — adding specific detail downward is specialisation.',
                'A child can override inherited behaviour but can never delete an inherited member.',
                'They name the two opposite directions, and the paper asks which is which.',
              ],
              explain:
                'Quiz 4 Q10 and Q16. Generalise **up** (pull what is common into a parent), specialise **down** (add what makes a child different).',
            },
            {
              t: 'quiz',
              question:
                'Which real-world example best illustrates polymorphism?',
              options: [
                'One "print" action handling a document, an image or a PDF appropriately',
                'A printer that can only handle one file format',
                'A file that can be opened by several different programs',
                'A folder containing many files',
              ],
              answer: 0,
              why: [
                '',
                'One behaviour and one type is the opposite of many forms.',
                'Several readers of one thing, rather than one action over many types.',
                'That is containment — a Week 3 relationship, not a Week 4 one.',
              ],
              explain:
                'Quiz 4 Q12. Many forms behind one call: the caller says "print", and what happens depends on what it was handed.',
            },
            {
              t: 'quiz',
              question:
                'Given `Shape s = new Circle();` where `Circle` adds a `Roll()` method that `Shape` does not have, what does `s.Roll();` do?',
              options: [
                'It fails to compile — `Shape` has no `Roll()`, whatever the object really is',
                'It runs `Circle.Roll()`, because the object is a circle',
                'It compiles but does nothing',
                'It throws at runtime',
              ],
              answer: 0,
              why: [
                '',
                'Dynamic dispatch chooses between implementations of a member the *declared* type has. `Roll` is not one of them.',
                'The compiler rejects the program, so nothing runs at all.',
                'Member lookup is a compile-time concern; it never reaches runtime.',
              ],
              explain:
                'Both rules are live at once: the **reference type** decides what you may call, and the **object type** decides which override runs. This is where they meet.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'More of these',
              md: 'Concept focus holds around seventy questions on Week 4 alone — the heaviest week on the paper — drawn fresh each sitting, with anything you miss kept on a list until you have revised it and proved it.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 6
    {
      id: 'w4-interview',
      title: 'Lab interview drill',
      kind: 'interview',
      minutes: 10,
      summary: 'Rehearse explaining the hierarchy and your tests out loud before your tutor asks.',
      steps: [
        {
          id: 'w4-int-1',
          title: 'Same rubric as every week',
          blocks: [
            {
              t: 'callout',
              tone: 'key',
              md: 'Finishing the code caps you at 70%. The last 30% is entirely about explaining **why** — same rubric as every week so far. The questions below rehearse it against this week\'s material.',
            },
          ],
        },
      ],
    },
  ],
};

/** Interview questions for Week 4, asked against the student's own code. */
export const week4Interview: InterviewQuestion[] = [
  {
    id: 'w4-q1',
    question: 'Why is GameObject declared abstract?',
    lookingFor: [
      'It is meant to describe what Item (and future classes) share, never to be a real object itself',
      'Marking it abstract makes new GameObject(...) a compile error, enforcing that',
      'Only its concrete children, like Item, can actually be created',
    ],
    aboutStep: 'w4-42-gameobject',
  },
  {
    id: 'w4-q2',
    question: 'Item\'s constructor body is empty. Why does the class still work?',
    lookingFor: [
      'Everything Item needs — the identifier list, AreYou, FirstID, Name, ShortDescription, FullDescription — is inherited',
      'base(idents, name, description) forwards the arguments up to GameObject, which forwards ids further up to IdentifiableObject',
      'This is the entire payoff of inheritance: nothing duplicated, nothing left to write',
    ],
    aboutStep: 'w4-42-item',
  },
  {
    id: 'w4-q3',
    question: 'What is the actual difference between Take and Fetch?',
    lookingFor: [
      'Take removes the item from the inventory before returning it',
      'Fetch returns a reference to the item but leaves it in the inventory',
      'After Take, HasItem for that id is false; after Fetch, it is still true',
    ],
    aboutStep: 'w4-42-inventory',
  },
  {
    id: 'w4-q4',
    question: 'In your TestItemList, what would happen to your assertion if ItemList\'s formatting were wrong — say, a missing tab?',
    lookingFor: [
      'The test would fail, because the assertion checks the exact string, not just that something non-empty came back',
      'That is what makes it a real test rather than Assert.That(true)',
    ],
    aboutStep: 'w4-42-write-tests',
  },
  {
    id: 'w4-q5',
    question: 'If Vehicle\'s Start() were not marked virtual, what would the Car/Truck/Vehicle loop print?',
    lookingFor: [
      '"Starting the vehicle!!" three times',
      'Without virtual/override, the declared array type (Vehicle) decides which Start() runs, not the object\'s actual type',
      'virtual on the parent and override on the child are both required for dynamic dispatch',
    ],
    aboutStep: 'w4-poly-dispatch',
  },
  {
    id: 'w4-q6',
    question: 'Why are name and description protected in GameObject, rather than private?',
    lookingFor: [
      'protected lets a future child class read or set them directly if it ever needs to',
      'private would force every child to go through inherited methods/properties only',
      'This was a deliberate design choice in the lecture\'s own code, not the only correct answer — private would also have worked, just been stricter',
    ],
    aboutStep: 'w4-42-gameobject',
  },
];
