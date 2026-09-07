import { describe, expect, it } from 'vitest';
import { runProgram, runTests } from '../runner';

const run = (src: string) => runProgram(src, { trace: false });
const out = (src: string) => {
  const r = run(src);
  if (!r.ok) throw new Error(`${r.error?.message} (line ${r.error?.line})`);
  return r.output;
};

describe('basics', () => {
  it('runs top-level statements', () => {
    expect(out('Console.WriteLine("Hello world");')).toBe('Hello world');
  });

  it('runs a Main method', () => {
    expect(out(`
      public class Program {
        static void Main() { Console.WriteLine("hi"); }
      }
    `)).toBe('hi');
  });

  it('does integer division like C#', () => {
    expect(out('Console.WriteLine(7 / 2);')).toBe('3');
    expect(out('Console.WriteLine(7.0 / 2);')).toBe('3.5');
    expect(out('Console.WriteLine(7 / 2.0);')).toBe('3.5');
  });

  it('prints bools capitalised like .NET', () => {
    expect(out('Console.WriteLine(true);')).toBe('True');
  });

  it('supports composite format strings', () => {
    expect(out('Console.WriteLine("{0} is {1}", "a", 5);')).toBe('a is 5');
  });

  it('supports string interpolation with format specs', () => {
    expect(out('int n = 7; Console.WriteLine($"n={n} half={n / 2.0:F2}");')).toBe('n=7 half=3.50');
  });

  it('wraps int overflow like an unchecked context', () => {
    // Lab 2.1 step 13 asks students to explain exactly this.
    expect(out('int x = 2147483647; x = x + 1; Console.WriteLine(x);')).toBe('-2147483648');
  });

  it('rejects using a number as a condition', () => {
    const r = run('if (1) { }');
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/must be a bool/);
  });
});

describe('Lab 2.1 — Counter', () => {
  const counter = `
    public class Counter
    {
        private int _count;
        private string _name;

        public Counter(string name)
        {
            _name = name;
            _count = 0;
        }

        public void Increment() { _count = _count + 1; }
        public void Reset() { _count = 0; }

        public string Name
        {
            get { return _name; }
            set { _name = value; }
        }

        public int Ticks
        {
            get { return _count; }
        }
    }
  `;

  it('runs the full Task 2.1 program', () => {
    const src = counter + `
      public class Program
      {
          private static void PrintCounters(Counter[] counters)
          {
              foreach (Counter c in counters)
              {
                  Console.WriteLine("{0} is {1}", c.Name, c.Ticks);
              }
          }

          static void Main()
          {
              Counter[] myCounters = new Counter[3];
              myCounters[0] = new Counter("Counter 1");
              myCounters[1] = new Counter("Counter 2");
              myCounters[2] = myCounters[0];

              for (int i = 1; i <= 9; i++) myCounters[0].Increment();
              for (int i = 1; i <= 14; i++) myCounters[1].Increment();

              PrintCounters(myCounters);
              myCounters[2].Reset();
              PrintCounters(myCounters);
          }
      }
    `;
    // The aliasing lesson: [2] and [0] are the SAME object, so Reset hits both.
    expect(out(src)).toBe(
      [
        'Counter 1 is 9',
        'Counter 2 is 14',
        'Counter 1 is 9',
        'Counter 1 is 0',
        'Counter 2 is 14',
        'Counter 1 is 0',
      ].join('\n'),
    );
  });

  it('blocks reading a private field from outside', () => {
    const r = run(counter + 'var c = new Counter("a"); Console.WriteLine(c._count);');
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/private/);
  });

  it('blocks writing a read-only property', () => {
    const r = run(counter + 'var c = new Counter("a"); c.Ticks = 5;');
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/read-only/);
  });

  it('allows the read-write Name property', () => {
    expect(out(counter + 'var c = new Counter("a"); c.Name = "b"; Console.WriteLine(c.Name);')).toBe('b');
  });
});

