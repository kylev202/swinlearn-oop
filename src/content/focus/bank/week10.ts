/**
 * Week 10 question bank — design patterns.
 *
 * Sourced from Quiz 10 (10 questions, all of them) and `Lecture 10.md`.
 *
 * This is the single heaviest week on the final. Four of the released
 * mockup's twelve questions are pure Week 10 — Q5 (Singleton for a Logger),
 * Q6 (Factory by definition), Q8 (the odd one out of the three categories)
 * and Q12 (identify the pattern from an `EngineFactory` listing). Quiz 10's
 * own Q1 *is* mockup Q5, word for word.
 *
 * Two deliberate inclusions beyond Lecture 10's deck:
 *
 *   **Observer** is not in the W10a slides but is Quiz 10 Q2, and appears as
 *   a distractor in mockup Q5. **Prototype** and **Builder** likewise appear
 *   only as distractors — in mockup Q5 and in the elimination strategy
 *   Lecture 11 teaches — so each is covered just well enough to be ruled out,
 *   which is all the exam asks of them.
 *
 * Lecture 10's live self-correction matters here too: the slide deck first
 * labelled **Singleton as Structural**, and the lecturer corrected it on
 * camera to **Creational**. The corrected answer is the one used throughout.
 */

import type { FocusQuestion } from '../types';

