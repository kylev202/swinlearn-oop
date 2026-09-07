# SwinLearn OOP — COS20007

A learning app for Swinburne's Object-Oriented Programming unit, as a desktop
application or a static site. The lecture and the lab are one thing: every
concept arrives with code you can run, a diagram drawn from what you actually
wrote, and checks that say what is missing without handing over the answer.

```bash
npm install
npm run dev            # the site, at http://localhost:5173
npm run dev:desktop    # the same thing in the desktop shell, with hot reload
npm test               # 85 tests
npm run build          # static output in dist/
npm run desktop:build  # Windows installer + portable exe in release/
```

The web build deploys as static files to GitHub Pages, Netlify, Vercel or
Canvas. The desktop build is the same renderer in an Electron shell, and exists
for one reason: a browser's localStorage is not somewhere to keep a semester of
work.

---

## The desktop app

| Command | What it does |
|---|---|
| `npm run dev:desktop` | Vite dev server inside the Electron window; edits hot-reload |
| `npm run desktop:start` | The built app in the real shell — what a student will see |
| `npm run desktop:pack` | Unpacked app in `release/win-unpacked/`, no installer |
| `npm run desktop:build` | `SwinLearn OOP <version>.exe` (NSIS installer) and a portable exe |
| `npm run icons` | Redraws `build/icon.ico` and `build/icon.png` from `scripts/make-icon.mjs` |

### Where the work lives

Everything a student does — their code on every step, completed steps, quiz
answers, hints they have spent, their profile, their last position — is one JSON
file:

| | |
|---|---|
| Windows | `%APPDATA%\SwinLearn OOP\data\progress.json` |
| macOS | `~/Library/Application Support/SwinLearn OOP/data/progress.json` |
| Linux | `~/.config/SwinLearn OOP/data/progress.json` |

`desktop/store.cjs` guarantees three things about that file:

1. **Writes are atomic.** New contents go to a temp file which is then renamed
   over the real one, so a crash mid-write leaves the whole old file or the
   whole new one — never a half-written mixture.
2. **The last good copy is kept**, as `progress.backup.json`.
3. **A corrupt file is never silently dropped.** It is moved aside with a
   timestamp and the backup is promoted, so a student who has lost a week of
   work still has the evidence.

The uninstaller leaves the data folder alone.

Typing in the editor updates state on every keystroke, so the renderer hands
state to the main process and *the main process* debounces the disk write —
the editor never waits on the filesystem, and the last edit of a session is
flushed when the window closes.

### Moving between machines

**File → Export progress** (`Ctrl+Shift+E`) writes the whole store to a file the
student picks; **Import progress** (`Ctrl+Shift+I`) reads one back. Both are in
the command palette too, and in the sidebar footer under "Your work is saved".
There is no account and nothing is uploaded — that file is the only way work
moves, which is also the honest thing to tell a student before they rely on it.

### Shell details

- The title bar is the app's own topbar; Windows and Linux draw the window
  buttons over it, macOS keeps its traffic lights. Colours follow the in-app
  theme, because only the main process can set them.
- Window size, position and maximised state are remembered.
- Links to real documentation open in the student's browser; the window itself
  cannot navigate away from the app.
- The renderer is sandboxed with `contextIsolation` on. It gets a named list of
  things it may ask for (`desktop/preload.cjs`) and no Node access — no path
  from the renderer ever reaches the filesystem, and the export location comes
  from an OS dialog.

> **If the window never appears and you get a stack trace about `ipcMain`:**
> something in your environment exports `ELECTRON_RUN_AS_NODE=1` — VS Code's
> integrated terminal does. Both npm scripts strip it before launching; a bare
> `electron desktop/main.cjs` does not.

---

## Why it is built this way

