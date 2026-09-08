/**
 * Week 6 — Responsibility-Driven Design & Abstract Classes.
 *
 * Sources: Week 6 lecture (W6a theory deck, W6b activity deck), Quiz 6,
 * OOP Lab6.pdf.
 *
 * Two threads that do not obviously belong together, and the unit knows it.
 * The lecture is Responsibility-Driven Design — a design method with no C# in
 * it at all. The lab is Task 6.1, which turns Week 5's single Shape into an
 * abstract base class with three concrete subclasses. They meet in exactly one
 * place, and this week says so out loud: RDD's step 2 asks what a role knows
 * and what it does, and `abstract` is how C# writes down a "does" that every
 * subclass has to answer for itself.
 *
 * Three things about the source material a future session should not have to
 * rediscover:
 *
 * 1. The *recorded* Week 6 lecture is not about RDD at all. It was spent on
 *    midterm logistics, finishing Week 5's polymorphism, and live-coding Week
 *    7's save/load feature. Dr Vo says RDD is discussed properly in Week 7,
 *    after the break, and that "the theory of week six is not included in your
 *    midterm test". The W6a/W6b slide decks are the authoritative source for
 *    this topic, and the not-on-the-midterm warning is repeated here where a
 *    student will actually see it.
 * 2. Lab6.pdf step 8.4 contains a typo: it says the C-key should set
 *    `kindToAdd` to `ShapeKind.Rectangle`. It means `Circle`. Taught below as
 *    a trap rather than copied, because a student who follows the PDF to the
 *    letter gets a C key that appears to do nothing.
 * 3. Lab6.pdf's Figure 1 asks for MyLine as well as MyRectangle and MyCircle,
 *    and its step 26 wants up to X parallel lines at once. Both are built.
 *
 * Engine notes for this week:
 *   - Nested types are rejected by the parser ("Nested types are not supported
 *     in this playground"), so Lab6.pdf's `private enum ShapeKind` *inside*
 *     class Program cannot run here. It is taught as a read-only code example
 *     in the shape the lab asks for, and everything runnable declares the enum
 *     at the top level instead. Called out in the lesson, not hidden.
 *   - CircleAt / PointInCircle / LineFrom / PointOnLine were added to the
 *     SplashKit shim while writing this week, because Lab6.pdf's own hint
 *     sends students to them for MyCircle.IsAt and MyLine.IsAt. Both the
 *     hand-written distance test (the lab's Tip) and the SplashKit helper now
 *     run, so the lesson can teach the maths and still show the shortcut.
 *   - A subclass method written *without* `override` still dispatches to the
 *     subclass in this interpreter, so no output check can prove a student
 *     typed `override`. Every override requirement below is a `structure`
 *     check for exactly that reason.
 *
 * Authoring note: markdown lives in template literals, so every inline-code
 * backtick must be escaped as \` — otherwise it closes the string.
 */

import type { InterviewQuestion, Week } from './types';