export const WEEK10: FocusQuestion[] = [
  // ------------------------------------------------- what a pattern is
  {
    id: 'w10-pattern-definition',
    conceptId: 'pattern-what',
    question: 'What is a design pattern?',
    options: [
      'A general, reusable, named solution to a recurring class of design problem',
      'A finished block of code you paste into a project',
      'A diagram standard for documenting classes',
      'A rule the compiler enforces about class structure',
    ],
    answer: 0,
    why: [
      '',
      'A pattern is a shape of solution, not an implementation. The same pattern looks different in each language and project.',
      'That is UML.',
      'Nothing enforces patterns. They are conventions among developers.',
    ],
    explain:
      'An optimised, reusable template for a *class* of problems, not a one-off fix. Naming one is shorthand for a whole shape of solution when describing a design to another developer.',
    source: 'Lecture 10 §5; Quiz 10 cheat sheet',
  },
  {
    id: 'w10-pattern-qualities',
    conceptId: 'pattern-what',
    question:
      'Fill in the blanks: solutions based on design patterns are ___, ___ and ___.',
    options: [
      'Reusable, extensible, maintainable',
      'Faster, smaller, simpler',
      'Compiled, tested, documented',
      'Private, protected, public',
    ],
    answer: 0,
    why: [
      '',
      'Patterns usually add classes rather than removing them, and make no speed claim.',
      'Properties of any good code, not of patterns specifically.',
      'Access modifiers, unrelated.',
    ],
    explain:
      'These three are the whole justification for using a named pattern over an ad-hoc solution — reusable across similar problems, extensible without reworking, and maintainable because its shape is already recognised.',
    source: 'Quiz 10 Q3',
  },
  {
    id: 'w10-patterns-abstraction',
    conceptId: 'pattern-what',
    question:
      'True or false: design patterns make it harder to identify abstractions and reuse proven design solutions.',
    options: ['False', 'True'],
    answer: 0,
    why: ['', 'The reverse of their purpose.'],
    explain:
      'They exist to make abstractions *easier* to spot — a shared vocabulary that lets you recognise "this is a Factory situation" instead of reinventing a solution each time.',
    source: 'Quiz 10 Q9',
  },
  {
    id: 'w10-pattern-caution',
    conceptId: 'pattern-what',
    question: 'What caution does Lecture 10 give about using design patterns?',
    options: [
      'Do not let implementing the pattern distract from solving the actual problem, and make sure the code still works and is tested',
      'Use at least five patterns in every project',
      'Never adapt a pattern — implement it exactly as published',
      'Choose patterns before understanding the requirements',
    ],
    answer: 0,
    why: [
      '',
      'The custom-program brief asks for up to five; that is an assessment requirement, not a design rule.',
      'The take-away says the opposite: choose the one that best fits and **adapt it if needed**.',
      'You cannot know which pattern fits a problem you have not understood.',
    ],
    explain:
      'The lecturer’s closing warning: "if you decide to use design patterns but the code doesn’t work, it still takes more cost to review the implementation." A pattern is not a substitute for working, tested code.',
    source: 'Lecture 10 §11',
  },

  // ------------------------------------------------------- the categories
  {
    id: 'w10-three-categories',
    conceptId: 'pattern-categories',
    question:
      'Fill in: (1) ___ patterns capture ways to create objects. (2) ___ patterns capture ways to assemble objects. (3) ___ patterns capture ways to perform tasks via communication between objects.',
    options: [
      'Creational, Structural, Behavioural',
      'Structural, Creational, Behavioural',
      'Behavioural, Structural, Creational',
      'Creational, Behavioural, Structural',
    ],
    answer: 0,
    why: [
      '',
      'The first two are swapped — creation comes with Creational.',
      'Reversed throughout.',
      'The last two are swapped: assembling is Structural, communicating is Behavioural.',
    ],
    explain:
      'Create / assemble / communicate, in that order. Three categories and no others.',
    source: 'Quiz 10 Q7',
  },
  {
    id: 'w10-not-a-category',
    conceptId: 'pattern-categories',
    question: 'Which of the following is NOT a correct type of design pattern?',
    options: ['Data Access patterns', 'Structural patterns', 'Creational patterns', 'Behavioural patterns'],
    answer: 0,
    why: [
      '',
      'One of the three — assembling objects into larger structures.',
      'One of the three — object creation mechanisms.',
      'One of the three — communication between objects.',
    ],
    explain:
      'There are exactly three classifications. "Data Access" sounds plausible and names a real architectural idea, which is why it is the distractor — but it is not one of the three.',
    source: 'Quiz 10 Q7 — and mockup paper Q8',
  },
  {
    id: 'w10-categorise',
    conceptId: 'pattern-categories',
    question: 'Which list correctly groups these patterns by category?',
    options: [
      'Creational: Singleton, Factory · Structural: Adapter, Composite · Behavioural: Strategy, Observer, Command',
      'Creational: Adapter, Composite · Structural: Singleton, Factory · Behavioural: Strategy, Observer',
      'Creational: Singleton, Adapter · Structural: Factory, Composite · Behavioural: Strategy, Command',
      'Creational: Factory, Strategy · Structural: Composite, Observer · Behavioural: Singleton, Adapter',
    ],
    answer: 0,
    why: [
      '',
      'Creational and Structural are swapped wholesale.',
      'Adapter is Structural, not Creational; Factory is Creational, not Structural.',
      'Strategy and Observer are Behavioural; Singleton is Creational; Adapter is Structural.',
    ],
    explain:
      'Worth memorising as one block, because the exam asks it from several directions. The test for each: does it make an object, connect objects, or coordinate what objects say to each other?',
    source: 'Lecture 10 §6, §13',
    stretch: true,
  },
  {
    id: 'w10-singleton-category',
    conceptId: 'pattern-categories',
    question: 'Which category does Singleton belong to?',
    options: ['Creational', 'Structural', 'Behavioural', 'It belongs to no category'],
    answer: 0,
    why: [
      '',
      'What the slide first said — and what the lecturer corrected live on camera.',
      'It governs creation, not communication.',
      'Every named pattern falls in one of the three.',
    ],
    explain:
      'It controls how (and how often) an object is created, which is Creational. Lecture 10’s deck labelled it Structural by mistake and the lecturer fixed it in the session: "the Singleton design pattern needs to belong to the Creational."',
    source: 'Lecture 10 §6, the live self-correction',
  },
  {
    id: 'w10-how-many-patterns',
    conceptId: 'pattern-categories',
    question: 'Roughly how many named design patterns are in circulation, and what is expected of you?',
    options: [
      'Over 120 — you are expected to understand the covered ones well enough to recognise when to apply or research one',
      'Exactly 23 — and all of them are examinable',
      'Three, one per category',
      'Over 120, and you are expected to memorise all of them',
    ],
    answer: 0,
    why: [
      '',
      '23 is the Gang-of-Four book’s count, but the lecture gives 120+ in circulation and does not examine all of them.',
      'Three is the number of *categories*, not patterns.',
      'The lecture is explicit that memorising all of them is not the goal.',
    ],
    explain:
      'The expectation is a high-level understanding of what each covered pattern is for, so you can recognise a situation and go and research the right one.',
    source: 'Lecture 10 §6',
  },

  // -------------------------------------------------------------- singleton
  {
    id: 'w10-singleton-logger',
    conceptId: 'singleton',
    question:
      'You need to ensure only one instance of a `Logger` class exists throughout the application. Which pattern fits?',
    options: ['Singleton', 'Factory', 'Observer', 'Prototype'],
    answer: 0,
    why: [
      '',
      'Factory creates objects without exposing the logic — and allows *many* instances.',
      'Observer is a subscription mechanism for notifying dependents, unrelated to instance count.',
      'Prototype clones an existing instance rather than guaranteeing a single one.',
    ],
    explain:
      'One instance for the whole application lifecycle, with a global access point. Logging is the standard example: scattered components writing to one log file need one coordination point to avoid file-lock conflicts.',
    source: 'Quiz 10 Q1 — and mockup paper Q5, word for word',
  },
  {
    id: 'w10-singleton-mechanism',
    conceptId: 'singleton',
    code: `public class SingletonClass
{
    private static SingletonClass instance;

    private SingletonClass() { }

    public static SingletonClass GetInstance()
    {
        if (instance == null)
            instance = new SingletonClass();

        return instance;
    }
}`,
    question: 'What makes the constructor `private` essential here?',
    options: [
      'It stops any other code calling `new SingletonClass()`, so `GetInstance` is the only way to obtain one',
      'It makes the class thread-safe',
      'It allows the class to be static',
      'It prevents the class from being inherited',
    ],
    answer: 0,
    why: [
      '',
      'This implementation is *not* thread-safe — two threads can both pass the null check. Private access does nothing about that.',
      'The class is an ordinary class; only its members are static.',
      'A side effect (no accessible constructor to chain to), but not the purpose.',
    ],
    explain:
      'Without a private constructor the guarantee is just a suggestion — anyone could create a second instance. The private constructor is what makes it enforceable.',
    source: 'Lecture 10 §7.1',
  },
  {
    id: 'w10-singleton-static',
    conceptId: 'singleton',
    question: 'Why must the instance field and `GetInstance` both be `static` in a Singleton?',
    options: [
      'There is no instance to call them on until one exists, and the field must be shared across all callers',
      'Static members run faster',
      'C# requires any private constructor to be paired with static members',
      'So the instance is destroyed when the program exits',
    ],
    answer: 0,
    why: [
      '',
      'Performance has nothing to do with it.',
      'No such rule exists.',
      'Cleanup at exit happens regardless and is not why.',
    ],
    explain:
      'A chicken-and-egg problem: `GetInstance` is what gives you the object, so it cannot require one. Static means "belongs to the class", which is the only thing available before the first instance exists.',
    source: 'Lecture 10 §7.1',
  },
  {
    id: 'w10-singleton-bank',
    conceptId: 'singleton',
    question:
      'The lecture motivates Singleton with a bank account accessed by several cardholders. What problem does it prevent?',
    options: [
      'Two withdrawals acting on the same balance at once, letting more be taken than the account holds',
      'A cardholder forgetting their PIN',
      'The account being created twice in the database',
      'Transactions being processed out of order',
    ],
    answer: 0,
    why: [
      '',
      'Nothing to do with authentication.',
      'Closer, but the example is about *access* to live transaction state, not duplicate records.',
      'Ordering is a separate concern; the issue is simultaneous access.',
    ],
    explain:
      'One connection to the account’s transaction state means one transaction executing at a time, whichever card acts. The lecture calls the failure "double spending".',
    source: 'Lecture 10 §5, §7.1',
  },

  // ---------------------------------------------------------------- factory
  {
    id: 'w10-factory-definition',
    conceptId: 'factory',
    question:
      'Which design pattern defines an interface for object creation and lets a subclass decide which class to instantiate?',
    options: [
      'Factory design pattern',
      'Adapter design pattern',
      'Command design pattern',
      'Singleton design pattern',
    ],
    answer: 0,
    why: [
      '',
      'Adapter wraps an existing incompatible interface. It creates nothing.',
      'Command encapsulates a request as an object, with an `Execute` contract.',
      'Singleton restricts a class to one instance; it does not choose between classes.',
    ],
    explain:
      'The wording is the definition of Factory Method — the creation interface is defined once and the "which concrete class?" decision is deferred to a subclass or to logic inside the factory.',
    source: 'Quiz 10 Q8 — and mockup paper Q6, word for word',
  },
  {
    id: 'w10-factory-vehicle',
    conceptId: 'factory',
    question:
      'A vehicle rental system must return a `Car`, `Bike` or `Truck` based on user input, without the client creating objects directly. Which pattern?',
    options: ['Factory', 'Singleton', 'Composite', 'Observer'],
    answer: 0,
    why: [
      '',
      'Nothing here is restricted to one instance.',
      'No part-whole tree is involved.',
      'Nothing is being notified of a state change.',
    ],
    explain:
      'The client asks for "a vehicle" and the factory decides which concrete class to build and return. The client depends on the shared type only, never on `Car`, `Bike` or `Truck`.',
    source: 'Quiz 10 Q5',
  },
  {
    id: 'w10-factory-identify',
    conceptId: 'factory',
    code: `public interface ICarEngine {
    void StartEngine();
}

public class DieselEngine : ICarEngine { /* ... */ }
public class PetrolEngine : ICarEngine { /* ... */ }

public class EngineFactory {
    public static ICarEngine IgniteEngine(string carEngine) {
        switch (carEngine.ToLower())
        {
            case "petrol": return new PetrolEngine();
            case "diesel": return new DieselEngine();
            default: throw new ArgumentException("Unknown engine type");
        }
    }
}`,
    question: 'Which design pattern does this implement?',
    options: [
      'Factory — it centralises object creation based on input',
      'Adapter — it adapts to a legacy design',
      'Builder — it separates construction from representation',
      'Singleton — it guarantees only one instance of a class',
    ],
    answer: 0,
    why: [
      '',
      'Nothing legacy is being wrapped; both engine classes are new and already fit `ICarEngine`.',
      'Builder assembles an object over a *sequence* of steps. Here each engine is created in one call.',
      'Nothing restricts the number of instances; every call makes a new engine.',
    ],
    explain:
      'The tell is a method that takes an input and returns an interface type, choosing the concrete class internally. Lecture 11’s elimination strategy: not Adapter (nothing legacy), not Builder (no multi-step construction), not Singleton (no instance limit) — so Factory.',
    source: 'Mockup paper Q12; Lecture 11 §3 row 12',
  },
  {
    id: 'w10-factory-dictionary',
    conceptId: 'factory',
    question:
      'The slides suggest improving a factory’s long if/else chain how?',
    options: [
      'Register the concrete product classes in a `Dictionary` keyed by product ID and look them up at runtime',
      'Replace the if/else with nested if statements for clarity',
      'Move the chain into the client so the factory stays small',
      'Create a separate factory class for each product',
    ],
    answer: 0,
    why: [
      '',
      'Nesting makes the same structure harder to read.',
      'Moving the branching to the client defeats the entire purpose of the factory.',
      'One factory per product leaves nothing to choose between.',
    ],
    explain:
      'A lookup table is extensible without editing the method — a new product is a new registration. The same open/closed instinct as Week 9, applied inside a pattern.',
    source: 'Lecture 10 §8.1',
    stretch: true,
  },

  // ---------------------------------------------------------------- adapter
  {
    id: 'w10-adapter-thirdparty',
    conceptId: 'adapter',
    question:
      'You are integrating a third-party API whose interface does not match your code. Rather than modify your codebase, you write an intermediary that translates between them. Which pattern?',
    options: ['Adapter', 'Factory', 'Composite', 'Strategy'],
    answer: 0,
    why: [
      '',
      'Factory is about choosing which object to create, not about translating a mismatched interface.',
      'Composite builds part-whole trees.',
      'Strategy swaps interchangeable algorithms; both sides already agree on the interface.',
    ],
    explain:
      'Adapter lets objects with incompatible interfaces collaborate, wrapping one so it satisfies the interface the other expects — and leaving both sides unmodified.',
    source: 'Quiz 10 Q10',
  },
  {
    id: 'w10-adapter-parts',
    conceptId: 'adapter',
    question: 'In the Adapter pattern, what is the Adaptee?',
    options: [
      'The existing class you cannot or do not want to change',
      'The interface your client code expects',
      'The wrapper that translates between the two',
      'The client making the call',
    ],
    answer: 0,
    why: [
      '',
      'That is the **Target**.',
      'That is the **Adapter** itself.',
      'The client is whoever calls the Target.',
    ],
    explain:
      'Three parts: Target (the interface expected), Adaptee (the class you have), Adapter (implements Target, calls `adaptee.specificRequest()` internally). The legacy system you are not allowed to rewrite is the Adaptee.',
    source: 'Lecture 10 §7.2',
  },
  {
    id: 'w10-adapter-analogy',
    conceptId: 'adapter',
    question: 'Why is a travel plug adapter a good analogy for the pattern?',
    options: [
      'The functionality — power — is unchanged; only the interface, the plug shape, is bridged',
      'Because it converts the voltage to something safe',
      'Because it lets several devices share one socket',
      'Because it is only needed once per trip',
    ],
    answer: 0,
    why: [
      '',
      'That is a transformer, which genuinely changes what flows through. An adapter changes nothing but shape.',
      'That is a power strip — closer to a composite.',
      'Frequency is not the point.',
    ],
    explain:
      'The analogy is precise: neither the wall nor the device is modified, and nothing about the electricity changes. Only the shape of the connection is translated.',
    source: 'Lecture 10 §7.2',
  },

  // -------------------------------------------------------------- composite
  {
    id: 'w10-composite-panel',
    conceptId: 'composite-pattern',
    question:
      'A `Panel` can contain buttons, text fields, or other `Panel` objects, and all should be treated uniformly. Which pattern?',
    options: ['Composite', 'Prototype', 'Singleton', 'Observer'],
    answer: 0,
    why: [
      '',
      'Prototype creates duplicates from an existing instance.',
      'Singleton restricts a class to one instance.',
      'Observer notifies dependents of state changes.',
    ],
    explain:
      'Composite composes objects into part-whole trees so clients treat individual objects and compositions identically, through one shared component interface.',
    source: 'Quiz 10 Q4',
  },
  {
    id: 'w10-composite-why',
    conceptId: 'composite-pattern',
    question: 'What does Lecture 10 give as the reason to reach for Composite?',
    options: [
      'You want the benefits of polymorphism without the rigidity of a deep inheritance hierarchy',
      'You want to guarantee only one instance exists',
      'You want to swap algorithms at runtime',
      'You want to hide the creation of objects from the client',
    ],
    answer: 0,
    why: [
      '',
      'Singleton.',
      'Strategy.',
      'Factory.',
    ],
    explain:
      'Shallow inheritance and flexible extension: a Leaf and a Composite share one abstract Component, and the tree can be any depth without the hierarchy growing a level per case.',
    source: 'Lecture 10 §7.3',
  },
  {
    id: 'w10-composite-examples',
    conceptId: 'composite-pattern',
    question: 'Which of these is NOT an example of the Composite pattern?',
    options: [
      'A `Logger` that every class writes to through one shared instance',
      'A folder containing files and other folders',
      'A `Bag` containing items, including other bags',
      'A `Location` containing other locations',
    ],
    answer: 0,
    why: [
      '',
      'The canonical file-system composite.',
      'Swin Adventure’s own composite, built in Week 8.',
      'Added in Lecture 10 §3.5 — Swinburne containing several buildings.',
    ],
    explain:
      'A shared single instance is Singleton. The composite test is whether a container can contain another of itself — a folder in a folder, a bag in a bag, a location in a location.',
    source: 'Quiz 10 Q4; Lecture 10 §7.3',
  },

  // --------------------------------------------------------------- strategy
  {
    id: 'w10-strategy-what',
    conceptId: 'strategy',
    question: 'When do you use the Strategy pattern?',
    options: [
      'To encapsulate interchangeable algorithms behind one interface and swap between them at runtime',
      'To ensure a class has exactly one instance',
      'To build part-whole trees of objects',
      'To wrap a class whose interface does not match',
    ],
    answer: 0,
    why: [
      '',
      'Singleton.',
      'Composite.',
      'Adapter.',
    ],
    explain:
      'Behavioural: your plan of attack depends on the current situation. The context holds a reference to whichever concrete strategy is active and delegates to it.',
    source: 'Lecture 10 §9.1',
  },
  {
    id: 'w10-strategy-robot',
    conceptId: 'strategy',
    code: `Robot
  - strategy : IBehaviour
  + move() : void
        ◇
        |
  <<interface>> IBehaviour
  + moveCommand() : void
        ▲
  AggressiveBehaviour · DefensiveBehaviour · NormalBehaviour`,
    question: 'What happens when the robot’s behaviour changes from normal to aggressive?',
    options: [
      'The `strategy` reference is pointed at a different `IBehaviour`; `Robot` itself does not change',
      '`Robot` is replaced with an `AggressiveRobot` subclass',
      '`Robot.move()` is rewritten to branch on the current mood',
      'A new `Robot` is constructed with the aggressive behaviour baked in',
    ],
    answer: 0,
    why: [
      '',
      'Subclassing per behaviour is exactly the rigid design Strategy avoids — and it cannot change at runtime.',
      'Branching inside `move()` is the if/else smell the pattern replaces.',
      'Rebuilding the object to change one behaviour loses all its other state.',
    ],
    explain:
      'Swapping one field. The context delegates `move()` to whichever strategy is currently held, so behaviour changes at runtime without `Robot` being touched.',
    source: 'Lecture 10 §9.1',
  },
  {
    id: 'w10-strategy-vs-state',
    conceptId: 'strategy',
    question: 'Strategy and Factory differ how?',
    options: [
      'Strategy swaps how something is done; Factory decides what gets created',
      'They are the same pattern in different categories',
      'Strategy is Creational; Factory is Behavioural',
      'Strategy applies only to algorithms with the same return type',
    ],
    answer: 0,
    why: [
      '',
      'Different problems: one is about behaviour at runtime, one is about instantiation.',
      'Exactly reversed — Strategy is Behavioural, Factory is Creational.',
      'No such restriction.',
    ],
    explain:
      'Both hand you an interface and hide a concrete class, which is why they get confused. The question each answers: Factory asks "which object do I build?", Strategy asks "which behaviour do I run?".',
    source: 'Lecture 10 §8.1, §9.1',
    stretch: true,
  },

  // --------------------------------------------------------------- observer
  {
    id: 'w10-observer-what',
    conceptId: 'observer',
    question: 'Which design pattern watches for a change in the state or properties of a subject?',
    options: ['Observer', 'Command', 'Singleton', 'Prototype'],
    answer: 0,
    why: [
      '',
      'Command encapsulates a request as an object, allowing requests to be parameterised or queued.',
      'Singleton ensures one instance with a global access point.',
      'Prototype clones an existing instance to avoid expensive creation.',
    ],
    explain:
      'A *subject* automatically notifies its *observers* when its state changes. Behavioural, because it is entirely about communication between objects.',
    source: 'Quiz 10 Q2',
  },
  {
    id: 'w10-observer-vs-command',
    conceptId: 'observer',
    question: 'How do Observer and Command differ?',
    options: [
      'Observer notifies many dependents of a state change; Command encapsulates a request as an object',
      'Observer is Structural; Command is Behavioural',
      'Observer works on one object; Command works on many',
      'They are the same pattern with different names',
    ],
    answer: 0,
    why: [
      '',
      'Both are Behavioural.',
      'The reverse, if anything — Observer is the one with many parties.',
      'They solve unrelated problems.',
    ],
    explain:
      'Listed as a trap in Quiz 10. Observer is about broadcasting that something *changed*; Command is about packaging up something to *do*.',
    source: 'Quiz 10, common traps',
  },
  {
    id: 'w10-observer-scenario',
    conceptId: 'observer',
    question:
      'A spreadsheet has several charts that must redraw whenever the underlying data changes. Which pattern fits?',
    options: ['Observer', 'Adapter', 'Factory', 'Composite'],
    answer: 0,
    why: [
      '',
      'No interface mismatch to bridge.',
      'The charts already exist; nothing is being created.',
      'The charts are not a part-whole tree of each other.',
    ],
    explain:
      'One subject, many dependents, automatic notification on change. The data does not need to know what a chart is — only that something is subscribed.',
    source: 'Quiz 10 Q2',
  },

  // ---------------------------------------------------------------- command
  {
    id: 'w10-command-what',
    conceptId: 'command-pattern',
    question: 'What does the Command pattern do, and which category is it in?',
    options: [
      'Encapsulates a request as an object with a shared `Execute` contract — Behavioural',
      'Encapsulates object creation behind one method — Creational',
      'Wraps an incompatible interface — Structural',
      'Guarantees a single instance — Creational',
    ],
    answer: 0,
    why: [
      '',
      'Factory.',
      'Adapter.',
      'Singleton.',
    ],
    explain:
      'Behavioural, because it is about how a request travels between objects. `LookCommand` and `MoveCommand` both inherit one abstract `Command` and supply their own `Execute`.',
    source: 'Lecture 10 §9.1; Lecture 9 §3',
  },
  {
    id: 'w10-command-abstract',
    conceptId: 'command-pattern',
    code: `public abstract class Command : IdentifiableObject
{
    public Command(List<string> identifiers) : base(identifiers) { }

    public abstract string Execute(Player player, List<string> text);
}`,
    question: 'Why is `Command` declared `abstract`?',
    options: [
      'So it cannot be instantiated directly — only a concrete subclass with a real `Execute` can be created',
      'So its methods run faster',
      'So it can inherit from `IdentifiableObject`',
      'So subclasses are not required to implement `Execute`',
    ],
    answer: 0,
    why: [
      '',
      'No performance implication.',
      'Any class can inherit; `abstract` is not what permits it.',
      'The exact opposite: an abstract member *must* be implemented by a concrete subclass.',
    ],
    explain:
      'A bare `Command` would have no behaviour to run. Abstract makes "every command must supply its own `Execute`" a rule the compiler enforces.',
    source: 'Lecture 9 §3.1',
  },
  {
    id: 'w10-command-benefit',
    conceptId: 'command-pattern',
    question: 'What does the shared abstract `Command` buy the Swin Adventure game?',
    options: [
      'New commands are added as new subclasses, without changing the code that runs commands',
      'Commands execute faster because they share a base class',
      'Each command can be instantiated only once',
      'The player no longer needs to type valid input',
    ],
    answer: 0,
    why: [
      '',
      'Inheritance does not make dispatch faster.',
      'That would be Singleton, and is not what is happening.',
      'Input validation is still needed — `LookCommand.Execute` is largely made of it.',
    ],
    explain:
      'The open/closed payoff again: the loop that reads input and calls `Execute` is written once against `Command`, and `MoveCommand` in Week 10 drops in without that loop changing.',
    source: 'Lecture 9 §3; Lecture 10 §4.3',
  },

  // ------------------------------------------- composition over inheritance
  {
    id: 'w10-composition-over-inheritance',
    conceptId: 'composition-over-inheritance',
    question:
      'What theme does Lecture 10 identify as running through every pattern it covers?',
    options: [
      'Design patterns promote composition over inheritance — behaviour is composed via interfaces',
      'Every pattern requires at least one abstract base class',
      'Every pattern reduces the number of classes in a design',
      'Every pattern can be implemented without interfaces',
    ],
    answer: 0,
    why: [
      '',
      'Several use interfaces alone, with no abstract class anywhere.',
      'Most patterns *add* classes. The gain is flexibility, not fewer files.',
      'Interfaces are central to nearly all of them.',
    ],
    explain:
      'Composite *has* children, Adapter *has* an adaptee, Strategy’s context *has* a strategy, Factory *returns* an interface type. Has-a through interfaces, rather than deep rigid is-a chains.',
    source: 'Lecture 10 §10',
  },
  {
    id: 'w10-composition-why',
    conceptId: 'composition-over-inheritance',
    question: 'Why is composition often preferred to inheritance?',
    options: [
      'It can be changed at runtime and avoids deep hierarchies where a change at the top ripples down',
      'It uses less memory than inheritance',
      'Inheritance is deprecated in modern C#',
      'Composed objects do not need interfaces',
    ],
    answer: 0,
    why: [
      '',
      'Memory is not the consideration.',
      'Inheritance is alive and correct where an is-a relationship genuinely holds.',
      'Composition usually relies on interfaces — that is what makes the parts interchangeable.',
    ],
    explain:
      'An inherited relationship is fixed at compile time; a composed one is a field you can reassign. It ties straight back to Week 8’s warning about deep hierarchies.',
    source: 'Lecture 10 §10; Quiz 8 Q5',
  },
  {
    id: 'w10-composition-grasp',
    conceptId: 'composition-over-inheritance',
    question: 'Which GRASP principles does "composition over inheritance" most directly echo?',
    options: [
      'Polymorphism and Low Coupling',
      'Creator and Information Expert',
      'Controller and Indirection',
      'Pure Fabrication and High Cohesion',
    ],
    answer: 0,
    why: [
      '',
      'Both about who owns what, not about how behaviour is composed.',
      'Controller is about events; Indirection is about mediating two components.',
      'Pure Fabrication is about inventing an owner for an orphan responsibility.',
    ],
    explain:
      'Interfaces let unrelated concrete classes be treated uniformly (Polymorphism) while callers depend only on the abstraction (Low Coupling) — Lecture 10 §10 makes this link explicitly.',
    source: 'Lecture 10 §10; Lecture 9 §6.4, §6.6',
    stretch: true,
  },
];
