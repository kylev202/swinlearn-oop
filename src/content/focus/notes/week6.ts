/**
 * Week 6 revision notes — responsibility-driven design.
 *
 * The first of the six weeks the final examines for *theory* rather than just
 * code analysis, and the one with the least code in it. Nothing here runs:
 * RDD happens before implementation, which is exactly what Step 1 being
 * "identify roles" is telling you.
 *
 * Deliberately excluded from the midsemester test ("the theory of week six is
 * not included in your midterm test"), so for most students this is material
 * seen once in a lecture and never examined until now.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK6: WeekNotes = {
  week: 6,
  title: 'Responsibility-driven design',
  gist: 'Deciding what the classes should be, and who owns what, before any of them is written.',
  sources: ['Lecture 6 (W6a/W6b decks)', 'Quiz 6'],
  sections: [
    {
      id: 'n6-process',
      title: 'The three steps, and CRC cards',
      concepts: ['rdd-steps', 'rdd-role', 'crc-cards'],
      blocks: [
        {
          t: 'text',
          md: 'RDD is a way of getting from a problem description to a set of classes without the usual leap of faith. It runs in **three steps, in this order**, and most exam questions are simply asking which step is which.',
        },
        {
          t: 'table',
          headers: ['Step', 'What you do', 'The question it answers'],
          rows: [
            ['1 — Roles', 'Identify the possible roles in the problem', 'What things are there?'],
            ['2 — Responsibilities', 'Give each role what it **knows** and what it **does**', 'What is each one for?'],
            ['3 — Collaborations', 'Work out which object asks which other object for what', 'How do they work together?'],
          ],
        },
        {
          t: 'callout',
          tone: 'key',
          md: 'Each step needs the one before it. You cannot assign a responsibility before you know what you are assigning it *to*, and objects collaborate **to fulfil** responsibilities, so those have to exist first.',
        },
        {
          t: 'text',
          md: '### What a role is\n\nA role is a **general responsibility or purpose an object may fulfil** — a behavioural contract. It is deliberately not the same thing as a class: one role may be fulfilled by different classes, and one class may play several roles.\n\nRoles come from the **problem domain**. In a chess game, `Player`, `Chessboard` and `Move Validator` are all plausible roles. `For Loop` is not — it is a language construct, not something the problem contains.',
        },
        {
          t: 'callout',
          tone: 'note',
          title: 'CRC cards',
          md: '**C**andidate role, **R**esponsibility, **C**ollaboration — one column per RDD step, which is why the card is *the* tool for the process.\n\nThey are index cards on purpose: cheap to write and cheap to tear up, so a team can walk scenarios and change its mind while that is still free. Used **early**, well before any database or implementation detail.',
        },
      ],
    },
    {
      id: 'n6-responsibilities',
      title: 'Knows, does, and who owns it',
      concepts: ['knows-does', 'info-expert'],
      blocks: [
        {
          t: 'text',
          md: 'A responsibility is one of exactly two things:\n\n- something the role **knows** — becomes an attribute\n- something the role **does** — becomes a method\n\nAssigning both to the role that actually owns them is **encapsulation of responsibilities**: the data and the methods that act on it, bundled in the owner.',
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'Information expert',
          md: 'The object that **holds the data** is the object responsible for **acting on it**.\n\nThis single rule answers most "which class should do X?" questions in the unit, and it comes back under its GRASP name in Week 9.',
        },
        {
          t: 'table',
          headers: ['Question', 'Answer', 'Because'],
          rows: [
            ['Who determines a chess piece’s valid moves?', '`Piece`', 'It holds the data about what kind of piece it is'],
            ['Who creates the pieces on the board?', '`Board`', 'It knows the grid size and which positions are valid'],
            ['Who handles borrowing a book?', '`Library`', 'It holds the records — the `User` only *requests* it'],
            ['What does `Book` know?', 'Title, author, availability', 'And nothing about accounts, fines or budgets'],
          ],
        },
        {
          t: 'callout',
          tone: 'trap',
          title: 'The library trap',
          md: 'Letting the `User` set the book’s availability directly, or letting `Book` update its own records, both *look* like encapsulation. They are not: the book would read as borrowed with **no record of by whom**. System-level transactions belong to the system-level expert.',
        },
      ],
    },
    {
      id: 'n6-quality',
      title: 'Cohesion and coupling',
      concepts: ['cohesion', 'coupling'],
      blocks: [
        {
          t: 'text',
          md: 'Two measures of a design, pulling in different directions. Learn them as a pair — the exam asks which is which, and asks you to spot the failure mode of each.',
        },
        {
          t: 'compare',
          left: {
            title: 'Cohesion — inside one class',
            tone: 'neutral',
            md: 'How **strongly related** one class’s own responsibilities are.\n\n**High** = "I know everything about one specific topic."\n\n**Low** = several unrelated jobs in one class. The **God class**.\n\nWant: **high**.',
          },
          right: {
            title: 'Coupling — between classes',
            tone: 'neutral',
            md: 'How much classes **depend on each other**.\n\n**Low (loose)** = "I am a rock, I am an island." Depends on interfaces, not concrete internals.\n\n**Tight** = a change here breaks something there.\n\nWant: **low**.',
          },
        },
        {
          t: 'table',
          headers: ['Low cohesion looks like', 'The fix'],
          rows: [
            [
              '`EmployeeRecord` stores `_name`, `_id`, `_salary`, `_taskFeedback` **and** does `CalculateKPI()` and `CalculateSalary()`',
              'Split: `Employee` holds the data, `Payroll` does the calculations and *uses* `Employee`',
            ],
            [
              'An end-user class depends directly on the concrete `MusicPlayer`',
              'Make `MusicPlayer` an **interface**; `CDPlayer` and `VoiceRecorder` implement it',
            ],
          ],
        },
        {
          t: 'callout',
          tone: 'warn',
          title: 'There is no free lunch',
          md: 'They sit on a **see-saw**. Giving a class more responsibilities to raise its cohesion also tends to raise its coupling, because a class that does more knows about more. Good design is a **balance**, not two dials turned to maximum.',
        },
        {
          t: 'callout',
          tone: 'note',
          md: 'Loose coupling does **not** mean classes never talk — collaboration is Step 3. It means minimising dependency on other classes’ *concrete internals*. Depending on an interface is still a dependency, but a stable one.',
        },
      ],
    },
    {
      id: 'n6-uml',
      title: 'The five UML relationships',
      concepts: ['uml-relations'],
      blocks: [
        {
          t: 'text',
          md: 'A **class diagram** communicates the *static structure* of a system — the output of Steps 1 and 2. Step 3’s collaborations are what a **sequence diagram** shows instead.',
        },
        {
          t: 'table',
          headers: ['Relationship', 'Notation', 'Means'],
          rows: [
            ['Dependency', 'Dashed line, open arrow', 'Temporarily uses — a parameter, local or return type'],
            ['Association', 'Solid line', 'Has a reference to'],
            ['Aggregation', 'Solid line, **open** diamond', 'Permanent whole-part; parts **outlive** the whole'],
            ['Composition', 'Solid line, **filled** diamond', 'Owns; parts are **destroyed with** the whole'],
            ['Inheritance', 'Solid line, hollow triangle', 'Is-a'],
          ],
        },
        {
          t: 'callout',
          tone: 'trap',
          title: 'The two that get confused',
          md: '**Aggregation vs composition** turns entirely on lifetime. Remember it by weight: the **filled** diamond is the heavier commitment — the part dies with the whole.\n\n`Library` and `Book` is **aggregation**: a book can outlive the library it sat in.\n\n**Dependency vs aggregation** turns on where the reference is **stored**. A field gives aggregation or association; a parameter, local or return type gives only a dependency.',
        },
      ],
    },
  ],
};
