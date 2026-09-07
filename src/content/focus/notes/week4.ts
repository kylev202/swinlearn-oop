/**
 * Week 4 revision notes — inheritance and polymorphism.
 *
 * The biggest week on the paper by concept count, and the one where students
 * lose marks on judgement rather than syntax: they can write `class Car :
 * Vehicle` and still not notice that `Student`/`Teacher` is not a hierarchy.
 * So the first section here is about deciding, not declaring.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK4: WeekNotes = {
  week: 4,
  title: 'Inheritance and polymorphism',
  gist: 'When a family of types is the right answer, how to declare one, and why it removes the if/else chain.',
  sources: ['Lecture 4', 'Quiz 4'],
  sections: [
    {
      id: 'n4-when',
      title: 'When inheritance is the wrong answer',
      concepts: ['inheritance', 'gen-spec'],
      blocks: [
        {
          t: 'text',
          md: 'Say it out loud with **is a** in the middle. "A car **is a** vehicle" reads true. "A student **is a** teacher" does not — and neither does "a library **is a** book".',
        },
        {
          t: 'table',
          caption: 'The mock test asks you to pick the valid pairing out of these',
          headers: ['Pair', 'Verdict', 'Why'],
          rows: [
            ['`Vehicle` → `Car`, `Truck`, `Bike`', '**Valid**', 'They genuinely share year, brand, wheels, fuel type'],
            ['`Student` / `Teacher`', 'Invalid', 'Neither is a kind of the other — a student cannot update marks'],
            ['`ComputerMonitor` / `ComputerKeyboard`', 'Invalid', 'Two separate components of one computer — aggregation'],
            ['`Library` / `Book`', 'Invalid', 'Containment, so aggregation again'],
          ],
        },
        {
          t: 'compare',
          title: 'The two directions along a hierarchy',
          left: {
            title: 'Generalisation — looking up',
            tone: 'neutral',
            md: 'What do these classes have in **common**? Pull it into a parent.\n\n`colour` moves out of `Rectangle` and `Circle` and into `Shape`.',
          },
          right: {
            title: 'Specialisation — looking down',
            tone: 'neutral',
            md: 'What makes this one **different**? Add it to the child.\n\n`Rectangle` gains `Width` and `Height`, which mean nothing to a `Circle`.',
          },
        },
      ],
    },
    {
      id: 'n4-syntax',
      title: 'Declaring it, and what the child gets',
      concepts: ['inheritance', 'protected'],
      blocks: [
        {
          t: 'code',
          caption: 'A colon. Not `extends`, not `inherits`.',
          code: `public class Circle : Shape
{
    private float _radius;
}`,
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'A C# class has **exactly one** base class. It may implement many *interfaces* — which is a large part of why interfaces exist at all, and Week 5\'s whole subject.',
        },
        {
          t: 'text',
          md: 'The child inherits **every** member of the parent, but can only *reach* the public and protected ones. A private field of the parent is inherited and untouchable:',
        },
        {
          t: 'code',
          code: `public class Account {
    private decimal balance;    // inherited, but unreachable below
    protected string owner;     // inherited AND usable below
}

public class SavingsAccount : Account {
    public void Show() {
        Console.WriteLine(balance);   // compile error
        Console.WriteLine(owner);     // fine
    }
}`,
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'This is why `Shape` keeps `x`, `y`, `colour` and `isSelected` as `protected` rather than `private` — `Rectangle` has to draw with them.',
        },
      ],
    },
    {
      id: 'n4-polymorphism',
      title: 'Polymorphism',
      concepts: ['polymorphism', 'override'],
      blocks: [
        {
          t: 'text',
          md: '*Poly* (many) + *morph* (form). Declare a variable using the **parent** type, put a **child** object in it, call the shared method — and the runtime executes the child\'s version.',
        },
        {
          t: 'compare',
          title: 'The problem it solves',
          left: {
            title: 'Without it',
            tone: 'bad',
            code: `foreach (Shape s in shapes)
{
    if (s is Rectangle) DrawRect(s);
    else if (s is Circle) DrawCircle(s);
    else if (s is Line) DrawLine(s);
    // ...and edit this every time
    // a new shape is added
}`,
          },
          right: {
            title: 'With it',
            tone: 'good',
            code: `foreach (Shape s in shapes)
{
    s.Draw();
}
// new shape types need no
// change here at all`,
          },
        },
        {
          t: 'code',
          caption: 'The mechanism: virtual in the parent, override in the child',
          code: `public class Vehicle {
    public virtual void Start() { Console.WriteLine("Starting the vehicle!!"); }
}

public class Car : Vehicle {
    public override void Start() { Console.WriteLine("Starting the car!!"); }
}

Vehicle[] vehicles = { new Car(), new Truck(), new Vehicle() };
foreach (Vehicle v in vehicles) v.Start();
// Starting the car!!  /  Starting the truck!!  /  Starting the vehicle!!`,
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'The rule to say back',
          md: 'The **declared type** decides what you are allowed to call. The **actual object** decides which implementation runs. That second half is what "runtime polymorphism" means.',
        },
        {
          t: 'table',
          caption: 'Overriding vs overloading — reliably confused, reliably examined',
          headers: ['', 'Overriding', 'Overloading'],
          rows: [
            ['What', 'A new implementation of an **inherited** method', 'Several methods sharing a name, with **different parameters**'],
            ['Needs inheritance?', 'Yes', 'No'],
            ['Resolved', 'At runtime', 'At compile time'],
            ['Keywords', '`virtual` on the parent, `override` on the child', 'None'],
          ],
        },
        {
          t: 'callout',
          tone: 'trap',
          md: 'Without `virtual` there is no override — the parent\'s version runs even when the object is a child. And you cannot have polymorphism with no shared type at all: there must be a base class or an interface to dispatch *through*.',
        },
      ],
    },
    {
      id: 'n4-abstract',
      title: 'Abstract classes and methods',
      concepts: ['abstract'],
      blocks: [
        {
          t: 'code',
          caption: 'No body, and a semicolon',
          code: `public abstract class Shape
{
    protected float x, y;
    protected Color colour;

    public abstract void Draw();          // no body — every child must supply one
    public abstract bool IsAt(Point2D p);
}`,
        },
        {
          t: 'table',
          headers: ['Rule', 'Detail'],
          rows: [
            ['An abstract **class**', 'Cannot be instantiated — no `new Shape()`, only `new Rectangle()`'],
            ['An abstract **method**', 'Has no body at all; every concrete child **must** `override` it'],
            ['`abstract` + `virtual`', 'Illegal together — `abstract` already means overridable'],
            ['Shared state', 'An abstract class can still hold fields and implemented methods; an interface cannot'],
          ],
        },
        {
          t: 'callout',
          tone: 'trap',
          md: '`public abstract void Print() { }` is wrong — an empty body still counts as a body, and that declaration is `virtual`, not `abstract`. The correct form is `public abstract void Print();`',
        },
      ],
    },
  ],
};
