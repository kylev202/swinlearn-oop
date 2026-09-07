/**
 * Week 2 revision notes — framework classes, unit testing, UML class diagrams.
 *
 * This is the week the lesson content deliberately skipped: Lab 2 needed
 * properties and a class diagram, so that is what `week2.ts` teaches, and the
 * collections and NUnit halves of Lecture 2 were never built into a lesson
 * (see src/content/SOURCES.md). Quiz 2 is nonetheless a third unit testing and
 * a third framework classes, so this page carries that material itself rather
 * than pointing at lessons that do not cover it.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK2: WeekNotes = {
  week: 2,
  title: 'Framework classes, unit testing, UML class diagrams',
  gist: 'The library you build on, the tests that prove you built it right, and the diagram you are graded on drawing.',
  sources: ['Lecture 2', 'Quiz 2'],
  sections: [
    {
      id: 'n2-bcl',
      title: 'The Base Class Library',
      concepts: ['bcl'],
      blocks: [
        {
          t: 'text',
          md: 'Many programs need the same kinds of objects — a list, a date, a file reader. The .NET **Base Class Library** is the set of reusable classes, interfaces and value types that ship with the framework and provide optimised code for those common tasks: file handling, collections, drawing utilities, networking.',
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'The exam phrasing is "a set of **reusable classes, interfaces and value types** that provide fundamental functionality". Not the compiler, not a package manager, not a base class you inherit from.',
        },
      ],
    },
    {
      id: 'n2-collections',
      title: 'List vs Dictionary',
      concepts: ['collections'],
      blocks: [
        {
          t: 'compare',
          left: {
            title: '`List<T>` — index based',
            tone: 'neutral',
            code: `List<int> numbers = new List<int>();
numbers.Add(10);
int first = numbers[0];`,
            md: 'Ordered, appended with `.Add()`, reached by integer index or by scanning. Searching for a value is $O(n)$.',
          },
          right: {
            title: '`Dictionary<K,V>` — key based',
            tone: 'neutral',
            code: `var ages = new Dictionary<string, int>();
ages["amy"] = 21;
int a = ages["amy"];`,
            md: 'Key–value pairs, reached by a unique key in roughly $O(1)$. No promise about order.',
          },
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'Choose a `Dictionary` **when you need lookups by a unique key**. That is the whole answer to Quiz 2 Q16.',
        },
        {
          t: 'callout',
          tone: 'trap',
          md: '`numbers.Append(10)` is not how you add to a list — that is a LINQ method returning a new sequence and leaving the list alone. `Push` belongs to `Stack<T>`.',
        },
      ],
    },
    {
      id: 'n2-testing-why',
      title: 'What a unit test is, and when to write one',
      concepts: ['unit-test-why', 'test-anatomy'],
      blocks: [
        {
          t: 'text',
          md: 'A **unit test** is a small, isolated test verifying that one unit of code — usually one method of one class — behaves as expected. Its value is that a failure points at one place.',
        },
        {
          t: 'table',
          caption: 'Three claims the quiz keeps making, and their truth values',
          headers: ['Claim', 'Verdict', 'Why'],
          rows: [
            ['Only one unit test can be written per class', '**False**', 'A `[TestFixture]` holds as many `[Test]` methods as the class has behaviours worth checking'],
            ['A unit test verifies functionality works as expected', '**True**', 'That is the definition'],
            ['Unit tests are only useful after development', '**False**', 'TDD writes the test first, so the test *is* the specification'],
          ],
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'Setup, perform, check',
          md: 'Every unit test has the same three steps: **set up** the object, **perform** the operation, **check** the result. Also known as Arrange–Act–Assert.',
        },
        {
          t: 'text',
          md: 'And the reason any of it is worth the effort: **catching an error early reduces the cost and effort of fixing it**. A bug caught by a test costs minutes; the same bug found after release costs orders of magnitude more.',
        },
      ],
    },
    {
      id: 'n2-nunit',
      title: 'NUnit: attributes and asserts',
      concepts: ['nunit'],
      blocks: [
        {
          t: 'code',
          caption: 'The whole anatomy in one fixture',
          code: `[TestFixture]                       // marks the CLASS
public class CounterTests
{
    [Test]                          // marks each METHOD
    public void TestIncrement()
    {
        Counter c = new Counter();  // setup
        c.Increment();              // perform
        Assert.AreEqual(1, c.Count);// check  (expected, actual)
    }
}`,
        },
        {
          t: 'table',
          headers: ['Language', 'Framework'],
          rows: [
            ['C# / .NET', '**NUnit**'],
            ['Java', 'JUnit'],
            ['C++', 'CPPUnit'],
          ],
        },
        {
          t: 'table',
          caption: 'The Assert methods worth knowing by name',
          headers: ['Method', 'Checks'],
          rows: [
            ['`Assert.AreEqual(expected, actual)`', 'The two values are equal'],
            ['`Assert.IsTrue(condition)` / `IsFalse`', 'A boolean condition — the direct choice for a boolean'],
            ['`Assert.IsNotNull(obj)`', 'A reference exists'],
            ['`Assert.AreSame(a, b)`', 'Both references point at the **same object**, not merely equal ones'],
          ],
        },
        {
          t: 'callout',
          tone: 'trap',
          md: '`[TestFixture]` marks the **class**; `[Test]` marks a **method**. `[TestMethod]` is MSTest, a different framework, and is always the wrong answer here.\n\nAnd `%` is remainder, not division: `7 % 2` is `1`, so `Assert.IsTrue(7 % 2 == 0)` **fails**.',
        },
      ],
    },
    {
      id: 'n2-uml',
      title: 'UML class diagrams',
      concepts: ['uml-class', 'uml-purpose'],
      blocks: [
        {
          t: 'text',
          md: 'UML is a standard notation for **visualising and documenting the design** of a system. It splits in two, and knowing which half a diagram belongs to is a recurring question:',
        },
        {
          t: 'compare',
          left: {
            title: 'Structure diagrams',
            tone: 'neutral',
            md: 'Static layout and relationships.\n\n**Class**, component, deployment.\n\nAnswers *what is there*.',
          },
          right: {
            title: 'Behaviour diagrams',
            tone: 'neutral',
            md: 'What happens over time.\n\n**Sequence**, activity, state.\n\nAnswers *what happens*.',
          },
        },
        {
          t: 'text',
          md: 'A class box has three compartments, top to bottom: **name**, **attributes**, **methods**. Relationships are drawn as lines between boxes, never inside one.',
        },
        {
          t: 'table',
          caption: 'Visibility symbols — worth memorising cold',
          headers: ['Symbol', 'Means'],
          rows: [['`-`', 'private'], ['`+`', 'public'], ['`#`', 'protected'], ['`~`', 'package / internal']],
        },
        {
          t: 'umlSpec',
          caption: 'What the notation is describing, drawn from real code',
          source: `public class Counter
{
    private int _count;
    private string _name;
    public Counter(string name) { }
    public string Name { get { return ""; } set { } }
    public int Ticks { get { return 0; } }
    public void Increment() { }
    public void Reset() { }
}`,
        },
      ],
    },
  ],
};
