/**
 * Week 11 question bank — other OO languages, memory, benchmarking.
 *
 * Sourced from `Lecture 11.md`. There is no Quiz 11 in the resources folder,
 * which makes this the only week in the bank written without one — so the
 * questions come from the lecture's own two halves: the cross-language
 * comparison (C++, Swift, JavaScript), the three object-destruction
 * strategies, static vs dynamic typing, and the `Stopwatch`/`WorkingSet64`
 * benchmarking the Week 12 task needs.
 *
 * Two mockup questions sit here rather than in an earlier week, because
 * Lecture 11 is where the unit revisits them:
 *
 *   **Q7** (what is passed when you pass an object to a method) is Week 3
 *   memory material, re-asked in Week 11's stack/heap section. It is tagged
 *   to Week 11's `stack-heap-languages` concept only where the question is
 *   about the cross-language rule; the plain C# form stays in Week 3, where a
 *   student who misses it should be sent.
 *
 *   **Q10** (try/catch/finally) is Week 5 material and stays there. What is
 *   new here is Lecture 11's framing that `finally` always running is
 *   "fundamental to most languages, not just C#".
 */

import type { FocusQuestion } from '../types';

export const WEEK11: FocusQuestion[] = [
  // ------------------------------------------------- OOP across languages
  {
    id: 'w11-why-other-languages',
    conceptId: 'cross-language-oop',
    question: 'Why does the unit review OOP concepts in languages other than C#?',
    options: [
      'Industry uses many languages, you often do not choose which, and the core ideas transfer',
      'Because C# is being retired',
      'Because other languages implement OOP more correctly',
      'Because the final exam is written in C++',
    ],
    answer: 0,
    why: [
      '',
      'Nothing of the sort is suggested.',
      'The lecture’s point is that they implement the *same* ideas with different syntax, not better or worse.',
      'The exam is C#-based. The cross-language material is conceptual.',
    ],
    explain:
      'Legacy systems and employer choice mean you may be handed a project in a language you do not know. Abstraction, encapsulation, inheritance and polymorphism transfer; only syntax changes.',
    source: 'Lecture 11 §4',
  },
  {
    id: 'w11-cpp-class',
    conceptId: 'cross-language-oop',
    code: `class SomeClass
{
    private:
    string _someString;

    public:
    SomeClass(string str)
    {
        _someString = str;
    }

    void printSomething()
    {
        cout << "This is a String: " << _someString << endl;
    }

};`,
    question: 'Which difference from C# does this C++ class show?',
    options: [
      '`private:` and `public:` are section labels, and the class ends with a semicolon',
      'C++ classes cannot have constructors',
      'C++ requires every method to be public',
      'C++ does not support private data members',
    ],
    answer: 0,
    why: [
      '',
      '`SomeClass(string str)` is the constructor — same convention as C#, named after the class.',
      '`private:` right there says otherwise.',
      'It has one: `_someString`.',
    ],
    explain:
      'Two syntactic differences worth recognising. In C# the modifier goes on each member; in C++ a label applies to everything after it until the next label. And the closing brace takes a `;`.',
    source: 'Lecture 11 §5.1',
  },
  {
    id: 'w11-swift-init',
    conceptId: 'cross-language-oop',
    question: 'In Swift, what declares a constructor, and how is an object created?',
    options: [
      '`init`, and instantiation uses no `new` keyword — `SomeClass(str: "hello")`',
      '`constructor`, with `new SomeClass("hello")`',
      'A method named after the class, with `new SomeClass("hello")`',
      '`func init`, with `SomeClass.create("hello")`',
    ],
    answer: 0,
    why: [
      '',
      '`constructor` is JavaScript’s class syntax, not Swift’s.',
      'That is the C#/C++ convention. Swift uses a dedicated keyword.',
      '`func` declares ordinary methods; `init` stands alone.',
    ],
    explain:
      '`init` is the same idea as Python’s `__init__`. The absence of `new` is the other thing to recognise — the type name alone constructs.',
    source: 'Lecture 11 §5.2',
  },
  {
    id: 'w11-js-prototype',
    conceptId: 'cross-language-oop',
    code: `function Fruit (fruitName, fruitColor) {
    this.name = fruitName;
    this.color = fruitColor;
}

Fruit.prototype = new Plant ();

var aBanana = new Fruit ("Banana", "Yellow");`,
    question: 'What does `Fruit.prototype = new Plant();` express?',
    options: [
      'Inheritance — every `Fruit` gains `Plant`’s methods and properties',
      'That a `Fruit` contains a `Plant` as a field',
      'That `Plant` and `Fruit` are the same class',
      'That `Fruit` objects are created by a `Plant` factory',
    ],
    answer: 0,
    why: [
      '',
      'Composition would be `this.plant = new Plant()`. The prototype chain is a different mechanism.',
      'They stay distinct; one is placed in the other’s lookup chain.',
      'No factory is involved.',
    ],
    explain:
      'JavaScript is **prototype-based**: inheritance is one object delegating lookups to another, rather than a class declaring a base. Attaching a function to `X.prototype` is roughly adding a method to class X.',
    source: 'Lecture 11 §5.3',
  },
  {
    id: 'w11-four-pillars-transfer',
    conceptId: 'cross-language-oop',
    question: 'What does every OO language express, whatever its syntax?',
    options: [
      'Abstraction, encapsulation, inheritance and polymorphism',
      'Garbage collection and static typing',
      'Interfaces and abstract classes, with those exact keywords',
      'Stack allocation of objects',
    ],
    answer: 0,
    why: [
      '',
      'Both vary by language — C++ has neither by default.',
      'The ideas transfer; the keywords do not. JavaScript has neither keyword.',
      'C# never stack-allocates objects; C++ can. This is one of the things that differs.',
    ],
    explain:
      'The four pillars are the transferable part. Everything else in this lecture is a list of what each language does *differently* around them.',
    source: 'Lecture 11 §10',
  },

  // ----------------------------------------------------- stack and heap
  {
    id: 'w11-cpp-stack-heap',
    conceptId: 'stack-heap-languages',
    code: `int main() {
    SomeClass obj1("obj1");
    SomeClass *obj2 = new SomeClass("obj2");

    obj1.printSomething();
    obj2->printSomething();

    return 0;
}`,
    question: 'What is the difference between `obj1` and `obj2`?',
    options: [
      '`obj1` is on the stack and uses dot syntax; `obj2` is on the heap behind a pointer and uses arrow syntax',
      '`obj1` is a copy of `obj2`',
      '`obj1` is constant and `obj2` can be modified',
      'They are identical; the syntax is a style choice',
    ],
    answer: 0,
    why: [
      '',
      'They are two separate objects built from two separate constructor calls.',
      'Neither is const. Nothing here restricts modification.',
      'The syntax follows directly from where the object lives — it is not interchangeable.',
    ],
    explain:
      'C++ and Delphi let the developer choose. Declared directly = stack, accessed with `.`; created with `new` = heap, reached through a pointer with `->`.',
    source: 'Lecture 11 §6.1',
  },
  {
    id: 'w11-csharp-always-heap',
    conceptId: 'stack-heap-languages',
    question: 'How does C# differ from C++ on object placement?',
    options: [
      'C# objects always live on the heap; the developer cannot choose stack placement',
      'C# objects always live on the stack',
      'C# lets you choose with a keyword, like C++',
      'C# places small objects on the stack automatically',
    ],
    answer: 0,
    why: [
      '',
      'Value types do, but reference types — classes — do not.',
      'There is no such keyword for class instances.',
      'No size-based rule exists for class instances.',
    ],
    explain:
      'C# abstracts the choice away. `new` is required to allocate, but you never decide where — reference types go to the heap, and the variable on the stack holds a reference to it.',
    source: 'Lecture 11 §6.1',
  },
  {
    id: 'w11-pass-object',
    conceptId: 'stack-heap-languages',
    question: 'When you pass an object to a method in C#, what is actually passed?',
    options: [
      'A reference to the object’s memory on the heap',
      'A copy of the entire object',
      'A pointer to the object’s memory on the stack',
      'The object by value, stored in a new memory location',
    ],
    answer: 0,
    why: [
      '',
      'Copying the whole object is what happens with a *value* type, not a class instance.',
      'The right idea about indirection, wrong region. The object is on the heap; it is the *variable* that sits on the stack.',
      'Same misconception as option B, worded differently — and the giveaway is "new memory location", which would mean changes inside the method could not be seen outside.',
    ],
    explain:
      'The variable sits on the stack and holds a reference; the object is on the heap. That is why a method that mutates an object it was passed changes the caller’s object too.',
    source: 'Mockup paper Q7; Lecture 11 §3 row 7',
  },
  {
    id: 'w11-pointer-vs-reference',
    conceptId: 'stack-heap-languages',
    question: 'What does C#’s low-level control compare to, against C++?',
    options: [
      'C++ trades manual bookkeeping for low-level control; C# trades that control for a managed runtime',
      'C# gives more low-level control than C++',
      'Both give identical control over memory',
      'Neither allows the developer any influence over memory',
    ],
    answer: 0,
    why: [
      '',
      'The reverse. C++ is the low-level language here.',
      'They differ precisely on this.',
      'C++ developers have a great deal of influence, and a corresponding burden.',
    ],
    explain:
      'The lecture frames it as a trade: C++’s performance benefit comes with the risk of memory leaks, while C# removes both the control and the bookkeeping.',
    source: 'Lecture 11 §7.1',
  },

  // ------------------------------------------------- static/dynamic typing
  {
    id: 'w11-static-dynamic',
    conceptId: 'static-dynamic-typing',
    question: 'What distinguishes static from dynamic typing?',
    options: [
      'Static checks the declared type at compile time; dynamic lets the object decide at run time',
      'Static types cannot change value; dynamic types can',
      'Static typing is for compiled languages only, dynamic for interpreted only',
      'Static typing requires declaring every variable as `var`',
    ],
    answer: 0,
    why: [
      '',
      'Confusing typing with `const`/`readonly`. A statically typed variable’s *value* changes freely.',
      'A reasonable correlation, but not the definition — and there are counterexamples in both directions.',
      '`var` in C# is still static typing: the compiler infers the type and fixes it.',
    ],
    explain:
      'The real question is *when* the type is checked and *what decides capability* — the declared variable type, or the object itself.',
    source: 'Lecture 11 §6.2',
  },
  {
    id: 'w11-typing-languages',
    conceptId: 'static-dynamic-typing',
    question: 'Which group is statically typed?',
    options: [
      'C++, C#, Java',
      'JavaScript, Python, Objective-C',
      'C#, JavaScript, Swift',
      'Python, Java, Ruby',
    ],
    answer: 0,
    why: [
      '',
      'The lecture’s examples of dynamic typing.',
      'JavaScript is dynamically typed, so this group is mixed.',
      'Python is dynamic, so this group is mixed too.',
    ],
    explain:
      'Static: C++, C#, Java. Dynamic: JavaScript, Python (loosely), Objective-C. Some languages, Python and Objective-C among them, blend features of both.',
    source: 'Lecture 11 §6.2',
  },
  {
    id: 'w11-typing-what-decides',
    conceptId: 'static-dynamic-typing',
    question: 'Under dynamic typing, what decides whether an operation is allowed?',
    options: [
      'The object itself, at run time',
      'The declared type of the variable, at compile time',
      'The compiler’s optimiser',
      'The order in which classes were declared',
    ],
    answer: 0,
    why: [
      '',
      'That is static typing.',
      'Optimisation does not affect what is legal.',
      'Declaration order is irrelevant.',
    ],
    explain:
      'The consequence: an error that C# catches before the program runs may not surface in a dynamically typed language until the offending line actually executes.',
    source: 'Lecture 11 §6.2',
  },

  // ------------------------------------------------- destroying objects
  {
    id: 'w11-destruction-strategies',
    conceptId: 'object-destruction',
    question: 'Which correctly matches each memory strategy to its languages?',
    options: [
      'Manual delete: C++ · Reference counting: Swift, Objective-C · Garbage collection: C#, Java',
      'Manual delete: C#, Java · Reference counting: C++ · Garbage collection: Swift',
      'Manual delete: Swift · Reference counting: C#, Java · Garbage collection: C++',
      'All four languages use garbage collection',
    ],
    answer: 0,
    why: [
      '',
      'C# and Java are the garbage-collected pair, not the manual one.',
      'Reversed throughout.',
      'C++ has none, and Swift uses reference counting.',
    ],
    explain:
      'Three strategies, distinguished by **who is responsible**: the developer (C++), the object itself via its reference count (Swift, Objective-C), or the runtime (C#, Java).',
    source: 'Lecture 11 §7.4',
  },
  {
    id: 'w11-destructor',
    conceptId: 'object-destruction',
    code: `class SomeClass
{
    private:
    SomeOtherClass *_someObject;

    public:
    SomeClass(string str)
    {
        _someObject = new SomeOtherClass();
    }

    ~SomeClass()
    {
        delete _someObject;
    }
};`,
    question: 'What is `~SomeClass()` and why does it matter?',
    options: [
      'A destructor — without deleting what it owns, the heap object leaks',
      'A constructor overload for an empty argument list',
      'An operator that negates the object',
      'A C++ equivalent of C#’s garbage collector',
    ],
    answer: 0,
    why: [
      '',
      'A constructor has no `~` and the class already has one above.',
      '`~` is bitwise NOT as an operator, but prefixed to a class name it declares a destructor.',
      'The point is precisely that C++ has no collector — this is the manual replacement.',
    ],
    explain:
      'The `~` destructor cleans up when the object is deleted, and must propagate deletion to anything it owns. Miss it, and you have heap objects nothing can reach and nothing will free.',
    source: 'Lecture 11 §7.1',
  },
  {
    id: 'w11-refcounting',
    conceptId: 'object-destruction',
    question: 'How does reference counting decide when to free an object?',
    options: [
      'The object tracks how many references point at it and deletes itself when the count hits zero',
      'The runtime scans the heap periodically for unreachable objects',
      'The developer calls `release()` explicitly',
      'Objects are freed when the method that created them returns',
    ],
    answer: 0,
    why: [
      '',
      'That is garbage collection — a different strategy with a different owner.',
      'The whole point is that no explicit call is needed.',
      'That is how stack variables behave, not heap objects.',
    ],
    explain:
      'Each object holds its own "how many things need me?" counter. Nothing needs it, so it cleans itself up — no `delete` from the developer and no runtime scan.',
    source: 'Lecture 11 §7.2',
  },
  {
    id: 'w11-gc-generations',
    conceptId: 'object-destruction',
    question: 'How does .NET’s garbage collector work, as the lecture describes it?',
    options: [
      'It keeps a graph of references and collects by generation, from short-lived to long-term',
      'It frees every object immediately once its last reference is dropped',
      'It runs only when the program exits',
      'It requires the developer to mark objects as collectable',
    ],
    answer: 0,
    why: [
      '',
      'That is reference counting. The collector is not immediate, which is why finalisation timing is unpredictable.',
      'It triggers during execution, typically when heap usage crosses a threshold.',
      'No marking is needed — reachability is worked out from the graph.',
    ],
    explain:
      'Generations let the collector scan short-lived objects often and long-lived ones rarely, since most objects die young. This is why you have never written a destructor in Swin Adventure.',
    source: 'Lecture 11 §7.3',
    stretch: true,
  },
  {
    id: 'w11-memory-leak',
    conceptId: 'object-destruction',
    question: 'What is a memory leak, in the C++ sense the lecture describes?',
    options: [
      'Heap objects that are no longer reachable but were never freed',
      'A program using more RAM than another program',
      'Data written outside the bounds of an array',
      'An object being deleted twice',
    ],
    answer: 0,
    why: [
      '',
      'Using memory is not leaking it. The defining feature is that it can never be reclaimed.',
      'That is a buffer overrun, a different fault.',
      'That is a double-free — also a bug, and the opposite failure.',
    ],
    explain:
      'Unreachable *and* unfreed. The program can no longer use that memory and will never give it back — which is why the lecture warns against creating millions of objects without destroying them.',
    source: 'Lecture 11 §7.1',
  },

  // --------------------------------------------------------- benchmarking
  {
    id: 'w11-stopwatch',
    conceptId: 'benchmarking',
    question: 'How do you measure execution time in C#?',
    options: [
      '`Stopwatch.StartNew()` before the block, `Stop()` after, then read `ElapsedMilliseconds`',
      '`Console.ReadTime()` before and after the block',
      '`Process.ElapsedMilliseconds`',
      '`Thread.Sleep()` around the block',
    ],
    answer: 0,
    why: [
      '',
      'No such method exists.',
      '`Process` reports memory, not elapsed time.',
      '`Sleep` pauses the thread — it would add to the time, not measure it.',
    ],
    explain:
      'From `System.Diagnostics`. `DateTime.Now` before and after, or `Stopwatch.GetTimestamp()`, are the alternatives the lecture names.',
    source: 'Lecture 11 §8.1',
  },
  {
    id: 'w11-stopwatch-placement',
    conceptId: 'benchmarking',
    question: 'Why does the lecture insist `StartNew()` goes immediately before the code being timed?',
    options: [
      'Starting earlier includes unrelated setup in the measurement, making it inaccurate',
      'The stopwatch cannot be started more than once per method',
      'The compiler removes a stopwatch declared too early',
      'Starting earlier causes an exception',
    ],
    answer: 0,
    why: [
      '',
      'It can be reset and reused freely.',
      'Nothing is removed.',
      'No exception — just a wrong number, which is more dangerous.',
    ],
    explain:
      'You are timing whatever sits between start and stop. The related warning: `Reset()` before reusing one instance, or elapsed time **accumulates** across measurements.',
    source: 'Lecture 11 §8.1',
  },
  {
    id: 'w11-memory-measure',
    conceptId: 'benchmarking',
    question: 'Which measures the physical memory a C# process is using?',
    options: [
      '`Process.GetCurrentProcess().WorkingSet64`, with `PeakWorkingSet64` for the peak',
      '`GC.Collect()`',
      '`Stopwatch.ElapsedMilliseconds`',
      '`Console.BufferSize`',
    ],
    answer: 0,
    why: [
      '',
      'That requests a collection; it reports nothing.',
      'That is elapsed time, the other half of the benchmark.',
      'A console display property, unrelated.',
    ],
    explain:
      'Also from `System.Diagnostics`. `WorkingSet64` is the current allocation and `PeakWorkingSet64` the highest reached — Visual Studio’s diagnostic tools report the same thing graphically.',
    source: 'Lecture 11 §8.2',
  },
  {
    id: 'w11-d2-format',
    conceptId: 'benchmarking',
    code: `string hourString = _hour.Count.ToString("D2");`,
    question: 'What does `"D2"` do?',
    options: [
      'Pads the integer to two digits with a leading zero, so 7 becomes "07"',
      'Rounds the number to two decimal places',
      'Converts it to a double with 2 digits',
      'Divides it by 2',
    ],
    answer: 0,
    why: [
      '',
      'That is `"F2"`. `D` is a decimal *integer* format.',
      '`D` stands for decimal integer, not double.',
      'Format strings do no arithmetic.',
    ],
    explain:
      'The formatting trick for a clock display, so 9 minutes past shows as `09` rather than `9` and `ToString` produces `01:09:05`.',
    source: 'Lecture 11 §8.3',
  },
  {
    id: 'w11-clock-counter',
    conceptId: 'benchmarking',
    question: 'How is the Week 12 `Clock` built, and why that way?',
    options: [
      'By composing three `Counter` objects — hours, minutes, seconds — so it extends to new components easily',
      'By inheriting from `Counter` three times',
      'With three `int` fields and no helper class',
      'As a Singleton, so only one clock can exist',
    ],
    answer: 0,
    why: [
      '',
      'C# allows exactly one base class, so inheriting three times is impossible.',
      'Possible, but it throws away the reusable `Counter` and makes adding a component a rewrite.',
      'Nothing requires a single clock.',
    ],
    explain:
      'Composition over inheritance, one week after the lecture names it. It matters practically: the verification task may ask you to add a day-of-week or milliseconds counter, which is a new `Counter` field rather than a redesign.',
    source: 'Lecture 11 §8.3, §9',
  },
];
