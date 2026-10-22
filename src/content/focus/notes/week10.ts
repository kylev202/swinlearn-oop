/**
 * Week 10 revision notes — design patterns.
 *
 * The heaviest week on the final. Four of the released mockup's twelve
 * questions are pure Week 10: Q5 (Singleton for a Logger), Q6 (Factory by
 * definition), Q8 (the odd one out of the three categories) and Q12 (name the
 * pattern from an `EngineFactory` listing). Quiz 10 Q1 *is* mockup Q5.
 *
 * Lecture 10's live self-correction is preserved here: the deck first
 * labelled **Singleton as Structural** and the lecturer fixed it on camera to
 * **Creational**. The corrected answer is what these notes teach, and the
 * slip is flagged because a student revising from the raw slides will meet it.
 *
 * Lecture 11's **elimination strategy** is included at the end — it is the
 * single most useful exam technique in the unit for this topic.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK10: WeekNotes = {
  week: 10,
  title: 'Design patterns',
  gist: 'Named, reusable solutions to recurring design problems — and how to tell them apart under time pressure.',
  sources: ['Lecture 10', 'Quiz 10', 'Final mockup Q5, Q6, Q8, Q12'],
  sections: [
    {
      id: 'n10-what',
      title: 'What they are, and the three categories',
      concepts: ['pattern-what', 'pattern-categories'],
      blocks: [
        {
          t: 'text',
          md: 'A design pattern is a **general, reusable, named solution to a recurring class of design problem** — an optimised template, not a block of code you paste in. Naming one is shorthand for a whole shape of solution when describing a design to another developer.',
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'Solutions based on design patterns are **reusable, extensible and maintainable**. Those three words are a fill-in-the-blanks question.',
        },
        {
          t: 'table',
          headers: ['Category', 'Captures ways to…', 'Members covered'],
          rows: [
            ['**Creational**', '**create** objects', 'Singleton, Factory *(also Builder, Prototype)*'],
            ['**Structural**', '**assemble** objects', 'Adapter, Composite *(also Bridge, Proxy, Decorator, Façade)*'],
            ['**Behavioural**', '**communicate** between objects', 'Strategy, Observer, Command *(also State, Visitor)*'],
          ],
        },
        {
          t: 'callout',
          tone: 'trap',
          title: 'There are exactly three',
          md: 'Mockup Q8 asks which is **not** a category and offers "**Data Access patterns**" — plausible-sounding, names a real architectural idea, and is not one of the three.\n\nStructural, Creational, Behavioural. Nothing else.',
        },
        {
          t: 'callout',
          tone: 'warn',
          title: 'A slip in the slides',
          md: 'The W10a deck first labelled **Singleton as Structural**, and the lecturer corrected it live: *"the Singleton design pattern needs to belong to the Creational."*\n\nIt controls how an object is created, so **Creational** is the answer. If you revise from the raw slides you will meet the wrong label.',
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'There are **120+** named patterns in circulation. Memorising them all is explicitly not the goal — a high-level understanding of the covered ones, enough to recognise a situation and research the rest, is.',
        },
      ],
    },
    {
      id: 'n10-creational',
      title: 'Singleton and Factory',
      concepts: ['singleton', 'factory'],
      blocks: [
        {
          t: 'text',
          md: '### Singleton\n\n**One instance for the whole application**, with a global access point.',
        },
        {
          t: 'code',
          caption: 'The three moving parts',
          code: `public class SingletonClass
{
    private static SingletonClass instance;   // static: shared, exists before any instance

    private SingletonClass() { }              // private: nobody else can call new

    public static SingletonClass GetInstance()
    {
        if (instance == null)
            instance = new SingletonClass();  // created once, on first ask

        return instance;
    }
}`,
        },
        {
          t: 'table',
          headers: ['Part', 'Why it must be that way'],
          rows: [
            [
              '**Private** constructor',
              'Without it the guarantee is only a suggestion — anyone could call `new` and make a second instance',
            ],
            [
              '**Static** field',
              'Must be shared across all callers, and must exist before any instance does',
            ],
            [
              '**Static** `GetInstance`',
              'It is what *gives* you the object, so it cannot require one — a chicken-and-egg problem',
            ],
          ],
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'The motivating example: a bank account accessed by several cardholders needs **one** connection to its transaction state, so two withdrawals cannot both act on the same balance — "double spending". A `Logger` writing to one file is the other standard case, and it is mockup Q5.',
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'Factory — the exam wording',
          md: '"Defines an **interface for object creation** and lets a **subclass decide which class to instantiate**." That sentence is mockup Q6 and Quiz 10 Q8.',
        },
        {
          t: 'text',
          md: 'The client asks for "a vehicle" or "an engine" and the factory decides which concrete class to build and return. The client depends on the shared interface only — never on `Car`, `Bike` or `DieselEngine`.\n\nThe **tell** in a code listing: a method that takes an input and returns an **interface type**, choosing the concrete class internally with a `switch` or lookup.',
        },
        {
          t: 'callout',
          tone: 'tip',
          md: 'The slides’ own improvement on a long `if`/`else` chain inside a factory: register the concrete classes in a **`Dictionary`** keyed by ID and look them up at runtime. A new product becomes a new registration rather than an edit.',
        },
      ],
    },
    {
      id: 'n10-structural',
      title: 'Adapter and Composite',
      concepts: ['adapter', 'composite-pattern'],
      blocks: [
        {
          t: 'text',
          md: '### Adapter\n\nYou want a class’s **functionality** but it exposes the **wrong interface**. The adapter bridges the two **without modifying either side**.',
        },
        {
          t: 'table',
          headers: ['Part', 'Is'],
          rows: [
            ['**Target**', 'The interface your client code already expects'],
            ['**Adaptee**', 'The existing class you cannot or do not want to change — the legacy system'],
            ['**Adapter**', 'Implements Target; internally calls `adaptee.specificRequest()`'],
          ],
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'The travel-plug analogy is precise: the *functionality* — power — is unchanged, and neither the wall nor the device is modified. Only the **shape of the connection** is translated. (A transformer, which changes the voltage, would be the wrong analogy.)',
        },
        {
          t: 'text',
          md: '### Composite\n\nCompose objects into a **part-whole tree** so individual objects and compositions are treated **uniformly** through one shared component interface.\n\nThe lecture’s reason for reaching for it: you want the benefits of **polymorphism without the rigidity of a deep inheritance hierarchy**.',
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'The test for a composite: **can a container contain another of itself?**\n\n`Bag` in a `Bag`. `Location` in a `Location`. A folder in a folder. A `Panel` of buttons and other `Panel`s.',
        },
      ],
    },
    {
      id: 'n10-behavioural',
      title: 'Strategy, Observer, Command',
      concepts: ['strategy', 'observer', 'command-pattern'],
      blocks: [
        {
          t: 'table',
          headers: ['Pattern', 'Encapsulates', 'One-line test'],
          rows: [
            [
              '**Strategy**',
              'Interchangeable **algorithms**, swapped at runtime',
              'Does the *way* something is done need to change while running?',
            ],
            [
              '**Observer**',
              'A subject **notifying many** dependents of a state change',
              'Does something need to react when something else changes?',
            ],
            [
              '**Command**',
              'A **request** as an object, with a shared `Execute`',
              'Is an action being packaged up to be run later?',
            ],
          ],
        },
        {
          t: 'text',
          md: '### Strategy\n\nA `Robot` holds a `strategy : IBehaviour`, and `AggressiveBehaviour`, `DefensiveBehaviour` and `NormalBehaviour` all implement it. Changing behaviour means **pointing one field at a different object** — `Robot` itself never changes, and nothing is subclassed or rebuilt.',
        },
        {
          t: 'callout',
          tone: 'trap',
          md: '**Observer vs Command** is a listed trap. Observer broadcasts that something **changed**, to many listeners. Command packages up something to **do**. Both are Behavioural.',
        },
        {
          t: 'text',
          md: '### Command — the one you built\n\n`LookCommand` and `MoveCommand` both inherit one `abstract class Command` with `public abstract string Execute(Player, List<string>)`.\n\nIt is `abstract` so that it **cannot be instantiated directly** — a bare `Command` would have no behaviour to run — and so that "every command must supply its own `Execute`" is a rule the compiler enforces.',
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'The payoff: the loop that reads input and calls `Execute` is written **once** against `Command`, and `MoveCommand` drops in without that loop changing. Open to extension, closed to modification.',
        },
      ],
    },
    {
      id: 'n10-strategy-exam',
      title: 'Composition over inheritance, and how to answer under the clock',
      concepts: ['composition-over-inheritance'],
      blocks: [
        {
          t: 'text',
          md: 'Looking back across every pattern: **design patterns promote composition over inheritance**. Composite *has* children, Adapter *has* an adaptee, Strategy’s context *has* a strategy, Factory *returns* an interface type.\n\nHas-a through interfaces, rather than deep rigid is-a chains — which echoes GRASP’s **Polymorphism** and **Low Coupling** directly, and Week 8’s warning about deep hierarchies.',
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'The elimination strategy — use this in the exam',
          md: 'Lecture 11’s own advice when a design-pattern question is not immediately obvious. Rule out by **mechanism**:\n\n- **Not Adapter** — nothing legacy or mismatched is being wrapped\n- **Not Builder** — no multi-step, sequential construction\n- **Not Singleton** — nothing restricts the count to one\n- **Not Observer** — nothing is being notified of a change\n\nWhatever is left is usually **Factory**, whenever the scenario is about *selecting which concrete class to instantiate*.',
        },
        {
          t: 'table',
          headers: ['If the question says…', 'It is'],
          rows: [
            ['"only one instance", "global point of coordination"', 'Singleton'],
            ['"based on user input", "decides which class to instantiate"', 'Factory'],
            ['"third-party API", "interface doesn’t match", "without modifying"', 'Adapter'],
            ['"can contain other objects of the same kind", "treated uniformly"', 'Composite'],
            ['"swap at runtime", "different approaches/algorithms"', 'Strategy'],
            ['"notify", "watches for a change in state"', 'Observer'],
            ['"encapsulate a request", "shared Execute"', 'Command'],
          ],
        },
        {
          t: 'callout',
          tone: 'warn',
          md: 'The closing caution: choose the pattern that **best fits** and adapt it; do not let implementing it distract from solving the actual problem. *"If you decide to use design patterns but the code doesn’t work, it still takes more cost to review the implementation."*',
        },
      ],
    },
  ],
};
