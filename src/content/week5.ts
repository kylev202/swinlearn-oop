/**
 * Week 5 — Interfaces, Exceptions & Midterm Review.
 *
 * Sources: Week 5 lecture notes, Quiz 5, OOP Lab5.pdf.
 *
 * Lab5.pdf's Task 5.2 (Iteration 4) is titled "optimize Iterations 2 and 3
 * using Inheritance" and gives the exact IdentifiableObject → GameObject →
 * Item hierarchy this app already built into week4.ts's Task 4.2 — a week
 * earlier than the real unit schedules it (Lab4.pdf's own Task 4.2 UML shows
 * a standalone Item with no base class). That was a deliberate choice: rather
 * than rebuild an already-working, already-tested hierarchy, Task 5.2 here is
 * reframed as what actually matters once the refactor exists — writing the
 * specific unit tests Lab5.pdf introduces (Test Item is Identifiable, Test
 * Short Description, Test Full Description, Test Privilege Escalation) and
 * confirming nothing broke.
 *
 * A genuine engine limit found while writing this week: a user-defined class
 * that does `class X : Exception { public X(string m) : base(m) {} }` is
 * accepted, but `base(m)` does not reach a real System.Exception, so `.Message`
 * throws "no member called Message". Quiz 5 Q1 asks about exactly this
 * pattern, so it is taught here as a read-only code example (the shape you
 * would write for the exam), never as a runnable/predict/graded block — every
 * graded exception exercise below throws a real, fully-supported built-in
 * exception type instead.
 *
 * Authoring note: markdown lives in template literals, so every inline-code
 * backtick must be escaped as \` — otherwise it closes the string.
 */

import type { InterviewQuestion, Week } from './types';

