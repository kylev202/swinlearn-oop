/**
 * Week 9 question bank — GRASP.
 *
 * Sourced from Quiz 9 (6 questions, all of them) and `Lecture 9.md`.
 *
 * Note what GRASP is *not*: it is not the Gang-of-Four design patterns, which
 * are Week 10. GRASP answers "which class should own this responsibility?"
 * and its nine entries are principles; the Week 10 patterns are named
 * solutions with a structure you can draw. The exam asks about both and the
 * two sets overlap in vocabulary — Polymorphism appears in each — so the
 * questions here deliberately practise telling them apart.
 *
 * The released mockup's Q9 is Quiz 9 Q3 with the same code, and asks it by
 * the GRASP name: "the best way to refactor to follow **Protected
 * Variations**". That is the one GRASP principle the sample paper names
 * outright, and it is covered here from several directions.
 */

import type { FocusQuestion } from '../types';

export const WEEK9: FocusQuestion[] = [
  // -------------------------------------------------------- what GRASP is
  {
    id: 'w9-grasp-stands-for',
    conceptId: 'grasp-what',
    question: 'What does GRASP stand for?',
    options: [
      'General Responsibility Assignment Software Patterns',
      'Generic Reusable Architecture for Software Projects',
      'Graphical Representation and Structured Programming',
      'Grouped Responsibility and Separation Principles',
    ],
    answer: 0,
    why: [
      '',
      'Invented. GRASP is not about architecture or reuse directly.',
      'Nothing to do with graphics or UML.',
      'Close in spirit, wrong in words — and the expansion is examinable as written.',
    ],
    explain:
      'The key word is **Responsibility Assignment**: GRASP exists to answer "given a piece of behaviour, which class should own it?".',
    source: 'Lecture 9 §4; Quiz 9 cheat sheet',
  },
  {
    id: 'w9-grasp-purpose',
    conceptId: 'grasp-what',
    question: 'What problem does GRASP address?',
    options: [
      'Deciding which class should be given a particular responsibility',
      'Deciding which programming language suits a project',
      'Deciding how to lay out classes across files and folders',
      'Deciding how much memory a program will need',
    ],
    answer: 0,
    why: [
      '',
      'Language choice is outside its scope entirely.',
      'File organisation is a convention, not a responsibility question.',
      'Nothing to do with memory.',
    ],
    explain:
      'Knowing C# syntax lets you write code that runs; it says nothing about *where* a piece of functionality should live. That gap is what GRASP fills.',
    source: 'Lecture 9 §4',
  },
  {
    id: 'w9-grasp-count',
    conceptId: 'grasp-what',
    question: 'Which of these is NOT one of the nine GRASP principles?',
    options: ['Singleton', 'Information Expert', 'Pure Fabrication', 'Indirection'],
    answer: 0,
    why: [
      '',
      'The first and most-used GRASP principle.',
      'GRASP — inventing a class to hold an awkward responsibility.',
      'GRASP — a mediating object between two components.',
    ],
    explain:
      'Singleton is a **Gang-of-Four design pattern** (Week 10, creational), not a GRASP principle. This is the distinction the exam most reliably probes: GRASP assigns responsibilities, patterns solve named structural problems.',
    source: 'Lecture 9 §6; Lecture 10 §7.1',
    stretch: true,
  },
  {
    id: 'w9-grasp-challenges',
    conceptId: 'grasp-what',
    question: 'Which is a genuine challenge of applying GRASP in practice?',
    options: [
      'Reasonable designers can disagree — the right choice is subjective and context-sensitive',
      'GRASP only works in C#',
      'GRASP must be applied in full or not at all',
      'GRASP replaces the need for UML diagrams',
    ],
    answer: 0,
    why: [
      '',
      'The principles are language-agnostic.',
      'The lecture’s take-away is the opposite: these are guidelines that can be broken for a given context, not laws.',
      'UML documents a design; GRASP helps you decide what the design should be. Different jobs.',
    ],
    explain:
      'The named challenges: complexity, subjectivity, the coupling/cohesion trade-off, context sensitivity, and the maintenance overhead of extra classes from Pure Fabrication or Indirection.',
    source: 'Lecture 9 §7',
  },

  // -------------------------------------------------------------- creator
  {
    id: 'w9-creator',
    conceptId: 'grasp-creator',
    question: 'Which best describes the Creator pattern in GRASP?',
    options: [
      'The class with the most knowledge about when and how to create an object should create it',
      'Every class should create its own dependencies in its constructor',
      'Object creation should always be done by a dedicated factory class',
      'Objects should be created as late as possible to save memory',
    ],
    answer: 0,
    why: [
      '',
      'This makes every class responsible for everything it uses, which raises coupling sharply.',
      'That is the Factory *pattern* (Week 10). Creator is about which existing domain class is the natural owner.',
      'Creator is about *who* creates, not *when*.',
    ],
    explain:
      'A creates B if A contains or aggregates B, records B, closely uses B, or holds B’s initialising data. The point is to stop creation being scattered arbitrarily.',
    source: 'Quiz 9 Q6',
  },
  {
    id: 'w9-creator-examples',
    conceptId: 'grasp-creator',
    question: 'By the Creator principle, which class should create the `Card` objects?',
    options: [
      'The `Deck`, because it contains and records them',
      'The `Player`, because the player uses the cards',
      'The `BlackjackGame`, because it runs the game',
      'A static `CardMaker` helper, so no domain class owns it',
    ],
    answer: 0,
    why: [
      '',
      'A player is handed cards but neither contains the full set nor holds the data to create them.',
      '`BlackjackGame` creates the `Deck` — one level up. It has no reason to know how a card is built.',
      'Pushing it to a helper is what you do when no domain class fits. Here one obviously does.',
    ],
    explain:
      'The lecture’s own chain: `BlackjackGame` creates the `Deck`, the `Deck` creates the `Cards`, and a `DrawingProgram` creates its `Shapes`. Each creator aggregates what it creates.',
    source: 'Lecture 9 §6.2',
  },
  {
    id: 'w9-creator-conditions',
    conceptId: 'grasp-creator',
    question: 'Which is NOT one of the Creator conditions for A creating B?',
    options: [
      'A and B are in the same namespace',
      'A contains or aggregates B',
      'A closely uses B',
      'A has the initialising data for B',
    ],
    answer: 0,
    why: [
      '',
      'A listed condition — containment is the strongest signal of all.',
      'A listed condition.',
      'A listed condition, and often the deciding one.',
    ],
    explain:
      'Namespaces are an organisational convenience and say nothing about responsibility. The four real conditions are all about a genuine relationship between A and B.',
    source: 'Lecture 9 §6.2',
  },

  // ----------------------------------------------------------- controller
  {
    id: 'w9-controller',
    conceptId: 'grasp-controller',
    question: 'What does the GRASP Controller principle say?',
    options: [
      'A system or UI event should be handled by a class representing the system, a use case or a session',
      'Every class should have a controller that manages its fields',
      'The user interface should contain the program’s logic',
      'One controller class should handle every event in the program',
    ],
    answer: 0,
    why: [
      '',
      'Controller is about *events*, not about field access.',
      'The opposite — putting logic in the UI is what the principle steers you away from.',
      'A single controller for everything is a God class. The principle allows one per use case or session.',
    ],
    explain:
      'It comes straight from MVC. The explicit caution: letting a database or model class handle raw user input is bad practice, because validating interaction is the controller’s job.',
    source: 'Lecture 9 §6.3',
  },
  {
    id: 'w9-controller-bad',
    conceptId: 'grasp-controller',
    question:
      'A `Customer` class, which represents a database record, reads directly from the console to validate a new address. Which principle does this break?',
    options: [
      'Controller — user interaction belongs in a controller, not a model class',
      'Creator — `Customer` should not create an address',
      'Pure Fabrication — a new class should hold the address',
      'Nothing; the class that owns the data should collect it',
    ],
    answer: 0,
    why: [
      '',
      'Nothing is being created here; the question is about who talks to the user.',
      'Pure Fabrication is for responsibilities that fit nowhere. Input handling has an obvious home.',
      'The tempting information-expert reading — but owning data does not mean owning the conversation that collects it.',
    ],
    explain:
      'A model class coupled to the console cannot be reused behind a web form or a test harness. The controller collects and validates, then hands clean data to the model.',
    source: 'Lecture 9 §6.3',
    stretch: true,
  },
  {
    id: 'w9-controller-mvc',
    conceptId: 'grasp-controller',
    question: 'The GRASP Controller principle is drawn from which pattern?',
    options: ['MVC', 'Singleton', 'Composite', 'Adapter'],
    answer: 0,
    why: [
      '',
      'Singleton governs instance count, nothing to do with events.',
      'Composite is about part-whole trees.',
      'Adapter bridges mismatched interfaces.',
    ],
    explain:
      'Model-View-Controller, from Week 8. The Controller is the layer that interacts with the user and validates input — the same answer as Quiz 8 Q3, asked in GRASP vocabulary.',
    source: 'Lecture 9 §6.3; Quiz 8 Q3',
  },

  // --------------------------------------------------- GRASP polymorphism
  {
    id: 'w9-poly-grasp',
    conceptId: 'grasp-polymorphism',
    question: 'What does the GRASP Polymorphism principle say?',
    options: [
      'When behaviour varies by type, assign it using polymorphic operations on those types rather than conditionals that test the type',
      'Every method should be declared `virtual` so it can be overridden',
      'A class should implement as many interfaces as possible',
      'Objects should be able to change their type at runtime',
    ],
    answer: 0,
    why: [
      '',
      'Making everything virtual is not a principle, and invites accidental overriding.',
      'Interface count is not a measure of good design.',
      'An object’s type never changes in C#. Polymorphism is about *behaviour* varying, not identity.',
    ],
    explain:
      'The same idea as Quiz 8 Q4 under a GRASP heading: an `if`/`switch` branching on type should become an overridden method per type.',
    source: 'Lecture 9 §6.6; Quiz 8 Q4',
  },
  {
    id: 'w9-poly-shapes',
    conceptId: 'grasp-polymorphism',
    code: `List<Shape> shapes = new List<Shape>();
shapes.Add(new Rectangle(...));
shapes.Add(new Circle(...));
shapes.Add(new Line(...));

foreach (Shape s in shapes)
{
    s.Draw();
}`,
    question: 'Why is this the GRASP Polymorphism principle in action?',
    options: [
      'Each shape knows how to draw itself, so the loop never asks what type anything is',
      'Because the list holds more than one type of object',
      'Because `Shape` must be an abstract class',
      'Because `Draw` takes no parameters',
    ],
    answer: 0,
    why: [
      '',
      'A list of mixed types could still be handled with a type switch. The principle is in what the loop *does not* do.',
      '`Shape` may well be abstract, but that is a mechanism, not the reason this counts.',
      'The signature is irrelevant.',
    ],
    explain:
      'The caller does no type checking at all. Adding a `Triangle` means writing one class — this loop never changes. That is the payoff the principle is pointing at.',
    source: 'Lecture 9 §6.6',
  },
  {
    id: 'w9-poly-fetch-container',
    conceptId: 'grasp-polymorphism',
    code: `private IHaveInventory FetchContainer(Player p, string containerId)
{
    object obj = p.Locate(containerId);
    if (obj == null) return null;

    IHaveInventory container = obj as IHaveInventory;
    return container;
}`,
    question: 'Why can this one method return either a `Player` or a `Bag`?',
    options: [
      'Both implement `IHaveInventory`, so one return type covers either concrete class',
      'Because `object` can hold anything',
      'Because `as` converts any type into any other type',
      'Because `Player` inherits from `Bag`',
    ],
    answer: 0,
    why: [
      '',
      'True of `obj`, but the *return* type is `IHaveInventory`, and that is what makes the design work.',
      '`as` does not convert — it tests, and yields `null` when the object does not implement the type.',
      'It does not. They are unrelated classes that share an interface.',
    ],
    explain:
      'The caller never needs to know which it got. Without the shared interface you would need one fetch method per container type — and a third when `Location` arrives in Week 10.',
    source: 'Lecture 9 §3.5',
  },

  // ----------------------------------------------------- pure fabrication
  {
    id: 'w9-pure-fabrication',
    conceptId: 'pure-fabrication',
    question: 'When should you use the Pure Fabrication pattern?',
    options: [
      'When a responsibility cannot be assigned to a real-world entity without hurting cohesion or coupling',
      'When you need more than one instance of a class',
      'When two classes have incompatible interfaces',
      'When a class has grown too large and needs splitting by size',
    ],
    answer: 0,
    why: [
      '',
      'Instance count is Singleton territory.',
      'That is Adapter.',
      'Splitting a large class is ordinary refactoring. Pure Fabrication is specifically about a responsibility with **no** natural domain owner.',
    ],
    explain:
      'An invented class with no counterpart in the problem domain, created purely to hold an awkward responsibility — accepted as the price of keeping the domain classes cohesive.',
    source: 'Quiz 9 Q2',
  },
  {
    id: 'w9-fabrication-persistence',
    conceptId: 'pure-fabrication',
    question:
      'You need to save a card game to disk. `Deck`, `Card` and `Player` all say "not our problem". What does GRASP suggest?',
    options: [
      'Invent a `Persistence` class whose only job is saving and loading',
      'Put the save logic in `Deck`, since it holds the most data',
      'Give every class its own `Save()` method',
      'Make `Card` responsible, since there are more cards than anything else',
    ],
    answer: 0,
    why: [
      '',
      'The information-expert reading, and wrong here: holding data does not make serialisation its topic.',
      'This scatters file-format knowledge across every domain class, so a format change touches all of them.',
      'Count is not a reason for anything.',
    ],
    explain:
      'The lecture’s own example. Persistence is a genuine responsibility belonging to no domain object, so you fabricate an owner for it — and the domain classes stay about the game.',
    source: 'Lecture 9 §6.7',
  },
  {
    id: 'w9-fabrication-cost',
    conceptId: 'pure-fabrication',
    question: 'What is the acknowledged cost of Pure Fabrication and Indirection?',
    options: [
      'More classes and abstractions to understand and maintain',
      'Slower program execution',
      'They break encapsulation',
      'They cannot be represented in UML',
    ],
    answer: 0,
    why: [
      '',
      'Not a performance matter.',
      'They usually improve encapsulation by keeping domain classes focused.',
      'Both are ordinary classes and draw normally.',
    ],
    explain:
      'Listed among the challenges in §7: maintenance overhead. Every invented class is another moving part, which is why you fabricate when a responsibility genuinely has no home, not by reflex.',
    source: 'Lecture 9 §7',
  },

  // ------------------------------------------------- protected variations
  {
    id: 'w9-protected-variations-refactor',
    conceptId: 'protected-variations',
    code: `class PaymentProcessor
{
    public void ProcessPayment(string paymentType, double amount)
    {
        if (paymentType == "CreditCard")
        {
            Console.WriteLine($"Processing credit card payment of \${amount}");
        }
        else if (paymentType == "PayPal")
        {
            Console.WriteLine($"Processing PayPal payment of \${amount}");
        }
        else
        {
            Console.WriteLine("Unsupported payment method.");
        }
    }
}`,
    question:
      'What is the best way to refactor `PaymentProcessor` to follow Protected Variations?',
    options: [
      'Use an interface for the different payment methods and apply polymorphism',
      'Keep the if/else structure but add more cases for future payment methods',
      'Move `ProcessPayment` to a static class for easy access',
      'Replace the if/else with a switch statement for better readability',
    ],
    answer: 0,
    why: [
      '',
      'Adding cases means editing this method every time — exactly the modification the principle protects against.',
      'Making it static changes where the method lives, not the branching that is the problem.',
      'A switch is the same design written more neatly. The structure is what has to change.',
    ],
    explain:
      'An `IPaymentMethod` interface with one class per method puts the variation behind a stable abstraction. Adding a payment type becomes a new class, leaving `PaymentProcessor` untouched — open to extension, closed to modification.',
    source: 'Quiz 9 Q3 — and mockup paper Q9, same code',
  },
  {
    id: 'w9-protected-variations-what',
    conceptId: 'protected-variations',
    question: 'What does the Protected Variations principle do?',
    options: [
      'Wraps a likely point of change behind a stable interface, shielding the rest of the system from it',
      'Marks fields `protected` so only subclasses can reach them',
      'Prevents a class from ever being changed once released',
      'Creates a copy of an object before modifying it',
    ],
    answer: 0,
    why: [
      '',
      'The lecturer draws the analogy to `protected`, and the name invites this, but the principle is about design structure, not an access keyword.',
      'Nothing stops code being changed. The aim is to limit what *else* must change with it.',
      'That is defensive copying, unrelated.',
    ],
    explain:
      'Identify what is most likely to vary, put an interface in front of it, and let everything else depend on the interface. Then the variation can change without rippling outward.',
    source: 'Quiz 9 cheat sheet; Lecture 9 §6.9',
  },
  {
    id: 'w9-protected-variations-notify',
    conceptId: 'protected-variations',
    code: `class NotificationService
{
    public void SendNotification(string type, string message)
    {
        if (type == "Email")      Console.WriteLine($"Sending Email: {message}");
        else if (type == "SMS")   Console.WriteLine($"Sending SMS: {message}");
        else                      Console.WriteLine("Unknown notification type.");
    }
}`,
    question: 'How should this be refactored so new senders can be added without editing it?',
    options: [
      'Introduce an `IMessageSender` interface and one class per channel',
      'Add an `else if` for each new channel as it is needed',
      'Pass a delegate into `SendNotification` for each call',
      'Make `type` an enum instead of a string',
    ],
    answer: 0,
    why: [
      '',
      'Each new channel edits working code — the thing being refactored away.',
      'This moves the branching to the caller rather than removing it, and loses the per-channel class that would hold the sending logic.',
      'An enum makes the branch type-safe. It is still a branch.',
    ],
    explain:
      'The same shape as the payment question, which is why both appear in the revision material: an `if` chain on a type string is the signature of a missing interface.',
    source: 'Quiz 9 Q1',
  },

  // ---------------------------------------------------------- indirection
  {
    id: 'w9-indirection',
    conceptId: 'indirection',
    question: 'What does the Indirection principle suggest?',
    options: [
      'Assign responsibility to an intermediate object that mediates between two components so they are not directly coupled',
      'Call methods through a chain of at least three objects',
      'Avoid calling any method directly',
      'Store every object reference in a global lookup table',
    ],
    answer: 0,
    why: [
      '',
      'Depth is not the point, and a long chain of calls is its own smell.',
      'Direct calls are normal. The principle applies where coupling two components directly is the problem.',
      'A global table is a different idea, and usually a worse one.',
    ],
    explain:
      'A mediator sits between two components so neither depends on the other. Lower coupling, at the price of one more class to maintain.',
    source: 'Lecture 9 §6.8',
  },
  {
    id: 'w9-indirection-vs-pv',
    conceptId: 'indirection',
    question: 'How do Indirection and Protected Variations differ?',
    options: [
      'Indirection decouples two components via a mediator; Protected Variations shields the system from a point of change behind a stable interface',
      'They are the same principle with two names',
      'Indirection applies to interfaces, Protected Variations to abstract classes',
      'Indirection is a GoF pattern, Protected Variations is GRASP',
    ],
    answer: 0,
    why: [
      '',
      'Related and often implemented similarly, but the motivation differs: decoupling two known parties versus anticipating change.',
      'Neither is tied to a particular C# construct.',
      'Both are GRASP principles.',
    ],
    explain:
      'The question each answers: Indirection asks "how do I stop A depending on B?", Protected Variations asks "what here is most likely to change, and what will it break?".',
    source: 'Lecture 9 §6.8, §6.9',
    stretch: true,
  },
  {
    id: 'w9-indirection-example',
    conceptId: 'indirection',
    question:
      'A class checks whether game state was saved successfully before letting the game terminate, rather than the game and the file layer calling each other. Which principle is that?',
    options: ['Indirection', 'Creator', 'High Cohesion', 'Polymorphism'],
    answer: 0,
    why: [
      '',
      'Nothing is being instantiated.',
      'Cohesion is about what one class holds, not about a go-between.',
      'No behaviour varies by type here.',
    ],
    explain:
      'The lecturer’s own example: an intermediary standing between "data exists" and "data is confirmed saved", so neither side needs a direct dependency on the other.',
    source: 'Lecture 9 §6.8',
  },

  // --------------------------------------------------------- open/closed
  {
    id: 'w9-open-closed',
    conceptId: 'open-closed',
    question: 'What does the Open/Closed Principle state?',
    options: [
      'Code should be open to extension but closed to modification',
      'Classes should be public and their fields private',
      'A file should be opened before reading and closed afterwards',
      'A class should be open to subclassing but closed to instantiation',
    ],
    answer: 0,
    why: [
      '',
      'That is ordinary encapsulation, a different idea entirely.',
      'Nothing to do with file I/O, despite the words.',
      'That describes an abstract class, not this principle.',
    ],
    explain:
      'Add behaviour by adding new code, not by editing code that already works and is already tested. Every `else if` added to a working method is a small violation.',
    source: 'Quiz 9 cheat sheet',
  },
  {
    id: 'w9-open-closed-which',
    conceptId: 'open-closed',
    question:
      'Adding a new payment type currently means adding an `else if` to `ProcessPayment`. Which principle does that violate?',
    options: [
      'Open/Closed — the class has to be modified to be extended',
      'Single responsibility — the class does more than one thing',
      'Liskov substitution — a subclass breaks the contract',
      'Information expert — the wrong class holds the data',
    ],
    answer: 0,
    why: [
      '',
      'Arguably also true, but the specific failure named here is that extension requires editing.',
      'No inheritance is involved at all.',
      'The data is in the right place; it is the branching that is wrong.',
    ],
    explain:
      'The mark of the violation: you cannot add a feature without reopening tested code. Polymorphism and Protected Variations are how GRASP fixes it.',
    source: 'Quiz 9 Q1, Q3',
  },
  {
    id: 'w9-open-closed-mechanism',
    conceptId: 'open-closed',
    question: 'Which C# mechanism most directly supports the Open/Closed Principle?',
    options: [
      'Interfaces and virtual methods, so new types extend behaviour without editing the caller',
      '`sealed`, which prevents a class from being changed',
      '`readonly`, which prevents a field from being reassigned',
      '`static`, which gives one shared copy of a member',
    ],
    answer: 0,
    why: [
      '',
      '`sealed` blocks inheritance — it closes a class to *extension*, which is the opposite half.',
      '`readonly` protects a value, not a design.',
      '`static` has no bearing on extensibility.',
    ],
    explain:
      'An interface is the extension point and polymorphic dispatch is what keeps the caller unchanged. The principle is a design goal; these are the tools C# gives you to reach it.',
    source: 'Quiz 9 Q1, Q3; Lecture 9 §6.6',
  },
];
