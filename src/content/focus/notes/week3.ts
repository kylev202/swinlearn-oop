/**
 * Week 3 revision notes — collaboration, memory, sequence diagrams.
 *
 * Two of the seven rows in Lecture 5's mock-test walkthrough come from this
 * week (relationship types, and what actually sits on the stack), which makes
 * it the densest week per question on the paper. The relationship table below
 * is the single highest-value thing on this page.
 */

import type { WeekNotes } from '../types';

export const NOTES_WEEK3: WeekNotes = {
  week: 3,
  title: 'Collaboration, memory, sequence diagrams',
  gist: 'How objects are wired to each other, where they physically live, and how to draw them talking.',
  sources: ['Lecture 3', 'Quiz 3'],
  sections: [
    {
      id: 'n3-relationships',
      title: 'The four relationships',
      concepts: ['relationships'],
      blocks: [
        {
          t: 'text',
          md: 'Every question about relationships is really one question: **how long does the link last, and who owns whom?** Answer that and the name follows.',
        },
        {
          t: 'table',
          caption: 'Ordered weakest to strongest',
          headers: ['Relationship', 'Lifetime of the link', 'Standing example', 'In code'],
          rows: [
            ['**Dependency**', 'One method call — uses it, then forgets it', 'A player *temporarily uses* a weapon', 'A parameter or local variable'],
            ['**Association**', 'Long-lived reference between independent objects', 'A `Game` *has a reference to* a `Player`', 'A field, assigned from outside'],
            ['**Aggregation**', 'A container of parts that **outlive** it', 'A `Library` *contains* many `Book` objects', 'A field holding a collection, passed in'],
            ['**Composition**', 'Owns parts that **die with it**', 'A `Book` owns `Chapter` objects that cannot exist without it', 'A field the constructor itself `new`s up'],
          ],
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'The deciding question',
          md: 'Can the part exist on its own once the whole is gone?\n\n**Yes** → aggregation. **No** → composition. **The link only lasts one call** → dependency. **Two independent objects that just know about each other** → association.',
        },
        {
          t: 'compare',
          title: 'Same field, different relationship — read the constructor',
          left: {
            title: 'Association / aggregation',
            tone: 'neutral',
            code: `public BlackjackGame(Deck deck)
{
    _deck = deck;   // handed in
}`,
            md: 'The deck was created elsewhere and outlives the game.',
          },
          right: {
            title: 'Composition',
            tone: 'neutral',
            code: `public BlackjackGame()
{
    _deck = new Deck();  // made here
}`,
            md: 'The game creates and owns the deck; nothing else has a reference to it.',
          },
        },
        {
          t: 'text',
          md: 'Getting this right early **saves implementation effort and reduces later refactoring** — the answer to "why identify relationships early". Discovering in week 9 that a container should have owned its contents means rewriting everything that touched it.',
        },
      ],
    },
    {
      id: 'n3-memory',
      title: 'Stack and heap',
      concepts: ['stack-heap', 'value-ref', 'call-stack'],
      blocks: [
        {
          t: 'compare',
          left: {
            title: 'Stack',
            tone: 'neutral',
            md: 'Value types whose size is **fixed and known at compile time**.\n\n`int`, `double`, `bool`, `char`, and the **references** themselves.\n\nOne frame per method call, popped on return.',
          },
          right: {
            title: 'Heap',
            tone: 'neutral',
            md: 'Anything that can **grow or be shared at runtime**.\n\n`string`, `List<int>`, arrays, and every object made with `new`.\n\nCleared by the garbage collector, not by returning.',
          },
        },
        {
          t: 'callout',
          tone: 'key',
          title: 'Mock-test question 3, in one line',
          md: 'Of `int`, `string`, `List<int>` and a custom object — only **`int`** is stored directly on the stack. The other three are reference types: the reference is on the stack, the data is on the heap.',
        },
        {
          t: 'code',
          caption: 'One statement, two places',
          code: `Person p = new Person("Amy");
//     ^                ^
//     |                the Person object -> HEAP
//     the reference p  -> STACK`,
        },
        {
          t: 'text',
          md: 'Because a variable holds a *reference*, assigning it copies the arrow and not the box:',
        },
        {
          t: 'code',
          code: `Counter a = new Counter();
Counter b = a;        // b and a are two names for ONE object
b.Increment();
Console.WriteLine(a.Count);   // 1 — not 0`,
        },
        {
          t: 'text',
          md: 'The same reasoning answers "what is passed when you pass an object to a method": **a reference to the object on the heap**. The method can therefore change the caller\'s object.\n\nAnd when a method finishes, **its stack frame is removed and control returns to the caller**. That is deterministic and immediate — nothing to do with the garbage collector.',
        },
      ],
    },
    {
      id: 'n3-gc',
      title: 'Garbage collection',
      concepts: ['gc'],
      blocks: [
        {
          t: 'text',
          md: 'The .NET garbage collector **automatically manages memory for objects on the heap**, reclaiming those nothing references any more. It is a runtime service, not a compiler pass.',
        },
        {
          t: 'callout',
          tone: 'note',
          title: 'Know your language',
          md: 'C# and Java collect automatically. C++ does not — you free memory yourself. This contrast is the point of the question, so the wrong answers are usually "you must call `delete`" and "it clears the stack".',
        },
      ],
    },
    {
      id: 'n3-sequence',
      title: 'Sequence diagrams',
      concepts: ['uml-sequence'],
      blocks: [
        {
          t: 'text',
          md: 'A sequence diagram is a **behaviour** diagram: it visualises the dynamic interactions between objects **over time**. Time runs down the page.',
        },
        {
          t: 'table',
          caption: 'Every mark on the diagram',
          headers: ['Notation', 'Means'],
          rows: [
            ['Box across the top', 'A participating object'],
            ['**Vertical dashed line** (lifeline)', 'How long that object exists in this scenario'],
            ['**Narrow rectangle** on a lifeline (activation box)', 'The period the object is performing an operation'],
            ['**Solid line, filled arrowhead**', 'A method call from one object to another'],
            ['**Dashed line, open arrowhead**', 'The return'],
            ['`X` at the end of a lifeline', 'The object is destroyed'],
          ],
        },
        {
          t: 'callout',
          tone: 'trap',
          md: 'Two arrows that look similar belong to the **class** diagram and never appear here: a solid line with a *hollow triangle* is inheritance, and a dashed line with a hollow triangle is interface implementation. Both turn up as distractors.',
        },
      ],
    },
  ],
};