export const week6: Week = {
  number: 6,
  title: 'Responsibility-Driven Design & Abstract Classes',
  subtitle: 'Deciding what each object is responsible for — and the C# for a promise every subclass must keep',
  outcomes: [
    'Name RDD\'s three steps in order, and say what each one produces',
    'Turn a requirements brief into candidate roles, then into "knows" and "does" responsibilities',
    'Use cohesion, coupling and the information expert rule to decide where a responsibility belongs',
    'Choose between the five UML relationship types, and read the opt/alt/loop fragments of a sequence diagram',
    'Say what virtual, override and abstract each mean, and when a base method should have no body at all',
    'Extend ShapeDrawer into an abstract Shape with rectangles, circles and lines that draw themselves',
  ],
  sources: ['Week 6 lecture (W6a/W6b slides)', 'Quiz 6', 'OOP Lab6.pdf'],
  lessons: [
    // ================================================================ lesson 1
    {
      id: 'w6-rdd',
      title: 'Responsibility-Driven Design',
      kind: 'concept',
      minutes: 16,
      summary: 'Roles, responsibilities and collaborations — how a requirements brief becomes a set of classes.',
      steps: [
        {
          id: 'w6-rdd-why',
          title: 'Why design before code',
          blocks: [
            {
              t: 'callout',
              tone: 'warn',
              title: 'Not on the midterm',
              md: 'Dr Vo said it in as many words: **"the theory of week six is not included in your midterm test."** The test covers Weeks 1–5 only. This lesson still matters — it is examinable later, and Task 6.1 is worth 2% — but if the test is tomorrow, **Concept focus** on the home page is where you should be instead.',
            },
            {
              t: 'text',
              md: `Programming is giving instructions to an unintelligent computer. That is manageable alone, for a week. It stops being manageable when the system is **PyTorch** or **React** — millions of instructions, thousands of contributors, none of whom can hold the whole thing in their head.

What makes that work is not cleverer code. It is that everyone can **picture the same solution**. So the design document comes *before* the implementation plan, and its job is a shared understanding of what the software does.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'The four questions a design method has to answer',
              md: 'How do developers picture the solution and agree on what it does? · How do they agree on **communication protocols** between parts, independently of how each part is built? · How do you **minimise rework** when the design changes? · How do you **maximise encapsulation** when writing the class definitions?',
            },
          ],
        },
        {
          id: 'w6-rdd-what',
          title: 'Roles, responsibilities, collaborations',
          blocks: [
            {
              t: 'text',
              md: `> RDD creates effective OO designs using **Roles**, **Responsibilities**, and **Collaborations**.
> — Wirfs-Brock et al., *Object Design: Roles, Responsibilities, and Collaborations* (2002)

The emphasis is **behavioural**: what objects *do*, not just what they store. That is the difference from the way most people first sketch a program, which is to list the data and then wonder what to do with it.`,
            },
            {
              t: 'quiz',
              question: 'Which of these best describes a **role** in Responsibility-Driven Design?',
              options: [
                'A general responsibility or purpose that an object may fulfil',
                'A specific class in the final implementation',
                'One particular object instance at runtime',
                'A method signature declared on an interface',
              ],
              answer: 0,
              why: [
                '',
                'A role is not tied to exactly one class — several classes can fill the same role, and one class can fill several.',
                'An instance is a thing that exists while the program runs. A role is a design-time idea about purpose.',
                'That is one way a role might eventually be written down in code, but the role exists before any code does.',
              ],
              explain:
                'Quiz 6 Q7. A role is a cohesive set of related responsibilities an object adopts to serve a purpose. Separating the *behavioural contract* from any one implementation is the whole point — it is what lets the design survive a change of class structure.',
            },
          ],
        },
        {
          id: 'w6-rdd-steps',
          title: 'The three steps',
          blocks: [
            {
              t: 'table',
              caption: 'RDD, start to finish',
              headers: ['Step', 'Question it answers', 'What it produces'],
              rows: [
                ['**1 — Roles**', 'What objects does this problem have?', 'Candidate roles, explored on CRC cards and drawn as boxes in a class diagram'],
                ['**2 — Responsibilities**', 'What does each role *know*, and what can it *do*?', 'Attributes and methods inside each box'],
                ['**3 — Collaborations**', 'Who does each role need help from?', 'Relationships between boxes, and sequence diagrams for concrete scenarios'],
              ],
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'The arrow points backwards too',
              md: 'Step 2 routinely sends you back to step 1. Writing down what a role is responsible for is how you find out that you need a role you had not thought of, or that two of your roles are really the same one. That is not a mistake in the process — it *is* the process.',
            },
            {
              t: 'quiz',
              question: 'What is the **first** step in Responsibility-Driven Design?',
              options: [
                'Identify the possible roles in the program',
                'Write the responsibilities of each class',
                'Define the low-level implementation details',
                'Optimise the program for performance',
              ],
              answer: 0,
              why: [
                '',
                'Responsibilities are step 2 — you cannot assign one until you have something to assign it to.',
                'Implementation detail is the last thing RDD gets to, not the first.',
                'Performance is not a design-modelling concern at all at this stage.',
              ],
              explain:
                'Quiz 6 Q4. RDD models the system from a high level using conceptual roles first, before any code exists. Everything else builds on that first pass.',
            },
            {
              t: 'quiz',
              question: 'Which principle is emphasised during **Step 2** of RDD?',
              options: [
                'Identifying the responsibilities of each role',
                'Choosing the database schema',
                'Writing the method bodies',
                'Deciding which design patterns to apply',
              ],
              answer: 0,
              why: [
                '',
                'Persistence is an implementation concern, deferred until long after the conceptual model exists.',
                'Step 2 decides *what* each role does, not how it does it — bodies come much later.',
                'Patterns may fall out of the design, but they are not what step 2 is for.',
              ],
              explain:
                'Quiz 6 Q2. Step 2 determines what each role knows and what it does, and assigns those responsibilities to the roles found in step 1.',
            },
          ],
        },
        {
          id: 'w6-rdd-roles',
          title: 'Step 1 — finding the roles',
          blocks: [
            {
              t: 'text',
              md: `Picture the problem domain and list the **candidate roles**. The rule of thumb: **nouns in the requirements are a good starting point**.

For a chess game, that gives you \`Board\`, \`Cell\`, \`King\`, \`Queen\`, \`Bishop\`, \`Knight\`, \`Rook\`, \`Pawn\`.

The rule is a starting point, not an oracle. Not every noun is a role, and the ones that are not are usually easy to spot: they come from the *implementation*, not from the problem.`,
            },
            {
              t: 'quiz',
              question: 'In the context of a chess game, which of these is **not** a plausible role?',
              options: ['For Loop', 'Player', 'Move Validator', 'Chessboard'],
              answer: 0,
              why: [
                '',
                'A player is a real participant in the domain, with things they know and things they do.',
                'Validating a move is a genuine responsibility that a role can own — the name comes from the problem, not from C#.',
                'The board is the most obviously physical thing in the game.',
              ],
              explain:
                'Quiz 6 Q10. A `for` loop is a control-flow construct in a programming language. RDD roles come from the **problem domain**, never from implementation-level syntax — if you would not say it to someone who has never programmed, it is not a role.',
            },
          ],
        },
        {
          id: 'w6-rdd-crc',
          title: 'CRC cards',
          blocks: [
            {
              t: 'text',
              md: `A **CRC card** is an index card — physical ones genuinely are the normal tool — with three things on it: the **C**andidate role, its **R**esponsibilities, and its **C**ollaborators. One card per role, so a design is a small pile you can spread out on a table and rearrange.

They are deliberately small. A card that will not fit its responsibilities is telling you the role is doing too much.`,
            },
            {
              t: 'code',
              lang: 'text',
              caption: 'One card',
              code: `┌────────────────────────────┐
│            Pawn            │
├────────────────────────────┤
│ knows its colour           │
│ knows its valid moves      │
│ can become a Queen         │
│ can take another piece     │
└────────────────────────────┘`,
            },
            {
              t: 'quiz',
              question: 'What is the benefit of using CRC cards in RDD?',
              options: [
                'Identifying and refining object roles and responsibilities iteratively',
                'Generating the class skeletons automatically',
                'Designing the database tables before the classes',
                'Measuring how fast the finished program will run',
              ],
              answer: 0,
              why: [
                '',
                'They are index cards. Nothing is generated from them — their value is in the conversation, not the artefact.',
                'Persistence is not what a CRC card is about, and it comes far later than early-stage modelling.',
                'Performance cannot be measured from a design sketch, and RDD is not trying to.',
              ],
              explain:
                'Quiz 6 Q11. CRC cards are a lightweight tool for brainstorming and walking through scenarios early — you rewrite them freely, which is exactly what makes them good at *iterating* on roles and responsibilities.',
            },
          ],
        },
        {
          id: 'w6-rdd-knows-does',
          title: 'Step 2 — knows and does',
          blocks: [
            {
              t: 'text',
              md: `Every role gets described the same way: *"I'm a \`<Role>\`... I'm responsible for..."*. There are only two kinds of thing that sentence can end with, and each maps straight onto a kind of class member.`,
            },
            {
              t: 'table',
              caption: 'Two kinds of responsibility, two kinds of member',
              headers: ['Responsibility', 'Becomes', 'Chess examples'],
              rows: [
                ['**Knows** things', 'Attributes / fields', '`King` knows its colour · `Board` knows all its cells · `Cell` knows its occupant'],
                ['**Does** things', 'Methods', '`Pawn` can become a Queen · `Board` can move pieces · `Cell` can hold a piece'],
              ],
            },
            {
              t: 'text',
              md: `Written into a UML class box, the knows sit above the does — which is exactly the layout you have been reading since Week 2.`,
            },
            {
              t: 'code',
              lang: 'text',
              caption: 'The same card, as UML',
              code: `┌───────────────────────────┐
│          Student          │  ← the role
├───────────────────────────┤
│ - name : String           │  ← "knows"
│ - identifier : String     │
├───────────────────────────┤
│ + selectStudyUnits()      │  ← "does"
└───────────────────────────┘`,
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'Two notations worth recognising',
              md: 'A **`<<abstract>>` stereotype** above the class name marks an abstract class. An *italicised* method signature marks an abstract method. You will write both in Task 6.1 this week.',
            },
          ],
        },
        {
          id: 'w6-rdd-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'recall',
              prompt:
                'A friend has a requirements brief and no idea where to start. Talk them through RDD: the three steps in order, what each one produces, and how you would find the first few roles.',
              nudge: 'Three steps. Two kinds of responsibility. One rule of thumb about where roles come from.',
              points: [
                'Step 1: identify candidate roles — nouns in the requirements are a good starting point',
                'Step 2: give each role its responsibilities, split into what it **knows** and what it **does**',
                'Step 3: work out which roles need help from which others, to fulfil those responsibilities',
                'Knows become attributes, does become methods',
                'Step 2 sends you back to step 1 constantly, and that is the process working',
                'Roles come from the problem domain, never from programming constructs',
                'CRC cards are the tool: Candidate role, Responsibilities, Collaborators, one card each',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 2
    {
      id: 'w6-collab',
      title: 'Collaboration, cohesion & coupling',
      kind: 'concept',
      minutes: 15,
      summary: 'Who asks whom for help, and the two measurements that tell you whether you split the work up well.',
      steps: [
        {
          id: 'w6-col-step3',
          title: 'Step 3 — asking for help',
          blocks: [
            {
              t: 'text',
              md: `No object does its whole job alone. When one is asked to perform a task, it can **ask other objects for help** — and that request is the collaboration.

Two ways to think about it, both useful:

- a **client/supplier** interaction — one object wants something, another provides it;
- a **contract** — the supplier promises a result, and the client promises not to care how.`,
            },
            {
              t: 'text',
              md: `Collaborations are tested by walking through **scenarios**: concrete sequences of events, said out loud, checking that the model can actually respond. \`ChessGame\` is asked to start the game, and cannot do it alone:`,
            },
            {
              t: 'code',
              lang: 'text',
              caption: 'Scenario: start the game',
              code: `Board, setup.
  Rook, exist.
  Rook, this is your King.
  Cell, hold this Rook.`,
            },
            {
              t: 'quiz',
              question: 'What is the focus of **Step 3** in Responsibility-Driven Design?',
              options: [
                'Collaborating with other objects to fulfil responsibilities',
                'Assigning responsibilities to each role',
                'Identifying the candidate roles',
                'Writing the unit tests for each class',
              ],
              answer: 0,
              why: [
                '',
                'That is step 2 — done before you can ask who needs help from whom.',
                'That is step 1, the very beginning.',
                'Testing is downstream of the whole design process, not a step in it.',
              ],
              explain:
                'Quiz 6 Q13. With roles found and responsibilities assigned, step 3 asks how objects work together — as client/supplier, or as a contract — to actually carry out a workflow.',
            },
          ],
        },
        {
          id: 'w6-col-expert',
          title: 'The information expert',
          blocks: [
            {
              t: 'callout',
              tone: 'key',
              title: 'The rule that settles most arguments',
              md: 'The object that **holds the data** is the object responsible for **acting on it**. If you find yourself reaching into another object for its data so you can compute something, the computation almost certainly belongs over there instead.',
            },
            {
              t: 'text',
              md: `That is one half of it. The other half is **encapsulation of responsibilities**: the data and the methods that operate on it live inside the same class. You have been doing this since Week 2 without the name — it is why \`Inventory\` searches its own items rather than handing the list out.`,
            },
            {
              t: 'quiz',
              question:
                'In a chess game, which responsibility would most likely belong to the `Piece` class?',
              options: [
                'Determining its valid moves based on its type (rook, bishop, queen…)',
                'Managing the game timer',
                'Saving the game to a file',
                'Managing whose turn it is',
              ],
              answer: 0,
              why: [
                '',
                'A clock has nothing to do with any one piece — that is a `Game`-level concern.',
                'Persisting the whole game is a coordination job, not something a single piece knows about.',
                'Turn order is about the game as a whole; no individual piece has the information to decide it.',
              ],
              explain:
                'Quiz 6 Q8. A `Piece` holds the data and context about its own type, which makes it the **information expert** for its own movement. Everything else on that list belongs to a higher-level coordinator like `Game` or `Board`.',
            },
            {
              t: 'quiz',
              question:
                'In a Library Management System, which best represents the responsibilities of the `Book` class?',
              options: [
                'Track its own information (title, author, availability) and update its availability status',
                'Manage user accounts and borrowing history',
                'Manage the library budget',
                'Process fine payments',
              ],
              answer: 0,
              why: [
                '',
                'Accounts and history are the `User`\'s data, so they are the `User`\'s responsibility.',
                'A budget belongs to the `Library`, which is the role that has one.',
                'Fines involve a user and a transaction — `Librarian` or `Library` territory, not a single book\'s.',
              ],
              explain:
                'Quiz 6 Q12. The information expert again: a `Book` directly holds its title, author and availability, so tracking and updating them is its job. Everything else on the list is some other role\'s data.',
            },
            {
              t: 'quiz',
              question:
                'The `User` class is given the responsibility `borrowBook()`. Which RDD principle does that illustrate?',
              options: [
                'Encapsulation of Responsibilities',
                'Inheritance',
                'Loose coupling',
                'Polymorphism',
              ],
              answer: 0,
              why: [
                '',
                'No base class or subclass is involved — nothing is being inherited here.',
                'Coupling is about dependencies *between* classes, not about where one behaviour is placed.',
                'Polymorphism is about one call reaching different implementations; there is only one here.',
              ],
              explain:
                'Quiz 6 Q3. Putting a behaviour on the class that owns the relevant data and context is **encapsulation of responsibilities** — bundling data and the methods that operate on it together.',
            },
          ],
        },
        {
          id: 'w6-col-library',
          title: 'Who runs the transaction?',
          blocks: [
            {
              t: 'text',
              md: `Here is where the information-expert rule gets interesting. In a Library Management System with \`Book\`, \`User\`, \`Librarian\` and \`Library\`, a user borrows a book. Three objects could plausibly do the work. Only one should.`,
            },
            {
              t: 'quiz',
              question:
                'How should the collaboration between `User` and `Library` be managed when borrowing a book?',
              options: [
                'The Library handles the transaction — checking availability and updating records — while the User requests the action',
                'The User directly updates the book\'s availability status',
                'The Book decides whether it may be borrowed and updates itself',
                'The User keeps its own list of borrowed books and the Library is not involved',
              ],
              answer: 0,
              why: [
                '',
                'That reaches past the system into another object\'s state — exactly the encapsulation violation RDD is trying to prevent.',
                'A single book has no view of library rules, borrowing limits, or who else is waiting for it.',
                'Then nothing in the system knows what has been lent out, which is the one thing a library must know.',
              ],
              explain:
                'Quiz 6 Q1. `Library` is the information expert *and* the coordinator for system-level transactions: it is the only role that can see availability, records and rules at once. `User` requests; `Library` decides and records.',
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Information expert is not "whoever is nearest"',
              md: 'A `Book` knows its own availability flag, so it is tempting to let the `Book` run the borrow. But a *transaction* needs more information than one flag — the rules, the records, the other users. The expert for a transaction is whoever can see the whole transaction.',
            },
          ],
        },
        {
          id: 'w6-col-cohesion',
          title: 'Cohesion',
          blocks: [
            {
              t: 'text',
              md: `**Cohesion** is how strongly the things inside one class belong together. You want it **high**: a class with one well-defined job, whose members are all obviously about that job.`,
            },
            {
              t: 'compare',
              title: 'The same feature, split two ways',
              left: {
                title: 'Low cohesion',
                tone: 'bad',
                md: 'One `EmployeeRecord` class holding personal details, tax calculations, payslip formatting and the printer queue. Everything about employees, all in one place — which means every change to any of those things touches this file.',
              },
              right: {
                title: 'High cohesion',
                tone: 'good',
                md: '`Employee` knows the personal details. `Payroll` does the tax calculation. `Payslip` formats. Each has one reason to change, and you can find the tax bug without reading the printer code.',
              },
            },
            {
              t: 'quiz',
              question: 'How does high cohesion benefit an object-oriented design?',
              options: [
                'It simplifies maintenance by grouping related functionality within a class',
                'It duplicates code across classes so each is self-sufficient',
                'It removes the need for classes to collaborate',
                'It guarantees the program runs faster',
              ],
              answer: 0,
              why: [
                '',
                'Duplication is a symptom of a *bad* split, not a goal — high cohesion avoids it by putting the logic in one obvious place.',
                'Collaboration is necessary and desirable; cohesion is about what goes inside a class, not about eliminating the links between them.',
                'Cohesion is a maintainability property. It says nothing about runtime speed.',
              ],
              explain:
                'Quiz 6 Q5. A highly cohesive class is built around a single well-defined set of related responsibilities, which makes it easier to understand, maintain and reuse.',
            },
          ],
        },
        {
          id: 'w6-col-coupling',
          title: 'Coupling',
          blocks: [
            {
              t: 'text',
              md: `**Coupling** is how much one class depends on another. You want it **loose**: few dependencies, and where they exist, on something general rather than on one specific implementation.`,
            },
            {
              t: 'compare',
              title: 'Depending on a thing vs depending on a capability',
              left: {
                title: 'Tight coupling',
                tone: 'bad',
                code: `public class Player
{
    private CDPlayer _device;

    public void Play()
    {
        _device.Play();
    }
}`,
                md: 'Swapping in a `VoiceRecorder` means editing `Player`.',
              },
              right: {
                title: 'Loose coupling',
                tone: 'good',
                code: `public class Player
{
    private IMusicPlayer _device;

    public void Play()
    {
        _device.Play();
    }
}`,
                md: 'Any `IMusicPlayer` fits. `Player` never changes again.',
              },
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Where you have already seen this',
              md: 'That right-hand pane is Week 5\'s interfaces, arriving with a name for why they were worth having. `IHaveInventory` exists so that code fetching an item does not need to know whether it is holding a `Bag` or a `Player`.',
            },
            {
              t: 'quiz',
              question: 'Which describes **loose coupling**?',
              options: [
                'Classes are independent, with minimal dependencies on each other',
                'Classes share as much data as possible',
                'Every class inherits from a single common base class',
                'All classes are declared in one file',
              ],
              answer: 0,
              why: [
                '',
                'Shared mutable data is one of the tightest couplings there is — a change to it can break anything that touches it.',
                'A forced common ancestor is a claim about ancestry, and it usually *increases* how much the classes depend on each other.',
                'Where code sits in the file system has nothing to do with how much it depends on other code.',
              ],
              explain:
                'Quiz 6 Q14. Low interdependency means a change in one class is unlikely to ripple outwards. This is the counterpart to cohesion: cohesion governs what goes inside a class, coupling governs how classes lean on each other.',
            },
          ],
        },
        {
          id: 'w6-col-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Define cohesion and coupling, say which direction you want each of them in, and explain how the information expert rule decides where a responsibility goes.',
              nudge: 'One of these is about what is inside a class, the other about what is between classes. Then: who should do the work — the one who asks, or the one who knows?',
              points: [
                'Cohesion: how strongly the functionality inside one class is related — you want it **high**',
                'Coupling: how much classes depend on each other — you want it **loose**',
                'High cohesion makes a class easier to understand, maintain and reuse; it has one reason to change',
                'Loose coupling means a change in one class does not ripple through the rest',
                'Information expert: the object holding the data is the one responsible for acting on it',
                'For a transaction, the expert is whoever can see the whole transaction, not whoever holds one field',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 3
    {
      id: 'w6-uml',
      title: 'Documenting the design in UML',
      kind: 'concept',
      minutes: 14,
      summary: 'The five relationship types, and what a sequence diagram adds that a class diagram cannot.',
      steps: [
        {
          id: 'w6-uml-class',
          title: 'Static structure',
          blocks: [
            {
              t: 'text',
              md: `A **class diagram** documents the output of steps 1 and 2: one box per role, with the class name, its "knows" and its "does". It shows **static structure** — what exists, and how the pieces are permanently connected. It says nothing about time or order.`,
            },
            {
              t: 'quiz',
              question:
                'Which UML diagram is used to communicate the static structure of classes and their relationships?',
              options: ['Class diagram', 'Sequence diagram', 'Use case diagram', 'Activity diagram'],
              answer: 0,
              why: [
                '',
                'A sequence diagram shows dynamic behaviour over time — messages between objects, not structure.',
                'A use case diagram shows what actors want from the system, at a level above any class.',
                'An activity diagram shows a flow of work, closer to a flowchart than to a structure.',
              ],
              explain:
                'Quiz 6 Q6. The class diagram maps classes, attributes, operations and the relationships between them — inheritance, association, aggregation and the rest.',
            },
          ],
        },
        {
          id: 'w6-uml-relations',
          title: 'The five relationships',
          blocks: [
            {
              t: 'table',
              caption: 'What the lines mean',
              headers: ['Relationship', 'Notation', 'Meaning', 'Example'],
              rows: [
                ['**Dependency**', 'Dashed line, open arrowhead', '*Temporary* use — a method parameter, a local variable', '`Student.selectStudyUnit(Catalog)`'],
                ['**Association**', 'Solid line', '*Permanent* relationship between two classes', '`StudyUnit` ↔ `Student` (enroll / withdraw)'],
                ['**Aggregation**', 'Solid line, **open** diamond ◇ at the whole', 'Whole–part, where the parts can outlive the whole', '`Catalog` ◇— `StudyUnit`'],
                ['**Composition**', 'Solid line, **filled** diamond ◆ at the whole', 'Whole–part, where destroying the whole destroys the parts', '`StudyUnit` ◆— `Description`'],
                ['**Inheritance**', 'Solid line, hollow **triangle** △ at the parent', 'Specialisation — "is-a"', '`StudyUnit` △— `PortfolioUnit`'],
              ],
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'Three shapes, three questions',
              md: '**Diamond = has-a.** Open ◇ means the part can be detached and survive; filled ◆ means it dies with the whole. **Triangle = is-a.** **Dashed arrow = uses-a, briefly.**',
            },
            {
              t: 'quiz',
              question:
                'Which UML relationship represents the permanent association between `Library` and `Book`?',
              options: ['Aggregation', 'Dependency', 'Composition', 'Inheritance'],
              answer: 0,
              why: [
                '',
                'A dependency is temporary — a book passed to one method and forgotten. A library holds its books over time.',
                'Composition would mean destroying the library destroys the books, which is not true of a real library.',
                'A book is not a kind of library.',
              ],
              explain:
                'Quiz 6 Q9. Aggregation is a solid line with an open diamond at the whole end: a permanent whole–part relationship where the parts can exist independently of, and outlive, the whole.',
            },
            {
              t: 'quiz',
              question:
                'A `House` is built from `Room` objects that cannot exist without it. Which relationship is that?',
              options: ['Composition', 'Aggregation', 'Association', 'Dependency'],
              answer: 0,
              why: [
                '',
                'Aggregation would say the rooms can outlive the house — demolish it and the rooms remain, which is not how rooms work.',
                'A plain association says the two are linked, but loses the whole–part meaning entirely.',
                'A dependency would say the house merely uses a room briefly and forgets it.',
              ],
              explain:
                'Aggregation and composition are both "has-a"; the only thing separating them is lifetime. Filled diamond ◆ when the parts die with the whole, open ◇ when they do not.',
            },
          ],
        },
        {
          id: 'w6-uml-see',
          title: 'Reading a real one',
          blocks: [
            {
              t: 'text',
              md: `The slides' running example. A \`Catalog\` aggregates \`StudyUnit\`s; a \`StudyUnit\` is specialised into \`PortfolioUnit\` and \`ExamUnit\`; a \`Student\` associates with the units they are enrolled in, and merely *depends* on the \`Catalog\` it searches. Note the \`<<abstract>>\` stereotype and the italic \`Assess\` — a "does" that every kind of unit must answer for itself.`,
            },
            {
              t: 'umlSpec',
              caption: 'Enrolment, as the slides draw it',
              source: `public abstract class StudyUnit
{
    private string _code;
    private string _title;
    public string Code { get { return null; } }
    public abstract void Assess(Student s);
    public void Enroll(Student s) { }
    public void Withdraw(Student s) { }
}

public class PortfolioUnit : StudyUnit
{
    private int _artefactCount;
    public override void Assess(Student s) { }
}

public class ExamUnit : StudyUnit
{
    private int _examWeight;
    public override void Assess(Student s) { }
}

public class Catalog
{
    private List<StudyUnit> _units;
    public void Add(StudyUnit unit) { }
    public StudyUnit GetMatch(string topic) { return null; }
}

public class Student
{
    private string _name;
    private string _identifier;
    private List<StudyUnit> _enrolled;
    public void SelectStudyUnits(Catalog catalog) { }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'What each line came from',
              md: '`Catalog` holds a `List<StudyUnit>` as a **field**, so that is aggregation. `Student.SelectStudyUnits` takes a `Catalog` as a **parameter** and does not keep it, so that is a dependency. `PortfolioUnit : StudyUnit` is inheritance. The picture is not decoration — every line is readable straight off the code.',
            },
          ],
        },
        {
          id: 'w6-uml-sequence',
          title: 'Dynamic behaviour',
          blocks: [
            {
              t: 'text',
              md: `A class diagram cannot show *order*. A **sequence diagram** can: think of it as a script for one scenario, showing messages passing between collaborating objects over time.

- **Lifeline** — \`name : ClassName\` with a dashed line dropping down, showing an object existing through time.
- **Message** — a solid arrow is a method call; a dashed arrow is a return.
- **Activation bar** — the thin rectangle on a lifeline, marking that the object is busy.`,
            },
            {
              t: 'table',
              caption: 'Combination fragments — control flow, in a diagram',
              headers: ['Fragment', 'Means', 'Example'],
              rows: [
                ['`opt [condition]`', 'Runs only if the condition holds — an `if` with no `else`', '`opt [match = true]` → Add StudyUnit'],
                ['`alt [cond] / [else]`', 'Alternative branches — `if` / `else`', '`alt [size == 1]` → Enroll(stu) / `[else]` → search again'],
                ['`loop [condition]`', 'Repetition — a `for` or `while`', '`loop [for each unit]` → GetMatch("astronomy")'],
              ],
            },
            {
              t: 'text',
              md: `Drawing these by hand is the usual lab exercise, with no way to check the picture matches the code. Run this collaboration and open **Sequence** to see the diagram built from the calls that actually happened.`,
            },
            {
              t: 'runnable',
              tool: 'sequence',
              autoRun: true,
              caption: 'A Student, a Catalog and the unit it finds',
              code: `public class StudyUnit
{
    private string _code;

    public StudyUnit(string code)
    {
        _code = code;
    }

    public string Code { get { return _code; } }

    public void Enroll(string student)
    {
        Console.WriteLine(student + " enrolled in " + _code);
    }
}

public class Catalog
{
    private List<StudyUnit> _units;

    public Catalog()
    {
        _units = new List<StudyUnit>();
    }

    public void Add(StudyUnit unit)
    {
        _units.Add(unit);
    }

    public StudyUnit GetMatch(string code)
    {
        foreach (StudyUnit u in _units)
        {
            if (u.Code == code)
            {
                return u;
            }
        }
        return null;
    }
}

public class Student
{
    private string _name;

    public Student(string name)
    {
        _name = name;
    }

    public void SelectStudyUnit(Catalog catalog, string code)
    {
        StudyUnit found = catalog.GetMatch(code);
        if (found != null)
        {
            found.Enroll(_name);
        }
    }
}

public class Program
{
    public static void Main()
    {
        Catalog catalog = new Catalog();
        catalog.Add(new StudyUnit("COS20007"));
        catalog.Add(new StudyUnit("COS30008"));

        Student amy = new Student("Amy");
        amy.SelectStudyUnit(catalog, "COS20007");
    }
}`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'The point of the picture',
              md: '`Student` never touches the list of units. It asks `Catalog` for a match, and asks the `StudyUnit` it gets back to enroll someone. Two collaborations, each a client asking a supplier — and the diagram shows the order, which the class diagram never could.',
            },
          ],
        },
        {
          id: 'w6-uml-check',
          title: 'Check yourself',
          blocks: [
            {
              t: 'recall',
              prompt:
                'Name the five UML relationship types, how each is drawn, and the one question that separates aggregation from composition.',
              nudge: 'Two of them use a diamond. One uses a triangle. One is dashed. One is just a line.',
              points: [
                'Dependency — dashed line with an open arrowhead — temporary use, e.g. a method parameter',
                'Association — solid line — a permanent relationship',
                'Aggregation — solid line with an open diamond at the whole — parts can outlive the whole',
                'Composition — solid line with a filled diamond at the whole — parts die with the whole',
                'Inheritance — solid line with a hollow triangle pointing at the parent — "is-a"',
                'Aggregation vs composition is decided by **lifetime**, nothing else',
                'The diamond always sits at the "whole" end, never at the part',
              ],
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 4
    {
      id: 'w6-task61',
      title: 'Task 6.1 — ShapeDrawer: Multiple Shape Kinds',
      kind: 'lab',
      minutes: 45,
      assessment: 'Assessed · 2% of your final grade',
      summary: 'Turn one Shape into a family — rectangles, circles and lines that each know how to draw themselves.',
      steps: [
        {
          id: 'w6-61-why',
          title: 'Many shapes, one kind',
          blocks: [
            {
              t: 'text',
              md: `Week 5 got you a \`Drawing\` holding many shapes. They are all rectangles. Adding circles and lines by putting a \`kind\` field on \`Shape\` and branching inside \`Draw\` would work, right up until the fourth shape kind — at which point every method is a switch statement and adding a shape means editing all of them.

The alternative is a **family of classes**: \`Shape\` for what every shape shares, and one subclass per kind that overrides the parts that differ. Adding a shape then means adding one file and changing nothing.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'This week\'s only assessable task',
              md: 'Task 6.1 is worth **2%**, and there is no Task 6.2. Finish it before your lab — there is a verification task and a short interview there.',
            },
          ],
        },
        {
          id: 'w6-61-uml',
          title: 'The target',
          blocks: [
            {
              t: 'text',
              md: `Figure 1 from the task sheet. \`Shape\` is \`<<abstract>>\` — you can no longer create one — and \`Draw\`, \`DrawOutline\` and \`IsAt\` are abstract with it. Note where \`_width\` and \`_height\` end up: on \`MyRectangle\`, not on \`Shape\`, because a circle has no width.`,
            },
            {
              t: 'umlSpec',
              caption: 'Task 6.1 target — the Shape hierarchy',
              source: `public abstract class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private bool _selected;
    public Color Color { get { return null; } set { } }
    public float X { get { return 0; } set { } }
    public float Y { get { return 0; } set { } }
    public bool Selected { get { return false; } set { } }
    public abstract void Draw();
    public abstract void DrawOutline();
    public abstract bool IsAt(Point2D pt);
}

public class MyRectangle : Shape
{
    private int _width;
    private int _height;
    public int Width { get { return 0; } set { } }
    public int Height { get { return 0; } set { } }
    public override void Draw() { }
    public override void DrawOutline() { }
    public override bool IsAt(Point2D pt) { return false; }
}

public class MyCircle : Shape
{
    private int _radius;
    public int Radius { get { return 0; } set { } }
    public override void Draw() { }
    public override void DrawOutline() { }
    public override bool IsAt(Point2D pt) { return false; }
}

public class MyLine : Shape
{
    private float _endX;
    private float _endY;
    public float EndX { get { return 0; } set { } }
    public float EndY { get { return 0; } set { } }
    public override void Draw() { }
    public override void DrawOutline() { }
    public override bool IsAt(Point2D pt) { return false; }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'You do not build this in one go',
              md: 'The task sheet walks you there in stages, and so does this lesson: first a subclass that adds nothing, then `virtual`/`override`, then moving the rectangle-only fields down, and only at the end does `Shape` become abstract. Each stage compiles and runs.',
            },
          ],
        },
        {
          id: 'w6-61-subclass',
          title: 'A subclass that adds nothing',
          blocks: [
            {
              t: 'text',
              md: `Start with the smallest possible step. \`MyRectangle\` inherits from \`Shape\` and adds not one line of its own — and it is already a fully functional class, because inheritance is the primary mechanism for code reuse in an OO language.

Then, in \`Program.cs\`, the line that creates a shape on left-click becomes \`new MyRectangle()\` instead of \`new Shape()\`. Everything else keeps working.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Why that assignment is legal',
              md: 'This is **subtype polymorphism**: an object of a subclass can be used wherever the base class is expected. `Shape myShape = new MyRectangle();` works because a `MyRectangle` supports every public member a `Shape` does — so `AddShape(Shape s)` accepts one without knowing or caring.',
            },
          ],
          exercise: {
            prompt:
              'Make MyRectangle a subclass of Shape, adding nothing else at all — inheritance should supply the whole class.',
            seed: `public class MyRectangle
{
}`,
            editable: { from: 1, to: 1 },
            tests: [
              {
                kind: 'structure',
                label: 'MyRectangle inherits from Shape',
                rule: { on: 'class', name: 'MyRectangle', exists: true, baseType: 'Shape' },
              },
              {
                kind: 'runsClean',
                label: 'A MyRectangle can be stored in a Shape variable',
              },
              {
                kind: 'output',
                label: 'It inherits Shape\'s size, position and IsAt without redefining them',
                expect: '{{shapeParam}}\nTrue',
              },
            ],
            harness: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape()
    {
        _color = Color.{{color4}};
        _x = 0.0f;
        _y = 0.0f;
        _width = {{shapeParam}};
        _height = {{shapeParam}};
    }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public int Width { get { return _width; } set { _width = value; } }
    public int Height { get { return _height; } set { _height = value; } }

    public void Draw() { SplashKit.FillRectangle(_color, _x, _y, _width, _height); }

    public bool IsAt(Point2D pt)
    {
        return pt.X > _x && pt.X < _x + _width && pt.Y > _y && pt.Y < _y + _height;
    }
}

public class __Check
{
    public static void Main()
    {
        Window w = new Window("Test", 800, 600);
        Shape myShape = new MyRectangle();
        myShape.X = 100.0f;
        myShape.Y = 100.0f;
        myShape.Draw();
        Console.WriteLine(myShape.Width);
        Console.WriteLine(myShape.IsAt(SplashKit.PointAt(150, 150)));
    }
}`,
            hints: [
              'The syntax is the same colon you used for interfaces last week: `class Child : Parent`.',
              'Nothing goes inside the braces. Not a constructor, not a field — that is the point of the step.',
              'public class MyRectangle : Shape',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w6-61-poly-kinds',
          title: 'Four kinds of polymorphism',
          blocks: [
            {
              t: 'text',
              md: `Polymorphism means "many forms", and the task sheet pauses to name all four kinds. Only one of them is what this week is about, but the other three are things you have been using since Week 2 without a name for them.`,
            },
            {
              t: 'table',
              caption: 'From the task sheet, after Wegner & Cardelli',
              headers: ['Kind', 'Example', 'What varies'],
              rows: [
                ['**Coercion**', '`float x = 10;`', 'The compiler converts the `int` literal to a `float`'],
                ['**Overloading**', '`FillRect(clr, x, y, w, h)` and `FillRect(clr, myRect)`', 'Two methods, one name — the compiler picks by argument types'],
                ['**Subtype**', '`Shape s = new MyRectangle();`', 'A subclass object used where the base type is expected'],
                ['**Universal**', '`List<Shape>` and `List<int>`', 'The type the class is parameterised over'],
              ],
            },
            {
              t: 'quiz',
              question:
                'Which kind of polymorphism lets `myDrawing.AddShape(new MyCircle())` compile, when `AddShape` takes a `Shape`?',
              options: ['Subtype', 'Overloading', 'Coercion', 'Universal'],
              answer: 0,
              why: [
                '',
                'Overloading is two methods sharing a name. There is only one `AddShape` here.',
                'Coercion converts between value types, like `int` to `float`. No conversion happens to the circle.',
                'Universal polymorphism is about generic types like `List<T>` — `AddShape` is not generic.',
              ],
              explain:
                'Subtype polymorphism: an object of a subclass is usable wherever an object of the base class is expected — in assignments, parameters and return values alike.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'The one that needs work',
              md: 'Subtype polymorphism gets you as far as *storing* a `MyCircle` in a `Shape` variable. It does **not** make the circle draw as a circle — for that you need `virtual` and `override`, which is the next step.',
            },
          ],
        },
        {
          id: 'w6-61-kind-enum',
          title: 'Choosing which kind to add',
          blocks: [
            {
              t: 'text',
              md: `Two shape classes means the program has to know which one the user wants. The task sheet's approach is an **enumeration**: \`ShapeKind\`, a variable \`kindToAdd\` initialised to \`ShapeKind.Circle\`, and two key checks in the event loop that change it.`,
            },
            {
              t: 'code',
              caption: 'Program.cs — as the task sheet asks for it',
              code: `public class Program
{
    private enum ShapeKind
    {
        Rectangle,
        Circle
    }

    public static void Main()
    {
        ShapeKind kindToAdd = ShapeKind.Circle;
        // ...
    }
}`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Nested types, and this playground',
              md: 'Declaring `enum ShapeKind` **inside** `Program` is deliberate: the type is only meaningful to `Program`, so encapsulating it there is the right call, and real C# allows it. This interpreter does not support nested types, so every runnable example below declares the enum at the top level instead. Write it nested in Visual Studio — that is what the task sheet is asking for.',
            },
            {
              t: 'code',
              caption: 'The event loop, after SplashKit.ClearScreen',
              code: `if (SplashKit.KeyTyped(KeyCode.RKey))
{
    kindToAdd = ShapeKind.Rectangle;
}

if (SplashKit.KeyTyped(KeyCode.CKey))
{
    kindToAdd = ShapeKind.Circle;
}

if (SplashKit.MouseClicked(MouseButton.LeftButton))
{
    Shape newShape;

    if (kindToAdd == ShapeKind.Circle)
    {
        newShape = new MyCircle();
    }
    else
    {
        newShape = new MyRectangle();
    }

    newShape.X = SplashKit.MouseX();
    newShape.Y = SplashKit.MouseY();
    myDrawing.AddShape(newShape);
}`,
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'A typo in the task sheet',
              md: 'Step 8.4 says the **C**-key should set `kindToAdd` to `ShapeKind.Rectangle`. It means `Circle` — follow it literally and the C key silently does nothing you can see. The code above has it right.',
            },
            {
              t: 'quiz',
              question:
                'Step 9 of the task sheet says the shape-creating code contains unnecessary duplication. Where is it?',
              options: [
                'The two lines setting X and Y were written inside both branches of the if',
                'The enum has two values that are never both used',
                'The R-key and C-key checks are nearly identical',
                'MyCircle and MyRectangle both inherit from Shape',
              ],
              answer: 0,
              why: [
                '',
                'Both values are used — one per key. An enum having several values is not duplication.',
                'They test different keys and set different values. Similar shape, different meaning.',
                'That is inheritance doing its job, and it is the opposite of duplication.',
              ],
              explain:
                'Every `Shape` knows its own location, so positioning it has nothing to do with which kind it is. Declare `Shape newShape;`, let the `if` decide which kind to build, then set `X` and `Y` once, below the branch — as in the code above.',
            },
          ],
        },
        {
          id: 'w6-61-virtual-override',
          title: 'virtual, then override',
          blocks: [
            {
              t: 'text',
              md: `Right now every shape still draws as a rectangle: the classes differ, the behaviour does not. To change that, \`Shape.Draw\` is marked **\`virtual\`** — which is C# for "a subclass is allowed to replace this" — and \`MyCircle\` supplies its own with **\`override\`**.

Marking it \`virtual\` is what turns the call into a **dynamically dispatched** one: at run time, the implementation chosen is the one belonging to the object's *actual* class, not to the type of the variable holding it.`,
            },
            {
              t: 'compare',
              title: 'The two halves of the same decision',
              left: {
                title: 'In Shape — permission',
                tone: 'neutral',
                code: `public virtual void Draw()
{
    SplashKit.FillRectangle(
        _color, _x, _y, _width, _height);
}`,
              },
              right: {
                title: 'In MyCircle — the replacement',
                tone: 'good',
                code: `public override void Draw()
{
    SplashKit.FillCircle(
        Color, X, Y, _radius);
}`,
              },
            },
            {
              t: 'callout',
              tone: 'trap',
              title: 'Why the circle uses Color, X and Y and not _color, _x and _y',
              md: 'Those fields are `private` in `Shape`, so a subclass cannot touch them — private means *this class only*, and inheriting does not change that. The public properties `Color`, `X` and `Y` are how `MyCircle` reaches its own position. (Marking them `protected` instead would also work; the task sheet keeps them private.)',
            },
          ],
          exercise: {
            prompt:
              'Write MyCircle: a private int _radius, a Radius property, a constructor setting _radius to 50, and an override of Draw that fills a circle.',
            seed: `public class MyCircle : Shape
{

}`,
            editable: { from: 3, to: 3 },
            tests: [
              {
                kind: 'structure',
                label: '_radius is a private int field',
                rule: { on: 'field', inClass: 'MyCircle', name: '_radius', visibility: 'private', type: 'int' },
              },
              {
                kind: 'structure',
                label: 'Radius is a read-write int property',
                rule: { on: 'property', inClass: 'MyCircle', name: 'Radius', hasGet: true, hasSet: true, type: 'int' },
              },
              {
                kind: 'structure',
                label: 'Draw is declared with the override keyword',
                rule: { on: 'method', inClass: 'MyCircle', name: 'Draw', params: 0, isOverride: true },
              },
              {
                kind: 'forbid',
                label: 'Draw fills a circle, not a rectangle',
                pattern: 'FillRectangle',
                message: 'MyCircle.Draw should call SplashKit.FillCircle — a rectangle is what you are replacing.',
              },
              {
                kind: 'output',
                label: 'The constructor sets the radius to 50',
                expect: '50',
              },
            ],
            harness: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private int _width;
    private int _height;

    public Shape()
    {
        _color = Color.{{color4}};
        _x = 0.0f;
        _y = 0.0f;
        _width = {{shapeParam}};
        _height = {{shapeParam}};
    }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public int Width { get { return _width; } set { _width = value; } }
    public int Height { get { return _height; } set { _height = value; } }

    public virtual void Draw()
    {
        SplashKit.FillRectangle(_color, _x, _y, _width, _height);
    }
}

public class __Check
{
    public static void Main()
    {
        Window w = new Window("Test", 800, 600);
        Shape s = new MyCircle();
        s.X = 200.0f;
        s.Y = 200.0f;
        s.Draw();
        MyCircle c = new MyCircle();
        Console.WriteLine(c.Radius);
    }
}`,
            hints: [
              'Three members and a constructor. The field and the property are the same pattern you have written every week.',
              'The constructor takes no parameters and does one thing: _radius = 50;',
              'public override void Draw() { SplashKit.FillCircle(Color, X, Y, _radius); } — capital Color, X and Y, because the fields behind them are private to Shape.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w6-61-drawoutline',
          title: 'An outline that fits the shape',
          blocks: [
            {
              t: 'text',
              md: `\`DrawOutline\` has the same problem \`Draw\` had: a rectangle drawn around a circle looks wrong. Mark \`Shape.DrawOutline\` \`virtual\` too, and give \`MyCircle\` its own — a **black circle, 2 pixels larger in radius**, drawn first so the shape's own fill covers the middle of it.`,
            },
          ],
          exercise: {
            prompt:
              'Override DrawOutline in MyCircle so it draws a black circle two pixels larger in radius than the circle itself.',
            seed: `public class MyCircle : Shape
{
    private int _radius;

    public MyCircle()
    {
        _radius = 50;
    }

    public int Radius { get { return _radius; } set { _radius = value; } }

    public override void Draw()
    {
        SplashKit.FillCircle(Color, X, Y, _radius);
    }

}`,
            editable: { from: 16, to: 16 },
            tests: [
              {
                kind: 'structure',
                label: 'DrawOutline is declared with the override keyword',
                rule: { on: 'method', inClass: 'MyCircle', name: 'DrawOutline', params: 0, isOverride: true },
              },
              {
                kind: 'forbid',
                label: 'The outline is a circle, not a rectangle',
                pattern: 'Rectangle',
                message: 'A circle\'s outline should be drawn with FillCircle or DrawCircle.',
              },
              {
                kind: 'runsClean',
                label: 'DrawOutline runs cleanly once a window exists',
              },
              {
                kind: 'output',
                label: 'Called through a Shape variable, the circle\'s own outline runs',
                expect: 'rectangle outline',
              },
            ],
            harness: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;

    public Shape()
    {
        _color = Color.{{color4}};
        _x = 0.0f;
        _y = 0.0f;
    }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }

    public virtual void Draw() { }

    public virtual void DrawOutline()
    {
        Console.WriteLine("rectangle outline");
    }
}

public class __Check
{
    public static void Main()
    {
        Window w = new Window("Test", 800, 600);
        Shape plain = new Shape();
        plain.DrawOutline();
        Shape circle = new MyCircle();
        circle.DrawOutline();
        circle.Draw();
    }
}`,
            hints: [
              'Same shape as the Draw override you just wrote — public override void DrawOutline().',
              'Black, and two pixels bigger: the colour is Color.Black and the radius is _radius + 2.',
              'SplashKit.FillCircle(Color.Black, X, Y, _radius + 2); — Draw runs after it, so the fill lands on top and only the rim shows.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w6-61-shape-slim',
          title: 'Moving what is not shared out of Shape',
          blocks: [
            {
              t: 'text',
              md: `Now the design problem the task sheet has been steering towards. \`Shape\` still carries \`_width\` and \`_height\` — and a circle has neither. A base class holding fields only some of its children can use is the same low-cohesion mistake lesson 2 described, in miniature.

So \`Shape\` keeps only what **every** shape has: colour, position, and whether it is selected. Four changes:

1. \`_width\`, \`_height\`, \`Width\` and \`Height\` move down to \`MyRectangle\`.
2. A new constructor \`Shape(Color color)\` sets \`_color\`, and \`_x\` and \`_y\` to \`0.0f\`.
3. The default constructor chains to it with \`this(Color.Yellow)\`.
4. \`Draw\` and \`DrawOutline\` become **empty**, and \`IsAt\` becomes \`virtual\` returning \`false\`.`,
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Empty bodies are a temporary answer',
              md: 'A `Draw` that does nothing is not a good method — it is a placeholder, so that everything still compiles while the subclasses take over. Two steps from now those bodies disappear entirely and become `abstract`. Notice how uncomfortable they feel in the meantime; that discomfort is the argument for `abstract`.',
            },
          ],
          exercise: {
            prompt:
              'Give Shape a constructor taking a colour, a no-argument constructor chaining to it with Color.Yellow, and virtual Draw, DrawOutline and IsAt that do nothing at all.',
            seed: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private bool _selected;

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public bool Selected { get { return _selected; } set { _selected = value; } }

}`,
            editable: { from: 12, to: 12 },
            tests: [
              {
                kind: 'structure',
                label: 'Shape has a constructor taking one parameter',
                rule: { on: 'ctor', inClass: 'Shape', params: 1 },
              },
              {
                kind: 'structure',
                label: 'Shape has a no-argument constructor',
                rule: { on: 'ctor', inClass: 'Shape', params: 0 },
              },
              {
                kind: 'structure',
                label: 'Draw is virtual and takes no parameters',
                rule: { on: 'method', inClass: 'Shape', name: 'Draw', params: 0, returns: 'void', isVirtual: true },
              },
              {
                kind: 'structure',
                label: 'DrawOutline is virtual and takes no parameters',
                rule: { on: 'method', inClass: 'Shape', name: 'DrawOutline', params: 0, returns: 'void', isVirtual: true },
              },
              {
                kind: 'structure',
                label: 'IsAt is virtual, takes a Point2D and returns bool',
                rule: { on: 'method', inClass: 'Shape', name: 'IsAt', params: 1, returns: 'bool', isVirtual: true },
              },
              {
                kind: 'forbid',
                label: 'Width and Height are gone from Shape',
                pattern: '_width|_height|Width|Height',
                message: 'Those belong to MyRectangle now — a circle has no width.',
              },
              {
                kind: 'output',
                label: 'The default constructor yields a yellow shape at the origin, and IsAt says false',
                expect: 'Yellow\n0\n0\nFalse\nRed',
              },
            ],
            harness: `public class __Check
{
    public static void Main()
    {
        Shape a = new Shape();
        Console.WriteLine(a.Color.Name);
        Console.WriteLine(a.X);
        Console.WriteLine(a.Y);
        Console.WriteLine(a.IsAt(SplashKit.PointAt(10, 10)));

        Shape b = new Shape(Color.Red);
        Console.WriteLine(b.Color.Name);
    }
}`,
            hints: [
              'The one-parameter constructor does the real work: _color = color; _x = 0.0f; _y = 0.0f;',
              'The no-argument one has an empty body — all it does is chain: public Shape() : this(Color.Yellow) { }',
              'public virtual void Draw() { } — genuinely nothing between the braces. IsAt is the same idea but has to return something: return false;',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w6-61-rect-ctors',
          title: 'MyRectangle takes back what is its own',
          blocks: [
            {
              t: 'text',
              md: `\`MyRectangle\` picks up the fields \`Shape\` just put down, and gains two constructors:

- one taking colour, position and size, which passes the colour up with **\`base(color)\`**;
- a no-argument one chaining to it with **\`this(...)\`**, defaulting to green, the origin, and **{{shapeParam}} × {{shapeParam}}** — that is 100 + the last two digits of your student ID.

Then it overrides all three methods, using the bodies \`Shape\` had in Task 5.1.`,
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'this(...) and base(...) are not alternatives',
              md: '`this(...)` chains to **another constructor in the same class**. `base(...)` chains to **the parent\'s** constructor. A constructor may use one or the other, never both — and if it uses neither, C# inserts a silent call to the parent\'s no-argument constructor for you.',
            },
          ],
          exercise: {
            prompt:
              'Give MyRectangle a five-argument constructor using base(color), a no-argument one chaining to it with this(...), and overrides of Draw, DrawOutline and IsAt.',
            seed: `public class MyRectangle : Shape
{
    private int _width;
    private int _height;

    public int Width { get { return _width; } set { _width = value; } }
    public int Height { get { return _height; } set { _height = value; } }

}`,
            editable: { from: 8, to: 8 },
            tests: [
              {
                kind: 'structure',
                label: 'A constructor takes colour, x, y, width and height',
                rule: { on: 'ctor', inClass: 'MyRectangle', params: 5 },
              },
              {
                kind: 'structure',
                label: 'A no-argument constructor exists',
                rule: { on: 'ctor', inClass: 'MyRectangle', params: 0 },
              },
              {
                kind: 'structure',
                label: 'Draw is declared with the override keyword',
                rule: { on: 'method', inClass: 'MyRectangle', name: 'Draw', params: 0, isOverride: true },
              },
              {
                kind: 'structure',
                label: 'DrawOutline is declared with the override keyword',
                rule: { on: 'method', inClass: 'MyRectangle', name: 'DrawOutline', params: 0, isOverride: true },
              },
              {
                kind: 'structure',
                label: 'IsAt is an override taking a Point2D and returning bool',
                rule: { on: 'method', inClass: 'MyRectangle', name: 'IsAt', params: 1, returns: 'bool', isOverride: true },
              },
              {
                kind: 'output',
                label: 'The default is a green {{shapeParam}}-pixel square at the origin that knows what it covers',
                expect: 'Green\n{{shapeParam}}\nTrue\nFalse\nBlue',
              },
            ],
            harness: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private bool _selected;

    public Shape(Color color)
    {
        _color = color;
        _x = 0.0f;
        _y = 0.0f;
    }

    public Shape() : this(Color.Yellow) { }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public bool Selected { get { return _selected; } set { _selected = value; } }

    public virtual void Draw() { }
    public virtual void DrawOutline() { }
    public virtual bool IsAt(Point2D pt) { return false; }
}

public class __Check
{
    public static void Main()
    {
        Window w = new Window("Test", 800, 600);

        MyRectangle d = new MyRectangle();
        Console.WriteLine(d.Color.Name);
        Console.WriteLine(d.Width);
        Console.WriteLine(d.IsAt(SplashKit.PointAt(10, 10)));
        Console.WriteLine(d.IsAt(SplashKit.PointAt(900, 900)));

        Shape r = new MyRectangle(Color.Blue, 50.0f, 60.0f, 20, 30);
        r.Draw();
        r.DrawOutline();
        Console.WriteLine(r.Color.Name);
    }
}`,
            hints: [
              'The five-argument constructor sets the size from its own parameters and the position through X and Y — the colour is the only thing it hands upwards: : base(color).',
              'public MyRectangle() : this(Color.Green, 0.0f, 0.0f, {{shapeParam}}, {{shapeParam}}) { } — an empty body again.',
              'The three overrides are Task 5.1\'s Shape methods, unchanged: FillRectangle for Draw, a black rectangle for DrawOutline, and the four-way bounds check for IsAt.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w6-61-isat-circle',
          title: 'A circle knows what it covers',
          blocks: [
            {
              t: 'text',
              md: `Selecting and deleting circles is still broken, because \`MyCircle\` has no \`IsAt\` of its own and \`Shape\`'s says \`false\` to everything.

The task sheet gives you the whole rule in one sentence: **if the distance between the centre of the circle and the point does not exceed the radius, the point is in the circle.** Straight-line distance is Pythagoras.`,
            },
            {
              t: 'code',
              caption: 'The distance between two points',
              code: `double dx = pt.X - X;
double dy = pt.Y - Y;
double distance = Math.Sqrt(dx * dx + dy * dy);`,
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'SplashKit will do it for you',
              md: 'The task sheet\'s hint points at `PointInCircle` and `CircleAt`, and `SplashKit.PointInCircle(pt, SplashKit.CircleAt(X, Y, _radius))` is a one-line answer that works here too. Write the maths at least once first — the interview may well ask how it works, and "SplashKit did it" is not an answer.',
            },
          ],
          exercise: {
            prompt:
              'Override IsAt in MyCircle so it returns true when the point is no further from the centre than the radius.',
            seed: `public class MyCircle : Shape
{
    private int _radius;

    public MyCircle(Color color, int radius) : base(color)
    {
        _radius = radius;
    }

    public MyCircle() : this(Color.Blue, {{circleRadius}}) { }

    public int Radius { get { return _radius; } set { _radius = value; } }

    public override void Draw()
    {
        SplashKit.FillCircle(Color, X, Y, _radius);
    }

    public override void DrawOutline()
    {
        SplashKit.FillCircle(Color.Black, X, Y, _radius + 2);
    }

}`,
            editable: { from: 24, to: 24 },
            tests: [
              {
                kind: 'structure',
                label: 'IsAt is an override taking a Point2D and returning bool',
                rule: { on: 'method', inClass: 'MyCircle', name: 'IsAt', params: 1, returns: 'bool', isOverride: true },
              },
              {
                kind: 'output',
                label: 'The centre, the rim and everything between are inside; anything further out is not',
                expect: 'True\nTrue\nFalse\nFalse',
              },
            ],
            harness: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private bool _selected;

    public Shape(Color color)
    {
        _color = color;
        _x = 0.0f;
        _y = 0.0f;
    }

    public Shape() : this(Color.Yellow) { }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public bool Selected { get { return _selected; } set { _selected = value; } }

    public virtual void Draw() { }
    public virtual void DrawOutline() { }
    public virtual bool IsAt(Point2D pt) { return false; }
}

public class __Check
{
    public static void Main()
    {
        Window w = new Window("Test", 800, 600);

        MyCircle c = new MyCircle(Color.Blue, 50);
        c.X = 100.0f;
        c.Y = 100.0f;

        Console.WriteLine(c.IsAt(SplashKit.PointAt(100, 100)));
        Console.WriteLine(c.IsAt(SplashKit.PointAt(140, 130)));
        Console.WriteLine(c.IsAt(SplashKit.PointAt(141, 130)));
        Console.WriteLine(c.IsAt(SplashKit.PointAt(100, 160)));
    }
}`,
            hints: [
              'Start with the two gaps: pt.X - X across, and pt.Y - Y down.',
              'Math.Sqrt(dx * dx + dy * dy) is the straight-line distance from the centre to the point.',
              'return Math.Sqrt(dx * dx + dy * dy) <= _radius; — "does not exceed" means <=, not <, so a point exactly on the rim counts.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w6-61-abstract',
          title: 'A promise with no body',
          blocks: [
            {
              t: 'text',
              md: `Look at what \`Shape\` is now. \`Draw\`, \`DrawOutline\` and \`IsAt\` all have bodies, every subclass overrides all three, and **not one override calls the inherited code**. The base implementations exist only so the compiler has something to point at.

That is exactly what \`abstract\` is for. An **abstract method** declares the signature and no body: it promises that every shape answers to \`Draw\`, and leaves the answering to the subclasses. A class with an abstract method must itself be **abstract**, and an abstract class cannot be instantiated.`,
            },
            {
              t: 'compare',
              title: 'The same requirement, two ways of saying it',
              left: {
                title: 'virtual with an empty body',
                tone: 'bad',
                code: `public virtual void Draw()
{
}`,
                md: 'A subclass **may** override. One that forgets silently draws nothing, and `new Shape()` still compiles.',
              },
              right: {
                title: 'abstract, no body at all',
                tone: 'good',
                code: `public abstract void Draw();`,
                md: 'A subclass **must** override, or it will not compile. `new Shape()` is now an error, which is correct — there is no such thing as a shape that is not some particular shape.',
              },
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Three uses of one word',
              md: 'An **abstract class** cannot be instantiated. An **abstract method** has no implementation and must be overridden. **Abstraction** is the general idea of separating what something offers from how it does it. The task sheet flags the overlap because it trips people up in exams.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'Abstract methods are implicitly virtual',
              md: 'You never write `abstract virtual` — that is a compile error. Being abstract already means "a derived class must override this", so `virtual` would be saying it twice.',
            },
          ],
          exercise: {
            prompt:
              'Make Shape abstract, and turn Draw, DrawOutline and IsAt into abstract methods with no bodies.',
            seed: `public class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private bool _selected;

    public Shape(Color color)
    {
        _color = color;
        _x = 0.0f;
        _y = 0.0f;
    }

    public Shape() : this(Color.Yellow) { }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public bool Selected { get { return _selected; } set { _selected = value; } }

    public virtual void Draw() { }
    public virtual void DrawOutline() { }
    public virtual bool IsAt(Point2D pt) { return false; }
}`,
            tests: [
              {
                kind: 'structure',
                label: 'Shape is declared abstract',
                rule: { on: 'class', name: 'Shape', exists: true, isAbstract: true },
              },
              {
                kind: 'structure',
                label: 'Draw is abstract',
                rule: { on: 'method', inClass: 'Shape', name: 'Draw', params: 0, isAbstract: true },
              },
              {
                kind: 'structure',
                label: 'DrawOutline is abstract',
                rule: { on: 'method', inClass: 'Shape', name: 'DrawOutline', params: 0, isAbstract: true },
              },
              {
                kind: 'structure',
                label: 'IsAt is abstract, takes a Point2D and returns bool',
                rule: { on: 'method', inClass: 'Shape', name: 'IsAt', params: 1, returns: 'bool', isAbstract: true },
              },
              {
                kind: 'forbid',
                label: 'The two constructors survive the change',
                pattern: 'abstract\\s+class\\s+Shape[\\s\\S]*?public\\s+Shape\\s*\\(\\s*\\)\\s*\\{',
                message: 'The no-argument constructor should still chain with : this(Color.Yellow), not gain a body of its own.',
              },
              {
                kind: 'output',
                label: 'A MyCircle still builds and answers all three',
                expect: 'Blue\nTrue',
              },
            ],
            harness: `public class MyCircle : Shape
{
    private int _radius;

    public MyCircle(Color color, int radius) : base(color)
    {
        _radius = radius;
    }

    public MyCircle() : this(Color.Blue, {{circleRadius}}) { }

    public int Radius { get { return _radius; } set { _radius = value; } }

    public override void Draw()
    {
        SplashKit.FillCircle(Color, X, Y, _radius);
    }

    public override void DrawOutline()
    {
        SplashKit.FillCircle(Color.Black, X, Y, _radius + 2);
    }

    public override bool IsAt(Point2D pt)
    {
        double dx = pt.X - X;
        double dy = pt.Y - Y;
        return Math.Sqrt(dx * dx + dy * dy) <= _radius;
    }
}

public class __Check
{
    public static void Main()
    {
        Window w = new Window("Test", 800, 600);
        Shape s = new MyCircle();
        s.X = 100.0f;
        s.Y = 100.0f;
        s.Draw();
        s.DrawOutline();
        Console.WriteLine(s.Color.Name);
        Console.WriteLine(s.IsAt(SplashKit.PointAt(110, 110)));
    }
}`,
            hints: [
              'Two kinds of edit: the word abstract goes on the class declaration, and on each of the three methods.',
              'An abstract method has no braces at all — it ends with a semicolon: public abstract void Draw();',
              'IsAt keeps its signature but loses its body and its return: public abstract bool IsAt(Point2D pt); — leave both constructors and all four properties exactly as they are.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w6-61-myline',
          title: 'A third kind, with nothing to change but MyLine',
          blocks: [
            {
              t: 'text',
              md: `The pay-off. \`MyLine\` is a \`Shape\` that knows an end point as well as a start, draws itself **red** by default, and answers \`IsAt\` by asking whether the point sits on the line.

Nothing else in the program changes. Not \`Drawing\`, not \`Shape\`, not the other two subclasses — that is what the whole refactor was for.`,
            },
            {
              t: 'callout',
              tone: 'tip',
              title: 'The two hints the task sheet gives you',
              md: 'For **`DrawOutline`**, draw small circles around the start and end points — an outline "around" a line is not obvious otherwise. For **`IsAt`**, use `SplashKit.PointOnLine(pt, SplashKit.LineFrom(X, Y, _endX, _endY))`; the point-to-segment maths by hand is a much bigger job than the circle\'s was.',
            },
            {
              t: 'callout',
              tone: 'note',
              title: 'You only get one mouse position',
              md: 'A click gives you the start of the line and nothing else, so the task sheet says to hard-code the end point offset. Any values are fine — the seed below uses +100 across and +50 down.',
            },
          ],
          exercise: {
            prompt:
              'Complete MyLine: override Draw to draw the line, DrawOutline to mark both ends, and IsAt to report whether the point is on the line.',
            seed: `public class MyLine : Shape
{
    private float _endX;
    private float _endY;

    public MyLine(Color color, float startX, float startY, float endX, float endY) : base(color)
    {
        X = startX;
        Y = startY;
        _endX = endX;
        _endY = endY;
    }

    public MyLine() : this(Color.Red, 0.0f, 0.0f, 100.0f, 50.0f) { }

    public float EndX { get { return _endX; } set { _endX = value; } }
    public float EndY { get { return _endY; } set { _endY = value; } }

}`,
            editable: { from: 19, to: 19 },
            tests: [
              {
                kind: 'structure',
                label: 'Draw is declared with the override keyword',
                rule: { on: 'method', inClass: 'MyLine', name: 'Draw', params: 0, isOverride: true },
              },
              {
                kind: 'structure',
                label: 'DrawOutline is declared with the override keyword',
                rule: { on: 'method', inClass: 'MyLine', name: 'DrawOutline', params: 0, isOverride: true },
              },
              {
                kind: 'structure',
                label: 'IsAt is an override taking a Point2D and returning bool',
                rule: { on: 'method', inClass: 'MyLine', name: 'IsAt', params: 1, returns: 'bool', isOverride: true },
              },
              {
                kind: 'output',
                label: 'A default line is red, and knows which points lie on it',
                expect: 'Red\nTrue\nTrue\nFalse',
              },
            ],
            harness: `public abstract class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private bool _selected;

    public Shape(Color color)
    {
        _color = color;
        _x = 0.0f;
        _y = 0.0f;
    }

    public Shape() : this(Color.Yellow) { }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public bool Selected { get { return _selected; } set { _selected = value; } }

    public abstract void Draw();
    public abstract void DrawOutline();
    public abstract bool IsAt(Point2D pt);
}

public class __Check
{
    public static void Main()
    {
        Window w = new Window("Test", 800, 600);

        Shape line = new MyLine();
        line.Draw();
        line.DrawOutline();
        Console.WriteLine(line.Color.Name);

        MyLine flat = new MyLine(Color.Red, 10.0f, 10.0f, 110.0f, 10.0f);
        Console.WriteLine(flat.IsAt(SplashKit.PointAt(60, 10)));
        Console.WriteLine(flat.IsAt(SplashKit.PointAt(110, 10)));
        Console.WriteLine(flat.IsAt(SplashKit.PointAt(60, 40)));
    }
}`,
            hints: [
              'Draw is one call: SplashKit.DrawLine(Color, X, Y, _endX, _endY);',
              'DrawOutline draws two small black circles, one at (X, Y) and one at (_endX, _endY) — radius 4 or so is plenty.',
              'return SplashKit.PointOnLine(pt, SplashKit.LineFrom(X, Y, _endX, _endY)); — LineFrom builds the line, PointOnLine tests the point against it.',
            ],
            tool: 'tests',
          },
        },
        {
          id: 'w6-61-interactive',
          title: 'Put it all together',
          blocks: [
            {
              t: 'text',
              md: `Everything, running. **R**, **C** and **L** choose which kind the next click adds; **left-click** adds it at the cursor; **right-click** selects whatever is underneath; **Delete** or **Backspace** removes everything selected; **space** randomises the background.

The last piece is the task sheet's step 26: after **L**, the program adds up to **{{lineCount}} parallel lines** at once — the last digit of your student ID.`,
            },
            {
              t: 'runnable',
              tool: 'canvas',
              autoRun: true,
              caption: 'R / C / L to choose a kind, click to add, right-click to select, Delete to remove',
              code: `public enum ShapeKind
{
    Rectangle,
    Circle,
    Line
}

public abstract class Shape
{
    private Color _color;
    private float _x;
    private float _y;
    private bool _selected;

    public Shape(Color color)
    {
        _color = color;
        _x = 0.0f;
        _y = 0.0f;
    }

    public Shape() : this(Color.Yellow) { }

    public Color Color { get { return _color; } set { _color = value; } }
    public float X { get { return _x; } set { _x = value; } }
    public float Y { get { return _y; } set { _y = value; } }
    public bool Selected { get { return _selected; } set { _selected = value; } }

    public abstract void Draw();
    public abstract void DrawOutline();
    public abstract bool IsAt(Point2D pt);
}

public class MyRectangle : Shape
{
    private int _width;
    private int _height;

    public MyRectangle(Color color, float x, float y, int width, int height) : base(color)
    {
        X = x;
        Y = y;
        _width = width;
        _height = height;
    }

    public MyRectangle() : this(Color.Green, 0.0f, 0.0f, {{shapeParam}}, {{shapeParam}}) { }

    public int Width { get { return _width; } set { _width = value; } }
    public int Height { get { return _height; } set { _height = value; } }

    public override void Draw()
    {
        if (Selected)
        {
            DrawOutline();
        }
        SplashKit.FillRectangle(Color, X, Y, _width, _height);
    }

    public override void DrawOutline()
    {
        SplashKit.FillRectangle(Color.Black, X - {{outlineWidth}}, Y - {{outlineWidth}},
            _width + 2 * {{outlineWidth}}, _height + 2 * {{outlineWidth}});
    }

    public override bool IsAt(Point2D pt)
    {
        return pt.X > X && pt.X < X + _width && pt.Y > Y && pt.Y < Y + _height;
    }
}

public class MyCircle : Shape
{
    private int _radius;

    public MyCircle(Color color, int radius) : base(color)
    {
        _radius = radius;
    }

    public MyCircle() : this(Color.Blue, {{circleRadius}}) { }

    public int Radius { get { return _radius; } set { _radius = value; } }

    public override void Draw()
    {
        if (Selected)
        {
            DrawOutline();
        }
        SplashKit.FillCircle(Color, X, Y, _radius);
    }

    public override void DrawOutline()
    {
        SplashKit.FillCircle(Color.Black, X, Y, _radius + {{outlineWidth}});
    }

    public override bool IsAt(Point2D pt)
    {
        double dx = pt.X - X;
        double dy = pt.Y - Y;
        return Math.Sqrt(dx * dx + dy * dy) <= _radius;
    }
}

public class MyLine : Shape
{
    private float _endX;
    private float _endY;

    public MyLine(Color color, float startX, float startY, float endX, float endY) : base(color)
    {
        X = startX;
        Y = startY;
        _endX = endX;
        _endY = endY;
    }

    public MyLine() : this(Color.Red, 0.0f, 0.0f, 100.0f, 50.0f) { }

    public float EndX { get { return _endX; } set { _endX = value; } }
    public float EndY { get { return _endY; } set { _endY = value; } }

    public override void Draw()
    {
        if (Selected)
        {
            DrawOutline();
        }
        SplashKit.DrawLine(Color, X, Y, _endX, _endY);
    }

    public override void DrawOutline()
    {
        SplashKit.DrawCircle(Color.Black, X, Y, 4);
        SplashKit.DrawCircle(Color.Black, _endX, _endY, 4);
    }

    public override bool IsAt(Point2D pt)
    {
        return SplashKit.PointOnLine(pt, SplashKit.LineFrom(X, Y, _endX, _endY));
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
    public int ShapeCount { get { return _shapes.Count; } }

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
    public static void Main()
    {
        Window w = new Window("Shape Drawer", 800, 600);
        Drawing myDrawing = new Drawing();
        ShapeKind kindToAdd = ShapeKind.Circle;

        do
        {
            SplashKit.ProcessEvents();

            if (SplashKit.KeyTyped(KeyCode.RKey)) { kindToAdd = ShapeKind.Rectangle; }
            if (SplashKit.KeyTyped(KeyCode.CKey)) { kindToAdd = ShapeKind.Circle; }
            if (SplashKit.KeyTyped(KeyCode.LKey)) { kindToAdd = ShapeKind.Line; }

            if (SplashKit.MouseClicked(MouseButton.LeftButton))
            {
                float mx = SplashKit.MouseX();
                float my = SplashKit.MouseY();

                if (kindToAdd == ShapeKind.Line)
                {
                    // Step 26: up to {{lineCount}} parallel lines at a time.
                    for (int i = 0; i < {{lineCount}}; i++)
                    {
                        float top = my + i * 14;
                        myDrawing.AddShape(new MyLine(Color.Red, mx, top, mx + 120, top));
                    }
                }
                else
                {
                    Shape newShape;

                    if (kindToAdd == ShapeKind.Circle)
                    {
                        newShape = new MyCircle();
                    }
                    else
                    {
                        newShape = new MyRectangle();
                    }

                    newShape.X = mx;
                    newShape.Y = my;
                    myDrawing.AddShape(newShape);
                }
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
              tone: 'key',
              title: 'What Drawing knows about circles',
              md: 'Nothing. `Drawing` is unchanged from Task 5.1 — it calls `Draw`, `IsAt` and `Selected` on things typed as `Shape`, and the object decides what those mean. Three shape kinds arrived and the container never noticed.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 5
    {
      id: 'w6-checkpoint',
      title: 'Week 6 checkpoint',
      kind: 'quiz',
      minutes: 20,
      summary: 'The design vocabulary and the C# it turns into, asked the way the unit asks it.',
      steps: [
        {
          id: 'w6-cp-warmup',
          title: 'From memory first',
          blocks: [
            {
              t: 'text',
              md: 'Two answers, written before you see any options. RDD questions are almost never about recognising a word — they are about placing a responsibility, which needs a reason.',
            },
            {
              t: 'recall',
              prompt:
                'Name RDD\'s three steps and what each produces. Then: what does `abstract` mean, applied to a class and applied to a method, and what does it buy you over a virtual method with an empty body?',
              nudge: 'One of these is a design process with no code in it. The other is a compiler-enforced promise.',
              points: [
                'Step 1 roles, step 2 responsibilities (knows / does), step 3 collaborations',
                'Knows become attributes, does become methods',
                'An abstract class cannot be instantiated',
                'An abstract method has no body and must be overridden by any concrete subclass',
                'Empty virtual bodies let a subclass silently forget; abstract makes forgetting a compile error',
                'It also removes `new Shape()`, which was never a meaningful thing to write',
              ],
            },
          ],
        },
        {
          id: 'w6-cp-rdd',
          title: 'Roles and responsibilities',
          blocks: [
            {
              t: 'quiz',
              question:
                'A team is designing a Hospital Management System. Which is the **best** first move?',
              options: [
                'List candidate roles from the nouns in the brief — Patient, Doctor, Appointment, Receptionist',
                'Design the database tables for patients and appointments',
                'Decide which classes will be abstract',
                'Write the method signatures for the booking system',
              ],
              answer: 0,
              why: [
                '',
                'Persistence is an implementation concern. The design has to exist before you can know what to store.',
                'Abstraction decisions come out of the responsibilities, once you know what is shared.',
                'Signatures are step 2 at the earliest, and really step 2 written down in code.',
              ],
              explain:
                'The W6b activity works exactly this way: read the brief, list the roles, and only then ask what each one knows and does.',
            },
            {
              t: 'quiz',
              question:
                'For the Hospital Management System, which responsibility most likely belongs to `Hospital` rather than to `Patient`?',
              options: [
                'Knowing the list of doctors, and enabling a booking',
                'Knowing a name, date of birth and contact details',
                'Knowing which symptoms brought this person in',
                'Knowing the date of this person\'s last visit',
              ],
              answer: 0,
              why: [
                '',
                'Those are one person\'s own details — `Patient` is the information expert for them.',
                'Symptoms belong to the patient or to their record, not to the institution.',
                'That is one person\'s history, held by `Patient` or `PatientRecords`.',
              ],
              explain:
                'From the W6b worked answer: `Hospital` knows the lists of patients, doctors, nurses and receptionists, and does the system-level jobs — add/remove, search, enable booking, assign care. Anything that is one person\'s own data belongs to that person\'s role.',
            },
            {
              t: 'quiz',
              question:
                'You are told a class has "low cohesion". What does that mean?',
              options: [
                'It groups functionality that is not really related, so it has many reasons to change',
                'It depends on too many other classes',
                'It has too few methods to be useful',
                'Its methods are too long',
              ],
              answer: 0,
              why: [
                '',
                'That is high *coupling*. The two are easy to swap by accident, and the exam knows it.',
                'Cohesion is about whether the members belong together, not how many there are.',
                'Method length is a code-style concern, not a measure of cohesion.',
              ],
              explain:
                'Cohesion is *within* a class, coupling is *between* classes. High cohesion and loose coupling are the pair you want; getting the words the wrong way round is the most common slip on this topic.',
            },
          ],
        },
        {
          id: 'w6-cp-uml',
          title: 'Reading the lines',
          blocks: [
            {
              t: 'quiz',
              question:
                'A method takes a `Catalog` as a parameter, uses it, and never stores it. Which relationship is that?',
              options: ['Dependency', 'Association', 'Aggregation', 'Composition'],
              answer: 0,
              why: [
                '',
                'An association is permanent — it would mean the class holds on to the catalog.',
                'Aggregation is a whole–part relationship held over time, drawn with a diamond.',
                'Composition would additionally tie the catalog\'s lifetime to this class\'s.',
              ],
              explain:
                'Dependency is the weakest link there is: a dashed line with an open arrowhead, meaning "uses this, briefly". Parameters and local variables are the usual cause.',
            },
            {
              t: 'quiz',
              question:
                'In a UML class diagram, what does a solid line with a hollow triangle pointing at the upper class mean?',
              options: [
                'The lower class inherits from the upper one',
                'The upper class contains instances of the lower one',
                'The lower class temporarily uses the upper one',
                'The two classes are associated bidirectionally',
              ],
              answer: 0,
              why: [
                '',
                'Containment is a diamond at the containing end, not a triangle.',
                'Temporary use is a dashed line with an open arrowhead.',
                'A plain association is a plain line, with no head at either end.',
              ],
              explain:
                'Triangle means "is-a", and it always points at the parent. In Task 6.1 that is three triangles all pointing at `Shape`.',
            },
            {
              t: 'quiz',
              question:
                'Which sequence-diagram fragment corresponds to an `if` with no `else`?',
              options: ['`opt`', '`alt`', '`loop`', '`ref`'],
              answer: 0,
              why: [
                '',
                '`alt` has two or more branches — that is `if` / `else`.',
                '`loop` is repetition, a `for` or a `while`.',
                '`ref` points at another diagram; it is not control flow at all.',
              ],
              explain:
                '`opt` wraps messages that happen only when a condition holds, e.g. `opt [match = true]` around adding a study unit.',
            },
          ],
        },
        {
          id: 'w6-cp-abstract-predict',
          title: 'Predict: creating the base class',
          blocks: [
            {
              t: 'predict',
              question: 'What happens when this runs?',
              caption: 'Shape.cs',
              code: `public abstract class Shape
{
    public abstract void Draw();
}

public class MyCircle : Shape
{
    public override void Draw()
    {
        Console.WriteLine("circle");
    }
}

public class Program
{
    public static void Main()
    {
        Shape s = new Shape();
        s.Draw();
    }
}`,
              options: [
                'It refuses to run — `Shape` is abstract, so no `Shape` object can be created',
                'circle',
                'It runs and prints nothing, because `Draw` has no body',
                'It refuses to run — `MyCircle` is never used',
              ],
              answer: 0,
              why: [
                '',
                'That would need `new MyCircle()`. The declared type on the left changes nothing about which object gets built.',
                'There is no object to call `Draw` on — the failure happens at `new Shape()`, one line earlier.',
                'An unused class is perfectly legal; it is not an error to declare something you do not instantiate.',
              ],
              explain:
                '`abstract` says this class describes what its children share and is never a whole thing itself. `Shape s = ...` is fine — a `Shape`-typed variable is exactly how you use the hierarchy — but the object on the right has to be some concrete kind.',
              expect: { errorContains: 'abstract' },
            },
          ],
        },
        {
          id: 'w6-cp-dispatch-predict',
          title: 'Predict: one loop, three kinds',
          blocks: [
            {
              t: 'predict',
              question: 'What does this print?',
              caption: 'Program.cs',
              code: `public abstract class Shape
{
    public abstract string Name();

    public void Describe()
    {
        Console.WriteLine("I am a " + Name());
    }
}

public class MyCircle : Shape
{
    public override string Name() { return "circle"; }
}

public class MyRectangle : Shape
{
    public override string Name() { return "rectangle"; }
}

public class Program
{
    public static void Main()
    {
        List<Shape> shapes = new List<Shape>();
        shapes.Add(new MyCircle());
        shapes.Add(new MyRectangle());

        foreach (Shape s in shapes)
        {
            s.Describe();
        }
    }
}`,
              options: [
                'I am a circle\nI am a rectangle',
                'I am a \nI am a ',
                'I am a circle\nI am a circle',
                'It refuses to compile — `Describe` calls a method with no body',
              ],
              answer: 0,
              why: [
                '',
                'An abstract method is not an empty one. It has no body precisely because the subclass is required to supply it.',
                'Each element is a different object, and each one answers `Name()` for itself.',
                '`Describe` is calling a method that is *guaranteed* to exist on every subclass — that guarantee is what abstract buys.',
              ],
              explain:
                'Code in the base class calling down into an implementation the base class does not have. `Describe` is written once, in `Shape`, and works for every kind of shape that will ever exist — which is the same reason `Drawing` never had to learn about circles.',
              expect: { output: 'I am a circle\nI am a rectangle' },
            },
          ],
        },
        {
          id: 'w6-cp-ctor-predict',
          title: 'Predict: which constructor runs first',
          blocks: [
            {
              t: 'text',
              md: 'Task 6.1 has you chain constructors in both directions — `this(...)` sideways and `base(...)` upwards. The order they actually run in is worth being sure about.',
            },
            {
              t: 'predict',
              question: 'What does `new MyCircle()` print?',
              caption: 'Program.cs',
              code: `public class Shape
{
    public Shape(Color color)
    {
        Console.WriteLine("Shape(color)");
    }

    public Shape() : this(Color.Yellow)
    {
        Console.WriteLine("Shape()");
    }
}

public class MyCircle : Shape
{
    public MyCircle(Color color, int radius) : base(color)
    {
        Console.WriteLine("MyCircle(color, radius)");
    }

    public MyCircle() : this(Color.Blue, 50)
    {
        Console.WriteLine("MyCircle()");
    }
}

public class Program
{
    public static void Main()
    {
        MyCircle c = new MyCircle();
    }
}`,
              options: [
                'Shape(color)\nMyCircle(color, radius)\nMyCircle()',
                'MyCircle()\nMyCircle(color, radius)\nShape(color)',
                'Shape()\nShape(color)\nMyCircle(color, radius)\nMyCircle()',
                'Shape(color)\nShape()\nMyCircle(color, radius)\nMyCircle()',
              ],
              answer: 0,
              why: [
                '',
                'Reversed. A constructor delegates *before* running its own body, so the innermost one finishes first.',
                '`Shape()` never runs — `MyCircle(color, radius)` chains to `base(color)`, which is the one-parameter constructor.',
                'Same mistake: nothing calls the no-argument `Shape()`, so its line never prints.',
              ],
              explain:
                'Follow the chain down before any body runs: `MyCircle()` → `this(Color.Blue, 50)` → `base(color)`. `Shape(Color)` is the deepest, so its body runs first, then `MyCircle(color, radius)`, then `MyCircle()`. And `Shape()` is skipped entirely, because `base(color)` names the one-parameter constructor.',
              expect: { output: 'Shape(color)\nMyCircle(color, radius)\nMyCircle()' },
            },
          ],
        },
        {
          id: 'w6-cp-parsons',
          title: 'Rebuild MyCircle',
          blocks: [
            {
              t: 'text',
              md: 'Every line is correct. The order is not — and two of them have to come in the right sequence for the class to compile at all.',
            },
            {
              t: 'parsons',
              caption: 'MyCircle.cs',
              prompt: 'Order a subclass with two chained constructors, a property, and three overrides.',
              lines: [
                'public class MyCircle : Shape',
                '{',
                '    private int _radius;',
                '    public MyCircle(Color color, int radius) : base(color) { _radius = radius; }',
                '    public MyCircle() : this(Color.Blue, 50) { }',
                '    public int Radius { get { return _radius; } set { _radius = value; } }',
                '    public override void Draw() { SplashKit.FillCircle(Color, X, Y, _radius); }',
                '    public override void DrawOutline() { SplashKit.FillCircle(Color.Black, X, Y, _radius + 2); }',
                '    public override bool IsAt(Point2D pt) { return SplashKit.PointInCircle(pt, SplashKit.CircleAt(X, Y, _radius)); }',
                '}',
              ],
              explain:
                'The two-argument constructor has to exist before `this(Color.Blue, 50)` can chain to it, and `base(color)` is what hands the colour up to `Shape` — the only way to set a field that is private up there. `Draw` reaches its own position through the properties `Color`, `X` and `Y` for exactly the same reason.',
            },
          ],
        },
        {
          id: 'w6-cp-mixed',
          title: 'A short mixed paper',
          blocks: [
            {
              t: 'text',
              md: 'Six questions across the week, in no particular order. Twenty seconds each, nothing to run.',
            },
            {
              t: 'quiz',
              question: 'Which keyword allows a subclass to replace a method it inherits?',
              options: ['`virtual`', '`sealed`', '`static`', '`readonly`'],
              answer: 0,
              why: [
                '',
                '`sealed` does the opposite — it forbids further overriding.',
                '`static` belongs to the class rather than an instance, and cannot be overridden at all.',
                '`readonly` is about fields that cannot be reassigned after construction.',
              ],
              explain:
                'A method must be `virtual` (or `abstract`, which implies it) before a subclass may `override` it. Without that permission, C# will not let the override compile.',
            },
            {
              t: 'quiz',
              question: 'Which of these is **not** legal C#?',
              options: [
                '`public abstract virtual void Draw();`',
                '`public abstract void Draw();`',
                '`public virtual void Draw() { }`',
                '`public override void Draw() { }`',
              ],
              answer: 0,
              why: [
                '',
                'That is exactly how an abstract method is declared: signature, semicolon, no body.',
                'A virtual method with an empty body is legal, if usually a sign that abstract was wanted.',
                'A normal override in a subclass.',
              ],
              explain:
                'Abstract methods are implicitly virtual, so writing both is a compile error. There is no need to grant permission to override something that must be overridden.',
            },
            {
              t: 'quiz',
              question:
                'A class contains one abstract method. What else must be true?',
              options: [
                'The class itself must be declared abstract',
                'The class must implement at least one interface',
                'The class must have no constructors',
                'The class must have no fields',
              ],
              answer: 0,
              why: [
                '',
                'Interfaces are unrelated to whether a class has abstract members.',
                'Abstract classes routinely have constructors — `Shape(Color color)` is one, called by every subclass through `base`.',
                'They routinely have fields too. `Shape` keeps `_color`, `_x`, `_y` and `_selected`.',
              ],
              explain:
                'A class with an abstract member is incomplete, so it cannot be instantiated, so it must say `abstract`. It may still hold fields, properties and constructors for its subclasses to inherit and chain to.',
            },
            {
              t: 'quiz',
              question:
                'Why does `MyCircle.Draw` use the property `X` rather than the field `_x`?',
              options: [
                '`_x` is private to `Shape`, and private means that class only — inheriting does not grant access',
                'Properties are faster than fields in C#',
                'Fields cannot be read from inside a Draw method',
                '`_x` does not exist once `Shape` is abstract',
              ],
              answer: 0,
              why: [
                '',
                'A property is a method call around a field, so if anything it is marginally slower. Speed is not the reason.',
                'Fields can be read anywhere access allows — the restriction here is the access level, not the method.',
                'Abstract changes whether the class can be instantiated, not which fields it has.',
              ],
              explain:
                'Task 6.1\'s own note says so. `protected` would grant subclasses access; `private` deliberately does not, so `MyCircle` goes through the public property like anyone else would.',
            },
            {
              t: 'quiz',
              question:
                'After Task 6.1, how many changes does `Drawing` need in order to support circles and lines?',
              options: [
                'None',
                'One, to add a shape-kind check in Draw',
                'Two, one in Draw and one in SelectShapesAt',
                'Three, one per shape kind',
              ],
              answer: 0,
              why: [
                '',
                'A kind check inside `Draw` is exactly the design the hierarchy exists to avoid.',
                'Both of those call methods on `Shape`, and the object supplies the right implementation.',
                'Needing one change per kind is the symptom that says the polymorphism is not doing its job.',
              ],
              explain:
                '`Drawing` only ever calls `Draw`, `IsAt` and `Selected` on things typed `Shape`. That is the payoff — a fourth shape kind would also need zero changes to it.',
            },
            {
              t: 'quiz',
              question:
                'Which UML relationship holds between `Drawing` and `Shape`?',
              options: ['Aggregation', 'Inheritance', 'Dependency', 'Composition'],
              answer: 0,
              why: [
                '',
                'A drawing is not a kind of shape, and a shape is not a kind of drawing.',
                'The shapes are held in a field over the whole life of the drawing, not used for one call.',
                'Composition would mean the shapes cannot exist without the drawing — but you build one and then add it.',
              ],
              explain:
                '`Drawing` holds a `List<Shape>` as a field, and a shape exists before it is added and survives being removed. Open diamond at the `Drawing` end — the same relationship `Inventory` has with `Item`.',
            },
            {
              t: 'callout',
              tone: 'key',
              title: 'Where to go from here',
              md: 'The midterm covers **Weeks 1–5 only** — this week\'s RDD theory is not on it. If the test is close, spend your time in **Concept focus** on the home page. Week 7 picks RDD back up properly, and adds saving and loading your drawing to a file.',
            },
          ],
        },
      ],
    },

    // ================================================================ lesson 6
    {
      id: 'w6-interview',
      title: 'Lab interview drill',
      kind: 'interview',
      minutes: 10,
      summary: 'Rehearse explaining abstract, override and your Shape hierarchy out loud before your tutor asks.',
      steps: [
        {
          id: 'w6-int-1',
          title: 'Same rubric as every week',
          blocks: [
            {
              t: 'callout',
              tone: 'key',
              md: 'Finishing the code caps you at 70%. The last 30% is entirely about explaining **why** — and this week the why is design, which is exactly what the questions below are about.',
            },
          ],
        },
      ],
    },
  ],
};

/** Interview questions for Week 6, asked against the student's own code. */
export const week6Interview: InterviewQuestion[] = [
  {
    id: 'w6-q1',
    question: 'Why is Shape abstract, rather than a normal class with empty Draw and DrawOutline methods?',
    lookingFor: [
      'There is no such thing as a shape that is not some particular kind of shape, so `new Shape()` should not be possible',
      'Abstract makes overriding compulsory — a subclass that forgets Draw will not compile',
      'With empty virtual bodies, a subclass that forgets silently draws nothing, which is far harder to find',
    ],
    aboutStep: 'w6-61-abstract',
  },
  {
    id: 'w6-q2',
    question: 'Why did _width and _height move out of Shape and down into MyRectangle?',
    lookingFor: [
      'A circle has no width or height — carrying them on Shape gives every shape fields most of them cannot use',
      'The base class should hold only what every shape genuinely shares: colour, position, selected',
      'This is cohesion: each class holds the data its own responsibilities need, and no more',
    ],
    aboutStep: 'w6-61-shape-slim',
  },
  {
    id: 'w6-q3',
    question: 'How many changes did Drawing need when you added MyCircle and MyLine? Why?',
    lookingFor: [
      'None at all',
      'Drawing only ever calls Draw, IsAt and Selected on variables typed Shape',
      'Dynamic dispatch picks the right implementation from the object, not from the variable\'s declared type',
      'Adding a fourth shape kind would also need zero changes to Drawing',
    ],
    aboutStep: 'w6-61-interactive',
  },
  {
    id: 'w6-q4',
    question: 'Your MyCircle.Draw uses Color, X and Y with capitals. Why not _color, _x and _y?',
    lookingFor: [
      'Those fields are private in Shape, and private means that class only — a subclass does not get access',
      'The public properties are the supported way for MyCircle to reach its own inherited position',
      'Marking them protected would grant access to subclasses; the task sheet deliberately keeps them private',
    ],
    aboutStep: 'w6-61-virtual-override',
  },
  {
    id: 'w6-q5',
    question: 'Walk me through what happens, in order, when your program runs new MyCircle().',
    lookingFor: [
      'The no-argument constructor chains sideways first, with this(Color.Blue, ...)',
      'That constructor chains upwards with base(color) before running its own body',
      'Shape(Color) runs first, then MyCircle(color, radius), then the no-argument constructor\'s body',
      'The no-argument Shape() never runs, because base(color) names the one-parameter version',
    ],
    aboutStep: 'w6-61-rect-ctors',
  },
  {
    id: 'w6-q6',
    question: 'RDD talks about what a role "knows" and what it "does". Point at both in your own Shape hierarchy.',
    lookingFor: [
      'Knows becomes attributes: Shape knows its colour, position and whether it is selected; MyCircle also knows its radius',
      'Does becomes methods: every shape can Draw, DrawOutline and answer IsAt',
      'The knows split across the hierarchy exactly where the responsibility does — radius sits with the class that needs it',
    ],
  },
  {
    id: 'w6-q7',
    question: 'Your IsAt for MyLine calls SplashKit.PointOnLine. What would you have had to write yourself otherwise?',
    lookingFor: [
      'The shortest distance from the point to the line **segment**, compared against a small tolerance',
      'Not the infinite line — a point far past the end of the segment should not count',
      'Compare with MyCircle, where the maths was short enough to write by hand: distance from centre <= radius',
    ],
    aboutStep: 'w6-61-myline',
  },
];
