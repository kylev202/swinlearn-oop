/**
 * Week 4 question bank — inheritance and polymorphism.
 *
 * Sourced from Quiz 4 (16 questions), Lecture 4 (including its own "possible
 * midterm-style questions" section) and Lecture 5's mock-test walkthrough #4,
 * which is about spotting an *invalid* inheritance pairing. That last one is
 * the shape students get wrong most: they can define inheritance, and still
 * not notice that `Student`/`Teacher` is not a hierarchy.
 */

import type { FocusQuestion } from '../types';

export const WEEK4: FocusQuestion[] = [
  // ------------------------------------------------------- inheritance
  {
    id: 'w4-valid-pair',
    conceptId: 'inheritance',
    question: 'Which pair of classes is a sensible inheritance relationship?',
    options: [
      '`Vehicle` and `Car`',
      '`Student` and `Teacher`',
      '`ComputerMonitor` and `ComputerKeyboard`',
      '`Library` and `Book`',
    ],
    answer: 0,
    why: [
      '',
      'Both are people at a university, but neither is a kind of the other — a student cannot update marks. They are siblings at best, not parent and child.',
      'Two separate components of one computer. That is aggregation, not a hierarchy.',
      'A library *contains* books. Containment is aggregation, never inheritance.',
    ],
    explain:
      'Apply the is-a test in words: "a car **is a** vehicle" reads true, and `Car` and `Truck` really do share year, brand, wheels and fuel type. The mock test uses these exact wrong pairings.',
    source: 'Quiz 4 Q2, and Lecture 5 mock walkthrough #4',
  },
  {
    id: 'w4-single-inheritance',
    conceptId: 'inheritance',
    question: 'Which statement about inheritance in C# is **false**?',
    options: [
      'A class can inherit from multiple parent classes at once',
      'A child class inherits the parent\'s public and protected members',
      'A child class can add members the parent does not have',
      'A child class can override a method marked `virtual`',
    ],
    answer: 0,
    why: [
      '',
      'True — that is what inheritance gives you.',
      'True — that is specialisation.',
      'True — that is overriding.',
    ],
    explain:
      'C# allows exactly one base class. Multiple *interfaces* are fine, which is one of the reasons interfaces exist at all — the Week 5 answer to the same need.',
    source: 'Quiz 4 Q3',
  },
  {
    id: 'w4-syntax',
    conceptId: 'inheritance',
    question: 'Which is the correct way to declare that `Circle` inherits from `Shape` in C#?',
    options: [
      '`public class Circle : Shape`',
      '`public class Circle extends Shape`',
      '`public class Circle inherits Shape`',
      '`public class Circle(Shape)`',
    ],
    answer: 0,
    why: [
      '',
      '`extends` is Java.',
      'No mainstream C-family language uses `inherits`.',
      'Parentheses after a class name are Python\'s syntax.',
    ],
    explain:
      'A colon, then the base type. The same colon is reused for interfaces, so `class Circle : Shape, IComparable` is one base class plus one interface.',
    source: 'Quiz 4 Q14',
  },
  {
    id: 'w4-shares',
    conceptId: 'inheritance',
    question:
      'True or false: inheritance lets a child class share the attributes and behaviour of its parent.',
    options: ['True', 'False'],
    answer: 0,
    why: ['', 'Sharing common members is the entire purpose of a base class.'],
    explain:
      'The parent owns what the family has in common, and each child adds what makes it different. Less duplication means fewer places for a bug to hide.',
    source: 'Quiz 4 Q15',
  },
  {
    id: 'w4-inherited-members',
    conceptId: 'inheritance',
    code: `public class Vehicle {
    public string Brand = "Ford";
    public void Honk() {
        Console.WriteLine("Beep!!");
    }
}

public class Car : Vehicle {
    public string ModelName = "Mustang";
}

Car myCar = new Car();
Console.WriteLine(myCar.Brand);
myCar.Honk();`,
    question: 'What does this print?',
    options: [
      '`Ford` then `Beep!!`',
      '`Mustang` then `Beep!!`',
      '`Ford` only — `Car` has no `Honk`',
      'Nothing — `Car` never declares `Brand`',
    ],
    answer: 0,
    why: [
      '',
      '`ModelName` is never printed; the code reads `Brand`.',
      '`Car` does have `Honk` — it inherited it.',
      'It does not have to. `Brand` comes from `Vehicle` and is public.',
    ],
    explain:
      '`Car` declares two lines of its own and gets everything else free. That is the point of the exercise: the child\'s source is short precisely because the parent already said it.',
    source: 'Quiz 4 Q13',
  },
  {
    id: 'w4-private-inherited',
    conceptId: 'protected',
    stretch: true,
    code: `public class Account {
    private decimal balance;
    protected string owner;
}

public class SavingsAccount : Account {
    public void Show() {
        Console.WriteLine(balance);   // line A
        Console.WriteLine(owner);     // line B
    }
}`,
    question: 'Which lines compile?',
    options: [
      'Only line B',
      'Both lines',
      'Only line A',
      'Neither line',
    ],
    answer: 0,
    why: [
      '',
      '`balance` is private to `Account`. `SavingsAccount` inherits it, but cannot reach it.',
      'Backwards — `protected` is the one a child can use.',
      '`owner` is protected, which exists specifically so a child can use it.',
    ],
    explain:
      'A child inherits **every** member but may only touch the public and protected ones. That is why Week 4\'s `Shape` keeps `x`, `y` and `colour` protected rather than private: `Rectangle` has to draw with them.',
    source: 'Lecture 4, access levels',
  },
  {
    id: 'w4-why-protected',
    conceptId: 'protected',
    question:
      'Why does the abstract `Shape` class declare `x`, `y` and `colour` as `protected` rather than `private`?',
    options: [
      'So `Rectangle` and `Circle` can use them in their own `Draw()` methods',
      'So any code anywhere can read them',
      'Because abstract classes are not allowed private fields',
      'Because `protected` fields are faster to access',
    ],
    answer: 0,
    why: [
      '',
      'That would be `public`, and it would throw away the encapsulation the fields have.',
      'Abstract classes can hold private fields perfectly well.',
      'Accessibility has no effect on speed — it is a compile-time rule.',
    ],
    explain:
      '`protected` is the exact middle setting this situation calls for: children in, everyone else out. Private would leave `Rectangle` unable to draw itself; public would let any code move a shape behind its back.',
    source: 'Lecture 4 and Lecture 5, the Shape hierarchy',
  },
  {
    id: 'w4-generalisation',
    conceptId: 'gen-spec',
    question: 'Which statement about generalisation and specialisation is true?',
    options: [
      'Generalisation captures the characteristics several classes share',
      'Generalisation adds new attributes to a single class',
      'Specialisation moves shared members up into a parent',
      'They are two names for the same operation',
    ],
    answer: 0,
    why: [
      '',
      'Adding new attributes to one class is specialisation.',
      'Moving members up is generalisation. This option has the two swapped.',
      'They are opposite directions along the same hierarchy.',
    ],
    explain:
      'Generalisation looks up the hierarchy — what do these classes have in common? Specialisation looks down — what makes this one different?',
    source: 'Quiz 4 Q10',
  },
  {
    id: 'w4-specialisation',
    conceptId: 'gen-spec',
    question: 'Which represents **specialisation**?',
    options: [
      'A `Rectangle` class that inherits from `Shape` and adds `Width` and `Height`',
      'Moving `colour` from `Rectangle` and `Circle` up into `Shape`',
      'A `Library` class holding a `List<Book>`',
      'Two classes implementing the same interface',
    ],
    answer: 0,
    why: [
      '',
      'That is generalisation — the opposite direction.',
      'That is aggregation.',
      'That is a shared contract, not a hierarchy at all.',
    ],
    explain:
      'Inherit the general thing, then add what only this type needs. `Width` and `Height` mean nothing to a `Circle`, so they belong to `Rectangle` alone.',
    source: 'Quiz 4 Q16',
  },

  // ------------------------------------------------------ polymorphism
  {
    id: 'w4-poly-true',
    conceptId: 'polymorphism',
    question: 'Which statement about polymorphism in C# is **true**?',
    options: [
      'You can refer to a child object using a parent reference',
      'Overriding works without any inheritance',
      'Every method can be overridden without marking it',
      'Polymorphism in C# only works through interfaces',
    ],
    answer: 0,
    why: [
      '',
      'Overriding strictly requires a base class to override *from*.',
      'A method must be `virtual` or `abstract` before a child may override it.',
      'Interfaces are one route. Base classes are the other, and this week is about that one.',
    ],
    explain:
      '`Shape s = new Circle();` — the variable is a `Shape`, the object is a `Circle`, and calling `s.Draw()` runs `Circle`\'s version.',
    source: 'Quiz 4 Q1',
  },
  {
    id: 'w4-virtual-array',
    conceptId: 'polymorphism',
    code: `public class Vehicle {
    public virtual void Start() {
        Console.WriteLine("Starting the vehicle!!");
    }
}

public class Car : Vehicle {
    public override void Start() {
        Console.WriteLine("Starting the car!!");
    }
}

public class Truck : Vehicle {
    public override void Start() {
        Console.WriteLine("Starting the truck!!");
    }
}

Vehicle[] vehicles = { new Car(), new Truck(), new Vehicle() };
foreach (Vehicle v in vehicles) {
    v.Start();
}`,
    question: 'What does this print?',
    options: [
      'Starting the car!! / Starting the truck!! / Starting the vehicle!!',
      'Starting the vehicle!! three times',
      'Starting the car!! three times',
      'It does not compile — `Car` cannot go in a `Vehicle[]`',
    ],
    answer: 0,
    why: [
      '',
      'That is what you would get if `Start()` were not `virtual` — the reference type would decide, not the object.',
      'Each element is a different object, and each one answers for itself.',
      'A `Car` **is a** `Vehicle`, so it fits in the array. That is the whole trick.',
    ],
    explain:
      'The loop variable is typed `Vehicle`, but the runtime picks the override belonging to the **actual object** in each slot. This is dynamic dispatch, and it is what a chain of `if (v is Car)` tests would otherwise have to do by hand.',
    source: 'Quiz 4 Q5',
  },
  {
    id: 'w4-fill-blank',
    conceptId: 'polymorphism',
    question:
      'Fill in the blank: ______ enables the use of the same method name with a different implementation for child classes.',
    options: ['Polymorphism', 'Encapsulation', 'Abstraction', 'Aggregation'],
    answer: 0,
    why: [
      '',
      'Encapsulation is about restricting access to data.',
      'Abstraction is about which details you model in the first place.',
      'Aggregation is a containment relationship between objects.',
    ],
    explain:
      '*Poly* (many) + *morph* (form). One name, many forms — and the runtime chooses which form runs.',
    source: 'Quiz 4 Q6',
  },
  {
    id: 'w4-overriding-def',
    conceptId: 'override',
    question: 'Which best describes method overriding?',
    options: [
      'Providing a new implementation of an inherited method in a child class',
      'Defining several methods with the same name but different parameters',
      'Calling a parent method from a child method',
      'Hiding a method so no other class can call it',
    ],
    answer: 0,
    why: [
      '',
      'That is over**loading** — same name, different signatures, resolved at compile time, and no inheritance required.',
      'That is `base.Method()`, which you might use *inside* an override but is not the definition of one.',
      'That is what `private` does.',
    ],
    explain:
      'Overriding replaces behaviour along an inheritance chain and is resolved at runtime. Overloading picks between signatures at compile time. The exam likes making you tell them apart.',
    source: 'Quiz 4 Q7',
  },
  {
    id: 'w4-missing-virtual',
    conceptId: 'override',
    code: `public class Vehicle {
    public void Start() { Console.WriteLine("vehicle"); }
}

public class Car : Vehicle {
    public override void Start() { Console.WriteLine("car"); }
}`,
    question: 'What is wrong here?',
    options: [
      '`Vehicle.Start` is not `virtual`, so `Car` has nothing to override',
      'Nothing — this is correct C#',
      '`Car.Start` should be `virtual` as well',
      '`Vehicle` must be `abstract` before it can be inherited from',
    ],
    answer: 0,
    why: [
      '',
      'The compiler rejects it: you cannot override a method that was never marked overridable.',
      '`override` already makes a method overridable further down. Adding `virtual` alongside it is not the fix.',
      'An ordinary class can be inherited from. `abstract` is a separate decision.',
    ],
    explain:
      'Overriding is a two-sided agreement: `virtual` (or `abstract`) on the parent grants permission, `override` on the child uses it. Without the parent\'s half there is nothing to dispatch through, and dispatch is the whole point.',
    source: 'Lecture 4, virtual and override',
  },
  {
    id: 'w4-poly-false',
    conceptId: 'polymorphism',
    question: 'Which statement about polymorphism is **false**?',
    options: [
      'You can achieve polymorphism in C# without any inheritance',
      'The method that runs is decided by the object\'s actual type',
      'A parent-typed variable can hold a child object',
      'Polymorphism removes the need for long `if`/`else` chains over types',
    ],
    answer: 0,
    why: [
      '',
      'True — that is dynamic dispatch.',
      'True — `Shape s = new Circle();`.',
      'True, and it is the practical reason to use it.',
    ],
    explain:
      'Polymorphism needs a shared type to dispatch through — a base class, or an interface, which is itself a form of inheritance of contract. With no shared type there is nothing to be polymorphic *over*.',
    source: 'Quiz 4 Q9',
  },
  {
    id: 'w4-runtime-poly',
    conceptId: 'polymorphism',
    question: 'What does runtime polymorphism mean?',
    options: [
      'The method to execute is determined while the program is running',
      'The compiler picks the method from the declared type',
      'Methods are compiled only when first called',
      'The program can change its own class definitions as it runs',
    ],
    answer: 0,
    why: [
      '',
      'That is compile-time resolution, which is how overloading works.',
      'That is JIT compilation — a runtime implementation detail, unrelated to dispatch.',
      'C# does not do that, and it is not what the term means.',
    ],
    explain:
      'The declared type decides what you are *allowed* to call; the actual object decides *which implementation* runs.',
    source: 'Quiz 4 Q11',
  },
  {
    id: 'w4-printer-analogy',
    conceptId: 'polymorphism',
    question: 'Which real-world analogy best describes polymorphism?',
    options: [
      'A printer that prints documents, images or PDFs through the same Print action',
      'A filing cabinet whose drawers are locked',
      'A blueprint used to build many identical houses',
      'A library that holds many books',
    ],
    answer: 0,
    why: [
      '',
      'That is encapsulation.',
      'That is a class and its objects.',
      'That is aggregation.',
    ],
    explain:
      'One request — "print this" — behaving correctly for whatever it is handed. The caller does not branch on the file type; the object knows what it is.',
    source: 'Quiz 4 Q12',
  },

  // ------------------------------------------------- abstract classes
  {
    id: 'w4-abstract-method',
    conceptId: 'abstract',
    question: 'Which is the correct definition of an abstract method in C#?',
    options: [
      '`public abstract void Print();`',
      '`public abstract void Print() { }`',
      '`public virtual abstract void Print();`',
      '`public void abstract Print();`',
    ],
    answer: 0,
    why: [
      '',
      'An abstract method must have **no body** — not even an empty one. With a body it would be `virtual`.',
      '`virtual` and `abstract` are mutually exclusive; abstract already implies overridable.',
      'The modifiers come before the return type, never between it and the name.',
    ],
    explain:
      'Declaration and semicolon, no braces. It is a promise that every concrete child supplies its own version.',
    source: 'Quiz 4 Q8',
  },
  {
    id: 'w4-abstract-instantiate',
    conceptId: 'abstract',
    code: `public abstract class Shape {
    public abstract void Draw();
}`,
    question: 'What can you do with `Shape` as written?',
    options: [
      'Derive from it and instantiate the derived classes',
      'Write `new Shape()` and call `Draw()`',
      'Nothing — an abstract class with no concrete members is illegal',
      'Instantiate it, but only inside its own assembly',
    ],
    answer: 0,
    why: [
      '',
      'An abstract class cannot be instantiated at all. There is no implementation of `Draw` to run.',
      'It is perfectly legal, and common — it is a contract with a place to add shared state later.',
      'Abstractness is not an accessibility rule; where you are does not change it.',
    ],
    explain:
      'You can create a `Rectangle` or a `Circle`, never a bare `Shape`. The abstract base exists to be the *type* the rest of the program talks to.',
    source: 'Lecture 5, inheritance and polymorphism recap',
  },

  // Third questions — see the note in week1.ts for why every concept has one.
  {
    id: 'w4-refactor-direction',
    conceptId: 'gen-spec',
    question:
      '`Rectangle`, `Circle` and `Line` each declare their own `colour` field. You move `colour` into a new `Shape` base class. What have you done?',
    options: [
      'Generalisation',
      'Specialisation',
      'Aggregation',
      'Overloading',
    ],
    answer: 0,
    why: [
      '',
      'Specialisation is adding what makes one child different — the opposite move.',
      'Aggregation is one object containing others, not a change to a hierarchy.',
      'Overloading is several methods sharing a name.',
    ],
    explain:
      'You captured what several classes had in common and pulled it up. Generalisation goes **up** the hierarchy; specialisation goes down.',
    source: 'Quiz 4 Q10, applied',
  },
  {
    id: 'w4-protected-outsider',
    conceptId: 'protected',
    code: `public class Shape { protected float x; }
public class Circle : Shape { }

// in Program.cs:
Circle c = new Circle();
Console.WriteLine(c.x);`,
    question: 'Does the last line compile?',
    options: [
      'No — `protected` does not include unrelated code such as `Program`',
      'Yes — `Circle` inherited `x`, so it is available through a `Circle` variable',
      'Yes — `protected` is the same as `public` for derived types',
      'No — `Circle` did not inherit `x` at all',
    ],
    answer: 0,
    why: [
      '',
      'Inheriting a member does not publish it. `Circle`\'s own code can use `x`; `Program` cannot.',
      '`protected` is emphatically not `public` — that is the entire distinction.',
      '`Circle` did inherit it. The problem is who is *asking*.',
    ],
    explain:
      '`protected` is about which **class the code is written in**, not which variable it is reached through. Inside `Circle`, `x` is fine; inside `Program`, it is not.',
    source: 'Lecture 4, access levels',
  },
  {
    id: 'w4-override-vs-overload',
    conceptId: 'override',
    code: `public class Printer {
    public virtual void Print(string text) { }
    public void Print(int number) { }        // A
}

public class ColourPrinter : Printer {
    public override void Print(string text) { }   // B
}`,
    question: 'Which is overloading and which is overriding?',
    options: [
      'A overloads; B overrides',
      'A overrides; B overloads',
      'Both overload',
      'Both override',
    ],
    answer: 0,
    why: [
      '',
      'Exactly backwards. A is a second method in the *same* class with a different parameter type.',
      'B replaces an inherited implementation, which is overriding.',
      'A involves no inheritance at all, so it cannot be overriding.',
    ],
    explain:
      'Same class, different parameters → **overloading**, chosen at compile time. Child class, same signature, `override` keyword → **overriding**, chosen at runtime.',
    source: 'Quiz 4 Q7, applied',
  },
  {
    id: 'w4-abstract-why',
    conceptId: 'abstract',
    question: 'Why make `Shape` abstract rather than an ordinary class with empty `Draw()`?',
    options: [
      'It makes `new Shape()` impossible and forces every child to supply a real `Draw()`',
      'It makes the program run faster',
      'It allows `Shape` to hold fields',
      'It lets `Shape` inherit from more than one parent',
    ],
    answer: 0,
    why: [
      '',
      'Abstractness is a compile-time rule with no runtime cost either way.',
      'An ordinary class can hold fields too — and so can an abstract one.',
      'Abstract or not, a C# class has exactly one base class.',
    ],
    explain:
      'An empty `Draw()` compiles and silently draws nothing, so a shape someone forgot to finish just fails quietly. Abstract turns that into a compile error, which is where you want to find it.',
    source: 'Lecture 5, abstract classes and methods',
  },

  // ==========================================================================
  // Depth pass.
  //
  // Week 4 is the week the paper leans on hardest, and its questions are
  // rarely definitions — they are short programs where the answer turns on
  // one keyword. So this section is heavy on code: virtual present or absent,
  // reference type versus object type, private versus protected, abstract
  // with and without a body. Each one changes the output, and knowing which
  // is the difference between a mark and a guess.
  // ==========================================================================

  // ------------------------------------------------------------ inheritance
  {
    id: 'w4-is-a-test',
    conceptId: 'inheritance',
    question: 'Which pair should **not** be modelled with inheritance?',
    options: [
      '`Car` and `Engine`',
      '`Vehicle` and `Car`',
      '`Shape` and `Circle`',
      '`Employee` and `Manager`',
    ],
    answer: 0,
    why: [
      '',
      'A car is a vehicle — a textbook is-a.',
      'A circle is a shape.',
      'A manager is an employee.',
    ],
    explain:
      'A car **has** an engine; it is not a kind of engine. Say the sentence out loud: "is-a" means inheritance, "has-a" means a field.',
    source: 'Quiz 4 Q2, applied',
  },
  {
    id: 'w4-multiple-inheritance-workaround',
    conceptId: 'inheritance',
    question:
      'A class needs behaviour from two different sources. C# allows only one base class. What is the way out?',
    options: [
      'Inherit from one and implement one or more interfaces for the rest',
      'List both base classes separated by a comma',
      'Inherit twice, in two separate declarations',
      'There is no way — the design has to be abandoned',
    ],
    answer: 0,
    why: [
      '',
      'That syntax exists — `: Base, IFirst, ISecond` — but everything after the first name must be an **interface**.',
      'A class is declared once.',
      'This is exactly what interfaces are for, and Week 5 builds on it.',
    ],
    explain:
      'One base class, any number of interfaces. It is the reason the interface exists as a separate construct at all.',
    source: 'Quiz 4 Q3 · Quiz 5 Q13',
  },
  {
    id: 'w4-inheritance-syntax-wrong',
    conceptId: 'inheritance',
    question: 'Which of these is **not** how you declare inheritance in C#?',
    options: [
      '`public class Circle extends Shape`',
      '`public class Circle : Shape`',
      '`public class Circle: Shape`',
      '`public class Circle :Shape`',
    ],
    answer: 0,
    why: [
      '',
      'Correct C#, with the conventional spacing.',
      'Correct — whitespace around the colon is free.',
      'Also correct, if unusual to read.',
    ],
    explain:
      '`extends` is Java. C# uses a single colon, and the same colon is used for implementing interfaces.',
    source: 'Quiz 4 Q14',
  },
  {
    id: 'w4-inherited-what',
    conceptId: 'inheritance',
    question: 'What does a derived class inherit from its base class?',
    options: [
      'All of the members — but it can only *use* the ones its access level allows',
      'Only the public members',
      'Only the methods, not the fields',
      'Only the members it re-declares',
    ],
    answer: 0,
    why: [
      '',
      'It inherits the private ones too; it simply cannot reach them.',
      'Fields are inherited exactly like methods.',
      'Re-declaring is overriding, and it applies to a small subset.',
    ],
    explain:
      'Inheritance and access are two different questions. The private field is *there* in every child object — it just cannot be named from the child\'s own code.',
    source: 'Quiz 4 Q15 with Q4',
  },
  {
    id: 'w4-inherited-output',
    conceptId: 'inheritance',
    code: `public class Animal
{
    public string Name = "unnamed";
    public void Describe()
    {
        Console.WriteLine("I am " + Name);
    }
}

public class Dog : Animal
{
}

Dog d = new Dog();
d.Name = "Rex";
d.Describe();`,
    question: 'What does this print?',
    options: ['`I am Rex`', '`I am unnamed`', 'Nothing — `Dog` has no members', 'A compile error — `Dog` has no `Describe`'],
    answer: 0,
    why: [
      '',
      '`d.Name = "Rex";` replaced the initial value before `Describe()` ran.',
      '`Dog` has every member `Animal` has, without writing any of them.',
      '`Describe` is inherited, so `Dog` does have it.',
    ],
    explain:
      'An empty derived class is still a complete one. Reuse without retyping is the first benefit of inheritance.',
    source: 'Quiz 4 Q13, varied',
  },
  {
    id: 'w4-base-ctor-call',
    conceptId: 'inheritance',
    code: `public class GameObject
{
    protected string _name;

    public GameObject(string name)
    {
        _name = name;
    }
}

public class Item : GameObject
{
    public Item(string name) : base(name)
    {
    }
}`,
    question: 'What does `: base(name)` do?',
    options: [
      'Runs the base class constructor before the `Item` constructor\'s own body',
      'Creates a second `GameObject` alongside the `Item`',
      'Calls another `Item` constructor',
      'Assigns `name` to a field called `base`',
    ],
    answer: 0,
    why: [
      '',
      'One object is created; the base constructor initialises the inherited part of it.',
      'That would be `: this(...)`.',
      '`base` is a keyword meaning the parent class, never a field name.',
    ],
    explain:
      'The base constructor runs first, so the inherited fields are set up before the child adds its own. When the parent has no parameterless constructor, `: base(...)` is compulsory.',
    source: 'Lab 4 Task 4.2 · Lecture 4',
  },
  {
    id: 'w4-chain-depth',
    conceptId: 'inheritance',
    question:
      'Given `IdentifiableObject` → `GameObject` → `Item`, which members does an `Item` object have?',
    options: [
      'Its own, plus `GameObject`\'s, plus `IdentifiableObject`\'s',
      'Only its own and `GameObject`\'s — inheritance goes one level',
      'Only its own',
      'Only the ones declared `public` anywhere in the chain',
    ],
    answer: 0,
    why: [
      '',
      'Inheritance is transitive; it runs the whole way up the chain.',
      'That would defeat the purpose entirely.',
      'Access level controls what the code can *reach*, not what the object *has*.',
    ],
    explain:
      'The chain accumulates. `Item` is-a `GameObject` is-an `IdentifiableObject`, so an `Item` can be used wherever any of the three is expected.',
    source: 'Lab 5 Task 5.2 hierarchy · Lecture 4',
  },
  {
    id: 'w4-false-about-inheritance',
    conceptId: 'inheritance',
    question: 'Which statement about C# inheritance is **FALSE**?',
    options: [
      'A class may inherit from several base classes at once',
      'A derived class can add members the base class does not have',
      'A derived class can be used wherever the base class is expected',
      'A class can implement several interfaces while inheriting from one base class',
    ],
    answer: 0,
    why: [
      '',
      'True — that is specialisation.',
      'True — that is what makes polymorphism possible.',
      'True, and it is the standard workaround for single inheritance.',
    ],
    explain:
      'Single class inheritance is the rule the paper checks most often. One base class; as many interfaces as you like.',
    source: 'Quiz 4 Q3',
  },
  {
    id: 'w4-sealed-or-not',
    conceptId: 'inheritance',
    question: 'Why does inheritance reduce duplicated code?',
    options: [
      'Behaviour common to several classes is written once in the parent and shared by all of them',
      'The compiler removes duplicate methods automatically',
      'Derived classes are compiled only once',
      'It does not — inheritance always increases the amount of code',
    ],
    answer: 0,
    why: [
      '',
      'No compiler deduplicates code you wrote twice.',
      'Compilation count is unrelated.',
      'The whole motivation is the reverse.',
    ],
    explain:
      'One implementation, many inheritors. It also means a fix to that behaviour is a fix everywhere at once — which cuts both ways, and is why the parent should hold only what genuinely *is* common.',
    source: 'Quiz 4 Q15',
  },

  // ---------------------------------------------------- protected and access
  {
    id: 'w4-protected-code',
    conceptId: 'protected',
    code: `public class Shape
{
    private string _colour = "red";
    protected int _size = 3;
}

public class Circle : Shape
{
    public void Show()
    {
        Console.WriteLine(_size);
        Console.WriteLine(_colour);
    }
}`,
    question: 'Which line fails to compile?',
    options: [
      '`Console.WriteLine(_colour);` — `_colour` is private to `Shape`',
      '`Console.WriteLine(_size);` — `protected` members cannot be read',
      'Both lines fail',
      'Neither — a derived class can reach everything it inherits',
    ],
    answer: 0,
    why: [
      '',
      '`protected` exists precisely so derived classes can read it.',
      '`_size` is fine.',
      'Inheriting a member and being allowed to name it are different things.',
    ],
    explain:
      'Every `Circle` object contains a `_colour`, and `Circle`\'s own code still cannot touch it. `private` means "this class only", and a subclass is a different class.',
    source: 'Quiz 4 Q4 with Lecture 4',
  },
  {
    id: 'w4-protected-from-outside',
    conceptId: 'protected',
    code: `public class Shape
{
    protected int _size = 3;
}

public class Program
{
    static void Main()
    {
        Shape s = new Shape();
        Console.WriteLine(s._size);
    }
}`,
    question: 'What happens here?',
    options: [
      'It fails to compile — `Program` is not a subclass of `Shape`',
      'It prints `3`',
      'It prints `0`',
      'It compiles but throws at runtime',
    ],
    answer: 0,
    why: [
      '',
      '`protected` is not `public`; unrelated code cannot read it.',
      'The field does hold 3, but the access is rejected before the program runs.',
      'Visibility is a compile-time rule, so it never reaches runtime.',
    ],
    explain:
      '`protected` widens access to the inheritance chain and to nothing else. From the outside it behaves exactly like `private`.',
    source: 'Quiz 1 Q12 · Lecture 4 access modifiers',
  },
  {
    id: 'w4-protected-vs-public-choice',
    conceptId: 'protected',
    question: 'Why prefer `protected` over `public` for a field a subclass needs?',
    options: [
      'It keeps the field out of the class\'s public contract, so outside code cannot depend on it',
      'Protected fields are faster to access',
      'Public fields cannot be inherited',
      'The compiler requires it in a base class',
    ],
    answer: 0,
    why: [
      '',
      'No difference in speed whatsoever.',
      'They are inherited perfectly well — they are just visible to everyone else too.',
      'Nothing requires it; it is a design choice.',
    ],
    explain:
      'Everything public is a promise. `protected` lets the family in without making the promise to the entire program.',
    source: 'Lecture 4, access and inheritance',
  },
  {
    id: 'w4-private-through-property',
    conceptId: 'protected',
    question:
      'A base class keeps a field `private` but exposes it through a `public` property. Can a derived class use the value?',
    options: [
      'Yes — through the inherited property, which is public',
      'No — anything private is completely unreachable from a subclass',
      'Only if the property is marked `protected`',
      'Only by re-declaring the field in the subclass',
    ],
    answer: 0,
    why: [
      '',
      'The **field** is unreachable. The property is a separate, public member and is inherited like any other.',
      'A public property is already reachable; `protected` would narrow it.',
      'Re-declaring would create a second, unrelated field — a classic way to introduce a bug.',
    ],
    explain:
      'This is the encapsulated way to give subclasses access: keep the field private and let the property be the door, so the base class keeps control of it.',
    source: 'Quiz 4 Q4 with Quiz 1 Q9',
    stretch: true,
  },
  {
    id: 'w4-default-member-access-2',
    conceptId: 'protected',
    question:
      'A field is declared inside a class with no access modifier. Which classes can name it?',
    options: [
      'Only the class that declares it',
      'That class and all of its subclasses',
      'Any class in the same project',
      'Any class anywhere',
    ],
    answer: 0,
    why: [
      '',
      'That would be `protected`, which you have to write.',
      'That is `internal`, which is the default for the *class* itself, not for its members.',
      'That is `public`.',
    ],
    explain:
      'The default is `private`. Lecture 5 called this out as a mock-test question because the class-level default (`internal`) is different and makes a tempting wrong answer.',
    source: 'Quiz 4 Q4 · Lecture 5 mock walkthrough',
  },
  {
    id: 'w4-protected-in-uml',
    conceptId: 'protected',
    question: 'How does a UML class diagram mark a `protected` member?',
    options: ['With `#`', 'With `-`', 'With `+`', 'With `~`'],
    answer: 0,
    why: ['', '`-` is private.', '`+` is public.', '`~` is internal/package.'],
    explain:
      'Reading a hierarchy diagram, the `#` members are the ones the subclasses are meant to use. It is a design signal as much as a notation.',
    source: 'Quiz 2 Q17 applied to Week 4',
  },
  {
    id: 'w4-access-widening',
    conceptId: 'protected',
    question:
      'A base class declares `protected virtual void Draw()`. Can a derived class override it as `public override void Draw()`?',
    options: [
      'No — an override must keep the same accessibility as the member it overrides',
      'Yes — an override may always widen access',
      'Yes, but only if the base class is abstract',
      'No — protected methods can never be virtual',
    ],
    answer: 0,
    why: [
      '',
      'C# requires the accessibility to match. Widening it would let a subclass break the base class\'s contract.',
      'Abstract or not makes no difference to this rule.',
      '`protected virtual` is a perfectly ordinary and common combination.',
    ],
    explain:
      'Override changes the *implementation*, never the signature or the visibility. Anything else and code written against the base type could no longer trust what it was told.',
    source: 'Lecture 4, overriding rules',
    stretch: true,
  },

  // ------------------------------------------- generalisation/specialisation
  {
    id: 'w4-gen-direction',
    conceptId: 'gen-spec',
    question: 'Generalisation moves in which direction?',
    options: [
      'Upwards — common features are pulled out of several classes into a new parent',
      'Downwards — a parent is extended with more specific detail',
      'Sideways — features are copied between sibling classes',
      'It has no direction; it just means "inheritance"',
    ],
    answer: 0,
    why: [
      '',
      'That is specialisation.',
      'Copying between siblings is duplication, which generalisation exists to remove.',
      'The two words name the two directions, and the paper asks which is which.',
    ],
    explain:
      'Generalise up, specialise down. Spotting that `Circle` and `Rectangle` both have a colour, and lifting it into `Shape`, is generalisation.',
    source: 'Quiz 4 Q10',
  },
  {
    id: 'w4-spec-example',
    conceptId: 'gen-spec',
    question: 'Which of these is an example of **specialisation**?',
    options: [
      'Adding a `Radius` to a `Circle` that inherits from `Shape`',
      'Noticing `Circle` and `Square` share a colour and moving it into `Shape`',
      'Renaming `Shape` to `Figure`',
      'Splitting one long method into three shorter ones',
    ],
    answer: 0,
    why: [
      '',
      'That is generalisation — the upward direction.',
      'A rename changes no structure.',
      'That is refactoring within one class, not a hierarchy decision.',
    ],
    explain:
      'A child adds what makes it different. `Radius` belongs only to `Circle`, so it goes in `Circle`, not in `Shape`.',
    source: 'Quiz 4 Q16',
  },
  {
    id: 'w4-gen-what-belongs-up',
    conceptId: 'gen-spec',
    question:
      '`Circle` has `Colour` and `Radius`. `Rectangle` has `Colour`, `Width` and `Height`. What belongs in a shared `Shape` parent?',
    options: [
      '`Colour` only',
      '`Colour`, `Radius`, `Width` and `Height`',
      'Nothing — the two classes have too little in common',
      '`Radius`, because a rectangle has none and the parent must supply it',
    ],
    answer: 0,
    why: [
      '',
      'Putting `Radius` in `Shape` gives every rectangle a radius, which is meaningless.',
      'They share a real feature and both are drawn, which is plenty.',
      'A parent supplies what is *common*, never what is missing from one child.',
    ],
    explain:
      'Only what is true of **every** child goes up. Anything else forces children to carry members that make no sense for them, which is the usual sign a hierarchy has gone wrong.',
    source: 'Quiz 4 Q10, applied',
  },
  {
    id: 'w4-gen-false',
    conceptId: 'gen-spec',
    question: 'Which statement is **FALSE**?',
    options: [
      'Specialisation removes members the parent declared',
      'Generalisation represents characteristics shared among several classes',
      'Specialisation extends a parent with more specific attributes or behaviour',
      'A hierarchy can be arrived at by generalising or by specialising',
    ],
    answer: 0,
    why: [
      '',
      'True — that is its definition.',
      'True.',
      'True: you can pull common features up from existing classes, or push new detail down into new ones.',
    ],
    explain:
      'A child can *override* inherited behaviour but never delete an inherited member. Anything the parent declares, every child has.',
    source: 'Quiz 4 Q10 and Q16',
  },
  {
    id: 'w4-abstraction-in-hierarchy',
    conceptId: 'gen-spec',
    question:
      'You are designing `Dog`, `Cat` and `Bird`. All three eat and sleep; only the bird flies. Where does `Fly()` go?',
    options: [
      'On `Bird` only — it is not shared, so it does not generalise',
      'On `Animal`, so all three have the same interface',
      'On `Animal`, with `Dog` and `Cat` overriding it to do nothing',
      'Nowhere — a hierarchy cannot represent it',
    ],
    answer: 0,
    why: [
      '',
      'Then every dog can be asked to fly, and the type system stops helping you.',
      'Overriding to do nothing is a common smell: it means the member was put too high.',
      'It represents it perfectly well, by leaving `Fly()` where it belongs.',
    ],
    explain:
      'If a child has to override something into a no-op, the member was generalised too far. Behaviour that only some siblings share is what interfaces are for — Week 5.',
    source: 'Lecture 4, generalisation and specialisation',
    stretch: true,
  },
  {
    id: 'w4-hierarchy-refactor',
    conceptId: 'gen-spec',
    question:
      'Three classes each contain an identical `Id` field and `AreYou(string)` method. What does generalisation suggest?',
    options: [
      'Create a common base class holding `Id` and `AreYou`, and inherit from it',
      'Copy the best version into all three and keep them in sync by hand',
      'Move the method into a static helper and call it from all three',
      'Leave it — three copies of six lines is not worth changing',
    ],
    answer: 0,
    why: [
      '',
      'Keeping copies in sync by hand is exactly the failure mode inheritance removes.',
      'A static helper shares the code but not the *type*, so nothing can treat the three uniformly.',
      'The duplication is the smaller problem; not being able to treat them as one kind is the bigger one.',
    ],
    explain:
      'This is literally Lab 4/5\'s `IdentifiableObject`: the same identity behaviour needed by every game object, lifted into one parent.',
    source: 'Lab 4 Task 4.2 · Quiz 4 Q10',
  },

  // ------------------------------------------------------------- overriding
  {
    id: 'w4-no-virtual-output',
    conceptId: 'override',
    code: `public class Animal
{
    public void Speak()
    {
        Console.WriteLine("...");
    }
}

public class Dog : Animal
{
    public new void Speak()
    {
        Console.WriteLine("Woof");
    }
}

Animal a = new Dog();
a.Speak();`,
    question: 'What does this print?',
    options: ['`...`', '`Woof`', '`... Woof`', 'A compile error'],
    answer: 0,
    why: [
      '',
      'That is what you would get from `virtual`/`override`, or from calling through a `Dog`-typed variable.',
      'Only one method runs.',
      '`new` is legal — it hides rather than overrides, and the compiler accepts it.',
    ],
    explain:
      'Without `virtual`, the call is resolved from the **reference type**. `new` hides the base method for `Dog`-typed references only — which is why hiding is almost never what you want.',
    source: 'Quiz 4 Q5, inverted',
    stretch: true,
  },
  {
    id: 'w4-virtual-required',
    conceptId: 'override',
    code: `public class Animal
{
    public void Speak() { }
}

public class Dog : Animal
{
    public override void Speak() { }
}`,
    question: 'Why does this not compile?',
    options: [
      '`Animal.Speak()` is not marked `virtual` (or `abstract`), so there is nothing to override',
      '`override` may only be used on properties',
      'The method bodies are empty',
      '`Dog` must repeat the `public` keyword differently',
    ],
    answer: 0,
    why: [
      '',
      '`override` applies to methods, properties and indexers alike.',
      'Empty bodies compile fine.',
      'The modifier is correct as written.',
    ],
    explain:
      'Overriding is opt-in from the parent\'s side. The base must say `virtual` or `abstract`; the child must say `override`. Both halves are required.',
    source: 'Quiz 4 Q9, common traps table',
  },
  {
    id: 'w4-override-signature',
    conceptId: 'override',
    question: 'What must an overriding method keep identical to the one it overrides?',
    options: [
      'Its name, parameter list, return type and accessibility',
      'Only its name',
      'Only its name and return type',
      'Nothing — an override may change any of them',
    ],
    answer: 0,
    why: [
      '',
      'A different parameter list makes it an **overload**, not an override.',
      'Parameters are part of the signature too.',
      'Changing them would break every caller written against the base type.',
    ],
    explain:
      'Same signature, different body. That is the guarantee polymorphism rests on: whatever object arrives, the call is valid.',
    source: 'Quiz 4 Q7',
  },
  {
    id: 'w4-override-vs-overload-2',
    conceptId: 'override',
    code: `public class Printer
{
    public virtual void Print(string s) { Console.WriteLine("base"); }
}

public class Fancy : Printer
{
    public void Print(int n) { Console.WriteLine("int"); }
}

Printer p = new Fancy();
p.Print("hi");`,
    question: 'What does this print?',
    options: ['`base`', '`int`', 'Nothing', 'A compile error — `Fancy` must override `Print`'],
    answer: 0,
    why: [
      '',
      '`Print(int)` is a different method entirely — an overload, not an override — and the argument is a string anyway.',
      'The base implementation runs.',
      'A `virtual` method may be left un-overridden; it is not `abstract`.',
    ],
    explain:
      '**Overload** = same name, different parameters, chosen at compile time. **Override** = same signature, chosen at runtime. Changing the parameter list silently gives you the wrong one.',
    source: 'Quiz 4 Q7, applied',
    stretch: true,
  },
  {
    id: 'w4-base-call-in-override',
    conceptId: 'override',
    code: `public class Shape
{
    public virtual string Describe()
    {
        return "a shape";
    }
}

public class Circle : Shape
{
    public override string Describe()
    {
        return base.Describe() + " that is round";
    }
}

Console.WriteLine(new Circle().Describe());`,
    question: 'What does this print?',
    options: [
      '`a shape that is round`',
      '`a shape`',
      '`that is round`',
      'Infinite recursion — `base.Describe()` calls itself',
    ],
    answer: 0,
    why: [
      '',
      'The override runs, and it appends to what the base returned.',
      '`base.Describe()` supplies the first part.',
      '`base.` specifically means the parent\'s implementation, so there is no loop.',
    ],
    explain:
      'An override can extend rather than replace: call `base.Method()` to get the parent behaviour and add to it. Without `base.`, the call would resolve back to the override and recurse forever.',
    source: 'Lecture 4, overriding',
  },
  {
    id: 'w4-which-runs',
    conceptId: 'override',
    question:
      'A `virtual` method is overridden in a child. You call it through a variable declared as the parent type. Which implementation runs?',
    options: [
      'The child\'s — the actual object type decides',
      'The parent\'s — the reference type decides',
      'Whichever was compiled last',
      'Both, parent first',
    ],
    answer: 0,
    why: [
      '',
      'That is true only when the method is *not* virtual.',
      'Compilation order is irrelevant.',
      'Only one runs, unless the override explicitly calls `base`.',
    ],
    explain:
      'This is dynamic dispatch, and the single most examined sentence in Week 4: **the object decides, not the variable**.',
    source: 'Quiz 4 Q11, common traps table',
  },
  {
    id: 'w4-tostring-override',
    conceptId: 'override',
    code: `public class Point
{
    public override string ToString()
    {
        return "(1,2)";
    }
}

Console.WriteLine(new Point());`,
    question: 'Why is `override` allowed here when `Point` declares no base class?',
    options: [
      'Every class implicitly inherits from `object`, whose `ToString()` is virtual',
      'It is not allowed — this fails to compile',
      '`ToString` is a special case exempt from the rules',
      'Because the method returns a string',
    ],
    answer: 0,
    why: [
      '',
      'It compiles and prints `(1,2)`.',
      'It follows the normal rules exactly; the base is simply implicit.',
      'The return type has nothing to do with it.',
    ],
    explain:
      '`object` is the root of every type in .NET, and it supplies `ToString`, `Equals` and `GetHashCode` as virtual methods. Overriding `ToString` is the most common override there is.',
    source: 'Lecture 4 with Lecture 2 framework classes',
    stretch: true,
  },
  {
    id: 'w4-override-keyword-missing',
    conceptId: 'override',
    code: `public class Animal
{
    public virtual void Speak() { Console.WriteLine("..."); }
}

public class Dog : Animal
{
    public void Speak() { Console.WriteLine("Woof"); }
}`,
    question: 'What does the compiler say about `Dog.Speak()`?',
    options: [
      'It warns that it hides the inherited member, and suggests `new` or `override`',
      'Nothing — this is the normal way to override',
      'It is an error: two methods cannot share a name',
      'It silently overrides `Animal.Speak()`',
    ],
    answer: 0,
    why: [
      '',
      'The normal way requires the `override` keyword.',
      'It compiles — with a warning — because hiding is legal.',
      'Hiding is not overriding. Through an `Animal` reference the base version still runs.',
    ],
    explain:
      'C# makes you say which you meant. Forgetting `override` gets you hiding, which behaves correctly right up until someone uses a base-typed variable.',
    source: 'Quiz 4 Q7, applied',
  },
  {
    id: 'w4-fill-blank-override',
    conceptId: 'override',
    question:
      'Providing a new implementation of an inherited method, with the same signature, in a child class is called ______.',
    options: ['method overriding', 'method overloading', 'method hiding', 'generalisation'],
    answer: 0,
    why: [
      '',
      'Overloading is same name, *different* parameters, in the same class.',
      'Hiding is what `new` does — related, but it is not "providing a new implementation of an inherited method" in the polymorphic sense.',
      'That is a hierarchy design move, not a method-level one.',
    ],
    explain:
      'Overriding is the mechanism; polymorphism is what it buys you.',
    source: 'Quiz 4 Q7',
  },

  // ---------------------------------------------------------- polymorphism
  {
    id: 'w4-poly-collection',
    conceptId: 'polymorphism',
    code: `List<Shape> shapes = new List<Shape>();
shapes.Add(new Circle());
shapes.Add(new Rectangle());

foreach (Shape s in shapes)
{
    s.Draw();
}`,
    question: 'Assuming `Draw()` is virtual and overridden in both, what does this loop do?',
    options: [
      'Calls `Circle.Draw()` then `Rectangle.Draw()` — each object\'s own version',
      'Calls `Shape.Draw()` twice, because the list is a `List<Shape>`',
      'Fails to compile — a list cannot hold two different types',
      'Calls both overrides on both objects',
    ],
    answer: 0,
    why: [
      '',
      'The declared type decides what you can *call*; the actual object decides *which implementation runs*.',
      'A `List<Shape>` holds anything that is-a `Shape`, which is the point.',
      'Each object runs its own single implementation.',
    ],
    explain:
      'One loop, no type checks, correct behaviour for every shape — and adding a `Triangle` later needs no change here at all. This is why `Drawing` in Lab 5 holds a `List<Shape>`.',
    source: 'Quiz 4 Q5 · Lab 5 Task 5.1',
  },
  {
    id: 'w4-poly-replaces-ifelse',
    conceptId: 'polymorphism',
    code: `if (s.Kind == "circle") DrawCircle(s);
else if (s.Kind == "rect") DrawRect(s);
else if (s.Kind == "tri") DrawTri(s);`,
    question: 'What does polymorphism replace this with?',
    options: [
      '`s.Draw();` — each shape class supplies its own implementation',
      'A `switch` statement, which is faster',
      'A dictionary of kind strings to methods',
      'Nothing — this is already the object-oriented way',
    ],
    answer: 0,
    why: [
      '',
      'A `switch` is the same chain with tidier syntax, and still has to be edited for every new kind.',
      'That moves the chain into data but keeps the problem: something still has to know every kind.',
      'A type tag plus a branch on it is the procedural way, wearing a class as a hat.',
    ],
    explain:
      'The chain has to be found and edited every time a kind is added. The polymorphic call never changes — the new class simply supplies its own `Draw`.',
    source: 'Lecture 4, why polymorphism',
  },
  {
    id: 'w4-poly-declared-type-limits',
    conceptId: 'polymorphism',
    code: `public class Shape { public virtual void Draw() { } }
public class Circle : Shape
{
    public override void Draw() { }
    public void Roll() { }
}

Shape s = new Circle();
s.Roll();`,
    question: 'What happens on the last line?',
    options: [
      'A compile error — `Shape` has no `Roll()`, whatever the object really is',
      'It runs `Circle.Roll()`, because the object is a circle',
      'It runs, but does nothing',
      'It throws at runtime',
    ],
    answer: 0,
    why: [
      '',
      'Dynamic dispatch chooses between implementations of a member the *declared type* has. `Roll` is not one of them.',
      'The compiler rejects the program, so nothing runs.',
      'Visibility and member lookup are compile-time concerns.',
    ],
    explain:
      'The reference type decides **what you may call**; the object type decides **which override runs**. Both rules are live at once, and this is where they meet.',
    source: 'Quiz 4 Q1, applied',
    stretch: true,
  },
  {
    id: 'w4-poly-parent-reference',
    conceptId: 'polymorphism',
    question: 'Which assignment is legal?',
    options: [
      '`Shape s = new Circle();`',
      '`Circle c = new Shape();`',
      'Both are legal',
      'Neither — the types must match exactly',
    ],
    answer: 0,
    why: [
      '',
      'Every circle is a shape, but not every shape is a circle. That direction needs an explicit cast and can fail at runtime.',
      'Only the upward direction is implicit.',
      'Assigning a child to a parent-typed variable is the foundation of polymorphism.',
    ],
    explain:
      'Child → parent is always safe and implicit. Parent → child is a claim about the object that the compiler makes you assert with a cast.',
    source: 'Quiz 4 Q1',
  },
  {
    id: 'w4-poly-needs-inheritance',
    conceptId: 'polymorphism',
    question: 'Can you have subtype polymorphism in C# without inheritance or an interface?',
    options: [
      'No — there has to be a shared base class or interface for the objects to be used through',
      'Yes — any two classes with a method of the same name are polymorphic',
      'Yes, using method overloading',
      'Yes, but only inside the same file',
    ],
    answer: 0,
    why: [
      '',
      'C# has no duck typing here; a shared *name* creates no shared type.',
      'Overloading is resolved at compile time and involves no type hierarchy.',
      'File layout is irrelevant.',
    ],
    explain:
      'Something has to supply the common type the variable is declared as. That something is a base class or an interface — which is why Week 5\'s interfaces widen what polymorphism can reach.',
    source: 'Quiz 4 Q9',
  },
  {
    id: 'w4-poly-benefit',
    conceptId: 'polymorphism',
    question: 'What is the practical benefit of polymorphism to code that has already been written?',
    options: [
      'A new subclass can be added without changing the code that uses the base type',
      'Existing code runs faster once more subclasses exist',
      'Existing code no longer needs to be tested',
      'Existing methods can be deleted',
    ],
    answer: 0,
    why: [
      '',
      'Virtual dispatch has a small cost, not a benefit, in speed terms.',
      'New subclasses need new tests.',
      'Nothing is deleted; the shared call stays exactly as it was.',
    ],
    explain:
      'Open to extension, closed to modification. Adding `Triangle` touches one new file and none of the code that draws shapes.',
    source: 'Quiz 4 Q9, applied',
  },
  {
    id: 'w4-poly-real-world',
    conceptId: 'polymorphism',
    question:
      'Which everyday example best illustrates polymorphism?',
    options: [
      'One "print" action that handles a document, an image or a PDF appropriately',
      'A printer that can only handle one file format',
      'A file that can be opened by several programs',
      'A folder containing many files',
    ],
    answer: 0,
    why: [
      '',
      'One behaviour, one type — the opposite of many forms.',
      'That is several implementations of a *reader*, but the analogy the material uses is one action over many types.',
      'That is containment, which is a Week 3 relationship.',
    ],
    explain:
      'Many forms behind one call. The caller says "print"; what actually happens depends on what it was handed.',
    source: 'Quiz 4 Q12',
  },
  {
    id: 'w4-poly-runtime-def',
    conceptId: 'polymorphism',
    question: 'What makes runtime polymorphism "runtime"?',
    options: [
      'The implementation to run is chosen while the program executes, from the object\'s actual type',
      'The code is compiled while the program runs',
      'The method is looked up from a text file at startup',
      'It only works in a debugger',
    ],
    answer: 0,
    why: [
      '',
      'Compilation happens ahead of time; only the *dispatch* is deferred.',
      'Nothing is read from a file. The object carries its type with it.',
      'It works identically in a release build.',
    ],
    explain:
      'The compiler cannot know which subclass will be in the variable, so it emits a call that asks the object. Overloading, by contrast, is settled at compile time.',
    source: 'Quiz 4 Q11',
  },
  {
    id: 'w4-poly-trace-three',
    conceptId: 'polymorphism',
    code: `public class Vehicle
{
    public virtual void Start() { Console.WriteLine("vehicle"); }
}
public class Car : Vehicle
{
    public override void Start() { Console.WriteLine("car"); }
}
public class Truck : Vehicle { }

Vehicle[] all = { new Car(), new Truck() };
foreach (Vehicle v in all) v.Start();`,
    question: 'What is the output?',
    options: [
      '`car`, `vehicle`',
      '`car`, `truck`',
      '`vehicle`, `vehicle`',
      '`car`, `car`',
    ],
    answer: 0,
    why: [
      '',
      '`Truck` never overrides `Start()`, so there is no "truck" implementation to run.',
      '`Car` does override it, so the first line is `car`.',
      'A `Truck` is not a `Car`; it falls back to the inherited version.',
    ],
    explain:
      'Overriding is optional. A subclass that does not override simply inherits the base implementation — and the dispatch still works, it just finds the parent\'s version.',
    source: 'Quiz 4 Q5, varied',
  },

  // ---------------------------------------------------------- abstract
  {
    id: 'w4-abstract-body',
    conceptId: 'abstract',
    question: 'Which is a correct abstract method declaration in C#?',
    options: [
      '`public abstract void Print();`',
      '`public abstract void Print() { }`',
      '`public abstract void Print() = 0;`',
      '`public virtual abstract void Print();`',
    ],
    answer: 0,
    why: [
      '',
      'An abstract method may not have a body, not even an empty one.',
      '`= 0` is the C++ pure-virtual syntax. It is not C#.',
      '`abstract` already implies overridable; combining it with `virtual` is an error.',
    ],
    explain:
      'Access modifier, `abstract`, signature, semicolon. No braces, no `= 0`.',
    source: 'Quiz 4 Q8',
  },
  {
    id: 'w4-abstract-class-instantiate',
    conceptId: 'abstract',
    code: `public abstract class Shape
{
    public abstract double Area();
}

Shape s = new Shape();`,
    question: 'What happens on the last line?',
    options: [
      'A compile error — an abstract class cannot be instantiated',
      'It creates a `Shape` whose `Area()` returns 0',
      'It creates a `Shape` and throws when `Area()` is called',
      'It compiles, but `s` is `null`',
    ],
    answer: 0,
    why: [
      '',
      'There is no implementation of `Area()` to run, which is exactly why the language refuses.',
      'The refusal is at compile time, not at the first call.',
      '`new` never yields null.',
    ],
    explain:
      'An abstract class is deliberately incomplete. `Shape s = new Circle();` is fine — the *variable* may be abstractly typed, only the object cannot be.',
    source: 'Lecture 4, abstract classes',
  },
  {
    id: 'w4-abstract-forces-override',
    conceptId: 'abstract',
    code: `public abstract class Shape
{
    public abstract double Area();
}

public class Circle : Shape
{
}`,
    question: 'Why does `Circle` not compile?',
    options: [
      'A concrete class must implement every abstract member it inherits',
      'A class inheriting from an abstract class must itself be abstract',
      '`Circle` needs a constructor',
      'Abstract classes cannot be inherited from',
    ],
    answer: 0,
    why: [
      '',
      'It *may* be abstract, which is the other legal fix — but it is not required to be.',
      'A default constructor is supplied; that is not the problem.',
      'Being inherited from is the only thing an abstract class is for.',
    ],
    explain:
      'Two ways out: implement `Area()`, or mark `Circle` abstract too and leave the obligation to *its* children. What is impossible is a concrete class with an unimplemented member.',
    source: 'Lecture 4, abstract methods',
  },
  {
    id: 'w4-abstract-can-have-code',
    conceptId: 'abstract',
    question: 'Can an abstract class contain fields and fully implemented methods?',
    options: [
      'Yes — it can hold ordinary members as well as abstract ones',
      'No — every member of an abstract class must be abstract',
      'It can hold fields but not implemented methods',
      'It can hold implemented methods but no fields',
    ],
    answer: 0,
    why: [
      '',
      'A class with only abstract members and no state is effectively an interface, but that is a choice, not a rule.',
      'Implemented methods are common — shared behaviour is half the reason to use a base class.',
      'Fields are equally common, and `protected` ones especially.',
    ],
    explain:
      'This is the main difference from an interface: an abstract class can carry state and shared implementation, and still leave some members for the children.',
    source: 'Lecture 4 with Quiz 5 Q6',
  },
  {
    id: 'w4-abstract-vs-empty-body',
    conceptId: 'abstract',
    question: 'Why declare a method abstract rather than giving it an empty body?',
    options: [
      'The compiler then forces every concrete subclass to supply a real implementation',
      'Abstract methods run faster',
      'Empty methods are illegal in C#',
      'It allows the class to be instantiated',
    ],
    answer: 0,
    why: [
      '',
      'There is no performance difference.',
      'Empty methods are perfectly legal — that is the problem, not the fix.',
      'It has the opposite effect: any abstract member makes the class un-instantiable.',
    ],
    explain:
      'An empty body silently does nothing when a subclass forgets. `abstract` turns that omission into a compile error, which is where you want to find it.',
    source: 'Quiz 4 Q8, applied',
    stretch: true,
  },
  {
    id: 'w4-abstract-uml',
    conceptId: 'abstract',
    question: 'How does a UML class diagram show that a class is abstract?',
    options: [
      'Its name is written in *italics*',
      'Its name is underlined',
      'Its name is prefixed with `#`',
      'It is drawn with a dashed border',
    ],
    answer: 0,
    why: [
      '',
      'Underlining marks a **static** member.',
      '`#` marks a protected *member*, not a class.',
      'Not a standard notation.',
    ],
    explain:
      'Italics for abstract classes and abstract operations; underline for static. Two conventions worth recognising on sight in an exam diagram.',
    source: 'Lecture 4 UML with Quiz 2 Q17',
  },
  {
    id: 'w4-abstract-vs-virtual',
    conceptId: 'abstract',
    question: 'What is the difference between a `virtual` method and an `abstract` one?',
    options: [
      '`virtual` has a body a child may replace; `abstract` has none and a concrete child must supply one',
      '`virtual` can be overridden, `abstract` cannot',
      '`abstract` methods are private by default',
      'There is no difference — the keywords are interchangeable',
    ],
    answer: 0,
    why: [
      '',
      'Both are overridable; `abstract` in fact *requires* it.',
      'An abstract member cannot be private, since it exists to be overridden elsewhere.',
      'One provides a default, the other refuses to.',
    ],
    explain:
      'Choose `virtual` when there is a sensible default. Choose `abstract` when there is not, and the class has no business guessing.',
    source: 'Lecture 4, abstract and virtual',
  },
];
