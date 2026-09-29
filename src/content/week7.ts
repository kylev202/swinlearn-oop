/**
 * Week 7 — Common Implementation Issues, and Design Reapplied.
 *
 * Sources: Week 7 lecture (W7a deck, 37 slides, plus the ~68 minute recording),
 * Quiz 7.
 *
 * Three things about this week's source material that a future session should
 * not have to rediscover:
 *
 * 1. **There IS a Week 7 lab — Task 7.1, lesson 5 — but no Week 7 task sheet.**
 *    `OOP Lab7.pdf` is byte-identical to `OOP Lab6.pdf` (verified by md5): the
 *    same "Week 6: Drawing Program – Multiple Shape Kinds" sheet Week 6 is
 *    already built from. On that evidence alone this week was **first built with
 *    no lab at all**, which was wrong. The student's own lab source folder
 *    (`OOP LAB/lab7/7.1`) holds real Week 7 ShapeDrawer work that appears in no
 *    Week 6 file: the five classes split one-per-file, and
 *    `SaveTo`/`LoadFrom`/`TypeName`/`CreateShape` persistence — the save/load
 *    feature the Week 7 lecture live-codes. The duplicate PDF means the *sheet*
 *    is missing, not the task, and the lesson tells the student exactly that
 *    rather than leaving them hunting for a brief that does not exist.
 *    `week7.test.ts` now asserts the lab is present, so the earlier wrong
 *    conclusion cannot be drawn twice.
 * 2. **The lecture's middle third is a Lab 8 walkthrough.** Dr Vo live-codes
 *    `Player`, `Locate`, `FullDescription` and save/load. The *design* half of
 *    that — what `Locate` returns and why, association vs aggregation, why
 *    `Fetch` exists next to `HasItem` and `Take` — is lesson 6 here, so that
 *    Week 8 can open the editor already knowing what it is building. The code
 *    itself is Week 8's. Note the two halves now sit side by side: lesson 5 is
 *    save/load on **shapes** (Track B, this week's lab) and lesson 6 is the
 *    design of save/load on the **player** (Track A, next week's) — the same
 *    pattern on two domains, which is the unit's own reason for this ordering.
 * 3. **RDD is repeated on purpose.** Week 6 told students its theory was not on
 *    the midterm. That expires the moment the midterm is over, and the lecture
 *    reopens RDD specifically as preparation for the custom program. Lesson 4
 *    says that in as many words, because a student who filed Week 6 under
 *    "not examinable" needs telling.
 *
 * Engine notes for this week:
 *   - Two methods in one class with the same parameter *types* are now
 *     rejected at load ("already defines a member called 'X' with the same
 *     parameter types"), which is what makes Quiz 7 Q3 and Q8 runnable rather
 *     than merely assertable. That check was added while writing this week;
 *     see `interpreter.ts` `addMember`.
 *   - Argument *types* are still not checked at a call site: passing a `bool`
 *     where a `double` is declared runs here and would not compile in C#. The
 *     lecture makes a point of that exact case, so the lesson shows it as a
 *     read-only example with a callout saying the playground is the lenient one
 *     — never as a runnable block claiming an error it does not raise.
 *   - Three gaps were closed so Task 7.1 could actually *run*, all found by its
 *     own exercises failing: `SplashKit.ColorToString`/`StringToColor` (the
 *     `#rrggbbaa` pair the real save file uses), `Convert.ToSingle` (which
 *     silently returned nothing, so every loaded shape landed at no position at
 *     all), and `InvalidDataException` as a throwable type. All three are pinned
 *     by `engine/__tests__/fileio.test.ts`.
 *
 * Authoring note: markdown lives in template literals, so every inline-code
 * backtick must be escaped as \` — otherwise it closes the string.
 */

import type { InterviewQuestion, Week } from './types';

