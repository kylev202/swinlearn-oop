/**
 * Week 7 revision notes — common implementation issues.
 *
 * The highest-yield week on the final relative to its size. The released
 * mockup's **Q1 and Q2 are Quiz 7's Q2 and Q4 word for word**, and its Q11 is
 * Quiz 7 Q8 rearranged. Eight revision questions, three of twenty on the
 * sample paper.
 *
 * It is also the most *mechanical* week — overloading and scope have exact
 * rules with no judgement in them, which makes these the cheapest marks on
 * the paper. Learn the signature rule cold.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK7: WeekNotes = {
  week: 7,
  title: 'Common implementation issues',
  gist: 'Overloading, scope, and reading what the compiler and runtime are actually telling you.',
  sources: ['Lecture 7 §3', 'Quiz 7', 'Final mockup Q1, Q2, Q11'],
  sections: [
    {
      id: 'n7-overloading',
      title: 'Method overloading',
      concepts: ['overloading'],
      blocks: [
        {
          t: 'callout',
          tone: 'key',
          title: 'The whole rule, in one line',
          md: 'A **signature** is the method name plus the **number, order and types** of its parameters.\n\nThat is all. The return type is not part of it. Parameter *names* are not part of it.',
        },
        {
          t: 'text',
          md: 'Overloading means two methods sharing a name whose signatures genuinely differ. If they do not differ *in one of those three ways*, the compiler sees a **duplicate declaration** — not an overload — and refuses to build.',
        },
        {
          t: 'table',
          headers: ['Pair', 'Valid?', 'Why'],
          rows: [
            ['`Print(int)` / `Print(double)`', '✅', 'Different **type**'],
            ['`Display(string)` / `Display(string, int)`', '✅', 'Different **count**'],
            ['`Swap(int, string)` / `Swap(string, int)`', '✅', 'Different **order** of types'],
            ['`Show(string message)` / `Show(string msg)`', '❌', 'Only the **name** differs — both are `Show(string)`'],
            ['`void Add(int,int)` / `int Add(int,int)`', '❌', 'Only the **return type** differs'],
          ],
        },
        {
          t: 'code',
          caption: 'Both of these are "method already defined"',
          code: `public void Add(int a, int b) {}
public int  Add(int x, int y) { return x + y; }   // return type: not a signature

public void Show(string message) {}
public void Show(string msg) {}                   // parameter name: not a signature`,
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'Why the return-type rule exists: if return types *did* distinguish them, `Add(1, 2);` written as a bare statement — ignoring the result — would be ambiguous, and the compiler would have no way to choose.',
        },
      ],
    },
    {
      id: 'n7-scope',
      title: 'Scope and shadowing',
      concepts: ['scope'],
      blocks: [
        {
          t: 'text',
          md: 'Two questions that look identical and have opposite answers. The difference is whether the two variables are in the **same** scope or **different** ones.',
        },
        {
          t: 'compare',
          left: {
            title: 'Same scope → error',
            tone: 'bad',
            md: '```csharp\nint total = 5;\nint total = 9;\n```\n\n**Compile-time error** — duplicate variable declaration.\n\nOne scope allows one variable of a given name. The program never runs.',
          },
          right: {
            title: 'Different scopes → legal',
            tone: 'good',
            md: '```csharp\nstatic int x = 10;    // field\n\nstatic void Main()\n{\n    int x = 20;       // local\n    Console.WriteLine(x);\n}\n```\n\nPrints **20**. This is **shadowing**, and it is allowed.',
          },
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'Inside the method, the **nearest declaration wins** — the local hides the field. The field is still there and still 10; it is reachable as `Program.x`.',
        },
        {
          t: 'callout',
          tone: 'trap',
          title: 'A block is a scope too',
          md: '```csharp\nfor (int i = 0; i < 3; i++)\n{\n    int total = i * 2;\n}\nConsole.WriteLine(total);   // error: total does not exist here\n```\n\nNot a duplicate declaration — each iteration enters a fresh block, so only one `total` is ever alive. The problem is that it is **gone** by the time the loop ends. To use a value after a loop, declare it **before** the loop.',
        },
      ],
    },
    {
      id: 'n7-errors',
      title: 'Reading errors, and telling exceptions apart',
      concepts: ['reading-errors', 'common-exceptions'],
      blocks: [
        {
          t: 'callout',
          tone: 'key',
          title: 'The exam answer for "how do you debug an unknown error?"',
          md: '**Carefully read the error message and stack trace to identify the root cause.**\n\nAnd read the trace **backwards** — from where it surfaced, towards the call that caused it. This is mockup Q1, verbatim.',
        },
        {
          t: 'text',
          md: 'The reported line number is **where the symptom surfaced**, not necessarily where the bug is. A `null` produced three calls away throws here, not where it was created — and that gap is exactly what reading the stack in reverse closes.',
        },
        {
          t: 'table',
          headers: ['Exception', 'Means', 'Check first'],
          rows: [
            [
              '`IndexOutOfRangeException`',
              'The index fell outside `0` to `Length - 1`',
              'The index value against the array’s actual bounds — usually a loop running to `<= Length`',
            ],
            [
              '`NullReferenceException`',
              'You called a member on a reference holding `null`',
              'Whether the variable was ever assigned, or whether something returned `null` unchecked',
            ],
          ],
        },
        {
          t: 'code',
          caption: 'Which one does this throw?',
          code: `string[] names = new string[3];
Console.WriteLine(names[0].Length);`,
        },
        {
          t: 'callout',
          tone: 'trap',
          md: '`NullReferenceException`, not `IndexOutOfRangeException`. The array has three slots, so index 0 is perfectly valid — but `string` is a **reference type**, so each slot defaults to `null`, not `""`. The **index** is fine; the **element** is not.',
        },
      ],
    },
    {
      id: 'n7-docs',
      title: 'Reading the documentation',
      concepts: ['api-docs'],
      blocks: [
        {
          t: 'callout',
          tone: 'key',
          title: 'The exam answer for "why read API documentation?"',
          md: 'To know the **available methods**, the **expected parameters**, and the **use details**.\n\nThis is mockup Q2, verbatim. Not "to memorise method names" — documentation is a reference precisely so you do not have to.',
        },
        {
          t: 'text',
          md: 'The same instinct shows up in two more places in this week:\n\n- **A prescribed design** — a lab’s UML diagram, an interface you are given — should be followed **step by step** and checked against, not improved upon. Deviating is how you fail a verification task that checks your code against the diagram.\n- **"Google-fu"** — if the Base Class Library probably already has it, search and read the docs before writing your own. Reimplementing something already written, tested and documented is work you then have to maintain.',
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'Lecture 10 makes the matching point about AI-generated code: code you have not read is code you cannot debug. Knowing *where to look* when something breaks is the skill being protected here.',
        },
      ],
    },
  ],
};
