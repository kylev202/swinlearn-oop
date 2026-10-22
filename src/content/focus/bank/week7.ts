/**
 * Week 7 question bank — common implementation issues.
 *
 * Sourced from Quiz 7 (8 questions, all of them) and `Lecture 7.md` §3.
 *
 * This is the highest-yield week in the whole final bank, and it is worth
 * knowing why before revising anything else. The released mockup paper opens
 * with it: **Q1 is Quiz 7 Q2 verbatim** (debugging unknown errors) and **Q2 is
 * Quiz 7 Q4 verbatim** (reading API documentation). Its Q11 is Quiz 7 Q8 with
 * the options rearranged. Three of twenty questions on the sample paper come
 * from eight revision questions — nothing else in the unit pays like that.
 */

import type { FocusQuestion } from '../types';

export const WEEK7: FocusQuestion[] = [
  // ------------------------------------------------------- overloading
  {
    id: 'w7-overload-invalid-names',
    conceptId: 'overloading',
    code: `public void Show(string message) {}
public void Show(string msg) {}`,
    question: 'Why is this pair invalid in C#?',
    options: [
      'Parameter names are not part of a signature, so both methods are `Show(string)` — a duplicate declaration',
      'A method name may not be reused within one class under any circumstances',
      'The parameters need different names for the compiler to tell them apart',
      'It is valid — the compiler uses the parameter name at the call site',
    ],
    answer: 0,
    why: [
      '',
      'Reusing a name is exactly what overloading is. The problem is these two do not differ in the way that counts.',
      'The opposite of the truth: it is *because* the names differ and nothing else does that this fails.',
      'C# does have named arguments at call sites, but they never make two identical signatures distinct.',
    ],
    explain:
      'A signature is the name plus the parameter count, order and types. `message` and `msg` are neither, so the compiler sees `Show(string)` declared twice.',
    source: 'Quiz 7 Q8 — and mockup paper Q11',
  },
  {
    id: 'w7-overload-return-type',
    conceptId: 'overloading',
    code: `public void Add(int a, int b) {}
public int Add(int x, int y) {
    return x + y;
}`,
    question: 'What error does this produce?',
    options: [
      'A "method already defined" error — the return type is not part of the signature',
      'None — the return types differ, so these are valid overloads',
      'A runtime error the first time `Add` is called',
      'A warning only; the compiler picks whichever is called first',
    ],
    answer: 0,
    why: [
      '',
      'The most common wrong answer, and the reason the question is asked. Overload resolution never looks at the return type.',
      'This is caught at compile time. The program never runs.',
      'Nothing here is a warning. It is a hard error.',
    ],
    explain:
      'Both are `Add(int, int)`. If return types *did* distinguish them, `Add(1, 2);` as a bare statement would be ambiguous — which is roughly why the rule exists.',
    source: 'Quiz 7 Q3',
  },
  {
    id: 'w7-overload-valid',
    conceptId: 'overloading',
    question: 'Which pair IS a valid overload?',
    options: [
      '`Print(int number)` and `Print(double number)`',
      '`Show(string message)` and `Show(string msg)`',
      '`void Add(int a, int b)` and `int Add(int a, int b)`',
      '`Run()` and `Run()`',
    ],
    answer: 0,
    why: [
      '',
      'Only the parameter name differs, which is not part of the signature.',
      'Only the return type differs, which is not part of the signature either.',
      'Identical in every respect.',
    ],
    explain:
      '`int` and `double` are different **types**, so the signatures genuinely differ and the compiler can always tell which one a call means.',
    source: 'Quiz 7 Q8; mockup paper Q11 option (a)',
  },
  {
    id: 'w7-overload-count',
    conceptId: 'overloading',
    question: 'Which pair is a valid overload?',
    options: [
      '`Display(string text)` and `Display(string text, int count)`',
      '`Display(string text)` and `Display(string content)`',
      '`string Display(int n)` and `int Display(int n)`',
      '`Display(int a, int b)` and `Display(int b, int a)`',
    ],
    answer: 0,
    why: [
      '',
      'Same single `string` parameter; only the name differs.',
      'Only the return type differs.',
      'Same types in the same order — `(int, int)` both times. Swapping the *names* changes nothing.',
    ],
    explain:
      'A different **number** of parameters is one of the three legitimate ways to overload, alongside different types and a different order of types.',
    source: 'Mockup paper Q11 option (b)',
  },
  {
    id: 'w7-overload-three-ways',
    conceptId: 'overloading',
    question: 'Overloaded methods must differ in which of these?',
    options: [
      'The number, order or type of their parameters',
      'Their return type, parameter names, or access modifier',
      'The name of the method only',
      'The class they are declared in',
    ],
    answer: 0,
    why: [
      '',
      'None of these three is part of a signature. This option is the complete list of things that do *not* work.',
      'Overloads share a name by definition — that is what makes them overloads.',
      'Methods in different classes are unrelated and never conflict, so no overloading question arises.',
    ],
    explain:
      'Three things, and only these three: how many parameters, what types they are, and what order those types come in.',
    source: 'Quiz 7 Q3, Q8',
  },

  // ------------------------------------------------------------- scope
  {
    id: 'w7-scope-duplicate',
    conceptId: 'scope',
    question: 'What happens if you declare two variables with the same name in the same scope?',
    options: [
      'A compile-time error — a duplicate variable declaration',
      'A runtime error when the second one is first read',
      'The second silently overwrites the first',
      'Nothing — C# renames one of them internally',
    ],
    answer: 0,
    why: [
      '',
      'The program never gets as far as running. The compiler refuses to build it.',
      'That is how assignment behaves, not declaration. Two *declarations* of one name in one scope is simply not allowed.',
      'Nothing is renamed for you.',
    ],
    explain:
      'Each scope allows one variable of a given name. An ambiguous reference is caught before the program is ever built.',
    source: 'Quiz 7 Q6',
  },
  {
    id: 'w7-scope-shadow',
    conceptId: 'scope',
    code: `public class Program
{
    static int x = 10;

    static void Main()
    {
        int x = 20;
        Console.WriteLine(x);
    }
}`,
    question: 'What does this print?',
    options: ['20', '10', 'A compile error — `x` is declared twice', '0'],
    answer: 0,
    why: [
      '',
      'The field is still 10, but it is not what the bare name `x` resolves to inside `Main`.',
      'The tempting answer after the previous question, and the reason both are asked. These are two **different** scopes, so there is no duplicate.',
      'Both variables are initialised; nothing is left at a default.',
    ],
    explain:
      'This is legal **shadowing**. The local `x` hides the field `x` inside `Main`, and the nearest declaration wins. The field is still reachable, as `Program.x`.',
    source: 'Quiz 7 Q7',
  },
  {
    id: 'w7-scope-local-visibility',
    conceptId: 'scope',
    question: 'Where is a variable declared inside a method visible?',
    options: [
      'Only inside that method',
      'Anywhere in the class that declares the method',
      'Anywhere in the same namespace',
      'Anywhere in the program, if it is declared `public`',
    ],
    answer: 0,
    why: [
      '',
      'That would make it a field. Where a variable is declared is what decides its scope.',
      'Namespaces group types, not variables.',
      'A local variable cannot be `public` at all — access modifiers apply to members, not locals.',
    ],
    explain:
      'Local scope. The variable comes into existence when the method runs and is gone when it returns — which is also why its value does not survive the call.',
    source: 'Lecture 7 §3.2, scope',
  },
  {
    id: 'w7-scope-block',
    conceptId: 'scope',
    code: `for (int i = 0; i < 3; i++)
{
    int total = i * 2;
}

Console.WriteLine(total);`,
    question: 'What is wrong with this code?',
    options: [
      '`total` is declared inside the loop body, so it does not exist at the `WriteLine`',
      'Nothing — `total` holds 4 after the loop',
      '`i` cannot be declared inside the `for` statement',
      '`total` is declared three times, which is a duplicate declaration',
    ],
    answer: 0,
    why: [
      '',
      'It would hold 4 on the last iteration, but the variable is gone by the time the loop ends.',
      'Declaring the counter in the `for` is completely normal.',
      'Each iteration enters a fresh block, so there is never more than one `total` alive at once. This is not a duplicate.',
    ],
    explain:
      'A block `{ }` is a scope too, not just a method. To use a value after a loop, declare it before the loop.',
    source: 'Lecture 7 §3.2, scope',
    stretch: true,
  },

  // ------------------------------------------------- reading error messages
  {
    id: 'w7-debug-practice',
    conceptId: 'reading-errors',
    question: 'Which is a good practice for debugging unknown errors in C#?',
    options: [
      'Carefully read the error message and stack trace to identify the root cause',
      'Ignore the error and rerun the program',
      'Comment out random lines of code until it stops failing',
      'Restart the IDE',
    ],
    answer: 0,
    why: [
      '',
      'The error is the runtime telling you what went wrong. Running again changes nothing about why.',
      'This sometimes makes a symptom disappear without ever identifying the cause, which is worse than the bug — you now have a broken program and a false belief about it.',
      'Restarting addresses tooling problems, not defects in your code.',
    ],
    explain:
      'The message and stack trace are free diagnostics. Lecture 11 adds the technique: read the trace **backwards**, from where it surfaced towards the call that caused it.',
    source: 'Quiz 7 Q2 — and mockup paper Q1, word for word',
  },
  {
    id: 'w7-stack-trace-line',
    conceptId: 'reading-errors',
    question: 'What does the line number reported with an exception tell you?',
    options: [
      'Where the symptom surfaced — the root cause may be several calls earlier',
      'Exactly which line contains the bug, always',
      'Which line the program will resume at after the exception',
      'The line where the variable involved was declared',
    ],
    answer: 0,
    why: [
      '',
      'Frequently it is where the bug is, which is why this trap works — but a null arriving from three calls away surfaces here, not where it was created.',
      'Execution does not resume after an unhandled exception; it unwinds looking for a `catch`.',
      'Nothing in the trace points at declarations.',
    ],
    explain:
      'A `NullReferenceException` fires where the null is *used*, not where it was produced. That gap is what reading the stack backwards closes.',
    source: 'Quiz 7 Q2; Lecture 11 §3 row 1',
  },
  {
    id: 'w7-debug-reverse',
    conceptId: 'reading-errors',
    question: 'In what order should a stack trace be read when hunting a root cause?',
    options: [
      'Backwards — from the reported error towards the earlier calls that led to it',
      'Forwards — from the program’s entry point downwards',
      'Alphabetically by method name',
      'It does not matter; only the first line carries information',
    ],
    answer: 0,
    why: [
      '',
      'Reading from `Main` down tells you how the program started, which you already know.',
      'A stack trace is in call order, never alphabetical.',
      'The first line names the exception. The lines beneath it are the chain that got you there, and are usually where the answer is.',
    ],
    explain:
      "Lecture 11's first revision point: trace it in reverse. The top frame is the symptom; the frame that passed in the bad value is the cause.",
    source: 'Lecture 11 §3 row 1',
  },

  // ---------------------------------------------- telling exceptions apart
  {
    id: 'w7-index-out-of-range',
    conceptId: 'common-exceptions',
    question:
      'You get `IndexOutOfRangeException: Index was outside the bounds of the array`. What do you check first?',
    options: [
      'Whether the index is within `0` to `Length - 1`',
      'Whether the array variable is null',
      'Whether the array elements were initialised',
      'Whether the array type matches what you are assigning',
    ],
    answer: 0,
    why: [
      '',
      'A null array throws `NullReferenceException` instead — a different exception with a different fix.',
      'Uninitialised elements hold defaults. They do not throw.',
      'A type mismatch is caught at compile time, not as this exception.',
    ],
    explain:
      'The exception names the fault exactly: the index does not exist. Usually an off-by-one — a loop running to `<= Length` rather than `< Length`.',
    source: 'Quiz 7 Q1',
  },
  {
    id: 'w7-null-reference',
    conceptId: 'common-exceptions',
    question:
      'Which statement is true about `NullReferenceException: Object reference not set to an instance of an object`?',
    options: [
      'The reference being used held `null` at the moment it was accessed',
      'The object was of the wrong type for the operation',
      'An array index fell outside the array’s bounds',
      'The object was garbage collected while still in use',
    ],
    answer: 0,
    why: [
      '',
      'A wrong type gives `InvalidCastException`.',
      'That is `IndexOutOfRangeException` — the other half of this pair, and the usual confusion.',
      'The collector never reclaims anything still reachable, so this cannot happen.',
    ],
    explain:
      'Purely about dereferencing nothing: calling a method or reading a property on a variable holding `null`. Either it was never assigned, or something returned `null` and was not checked.',
    source: 'Quiz 7 Q5',
  },
  {
    id: 'w7-exception-which',
    conceptId: 'common-exceptions',
    code: `string[] names = new string[3];
Console.WriteLine(names[0].Length);`,
    question: 'What does this throw, and why?',
    options: [
      '`NullReferenceException` — index 0 is valid, but the element is `null`',
      '`IndexOutOfRangeException` — the array is empty',
      'Nothing — it prints 0',
      '`IndexOutOfRangeException` — index 0 does not exist until something is assigned',
    ],
    answer: 0,
    why: [
      '',
      'The array has three slots; it is the slots that are empty, not the array.',
      '`.Length` on a null reference does not return 0, it throws.',
      'Index 0 is valid the moment the array is created with size 3.',
    ],
    explain:
      'A sharp distinction between the two exceptions. `new string[3]` creates three slots holding `null` — the index is fine, the *element* is not. `string` is a reference type, so its default is `null`, not `""`.',
    source: 'Quiz 7 Q1, Q5',
    stretch: true,
  },

  // -------------------------------------------------------- documentation
  {
    id: 'w7-api-docs',
    conceptId: 'api-docs',
    question: 'Why is reading API documentation crucial in C# development?',
    options: [
      'To know the available methods, the parameters they expect, and how they are meant to be used',
      'To memorise method names',
      'To give the documents to software testers',
      'To avoid having to debug code',
    ],
    answer: 0,
    why: [
      '',
      'Documentation exists so you do not have to memorise anything — it is a reference, not a study aid.',
      'Testers are not the audience for an API reference.',
      'Reading the docs prevents some avoidable bugs, but nothing removes the need to debug.',
    ],
    explain:
      'Three things: what operations exist, what each expects, and how it is intended to be used. Guessing a signature is how you end up with the overload and scope errors in this week.',
    source: 'Quiz 7 Q4 — and mockup paper Q2, word for word',
  },
  {
    id: 'w7-prescribed-design',
    conceptId: 'api-docs',
    question:
      'A lab gives you a UML diagram with a prescribed design. Lecture 7’s advice is to do what?',
    options: [
      'Follow it step by step, and check your implementation against it',
      'Treat it as a suggestion and design your own if you prefer yours',
      'Implement it only after the code already works your way',
      'Ignore the diagram; only the written steps are graded',
    ],
    answer: 0,
    why: [
      '',
      'When a design is prescribed, deviating is how you fail a verification task that checks you against it.',
      'Retrofitting a design onto finished code is far more work than following it.',
      'The diagram *is* the specification — the verification interview asks about it directly.',
    ],
    explain:
      'The same instinct as reading the docs: a prescribed interface is information you have been handed, and matching it costs less than inventing an alternative and reconciling it later.',
    source: 'Lecture 7 §3.5',
  },
  {
    id: 'w7-docs-google',
    conceptId: 'api-docs',
    question:
      'You need a method you believe the .NET library already provides. What does Lecture 7 recommend?',
    options: [
      'Search for it and read the official documentation before writing your own',
      'Write your own immediately — it is faster than searching',
      'Ask on a forum and wait for a reply',
      'Copy any code snippet that compiles, without reading what it does',
    ],
    answer: 0,
    why: [
      '',
      'Reimplementing something the Base Class Library already has, correctly and tested, is wasted effort that you then have to maintain.',
      'Slower than reading the documentation, and the answer is already written down.',
      'Code you have not read is code you cannot debug — Lecture 10 makes the same point about AI-generated code.',
    ],
    explain:
      'The lecture calls it "Google-fu", and it belongs with the BCL idea from Week 2: the common task has usually been solved and documented already.',
    source: 'Lecture 7 §3, documentation and Google-fu',
  },
];