describe('Lab 2.2 — Shape', () => {
  it('runs the console Shape task', () => {
    const src = `
      public class Shape
      {
          private string _color;
          private float _x;
          private float _y;
          private int _width;
          private int _height;

          public Shape(int param)
          {
              _color = "Color.Azure";
              _x = 0.0f;
              _y = 0.0f;
              _width = param;
              _height = param;
          }

          public string Color { get { return _color; } set { _color = value; } }
          public float X { get { return _x; } set { _x = value; } }
          public float Y { get { return _y; } set { _y = value; } }
          public int Width { get { return _width; } set { _width = value; } }
          public int Height { get { return _height; } set { _height = value; } }

          public void Draw()
          {
              Console.WriteLine("Color is " + _color);
              Console.WriteLine("Position X is " + _x);
              Console.WriteLine("Position Y is " + _y);
              Console.WriteLine("Width is " + _width);
              Console.WriteLine("Height is " + _height);
          }

          public bool IsAt(int xInput, int yInput)
          {
              return xInput > _x && xInput < _x + _width && yInput > _y && yInput < _y + _height;
          }
      }

      public class Program
      {
          static void Main()
          {
              Shape myShape = new Shape(123);
              myShape.Draw();
              Console.WriteLine(myShape.IsAt(50, 50));
              Console.WriteLine(myShape.IsAt(500, 50));
          }
      }
    `;
    expect(out(src)).toBe(
      [
        'Color is Color.Azure',
        'Position X is 0',
        'Position Y is 0',
        'Width is 123',
        'Height is 123',
        'True',
        'False',
      ].join('\n'),
    );
  });
});

describe('Week 2 — collections and IdentifiableObject', () => {
  const ido = `
    public class IdentifiableObject
    {
        private List<string> _identifiers = new List<string>();

        public IdentifiableObject(string[] idens)
        {
            foreach (string element in idens) { _identifiers.Add(element.ToLower()); }
        }

        public string FirstID { get { return _identifiers[0]; } }

        public bool AreYou(string identifier)
        {
            return _identifiers.Contains(identifier.ToLower());
        }

        public void AddIdentifier(string id) { _identifiers.Add(id.ToLower()); }
    }
  `;

  it('matches identifiers case-insensitively', () => {
    expect(out(ido + `
      var o = new IdentifiableObject(new string[] { "Swinburne", "ENBuilding" });
      Console.WriteLine(o.AreYou("swinburne"));
      Console.WriteLine(o.AreYou("SWINBURNE"));
      Console.WriteLine(o.AreYou("ocean"));
      Console.WriteLine(o.FirstID);
    `)).toBe('True\nTrue\nFalse\nswinburne');
  });

  it('supports List and Dictionary', () => {
    expect(out(`
      List<int> nums = new List<int>();
      nums.Add(3); nums.Add(1); nums.Add(2);
      nums.Sort();
      Console.WriteLine(nums.Count);
      Console.WriteLine(nums[0]);
      Dictionary<string, int> scores = new Dictionary<string, int>();
      scores["amy"] = 90;
      scores.Add("bo", 80);
      Console.WriteLine(scores["amy"] + scores["bo"]);
      Console.WriteLine(scores.ContainsKey("cat"));
    `)).toBe('3\n1\n170\nFalse');
  });

  it('gives a real index error message', () => {
    const r = run('int[] a = new int[3]; Console.WriteLine(a[3]);');
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/Index 3 is outside/);
  });
});

describe('Week 4 — inheritance and polymorphism', () => {
  const hierarchy = `
    public abstract class GameObject
    {
        private string _name;
        private string _description;

        public GameObject(string name, string desc)
        {
            _name = name;
            _description = desc;
        }

        public string Name { get { return _name; } }
        public string ShortDescription { get { return _name; } }
        public virtual string FullDescription { get { return _description; } }
    }

    public class Item : GameObject
    {
        public Item(string name, string desc) : base(name, desc) { }
    }

    public class Bag : GameObject
    {
        public Bag(string name, string desc) : base(name, desc) { }
        public override string FullDescription { get { return "In the bag: " + base.FullDescription; } }
    }
  `;

  it('dispatches virtual properties on the runtime type', () => {
    expect(out(hierarchy + `
      GameObject[] things = new GameObject[2];
      things[0] = new Item("sword", "A bronze sword");
      things[1] = new Bag("bag", "A leather bag");
      foreach (GameObject g in things) { Console.WriteLine(g.FullDescription); }
    `)).toBe('A bronze sword\nIn the bag: A leather bag');
  });

  it('refuses to instantiate an abstract class, with a teaching hint', () => {
    const r = run(hierarchy + 'var g = new GameObject("a", "b");');
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/abstract/);
    expect(r.error?.hint).toMatch(/subclasses/);
  });

  it('runs virtual methods through a base-typed variable', () => {
    expect(out(`
      public class Animal {
        public virtual string Speak() { return "..."; }
      }
      public class Dog : Animal {
        public override string Speak() { return "Woof"; }
      }
      public class Cat : Animal {
        public override string Speak() { return "Meow"; }
      }
      public class Program {
        static void Main() {
          Animal[] pets = new Animal[] { new Dog(), new Cat(), new Animal() };
          foreach (Animal a in pets) Console.WriteLine(a.Speak());
        }
      }
    `)).toBe('Woof\nMeow\n...');
  });

  it('supports interfaces', () => {
    expect(out(`
      public interface IShape { double Area(); }
      public class Square : IShape {
        private double _s;
        public Square(double s) { _s = s; }
        public double Area() { return _s * _s; }
      }
      public class Program {
        static void Main() {
          IShape s = new Square(3);
          Console.WriteLine(s.Area());
        }
      }
    `)).toBe('9');
  });

  it('reports a missing override on an abstract method clearly', () => {
    const r = run(`
      public abstract class Shape { public abstract double Area(); }
      public class Blob : Shape { }
      public class Program { static void Main() { Shape s = new Blob(); Console.WriteLine(s.Area()); } }
    `);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/does not provide a body/);
  });
});

