/**
 * Week 2 question bank — framework classes, unit testing, UML class diagrams.
 *
 * Sourced from Quiz 2 (19 questions) and Lecture 2. This is the week the main
 * lesson content covers least directly: SOURCES.md records that Lecture 2's
 * collections and NUnit material was never built into a lesson, because Lab 2
 * did not need it. The midterm does not care about that — Quiz 2 is a third
 * unit testing and a third BCL — so the bank and the revision notes carry it.
 */

import type { FocusQuestion } from '../types';

export const WEEK2: FocusQuestion[] = [
  // ------------------------------------------------------- unit testing
  {
    id: 'w2-tests-per-class',
    conceptId: 'unit-test-why',
    question: 'True or false: only one unit test can be written per class.',
    options: ['False', 'True'],
    answer: 0,
    why: ['', 'A class has many methods and many edge cases, and each deserves its own test.'],
    explain:
      'One `[TestFixture]` class holds as many `[Test]` methods as you need. Lab 4.2 alone asks for five tests against `Inventory`.',
    source: 'Quiz 2 Q1',
  },
  {
    id: 'w2-test-purpose',
    conceptId: 'unit-test-why',
    question: 'What is a unit test for?',
    options: [
      'Verifying that an individual piece of functionality works as expected, in isolation',
      'Checking that the whole application runs end to end',
      'Measuring how fast a method runs',
      'Finding syntax errors before compilation',
    ],
    answer: 0,
    why: [
      '',
      'That is an integration or system test. A *unit* test deliberately keeps the scope to one unit.',
      'That is a benchmark.',
      'The compiler finds syntax errors. A test only runs once the code already compiles.',
    ],
    explain:
      'Unit testing checks individual components — usually one class\'s methods — in isolation, so a failure points at one place.',
    source: 'Quiz 2 Q3',
  },
  {
    id: 'w2-tdd',
    conceptId: 'unit-test-why',
    question: 'True or false: unit tests are only useful after the application has been developed.',
    options: ['False', 'True'],
    answer: 0,
    why: [
      '',
      'Test-Driven Development does the opposite — the test is written first, to define what the code must do.',
    ],
    explain:
      'Tests can be written before or during development. In TDD the failing test *is* the specification, and the code exists to make it pass.',
    source: 'Quiz 2 Q19',
  },
  {
    id: 'w2-early-detection',
    conceptId: 'unit-test-why',
    question: 'Why does catching an error early matter?',
    options: [
      'It reduces the cost and effort of fixing the bug',
      'It makes the compiled program smaller',
      'It is the only way to find logic errors',
      'It removes the need for an interview at the lab',
    ],
    answer: 0,
    why: [
      '',
      'Bug timing has no effect on binary size.',
      'Logic errors can also be found by reading, debugging or running the program — tests just find them sooner and repeatably.',
      'Nothing removes the interview.',
    ],
    explain:
      'A bug caught by a unit test costs minutes. The same bug found after integration, or after release, costs orders of magnitude more.',
    source: 'Quiz 2 Q14',
  },
  {
    id: 'w2-test-steps',
    conceptId: 'test-anatomy',
    question: 'What are the three steps of writing a unit test, in order?',
    options: [
      'Setup, perform, check',
      'Check, setup, perform',
      'Perform, setup, check',
      'Setup, check, perform',
    ],
    answer: 0,
    why: [
      '',
      'You cannot check a result you have not produced yet.',
      'There is nothing to perform an operation on until it has been set up.',
      'The assertion has to come last — it is judging the result of the operation.',
    ],
    explain:
      '**Setup** the object under test, **perform** the operation, **check** the result. The same pattern is more widely known as Arrange–Act–Assert.',
    source: 'Quiz 2 Q2',
  },
  {
    id: 'w2-identify-steps',
    conceptId: 'test-anatomy',
    code: `[Test]
public void TestIncrement()
{
    Counter c = new Counter();     // A
    c.Increment();                 // B
    Assert.AreEqual(1, c.Count);   // C
}`,
    question: 'Which line is the **perform** step?',
    options: ['B', 'A', 'C', 'There is no perform step in this test'],
    answer: 0,
    why: [
      '',
      'A is the setup — it creates the object the test acts on.',
      'C is the check — the assertion judging the result.',
      'Every one of the three steps is present here.',
    ],
    explain:
      'Setup (A), perform (B), check (C). Being able to point at each line by name is what the question is really testing, and it is also how you write a test from scratch when the lab asks for one.',
    source: 'Quiz 2 Q2, applied',
  },
  {
    id: 'w2-nunit-package',
    conceptId: 'nunit',
    question: 'Which unit-testing framework is the C# / .NET one?',
    options: ['NUnit', 'JUnit', 'CPPUnit', 'DocTest'],
    answer: 0,
    why: ['', 'JUnit is the Java one.', 'CPPUnit is the C++ one.', 'DocTest is mainly C++ and Python.'],
    explain:
      'The family shares a design, and the exam likes testing that you know which member goes with which language: NUnit → C#/.NET, JUnit → Java, CPPUnit → C++.',
    source: 'Quiz 2 Q9',
  },
  {
    id: 'w2-testfixture',
    conceptId: 'nunit',
    question: 'Which NUnit attribute marks a **class** as containing unit tests?',
    options: ['`[TestFixture]`', '`[Test]`', '`[TestMethod]`', '`[Assert]`'],
    answer: 0,
    why: [
      '',
      '`[Test]` marks an individual test *method*, not the class holding them.',
      '`[TestMethod]` is MSTest\'s attribute, not NUnit\'s.',
      '`Assert` is a class you call inside a test, not an attribute at all.',
    ],
    explain:
      '`[TestFixture]` on the class, `[Test]` on each method. Swapping the two is on Quiz 2\'s own trap list.',
    source: 'Quiz 2 Q13',
  },
  {
    id: 'w2-assert-bool',
    conceptId: 'nunit',
    question: 'Which Assert method best verifies a boolean condition?',
    options: [
      '`Assert.IsTrue()`',
      '`Assert.AreEqual()`',
      '`Assert.IsNotNull()`',
      '`Assert.Pass()`',
    ],
    answer: 0,
    why: [
      '',
      '`AreEqual` compares two values. It works for booleans but says less about intent than `IsTrue`.',
      '`IsNotNull` checks a reference exists, which is a different question.',
      '`Assert.Pass()` ends the test as passed unconditionally — it verifies nothing.',
    ],
    explain:
      '`Assert.IsTrue(condition)` (and `IsFalse`) is the direct way to assert a boolean. Lab 4.2\'s `AreYou` tests are written exactly this way.',
    source: 'Quiz 2 Q4',
  },
  {
    id: 'w2-areequal',
    conceptId: 'nunit',
    question: 'What does `Assert.AreEqual(expected, actual)` do?',
    options: [
      'Fails the test unless the two values are equal',
      'Assigns `expected` to `actual`',
      'Prints both values to the console',
      'Checks that the two variables are the same object in memory',
    ],
    answer: 0,
    why: [
      '',
      'An assertion never changes the thing it is inspecting.',
      'It prints a message only on failure, as part of the report.',
      'That is reference equality — `Assert.AreSame` does that. `AreEqual` compares values.',
    ],
    explain:
      'Expected first, actual second. The order does not change pass or fail, but it does decide which way round the failure message reads.',
    source: 'Quiz 2 Q8',
  },
  {
    id: 'w2-assert-purpose',
    conceptId: 'nunit',
    question: 'What is the `Assert` class for?',
    options: [
      'Verifying that the code under test behaves as expected',
      'Creating the objects a test needs',
      'Reporting how long each test took',
      'Marking which methods are tests',
    ],
    answer: 0,
    why: [
      '',
      'That is the setup step, written in ordinary C#.',
      'Timing is the runner\'s job, not `Assert`\'s.',
      'That is what the `[Test]` attribute does.',
    ],
    explain:
      '`Assert` provides `AreEqual`, `IsTrue`, `IsNotNull` and friends. A false condition fails the assertion, and a failed assertion fails the test.',
    source: 'Quiz 2 Q15',
  },
  {
    id: 'w2-test-trace',
    conceptId: 'nunit',
    code: `public void TestDivision()
{
    bool isEven = (7 % 2 == 0);
    Assert.IsTrue(isEven, "The number is even");
}`,
    question: 'Does this test pass or fail?',
    options: [
      'Fail — `7 % 2` is 1, so `isEven` is false',
      'Pass — `7 % 2` is 0, so `isEven` is true',
      'Fail — the message argument is not allowed',
      'Pass — the message argument makes the assertion succeed',
    ],
    answer: 0,
    why: [
      '',
      '`%` is the remainder operator, not division: 7 divided by 2 leaves 1.',
      'A message is a perfectly legal second argument, and is shown when the assertion fails.',
      'The message never changes the outcome — it only explains it.',
    ],
    explain:
      '`7 % 2 == 1`, so `isEven` is `false`, and `Assert.IsTrue(false)` fails. Confusing `%` with `/` is on the trap list for a reason.',
    source: 'Quiz 2 Q7',
  },

  // ------------------------------------------------------------ UML
  {
    id: 'w2-class-diagram',
    conceptId: 'uml-class',
    question: 'Which UML diagram shows a class\'s detailed structure?',
    options: ['Class diagram', 'Sequence diagram', 'Use case diagram', 'Activity diagram'],
    answer: 0,
    why: [
      '',
      'A sequence diagram shows interactions between objects **over time**, not the structure of one class.',
      'A use case diagram shows what actors want from the system, at a much coarser grain.',
      'An activity diagram shows a workflow, not a class\'s members.',
    ],
    explain:
      'The class diagram is the static-structure diagram: classes, their attributes, their methods, and the relationships between them.',
    source: 'Quiz 2 Q5',
  },
  {
    id: 'w2-private-symbol',
    conceptId: 'uml-class',
    question: 'Which symbol denotes a **private** attribute in a UML class diagram?',
    options: ['`-`', '`+`', '`#`', '`~`'],
    answer: 0,
    why: ['', '`+` is public.', '`#` is protected.', '`~` is package / internal.'],
    explain:
      'Minus for private, plus for public, hash for protected, tilde for internal. Reading `-` as subtraction is the classic first-week mistake.',
    source: 'Quiz 2 Q17',
  },
  {
    id: 'w2-uml-compartments',
    conceptId: 'uml-class',
    question: 'What do the three compartments of a UML class box hold, top to bottom?',
    options: [
      'Class name, attributes, methods',
      'Class name, methods, attributes',
      'Attributes, methods, relationships',
      'Class name, constructors, everything else',
    ],
    answer: 0,
    why: [
      '',
      'Attributes come first — what it knows, then what it does.',
      'Relationships are drawn as lines *between* boxes, never inside one.',
      'Constructors sit with the other methods; they get no compartment of their own.',
    ],
    explain:
      'Name, then attributes, then methods. The lab is graded on producing these, so the order matters as much as the content.',
    source: 'Lecture 2, basic UML class diagrams',
  },
  {
    id: 'w2-uml-purpose',
    conceptId: 'uml-purpose',
    question: 'What is the primary purpose of UML in application development?',
    options: [
      'To visualise and document the design of the application',
      'To generate the finished source code automatically',
      'To test the application for bugs',
      'To measure the application\'s runtime performance',
    ],
    answer: 0,
    why: [
      '',
      'Some tools can scaffold code from a diagram, but that is not what UML is *for* — it is a notation for design.',
      'Testing is what NUnit does.',
      'UML says nothing about performance.',
    ],
    explain:
      'UML is a standardised way to diagram a system so designs can be discussed and documented before and alongside the code.',
    source: 'Quiz 2 Q6',
  },
  {
    id: 'w2-structure-diagrams',
    conceptId: 'uml-purpose',
    question: 'What do UML **structure** diagrams describe?',
    options: [
      'The static structure and relationships of the system',
      'How objects message each other over time',
      'The order a user performs tasks in',
      'How the program allocates memory at runtime',
    ],
    answer: 0,
    why: [
      '',
      'That is a **behaviour** diagram — the sequence diagram is the Week 3 example.',
      'That is closer to an activity or use case diagram.',
      'No UML diagram describes memory allocation.',
    ],
    explain:
      'UML splits into structure diagrams (class, component, deployment — the static layout) and behaviour diagrams (sequence, activity, state — what happens over time). Knowing which side a diagram sits on is a common exam question.',
    source: 'Quiz 2 Q18',
  },

  // ------------------------------------------- framework and collections
  {
    id: 'w2-bcl-def',
    conceptId: 'bcl',
    question: 'What is the .NET Base Class Library?',
    options: [
      'A set of reusable classes, interfaces and value types providing fundamental functionality',
      'The compiler that turns C# into machine code',
      'The base class every C# class must inherit from',
      'A package manager for downloading third-party libraries',
    ],
    answer: 0,
    why: [
      '',
      'That is the compiler and runtime, which are separate from the library they ship beside.',
      'Every class does implicitly derive from `object`, but a single base class is not what "Base Class Library" names.',
      'That is NuGet.',
    ],
    explain:
      'The BCL is the standard library: file I/O, collections, dates, drawing, networking. It exists so nobody rewrites a list or a file reader ever again.',
    source: 'Quiz 2 Q10 and Q11',
  },
  {
    id: 'w2-bcl-benefit',
    conceptId: 'bcl',
    question: 'What does the BCL give you in practice?',
    options: [
      'Optimised, ready-made code for common tasks like file handling and collections',
      'Automatic generation of your UML diagrams',
      'A guarantee that your code has no bugs',
      'Faster compilation of your own classes',
    ],
    answer: 0,
    why: [
      '',
      'Some IDEs do that; it is not a library feature.',
      'Nothing guarantees that. The BCL only means the *library* code is well tested.',
      'Compilation speed is unrelated.',
    ],
    explain:
      'Many programs need the same kinds of objects. The BCL means nobody writes a list, a date or a file reader again — and the version you get has been tested by millions of programs.',
    source: 'Quiz 2 Q11',
  },
  {
    id: 'w2-list-add',
    conceptId: 'collections',
    code: `List<int> numbers = new List<int>();`,
    question: 'How do you append `10` to this list?',
    options: [
      '`numbers.Add(10);`',
      '`numbers.Append(10);`',
      '`numbers[0] = 10;`',
      '`numbers.Push(10);`',
    ],
    answer: 0,
    why: [
      '',
      '`Append` exists on LINQ sequences and returns a new sequence; it does not modify the list.',
      'Indexed assignment replaces an element that already exists. On an empty list it throws.',
      '`Push` belongs to `Stack<T>`.',
    ],
    explain:
      '`List<T>.Add()` appends to the end and grows the list as needed. That growth is exactly why a list lives on the heap.',
    source: 'Quiz 2 Q12',
  },
  {
    id: 'w2-dictionary-when',
    conceptId: 'collections',
    question: 'When should you prefer a `Dictionary<K,V>` over a `List<T>`?',
    options: [
      'When you need to look items up by a unique key',
      'When you need the items to stay in insertion order',
      'When you only ever add to the end',
      'When the collection holds fewer than ten items',
    ],
    answer: 0,
    why: [
      '',
      'Order is exactly what a `List` gives you and a `Dictionary` does not promise.',
      'Appending is a `List`\'s strength; nothing about it calls for a dictionary.',
      'Size is not the deciding factor — how you *reach* the items is.',
    ],
    explain:
      'A `Dictionary` stores key–value pairs and finds one by key in roughly constant time. A `List` has to scan, unless you already know the integer index.',
    source: 'Quiz 2 Q16',
  },
  {
    id: 'w2-collection-choice',
    conceptId: 'collections',
    stretch: true,
    question:
      'Swin Adventure\'s `Inventory` holds items the player picks up, and the player fetches one by typing its name. Which collection fits, and why?',
    options: [
      'Either works, but a `List<Item>` is what the lab uses — items are few and each `Item` already knows its own identifiers',
      'A `Dictionary<string, Item>`, because a `List` cannot be searched at all',
      'An array, because the number of items never changes',
      'A `Stack<Item>`, because the last item picked up is the first one used',
    ],
    answer: 0,
    why: [
      '',
      'A `List` searches fine — `Fetch` just walks it calling `AreYou`. The dictionary\'s advantage is speed at scale, which a handful of items does not need.',
      'The whole point of an inventory is that things are added and removed while the game runs, so a fixed array is wrong.',
      'Nothing in the spec says items are used in reverse order of pickup.',
    ],
    explain:
      'A real design question rather than a keyword one: the lookup key here is not a plain string but "does this item answer to that identifier", which is `Item`\'s own job. That is why `Inventory` keeps a `List<Item>` and asks each one, instead of a dictionary keyed on a single name.',
    source: 'Lecture 2 collections + Lab 4.2 Inventory',
  },

  // Third questions — see the note in week1.ts for why every concept has one.
  {
    id: 'w2-bcl-examples',
    conceptId: 'bcl',
    question: 'Which of these comes from the .NET Base Class Library?',
    options: ['`List<T>`', '`Inventory`', '`SplashKit`', '`NUnit`'],
    answer: 0,
    why: [
      '',
      'That is a class you write yourself in Lab 4.2.',
      'SplashKit is a third-party library added to the project, not part of .NET.',
      'NUnit is also a package you install — a very common one, but not the BCL.',
    ],
    explain:
      'The BCL is what arrives with the framework itself: collections, file I/O, dates, strings. Anything you install or write is not part of it.',
    source: 'Lecture 2, framework classes',
  },
  {
    id: 'w2-missing-check',
    conceptId: 'test-anatomy',
    code: `[Test]
public void TestReset()
{
    Counter c = new Counter();
    c.Increment();
    c.Reset();
}`,
    question: 'What is wrong with this test?',
    options: [
      'It never checks anything, so it passes whatever `Reset` does',
      'It is missing the `[TestFixture]` attribute',
      'It performs two operations, and a test may only perform one',
      'Nothing — running without throwing is enough',
    ],
    answer: 0,
    why: [
      '',
      '`[TestFixture]` goes on the class, and would be a separate problem from this one.',
      'A test may do as much setup and performing as the scenario needs.',
      'A test with no assertion passes as long as nothing throws, which means it is not testing anything.',
    ],
    explain:
      'Setup and perform are here; **check** is missing. Without `Assert.AreEqual(0, c.Count)` the test would keep passing even if `Reset` did nothing at all.',
    source: 'Quiz 2 Q2 and Q15, applied',
  },
  {
    id: 'w2-which-diagram',
    conceptId: 'uml-purpose',
    question:
      'You want to document the order in which `Game`, `Deck` and `Player` call each other while a hand is dealt. Which diagram?',
    options: [
      'A sequence diagram — a behaviour diagram',
      'A class diagram — a structure diagram',
      'A component diagram',
      'A deployment diagram',
    ],
    answer: 0,
    why: [
      '',
      'A class diagram shows what the classes *are*, not the order they talk in.',
      'A component diagram shows how the system is packaged — also structure.',
      'A deployment diagram shows what runs on which machine.',
    ],
    explain:
      'Anything about **order or time** is a behaviour diagram; anything about **what exists and how it is connected** is a structure diagram. Three of these four are structure.',
    source: 'Quiz 2 Q18, applied',
  },

  // ==========================================================================
  // Depth pass — the same Quiz 2 material asked more ways.
  //
  // Week 2 is the week most likely to be under-revised, because no lab needed
  // NUnit and no lab needed a Dictionary: it is examined but never typed. So
  // these lean on recognition — of an attribute, of an Assert method, of a
  // visibility symbol in a class box — which is exactly what a closed-book
  // multiple-choice paper can test and a lab cannot.
  // ==========================================================================

  // --------------------------------------------------------- why unit test
  {
    id: 'w2-test-isolation',
    conceptId: 'unit-test-why',
    question: 'What does it mean to test a unit "in isolation"?',
    options: [
      'The test exercises one class or method on its own, not the whole application end to end',
      'The test must be run on a machine with no network connection',
      'Only one test may run at a time',
      'The class being tested must have no fields',
    ],
    answer: 0,
    why: [
      '',
      'Nothing to do with the machine. Isolation is about how much of *your* code the test involves.',
      'Test runners happily run hundreds, and NUnit reports them individually.',
      'Fields are fine — the test sets them up and then checks the result.',
    ],
    explain:
      'Isolation is what makes a failure informative: when one small test fails, the fault is in the small thing it covered, and you are not hunting through the whole program.',
    source: 'Quiz 2 Q3',
  },
  {
    id: 'w2-cost-curve',
    conceptId: 'unit-test-why',
    question: 'Why is catching a bug during unit testing cheaper than catching it after release?',
    options: [
      'The code is still fresh, the fault is localised, and nothing has been built on top of it yet',
      'Unit tests are free to run and production servers are not',
      'Bugs found later are always more serious bugs',
      'The compiler charges for late fixes',
    ],
    answer: 0,
    why: [
      '',
      'Running cost is trivial either way. The cost being talked about is developer effort.',
      'Severity is unrelated to when it is found — the *cost of fixing* is what rises.',
      'Not a thing.',
    ],
    explain:
      'Early detection reduces the cost and effort of fixing. After release you also pay for reproduction, support, a patch release and everything that was built assuming the broken behaviour.',
    source: 'Quiz 2 Q14',
  },
  {
    id: 'w2-tdd-order',
    conceptId: 'unit-test-why',
    question: 'In test-driven development, what is the order of work?',
    options: [
      'Write a failing test, write just enough code to pass it, then tidy up',
      'Write the whole class, then write tests for it, then ship',
      'Write the tests after release, once bugs are reported',
      'Write tests only for the parts that turned out to be buggy',
    ],
    answer: 0,
    why: [
      '',
      'That is the ordinary order, which is fine — but it is not TDD.',
      'That is no testing strategy at all.',
      'That is regression testing after the fact, again not TDD.',
    ],
    explain:
      'Writing the test first forces you to state what "working" means before you can be tempted to define it as "what my code happens to do".',
    source: 'Quiz 2 Q19',
  },
  {
    id: 'w2-tests-not-only-after',
    conceptId: 'unit-test-why',
    question: 'True or false: unit tests are only useful once the application has been developed.',
    options: ['False', 'True'],
    answer: 0,
    why: ['', 'Tests written before or during development define the expected behaviour, which is the whole idea behind TDD.'],
    explain:
      'Tests can be written before the code, during it, or after it. Written first they are a specification; written after they are a safety net. Both are useful.',
    source: 'Quiz 2 Q19',
  },
  {
    id: 'w2-many-tests-one-class',
    conceptId: 'unit-test-why',
    question:
      'A `Counter` class has `Increment()`, `Reset()` and a `Count` property. How many unit tests should it have?',
    options: [
      'As many as it takes to cover each behaviour and its edge cases — typically several',
      'Exactly one, because a class may only have one test',
      'Exactly three, one per member',
      'None — properties cannot be tested',
    ],
    answer: 0,
    why: [
      '',
      'The one-test-per-class idea is a Quiz 2 trap. There is no such limit.',
      'A useful count, but not a rule: `Increment()` alone deserves a test for one call and one for several.',
      'A property is read in a test exactly like a field, and Lab 2 does precisely that.',
    ],
    explain:
      'One test per *behaviour you care about*, not per class and not per member. Lab 2\'s `Counter` gets tests for a fresh counter, one increment, several increments, and reset.',
    source: 'Quiz 2 Q1 · Lab 2 Task 2.1',
  },
  {
    id: 'w2-test-what-it-proves',
    conceptId: 'unit-test-why',
    question: 'A test suite passes. What has that actually proved?',
    options: [
      'The behaviours the tests describe are working — nothing about behaviours nobody tested',
      'The program has no bugs',
      'Every method in the project runs correctly',
      'The design is correct',
    ],
    answer: 0,
    why: [
      '',
      'Passing tests are evidence about the cases covered, never proof of the absence of bugs.',
      'Only the ones a test actually calls.',
      'Tests check behaviour, not whether the class breakdown was a good idea.',
    ],
    explain:
      'A test suite is exactly as good as the cases in it. That is why "how many tests" is really the question "what could go wrong here".',
    source: 'Quiz 2 Q3, applied',
    stretch: true,
  },

  // ------------------------------------------------------- test anatomy
  {
    id: 'w2-aaa-names',
    conceptId: 'test-anatomy',
    question: 'The three steps of a unit test — setup, perform, check — are also known as…',
    options: [
      'Arrange, Act, Assert',
      'Compile, Link, Run',
      'Input, Process, Output',
      'Given, Because, Therefore',
    ],
    answer: 0,
    why: [
      '',
      'Those are build stages, not test structure.',
      'A description of any program at all, not of a test.',
      'Close to BDD\'s "given/when/then" but not the pattern named in the material.',
    ],
    explain:
      'Setup the object, perform the operation, check the result. Every test in this unit has these three parts in this order.',
    source: 'Quiz 2 Q2',
  },
  {
    id: 'w2-identify-setup',
    conceptId: 'test-anatomy',
    code: `[Test]
public void TestIncrement()
{
    Counter c = new Counter("test");
    c.Increment();
    Assert.AreEqual(1, c.Count);
}`,
    question: 'Which line is the **setup** step?',
    options: [
      '`Counter c = new Counter("test");`',
      '`c.Increment();`',
      '`Assert.AreEqual(1, c.Count);`',
      '`[Test]`',
    ],
    answer: 0,
    why: [
      '',
      'That is the *perform* step — the operation being tested.',
      'That is the *check* step.',
      'That is an attribute telling NUnit this method is a test, not one of the three steps.',
    ],
    explain:
      'Setup puts the object in a known state, perform does the one thing under test, check states what should now be true. Three lines, three jobs.',
    source: 'Quiz 2 Q2 · Lab 2 Task 2.1',
  },
  {
    id: 'w2-test-one-thing',
    conceptId: 'test-anatomy',
    question: 'Why does a unit test usually perform just one operation before asserting?',
    options: [
      'So that when it fails, you know which operation broke',
      'Because NUnit only allows one method call per test',
      'Because more than one call makes the test run too slowly',
      'Because `Assert` may only be called once per test',
    ],
    answer: 0,
    why: [
      '',
      'There is no such limit — a test that increments three times is completely normal.',
      'Speed is not a consideration at this scale.',
      'Multiple asserts in one test are allowed, though each extra one is another reason the test could fail.',
    ],
    explain:
      'A focused test is a diagnosis. A test that does eight things and fails tells you only that one of eight things is wrong.',
    source: 'Quiz 2 Q2, applied',
  },
  {
    id: 'w2-missing-perform',
    conceptId: 'test-anatomy',
    code: `[Test]
public void TestReset()
{
    Counter c = new Counter("test");
    Assert.AreEqual(0, c.Count);
}`,
    question: 'What is wrong with this test, given its name?',
    options: [
      'It never calls `Reset()` — the perform step is missing, so it tests the constructor instead',
      'It is missing the `[TestFixture]` attribute',
      '`Assert.AreEqual` has its arguments the wrong way round',
      'Nothing — it will pass',
    ],
    answer: 0,
    why: [
      '',
      '`[TestFixture]` goes on the *class*, and this is a method. It may well be there already.',
      '`AreEqual(expected, actual)` is the correct order, and this matches it.',
      'It will pass — which is the problem. A test that passes without exercising `Reset()` proves nothing about `Reset()`.',
    ],
    explain:
      'A test that skips the perform step is worse than no test: it reports green for code it never ran.',
    source: 'Quiz 2 Q2, applied',
    stretch: true,
  },
  {
    id: 'w2-arrange-fresh',
    conceptId: 'test-anatomy',
    question: 'Why does each test usually construct its own fresh object in the setup step?',
    options: [
      'So one test cannot leave state behind that changes the result of another',
      'Because objects can only be used once',
      'Because NUnit deletes objects between assertions',
      'To make the test file longer and more thorough',
    ],
    answer: 0,
    why: [
      '',
      'Objects can be used as often as you like.',
      'NUnit does not touch your objects; the garbage collector reclaims them when nothing references them.',
      'Length is not a virtue.',
    ],
    explain:
      'Shared, mutated state is how a test suite becomes order-dependent — passing on your machine and failing in the marker\'s. A fresh object per test removes the possibility.',
    source: 'Quiz 2 Q2, applied',
  },

  // ------------------------------------------------------------------ NUnit
  {
    id: 'w2-test-attribute',
    conceptId: 'nunit',
    question: 'Which NUnit attribute marks a single test **method**?',
    options: ['`[Test]`', '`[TestFixture]`', '`[TestMethod]`', '`[Assert]`'],
    answer: 0,
    why: [
      '',
      'That one marks the **class** that contains the tests.',
      '`[TestMethod]` is MSTest\'s attribute, not NUnit\'s. The two frameworks are deliberately offered together as distractors.',
      '`Assert` is a class you call, not an attribute you write above a method.',
    ],
    explain:
      '`[TestFixture]` on the class, `[Test]` on each method. Being able to say which goes where is a standard Quiz 2 question.',
    source: 'Quiz 2 Q13',
  },
  {
    id: 'w2-nunit-vs-junit',
    conceptId: 'nunit',
    question: 'Which framework goes with which language?',
    options: [
      'NUnit → C#, JUnit → Java, CPPUnit → C++',
      'NUnit → Java, JUnit → C#, CPPUnit → Python',
      'NUnit → C++, JUnit → C#, CPPUnit → Java',
      'All three work with any .NET language',
    ],
    answer: 0,
    why: [
      '',
      'Reversed. The `N` in NUnit is for .NET; the `J` in JUnit is for Java.',
      'Also reversed, and CPPUnit is C++ by name.',
      'Only NUnit (and MSTest, and xUnit) target .NET.',
    ],
    explain:
      'The naming is the mnemonic: N for .NET, J for Java, CPP for C++. They are all descendants of the same xUnit design, which is why they look so similar.',
    source: 'Quiz 2 Q9',
  },
  {
    id: 'w2-assert-areequal-order',
    conceptId: 'nunit',
    code: `Assert.AreEqual(3, counter.Count);`,
    question: 'Which argument is the expected value and which is the actual one?',
    options: [
      '`3` is expected, `counter.Count` is actual',
      '`counter.Count` is expected, `3` is actual',
      'The order does not matter at all',
      'Both are expected; the actual value is inferred',
    ],
    answer: 0,
    why: [
      '',
      'Reversed. The signature is `AreEqual(expected, actual)`.',
      'It compiles and passes or fails identically either way — but the **failure message** says "Expected: … But was: …", and swapped arguments make that message lie.',
      'There is no inference; you pass both.',
    ],
    explain:
      'Expected first, actual second. The only thing it changes is the failure message, and the failure message is the entire reason to run the test.',
    source: 'Quiz 2 Q8',
    stretch: true,
  },
  {
    id: 'w2-assert-choose',
    conceptId: 'nunit',
    question:
      'You want to check that `account.IsOverdrawn` is `false`. Which assertion says that most directly?',
    options: [
      '`Assert.IsFalse(account.IsOverdrawn);`',
      '`Assert.AreEqual(account.IsOverdrawn, false);`',
      '`Assert.IsNotNull(account.IsOverdrawn);`',
      '`Assert.Fail(account.IsOverdrawn);`',
    ],
    answer: 0,
    why: [
      '',
      'It works, but the arguments are the wrong way round *and* a boolean-specific assertion reads better.',
      '`IsNotNull` checks a reference exists. A `bool` is never null.',
      '`Assert.Fail` unconditionally fails the test — it is for unreachable branches.',
    ],
    explain:
      '`IsTrue` / `IsFalse` for booleans, `AreEqual` for values, `IsNull` / `IsNotNull` for references. Choosing the specific one makes the failure message specific too.',
    source: 'Quiz 2 Q4',
  },
  {
    id: 'w2-assert-fails-what-happens',
    conceptId: 'nunit',
    question: 'What happens to a test method when one of its assertions fails?',
    options: [
      'That test is reported as failed and its remaining lines do not run',
      'The whole test run stops immediately',
      'The assertion is skipped and the test carries on to the next line',
      'The test is reported as passed with a warning',
    ],
    answer: 0,
    why: [
      '',
      'Other tests still run — that is why a run can report "3 failed, 27 passed".',
      'A failed assertion throws, so nothing after it in that method executes.',
      'A failed assertion is a failure, never a warning.',
    ],
    explain:
      'An assertion failure throws an exception that NUnit catches and records against that one test. It is why a second assert after a failed one tells you nothing.',
    source: 'Quiz 2 Q15, applied',
  },
  {
    id: 'w2-modulo-trace',
    conceptId: 'nunit',
    code: `[Test]
public void TestEven()
{
    bool isEven = (9 % 2 == 0);
    Assert.IsTrue(isEven, "The number is even");
}`,
    question: 'Does this test pass or fail?',
    options: [
      'Fail — `9 % 2` is `1`, so `isEven` is `false`',
      'Pass — 9 divided by 2 has no remainder',
      'Fail — the message argument is not allowed',
      'Pass — the message makes the assertion true',
    ],
    answer: 0,
    why: [
      '',
      '`%` is the **remainder** operator, and 9 leaves 1.',
      'A message is an optional second argument, and it is good practice.',
      'The message is only shown *when it fails*. It cannot change the outcome.',
    ],
    explain:
      '`Assert.IsTrue(false)` fails. The message is what you read in the report afterwards — it never affects whether the assertion holds.',
    source: 'Quiz 2 Q7, varied',
  },
  {
    id: 'w2-assert-purpose-2',
    conceptId: 'nunit',
    question: 'What is the `Assert` class for?',
    options: [
      'Verifying that the code under test behaved as expected, and failing the test when it did not',
      'Printing debug output while the program runs',
      'Creating the objects a test needs',
      'Marking which classes contain tests',
    ],
    answer: 0,
    why: [
      '',
      'That is `Console.WriteLine`, and output alone never fails a test.',
      'That is the setup step, written with ordinary `new`.',
      'That is `[TestFixture]`.',
    ],
    explain:
      'Without an `Assert`, a test only proves the code did not crash. The assertion is what turns running the code into checking it.',
    source: 'Quiz 2 Q15',
  },

  // ---------------------------------------------------- UML class diagrams
  {
    id: 'w2-uml-symbols-table',
    conceptId: 'uml-class',
    question: 'In a UML class diagram, what does `#` before a member mean?',
    options: ['Protected', 'Private', 'Public', 'Static'],
    answer: 0,
    why: [
      '',
      'Private is `-`.',
      'Public is `+`.',
      'Static is shown by <u>underlining</u> the member, not by a prefix symbol.',
    ],
    explain: 'The four to know: `+` public, `-` private, `#` protected, `~` internal/package.',
    source: 'Quiz 2 Q17, table',
  },
  {
    id: 'w2-uml-read-box',
    conceptId: 'uml-class',
    code: `+---------------------------+
|          Counter          |
+---------------------------+
| - _count : int            |
| - _name : string          |
+---------------------------+
| + Increment() : void      |
| + Reset() : void          |
| + Count : int  <<get>>    |
+---------------------------+`,
    question: 'Reading this class box, which statement is true?',
    options: [
      '`_count` is private and `Increment()` is public',
      '`_count` is public and `Increment()` is private',
      'Both `_count` and `Increment()` are private',
      'The diagram does not show visibility',
    ],
    answer: 0,
    why: [
      '',
      'Reversed — `-` is private and `+` is public.',
      '`Increment()` carries a `+`.',
      'The prefix symbols are exactly how visibility is shown.',
    ],
    explain:
      'Hidden data, public behaviour — an encapsulated class has a `-` compartment above a `+` compartment, and you can see the design at a glance.',
    source: 'Quiz 2 Q17 · Lab 2 Task 2.1 UML',
  },
  {
    id: 'w2-uml-compartment-order',
    conceptId: 'uml-class',
    question: 'What do the three compartments of a UML class box hold, top to bottom?',
    options: [
      'Class name, attributes, methods',
      'Class name, methods, attributes',
      'Attributes, methods, relationships',
      'Package, class name, constructor',
    ],
    answer: 0,
    why: [
      '',
      'The order is fixed, and attributes come first.',
      'Relationships are drawn as lines *between* boxes, not inside one.',
      'Constructors sit in the methods compartment like any other operation.',
    ],
    explain:
      'Name, then what it knows, then what it does — the same knows/does split as the class itself, drawn top to bottom.',
    source: 'Lecture 2, UML class diagrams',
  },
  {
    id: 'w2-uml-type-notation',
    conceptId: 'uml-class',
    question: 'How is the type of an attribute written in UML?',
    options: [
      'After the name, following a colon: `- _count : int`',
      'Before the name, as in C#: `- int _count`',
      'In brackets after the name: `- _count (int)`',
      'Types are not shown in class diagrams',
    ],
    answer: 0,
    why: [
      '',
      'That is C# order. UML deliberately puts the name first because the name is what a reader is looking for.',
      'Not UML notation.',
      'They are shown, in the attributes and the return position of operations.',
    ],
    explain:
      'Name first, type after a colon — for attributes and for the return type of an operation: `+ Area() : double`.',
    source: 'Lecture 2, UML class diagrams',
  },
  {
    id: 'w2-uml-static-underline',
    conceptId: 'uml-class',
    question: 'How does a UML class diagram show that a member is static?',
    options: [
      'The member is underlined',
      'The member is written in italics',
      'The member is prefixed with `$`',
      'Static members are omitted from class diagrams',
    ],
    answer: 0,
    why: [
      '',
      'Italics mean **abstract** — a class name in italics is an abstract class. That matters in Week 4.',
      'That is a UML profile convention from other tools, not standard UML.',
      'They are shown like any other member, just underlined.',
    ],
    explain:
      'Underline = static, *italics* = abstract. Two formatting conventions that carry real meaning and are easy to overlook.',
    source: 'Lecture 2, UML notation',
    stretch: true,
  },
  {
    id: 'w2-uml-what-it-is-not',
    conceptId: 'uml-class',
    question: 'Which of these does a **class diagram** not show?',
    options: [
      'The order in which methods are called at runtime',
      'The attributes of each class',
      'The visibility of each member',
      'The relationships between classes',
    ],
    answer: 0,
    why: [
      '',
      'The second compartment is exactly that.',
      'The `+`/`-`/`#` prefixes.',
      'Drawn as lines: association, aggregation, inheritance and so on.',
    ],
    explain:
      'A class diagram is a **structure** diagram — a snapshot of the design with no time axis. Call order is what a **sequence** diagram is for, which is Week 3.',
    source: 'Quiz 2 Q5 with Quiz 3 Q9',
  },
  {
    id: 'w2-uml-from-code',
    conceptId: 'uml-class',
    code: `public class Account
{
    private double _balance;
    public double Balance { get { return _balance; } }
    public void Deposit(double amount) { }
}`,
    question: 'Which class box matches this code?',
    options: [
      '`- _balance : double`, `+ Balance : double`, `+ Deposit(amount : double) : void`',
      '`+ _balance : double`, `- Balance : double`, `- Deposit(amount : double) : void`',
      '`- _balance : double`, `- Balance : double`, `- Deposit() : double`',
      '`+ Account : class`, `+ balance`, `+ deposit`',
    ],
    answer: 0,
    why: [
      '',
      'Every visibility is inverted.',
      '`Balance` and `Deposit` are both `public` in the code, and `Deposit` returns `void`.',
      'The class name belongs in the top compartment, not the attribute list, and the casing has been changed.',
    ],
    explain:
      'Translating between code and a class box in both directions is the skill Lab 2 marks and the paper can ask about — visibility, name, type, in that layout.',
    source: 'Lab 2 Task 2.1 · Quiz 2 Q17',
  },

  // -------------------------------------------------------- what UML is for
  {
    id: 'w2-uml-audience',
    conceptId: 'uml-purpose',
    question: 'What is UML primarily for?',
    options: [
      'Visualising and documenting a design in a notation everyone reads the same way',
      'Generating the finished application automatically',
      'Measuring how fast the program runs',
      'Replacing the need to write code',
    ],
    answer: 0,
    why: [
      '',
      'Some tools generate skeletons, but that is a tool feature and not what UML is *for*.',
      'That is profiling, a runtime activity.',
      'A diagram is a plan. Someone still writes the code.',
    ],
    explain:
      'The value is the shared notation: a class box means the same thing to your tutor, your teammate and you in six months.',
    source: 'Quiz 2 Q6',
  },
  {
    id: 'w2-structure-vs-behaviour',
    conceptId: 'uml-purpose',
    question: 'Which pair correctly splits UML diagrams into their two families?',
    options: [
      'Structure diagrams show static layout; behaviour diagrams show what happens over time',
      'Structure diagrams show runtime interactions; behaviour diagrams show class layout',
      'Structure diagrams are for databases; behaviour diagrams are for code',
      'There is only one family — all UML diagrams are structure diagrams',
    ],
    answer: 0,
    why: [
      '',
      'Reversed. Interactions over time are behaviour.',
      'UML models software design; database schemas are ER diagrams.',
      'Sequence diagrams are behaviour diagrams, and Week 3 relies on them.',
    ],
    explain:
      'Class, component and deployment diagrams are structure. Sequence, activity and state diagrams are behaviour. This unit uses one from each family.',
    source: 'Quiz 2 Q18',
  },
  {
    id: 'w2-which-diagram-scenario',
    conceptId: 'uml-purpose',
    question:
      'You need to document which classes exist, what each holds, and how they are connected. Which diagram?',
    options: ['Class diagram', 'Sequence diagram', 'Deployment diagram', 'Activity diagram'],
    answer: 0,
    why: [
      '',
      'That shows messages between objects over time, not the class structure.',
      'That shows which hardware or process each component runs on.',
      'That shows a workflow of steps and decisions.',
    ],
    explain:
      'Structure question → structure diagram. "What exists and how is it connected" is precisely a class diagram.',
    source: 'Quiz 2 Q5',
  },
  {
    id: 'w2-diagram-for-interaction',
    conceptId: 'uml-purpose',
    question:
      'You need to document the order in which `Player`, `Inventory` and `Item` talk to each other while an item is picked up. Which diagram?',
    options: ['Sequence diagram', 'Class diagram', 'Component diagram', 'Object diagram'],
    answer: 0,
    why: [
      '',
      'It would show the three classes and their relationships, but nothing about order.',
      'That shows deployable units of the system, at a much coarser grain.',
      'That shows objects and their values at a single moment, still with no time axis.',
    ],
    explain:
      'The word "order" decides it. Anything with a time axis is a behaviour diagram, and the one this unit uses is the sequence diagram.',
    source: 'Quiz 2 Q18 with Quiz 3 Q9',
  },
  {
    id: 'w2-uml-before-code',
    conceptId: 'uml-purpose',
    question: 'Why draw a class diagram before writing the classes?',
    options: [
      'Relationships and responsibilities are far cheaper to move on a diagram than in code',
      'The compiler requires a diagram file',
      'A diagram runs faster than code',
      'It is the only way to find syntax errors',
    ],
    answer: 0,
    why: [
      '',
      'No compiler has ever asked for one.',
      'A diagram does not run at all.',
      'Syntax errors are a compiler\'s job, and a diagram has no syntax to get wrong in that sense.',
    ],
    explain:
      'Same argument as identifying relationships early: rework is cheapest before anything depends on the decision.',
    source: 'Quiz 2 Q6 with Quiz 3 Q16',
  },

  // ------------------------------------------------------------------- BCL
  {
    id: 'w2-bcl-what',
    conceptId: 'bcl',
    question: 'What is the .NET Base Class Library?',
    options: [
      'A set of reusable classes, interfaces and value types providing fundamental functionality',
      'The base class every C# class must inherit from',
      'The compiler that turns C# into machine code',
      'A library you have to download separately before using C#',
    ],
    answer: 0,
    why: [
      '',
      'That is `System.Object` — one class in the BCL, not the BCL itself. The similar name is the trap.',
      'That is the compiler, a separate part of the toolchain.',
      'It ships with .NET; there is nothing to fetch.',
    ],
    explain:
      'Foundational, ready-made, tested code for the things every program needs: collections, file I/O, strings, dates, maths.',
    source: 'Quiz 2 Q10',
  },
  {
    id: 'w2-bcl-why-use',
    conceptId: 'bcl',
    question: 'What is the practical argument for using a BCL class instead of writing your own?',
    options: [
      'It is already written, optimised and tested by people who do nothing else',
      'BCL classes cannot contain bugs',
      'Custom classes are not allowed in C#',
      'BCL classes run outside the garbage collector',
    ],
    answer: 0,
    why: [
      '',
      'They can and occasionally do — but far less often than a first attempt at the same thing.',
      'You write custom classes in every lab.',
      'They are ordinary managed objects, collected like everything else.',
    ],
    explain:
      'You would not write your own `List<T>`. The BCL is where the boring, universal, easy-to-get-subtly-wrong code has already been solved.',
    source: 'Quiz 2 Q11',
  },
  {
    id: 'w2-bcl-belongs',
    conceptId: 'bcl',
    question: 'Which of these is **not** part of what the BCL provides?',
    options: [
      'The classes your assignment defines, such as `Item` and `Inventory`',
      'File input and output',
      'Collections such as `List<T>` and `Dictionary<K,V>`',
      'Fundamental value types such as `int` and `double`',
    ],
    answer: 0,
    why: [
      '',
      'The `System.IO` namespace is part of it.',
      '`System.Collections.Generic` is part of it.',
      '`System.Int32` and `System.Double` are BCL types — `int` and `double` are just C# aliases for them.',
    ],
    explain:
      'The BCL is the library that comes *with* the platform. Your own domain classes sit on top of it.',
    source: 'Quiz 2 Q10, applied',
  },
  {
    id: 'w2-bcl-int-alias',
    conceptId: 'bcl',
    question: 'What is the relationship between `int` and `System.Int32`?',
    options: [
      '`int` is a C# alias for the BCL type `System.Int32` — the same type, two spellings',
      '`int` is faster because it avoids the BCL',
      '`System.Int32` is a class and `int` is a value type, so they behave differently',
      'They are unrelated types that happen to hold whole numbers',
    ],
    answer: 0,
    why: [
      '',
      'They compile to identical code; there is nothing to avoid.',
      'Both are `System.Int32`, which is a struct — a value type.',
      'They are literally the same type.',
    ],
    explain:
      'Even the primitives come from the library. It is a small thing, but it is why "everything in C# is an object" is closer to true than it first looks.',
    source: 'Lecture 2, framework classes',
    stretch: true,
  },

  // ---------------------------------------------------------- collections
  {
    id: 'w2-list-declare',
    conceptId: 'collections',
    question: 'Which line correctly creates an empty list of strings?',
    options: [
      '`List<string> names = new List<string>();`',
      '`List names = new List();`',
      '`string[] names = new List<string>();`',
      '`List<string> names = new string[0];`',
    ],
    answer: 0,
    why: [
      '',
      '`List<T>` is generic — it needs its element type in angle brackets on both sides.',
      'An array and a `List<string>` are different types; neither converts to the other implicitly.',
      'Same problem in the other direction.',
    ],
    explain:
      'The type argument in `List<string>` is what lets the compiler reject `names.Add(7)` before the program ever runs.',
    source: 'Quiz 2 Q12, applied',
  },
  {
    id: 'w2-list-vs-array',
    conceptId: 'collections',
    question: 'What does `List<T>` give you that a plain array does not?',
    options: [
      'It grows and shrinks as you add and remove items',
      'It can hold objects, which an array cannot',
      'It stores its items on the stack',
      'It guarantees the items stay sorted',
    ],
    answer: 0,
    why: [
      '',
      'Arrays hold objects perfectly well — `Shape[] shapes` is an array of objects.',
      'Both the list and its contents live on the heap. Week 3 covers why.',
      'Nothing sorts for you. `List<T>` keeps insertion order until you call `Sort()`.',
    ],
    explain:
      'A fixed size decided up front is the array\'s limitation. `Add` and `Remove` on a `List<T>` are why every lab in this unit uses one.',
    source: 'Lecture 2, framework classes',
  },
  {
    id: 'w2-dictionary-lookup',
    conceptId: 'collections',
    code: `Dictionary<string, double> prices = new Dictionary<string, double>();
prices["apple"] = 1.50;
Console.WriteLine(prices["apple"]);`,
    question: 'What is `"apple"` acting as here?',
    options: [
      'The key the value is stored and looked up under',
      'The index position in the collection, like `list[0]`',
      'The value being stored',
      'The name of the dictionary',
    ],
    answer: 0,
    why: [
      '',
      'A `List<T>` indexes by position. A `Dictionary` indexes by whatever key type you declared — here, a `string`.',
      '`1.50` is the value.',
      '`prices` is the variable name.',
    ],
    explain:
      '`Dictionary<K,V>` maps key → value. Reaching an item by a meaningful key rather than a position is the entire reason to choose one.',
    source: 'Quiz 2 Q16, applied',
  },
  {
    id: 'w2-collection-scenario-names',
    conceptId: 'collections',
    question:
      'You are storing every student\'s mark, and you need to look up one student\'s mark by their student ID. Which collection?',
    options: [
      '`Dictionary<string, double>` keyed on the ID',
      '`List<double>` in the order the students enrolled',
      '`List<string>` of ID and mark joined together',
      'Two parallel `List`s, one of IDs and one of marks',
    ],
    answer: 0,
    why: [
      '',
      'You would have to search the whole list to find a student, and enrolment order is not the ID.',
      'Now every read has to split the string back apart, and nothing prevents a malformed entry.',
      'It works until the two lists drift out of step, which is exactly the bug a dictionary makes impossible.',
    ],
    explain:
      'Look up by unique key → `Dictionary`. Iterate in order or reach by position → `List`. The question to ask is always "how will this be read?"',
    source: 'Quiz 2 Q16',
  },
  {
    id: 'w2-list-order-scenario',
    conceptId: 'collections',
    question:
      'A `Drawing` holds the shapes the user has added, and must draw them in the order they were added. Which collection?',
    options: [
      '`List<Shape>` — it preserves insertion order and can be iterated',
      '`Dictionary<int, Shape>` keyed on a counter',
      'A single `Shape` field, replaced each time',
      'An array sized 10, because a drawing rarely has more shapes than that',
    ],
    answer: 0,
    why: [
      '',
      'It would work, but you would be hand-maintaining an index that a list already gives you.',
      'That is Lab 4\'s starting point and precisely what Lab 5.1 replaces.',
      'The eleventh shape breaks it, and picking a magic number is the array problem in miniature.',
    ],
    explain:
      'Ordered, growable, iterated front to back — that is `List<T>`, and it is why `Drawing` in Lab 5 holds one.',
    source: 'Lab 5 Task 5.1 · Quiz 2 Q16',
  },
  {
    id: 'w2-list-add-method',
    conceptId: 'collections',
    question: 'Which is the correct way to append `10` to `List<int> numbers`?',
    options: ['`numbers.Add(10);`', '`numbers.Append(10);`', '`numbers[numbers.Count] = 10;`', '`numbers += 10;`'],
    answer: 0,
    why: [
      '',
      '`Append` exists in LINQ, but it returns a new sequence rather than changing the list — a different thing entirely.',
      'The indexer only *replaces* existing positions; assigning past the end throws.',
      '`+=` is not defined for `List<T>`.',
    ],
    explain:
      '`Add` for one item, `AddRange` for several, `Insert` for a specific position. `Add` is the one every lab uses.',
    source: 'Quiz 2 Q12',
  },
  {
    id: 'w2-dictionary-duplicate-key',
    conceptId: 'collections',
    question: 'What is true of the keys in a `Dictionary<K,V>`?',
    options: [
      'Each key is unique — adding the same key twice with `Add` throws',
      'Keys may repeat, like items in a list',
      'Keys must be integers',
      'Keys must be sorted before insertion',
    ],
    answer: 0,
    why: [
      '',
      'Uniqueness is the guarantee the fast lookup depends on.',
      'Any type can be a key — `string` keys are the most common.',
      'A `Dictionary` is unordered; `SortedDictionary` is the one that keeps order.',
    ],
    explain:
      'Unique keys are what make "give me the value for this key" a single unambiguous answer, and what makes it fast.',
    source: 'Quiz 2 Q16, applied',
    stretch: true,
  },
];