The unit's lab PDFs are eight pages of prose that interleave theory, UML, C#
syntax rules and instructions inside single numbered steps. Students hit them
before they have the concepts, and the personalised requirements ("the last four
digits of your student ID") are buried in sentences.

Three decisions follow from that:

**1. Two-minute steps.** Borrowed from freeCodeCamp: each step teaches exactly
one idea and should be finishable in about two minutes. Lab 2.1 becomes eleven
steps instead of fifteen mixed-purpose ones.

**2. The tools do the explaining.** Rather than describing the stack and the
heap, the site draws them from the student's own run. Rather than asking them to
draw a UML diagram in Draw.io, it generates one from their code.

**3. No solutions, ever.** The labs are assessed at 2% each and defended in a
tutor interview. Checks report what is missing; hints escalate from a nudge to a
structural description but never contain the answer. There is no reveal button.
`src/content/__tests__/week2.test.ts` asserts this — hints are pattern-checked
against the code they must not contain.

---

## The C# engine

A C# interpreter written in TypeScript (`src/engine/`), covering the subset
weeks 1–12 need: classes, fields, properties, constructors with `: this()` and
`: base()`, inheritance, `virtual`/`override`/`abstract`, interfaces, `List<T>`,
`Dictionary<K,V>`, arrays, exceptions, and generics-lite.

It is a tree-walking interpreter where **every eval function is a generator**.
That single decision is what makes the teaching tools possible:

| File | Role |
|---|---|
| `lexer.ts` | Tokens with 1-based line/col |
| `parser.ts` | Recursive descent with backtracking for C#'s three ambiguous spots |
| `values.ts` | Value/heap model — value types on the stack, reference types on the heap |
| `interpreter.ts` | Generator-based evaluator; yields a `Tick` before each unit of work |
| `builtins.ts` | Console, Math, string, collections, and an NUnit shim |
| `splashkit.ts` | SplashKit on an HTML canvas |
| `runner.ts` | Drives the generator; produces snapshots, call traces, test results |
| `checks.ts` | Evaluates a step's checks and writes the failure messages |

Because the driver holds the generator, one implementation gives:

- **Step-through debugging and time travel** — snapshot stack + heap per tick
- **A live SplashKit game loop** — `RefreshScreen()` yields, the driver resumes
  on `requestAnimationFrame`, so ShapeDrawer is genuinely interactive
- **Infinite-loop protection** — the budget lives in the driver, so a runaway
  loop reports *"is there a loop that never ends?"* instead of hanging the tab
- **Full stack/heap visibility** at any moment

Draining the generator in a tight loop is the fast path for running tests.

### Fidelity where it is assessed

The interpreter is deliberately correct on the things the unit examines:

- `int` arithmetic **wraps at 32 bits** in an unchecked context, because Lab 2.1
  step 13 asks students to explain exactly that
- `7 / 2` is `3`; `7.0 / 2` is `3.5`
- `bool` prints as `True`/`False`, .NET style
- Strings are heap-allocated and interned, so the memory diagram tells the truth
  that Quiz 3 Q3 tests
- Private fields are genuinely inaccessible from outside — encapsulation is
  enforced, not described
- `base.Property` dispatches **non-virtually** (a virtual re-resolve would
  recurse forever)
- C#'s "Color Color" rule works, because Lab 4.1's UML requires
  `public Color Color { get; set; }` on `Shape`

### Error messages are teaching material

```
The name 'Total' does not exist here.
  → Did you mean 'total'? C# is case-sensitive.

'Go' is a method — did you forget the parentheses?
  → Write Go() to call it.

'GameObject' is abstract, so it cannot be created directly.
  → That is the point of 'abstract': GameObject describes what its children
    share, but is never a real object itself. Create one of its subclasses.

Your program ran for too long, so I stopped it.
  → This almost always means a loop never reaches its stopping condition.
```

---

## The editor

The workbench is laid out like the IDE the students move to next: a file tab, a
breadcrumb, the editor, a resizable results panel, a status bar. The parts that
matter are not chrome:

- **Completion is not a keyword list.** It re-runs the unit's own parser on
  every pause and offers the classes, fields, properties and locals the student
  actually wrote. After a dot, the declared type of the receiver decides the
  list — and a `private` member is not offered from outside, because the
  interpreter would refuse it anyway.
- **Squiggles carry the teaching hint.** The linter and the last run both feed
  the same gutter, so *"Did you mean 'total'? C# is case-sensitive"* lands on
  the line that caused it.
- **Semantic colouring.** The grammar is Java's, which tags a class name and a
  local variable identically as one `Definition`. The symbol index knows the
  difference, so type names and call targets are coloured from the student's
  declarations by a decoration overlay — which also covers the dozen keywords
  C# has and Java does not.
- **Hovers** show a declaration signature; the **breadcrumb** answers "which
  method am I in?" without folding.

`Ctrl/Cmd+Enter` runs, `Ctrl/Cmd+K` opens a command palette over every lesson
and step, `Alt+←/→` changes step, and both dividers drag (and remember where
they were put).

---

## Concept lessons

A lab step has a built-in reason to engage: the checks are red until you write
the code. A concept step has none, and the failure mode is a student who scrolls
to the bottom, presses **Mark as read**, and arrives at Task 2.1 having absorbed
nothing. Three block types exist to close that gap, and they share one rule:
**the page does not hand anything over until the student has committed.**

| Block | What it asks for | Why it is here |
|---|---|---|
| **predict** | Commit to what a program prints *before* it runs | A demo you scroll past teaches nothing. The same demo teaches a lot once you have been wrong about it — so there is no Run button until a prediction is on the record, and the result is shown next to what you said |
| **parsons** | Put scrambled lines into the right order | Ordering code exercises the same mental model as writing it without the syntax tax, which is what a concept lesson wants — it proves you know what a constructor is for without also loading the editor |
| **recall** | Write the explanation from memory, then mark it yourself against a checklist | The lab mark is decided in an interview. Recognising the right answer in a list of four is not that drill; producing it from a blank page is |

The `quiz` block also carries per-option feedback (`why[]`), because a student
who picked C needs to know what C *would* have been true of, not only that it
was not B.

**A concept step is finished when its questions are answered**, not when it has
been scrolled past. `Mark as read` only appears on steps that ask nothing; the
rest tick themselves off, and the step footer says how many are still open.

### Predict blocks cannot drift from reality

The worst bug this repo could ship is a predict block that claims a program
prints one thing while the engine prints another: the student commits, is told
they were wrong, and is taught something false. So every predict block declares
what really happens —

```ts
expect: { output: 'True\nFalse\nTrue' }      // or { errorContains: 'read-only' }
```

— and `week2.test.ts` runs the code through the interpreter and asserts it. The
same test checks that no *wrong* option is accidentally the real output, and
that a right option written as program output is exactly the program's output.
Parsons puzzles are parsed, so the solved order is real C#, and their scramble
(derived from the lines, not randomised) is asserted never to open solved.

---

## Concept focus — preparing for the midterm

The lessons teach a week at a time, in order, with an editor open. The Week 6
midterm is the opposite shape: **10 multiple-choice questions, 20 minutes,
closed book, drawn from anywhere in Weeks 1&ndash;5.** Preparing for it is not
"do the lessons again" &mdash; it is finding the handful of ideas you are still
shaky on and fixing those. So Concept Focus is a separate mode, indexed by
**concept** rather than by week.

| Screen | What it is for |
|---|---|
| **Readiness board** | 34 concept tiles across five weeks, coloured by mastery, plus a single *do this next* recommendation. One instruction, not a menu &mdash; a student four days out does not need options |
| **Revision notes** | Condensed notes for each week, rendered with the same blocks the lessons use, so a comparison table looks identical to where it was first taught |
| **Weekly quiz** | Three lengths of sitting &mdash; one question per concept, three per concept, or the whole week. Immediate feedback, because a correction only lands while the reasoning is still in mind |
| **Mock paper** | Ten questions, a clock that does not pause, no feedback until you submit, and a marked paper with a per-week breakdown afterwards |

The bank behind all of this holds **353 questions** across the five weeks
(66&ndash;81 per week, at least six on every concept). It is deep enough that
the length of a sitting becomes the student's choice rather than the bank's,
and that re-sitting a week asks genuinely different questions: the draw is
seeded on how much of the week has already been attempted, and it round-robins
over concepts so every sitting covers the whole week before repeating an idea.

### The rule the mode turns on

**A wrong answer opens a fix-up against the concept it tested, and the fix-up
closes only when the student has (a) read the revision note for that concept
and (b) answered two further questions on it correctly.**

Both halves are deliberate. Without the reading requirement a student clears a
fix-up by guessing again until it lands, which teaches nothing. Without the
two-correct requirement, reading is enough &mdash; and reading something is not
evidence you understood it. Progress stays visible while the note is unread
(the streak counts up), so the requirement reads as a gate rather than a
punishment. A fresh miss reopens the gate even mid-streak: right, then wrong
again, is not evidence either.

Questions missed **on a mock paper** open fix-ups exactly like questions missed
in a drill. Questions left **blank** do not &mdash; running out of time is a
pacing problem, and filling the board with red the student cannot act on would
bury the mistakes that matter.

### What the mode refuses to do

- **It does not adapt the mock paper.** A practice paper that quietly asks only
  what you are bad at is useless as a score you can trust, and trusting the
  score is the whole point of sitting one. Every paper is two questions per
  week, with at least two harder than a revision-quiz question &mdash; the
  lecturer's own estimate of the real paper.
- **It does not show the concept name during a live paper.** "ENCAPSULATION"
  above the question narrows four options to one, and the real paper gives no
  such hint. The label appears only once the answer is out.
- **It does not re-ask the question you just had explained to you.** A fix-up
  draws unseen questions first, and every concept carries at least three &mdash;
  in practice six to twelve &mdash; so it never has to fall back.

Question lists are captured when a drill opens, not derived on each render.
Both derivations read the answers so far &mdash; a fix-up sorts by least
recently attempted, a weekly quiz seeds on how much of the week has been tried
&mdash; so deriving them live would reshuffle the list the instant an answer
landed, and question 2 would become a different question between reading it and
pressing Next.

## The tools

| Tool | What it does | Where it earns its keep |
|---|---|---|
| **Memory** | Stack frames and heap objects, scrubbable step by step, with reachability shading | The Lab 2.1 aliasing trap: `myCounters[2] = myCounters[0]` creates **two** objects, not three |
| **Diagram** | UML class diagram generated from the student's code | Association vs aggregation, drawn from their own fields |
| **Sequence** | UML sequence diagram recorded from a run | Week 3's lifelines and activation boxes, on their code |
| **Canvas** | SplashKit rendered to `<canvas>`, with live mouse/keyboard | ShapeDrawer runs before MSYS2 is installed |
| **Checks** | Per-requirement pass/fail with targeted failure messages | Replaces "it doesn't work" |
| **Editor** | Completion, hovers and squiggles driven by the student's own parse | Discovering `Console.WriteLine` without alt-tabbing to the PDF |

---

## Personalisation

Enter a first name and student ID once. Every personalised lab requirement is
derived and substituted into task text, seed code and generated checks.

| Lab | Requirement | Derived |
|---|---|---|
| 2.1 #12 | reset to `21474836XXXX` | last four digits |
| 2.2 #4 | Azure if first name A–L, else Chocolate | first letter |
| 4.1 #12 | Azure if A–**K**, else Chocolate | note the different range |
| 4.1 #12 | `param` = `1XX` | last two digits |
| 5.1 #19 | outline `(5 + X)` px | last digit |
| 5.2 | `PrivilegeEscalation` pin | last four digits |

Stored in the app's data file on the desktop, in `localStorage` on the web.
Nothing is sent anywhere either way.

> The site flags that Lab 2.1's literal `21474836XXXX` exceeds `int.MaxValue`
> and cannot compile — then uses that as the way into the unchecked-overflow
> question step 13 is really asking. Worth raising with your tutor.

---

## Content

Week 2 is complete and validated:

| Lesson | Kind | Steps |
|---|---|---|
| What an object actually is | concept | 6 |
| Task 2.1 — Build the Counter | lab, 2% | 11 |
| References: two names, one object | concept | 5 |
| Encapsulation, and why the compiler is on your side | concept | 6 |
| Task 2.2 — A Basic Shape | lab, 2% | 4 |
| Week 2 checkpoint | quiz | 10 |
| Lab interview drill | interview | 8 questions |

The references lesson sits **after** Task 2.1 on purpose. Students meet
`myCounters[2] = myCounters[0]` inside the lab, where it is a trap they fall
into; the concept lesson then generalises it into the rule it is an instance of
— value types versus reference types, what a method parameter really receives,
and what `null` is. Concrete first, then the rule.

Every exercise has a reference solution in the test suite that must pass its own
checks, **and** a near-miss solution that must fail — so a check that does not
actually catch the mistake it is about will fail CI.

### Checkpoints

Every week ends with a **checkpoint** lesson (`kind: 'quiz'`) sitting between
the last lab and the interview drill. It teaches nothing. It asks the week back
in five different shapes — free recall into a blank box, multiple choice, a
program to trace with the interpreter, a scrambled class to reorder, and a
closing set written the way the midterm writes them. The variety is the point:
picking the right option out of four is not the same as having the idea, and
the quickest way to find that out is to ask for it in a shape that was never
rehearsed.

The traces are not decoration. Every `predict` block is executed against the
real interpreter in the test suite, and its claimed output must match, so a
checkpoint can never quietly teach something false.

### Adding a week

Content is data (`src/content/week2.ts`), so a new week is one file plus a line
in `WEEKS` in `src/ui/App.tsx`. Blocks available: `text`, `callout`, `code`,
`runnable`, `compare`, `umlSpec`, `table`, `quiz`, `predict`, `parsons`,
`recall`. Checks available: `output`,
`outputContains`, `outputMatches`, `runsClean`, `structure`, `nunit`,
`expression`, `forbid`.

Markdown lives in template literals, so **escape inline-code backticks** as
`` \` ``.

---

## The look of it

Three bundled typefaces, no network fetch: **Fraunces** for headings (a warm
serif with a SOFT axis — this is a unit about reading and explaining code),
**Instrument Sans** for the interface, and **JetBrains Mono** for anything the
student types or the machine prints. They ship as latin-subset variable fonts,
about 190 KB in total, because a lab-room proxy is not something a first-year
should have to debug.

Colour is one warm paper-coloured neutral ramp plus a small set of meanings:
terracotta for "you are here", green for pass, red for fail, violet for the
heap. Radii mean something — pills for chips, small for controls, larger for
surfaces you read inside of — and borders do most of the separating, because a
page of soft-shadowed white rectangles reads as a template rather than as a
document. Callouts are a rule in the margin and a label, not five pastel slabs.

That distinction is load-bearing on a concept page, which mixes things to read
with things to do. **A rule in the left margin means read this; a full border
with a tinted band across the top means the page is waiting on you.** All three
ask blocks share that one grammar and differ only in the word on the band, so
none of them gets a colour of its own to be pretty with: terracotta means "your
turn" for the same reason it means "you are here" in the sidebar, and green and
amber stay reserved for how the answer turned out. Once an ask is settled its
band records the outcome instead of the invitation.

Both themes define `--on-fill`, the ink for text on a filled accent or pass/fail
surface: white in light, near-black in dark, because the dark theme's fills are
pale and a white label on mint green is the classic dark-mode mistake.

### One scale, one set of components

Concept focus has its own point of view &mdash; it is exam stationery, not more
lessons, so the board is hairline-ruled rather than carded and the mock paper's
clock is the loudest thing on it. It does **not** get its own type scale.

Every size in the mode comes from the steps the rest of the app already uses
(46 / 33 / 27 / 23 / 18 / 17 for serif, 15 down to 9.5 for the interface), with
letter-spacing tightening as size grows. Section rules are the small uppercase
sans of `.home-heading`, not serif headings. There are two button sizes in this
codebase &mdash; the base one for content actions and a small one for sidebar
chrome &mdash; and the mode uses those two, not a third.

Where an element is genuinely the same component, it wears the same class
rather than a look-alike rule: a focus question's stem, options and A&ndash;D
markers are `quiz-q`, `quiz-opt` and `quiz-marker`, the lesson quiz's own. Two
rules styled alike today drift apart the first time one is touched, and the
only state the mode adds is `picked` &mdash; an option chosen but not yet
marked, which a lesson quiz never has because it marks immediately.

The navigation panel is the same case, and was the worst offender before it was
fixed: focus mode had a `.focus-rail` that was a near-miss reimplementation of
the lesson sidebar &mdash; 216px against 274px, sunken against raised, its own
heading sizes, its own link sizes, and an inset box-shadow where the sidebar
uses a `::before` bar for the active marker. It is now built from the sidebar's
own parts: `.sidebar` for the box, a sticky `.side-week` header carrying a
progress bar, `.side-heading` for the group labels and `.lesson-link` for every
destination, with per-week readiness on `.lesson-bar` exactly as the lesson list
shows per-lesson completion. Switching between the two should feel like
changing what the panel lists, not like changing app. All that is left in the
mode's own stylesheet is the way back out and the count of outstanding
mistakes, and the count is a `kind-chip` dot rather than a badge, because five
bordered pills in a column is the look of a component library.

---

## Known limits

- The editor chunk is **523 KB (174 KB gzipped)**, mostly CodeMirror. It is
  lazy-loaded, so the first paint costs 338 KB (105 KB gzipped) and concept
  steps never pay for it — but a lab step on mobile data still does. The desktop
  build reads both off disk, so this only costs the web build anything.
- The interpreter is a **subset**. It is not a substitute for `dotnet build` —
  students still write and submit their real project in VS Code.
- `editable` regions on exercises are advisory, not enforced in the editor.
- Weeks 3–5 have resources in `resources/` but no authored content yet.
- The desktop build is unsigned. Windows SmartScreen will warn on first run
  until someone buys a code-signing certificate for the unit.
- Only Windows targets are built here. The macOS and Linux blocks in
  `electron-builder.yml` are written but have not been run.
