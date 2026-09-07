/**
 * Week 5 revision notes — interfaces and exceptions.
 *
 * The last week on the paper, and the freshest, which is usually where the
 * cheap marks are. The midterm covers Week 1 to Week 5 and explicitly **not**
 * Week 6, so nothing here goes beyond what Lecture 5 taught.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK5: WeekNotes = {
  week: 5,
  title: 'Interfaces and exceptions',
  gist: 'Sharing capability between unrelated classes, and what happens when something goes wrong at runtime.',
  sources: ['Lecture 5', 'Quiz 5'],
  sections: [
    {
      id: 'n5-why-interfaces',
      title: 'The gap interfaces fill',
      concepts: ['interfaces', 'interface-vs-inherit', 'standard-interfaces'],
      blocks: [
        {
          t: 'text',
          md: 'Inheritance works when objects belong to the **same family** — `Rectangle` and `Circle` are both `Shape`s. But a `Student` and a `Chef` share no parent, and both need to be sortable.\n\n"Sortable" is a **capability**, not an ancestry. That is what an interface expresses.',
        },
        {
          t: 'compare',
          left: {
            title: 'Inheritance',
            tone: 'neutral',
            md: 'Shares **ancestry and code**.\n\nOne base class only.\n\nCan hold fields and implemented methods.\n\nUse when the types genuinely are related.',
          },
          right: {
            title: 'Interface',
            tone: 'neutral',
            md: 'Shares **capability only**.\n\nAs many as you like.\n\nNo state, no implementation to inherit.\n\nUse when unrelated types can all do X.',
          },
        },
        {
          t: 'code',
          caption: 'Declaring and implementing',
          code: `public interface IAnimal
{
    void Speak();
}

public class Dog : IAnimal
{
    public void Speak() { Console.WriteLine("Woof!"); }
}

IAnimal myDog = new Dog();
myDog.Speak();          // Woof!  — the object decides, not the variable`,
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'The `interface` keyword, and a name starting with capital `I` by convention. `public abstract class IShape {}` is an **abstract class** wearing a misleading name — a favourite distractor.',
        },
        {
          t: 'table',
          headers: ['Question', 'Answer'],
          rows: [
            ['A class implements an interface but misses a member', 'Compile error, unless the class is marked `abstract`'],
            ['Can an interface be instantiated?', 'No — there is nothing to run'],
            ['Which interface makes objects sortable?', '`IComparable` — it requires `CompareTo`'],
            ['Does implementing an interface give multiple inheritance?', 'No. Many interfaces, still exactly one base class'],
          ],
        },
        {
          t: 'callout',
          tone: 'note',
          title: 'The other standard ones, so you can rule them out',
          md: '`IEnumerable` → iterate with `foreach`. `IDisposable` → release unmanaged resources. `IDrawable` → not a standard library interface at all.',
        },
      ],
    },
    {
      id: 'n5-exceptions-what',
      title: 'What exceptions are, and when not to use them',
      concepts: ['exceptions-why'],
      blocks: [
        {
          t: 'text',
          md: 'An exception is an **object** — a class deriving from `System.Exception` — carrying a `Message`, a `StackTrace`, and possibly an inner exception. It is created and thrown when something goes wrong **while the program is running**.',
        },
        {
          t: 'table',
          caption: 'Two true/false questions that come up almost every time',
          headers: ['Claim', 'Verdict', 'Why'],
          rows: [
            ['Exceptions detect **compiling** errors', '**False**', 'The compiler catches those before the program ever runs'],
            ['Exceptions are objects containing an error message', '**True**', 'They are full classes with `Message` and `StackTrace`'],
          ],
        },
        {
          t: 'compare',
          left: {
            title: 'Use them for',
            tone: 'good',
            md: 'Unexpected runtime errors.\n\nCatastrophic failures a method cannot recover from.\n\nUnreliable external systems — files, networks, databases.',
          },
          right: {
            title: 'Do **not** use them for',
            tone: 'bad',
            md: 'Ordinary control flow.\n\nEnding a loop.\n\nRoutine input validation.\n\nAn expected condition deserves an `if`, which is faster and says what it means.',
          },
        },
        {
          t: 'code',
          caption: 'A custom exception — inherit, and pass the message up',
          code: `class CustomException : Exception
{
    public CustomException(string message) : base(message) { }
}`,
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'Only objects deriving from `System.Exception` can be thrown — `throw new string("oops")` is not legal C#. The `: base(message)` is what makes `.Message` carry your text.',
        },
      ],
    },
    {
      id: 'n5-try-catch',
      title: 'try, catch, finally',
      concepts: ['try-catch', 'exception-flow'],
      blocks: [
        {
          t: 'code',
          caption: 'The order to trace, every time',
          code: `try {
    string text = null;
    Console.WriteLine(text.Length);      // throws NullReferenceException
    Console.WriteLine("never reached");  // skipped entirely
} catch (NullReferenceException) {
    Console.WriteLine("Null reference detected.");
} finally {
    Console.WriteLine("End of program.");
}

// Null reference detected.
// End of program.`,
        },
        {
          t: 'table',
          headers: ['Block', 'When it runs'],
          rows: [
            ['`try`', 'Until something throws, then it is abandoned mid-way'],
            ['`catch (SomeType)`', 'Only if the thrown exception matches that type'],
            ['`finally`', '**Always** — exception or not, caught or not'],
          ],
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'Two things to be sure of',
          md: 'The rest of the `try` after the throw **never runs**.\n\n`finally` runs either way — which is why closing a file belongs there and not at the end of the `try`.',
        },
        {
          t: 'text',
          md: 'If no `catch` in the current method matches, the exception **propagates up the call stack**, abandoning each method as it goes, until it finds one:',
        },
        {
          t: 'code',
          code: `static void Inner()  { throw new InvalidOperationException("bad"); }

static void Middle() {
    Inner();
    Console.WriteLine("after Inner");   // never runs
}

static void Main() {
    try { Middle(); }
    catch (InvalidOperationException) { Console.WriteLine("caught in Main"); }
}
// caught in Main`,
        },
        {
          t: 'callout',
          tone: 'trap',
          md: 'If **no** matching catch exists anywhere up the stack, the program **crashes**. It is not ignored, not silently defaulted, and the `try` does not restart.',
        },
      ],
    },
  ],
};
