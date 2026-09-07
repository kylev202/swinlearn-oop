/**
 * Week 5 question bank — interfaces and exceptions.
 *
 * Sourced from Quiz 5 (14 questions, all of them) and Lecture 5. Worth knowing
 * while revising: the lecture is explicit that the midterm covers Week 1 to
 * Week 5 and **not** Week 6, so interfaces and exceptions are the last thing
 * on the paper — and the freshest, which is usually where the easy marks are.
 */

import type { FocusQuestion } from '../types';

export const WEEK5: FocusQuestion[] = [
  // -------------------------------------------------------- interfaces
  {
    id: 'w5-declare-interface',
    conceptId: 'interfaces',
    question: 'Which is the correct way to declare an interface in C#?',
    options: [
      '`public interface IShape {}`',
      '`public abstract class IShape {}`',
      '`public class IShape {}`',
      '`public struct IShape {}`',
    ],
    answer: 0,
    why: [
      '',
      'That is an abstract class — a different construct, which *can* hold state and implemented methods, and which a class may only have one of.',
      'That is an ordinary class. The leading `I` is a naming convention, not a keyword.',
      'That is a struct — a value type.',
    ],
    explain:
      'The `interface` keyword, and by convention a name starting with a capital `I`. Naming a class `IShape` fools a reader but not the compiler.',
    source: 'Quiz 5 Q5',
  },
  {
    id: 'w5-interface-dispatch',
    conceptId: 'interfaces',
    code: `public interface IAnimal {
    void Speak();
}

public class Dog : IAnimal {
    public void Speak() {
        Console.WriteLine("Woof!");
    }
}

IAnimal myDog = new Dog();
myDog.Speak();`,
    question: 'What does this print?',
    options: [
      '`Woof!`',
      'Nothing — an interface has no implementation to run',
      'It does not compile: `myDog` is an `IAnimal`, not a `Dog`',
      'It does not compile: `Speak` needs `override`',
    ],
    answer: 0,
    why: [
      '',
      'The interface has none, but the object behind the reference is a `Dog`, and it does.',
      'Assigning a `Dog` to an `IAnimal` variable is exactly what implementing the interface permits.',
      '`override` is for `virtual`/`abstract` base-class members. An interface member is implemented, not overridden.',
    ],
    explain:
      'Same polymorphism as Week 4, dispatching through a contract instead of a base class. The variable\'s type says what may be called; the object decides what runs.',
    source: 'Quiz 5 Q4',
  },
  {
    id: 'w5-incomplete-implementation',
    conceptId: 'interfaces',
    question: 'What happens if a class does not implement every member of an interface it declares?',
    options: [
      'It will not compile unless the class is marked `abstract`',
      'The missing members get an empty default implementation',
      'It compiles, and throws at runtime when a missing member is called',
      'The compiler removes the interface from the class',
    ],
    answer: 0,
    why: [
      '',
      'C# supplies no defaults for you. (Modern C# lets the *interface itself* declare one, but nothing appears automatically.)',
      'This is a compile-time error, not a runtime one — the whole value of a contract is that it is checked before the program runs.',
      'Nothing is silently removed.',
    ],
    explain:
      'A concrete class has to honour the whole contract. Marking it `abstract` defers the obligation to whichever subclass is concrete.',
    source: 'Quiz 5 Q3',
  },
  {
    id: 'w5-interface-poly',
    conceptId: 'interface-vs-inherit',
    question: 'Which statement about interfaces and polymorphism is true?',
    options: [
      'Interfaces let objects be treated as their implemented interface type',
      'Interfaces can be instantiated directly with `new`',
      'Interfaces prevent polymorphism',
      'Polymorphism only works through interfaces, never base classes',
    ],
    answer: 0,
    why: [
      '',
      'There is nothing to instantiate — an interface has no implementation and no state.',
      'They enable it, for classes that share no ancestry.',
      'Base classes do it too — that was all of Week 4.',
    ],
    explain:
      'Any class implementing `IComparable` can be handed to anything expecting an `IComparable`, whatever else it is. That is polymorphism across unrelated hierarchies.',
    source: 'Quiz 5 Q6',
  },
  {
    id: 'w5-why-interfaces',
    conceptId: 'interface-vs-inherit',
    question: 'Why are interfaces important in OOP?',
    options: [
      'They enable polymorphism and flexible interaction between unrelated classes',
      'They replace classes entirely',
      'They give C# true multiple class inheritance',
      'They exist only to support sorting',
    ],
    answer: 0,
    why: [
      '',
      'An interface has no implementation, so something still has to be the class.',
      'A class may implement many interfaces but still has exactly one base class.',
      'Sorting via `IComparable` is one use among many.',
    ],
    explain:
      'A `Student` and a `Chef` share no parent, but both can be sortable. "Sortable" is a **capability**, not an ancestry — and that is the gap interfaces fill.',
    source: 'Quiz 5 Q13',
  },
  {
    id: 'w5-interface-vs-abstract',
    conceptId: 'interface-vs-inherit',
    stretch: true,
    question:
      'You need `Rectangle` and `Circle` to share drawing code, and you also need `Shape` and `Student` — unrelated types — to be sortable by the same sorter. What do you use?',
    options: [
      'A base class for the shared drawing code, and an interface for sortability',
      'Interfaces for both',
      'Base classes for both',
      'A base class for both, with `Student` inheriting from `Shape`',
    ],
    answer: 0,
    why: [
      '',
      'An interface carries no implementation, so the shared drawing code would have to be written twice.',
      '`Student` cannot inherit from `Shape` — there is no is-a relationship, and C# allows only one base class anyway.',
      'Making a student a kind of shape to get sorting is exactly the abuse interfaces exist to prevent.',
    ],
    explain:
      'Inheritance shares **ancestry and code**; an interface shares **capability only**. When the answer is "these things are related", reach for a base class. When it is "these things can both do X", reach for an interface.',
    source: 'Lecture 5, interfaces vs inheritance',
  },
  {
    id: 'w5-icomparable',
    conceptId: 'standard-interfaces',
    question: 'Which interface is most suitable for making objects sortable?',
    options: ['`IComparable`', '`IEnumerable`', '`IDisposable`', '`IDrawable`'],
    answer: 0,
    why: [
      '',
      '`IEnumerable` makes something iterable with `foreach` — you can walk it, but that says nothing about order.',
      '`IDisposable` releases unmanaged resources.',
      '`IDrawable` is a rendering contract, and not a standard library one.',
    ],
    explain:
      '`IComparable` requires `CompareTo`, which is what every sorting algorithm calls. Implement it and your type slots into sorters that were written long before it existed.',
    source: 'Quiz 5 Q9',
  },

  {
    id: 'w5-sortable-unrelated',
    conceptId: 'standard-interfaces',
    question:
      'A `Sorter` must sort `Student` objects by graduation year and `Chef` objects by rank. The two classes share no parent. What does `Sorter` accept?',
    options: [
      '`IComparable`, which both classes implement',
      'A common base class the two are refactored to share',
      '`object`, casting each item at runtime',
      'Two overloads, one per type',
    ],
    answer: 0,
    why: [
      '',
      'There is no honest is-a relationship between a student and a chef to build a base class from.',
      'Casting at runtime puts the type checking back in the sorter, which is exactly what the interface removes.',
      'That works for two types and collapses on the third — which is the same if/else problem polymorphism exists to solve.',
    ],
    explain:
      '`IComparable` requires only `CompareTo`. Each class decides what "comes first" means for itself, and the sorter never learns what it is sorting — the lecture\'s own example of why interfaces beat inheritance here.',
    source: 'Quiz 5 Q9 and Lecture 5, the Sorter example',
  },

  // -------------------------------------------------------- exceptions
  {
    id: 'w5-exception-object',
    conceptId: 'exceptions-why',
    question: 'True or false: exceptions are objects that contain an error message.',
    options: ['True', 'False'],
    answer: 0,
    why: [
      '',
      'They are full classes deriving from `System.Exception`, carrying a `Message`, a `StackTrace` and possibly an inner exception.',
    ],
    explain:
      'An exception is an object like any other. That is why you can catch it by type, read its `Message`, and define your own by inheriting from `Exception`.',
    source: 'Quiz 5 Q14',
  },
  {
    id: 'w5-not-compile-errors',
    conceptId: 'exceptions-why',
    question: 'True or false: exceptions are used to detect compilation errors.',
    options: ['False', 'True'],
    answer: 0,
    why: [
      '',
      'A program with a syntax error never runs, so no exception could ever be thrown by it.',
    ],
    explain:
      'The compiler catches syntax and type errors before the program starts. Exceptions handle **runtime** problems — a missing file, a null reference, a division by zero.',
    source: 'Quiz 5 Q12',
  },
  {
    id: 'w5-not-control-flow',
    conceptId: 'exceptions-why',
    question: 'When should exceptions **not** be used?',
    options: [
      'To control ordinary program flow',
      'To handle an unexpected runtime error',
      'To signal a failure talking to an unreliable external system',
      'To report a catastrophic failure a method cannot recover from',
    ],
    answer: 0,
    why: [
      '',
      'That is what they are for.',
      'That is a textbook use — the network is exactly the sort of thing that fails unpredictably.',
      'Also a proper use.',
    ],
    explain:
      'Exiting a loop or validating input with a thrown exception is slow and hides intent. If the situation is expected, an `if` says so more honestly.',
    source: 'Quiz 5 Q2',
  },
  {
    id: 'w5-null-trace',
    conceptId: 'try-catch',
    code: `try {
    string text = null;
    Console.WriteLine(text.Length);
} catch (NullReferenceException) {
    Console.WriteLine("Null reference detected.");
} finally {
    Console.WriteLine("End of program.");
}`,
    question: 'What does this print?',
    options: [
      'Null reference detected. / End of program.',
      'Null reference detected.',
      'End of program.',
      'It crashes — nothing is printed',
    ],
    answer: 0,
    why: [
      '',
      '`finally` runs after the catch, every time.',
      'The catch matches the thrown type, so its line runs first.',
      'The exception is caught, so there is no crash.',
    ],
    explain:
      'Reading `.Length` off a null reference throws `NullReferenceException`; the matching catch handles it, then `finally` runs. Nothing after the throw *inside* the try ever runs.',
    source: 'Quiz 5 Q7',
  },
  {
    id: 'w5-divide-trace',
    conceptId: 'try-catch',
    code: `try {
    int x = 5 / 0;
} catch (DivideByZeroException) {
    Console.WriteLine("Cannot divide by zero.");
} finally {
    Console.WriteLine("Execution complete.");
}`,
    question: 'What does this print?',
    options: [
      'Cannot divide by zero. / Execution complete.',
      'Execution complete.',
      'Cannot divide by zero.',
      'Nothing — integer division by zero is a compile error',
    ],
    answer: 0,
    why: [
      '',
      'The catch matches, so it runs before `finally`.',
      '`finally` runs whether or not anything was caught.',
      'The compiler rejects the literal `5 / 0` in some contexts, but the behaviour being tested is the runtime one: integer division by zero throws.',
    ],
    explain:
      'Same shape as the null example. Catch first if the type matches, then `finally`, then on with the program after the block.',
    source: 'Quiz 5 Q8',
  },
  {
    id: 'w5-finally',
    conceptId: 'try-catch',
    question: 'Which statement about `finally` is true?',
    options: [
      'It always executes, whether an exception occurred or not',
      'It only executes when an exception was thrown',
      'It only executes when no exception was thrown',
      'It executes before the `catch` block',
    ],
    answer: 0,
    why: [
      '',
      'That is the `catch` block\'s job.',
      'That would make it useless for cleanup — the case you most need cleanup in is the failing one.',
      'Order is try, then catch, then finally.',
    ],
    explain:
      '`finally` is optional, but if you write one it always runs — which is why closing a file or a connection belongs there rather than at the end of the `try`.',
    source: 'Quiz 5 Q11',
  },
  {
    id: 'w5-no-matching-catch',
    conceptId: 'exception-flow',
    question:
      'An exception is thrown inside a `try` block and no matching `catch` exists anywhere. What happens?',
    options: [
      'The program crashes',
      'The exception is silently ignored and execution continues',
      'The runtime substitutes a default value and carries on',
      'The `try` block restarts',
    ],
    answer: 0,
    why: [
      '',
      'Nothing is ever swallowed silently — an unhandled exception is loud on purpose.',
      'The runtime has no idea what a sensible value would be.',
      'Nothing retries automatically.',
    ],
    explain:
      'The exception propagates up the call stack looking for a matching handler. If it reaches the top without finding one, the process terminates.',
    source: 'Quiz 5 Q10',
  },
  {
    id: 'w5-propagation',
    conceptId: 'exception-flow',
    stretch: true,
    code: `static void Inner() {
    throw new InvalidOperationException("bad");
}

static void Middle() {
    Inner();
    Console.WriteLine("after Inner");
}

static void Main() {
    try {
        Middle();
    } catch (InvalidOperationException) {
        Console.WriteLine("caught in Main");
    }
}`,
    question: 'What does this print?',
    options: [
      '`caught in Main`',
      '`after Inner` then `caught in Main`',
      '`caught in Main` then `after Inner`',
      'Nothing — the program crashes in `Inner`',
    ],
    answer: 0,
    why: [
      '',
      '`Middle` never gets past the call to `Inner` — the throw abandons the rest of the method.',
      'Once a method is unwound it is not resumed; execution continues after the `catch`, in `Main`.',
      'A handler does exist. It just is not in the method that threw.',
    ],
    explain:
      'The exception unwinds `Inner`, then `Middle` — abandoning `"after Inner"` — and is caught in `Main`. A handler does not have to be near the throw, which is precisely what makes exceptions more useful than returning an error code from every method in the chain.',
    source: 'Lecture 5, exception propagation',
  },
  {
    id: 'w5-custom-exception',
    conceptId: 'exceptions-why',
    code: `class CustomException : Exception {
    public CustomException(string message) : base(message) { }
}`,
    question: 'What makes this a valid custom exception?',
    options: [
      'It derives from `Exception` and passes the message to the base constructor',
      'Its name ends in `Exception`',
      'It is declared without an access modifier',
      'It has exactly one constructor',
    ],
    answer: 0,
    why: [
      '',
      'A helpful convention, but the compiler does not check names. A class called `Boom : Exception` is just as throwable.',
      'Accessibility is irrelevant to whether something can be thrown.',
      'The number of constructors makes no difference.',
    ],
    explain:
      'Only objects deriving from `System.Exception` can be thrown, and `: base(message)` is what makes `.Message` carry your text. `throw new string("oops")` is not legal C#.',
    source: 'Quiz 5 Q1',
  },

  // Third questions — see the note in week1.ts for why every concept has one.
  {
    id: 'w5-idisposable',
    conceptId: 'standard-interfaces',
    question: 'Which interface does a type implement so that `foreach` can walk it?',
    options: ['`IEnumerable`', '`IComparable`', '`IDisposable`', '`IEquatable`'],
    answer: 0,
    why: [
      '',
      '`IComparable` is about ordering — which of two comes first.',
      '`IDisposable` is about releasing unmanaged resources when you are done.',
      '`IEquatable` is about whether two instances count as equal.',
    ],
    explain:
      'Four standard interfaces, four separate questions: can I iterate it, can I order it, can I clean it up, are these two the same. The exam picks one and offers the other three as distractors.',
    source: 'Quiz 5 Q9, and its distractors',
  },
  {
    id: 'w5-wrong-catch-type',
    conceptId: 'exception-flow',
    code: `try {
    int x = 5 / 0;
} catch (NullReferenceException) {
    Console.WriteLine("caught");
}
Console.WriteLine("done");`,
    question: 'What happens?',
    options: [
      'The program crashes — the catch does not match the thrown type',
      '`caught` then `done`',
      '`done` only — the exception is skipped',
      'Nothing is printed, but the program exits normally',
    ],
    answer: 0,
    why: [
      '',
      'A `catch` only handles the type it names, and a `DivideByZeroException` is not a `NullReferenceException`.',
      'An unhandled exception does not let execution continue past it.',
      'It exits, but not normally — it terminates on an unhandled exception.',
    ],
    explain:
      'Having *a* catch is not the same as having a **matching** one. With no handler for the type anywhere up the stack, the exception is unhandled and the program terminates — `done` is never reached.',
    source: 'Quiz 5 Q10, applied',
  },

  // ==========================================================================
  // Depth pass.
  //
  // Quiz 5 is unusually code-heavy — three of its fourteen questions are
  // traces of a try/catch/finally block — so this section is too. The output
  // of a `finally` is the single most reliably examined thing in Week 5, and
  // it is asked in enough shapes here that recognising the shape is not the
  // same as knowing the rule.
  // ==========================================================================

  // ------------------------------------------------------------- interfaces
  {
    id: 'w5-interface-no-body',
    conceptId: 'interfaces',
    code: `public interface IShape
{
    double Area();
}`,
    question: 'What does `IShape` guarantee about any class that implements it?',
    options: [
      'That the class supplies a public `Area()` returning a `double`',
      'That the class inherits an implementation of `Area()`',
      'That the class cannot have any other members',
      'That the class is abstract',
    ],
    answer: 0,
    why: [
      '',
      'There is nothing to inherit — the interface declares the member and supplies no body.',
      'The implementing class may have as many extra members as it likes.',
      'It has to be abstract only if it *fails* to implement everything.',
    ],
    explain:
      'An interface is a contract of signatures. It says what a class must be able to do, and says nothing at all about how.',
    source: 'Quiz 5 Q5, applied',
  },
  {
    id: 'w5-interface-cannot-instantiate',
    conceptId: 'interfaces',
    code: `IShape s = new IShape();`,
    question: 'What is wrong with this line?',
    options: [
      'An interface cannot be instantiated — only a class that implements it can',
      'Nothing — this creates an empty shape',
      'The variable must be named after the interface',
      'Interfaces may only be used as method parameters',
    ],
    answer: 0,
    why: [
      '',
      'There is no implementation to run, so there is nothing to create.',
      'Variable names are free.',
      'An interface can type a variable, a field, a parameter or a return value.',
    ],
    explain:
      '`IShape s = new Circle();` is the legal form: an interface-typed variable holding a concrete object. The type on the left is the contract; the thing on the right is what fulfils it.',
    source: 'Quiz 5 Q6, distractor analysis',
  },
  {
    id: 'w5-interface-multiple',
    conceptId: 'interfaces',
    code: `public class Robot : Machine, IMovable, ISpeaker
{
}`,
    question: 'What can you conclude from this declaration?',
    options: [
      '`Machine` is a class and `IMovable` and `ISpeaker` are interfaces',
      'All three are classes, so `Robot` has three base classes',
      'All three are interfaces',
      'It will not compile — only one name may follow the colon',
    ],
    answer: 0,
    why: [
      '',
      'C# allows only one base class, so the other two cannot be classes.',
      'If `Machine` were an interface the code would still compile, but the convention of a leading `I` — and the position — says otherwise.',
      'Any number of names may follow, provided at most one is a class and it comes first.',
    ],
    explain:
      'One base class, listed first, then as many interfaces as you like. That ordering is a language rule, not a style choice.',
    source: 'Quiz 5 Q13 · Quiz 4 Q3',
  },
  {
    id: 'w5-interface-partial-implementation',
    conceptId: 'interfaces',
    code: `public interface IAnimal
{
    void Speak();
    void Eat();
}

public class Dog : IAnimal
{
    public void Speak() { Console.WriteLine("Woof"); }
}`,
    question: 'What happens with this code?',
    options: [
      'A compile error — `Dog` must implement `Eat()` or be declared `abstract`',
      'It compiles; `Eat()` inherits a default empty implementation',
      'It compiles but throws when `Eat()` is called',
      'It compiles because `Speak()` is enough to satisfy the interface',
    ],
    answer: 0,
    why: [
      '',
      'Interfaces in this unit supply no defaults; there is nothing to inherit.',
      'The compiler stops it long before runtime.',
      'The contract is all members or none.',
    ],
    explain:
      'Implementing an interface is a promise about **every** member. The compiler enforces it, which is what makes an interface-typed variable safe to call through.',
    source: 'Quiz 5 Q3',
  },
  {
    id: 'w5-interface-members-public',
    conceptId: 'interfaces',
    code: `public class Dog : IAnimal
{
    private void Speak() { }
}`,
    question: 'Why does this fail to implement `IAnimal.Speak()`?',
    options: [
      'An interface member must be implemented as `public`',
      'The method needs a return value',
      'A class may not have private methods',
      '`Speak` must be renamed to `ISpeak`',
    ],
    answer: 0,
    why: [
      '',
      '`void` matches the interface\'s own signature.',
      'Private methods are ordinary and useful; this one just cannot serve as the implementation.',
      'The names must match exactly, and the `I` prefix belongs to the interface.',
    ],
    explain:
      'The interface is the public contract, so the implementation has to be reachable through it. A private method cannot be called through an `IAnimal` reference, so it cannot be the implementation.',
    source: 'Quiz 5 Q3, applied',
    stretch: true,
  },
  {
    id: 'w5-interface-naming',
    conceptId: 'interfaces',
    question: 'What is the C# naming convention for interfaces?',
    options: [
      'A capital `I` prefix, as in `IComparable`',
      'A `Base` suffix, as in `ShapeBase`',
      'An `Interface` suffix, as in `ShapeInterface`',
      'All lower case, as in `ishape`',
    ],
    answer: 0,
    why: [
      '',
      'That names an abstract base class, which is a different construct.',
      'Java-ish, and not what .NET does.',
      'C# types are PascalCase.',
    ],
    explain:
      'It is only a convention, but the whole library follows it — so a type starting with `I` and a capital second letter is almost always an interface.',
    source: 'Quiz 5, cheat sheet',
  },
  {
    id: 'w5-interface-declaration-keyword',
    conceptId: 'interfaces',
    question: 'Which declares an interface?',
    options: [
      '`public interface IShape { }`',
      '`public abstract class IShape { }`',
      '`public struct IShape { }`',
      '`public class IShape { }`',
    ],
    answer: 0,
    why: [
      '',
      'The `I` name is a hint, but the keyword makes it an abstract **class**.',
      '`struct` declares a value type.',
      'A class, whatever it is called.',
    ],
    explain:
      'The keyword decides, never the name. Naming a class `IShape` compiles and misleads every reader of it.',
    source: 'Quiz 5 Q5',
  },
  {
    id: 'w5-interface-typed-variable',
    conceptId: 'interfaces',
    code: `public interface IAnimal { void Speak(); }

public class Dog : IAnimal
{
    public void Speak() { Console.WriteLine("Woof!"); }
    public void Fetch() { }
}

IAnimal a = new Dog();
a.Speak();`,
    question: 'What does this print, and could you also call `a.Fetch()`?',
    options: [
      '`Woof!` — and no, `IAnimal` does not declare `Fetch()`',
      '`Woof!` — and yes, because the object is really a `Dog`',
      'Nothing — an interface reference cannot call methods',
      'A compile error on the assignment',
    ],
    answer: 0,
    why: [
      '',
      'The object being a `Dog` decides which `Speak` runs; the *declared* type decides what may be called at all.',
      'Calling through an interface reference is the entire purpose of one.',
      '`Dog` implements `IAnimal`, so the assignment is exactly what the contract allows.',
    ],
    explain:
      'Same two rules as inheritance: declared type limits what you can call, actual object decides which implementation runs.',
    source: 'Quiz 5 Q4, extended',
  },
  {
    id: 'w5-interface-properties',
    conceptId: 'interfaces',
    question: 'Can an interface declare properties as well as methods?',
    options: [
      'Yes — it can declare properties, methods, events and indexers, all without bodies',
      'No — an interface may only declare methods',
      'Yes, but only read-only properties',
      'Only if the interface is marked `abstract`',
    ],
    answer: 0,
    why: [
      '',
      'Properties in interfaces are extremely common — `IIdentifiable { string Id { get; } }`.',
      'Both `get;` and `set;` may be required.',
      'Interfaces are implicitly abstract; the keyword is not written.',
    ],
    explain:
      'Anything that is a *member signature* can go in an interface. What cannot go in one, in this unit, is a body or a field.',
    source: 'Lecture 5, interfaces',
  },

  // ------------------------------------------------- interface vs inheritance
  {
    id: 'w5-can-do-vs-is-a',
    conceptId: 'interface-vs-inherit',
    question: 'Which sentence goes with an interface rather than with inheritance?',
    options: [
      '"A `Bird` **can** fly, and so can a `Plane`"',
      '"A `Car` **is a** `Vehicle`"',
      '"A `Manager` **is an** `Employee`"',
      '"A `Circle` **is a** `Shape`"',
    ],
    answer: 0,
    why: [
      '',
      'Is-a, and one shared ancestry — a base class.',
      'Is-a again.',
      'Is-a again.',
    ],
    explain:
      '"Is-a" → inheritance. "Can-do" → interface. A bird and a plane share no sensible ancestor, but they share a capability, and that is exactly the case a base class cannot express.',
    source: 'Lecture 5, is-a vs can-do',
  },
  {
    id: 'w5-interface-unrelated-classes',
    conceptId: 'interface-vs-inherit',
    question:
      'A `Car` and a `Printer` both need to be startable. Why is an interface the right tool?',
    options: [
      'They share no sensible base class, but they can share a capability',
      'Interfaces run faster than base classes',
      'A base class cannot declare a method called `Start`',
      'Interfaces avoid the need for the `override` keyword',
    ],
    answer: 0,
    why: [
      '',
      'There is no meaningful speed difference.',
      'It could, but inventing a `StartableThing` parent for a car and a printer produces a nonsense hierarchy.',
      'That is a syntax detail, not a design reason.',
    ],
    explain:
      'Inheritance forces you to claim two things are the same kind of thing. An interface only claims they can both do something, which is often the only true statement available.',
    source: 'Quiz 5 Q13',
  },
  {
    id: 'w5-interface-no-state',
    conceptId: 'interface-vs-inherit',
    question: 'What can an abstract class provide that an interface cannot?',
    options: [
      'Fields holding state, and method bodies subclasses inherit',
      'A method signature children must implement',
      'A type a variable can be declared as',
      'Polymorphic dispatch',
    ],
    answer: 0,
    why: [
      '',
      'Both can require a member — that is what `abstract` and an interface member have in common.',
      'Both work perfectly well as a declared type.',
      'Both give you it.',
    ],
    explain:
      'State and shared implementation are the abstract class\'s advantage. Freedom from single inheritance is the interface\'s. That trade is the whole comparison.',
    source: 'Quiz 5 Q6 · Lecture 5 comparison table',
  },
  {
    id: 'w5-choose-interface-or-base',
    conceptId: 'interface-vs-inherit',
    question:
      'Five classes need the same three-line implementation of a method, and they are all kinds of `GameObject`. Interface or base class?',
    options: [
      'Base class — the shared implementation is the whole point',
      'Interface — it avoids single inheritance',
      'Both, so the code is available twice',
      'Neither — copy the three lines into each class',
    ],
    answer: 0,
    why: [
      '',
      'An interface would force you to write the same three lines five times.',
      'Declaring it twice does not remove the duplication.',
      'That is the duplication a hierarchy exists to prevent.',
    ],
    explain:
      'Shared *implementation* → base class. Shared *capability* across unrelated types → interface. Ask which you actually have.',
    source: 'Lecture 5, interfaces vs inheritance',
  },
  {
    id: 'w5-interface-and-base-together',
    conceptId: 'interface-vs-inherit',
    question: 'Can a class inherit from a base class **and** implement interfaces at the same time?',
    options: [
      'Yes — one base class, and as many interfaces as needed',
      'No — you must choose one approach',
      'Yes, but only one interface',
      'Only if the base class implements the same interfaces',
    ],
    answer: 0,
    why: [
      '',
      'Combining them is normal, and the .NET library does it everywhere.',
      'There is no limit on the number of interfaces.',
      'The base class need know nothing about them.',
    ],
    explain:
      '`public class Item : GameObject, IComparable` is the ordinary shape: inherit the family, then declare the extra capabilities.',
    source: 'Quiz 5 Q13 with Quiz 4 Q3',
  },
  {
    id: 'w5-interface-not-multiple-inheritance',
    conceptId: 'interface-vs-inherit',
    question:
      'Does implementing two interfaces give a class multiple inheritance?',
    options: [
      'No — it inherits no implementation, only obligations to fulfil',
      'Yes — it is C#\'s way of doing multiple inheritance',
      'Yes, but only for properties',
      'No, because a class may implement only one interface',
    ],
    answer: 0,
    why: [
      '',
      'The problem with multiple inheritance is *inheriting two implementations of the same thing*. Interfaces supply none, so the problem does not arise.',
      'Nothing is inherited either way.',
      'A class may implement as many as it likes.',
    ],
    explain:
      'Multiple **interface** implementation, yes. Multiple **inheritance**, no — and the distinction is exactly what keeps the language unambiguous.',
    source: 'Quiz 5 Q13, common traps table',
    stretch: true,
  },
  {
    id: 'w5-interface-poly-benefit',
    conceptId: 'interface-vs-inherit',
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
      'They *enable* it, and they extend it to types with no common ancestor.',
      'Only implementing classes can be instantiated.',
      'Every member must be implemented, or the class must be abstract.',
    ],
    explain:
      'An interface is a type. A `List<IDrawable>` can hold a shape, a sprite and a text label, and call `Draw()` on each.',
    source: 'Quiz 5 Q6',
  },
  {
    id: 'w5-interface-change-cost',
    conceptId: 'interface-vs-inherit',
    question:
      'You add a new method to an interface that six classes already implement. What happens?',
    options: [
      'All six stop compiling until each supplies the new member',
      'The six classes inherit an empty version automatically',
      'Only classes created after the change are affected',
      'Nothing — interfaces are not checked at compile time',
    ],
    answer: 0,
    why: [
      '',
      'There is nothing to inherit from an interface.',
      'The contract applies to every implementer, old and new.',
      'They are checked strictly at compile time.',
    ],
    explain:
      'The strength of the contract is also its cost: widening an interface is a breaking change for everything that implements it. Adding a `virtual` method to a base class is not.',
    source: 'Lecture 5, interfaces vs inheritance',
    stretch: true,
  },

  // -------------------------------------------------- library interfaces
  {
    id: 'w5-icomparable-method',
    conceptId: 'standard-interfaces',
    question: 'Which method must a class supply to implement `IComparable`?',
    options: ['`CompareTo`', '`Equals`', '`Sort`', '`GetHashCode`'],
    answer: 0,
    why: [
      '',
      '`Equals` answers "are these the same?", not "which comes first?".',
      '`Sort` is what the *collection* offers; your class supplies the comparison it uses.',
      '`GetHashCode` is for hashing, used by dictionaries and sets.',
    ],
    explain:
      '`CompareTo` returns a negative number, zero, or a positive number. That one method is everything a sorting algorithm needs from your type.',
    source: 'Quiz 5 Q9',
  },
  {
    id: 'w5-which-interface-iteration',
    conceptId: 'standard-interfaces',
    question: 'Which interface lets an object be used in a `foreach` loop?',
    options: ['`IEnumerable`', '`IComparable`', '`IDisposable`', '`IDrawable`'],
    answer: 0,
    why: [
      '',
      'That is for ordering, which is the pairing the quiz deliberately tests.',
      'That is for releasing resources deterministically.',
      'Not a library interface at all — it is a name from the drawing examples.',
    ],
    explain:
      'Sorting → `IComparable`. Iterating → `IEnumerable`. Cleaning up → `IDisposable`. Keeping the three apart is a Quiz 5 question in itself.',
    source: 'Quiz 5 Q9, distractor analysis',
  },
  {
    id: 'w5-icomparable-why-interface',
    conceptId: 'standard-interfaces',
    question: 'Why does `List<T>.Sort()` rely on an interface rather than on a base class?',
    options: [
      'Anything can be sortable, whatever hierarchy it already belongs to',
      'Interfaces sort faster than base classes',
      'A base class cannot declare a comparison method',
      'Because sorting is done by the compiler',
    ],
    answer: 0,
    why: [
      '',
      'The sorting algorithm is identical either way.',
      'It could, but then every sortable type would have to inherit from it — and each type gets only one base class.',
      'Sorting happens at runtime, in library code.',
    ],
    explain:
      'A base class would demand your one inheritance slot. An interface asks only for a method, which is why the whole library is built out of them.',
    source: 'Quiz 5 Q9, applied',
    stretch: true,
  },
  {
    id: 'w5-idisposable-purpose',
    conceptId: 'standard-interfaces',
    question: 'What is `IDisposable` for?',
    options: [
      'Releasing resources such as files and connections promptly, rather than waiting for the collector',
      'Deleting an object from memory immediately',
      'Making an object sortable',
      'Marking a class as no longer in use',
    ],
    answer: 0,
    why: [
      '',
      'You cannot free managed memory by hand; the collector still owns that decision.',
      'That is `IComparable`.',
      'There is no such marker.',
    ],
    explain:
      'The garbage collector is non-deterministic, so anything that must be closed *now* — a file handle, a socket — needs an explicit release. That is what `Dispose()` and `using` are for.',
    source: 'Quiz 5 Q9 with Quiz 3 Q13',
  },
  {
    id: 'w5-interface-scenario-choose',
    conceptId: 'standard-interfaces',
    question:
      'You want `List<Item>.Sort()` to order items by name. What do you do?',
    options: [
      'Make `Item` implement `IComparable` and write `CompareTo` to compare names',
      'Add a `Sort()` method to `Item`',
      'Make `Item` inherit from `List<Item>`',
      'Nothing — `Sort()` orders objects by name automatically',
    ],
    answer: 0,
    why: [
      '',
      'Sorting is the collection\'s job; the item only has to say how two of them compare.',
      'An item is not a list of items.',
      'The library cannot guess which field ordering should be based on.',
    ],
    explain:
      'The library supplies the algorithm and asks your type for one thing: the comparison. That division is what makes a general-purpose sort possible at all.',
    source: 'Quiz 5 Q9, applied',
  },
  {
    id: 'w5-interfaces-in-bcl',
    conceptId: 'standard-interfaces',
    question: 'Why is so much of the .NET library defined in terms of interfaces?',
    options: [
      'So library code can work with types that did not exist when it was written',
      'Because interfaces compile to smaller assemblies',
      'Because classes cannot be used as parameters',
      'To prevent programmers from writing their own classes',
    ],
    answer: 0,
    why: [
      '',
      'Size is not the motivation.',
      'Classes are used as parameters constantly.',
      'The opposite — it is what lets your classes join in.',
    ],
    explain:
      '`Sort` was written years before your `Item` class. It works on it because it asks for a capability, not for a particular ancestry.',
    source: 'Lecture 5 with Lecture 2, framework classes',
  },

  // ------------------------------------------------------- exceptions: why
  {
    id: 'w5-exception-is-object',
    conceptId: 'exceptions-why',
    question: 'True or false: an exception is an object carrying an error message.',
    options: ['True', 'False'],
    answer: 0,
    why: ['', 'Exceptions are instances of classes deriving from `System.Exception`, carrying a `Message`, a `StackTrace` and possibly an inner exception.'],
    explain:
      'Because it is an object, it can be caught by type, carry structured detail, and be defined by you — which is what makes exception handling more than a return code.',
    source: 'Quiz 5 Q14',
  },
  {
    id: 'w5-exception-not-compile',
    conceptId: 'exceptions-why',
    question: 'Which kind of error do exceptions deal with?',
    options: [
      'Runtime errors — things that go wrong while the program is executing',
      'Syntax errors, before the program is built',
      'Type errors the compiler reports',
      'Errors in the design of the class hierarchy',
    ],
    answer: 0,
    why: [
      '',
      'The compiler rejects those; the program never runs, so nothing can catch anything.',
      'Also a compile-time matter.',
      'A design problem is not an error the language can raise.',
    ],
    explain:
      'The compiler comes first and catches what it can see. Exceptions exist for what cannot be known until the program runs — a missing file, a null reference, a bad division.',
    source: 'Quiz 5 Q12',
  },
  {
    id: 'w5-exception-control-flow',
    conceptId: 'exceptions-why',
    code: `try
{
    while (true)
    {
        item = list[i];
        i++;
    }
}
catch (IndexOutOfRangeException)
{
    // reached the end
}`,
    question: 'What is wrong with using an exception to end this loop?',
    options: [
      'It uses an exception for ordinary control flow, which is slow and hides the real intent',
      'You cannot catch `IndexOutOfRangeException`',
      'A `try` block may not contain a loop',
      'Nothing — this is the idiomatic way to iterate',
    ],
    answer: 0,
    why: [
      '',
      'It can be caught; that is not the objection.',
      'A `try` block may contain anything.',
      'The idiomatic way is `for (int i = 0; i < list.Count; i++)`, which says what it means.',
    ],
    explain:
      'Exceptions are for the **exceptional**. Reaching the end of a list is expected, so it should be a condition, not a thrown object and a stack unwind.',
    source: 'Quiz 5 Q2, applied',
  },
  {
    id: 'w5-when-to-throw',
    conceptId: 'exceptions-why',
    question: 'Which of these is a good reason to throw an exception?',
    options: [
      'A method was given an argument it cannot possibly work with',
      'A user typed their name in lower case',
      'A loop has reached its last item',
      'A search found no matching result, which happens routinely',
    ],
    answer: 0,
    why: [
      '',
      'That is a formatting matter, handled with ordinary code.',
      'Expected, and the loop condition already covers it.',
      '"Not found" is a normal outcome; returning `null` or a `bool` says so without the cost.',
    ],
    explain:
      'Ask whether the caller could reasonably have expected this. If the answer is yes, it is a return value; if the situation means the method genuinely cannot do its job, throw.',
    source: 'Quiz 5 Q2',
  },
  {
    id: 'w5-custom-exception-base',
    conceptId: 'exceptions-why',
    code: `class InvalidMoveException : Exception
{
    public InvalidMoveException(string message) : base(message) { }
}`,
    question: 'What makes this a valid custom exception?',
    options: [
      'It derives from `Exception` and passes its message up with `: base(message)`',
      'Its name ends in `Exception`',
      'It is declared in the same file as the code that throws it',
      'It has exactly one constructor',
    ],
    answer: 0,
    why: [
      '',
      'A helpful convention, but the compiler does not care what it is called.',
      'File layout is irrelevant.',
      'It may have as many as it likes.',
    ],
    explain:
      'Only objects deriving from `System.Exception` can be thrown. Passing the message to the base constructor is what makes `.Message` work on the way out.',
    source: 'Quiz 5 Q1',
  },
  {
    id: 'w5-throw-non-exception',
    conceptId: 'exceptions-why',
    question: 'Can you `throw new string("something went wrong");`?',
    options: [
      'No — only objects deriving from `System.Exception` can be thrown',
      'Yes — any object can be thrown in C#',
      'Yes, but only inside a `try` block',
      'Only if the string is not null',
    ],
    answer: 0,
    why: [
      '',
      'Some languages allow it; C# does not.',
      'Location makes no difference to the rule.',
      'Nullness is unrelated.',
    ],
    explain:
      'The restriction is what makes `catch (SomeType)` meaningful — every thrown thing is guaranteed to carry a message and a stack trace.',
    source: 'Quiz 5 Q1, distractor analysis',
  },
  {
    id: 'w5-exception-message',
    conceptId: 'exceptions-why',
    code: `catch (Exception ex)
{
    Console.WriteLine(ex.Message);
}`,
    question: 'What does `ex.Message` give you?',
    options: [
      'The text describing what went wrong, set when the exception was created',
      'The line number the error occurred on',
      'The name of the exception class',
      'The value that caused the problem',
    ],
    answer: 0,
    why: [
      '',
      'Line numbers are in the `StackTrace`, not the `Message`.',
      'That is `ex.GetType().Name`.',
      'Only if whoever threw it put that value into the message text.',
    ],
    explain:
      'The message is only as useful as the person who wrote it. That is why a custom exception takes one and passes it to `base(message)`.',
    source: 'Quiz 5 Q14, applied',
  },

  // ------------------------------------------------ try / catch / finally
  {
    id: 'w5-finally-no-exception',
    conceptId: 'try-catch',
    code: `try
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
}`,
    question: 'What is the output?',
    options: ['`A` then `C`', '`A` then `B` then `C`', '`A` only', '`A` then `B`'],
    answer: 0,
    why: [
      '',
      'The `catch` runs only if something is thrown, and nothing here throws.',
      '`finally` runs whether or not there was an exception — that is the whole rule.',
      'The `catch` is skipped, not the `finally`.',
    ],
    explain:
      '`finally` runs **unconditionally**. The most common wrong answer to this shape of question is assuming it only runs after a `catch`.',
    source: 'Quiz 5 Q11, applied',
  },
  {
    id: 'w5-finally-with-return',
    conceptId: 'try-catch',
    code: `int Get()
{
    try
    {
        return 1;
    }
    finally
    {
        Console.WriteLine("cleanup");
    }
}

Console.WriteLine(Get());`,
    question: 'What is the output?',
    options: ['`cleanup` then `1`', '`1` then `cleanup`', '`1` only', '`cleanup` only'],
    answer: 0,
    why: [
      '',
      'The `finally` runs *before* control actually leaves the method, so its output comes first.',
      '`finally` runs even on the way out through a `return`.',
      'The method still returns 1, and the caller still prints it.',
    ],
    explain:
      '"Always" includes leaving via `return`. The return value is computed, the `finally` runs, then control leaves — which is precisely why cleanup belongs there.',
    source: 'Quiz 5 Q11, extended',
    stretch: true,
  },
  {
    id: 'w5-catch-order',
    conceptId: 'try-catch',
    code: `try
{
    int x = 5 / 0;
}
catch (Exception)
{
    Console.WriteLine("general");
}
catch (DivideByZeroException)
{
    Console.WriteLine("specific");
}`,
    question: 'What happens with this code?',
    options: [
      'A compile error — the general `catch` makes the specific one unreachable',
      'It prints `general`',
      'It prints `specific`',
      'It prints both',
    ],
    answer: 0,
    why: [
      '',
      'The compiler refuses to build it, so nothing runs.',
      'The specific handler can never be reached, and C# treats that as an error rather than a warning.',
      'At most one `catch` ever runs.',
    ],
    explain:
      'Catch blocks are tried top to bottom, so the **specific type must come first**. Putting `Exception` first would swallow everything below it.',
    source: 'Lecture 5, catch order',
  },
  {
    id: 'w5-catch-specific-first',
    conceptId: 'try-catch',
    code: `try
{
    string s = null;
    Console.WriteLine(s.Length);
}
catch (DivideByZeroException)
{
    Console.WriteLine("divide");
}
catch (Exception)
{
    Console.WriteLine("general");
}
finally
{
    Console.WriteLine("done");
}`,
    question: 'What is the output?',
    options: ['`general` then `done`', '`divide` then `done`', '`done` only', '`general` only'],
    answer: 0,
    why: [
      '',
      'A `NullReferenceException` is not a `DivideByZeroException`, so that handler does not match.',
      'A matching handler was found, so it runs before the `finally`.',
      '`finally` always runs.',
    ],
    explain:
      'Each `catch` is checked for a type match in order. The first that matches runs, the rest are skipped, and `finally` runs afterwards regardless.',
    source: 'Quiz 5 Q7, varied',
  },
  {
    id: 'w5-after-catch-continues',
    conceptId: 'try-catch',
    code: `try
{
    int x = 5 / 0;
    Console.WriteLine("A");
}
catch (DivideByZeroException)
{
    Console.WriteLine("B");
}
Console.WriteLine("C");`,
    question: 'What is the output?',
    options: ['`B` then `C`', '`A` then `B` then `C`', '`B` only', '`A` then `C`'],
    answer: 0,
    why: [
      '',
      '`A` is never reached — the exception is thrown on the line above it.',
      'Once the exception is handled, execution carries on after the whole try/catch.',
      'The division throws before `A` can print.',
    ],
    explain:
      'Two things at once: the **rest of the `try` block is abandoned**, and once a handler has run the program continues normally after the block.',
    source: 'Quiz 5 Q8, extended',
  },
  {
    id: 'w5-finally-optional',
    conceptId: 'try-catch',
    question: 'Which statement about `finally` is TRUE?',
    options: [
      'It is optional, but if written it always executes',
      'It is required whenever you write a `try`',
      'It runs only when an exception was thrown',
      'It runs only when no exception was thrown',
    ],
    answer: 0,
    why: [
      '',
      '`try`/`catch` with no `finally` is perfectly valid.',
      'That is the most common misconception about it.',
      'It runs in both cases — that is the point of it.',
    ],
    explain:
      'Optional to write, unconditional once written. Cleanup that must happen either way goes there and nowhere else.',
    source: 'Quiz 5 Q11',
  },
  {
    id: 'w5-try-scope',
    conceptId: 'try-catch',
    code: `try
{
    int result = 10 / 2;
}
catch (Exception)
{
}
Console.WriteLine(result);`,
    question: 'Why does this not compile?',
    options: [
      '`result` is declared inside the `try` block, so it does not exist outside it',
      '`10 / 2` cannot throw, so the `try` is invalid',
      'An empty `catch` block is not allowed',
      '`Console.WriteLine` cannot be used after a `catch`',
    ],
    answer: 0,
    why: [
      '',
      'You may guard code that cannot throw; it is pointless, not illegal.',
      'An empty `catch` compiles — it is bad practice, not an error.',
      'Code after a try/catch is completely normal.',
    ],
    explain:
      'A `try` block is a scope like any other. Declare the variable before the `try` when you need it afterwards.',
    source: 'Lecture 5, try/catch',
    stretch: true,
  },
  {
    id: 'w5-catch-variable',
    conceptId: 'try-catch',
    question: 'What is the difference between `catch (Exception)` and `catch (Exception ex)`?',
    options: [
      'The second names the exception object so you can read `ex.Message`',
      'The first catches more exception types than the second',
      'The second catches only exceptions that have a message',
      'There is no difference at all in what is caught',
    ],
    answer: 0,
    why: [
      '',
      'Both catch exactly the same set — the type decides that.',
      'Every exception has a `Message`.',
      'What is caught is identical; what you can *do* with it is not.',
    ],
    explain:
      'Name it when you need the detail, leave it unnamed when the type alone is the information. Quiz 5\'s traces use the unnamed form.',
    source: 'Quiz 5 Q7 and Q8, notation',
  },
  {
    id: 'w5-nested-try',
    conceptId: 'try-catch',
    code: `try
{
    try
    {
        int x = 5 / 0;
    }
    finally
    {
        Console.WriteLine("inner finally");
    }
}
catch (DivideByZeroException)
{
    Console.WriteLine("outer catch");
}`,
    question: 'What is the output?',
    options: [
      '`inner finally` then `outer catch`',
      '`outer catch` then `inner finally`',
      '`outer catch` only',
      '`inner finally` only',
    ],
    answer: 0,
    why: [
      '',
      'The inner `finally` runs as the exception passes through it, on its way out.',
      'The `finally` runs even though the inner block has no `catch` of its own.',
      'The exception is unhandled inside, so it propagates and the outer handler catches it.',
    ],
    explain:
      'An inner `try` with only a `finally` is a way of guaranteeing cleanup while letting the exception continue outwards to whoever is equipped to handle it.',
    source: 'Quiz 5 Q11 with Q10',
    stretch: true,
  },
  {
    id: 'w5-null-length-trace',
    conceptId: 'try-catch',
    code: `try
{
    string text = null;
    Console.WriteLine(text.Length);
    Console.WriteLine("after");
}
catch (NullReferenceException)
{
    Console.WriteLine("Null reference detected.");
}
finally
{
    Console.WriteLine("End of program.");
}`,
    question: 'What is the output?',
    options: [
      '`Null reference detected.` then `End of program.`',
      '`after` then `End of program.`',
      '`Null reference detected.` only',
      '`after`, `Null reference detected.`, `End of program.`',
    ],
    answer: 0,
    why: [
      '',
      '`text.Length` throws before `"after"` can be reached.',
      '`finally` still runs after the handler.',
      'Everything after the throwing line inside the `try` is abandoned.',
    ],
    explain:
      'Throw → rest of `try` abandoned → matching `catch` → `finally`. That order is what every one of these traces is testing.',
    source: 'Quiz 5 Q7',
  },

  // ------------------------------------------------------- exception flow
  {
    id: 'w5-propagate-two-levels',
    conceptId: 'exception-flow',
    code: `void C() { throw new InvalidOperationException(); }
void B() { C(); Console.WriteLine("B done"); }
void A()
{
    try { B(); }
    catch (InvalidOperationException) { Console.WriteLine("caught in A"); }
}

A();`,
    question: 'What is the output?',
    options: [
      '`caught in A`',
      '`B done` then `caught in A`',
      '`caught in A` then `B done`',
      'Nothing — the program crashes',
    ],
    answer: 0,
    why: [
      '',
      '`B` never resumes: the exception was thrown by `C()` and abandoned the rest of `B` on its way out.',
      'Once an exception has unwound past `B`, there is nothing to go back to.',
      '`A` has a matching handler, so it does not crash.',
    ],
    explain:
      'An exception unwinds frame by frame looking for a handler, abandoning the rest of every method it passes through. Only the frame that catches it carries on.',
    source: 'Quiz 5 Q10, applied',
  },
  {
    id: 'w5-unhandled-result',
    conceptId: 'exception-flow',
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
      'Nothing ignores it — that is what "unhandled" means.',
      'There is no default to substitute.',
      'The compiler cannot know which exceptions will be thrown at runtime.',
    ],
    explain:
      'The search runs out of frames, and the runtime terminates the process. It is why the outermost layer of a real application usually catches broadly and logs.',
    source: 'Quiz 5 Q10',
  },
  {
    id: 'w5-catch-wrong-type',
    conceptId: 'exception-flow',
    code: `try
{
    int x = 5 / 0;
}
catch (NullReferenceException)
{
    Console.WriteLine("caught");
}
Console.WriteLine("after");`,
    question: 'What happens?',
    options: [
      'The `DivideByZeroException` is not caught, and it propagates out of this block',
      'It prints `caught` then `after`',
      'It prints `after` only',
      'The `catch` matches anyway, because both derive from `Exception`',
    ],
    answer: 0,
    why: [
      '',
      'The handler is for a different type entirely.',
      'The exception is still in flight; execution does not resume after the block.',
      'Deriving from a common base does not make two sibling types match each other.',
    ],
    explain:
      'A `catch` matches its declared type **or a subtype of it**. `NullReferenceException` is neither a `DivideByZeroException` nor a base of one, so the search continues outwards.',
    source: 'Quiz 5 Q10, applied',
  },
  {
    id: 'w5-catch-base-matches',
    conceptId: 'exception-flow',
    code: `try
{
    int x = 5 / 0;
}
catch (Exception)
{
    Console.WriteLine("caught");
}`,
    question: 'Does this catch the exception?',
    options: [
      'Yes — `DivideByZeroException` derives from `Exception`, so the handler matches',
      'No — the types must match exactly',
      'Only if the exception is rethrown',
      'Only if a `finally` block is added',
    ],
    answer: 0,
    why: [
      '',
      'Subtype matching is exactly how handler selection works.',
      'Rethrowing sends it further out, not into this handler.',
      '`finally` has nothing to do with matching.',
    ],
    explain:
      'This is polymorphism again: a handler for a base type catches every derived type. It is also why `catch (Exception)` must come last.',
    source: 'Quiz 5 Q10 with Quiz 4 Q1',
  },
  {
    id: 'w5-where-to-handle',
    conceptId: 'exception-flow',
    question:
      'A low-level method cannot open a configuration file. Where should the exception be handled?',
    options: [
      'Wherever there is enough context to do something useful about it',
      'Immediately, in the method that discovered the problem',
      'In `Main`, always',
      'Nowhere — let it crash',
    ],
    answer: 0,
    why: [
      '',
      'That method usually knows what went wrong but not what to do about it.',
      'Sometimes right, but it is not a rule — a retry might belong much lower.',
      'Fine for a prototype, not for anything a user runs.',
    ],
    explain:
      'Exceptions travel so that detection and handling can happen in different places. The whole design is "throw where it goes wrong, catch where you can respond".',
    source: 'Lecture 5, exception propagation',
    stretch: true,
  },
  {
    id: 'w5-finally-during-propagation',
    conceptId: 'exception-flow',
    code: `void Risky()
{
    try
    {
        throw new InvalidOperationException();
    }
    finally
    {
        Console.WriteLine("cleanup");
    }
}

try { Risky(); }
catch (InvalidOperationException) { Console.WriteLine("handled"); }`,
    question: 'What is the output?',
    options: ['`cleanup` then `handled`', '`handled` then `cleanup`', '`handled` only', '`cleanup` only'],
    answer: 0,
    why: [
      '',
      'The inner frame\'s `finally` runs as the exception leaves it — before the outer handler is reached.',
      'The `finally` runs even though this frame has no `catch`.',
      'The outer `catch` does match and does run.',
    ],
    explain:
      'Unwinding runs the `finally` of every frame it leaves, in order, on the way out. That is what makes `finally` a reliable place for cleanup.',
    source: 'Quiz 5 Q10 and Q11',
    stretch: true,
  },
  {
    id: 'w5-exception-abandons-rest',
    conceptId: 'exception-flow',
    code: `try
{
    Console.WriteLine("1");
    int x = 5 / 0;
    Console.WriteLine("2");
}
catch (DivideByZeroException)
{
    Console.WriteLine("3");
}`,
    question: 'What is the output?',
    options: ['`1` then `3`', '`1`, `2`, `3`', '`1` then `2`', '`3` only'],
    answer: 0,
    why: [
      '',
      '`2` is never reached — the throw abandons the remainder of the `try`.',
      'The exception is caught, so `3` prints.',
      '`1` printed before anything went wrong.',
    ],
    explain:
      'A `try` block is abandoned at the point of the throw, not at the end. Everything before it has already happened; nothing after it will.',
    source: 'Quiz 5 Q8, extended',
  },
  {
    id: 'w5-rethrow',
    conceptId: 'exception-flow',
    code: `catch (IOException)
{
    Console.WriteLine("logging");
    throw;
}`,
    question: 'What does the bare `throw;` do?',
    options: [
      'Rethrows the same exception so an outer handler can deal with it too',
      'Throws a brand-new exception of the same type',
      'Ends the program immediately',
      'Cancels the exception',
    ],
    answer: 0,
    why: [
      '',
      'That would be `throw new IOException(...)`, which loses the original stack trace.',
      'Only if nothing further out catches it.',
      'A `catch` that does nothing cancels it; `throw;` deliberately does not.',
    ],
    explain:
      'Handle what you can, pass on what you cannot. A bare `throw;` preserves the original stack trace, which `throw ex;` would reset.',
    source: 'Lecture 5, exception handling',
    stretch: true,
  },
];
