/**
 * Week 1 revision notes — objects, classes, encapsulation, constructors.
 *
 * These are not the lecture. They are what you would write on the one page you
 * were allowed to take in, if you were allowed to take a page in — which you
 * are not, so the job is to make each section small enough to hold in memory
 * and specific enough to answer a multiple-choice question with.
 *
 * Every section names the concepts it covers, so a missed question can open
 * this page at the exact paragraph rather than at the top.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK1: WeekNotes = {
  week: 1,
  title: 'Objects, classes and encapsulation',
  gist: 'What an object is, what a class is, and the four words the whole unit is built on.',
  sources: ['Lecture 1', 'Quiz 1'],
  sections: [
    {
      id: 'n1-mindset',
      title: 'Why any of this',
      concepts: ['oop-why'],
      blocks: [
        {
          t: 'text',
          md: 'Procedural code defines variables and writes standalone functions over them. In a card game that means the logic for a card lives in six functions, none of which owns it — and when the score comes out wrong there is no single place to look.\n\nObject-oriented code models the problem as **interacting entities**. A `Game` owns a `Deck`, the `Deck` owns 52 `Card` objects, each `Player` tracks its own score. Each object owns a small, self-contained slice, which is what makes a large system traceable and testable at all.',
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'The exam sentence',
          md: 'OOP **manages complexity in larger software by breaking problems down into small parts, such as objects**. That is Quiz 1 Q11 nearly verbatim, and it is the phrasing to reach for.',
        },
      ],
    },
    {
      id: 'n1-class-object',
      title: 'Class vs object',
      concepts: ['class-object', 'attr-behaviour'],
      blocks: [
        {
          t: 'compare',
          left: {
            title: 'Class — the blueprint',
            tone: 'neutral',
            md: 'Defines the **metadata** (attributes) and **behaviour** (methods) shared by a category of things. Written once. Not a thing itself.',
          },
          right: {
            title: 'Object — the instance',
            tone: 'good',
            md: 'One concrete thing built from the blueprint, holding its own values. Created with `new`. There can be thousands.',
          },
        },
        {
          t: 'text',
          md: 'A car *model* is the class; every physical car built to it is an object, sharing the design but carrying its own serial number. 260 students in the unit means 260 objects and **one** `Student` class.',
        },
        {
          t: 'table',
          caption: 'The two halves of any class',
          headers: ['', 'What it is', '`Car` example', '`Student` example'],
          rows: [
            ['**Attribute**', 'What the object *knows*', '`Model`, `Colour`, `Speed`', '`Name`, `Grade`, `CompletedTasks`'],
            ['**Behaviour**', 'What the object *can do*', '`Drive()`, `Brake()`, `Refuel()`', '`RegisterForUnit()`, `ApplyForGraduation()`'],
          ],
        },
        {
          t: 'callout',
          tone: 'trap',
          md: '"A class is an object" is marked wrong every time. The class is the plan; the object is the thing built from it.',
        },
      ],
    },
    {
      id: 'n1-encapsulation',
      title: 'Encapsulation and abstraction',
      concepts: ['encapsulation', 'abstraction'],
      blocks: [
        {
          t: 'text',
          md: 'These two get confused more than any other pair in the unit, and the exam knows it.',
        },
        {
          t: 'compare',
          title: 'Tell them apart by asking *what kind of decision is this?*',
          left: {
            title: 'Abstraction — what to model',
            tone: 'neutral',
            md: 'Focus on the **essential characteristics** of a real-world entity, ignore the irrelevant ones.\n\nA design-level judgement: a `Patient` needs name, DOB and allergies — not eye colour.',
          },
          right: {
            title: 'Encapsulation — how to hide it',
            tone: 'neutral',
            md: 'Bundle data and methods into one unit and **restrict direct access** to that data.\n\nAn enforcement mechanism: `private` fields, reached through properties.',
          },
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'Abstraction hides **complexity**. Encapsulation hides **data**. One is a decision, the other is a keyword.',
        },
        {
          t: 'text',
          md: 'Encapsulation also covers the *bundling* half — an object holds both **data** and **functionality** in a single unit. Question 1 of the mock test is exactly that claim about a `Student`, and the answer is True.',
        },
      ],
    },
    {
      id: 'n1-access',
      title: 'Access modifiers',
      concepts: ['access-modifiers'],
      blocks: [
        {
          t: 'table',
          headers: ['Modifier', 'Reachable from', 'Use it for'],
          rows: [
            ['`private`', 'Only inside the same class', 'Every field, by default'],
            ['`protected`', 'The class **and** its derived classes', 'State a child class genuinely needs'],
            ['`public`', 'Any code, anywhere', 'The methods and properties that are the class\'s interface'],
            ['`~` (internal)', 'The same assembly — UML writes it `~`', 'Rare in this unit; know the symbol'],
          ],
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'Two facts worth memorising exactly',
          md: '**`general` is not an access modifier.** It appears as a distractor in Quiz 1 and is simply not a C# keyword.\n\n**A member with no modifier is `private`.** C# defaults to the conservative option so nothing leaks by accident — mock-test question 5.',
        },
        {
          t: 'code',
          caption: 'Both of these are private',
          code: `class Account
{
    decimal balance;                    // private
    void Deposit(decimal amount) { }    // private
}`,
        },
      ],
    },
    {
      id: 'n1-constructors',
      title: 'Constructors',
      concepts: ['constructors'],
      blocks: [
        {
          t: 'text',
          md: 'A constructor is a special method that runs automatically when an object is created, to put it into a valid starting state.',
        },
        {
          t: 'table',
          headers: ['Rule', 'Detail'],
          rows: [
            ['Name', 'Exactly the class name'],
            ['Return type', '**None at all** — not even `void`'],
            ['When it runs', 'Automatically, on `new`'],
            ['How many', 'Unlimited, as long as each has a different parameter signature'],
            ['If you write none', 'You get a free parameterless one'],
            ['If you write one', 'The free one **disappears**'],
          ],
        },
        {
          t: 'code',
          caption: 'Constructor overloading — legal, and asked about on the mock test',
          code: `public class Drawing
{
    public Drawing() : this(Color.White) { }

    public Drawing(Color background)
    {
        _background = background;
        _shapes = new List<Shape>();
    }
}`,
        },
        {
          t: 'callout',
          tone: 'trap',
          md: 'Writing `public void Car()` does not give you a constructor. It gives you an ordinary method that happens to share the class\'s name, and `new Car()` will still look for the compiler-supplied one.',
        },
      ],
    },
    {
      id: 'n1-properties',
      title: 'Fields and properties',
      concepts: ['properties'],
      blocks: [
        {
          t: 'text',
          md: 'A **field** stores state and is normally `private`. A **property** is the public gateway to it — the answer to "what is added to a class to provide access to hidden data?"',
        },
        {
          t: 'code',
          code: `private string model;              // field: hidden

public string Model                // property: controlled access
{
    get { return model; }
    set { model = value; }
}`,
        },
        {
          t: 'text',
          md: '`value` is a contextual keyword the compiler supplies inside `set` — it is whatever was assigned. You never declare it.\n\nThe reason to prefer a property over a public field is that the setter is a place to put a guard: reject a negative price, trim a name, refuse an empty id. A public field has nowhere to put that check.',
        },
      ],
    },
    {
      id: 'n1-datatypes',
      title: 'Picking a data type',
      concepts: ['datatypes'],
      blocks: [
        {
          t: 'callout',
          tone: 'key',
          md: 'If you would never do **maths** on it, store it as a `string`.',
        },
        {
          t: 'text',
          md: 'A phone number is the standing example: `0412345678` loses its leading zero as an `int`, `+61…` will not parse at all, and `(03) 9214-8000` has punctuation in it. A phone number is an **identifier**, not a quantity — you never add two of them together. The same reasoning applies to student IDs, postcodes and product codes.',
        },
      ],
    },
  ],
};
