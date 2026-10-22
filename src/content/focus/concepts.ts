/**
 * The concept map for Weeks 1-11 — everything either exam can ask about.
 *
 * Derived by working backwards from what the assessments actually contain:
 * the eleven revision quizzes, the mock-test walkthrough in Lecture 5, the
 * released final-term mockup paper (`Final_Mockup Sample (2).pdf`) and
 * Lecture 11's own walkthrough of it. Anything taught in lecture but never
 * examined in any of those is not here — these are lists for a 20-minute and
 * a 40-minute paper, not a syllabus.
 *
 * Two exams draw from this one map, and the split is by week:
 *
 *   Weeks 1-5   midsemester test, and still examinable on the final, which
 *               takes its *code analysis* questions from the whole unit.
 *   Weeks 6-11  final only. Lecture 11: "theoretical content from Weeks
 *               6-11, but coding analysis questions from Week 1-11".
 *
 * `lessonSteps` point back into the main lesson content. They are the escape
 * hatch when a revision note is not enough, so they are only filled in where a
 * step really does teach that idea rather than merely mention it.
 */

import type { Concept } from './types';

export const CONCEPTS: Concept[] = [
  // ------------------------------------------------------ week 1: objects
  {
    id: 'oop-why',
    week: 1,
    title: 'Why OOP',
    oneLiner:
      'OOP manages complexity in large software by breaking the problem into small interacting objects, instead of scattering logic across standalone functions.',
  },
  {
    id: 'class-object',
    week: 1,
    title: 'Class vs object',
    oneLiner:
      'A class is the blueprint that defines attributes and behaviour; an object is one instance built from it, with its own data.',
    lessonSteps: ['w2-objects-1', 'w2-objects-members'],
  },
  {
    id: 'attr-behaviour',
    week: 1,
    title: 'Attributes vs behaviour',
    oneLiner:
      'Attributes are what an object knows (Model, Colour, Speed); behaviour is what it can do (Drive(), Brake()).',
    lessonSteps: ['w2-objects-members'],
  },
  {
    id: 'encapsulation',
    week: 1,
    title: 'Encapsulation',
    oneLiner:
      'Bundling data and the methods that act on it into one unit, while restricting direct access to that data with access modifiers.',
    lessonSteps: ['w2-enc-1', 'w2-enc-words'],
  },
  {
    id: 'abstraction',
    week: 1,
    title: 'Abstraction',
    oneLiner:
      'Focusing on the essential characteristics of a real-world entity and ignoring irrelevant detail, when deciding what a class should contain.',
  },
  {
    id: 'access-modifiers',
    week: 1,
    title: 'Access modifiers',
    oneLiner:
      'public = anywhere, private = same class only, protected = same class plus derived classes. A member with no modifier is private by default.',
    lessonSteps: ['w2-enc-words', 'w4-inh-access'],
  },
  {
    id: 'constructors',
    week: 1,
    title: 'Constructors',
    oneLiner:
      'Same name as the class, no return type at all, runs automatically on new. You get a free parameterless one only until you write a constructor of your own.',
    lessonSteps: ['w2-21-ctor'],
  },
  {
    id: 'properties',
    week: 1,
    title: 'Properties',
    oneLiner:
      'A property is the public get/set gateway to a private field — controlled access that keeps encapsulation intact.',
    lessonSteps: ['w2-21-prop-name', 'w2-enc-field-or-prop'],
  },
  {
    id: 'datatypes',
    week: 1,
    title: 'Choosing a data type',
    oneLiner:
      'If you would never do arithmetic on it, store it as a string — phone numbers keep leading zeros, +, spaces and hyphens.',
  },

  // -------------------------------- week 2: framework, testing, class UML
  {
    id: 'bcl',
    week: 2,
    title: 'The Base Class Library',
    oneLiner:
      'The .NET BCL is a set of reusable classes, interfaces and value types giving you optimised code for common tasks — file I/O, collections, drawing — so you do not rewrite them.',
  },
  {
    id: 'collections',
    week: 2,
    title: 'List vs Dictionary',
    oneLiner:
      'List<T> is index-based and you append with .Add(); Dictionary<K,V> is key-based and is what you want when you look things up by a unique key.',
  },
  {
    id: 'unit-test-why',
    week: 2,
    title: 'Why unit test',
    oneLiner:
      'A unit test checks one unit of code behaves as expected, in isolation. Catching a bug early costs far less than catching it after release, and tests can be written before the code (TDD).',
  },
  {
    id: 'test-anatomy',
    week: 2,
    title: 'Setup, perform, check',
    oneLiner:
      'Every unit test sets up the object, performs the operation, then checks the result — Arrange, Act, Assert.',
  },
  {
    id: 'nunit',
    week: 2,
    title: 'NUnit attributes and Assert',
    oneLiner:
      '[TestFixture] marks the class, [Test] marks each method, and the Assert class (AreEqual, IsTrue, IsNotNull) decides pass or fail. NUnit is .NET; JUnit is Java; CPPUnit is C++.',
  },
  {
    id: 'uml-class',
    week: 2,
    title: 'Reading a UML class diagram',
    oneLiner:
      'Three compartments — name, attributes, methods — with - for private, + for public, # for protected and ~ for internal.',
    lessonSteps: ['w2-21-uml'],
  },
  {
    id: 'uml-purpose',
    week: 2,
    title: 'What UML is for',
    oneLiner:
      'UML is a standard notation for visualising and documenting a design. Structure diagrams (class, component, deployment) show static layout; behaviour diagrams show what happens over time.',
  },

  // ------------------------ week 3: collaboration, memory, sequence UML
  {
    id: 'relationships',
    week: 3,
    title: 'Object relationships',
    oneLiner:
      'Dependency = temporarily uses. Association = has-a reference. Aggregation = contains parts that outlive it. Composition = owns parts that die with it.',
    lessonSteps: ['w3-rel-types', 'w3-rel-aggregation'],
  },
  {
    id: 'stack-heap',
    week: 3,
    title: 'Stack vs heap',
    oneLiner:
      'Fixed-size value types whose size is known at compile time live on the stack; objects, strings and collections live on the heap because they can grow at runtime.',
    lessonSteps: ['w3-mem-regions'],
  },
  {
    id: 'value-ref',
    week: 3,
    title: 'Value types vs reference types',
    oneLiner:
      'A value type holds its data directly; a reference type holds a reference to data on the heap — so passing an object to a method passes the reference, not a copy of the object.',
    lessonSteps: ['w2-ref-value-vs-ref', 'w3-mem-regions'],
  },
  {
    id: 'call-stack',
    week: 3,
    title: 'The call stack',
    oneLiner:
      'Calling a method pushes a stack frame holding its locals; when it returns the frame is popped and control goes back to the caller.',
    lessonSteps: ['w3-mem-survives-return'],
  },
  {
    id: 'gc',
    week: 3,
    title: 'Garbage collection',
    oneLiner:
      'The .NET garbage collector automatically reclaims heap objects nothing references any more — which is why C# has no delete and C++ does.',
    lessonSteps: ['w3-mem-gc'],
  },
  {
    id: 'uml-sequence',
    week: 3,
    title: 'Reading a UML sequence diagram',
    oneLiner:
      'A behaviour diagram of interactions over time: dashed vertical lifelines, activation boxes for when an object is busy, solid filled arrows for calls and dashed open arrows for returns.',
    lessonSteps: ['w3-seq-purpose', 'w3-seq-read'],
  },

  // ------------------------------ week 4: inheritance and polymorphism
  {
    id: 'inheritance',
    week: 4,
    title: 'Inheritance',
    oneLiner:
      'class Circle : Shape gives Circle everything Shape has. It models an is-a family, and in C# a class has exactly one base class.',
    lessonSteps: ['w4-inh-syntax', 'w4-inh-why'],
  },
  {
    id: 'gen-spec',
    week: 4,
    title: 'Generalisation and specialisation',
    oneLiner:
      'Generalisation pulls what several classes share up into a parent; specialisation adds what makes a child different.',
    lessonSteps: ['w4-inh-abstraction'],
  },
  {
    id: 'protected',
    week: 4,
    title: 'protected and inherited access',
    oneLiner:
      'A child inherits every member but can only reach the public and protected ones — a private field of the parent is inherited yet untouchable.',
    lessonSteps: ['w4-inh-access'],
  },
  {
    id: 'override',
    week: 4,
    title: 'virtual and override',
    oneLiner:
      'Overriding replaces an inherited method with a new implementation in the child; the parent must mark it virtual (or abstract) and the child must say override.',
    lessonSteps: ['w4-poly-dispatch'],
  },
  {
    id: 'polymorphism',
    week: 4,
    title: 'Polymorphism',
    oneLiner:
      'Hold a child object in a parent-typed variable and call the shared method — the runtime picks the override belonging to the actual object. It replaces the if/else chain over types.',
    lessonSteps: ['w4-poly-what', 'w4-poly-dispatch'],
  },
  {
    id: 'abstract',
    week: 4,
    title: 'Abstract classes and methods',
    oneLiner:
      'An abstract class cannot be instantiated; an abstract method has no body and every concrete child must override it.',
    lessonSteps: ['w4-poly-abstract'],
  },

  // ------------------------------------ week 5: interfaces and exceptions
  {
    id: 'interfaces',
    week: 5,
    title: 'Interfaces',
    oneLiner:
      'A contract of members with no implementation. A class that says it implements one must supply every member, or be declared abstract itself.',
    lessonSteps: ['w5-int-define', 'w5-int-implement'],
  },
  {
    id: 'interface-vs-inherit',
    week: 5,
    title: 'Interface vs inheritance',
    oneLiner:
      'Inheritance shares ancestry and code between related types; an interface shares only capability, and lets completely unrelated classes be used through the same type.',
    lessonSteps: ['w5-int-vs-inheritance'],
  },
  {
    id: 'standard-interfaces',
    week: 5,
    title: 'Interfaces from the library',
    oneLiner:
      'IComparable is what a sorter needs — implement CompareTo and anything can be sorted, whatever hierarchy it comes from.',
    lessonSteps: ['w5-int-why'],
  },
  {
    id: 'exceptions-why',
    week: 5,
    title: 'What exceptions are for',
    oneLiner:
      'An exception is an object carrying an error message, raised at runtime for exceptional conditions — not for ordinary control flow, and never for compile errors.',
    lessonSteps: ['w5-exc-why', 'w5-exc-when'],
  },
  {
    id: 'try-catch',
    week: 5,
    title: 'try, catch, finally',
    oneLiner:
      'try guards the risky code, catch handles a matching exception type and execution continues after the block, and finally runs either way.',
    lessonSteps: ['w5-exc-finally'],
  },
  {
    id: 'exception-flow',
    week: 5,
    title: 'Where an exception goes',
    oneLiner:
      'An unhandled exception propagates up the call stack looking for a matching catch; if none exists anywhere, the program crashes.',
    lessonSteps: ['w5-exc-propagate'],
  },

  // ------------------------------------- week 6: responsibility-driven design
  {
    id: 'rdd-steps',
    week: 6,
    title: 'The three steps of RDD',
    oneLiner:
      'Step 1 identify roles, step 2 assign responsibilities to each role, step 3 work out how they collaborate. Roles come first, always.',
    lessonSteps: ['w6-rdd-steps', 'w6-col-step3'],
  },
  {
    id: 'rdd-role',
    week: 6,
    title: 'What a role is',
    oneLiner:
      'A role is a general responsibility or purpose an object may fulfil — a behavioural contract, not one concrete class and not an instance. Roles come from the problem domain, so a For Loop is never one.',
    lessonSteps: ['w6-rdd-roles'],
  },
  {
    id: 'crc-cards',
    week: 6,
    title: 'CRC cards',
    oneLiner:
      'Candidate role, Responsibility, Collaboration — index cards used early in RDD to brainstorm and iteratively refine roles by walking scenarios, long before any database or implementation detail.',
    lessonSteps: ['w6-rdd-crc'],
  },
  {
    id: 'knows-does',
    week: 6,
    title: 'Knows and does',
    oneLiner:
      'A responsibility is either something the role knows (an attribute) or something it does (a method). Assigning both to the role that owns the data is encapsulation of responsibilities.',
    lessonSteps: ['w6-rdd-knows-does'],
  },
  {
    id: 'info-expert',
    week: 6,
    title: 'Information expert',
    oneLiner:
      'The object that holds the data is the object responsible for acting on it — a Piece knows its own valid moves; the Library, not the User, runs the borrow transaction.',
    lessonSteps: ['w6-col-expert', 'w6-col-library'],
  },
  {
    id: 'cohesion',
    week: 6,
    title: 'Cohesion',
    oneLiner:
      'How strongly related one class’s own responsibilities are. High cohesion = "I know everything about one topic"; a class doing several unrelated jobs is low cohesion, a God class.',
    lessonSteps: ['w6-col-cohesion'],
  },
  {
    id: 'coupling',
    week: 6,
    title: 'Coupling',
    oneLiner:
      'How much classes depend on each other. Low (loose) coupling means depending on interfaces rather than other classes’ concrete internals — "I am a rock, I am an island".',
    lessonSteps: ['w6-col-coupling'],
  },
  {
    id: 'uml-relations',
    week: 6,
    title: 'The five UML relationships',
    oneLiner:
      'Dependency (dashed arrow, temporary use), association (solid line), aggregation (open diamond, parts outlive the whole), composition (filled diamond, parts die with it), inheritance (hollow triangle).',
    lessonSteps: ['w6-uml-relations'],
  },

  // ---------------------------- week 7: common implementation issues
  {
    id: 'overloading',
    week: 7,
    title: 'Method overloading',
    oneLiner:
      'Same name, different parameter count, order or type. The signature excludes the return type and parameter names, so changing only one of those is a duplicate method, not an overload.',
    lessonSteps: ['w7-contract-signature', 'w7-contract-names', 'w7-contract-return'],
  },
  {
    id: 'scope',
    week: 7,
    title: 'Variable scope and shadowing',
    oneLiner:
      'Two variables of one name in the same scope is a compile error; a local legally shadows a class field of the same name, and inside that method the local wins.',
    lessonSteps: ['w7-scope-duplicate', 'w7-scope-shadow'],
  },
  {
    id: 'reading-errors',
    week: 7,
    title: 'Reading an error message',
    oneLiner:
      'Read the message and trace the stack backwards to the root cause. The reported line is where the symptom surfaced, not necessarily where the bug is.',
    lessonSteps: ['w7-err-anatomy', 'w7-err-wrongline'],
  },
  {
    id: 'common-exceptions',
    week: 7,
    title: 'Telling the common exceptions apart',
    oneLiner:
      'IndexOutOfRangeException = the index fell outside 0..Length-1. NullReferenceException = you dereferenced a reference holding null. They are different faults with different first checks.',
    lessonSteps: ['w7-err-index', 'w7-err-null'],
  },
  {
    id: 'api-docs',
    week: 7,
    title: 'Why read the documentation',
    oneLiner:
      'Documentation tells you what methods exist, what parameters they expect and how they are meant to be used — rather than guessing a signature and hitting an avoidable overload or scope error.',
    lessonSteps: ['w7-err-docs'],
  },

  // ------------------------------------------ week 8: good OO design
  {
    id: 'lazy-class',
    week: 8,
    title: 'Lazy classes',
    oneLiner:
      'A good class minimises its own responsibilities and delegates whatever another object is better placed to do — the same instinct as information expert, seen from the other side.',
    lessonSteps: ['w8-design-lazy'],
  },
  {
    id: 'antisocial-class',
    week: 8,
    title: 'Antisocial classes',
    oneLiner:
      'A good class keeps communication with other objects minimal and well defined, to reduce dependencies. It is about lowering coupling, not about hiding data from its own methods.',
    lessonSteps: ['w8-design-antisocial'],
  },
  {
    id: 'conformity',
    week: 8,
    title: 'Conformity and Liskov substitution',
    oneLiner:
      'A subclass must honour its parent’s contract so it can stand in anywhere the parent is expected. Square inheriting Rectangle while allowing width ≠ height is the classic violation.',
    lessonSteps: ['w8-design-conformist'],
  },
  {
    id: 'mvc',
    week: 8,
    title: 'MVC',
    oneLiner:
      'Model holds the data, View presents it, Controller carries the logic between them — so a change to one has minimal impact on the others.',
    lessonSteps: ['w8-design-mvc'],
  },
  {
    id: 'design-smells',
    week: 8,
    title: 'Design smells',
    oneLiner:
      'Deep inheritance hierarchies make a top-level change ripple through every level below; long if/else chains branching on type should be replaced by polymorphism.',
    lessonSteps: ['w8-design-smells'],
  },
  {
    id: 'composite-idea',
    week: 8,
    title: 'The composite shape',
    oneLiner:
      'A container that is itself one of the things it contains — a Bag is an Item that holds Items — so a client treats one object and a whole tree of them identically.',
    lessonSteps: ['w8-comp-idea', 'w8-comp-nested'],
  },
  {
    id: 'class-size',
    week: 8,
    title: 'Class size',
    oneLiner:
      'A class that is too small is too problem-specific to reuse; one that is too large is too generic to reduce any complexity. Both fail, at opposite ends.',
    lessonSteps: ['w8-design-smells'],
  },

  // ----------------------------------------------------- week 9: GRASP
  {
    id: 'grasp-what',
    week: 9,
    title: 'What GRASP is',
    oneLiner:
      'General Responsibility Assignment Software Patterns — nine guidelines for answering one question: given a responsibility, which class should own it?',
  },
  {
    id: 'grasp-creator',
    week: 9,
    title: 'Creator',
    oneLiner:
      'A creates B if A contains or aggregates B, records B, closely uses B, or holds B’s initialising data — Deck creates Cards, BlackjackGame creates the Deck.',
  },
  {
    id: 'grasp-controller',
    week: 9,
    title: 'Controller',
    oneLiner:
      'A system or UI event is handled by a controller — a class representing the system, a use case or a session — not by a model or database class handling raw user input directly.',
  },
  {
    id: 'grasp-polymorphism',
    week: 9,
    title: 'Polymorphism (GRASP)',
    oneLiner:
      'When behaviour varies by type, put it in polymorphic methods on the types themselves instead of an if/switch that tests the type and branches.',
  },
  {
    id: 'pure-fabrication',
    week: 9,
    title: 'Pure fabrication',
    oneLiner:
      'Invent a class with no real-world meaning to hold a responsibility that would wreck a domain class’s cohesion — a Persistence class saves the Deck, because no Card wants to save itself.',
  },
  {
    id: 'protected-variations',
    week: 9,
    title: 'Protected variations',
    oneLiner:
      'Wrap the part of the design likeliest to change behind a stable interface, so the rest of the system depends on the abstraction and is shielded when the variation changes.',
  },
  {
    id: 'indirection',
    week: 9,
    title: 'Indirection',
    oneLiner:
      'Put an intermediate object between two components so they talk through it rather than being coupled directly to each other.',
  },
  {
    id: 'open-closed',
    week: 9,
    title: 'Open/closed',
    oneLiner:
      'Code should be open to extension — add a new subclass — and closed to modification — do not edit working code. Adding a payment type should mean a new class, never a new else-if.',
  },

  // -------------------------------------------- week 10: design patterns
  {
    id: 'pattern-what',
    week: 10,
    title: 'What a design pattern is',
    oneLiner:
      'A named, reusable template for a recurring class of design problem, not a one-off fix. Pattern-based solutions are reusable, extensible and maintainable.',
  },
  {
    id: 'pattern-categories',
    week: 10,
    title: 'The three categories',
    oneLiner:
      'Creational patterns capture ways to create objects, structural ways to assemble them, behavioural ways they communicate. There are exactly three — anything else named is a distractor.',
  },
  {
    id: 'singleton',
    week: 10,
    title: 'Singleton',
    oneLiner:
      'One instance for the whole application, via a private constructor plus a static field and a static GetInstance that creates it only if it does not exist yet. Creational.',
  },
  {
    id: 'factory',
    week: 10,
    title: 'Factory',
    oneLiner:
      'Defines an interface for object creation and lets the factory or a subclass decide which concrete class to instantiate, so the client never depends on the concrete types. Creational.',
  },
  {
    id: 'adapter',
    week: 10,
    title: 'Adapter',
    oneLiner:
      'Wraps a class whose interface does not match what your code expects, translating between the two without modifying either side. Structural.',
  },
  {
    id: 'composite-pattern',
    week: 10,
    title: 'Composite',
    oneLiner:
      'Composes objects into a part-whole tree so individual objects and compositions are treated uniformly through one component interface. Structural.',
  },
  {
    id: 'strategy',
    week: 10,
    title: 'Strategy',
    oneLiner:
      'Encapsulates interchangeable algorithms behind one interface so the context can swap which one it uses at runtime — a Robot switching aggressive, defensive or normal behaviour. Behavioural.',
  },
  {
    id: 'observer',
    week: 10,
    title: 'Observer',
    oneLiner:
      'A subject automatically notifies many observers when its state or properties change. Behavioural — and not the same as Command, which encapsulates a request as an object.',
  },
  {
    id: 'command-pattern',
    week: 10,
    title: 'Command',
    oneLiner:
      'Encapsulates a request as an object with a shared Execute contract, so LookCommand and MoveCommand both inherit one abstract Command. Behavioural.',
  },
  {
    id: 'composition-over-inheritance',
    week: 10,
    title: 'Composition over inheritance',
    oneLiner:
      'Patterns compose behaviour through interfaces — has-a — rather than deep rigid inheritance chains, which is why every pattern here hands you an interface rather than a base class to extend.',
  },

  // --------------------------------- week 11: other OO languages, memory
  {
    id: 'cross-language-oop',
    week: 11,
    title: 'OOP across languages',
    oneLiner:
      'Abstraction, encapsulation, inheritance and polymorphism exist in every OO language; only the syntax changes. C++ ends a class with a semicolon and uses public:/private: section labels, Swift uses init, JavaScript uses prototypes.',
  },
  {
    id: 'stack-heap-languages',
    week: 11,
    title: 'Stack or heap, by language',
    oneLiner:
      'C++ and Delphi let the developer choose: a declared object sits on the stack and uses dot syntax, a new-ed one sits on the heap behind a pointer and uses arrow syntax. C# always heaps its objects.',
  },
  {
    id: 'static-dynamic-typing',
    week: 11,
    title: 'Static vs dynamic typing',
    oneLiner:
      'Static: the compiler checks the declared variable type at compile time (C#, C++, Java). Dynamic: the object itself decides at run time (JavaScript, Python, Objective-C).',
  },
  {
    id: 'object-destruction',
    week: 11,
    title: 'How languages destroy objects',
    oneLiner:
      'Manual delete via a ~destructor (C++), reference counting that frees at zero (Swift, Objective-C), or garbage collection run by the runtime (C#, Java).',
  },
  {
    id: 'benchmarking',
    week: 11,
    title: 'Benchmarking a program',
    oneLiner:
      'Stopwatch.StartNew() immediately before the block you are timing, watch.Stop() after, read ElapsedMilliseconds; Process.GetCurrentProcess().WorkingSet64 and PeakWorkingSet64 for memory.',
  },
];

export const CONCEPT_BY_ID: Record<string, Concept> = Object.fromEntries(
  CONCEPTS.map((c) => [c.id, c]),
);

/**
 * The weeks the midsemester test draws from, in order.
 *
 * Kept as its own export because a great deal of code — the rail, the board,
 * the mock blueprint — was written against it when there was only one exam.
 * `EXAM_BY_ID[exam].weeks` is the general form; this is the midsem's list,
 * and the two must agree (`exams.test.ts` asserts it).
 */
export const FOCUS_WEEKS = [1, 2, 3, 4, 5];

/** Every week any exam draws from, in order. */
export const ALL_WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function conceptsOfWeek(week: number): Concept[] {
  return CONCEPTS.filter((c) => c.week === week);
}
