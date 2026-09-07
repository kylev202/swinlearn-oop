/**
 * The concept map for Weeks 1-5 — everything the midterm can ask about.
 *
 * Derived by working backwards from what the assessment actually contains:
 * the five revision quizzes (Quiz 1-5, 82 questions between them), the
 * mock-test walkthrough in Lecture 5, and Lecture 4's own "possible
 * midterm-style questions" section. Anything taught in lecture but never
 * examined in any of those is not here — this is a list for a 20-minute
 * paper, not a syllabus.
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
];

export const CONCEPT_BY_ID: Record<string, Concept> = Object.fromEntries(
  CONCEPTS.map((c) => [c.id, c]),
);

/** The weeks the midterm draws from, in order. */
export const FOCUS_WEEKS = [1, 2, 3, 4, 5];

export function conceptsOfWeek(week: number): Concept[] {
  return CONCEPTS.filter((c) => c.week === week);
}
