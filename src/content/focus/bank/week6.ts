/**
 * Week 6 question bank — responsibility-driven design.
 *
 * Sourced from Quiz 6 (14 questions, all of them) and the W6a/W6b slide decks
 * as transcribed in `Lecture 6.md`. Worth knowing while revising: the *Week 6
 * lecture recording* is not about RDD at all — it was spent on midterm
 * logistics and Week 7's save/load code — so the decks are the only real
 * source, and `week6.ts` in the lesson portal is built from them too.
 *
 * This week was deliberately excluded from the midsemester test ("the theory
 * of week six is not included in your midterm test"). On the final it is
 * squarely examinable: it is the first of the six theory weeks.
 */

import type { FocusQuestion } from '../types';

export const WEEK6: FocusQuestion[] = [
  // ------------------------------------------------------- the RDD process
  {
    id: 'w6-rdd-first-step',
    conceptId: 'rdd-steps',
    question: 'What is the first step in Responsibility-Driven Design?',
    options: [
      'Identify the possible roles in the program',
      'Write the class definitions in C#',
      'Design the database schema',
      'Optimise the program for performance',
    ],
    answer: 0,
    why: [
      '',
      'Code comes much later. RDD is a modelling activity you do before writing any of it.',
      'Storage is an implementation detail, and a late one — CRC cards are explicitly used *before* database design.',
      'You cannot optimise a design that does not exist yet.',
    ],
    explain:
      'Roles first, always. RDD models the system from a high level — roles, then responsibilities, then collaborations — before any low-level detail.',
    source: 'Quiz 6 Q4',
  },
  {
    id: 'w6-rdd-step2',
    conceptId: 'rdd-steps',
    question: 'Which principle is emphasised during Step 2 of RDD?',
    options: [
      'Identifying the responsibilities of each role',
      'Identifying the roles in the problem',
      'Choosing which design patterns to apply',
      'Deciding how objects will be stored on disk',
    ],
    answer: 0,
    why: [
      '',
      'That is Step 1, and it has already happened by the time Step 2 starts.',
      'Patterns are not part of the three-step RDD process at all — they arrive in Week 9.',
      'Persistence is an implementation concern, deferred well past this stage.',
    ],
    explain:
      'Step 2 works out what each role **knows** and what it **does**, and assigns both to the role that owns them.',
    source: 'Quiz 6 Q2',
  },
  {
    id: 'w6-rdd-step3',
    conceptId: 'rdd-steps',
    question: 'What is the focus of Step 3 in Responsibility-Driven Design?',
    options: [
      'How objects collaborate with each other to fulfil their responsibilities',
      'Assigning responsibilities to each role',
      'Listing the roles in the problem domain',
      'Writing the unit tests for each class',
    ],
    answer: 0,
    why: [
      '',
      'Step 2. By Step 3 every role already has its responsibilities.',
      'Step 1.',
      'Testing is not one of the three steps.',
    ],
    explain:
      'Step 3 is collaboration: which object asks which other object for what, as a client/supplier relationship.',
    source: 'Quiz 6 Q13',
  },
  {
    id: 'w6-rdd-order',
    conceptId: 'rdd-steps',
    question: 'Which ordering of the three RDD steps is correct?',
    options: [
      'Roles → responsibilities → collaborations',
      'Responsibilities → roles → collaborations',
      'Collaborations → roles → responsibilities',
      'Roles → collaborations → responsibilities',
    ],
    answer: 0,
    why: [
      '',
      'You cannot assign a responsibility before you know what you are assigning it to.',
      'Collaboration is between things that already have jobs — it cannot come first.',
      'Objects collaborate *to fulfil* responsibilities, so the responsibilities have to exist first.',
    ],
    explain:
      'Find the roles, give each one its knows and does, then work out who has to talk to whom. Each step needs the one before it.',
    source: 'Lecture 6, the three RDD steps',
  },

  // ----------------------------------------------------------------- roles
  {
    id: 'w6-what-is-role',
    conceptId: 'rdd-role',
    question: "Which best describes a 'role' in RDD?",
    options: [
      'A general responsibility or purpose that an object may fulfil',
      'A specific class in the final implementation',
      'A single instance of an object at runtime',
      'A method defined on an interface',
    ],
    answer: 0,
    why: [
      '',
      'A role is not tied to one class — that is the point of separating them.',
      'An instance is a concrete thing at runtime; a role is a design-time concept.',
      'A role is a cohesive *set* of related responsibilities, not one method.',
    ],
    explain:
      'A role is a behavioural contract: a cohesive set of related responsibilities an object can adopt. Keeping it separate from any one class is what lets the design change without the model changing.',
    source: 'Quiz 6 Q7',
  },
  {
    id: 'w6-not-a-role',
    conceptId: 'rdd-role',
    question: 'In a chess game, which of these is NOT a plausible role?',
    options: ['For Loop', 'Move Validator', 'Chessboard', 'Player'],
    answer: 0,
    why: [
      '',
      'A perfectly good role — something has to decide whether a move is legal.',
      'A core domain object, and the information expert on the grid.',
      'The most obvious role in the game.',
    ],
    explain:
      'Roles come from the **problem domain**, not from the programming language. A for loop is control flow — an implementation detail, not something the chess problem contains.',
    source: 'Quiz 6 Q10',
  },
  {
    id: 'w6-role-vs-class',
    conceptId: 'rdd-role',
    question: 'A role and an implementation class are related how?',
    options: [
      'One role may be fulfilled by different classes, and one class may play several roles',
      'Every role becomes exactly one class, one for one',
      'A class is a role once it has been written in C#',
      'Roles replace classes — a design using roles has no classes',
    ],
    answer: 0,
    why: [
      '',
      'Tempting and often roughly true in a small design, but it is not the definition, and treating it as a rule is what collapses roles into classes.',
      'Writing it down in a language does not change what it is. The distinction is conceptual, not syntactic.',
      'Roles are a modelling device on the way to classes, not a substitute for them.',
    ],
    explain:
      'The separation buys flexibility: because a role is a contract rather than a class, you can change which class fulfils it without changing the model of what the system does.',
    source: 'Lecture 6, roles; Quiz 6 Q7',
    stretch: true,
  },

  // ------------------------------------------------------------ CRC cards
  {
    id: 'w6-crc-benefit',
    conceptId: 'crc-cards',
    question: 'What is the benefit of using CRC cards in RDD?',
    options: [
      'Identifying and refining object roles and responsibilities iteratively',
      'Generating the C# class files automatically',
      'Designing the database tables before coding',
      'Measuring the performance of each class',
    ],
    answer: 0,
    why: [
      '',
      'They are index cards. Nothing is generated from them.',
      'CRC work happens well before any database design is considered.',
      'There is nothing to measure yet — no code exists.',
    ],
    explain:
      'CRC cards are deliberately lightweight — cheap to write, cheap to tear up — so a team can walk through scenarios and refine the roles repeatedly before anything expensive has been built.',
    source: 'Quiz 6 Q11',
  },
  {
    id: 'w6-crc-stands-for',
    conceptId: 'crc-cards',
    question: 'What does CRC stand for on a CRC card?',
    options: [
      'Candidate role, Responsibility, Collaboration',
      'Class, Reference, Container',
      'Create, Read, Change',
      'Cohesion, Responsibility, Coupling',
    ],
    answer: 0,
    why: [
      '',
      'Not the expansion, and it misses the point: the card is about behaviour, not structure.',
      'That is a database CRUD-style list, unrelated.',
      'Cohesion and coupling are Week 6 ideas, but they are not what the three letters stand for.',
    ],
    explain:
      'The three things on the card are exactly the three steps of RDD, one per column — which is why the card is the tool for the process.',
    source: 'Lecture 6, CRC cards',
  },
  {
    id: 'w6-crc-when',
    conceptId: 'crc-cards',
    question: 'At what point in a project are CRC cards used?',
    options: [
      'Early, during conceptual design, before implementation detail',
      'After the code is written, to document what was built',
      'During testing, to record which tests failed',
      'At deployment, to describe the production environment',
    ],
    answer: 0,
    why: [
      '',
      'Documenting after the fact is a different job; CRC cards exist to *shape* the design while it is still cheap to change.',
      'Nothing to do with tests.',
      'Nothing to do with deployment.',
    ],
    explain:
      'Their whole value is being used while changing your mind is still free.',
    source: 'Quiz 6 Q11',
  },

  // ----------------------------------------------------- knows and does
  {
    id: 'w6-knows-does',
    conceptId: 'knows-does',
    question: 'In RDD, responsibilities are split into which two kinds?',
    options: [
      'What the object knows, and what the object does',
      'What is public, and what is private',
      'What is inherited, and what is overridden',
      'What is static, and what is instance-level',
    ],
    answer: 0,
    why: [
      '',
      'Access modifiers are an implementation concern. RDD is modelling behaviour, not visibility.',
      'Inheritance is a later, structural question.',
      'Also an implementation detail.',
    ],
    explain:
      '"Knows" becomes attributes and "does" becomes methods, but at this stage they are still statements about the role, not about C#.',
    source: 'Lecture 6, knows/does',
  },
  {
    id: 'w6-encapsulation-resp',
    conceptId: 'knows-does',
    code: `// Library Management System
// Roles: Book, User, Librarian, Library

class User
{
    public void BorrowBook(Book b) { /* ... */ }
}`,
    question:
      'The `User` class is given the responsibility `BorrowBook()`. Which RDD principle does this illustrate?',
    options: [
      'Encapsulation of responsibilities',
      'Inheritance of responsibilities',
      'Polymorphic dispatch',
      'Loose coupling',
    ],
    answer: 0,
    why: [
      '',
      'Nothing is being inherited here — there is no base class in sight.',
      'There is no overriding and no runtime type choice.',
      'Coupling is about dependency *between* classes; this question is about what lives *inside* one.',
    ],
    explain:
      'Putting a behaviour on the class that owns the relevant data and context is encapsulation of responsibilities — data and the methods acting on it, bundled in the owner.',
    source: 'Quiz 6 Q3',
  },
  {
    id: 'w6-book-responsibility',
    conceptId: 'knows-does',
    question:
      'In the Library Management System, which best represents the responsibilities of the `Book` class?',
    options: [
      'Track its own information — title, author, availability — and update its availability status',
      'Manage user accounts and membership records',
      'Calculate and collect fine payments',
      'Manage the library budget',
    ],
    answer: 0,
    why: [
      '',
      'That belongs to `User` or `Library`. A book knows nothing about accounts.',
      'A fine is a library-level transaction, not something a single book owns.',
      'Budgets belong to `Library`, nowhere near an individual book.',
    ],
    explain:
      'An object manages its own data. A `Book` holds title, author and availability, so it is the information expert on those — and nothing else.',
    source: 'Quiz 6 Q12',
  },
  {
    id: 'w6-piece-responsibility',
    conceptId: 'knows-does',
    question: 'In a chess game, which responsibility would most likely belong to the `Piece` class?',
    options: [
      'Determining its valid moves based on its own type',
      'Managing whose turn it is',
      'Saving the game to a file',
      'Running the game clock',
    ],
    answer: 0,
    why: [
      '',
      'Turn order is game-level coordination — `Game`, not one piece.',
      'Persistence belongs nowhere near a domain object. (Week 9 names the fix for this: pure fabrication.)',
      'A timer is a separate concern with its own role.',
    ],
    explain:
      'A piece holds the data about what kind of piece it is, so it is the one object that can answer "where may I move?". Everything else listed is coordination that sits above the pieces.',
    source: 'Quiz 6 Q8',
  },

  // -------------------------------------------------- information expert
  {
    id: 'w6-expert-definition',
    conceptId: 'info-expert',
    question: 'What does the information expert principle say?',
    options: [
      'Give a responsibility to the object that holds the data needed to carry it out',
      'Give every responsibility to a dedicated manager class',
      'Give a responsibility to whichever class has the fewest methods so far',
      'Give a responsibility to the class the user interacts with first',
    ],
    answer: 0,
    why: [
      '',
      'A manager class that owns everything is the God-class failure mode — the opposite of what this produces.',
      'Balancing method counts is not a design principle; it ignores what the data actually is.',
      'That is the controller idea, and it is about *events*, not about who owns the data.',
    ],
    explain:
      'The data and the behaviour that needs it belong together. Separating them forces one class to reach into another, which raises coupling for no gain.',
    source: 'Lecture 6, information expert',
  },
  {
    id: 'w6-library-collaboration',
    conceptId: 'info-expert',
    question:
      'How should the collaboration between `User` and `Library` be managed when borrowing a book?',
    options: [
      'The `Library` handles the transaction — checking availability and updating records — while the `User` requests it',
      'The `User` directly sets the book’s availability to false',
      'The `Book` updates its own records and notifies nobody',
      'The `Librarian` object edits the `User`’s private fields directly',
    ],
    answer: 0,
    why: [
      '',
      'This bypasses the system that is supposed to be recording the loan. The book would look borrowed with no record of by whom.',
      'A book has no way of knowing who borrowed it or whether they were allowed to.',
      'Reaching into another object’s private state is exactly what encapsulation forbids.',
    ],
    explain:
      '`Library` is the information expert for system-level transactions: it is the one that holds the records. The `User` asks; the `Library` decides and records.',
    source: 'Quiz 6 Q1',
  },
  {
    id: 'w6-expert-chess-board',
    conceptId: 'info-expert',
    question:
      'In the chess example, which class should be responsible for creating the pieces on the board?',
    options: [
      'The `Board`, because it knows the grid size and which positions are valid',
      'Each `Piece`, because it knows what kind of piece it is',
      'The `Player`, because the pieces belong to a player',
      'A static helper class, so no object owns the job',
    ],
    answer: 0,
    why: [
      '',
      'A piece cannot create itself before it exists, and it does not know where it belongs on an empty board.',
      'A player owns pieces in the game’s fiction, but holds none of the grid information needed to place them.',
      'Making it static just hides the question of who should own it.',
    ],
    explain:
      'The board knows how many cells there are and which positions are legal, so it is the information expert on board setup.',
    source: 'Lecture 6, chess walkthrough',
  },

  // -------------------------------------------------------------- cohesion
  {
    id: 'w6-cohesion-benefit',
    conceptId: 'cohesion',
    question: 'How does high cohesion benefit an object-oriented design?',
    options: [
      'It simplifies maintenance by grouping related functionality in one class',
      'It removes the need for classes to collaborate at all',
      'It duplicates logic across classes so each is self-sufficient',
      'It guarantees the program runs faster',
    ],
    answer: 0,
    why: [
      '',
      'Collaboration is Step 3 of RDD and is not something good design eliminates.',
      'Duplication is a cost, not a benefit — and it is what high cohesion helps you avoid.',
      'Cohesion is a maintainability property. It says nothing about runtime speed.',
    ],
    explain:
      'A class built around one well-defined set of related responsibilities is easier to understand, test and reuse — and there is only one place to go when that topic needs changing.',
    source: 'Quiz 6 Q5',
  },
  {
    id: 'w6-not-cohesion',
    conceptId: 'cohesion',
    question: 'Which of these is NOT a characteristic of high cohesion?',
    options: [
      'A single class takes on multiple unrelated responsibilities',
      'A class focuses on one well-defined set of responsibilities',
      'The functionality inside a class is strongly related',
      'The class is easier to maintain, test and reuse',
    ],
    answer: 0,
    why: [
      '',
      'That is the definition of high cohesion.',
      'Also the definition — "strongly related functionality grouped together".',
      'These are the payoffs of high cohesion, not counterexamples.',
    ],
    explain:
      'Unrelated responsibilities in one class is **low** cohesion — the God class. The mental test: can the class honestly say "I know everything about one specific topic"?',
    source: 'Quiz 6 Q5',
  },
  {
    id: 'w6-cohesion-split',
    conceptId: 'cohesion',
    code: `class EmployeeRecord
{
    private string _name;
    private int _id;
    private double _salary;
    private string _taskFeedback;

    public double CalculateKPI() { /* ... */ }
    public double CalculateSalary() { /* ... */ }
}`,
    question: 'What is the cohesion problem here, and the fix taught in the lecture?',
    options: [
      'It both stores employee data and performs payroll calculation — split it into `Employee` (data) and `Payroll` (calculations)',
      'It has too many fields — move some of them into a base class',
      'Its methods are public — make them private',
      'Nothing is wrong; keeping data and the code that uses it together is high cohesion',
    ],
    answer: 0,
    why: [
      '',
      'Field count is not the issue. All four fields are genuinely about one employee.',
      'Visibility is unrelated to cohesion.',
      'A tempting trap, because "data with the code that uses it" *is* a real principle. But KPI and salary calculation are a separate topic from being an employee, and the lecture splits them for exactly that reason.',
    ],
    explain:
      'Two topics in one class: identity and calculation. `Employee` keeps the data; `Payroll` takes `CalculateKPI(Employee)` and `CalculateSalary(Employee)` and uses it.',
    source: 'Lecture 6, cohesion; Lecture 9 §5.1',
    stretch: true,
  },

  // -------------------------------------------------------------- coupling
  {
    id: 'w6-loose-coupling',
    conceptId: 'coupling',
    question: "Which describes 'loose coupling' in RDD?",
    options: [
      'Classes are independent, with minimal dependencies on each other',
      'Classes never communicate with each other at all',
      'Every class inherits from one shared base class',
      'All classes are declared in the same file',
    ],
    answer: 0,
    why: [
      '',
      'A common over-correction. Objects must collaborate — the aim is to minimise dependency on each other’s *internals*, not to stop talking.',
      'A shared base class is a dependency, so this usually raises coupling rather than lowering it.',
      'File layout has nothing to do with it.',
    ],
    explain:
      'Low coupling means a change in one class is unlikely to ripple out and break others. Depending on an interface is still a dependency, but a stable one — that is the version you want.',
    source: 'Quiz 6 Q14',
  },
  {
    id: 'w6-coupling-interface',
    conceptId: 'coupling',
    question:
      'An end-user class currently depends directly on a concrete `MusicPlayer` class. What lowers the coupling?',
    options: [
      'Make `MusicPlayer` an interface, with `CDPlayer` and `VoiceRecorder` implementing it',
      'Make every member of `MusicPlayer` public so the user class can reach what it needs',
      'Move the end-user code inside `MusicPlayer`',
      'Give `MusicPlayer` more methods so the user class needs fewer other classes',
    ],
    answer: 0,
    why: [
      '',
      'Widening access increases what the user class can depend on, which is the wrong direction entirely.',
      'That removes the dependency by removing the separation — and destroys cohesion in the process.',
      'A bigger class does not mean a less coupled one; it means a less cohesive one.',
    ],
    explain:
      'Depending on an abstraction means the concrete implementation can be swapped without the dependent class noticing. This is the lecture’s own music-player example, and the shape of GRASP’s low coupling in Week 9.',
    source: 'Lecture 6, coupling; Lecture 9 §5.2',
  },
  {
    id: 'w6-coupling-cohesion-tension',
    conceptId: 'coupling',
    question: 'What is the relationship between coupling and cohesion?',
    options: [
      'They trade off — pushing a class to do more can raise its coupling, and stripping dependencies can thin its cohesion, so good design balances them',
      'They are the same property measured two ways',
      'Maximising cohesion automatically minimises coupling',
      'They are independent; changing one never affects the other',
    ],
    answer: 0,
    why: [
      '',
      'They are genuinely different: cohesion is *within* a class, coupling is *between* classes.',
      'The appealing wrong answer. A class that does more also tends to know about more, which raises coupling.',
      'They interact constantly — that interaction is the whole difficulty of design.',
    ],
    explain:
      'The lecture calls it a see-saw and says there is no free lunch. "Low coupling and high cohesion" is a balance to aim for, not two dials to turn to maximum independently.',
    source: 'Lecture 6, balancing; Lecture 9 §5.3',
    stretch: true,
  },

  // ------------------------------------------------------ UML relationships
  {
    id: 'w6-uml-static',
    conceptId: 'uml-relations',
    question:
      'Which UML diagram communicates the static structure of classes and their relationships?',
    options: ['Class diagram', 'Sequence diagram', 'Activity diagram', 'Use case diagram'],
    answer: 0,
    why: [
      '',
      'A sequence diagram shows interaction over *time* — dynamic behaviour, not static structure.',
      'An activity diagram shows flow of control, again dynamic.',
      'A use case diagram shows what actors can do with the system, not how classes relate.',
    ],
    explain:
      'Classes, attributes, operations and the relationships between them — the output of RDD Steps 1 and 2. Step 3’s collaborations are what a sequence diagram shows.',
    source: 'Quiz 6 Q6',
  },
  {
    id: 'w6-uml-aggregation',
    conceptId: 'uml-relations',
    question:
      'Which UML relationship represents the permanent association between `Library` and `Book`?',
    options: ['Aggregation', 'Dependency', 'Composition', 'Realisation'],
    answer: 0,
    why: [
      '',
      'A dependency is a *temporary* use — one class briefly needs another. A library holds its books permanently.',
      'Composition would mean the books are destroyed with the library. A book can outlive the library it sat in.',
      'Realisation is a class implementing an interface.',
    ],
    explain:
      'Aggregation: a solid line with an **open** diamond at the whole end. Permanent whole-part, where the parts can exist independently of the whole.',
    source: 'Quiz 6 Q9',
  },
  {
    id: 'w6-uml-diamond',
    conceptId: 'uml-relations',
    question: 'What distinguishes composition from aggregation in a UML class diagram?',
    options: [
      'Composition has a filled diamond and the parts are destroyed with the whole; aggregation has an open diamond and the parts can outlive it',
      'Composition has an open diamond; aggregation has a filled one',
      'Composition uses a dashed line; aggregation uses a solid one',
      'They are two names for the same relationship',
    ],
    answer: 0,
    why: [
      '',
      'The diamonds are the right way round in option A — this reverses them, which is the single most common slip.',
      'Both use a solid line. A dashed line with an open arrowhead is a dependency.',
      'They differ precisely on lifetime, which is a real design decision.',
    ],
    explain:
      'Filled = owned = dies with the whole. Open = held = outlives the whole. Remember it by weight: the filled diamond is the heavier commitment.',
    source: 'Lecture 6, the five UML relationships',
  },
  {
    id: 'w6-uml-dependency',
    conceptId: 'uml-relations',
    code: `public class ReportPrinter
{
    public void Print(Invoice invoice)
    {
        Console.WriteLine(invoice.Total);
    }
}`,
    question: 'What is the relationship between `ReportPrinter` and `Invoice`?',
    options: [
      'Dependency — it is used as a parameter and not held',
      'Aggregation — `ReportPrinter` contains an `Invoice`',
      'Composition — the `Invoice` dies with the `ReportPrinter`',
      'Inheritance — one is a kind of the other',
    ],
    answer: 0,
    why: [
      '',
      'Aggregation needs a *field*. `ReportPrinter` keeps no reference once `Print` returns.',
      'Nothing is owned here. The invoice existed before the call and survives it.',
      'There is no `:` and no is-a relationship.',
    ],
    explain:
      'A parameter, a local variable or a return type gives a **dependency** — a dashed arrow, "temporarily uses". A field gives an association or aggregation. Look for where the reference is stored.',
    source: 'Lecture 6, the five UML relationships',
    stretch: true,
  },
];
