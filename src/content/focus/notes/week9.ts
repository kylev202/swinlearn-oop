/**
 * Week 9 revision notes — GRASP.
 *
 * The distinction this week has to establish, because the exam probes it:
 * **GRASP is not the Gang-of-Four design patterns.** GRASP answers "which
 * class should own this responsibility?" and its nine entries are principles.
 * Week 10's patterns are named solutions with a structure you can draw. They
 * share vocabulary — Polymorphism appears in both — which is precisely why
 * "which of these is NOT a GRASP principle?" is an easy question to get wrong.
 *
 * The released mockup's Q9 names **Protected Variations** outright, so that
 * principle gets the most space here.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK9: WeekNotes = {
  week: 9,
  title: 'GRASP',
  gist: 'Nine guidelines for one question: given a responsibility, which class should own it?',
  sources: ['Lecture 9', 'Quiz 9', 'Final mockup Q9'],
  sections: [
    {
      id: 'n9-what',
      title: 'What GRASP is, and is not',
      concepts: ['grasp-what'],
      blocks: [
        {
          t: 'callout',
          tone: 'key',
          md: '**G**eneral **R**esponsibility **A**ssignment **S**oftware **P**atterns.\n\nThe key words are **responsibility assignment**. Knowing C# syntax lets you write code that runs; it says nothing about *where* a piece of functionality should live. That gap is what GRASP fills.',
        },
        {
          t: 'compare',
          left: {
            title: 'GRASP (Week 9)',
            tone: 'neutral',
            md: 'Nine **principles**.\n\nAnswer: *which class should own this responsibility?*\n\nInformation Expert, Creator, Controller, Low Coupling, High Cohesion, Polymorphism, Pure Fabrication, Indirection, Protected Variations.',
          },
          right: {
            title: 'Design patterns (Week 10)',
            tone: 'neutral',
            md: 'Named **solutions** with a drawable structure.\n\nAnswer: *what is the known shape of solution to this problem?*\n\nSingleton, Factory, Adapter, Composite, Strategy, Observer, Command…',
          },
        },
        {
          t: 'callout',
          tone: 'trap',
          md: '**Singleton is not a GRASP principle.** It is a creational design pattern from Week 10. Expect at least one question that offers it in a list of GRASP principles.',
        },
        {
          t: 'callout',
          tone: 'note',
          title: 'The honest caveats',
          md: 'Named in the lecture as the challenges of applying GRASP: it needs a deep grasp of OOP first, reasonable designers **disagree**, low coupling and high cohesion **trade off**, the right answer is **context sensitive**, and extra classes from Pure Fabrication or Indirection cost maintenance.\n\nThe take-away is explicit: these are **guidelines that can be broken**, not laws.',
        },
      ],
    },
    {
      id: 'n9-assignment',
      title: 'Creator, Controller, Polymorphism',
      concepts: ['grasp-creator', 'grasp-controller', 'grasp-polymorphism'],
      blocks: [
        {
          t: 'text',
          md: '### Creator\n\n**A creates B** if one or more holds:\n\n- A **contains or aggregates** B\n- A **records** B\n- A **closely uses** B\n- A has B’s **initialising data**\n\nThe chain from the lecture: `BlackjackGame` creates the `Deck`, the `Deck` creates the `Cards`, a `DrawingProgram` creates its `Shapes`. Each creator genuinely aggregates what it creates.',
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'Creator is about which **existing domain class** is the natural owner of instantiation. The **Factory pattern** (Week 10) is about hiding instantiation behind an interface. Different questions, and both can be right in one design.',
        },
        {
          t: 'text',
          md: '### Controller\n\nA **system or UI event** is handled by a class representing the system, a use case or a session — not by a model or data class.\n\nIt comes straight from **MVC**. The explicit caution: letting a database or model class handle raw user input is bad practice. A `Customer` class that reads from the console cannot be reused behind a web form or a test harness.',
        },
        {
          t: 'text',
          md: '### Polymorphism\n\nWhen **behaviour varies by type**, assign it with polymorphic operations on the types themselves — not an `if`/`switch` that tests the type and branches.',
        },
        {
          t: 'code',
          caption: 'The caller does no type checking at all',
          code: `foreach (Shape s in shapes)
{
    s.Draw();   // each shape knows how to draw itself
}`,
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'The payoff is in what this loop **does not** do. Adding a `Triangle` means writing one class — this loop never changes.\n\nSame mechanism as `FetchContainer` returning `IHaveInventory`: because `Player` and `Bag` both implement it, one method covers either, and `Location` drops in next week for free.',
        },
      ],
    },
    {
      id: 'n9-variation',
      title: 'Protected Variations, Pure Fabrication, Indirection',
      concepts: ['pure-fabrication', 'protected-variations', 'indirection', 'open-closed'],
      blocks: [
        {
          t: 'callout',
          tone: 'key',
          title: 'Protected Variations — the mockup names this one',
          md: 'Wrap the part of the design **likeliest to change** behind a **stable interface**, so the rest of the system depends on the abstraction and is shielded when the variation changes.',
        },
        {
          t: 'code',
          caption: 'The shape the exam shows you',
          code: `class PaymentProcessor
{
    public void ProcessPayment(string paymentType, double amount)
    {
        if (paymentType == "CreditCard")  { /* ... */ }
        else if (paymentType == "PayPal") { /* ... */ }
        else                              { /* ... */ }
    }
}`,
        },
        {
          t: 'text',
          md: '**The answer:** use an **interface** for the different payment methods and apply **polymorphism**. An `IPaymentMethod` with one class per method means adding a payment type is a new class, leaving `PaymentProcessor` untouched.\n\nThe wrong answers are all cosmetic: adding more `else if` cases, making it static, or converting to a `switch`. A switch is the same design written more neatly — the **structure** is what has to change.',
        },
        {
          t: 'callout',
          tone: 'trap',
          md: 'An `if` chain branching on a **type string** is the signature of a missing interface. Quiz 9 asks this twice — once about payments, once about `NotificationService` with Email and SMS — because it is the same question both times.',
        },
        {
          t: 'callout',
          tone: 'note',
          title: 'Open/Closed',
          md: 'The principle underneath: code should be **open to extension, closed to modification**. The mark of a violation is that you cannot add a feature without reopening tested code. Every `else if` added to a working method is a small one.',
        },
        {
          t: 'table',
          headers: ['Principle', 'The question it answers', 'Example'],
          rows: [
            [
              '**Pure Fabrication**',
              'Where does a responsibility go when **no domain class** should own it?',
              '`Deck`, `Card` and `Player` all refuse to save themselves — invent a `Persistence` class',
            ],
            [
              '**Indirection**',
              'How do I stop A depending directly on B?',
              'A mediator that checks the save succeeded before the game terminates',
            ],
            [
              '**Protected Variations**',
              'What is **most likely to change**, and what will it break?',
              '`IPaymentMethod` in front of the payment types',
            ],
          ],
        },
        {
          t: 'callout',
          tone: 'warn',
          md: 'Both Pure Fabrication and Indirection **add classes**, and the lecture lists that maintenance overhead among GRASP’s challenges. You fabricate when a responsibility genuinely has no home — not by reflex.',
        },
      ],
    },
  ],
};