export const week5: Week = {
  number: 5,
  title: 'Interfaces, Exceptions & Collaboration',
  subtitle: 'Shared capabilities across unrelated classes, handling failure, and the midterm',
  outcomes: [
    'Explain what an interface is, and why it solves a problem inheritance cannot',
    'Implement an interface, and say why an incomplete implementation must be abstract',
    'Predict which override runs when an object is accessed through an interface-typed variable',
    'Explain what an exception is, how it propagates, and write a correct try/catch/finally',
    'Say when NOT to use an exception, and defend the answer',
    'Extend ShapeDrawer to a collection of selectable shapes, and add the official Iteration 4 tests to Swin-Adventure',
  ],
  sources: ['Week 5 lecture', 'Quiz 5', 'OOP Lab5.pdf'],
  lessons: [
    // ================================================================ lesson 1
    {
      id: 'w5-interfaces',
      title: 'Interfaces',
      kind: 'concept',
      minutes: 16,
      summary: 'A contract for what a class can do, for classes that have no business sharing a parent.',
      steps: [
        {
          id: 'w5-int-why',
          title: 'The problem inheritance cannot solve',
          blocks: [
            {
              t: 'text',
              md: `> A \`Student\` and a \`Chef\` don't share a parent class — but both can be **sorted**: a \`Student\` by graduation year, a \`Chef\` by rank. "Sortable" is common *functionality*, not a shared *ancestry*. — Dr Vo

Week 4's inheritance answers "what **is** this thing" — a family tree of related types. It has nothing to offer when two completely unrelated classes need to do the **same kind of thing**. Forcing \`Student\` and \`Chef\` to share a made-up common parent just to make them both sortable would be a worse design than either being sortable on its own.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'is-a vs can-do',
              md: 'Inheritance models **is-a** (a `Rectangle` is a `Shape`). An interface models **can-do** (a `Student` and a `Chef` can both *be compared*) — a shared capability, with no claim about shared ancestry at all.',
            },
          ],
        },
        {
          id: 'w5-int-define',
          title: 'A contract, not an implementation',
          blocks: [
            {
              t: 'text',
              md: `An **interface** specifies *only* the method signatures a class must provide — no fields, no method bodies, nothing to inherit. C# convention prefixes interface names with **\`I\`**.`,
            },
            {
              t: 'code',
              caption: 'A contract with one member',
              code: `public interface IComparable<T>
{
    int Compare(T other);
}`,
            },
            {
              t: 'quiz',
              question: 'Which of these correctly declares an interface in C#?',
              options: [
                'public interface IShape { }',
                'public abstract class IShape { }',
                'public class IShape { }',
                'public struct IShape { }',
              ],
              answer: 0,
              why: [
                '',
                'That declares an abstract class — a distinct construct that can hold fields and method bodies, unlike an interface.',
                'A plain class can be instantiated directly; an interface never can.',
                'A struct is a value type with its own storage — not a contract at all.',
              ],
              explain:
                'Quiz 5 Q5. Interfaces use the `interface` keyword, never `class` or `struct` — and by convention, their name starts with a capital I.',
            },
          ],
        },
        {
          id: 'w5-int-implement',
          title: 'Implementing one',
          blocks: [
            {
              t: 'text',
              md: `A class **implements** an interface with the same \`:\` syntax as inheritance, and must supply real code for **every** member the interface declares.`,
            },
            {
              t: 'code',
              caption: 'Student promises to be comparable',
              code: `public class Student : IComparable<Student>
{
    public int Compare(Student other) { /* comparison logic */ }
}

Student student1 = new Student();
Student student2 = new Student();
int result = student1.Compare(student2);`,
            },
            {
              t: 'quiz',
              question: 'What happens if a class implements an interface but leaves one member unimplemented?',
              options: [
                'The class must be marked abstract',
                'C# silently provides a default implementation',
                'It compiles, but throws at runtime the first time that member is called',
                'Nothing — implementing an interface is always optional per member',
              ],
              answer: 0,
              why: [
                '',
                'C# interfaces (in the form this unit uses) carry no implementation at all — there is nothing to fall back to.',
                'This is caught at compile time, not runtime — the compiler refuses to build a non-abstract class with a missing member.',
                'Every member of an implemented interface is mandatory unless the class itself is abstract.',
              ],
              explain:
                'Quiz 5 Q3. A concrete (non-abstract) class implementing an interface must provide every member. Leaving one out only compiles if the class is itself declared abstract, deferring the obligation to its own children.',
            },
          ],
        },
        {
          id: 'w5-int-poly',
          title: 'Polymorphism through an interface',
          blocks: [
            {
              t: 'text',
              md: `Exactly like Week 4's \`Shape\`/\`Rectangle\`, an interface-typed variable dispatches to whichever class actually implements it — except now the classes on either side of the call do not need a common ancestor at all.`,
            },
            {
              t: 'predict',
              caption: 'A Dog, viewed only as an IAnimal',
              question: 'myDog is declared as IAnimal, not Dog. What prints?',
              code: `public interface IAnimal
{
    void Speak();
}

public class Dog : IAnimal
{
    public void Speak()
    {
        Console.WriteLine("Woof!");
    }
}

public class Program
{
    static void Main()
    {
        IAnimal myDog = new Dog();
        myDog.Speak();
    }
}`,
              options: ['Woof!', '(nothing — IAnimal has no body to run)', 'The program does not compile', 'Speak'],
              answer: 0,
              why: [
                '',
                'The interface declares the signature; the call still runs whichever class actually implements it — here, Dog.',
                'This is entirely valid: Dog implements IAnimal, so an IAnimal-typed variable may legally hold a Dog.',
                '`Speak` is a method name, not something that prints on its own — you would need `nameof(Dog.Speak)` for that, which nothing here calls.',
              ],
              explain:
                'Quiz 5 Q4. Because Dog implements IAnimal by providing Speak(), declaring myDog as IAnimal and assigning it a Dog is valid — the call still runs Dog\'s own implementation.',
              expect: { output: 'Woof!' },
            },
            {
              t: 'code',
              caption: 'Unrelated classes, one list',
              code: `List<IComparable> myGenericList = new List<IComparable>();
myGenericList.Add(myShape);   // Shape implements IComparable
myGenericList.Add(myPlayer);  // Player implements IComparable — no relation to Shape at all`,
            },
          ],
        },
        {
          id: 'w5-int-vs-inheritance',
          title: 'Inheritance vs interfaces',
          blocks: [
            {
              t: 'table',
              caption: 'Two different tools',
              headers: ['', 'Inheritance', 'Interface'],
              rows: [
                ['Models', 'A family of related types ("is-a")', 'A shared capability, unrelated types'],
                ['How many?', 'Only **one** base class', '**Many** interfaces at once'],
                ['Contains', 'Data + behaviour (real implementation)', 'Only method **signatures**'],
                ['C# syntax', '`class Car : Vehicle`', '`class Square : IComparable<Square>, IPrintable<Square>`'],
              ],
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'A worked example from the slides',
              md: 'A `Bag` (from the `Item` hierarchy) and a `Player` (from the `GameObject` hierarchy) share no ancestor at all — but both can implement `IHaveInventory`, and any code that only needs `IHaveInventory`\'s members does not care which one it was handed.',
            },
            {
              t: 'quiz',
              question: 'Which interface would be most suitable for making objects sortable?',
              options: ['IComparable', 'IDrawable', 'IDisposable', 'IEnumerable'],
              answer: 0,
              why: [
                '',
                'IDrawable (not a real .NET interface, but the shape of one) would be about rendering, not ordering.',
                'IDisposable is about releasing unmanaged resources — unrelated to sorting.',
                'IEnumerable is about iteration (foreach), not defining an ordering between two objects.',
              ],
              explain:
                'Quiz 5 Q9. IComparable defines a CompareTo-style method that produces a type-specific ordering — exactly what a sort needs.',
            },
            {
              t: 'quiz',
              question: 'Why are interfaces important in OOP?',
              options: [
                'They enable polymorphism and flexible interaction between unrelated classes',
                'They let a class skip implementing methods it does not need',
                'They replace classes entirely, so you never need to write one',
                'They give a class true multiple inheritance of data and behaviour',
              ],
              answer: 0,
              why: [
                '',
                'The opposite is true — every member is mandatory for a concrete implementing class.',
                'Interfaces cannot be instantiated at all; you still need a class to implement one.',
                'A class can implement many interfaces, but C# still restricts it to one base class — interfaces do not grant true multiple class inheritance.',
              ],
              explain:
                'Quiz 5 Q13. Interfaces let unrelated classes share the same set of methods, so they can be treated uniformly through the interface type — the core benefit is flexible, polymorphic interaction, not a shortcut around implementing things.',
            },
          ],
        },
        {
          id: 'w5-int-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Explain, in your own words, why Student and Chef can both be IComparable even though neither inherits from the other — and why that would not work with plain inheritance.',
              nudge: 'Say what the two classes actually share (a capability, not ancestry), and what a shared base class would have forced onto both of them.',
              points: [
                'An interface specifies a capability (a set of method signatures) with no implementation and no claim about ancestry',
                'Student and Chef implement IComparable independently, each with its own Compare logic',
                'Forcing them to share a base class just to be comparable would be a worse design — it claims a family relationship that does not exist',
                'A class can implement many interfaces but only ever inherit from one base class',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 2
    {
      id: 'w5-exceptions',
      title: 'Exceptions',
      kind: 'concept',
      minutes: 16,
      summary: 'What actually happens when something goes wrong, and how to be deliberate about handling it.',
      steps: [
        {
          id: 'w5-exc-why',
          title: 'An exception is an object',
          blocks: [
            {
              t: 'text',
              md: `> "Think of exceptions as a child having a tantrum." — Dr Vo

That is not just a joke — it names exactly what makes them costly: they are **slow**, they make code **harder to follow**, they force \`try\`/\`catch\` to be scattered around, and if nobody handles one, it **terminates the program**.

An exception is not a special case syntactically — it is an ordinary **object**, carrying a message and related data describing what went wrong.`,
            },
            {
              t: 'quiz',
              question: 'True or false: exceptions in C# are objects that carry an error message.',
              options: ['True', 'False'],
              answer: 0,
              why: [
                '',
                'Every exception is an instance of a class deriving from System.Exception, carrying a Message, a StackTrace, and possibly an inner exception.',
              ],
              explain: 'Quiz 5 Q14. This is exactly why you can write `e.Message` in a catch block — `e` is a real object.',
            },
          ],
        },
        {
          id: 'w5-exc-propagate',
          title: 'Unwinding the stack',
          blocks: [
            {
              t: 'text',
              md: `Throwing an exception is an alternate way of **ending a method call**. If the method that threw it has no matching \`catch\`, the exception keeps ending each *calling* method up the call stack — Main included — until something catches it, or nothing does.`,
            },
            {
              t: 'quiz',
              question: 'What happens if an exception is thrown but no catch anywhere up the call stack matches it?',
              options: [
                'The program crashes with an unhandled exception',
                'The program continues normally, skipping the failed operation',
                'The runtime silently ignores it and logs nothing',
                'C# automatically fixes the underlying problem',
              ],
              answer: 0,
              why: [
                '',
                'Nothing "continues normally" — an unhandled exception terminates the application.',
                'It is not silent — an unhandled exception is exactly what crashes the program, visibly.',
                'The runtime has no way to "fix" your program\'s logic — it can only report that something went wrong.',
              ],
              explain:
                'Quiz 5 Q10. With no matching catch anywhere up the stack, the runtime cannot handle the exception and the application terminates abruptly.',
            },
          ],
        },
        {
          id: 'w5-exc-predict-null',
          title: 'Predict: a null reference',
          blocks: [
            {
              t: 'predict',
              caption: 'Quiz 5 Q7',
              question: 'What does this print?',
              code: `public class Program
{
    static void Main()
    {
        try
        {
            string text = null;
            Console.WriteLine(text.Length);
        }
        catch (NullReferenceException)
        {
            Console.WriteLine("Null reference detected.");
        }
        finally
        {
            Console.WriteLine("End of program.");
        }
    }
}`,
              options: [
                'Null reference detected.\nEnd of program.',
                'End of program.',
                'Null reference detected.',
                'The program crashes before printing anything',
              ],
              answer: 0,
              why: [
                '',
                'The catch block runs and prints its own line before finally runs — finally does not replace it.',
                'The catch block is what actually matched here — it runs before finally, not instead of it.',
                'That would be true with no try/catch at all. Here the catch block is exactly what stops the crash.',
              ],
              explain:
                'Quiz 5 Q7. `text.Length` dereferences a null reference, throwing NullReferenceException. The matching catch runs, then finally always runs after it.',
              expect: { output: 'Null reference detected.\nEnd of program.' },
            },
          ],
        },
        {
          id: 'w5-exc-predict-divide',
          title: 'Predict: dividing by zero',
          blocks: [
            {
              t: 'predict',
              caption: 'Quiz 5 Q8',
              question: 'What does this print?',
              code: `public class Program
{
    static void Main()
    {
        try
        {
            int x = 5 / 0;
        }
        catch (DivideByZeroException)
        {
            Console.WriteLine("Cannot divide by zero.");
        }
        finally
        {
            Console.WriteLine("Execution complete.");
        }
    }
}`,
              options: [
                'Cannot divide by zero.\nExecution complete.',
                'Execution complete.',
                '0',
                'Cannot divide by zero.',
              ],
              answer: 0,
              why: [
                '',
                'The catch block runs and prints its line before finally does — finally runs in addition, not instead.',
                'Integer division by a literal 0 throws immediately; `x` never gets assigned a value at all.',
                'Just like the null case, finally still runs after the catch block, adding a second line.',
              ],
              explain:
                'Quiz 5 Q8. `5 / 0` with two ints throws DivideByZeroException immediately. The matching catch runs, then finally runs unconditionally after it.',
              expect: { output: 'Cannot divide by zero.\nExecution complete.' },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'catch order: specific before general',
              md: 'Stack multiple `catch` blocks from most specific to most general, ending with `catch (Exception e)` as a catch-all. C# checks them top to bottom and runs the first match — put the general one first and it swallows everything, so the specific blocks below it never run.',
            },
          ],
        },
        {
          id: 'w5-exc-finally',
          title: 'finally runs no matter what',
          blocks: [
            {
              t: 'quiz',
              question: 'Which statement about the finally block is TRUE?',
              options: [
                'It always executes, whether an exception occurs or not',
                'It only executes if an exception is thrown',
                'It only executes if no exception is thrown',
                'It is required whenever you write a try block',
              ],
              answer: 0,
              why: [
                '',
                'It runs even when the try block succeeds completely — that is what makes it reliable for cleanup.',
                'It runs on the success path too, not exclusively there.',
                'finally is optional — a try can pair with just a catch, or even neither on its own.',
              ],
              explain:
                'Quiz 5 Q11. finally guarantees cleanup code (closing files, releasing resources) runs regardless of whether the try block succeeded, threw, or the method returned early from inside it.',
            },
          ],
        },
        {
          id: 'w5-exc-custom',
          title: 'Defining your own exception type',
          blocks: [
            {
              t: 'text',
              md: `You will see this exact pattern on the exam. A custom exception is a class deriving from \`System.Exception\`, with a constructor that forwards its message up via \`base(...)\`.`,
            },
            {
              t: 'code',
              caption: 'The standard shape — read this, you will not run it here',
              code: `class CustomException : Exception
{
    public CustomException(string message) : base(message) { }
}

// later:
throw new CustomException("Add requires at least 2 operands.");`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Why this step has no exercise',
              md: 'Every user-defined class in this playground is checked and run by a small interpreter, not a real C# compiler — and it does not fully wire a custom class through to `System.Exception`\'s real machinery. The pattern above is exactly what you would type in Visual Studio Code; every exercise from here just throws a **built-in** exception type instead, which this playground runs for real.',
            },
            {
              t: 'quiz',
              question: 'How do you correctly create a custom exception class in C#?',
              options: [
                'class CustomException : Exception { public CustomException(string message) : base(message) {} }',
                'class CustomException { public string Message; }',
                'throw new string("Something went wrong");',
                'class CustomException : System.Object { }',
              ],
              answer: 0,
              why: [
                '',
                'This never derives from Exception, so it can never be thrown — `throw` requires an Exception-derived object.',
                'You cannot throw a string directly — only objects deriving from System.Exception are throwable.',
                'Object is the ultimate base of everything, but it is not Exception — this still cannot be thrown.',
              ],
              explain:
                'Quiz 5 Q1. A custom exception must derive from Exception (or a built-in exception subclass), with a constructor that forwards its message via base(message) so it is preserved correctly.',
            },
          ],
        },
        {
          id: 'w5-exc-when',
          title: 'When NOT to use one',
          blocks: [
            {
              t: 'callout',
              tone: 'warn',
              title: 'Exceptions are for the unexpected',
              md: 'Use them for genuinely exceptional, unanticipated runtime failures. For anything you can predict — bad input, a value out of range, a normal end-of-loop condition — use ordinary control flow: an `if` check or a return value. Exceptions are relatively slow and make code harder to follow; reaching for one out of habit is a design smell, not good defensive programming.',
            },
            {
              t: 'quiz',
              question: 'When should exceptions NOT be used in C#?',
              options: [
                'To control normal program flow',
                'To report a genuinely unexpected runtime failure',
                'To signal a problem a caller must not ignore',
                'To carry a descriptive error message up the call stack',
              ],
              answer: 0,
              why: [
                '',
                'That is exactly what exceptions are for.',
                'Also a legitimate use — forcing the caller to handle or explicitly ignore a real problem.',
                'Also legitimate — the Message property exists for this.',
              ],
              explain:
                'Quiz 5 Q2. Exceptions should never substitute for ordinary control flow like loop termination or input validation — doing so hurts performance and makes code harder to maintain.',
            },
            {
              t: 'quiz',
              question: 'True or false: exceptions are used to detect compiling (syntax) errors.',
              options: ['False', 'True'],
              answer: 0,
              why: [
                '',
                'Syntax and compilation errors are caught by the compiler, before the program ever runs — long before any exception-handling code could apply.',
              ],
              explain:
                'Quiz 5 Q12. Exceptions strictly handle runtime problems — issues that occur while the program is actively executing.',
            },
          ],
        },
        {
          id: 'w5-exc-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Explain what "unwinding the stack" means using your own words, and say what decides whether a given method call site should use an exception or a plain if-check.',
              nudge: 'Walk through what happens to each calling method in turn when nothing catches an exception right away.',
              points: [
                'Throwing ends the current method call immediately, the same way a return does, but abnormally',
                'If the throwing method has no matching catch, the exception keeps ending each calling method up the stack in turn',
                'This continues until something catches it, or the program crashes if nothing ever does',
                'A predictable, anticipated condition (bad input, an expected empty case) should be handled with an if-check or return value',
                'An exception is for the case you genuinely could not have predicted',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 3
    {
      id: 'w5-midterm',
      title: 'Before the midterm',
      kind: 'concept',
      minutes: 10,
      summary: 'Logistics for Week 6\'s test, and a battery of the scenario questions it actually asks.',
      steps: [
        {
          id: 'w5-mid-logistics',
          title: 'What to expect',
          blocks: [
            {
              t: 'table',
              caption: 'Midterm test, Week 6',
              headers: ['', ''],
              rows: [
                ['Duration', '~20 minutes, first hour of the lab'],
                ['Weight', '10% of your final mark'],
                ['Format', '10 multiple-choice questions, closed book, one printed page'],
                ['Coverage', 'Week 1 → Week 5 content only — not Week 6'],
                ['Bring', 'A pencil/pen and your student card — ID is checked'],
              ],
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'Strategy',
              md: 'Answer what you are sure of first, circle the rest, come back. Most students finish inside 15 of the 20 minutes. The sample below is about **50–60%** similar to the real thing — 2–3 questions will be harder than this.',
            },
          ],
        },
        {
          id: 'w5-mid-scenarios',
          title: 'Sample scenarios',
          blocks: [
            {
              t: 'quiz',
              question: 'A Library object contains multiple Book objects. What relationship is this?',
              options: ['Aggregation', 'Association', 'Dependency', 'Inheritance'],
              answer: 0,
              why: [
                '',
                'Association is a single reference held as a field — this is a container of many.',
                'A dependency is a brief, non-stored use — a Library permanently holds its Books.',
                'There is no "is-a" claim here — a Library is not a kind of Book.',
              ],
              explain: 'A container/collection relationship is aggregation, regardless of which two classes are involved.',
            },
            {
              t: 'quiz',
              question: 'Which pair is a valid inheritance relationship?',
              options: [
                'Vehicle and Car',
                'Student and Teacher',
                'ComputerMonitor and ComputerKeyboard',
                'Player and Weapon',
              ],
              answer: 0,
              why: [
                '',
                'A Student cannot do what a Teacher does (update marks) — they are peers with different capabilities, not one being a specialised version of the other.',
                'These are two separate components of a computer setup, not a family of related types.',
                'A Player has a Weapon — that is association, not "a Weapon is a kind of Player."',
              ],
              explain:
                'Vehicle/Car/Truck/Bike genuinely share a base of attributes (year, brand, wheels, fuel type) with each subtype adding its own specifics — a textbook "is-a" family.',
            },
            {
              t: 'quiz',
              question: 'Which of these stays on the stack rather than the heap?',
              options: ['An int local variable', 'A string', 'A List<int>', 'A custom class instance'],
              answer: 0,
              why: [
                '',
                'string is a reference type — the reference is on the stack, but the character data itself is heap-allocated.',
                'Any collection created with `new` lives on the heap — its size is not known until runtime.',
                'Every object created with `new` lives on the heap, without exception.',
              ],
              explain:
                'Only fixed-size, compile-time-known primitive/value types (like int) go on the stack as locals. Anything created with `new` goes on the heap.',
            },
            {
              t: 'quiz',
              question: 'What does a constructor\'s job actually come down to?',
              options: [
                'Initialising the object with valid default or supplied values',
                'Destroying the object when it is no longer needed',
                'Declaring the class\'s access modifier',
                'Registering the class with the runtime',
              ],
              answer: 0,
              why: [
                '',
                'C# has no destructor a student writes routinely — cleanup is the garbage collector\'s job, not a constructor\'s.',
                'Access modifiers are declared on the class header, not inside any single member.',
                'Nothing about C# requires manual "registration" of a class — the compiler and runtime handle that.',
              ],
              explain:
                'A constructor\'s entire purpose is to leave a new object in a valid starting state — and a class may define as many as it needs, so long as each has a distinct parameter signature.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 4
    {
      id: 'w5-task51',
      title: 'Task 5.1 — ShapeDrawer: Multiple Shapes',
      kind: 'lab',
      minutes: 35,
      assessment: 'Assessed · 2% of your final grade',
      summary: 'A Drawing class that aggregates many Shapes, and lets the user add, select, and delete them.',
      steps: [
        {
          id: 'w5-51-why',
          title: 'One shape was never the point',
          blocks: [
            {
              t: 'text',
              md: `Right now ShapeDrawer draws exactly one shape. A real drawing program needs many — so you add a \`Drawing\` class: a **container** of \`Shape\` objects, with the operations to add, remove, select, and draw all of them.

\`Drawing\` does not draw anything itself — per Lab5.pdf's own note: "The Drawing class does not actually draw the shapes, it asks the shapes to draw themselves." That is collaboration, the same idea Week 3 introduced with \`Inventory\` and \`Item\`.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'The relationship',
              md: 'A hollow diamond between `Drawing` and `Shape` in the UML means **aggregation** — a `Drawing` has a `_shapes` collection of zero or more `Shape`s. Same relationship as `Inventory` and `Item`, different classes.',
            },
          ],
        },
        {
          id: 'w5-51-uml',
          title: 'The target',
          blocks: [
            {
              t: 'umlSpec',
              caption: 'Task 5.1 target',
              source: `public class Shape
{
    private bool _selected;
    public bool Selected { get { return false; } set { } }
    public void DrawOutline() { }
}

public class Drawing
{
    private List<Shape> _shapes;
    private Color _background;
    public Drawing() { }
    public Drawing(Color background) { }
    public List<Shape> SelectedShapes { get { return null; } }
    public int ShapeCount { get { return 0; } }
    public Color Background { get { return null; } set { } }
    public void Draw() { }
    public void SelectShapesAt(Point2D pt) { }
    public void AddShape(Shape s) { }
    public void RemoveShape(Shape s) { }
}`,
            },
          ],
        },
        {
          id: 'w5-51-fields-ctor',
          title: 'Fields and two constructors',
          blocks: [
            {
              t: 'text',
              md: `\`_shapes\` is marked \`readonly\` — the *list object* never changes after construction, even though its *contents* do constantly. That is the same distinction Week 2 drew between an object and the arrow pointing at it: readonly freezes the arrow, not what it points at.

\`Drawing\` gets **two** constructors: one takes a background colour, the other takes nothing and forwards \`Color.White\` to the first via \`this(...)\` — constructor chaining, so the default logic exists in exactly one place.`,
            },
            {
              t: 'code',
              caption: 'this(...) vs base(...)',
              code: `public Drawing(Color background)
{
    _shapes = new List<Shape>();
    _background = background;
}

public Drawing() : this(Color.White)
{
}`,
            },
          ],
          exercise: {
            prompt:
              'Add a private readonly List<Shape> _shapes and a private Color _background, a constructor taking a background colour, and a no-argument constructor that forwards Color.White via this(...).',
            seed: 'public class Drawing\n{\n\n}',
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: '_shapes is a private readonly List<Shape>',
                rule: {
                  on: 'field', inClass: 'Drawing', name: '_shapes', visibility: 'private', type: 'List<Shape>', isReadonly: true,
                },
              },
              {
                kind: 'structure',
                label: 'Drawing has a constructor taking one parameter',
                rule: { on: 'ctor', inClass: 'Drawing', params: 1 },
              },
              {
                kind: 'structure',
                label: 'Drawing has a no-argument constructor',
                rule: { on: 'ctor', inClass: 'Drawing', params: 0 },
              },
              {
                kind: 'runsClean',
                label: 'Both new Drawing() and new Drawing(Color.Blue) run without an error',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        Drawing a = new Drawing();
        Drawing b = new Drawing(Color.Blue);
    }
}`,
            hints: [
              'private readonly List<Shape> _shapes; — readonly means the field cannot be reassigned once set, not that the list can never change.',
              'The one-parameter constructor creates the list and stores the background.',
              'public Drawing() : this(Color.White) { } — no body needed; the other constructor does the real work.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w5-51-count-add-remove',
          title: 'ShapeCount, AddShape, RemoveShape',
          blocks: [
            {
              t: 'callout',
              tone: 'tip',
              title: 'Single responsibility',
              md: 'Which actor is responsible for counting the shapes? Not `Drawing` — `List<T>` already knows its own `Count`. `ShapeCount` just asks and returns it. Reimplementing counting here would be the same duplication mistake Week 3 flagged for identifier-matching.',
            },
          ],
          exercise: {
            prompt:
              'Add a read-only ShapeCount property returning _shapes.Count, AddShape(Shape s), and RemoveShape(Shape s).',
            seed: `public class Drawing
{
    private readonly List<Shape> _shapes;
    private Color _background;

    public Drawing(Color background)
    {
        _shapes = new List<Shape>();
        _background = background;
    }

    public Drawing() : this(Color.White)
    {
    }

}`,
            editable: { from: 13, to: 13 },
            tests: [
              {
                kind: 'structure',
                label: 'ShapeCount is a read-only int property',
                rule: { on: 'property', inClass: 'Drawing', name: 'ShapeCount', hasGet: true, hasSet: false, type: 'int' },
              },
              {
                kind: 'structure',
                label: 'AddShape takes one Shape and returns void',
                rule: { on: 'method', inClass: 'Drawing', name: 'AddShape', params: 1, returns: 'void' },
              },
              {
                kind: 'structure',
                label: 'RemoveShape takes one Shape and returns void',
                rule: { on: 'method', inClass: 'Drawing', name: 'RemoveShape', params: 1, returns: 'void' },
              },
              {
                kind: 'output',
                label: 'ShapeCount tracks Add/Remove correctly',
                expect: '0\n1\n0',
              },
            ],
            harness: `public class Shape
{
    public Shape(int param) { }
}

public class __Check
{
    public static void Main()
    {
        Drawing d = new Drawing();
        Console.WriteLine(d.ShapeCount);

        Shape s = new Shape(100);
        d.AddShape(s);
        Console.WriteLine(d.ShapeCount);

        d.RemoveShape(s);
        Console.WriteLine(d.ShapeCount);
    }
}`,
            hints: [
              'public int ShapeCount { get { return _shapes.Count; } } — one line, no manual counting.',
              'AddShape and RemoveShape are also one-liners: _shapes.Add(s); and _shapes.Remove(s);',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w5-51-selected-outline',
          title: 'Shape gets Selected and DrawOutline',
          blocks: [
            {
              t: 'text',
              md: `Two additions to \`Shape\` this week. \`Selected\` is a plain read-write \`bool\` property — the field defaults to \`false\` on its own, no constructor change needed. \`DrawOutline\` draws a black rectangle **around** the shape, **(5+X) pixels** wider on every side, where X is the last digit of your student ID.`,
            },
          ],
          exercise: {
            prompt:
              'Add a private _selected field and public Selected property to Shape, and a DrawOutline method drawing a black rectangle {{outlineWidth}} pixels wider on every side.',
            seed: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape(int param)
    {
        _color = Color.{{color4}};
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public int Width { get { return _width; } set { _width = value; } }
    public int Height { get { return _height; } set { _height = value; } }

    public void Draw()
    {
        SplashKit.FillRectangle(_color, _x, _y, _width, _height);
    }

    public bool IsAt(Point2D pt)
    {
        return pt.X > _x && pt.X < _x + _width
            && pt.Y > _y && pt.Y < _y + _height;
    }

}`,
            editable: { from: 28, to: 28 },
            tests: [
              {
                kind: 'structure',
                label: '_selected is a private bool',
                rule: { on: 'field', inClass: 'Shape', name: '_selected', visibility: 'private', type: 'bool' },
              },
              {
                kind: 'structure',
                label: 'Selected is a read-write bool property',
                rule: { on: 'property', inClass: 'Shape', name: 'Selected', hasGet: true, hasSet: true, type: 'bool' },
              },
              {
                kind: 'structure',
                label: 'DrawOutline takes no parameters',
                rule: { on: 'method', inClass: 'Shape', name: 'DrawOutline', params: 0 },
              },
              {
                kind: 'runsClean',
                label: 'DrawOutline runs cleanly once a window exists',
              },
              {
                kind: 'output',
                label: 'A new Shape starts unselected',
                expect: 'False',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        Window w = new Window("Test", 800, 600);
        Shape s = new Shape({{shapeParam}});
        s.DrawOutline();
        Console.WriteLine(s.Selected);
    }
}`,
            hints: [
              'private bool _selected; — a bool field defaults to false with no constructor change.',
              'public bool Selected { get { return _selected; } set { _selected = value; } }',
              'DrawOutline: SplashKit.FillRectangle(Color.Black, _x - {{outlineWidth}}, _y - {{outlineWidth}}, _width + 2 * {{outlineWidth}}, _height + 2 * {{outlineWidth}});',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w5-51-draw-select',
          title: 'Draw, and drawing the outline only when selected',
          blocks: [
            {
              t: 'text',
              md: `\`Drawing.Draw\` clears the screen with its own background, then asks each shape to draw itself — the same delegation pattern as \`Inventory.ItemList\` asking each \`Item\` for its own description. Change \`Shape.Draw\` to call \`DrawOutline\` first, but **only** when selected — draw the outline underneath, so the shape's own fill still sits on top.`,
            },
          ],
          exercise: {
            prompt:
              'Add Drawing.Draw() (clear with _background, then draw every shape), and change Shape.Draw() to call DrawOutline() first when Selected is true.',
            seed: `public class Drawing
{
    private readonly List<Shape> _shapes;
    private Color _background;

    public Drawing(Color background)
    {
        _shapes = new List<Shape>();
        _background = background;
    }

    public Drawing() : this(Color.White)
    {
    }

    public int ShapeCount { get { return _shapes.Count; } }

    public void AddShape(Shape s) { _shapes.Add(s); }
    public void RemoveShape(Shape s) { _shapes.Remove(s); }

}`,
            editable: { from: 17, to: 17 },
            tests: [
              {
                kind: 'structure',
                label: 'Draw() takes no parameters and returns void',
                rule: { on: 'method', inClass: 'Drawing', name: 'Draw', params: 0, returns: 'void' },
              },
              {
                kind: 'runsClean',
                label: 'Draw() runs cleanly with shapes in the drawing',
              },
            ],
            harness: `public class Shape
{
    private bool _selected;
    public Shape(int param) { }
    public bool Selected { get { return _selected; } set { _selected = value; } }
    public void Draw() { }
}

public class __Check
{
    public static void Main()
    {
        Window w = new Window("Test", 800, 600);
        Drawing d = new Drawing();
        d.AddShape(new Shape(50));
        d.Draw();
    }
}`,
            hints: [
              'Draw calls SplashKit.ClearScreen(_background); then foreach (Shape s in _shapes) { s.Draw(); }',
              'Back in Shape.Draw: if (_selected) { DrawOutline(); } before the FillRectangle call for the shape itself.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w5-51-selectshapesat',
          title: 'SelectShapesAt, without an if inside the loop',
          blocks: [
            {
              t: 'text',
              md: `\`IsAt\` already returns a \`bool\` — assign it directly rather than branching on it. This is a small habit, but the lab spec calls it out explicitly for a reason: fewer branches is fewer places for a mistake to hide.`,
            },
            {
              t: 'parsons',
              caption: 'Drawing.cs',
              prompt: 'Order the lines of SelectShapesAt, which sets every shape\'s Selected from IsAt directly.',
              lines: [
                'public class Drawing',
                '{',
                '    public void SelectShapesAt(Point2D pt)',
                '    {',
                '        foreach (Shape s in _shapes)',
                '        {',
                '            s.Selected = s.IsAt(pt);',
                '        }',
                '    }',
                '}',
              ],
              explain:
                'IsAt already returns exactly the bool Selected needs, so there is no if/else to write at all — every shape gets re-evaluated on every call, which is also what makes a second right-click correctly deselect shapes the first one no longer covers.',
            },
          ],
          exercise: {
            prompt:
              'Add SelectShapesAt(Point2D pt) that sets every shape\'s Selected to the result of its own IsAt(pt), and a read-only SelectedShapes property listing the ones currently selected.',
            seed: `public class Drawing
{
    private readonly List<Shape> _shapes;
    private Color _background;

    public Drawing(Color background)
    {
        _shapes = new List<Shape>();
        _background = background;
    }

    public Drawing() : this(Color.White)
    {
    }

    public void AddShape(Shape s) { _shapes.Add(s); }
    public void RemoveShape(Shape s) { _shapes.Remove(s); }

}`,
            editable: { from: 16, to: 16 },
            tests: [
              {
                kind: 'structure',
                label: 'SelectShapesAt takes one Point2D parameter',
                rule: { on: 'method', inClass: 'Drawing', name: 'SelectShapesAt', params: 1, returns: 'void' },
              },
              {
                kind: 'structure',
                label: 'SelectedShapes is a read-only List<Shape> property',
                rule: {
                  on: 'property', inClass: 'Drawing', name: 'SelectedShapes', hasGet: true, hasSet: false, type: 'List<Shape>',
                },
              },
              {
                kind: 'output',
                label: 'Selects the shape under the point, and deselects it once the point moves away',
                expect: '1\n0',
              },
            ],
            harness: `public class Shape
{
    private bool _selected;
    private float _x;
    private float _y;
    private int _width;
    private int _height;
    public Shape(int param) { _x = 0; _y = 0; _width = param; _height = param; }
    public bool Selected { get { return _selected; } set { _selected = value; } }
    public bool IsAt(Point2D pt)
    {
        return pt.X > _x && pt.X < _x + _width && pt.Y > _y && pt.Y < _y + _height;
    }
}

public class __Check
{
    public static void Main()
    {
        Drawing d = new Drawing();
        d.AddShape(new Shape(10));
        d.SelectShapesAt(new Point2D(5, 5));
        Console.WriteLine(d.SelectedShapes.Count);
        d.SelectShapesAt(new Point2D(500, 500));
        Console.WriteLine(d.SelectedShapes.Count);
    }
}`,
            hints: [
              'foreach (Shape s in _shapes) { s.Selected = s.IsAt(pt); } — no if-statement needed.',
              'SelectedShapes builds a new List<Shape>, adding any shape whose Selected is true, and returns it.',
              'A second call to SelectShapesAt at a point nowhere near the shape has to deselect it — that only happens if Selected is assigned unconditionally, not just set to true inside an if.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w5-51-interactive',
          title: 'Put it all together',
          blocks: [
            {
              t: 'text',
              md: `Left-click adds a shape at the cursor. Space randomises the background. Right-click selects whatever is under the cursor. Delete or Backspace removes every currently-selected shape — and per the lab's own note, **nothing new needs to be added to \`Drawing\`** to make deletion work: \`SelectedShapes\` and \`RemoveShape\` already do the whole job together.`,
            },
            {
              t: 'runnable',
              tool: 'canvas',
              autoRun: true,
              caption: 'Click to add, space for background, right-click to select, delete to remove',
              code: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;
    private bool _selected;

    public Shape(int param)
    {
        _color = Color.{{color4}};
        _x = 0.0f;
        _y = 0.0f;
        _width = param;
        _height = param;
    }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public bool Selected { get { return _selected; } set { _selected = value; } }

    public void DrawOutline()
    {
        SplashKit.FillRectangle(Color.Black, _x - {{outlineWidth}}, _y - {{outlineWidth}}, _width + 2 * {{outlineWidth}}, _height + 2 * {{outlineWidth}});
    }

    public void Draw()
    {
        if (_selected)
        {
            DrawOutline();
        }
        SplashKit.FillRectangle(_color, _x, _y, _width, _height);
    }

    public bool IsAt(Point2D pt)
    {
        return pt.X > _x && pt.X < _x + _width
            && pt.Y > _y && pt.Y < _y + _height;
    }
}

public class Drawing
{
    private readonly List<Shape> _shapes;
    private Color _background;

    public Drawing(Color background)
    {
        _shapes = new List<Shape>();
        _background = background;
    }

    public Drawing() : this(Color.White) { }

    public List<Shape> SelectedShapes
    {
        get
        {
            List<Shape> result = new List<Shape>();
            foreach (Shape s in _shapes)
            {
                if (s.Selected) { result.Add(s); }
            }
            return result;
        }
    }

    public Color Background { get { return _background; } set { _background = value; } }

    public void AddShape(Shape s) { _shapes.Add(s); }
    public void RemoveShape(Shape s) { _shapes.Remove(s); }

    public void SelectShapesAt(Point2D pt)
    {
        foreach (Shape s in _shapes)
        {
            s.Selected = s.IsAt(pt);
        }
    }

    public void Draw()
    {
        SplashKit.ClearScreen(_background);
        foreach (Shape s in _shapes)
        {
            s.Draw();
        }
    }
}

public class Program
{
    static void Main()
    {
        Window w = new Window("Shape Drawer", 800, 600);
        Drawing myDrawing = new Drawing();

        do
        {
            SplashKit.ProcessEvents();

            if (SplashKit.MouseClicked(MouseButton.LeftButton))
            {
                Shape s = new Shape({{shapeParam}});
                s.X = SplashKit.MouseX();
                s.Y = SplashKit.MouseY();
                myDrawing.AddShape(s);
            }

            if (SplashKit.KeyTyped(KeyCode.SpaceKey))
            {
                myDrawing.Background = SplashKit.RandomColor();
            }

            if (SplashKit.MouseClicked(MouseButton.RightButton))
            {
                myDrawing.SelectShapesAt(SplashKit.MousePosition());
            }

            if (SplashKit.KeyTyped(KeyCode.DeleteKey) || SplashKit.KeyTyped(KeyCode.BackspaceKey))
            {
                foreach (Shape s in myDrawing.SelectedShapes)
                {
                    myDrawing.RemoveShape(s);
                }
            }

            myDrawing.Draw();
            SplashKit.RefreshScreen();
        } while (!w.CloseRequested);
    }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Why deletion iterates SelectedShapes, not _shapes',
              md: '`SelectedShapes` returns a **new**, independent list every time it is read. Removing from `myDrawing` while iterating that copy is safe — you are never mutating the same list you are currently looping over. Looping over `_shapes` directly while calling `RemoveShape` inside the loop would be a real bug.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 5
    {
      id: 'w5-task52',
      title: 'Task 5.2 — Swin-Adventure Iteration 4: the official tests',
      kind: 'lab',
      minutes: 25,
      assessment: 'Assessed · 2% of your final grade',
      summary: 'Iteration 4 asks you to refactor Item onto an inheritance hierarchy — you already did that in Week 4. This week is about proving it with the tests the real spec asks for.',
      steps: [
        {
          id: 'w5-52-why',
          title: 'Why this task looks different',
          blocks: [
            {
              t: 'text',
              md: `Lab5.pdf's Task 5.2 asks you to notice the duplication between \`IdentifiableObject\` and \`Item\`, and fix it with inheritance — exactly the \`IdentifiableObject → GameObject → Item\` hierarchy Task 4.2 already had you build. There is no work left to redo.

What **is** left: Lab5.pdf adds four specific \`Item\`-level unit tests that Task 4.2 never asked for, and asks you to re-confirm your five \`Inventory\` tests still pass against the refactored classes. That is this week's actual task — proving your Week 4 code meets Iteration 4's real spec, in writing, not just "it still runs."`,
            },
            {
              t: 'table',
              caption: 'The four new Item tests',
              headers: ['Test', 'What it checks'],
              rows: [
                ['Test Item is Identifiable', 'AreYou responds correctly to the identifiers the item was created with'],
                ['Test Short Description', 'ShortDescription returns "a name (first id)" — e.g. "a bronze sword (sword)"'],
                ['Test Full Description', 'FullDescription returns the item\'s description'],
                ['Test Privilege Escalation', 'The right pin (last 4 digits of your student ID) returns "your tutorial ID"; any other pin returns the normal first id'],
              ],
            },
          ],
        },
        {
          id: 'w5-52-item-tests',
          title: 'Write the four Item tests',
          blocks: [
            {
              t: 'callout',
              tone: 'warn',
              title: 'Same rule as last week',
              md: 'Every assertion has to depend on what the object actually returns. `Assert.That(true)` still catches nothing.',
            },
          ],
          exercise: {
            prompt:
              'Write the four NUnit tests from Lab5.pdf: TestItemIsIdentifiable, TestShortDescription, TestFullDescription, TestPrivilegeEscalation.',
            seed: `[TestFixture]
public class ItemTests
{
    private Item Sword()
    {
        return new Item(new string[] { "sword", "blade" }, "bronze sword", "A short sword cast from bronze");
    }

    [Test]
    public void TestItemIsIdentifiable()
    {
    }

    [Test]
    public void TestShortDescription()
    {
    }

    [Test]
    public void TestFullDescription()
    {
    }

    [Test]
    public void TestPrivilegeEscalation()
    {
    }
}`,
            editable: { from: 1, to: 24 },
            tests: [
              {
                kind: 'forbid',
                label: 'No assertion is a hard-coded, always-true no-op',
                pattern: 'Assert\\.(That\\(\\s*true\\s*\\)|Pass\\()',
                message: 'An assertion that can never fail does not test anything.',
              },
              {
                kind: 'nunit',
                label: 'All four of your tests pass against a correct hierarchy',
                source: '',
              },
            ],
            harness: `public class IdentifiableObject
{
    private List<string> identifiers;
    public IdentifiableObject(string[] ids) { identifiers = new List<string>(ids); }
    public bool AreYou(string id)
    {
        foreach (string i in identifiers) { if (i == id) { return true; } }
        return false;
    }
    public string FirstID() { return identifiers[0]; }
    public void RemoveIdentifier(string id) { identifiers.Remove(id); }
    public string PrivilegeEscalation(string pin)
    {
        if (pin == "{{XXXX}}") { return "your tutorial ID"; }
        return FirstID();
    }
}

public abstract class GameObject : IdentifiableObject
{
    protected string name;
    protected string description;
    public GameObject(string[] ids, string name, string description) : base(ids)
    {
        this.name = name;
        this.description = description;
    }
    public string Name { get { return name; } }
    public string ShortDescription() { return name + " (" + FirstID() + ")"; }
    public virtual string FullDescription() { return description; }
}

public class Item : GameObject
{
    public Item(string[] idents, string name, string description) : base(idents, name, description) { }
}`,
            hints: [
              'TestItemIsIdentifiable: create a Sword(), then Assert.That(item.AreYou("sword"), Is.True) and Assert.That(item.AreYou("shield"), Is.False).',
              'TestShortDescription: Assert.That(item.ShortDescription(), Is.EqualTo("bronze sword (sword)")).',
              'TestFullDescription: Assert.That(item.FullDescription(), Is.EqualTo("A short sword cast from bronze")).',
              'TestPrivilegeEscalation: assert the correct pin ("{{XXXX}}") returns "your tutorial ID", and assert a wrong pin (e.g. "0000") returns the item\'s real FirstID() instead.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w5-52-retest',
          title: 'Re-confirm Inventory still passes',
          blocks: [
            {
              t: 'text',
              md: `Nothing about \`Inventory\` changed this week — it was already built against \`Item\` correctly. Re-running last week's five tests here is the point: a refactor you cannot re-verify is a refactor you cannot trust.`,
            },
          ],
          exercise: {
            prompt: 'Paste your five Inventory tests from Task 4.2 here, unmodified, and confirm they still all pass.',
            seed: `[TestFixture]
public class InventoryTests
{
    private Item Sword()
    {
        return new Item(new string[] { "sword" }, "bronze sword", "A short sword cast from bronze");
    }

    [Test]
    public void TestFindItem()
    {
    }

    [Test]
    public void TestNoItemFind()
    {
    }

    [Test]
    public void TestFetchItem()
    {
    }

    [Test]
    public void TestTakeItem()
    {
    }

    [Test]
    public void TestItemList()
    {
    }
}`,
            editable: { from: 1, to: 31 },
            tests: [
              {
                kind: 'forbid',
                label: 'No assertion is a hard-coded, always-true no-op',
                pattern: 'Assert\\.(That\\(\\s*true\\s*\\)|Pass\\()',
                message: 'An assertion that can never fail does not test anything.',
              },
              {
                kind: 'nunit',
                label: 'All five Inventory tests still pass, unchanged, against the refactored classes',
                source: '',
              },
            ],
            harness: `public class IdentifiableObject
{
    private List<string> identifiers;
    public IdentifiableObject(string[] ids) { identifiers = new List<string>(ids); }
    public bool AreYou(string id)
    {
        foreach (string i in identifiers) { if (i == id) { return true; } }
        return false;
    }
    public string FirstID() { return identifiers[0]; }
}

public abstract class GameObject : IdentifiableObject
{
    protected string name;
    protected string description;
    public GameObject(string[] ids, string name, string description) : base(ids)
    {
        this.name = name;
        this.description = description;
    }
    public string Name { get { return name; } }
    public string ShortDescription() { return name + " (" + FirstID() + ")"; }
    public virtual string FullDescription() { return description; }
}

public class Item : GameObject
{
    public Item(string[] idents, string name, string description) : base(idents, name, description) { }
}

public class Inventory
{
    private List<Item> _items;
    public Inventory() { _items = new List<Item>(); }
    public void Put(Item itm) { _items.Add(itm); }
    public bool HasItem(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { return true; } }
        return false;
    }
    public Item Take(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { _items.Remove(i); return i; } }
        return null;
    }
    public Item Fetch(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { return i; } }
        return null;
    }
    public string ItemList
    {
        get
        {
            string result = "";
            foreach (Item i in _items) { result += "\\t" + i.ShortDescription() + "\\n"; }
            return result;
        }
    }
}`,
            hints: [
              'These are the same five tests from w4-42-write-tests — Find, NoFind, Fetch, Take, ItemList.',
              'If one fails here but passed last week, the refactor changed observable behaviour somewhere — that is exactly what re-testing is for catching.',
            ],
            tool: 'tests',
          },
        },
      ],
    },

    // ================================================================ lesson 6
    /*
     * The week's own test — see the note on `w2-checkpoint`.
     *
     * Quiz 5 is unusually code-heavy: three of its fourteen questions are
     * traces of a try/catch/finally block, and the thing being tested is
     * always the same rule in a different arrangement. So the traces here are
     * arranged differently again — no exception at all, an exception crossing
     * a method boundary, a `finally` with no `catch` beside it — because
     * recognising the shape is not the same as knowing the rule.
     *
     * It is also the last checkpoint before the midterm, so its closing step
     * is a short mixed paper rather than more Week 5.
     */
    {
      id: 'w5-checkpoint',
      title: 'Week 5 checkpoint',
      kind: 'quiz',
      minutes: 22,
      summary:
        'Interfaces and exceptions, then a short mixed paper across all five weeks. The last check before the midterm.',
      steps: [
        {
          id: 'w5-cp-warmup',
          title: 'From memory first',
          blocks: [
            {
              t: 'text',
              md: 'Two ideas, one sentence each. Write them before you see any options — the paper will not offer you four choices for the reasoning, only for the answer.',
            },
            {
              t: 'recall',
              prompt:
                'What is an interface, and what does a class promise when it says it implements one? Then: what is an exception, and when should you *not* use one?',
              nudge:
                'One of these is about a contract with no implementation behind it. The other is about the difference between something going unexpectedly wrong and something going normally.',
              points: [
                'An interface is a contract of member signatures with no implementation',
                'A class that implements one must supply **every** member, or be declared abstract itself',
                'A class has one base class but may implement many interfaces',
                'An interface lets unrelated classes be used through the same type — "can-do", not "is-a"',
                'An exception is an object carrying an error message, raised at runtime',
                'Not for ordinary control flow, and never for compile-time or syntax errors',
              ],
            },
          ],
        },

        {
          id: 'w5-cp-interfaces',
          title: 'Contracts',
          blocks: [
            {
              t: 'quiz',
              question: 'Which is the correct way to declare an interface in C#?',
              options: [
                '`public interface IShape { }`',
                '`public abstract class IShape { }`',
                '`public struct IShape { }`',
                '`public class IShape { }`',
              ],
              answer: 0,
              why: [
                '',
                'The `I` name is a hint, but the keyword makes this an abstract **class** — a different construct with different rules.',
                '`struct` declares a value type, which is not an interface at all.',
                'A class, whatever it happens to be called.',
              ],
              explain:
                'Quiz 5 Q5. The keyword decides, never the name. Naming a class `IShape` compiles and misleads every reader of it.',
            },
            {
              t: 'quiz',
              question:
                'What happens if a class does **not** implement all the members of an interface it declares?',
              options: [
                'It must be marked `abstract`, or it will not compile',
                'The missing members get an empty default implementation',
                'It compiles, and throws at runtime if a missing member is called',
                'Only the members it did implement are available',
              ],
              answer: 0,
              why: [
                '',
                'Interfaces in this unit supply no defaults — there is nothing to inherit.',
                'The compiler stops it long before anything runs.',
                'The contract is all members or none. Partial fulfilment is not a state the language allows.',
              ],
              explain:
                'Quiz 5 Q3. Implementing an interface is a promise about **every** member, checked at compile time. That is what makes an interface-typed variable safe to call through.',
            },
            {
              t: 'quiz',
              question: 'Which statement about interfaces and polymorphism is TRUE?',
              options: [
                'Interfaces let objects be treated as their implemented interface type',
                'Interfaces prevent polymorphism, which only works through base classes',
                'Interfaces can be instantiated directly',
                'A class implementing an interface may leave some members out',
              ],
              answer: 0,
              why: [
                '',
                'They *enable* it, and extend it to types that share no ancestor at all.',
                'Only a concrete implementing class can be instantiated — `new IShape()` is not legal.',
                'Every member must be implemented, or the class must itself be abstract.',
              ],
              explain:
                'Quiz 5 Q6. An interface is a type: a `List<IDrawable>` can hold a shape, a sprite and a text label and call `Draw()` on each.',
            },
            {
              t: 'quiz',
              question:
                'Which interface is most suitable for making objects sortable?',
              options: ['`IComparable`', '`IDrawable`', '`IDisposable`', '`IEnumerable`'],
              answer: 0,
              why: [
                '',
                'Rendering, not ordering — and not a standard library interface anyway.',
                'For releasing resources promptly rather than waiting for the garbage collector.',
                'For iteration — it is what makes `foreach` work, which is a different job.',
              ],
              explain:
                'Quiz 5 Q9. `IComparable` asks your type for one method, `CompareTo`, and that is everything a sorting algorithm needs. A base class would have demanded your single inheritance slot instead.',
            },
          ],
        },

        {
          id: 'w5-cp-interface-predict',
          title: 'Predict: one loop, two classes',
          blocks: [
            {
              t: 'predict',
              caption: 'Polymorphism through an interface',
              question: 'What does this print?',
              code: `public interface IAnimal
{
    void Speak();
}

public class Dog : IAnimal
{
    public void Speak()
    {
        Console.WriteLine("Woof!");
    }
}

public class Cat : IAnimal
{
    public void Speak()
    {
        Console.WriteLine("Meow!");
    }
}

public class Program
{
    static void Main()
    {
        List<IAnimal> animals = new List<IAnimal>();
        animals.Add(new Dog());
        animals.Add(new Cat());

        foreach (IAnimal a in animals)
        {
            a.Speak();
        }
    }
}`,
              options: [
                'Woof!\nMeow!',
                'Meow!\nWoof!',
                'Woof!\nWoof!',
                'It refuses to compile — a list cannot hold two different classes',
              ],
              answer: 0,
              why: [
                '',
                'A `List<T>` keeps insertion order, and the dog was added first.',
                'Each object runs its **own** implementation; the variable being an `IAnimal` does not change that.',
                'A `List<IAnimal>` holds anything that implements `IAnimal`, which is exactly the point of declaring it that way.',
              ],
              explain:
                'Quiz 5 Q4, extended into a collection. `Dog` and `Cat` share no base class and no code — only a capability — and one loop still calls the right method on each. That is the case inheritance cannot cover.',
              expect: { output: 'Woof!\nMeow!' },
            },
            {
              t: 'quiz',
              question:
                'A `Car` and a `Printer` both need to be startable. Why an interface rather than a shared base class?',
              options: [
                'They share no sensible base class, but they can share a capability',
                'Interfaces run faster than base classes',
                'A base class may not declare a method called `Start`',
                'Interfaces avoid having to write `override`',
              ],
              answer: 0,
              why: [
                '',
                'There is no meaningful performance difference between the two.',
                'It could — but inventing a `StartableThing` parent for a car and a printer produces a nonsense hierarchy.',
                'That is a syntax detail, not a design reason to choose one over the other.',
              ],
              explain:
                'Quiz 5 Q13. Inheritance forces you to claim two things are the same *kind* of thing. An interface only claims they can both *do* something, which is often the only true statement available.',
            },
          ],
        },

        {
          id: 'w5-cp-finally-predict',
          title: 'Predict: finally with nothing to catch',
          blocks: [
            {
              t: 'predict',
              caption: 'The most common wrong answer in Week 5',
              question: 'Nothing throws here. What does it print?',
              code: `public class Program
{
    static void Main()
    {
        try
        {
            Console.WriteLine("A");
        }
        catch (Exception)
        {
            Console.WriteLine("B");
        }
        finally
        {
            Console.WriteLine("C");
        }

        Console.WriteLine("D");
    }
}`,
              options: ['A\nC\nD', 'A\nB\nC\nD', 'A\nD', 'A\nB\nD'],
              answer: 0,
              why: [
                '',
                'The `catch` runs only when something is thrown, and nothing here throws.',
                '`finally` runs whether or not there was an exception — that is the entire rule.',
                'Both halves are wrong: the catch is skipped and the finally is not.',
              ],
              explain:
                'Quiz 5 Q11. `finally` is optional to write and **unconditional** once written. The trap is assuming it only runs after a `catch` — it also runs when nothing went wrong, and on the way out through a `return`.',
              expect: { output: 'A\nC\nD' },
            },
          ],
        },

        {
          id: 'w5-cp-propagate-predict',
          title: 'Predict: an exception leaving a method',
          blocks: [
            {
              t: 'predict',
              caption: 'Unwinding, and what runs on the way out',
              question: 'What does this print?',
              code: `public class Program
{
    static void Risky()
    {
        try
        {
            int x = 5 / 0;
            Console.WriteLine("never");
        }
        finally
        {
            Console.WriteLine("cleanup");
        }
    }

    static void Main()
    {
        try
        {
            Risky();
        }
        catch (DivideByZeroException)
        {
            Console.WriteLine("handled");
        }

        Console.WriteLine("after");
    }
}`,
              options: [
                'cleanup\nhandled\nafter',
                'handled\ncleanup\nafter',
                'handled\nafter',
                'cleanup\nnever\nhandled\nafter',
              ],
              answer: 0,
              why: [
                '',
                'The inner `finally` runs as the exception passes *through* that frame, which happens before the outer handler is reached.',
                'The `finally` runs even though `Risky` has no `catch` of its own — that is the point of writing one there.',
                '`"never"` is unreachable: the throw abandons the rest of the `try` block at the point it happens.',
              ],
              explain:
                'Three rules in one trace. The rest of the `try` is abandoned at the throw; the exception unwinds frame by frame running each `finally` on the way out; and once a handler has run, execution continues normally after that block.',
              expect: { output: 'cleanup\nhandled\nafter' },
            },
            {
              t: 'quiz',
              question:
                'An exception is thrown and no matching `catch` exists anywhere up the call stack. What happens?',
              options: [
                'The program terminates with an unhandled exception',
                'The exception is ignored and execution continues',
                'The runtime substitutes a default value and carries on',
                'The compiler would have refused to build the program',
              ],
              answer: 0,
              why: [
                '',
                'Nothing ignores it — "unhandled" is precisely the state where nothing has taken responsibility.',
                'There is no default value to substitute for an operation that could not happen.',
                'The compiler cannot know which exceptions a program will throw at runtime.',
              ],
              explain:
                'Quiz 5 Q10. The search runs out of frames and the runtime terminates the process. It is why the outermost layer of a real application usually catches broadly and logs.',
            },
          ],
        },

        {
          id: 'w5-cp-parsons',
          title: 'Rebuild the guard',
          blocks: [
            {
              t: 'text',
              md: 'One method, three blocks, and an order that is not negotiable — `catch` before `finally`, and specific exception types before general ones.',
            },
            {
              t: 'parsons',
              caption: 'Account.cs',
              prompt: 'Order a method that guards risky work, handles one failure, and always cleans up.',
              lines: [
                'public class Account',
                '{',
                '    private double _balance;',
                '    public void Withdraw(double amount)',
                '    {',
                '        try { _balance = _balance - amount; }',
                '        catch (InvalidOperationException) { Console.WriteLine("failed"); }',
                '        finally { Console.WriteLine("done"); }',
                '    }',
                '}',
              ],
              explain:
                '`try` guards the risky work, `catch` handles a matching type, `finally` runs either way. Reversing the last two is a compile error, and putting `catch (Exception)` above a more specific catch is one too — C# tries them top to bottom and refuses to compile a handler that can never be reached.',
            },
          ],
        },

        {
          id: 'w5-cp-exceptions',
          title: 'When to use one',
          blocks: [
            {
              t: 'quiz',
              question: 'When should exceptions **not** be used?',
              options: [
                'To control normal program flow',
                'To handle unexpected runtime errors',
                'To report a failure talking to an unreliable external system',
                'To signal that a method cannot do its job with the argument it was given',
              ],
              answer: 0,
              why: [
                '',
                'That is exactly what they are for.',
                'A network or file failure is the textbook case for one.',
                'An argument the method genuinely cannot work with is an exceptional condition, not a routine outcome.',
              ],
              explain:
                'Quiz 5 Q2. Ending a loop, validating typed input, and "no match found" are all expected outcomes — conditions and return values, not thrown objects. Exceptions are for the exceptional.',
            },
            {
              t: 'quiz',
              question:
                'True or false: exceptions are used to detect compiling errors.',
              options: ['False', 'True'],
              answer: 0,
              why: [
                '',
                'Syntax and type errors are caught by the compiler before the program ever runs, so there is nothing running to throw or catch anything.',
              ],
              explain:
                'Quiz 5 Q12. Exceptions strictly handle **runtime** errors — a null reference, a division by zero, a file that is not there.',
            },
            {
              t: 'quiz',
              question:
                'True or false: exceptions are objects that contain an error message.',
              options: ['True', 'False'],
              answer: 0,
              why: [
                '',
                'They are instances of classes deriving from `System.Exception`, carrying a `Message`, a `StackTrace`, and possibly an inner exception.',
              ],
              explain:
                'Quiz 5 Q14. Because an exception is an object, it can be caught **by type**, carry structured detail, and be defined by you — which is what makes exception handling more than a return code.',
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'catch order, and why it is a compile error',
              md: 'Handlers are tried top to bottom, and a `catch (Exception)` matches everything. Put it first and every specific handler below it becomes unreachable — which C# treats as an **error**, not a warning. Specific first, general last.',
            },
          ],
        },

        {
          id: 'w5-cp-mixed',
          title: 'A short mixed paper',
          blocks: [
            {
              t: 'text',
              md: 'Six questions, one from each part of the unit, in no particular order — the shape the real paper takes. Twenty seconds each, nothing to run, no scrolling back.',
            },
            {
              t: 'quiz',
              question: 'What is the default access level of a member declared inside a class?',
              options: ['`private`', '`internal`', '`public`', '`protected`'],
              answer: 0,
              why: [
                '',
                '`internal` is the default for a **top-level class**, not for a member inside one — and that mismatch is what makes this question worth asking.',
                'C# never defaults anything to public; that would make encapsulation opt-in.',
                'Nothing defaults to `protected`; you have to ask for it.',
              ],
              explain:
                'Quiz 4 Q4, and Lecture 5 flagged it as a mock-test question. Members default to `private`; classes default to `internal`.',
            },
            {
              t: 'quiz',
              question: 'Which UML symbol marks a private attribute?',
              options: ['`-`', '`+`', '`#`', '`~`'],
              answer: 0,
              why: [
                '',
                '`+` is public — the opposite end of the same scale.',
                '`#` is protected: the class plus anything that inherits from it.',
                '`~` is internal, or package-level in the general UML vocabulary.',
              ],
              explain:
                'Quiz 2 Q17. An encapsulated class reads as a block of `-` attributes above a block of `+` operations.',
            },
            {
              t: 'quiz',
              question:
                'Passing an object to a method passes what, exactly?',
              options: [
                'A copy of the reference — both sides then see the same heap object',
                'A copy of the entire object',
                'A pointer to the object on the stack',
                'The object by value, stored in a new location',
              ],
              answer: 0,
              why: [
                '',
                'Nothing is duplicated, which is why a change made through the parameter is visible to the caller.',
                'Objects built with `new` are on the heap; only the reference variable sits in the frame.',
                'The *reference* is passed by value, but it still points at the one existing object.',
              ],
              explain:
                'Quiz 3 Q7. Reassigning the parameter changes only the method\'s own copy of the reference — changing the *object* through it is what the caller sees.',
            },
            {
              t: 'quiz',
              question:
                'A `virtual` method is overridden in a child. Called through a parent-typed variable, which one runs?',
              options: [
                'The child\'s — the actual object type decides',
                'The parent\'s — the declared type decides',
                'Both, parent first',
                'It depends on the order the classes were compiled in',
              ],
              answer: 0,
              why: [
                '',
                'That is true only when the method is not virtual, and then it is hiding rather than overriding.',
                'Only one runs, unless the override explicitly calls `base`.',
                'Compilation order has no effect on dispatch.',
              ],
              explain:
                'Quiz 4 Q11. The object decides, not the variable — resolved at runtime, which is what makes it runtime polymorphism.',
            },
            {
              t: 'quiz',
              question: 'Which is the correct order of steps for writing a unit test?',
              options: [
                'Setup the test, perform the operation, check the result',
                'Check the result, setup the test, perform the operation',
                'Perform the operation, setup the test, check the result',
                'Setup the test, check the result, perform the operation',
              ],
              answer: 0,
              why: [
                '',
                'You cannot check a result that has not been produced yet.',
                'There is nothing to perform the operation on until the object has been set up.',
                'Same problem: the check has to come after the thing it is checking.',
              ],
              explain:
                'Quiz 2 Q2 — Arrange, Act, Assert. Three parts, always in this order.',
            },
            {
              t: 'quiz',
              question:
                'Which relationship holds between a `Library` and the `Book` objects it contains, when the books outlive the library?',
              options: ['Aggregation', 'Composition', 'Dependency', 'Inheritance'],
              answer: 0,
              why: [
                '',
                'Composition would require the books to be destroyed with the library.',
                'The books are held in a collection over time, not borrowed for one method call.',
                'A book is not a kind of library.',
              ],
              explain:
                'Quiz 3 Q6. Aggregation needs both halves — containment, and parts that can exist without the container.',
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Where to go from here',
              md: 'Ten questions, twenty minutes, closed book, Weeks 1–5. **Concept focus** on the home page holds around 350 questions across those five weeks, revision notes for each, mock papers under a real clock, and a list of everything you have got wrong that will not clear until you have revised it and answered two more on the same idea correctly. That list is the most useful thing in this app in the days before the test.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 7
    {
      id: 'w5-interview',
      title: 'Lab interview drill',
      kind: 'interview',
      minutes: 10,
      summary: 'Rehearse explaining interfaces, exceptions, and your Drawing class out loud before your tutor asks.',
      steps: [
        {
          id: 'w5-int-1',
          title: 'Same rubric as every week',
          blocks: [
            {
              t: 'callout',
              tone: 'key',
              md: 'Finishing the code caps you at 70%. The last 30% is entirely about explaining **why** — same rubric as every week so far.',
            },
          ],
        },
      ],
    },
  ],
};

/** Interview questions for Week 5, asked against the student's own code. */
export const week5Interview: InterviewQuestion[] = [
  {
    id: 'w5-q1',
    question: 'Why can a Drawing hold Shapes and Rectangles and Ellipses in the same List<Shape>, without knowing which is which?',
    lookingFor: [
      'Polymorphism — each concrete shape knows how to draw itself',
      'Drawing only ever calls the shared Shape members (Draw, IsAt) — it never needs to know the real type',
      'This is exactly what makes adding a new shape type later require zero changes to Drawing',
    ],
    aboutStep: 'w5-51-draw-select',
  },
  {
    id: 'w5-q2',
    question: 'Why is _shapes marked readonly, when you clearly add and remove shapes from it constantly?',
    lookingFor: [
      'readonly freezes the field — the List object it points at can never be swapped for a different one',
      'It says nothing about the list\'s contents, which change via Add/Remove exactly as intended',
    ],
    aboutStep: 'w5-51-fields-ctor',
  },
  {
    id: 'w5-q3',
    question: 'Why does deleting selected shapes loop over SelectedShapes rather than _shapes directly?',
    lookingFor: [
      'SelectedShapes returns a fresh, independent list every time it is read',
      'Removing from _shapes while iterating that separate copy is safe',
      'Removing from _shapes while looping over _shapes itself would be a real bug',
    ],
    aboutStep: 'w5-51-interactive',
  },
  {
    id: 'w5-q4',
    question: 'What is the actual difference between an interface and an abstract class, in your own words?',
    lookingFor: [
      'An interface has no implementation at all, only signatures; an abstract class can mix real code with abstract placeholders',
      'A class can implement many interfaces but inherit from only one class, abstract or not',
      'Interfaces model a shared capability across unrelated classes; inheritance models a family of related types',
    ],
  },
  {
    id: 'w5-q5',
    question: 'Why does this app never let you throw and catch a real custom exception class end-to-end?',
    lookingFor: [
      'A user-defined class extending Exception here does not properly wire up to Message or base(message)',
      'It is a genuine gap in this interpreter, not a rule of real C# — the pattern is completely valid outside this app',
    ],
    aboutStep: 'w5-exc-custom',
  },
  {
    id: 'w5-q6',
    question: 'Your TestPrivilegeEscalation test passed. What specifically would have made it fail if PrivilegeEscalation were buggy?',
    lookingFor: [
      'Asserting the exact returned string for both a correct pin and an incorrect one',
      'A test that only checked the correct-pin case would miss a bug that always returns "your tutorial ID" regardless of pin',
    ],
    aboutStep: 'w5-52-item-tests',
  },
];
