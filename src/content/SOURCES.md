# Content sources

Tracks which files from the external resources folder
(`C:\Users\Klizs\Documents\Code\OOP C# Build Assist\resources`) have been
turned into lesson content in this repo, so a future session can diff the
folder against this file instead of re-reading everything. Read this first
before doing any content work; update it after finishing a week.

The resource files themselves are never copied into this repo.

## Done — all 5 weeks of currently-provided resources are built

| Resource file | Used in | Notes |
|---|---|---|
| `Lecture 1.md` (Week 1: Unit intro & objects) | `week2.ts` | Folded into Week 2's opening lesson as prerequisite theory — there is no standalone week1.ts; the app's week numbering follows the *Lab* number, not the lecture number. |
| `Lecture 2.md` (Week 2: Framework classes, unit testing, UML class diagrams) | `week2.ts`, `focus/notes/week2.ts` | Only the properties/encapsulation/UML-class-diagram slice needed for Lab2's two tasks went into the *lesson*. The Framework Classes (Collections) and Unit Testing (NUnit) material — a third of Quiz 2 — is now carried by the **midterm focus revision notes** instead, since the midterm examines it and no lab needed it. Still no runnable NUnit lesson, which remains fine: the midterm is multiple choice. |
| `OOP Lab2.pdf` (Tasks 2.1 Counter, 2.2 Shape) | `week2.ts` | Fully covered, both tasks, all numbered steps. |
| `Quiz 1.md` (14 Q&A) | `week2.ts`, `focus/bank/week1.ts` | Week 2 covers it informally. **Now sourced question-by-question** into the midterm focus bank: Q1-Q14 all appear, cited by number. |
| `Quiz 2.md` (19 Q&A) | `week2.ts`, `focus/bank/week2.ts` | Same — Week 2 is informal, the focus bank is question-by-question. Q1-Q19 all used except the near-duplicates (Q10/Q11 merged, Q5/Q6/Q18 merged into two). |
| `Lecture 3.md` (Week 3: Object collaboration, memory, UML sequence diagrams) | `week3.ts` | Fully used. |
| `Quiz 3.md` (16 Q&A) | `week3.ts` | Q1, Q4, Q9, Q10, Q11, Q13, Q14, Q15, Q16 lifted directly into quiz blocks (cited by number). Q2, Q3, Q5, Q6, Q7, Q8, Q12 folded into surrounding prose (Q7 was already answered in `week2.ts`'s References lesson, written before this file existed). |
| `OOP Lab3.pdf` | `week3.ts` | **Byte-identical to `Swin-Adventure Requirements.pdf`** (verified by md5) — no separate Lab3 task sheet exists. Task 3 follows Lecture 3's own `Item`/`Inventory` live-demo instead. |
| `Swin-Adventure Requirements.pdf` | `week3.ts`, `week4.ts` | Same file as `OOP Lab3.pdf`. The Vision/intro section is used in Week 3's Task 3 brief; the full command-keyword table (move/look/pickup/put/inventory/quit) and Room/Bag/General-Thing spec are **still not built into any lesson** — there is no more unread material about them, so this stays open until a future Swin-Adventure iteration needs it. |
| `Lecture 4.md` (Week 4: Inheritance & Polymorphism) | `week4.ts` | Fully used. Note: the transcript renders one IdentifiableObject method as "RU" (a phonetic mishearing of "R U" / "are you") — `week4.ts` uses `AreYou` instead, matching Lab4.pdf's own Inventory spec, which is what's graded. |
| `OOP Lab4.pdf` | `week4.ts` | Both tasks fully covered. **Known deliberate deviation:** Task 4.2's own UML shows `Item` as a *standalone* class (just a constructor, no base type) — the `IdentifiableObject → GameObject → Item` hierarchy actually belongs to Lab5.pdf's Task 5.2 (Iteration 4), one week later. `week4.ts` builds the hierarchy anyway, one week early, as a deliberate choice (confirmed with the user rather than silently assumed) rather than reworking already-tested content — see the week5.ts note below for how Task 5.2 was reshaped to fit. |
| `Quiz 4.md` (16 Q&A) | `week4.ts` | Q2, Q3, Q4, Q5, Q8, Q9, Q10, Q11, Q13, Q14, Q15, Q16 lifted directly into quiz/predict blocks. Q1, Q6, Q7, Q12 folded into surrounding prose. |
| `Lecture 5.md` (Week 5: Interfaces, Exceptions & Midterm Review) | `week5.ts` | Fully used, including the Mock-Test Walkthrough table (folded into `w5-midterm`'s scenario quizzes) and the midterm logistics (date/format/weight/coverage). |
| `OOP Lab5.pdf` | `week5.ts` | Task 5.1 (Drawing aggregation of Shape, Selected/DrawOutline, multi-constructor `this(...)` chaining) built as specified. **Task 5.2 reshaped:** since `week4.ts` already built the IdentifiableObject→GameObject→Item hierarchy Task 5.2 asks for (see Lab4.pdf note above), `w5-task52` is framed as "write the official Iteration-4 tests against what you already built" rather than redoing the refactor — it does add the 4 new Item-level tests (Test Item is Identifiable/Short Description/Full Description/Privilege Escalation) that Lab5.pdf introduces, which Task 4.2 never asked for, plus re-verifying the 5 Inventory tests. `PrivilegeEscalation`'s real behaviour (pin = last 4 digits of student ID → returns `"your tutorial ID"`, matching Lab5.pdf page 9 exactly) was discovered here and required **fixing** `week4.ts`'s own `PrivilegeEscalation`, which had invented different behaviour (just "add an identifier") before this file was read. |
| `Quiz 5.md` (14 Q&A) | `week5.ts` | All 14 questions used: Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q14 each appear as a quiz or predict block, cited by number. |

## Engine bugs found and fixed while authoring content

- **`checkFieldAccess`/`canAccess` (found in week4.ts):** used the receiver's *runtime* class (e.g. `Item`) as the "owner" when checking protected/private access, instead of the class that actually *declares* the field (e.g. `GameObject`). Broke completely valid C# — `this.name = name;` inside `GameObject`'s own constructor, called via `new Item(...)`, was rejected as "'name' is protected inside 'Item'". Fixed by tracking the actual declaring class through the ancestry search. Covered by `week4.test.ts`'s GameObject/Item tests — a regression here fails those with a "protected inside" error again.
- **Custom exception classes (found in week5.ts, not fixed — scoped around instead):** `class X : Exception { public X(string m) : base(m) {} }` parses and the class can be thrown/caught by its own name, but `base(m)` never reaches a real `System.Exception`, so `.Message` throws "no member called Message". `Exception` and friends are handled as a special built-in `{k:'exception'}` heap kind, not a real registered `ClassInfo`, so user subclasses of it don't get real inheritance semantics. `week5.ts`'s exceptions lesson teaches this pattern (Quiz 5 Q1) as a read-only code example only — every graded/predicted exception exercise throws a built-in exception type instead, which works correctly. Worth a proper fix if a future week needs custom exceptions to actually run.

## Concept Focus — the midterm study mode

`src/content/focus/` is a second consumer of the same resource files, built for
the Week 6 midterm (10 MCQs, 20 minutes, closed book, Weeks 1-5). It does not
duplicate the lessons; it re-cuts the same material by **concept** rather than
by week, because that is the unit a wrong answer has to be fixed at.

| Piece | What it holds | Sourced from |
|---|---|---|
| `focus/concepts.ts` | 34 examinable concepts, each with the one sentence a student should be able to say back, and links back to the lesson steps that teach it properly | Working backwards from Quiz 1-5, Lecture 5's mock-test walkthrough, and Lecture 4's own "possible midterm-style questions" |
| `focus/bank/week1-5.ts` | **353** multiple-choice questions (W1 81, W2 66, W3 69, W4 70, W5 67), each tagged with a concept and citing its source | All five revision quizzes question-by-question, plus the mock walkthrough and lecture material |
| `focus/notes/week1-5.ts` | Condensed revision notes, reusing the lesson `Block` type so tables/compare panes/UML render identically | Lectures 1-5 and the quizzes' own "common traps" tables |

Invariants are enforced by `focus/__tests__/bank.test.ts` rather than by care:
every concept is explained by exactly one note section in its own week, every
`lessonSteps` id still exists in `week2-5.ts` (so renaming a step fails the
build), and every concept has at least three questions — the fix-up rule needs
two correct answers *after* a miss, and re-asking the question whose answer was
just explained would prove nothing.

### The 2026-09-07 depth pass

The bank was taken from ~120 questions to **353** (roughly a threefold
increase, 6-12 per concept) so that a week's quiz can be sat repeatedly without
repeating itself and so mock papers stay distinct for far longer. Each week's
file now has two halves: the original section, sourced question-by-question
from the revision quizzes, and a **"Depth pass"** section below it asking the
same examinable material in other shapes — in code, as a scenario to classify,
as the false statement in a list, as a true/false pair, or pushed one step past
what the revision quiz asked. `source` still cites the quiz question wherever
the idea comes from one, so a student can tell a likely-to-reappear question
from a deliberately harder one; genuinely harder ones carry `stretch: true`.

No new concepts were added — the 34 in `concepts.ts` still cover every
examinable idea in Quiz 1-5 and the mock walkthrough, and adding more would
have meant splitting notes sections for no gain in coverage.

Because a week now holds 66-81 questions, `bank/index.ts` exports `SITTINGS`
(one question per concept / three per concept / everything) and the board offers
all three as one segmented control. `weeklyQuiz(week, seed, rounds)` already
supported this; only the UI was missing.

**Lecture 5's mock-test walkthrough is the highest-value source in the folder.**
It is the closest thing to a released past paper this unit has, and its seven
rows are all represented in the bank with the source line saying so.

## Practice-portal checkpoints (added 2026-09-07)

Each of `week2.ts`-`week5.ts` gained a **checkpoint lesson** (`kind: 'quiz'`),
inserted between the last lab and the interview drill, and surfaced on the home
page's week card as a "Checkpoint" button beside the lab buttons.

| Lesson | Steps | Notes |
|---|---|---|
| `w2-checkpoint` | 10 | Weeks 1+2 material: objects, encapsulation, constructors, properties, UML class diagrams, NUnit, BCL/collections |
| `w3-checkpoint` | 7 | Relationships, memory, sequence diagrams |
| `w4-checkpoint` | 8 | Inheritance and polymorphism — the heaviest week, so the most code |
| `w5-checkpoint` | 8 | Interfaces and exceptions, closing on a six-question mixed paper across all five weeks |

Every checkpoint uses the same five shapes: a `recall` warm-up before any
options are visible, `quiz` blocks, at least one `predict` block (executed
against the interpreter by the week's test file, so it cannot drift), a
`parsons` reorder, and a closing "under exam conditions" step. The Week 5 one
ends on a mixed paper deliberately, since it is the last thing before the
midterm.

Parsons constraint worth knowing: `weekN.test.ts` requires every line of a
puzzle to be **unique**, so a two-class puzzle is impossible (`{` and `}` repeat
at the same indentation). Use one class and put one member on a single line
(`public int Ticks { get { return _count; } }`) to break the tie.

## Engine fix made for the Week 4 checkpoint

`readName`/`assignTo` did not run `checkFieldAccess` for a **bare** identifier,
only for `obj.field`. So `private` was enforced from outside an object and
silently ignored from inside a subclass — a derived class could read its
parent's private field by bare name. Both paths now check, and the error message
distinguishes the two cases: an outsider gets "cannot be read from out here",
while a subclass gets "'_colour' is private to 'Shape', so 'Circle' cannot use
it even though it inherits it". `w4-cp-access-predict` asserts the rejection, so
a regression fails `week4.test.ts`.

## Pending

- **`OOP Lab6.pdf`** appeared in the resources folder on 2026-09-07 and has
  **not** been read or built into any lesson. There is no Lecture 6 or Quiz 6
  alongside it yet. Concept Focus is scoped to Weeks 1-5 (that is the midterm's
  own coverage) so it needs no change for Week 6; a `week6.ts` lesson module
  plus a line in `WEEKS` in `src/ui/App.tsx` is what a Week 6 build would need.

Everything else in the folder has been used. On the next content session: list
the resources folder, diff its filenames against the tables above, and only read
what's new.

## Scope hints worth knowing before continuing past Week 5

- `src/ui/Home.tsx`'s `PLANNED` array is now empty (all provided weeks are built) and the "Coming next" section hides itself when it is — add back to it, in the same `{n, title, note}` shape, once real material for a new week exists.
- `src/tools/uml.ts` and `src/tools/sequence.ts` doc comments cite specific quiz question numbers they were built to serve — read these comments before assuming a tool needs new work for a future week.
- `src/content/personalize.ts` documents every personalization rule found across Labs 2–5 (`color2`, `color4`, `shapeParam`, `outlineWidth`, `resetLiteral`). A Lab 5.2 "pin" is not a separate token — it reuses the existing `XXXX` (last four digits of student ID) token, since that is literally what the pin is.
- The real unit's own numbering: app "week N" = Lecture N + Lab N + Quiz N, except app week 2 additionally absorbs Lecture 1 (there is no Lab 1). If a Week 6 resource set arrives, expect it to follow the same pattern.