describe('Week 5 — constructor chaining and collaboration', () => {
  it('supports : this(...) default constructors', () => {
    expect(out(`
      public class Drawing {
        private string _background;
        private List<string> _shapes;
        public Drawing(string background) {
          _shapes = new List<string>();
          _background = background;
        }
        public Drawing() : this("White") { }
        public string Background { get { return _background; } }
        public int ShapeCount { get { return _shapes.Count; } }
        public void AddShape(string s) { _shapes.Add(s); }
      }
      public class Program {
        static void Main() {
          Drawing d = new Drawing();
          Console.WriteLine(d.Background);
          Console.WriteLine(d.ShapeCount);
          d.AddShape("rect");
          Console.WriteLine(d.ShapeCount);
        }
      }
    `)).toBe('White\n0\n1');
  });
});

describe('exceptions', () => {
  it('catches a thrown exception', () => {
    expect(out(`
      try {
        int x = 0;
        Console.WriteLine(10 / x);
      } catch (DivideByZeroException e) {
        Console.WriteLine("Caught: " + e.Message);
      } finally {
        Console.WriteLine("done");
      }
    `)).toBe('Caught: Attempted to divide by zero.\ndone');
  });

  it('catches a custom throw', () => {
    expect(out(`
      try { throw new ArgumentException("bad input"); }
      catch (Exception e) { Console.WriteLine(e.Message); }
    `)).toBe('bad input');
  });
});

describe('NUnit test runner', () => {
  it('runs passing and failing tests with SetUp', () => {
    const src = `
      public class IdentifiableObject
      {
          private List<string> _identifiers = new List<string>();
          public IdentifiableObject(string[] idens) {
              foreach (string e in idens) { _identifiers.Add(e.ToLower()); }
          }
          public bool AreYou(string id) { return _identifiers.Contains(id.ToLower()); }
      }

      [TestFixture]
      public class IdentifiableObjectTest
      {
          private IdentifiableObject myObject;

          [SetUp]
          public void Setup() {
              myObject = new IdentifiableObject(new string[] { "swinburne", "enbuilding" });
          }

          [Test]
          public void TestAreYou() { Assert.That(myObject.AreYou("swinburne"), Is.True); }

          [Test]
          public void TestNotAreYou() { Assert.That(myObject.AreYou("ocean"), Is.False); }

          [Test]
          public void TestFails() { Assert.That(myObject.AreYou("ocean"), Is.True); }
      }
    `;
    const r = runTests(src);
    expect(r.passed).toBe(2);
    expect(r.failed).toBe(1);
    const failing = r.results.find((x) => !x.passed)!;
    expect(failing.name).toBe('TestFails');
    expect(failing.message).toMatch(/Expected: True/);
  });

  it('supports Assert.AreEqual and ClassicAssert', () => {
    const r = runTests(`
      public class Student {
        private string _name;
        public Student(string name) { _name = name; }
        public string Name { get { return _name; } }
      }
      [TestFixture]
      public class StudentTest {
        [Test]
        public void NameIsSet() {
          Student s = new Student("John Doe");
          ClassicAssert.AreEqual("John Doe", s.Name);
        }
        [Test]
        public void NameIsWrong() {
          Student s = new Student("John Doe");
          Assert.AreEqual("Jane", s.Name);
        }
      }
    `);
    expect(r.passed).toBe(1);
    expect(r.failed).toBe(1);
  });
});

