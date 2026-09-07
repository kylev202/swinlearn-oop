/**
 * Week 3 question bank — object collaboration, memory, sequence diagrams.
 *
 * Sourced from Quiz 3 (16 questions), Lecture 3, and the two Week 3 items in
 * Lecture 5's mock-test walkthrough (aggregation vs association vs dependency,
 * and what actually goes on the stack). Those two are worth extra attention:
 * the walkthrough is the closest thing to a released past paper this unit has.
 */

import type { FocusQuestion } from '../types';

export const WEEK3: FocusQuestion[] = [
  // ------------------------------------------------------ relationships
  {
    id: 'w3-dependency',
    conceptId: 'relationships',
    question: 'Which best describes a **dependency** relationship?',
    options: [
      'A short-term interaction where one object temporarily uses another',
      'One object holds a long-lived reference to another as a field',
      'One object contains parts that cannot exist without it',
      'One class inherits the members of another',
    ],
    answer: 0,
    why: [
      '',
      'That is an **association** — the reference survives past a single call.',
      'That is **composition**.',
      'That is inheritance, which is not a collaboration relationship at all.',
    ],
    explain:
      'A dependency is usually a parameter or a local: the object is used for the duration of a method and then forgotten. A player swinging a weapon that is passed in, then dropped, is a dependency.',
    source: 'Quiz 3 Q2',
  },
  {
    id: 'w3-composition',
    conceptId: 'relationships',
    question: 'Which is an example of **composition**?',
    options: [
      'A `Book` contains `Chapter` objects that cannot exist without the book',
      'A `Library` contains many `Book` objects',
      'A `Game` holds a reference to a `Player`',
      'A `Player` uses a `Weapon` passed into one method',
    ],
    answer: 0,
    why: [
      '',
      'The books outlive the library — lend them out, close the library, the books still exist. That is **aggregation**.',
      'That is an **association**: a long-lived reference between two independent objects.',
      'That is a **dependency**: used, then gone.',
    ],
    explain:
      'Composition is the strongest form of containment — the parts are owned outright, and destroying the whole destroys them. The test question is always "can the part exist on its own?"',
    source: 'Quiz 3 Q5',
  },
  {
    id: 'w3-aggregation',
    conceptId: 'relationships',
    question: 'A `Library` object contains multiple `Book` objects. What relationship is this?',
    options: ['Aggregation', 'Association', 'Dependency', 'Inheritance'],
    answer: 0,
    why: [
      '',
      'An association is a plain has-a reference. Here one object acts as a **container** of many, which is specifically aggregation.',
      'A dependency is temporary; a library holds its books indefinitely.',
      'A library is not a kind of book.',
    ],
    explain:
      'Aggregation is the container relationship: one object holds a collection of others which can outlive it. This is question 2 of the mock test almost word for word.',
    source: 'Quiz 3 Q6, and Lecture 5 mock walkthrough #2',
  },
  {
    id: 'w3-association',
    conceptId: 'relationships',
    question: 'Which is an example of an **association**?',
    options: [
      'A `Game` object has a reference to a `Player` object',
      'A `Deck` object owns 52 `Card` objects that vanish with it',
      'A `Sorter` method takes an `IComparable` parameter',
      'A `Circle` class extends a `Shape` class',
    ],
    answer: 0,
    why: [
      '',
      'Parts that vanish with the whole make that **composition**.',
      'A parameter used for one call is a **dependency**.',
      'That is inheritance.',
    ],
    explain:
      'An association is a persistent has-a link between two objects that each stand on their own. It is the default reading of "one class has a field of another class\'s type".',
    source: 'Quiz 3 Q11',
  },
  {
    id: 'w3-blackjack-deck',
    conceptId: 'relationships',
    stretch: true,
    code: `public class BlackjackGame
{
    private Deck _deck;

    public BlackjackGame(Deck deck)
    {
        _deck = deck;
    }
}`,
    question: 'What relationship does this show between `BlackjackGame` and `Deck`?',
    options: [
      'Association',
      'Composition',
      'Dependency',
      'Inheritance',
    ],
    answer: 0,
    why: [
      '',
      'Composition would mean the game *creates* the deck and the deck dies with it. Here the deck is handed in from outside and can outlive the game.',
      'A dependency would use the deck inside one method and let it go. This one is kept in a field.',
      'A game is not a kind of deck.',
    ],
    explain:
      'The deck arrives through the constructor and is stored — a long-lived reference between two independently created objects. Read the *lifetime*, not just the arrow: `new Deck()` inside the constructor would have made the same code composition.',
    source: 'Quiz 3 Q15',
  },
  {
    id: 'w3-why-relationships-early',
    conceptId: 'relationships',
    question: 'Why identify object relationships early in a design?',
    options: [
      'It saves implementation effort and reduces later refactoring',
      'It makes the program run faster',
      'It is required before you can compile',
      'It removes the need for unit tests',
    ],
    answer: 0,
    why: [
      '',
      'Relationships are a design concern, not a runtime optimisation.',
      'The compiler has no opinion about your diagrams.',
      'Tests are still needed however good the design is.',
    ],
    explain:
      'Getting the relationships wrong is the expensive kind of mistake — discovering in week 9 that `Inventory` should have owned its items rather than borrowed them means rewriting everything that touched it.',
    source: 'Quiz 3 Q16',
  },

  // ------------------------------------------------------------- memory
  {
    id: 'w3-method-finishes',
    conceptId: 'call-stack',
    question: 'What happens when a method finishes executing in C#?',
    options: [
      'Its stack frame is removed and control returns to the caller',
      'Its stack frame stays until the garbage collector runs',
      'All objects it created are immediately deleted',
      'Its local variables are moved to the heap',
    ],
    answer: 0,
    why: [
      '',
      'The stack is not garbage collected — frames pop deterministically, the moment the method returns.',
      'Objects on the heap survive; only the *references* on the stack go away. The collector deals with the objects later, if nothing else refers to them.',
      'Nothing gets promoted to the heap on return. A local that referred to a heap object always pointed there.',
    ],
    explain:
      'Call pushes a frame, return pops it. That is why a local variable cannot outlive its method, and why returning a reference is fine — the object it points at was never in the frame.',
    source: 'Quiz 3 Q1',
  },
  {
    id: 'w3-int-on-stack',
    conceptId: 'stack-heap',
    question: 'Which of these is stored directly on the stack?',
    options: ['`int`', '`string`', '`List<int>`', 'A custom `Person` object'],
    answer: 0,
    why: [
      '',
      'A `string` is a reference type. The reference sits on the stack; the characters live on the heap.',
      'A `List<int>` grows at runtime, so it must be on the heap.',
      'Every object created with `new` lives on the heap.',
    ],
    explain:
      'The stack takes value types whose size is fixed and known at compile time. Anything that can grow or be shared goes on the heap — the mock test asks this one directly.',
    source: 'Quiz 3 Q3, and Lecture 5 mock walkthrough #3',
  },
  {
    id: 'w3-stack-frame-locals',
    conceptId: 'call-stack',
    code: `static int Total(int a, int b)
{
    int sum = a + b;
    return sum;
}`,
    question: 'Where do `a`, `b` and `sum` live while `Total` is running, and what happens to them after?',
    options: [
      'On `Total`\'s stack frame, which is discarded when it returns',
      'On the heap, until the garbage collector reclaims them',
      'On the stack, but they persist until `Main` ends',
      'On the heap, because they are method parameters',
    ],
    answer: 0,
    why: [
      '',
      '`int` is a value type of known size — it goes on the stack, and the collector never sees it.',
      'A frame is discarded on return, not at the end of the program.',
      'Being a parameter says nothing about where a value lives; its **type** does.',
    ],
    explain:
      'One frame per call, holding that call\'s locals and parameters. Return pops the frame — which is why a local cannot outlive its method, and why recursion has a depth limit.',
    source: 'Quiz 3 Q1, applied',
  },
  {
    id: 'w3-heap-which',
    conceptId: 'stack-heap',
    question: 'Which of these is **not** allocated on the heap?',
    options: ['`bool isDone = true;`', '`string name = "Amy";`', '`new List<int>()`', '`new Person()`'],
    answer: 0,
    why: [
      '',
      'A `string` is a reference type — the characters live on the heap even though the literal looks simple.',
      'A list grows at runtime, so it cannot sit in a fixed-size stack slot.',
      'Everything made with `new` is on the heap.',
    ],
    explain:
      'The dividing line is not "simple vs complicated" but **fixed size known at compile time** vs anything that can grow or be shared. `bool` is on one side; `string` is on the other, which is the part people get wrong.',
    source: 'Lecture 5 mock walkthrough #3, inverted',
  },
  {
    id: 'w3-passing-objects',
    conceptId: 'value-ref',
    question: 'When you pass an object to a method, what is actually passed?',
    options: [
      'A reference to the object on the heap',
      'A complete copy of the object',
      'The object is moved into the method',
      'Nothing — methods can only take value types',
    ],
    answer: 0,
    why: [
      '',
      'Copying would mean changes inside the method were invisible outside. They are not.',
      'Objects are never moved between the caller and the callee; both end up pointing at the same one.',
      'Methods take reference types happily.',
    ],
    explain:
      'The reference is copied, the object is not. So the method can mutate the caller\'s object — the aliasing behaviour Week 2\'s references lesson demonstrates.',
    source: 'Quiz 3 Q7',
  },
  {
    id: 'w3-value-vs-ref',
    conceptId: 'value-ref',
    question: 'What is the main difference between reference types and value types?',
    options: [
      'A reference type stores a reference to data on the heap; a value type stores the data directly',
      'A reference type is faster to access',
      'A value type cannot be passed to a method',
      'A reference type cannot be `null`',
    ],
    answer: 0,
    why: [
      '',
      'Stack access is generally the cheaper one, so if anything this is backwards — but speed is not the defining difference.',
      'Value types are passed to methods constantly.',
      '`null` is precisely what a reference type can hold and a plain value type cannot.',
    ],
    explain:
      'Where the data lives decides everything else: whether assignment copies the value or shares the object, and whether the variable can be `null`.',
    source: 'Quiz 3 Q8',
  },
  {
    id: 'w3-person-memory',
    conceptId: 'value-ref',
    code: `Person p = new Person("Amy");`,
    question: 'Where do `p` and the `Person` live?',
    options: [
      '`p` is a reference on the stack; the `Person` object is on the heap',
      'Both are on the stack',
      'Both are on the heap',
      '`p` is on the heap; the `Person` object is on the stack',
    ],
    answer: 0,
    why: [
      '',
      'Only the reference is stack-sized and fixed. The object it points at is not.',
      'The local variable `p` itself is a slot in the current stack frame.',
      'Exactly inverted — locals go on the stack, `new` allocates on the heap.',
    ],
    explain:
      'One variable, two places. Drawing this split is what makes aliasing obvious: a second variable assigned from `p` copies the arrow, not the box it points at.',
    source: 'Quiz 3 Q12',
  },
  {
    id: 'w3-aliasing',
    conceptId: 'value-ref',
    stretch: true,
    code: `Counter a = new Counter();
Counter b = a;
b.Increment();

Console.WriteLine(a.Count);`,
    question: 'What does this print, assuming a fresh `Counter` starts at 0?',
    options: ['`1`', '`0`', '`2`', 'It throws a null reference exception'],
    answer: 0,
    why: [
      '',
      'That would be the answer if `Counter` were a value type and `b = a` copied it. It is a class, so it is not.',
      '`Increment` was called once, on one object.',
      'Both variables refer to a real object; neither is null.',
    ],
    explain:
      '`b = a` copies the **reference**, so `a` and `b` are two names for one object on the heap. Incrementing through either is visible through both.',
    source: 'Lecture 3, references and object networks',
  },
  {
    id: 'w3-gc',
    conceptId: 'gc',
    question: 'Which best describes the garbage collector in C#?',
    options: [
      'It automatically reclaims heap objects that nothing references any more',
      'It clears the stack when a method returns',
      'It runs at compile time to remove unused code',
      'It must be called manually with `delete`',
    ],
    answer: 0,
    why: [
      '',
      'Stack frames pop on their own as part of returning; the collector is not involved.',
      'It is a runtime service, not a compiler pass.',
      'C# has no `delete` — that is C++, and the difference is exactly the point of this question.',
    ],
    explain:
      'Know your language: C# and Java collect automatically; C++ makes you free memory yourself. This is why an unreferenced object in C# is a non-problem and a leak in C++.',
    source: 'Quiz 3 Q13',
  },

  {
    id: 'w3-gc-vs-cpp',
    conceptId: 'gc',
    question:
      'A heap object that nothing refers to any more. What do you have to write in C# to free it?',
    options: [
      'Nothing — the garbage collector reclaims it',
      '`delete obj;`',
      '`obj.Free();`',
      '`obj = null;`, which frees it immediately',
    ],
    answer: 0,
    why: [
      '',
      '`delete` is C++. C# has no such statement.',
      'There is no `Free` on `object`.',
      'Setting the variable to `null` **drops a reference**, which may make the object collectable, but it does not free anything itself.',
    ],
    explain:
      'Automatic memory management is the difference this question exists to test. C# and Java collect; C++ makes you free memory yourself, and forgetting to is a leak.',
    source: 'Quiz 3 Q13, applied',
  },

  // -------------------------------------------------- sequence diagrams
  {
    id: 'w3-seq-purpose',
    conceptId: 'uml-sequence',
    question: 'What is the primary purpose of a UML sequence diagram?',
    options: [
      'To visualise dynamic interactions between objects over time',
      'To show the attributes and methods of each class',
      'To show which classes inherit from which',
      'To show how objects are laid out in memory',
    ],
    answer: 0,
    why: [
      '',
      'That is a class diagram — a structure diagram.',
      'Inheritance arrows also belong on the class diagram.',
      'No UML diagram shows memory layout.',
    ],
    explain:
      'A sequence diagram is a **behaviour** diagram. It answers "what calls what, in what order" — the question a class diagram cannot.',
    source: 'Quiz 3 Q9',
  },
  {
    id: 'w3-activation-box',
    conceptId: 'uml-sequence',
    question: 'What does an activation box on a lifeline represent?',
    options: [
      'The period during which that object is performing an operation',
      'The moment the object is created',
      'The object being destroyed',
      'A message sent to another object',
    ],
    answer: 0,
    why: [
      '',
      'Creation is shown by where the lifeline starts, or by a create message.',
      'Destruction is marked with an X at the end of the lifeline.',
      'A message is the arrow between lifelines, not the box on one.',
    ],
    explain:
      'The narrow rectangle sitting on a lifeline is "this object is busy right now". Nested boxes mean a call made while an earlier call is still running.',
    source: 'Quiz 3 Q4',
  },
  {
    id: 'w3-lifeline',
    conceptId: 'uml-sequence',
    question: 'What do the vertical dashed lines in a sequence diagram represent?',
    options: [
      'The lifespan of an object during the process',
      'The order the classes were written in',
      'Inheritance between the objects',
      'Data flowing downward through the system',
    ],
    answer: 0,
    why: [
      '',
      'Horizontal position is just layout; it carries no meaning.',
      'Inheritance is a class-diagram idea and never appears here.',
      'Data movement is shown by the arrows, not the lines they connect.',
    ],
    explain:
      'Time runs down the page, and a dashed lifeline is how long that object exists within the scenario being drawn.',
    source: 'Quiz 3 Q10',
  },
  {
    id: 'w3-call-arrow',
    conceptId: 'uml-sequence',
    question: 'Which arrow represents a method call from one object to another?',
    options: [
      'A solid line with a filled arrowhead',
      'A dashed line with an open arrowhead',
      'A solid line with a hollow triangle head',
      'A dashed line with a hollow triangle head',
    ],
    answer: 0,
    why: [
      '',
      'That is the **return** arrow — the reply coming back.',
      'A solid line with a hollow triangle is inheritance, on a class diagram.',
      'A dashed line with a hollow triangle is interface implementation, also on a class diagram.',
    ],
    explain:
      'Solid and filled going out, dashed and open coming back. Two of the wrong answers here are class-diagram notation, which is exactly the confusion the question is testing.',
    source: 'Quiz 3 Q14',
  },

  // Third questions — see the note in week1.ts for why every concept has one.
  {
    id: 'w3-why-heap',
    conceptId: 'stack-heap',
    question: 'Why can a `List<int>` not live on the stack?',
    options: [
      'Its size can change while the program runs, and a stack slot is fixed',
      'Lists are always shared between threads',
      'The stack can only hold one item at a time',
      'Only the garbage collector is allowed to create lists',
    ],
    answer: 0,
    why: [
      '',
      'Sharing is a consequence of being a reference type, not the reason for it.',
      'A stack frame holds all of a method\'s locals at once.',
      'You create a list with `new`, like any other object.',
    ],
    explain:
      'The stack is laid out at compile time, in frames of known size. Anything that can grow needs the heap, where allocations happen while the program runs.',
    source: 'Lecture 3, the four memory regions',
  },
  {
    id: 'w3-return-value',
    conceptId: 'call-stack',
    code: `static Person Make()
{
    Person p = new Person("Amy");
    return p;
}`,
    question: 'The frame for `Make` is destroyed when it returns. Is the returned `Person` still valid?',
    options: [
      'Yes — the object was always on the heap; only the reference `p` was on the frame',
      'No — it was created inside `Make`, so it dies with the frame',
      'Only if `Person` is a value type',
      'Only until the garbage collector next runs',
    ],
    answer: 0,
    why: [
      '',
      'That would be true if the object itself lived on the frame. It never did.',
      'A value type would be *copied* out, which also works — but it is not why this one survives.',
      'The collector only reclaims objects nothing refers to, and the caller now refers to this one.',
    ],
    explain:
      'This is the payoff of splitting the two: the reference is stack-shaped and short-lived, the object is heap-shaped and lives as long as something points at it.',
    source: 'Lecture 3, stack and heap',
  },
  {
    id: 'w3-gc-when',
    conceptId: 'gc',
    question: 'What makes a heap object eligible for garbage collection?',
    options: [
      'Nothing refers to it any more',
      'The method that created it has returned',
      'It has not been used for a set period of time',
      'Its variable has gone out of scope, even if something else still refers to it',
    ],
    answer: 0,
    why: [
      '',
      'The creating method returning drops one reference. If another object still holds it, it stays.',
      'The collector tracks reachability, not idleness.',
      'One reference going away is not the same as all of them going away — that is exactly the aliasing case.',
    ],
    explain:
      'Reachability, not scope. An object put into a `List` outlives the method that made it, because the list is still holding a reference to it.',
    source: 'Quiz 3 Q13, applied',
  },

  // ==========================================================================
  // Depth pass.
  //
  // Two clusters carry most of Week 3's exam weight and both are pattern
  // recognition rather than recall: telling four object relationships apart
  // from a one-sentence scenario, and saying where a given thing lives in
  // memory. So most of what follows is scenarios and code, deliberately mixed
  // so that no single wording becomes the cue.
  // ==========================================================================

  // -------------------------------------------------- object relationships
  {
    id: 'w3-rel-four-way',
    conceptId: 'relationships',
    question: 'Which list puts the four relationships in order from weakest to strongest?',
    options: [
      'Dependency → association → aggregation → composition',
      'Composition → aggregation → association → dependency',
      'Association → dependency → composition → aggregation',
      'Aggregation → composition → dependency → association',
    ],
    answer: 0,
    why: [
      '',
      'That is the same order reversed — strongest first.',
      'A dependency is weaker than an association, not stronger: it does not survive the method call.',
      'Composition is the strongest of the four, so it cannot sit second.',
    ],
    explain:
      'Strength = how long the link lasts and how much ownership it implies. Dependency lasts one call; composition lasts the whole life of the owner and ends with it.',
    source: 'Lecture 3, object relationships',
  },
  {
    id: 'w3-rel-parameter',
    conceptId: 'relationships',
    code: `public class Printer
{
    public void Print(Document doc)
    {
        Console.WriteLine(doc.Text);
    }
}`,
    question: 'What relationship does `Printer` have with `Document`?',
    options: ['Dependency', 'Association', 'Aggregation', 'Composition'],
    answer: 0,
    why: [
      '',
      'An association needs a **field**. `Printer` forgets the document the moment `Print` returns.',
      'Aggregation is a whole–part relationship held over time; nothing is being held here.',
      'Composition would mean `Printer` created and owned the document\'s lifetime.',
    ],
    explain:
      'Parameter, local variable or return value → **dependency**. It is a "uses-a" link that exists only for the duration of the call.',
    source: 'Quiz 3 Q2, applied',
  },
  {
    id: 'w3-rel-field-vs-param',
    conceptId: 'relationships',
    question: 'What is the single clearest signal that a relationship is an association rather than a dependency?',
    options: [
      'The other object is stored in a **field**, so it outlives any one method call',
      'The other object is created with `new`',
      'The other class is in the same file',
      'The other object is passed as a parameter',
    ],
    answer: 0,
    why: [
      '',
      'Where the object was created does not decide how long the link lasts — the field does.',
      'File layout means nothing to the design.',
      'A parameter is the classic marker of the *other* answer: dependency.',
    ],
    explain:
      'Look for the field. Field → association (or a stronger form of it). Parameter/local/return → dependency. This one test answers most of these questions.',
    source: 'Quiz 3 Q15, reasoning',
  },
  {
    id: 'w3-rel-scenario-house',
    conceptId: 'relationships',
    question:
      'A `House` object contains `Room` objects. Demolish the house and the rooms are gone too. Which relationship?',
    options: ['Composition', 'Aggregation', 'Dependency', 'Inheritance'],
    answer: 0,
    why: [
      '',
      'Aggregation is the version where the parts *survive* — a library\'s books outlive the library.',
      'The rooms are held for the whole life of the house, not used for one call.',
      'A room is not a kind of house.',
    ],
    explain:
      'The test is always the same: destroy the whole — do the parts die? Yes → composition. No → aggregation.',
    source: 'Quiz 3 Q5, applied',
  },
  {
    id: 'w3-rel-scenario-playlist',
    conceptId: 'relationships',
    question:
      'A `Playlist` holds `Song` objects. Delete the playlist and the songs remain in the library. Which relationship?',
    options: ['Aggregation', 'Composition', 'Dependency', 'Association only, with no whole–part meaning'],
    answer: 0,
    why: [
      '',
      'Composition would require the songs to be destroyed with the playlist.',
      'The songs are held long-term in a collection, not used for one call.',
      'It *is* an association — but the question asks for the specific whole–part flavour, and containment where parts survive is aggregation.',
    ],
    explain:
      'Aggregation is the weak whole–part: the container groups parts it does not own. Songs, books, students in a club — all independently existing things.',
    source: 'Quiz 3 Q6, applied',
  },
  {
    id: 'w3-rel-scenario-order',
    conceptId: 'relationships',
    question:
      'An `Order` creates its own `OrderLine` objects in its constructor, and they are meaningless without it. Which relationship?',
    options: ['Composition', 'Aggregation', 'Dependency', 'Generalisation'],
    answer: 0,
    why: [
      '',
      'Aggregation implies the lines could exist on their own, and an order line without an order is nonsense.',
      'They are held for the whole life of the order, in a field.',
      'Generalisation is inheritance — an order line is not a kind of order.',
    ],
    explain:
      'Created by the whole, meaningless without the whole, destroyed with the whole. That is composition, and creating the part inside the constructor is its usual code signature.',
    source: 'Quiz 3 Q5 and Q15',
  },
  {
    id: 'w3-rel-local-variable',
    conceptId: 'relationships',
    code: `public class Report
{
    public void Generate()
    {
        Formatter f = new Formatter();
        Console.WriteLine(f.Format("done"));
    }
}`,
    question: 'What relationship does `Report` have with `Formatter`?',
    options: [
      'Dependency — the formatter is a local variable, gone when the method returns',
      'Composition — `Report` creates it with `new`, so it owns it',
      'Association — `Report` refers to a `Formatter`',
      'None — creating an object is not a relationship',
    ],
    answer: 0,
    why: [
      '',
      '`new` alone does not make composition; the object also has to be **kept**. This one is discarded at the closing brace.',
      'An association needs a field that persists between calls.',
      'It is a relationship — the weakest of the four, but a real one that belongs on a diagram.',
    ],
    explain:
      'Ask how long the link lives, not who created the object. A local variable dies with its stack frame, so the relationship dies with it too.',
    source: 'Quiz 3 Q2, applied',
    stretch: true,
  },
  {
    id: 'w3-rel-uml-diamonds',
    conceptId: 'relationships',
    question: 'In a UML class diagram, what does a **filled** diamond at one end of a line mean?',
    options: [
      'Composition — the class at the diamond end owns the parts',
      'Aggregation — the parts can exist independently',
      'Inheritance — the class at the diamond end is the parent',
      'Dependency — a temporary use',
    ],
    answer: 0,
    why: [
      '',
      'That is the **hollow** diamond. Filled is the strong one.',
      'Inheritance is a hollow *triangle*, not a diamond.',
      'Dependency is a dashed line with an open arrowhead and no diamond at all.',
    ],
    explain:
      'Hollow diamond = aggregation, filled diamond = composition, and the diamond always sits at the **whole** end. Hollow triangle = inheritance.',
    source: 'Lecture 3, UML relationship notation',
  },
  {
    id: 'w3-rel-inheritance-not',
    conceptId: 'relationships',
    question:
      'Which of these is **not** one of the has-a/uses-a relationships Week 3 is about?',
    options: [
      'A `Manager` is a kind of `Employee`',
      'A `Car` has an `Engine`',
      'A `Cart` holds `Product` objects',
      'A `Validator` is passed a `Form` to check',
    ],
    answer: 0,
    why: [
      '',
      'Association or composition, depending on ownership — a has-a.',
      'Aggregation — products exist outside the cart.',
      'Dependency — used for the length of the call.',
    ],
    explain:
      '"Is-a" is **inheritance**, which is Week 4. Week 3 is about the four ways objects *collaborate* rather than the way they are *related by type*.',
    source: 'Quiz 3 Q11, distractor analysis',
  },
  {
    id: 'w3-rel-early-design',
    conceptId: 'relationships',
    question: 'Why is it worth settling object relationships early in a design?',
    options: [
      'It saves implementation effort and reduces the refactoring needed later',
      'It removes the need to document the code',
      'It removes the need to test the code',
      'It lets you avoid applying OOP principles',
    ],
    answer: 0,
    why: [
      '',
      'Clear structure helps, but documentation is still documentation.',
      'Nothing about design replaces testing.',
      'Deciding relationships *applies* the principles — coupling, cohesion, encapsulation — rather than avoiding them.',
    ],
    explain:
      'Changing "the cart owns its products" to "the cart merely refers to them" after twenty classes depend on it is an expensive afternoon. On a diagram it is one line.',
    source: 'Quiz 3 Q16',
  },
  {
    id: 'w3-rel-collection-field',
    conceptId: 'relationships',
    code: `public class Team
{
    private List<Player> _players = new List<Player>();

    public void Add(Player p)
    {
        _players.Add(p);
    }
}`,
    question:
      'Players are created elsewhere and added to the team. What relationship does this code show?',
    options: [
      'Aggregation — the team holds players it did not create and does not own',
      'Composition — the team holds the only references to its players',
      'Dependency — `Add` takes a `Player` parameter',
      'Inheritance — `Team` extends `Player`',
    ],
    answer: 0,
    why: [
      '',
      'Composition would mean the team creates its players and they die with it; here they arrive from outside and can outlive it.',
      '`Add` does take a parameter, but the player is then **stored**, which is exactly what lifts it above a dependency.',
      'There is no `:` and no base class.',
    ],
    explain:
      'A collection field holding externally created objects is the standard shape of aggregation — and the standard shape of half the classes in Swin Adventure.',
    source: 'Quiz 3 Q6 · Lecture 3 Inventory demo',
  },
  {
    id: 'w3-rel-two-way',
    conceptId: 'relationships',
    question:
      'A `Player` has a field referring to its `Game`, and the `Game` has a list of its `Player`s. What is this called?',
    options: [
      'A bidirectional association — each holds a reference to the other',
      'Composition, because two links are stronger than one',
      'Inheritance, because the two classes now share data',
      'Illegal in C# — two classes cannot refer to each other',
    ],
    answer: 0,
    why: [
      '',
      'Direction and strength are separate questions. Two-way does not mean ownership.',
      'Sharing a reference is not sharing a type. Nothing here is an is-a.',
      'Mutual references are completely legal and very common.',
    ],
    explain:
      'Associations have a direction, and can point both ways. It is worth noticing because each direction is another link you have to keep consistent.',
    source: 'Quiz 3 Q11, extended',
    stretch: true,
  },

  // ------------------------------------------------------------ stack/heap
  {
    id: 'w3-where-object-lives',
    conceptId: 'stack-heap',
    code: `void Draw()
{
    int width = 5;
    Shape s = new Shape();
}`,
    question: 'Where do `width`, `s`, and the `Shape` object itself live?',
    options: [
      '`width` on the stack, `s` on the stack, the `Shape` object on the heap',
      'All three on the stack',
      'All three on the heap',
      '`width` on the heap, `s` and the `Shape` on the stack',
    ],
    answer: 0,
    why: [
      '',
      'Anything built with `new` is on the heap. Only the reference to it is a local.',
      '`int` locals and reference variables are both stack slots inside the method\'s frame.',
      'Exactly backwards — value-type locals are the stack case, objects the heap case.',
    ],
    explain:
      'Two separate questions: where the **variable** lives (a local → the stack) and where the **object** lives (built with `new` → the heap). `s` is a stack slot holding an address into the heap.',
    source: 'Quiz 3 Q12, applied',
  },
  {
    id: 'w3-why-two-regions',
    conceptId: 'stack-heap',
    question: 'Why does the runtime keep two separate memory regions at all?',
    options: [
      'The stack suits things whose size and lifetime are known in advance; the heap suits things that are not',
      'The stack is for the program and the heap is for the operating system',
      'The stack holds code and the heap holds data',
      'The heap is only used once the stack is full',
    ],
    answer: 0,
    why: [
      '',
      'Both belong to your process.',
      'Compiled code lives in its own region; both stack and heap hold data.',
      'They are used for different *kinds* of thing from the start, not in sequence.',
    ],
    explain:
      'A stack frame can be pushed and popped in one instruction because its size is fixed at compile time. An object that could grow, or outlive the method that made it, needs the heap.',
    source: 'Lecture 3, memory',
    stretch: true,
  },
  {
    id: 'w3-string-where',
    conceptId: 'stack-heap',
    question: 'A local variable `string name = "Amy";` — where does the text live?',
    options: [
      'On the heap; the stack slot holds a reference to it',
      'Entirely on the stack, because it is a local variable',
      'Entirely on the heap, including the variable `name`',
      'Nowhere — string literals are compiled away',
    ],
    answer: 0,
    why: [
      '',
      '`string` is a **reference type** in C#, no matter that it often behaves like a value.',
      'The variable `name` is a local, so its slot is in the stack frame.',
      'The literal has to exist somewhere at runtime for the reference to point at.',
    ],
    explain:
      '`string` is the reference type that most often gets misfiled as a value type, because it is immutable and compares by value. Its data is still on the heap.',
    source: 'Quiz 3 Q3, distractor analysis',
  },
  {
    id: 'w3-field-value-type',
    conceptId: 'stack-heap',
    code: `public class Counter
{
    private int _count;
}

Counter c = new Counter();`,
    question: 'Where does `_count` live?',
    options: [
      'On the heap, inside the `Counter` object',
      'On the stack, because `int` is a value type',
      'On the stack, in `Main`\'s frame next to `c`',
      'It has no storage until it is assigned',
    ],
    answer: 0,
    why: [
      '',
      'Being a value type decides *how* it stores its data, not *where*. A field goes wherever its object goes.',
      'Only `c` — the reference — is in the frame.',
      'Fields are allocated as part of the object and start at their type\'s default.',
    ],
    explain:
      'The trap in the Quiz 3 table: value types are on the stack **as locals**. As fields inside an object, they live in that object, on the heap.',
    source: 'Quiz 3 common traps table',
    stretch: true,
  },
  {
    id: 'w3-list-where',
    conceptId: 'stack-heap',
    question: 'A method declares `List<int> scores = new List<int>();`. What is on the stack?',
    options: [
      'Only the reference `scores` — the list object and its numbers are on the heap',
      'The whole list, since `int` is a value type',
      'Nothing — the entire statement is heap-allocated',
      'The list, with the numbers on the heap',
    ],
    answer: 0,
    why: [
      '',
      'The element type does not move the collection. `List<T>` is a class, so the object is on the heap.',
      'The local variable `scores` is a stack slot in the current frame.',
      'The list and its internal array are one heap structure; the list does not sit on the stack.',
    ],
    explain:
      'Reference variable on the stack, object on the heap, every time. The list can grow at runtime, which is exactly why it cannot live in a fixed-size frame.',
    source: 'Quiz 3 Q3, applied',
  },
  {
    id: 'w3-stack-size',
    conceptId: 'stack-heap',
    question: 'Which is true of the stack compared with the heap?',
    options: [
      'It is smaller, and memory on it is reclaimed automatically as methods return',
      'It is larger, and needs the garbage collector to reclaim it',
      'It stores every object created with `new`',
      'It survives after the method that created it returns',
    ],
    answer: 0,
    why: [
      '',
      'Backwards on both counts — that describes the heap.',
      '`new` always allocates on the heap.',
      'A frame is popped the moment its method returns.',
    ],
    explain:
      'Small, fast, automatic, short-lived: the stack. Large, flexible, garbage-collected, longer-lived: the heap.',
    source: 'Lecture 3, memory regions',
  },
  {
    id: 'w3-heap-lifetime',
    conceptId: 'stack-heap',
    code: `Shape Make()
{
    Shape s = new Shape();
    return s;
}`,
    question: 'The frame for `Make` is popped when it returns. What happens to the `Shape`?',
    options: [
      'It survives — it is on the heap, and the returned reference keeps it reachable',
      'It is destroyed with the frame, so the caller gets an invalid reference',
      'It is copied into the caller\'s frame',
      'It is copied to the heap on return',
    ],
    answer: 0,
    why: [
      '',
      'This is the C++ dangling-pointer instinct, and it is exactly what heap allocation and the GC prevent.',
      'The *reference* is copied back; the object never moves.',
      'It was already on the heap — `new` put it there.',
    ],
    explain:
      'This is the reason objects are on the heap at all: they must be able to outlive the method that created them.',
    source: 'Lecture 3, memory and returning objects',
  },
  {
    id: 'w3-value-in-object',
    conceptId: 'stack-heap',
    question: 'Which statement about value types is correct?',
    options: [
      'A value type holds its data directly, wherever the variable or field itself happens to live',
      'A value type is always on the stack, no matter where it is declared',
      'A value type is always on the heap',
      'A value type is a reference to a small object',
    ],
    answer: 0,
    why: [
      '',
      'Only true for locals. As a field it is inside its object, on the heap.',
      'Locals are the common case and they are on the stack.',
      'Holding data directly is precisely what makes it *not* a reference.',
    ],
    explain:
      'Value versus reference is about **what the storage contains** — the data itself, or an address. Stack versus heap is about **where that storage is**. Two independent questions.',
    source: 'Quiz 3 Q8 with the common traps table',
  },

  // ----------------------------------------------------- value vs reference
  {
    id: 'w3-assign-value-type',
    conceptId: 'value-ref',
    code: `int a = 5;
int b = a;
b = 10;
Console.WriteLine(a);`,
    question: 'What does this print?',
    options: ['`5`', '`10`', '`15`', 'Nothing — `a` was overwritten'],
    answer: 0,
    why: [
      '',
      'That is `b`. Assigning a value type copies the value, so the two are independent afterwards.',
      'Nothing adds them.',
      '`a` is never assigned again.',
    ],
    explain:
      'Value type assignment copies the **data**. Change the copy and the original is untouched — which is exactly what does *not* happen with objects.',
    source: 'Quiz 3 Q8, applied',
  },
  {
    id: 'w3-assign-reference-type',
    conceptId: 'value-ref',
    code: `Counter a = new Counter();
Counter b = a;
b.Increment();
Console.WriteLine(a.Count);`,
    question: 'Assuming a fresh counter starts at 0, what does this print?',
    options: ['`1`', '`0`', '`2`', 'A null reference error'],
    answer: 0,
    why: [
      '',
      'It would be 0 if `b = a` had copied the object. It copies the **reference**, so both names point at one counter.',
      'Only one `Increment()` call happens.',
      '`a` refers to a real object throughout.',
    ],
    explain:
      'Two variables, one object. This is aliasing, and it is the single most common source of surprise when moving from value thinking to reference thinking.',
    source: 'Quiz 3 Q7 and Q8, applied',
  },
  {
    id: 'w3-param-mutation',
    conceptId: 'value-ref',
    code: `void Bump(Counter c)
{
    c.Increment();
}

Counter mine = new Counter();
Bump(mine);
Console.WriteLine(mine.Count);`,
    question: 'What does this print?',
    options: ['`1`', '`0`', 'A compile error — objects cannot be passed to methods', 'Undefined'],
    answer: 0,
    why: [
      '',
      'The method received a copy of the *reference*, which still points at `mine`, so the increment is visible.',
      'Passing objects to methods is completely ordinary.',
      'The behaviour is fully specified.',
    ],
    explain:
      'A copy of the reference is passed, not a copy of the object. Both sides see the same heap object, so changes made through the parameter stick.',
    source: 'Quiz 3 Q7',
  },
  {
    id: 'w3-param-reassign',
    conceptId: 'value-ref',
    code: `void Replace(Counter c)
{
    c = new Counter();
    c.Increment();
}

Counter mine = new Counter();
Replace(mine);
Console.WriteLine(mine.Count);`,
    question: 'What does this print?',
    options: ['`0`', '`1`', '`2`', 'A null reference error'],
    answer: 0,
    why: [
      '',
      'The increment happened on the *new* counter, which only `c` inside the method could see.',
      'Nothing increments `mine` at all.',
      '`mine` still refers to its original object.',
    ],
    explain:
      'You can change the object a reference points to, and the caller sees it. **Reassigning the parameter itself** only changes the method\'s own copy of the reference. That is the difference between "by reference" and "a reference passed by value".',
    source: 'Quiz 3 Q7, distractor analysis',
    stretch: true,
  },
  {
    id: 'w3-which-are-value-types',
    conceptId: 'value-ref',
    question: 'Which group is made up entirely of **value** types?',
    options: [
      '`int`, `bool`, `double`, `struct`',
      '`int`, `string`, `bool`, `double`',
      '`string`, `object`, `List<int>`, `int[]`',
      '`class`, `interface`, `int`, `bool`',
    ],
    answer: 0,
    why: [
      '',
      '`string` is a reference type. It is the one that catches people out.',
      'That group is entirely reference types.',
      'Classes and interfaces produce reference types.',
    ],
    explain:
      'Value: the numeric types, `bool`, `char`, and any `struct` or `enum`. Reference: classes, interfaces, arrays, delegates — and `string`.',
    source: 'Quiz 3 Q3 and Q8',
  },
  {
    id: 'w3-null-meaning',
    conceptId: 'value-ref',
    question: 'What does it mean for a reference variable to be `null`?',
    options: [
      'It currently refers to no object at all',
      'It refers to an object whose fields are all zero',
      'It refers to an empty object created for you',
      'It is an uninitialised value type',
    ],
    answer: 0,
    why: [
      '',
      'That would be a real object with default fields, which is a different thing entirely.',
      'Nothing is created. `null` is the absence of a reference.',
      'Value types cannot be null unless explicitly made nullable (`int?`).',
    ],
    explain:
      'Only a reference can be null, and using one is what raises `NullReferenceException` — which is Week 5\'s most-traced exception.',
    source: 'Lecture 3, references · Quiz 5 Q7',
  },
  {
    id: 'w3-copy-vs-alias',
    conceptId: 'value-ref',
    question:
      'You want a genuinely independent copy of an object, so that changing one does not affect the other. Does `b = a;` do it?',
    options: [
      'No — that copies the reference. You need a method that builds and returns a new object',
      'Yes — assignment always copies the object',
      'Yes, but only for classes with no fields',
      'No — copying objects is impossible in C#',
    ],
    answer: 0,
    why: [
      '',
      'It copies the reference for a reference type. Only value types are copied wholesale.',
      'Field count changes nothing about how assignment works.',
      'It is perfectly possible; you just have to write the copying yourself.',
    ],
    explain:
      'C# gives you no free deep copy. If you need one, a constructor taking the original, or a `Clone` method, is how you write it.',
    source: 'Quiz 3 Q7, applied',
    stretch: true,
  },

  // ------------------------------------------------------------ call stack
  {
    id: 'w3-frame-contents',
    conceptId: 'call-stack',
    question: 'What does a stack frame hold?',
    options: [
      'The method\'s parameters and local variables, plus where to return to',
      'Every object the method creates',
      'The method\'s compiled code',
      'The whole program\'s variables',
    ],
    answer: 0,
    why: [
      '',
      'Objects go on the heap; the frame holds only the references to them.',
      'Code lives in its own region and is shared by every call.',
      'Each frame holds one call\'s locals — that is why recursion works at all.',
    ],
    explain:
      'One frame per call in progress. It is why two calls to the same method never tread on each other\'s variables.',
    source: 'Quiz 3 Q1, applied',
  },
  {
    id: 'w3-nested-calls',
    conceptId: 'call-stack',
    code: `void A() { B(); Console.WriteLine("A done"); }
void B() { C(); Console.WriteLine("B done"); }
void C() { Console.WriteLine("C done"); }

A();`,
    question: 'What is the output?',
    options: [
      '`C done`, `B done`, `A done`',
      '`A done`, `B done`, `C done`',
      '`A done`, `C done`, `B done`',
      '`C done` only',
    ],
    answer: 0,
    why: [
      '',
      'Each method calls the next *before* printing, so no outer method can finish first.',
      '`B` cannot print before `C` returns to it.',
      'Every method resumes after its callee returns.',
    ],
    explain:
      'Calls stack up and unwind in reverse. The last frame pushed is the first popped — which is also exactly how an exception searches for a handler in Week 5.',
    source: 'Lecture 3, the call stack',
  },
  {
    id: 'w3-locals-gone',
    conceptId: 'call-stack',
    question: 'What happens to a method\'s local variables when it returns?',
    options: [
      'They go with the frame — the storage is reclaimed immediately',
      'They stay until the garbage collector runs',
      'They are moved to the heap for safekeeping',
      'They keep their values for the next call to the same method',
    ],
    answer: 0,
    why: [
      '',
      'The GC manages the heap. Stack reclamation is immediate and needs no collector.',
      'Nothing is moved. Only the objects they *referred to* were ever on the heap.',
      'Each call gets fresh locals. A `static` field is what persists between calls.',
    ],
    explain:
      'Popping a frame is one pointer move. That is why stack memory is cheap and why nothing on it can outlive its method.',
    source: 'Quiz 3 Q1',
  },
  {
    id: 'w3-return-control',
    conceptId: 'call-stack',
    question: 'When a method finishes, where does execution continue?',
    options: [
      'In the caller, at the point just after the call',
      'At the start of the caller',
      'At the start of `Main`',
      'At whichever method was defined next in the file',
    ],
    answer: 0,
    why: [
      '',
      'The caller resumes, it does not restart — its own locals are still exactly as they were.',
      'Only when `Main` is the caller.',
      'Where methods appear in a file has no effect on execution order.',
    ],
    explain:
      'The return address is part of the frame, which is how the runtime knows precisely where to resume.',
    source: 'Quiz 3 Q1',
  },
  {
    id: 'w3-recursion-frames',
    conceptId: 'call-stack',
    question: 'A method calls itself four times before stopping. How many frames exist at the deepest point?',
    options: [
      'Five — the original call plus four nested ones',
      'One — a method has a single frame however many times it is called',
      'Four',
      'None — recursion does not use the stack',
    ],
    answer: 0,
    why: [
      '',
      'Frames belong to *calls*, not to methods. That is the whole reason recursion works.',
      'Count the first call too.',
      'Recursion is the clearest demonstration that it does.',
    ],
    explain:
      'Each call gets its own locals in its own frame. Run out of room for frames and you get the familiar `StackOverflowException`.',
    source: 'Lecture 3, the call stack',
    stretch: true,
  },
  {
    id: 'w3-heap-not-cleared',
    conceptId: 'call-stack',
    question:
      'A method creates three objects and returns without returning any of them. What happens at the moment it returns?',
    options: [
      'The frame is popped; the objects stay on the heap until the collector reclaims them',
      'The three objects are destroyed immediately along with the frame',
      'The objects are moved onto the caller\'s frame',
      'The runtime raises an error about leaked memory',
    ],
    answer: 0,
    why: [
      '',
      'Nothing is destroyed at return. They become *unreachable*, which is a different thing from being freed.',
      'Objects never move onto the stack.',
      'Unreachable objects are routine, not an error.',
    ],
    explain:
      'Returning drops the last references, so the objects become collectable. Collection then happens whenever the GC decides — not at the closing brace.',
    source: 'Quiz 3 Q1 with Q13',
    stretch: true,
  },

  // ------------------------------------------------------ garbage collection
  {
    id: 'w3-gc-what-it-manages',
    conceptId: 'gc',
    question: 'Which memory does the garbage collector manage?',
    options: [
      'The heap',
      'The stack',
      'Both the stack and the heap',
      'Neither — it manages the CPU cache',
    ],
    answer: 0,
    why: [
      '',
      'Stack frames pop automatically as methods return; no collector is involved.',
      'Only the heap needs a collector, because heap lifetimes are not tied to a method.',
      'Caches are hardware and nothing to do with the runtime.',
    ],
    explain:
      'The stack is self-managing because its lifetimes are nested. The heap is not, which is exactly why it needs collecting.',
    source: 'Quiz 3 Q13',
  },
  {
    id: 'w3-gc-when-collectable',
    conceptId: 'gc',
    question: 'When does an object become eligible for collection?',
    options: [
      'When nothing in the running program can reach it any more',
      'As soon as the method that created it returns',
      'As soon as you set one variable referring to it to `null`',
      'Exactly one second after its last use',
    ],
    answer: 0,
    why: [
      '',
      'Only if no reference escaped — the object may have been stored or returned.',
      'Only if that was the *last* reference. Another variable may still hold it.',
      'There is no timer.',
    ],
    explain:
      'Reachability, not scope and not a clock. If no chain of references from a live variable reaches the object, it is garbage.',
    source: 'Quiz 3 Q13, applied',
  },
  {
    id: 'w3-gc-nondeterministic',
    conceptId: 'gc',
    question: 'Why can you not predict exactly when an unreachable object\'s memory is reclaimed?',
    options: [
      'Collection is non-deterministic — it runs on the runtime\'s own thresholds',
      'The object is never actually reclaimed',
      'Reclaiming happens only when the program exits',
      'It depends on the order fields were declared in',
    ],
    answer: 0,
    why: [
      '',
      'It is reclaimed; you just do not control when.',
      'That would be no collector at all — a long-running server would exhaust memory.',
      'Declaration order has nothing to do with it.',
    ],
    explain:
      'The GC runs when allocation pressure warrants it. Correct code never depends on *when* — which is why `finally` and `IDisposable` exist for things that must be released promptly.',
    source: 'Quiz 3 Q13, common traps table',
  },
  {
    id: 'w3-gc-no-delete',
    conceptId: 'gc',
    question: 'Why does C# have no `delete` keyword when C++ does?',
    options: [
      'The collector frees unreachable heap objects for you, so freeing by hand is unnecessary and unsafe',
      'C# programs never allocate heap memory',
      'C# objects are all on the stack',
      'C# leaks memory by design',
    ],
    answer: 0,
    why: [
      '',
      'Every `new` allocates on the heap.',
      'Only value-type locals are.',
      'The collector exists precisely to prevent that.',
    ],
    explain:
      'Manual freeing invites the two classic bugs — freeing twice, and using memory after freeing it. Handing the job to the runtime removes both.',
    source: 'Lecture 3, garbage collection',
  },
  {
    id: 'w3-gc-still-leak',
    conceptId: 'gc',
    question: 'Can a C# program still hold on to memory it no longer needs?',
    options: [
      'Yes — an object referenced by a long-lived list is reachable, so it is never collected',
      'No — the collector reclaims everything eventually',
      'No — C# checks whether objects are still useful',
      'Only if the program uses `unsafe` code',
    ],
    answer: 0,
    why: [
      '',
      'It reclaims everything *unreachable*. A forgotten reference keeps an object reachable forever.',
      'The runtime cannot know what "useful" means; it only knows what is reachable.',
      '`unsafe` is not required to forget a reference.',
    ],
    explain:
      'The collector answers "can this be reached?", not "does anyone still want this?". A cache nobody clears is the usual real-world version of this.',
    source: 'Quiz 3 Q13, extended',
    stretch: true,
  },

  // ------------------------------------------------- UML sequence diagrams
  {
    id: 'w3-seq-family',
    conceptId: 'uml-sequence',
    question: 'A sequence diagram belongs to which family of UML diagrams?',
    options: [
      'Behaviour diagrams — it shows what happens over time',
      'Structure diagrams — it shows how classes are laid out',
      'Deployment diagrams — it shows where code runs',
      'It is not a UML diagram',
    ],
    answer: 0,
    why: [
      '',
      'Class, component and deployment diagrams are the structure family.',
      'Deployment is its own structure diagram, about hardware and processes.',
      'It is one of the most used diagrams in UML.',
    ],
    explain:
      'The time axis is the tell. Anything with one is behaviour; anything without one is structure.',
    source: 'Quiz 3 Q9 with Quiz 2 Q18',
  },
  {
    id: 'w3-seq-time-direction',
    conceptId: 'uml-sequence',
    question: 'In a sequence diagram, which way does time run?',
    options: [
      'Downwards — messages lower on the page happen later',
      'Left to right across the participants',
      'Right to left, following the return arrows',
      'Time is not represented at all',
    ],
    answer: 0,
    why: [
      '',
      'Horizontal position identifies *who*, not *when*.',
      'Returns point back to the caller, but they are still ordered top to bottom.',
      'Time is the diagram\'s entire vertical axis.',
    ],
    explain:
      'Participants across the top, time down the page. Reading one is simply reading the arrows top to bottom.',
    source: 'Lecture 3, sequence diagrams',
  },
  {
    id: 'w3-seq-lifeline-vs-activation',
    conceptId: 'uml-sequence',
    question: 'What is the difference between a lifeline and an activation box?',
    options: [
      'The lifeline is the object\'s whole lifespan; the activation box is the stretch where it is executing',
      'The lifeline shows execution; the activation box shows the object\'s lifespan',
      'They are two names for the same dashed line',
      'The lifeline shows inheritance; the activation box shows composition',
    ],
    answer: 0,
    why: [
      '',
      'Exactly reversed — this is the pairing Quiz 3\'s traps table warns about.',
      'One is a dashed line, the other a narrow rectangle drawn on it.',
      'Neither has anything to do with class relationships.',
    ],
    explain:
      'Dashed vertical line = the object exists. Narrow rectangle on it = the object is busy doing something right now.',
    source: 'Quiz 3 Q4 and Q10',
  },
  {
    id: 'w3-seq-return-arrow',
    conceptId: 'uml-sequence',
    question: 'Which notation is a **return** message?',
    options: [
      'A dashed line with an open arrowhead',
      'A solid line with a filled arrowhead',
      'A solid line with a hollow triangle',
      'A dashed line with a filled diamond',
    ],
    answer: 0,
    why: [
      '',
      'That is a synchronous call — the caller waits.',
      'A hollow triangle is inheritance, and belongs on a class diagram.',
      'A diamond is aggregation or composition, again a class-diagram notation.',
    ],
    explain:
      'Solid + filled head = call. Dashed + open head = return. Everything with a diamond or triangle belongs on a different diagram.',
    source: 'Quiz 3 Q14',
  },
  {
    id: 'w3-seq-x',
    conceptId: 'uml-sequence',
    question: 'What does a large **X** at the bottom of a lifeline mean?',
    options: [
      'The object is destroyed at that point',
      'The message failed',
      'An exception was thrown',
      'The diagram continues on another page',
    ],
    answer: 0,
    why: [
      '',
      'A failed message has no special standard notation here.',
      'Exceptions are usually shown as an ordinary message or a note.',
      'That would be a frame or a note, not an X.',
    ],
    explain:
      'The X marks the end of that object\'s existence — the counterpart to the lifeline\'s start.',
    source: 'Quiz 3 Q4, distractor analysis',
  },
  {
    id: 'w3-seq-read-scenario',
    conceptId: 'uml-sequence',
    code: `Player        Inventory        Item
  |               |               |
  |--Fetch(id)--->|               |
  |               |--AreYou(id)-->|
  |               |<---- true ----|
  |<--- item -----|               |`,
    question: 'Reading this fragment, which statement is true?',
    options: [
      '`Inventory` calls `AreYou` on `Item`, and `Item` returns `true`',
      '`Player` calls `AreYou` directly on `Item`',
      '`Item` calls `Fetch` on `Inventory`',
      'All three calls happen at the same time',
    ],
    answer: 0,
    why: [
      '',
      'The arrow for `AreYou` starts at `Inventory`, not at `Player`.',
      'The arrowhead on `Fetch` points at `Inventory`, so `Player` is the caller.',
      'Time runs downwards, so they are strictly ordered.',
    ],
    explain:
      'An arrow reads "from caller to receiver", and the dashed return reads back the other way. Follow the heads and the whole collaboration is legible.',
    source: 'Lecture 3, Inventory sequence walkthrough',
  },
  {
    id: 'w3-seq-what-it-cannot',
    conceptId: 'uml-sequence',
    question: 'What can a sequence diagram **not** tell you?',
    options: [
      'What fields each class declares and with what visibility',
      'Which object calls which',
      'The order the calls happen in',
      'Which object is executing at a given moment',
    ],
    answer: 0,
    why: [
      '',
      'That is what the arrows are.',
      'That is the vertical axis.',
      'That is what the activation boxes show.',
    ],
    explain:
      'Structure questions go to the class diagram, behaviour questions to the sequence diagram. Neither answers the other\'s questions, which is why the unit teaches both.',
    source: 'Quiz 3 Q9 with Quiz 2 Q5',
  },
  {
    id: 'w3-seq-participant-boxes',
    conceptId: 'uml-sequence',
    question: 'What do the boxes across the top of a sequence diagram represent?',
    options: [
      'The objects (or roles) taking part in this interaction',
      'The classes in the whole system',
      'The methods that will be called',
      'The steps of the algorithm, in order',
    ],
    answer: 0,
    why: [
      '',
      'Only the participants in *this* scenario appear, not every class you have.',
      'Methods are the arrows between the boxes.',
      'Steps run down the page, not across it.',
    ],
    explain:
      'A sequence diagram documents **one scenario**. That focus is what makes it readable where a diagram of the whole system would not be.',
    source: 'Lecture 3, sequence diagrams',
  },
];
