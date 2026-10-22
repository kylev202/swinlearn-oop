/**
 * Week 11 revision notes — other OO languages, memory, benchmarking.
 *
 * The only week in the bank with no revision quiz behind it, so everything
 * here comes from the lecture itself. That also makes it the week whose
 * examinable shape is least certain — but Lecture 11 ends with its own cheat
 * sheet of fifteen one-line reminders, which is as close to a statement of
 * "this is what to know" as the unit gives, and these notes follow it.
 *
 * Two mockup questions are answered by material that *lives* in earlier
 * weeks: Q7 (passing an object) is Week 3 memory, and Q10 (try/catch/finally)
 * is Week 5. Both are re-stated here because Week 11 is where the unit
 * revisits them, with a pointer back to where to revise properly.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK11: WeekNotes = {
  week: 11,
  title: 'Other OO languages and memory',
  gist: 'What transfers to C++, Swift and JavaScript — and who is responsible for cleaning up.',
  sources: ['Lecture 11', 'Final mockup Q7'],
  sections: [
    {
      id: 'n11-languages',
      title: 'The same ideas, different syntax',
      concepts: ['cross-language-oop'],
      blocks: [
        {
          t: 'text',
          md: 'Industry does not standardise on one language — legacy systems are costly to move, and you usually do not get to choose. So the unit teaches the ideas that **transfer**: abstraction, encapsulation, inheritance and polymorphism exist in every OO language, and only the syntax changes.',
        },
        {
          t: 'table',
          headers: ['', 'C#', 'C++', 'Swift', 'JavaScript'],
          rows: [
            ['Import', '`using System;`', '`#include <iostream>`', '`import Foundation`', '—'],
            ['Constructor', 'Named after the class', 'Named after the class', '`init`', '`function Name()`'],
            ['Access control', 'Per member', '`private:` / `public:` **section labels**', 'Per member', '—'],
            ['Instantiate', '`new SomeClass()`', '`SomeClass obj;` or `new`', '`SomeClass(str: "x")` — **no `new`**', '`new Fruit("Banana")`'],
            ['Class ends with', '`}`', '`};` — **semicolon**', '`}`', '—'],
          ],
        },
        {
          t: 'callout',
          tone: 'note',
          title: 'JavaScript is prototype-based',
          md: 'Not class-based. Attaching a function to `X.prototype` is roughly adding a **method** to class X, and `Fruit.prototype = new Plant();` is how **inheritance** is expressed — every `Fruit` gains `Plant`’s methods and properties.\n\n(Modern JS also has `class` syntax, but it is sugar over prototypes.)',
        },
      ],
    },
    {
      id: 'n11-memory',
      title: 'Stack, heap, and typing',
      concepts: ['stack-heap-languages', 'static-dynamic-typing'],
      blocks: [
        {
          t: 'code',
          caption: 'C++ lets you choose where an object lives',
          lang: 'text',
          code: `SomeClass  obj1("obj1");               // stack
SomeClass *obj2 = new SomeClass("obj2"); // heap, via a pointer

obj1.printSomething();   // dot syntax   — stack object
obj2->printSomething();  // arrow syntax — heap object`,
        },
        {
          t: 'callout',
          tone: 'key',
          md: '**C# does not give you that choice.** Reference types always go on the heap; `new` is required to allocate, but you never decide where. C++ and Delphi are the languages that let the developer pick.',
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'Mockup Q7 — what is passed when you pass an object?',
          md: '**A reference to the object’s memory on the heap.**\n\nNot a copy of the object. Not a pointer to the *stack* — the **variable** sits on the stack and holds a reference; the **object** is on the heap.\n\nThis is why a method that mutates an object it was passed changes the caller’s object too. Revise it properly in the Week 3 notes.',
        },
        {
          t: 'compare',
          left: {
            title: 'Static typing',
            tone: 'neutral',
            md: 'Type checked at **compile time**, by the compiler.\n\nThe **declared variable type** decides what is allowed.\n\nC++, C#, Java.',
          },
          right: {
            title: 'Dynamic typing',
            tone: 'neutral',
            md: 'Type determined at **run time**.\n\nThe **object itself** decides what is allowed.\n\nJavaScript, Python (loosely), Objective-C.',
          },
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'The consequence: an error C# catches before the program runs may not surface in a dynamically typed language until the offending line actually executes. Some languages — Python, Objective-C — blend both models.',
        },
      ],
    },
    {
      id: 'n11-destruction',
      title: 'Three ways to destroy an object',
      concepts: ['object-destruction'],
      blocks: [
        {
          t: 'text',
          md: 'Every OO language reclaims memory somehow. What differs is **who is responsible**.',
        },
        {
          t: 'table',
          headers: ['Strategy', 'Who is responsible', 'Languages'],
          rows: [
            ['Manual `new` / `delete`', 'The **developer**, via a `~` destructor', 'C++, assembly'],
            ['Reference counting', 'The **object itself**, once its count hits 0', 'Objective-C, Swift'],
            ['Garbage collection', 'The language **runtime**', 'C#, Java'],
          ],
        },
        {
          t: 'code',
          caption: 'A C++ destructor, and why it matters',
          lang: 'text',
          code: `~SomeClass()
{
    delete _someObject;   // propagate deletion to what this object owns
}`,
        },
        {
          t: 'callout',
          tone: 'warn',
          title: 'Memory leak',
          md: 'Heap objects that are **no longer reachable but were never freed**. The program cannot use that memory and will never give it back.\n\nBoth halves matter: merely using a lot of memory is not a leak, and freeing twice is a different bug.',
        },
        {
          t: 'callout',
          tone: 'note',
          md: '**Garbage collection** keeps a graph of references and collects by **generation**, short-lived to long-term — most objects die young, so the collector scans the young ones often and the old ones rarely. It is why you have never written a destructor in Swin Adventure.\n\n**Reference counting** is not the same thing: each object holds its own "how many things need me?" counter and frees itself at zero — no runtime scan.',
        },
      ],
    },
    {
      id: 'n11-benchmarking',
      title: 'Benchmarking, and the Week 12 Clock',
      concepts: ['benchmarking'],
      blocks: [
        {
          t: 'text',
          md: 'Both tools live in **`System.Diagnostics`**.',
        },
        {
          t: 'code',
          caption: 'Execution time',
          code: `Stopwatch watch = Stopwatch.StartNew();   // immediately before the block

// ... the code being measured ...

watch.Stop();
Console.WriteLine(watch.ElapsedMilliseconds);`,
        },
        {
          t: 'code',
          caption: 'Physical memory',
          code: `Process proc = Process.GetCurrentProcess();

Console.WriteLine(proc.WorkingSet64);       // current
Console.WriteLine(proc.PeakWorkingSet64);   // highest reached`,
        },
        {
          t: 'callout',
          tone: 'trap',
          md: 'Start the stopwatch **immediately before** the block you are timing. Starting earlier folds unrelated setup into the measurement — and gives you a wrong number rather than an error, which is worse.\n\nCall `Reset()` before reusing one instance, or elapsed time **accumulates** across measurements.',
        },
        {
          t: 'callout',
          tone: 'note',
          title: 'The Week 12 task',
          md: 'A `Clock` composed of **three `Counter` objects** — hours, minutes, seconds — with `Tick()`, `Restart()` and a `ToString()` using `.ToString("D2")` to pad to two digits (`7` → `"07"`).\n\n**Composition, not inheritance** — and deliberately so: the verification task may ask you to add a day-of-week or milliseconds counter, which should be a new `Counter` field rather than a redesign.\n\nIf the last digit of your student ID is **≥ 5**, use 12-hour format; otherwise 24-hour.',
        },
      ],
    },
  ],
};