export const week7: Week = {
  number: 7,
  title: 'Common Implementation Issues & Design, Reapplied',
  subtitle:
    'Why the compiler rejected that, why the error points at the wrong line, and how a drawing survives being closed',
  outcomes: [
    'Say what makes two methods a valid overload — and what only looks like one',
    'Predict which variable a name resolves to when a local or a parameter shadows a field',
    'Read a stack trace backwards, from where a crash surfaced to the line that caused it',
    'Tell IndexOutOfRangeException and NullReferenceException apart from the message alone',
    'Reapply RDD — roles, responsibilities, collaborations, cohesion, coupling — to a fresh brief',
    'Save a shape hierarchy to a text file and read it back, base class first and subclass second',
    'Design Player.Locate before writing it: what it returns, who it asks, and why it is not a bool',
  ],
  sources: [
    'Week 7 lecture (W7a slides + recording)',
    'Quiz 7',
    'Week 7 lab work (ShapeDrawer save/load — no task sheet was issued)',
  ],
  lessons: [
    // ================================================================ lesson 1
    {
      id: 'w7-contract',
      title: 'A method call is a contract',
      kind: 'concept',
      minutes: 15,
      summary:
        'What the compiler actually matches when you call a method — and the two overloads that look different but are not.',
      steps: [
        {
          id: 'w7-contract-signature',
          title: 'What the compiler matches on',
          blocks: [
            {
              t: 'text',
              md: `A method's parameter list is a **promise**. Call it with the right number of arguments, in the right order, of the right types, and it runs. Miss any of those and the compiler refuses — before your program has run a single line.

What is easy to miss is how *little* of what you wrote the compiler actually looks at.`,
            },
            {
              t: 'table',
              caption: 'Matching a call to a method',
              headers: ['Part of the declaration', 'Does the compiler use it?'],
              rows: [
                ['**Number** of parameters', 'Yes — a three-argument call cannot reach a two-parameter method'],
                ['**Order** of the parameter types', 'Yes — `(string, int)` and `(int, string)` are different methods'],
                ['**Type** of each parameter', 'Yes — this is most of the work'],
                ['**Name** of each parameter', '**No.** `Show(string message)` and `Show(string msg)` are the same method'],
                ['**Return type**', '**No.** It is not part of the signature at all'],
              ],
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Two types can share a name and still be different types',
              md: 'A `Color` from **SplashKitSDK** is not the same type as a `Color` from a different namespace, even though both are spelled `Color`. If a call insists it cannot convert `Color` to `Color`, you have two namespaces in play — check your `using` lines, not your spelling.',
            },
            {
              t: 'quiz',
              question:
                'You call `DrawCircle(myColour, 100, 200, true)` against `DrawCircle(Color clr, double x, double y, double radius)`. Why does the real C# compiler reject it?',
              options: [
                'The fourth argument is a bool where a double is expected — the count matches but the type does not',
                'There are four arguments, and four is too many for one method',
                'The argument names do not match the parameter names',
                'A method cannot take a Color as its first parameter',
              ],
              answer: 0,
              why: [
                '',
                'Four arguments is exactly what this method declares. Count is one of the three things checked, and here it is fine.',
                'Argument names are not checked at all — most arguments are expressions with no name to compare.',
                'Nothing stops a method taking a `Color`. The problem is the last argument, not the first.',
              ],
              explain:
                'The lecture uses this exact case: a call whose *shape* is right and whose *types* are not. Getting the count right is the easy half. `true` is a `bool`, and a `bool` is not a `double` — no silent conversion exists, so the call never compiles.',
            },
          ],
        },
        {
          id: 'w7-contract-names',
          title: 'Renaming a parameter does not make a new method',
          blocks: [
            {
              t: 'text',
              md: `Here is the first of two overloads that look legal and are not. Both methods take **one \`string\`**. The only difference is what that string is *called* inside the method — and the compiler never sees parameter names when it decides whether two methods are the same.`,
            },
            {
              t: 'predict',
              question: 'What happens when this program is compiled?',
              code: `public class Printer
{
    public void Show(string message)
    {
        Console.WriteLine(message);
    }

    public void Show(string msg)
    {
        Console.WriteLine(msg);
    }
}

public class Program
{
    public static void Main()
    {
        Printer p = new Printer();
        p.Show("hello");
    }
}`,
              options: [
                'It is rejected: Printer already defines a member called Show with the same parameter types',
                'It prints `hello` once — the compiler picks the first Show',
                'It prints `hello` twice, once from each overload',
                'It is rejected because `Show` is called with an argument that has no name',
              ],
              answer: 0,
              why: [
                '',
                'There is no "first" to pick. The two declarations collide before any call is resolved, so nothing gets as far as running.',
                'One call runs one method. Overloading never means "run them all".',
                'Arguments do not have names at a call site. `"hello"` is just a value.',
              ],
              explain:
                'Quiz 7 Q8. A signature is the method name plus the number, order and types of its parameters. `Show(string)` and `Show(string)` are byte-for-byte the same signature; `message` versus `msg` is a note to the reader, invisible to the compiler. To overload, something in the parameter *list* has to differ.',
              expect: {
                errorContains: "already defines a member called 'Show' with the same parameter types",
              },
            },
          ],
        },
        {
          id: 'w7-contract-return',
          title: 'Neither does changing what it returns',
          blocks: [
            {
              t: 'text',
              md: `The second near-miss is more tempting, because the two methods really do behave differently — one returns a value and one does not. It makes no difference.`,
            },
            {
              t: 'predict',
              question: 'And this one?',
              code: `public class Calculator
{
    public void Add(int a, int b)
    {
        Console.WriteLine(a + b);
    }

    public int Add(int x, int y)
    {
        return x + y;
    }
}

public class Program
{
    public static void Main()
    {
        Calculator c = new Calculator();
        Console.WriteLine(c.Add(2, 3));
    }
}`,
              options: [
                'It is rejected: Calculator already defines a member called Add with the same parameter types',
                'It prints `5` — the compiler picks the overload whose return value is being used',
                'It prints `5` twice, once from each Add',
                'It runs, but `Add` always returns 0 because the void version wins',
              ],
              answer: 0,
              why: [
                '',
                'That would require the compiler to choose an overload by looking at what surrounds the call. C# resolves overloads from the *arguments* only.',
                'Only one method body ever runs for one call.',
                'Neither one wins. The class does not compile, so there is nothing to run.',
              ],
              explain:
                'Quiz 7 Q3. The return type is deliberately excluded from a signature, because a call like `c.Add(2, 3);` on its own line — result thrown away — would otherwise be ambiguous with no way to resolve it. Since both `Add`s take `(int, int)`, this is a duplicate member, not an overload.',
              expect: {
                errorContains: "already defines a member called 'Add' with the same parameter types",
              },
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'The rule, in one line',
              md: 'Two methods can share a name **only** if the number, order or types of their parameters differ. Return type and parameter names are not part of the deal.',
            },
          ],
        },
        {
          id: 'w7-contract-valid',
          title: 'A real overload, and why it delegates',
          blocks: [
            {
              t: 'text',
              md: `Now the version that works. \`Greet\` comes in two forms: one that takes a greeting word, and a shorter one that does not. The shorter one does **not** duplicate the logic — it calls the longer one with a sensible default filled in.

That delegation is the whole reason overloads earn their keep. Change how a greeting is built, and there is exactly one place to change it.`,
            },
            {
              t: 'compare',
              title: 'Two ways to write the second overload',
              left: {
                title: 'Duplicated',
                tone: 'bad',
                code: `public void Greet(string name)
{
    Console.WriteLine(
        "Hello, " + name + "!");
}`,
              },
              right: {
                title: 'Delegating',
                tone: 'good',
                code: `public void Greet(string name)
{
    Greet(name, "Hello");
}`,
              },
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Only overload when you need to',
              md: 'The deck is blunt about this: every overload is more surface area to maintain and one more thing a reader has to disambiguate. Two forms because callers genuinely need two — good. Five forms written speculatively — not good.',
            },
          ],
          exercise: {
            prompt:
              'Give Greeter two Greet overloads: one taking a name and a greeting, and one taking just a name that delegates to it with "Hello".',
            seed: `public class Greeter
{

}`,
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: 'There is a two-parameter Greet',
                rule: { on: 'method', inClass: 'Greeter', name: 'Greet', params: 2 },
              },
              {
                kind: 'structure',
                label: 'There is a one-parameter Greet',
                rule: { on: 'method', inClass: 'Greeter', name: 'Greet', params: 1 },
              },
              {
                kind: 'output',
                label: 'Both forms print the right line',
                expect: 'Hello, {{first}}!\nWelcome, {{first}}!',
              },
              {
                kind: 'forbid',
                label: 'The short overload delegates instead of repeating the message',
                pattern: '"Hello, "',
                message:
                  'Build the sentence in one place only. The one-parameter Greet should call the other one, passing "Hello" as the greeting.',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        Greeter g = new Greeter();
        g.Greet("{{first}}");
        g.Greet("{{first}}", "Welcome");
    }
}`,
            hints: [
              'The two-parameter one does the printing. The one-parameter one does not print at all.',
              'The sentence is the greeting, then a comma and a space, then the name, then an exclamation mark.',
              'public void Greet(string name) { Greet(name, "Hello"); } — one line, calling its own sibling.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w7-contract-types',
          title: 'Where this playground is more forgiving than C#',
          blocks: [
            {
              t: 'text',
              md: `One honest warning before you move on. The deck's own example is a call that supplies a \`bool\` where a \`double\` is declared:`,
            },
            {
              t: 'code',
              caption: 'Rejected by the real C# compiler',
              code: `public class Bell
{
    public void Ring(double volume)
    {
        Console.WriteLine(volume);
    }
}

// Ring(true);
//      ^ cannot convert from 'bool' to 'double'`,
            },
            {
              t: 'callout',
              tone: 'warn',
              title: 'This one will run here, and will not compile in Visual Studio',
              md: 'This playground checks the **number** of arguments and rejects duplicate signatures, but it does not type-check each argument at the call site. `Ring(true)` runs here and prints `True`. In a real project it is a build error — `CS1503: cannot convert from \'bool\' to \'double\'`. When the checks here pass and Visual Studio still refuses, argument types are the first place to look.',
            },
            {
              t: 'quiz',
              question:
                'Your build fails with `CS1503: Argument 2: cannot convert from \'string\' to \'int\'`. What is the fastest thing to check?',
              options: [
                'The second argument at the call site, against the second parameter of the method being called',
                'Whether the method has been given a return type',
                'Whether the method and the call use the same parameter names',
                'Whether the class containing the method is public',
              ],
              answer: 0,
              why: [
                '',
                'A missing return type is a different error entirely, and it would be reported on the declaration rather than the call.',
                'Parameter names never take part in matching, so they can never cause a conversion error.',
                'Visibility problems produce an "inaccessible due to its protection level" message, not a conversion one.',
              ],
              explain:
                'The message names the position (`Argument 2`) and both types. That is enough to go straight to the pair that disagree. Reading the whole message rather than the first four words is the single highest-value debugging habit in this week.',
            },
          ],
        },
        {
          id: 'w7-contract-recall',
          title: 'In your own words',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Explain what a method signature is, and give one change to a method that creates a valid overload and one change that does not. Write it out before you look at the checklist.',
              nudge:
                'There are five things you could change about a method declaration. Only three of them change the signature.',
              points: [
                'A signature is the method name plus the number, order and types of its parameters',
                'Changing the number of parameters creates a valid overload',
                'Changing the type or the order of the parameter types creates a valid overload',
                'Renaming a parameter does **not** — names are not part of the signature',
                'Changing the return type does **not** — it is excluded so that a call whose result is discarded stays unambiguous',
                'Overloads commonly delegate to each other so the shared logic lives in one place',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 2
    {
      id: 'w7-scope',
      title: 'Scope: where a name is visible',
      kind: 'concept',
      minutes: 14,
      summary:
        'Local, private and public — plus the two cases students trip over: declaring a name twice, and shadowing one that already exists.',
      steps: [
        {
          id: 'w7-scope-three',
          title: 'Three levels, and one surprise',
          blocks: [
            {
              t: 'text',
              md: `**Scope** is the answer to "from where can this name be seen?". C# gives you three answers that matter here, and the surprising one is the first.`,
            },
            {
              t: 'table',
              caption: 'Where a name can be reached from',
              headers: ['Declared as', 'Visible from'],
              rows: [
                [
                  '**Local** — inside a method body',
                  'That method only. **Not** from other methods of the same class, not even ones right next to it',
                ],
                ['**Private** — a class field', 'Anywhere inside that class. Not from subclasses, not from outside'],
                ['**Protected** — a class field', 'That class and any class derived from it'],
                ['**Public** — a class member', 'Any code that can see the class at all'],
              ],
            },
            {
              t: 'predict',
              question: 'Method `A` declares `n`. Method `B` prints `n`. What happens?',
              code: `public class Program
{
    static void A()
    {
        int n = 5;
    }

    static void B()
    {
        Console.WriteLine(n);
    }

    public static void Main()
    {
        A();
        B();
    }
}`,
              options: [
                "It is rejected: the name 'n' does not exist here",
                'It prints `5` — `A` runs first, so `n` has a value by the time `B` needs it',
                'It prints `0` — `n` exists but has been reset',
                'It prints nothing and exits quietly',
              ],
              answer: 0,
              why: [
                '',
                'Running order has nothing to do with it. This is decided before the program runs: `B` has no `n` in scope to compile against.',
                'There is no `n` in `B` to hold a zero. A local variable does not outlive the method that declared it.',
                'A name that does not resolve is an error, never a silent no-op.',
              ],
              explain:
                "A local variable lives on the stack frame of one call to one method. When `A` returns, its frame is gone. `B` is compiled on its own terms, and in `B` the name `n` was never declared — so it fails to resolve regardless of what `A` did at runtime. If two methods need to share a value, it has to be a field, or a parameter, or a return value.",
              expect: { errorContains: "The name 'n' does not exist here" },
            },
          ],
        },
        {
          id: 'w7-scope-duplicate',
          title: 'The same name twice, in the same scope',
          blocks: [
            {
              t: 'predict',
              question: 'What does this do?',
              code: `public class Program
{
    public static void Main()
    {
        int count = 1;
        int count = 2;
        Console.WriteLine(count);
    }
}`,
              options: [
                "It is rejected: the variable 'count' is already declared in this scope",
                'It prints `2` — the second declaration replaces the first',
                'It prints `1` — the second declaration is ignored',
                'It runs, but `count` is unpredictable',
              ],
              answer: 0,
              why: [
                '',
                'Replacing would require the compiler to guess which of two declarations you meant. It refuses instead.',
                'Nothing is ignored. Both declarations are read, and the second one is the error.',
                'C# has no "unpredictable variable". Anything the compiler cannot resolve unambiguously is an error.',
              ],
              explain:
                'Quiz 7 Q6. One scope may hold one variable of a given name. This is caught at **compile time** — it never becomes a runtime problem, because a program with an ambiguous name never gets built. The fix is to drop the second `int`: `count = 2;` assigns to the variable that already exists.',
              expect: { errorContains: "already declared in this scope" },
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'The habit the deck recommends',
              md: 'Declare every variable, with its type, at the **top of the method**, before the logic starts. You can then see at a glance what already exists, which is what stops the accidental redeclaration — and the accidental *wrong type* — before you write it.',
            },
          ],
        },
        {
          id: 'w7-scope-shadow',
          title: 'The same name, in two different scopes',
          blocks: [
            {
              t: 'text',
              md: `Now the case that looks identical and is completely legal. A **field** and a **local** can share a name, because they are not in the same scope. Inside the method, the local wins.`,
            },
            {
              t: 'predict',
              question: 'What is printed?',
              code: `public class Program
{
    static int x = 10;

    public static void Main()
    {
        int x = 20;
        Console.WriteLine(x);
    }
}`,
              options: ['20', '10', 'Both, on two lines', 'It is rejected as a duplicate declaration'],
              answer: 0,
              why: [
                '',
                'The field still holds 10, but nothing in `Main` reads it — the local name is closer, so it is the one that resolves.',
                'One name resolves to one variable. Nothing here prints twice.',
                'The two `x`s are in different scopes — a class and a method — so this is shadowing, which is legal.',
              ],
              explain:
                'Quiz 7 Q7. This is **shadowing**, not duplication. The class-level `x` is still there holding 10, and inside `Main` it is simply unreachable by that name. Contrast with the previous step: two locals in one method body really are a duplicate, and really are an error.',
              expect: { output: '20' },
            },
            {
              t: 'compare',
              title: 'Which of these is the error?',
              left: {
                title: 'Two locals, one method',
                tone: 'bad',
                code: `int count = 1;
int count = 2;   // error`,
              },
              right: {
                title: 'A field and a local',
                tone: 'good',
                code: `static int x = 10;   // field
// inside a method:
int x = 20;          // legal`,
              },
            },
          ],
        },
        {
          id: 'w7-scope-param-shadow',
          title: 'When shadowing is the bug',
          blocks: [
            {
              t: 'text',
              md: `Shadowing being legal is exactly what makes it dangerous. A **parameter** shadows a field the same way a local does — so this \`Bump\` method reads and writes its own parameter and never touches the field it was supposed to update.`,
            },
            {
              t: 'predict',
              question: 'What does this print?',
              code: `public class Counter
{
    private int _count;

    public void Bump(int _count)
    {
        _count = _count + 1;
    }

    public int Count
    {
        get { return _count; }
    }
}

public class Program
{
    public static void Main()
    {
        Counter c = new Counter();
        c.Bump(4);
        Console.WriteLine(c.Count);
    }
}`,
              options: [
                '0',
                '5',
                '1',
                'It is rejected: the parameter has the same name as the field',
              ],
              answer: 0,
              why: [
                '',
                'That would be the answer if `_count = _count + 1;` touched the field. Both names inside `Bump` resolve to the parameter.',
                'Nothing ever writes to the field, so it keeps the default an `int` field starts at.',
                'A parameter shadowing a field is legal C#. Nothing about this fails to compile — which is the whole problem.',
              ],
              explain:
                'Inside `Bump`, both `_count`s are the parameter. It is incremented to 5, and then the method returns and the parameter is discarded. The field was never written, so `Count` reports the `int` default of 0. **The compiler cannot help you here** — this is a legal program that does the wrong thing, and the only defences are naming conventions and `this.`.',
              expect: { output: '0' },
            },
          ],
          exercise: {
            prompt:
              'Fix Bump so the field really is incremented by the amount passed in, without renaming the parameter.',
            seed: `public class Counter
{
    private int _count;

    public void Bump(int _count)
    {
        _count = _count + 1;
    }

    public int Count
    {
        get { return _count; }
    }
}`,
            editable: { from: 7, to: 7 },
            tests: [
              {
                kind: 'output',
                label: 'Bumping by 4 then by 3 leaves the count at 7',
                expect: '7',
              },
              {
                kind: 'structure',
                label: 'Bump still takes the one parameter it was given',
                rule: { on: 'method', inClass: 'Counter', name: 'Bump', params: 1 },
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        Counter c = new Counter();
        c.Bump(4);
        c.Bump(3);
        Console.WriteLine(c.Count);
    }
}`,
            hints: [
              'The parameter is shadowing the field. You need a way to say "the field, specifically" — one keyword does it.',
              '`this._count` always means the field, whatever else is in scope with that name.',
              'this._count = this._count + _count; — the left side and the first term are the field, the last term is the parameter.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w7-scope-namespaces',
          title: 'Scope one level up: namespaces',
          blocks: [
            {
              t: 'text',
              md: `Methods scope variables. Classes scope fields. **Namespaces** scope classes — they are how a project with a hundred classes avoids two teams both writing a \`Logger\`.

The deck's example is an outsourced payment-gateway module: it gets its own namespace, separate from the core app, and inside that namespace a class called \`Transaction\` is unambiguous in a way it would not be across the whole codebase.`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Pick names for the scope they sit in',
              md: 'A class inside `Payments` does not need to be called `PaymentTransaction` — the namespace already says that. Repeating the scope in every name is how you end up with `PaymentsPaymentTransactionManager`.',
            },
            {
              t: 'quiz',
              question: 'What problem do namespaces exist to solve?',
              options: [
                'Logical scoping across groups of classes, so the same class name can exist in two parts of a large project',
                'Making classes run faster by grouping them in memory',
                'Restricting which methods of a class other classes may call',
                'Allowing two methods in one class to share a signature',
              ],
              answer: 0,
              why: [
                '',
                'Namespaces are a compile-time organising idea. They have no runtime cost and no effect on speed.',
                'That is what access modifiers do. A namespace groups types; it does not gate members.',
                'Nothing allows that — it is a compile error inside a single class regardless of namespace.',
              ],
              explain:
                'A namespace is scope for type names. It is also why the `Color` trap from lesson 1 happens: two namespaces can each define a `Color`, both are valid, and your `using` lines decide which one a bare `Color` means in this file.',
            },
          ],
        },
        {
          id: 'w7-scope-recall',
          title: 'In your own words',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Two programs each declare the name `x` twice. One compiles and one does not. Explain the difference, and say what the compiling one prints and why.',
              nudge:
                'The question is not how many times the name appears. It is how many scopes are involved.',
              points: [
                'Two declarations in the **same** scope is a duplicate declaration — a compile-time error',
                'A field and a local sharing a name are in **different** scopes, which is legal shadowing',
                'Inside the method, the nearer declaration wins, so the local is what the name resolves to',
                'The shadowed field still exists and still holds its own value — it is just unreachable by that bare name',
                '`this.` reaches the field explicitly when a parameter or local is shadowing it',
                'A parameter shadowing a field is the common silent bug: legal code that updates nothing',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 3
    {
      id: 'w7-errors',
      title: 'Reading the error, not just the line',
      kind: 'practice',
      minutes: 18,
      summary:
        'The two exceptions you will actually meet, and the habit that finds the cause when the reported line is innocent.',
      steps: [
        {
          id: 'w7-err-anatomy',
          title: 'What an exception message is telling you',
          blocks: [
            {
              t: 'text',
              md: `A runtime error arrives with three pieces of information, and most students read only the first.

1. **The type** — \`IndexOutOfRangeException\`, \`NullReferenceException\`. This says *what kind* of thing went wrong, and it narrows the cause enormously.
2. **The message** — the specific values involved.
3. **The stack trace** — the chain of calls that led here, innermost first.`,
            },
            {
              t: 'table',
              caption: 'The two you will meet most this semester',
              headers: ['Type', 'What it means', 'First thing to check'],
              rows: [
                [
                  '`IndexOutOfRangeException`',
                  'An index outside the array\'s valid range — negative, or `>= Length`',
                  'The index value, against `0` to `Length - 1`',
                ],
                [
                  '`NullReferenceException`',
                  'A member was accessed on a reference that is currently `null`',
                  'Whether that object was ever created with `new`',
                ],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'The line number is where the symptom surfaced',
              md: 'It is **not** necessarily where the cause is. That distinction is the whole of this lesson, and it is Quiz 7 Q2.',
            },
          ],
        },
        {
          id: 'w7-err-index',
          title: 'Index outside the bounds of the array',
          blocks: [
            {
              t: 'predict',
              question: 'What happens here?',
              code: `public class Program
{
    public static void Main()
    {
        int[] scores = new int[3];
        scores[0] = 70;
        scores[1] = 80;
        scores[2] = 90;

        for (int i = 0; i <= scores.Length; i++)
        {
            Console.WriteLine(scores[i]);
        }
    }
}`,
              options: [
                'It prints 70, 80 and 90, then crashes with an IndexOutOfRangeException',
                'It prints 70, 80 and 90 and finishes normally',
                'It prints 70, 80, 90 and then 0',
                'It is rejected before running, because the loop condition is wrong',
              ],
              answer: 0,
              why: [
                '',
                'The loop condition is `<=`, not `<`, so there is one extra iteration after the last real element.',
                'Reading past the end is not a zero — the array has no fourth slot to read.',
                'Loop bounds are a runtime matter. The compiler has no idea what `scores.Length` will be.',
              ],
              explain:
                'Quiz 7 Q1. Valid indexes run from `0` to `Length - 1`, so for a three-element array that is 0, 1, 2. The condition `i <= scores.Length` lets `i` reach 3, which is one past the end. When you see this exception, check the **index** against the bounds first — nine times in ten it is a `<=` that should be a `<`.',
              expect: { errorContains: 'Index 3 is outside the bounds' },
            },
          ],
        },
        {
          id: 'w7-err-null',
          title: 'Object reference not set to an instance of an object',
          blocks: [
            {
              t: 'predict',
              question: 'And here?',
              code: `public class Item
{
    public string Name;
}

public class Program
{
    public static void Main()
    {
        Item[] bag = new Item[2];
        bag[0] = new Item();
        bag[0].Name = "torch";

        Console.WriteLine(bag[0].Name);
        Console.WriteLine(bag[1].Name);
    }
}`,
              options: [
                'It prints `torch`, then crashes with a NullReferenceException',
                'It prints `torch`, then an empty line',
                'It prints `torch`, then crashes with an IndexOutOfRangeException',
                'It crashes immediately, before printing anything',
              ],
              answer: 0,
              why: [
                '',
                'An empty line would mean `bag[1]` is an `Item` whose `Name` happens to be empty. It is not an `Item` at all.',
                'Index 1 is perfectly valid in a two-element array. The array access succeeds; it is what comes back that is the problem.',
                'The first two lines run fine. The crash is on the last one.',
              ],
              explain:
                'Quiz 7 Q5. `new Item[2]` creates an array of two **slots**, not two items — both start as `null`. Slot 0 was filled with `new Item()`; slot 1 never was. Reading `.Name` off `null` is a `NullReferenceException`. Note how precisely this differs from the previous step: there, the *index* was wrong; here, the index is fine and the *object* is missing.',
              expect: { errorContains: 'null' },
            },
          ],
        },
        {
          id: 'w7-err-wrongline',
          title: 'The reported line is innocent',
          blocks: [
            {
              t: 'text',
              md: `This is the lecture's own worked example, and it is the most useful thing in the week.

A \`NullReferenceException\` is reported inside \`Inventory.Put\` — the line that calls \`_items.Add(itm)\`. Every instinct says to go and fix \`Inventory\`. But \`Inventory\` is correct. The bug is in \`Main\`, several calls away, which declared an \`Inventory\` variable and **never allocated one with \`new\`**.`,
            },
            {
              t: 'predict',
              question: 'Where is the crash reported, and where is the mistake?',
              code: `public class Item
{
    public string Name;
    public Item(string name) { Name = name; }
}

public class Inventory
{
    private List<Item> _items = new List<Item>();

    public void Put(Item itm)
    {
        _items.Add(itm);
    }
}

public class Player
{
    private Inventory _inventory;

    public Player(string name)
    {
        Console.WriteLine(name + " enters the cave");
    }

    public void Pickup(Item itm)
    {
        _inventory.Put(itm);
    }
}

public class Program
{
    public static void Main()
    {
        Player p = new Player("Robin");
        p.Pickup(new Item("torch"));
        Console.WriteLine("picked up");
    }
}`,
              options: [
                'Reported inside Pickup, but the mistake is in the constructor, which never created the Inventory',
                'Reported inside Pickup, and the mistake is in Pickup, which should check for null first',
                'Reported inside Inventory.Put, because `_items` was never allocated',
                'Reported in Main, on `new Player("Robin")`',
              ],
              answer: 0,
              why: [
                '',
                'A null check in `Pickup` would stop the crash and leave the real defect in place — a player walking around with no inventory, now silently dropping everything.',
                '`Inventory` allocates `_items` right on its field declaration, so `Put` is fine. The problem is one level up: there is no `Inventory` at all.',
                'The constructor runs happily — it prints its line. It is what the constructor *fails* to do that matters, and that only surfaces later.',
              ],
              explain:
                'This is the lecture\'s worked example in miniature. `Pickup` is correct, `Inventory` is correct, and the exception lands on `_inventory.Put(itm)` — so the reported line belongs to code that has nothing wrong with it. The mistake is the constructor never running `_inventory = new Inventory();`, which is a **different method in a different frame**. Read the stack trace outwards and ask what the caller failed to create.',
              expect: { errorContains: 'null' },
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'Build and test class by class',
              md: 'The deck\'s prescription for this exact pain: get each class working and tested **before** integrating it with the next. Once four untested classes are wired together, a null reference could have come from any of them — and the stack trace only tells you where it landed.',
            },
          ],
          exercise: {
            prompt:
              'Fix the Player constructor so Pickup works — leave Pickup and Inventory alone, because neither is wrong.',
            seed: `public class Player
{
    private Inventory _inventory;

    public Player(string name)
    {
        Console.WriteLine(name + " enters the cave");
    }

    public void Pickup(Item itm)
    {
        _inventory.Put(itm);
    }

    public int Carrying
    {
        get { return _inventory.Count; }
    }
}`,
            editable: { from: 5, to: 8 },
            tests: [
              {
                kind: 'output',
                label: 'The player enters, picks up the torch, and is carrying one thing',
                expect: 'Robin enters the cave\n1',
              },
              {
                kind: 'forbid',
                label: 'Pickup is left alone — a null guard there would hide the bug, not fix it',
                pattern: '_inventory\\s*==\\s*null',
                message:
                  'Guarding at the point of use treats the symptom. The object should have existed from the moment the player did.',
              },
            ],
            harness: `public class Item
{
    public string Name;
    public Item(string name) { Name = name; }
}

public class Inventory
{
    private List<Item> _items = new List<Item>();
    public void Put(Item itm) { _items.Add(itm); }
    public int Count { get { return _items.Count; } }
}

public class __Check
{
    public static void Main()
    {
        Player p = new Player("Robin");
        p.Pickup(new Item("torch"));
        Console.WriteLine(p.Carrying);
    }
}`,
            hints: [
              'The exception is a null reference on `_inventory`. Ask where `_inventory` was ever given a value.',
              'Declaring a field of a class type does not create an object — a constructor has to allocate one.',
              'Add `_inventory = new Inventory();` inside the constructor, alongside the line that is already there.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w7-err-docs',
          title: 'Documentation, tests, and knowing when to search',
          blocks: [
            {
              t: 'text',
              md: `The last third of the deck is about the tools around the code rather than the code.

**Read the documentation.** Every serious library ships with it, and your IDE will take you straight there — hover a symbol, or go-to-definition. Guessing a method's parameters is how you generate the overload and scope errors in the first two lessons of this week.

**Trust a prescribed design.** When a lab hands you a UML diagram or an interface, follow it step by step and check your implementation against it as you go. Deviating and hoping it still fits is how a task that should take an hour takes four.

**Use \`Assert\`.** \`Assert.That()\`, \`Assert.AreEqual()\`, \`Assert.IsTrue()\` — a structured, repeatable statement of what the code is supposed to do. You have been writing these since Week 4.`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'On Google, Stack Overflow, and asking an AI',
              md: '> *"Any developer who doesn\'t have a full tab bar of Google and Stack Overflow tabs isn\'t working."*\n\nThe deck\'s own line. The lecturer adds a distinction worth keeping: asking an AI gives you **a** solution; reading how other people diagnosed the same error gives you the **process**, which is the part that transfers to the next unfamiliar bug. Use both — just do not let the first replace the second.',
            },
            {
              t: 'quiz',
              question: 'Why does the deck insist on reading API documentation?',
              options: [
                'It tells you the available methods, the parameters each expects, and how they are meant to be used',
                'It is the only legal way to use a third-party library',
                'It guarantees your code will compile first time',
                'It makes your program run faster than working it out yourself',
              ],
              answer: 0,
              why: [
                '',
                'Licensing is a separate question entirely, and not what this slide is about.',
                'Nothing guarantees that. Documentation removes a class of avoidable errors; it does not remove all of them.',
                'Documentation has no effect on runtime speed. It affects how long *you* take.',
              ],
              explain:
                'Quiz 7 Q4. Documentation answers the three questions that produce most beginner build errors: what operations exist, what each one expects, and how it is meant to be called. The overload and conversion errors earlier in this week are almost entirely a documentation problem in disguise.',
            },
            {
              t: 'quiz',
              question: 'You hit an error you have never seen before. What does the deck recommend first?',
              options: [
                'Read the error message and the stack trace carefully, and work out the root cause from them',
                'Comment out code until it stops happening',
                'Rewrite the class from scratch in case something is subtly wrong',
                'Add a try/catch around it so the program keeps running',
              ],
              answer: 0,
              why: [
                '',
                'This eventually locates *a* line, slowly, and teaches you nothing about why. It is what you do when reading the message has genuinely failed.',
                'Rewriting discards the evidence. If you did not understand the bug, the rewrite is likely to contain it again.',
                'Catching an exception you have not diagnosed converts a loud failure into a quiet wrong answer. Exceptions are not for ordinary control flow.',
              ],
              explain:
                'Quiz 7 Q2. The message and the trace are the runtime\'s own account of what happened, and they are usually sufficient. The one caveat this lesson keeps repeating: the reported line is where the symptom appeared, so read the trace **outwards** until you reach your own code.',
            },
          ],
        },
        {
          id: 'w7-err-recall',
          title: 'In your own words',
          blocks: [
            {
              t: 'recall',
              prompt:
                'A NullReferenceException is reported on a line inside a class you are sure is correct. Describe how you would find the real cause, and why the reported line can be innocent.',
              nudge:
                'What does a stack trace list, and in what order? Which end of it is your code most likely to be at?',
              points: [
                'The exception type already narrows it: something was used before it was created with `new`',
                'The reported line is where the symptom surfaced, not necessarily where the cause is',
                'Read the stack trace outwards from the deepest frame until you reach code you wrote',
                'Ask what the calling code failed to allocate, rather than guarding inside the callee',
                'A null guard in the inner class hides the bug instead of fixing it',
                'Building and testing class by class keeps the list of possible causes short',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 4
    {
      id: 'w7-rdd',
      title: 'Responsibility-driven design, after the break',
      kind: 'concept',
      minutes: 15,
      summary:
        'The same three steps as Week 6, now aimed at the custom program — with cohesion, coupling and the five UML relationships reapplied.',
      steps: [
        {
          id: 'w7-rdd-again',
          title: 'Why this is back',
          blocks: [
            {
              t: 'callout',
              tone: 'warn',
              title: 'Week 6 said this was not on the midterm. That has expired.',
              md: 'It was true, and only about the midterm. RDD is now the design method you are expected to bring to the **custom program**, and it is examinable from here on. If you filed Week 6 under "not needed", this is the lesson that un-files it.',
            },
            {
              t: 'text',
              md: `The lecturer's framing: on a real project — PyTorch, or React with its two thousand-plus contributors — nobody can hold the whole system in their head. What stops the result from being a pile of redundant, overlapping, unusable classes is a **shared way of deciding what a class is for**.

And the lecture is explicit that this does not go away in the AI-assisted era. If you and a teammate each ask a model to "write some classes" with no shared design convention, the two results will not cohere — because the model reflects the prompt it was given, and neither prompt carried the design.`,
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'The same framing, applied to an agent',
              md: 'The lecturer extends it further: designing an AI agent asks the same two questions RDD does. What does the agent need to **know** — its context, its prompt, its knowledge? And what can it **do** — which tools may it call? Roles, responsibilities, collaborations, unchanged.',
            },
          ],
        },
        {
          id: 'w7-rdd-steps',
          title: 'The three steps, on a new brief',
          blocks: [
            {
              t: 'table',
              caption: 'RDD, reapplied',
              headers: ['Step', 'What you do', 'This week\'s examples'],
              rows: [
                [
                  '**1 — Candidate roles**',
                  'Skim the requirements for **nouns**; each becomes a candidate class on a CRC card',
                  'Chess: pawn, king, queen, bishop, cell, board. To-do list: task, employee',
                ],
                [
                  '**2 — Responsibilities**',
                  'For each card, what it **knows** and what it **can do**',
                  'Bishop knows its location, colour and movement rules; can move and capture',
                ],
                [
                  '**3 — Collaborations**',
                  'Who needs help from whom, to satisfy the behaviour as a whole',
                  'On "start game", what sequence of calls initialises the board and places the pieces',
                ],
              ],
            },
            {
              t: 'compare',
              title: 'A CRC card has exactly two columns for a reason',
              left: {
                title: 'Knows — state',
                tone: 'neutral',
                md: 'Chess **Cell**: which piece occupies it, its colour.\n\nTo-do **Task**: its title, its due date, who owns it.',
              },
              right: {
                title: 'Does — behaviour',
                tone: 'neutral',
                md: 'Chess **Bishop**: move, capture.\n\nTo-do **Employee**: check records, calculate a KPI or a salary.',
              },
            },
            {
              t: 'quiz',
              question:
                'You are given a one-paragraph brief for a library system. What produces your first list of candidate classes?',
              options: [
                'The nouns in the brief',
                'The verbs in the brief',
                'The adjectives in the brief',
                'The order the requirements are numbered in',
              ],
              answer: 0,
              why: [
                '',
                'Verbs are the raw material for step 2 — the "does" side of a responsibility. They are not candidate classes.',
                'Adjectives usually become attributes of something, if they survive at all.',
                'Numbering is an artefact of how the brief was written. It says nothing about structure.',
              ],
              explain:
                'Nouns first, because a noun is a thing that can have state and behaviour. The verbs come back at step 2, when you decide which of the nouns each verb belongs to — and that decision is where the information-expert rule applies: the responsibility goes to whoever already holds the data.',
            },
          ],
        },
        {
          id: 'w7-rdd-cohesion',
          title: 'Cohesion: one class, one job',
          blocks: [
            {
              t: 'text',
              md: `**Cohesion** asks how strongly a class's own responsibilities relate to each other. The deck's example this week is an \`Employee\`.

Holding a name, an ID and a salary is fine — those belong together, they are all facts about a person the company employs. Adding the **KPI calculation** and the **payroll logic** is not fine. Now, when the company changes how bonuses are computed, you edit \`Employee\` — a class that has nothing to do with bonus policy and is depended on by everything.`,
            },
            {
              t: 'compare',
              title: 'Where does the bonus rule live?',
              left: {
                title: 'Low cohesion',
                tone: 'bad',
                code: `class Employee
{
    string Name;
    int Id;
    double Salary;

    double CalculateKpi();
    double RunPayroll();
}`,
              },
              right: {
                title: 'Higher cohesion',
                tone: 'good',
                code: `class Employee
{
    string Name;
    int Id;
    double Salary;
}

class Payroll
{
    double CalculateKpi(Employee e);
}`,
              },
            },
            {
              t: 'quiz',
              question: 'What is the practical cost of the low-cohesion version?',
              options: [
                'A change to bonus policy forces a change to Employee, which everything else depends on',
                'It uses more memory, because Employee objects are larger',
                'The compiler will refuse to build it',
                'Employee can no longer be used in a List',
              ],
              answer: 0,
              why: [
                '',
                'Methods do not make instances bigger — code lives once, with the type, not once per object.',
                'It compiles perfectly. Poor cohesion is a design problem, not a syntax one, which is exactly why it survives into production.',
                'Nothing about cohesion affects whether a type can go in a collection.',
              ],
              explain:
                'Cohesion is really a question about **why a class would change**. A highly cohesive class has one reason to change. `Employee` holding payroll logic has at least two — a change to employee records, and a change to company policy — and the second kind of change should not be touching the first kind of class.',
            },
          ],
        },
        {
          id: 'w7-rdd-coupling',
          title: 'Coupling: depend on the contract, not the class',
          blocks: [
            {
              t: 'text',
              md: `**Coupling** asks how dependent classes are on one another. The deck's example: you need to play music on a CD player, a voice recorder and a phone.

The tempting move is one big \`MusicPlayer\` class with a branch per device. The better move is a \`MusicPlayer\` **interface** that each device implements — so adding an Android or an iPhone means writing a new class, and changing nothing that already works. That is **loose coupling**, achieved through polymorphism.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'This is the same rule as "avoid the if-else chain"',
              md: 'A branch per concrete type *is* the coupling. Every new device edits the same method. Replace the branch with a shared interface and a list of it, and the new device edits nothing.',
            },
          ],
          exercise: {
            prompt:
              'Define an IMusicPlayer interface with a Play() method, and two classes — CdPlayer and PhonePlayer — that implement it.',
            seed: `public interface IMusicPlayer
{

}

public class CdPlayer
{

}

public class PhonePlayer
{

}`,
            editable: { from: 1, to: 14 },
            tests: [
              {
                kind: 'structure',
                label: 'CdPlayer implements IMusicPlayer',
                rule: { on: 'class', name: 'CdPlayer', implements: 'IMusicPlayer' },
              },
              {
                kind: 'structure',
                label: 'PhonePlayer implements IMusicPlayer',
                rule: { on: 'class', name: 'PhonePlayer', implements: 'IMusicPlayer' },
              },
              {
                kind: 'output',
                label: 'One loop over a List<IMusicPlayer> plays both',
                expect: 'spinning the disc\nstreaming from the phone',
              },
              {
                kind: 'forbid',
                label: 'The loop is polymorphic — no branching on the concrete type',
                pattern: '\\bis\\s+CdPlayer\\b',
                message:
                  'Checking the concrete type is the coupling this exercise removes. Let the interface dispatch for you.',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        List<IMusicPlayer> devices = new List<IMusicPlayer>();
        devices.Add(new CdPlayer());
        devices.Add(new PhonePlayer());
        foreach (IMusicPlayer d in devices)
        {
            d.Play();
        }
    }
}`,
            hints: [
              'An interface declares the signature and stops at the semicolon — no body, no braces.',
              'A class implementing it uses the same `: Name` syntax as inheritance: `public class CdPlayer : IMusicPlayer`.',
              'CdPlayer.Play prints "spinning the disc"; PhonePlayer.Play prints "streaming from the phone". Neither needs the `override` keyword — there is no base implementation to override.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w7-rdd-uml',
          title: 'The five relationships, one more time',
          blocks: [
            {
              t: 'text',
              md: `Step 3 produces relationships, and UML has a notation for each. The lecture reuses one running example — a \`Student\`, a \`Catalog\` of units, and the \`StudyUnit\`s themselves.`,
            },
            {
              t: 'table',
              caption: 'Reading the line between two boxes',
              headers: ['Relationship', 'Notation', 'Meaning', 'In the example'],
              rows: [
                [
                  '**Dependency**',
                  'dashed arrow',
                  'Temporary use of another object',
                  'A student consults the `Catalog` to check which units are compulsory',
                ],
                [
                  '**Association**',
                  'solid line',
                  'A permanent link between two objects',
                  '`Student` holds the `StudyUnit`s they are enrolled in',
                ],
                [
                  '**Aggregation**',
                  'solid line, **open** diamond',
                  'A container whose parts can outlive it',
                  '`Catalog` contains many `StudyUnit`s — delete the catalog, the units still exist',
                ],
                [
                  '**Composition**',
                  'solid line, **filled** diamond',
                  'A container whose parts die with it',
                  'A `Book` is composed of `Page`s — destroy the book and the pages go too',
                ],
                [
                  '**Inheritance**',
                  'solid line, hollow triangle',
                  '"is a kind of"',
                  '`Item` is a kind of `GameObject`',
                ],
              ],
            },
            {
              t: 'quiz',
              question:
                'Which diamond do you draw between `Catalog` and `StudyUnit`, and why?',
              options: [
                'Open — a study unit still exists as a thing the university offers even if this catalog is deleted',
                'Filled — the catalog owns the units completely',
                'Neither — a container relationship is drawn as a dashed arrow',
                'Neither — this is inheritance, since a catalog is a kind of unit collection',
              ],
              answer: 0,
              why: [
                '',
                'Filled means the parts cannot outlive the whole. A `StudyUnit` plainly can — it is offered by the university, not owned by one catalog.',
                'A dashed arrow is a dependency: a temporary use, not a containment.',
                'A catalog is not a kind of study unit. Containing things is not inheriting from them.',
              ],
              explain:
                'Open diamond is **aggregation**: a container relationship where the parts have an independent life. Filled diamond is **composition**, where they do not — `Book` and `Page` is the deck\'s example. The test is always the same question: if I destroy the whole, does the part stop making sense?',
            },
          ],
        },
        {
          id: 'w7-rdd-recall',
          title: 'In your own words',
          blocks: [
            {
              t: 'recall',
              prompt:
                'A teammate proposes one class that stores a customer\'s details, works out their discount tier, and renders their profile page. Using cohesion and coupling, say what is wrong and what you would propose instead.',
              nudge:
                'Ask how many different reasons this class would have to change, and who would be asking for each of them.',
              points: [
                'The class has at least three reasons to change — record structure, pricing policy, and page layout',
                'That is low cohesion: its responsibilities are not related to each other',
                'Pricing logic belongs with whatever owns pricing policy, not with the customer record',
                'Rendering belongs in a separate view-side class, which is the laziness rule and the M/V split of MVC',
                'Splitting them reduces coupling: a pricing change then touches one class instead of everything holding a customer',
                'The information-expert rule decides where each moved responsibility lands — with whoever holds the data it needs',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 5
    {
      id: 'w7-task71',
      title: 'Task 7.1 — ShapeDrawer: Saving and Loading a Drawing',
      kind: 'lab',
      minutes: 45,
      assessment: 'Assessed · verified in your Week 7 lab',
      summary:
        'Split the shape family into one class per file, then teach every shape to write itself to a text file and read itself back.',
      steps: [
        {
          id: 'w7-71-why',
          title: 'A drawing that outlives the program',
          blocks: [
            {
              t: 'text',
              md: `Week 6 got you a drawing you can fill with rectangles, circles and lines. Close the window and it is gone. This week the program learns to **persist** — to write the drawing to a text file and rebuild it on demand.

Persistence is where a whole term of design decisions gets tested at once. A hierarchy that pushed \`_width\` and \`_height\` down onto \`MyRectangle\` now has to write *different fields per subclass* into *one* file, and read them back without knowing in advance what is coming.`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'About this week\'s task sheet',
              md: 'The PDF handed out as **OOP Lab7.pdf** is byte-identical to Lab6.pdf — same file, same "Week 6: Multiple Shape Kinds" title page. The Week 7 work is driven by your lab session rather than by a new sheet, and it is the save/load feature your lecturer live-codes in the Week 7 lecture. That is what this lesson builds.',
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why this week matters twice',
              md: 'Everything here reappears in **Task 8.2**, where `GameObject` and `Player` get the same `SaveTo`/`LoadFrom` treatment on the SwinAdventure side. Learn the pattern on shapes, apply it to the player — that is the whole reason the unit orders these two weeks this way.',
            },
          ],
        },
        {
          id: 'w7-71-onefile',
          title: 'One class per file',
          blocks: [
            {
              t: 'text',
              md: `Before any new behaviour, the housekeeping. Week 6 left \`Shape\`, \`Drawing\`, \`MyRectangle\`, \`MyCircle\` and \`MyLine\` **all inside \`Shape.cs\`** — five classes in one file, which was tolerable at two and is not at five.

Split them:

\`\`\`
Shape.cs   (everything)
        ↓
Shape.cs · Drawing.cs · MyRectangle.cs · MyCircle.cs · MyLine.cs
\`\`\`

In Visual Studio: right-click the project, **Add → Class**, name it \`MyCircle\`, then cut the class body across and delete it from \`Shape.cs\`. The namespace declaration is repeated in each new file; the \`using SplashKitSDK;\` line usually is too.`,
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'Nothing should change',
              md: 'This is a pure move. Build and run after it — the program should behave exactly as it did before, because C# does not care which file a class lives in. If it stops compiling, you have a missing `namespace` or `using` in a new file, not a design problem.',
            },
            {
              t: 'text',
              md: `Track A made this same move back in Task 4.2, pulling \`IdentifiableObject\` out of \`Program.cs\`. The reason is the same both times: a file is the unit you navigate by, so one file per class means the file list *is* the class list.`,
            },
            {
              t: 'quiz',
              question:
                'What does splitting five classes across five files change about the compiled program?',
              options: [
                'Nothing — file layout is for humans, and the compiler sees the same set of types either way',
                'Each file becomes a separate assembly, so they can be deployed independently',
                'The classes can no longer see each other unless you add using directives',
                'It makes the program start faster, because less code is loaded per file',
              ],
              answer: 0,
              why: [
                '',
                'One project compiles to one assembly regardless of how many files it holds.',
                'Classes in the same namespace see each other with no `using` at all — that is what the namespace is for.',
                'Nothing is loaded "per file" at runtime; the compiler has already merged everything.',
              ],
              explain:
                'C# has no relationship between files and types — `Shape.cs` could declare zero classes or twelve. The split buys navigability and nothing else, which is exactly why it is safe to do as a separate step before touching behaviour.',
            },
          ],
        },
        {
          id: 'w7-71-format',
          title: 'Designing the file format first',
          blocks: [
            {
              t: 'text',
              md: `Do not open the editor yet. A save/load feature is a **format** plus two methods that agree on it, and the format is the part that is expensive to get wrong — every save file written under the old format becomes unreadable the moment you change it.

Here is a real saved drawing: a white background, a blue circle, a green rectangle, and the first of eight red lines.`,
            },
            {
              t: 'code',
              lang: 'text',
              caption: 'drawing.txt — a real save file, abbreviated',
              code: `#ffffffff
10
Circle
#0000ffff
323
300
2026-09-22 17:38:29
59
Rectangle
#007f00ff
411
298
2026-09-22 17:38:32
109
109
Line
#ff0000ff
526
276
2026-09-22 17:38:34
676
276`,
            },
            {
              t: 'table',
              caption: 'Reading that file top to bottom',
              headers: ['Line(s)', 'What it is', 'Who writes it'],
              rows: [
                ['`#ffffffff`', 'The drawing\'s background colour', '`Drawing.Save`'],
                ['`10`', 'How many shapes follow', '`Drawing.Save`'],
                ['`Circle`', 'A **type tag** — which class comes next', '`Drawing.Save`, from `shape.TypeName`'],
                ['colour, X, Y, timestamp', 'The four fields every shape has', '`Shape.SaveTo`'],
                ['`59`', 'The radius — a circle-only field', '`MyCircle.SaveTo`'],
                ['`109`, `109`', 'Width then height — rectangle-only fields', '`MyRectangle.SaveTo`'],
              ],
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Two decisions carry the whole format',
              md: 'The **count** on line 2 tells the loader how many times to go round its loop. The **type tag** before each shape tells it which class to create. Without the tag, reading `#0000ffff / 323 / 300 / …` is just numbers — there is no way to tell a circle\'s radius from a rectangle\'s width.',
            },
            {
              t: 'quiz',
              question:
                'Why does the count on line 2 exist, when the loader could just read until the file ends?',
              options: [
                'It lets the loader run a fixed `for` loop, and it validates the file — a truncated save is detected rather than silently loading half a drawing',
                'StreamReader cannot detect the end of a file, so a count is mandatory',
                'It is required by the text file format itself',
                'Without it the shapes would load in the wrong order',
              ],
              answer: 0,
              why: [
                '',
                '`ReadLine` returns `null` past the end, so reading-until-empty is perfectly possible — it is just weaker.',
                'A text file has no format. It is lines of characters; every bit of structure in it is one you invented.',
                'Order comes from the order they were written, and a count does not affect it.',
              ],
              explain:
                'Either approach reads the shapes. The count is the better one because it turns "the file ended" into "the file ended *early*" — an error you can report instead of a drawing that quietly lost its last three shapes.',
            },
          ],
        },
        {
          id: 'w7-71-typename',
          title: 'TypeName — the tag each subclass supplies',
          blocks: [
            {
              t: 'text',
              md: `Start with the tag, because the rest of the format hangs off it. \`Shape\` declares an **abstract read-only property**:

\`\`\`csharp
public abstract string TypeName { get; }
\`\`\`

and each subclass answers with its own word. \`Shape\` itself has no sensible answer — which is exactly what \`abstract\` is for.`,
            },
            {
              t: 'compare',
              title: 'Two ways to get the tag',
              left: {
                title: 'A tag per subclass',
                tone: 'good',
                code: `public abstract string TypeName { get; }

// in MyCircle
public override string TypeName
{
    get { return "Circle"; }
}`,
              },
              right: {
                title: 'Branching in the writer',
                tone: 'bad',
                code: `// in Drawing.Save
if (shape is MyCircle)
    writer.WriteLine("Circle");
else if (shape is MyRectangle)
    writer.WriteLine("Rectangle");
else if (shape is MyLine)
    writer.WriteLine("Line");`,
              },
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'This is the same argument as Week 6\'s Draw',
              md: 'A fourth shape kind costs one line in the left-hand version and an edit to `Drawing.Save` in the right-hand one. Every `is`-chain over a hierarchy is a method that should have been on the hierarchy — Week 8 names this as a design smell and Quiz 8 asks about it.',
            },
            {
              t: 'predict',
              question: 'What does this print?',
              code: `public abstract class Shape
{
    public abstract string TypeName { get; }
}

public class MyCircle : Shape
{
    public override string TypeName { get { return "Circle"; } }
}

public class MyLine : Shape
{
    public override string TypeName { get { return "Line"; } }
}

public class Program
{
    public static void Main()
    {
        List<Shape> shapes = new List<Shape>();
        shapes.Add(new MyCircle());
        shapes.Add(new MyLine());

        foreach (Shape s in shapes)
        {
            Console.WriteLine(s.TypeName);
        }
    }
}`,
              options: [
                'Circle\nLine',
                'Shape\nShape',
                'It will not compile — TypeName has no body on Shape',
                'An empty line, twice',
              ],
              answer: 0,
              why: [
                '',
                'The variable is typed `Shape`, but the *object* decides which getter runs. That is the point of an abstract property.',
                'An abstract member is *required* to have no body. It compiles precisely because both subclasses supply one.',
                'Neither getter returns an empty string, and there is no default to fall back to.',
              ],
              explain:
                'The loop only knows it holds `Shape`s, yet each one answers with its own tag. This is the same dynamic dispatch as `Draw()` — and it is what lets `Drawing.Save` write the right tag without a single type check.',
              expect: { output: 'Circle\nLine' },
            },
            {
              t: 'text',
              md: `Write it. \`TypeName\` is abstract on \`Shape\`, and each of the three subclasses overrides it with its own word — and those words have to be **exactly** the ones the loader will switch on later.`,
            },
          ],
          exercise: {
            prompt:
              'Declare TypeName as an abstract read-only string property on Shape, and override it in all three subclasses to return "Rectangle", "Circle" and "Line".',
            seed: `public abstract class Shape
{
    private Color _color;
    private float _x;
    private float _y;

    public Shape(Color color) { _color = color; _x = 0.0f; _y = 0.0f; }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }

    // Declare TypeName here.
}

public class MyRectangle : Shape
{
    public MyRectangle() : base(Color.Green) { }

    // Override it here.
}

public class MyCircle : Shape
{
    public MyCircle() : base(Color.Blue) { }

    // And here.
}

public class MyLine : Shape
{
    public MyLine() : base(Color.Red) { }

    // And here.
}`,
            tests: [
              {
                kind: 'structure',
                label: 'Shape declares TypeName as an abstract property',
                rule: { on: 'property', inClass: 'Shape', name: 'TypeName', type: 'string', hasGet: true },
              },
              {
                kind: 'structure',
                label: 'MyCircle overrides it',
                rule: { on: 'property', inClass: 'MyCircle', name: 'TypeName', isOverride: true },
              },
              {
                kind: 'structure',
                label: 'MyRectangle overrides it',
                rule: { on: 'property', inClass: 'MyRectangle', name: 'TypeName', isOverride: true },
              },
              {
                kind: 'structure',
                label: 'MyLine overrides it',
                rule: { on: 'property', inClass: 'MyLine', name: 'TypeName', isOverride: true },
              },
              {
                kind: 'output',
                label: 'Each kind reports its own tag through a Shape variable',
                expect: 'Rectangle\nCircle\nLine',
              },
              {
                kind: 'forbid',
                label: 'The tag comes from the object, not from an is-check',
                pattern: 'is MyCircle|is MyRectangle|is MyLine|GetType',
                message:
                  'Let each subclass answer for itself — no type checks. That is what overriding TypeName is for.',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        List<Shape> shapes = new List<Shape>();
        shapes.Add(new MyRectangle());
        shapes.Add(new MyCircle());
        shapes.Add(new MyLine());

        foreach (Shape s in shapes)
        {
            Console.WriteLine(s.TypeName);
        }
    }
}`,
            hints: [
              'An abstract property has a getter with no body at all: `{ get; }` — semicolon, not braces.',
              'The override supplies the body: `public override string TypeName { get { return "Circle"; } }`.',
              'On Shape: `public abstract string TypeName { get; }`. Then one override per subclass, each returning its own word.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w7-71-saveto',
          title: 'SaveTo — base first, then your own',
          blocks: [
            {
              t: 'text',
              md: `Now the fields. Every shape has a colour, an X, a Y and a creation timestamp; each *kind* has fields beyond that. So the writing splits the same way the hierarchy does:

- \`Shape.SaveTo(StreamWriter)\` is **\`virtual\`** and writes the four shared fields.
- Each subclass **overrides** it, calls \`base.SaveTo(writer)\` **first**, and then writes its own.`,
            },
            {
              t: 'code',
              caption: 'Shape.cs',
              code: `public virtual void SaveTo(StreamWriter writer)
{
    writer.WriteLine(SplashKit.ColorToString(Color));
    writer.WriteLine(X);
    writer.WriteLine(Y);
    writer.WriteLine(CreatedAt.ToString(TimestampFormat));
}`,
            },
            {
              t: 'code',
              caption: 'MyCircle.cs',
              code: `public override void SaveTo(StreamWriter writer)
{
    base.SaveTo(writer);
    writer.WriteLine(_radius);
}`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'base first is not a style choice',
              md: 'It fixes the **position** of the shared fields. Every shape\'s block is "four shared lines, then the extras", so `LoadFrom` can read the shared four without knowing which kind it is reading. Move `base.SaveTo` to the end of one override and only that one shape kind breaks — the worst kind of bug, because nine-tenths of the file still loads.',
            },
            {
              t: 'compare',
              title: 'Why the calls mirror each other',
              left: {
                title: 'Writing',
                tone: 'neutral',
                code: `// MyRectangle.SaveTo
base.SaveTo(writer);   // colour, X, Y, time
writer.WriteLine(_width);
writer.WriteLine(_height);`,
              },
              right: {
                title: 'Reading',
                tone: 'neutral',
                code: `// MyRectangle.LoadFrom
base.LoadFrom(reader); // colour, X, Y, time
_width = Convert.ToInt32(ReadLine(reader));
_height = Convert.ToInt32(ReadLine(reader));`,
              },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'A file has no field names',
              md: 'Nothing in `drawing.txt` says `109` is a width. The only thing making the file readable is that `LoadFrom` reads in **exactly** the order `SaveTo` wrote. Swap two `WriteLine` calls and the drawing reloads with its width and height exchanged — silently, with no error at all.',
            },
            {
              t: 'text',
              md: `Write both halves for \`MyCircle\`. The harness saves a circle, then loads it into a **fresh** one and prints what came back — so a mismatched order shows up as a wrong number rather than a crash.`,
            },
          ],
          exercise: {
            prompt:
              'Override SaveTo and LoadFrom in MyCircle so a circle survives a round trip: call base first in each, then handle _radius.',
            seed: `public class MyCircle : Shape
{
    private int _radius;

    public MyCircle(Color color, int radius) : base(color) { _radius = radius; }
    public MyCircle() : this(Color.Blue, {{circleRadius}}) { }

    public int Radius { get { return _radius; } set { _radius = value; } }

    public override string TypeName { get { return "Circle"; } }

    public override void SaveTo(StreamWriter writer)
    {
    }

    public override void LoadFrom(StreamReader reader)
    {
    }
}`,
            editable: { from: 12, to: 18 },
            tests: [
              {
                kind: 'structure',
                label: 'SaveTo overrides the base version',
                rule: { on: 'method', inClass: 'MyCircle', name: 'SaveTo', isOverride: true },
              },
              {
                kind: 'structure',
                label: 'LoadFrom overrides the base version',
                rule: { on: 'method', inClass: 'MyCircle', name: 'LoadFrom', isOverride: true },
              },
              {
                kind: 'output',
                label: 'A saved circle reloads with the same colour, position and radius',
                expect: '#0000ffff\n120\n80\n{{circleRadius}}',
              },
              {
                kind: 'forbid',
                label: 'The shared fields are written by the base class, not copied here',
                pattern: 'ColorToString|StringToColor',
                message:
                  'Colour is one of the four fields Shape already handles. Call base.SaveTo / base.LoadFrom instead of writing it again.',
              },
            ],
            harness: `public abstract class Shape
{
    public const string TimestampFormat = "yyyy-MM-dd HH:mm:ss";

    private Color _color;
    private float _x;
    private float _y;

    public Shape(Color color) { _color = color; _x = 0.0f; _y = 0.0f; }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }

    public abstract string TypeName { get; }

    public virtual void SaveTo(StreamWriter writer)
    {
        writer.WriteLine(SplashKit.ColorToString(Color));
        writer.WriteLine(X);
        writer.WriteLine(Y);
    }

    public virtual void LoadFrom(StreamReader reader)
    {
        Color = SplashKit.StringToColor(ReadLine(reader));
        X = Convert.ToSingle(ReadLine(reader));
        Y = Convert.ToSingle(ReadLine(reader));
    }

    public static string ReadLine(StreamReader reader)
    {
        string line = reader.ReadLine();
        if (line == null) { return ""; }
        return line;
    }
}

public class __Check
{
    public static void Main()
    {
        MyCircle saved = new MyCircle();
        saved.X = 120.0f;
        saved.Y = 80.0f;

        StreamWriter writer = new StreamWriter("circle.txt");
        saved.SaveTo(writer);
        writer.Close();

        MyCircle loaded = new MyCircle(Color.Black, 0);
        StreamReader reader = new StreamReader("circle.txt");
        loaded.LoadFrom(reader);
        reader.Close();

        Console.WriteLine(SplashKit.ColorToString(loaded.Color));
        Console.WriteLine(loaded.X);
        Console.WriteLine(loaded.Y);
        Console.WriteLine(loaded.Radius);
    }
}`,
            hints: [
              'Each method is two lines: the call to base, then one line for the radius.',
              '`base.SaveTo(writer);` then `writer.WriteLine(_radius);`. LoadFrom mirrors it.',
              'A line arrives as text, so reading needs a conversion: `_radius = Convert.ToInt32(ReadLine(reader));`.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w7-71-order',
          title: 'What a mismatched order actually does',
          blocks: [
            {
              t: 'text',
              md: `Worth seeing once, because it is the bug this feature produces most often and it does not announce itself.`,
            },
            {
              t: 'predict',
              question:
                'The writer writes width then height. The reader reads height then width. What happens?',
              code: `public class Program
{
    public static void Main()
    {
        StreamWriter writer = new StreamWriter("box.txt");
        writer.WriteLine(109);   // width
        writer.WriteLine(42);    // height
        writer.Close();

        StreamReader reader = new StreamReader("box.txt");
        int height = Convert.ToInt32(reader.ReadLine());
        int width = Convert.ToInt32(reader.ReadLine());
        reader.Close();

        Console.WriteLine("W=" + width + " H=" + height);
    }
}`,
              options: [
                'W=42 H=109',
                'W=109 H=42',
                'A FormatException, because the values arrive in the wrong order',
                'An InvalidDataException from the StreamReader',
              ],
              answer: 0,
              why: [
                '',
                'That is what the writer meant. The reader never finds out what the writer meant.',
                '`"109"` and `"42"` both convert to an `int` perfectly well. Nothing is malformed — only misinterpreted.',
                'Nothing throws that unless you throw it yourself. The read succeeded.',
              ],
              explain:
                'Both numbers are valid integers, so both conversions succeed and the program runs clean — with the values swapped. This is why `SaveTo` and `LoadFrom` are written and reviewed as a pair, and why `base` is called first in both.',
              expect: { output: 'W=42 H=109' },
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'This is why the lab uses StreamWriter and not BinaryWriter',
              md: 'A text save file can be opened and read with your own eyes. When a drawing reloads wrong, the first move is to open `drawing.txt` and count the lines against what you expected — a diagnosis that takes seconds, and one a binary format would deny you.',
            },
          ],
        },
        {
          id: 'w7-71-factory',
          title: 'CreateShape — turning a tag back into an object',
          blocks: [
            {
              t: 'text',
              md: `\`LoadFrom\` fills in a shape that already exists. Something has to **create** it first — and only the file knows which kind, via the tag.

That is a \`switch\` over the tag returning a new object, and it is the one place a type-per-kind decision genuinely belongs: it is turning text into types, which is the only direction polymorphism cannot help with.`,
            },
            {
              t: 'code',
              caption: 'Drawing.cs',
              code: `private static Shape CreateShape(string kind)
{
    switch (kind)
    {
        case "Rectangle":
            return new MyRectangle();

        case "Circle":
            return new MyCircle();

        case "Line":
            return new MyLine();

        default:
            throw new InvalidDataException("Unknown shape kind in save file: '" + kind + "'.");
    }
}`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why a switch is right here and wrong in Save',
              md: '`Drawing.Save` has a `Shape` object in hand, so it can *ask* it for its tag — a switch there would be branching on something the object already knows. `CreateShape` has only a `string`; there is no object to ask yet. Once it returns, every later call goes through the hierarchy again.',
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'The default case is not optional',
              md: 'Without it, an unrecognised tag falls through and `CreateShape` returns nothing — or worse, silently returns a rectangle. A corrupt or hand-edited save file should fail loudly at the line that noticed, which is what `throw new InvalidDataException(...)` does.',
            },
            {
              t: 'text',
              md: `Write it, including the \`default\`.`,
            },
          ],
          exercise: {
            prompt:
              'Write CreateShape so each tag returns a new shape of the matching kind, and an unknown tag throws an InvalidDataException naming the bad tag.',
            seed: `public class Drawing
{
    public static Shape CreateShape(string kind)
    {
    }
}`,
            editable: { from: 3, to: 5 },
            tests: [
              {
                kind: 'structure',
                label: 'Drawing has a CreateShape method taking the tag',
                rule: { on: 'method', inClass: 'Drawing', name: 'CreateShape', params: 1, returns: 'Shape' },
              },
              {
                kind: 'output',
                label: 'Each known tag builds the matching kind, and an unknown one is rejected',
                expect: 'Rectangle\nCircle\nLine\nrejected: Unknown shape kind in save file: \'Hexagon\'.',
              },
              {
                kind: 'forbid',
                label: 'An unknown tag is not quietly turned into a rectangle',
                pattern: 'return new MyRectangle\\(\\);[\\s\\S]*default:[\\s\\S]*return',
                message:
                  'The default case has to throw, not return a shape. A corrupt save file should say so.',
              },
            ],
            harness: `public abstract class Shape
{
    public abstract string TypeName { get; }
}

public class MyRectangle : Shape
{
    public override string TypeName { get { return "Rectangle"; } }
}

public class MyCircle : Shape
{
    public override string TypeName { get { return "Circle"; } }
}

public class MyLine : Shape
{
    public override string TypeName { get { return "Line"; } }
}

public class __Check
{
    public static void Main()
    {
        Console.WriteLine(Drawing.CreateShape("Rectangle").TypeName);
        Console.WriteLine(Drawing.CreateShape("Circle").TypeName);
        Console.WriteLine(Drawing.CreateShape("Line").TypeName);

        try
        {
            Drawing.CreateShape("Hexagon");
            Console.WriteLine("no error");
        }
        catch (InvalidDataException e)
        {
            Console.WriteLine("rejected: " + e.Message);
        }
    }
}`,
            hints: [
              'A `switch` on `kind` with one `case` per tag, each returning a `new` shape.',
              'The tags are the exact strings TypeName returns — "Rectangle", "Circle", "Line". A typo here loads nothing.',
              'The default throws: `throw new InvalidDataException("Unknown shape kind in save file: \'" + kind + "\'.");`',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w7-71-drawing',
          title: 'Drawing.Save and Drawing.Load',
          blocks: [
            {
              t: 'text',
              md: `The two ends. \`Save\` writes the header then walks the list; \`Load\` reads the header then goes round a \`for\` loop \`count\` times, and each pass does three things in order: **read the tag, create the shape, let the shape read itself.**`,
            },
            {
              t: 'compare',
              title: 'The two halves of the format, side by side',
              left: {
                title: 'Drawing.Save',
                tone: 'neutral',
                code: `writer.WriteLine(SplashKit.ColorToString(_background));
writer.WriteLine(_shapes.Count);

foreach (Shape shape in _shapes)
{
    writer.WriteLine(shape.TypeName);
    shape.SaveTo(writer);
}`,
              },
              right: {
                title: 'Drawing.Load',
                tone: 'neutral',
                code: `_background = SplashKit.StringToColor(Shape.ReadLine(reader));
int count = Convert.ToInt32(Shape.ReadLine(reader));

_shapes.Clear();

for (int i = 0; i < count; i++)
{
    string kind = Shape.ReadLine(reader);
    Shape shape = CreateShape(kind);
    shape.LoadFrom(reader);
    _shapes.Add(shape);
}`,
              },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Clear the list before loading into it',
              md: '`Load` **replaces** the drawing. Miss `_shapes.Clear()` and loading appends to whatever was on screen, so pressing O twice gives you twenty shapes from a ten-shape file — and every one of them is a duplicate sitting exactly on top of another.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Two keys in Program.cs',
              md: 'The main loop gets **S** to save and **O** to open. Guard the load with `File.Exists(SaveFileName)` — pressing O before ever pressing S should print a message, not throw a `FileNotFoundException` at someone who did nothing wrong.',
            },
            {
              t: 'text',
              md: `Write \`Load\`. \`Save\` is given, so the harness writes a real two-shape file with it and then asks your \`Load\` to rebuild it — the full round trip, tags and all.`,
            },
          ],
          exercise: {
            prompt:
              'Write Drawing.Load so it restores the background, then rebuilds exactly count shapes — reading the tag, creating the shape, and letting it load itself.',
            seed: `public class Drawing
{
    private List<Shape> _shapes;
    private Color _background;

    public Drawing(Color background)
    {
        _shapes = new List<Shape>();
        _background = background;
    }

    public Color Background { get { return _background; } set { _background = value; } }
    public int ShapeCount { get { return _shapes.Count; } }
    public List<Shape> Shapes { get { return _shapes; } }

    public void AddShape(Shape shape) { _shapes.Add(shape); }

    public void Save(string filename)
    {
        StreamWriter writer = new StreamWriter(filename);
        writer.WriteLine(SplashKit.ColorToString(_background));
        writer.WriteLine(_shapes.Count);

        foreach (Shape shape in _shapes)
        {
            writer.WriteLine(shape.TypeName);
            shape.SaveTo(writer);
        }

        writer.Close();
    }

    public void Load(string filename)
    {
        StreamReader reader = new StreamReader(filename);

        reader.Close();
    }

    public static Shape CreateShape(string kind)
    {
        switch (kind)
        {
            case "Rectangle": return new MyRectangle();
            case "Circle": return new MyCircle();
            default: throw new InvalidDataException("Unknown shape kind: '" + kind + "'.");
        }
    }
}`,
            editable: { from: 35, to: 37 },
            tests: [
              {
                kind: 'output',
                label: 'A saved two-shape drawing reloads with its background, count, kinds and fields intact',
                expect: '#ffffffff\n2\nCircle {{circleRadius}}\nRectangle {{shapeParam}}',
              },
              {
                kind: 'output',
                label: 'Loading twice does not double the shape count',
                expect: '#ffffffff\n2\nCircle {{circleRadius}}\nRectangle {{shapeParam}}',
              },
              {
                kind: 'forbid',
                label: 'The shape kinds come from the file\'s tags, not from a fixed order',
                // Only an *assignment* is forbidden. The seed's own CreateShape
                // returns `new MyRectangle();` directly, and forbid checks run
                // against the whole source — so matching every `new` at all
                // would make the step unpassable.
                pattern: '=\\s*new My(Circle|Rectangle|Line)\\s*\\(',
                message:
                  'Let CreateShape build the shapes from the tag you read. Hard-coding the kinds here works on this one file and nothing else.',
              },
            ],
            harness: `public abstract class Shape
{
    private Color _color;
    private float _x;
    private float _y;

    public Shape(Color color) { _color = color; }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }

    public abstract string TypeName { get; }
    public abstract string Describe();

    public virtual void SaveTo(StreamWriter writer)
    {
        writer.WriteLine(SplashKit.ColorToString(Color));
        writer.WriteLine(X);
        writer.WriteLine(Y);
    }

    public virtual void LoadFrom(StreamReader reader)
    {
        Color = SplashKit.StringToColor(ReadLine(reader));
        X = Convert.ToSingle(ReadLine(reader));
        Y = Convert.ToSingle(ReadLine(reader));
    }

    public static string ReadLine(StreamReader reader)
    {
        string line = reader.ReadLine();
        if (line == null) { return ""; }
        return line;
    }
}

public class MyCircle : Shape
{
    private int _radius;

    public MyCircle(int radius) : base(Color.Blue) { _radius = radius; }
    public MyCircle() : this({{circleRadius}}) { }

    public override string TypeName { get { return "Circle"; } }
    public override string Describe() { return "Circle " + _radius; }

    public override void SaveTo(StreamWriter writer)
    {
        base.SaveTo(writer);
        writer.WriteLine(_radius);
    }

    public override void LoadFrom(StreamReader reader)
    {
        base.LoadFrom(reader);
        _radius = Convert.ToInt32(ReadLine(reader));
    }
}

public class MyRectangle : Shape
{
    private int _width;
    private int _height;

    public MyRectangle(int width, int height) : base(Color.Green) { _width = width; _height = height; }
    public MyRectangle() : this({{shapeParam}}, {{shapeParam}}) { }

    public override string TypeName { get { return "Rectangle"; } }
    public override string Describe() { return "Rectangle " + _width; }

    public override void SaveTo(StreamWriter writer)
    {
        base.SaveTo(writer);
        writer.WriteLine(_width);
        writer.WriteLine(_height);
    }

    public override void LoadFrom(StreamReader reader)
    {
        base.LoadFrom(reader);
        _width = Convert.ToInt32(ReadLine(reader));
        _height = Convert.ToInt32(ReadLine(reader));
    }
}

public class __Check
{
    public static void Main()
    {
        Drawing original = new Drawing(Color.White);
        original.AddShape(new MyCircle());
        original.AddShape(new MyRectangle());
        original.Save("drawing.txt");

        Drawing reloaded = new Drawing(Color.Black);
        reloaded.Load("drawing.txt");
        reloaded.Load("drawing.txt");

        Console.WriteLine(SplashKit.ColorToString(reloaded.Background));
        Console.WriteLine(reloaded.ShapeCount);

        foreach (Shape s in reloaded.Shapes)
        {
            Console.WriteLine(s.Describe());
        }
    }
}`,
            hints: [
              'Four things before the loop: read the background, read the count, clear the list, then loop that many times.',
              'Each pass is three statements — read the tag, `CreateShape(kind)`, then `shape.LoadFrom(reader)` — and then add it to the list.',
              'Use `Shape.ReadLine(reader)` for every line, and `Convert.ToInt32` for the count. Do not forget `_shapes.Clear()`.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w7-71-parsons',
          title: 'The load loop, in order',
          blocks: [
            {
              t: 'text',
              md: `One last pass over the order, without the typing. Every line below is needed exactly once.`,
            },
            {
              t: 'parsons',
              caption: 'Drawing.cs',
              prompt: 'Reassemble Drawing.Load.',
              lines: [
                'public class Drawing',
                '{',
                '    public void Load(string filename)',
                '    {',
                '        StreamReader reader = new StreamReader(filename);',
                '        _background = SplashKit.StringToColor(Shape.ReadLine(reader));',
                '        int count = Convert.ToInt32(Shape.ReadLine(reader));',
                '        _shapes.Clear();',
                '        for (int i = 0; i < count; i++)',
                '        {',
                '            string kind = Shape.ReadLine(reader);',
                '            Shape shape = CreateShape(kind);',
                '            shape.LoadFrom(reader);',
                '            _shapes.Add(shape);',
                '        }',
                '        reader.Close();',
                '    }',
                '}',
              ],
              explain:
                'The header is read once, outside the loop; the tag is read inside it, once per shape. `CreateShape` has to come before `LoadFrom` — there is no object to load into until it returns — and `Clear` has to come before the loop, or a second load doubles the drawing.',
            },
          ],
        },
        {
          id: 'w7-71-recall',
          title: 'Before your lab',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Your tutor asks how saving and loading works in your program. Answer without looking: what is in the file, in what order, and which class writes each part?',
              points: [
                'Line 1 is the background colour, line 2 is the shape count — both written by Drawing.Save',
                'Then, per shape: a type tag from TypeName, followed by that shape\'s fields',
                'Shape.SaveTo writes the four fields every shape has; each subclass overrides it, calls base first, then writes its own',
                'LoadFrom mirrors SaveTo exactly, because a text file carries no field names — only order',
                'Load reads the tag, CreateShape turns it into an object, then that object reads its own fields',
                'CreateShape throws InvalidDataException on an unknown tag rather than guessing',
                '_shapes.Clear() before the loop, so loading replaces the drawing instead of appending to it',
              ],
              nudge:
                'Walk the file from the top. For each line, ask which method wrote it — that is the whole design.',
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'What carries over to Task 8.2',
              md: 'The pattern, unchanged: a `virtual SaveTo`/`LoadFrom` on the base class writing the shared fields, an override per subclass calling `base` first. Next week it is `GameObject` and `Player` instead of `Shape` and `MyCircle`, and the file is three lines instead of sixty — but it is the same two methods and the same rule about order.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 6
    {
      id: 'w7-player-design',
      title: 'Designing next week\'s Player',
      kind: 'concept',
      minutes: 15,
      summary:
        'The design half of the lecture\'s live-coded walkthrough: what Locate returns, who it asks, and why Fetch exists beside HasItem and Take.',
      steps: [
        {
          id: 'w7-pd-why',
          title: 'What you are about to build',
          blocks: [
            {
              t: 'callout',
              tone: 'note',
              title: 'There is no Task 7 — this is preparation for Task 8.1 and 8.2',
              md: 'Week 7 has no lab sheet of its own. What the lecture spends its middle third on is a walkthrough of **Task 8.1/8.2**, which are due before your Week 8 lab and are worth **2% each**. This lesson does the design; Week 8 opens the editor.',
            },
            {
              t: 'text',
              md: `Iteration 5 of SwinAdventure adds a \`Player\`. Everything it needs already exists — \`IdentifiableObject\` from Week 3, \`GameObject\` and \`Item\` from Week 4, \`Inventory\` from Week 4's Task 4.2. The new class is mostly a matter of wiring those together correctly, which is exactly the kind of task where a wrong design decision costs an hour and a right one costs nothing.`,
            },
            {
              t: 'umlSpec',
              caption: 'SwinAdventure, Iteration 5',
              source: `public class IdentifiableObject
{
    private List<string> _identifiers;
    public bool AreYou(string id) { return false; }
    public string FirstID() { return ""; }
}

public abstract class GameObject : IdentifiableObject
{
    private string _name;
    private string _description;
    public string Name { get { return _name; } }
    public string ShortDescription { get { return _name; } }
    public virtual string FullDescription { get { return _description; } }
}

public class Item : GameObject
{
}

public class Inventory
{
    private List<Item> _items;
    public bool HasItem(string id) { return false; }
    public void Put(Item itm) { }
    public Item Take(string id) { return null; }
    public Item Fetch(string id) { return null; }
    public string ItemList { get { return ""; } }
}

public class Player : GameObject
{
    private Inventory _inventory;
    public Inventory Inventory { get { return _inventory; } }
    public GameObject Locate(string id) { return null; }
}`,
            },
          ],
        },
        {
          id: 'w7-pd-relationships',
          title: 'Association or aggregation?',
          blocks: [
            {
              t: 'text',
              md: `Two lines on that diagram, and the lecture is careful about the difference between them.

\`Player\` has exactly **one** \`Inventory\`. One object, held permanently — that is an **association**.

\`Inventory\` holds **many** \`Item\`s, in a list, and is in every meaningful sense a container for them — that is an **aggregation**, drawn with the open diamond.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'The course\'s rule of thumb',
              md: 'One-to-one, held permanently → **association**. One-to-many, where the holder\'s job is to be a container → **aggregation**. The open diamond specifically says the parts can outlive the container, which is true of items: drop a torch and it is still a torch.',
            },
            {
              t: 'quiz',
              question: 'Why is `Player` → `Inventory` an association rather than an aggregation?',
              options: [
                'Because a Player holds a single Inventory, not a collection of them',
                'Because Inventory is not a kind of Player',
                'Because the Inventory is created inside the Player constructor',
                'Because Inventory has no identifiers of its own',
              ],
              answer: 0,
              why: [
                '',
                'True, but irrelevant — that is about inheritance, which neither of these relationships is.',
                'Where an object is created does not decide the notation. A container relationship stays a container relationship however the parts arrive.',
                'Identifiers have nothing to do with which line you draw.',
              ],
              explain:
                'Aggregation in this unit means "container of many". A single held object is a plain association, drawn as a solid line with no diamond. Getting this right matters because the Iteration 5 diagram is part of what your tutor checks in the verification interview.',
            },
          ],
        },
        {
          id: 'w7-pd-locate',
          title: 'Why Locate returns a GameObject',
          blocks: [
            {
              t: 'text',
              md: `\`Locate(string id)\` answers "is there something around me called this?". There are two possible somethings: **the player themselves** (they answer to \`"me"\` and \`"inventory"\`), or **an item in their inventory**.

So the method has to be able to return either a \`Player\` or an \`Item\`. It declares its return type as **\`GameObject\`** — the nearest common ancestor — and polymorphism takes care of the rest.`,
            },
            {
              t: 'code',
              caption: 'The shape of it',
              code: `public GameObject Locate(string id)
{
    if (AreYou(id))
    {
        return this;
    }

    return _inventory.Fetch(id);
}`,
            },
            {
              t: 'runnable',
              caption: 'One method, three different answers — run it and watch the types',
              tool: 'console',
              code: `public class IdentifiableObject
{
    private List<string> _identifiers = new List<string>();

    public IdentifiableObject(string[] ids)
    {
        foreach (string id in ids) { _identifiers.Add(id); }
    }

    public bool AreYou(string id) { return _identifiers.Contains(id); }
    public string FirstID() { return _identifiers[0]; }
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
}

public class Item : GameObject
{
    public Item(string[] ids, string name, string description) : base(ids, name, description) { }
}

public class Inventory
{
    private List<Item> _items = new List<Item>();

    public void Put(Item itm) { _items.Add(itm); }

    public Item Fetch(string id)
    {
        foreach (Item i in _items) { if (i.AreYou(id)) { return i; } }
        return null;
    }

    public int Count { get { return _items.Count; } }
}

public class Player : GameObject
{
    private Inventory _inventory = new Inventory();

    public Player(string name, string desc) : base(new string[] { "me", "inventory" }, name, desc) { }

    public Inventory Inventory { get { return _inventory; } }

    public GameObject Locate(string id)
    {
        if (AreYou(id)) { return this; }
        return _inventory.Fetch(id);
    }
}

public class Program
{
    public static void Main()
    {
        Player p = new Player("Robin", "a cautious adventurer");
        p.Inventory.Put(new Item(new string[] { "torch" }, "a brass torch", "It flickers."));

        GameObject me = p.Locate("me");
        GameObject torch = p.Locate("torch");
        GameObject club = p.Locate("club");

        Console.WriteLine("locate me     -> " + me.Name);
        Console.WriteLine("locate torch  -> " + torch.Name);
        Console.WriteLine("locate club   -> " + (club == null));
        Console.WriteLine("still holding -> " + p.Inventory.Count);
    }
}`,
            },
            {
              t: 'quiz',
              question: 'Why is the return type `GameObject` rather than `Item`?',
              options: [
                'Because Locate can return the player themselves, and a Player is not an Item',
                'Because Item is abstract and cannot be returned',
                'Because GameObject is faster to return than Item',
                'Because the inventory stores GameObjects rather than Items',
              ],
              answer: 0,
              why: [
                '',
                '`Item` is a perfectly ordinary concrete class — it is `GameObject` that is abstract.',
                'Return types have no speed. They are a compile-time contract about what a caller may assume.',
                '`Inventory` really does hold a `List<Item>`. The wider return type is about the *other* possible answer, not about the list.',
              ],
              explain:
                'One method signature, two kinds of answer. `Player` and `Item` are both `GameObject`s, so `GameObject` is the type that can describe either. This is subtype polymorphism used for its most ordinary purpose: saying "one of these" without saying which.',
            },
            {
              t: 'quiz',
              question: 'What should `Locate` return when nothing matches?',
              options: [
                'null',
                'A new empty GameObject',
                'The player, since the player is always present',
                'An empty string',
              ],
              answer: 0,
              why: [
                '',
                'A blank object would be indistinguishable from a real result, and every caller would then need a second test to tell them apart.',
                'That would make "is there a club here?" answer "yes, you" — which is wrong, and would break the test that checks for nothing being found.',
                'The method returns a `GameObject`. A string is not one, and would not compile.',
              ],
              explain:
                'The sequence diagram in Lab8.pdf is explicit: when no item matches, `Fetch` returns null and `Locate` passes that null straight out. Callers test for null. That is the same convention `Inventory.Fetch` and `Take` already use from Week 4.',
            },
          ],
        },
        {
          id: 'w7-pd-fetch',
          title: 'HasItem, Fetch and Take are three different questions',
          blocks: [
            {
              t: 'text',
              md: `\`Inventory\` has three lookup-ish methods and students routinely collapse them into one. The lecture separates them by **responsibility**, which is the RDD habit applied at the level of a single class.`,
            },
            {
              t: 'table',
              caption: 'Three methods, three jobs',
              headers: ['Method', 'Returns', 'Does it remove the item?', 'Used by'],
              rows: [
                ['`HasItem(id)`', '`bool`', 'No', 'A caller that only needs a yes or no'],
                ['`Fetch(id)`', 'the `Item`, or `null`', '**No**', '`Locate` — look at it without taking it'],
                ['`Take(id)`', 'the `Item`, or `null`', '**Yes**', 'Dropping or giving away an item'],
              ],
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Locate must use Fetch, not Take',
              md: 'If `Locate` used `Take`, then merely *looking* at your torch would remove it from your bag. One of Lab 8\'s five required tests exists specifically to catch this: it locates an item and then asserts the item is **still** in the inventory.',
            },
          ],
          exercise: {
            prompt:
              'Add Fetch to Inventory: return the matching item without removing it, or null if there is none.',
            seed: `public class Inventory
{
    private List<Item> _items = new List<Item>();

    public void Put(Item itm)
    {
        _items.Add(itm);
    }

    public bool HasItem(string id)
    {
        foreach (Item i in _items)
        {
            if (i.AreYou(id)) { return true; }
        }
        return false;
    }


    public int Count
    {
        get { return _items.Count; }
    }
}`,
            editable: { from: 18, to: 19 },
            tests: [
              {
                kind: 'structure',
                label: 'Fetch takes one parameter and returns an Item',
                rule: { on: 'method', inClass: 'Inventory', name: 'Fetch', params: 1, returns: 'Item' },
              },
              {
                kind: 'output',
                label: 'Fetch finds the torch, leaves it behind, and returns null for a club',
                expect: 'torch\n1\nnothing there',
              },
              {
                kind: 'forbid',
                label: 'Fetch does not remove anything',
                pattern: '_items\\.Remove',
                message:
                  'That is Take\'s job. Fetch looks without taking — one of Lab 8\'s tests checks the item is still there afterwards.',
              },
            ],
            harness: `public class Item
{
    private string _id;
    private string _name;
    public Item(string id, string name) { _id = id; _name = name; }
    public bool AreYou(string id) { return _id == id; }
    public string Name { get { return _name; } }
}

public class __Check
{
    public static void Main()
    {
        Inventory bag = new Inventory();
        bag.Put(new Item("torch", "torch"));

        Item found = bag.Fetch("torch");
        Console.WriteLine(found.Name);
        Console.WriteLine(bag.Count);

        Item missing = bag.Fetch("club");
        if (missing == null) { Console.WriteLine("nothing there"); }
    }
}`,
            hints: [
              'It is shaped exactly like `HasItem`, except for what it hands back when the match is found.',
              'Loop the items, ask each one `AreYou(id)`, and return the first that says yes — the item itself, not `true`.',
              'Fall out of the loop and `return null;` — that is what "nothing matched" looks like to a caller.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w7-pd-parsons',
          title: 'Assemble Locate',
          blocks: [
            {
              t: 'text',
              md: `The whole method, in pieces. Order matters in one specific way: the player has to check **itself** before it asks its inventory, or a bag containing something called \`"me"\` would answer for the player.`,
            },
            {
              t: 'parsons',
              prompt: 'Put Player.Locate back together.',
              lines: [
                'public class Player : GameObject',
                '{',
                '    private Inventory _inventory;',
                '    public GameObject Locate(string id)',
                '    {',
                '        if (AreYou(id))',
                '        {',
                '            return this;',
                '        }',
                '        return _inventory.Fetch(id);',
                '    }',
                '}',
              ],
              explain:
                '`AreYou` is inherited all the way from `IdentifiableObject`, so `Player` gets the self-check for free. The early `return this;` is what makes "me" and "inventory" resolve to the player. Everything after it is the delegation to the inventory, and `Fetch` is deliberate — see the previous step.',
            },
          ],
        },
        {
          id: 'w7-pd-recall',
          title: 'In your own words',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Your tutor asks: "walk me through what happens when a player is asked to locate a sword that is in their bag." Describe the sequence, naming each object and each method.',
              nudge:
                'There are two objects involved, and the player asks itself a question before it asks anything else.',
              points: [
                'The caller invokes `Locate("sword")` on the `Player`',
                'The player first asks itself `AreYou("sword")`, inherited from `IdentifiableObject`',
                'That answers false, since the player only answers to "me" and "inventory"',
                'The player then delegates to `_inventory.Fetch("sword")`',
                '`Fetch` loops its items, calling `AreYou` on each, and returns the first match',
                'The item comes back as a `GameObject`, and it is **still in the inventory** because Fetch does not remove',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 7
    /*
     * The week's own test — same shape as w2..w6's checkpoints. Week 7 is
     * unusual in having no lab to check understanding against, so this one
     * carries more of the weight than earlier checkpoints do, and its last step
     * is deliberately a design question rather than a syntax one.
     */
    {
      id: 'w7-checkpoint',
      title: 'Week 7 checkpoint',
      kind: 'quiz',
      minutes: 20,
      summary:
        'Overloading, scope, error reading and design — under the conditions your tutor will ask about them.',
      steps: [
        {
          id: 'w7-cp-warmup',
          title: 'From memory first',
          blocks: [
            {
              t: 'text',
              md: 'Two sentences, written before you see any options. The interview does not offer you four choices.',
            },
            {
              t: 'recall',
              prompt:
                'What exactly is a method signature, and what is the difference between a duplicate variable declaration and shadowing?',
              nudge:
                'One of these is about what the compiler compares. The other is about how many scopes are involved.',
              points: [
                'A signature is the name plus the number, order and types of the parameters',
                'Return type and parameter names are excluded from it',
                'A duplicate declaration is two variables of one name in **one** scope — a compile error',
                'Shadowing is one name in **two** scopes, which is legal',
                'When shadowing, the nearer declaration wins inside the inner scope',
              ],
            },
          ],
        },
        {
          id: 'w7-cp-overload',
          title: 'Is it an overload?',
          blocks: [
            {
              t: 'quiz',
              question:
                'Which of these pairs is a **valid** overload of `Log`?',
              options: [
                '`void Log(string m)` and `void Log(string m, int level)`',
                '`void Log(string m)` and `string Log(string m)`',
                '`void Log(string message)` and `void Log(string text)`',
                '`void Log(string m)` and `void Log(string m)` in the same class',
              ],
              answer: 0,
              why: [
                '',
                'Only the return type differs, and the return type is not part of the signature.',
                'Only the parameter name differs, and parameter names are not part of the signature either.',
                'These are identical in every respect. Not an overload — not even a near miss.',
              ],
              explain:
                'Different parameter *counts* make different signatures, so the first pair is fine. Everything else here changes something the compiler does not look at.',
            },
            {
              t: 'quiz',
              question:
                'Two overloads exist: `Area(int side)` and `Area(int w, int h)`. Where should the shared logic live?',
              options: [
                'In the two-parameter version, with the one-parameter version calling it',
                'Duplicated in both, so neither depends on the other',
                'In a third private method that both call, always',
                'In the one-parameter version, with the two-parameter version calling it',
              ],
              answer: 0,
              why: [
                '',
                'Duplication is exactly what overloads are supposed to avoid. Two copies of a rule drift apart the first time one is edited.',
                'Sometimes reasonable, but unnecessary here — the general case already *is* the shared logic, so a third method just adds a hop.',
                'The one-parameter version has less information. It cannot compute the general case; it can only supply a default and hand over.',
              ],
              explain:
                'The overload with the **most** information does the work; the shorter ones fill in defaults and delegate to it. `Area(int side)` calls `Area(side, side)` and is one line long.',
            },
          ],
        },
        {
          id: 'w7-cp-scope',
          title: 'Trace the scope',
          blocks: [
            {
              t: 'predict',
              question: 'What is printed?',
              code: `public class Tally
{
    private int _total = 100;

    public void Add(int amount)
    {
        int _total = amount;
        _total = _total + 1;
    }

    public int Total
    {
        get { return _total; }
    }
}

public class Program
{
    public static void Main()
    {
        Tally t = new Tally();
        t.Add(5);
        Console.WriteLine(t.Total);
    }
}`,
              options: ['100', '106', '6', '105'],
              answer: 0,
              why: [
                '',
                'Nothing adds the parameter to the field. The local swallows both reads and both writes.',
                'That is the value the *local* `_total` ends on, just before the method returns and discards it.',
                'This would be the answer if `Add` did `this._total = this._total + amount;`, which it does not.',
              ],
              explain:
                'The local `int _total = amount;` shadows the field for the rest of the method. Both statements after it operate entirely on the local, which is thrown away when `Add` returns. The field never changes, so `Total` still reports 100.',
              expect: { output: '100' },
            },
          ],
        },
        {
          id: 'w7-cp-errors',
          title: 'Name the exception',
          blocks: [
            {
              t: 'quiz',
              question:
                'A method takes a `List<Item>` parameter and crashes on `items.Count`. The list was declared in the caller but never assigned. Which exception, and where is the bug?',
              options: [
                'NullReferenceException, and the bug is in the caller, which never created the list',
                'IndexOutOfRangeException, and the bug is in the method, which reads past the end',
                'NullReferenceException, and the bug is in the method, which should check for null first',
                'No exception — Count on an unassigned list returns 0',
              ],
              answer: 0,
              why: [
                '',
                'Nothing is being indexed. `Count` just asks the list how many elements it has, and the problem is that there is no list to ask.',
                'A null check in the method would stop the crash and leave the real defect — a caller that forgot `new` — in place, now silent.',
                'An unassigned reference is `null`, and `null` has no `Count`. There is no default empty list.',
              ],
              explain:
                'Straight from the lecture\'s worked example. The exception surfaces in the callee and originates in the caller, which is why you read the stack trace outwards rather than fixing the first line it names.',
            },
            {
              t: 'quiz',
              question:
                'For an array of length 5, which of these indexes is out of bounds?',
              options: ['5', '4', '0', '3'],
              answer: 0,
              why: [
                '',
                '4 is the **last** valid index for a five-element array — `Length - 1`.',
                '0 is the first valid index. Arrays in C# are zero-based.',
                '3 is comfortably inside a five-element array.',
              ],
              explain:
                'Valid indexes are `0` to `Length - 1`, so 0 through 4. Index 5 is one past the end, which is precisely the value a `for` loop written with `<=` will reach.',
            },
          ],
        },
        {
          id: 'w7-cp-design',
          title: 'Design judgement',
          blocks: [
            {
              t: 'quiz',
              question:
                'A `Report` class holds report data, formats it as HTML, and emails it. Which design principle does this most clearly violate?',
              options: [
                'Cohesion — the class has three unrelated reasons to change',
                'Coupling — the class depends on too many other classes',
                'Inheritance — the class should derive from a base Report type',
                'Encapsulation — the data should be private',
              ],
              answer: 0,
              why: [
                '',
                'Coupling is about dependencies *between* classes. The problem here is inside one class, which is what cohesion measures.',
                'Nothing here suggests a missing base class. Splitting by responsibility is the fix, not a hierarchy.',
                'The data may well be private already. Visibility is not what is wrong.',
              ],
              explain:
                'Three responsibilities — hold data, render it, transmit it — means three separate reasons someone would edit this class, and three separate teams who might want to. Splitting them is the laziness rule, and it is the same split MVC makes.',
            },
            {
              t: 'quiz',
              question:
                'Which line do you draw from `Bag` to the many `Item`s it contains?',
              options: [
                'Aggregation — a solid line with an open diamond at the Bag end',
                'Composition — a solid line with a filled diamond at the Bag end',
                'Dependency — a dashed arrow from Bag to Item',
                'Inheritance — a solid line with a hollow triangle pointing at Item',
              ],
              answer: 0,
              why: [
                '',
                'Filled means the parts cannot survive the whole. Tip out a bag and the items are still items.',
                'A dependency is a passing use, not a container relationship that persists.',
                'A bag is not a kind of item in this diagram — that comes up in Week 8, and it is a separate relationship from this one.',
              ],
              explain:
                'Container of many, parts with independent lives: aggregation, open diamond. Keep this one in mind — Week 8 adds a second, different line between `Bag` and `Item`, and the two coexist.',
            },
          ],
        },
        {
          id: 'w7-cp-parsons',
          title: 'Assemble the delegating overload',
          blocks: [
            {
              t: 'parsons',
              prompt:
                'Rebuild a Logger with two Log overloads, where the short one fills in a default and delegates.',
              lines: [
                'public class Logger',
                '{',
                '    private string _prefix = "swinadventure";',
                '    public void Log(string message, string level)',
                '    {',
                '        Console.WriteLine(_prefix + " [" + level + "] " + message);',
                '    }',
                '    public void Log(string message) { Log(message, "INFO"); }',
                '}',
              ],
              explain:
                'The two-parameter version is the one that knows how to build a line. The one-parameter version supplies the default and hands over, so the format string exists exactly once.',
            },
          ],
        },
        {
          id: 'w7-cp-exam',
          title: 'Under interview conditions',
          blocks: [
            {
              t: 'callout',
              tone: 'key',
              title: 'What Week 7 is actually assessed by',
              md: 'There is no Task 7. Your Week 7 lab session is the **verification interview for Task 8.1 and 8.2** — you bring the code, and the marks come from explaining it. So the last thing to practise this week is talking, not typing.',
            },
            {
              t: 'recall',
              prompt:
                'Out loud, in under a minute each: (1) why `Locate` returns a `GameObject`; (2) why `Locate` calls `Fetch` and not `Take`; (3) why `Player` → `Inventory` is an association but `Inventory` → `Item` is an aggregation.',
              nudge:
                'Each answer is one reason plus one consequence. If you find yourself listing code, you are describing rather than explaining.',
              points: [
                '`Locate` can return either the player or an item, and `GameObject` is the type that covers both',
                'Returning the narrower `Item` would make it impossible to return the player at all',
                '`Fetch` looks without removing; `Take` removes, which would make looking at an item destroy it',
                'One of the five required tests asserts the item is still in the inventory after a locate',
                'Player holds exactly one Inventory, so it is a plain association — a solid line, no diamond',
                'Inventory is a container of many Items whose parts outlive it, so it is an aggregation with an open diamond',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 8
    {
      id: 'w7-interview',
      title: 'Interview drill',
      kind: 'interview',
      minutes: 10,
      summary:
        'Week 7 is examined by talking, not by submitting. Rehearse the answers before your tutor asks for them.',
      steps: [
        {
          id: 'w7-int-1',
          title: 'This week the interview is the assessment',
          blocks: [
            {
              t: 'callout',
              tone: 'key',
              md: 'Every other week, finishing the code caps you at 70% and the last 30% is explaining why. This week there is no Task 7 to finish — the whole of your Week 7 lab is the verification interview for **Task 8.1/8.2**, so the explaining is all of it.',
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Interview questions for Week 7.
 *
 * The last two are about Task 7.1 itself, because the lab session verifies it
 * by asking — and "why does base.SaveTo come first" is the question a student
 * who copied the pattern without understanding it cannot answer.
 */
export const week7Interview: InterviewQuestion[] = [
  {
    id: 'w7-q1',
    question:
      'You wrote two methods with the same name and the compiler rejected them. How do you decide whether two methods are a valid overload?',
    lookingFor: [
      'A signature is the method name plus the number, order and types of the parameters',
      'Return type is excluded, so `void Add(int,int)` and `int Add(int,int)` collide',
      'Parameter names are excluded, so renaming `message` to `msg` changes nothing',
      'To overload, something in the parameter list itself has to differ',
    ],
    aboutStep: 'w7-contract-return',
  },
  {
    id: 'w7-q2',
    question:
      'A field and a local variable share a name and the program compiles. Which one does the method see, and when is that a bug?',
    lookingFor: [
      'Inside the method, the nearer declaration wins — the local or parameter shadows the field',
      'It is legal C#, so the compiler gives no warning at all',
      'It becomes a bug when the method was meant to update the field and silently updates the local instead',
      '`this.` reaches the field explicitly, which is the usual fix',
    ],
    aboutStep: 'w7-scope-param-shadow',
  },
  {
    id: 'w7-q3',
    question:
      'A NullReferenceException is reported inside a class you are confident is correct. Talk me through finding the real cause.',
    lookingFor: [
      'The type of the exception already says what happened: something was used before it was created',
      'The reported line is where the symptom surfaced, not necessarily where the cause is',
      'Read the stack trace outwards until you reach code you wrote, then ask what it failed to allocate',
      'Adding a null guard in the inner class hides the defect rather than removing it',
      'Building and testing class by class keeps the candidate list short in the first place',
    ],
    aboutStep: 'w7-err-wrongline',
  },
  {
    id: 'w7-q4',
    question:
      'Your teammate wants one class that stores data, computes a discount and renders a page. What do you say?',
    lookingFor: [
      'It has three separate reasons to change, which is low cohesion',
      'Pricing logic belongs with whoever owns pricing policy, by the information-expert rule',
      'Rendering belongs on the view side — the same split MVC makes',
      'Splitting reduces coupling: a policy change then touches one class instead of every holder of the data',
    ],
    aboutStep: 'w7-rdd-cohesion',
  },
  {
    id: 'w7-q5',
    question:
      'Why does Player.Locate return a GameObject, and why does it call Fetch rather than Take?',
    lookingFor: [
      'Locate can answer with the player themselves or with an item, and GameObject covers both',
      'A narrower `Item` return type would make returning the player impossible',
      '`Fetch` returns the item without removing it; `Take` removes it',
      'Using `Take` would mean that looking at an item deletes it from the inventory',
      'One of Lab 8\'s five required tests asserts the item is still there after a locate',
    ],
    aboutStep: 'w7-pd-fetch',
  },
  {
    id: 'w7-q6',
    question:
      'On the Iteration 5 diagram, why is Player-to-Inventory drawn differently from Inventory-to-Item?',
    lookingFor: [
      'Player holds exactly one Inventory — a one-to-one link, so a plain association',
      'Inventory is a container of many Items, so an aggregation with an open diamond',
      'The open diamond specifically says the parts can outlive the container',
      'A filled diamond would be composition, which would wrongly say items die with the inventory',
    ],
    aboutStep: 'w7-pd-relationships',
  },
  {
    id: 'w7-q7',
    question:
      'In your save code, every override calls base.SaveTo before writing its own fields. Why that order, and what breaks if one of them does it the other way round?',
    lookingFor: [
      'It fixes the position of the four shared fields — every shape\'s block starts the same way',
      'LoadFrom can therefore read the shared fields without yet knowing which kind it is reading',
      'SaveTo and LoadFrom have to agree on order, because a text file carries no field names',
      'Reversing it in one subclass breaks only that kind — the rest of the file still loads, so it looks like a data problem rather than a code one',
      'Nothing throws: the values are all valid, just read into the wrong fields',
    ],
    aboutStep: 'w7-71-saveto',
  },
  {
    id: 'w7-q8',
    question:
      'Drawing.Save asks each shape for its TypeName, but CreateShape switches on a string. Why is a switch acceptable in one and not the other?',
    lookingFor: [
      'Save has a Shape object in hand, so it can ask it — the object already knows what it is',
      'CreateShape has only text read from a file; there is no object to ask yet',
      'Turning text into a type is the one direction polymorphism cannot do for you',
      'Once CreateShape returns, everything afterwards goes through the hierarchy again',
      'The default case throws InvalidDataException rather than guessing a kind',
    ],
    aboutStep: 'w7-71-factory',
  },
];
