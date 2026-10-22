/**
 * Week 8 question bank — good OO design.
 *
 * Sourced from Quiz 8 (6 questions, all of them) and `Lecture 8.md` §1-§4.
 *
 * Like Week 7, this week is over-represented on the released mockup relative
 * to how little revision material it has: **mockup Q4 is Quiz 8 Q1 verbatim**
 * (the purpose of an "antisocial" class), and mockup Q3 asks the low-coupling
 * question Quiz 9 Q4 asks. Six revision questions, and the sample paper takes
 * two of its twenty from them.
 *
 * The four design goals — lazy, antisocial, conformist, plus the smells — are
 * the lecture's own framing and are worth learning as that set of words,
 * because the exam asks for them by those names.
 */

import type { FocusQuestion } from '../types';

export const WEEK8: FocusQuestion[] = [
  // ----------------------------------------------------------- lazy classes
  {
    id: 'w8-lazy-meaning',
    conceptId: 'lazy-class',
    question: 'What does it mean for a class to be "lazy" in good OO design?',
    options: [
      'It minimises its own responsibilities and delegates tasks when another object is better placed to do them',
      'It defers all its work until the program is about to exit',
      'It avoids being instantiated until something asks for it',
      'It leaves its fields uninitialised until they are first read',
    ],
    answer: 0,
    why: [
      '',
      'Nothing to do with *when* work happens. This is about **whose** work it is.',
      'That is lazy *instantiation*, a real but unrelated technique — and a different use of the word.',
      'That is lazy initialisation, again a different idea.',
    ],
    explain:
      'A lazy class hands a job to whichever object already has the data for it. It is the information expert principle seen from the other side: not "who should own this?" but "why am I doing this?".',
    source: 'Quiz 8 Q6',
  },
  {
    id: 'w8-lazy-delegate',
    conceptId: 'lazy-class',
    code: `public class Order
{
    private List<Item> _items;

    public double Total()
    {
        double sum = 0;
        foreach (Item i in _items)
            sum += i.UnitPrice * i.Quantity * (1 - i.DiscountRate);
        return sum;
    }
}`,
    question: 'What would a "lazier" `Order` do here?',
    options: [
      'Ask each `Item` for its own subtotal and add those up',
      'Make `_items` public so callers can total it themselves',
      'Cache the total so it is only calculated once',
      'Move `Total` into a static utility class',
    ],
    answer: 0,
    why: [
      '',
      'Exposing the field is the opposite of good design — it raises coupling and breaks encapsulation.',
      'Caching is a performance change. The question is about where the responsibility belongs.',
      'A static helper reaching into item internals keeps the same problem and adds a class.',
    ],
    explain:
      '`Order` is reaching into every `Item` for three fields to do arithmetic the `Item` could do itself. `sum += i.Subtotal()` delegates to the information expert and stops `Order` knowing how pricing works.',
    source: 'Lecture 8 §1, laziness',
    stretch: true,
  },
  {
    id: 'w8-lazy-vs-expert',
    conceptId: 'lazy-class',
    question: 'Laziness and the information expert principle relate how?',
    options: [
      'They are the same rule from two directions — delegate to whoever owns the data',
      'They conflict: one says do less, the other says take on more',
      'Laziness applies to classes, information expert applies only to interfaces',
      'They are unrelated; laziness is about performance',
    ],
    answer: 0,
    why: [
      '',
      'Information expert does not say "take on more" — it says take on what your *data* makes you the right owner of.',
      'Both are about classes and responsibilities.',
      'Laziness is a design principle, with no performance meaning here.',
    ],
    explain:
      'Information expert asks "who should own this?" and laziness asks "should this be mine?". Both land on the object that holds the data.',
    source: 'Lecture 8 §1; Lecture 6, information expert',
  },

  // ----------------------------------------------------- antisocial classes
  {
    id: 'w8-antisocial',
    conceptId: 'antisocial-class',
    question: 'What is the purpose of making a class "antisocial" in good OO design?',
    options: [
      'To prevent excessive communication between objects and reduce dependencies',
      'To minimise the number of objects created in the system',
      'To ensure objects can access and modify each other’s private data',
      'To increase the number of dependencies in the program',
    ],
    answer: 0,
    why: [
      '',
      'Nothing to do with how many objects exist.',
      'The exact opposite — unrestricted access to another object’s internals is what this principle forbids.',
      'The opposite of the goal. Fewer dependencies, not more.',
    ],
    explain:
      'An antisocial class keeps its interactions minimal and well defined, which lowers coupling: fewer dependencies means a change here is less likely to break something there.',
    source: 'Quiz 8 Q1 — and mockup paper Q4, word for word',
  },
  {
    id: 'w8-antisocial-blackjack',
    conceptId: 'antisocial-class',
    question:
      'In the blackjack example, why should a random `Player` object not be able to ask the `Deck` for the card at an arbitrary index?',
    options: [
      'It exposes information the player has no business knowing, and couples the player to how the deck stores cards',
      'Indexing a list is too slow to do during a game',
      'The index might be out of range',
      'Only one object at a time may read from a collection',
    ],
    answer: 0,
    why: [
      '',
      'Performance is not the concern; this is about what should be reachable at all.',
      'A real risk, but a separate one — a bounds check would not make the design acceptable.',
      'No such rule exists.',
    ],
    explain:
      'Two problems at once: a player who can read any card can cheat, and code depending on the deck being index-addressable breaks the moment the deck stores cards differently. Antisociality is information hiding applied between objects.',
    source: 'Lecture 11 §3 row 4; Lecture 8 §1',
  },
  {
    id: 'w8-antisocial-coupling',
    conceptId: 'antisocial-class',
    question: 'Which design quality does making classes antisocial most directly improve?',
    options: ['Low coupling', 'High cohesion', 'Polymorphism', 'Inheritance depth'],
    answer: 0,
    why: [
      '',
      'Cohesion is about what one class holds internally. Antisociality is about traffic *between* classes.',
      'Unrelated — polymorphism is about behaviour varying by type.',
      'Nothing to do with how deep a hierarchy is.',
    ],
    explain:
      'Fewer and narrower conversations between objects is the definition of lower coupling.',
    source: 'Quiz 8 Q1',
  },

  // ------------------------------------------------------------ conformity
  {
    id: 'w8-poor-conformity',
    conceptId: 'conformity',
    question: 'Which demonstrates poor conformity in OO design?',
    options: [
      'A `Square` class inheriting from `Rectangle` but allowing width and height to differ',
      'A `Circle` class inheriting from `Shape` and overriding `Draw`',
      'A class implementing two interfaces at once',
      'An abstract class with no abstract members',
    ],
    answer: 0,
    why: [
      '',
      'Textbook correct inheritance — a circle genuinely is a shape, and `Draw` genuinely varies by shape.',
      'Perfectly legal and common. A class may implement as many interfaces as it likes.',
      'Unusual, but it breaks no contract.',
    ],
    explain:
      'A `Rectangle` promises independently settable width and height; a `Square` cannot honour that and stay square. Code holding a `Rectangle` reference can then produce an invalid square without doing anything wrong — a Liskov Substitution violation.',
    source: 'Quiz 8 Q2',
  },
  {
    id: 'w8-liskov',
    conceptId: 'conformity',
    question: 'What does the Liskov Substitution Principle require?',
    options: [
      'A subtype must be usable anywhere its base type is expected, without breaking correctness',
      'A subclass must override every method of its base class',
      'A base class must be abstract',
      'A subclass must not add any members of its own',
    ],
    answer: 0,
    why: [
      '',
      'Overriding everything is neither required nor usually desirable — inheriting behaviour unchanged is the normal case.',
      'Plenty of correct hierarchies have concrete base classes.',
      'Adding members is exactly what a subclass is for.',
    ],
    explain:
      'The test is behavioural, not structural: swap the subclass in and ask whether code written against the base class still behaves correctly. If it can be surprised, conformity is broken.',
    source: 'Quiz 8 Q2',
  },
  {
    id: 'w8-conformity-contract',
    conceptId: 'conformity',
    code: `public class Bird
{
    public virtual void Fly() { /* ... */ }
}

public class Penguin : Bird
{
    public override void Fly()
    {
        throw new NotSupportedException("Penguins cannot fly");
    }
}`,
    question: 'What is the conformity problem here?',
    options: [
      '`Penguin` breaks the contract — code treating it as a `Bird` and calling `Fly` now crashes',
      'Nothing — throwing is a valid way to override a method',
      '`Fly` should not have been `virtual`',
      '`Penguin` should not inherit from `Bird`, because it has fewer fields',
    ],
    answer: 0,
    why: [
      '',
      'It compiles, which is the trap. Conformity is about behaviour, not whether the compiler objects.',
      '`virtual` is right for behaviour that varies by type; the problem is a subclass that cannot provide any version of it.',
      'Field count is irrelevant. A penguin genuinely is a bird — the error is putting `Fly` on `Bird`.',
    ],
    explain:
      'Same shape as Square/Rectangle: the base class promised something this subclass cannot deliver. The fix is in the hierarchy, not the override — `Fly` belongs on a narrower type like `IFlyingBird`.',
    source: 'Quiz 8 Q2; Lecture 8 §3, conformity',
    stretch: true,
  },

  // ------------------------------------------------------------------- MVC
  {
    id: 'w8-mvc-advantage',
    conceptId: 'mvc',
    question: 'What is an advantage of the Model-View-Controller pattern?',
    options: [
      'A change in one component has minimal impact on the others',
      'It allows data, display and logic to be written in one class',
      'It removes the need for a user interface',
      'It makes the program run faster',
    ],
    answer: 0,
    why: [
      '',
      'The exact opposite of what MVC does — separating those three is the entire pattern.',
      'The View *is* the interface. MVC organises it, it does not remove it.',
      'An organisational pattern, with no performance claim.',
    ],
    explain:
      'Model is the data, View presents it, Controller carries the logic between them. Because each has a clear and separate responsibility, how data is displayed can change without touching how it is stored.',
    source: 'Quiz 8 Q3',
  },
  {
    id: 'w8-mvc-parts',
    conceptId: 'mvc',
    question: 'In MVC, which component validates user input?',
    options: [
      'The Controller',
      'The Model, since it owns the data being validated',
      'The View, since that is where input arrives',
      'Whichever is convenient — MVC does not assign this',
    ],
    answer: 0,
    why: [
      '',
      'Lecture 9 calls this out explicitly: letting the data/model class handle raw user input is bad practice.',
      'The View collects input and displays results; deciding whether input is acceptable is logic.',
      'MVC assigns it quite clearly, which is why the GRASP Controller principle is named after it.',
    ],
    explain:
      'The Controller is the layer that interacts with the user and validates what arrives. This is GRASP’s Controller principle a week early, and the two questions are answered the same way.',
    source: 'Lecture 9 §6.3; Quiz 8 Q3',
  },
  {
    id: 'w8-mvc-which-part',
    conceptId: 'mvc',
    question: 'A class holding the application’s data and business rules, with no UI code, is which part of MVC?',
    options: ['The Model', 'The View', 'The Controller', 'None — MVC has no such part'],
    answer: 0,
    why: [
      '',
      'The View is presentation only.',
      'The Controller mediates; it does not own the data.',
      'Data is precisely what the Model is.',
    ],
    explain:
      'Model = what the application knows. A good sign you have the split right: the Model compiles with no reference to any UI type at all.',
    source: 'Quiz 8 Q3',
  },

  // --------------------------------------------------------- design smells
  {
    id: 'w8-deep-hierarchy',
    conceptId: 'design-smells',
    question: 'Why should deep inheritance hierarchies be avoided?',
    options: [
      'They make maintenance harder — a change at the top ripples through every level below',
      'C# does not allow more than three levels of inheritance',
      'They always run more slowly',
      'They make it impossible to use interfaces',
    ],
    answer: 0,
    why: [
      '',
      'C# imposes no such limit. The constraint is on *multiple* inheritance, not depth.',
      'Dispatch cost is not what makes deep hierarchies bad.',
      'Interfaces work fine at any depth.',
    ],
    explain:
      'Every level is another place behaviour can be overridden or subtly changed, so tracing the effect of a change gets harder with each one. Flatter hierarchies, or composition, are easier to reason about.',
    source: 'Quiz 8 Q5',
  },
  {
    id: 'w8-poly-over-ifelse',
    conceptId: 'design-smells',
    question: 'Which principle is applied to avoid large if/else or switch statements in OO design?',
    options: ['Polymorphism', 'Encapsulation', 'Abstraction', 'Composition'],
    answer: 0,
    why: [
      '',
      'Encapsulation hides data. It does not remove branching on type.',
      'Abstraction is about which details to model, not how behaviour is dispatched.',
      'Composition is a structural alternative to inheritance; it is not the answer to a type switch.',
    ],
    explain:
      'Each subclass supplies its own version of a shared method and the runtime picks by actual type. Type-specific logic ends up inside the relevant class, and adding a new type means adding a class rather than editing the chain.',
    source: 'Quiz 8 Q4',
  },
  {
    id: 'w8-smell-switch',
    conceptId: 'design-smells',
    code: `public double Area(Shape s)
{
    if (s.Kind == "circle")    return 3.14159 * s.R * s.R;
    else if (s.Kind == "rect") return s.W * s.H;
    else if (s.Kind == "tri")  return 0.5 * s.W * s.H;
    return 0;
}`,
    question: 'What is the smell, and what fixes it?',
    options: [
      'Branching on a type tag — give `Shape` an abstract `Area()` and let each subclass override it',
      'The magic number 3.14159 — replace it with `Math.PI`',
      'The method returns 0 instead of throwing on an unknown kind',
      'Nothing is wrong; a switch on type is the normal OO approach',
    ],
    answer: 0,
    why: [
      '',
      'Worth doing, but cosmetic next to the structural problem, and it leaves the chain intact.',
      'Also a real flaw, and also not the smell being asked about — the right design has no unknown kind to reach.',
      'This is precisely the pattern Quiz 8 Q4 says to replace.',
    ],
    explain:
      'A string type tag plus a branch per type is polymorphism done by hand. Adding a shape means editing this method; with overriding, it means adding a class and leaving every existing one alone — the open/closed principle.',
    source: 'Quiz 8 Q4; Lecture 8 §4, design smells',
    stretch: true,
  },

  // ----------------------------------------------------------- class size
  {
    id: 'w8-class-size',
    conceptId: 'class-size',
    question:
      'Fill in: a too ___ class is too problem-specific and cannot be reused, whereas a too ___ class is too generic and does not reduce complexity.',
    options: ['small, large', 'large, small', 'abstract, concrete', 'private, public'],
    answer: 0,
    why: [
      '',
      'Reversed. A class too narrowly tailored to one problem is the one that cannot be reused.',
      'Abstractness is a different axis entirely.',
      'Access modifiers have nothing to do with class size.',
    ],
    explain:
      'Both ends fail, for opposite reasons. Too small is over-fitted to one situation; too large tries to cover everything and encapsulates nothing — the God class again.',
    source: 'Quiz 10 Q6',
  },
  {
    id: 'w8-god-class',
    conceptId: 'class-size',
    question: 'What is a "God class"?',
    options: [
      'One class that has absorbed many unrelated responsibilities, with low cohesion',
      'A base class every other class inherits from',
      'A static class holding constants shared across the program',
      'A class that may only be instantiated once',
    ],
    answer: 0,
    why: [
      '',
      'A common root class may be unwise, but it is a different problem — this one is about responsibilities, not ancestry.',
      'A constants holder is small and focused. Not this.',
      'That is a Singleton, which is a deliberate pattern rather than a smell.',
    ],
    explain:
      'The failure mode at the large end of class size, and what low cohesion looks like when it has been left alone too long: one class that knows about everything, which nothing can change safely.',
    source: 'Quiz 10 Q6; Lecture 8 §4',
  },
  {
    id: 'w8-class-size-judgement',
    conceptId: 'class-size',
    question: 'What is the practical test for whether a class has grown too large?',
    options: [
      'Whether its responsibilities are still all about one topic',
      'Whether it exceeds 200 lines',
      'Whether it has more than ten methods',
      'Whether it has more fields than any other class',
    ],
    answer: 0,
    why: [
      '',
      'Line counts are a rough signal at best, and nothing in the unit sets a threshold.',
      'A cohesive class may well need more than ten methods.',
      'Field count relative to other classes means nothing on its own.',
    ],
    explain:
      'Cohesion is the test, not size. Ask whether the class can still say "I know everything about one specific topic" — if describing it needs an "and", that is the split.',
    source: 'Lecture 8 §4, class size tips',
  },

  // ------------------------------------------------------------- composite
  {
    id: 'w8-composite-bag',
    conceptId: 'composite-idea',
    question: 'In Swin Adventure, what makes `Bag` a composite?',
    options: [
      'A `Bag` is an `Item` that also holds an inventory of `Item`s, so bags can nest inside bags',
      'A `Bag` holds several different types at once',
      'A `Bag` is built from several smaller classes',
      'A `Bag` can be converted into an `Item` when needed',
    ],
    answer: 0,
    why: [
      '',
      'Holding a mixture of types is just a collection, not a composite.',
      '"Composed of parts" in the ordinary sense is not the same as the composite shape.',
      'No conversion happens. A `Bag` **is** an `Item`, permanently, by inheritance.',
    ],
    explain:
      'The defining trick: the container is itself one of the things it contains. That is what lets a bag go inside a bag, and what lets code that handles an item handle a whole tree of them without knowing.',
    source: 'Lecture 8 §0; Lecture 10 §7.3',
  },
  {
    id: 'w8-composite-uniform',
    conceptId: 'composite-idea',
    question: 'What does the composite shape buy a client that uses it?',
    options: [
      'It can treat one object and a whole tree of objects identically',
      'It makes objects use less memory',
      'It removes the need for inheritance',
      'It guarantees the tree stays only one level deep',
    ],
    answer: 0,
    why: [
      '',
      'Nothing to do with memory.',
      'The composite is usually *built* with inheritance or an interface — the shared component type is what makes it work.',
      'The opposite: arbitrary depth is the point.',
    ],
    explain:
      '`Locate("sword")` is written once and works whether the thing holding the sword is a player, a bag, or a bag inside a bag. The client never asks how deep the tree goes.',
    source: 'Lecture 8 §0; Quiz 10 Q4',
  },
  {
    id: 'w8-composite-recursive',
    conceptId: 'composite-idea',
    code: `public GameObject Locate(string id)
{
    if (AreYou(id)) return this;

    foreach (Item i in _items)
        if (i.AreYou(id)) return i;

    return null;
}`,
    question: 'Why does this `Bag.Locate` fail to find an item inside a nested bag?',
    options: [
      'It only asks each item whether it *is* the target, never asking a contained bag to search inside itself',
      '`AreYou` does not work on nested objects',
      '`_items` cannot hold a `Bag`',
      'It returns `null` too early, before the loop finishes',
    ],
    answer: 0,
    why: [
      '',
      '`AreYou` works fine; it is simply being asked the wrong question of a bag.',
      'It can, because `Bag` is an `Item` — that is exactly what makes the composite work and the bug possible.',
      'The `return null` is after the loop. The loop completes normally.',
    ],
    explain:
      'The search is one level deep. A bag in the list is asked "are you the sword?" and says no, when it should be asked `Locate(id)` so it can search its own contents. The fix is recursion — the deliberately failing test in Lecture 8 §0.',
    source: 'Lecture 8 §0, the nested search exercise',
    stretch: true,
  },
];
