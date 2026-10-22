/**
 * Week 8 revision notes — good OO design.
 *
 * Six revision questions, and the released mockup takes two of its twenty
 * from them: **Q4 is Quiz 8 Q1 word for word** (the antisocial class), and Q3
 * asks the low-coupling question. Like Week 7, it pays far above its size.
 *
 * The four design goals are worth learning as **that exact set of words** —
 * lazy, antisocial, conformist — because the exam asks for them by name and
 * each one sounds like a criticism until you know it is a goal.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK8: WeekNotes = {
  week: 8,
  title: 'Good OO design',
  gist: 'What a well-behaved class looks like: lazy, antisocial, conformist — and the smells that say otherwise.',
  sources: ['Lecture 8 §1–§4', 'Quiz 8', 'Final mockup Q3, Q4'],
  sections: [
    {
      id: 'n8-goals',
      title: 'Lazy, antisocial, conformist',
      concepts: ['lazy-class', 'antisocial-class', 'conformity'],
      blocks: [
        {
          t: 'callout',
          tone: 'key',
          md: 'All three words are **compliments** here. Each names a goal, and each sounds like a fault until you know what it means — which is exactly what makes them good exam questions.',
        },
        {
          t: 'table',
          headers: ['Goal', 'Means', 'Improves'],
          rows: [
            [
              '**Lazy**',
              'Minimise your own responsibilities; **delegate** what another object is better placed to do',
              'Cohesion',
            ],
            [
              '**Antisocial**',
              'Keep communication with other objects minimal and well defined',
              'Coupling',
            ],
            [
              '**Conformist**',
              'Honour your parent’s contract so you can stand in for it',
              'Correctness of the hierarchy',
            ],
          ],
        },
        {
          t: 'text',
          md: '### Lazy\n\nA lazy class asks "should this be mine?" and hands the job to whoever owns the data. It is the **information expert** rule from Week 6, seen from the other side.\n\nIf `Order.Total()` reaches into every `Item` for `UnitPrice`, `Quantity` and `DiscountRate` to do arithmetic, it is doing an `Item`’s job. `sum += i.Subtotal()` delegates, and stops `Order` knowing how pricing works.',
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'Antisocial — the exam wording',
          md: '"To **prevent excessive communication between objects and reduce dependencies**." Mockup Q4, verbatim.\n\nNot "to minimise object creation", and emphatically not "so objects can access each other’s private data" — that is the opposite.\n\nThe blackjack example: a random `Player` should **not** be able to ask the `Deck` for the card at an arbitrary index. That exposes what the player has no business knowing, *and* couples the player to how the deck stores cards.',
        },
        {
          t: 'text',
          md: '### Conformist — Liskov substitution\n\nA subtype must be usable **anywhere its base type is expected, without breaking correctness**. The test is behavioural, not structural: swap the subclass in and ask whether code written against the base class can be surprised.',
        },
        {
          t: 'compare',
          left: {
            title: 'Poor conformity',
            tone: 'bad',
            md: '`Square : Rectangle`, still exposing independently settable width and height.\n\nA rectangle **promises** they vary independently. A square cannot honour that and stay square — so code holding a `Rectangle` reference can produce an invalid square without doing anything wrong.',
          },
          right: {
            title: 'Same failure, different shape',
            tone: 'bad',
            md: '`Penguin : Bird` overriding `Fly()` to throw.\n\nIt compiles, which is the trap. But code treating it as a `Bird` and calling `Fly` now crashes.\n\nThe fix is in the **hierarchy**, not the override — `Fly` belongs on a narrower type.',
          },
        },
      ],
    },
    {
      id: 'n8-mvc',
      title: 'MVC',
      concepts: ['mvc'],
      blocks: [
        {
          t: 'table',
          headers: ['Part', 'Owns', 'Test'],
          rows: [
            ['**Model**', 'The data and business rules', 'Compiles with no reference to any UI type'],
            ['**View**', 'Presentation — showing it, collecting input', 'No decisions, just display'],
            ['**Controller**', 'The logic between them, and **validating user input**', 'Where the user’s intent is interpreted'],
          ],
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'The exam answer for "what is MVC’s advantage?"',
          md: '**A change in one component has minimal impact on the others.** Because each has a clear, separate responsibility, how data is displayed can change without touching how it is stored.',
        },
        {
          t: 'callout',
          tone: 'warn',
          md: 'Input validation is the **Controller’s** job. Letting a database or model class handle raw user input is called out explicitly as bad practice — and it comes back in Week 9 as GRASP’s **Controller** principle, where it is asked the same way and answered the same way.',
        },
      ],
    },
    {
      id: 'n8-smells',
      title: 'Design smells and class size',
      concepts: ['design-smells', 'class-size'],
      blocks: [
        {
          t: 'table',
          headers: ['Smell', 'Why it hurts', 'Fix'],
          rows: [
            [
              'Deep inheritance hierarchy',
              'A change at the top ripples through every level below; each level is another place behaviour can be overridden',
              'Flatten it, or compose instead',
            ],
            [
              'Long `if`/`else` or `switch` on a type',
              'Adding a type means editing working, tested code',
              '**Polymorphism** — one overridden method per type',
            ],
          ],
        },
        {
          t: 'code',
          caption: 'The classic smell',
          code: `public double Area(Shape s)
{
    if (s.Kind == "circle")    return 3.14159 * s.R * s.R;
    else if (s.Kind == "rect") return s.W * s.H;
    else if (s.Kind == "tri")  return 0.5 * s.W * s.H;
    return 0;
}`,
        },
        {
          t: 'text',
          md: 'A string type tag plus a branch per type is **polymorphism done by hand**. Give `Shape` an abstract `Area()` and let each subclass override it: adding a shape becomes adding a class, and this method disappears entirely.',
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'Class size — both ends fail',
          md: 'A too **small** class is too problem-specific and cannot be reused. A too **large** class is too generic and does not reduce complexity — the **God class**.\n\nThe practical test is not a line count. It is **cohesion**: can the class still say "I know everything about one specific topic"? If describing it needs an "and", that is where it splits.',
        },
      ],
    },
    {
      id: 'n8-composite',
      title: 'The composite shape',
      concepts: ['composite-idea'],
      blocks: [
        {
          t: 'text',
          md: 'A **container that is itself one of the things it contains**. In Swin Adventure, a `Bag` *is an* `Item` that also holds an `Inventory` of `Item`s — so a bag can go inside a bag.',
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'What it buys you: a client can treat **one object and a whole tree of objects identically**. `Locate("sword")` is written once and works whether the holder is a player, a bag, or a bag inside a bag inside a bag.',
        },
        {
          t: 'code',
          caption: 'Why this fails to find an item in a nested bag',
          code: `public GameObject Locate(string id)
{
    if (AreYou(id)) return this;

    foreach (Item i in _items)
        if (i.AreYou(id)) return i;

    return null;
}`,
        },
        {
          t: 'callout',
          tone: 'trap',
          md: 'The search is **one level deep**. A bag in the list is asked "are you the sword?" — it says no, correctly — when it should be asked `Locate(id)` so it can search its **own** contents.\n\nThe fix is recursion. This is the deliberately-failing test in Lecture 8, and the exercise it leaves you.',
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'This is the **Composite pattern**, and Week 10 names it as such — alongside `Location` nested in `Location`, a folder containing folders, and a UI `Panel` containing `Panel`s.',
        },
      ],
    },
  ],
};