describe('memory tracing', () => {
  it('captures stack frames and heap objects', () => {
    const r = runProgram(`
      public class Counter {
        private int _count;
        public void Increment() { _count = _count + 1; }
        public int Ticks { get { return _count; } }
      }
      public class Program {
        static void Main() {
          Counter a = new Counter();
          Counter b = a;
          a.Increment();
          Console.WriteLine(b.Ticks);
        }
      }
    `, { trace: true });

    expect(r.ok).toBe(true);
    expect(r.output).toBe('1');
    expect(r.snapshots.length).toBeGreaterThan(5);

    // Aliasing: both locals must point at the same heap id.
    const last = r.snapshots[r.snapshots.length - 1];
    const main = last.frames.find((f) => f.label.includes('Main'));
    expect(main).toBeDefined();
    const a = main!.locals.find((l) => l.name === 'a');
    const b = main!.locals.find((l) => l.name === 'b');
    expect(a?.refId).toBeDefined();
    expect(a?.refId).toBe(b?.refId);

    // The Counter instance should be on the heap and reachable.
    const counter = last.heap.find((h) => h.type === 'Counter');
    expect(counter?.reachable).toBe(true);
  });

  it('records a call trace for sequence diagrams', () => {
    const r = runProgram(`
      public class Deck { public string Draw() { return "Ace"; } }
      public class Game {
        private Deck _deck = new Deck();
        public void Play() { Console.WriteLine(_deck.Draw()); }
      }
      public class Program { static void Main() { new Game().Play(); } }
    `, { trace: true });

    expect(r.ok).toBe(true);
    const drawCall = r.calls.find((c) => c.kind === 'call' && c.method === 'Draw');
    expect(drawCall).toBeDefined();
    expect(drawCall!.from).toMatch(/^Game#/);
    expect(drawCall!.to).toMatch(/^Deck#/);
  });
});

describe('SplashKit shim', () => {
  it('runs a bounded ShapeDrawer game loop and emits draw commands', () => {
    const r = runProgram(`
      using SplashKitSDK;

      public class Shape
      {
          private Color _color;
          private float _x;
          private float _y;
          private int _width;
          private int _height;

          public Shape(int param)
          {
              _color = Color.Azure;
              _x = 0.0f;
              _y = 0.0f;
              _width = param;
              _height = param;
          }

          public Color Color { get { return _color; } set { _color = value; } }
          public float X { get { return _x; } set { _x = value; } }
          public float Y { get { return _y; } set { _y = value; } }

          public void Draw()
          {
              SplashKit.FillRectangle(_color, _x, _y, _width, _height);
          }
      }

      public class Program
      {
          public static void Main()
          {
              Window window = new Window("Shape Drawer", 800, 600);
              Shape myShape = new Shape(100);
              int frames = 0;
              do
              {
                  SplashKit.ProcessEvents();
                  SplashKit.ClearScreen();
                  myShape.Draw();
                  SplashKit.RefreshScreen();
                  frames = frames + 1;
                  if (frames > 3) { window.Close(); }
              } while (!window.CloseRequested);
              Console.WriteLine("frames=" + frames);
          }
      }
    `);

    expect(r.ok).toBe(true);
    expect(r.output).toBe('frames=4');
    expect(r.splashkit?.active).toBe(true);
    expect(r.splashkit?.width).toBe(800);
    const fill = r.splashkit?.frame.find((c) => c.c === 'fillRect');
    expect(fill).toBeDefined();
    // Azure is 240,255,255
    expect((fill as { color: { r: number } }).color.r).toBe(240);
  });
});

describe('error messages are teaching-grade', () => {
  it('suggests a casing fix', () => {
    const r = run('int total = 5; Console.WriteLine(Total);');
    expect(r.ok).toBe(false);
    expect(r.error?.hint).toMatch(/case-sensitive/);
  });

  it('explains a missing parenthesis on a method', () => {
    const r = run(`
      public class A { public int Go() { return 1; } }
      var a = new A();
      Console.WriteLine(a.Go);
    `);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/forget the parentheses/);
  });

  it('catches an infinite loop instead of hanging', () => {
    const r = runProgram('int i = 0; while (i < 10) { Console.WriteLine("x"); }', { stepBudget: 50_000 });
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/too long/);
    expect(r.error?.hint).toMatch(/never reaches its stopping condition/);
  });

  it('explains calling an instance method from a static one', () => {
    const r = run(`
      public class Program {
        public void Helper() { }
        static void Main() { Helper(); }
      }
    `);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/not static/);
  });
});
