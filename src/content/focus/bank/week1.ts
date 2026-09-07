/**
 * Week 1 question bank — objects, classes, encapsulation, constructors.
 *
 * Sourced question-by-question from Quiz 1 (14 questions), the Week 1 lecture,
 * and the two Week 1 items in Lecture 5's mock-test walkthrough (default
 * access modifier, constructor overloading). Where a question comes straight
 * out of a revision quiz its `source` says so, because the lecturer put the
 * real paper at "50-60% similar to the revision quiz" — a student deserves to
 * know which of these are the likely 50-60%.
 *
 * Distractors are not filler. Each one is a specific confusion the resources
 * name as a trap, so `why` can say what that answer would have been true of.
 */

import type { FocusQuestion } from '../types';

export const WEEK1: FocusQuestion[] = [
  {
    id: 'w1-attr-vs-behaviour',
    conceptId: 'attr-behaviour',
    question: 'For a `Car` class, which of these is a **behaviour** rather than an attribute?',
    options: ['`Brake()`', '`Colour`', '`Speed`', '`Model`'],
    answer: 0,
    why: [
      '',
      'Colour is a characteristic the car *has* — an attribute.',
      'Speed is a value the car holds, so it is an attribute. `Accelerate()` would be the behaviour that changes it.',
      'Model is data the car knows about itself — an attribute.',
    ],
    explain:
      'Attributes are what an object **knows**; behaviours are what it **can do**. A quick test: if it has parentheses and a verb, it is behaviour.',
    source: 'Quiz 1 Q1',
  },
  {
    id: 'w1-knows-vs-does',
    conceptId: 'attr-behaviour',
    question:
      'A `Student` class is described as knowing its name and grade, and being able to enrol and apply for graduation. Which pair are its **attributes**?',
    options: [
      '`Name` and `Grade`',
      '`Enrol()` and `ApplyForGraduation()`',
      '`Name` and `Enrol()`',
      '`Student` and `Grade`',
    ],
    answer: 0,
    why: [
      '',
      'Those are the two behaviours — the things it can do.',
      'One of each. `Enrol()` is behaviour.',
      '`Student` is the class itself, not one of its members.',
    ],
    explain:
      'Attributes are the nouns an object carries; behaviours are the verbs it performs. Splitting a specification into these two lists is the first move of any class design.',
    source: 'Lecture 1, the student analogy',
  },
  {
    id: 'w1-class-def',
    conceptId: 'class-object',
    question: 'What is a class?',
    options: [
      'A template or blueprint used to create objects',
      'A single instance holding its own data',
      'A method that runs when an object is created',
      'A variable inside an object that stores state',
    ],
    answer: 0,
    why: [
      '',
      'That is an **object** — the instance, not the plan it was built from.',
      'That is a **constructor**.',
      'That is a **field**.',
    ],
    explain:
      'One class, many objects. The class defines the metadata and behaviour every object of that kind shares; each object then carries its own values.',
    source: 'Quiz 1 Q3',
  },
  {
    id: 'w1-object-def',
    conceptId: 'class-object',
    question:
      'A unit has 260 enrolled students, all modelled by one `Student` class. How many objects is that?',
    options: [
      '260 — one object per student',
      '1 — the class is the object',
      '260 classes and 1 object',
      'It depends how many attributes `Student` has',
    ],
    answer: 0,
    why: [
      '',
      'The class is the blueprint. A blueprint is not one of the things it describes.',
      'Backwards: one class describes many objects, not the other way round.',
      'The number of objects has nothing to do with how many attributes the class declares.',
    ],
    explain:
      'Every student is *distinct* — different name, transcript, major — but they all share the same **metadata structure**. Same class, 260 instances.',
    source: 'Lecture 1, "What is an object?"',
  },
  {
    id: 'w1-why-oop',
    conceptId: 'oop-why',
    question: 'Why is object-oriented programming used for large software?',
    options: [
      'It manages complexity by breaking problems down into small parts, such as objects',
      'It makes programs run faster than procedural code',
      'It removes the need to write tests',
      'It uses less memory than procedural code',
    ],
    answer: 0,
    why: [
      '',
      'OOP is a design mindset, not a speed optimisation — an OO program is not inherently faster.',
      'Nothing about OOP removes the need for tests. Week 2 adds unit testing precisely *because* objects need it.',
      'Objects live on the heap and carry their own state; OOP is not chosen to save memory.',
    ],
    explain:
      'Divide and conquer. Each object owns a small, self-contained slice of the problem, which is what makes a big system traceable and testable.',
    source: 'Quiz 1 Q11',
  },
  {
    id: 'w1-proc-vs-oo',
    conceptId: 'oop-why',
    question:
      'In the Blackjack example, what is the main problem with the *procedural* approach?',
    options: [
      'Card logic is scattered across many standalone functions, so bugs are hard to trace',
      'Procedural code cannot use loops or arrays',
      'Procedural code cannot read user input',
      'C# does not allow standalone functions at all',
    ],
    answer: 0,
    why: [
      '',
      'Procedural code has loops and arrays; the complaint is about *where the logic lives*, not what the language can express.',
      'Input is unrelated to the comparison.',
      'C# does allow static methods — Week 1 Task 4 is exactly that. The point is about design, not legality.',
    ],
    explain:
      'The OO version gives each idea an owner: a `Game` owns a `Deck`, the `Deck` owns 52 `Card` objects, each `Player` tracks its own score. When a score is wrong you know which object to look inside.',
    source: 'Lecture 1, procedural vs object-oriented',
  },
  {
    id: 'w1-bundle',
    conceptId: 'encapsulation',
    question: 'What do objects bundle together into a single unit?',
    options: [
      'Data and functionality',
      'Classes and interfaces',
      'The stack and the heap',
      'Attributes and inheritance',
    ],
    answer: 0,
    why: [
      '',
      'Those are two kinds of *type*, not the two things an object holds.',
      'Those are memory regions the object lives in, not what it bundles.',
      'Inheritance is a relationship between classes, not something an individual object bundles.',
    ],
    explain:
      'Fields (what it knows) plus methods (what it does), in one unit. That bundling *is* encapsulation — and it is the mock test\'s first question.',
    source: 'Quiz 1 Q14, echoed by Lecture 5 mock walkthrough #1',
  },
  {
    id: 'w1-hide-fields',
    conceptId: 'encapsulation',
    question: 'How do you stop other classes seeing what an object knows?',
    options: [
      'Declare the fields `private`',
      'Declare the fields `public`',
      'Put the fields in a constructor',
      'Give the class no constructor',
    ],
    answer: 0,
    why: [
      '',
      '`public` is the opposite — it opens the field to any code anywhere.',
      'A constructor sets the initial values; it does not control who can read them afterwards.',
      'Constructors have nothing to do with visibility.',
    ],
    explain:
      '`private` restricts access to code inside the same class. Anything outside has to go through a property or method you wrote deliberately.',
    source: 'Quiz 1 Q4',
  },
  {
    id: 'w1-encap-def',
    conceptId: 'encapsulation',
    question: 'What does encapsulation do?',
    options: [
      'Prevents direct manipulation of an object\'s information',
      'Hides complexity by ignoring irrelevant detail',
      'Lets a child class reuse a parent class\'s code',
      'Allows one method name to behave differently per type',
    ],
    answer: 0,
    why: [
      '',
      'That is **abstraction** — a design-level decision about what to model at all.',
      'That is **inheritance**.',
      'That is **polymorphism**.',
    ],
    explain:
      'Encapsulation bundles data with the methods that act on it, and restricts direct access to that data with access modifiers. It is about enforcement.',
    source: 'Quiz 1 Q5',
  },
  {
    id: 'w1-abstraction-def',
    conceptId: 'abstraction',
    question: 'What is abstraction?',
    options: [
      'Focusing on essential characteristics and suppressing irrelevant details',
      'Making fields private so no other class can reach them',
      'Creating many objects from one class',
      'Letting a class inherit from more than one parent',
    ],
    answer: 0,
    why: [
      '',
      'That is encapsulation — the enforcement, not the decision about what matters.',
      'That is instantiation.',
      'C# does not allow that at all (single inheritance).',
    ],
    explain:
      'When a specification lands on your desk, abstraction is the skill of deciding *which* classes you need and the minimal attributes and behaviours each one carries.',
    source: 'Quiz 1 Q8',
  },
  {
    id: 'w1-abstraction-vs-encap',
    conceptId: 'abstraction',
    stretch: true,
    question:
      'A `Patient` class models only name, DOB and allergies — not eye colour or favourite film — and keeps them all `private`. Which part of that is abstraction?',
    options: [
      'Choosing to model only name, DOB and allergies',
      'Marking all three fields `private`',
      'Both, equally — the terms mean the same thing',
      'Neither; both are examples of encapsulation',
    ],
    answer: 0,
    why: [
      '',
      'That is the encapsulation half — enforcing *how* it is hidden.',
      'They are distinct. Mixing them up is on Quiz 1\'s own trap list.',
      'The modelling decision is not encapsulation.',
    ],
    explain:
      '**Abstraction** = deciding *what* to show (design-level simplification). **Encapsulation** = enforcing *how* it is hidden (`private`, properties). One is a judgement call, the other is a keyword.',
    source: 'Quiz 1 "Common traps"',
  },
  {
    id: 'w1-property-purpose',
    conceptId: 'properties',
    question: 'What is added to a class to provide controlled access to hidden data?',
    options: ['A property', 'A constructor', 'A public field', 'A namespace'],
    answer: 0,
    why: [
      '',
      'A constructor initialises the object once, at creation. It is not how you read a value later.',
      'A public field gives access, but *uncontrolled* access — it throws away the encapsulation you were protecting.',
      'A namespace organises type names; it has nothing to do with access to data.',
    ],
    explain:
      'A property is a public getter/setter pair over a private field. The data stays hidden, and every read or write goes through code you control.',
    source: 'Quiz 1 Q9',
  },
  {
    id: 'w1-property-code',
    conceptId: 'properties',
    code: `private string model;

public string Model
{
    get { return model; }
    set { model = value; }
}`,
    question: 'In this property, what is `value`?',
    options: [
      'The value being assigned, supplied automatically inside `set`',
      'A field that has to be declared elsewhere in the class',
      'The current contents of `model` before the assignment',
      'A keyword that makes the property read-only',
    ],
    answer: 0,
    why: [
      '',
      'You never declare it. `value` is a contextual keyword the compiler provides inside a setter.',
      'That is `model` itself. `value` is what is arriving, not what is already there.',
      'A read-only property is one written with no `set` accessor at all.',
    ],
    explain:
      'Writing `car.Model = "Corolla"` calls the setter with `value` bound to `"Corolla"`. That is the hook where a guard clause goes — reject a negative price, trim a name — which is the whole reason to prefer a property over a public field.',
    source: 'Quiz 1 Q9 code sample',
  },
  {
    id: 'w1-not-a-modifier',
    conceptId: 'access-modifiers',
    question: 'Which of these is **not** a C# access modifier?',
    options: ['`general`', '`protected`', '`private`', '`public`'],
    answer: 0,
    why: [
      '',
      '`protected` is real: same class plus derived classes.',
      '`private` is real: same class only.',
      '`public` is real: any code, anywhere.',
    ],
    explain:
      'There is no `general` in C#. The ones you need for this paper are `public`, `private` and `protected`.',
    source: 'Quiz 1 Q12',
  },
  {
    id: 'w1-default-access',
    conceptId: 'access-modifiers',
    code: `class Account
{
    decimal balance;      // no modifier written

    void Deposit(decimal amount) { balance += amount; }
}`,
    question: 'What is the accessibility of `balance` and `Deposit` here?',
    options: [
      'Both are `private`',
      'Both are `public`',
      '`balance` is private, `Deposit` is public',
      'Both are `protected`',
    ],
    answer: 0,
    why: [
      '',
      'That is Java\'s package-default thinking, not C#. C# is deliberately conservative.',
      'The default is the same for every kind of member — fields and methods alike.',
      '`protected` is never a default; you have to ask for it.',
    ],
    explain:
      'A class member with no access modifier is **private** in C#. The language defaults to the safest option so nothing is exposed by accident.',
    source: 'Quiz 4 Q4, and Lecture 5 mock walkthrough #5',
  },
  {
    id: 'w1-protected-who',
    conceptId: 'access-modifiers',
    question: 'Who can reach a `protected` member?',
    options: [
      'The class that declares it and any class derived from it',
      'Only the class that declares it',
      'Any code, anywhere',
      'Any class in the same file',
    ],
    answer: 0,
    why: [
      '',
      'That is `private`.',
      'That is `public`.',
      'C# accessibility is per class and per assembly, never per file.',
    ],
    explain:
      '`protected` is the middle setting, and it is what a base class uses for state its children legitimately need — Week 4\'s `Shape` keeps `x`, `y` and `colour` protected so `Rectangle` can draw with them.',
    source: 'Lecture 4, access levels',
  },
  {
    id: 'w1-ctor-signature',
    conceptId: 'constructors',
    question: 'What are the name and return type of a constructor?',
    options: [
      'The same name as its class, and no return type at all',
      'The same name as its class, and `void`',
      'Always `New`, and no return type',
      'Any name you like, returning the class type',
    ],
    answer: 0,
    why: [
      '',
      'Not even `void`. Writing `void` turns it into an ordinary method that happens to share the class name.',
      '`New` is not a convention in C#; the constructor takes the class\'s own name.',
      'A method that builds and returns an instance is a factory method, not a constructor.',
    ],
    explain:
      'Exact class name, no return type. That is how the compiler tells a constructor apart from a method in the first place.',
    source: 'Quiz 1 Q2',
  },
  {
    id: 'w1-ctor-role',
    conceptId: 'constructors',
    question: 'What initialises an object when it is created?',
    options: ['The constructor', 'The garbage collector', 'A property', 'The `Main` method'],
    answer: 0,
    why: [
      '',
      'The garbage collector is the other end of the lifecycle — it reclaims objects nothing references any more.',
      'A property gives access to data after the object exists.',
      '`Main` is the program entry point; it may *call* `new`, but the constructor does the initialising.',
    ],
    explain:
      'A constructor is invoked automatically by `new`, and its job is to put the object into a valid starting state.',
    source: 'Quiz 1 Q13',
  },
  {
    id: 'w1-default-ctor',
    conceptId: 'constructors',
    question: 'What happens if a class defines no constructor at all?',
    options: [
      'A parameterless default constructor is provided for you',
      'The class cannot be instantiated',
      'The compiler reports an error',
      'Its fields are left uninitialised and reading one crashes',
    ],
    answer: 0,
    why: [
      '',
      '`new MyClass()` still works — that is exactly what the free default constructor is for.',
      'No constructor is not an error; it is the common case for a small data class.',
      'Fields get their type\'s default value (`0`, `false`, `null`), which is not the same as a crash.',
    ],
    explain:
      'You get a free parameterless constructor **only while you write none of your own**. Define any constructor — even one taking parameters — and the free one disappears.',
    source: 'Quiz 1 Q10 (+ its trap note)',
  },
  {
    id: 'w1-ctor-disappears',
    conceptId: 'constructors',
    stretch: true,
    code: `class Counter
{
    private int count;
    public Counter(int start) { count = start; }
}

// elsewhere:
Counter c = new Counter();`,
    question: 'What happens on the last line?',
    options: [
      'It fails — there is no parameterless constructor any more',
      'It works, using the free default constructor',
      'It works, passing 0 for `start`',
      'It works, but leaves `count` undefined',
    ],
    answer: 0,
    why: [
      '',
      'The free one is withdrawn the moment you declare a constructor of your own.',
      'C# does not invent argument values. An optional parameter (`int start = 0`) would, but this one has none.',
      'It never gets as far as running.',
    ],
    explain:
      'Writing `Counter(int start)` removed the compiler-supplied `Counter()`. If you want both, declare both — that is constructor overloading, and a class may have as many as it likes provided each has a distinct parameter list.',
    source: 'Quiz 1 Q10 trap + Lecture 5 mock walkthrough #6',
  },
  {
    id: 'w1-ctor-count',
    conceptId: 'constructors',
    question: 'How many constructors can one class define?',
    options: [
      'Any number, as long as each has a different parameter signature',
      'Exactly one',
      'At most two — one parameterless and one with parameters',
      'Any number, even with identical parameter lists',
    ],
    answer: 0,
    why: [
      '',
      'One is the minimum useful number, not the maximum. Lab 5.1 asks for three on `Drawing` alone.',
      'There is no such cap.',
      'Two constructors with the same parameter list are indistinguishable at the call site, so the compiler rejects it.',
    ],
    explain:
      'Constructor overloading: unlimited constructors, each distinguished by its parameter signature. The mock test asks this directly.',
    source: 'Lecture 5 mock walkthrough #6',
  },
  {
    id: 'w1-ctor-output',
    conceptId: 'constructors',
    code: `class Car
{
    public string Model;

    public Car()
    {
        Model = "Unknown";
    }
}

class Program
{
    static void Main()
    {
        Car a = new Car();
        Console.WriteLine(a.Model);
    }
}`,
    question: 'What does this print?',
    options: ['`Unknown`', 'An empty line', '`null`', 'Nothing — it does not compile'],
    answer: 0,
    why: [
      '',
      'It would print blank only if `Model` were left as its default, but the constructor assigns to it first.',
      'A `string` field does default to `null`, but that default is overwritten before anything is printed.',
      'It compiles fine.',
    ],
    explain:
      '`new Car()` runs the constructor, which assigns `"Unknown"` to `Model`; the next line reads it back. Trace constructors first — they run before any other code touches the object.',
    source: 'Quiz 1 Q6',
  },
  {
    id: 'w1-phone-type',
    conceptId: 'datatypes',
    question: 'What is the best data type for storing a phone number?',
    options: ['`string`', '`int`', '`long`', '`double`'],
    answer: 0,
    why: [
      '',
      'An `int` drops the leading zero of `0412345678`, cannot hold `+`, and overflows for longer numbers.',
      'A `long` fixes the range but still loses the leading zero and cannot store `+` or spaces.',
      'A `double` adds floating-point rounding to all of the same problems.',
    ],
    explain:
      'A phone number is an **identifier**, not a quantity — you never add or multiply one. Leading zeros, `+61` country codes, hyphens and spaces all have to survive. Rule of thumb: if you would never do maths on it, store it as a `string`.',
    source: 'Quiz 1 Q7',
  },
  {
    id: 'w1-id-type',
    conceptId: 'datatypes',
    question:
      'A student ID is always exactly nine digits and is never used in a calculation. What should store it?',
    options: [
      '`string`',
      '`int`',
      '`double`',
      '`char`',
    ],
    answer: 0,
    why: [
      '',
      'Nine digits fits in an `int`, but the moment an ID starts with 0 the value is wrong, and you have invited arithmetic on something that is not a number.',
      'A `double` adds rounding to a value that must be exact.',
      'A `char` holds a single character.',
    ],
    explain:
      'Same rule as the phone number: it is an **identifier**, not a quantity. Fixed length does not make it numeric — it makes it a fixed-length string.',
    source: 'Quiz 1 Q7, applied',
  },

  /*
   * Third questions.
   *
   * Every concept carries at least three, so that a fix-up — which needs two
   * correct answers to close — can always be cleared on questions the student
   * has not just been shown the answer to. Two would force a re-run of the
   * very question they missed, which tests recall of an answer rather than
   * understanding of the idea.
   */
  {
    id: 'w1-instance-independence',
    conceptId: 'class-object',
    code: `Counter a = new Counter();
Counter b = new Counter();
a.Increment();`,
    question: 'What is true after this runs?',
    options: [
      '`a` and `b` are separate objects, and only `a`\'s count changed',
      'Both counts changed, because they share the class\'s data',
      '`b` is a copy of `a`, so both are at 1',
      'Only one `Counter` object exists',
    ],
    answer: 0,
    why: [
      '',
      'Ordinary fields belong to the object, not the class. (A `static` field would be shared — but that is a different thing you have to ask for.)',
      '`new` builds a fresh object; it copies nothing.',
      'Two `new` expressions make two objects.',
    ],
    explain:
      'One class, many objects, each with its own data. That independence is the whole reason 260 students can be modelled by one `Student` class.',
    source: 'Lecture 1, class vs object',
  },
  {
    id: 'w1-spec-to-members',
    conceptId: 'attr-behaviour',
    question:
      '"A `BankAccount` has an account number and a balance, and money can be deposited into it." How many attributes and behaviours does that describe?',
    options: [
      'Two attributes, one behaviour',
      'Three attributes, no behaviours',
      'One attribute, two behaviours',
      'Two attributes, two behaviours',
    ],
    answer: 0,
    why: [
      '',
      '"Money can be deposited" is an action, not a piece of stored data.',
      'The account number and the balance are both things the account *knows*.',
      'Only one action is described. Withdrawing is not mentioned.',
    ],
    explain:
      'Reading a specification and splitting it into "what it knows" and "what it does" is the first step of every lab in this unit — and what the nouns and verbs of the sentence are telling you.',
    source: 'Lecture 1, specification to design',
  },
  {
    id: 'w1-abstraction-workflow',
    conceptId: 'abstraction',
    question:
      'You are handed a client specification. According to the Week 1 workflow, what comes immediately after identifying the real-world entities?',
    options: [
      'Abstract each entity into a class — its attributes and behaviours',
      'Write the constructors',
      'Draw the sequence diagram',
      'Choose a design pattern',
    ],
    answer: 0,
    why: [
      '',
      'Constructors come once you know what the class holds.',
      'Sequence diagrams describe interaction, which needs classes to exist first.',
      'Design patterns are the last step, and a later week.',
    ],
    explain:
      'Entities → classes → relationships → objects → patterns. Abstraction is the second step: deciding the minimal set of attributes and behaviours each entity actually needs.',
    source: 'Lecture 1, from specification to design',
  },
  {
    id: 'w1-field-vs-property',
    conceptId: 'properties',
    question: 'What can a property do that a `public` field cannot?',
    options: [
      'Run code when the value is read or written — a guard, a trim, a rejection',
      'Store the value',
      'Be given a type',
      'Be accessed from another class',
    ],
    answer: 0,
    why: [
      '',
      'A field stores; a property is usually a gateway to a field that stores.',
      'Both are typed.',
      'A `public` field can be reached from anywhere too. That is exactly the problem with it.',
    ],
    explain:
      'The getter and setter are ordinary method bodies. That is where "a price may not be negative" lives — and there is nowhere to put that rule on a public field.',
    source: 'Lecture 2, properties and encapsulation',
  },
  {
    id: 'w1-money-type',
    conceptId: 'datatypes',
    question: 'Which of these genuinely wants a numeric type rather than a `string`?',
    options: [
      'An account balance',
      'A postcode',
      'A product code such as `SKU-0043`',
      'A student ID',
    ],
    answer: 0,
    why: [
      '',
      'Australian postcodes such as `0800` lose their leading zero as a number, and nobody adds two postcodes together.',
      'It has letters and a hyphen in it — it could not be numeric even if you wanted it to be.',
      'An identifier, not a quantity.',
    ],
    explain:
      'Apply the test in both directions: a balance is added to, subtracted from and compared, so it is a number. Everything else here is a label that happens to contain digits.',
    source: 'Quiz 1 Q7, generalised',
  },
  {
    id: 'w1-oop-still-matters',
    conceptId: 'oop-why',
    question:
      'The lecture gives several reasons OOP still matters even with AI coding tools. Which one is **not** among them?',
    options: [
      'AI cannot write object-oriented code',
      'You need the mindset to spot and fix bugs in AI-generated code',
      'Technical interviews test your own core coding ability',
      'Confidential projects cannot risk sending code to third-party tools',
    ],
    answer: 0,
    why: [
      '',
      'This is one of the reasons given — generated code still has bugs, and fixing them needs the mindset.',
      'Also given: employers are not hiring people to type prompts quickly.',
      'Also given: IP and patent exposure on confidential work.',
    ],
    explain:
      'The argument is never that the tools cannot produce OO code. It is that *you* need the design mindset to read it, fix it, work without it, and be interviewed on it.',
    source: 'Lecture 1, why this unit matters',
  },

  // ==========================================================================
  // Depth pass — added so a week's quiz can be sat several times without
  // repeating itself, and so every concept has enough questions for a paper
  // to draw a different one each time.
  //
  // The quiz questions above are the ones most likely to reappear verbatim.
  // These come from the same material asked a different way: the same idea
  // in code, as a scenario, as the false statement in a list, or pushed one
  // step past what the revision quiz asked. Sources still say where the idea
  // is from, so a student can tell a likely-to-reappear question from a
  // deliberately harder one.
  // ==========================================================================

  // ---------------------------------------------------------------- why OOP
  {
    id: 'w1-oop-how',
    conceptId: 'oop-why',
    question: 'How does object orientation actually manage complexity in a large program?',
    options: [
      'By breaking the problem into small parts — objects — each owning its own slice',
      'By making the compiled program run faster than a procedural one',
      'By removing the need to test the code',
      'By keeping all of the logic in a single file so it is easy to find',
    ],
    answer: 0,
    why: [
      '',
      'Speed is not the claim. An OO program is often slightly *slower*; the win is in how much of it a human can hold in their head at once.',
      'Nothing removes the need to test. Week 2 is entirely about testing OO code.',
      'That is the opposite. One enormous file is the thing objects exist to break up.',
    ],
    explain:
      'Divide and conquer. Each object is a small, self-contained piece of the problem, so a change to one is a change you can reason about without reading the rest.',
    source: 'Quiz 1 Q11',
  },
  {
    id: 'w1-oop-not-a-benefit',
    conceptId: 'oop-why',
    question: 'Which of these is **NOT** a reason to choose an object-oriented design?',
    options: [
      'It guarantees the program will run faster than the procedural version',
      'Data and the code that acts on it stay together in one place',
      'A large problem can be split across a team, one class at a time',
      'A change inside one object need not ripple through the whole program',
    ],
    answer: 0,
    why: [
      '',
      'That is exactly what an object is — bundled data *and* functionality.',
      'True, and it is a large part of why industry uses it.',
      'True — that is what encapsulation buys you.',
    ],
    explain:
      'Every benefit of OOP is about **managing complexity**, not about raw execution speed. If someone offers you performance as the reason, they are selling something else.',
    source: 'Lecture 1, why OOP',
  },
  {
    id: 'w1-oop-design-order',
    conceptId: 'oop-why',
    question:
      'You are handed a written specification for a system. What is the **first** thing an object-oriented design asks you to find in it?',
    options: [
      'The nouns — the things the system talks about, which become candidate classes',
      'The loops — how many times each step has to repeat',
      'The file format the data will be saved in',
      'The user interface layout',
    ],
    answer: 0,
    why: [
      '',
      'Loops are an implementation detail inside one method. They tell you nothing about how to divide the system up.',
      'Storage is a late decision. It cannot be made before you know what you are storing.',
      'The interface is what sits *on top of* the objects, and changes far more often than they do.',
    ],
    explain:
      'Nouns first: candidate classes. Then, for each, what it **knows** (attributes) and what it **can do** (behaviours). That split is the whole first move of OO design.',
    source: 'Lecture 1, identifying objects from a specification',
  },
  {
    id: 'w1-oop-vs-procedural-change',
    conceptId: 'oop-why',
    question:
      'A procedural program keeps student marks in a global array and has twelve functions that read it. What goes wrong when the marks have to become weighted?',
    options: [
      'Every one of the twelve functions is a place the change might have to be made',
      'The array will run out of memory',
      'Global variables cannot store decimals',
      'Nothing — procedural code is easier to change than object-oriented code',
    ],
    answer: 0,
    why: [
      '',
      'Capacity is not the issue. The issue is how many places know the internal shape of the data.',
      'They can. The type is unrelated to the design problem here.',
      'It is the reverse: the more code that touches shared data directly, the harder the change.',
    ],
    explain:
      'When data is public property, every piece of code that reads it becomes part of its definition. An object hides the data so there is exactly **one** place that understands its shape.',
    source: 'Lecture 1, managing complexity',
    stretch: true,
  },
  {
    id: 'w1-oop-object-count',
    conceptId: 'oop-why',
    question:
      'Which statement best captures the relationship between a problem and the objects you design for it?',
    options: [
      'Each object models one thing in the problem and owns the data and behaviour for it',
      'One object should be created per line of the specification',
      'Objects should be as large as possible so there are fewer of them',
      'Objects only exist to store data; behaviour belongs in a separate manager class',
    ],
    answer: 0,
    why: [
      '',
      'A specification line is not a design unit. Several lines usually describe one object.',
      'The opposite. A class that does everything is the same unmanageable blob a procedural program was.',
      'That is the anti-pattern OOP replaces — data with no behaviour is a record, not an object.',
    ],
    explain:
      'An object bundles **data and functionality** for one thing in the problem domain. Data with the behaviour stripped out and put elsewhere gives up the main benefit.',
    source: 'Quiz 1 Q14, applied',
  },

  // -------------------------------------------------------- class vs object
  {
    id: 'w1-new-keyword',
    conceptId: 'class-object',
    question: 'Which keyword creates an object from a class in C#?',
    options: ['`new`', '`class`', '`create`', '`object`'],
    answer: 0,
    why: [
      '',
      '`class` *declares* the blueprint. It does not build anything.',
      'There is no `create` keyword in C#.',
      '`object` is a type (the root of every type), not an instruction to build one.',
    ],
    explain:
      '`new ClassName(...)` does two things: allocates the object on the heap and runs the constructor on it.',
    source: 'Lecture 1, creating objects',
  },
  {
    id: 'w1-two-instances-output',
    conceptId: 'class-object',
    code: `Car a = new Car();
Car b = new Car();
a.Model = "Mustang";
b.Model = "Falcon";
Console.WriteLine(a.Model);`,
    question: 'What does this print?',
    options: ['`Mustang`', '`Falcon`', '`Mustang Falcon`', 'Nothing — `a` and `b` share one `Model`'],
    answer: 0,
    why: [
      '',
      'That is `b`\'s model. Setting `b.Model` cannot reach into `a`.',
      'Two separate `WriteLine` calls would be needed, and each object holds only one model.',
      'They do not share it. Each object built with `new` gets its own copy of every field.',
    ],
    explain:
      'One class, many objects — and **each object carries its own data**. The class says every `Car` has a `Model`; each `Car` decides what its own model is.',
    source: 'Quiz 1 Q3 and Q6, combined',
  },
  {
    id: 'w1-same-values-identity',
    conceptId: 'class-object',
    question:
      'Two `Point` objects are both created with x = 3 and y = 4. How many objects are on the heap?',
    options: [
      'Two — identical values do not make them the same object',
      'One — C# merges objects that hold the same values',
      'Two, but they share a single copy of `x` and `y`',
      'None until one of them is used',
    ],
    answer: 0,
    why: [
      '',
      'Nothing merges them. Each `new` allocates fresh memory.',
      'Fields are per-object. Sharing one copy is what `static` would mean, and neither field is static.',
      'The allocation happens at `new`, not at first use.',
    ],
    explain:
      'Every `new` produces a distinct object with its own identity, even when the values inside are equal. Equality of contents and identity of objects are different questions.',
    source: 'Lecture 1, objects as instances',
    stretch: true,
  },
  {
    id: 'w1-class-false-statement',
    conceptId: 'class-object',
    question: 'Which statement about classes is **FALSE**?',
    options: [
      'A class holds the data for each of its objects',
      'A class defines what attributes its objects will have',
      'A class defines what behaviours its objects will have',
      'Many objects can be created from one class',
    ],
    answer: 0,
    why: [
      '',
      'True — the class is where the attribute list is declared.',
      'True — methods are declared once on the class.',
      'True, and it is the point of having a class at all.',
    ],
    explain:
      'The class is the **plan**; the object holds the **data**. Confusing the two is the most common Quiz 1 slip — a class describes `Model`, an object is the one that says `"Mustang"`.',
    source: 'Quiz 1 Q3, common traps table',
  },
  {
    id: 'w1-object-bundles',
    conceptId: 'class-object',
    question: 'An object bundles which two things into a single unit?',
    options: [
      'Data (fields/attributes) and functionality (methods/behaviour)',
      'A class and its parent class',
      'The stack frame and the heap allocation',
      'The source file and its compiled output',
    ],
    answer: 0,
    why: [
      '',
      'That is inheritance, a relationship *between* classes — Week 4.',
      'Those are storage regions, not what an object is made of — Week 3.',
      'That is the build process, nothing to do with what an object contains.',
    ],
    explain:
      'This is the one-line definition of an object, and the sentence the definition of encapsulation is built on top of.',
    source: 'Quiz 1 Q14',
  },
  {
    id: 'w1-class-instance-terms',
    conceptId: 'class-object',
    question: 'In `Student s = new Student();`, which part is the **instance**?',
    options: [
      'The object built by `new Student()`, which `s` refers to',
      'The word `Student` on the left',
      'The variable name `s`',
      'The whole line, including the semicolon',
    ],
    answer: 0,
    why: [
      '',
      'That is the type of the variable — the class, the blueprint.',
      '`s` is a *reference* to the instance, not the instance itself. Week 3 makes a lot of this distinction.',
      'The line is a statement; the instance is the thing it produces.',
    ],
    explain:
      'Class on the left as a type, instance produced on the right by `new`, reference stored in the variable. Three different things on one line.',
    source: 'Lecture 1, terminology',
  },

  // ------------------------------------------------- attributes vs behaviour
  {
    id: 'w1-bank-behaviour',
    conceptId: 'attr-behaviour',
    question:
      'A `BankAccount` knows its balance and account number, and can deposit and withdraw. Which of these is a **behaviour**?',
    options: ['`Withdraw(amount)`', '`Balance`', '`AccountNumber`', '`Owner`'],
    answer: 0,
    why: [
      '',
      'A value the account holds — an attribute. `Deposit()` is the behaviour that changes it.',
      'Data the account knows about itself — an attribute.',
      'Also something it knows, so an attribute.',
    ],
    explain:
      'Split the specification into two lists: what it **knows** and what it **can do**. Verbs with parentheses land in the second list.',
    source: 'Quiz 1 Q1, applied',
  },
  {
    id: 'w1-behaviour-changes-attribute',
    conceptId: 'attr-behaviour',
    question:
      'A `Car` has an attribute `Speed` and a behaviour `Accelerate()`. What is the relationship between them?',
    options: [
      '`Accelerate()` is the behaviour that changes the value `Speed` holds',
      '`Speed` calls `Accelerate()` when it is read',
      'They are the same member written two ways',
      '`Speed` must be `public` for `Accelerate()` to work',
    ],
    answer: 0,
    why: [
      '',
      'Attributes do not call anything. They are values, not code.',
      'They are different kinds of member: one stores, one acts.',
      'The reverse — `Accelerate()` is a method *of the same class*, so it can reach a `private` `Speed` freely. That is the point of keeping it private.',
    ],
    explain:
      'Behaviours are the only things that should change attributes. That is encapsulation stated in terms of the knows/does split.',
    source: 'Quiz 1 Q1 with Q5',
  },
  {
    id: 'w1-odd-one-out-book',
    conceptId: 'attr-behaviour',
    question:
      'A `Book` class has `Title`, `Author`, `Pages` and `Borrow()`. Which is the odd one out, and why?',
    options: [
      '`Borrow()` — the only behaviour among three attributes',
      '`Pages` — the only number among three strings',
      '`Title` — the only one a user types in',
      '`Author` — the only one that could be another object',
    ],
    answer: 0,
    why: [
      '',
      'True as a fact about types, but the question is about the knows/does split, which is the design distinction.',
      'Where a value comes from is not a member category.',
      'It could be, but that does not separate it from the other attributes.',
    ],
    explain:
      'The useful cut through a class\'s members is always attributes versus behaviours. Data types and origins matter later.',
    source: 'Quiz 1 Q1, applied',
  },
  {
    id: 'w1-attribute-in-code',
    conceptId: 'attr-behaviour',
    question: 'In C#, an attribute of a class is written in code as…',
    options: [
      'A field (usually `private`), often exposed through a property',
      'A method with no parameters',
      'A constructor',
      'A separate class',
    ],
    answer: 0,
    why: [
      '',
      'A method is a behaviour, even when it takes no arguments.',
      'A constructor initialises the attributes; it is not one.',
      'A class is the whole blueprint, not one thing inside it.',
    ],
    explain:
      'Attribute is the design word; **field** is the C# word for where the value lives, and **property** is the controlled way other classes reach it.',
    source: 'Quiz 1 Q1 and Q9, joined',
  },
  {
    id: 'w1-spec-both-lists',
    conceptId: 'attr-behaviour',
    question:
      '"A `Timer` records how many seconds have elapsed, and can be started, stopped and reset." How many attributes and how many behaviours does that sentence describe?',
    options: [
      '1 attribute, 3 behaviours',
      '3 attributes, 1 behaviour',
      '4 attributes, 0 behaviours',
      '0 attributes, 4 behaviours',
    ],
    answer: 0,
    why: [
      '',
      'Reversed. "Started", "stopped" and "reset" are all things the timer *does*.',
      '"Can be started" is not something the timer knows.',
      '"Records how many seconds have elapsed" is data it holds.',
    ],
    explain:
      'Reading a specification is mostly this exercise: verbs on one side, nouns on the other. The elapsed seconds is the state; start/stop/reset are the operations on that state.',
    source: 'Lecture 1, the student analogy, applied',
  },

  // -------------------------------------------------------- encapsulation
  {
    id: 'w1-encap-benefit',
    conceptId: 'encapsulation',
    question:
      'A class stores a temperature in Celsius in a `private` field and exposes it through a property. Later it has to store Fahrenheit internally. What does encapsulation buy you?',
    options: [
      'The internals can change without any other class needing to be edited',
      'The program runs faster after the change',
      'The compiler converts the units automatically',
      'The field no longer needs a type',
    ],
    answer: 0,
    why: [
      '',
      'Nothing about hiding a field affects speed.',
      'Nothing converts units for you — the property does, and it can, precisely because callers go through it.',
      'Every field has a type regardless of visibility.',
    ],
    explain:
      'Hiding the field means no other class ever depended on its shape, so the change stops at the class boundary. That is what "restricting direct access" is *for*.',
    source: 'Quiz 1 Q5, applied',
    stretch: true,
  },
  {
    id: 'w1-encap-fix-the-code',
    conceptId: 'encapsulation',
    code: `public class Account
{
    public double balance;
}`,
    question: 'What is wrong with this class, from an encapsulation point of view?',
    options: [
      '`balance` is public, so any code anywhere can set it to any value — including a negative one',
      'It has no methods, so it cannot be compiled',
      '`double` is the wrong type for money',
      'The class is missing the `private` keyword before `class`',
    ],
    answer: 0,
    why: [
      '',
      'A class with only fields compiles fine. It is a design problem, not a compile error.',
      'Arguably true in real systems, but it is not the encapsulation failure the question is about.',
      'Top-level classes cannot be `private`, and their visibility is not the issue here.',
    ],
    explain:
      'A public field is an open door: the class can no longer guarantee anything about its own state. Make it `private` and add a property (or methods) that enforce the rules.',
    source: 'Quiz 1 Q4 and Q9',
  },
  {
    id: 'w1-encap-validation',
    conceptId: 'encapsulation',
    code: `private int _age;

public int Age
{
    get { return _age; }
    set { if (value >= 0) _age = value; }
}`,
    question: 'What does writing the class this way make possible that a public field would not?',
    options: [
      'The class can reject values that would leave it in an invalid state',
      'The value can be read faster',
      'The field no longer takes up memory',
      'Other classes can now change `_age` directly',
    ],
    answer: 0,
    why: [
      '',
      'A property call is if anything a fraction slower. Correctness is the reason, not speed.',
      'The field is still there holding the value.',
      'The exact opposite — `_age` is `private`, so the setter is the only way in.',
    ],
    explain:
      'This is the practical payoff of encapsulation: there is exactly one door into the data, so a rule written at that door holds for the whole program.',
    source: 'Quiz 1 Q9, applied',
  },
  {
    id: 'w1-encap-which-not',
    conceptId: 'encapsulation',
    question: 'Which of these **works against** encapsulation?',
    options: [
      'Making every field `public` so other classes can read them conveniently',
      'Marking fields `private` and adding properties for the ones that must be visible',
      'Keeping the methods that change a field in the same class as the field',
      'Validating a new value inside a property setter',
    ],
    answer: 0,
    why: [
      '',
      'That is the textbook shape of an encapsulated class.',
      'Data and the behaviour that acts on it living together *is* encapsulation.',
      'Validating at the boundary is exactly what the boundary is for.',
    ],
    explain:
      'Convenience for the caller is the usual excuse for breaking encapsulation, and the usual regret. Expose what must be exposed, through a gate you control.',
    source: 'Quiz 1 Q4, common traps table',
  },
  {
    id: 'w1-encap-single-unit',
    conceptId: 'encapsulation',
    question: 'Encapsulation is best described as…',
    options: [
      'Bundling data and methods into one unit while restricting direct access to that data',
      'Hiding complexity by ignoring the irrelevant details of a real-world thing',
      'Letting one class acquire the members of another',
      'Choosing which data type best fits a value',
    ],
    answer: 0,
    why: [
      '',
      'That is **abstraction**. The two are examined side by side almost every year.',
      'That is inheritance — Week 4.',
      'That is a data-type decision, unrelated.',
    ],
    explain:
      'Two halves, and the exam wants both: **bundle** data with behaviour, and **restrict** direct access using access modifiers.',
    source: 'Quiz 1 Q5',
  },
  {
    id: 'w1-encap-public-risk',
    conceptId: 'encapsulation',
    question:
      'Six classes read and write a public `Score` field directly. A bug appears where a score goes negative. Why is this hard to track down?',
    options: [
      'Any of the six could have written the bad value — there is no single place to check',
      'Public fields cannot be inspected in a debugger',
      'The compiler will not report the line number of a public field',
      'Negative numbers cannot be stored in a public field',
    ],
    answer: 0,
    why: [
      '',
      'They can be inspected perfectly well. The problem is how many writers there are.',
      'Line numbers are unaffected by visibility.',
      'The type decides what values fit, not the modifier.',
    ],
    explain:
      'The number of places that can change a value is the number of suspects. Encapsulation reduces that number to one — which is a debugging argument as much as a design one.',
    source: 'Lecture 1, why hide data',
    stretch: true,
  },
  {
    id: 'w1-encap-method-access',
    conceptId: 'encapsulation',
    code: `public class Counter
{
    private int _count;

    public void Increment()
    {
        _count++;
    }
}`,
    question: 'Is `Increment()` allowed to touch `_count`, given that `_count` is `private`?',
    options: [
      'Yes — `private` means "this class only", and `Increment()` is in this class',
      'No — `private` means nothing outside the method that declared it can see it',
      'Only if `_count` is also marked `public`',
      'Only if `Increment()` is marked `private` too',
    ],
    answer: 0,
    why: [
      '',
      '`private` is scoped to the **class**, not to a single method.',
      'Making it public would be the mistake — the class would then lose control of it.',
      'The visibility of the method is a separate decision. `Increment()` is meant to be callable from outside.',
    ],
    explain:
      'This is the shape every encapsulated class takes: hidden data, public behaviour that is the only way to change it.',
    source: 'Quiz 1 Q4, applied',
  },

  // ------------------------------------------------------------ abstraction
  {
    id: 'w1-abstraction-choose',
    conceptId: 'abstraction',
    question:
      'You are modelling a `Student` for a university enrolment system. Which detail does abstraction tell you to leave out?',
    options: [
      'Their favourite colour',
      'Their student ID',
      'The units they are enrolled in',
      'Their name',
    ],
    answer: 0,
    why: [
      '',
      'The identifier the whole system is keyed on — essential.',
      'Enrolment is the point of the system.',
      'Needed on every list and transcript the system prints.',
    ],
    explain:
      'Abstraction is a decision about **what matters for this system**. The same real student modelled for a social app would keep entirely different attributes.',
    source: 'Quiz 1 Q8, applied',
  },
  {
    id: 'w1-abstraction-vs-encap-level',
    conceptId: 'abstraction',
    question:
      'Which sentence correctly separates abstraction from encapsulation?',
    options: [
      'Abstraction decides *what* to show; encapsulation enforces *how* it is hidden',
      'Abstraction hides data; encapsulation hides methods',
      'Abstraction is a C# keyword; encapsulation is a design idea',
      'They are two names for the same thing',
    ],
    answer: 0,
    why: [
      '',
      'Encapsulation hides data and exposes behaviour. Abstraction is not about hiding data at all.',
      '`abstract` is a keyword, but *abstraction* is the design idea — and encapsulation is enforced by real keywords (`private`, `protected`).',
      'They are examined precisely because they are not.',
    ],
    explain:
      'Abstraction is design-level simplification: which characteristics are essential. Encapsulation is the language mechanism that keeps the hidden parts hidden.',
    source: 'Quiz 1 Q8, common traps table',
  },
  {
    id: 'w1-abstraction-false',
    conceptId: 'abstraction',
    question: 'Which statement about abstraction is **FALSE**?',
    options: [
      'Abstraction is achieved in C# by marking fields `private`',
      'Abstraction focuses on the essential characteristics of a thing',
      'Abstraction suppresses irrelevant detail to reduce complexity',
      'The same real-world thing may be abstracted differently in two different systems',
    ],
    answer: 0,
    why: [
      '',
      'True — that is the definition.',
      'True, and it is why two systems model the same object differently.',
      'True: a `Car` in a racing game and a `Car` at a dealership share almost no attributes.',
    ],
    explain:
      '`private` is the tool of **encapsulation**. Abstraction happens earlier, on paper, when you decide which attributes exist at all.',
    source: 'Quiz 1 Q8, common traps table',
  },
  {
    id: 'w1-abstraction-uml-link',
    conceptId: 'abstraction',
    question:
      'Why do two teams modelling the same real-world `Car` end up with different class diagrams?',
    options: [
      'Each abstracts the car for its own purpose, keeping only what its system needs',
      'One of them has made a mistake — there is one correct model of a car',
      'UML allows only one class per diagram, so they had to split it differently',
      'Class diagrams cannot show attributes, so the difference is cosmetic',
    ],
    answer: 0,
    why: [
      '',
      'There is no single true model. A model is always a model *of something, for something*.',
      'A class diagram happily holds many classes.',
      'Attributes are the second compartment of every class box — Week 2 covers this.',
    ],
    explain:
      'Abstraction is purpose-relative. A racing game needs `TopSpeed` and `Grip`; a dealership needs `Price` and `VIN`. Neither is wrong.',
    source: 'Lecture 1, abstraction',
    stretch: true,
  },

  // ------------------------------------------------------- access modifiers
  {
    id: 'w1-modifier-derived',
    conceptId: 'access-modifiers',
    question:
      'Which access modifier lets the class itself **and its derived classes** use a member, but nothing else?',
    options: ['`protected`', '`private`', '`public`', '`internal`'],
    answer: 0,
    why: [
      '',
      '`private` shuts derived classes out too — they inherit the member but cannot touch it.',
      '`public` lets *everything* in, which is more than was asked for.',
      '`internal` is about the assembly (project), not the inheritance chain.',
    ],
    explain:
      'The three examined regularly: `public` = anywhere, `private` = this class only, `protected` = this class plus anything that inherits from it. Week 4 leans on `protected` heavily.',
    source: 'Quiz 1 Q12, table',
  },
  {
    id: 'w1-no-modifier-code',
    conceptId: 'access-modifiers',
    code: `public class Counter
{
    int _count;
}`,
    question: 'What is the visibility of `_count`?',
    options: [
      '`private` — class members default to private when no modifier is written',
      '`public` — anything not marked otherwise is visible',
      '`internal` — that is the default in C#',
      '`protected` — it is visible to subclasses only',
    ],
    answer: 0,
    why: [
      '',
      'C# never defaults a member to public. That would make encapsulation opt-in.',
      '`internal` is the default for the **top-level class**, not for a member inside one. That mismatch is the trap.',
      'Nothing defaults to `protected`; you must ask for it.',
    ],
    explain:
      'Members default to `private`; top-level classes default to `internal`. Lecture 5 flagged this exact distinction as a mock-test question.',
    source: 'Quiz 4 Q4 · Lecture 5 mock walkthrough',
  },
  {
    id: 'w1-modifier-public-means',
    conceptId: 'access-modifiers',
    question: '`public` on a member means it can be used by…',
    options: [
      'Any code, anywhere it can reach the object',
      'Only code in the same class',
      'Only code in the same file',
      'Only derived classes',
    ],
    answer: 0,
    why: [
      '',
      'That is `private`.',
      'C# visibility is not file-based; that is a C++ header habit.',
      'That is `protected`.',
    ],
    explain:
      'Being public is a promise you have to keep: anything public becomes part of the contract other code is allowed to rely on.',
    source: 'Quiz 1 Q12, table',
  },
  {
    id: 'w1-private-other-class',
    conceptId: 'access-modifiers',
    code: `public class Wallet
{
    private double _cash;
}

public class Thief
{
    public void Steal(Wallet w)
    {
        w._cash = 0;
    }
}`,
    question: 'What happens with this code?',
    options: [
      'It fails to compile — `_cash` is private to `Wallet`',
      'It compiles and sets the wallet to zero',
      'It compiles but silently does nothing',
      'It compiles only if `Thief` is in the same file as `Wallet`',
    ],
    answer: 0,
    why: [
      '',
      '`private` is enforced by the compiler, not by convention.',
      'C# has no silent no-op for a visibility violation — it is an error.',
      'Same file makes no difference. `private` means *same class*.',
    ],
    explain:
      '`private` is class-scoped, so even code holding a reference to the object cannot reach inside it. That guarantee is what makes hidden state trustworthy.',
    source: 'Quiz 1 Q4, applied',
  },
  {
    id: 'w1-modifier-choose',
    conceptId: 'access-modifiers',
    question:
      'You are writing a base class `Shape` with a field that every subclass needs to read, but no outside code should touch. Which modifier?',
    options: ['`protected`', '`public`', '`private`', 'No modifier at all'],
    answer: 0,
    why: [
      '',
      'That opens it to the entire program, not just subclasses.',
      '`private` shuts the subclasses out — they would inherit the field but be unable to use it.',
      'No modifier means `private`, which has the same problem.',
    ],
    explain:
      'This is the exact situation `protected` exists for, and it is why the `Shape`/`Circle` hierarchy in Week 4 uses it.',
    source: 'Quiz 1 Q12 with Week 4 usage',
  },
  {
    id: 'w1-not-a-modifier-2',
    conceptId: 'access-modifiers',
    question: 'Which of these **is** a real C# access modifier?',
    options: ['`internal`', '`general`', '`global`', '`shared`'],
    answer: 0,
    why: [
      '',
      '`general` is the classic made-up distractor — it does not exist in any C# version.',
      'No such modifier. `global::` is a namespace qualifier, which is a different thing entirely.',
      '`shared` is Visual Basic\'s word for `static`, and `static` is not an access modifier anyway.',
    ],
    explain:
      '`public`, `private`, `protected`, `internal` (and the combinations `protected internal`, `private protected`). Anything else on the list is invented.',
    source: 'Quiz 1 Q12',
  },
  {
    id: 'w1-modifier-static-trap',
    conceptId: 'access-modifiers',
    question: 'Is `static` an access modifier?',
    options: [
      'No — it says the member belongs to the class rather than to an instance',
      'Yes — it is the fourth one after public, private and protected',
      'Yes — it means "visible everywhere"',
      'No — it is only valid on classes, never on members',
    ],
    answer: 0,
    why: [
      '',
      'It is a *modifier*, but not an **access** modifier: it changes ownership, not visibility.',
      'That is `public`. A `static` member can still be `private`.',
      '`static` is used on fields, methods and properties all the time.',
    ],
    explain:
      'Visibility and instance-versus-class are independent choices: `private static`, `public static` and plain `public` are all perfectly ordinary.',
    source: 'Lecture 1, class members',
    stretch: true,
  },

  // ----------------------------------------------------------- constructors
  {
    id: 'w1-ctor-void-trap',
    conceptId: 'constructors',
    code: `public class Car
{
    public void Car()
    {
        Console.WriteLine("built");
    }
}`,
    question: 'Is `Car()` here a constructor?',
    options: [
      'No — it has a return type (`void`), so it is an ordinary method that happens to share the class name',
      'Yes — the name matches the class, which is all that is required',
      'Yes, and it will print "built" when `new Car()` runs',
      'No — a constructor may not print anything',
    ],
    answer: 0,
    why: [
      '',
      'The name is only half the rule. **No return type at all** is the other half.',
      'It will not run on `new`. You would have to call `myCar.Car()` yourself.',
      'A constructor can print, log, or do anything else a method can.',
    ],
    explain:
      'Same name as the class **and no return type — not even `void`**. Writing `void` quietly turns it into a method, and the class silently gets the free default constructor instead.',
    source: 'Quiz 1 Q2, common traps table',
    stretch: true,
  },
  {
    id: 'w1-ctor-overload-which',
    conceptId: 'constructors',
    code: `public class Shape
{
    private string _colour;

    public Shape()
    {
        _colour = "green";
    }

    public Shape(string colour)
    {
        _colour = colour;
    }
}

Shape s = new Shape("red");`,
    question: 'Which constructor runs, and what is `_colour` afterwards?',
    options: [
      'The one-parameter constructor — `_colour` is `"red"`',
      'The parameterless one first, then the one-parameter one — `_colour` is `"red"`',
      'The parameterless one — `_colour` is `"green"`',
      'Neither — two constructors in one class is a compile error',
    ],
    answer: 0,
    why: [
      '',
      'Constructors do not chain automatically. One runs, unless you explicitly write `: this(...)`.',
      'The argument list decides which overload is chosen, and `"red"` matches the one taking a string.',
      'Overloading constructors is not just legal, it is normal — Lab 5 requires it.',
    ],
    explain:
      'Constructor overloading picks by parameter list, exactly like method overloading. Lecture 5 named this as a likely midterm question.',
    source: 'Lecture 5 mock walkthrough, constructor overloading',
  },
  {
    id: 'w1-ctor-chaining',
    conceptId: 'constructors',
    code: `public Shape() : this("green")
{
}

public Shape(string colour)
{
    _colour = colour;
}`,
    question: 'What does `: this("green")` do?',
    options: [
      'Calls the other constructor in the same class before this one\'s body runs',
      'Calls the base class constructor',
      'Creates a second `Shape` object',
      'Sets a field named `this` to `"green"`',
    ],
    answer: 0,
    why: [
      '',
      'That is `: base(...)`. `this` means *this class*; `base` means the parent.',
      'One `new` makes one object. Chaining just routes the initialisation through another constructor.',
      '`this` is the current object, never a field name.',
    ],
    explain:
      'Constructor chaining keeps the initialisation logic in one place: the general constructor does the work, and the convenient ones supply defaults. Lab 5.1 requires exactly this.',
    source: 'Lab 5 Task 5.1 · Lecture 5',
    stretch: true,
  },
  {
    id: 'w1-ctor-field-before',
    conceptId: 'constructors',
    code: `public class Box
{
    private int _size;
    private string _label;

    public Box()
    {
        Console.WriteLine(_size);
        Console.WriteLine(_label == null);
    }
}

Box b = new Box();`,
    question: 'What does creating this `Box` print?',
    options: ['`0` then `True`', '`0` then `False`', 'Nothing — the fields are uninitialised', 'A compile error about using unassigned fields'],
    answer: 0,
    why: [
      '',
      '`_label` was never assigned, so it is still `null` and the comparison is `True`.',
      'Fields always have a value; only *local variables* are unusable before assignment.',
      'That error applies to locals, not to fields. Fields get their type\'s default first.',
    ],
    explain:
      'Fields start at their type\'s default — `0` for numbers, `false` for `bool`, `null` for references — *before* the constructor body runs. The constructor\'s job is to replace those defaults with something meaningful.',
    source: 'Quiz 1 Q13, applied',
    stretch: true,
  },
  {
    id: 'w1-ctor-name-mismatch',
    conceptId: 'constructors',
    code: `public class Rectangle
{
    public Rect(int w, int h)
    {
    }
}`,
    question: 'Why does this class not compile?',
    options: [
      '`Rect` does not match the class name `Rectangle`, so it reads as a method with no return type',
      'A constructor may not take two parameters',
      'The constructor body may not be empty',
      'Constructors must be `private`',
    ],
    answer: 0,
    why: [
      '',
      'Constructors take as many parameters as you like.',
      'An empty body is legal and common, especially when chaining.',
      'Constructors are normally `public` — a `private` one is a deliberate, unusual choice.',
    ],
    explain:
      'The compiler sees a member with no return type whose name is not the class name, and has no rule that fits. The name must match **exactly**, including case.',
    source: 'Quiz 1 Q2, applied',
  },
  {
    id: 'w1-ctor-param-output',
    conceptId: 'constructors',
    code: `public class Dog
{
    public string Name;

    public Dog(string name)
    {
        Name = name;
    }
}

Dog d = new Dog("Rex");
Console.WriteLine(d.Name);`,
    question: 'What does this print?',
    options: ['`Rex`', '`name`', '`Unknown`', 'Nothing — `Name` is never initialised'],
    answer: 0,
    why: [
      '',
      '`name` is the parameter\'s *name*; `"Rex"` is its value.',
      'Nothing in this class mentions `"Unknown"` — that was Quiz 1 Q6\'s class.',
      'The constructor initialises it on the way in, which is what constructors are for.',
    ],
    explain:
      'A parameterised constructor is how an object is born already valid, instead of being created empty and filled in afterwards by whoever remembers to.',
    source: 'Quiz 1 Q6, varied',
  },
  {
    id: 'w1-ctor-when-runs',
    conceptId: 'constructors',
    question: 'When does a constructor run?',
    options: [
      'Automatically, as part of creating the object with `new`',
      'Whenever any method on the object is called',
      'Only if you call it explicitly by name',
      'When the object is garbage collected',
    ],
    answer: 0,
    why: [
      '',
      'It runs once, at creation — not before every call.',
      'You never call a constructor by name from outside; `new` does it.',
      'That would be a destructor/finaliser, which C# has but which this unit does not use.',
    ],
    explain:
      'Automatic invocation is the whole value: there is no way to obtain an object that skipped its own initialisation.',
    source: 'Quiz 1 Q13',
  },

  // ------------------------------------------------------------- properties
  {
    id: 'w1-property-value-keyword',
    conceptId: 'properties',
    code: `public string Name
{
    get { return _name; }
    set { _name = value; }
}`,
    question: 'Where does `value` come from in the setter?',
    options: [
      'It is a keyword holding whatever was assigned to the property',
      'It is a field that must be declared in the class',
      'It is the property\'s previous value',
      'It is a parameter you have to add to the setter',
    ],
    answer: 0,
    why: [
      '',
      'You never declare it. The compiler supplies it inside every `set` block.',
      'The old value is still in `_name` until you overwrite it. `value` is the incoming one.',
      'A setter takes no written parameter list — `value` is the implicit one.',
    ],
    explain:
      '`obj.Name = "Amy";` compiles into a call to the setter with `value` bound to `"Amy"`. That is why validation goes in the setter and reads `value`.',
    source: 'Quiz 1 Q9, applied',
  },
  {
    id: 'w1-property-readonly',
    conceptId: 'properties',
    code: `private readonly int _id;

public int Id
{
    get { return _id; }
}`,
    question: 'What does a property with a getter and no setter give you?',
    options: [
      'Other classes can read the value but cannot change it',
      'Other classes can change the value but cannot read it',
      'The property is invisible outside the class',
      'A compile error — every property needs both',
    ],
    answer: 0,
    why: [
      '',
      'That would be a set-only property, which is legal but almost never useful.',
      'The property is `public`; it is only the *writing* that is missing.',
      'Get-only properties are common and perfectly legal.',
    ],
    explain:
      'Read-only from the outside, writable from the inside. It is the usual way to expose an identifier or a computed total without letting anyone tamper with it.',
    source: 'Quiz 1 Q9, applied',
  },
  {
    id: 'w1-auto-property',
    conceptId: 'properties',
    code: `public string Name { get; set; }`,
    question: 'What is this shorthand called, and what does it do?',
    options: [
      'An auto-implemented property — the compiler creates the hidden backing field for you',
      'An abstract property — a child class must implement it',
      'An interface member — it has no body',
      'A field with an unusual syntax — no property is involved',
    ],
    answer: 0,
    why: [
      '',
      'Nothing here says `abstract`, and an abstract member cannot be used until a child overrides it.',
      'Interfaces do declare properties this way, but inside a class this is a full implementation.',
      'It is genuinely a property: it compiles to a getter and a setter method pair.',
    ],
    explain:
      'Use it when the property does nothing but store a value. The moment you need validation, expand it into a real backing field plus a `set` block — the callers never notice.',
    source: 'Lecture 2, properties',
  },
  {
    id: 'w1-property-call-syntax',
    conceptId: 'properties',
    question:
      'A class exposes `Name` as a property. How does calling code use it?',
    options: [
      '`p.Name = "Amy";` and `string n = p.Name;` — like a field, but it runs your code',
      '`p.Name();` — properties are called like methods',
      '`p.SetName("Amy");` — the compiler renames it',
      '`p.get_Name;` — the getter must be named explicitly',
    ],
    answer: 0,
    why: [
      '',
      'Parentheses make it a method call, and a property is not a method to its caller.',
      'You *could* write `SetName`/`GetName` methods instead — that is the Java style — but a C# property is used with assignment syntax.',
      'Those method names exist in the compiled output, but you never write them.',
    ],
    explain:
      'A property looks like a field at the call site and behaves like a method inside. That is exactly why it can be swapped in later without breaking any caller.',
    source: 'Lecture 2, properties',
  },
  {
    id: 'w1-property-naming',
    conceptId: 'properties',
    question: 'Which naming pairs a private field with its property in the usual C# style?',
    options: [
      '`private string _name;` with `public string Name`',
      '`private string Name;` with `public string Name`',
      '`private string name;` with `public string name`',
      '`private string GetName;` with `public string Name`',
    ],
    answer: 0,
    why: [
      '',
      'Two members with the identical name in one class is a compile error.',
      'C# is case sensitive so this compiles, but a lower-case public member breaks the convention every marker expects.',
      '`GetName` as a *field* name describes a behaviour, which is misleading — and the pair still has to differ from the property.',
    ],
    explain:
      'Fields camelCase (often with a leading underscore), properties PascalCase. Consistency here is part of what a lab interview is looking at.',
    source: 'Lecture 2, C# conventions',
  },
  {
    id: 'w1-property-output',
    conceptId: 'properties',
    code: `public class Person
{
    private string _name = "unset";

    public string Name
    {
        get { return _name.ToUpper(); }
        set { _name = value; }
    }
}

Person p = new Person();
p.Name = "amy";
Console.WriteLine(p.Name);`,
    question: 'What does this print?',
    options: ['`AMY`', '`amy`', '`unset`', '`UNSET`'],
    answer: 0,
    why: [
      '',
      'The setter stored `"amy"` unchanged, but the **getter** is what runs on the way out, and it upper-cases.',
      '`"unset"` was overwritten by the setter.',
      'Same — the field no longer holds `"unset"` by the time it is read.',
    ],
    explain:
      'The stored value and the exposed value need not be the same. A property is a pair of methods, and each side can do work.',
    source: 'Quiz 1 Q9, applied',
    stretch: true,
  },

  // ------------------------------------------------------------- data types
  {
    id: 'w1-postcode-type',
    conceptId: 'datatypes',
    question: 'What is the best type for an Australian postcode such as `0800`?',
    options: [
      '`string` — the leading zero is part of the value',
      '`int` — postcodes are numbers',
      '`double` — it may need decimals later',
      '`char` — it is only four characters',
    ],
    answer: 0,
    why: [
      '',
      '`int` would store `800` and print it that way. The Northern Territory would not thank you.',
      'A postcode never has a fractional part, and `double` still drops the leading zero.',
      '`char` holds exactly one character, not four.',
    ],
    explain:
      'Same rule as the phone number: if you would never do arithmetic on it, it is an **identifier**, and identifiers are strings.',
    source: 'Quiz 1 Q7, applied',
  },
  {
    id: 'w1-flag-type',
    conceptId: 'datatypes',
    question: 'A `Light` needs to record whether it is currently on. Which type?',
    options: ['`bool`', '`string` holding `"on"` or `"off"`', '`int` holding 0 or 1', '`char` holding `Y` or `N`'],
    answer: 0,
    why: [
      '',
      'Now every comparison is a string comparison, and `"On"`, `"ON"` and `" on"` all become bugs.',
      'Works, but nothing stops someone storing 7, and every reader must know your convention.',
      'Same problem as the string, with less room.',
    ],
    explain:
      'Pick the type that makes the invalid states impossible to represent. A `bool` has exactly the two values the domain has.',
    source: 'Quiz 1 Q7, generalised',
  },
  {
    id: 'w1-average-type',
    conceptId: 'datatypes',
    code: `int total = 7;
int count = 2;
Console.WriteLine(total / count);`,
    question: 'What does this print?',
    options: ['`3`', '`3.5`', '`4`', '`3.50`'],
    answer: 0,
    why: [
      '',
      'That would need at least one side to be a `double`. Two `int`s divide as integers.',
      'Integer division truncates towards zero — it does not round.',
      'Same issue, plus formatting the result would not change the arithmetic.',
    ],
    explain:
      'Integer division throws away the remainder. If a value can be fractional, its **type** has to allow it — `double total` would print `3.5`.',
    source: 'Lecture 1, C# types',
    stretch: true,
  },
  {
    id: 'w1-type-rule',
    conceptId: 'datatypes',
    question: 'Which rule of thumb decides between a numeric type and a string?',
    options: [
      'If you would never do arithmetic on it, store it as a string',
      'If it is shorter than ten characters, store it as a number',
      'If it comes from the user, store it as a string',
      'If it contains digits, store it as a number',
    ],
    answer: 0,
    why: [
      '',
      'Length has nothing to do with it — a four-digit postcode is still a string.',
      'Everything comes from the user eventually; an entered age is still an `int`.',
      'Phone numbers, postcodes, student IDs and credit-card numbers are all digits and all strings.',
    ],
    explain:
      'The question is what the value *is*: a quantity you compute with, or an identifier you display and compare. Identifiers keep their leading zeros, `+` signs and spaces.',
    source: 'Quiz 1 Q7',
  },
];
