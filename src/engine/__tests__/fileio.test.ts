/**
 * The in-run text filesystem behind Week 8's Task 8.2.
 *
 * Every case here is something a student's save/load code actually depends on,
 * and the two that matter most are the quiet ones: `ReadLine` returning `null`
 * past the end (so `while (line != null)` terminates), and a `WriteLine`-built
 * file not reporting a phantom blank final line.
 */

import { describe, expect, it } from 'vitest';
import { runProgram } from '@/engine/runner';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };

function run(body: string) {
  return runProgram(
    `public class Program\n{\n    public static void Main()\n    {\n${body}\n    }\n}`,
    { student: PROFILE },
  );
}

function outputOf(body: string): string {
  const r = run(body);
  expect(r.error?.message ?? '', 'program should run clean').toBe('');
  return r.output;
}

describe('StreamWriter and StreamReader', () => {
  it('writes lines and reads them back in order', () => {
    expect(
      outputOf(`        StreamWriter w = new StreamWriter("p.txt");
        w.WriteLine("Amy");
        w.WriteLine("a brave adventurer");
        w.Close();

        StreamReader r = new StreamReader("p.txt");
        Console.WriteLine(r.ReadLine());
        Console.WriteLine(r.ReadLine());
        r.Close();`),
    ).toBe('Amy\na brave adventurer');
  });

  it('ReadLine returns null past the end, so the usual while loop terminates', () => {
    expect(
      outputOf(`        StreamWriter w = new StreamWriter("p.txt");
        w.WriteLine("one");
        w.WriteLine("two");
        w.Close();

        StreamReader r = new StreamReader("p.txt");
        string line = r.ReadLine();
        int n = 0;
        while (line != null)
        {
            n = n + 1;
            Console.WriteLine(n + ": " + line);
            line = r.ReadLine();
        }
        r.Close();`),
    ).toBe('1: one\n2: two');
  });

  it('a WriteLine-built file has no phantom trailing blank line', () => {
    expect(
      outputOf(`        StreamWriter w = new StreamWriter("p.txt");
        w.WriteLine("only");
        w.Close();
        Console.WriteLine(File.ReadAllLines("p.txt").Length);`),
    ).toBe('1');
  });

  it('Write does not add a terminator, so two Writes share a line', () => {
    expect(
      outputOf(`        StreamWriter w = new StreamWriter("p.txt");
        w.Write("a,");
        w.Write("b");
        w.Close();
        StreamReader r = new StreamReader("p.txt");
        Console.WriteLine(r.ReadLine());
        Console.WriteLine(r.ReadLine() == null);
        r.Close();`),
    ).toBe('a,b\nTrue');
  });

  it('EndOfStream tracks the cursor', () => {
    expect(
      outputOf(`        StreamWriter w = new StreamWriter("p.txt");
        w.WriteLine("x");
        w.Close();
        StreamReader r = new StreamReader("p.txt");
        Console.WriteLine(r.EndOfStream);
        r.ReadLine();
        Console.WriteLine(r.EndOfStream);
        r.Close();`),
    ).toBe('False\nTrue');
  });

  it('reopening a path without append truncates it', () => {
    expect(
      outputOf(`        StreamWriter a = new StreamWriter("p.txt");
        a.WriteLine("first");
        a.Close();
        StreamWriter b = new StreamWriter("p.txt");
        b.WriteLine("second");
        b.Close();
        Console.Write(File.ReadAllText("p.txt"));`),
    ).toBe('second\n');
  });

  it('the two-argument form appends instead', () => {
    expect(
      outputOf(`        StreamWriter a = new StreamWriter("p.txt");
        a.WriteLine("first");
        a.Close();
        StreamWriter b = new StreamWriter("p.txt", true);
        b.WriteLine("second");
        b.Close();
        Console.Write(File.ReadAllText("p.txt"));`),
    ).toBe('first\nsecond\n');
  });

  it('reading a file that was never written is a catchable FileNotFoundException', () => {
    expect(
      outputOf(`        try
        {
            StreamReader r = new StreamReader("missing.txt");
            Console.WriteLine("should not get here");
        }
        catch (FileNotFoundException e)
        {
            Console.WriteLine("caught");
        }`),
    ).toBe('caught');
  });

  it('writing after Close is an error rather than silently working', () => {
    const r = run(`        StreamWriter w = new StreamWriter("p.txt");
        w.Close();
        w.WriteLine("too late");`);
    expect(r.error?.message ?? '').toContain('already been closed');
  });

  it('File.Exists is false before a write and true after', () => {
    expect(
      outputOf(`        Console.WriteLine(File.Exists("p.txt"));
        StreamWriter w = new StreamWriter("p.txt");
        w.Close();
        Console.WriteLine(File.Exists("p.txt"));`),
    ).toBe('False\nTrue');
  });

  it('files do not survive from one run to the next', () => {
    outputOf(`        StreamWriter w = new StreamWriter("leak.txt");
        w.WriteLine("hello");
        w.Close();`);
    expect(outputOf('        Console.WriteLine(File.Exists("leak.txt"));')).toBe('False');
  });
});
