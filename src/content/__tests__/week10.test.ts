/**
 * Content validation for Week 10.
 *
 * Same contract as week2-9. What this file guards that no other week does:
 * **the exact wording of the sheet's error messages.**
 *
 * Lab10.pdf page 3 specifies five strings, and the unit tests in
 * `lab10/10.1/SwinAdventureTest/LookCommandTests.cs` assert on them with
 * `Is.EqualTo`. Lecture 9's transcript reconstructs two of them differently
 * ("I cannot find the …" rather than "I can't find the …"). Getting it wrong
 * fails five of the eight named tests on a string comparison and is invisible
 * to any structural check — so the reference solution below uses the sheet's
 * spelling, and the near-misses prove that the lecture's spelling fails.
 */

import { describe, expect, it } from 'vitest';
import { week10, week10Interview } from '../week10';
import { runChecks } from '@/engine/checks';
import { runProgram } from '@/engine/runner';
import { parse } from '@/engine/parser';
import { personalize, resolveTokens } from '../personalize';
import type { Block, Exercise, Step } from '../types';

const PROFILE = { firstName: 'Amy', studentId: '104321987' };
const TOKENS = resolveTokens(PROFILE);

function allSteps(): Step[] {
  return week10.lessons.flatMap((l) => l.steps);
}

function stepById(id: string): Step {
  const s = allSteps().find((x) => x.id === id);
  if (!s) throw new Error(`No step '${id}'`);
  return s;
}

function check(stepId: string, solution: string) {
  const step = stepById(stepId);
  const ex = step.exercise as Exercise;
  expect(ex, `step ${stepId} has no exercise`).toBeDefined();
  return runChecks(
    ex.tests.map((t) => JSON.parse(personalize(JSON.stringify(t), TOKENS))),
    {
      source: personalize(solution, TOKENS),
      harness: ex.harness ? personalize(ex.harness, TOKENS) : undefined,
      stdin: ex.stdin,
      student: PROFILE,
    },
  );
}

function expectPass(stepId: string, solution: string) {
  const r = check(stepId, solution);
  const failed = r.results.filter((x) => !x.passed);
  expect(
    failed.map((f) => `${f.label}: ${f.detail ?? ''}`).join('\n') || (r.error?.message ?? ''),
    `reference solution for ${stepId} should pass`,
  ).toBe('');
  expect(r.allPassed).toBe(true);
}

function expectFail(stepId: string, solution: string) {
  const r = check(stepId, solution);
  expect(r.allPassed, `this solution should NOT pass ${stepId}`).toBe(false);
}

// ---------------------------------------------------------------- solutions

const COMMAND_ABSTRACT = `public abstract class Command : IdentifiableObject
{
    public Command(string[] ids) : base(ids) { }

    public abstract string Execute(Player p, string[] text);
}

public class LookCommand : Command
{
    public LookCommand() : base(new string[] { "look" }) { }

    public override string Execute(Player p, string[] text)
    {
        return "";
    }
}`;

/** Just the four validation checks — the shape w10-101-parse asks for. */
const VALIDATION_ONLY = `public class LookCommand : Command
{
    public LookCommand() : base(new string[] { "look" }) { }

    public override string Execute(Player p, string[] text)
    {
        if (text.Length != 3 && text.Length != 5)
        {
            return "I don't know how to look like that";
        }

        if (text[0].ToLower() != "look")
        {
            return "Error in look input";
        }

        if (text[1].ToLower() != "at")
        {
            return "What do you want to look at?";
        }

        if (text.Length == 5)
        {
            if (text[3].ToLower() != "in")
            {
                return "What do you want to look in?";
            }
        }

        return "ok";
    }
}`;

/** The finished command, exactly as Lab10.pdf and lab10/10.1 specify it. */
const LOOK_FULL = `public class LookCommand : Command
{
    public LookCommand() : base(new string[] { "look" }) { }

    public override string Execute(Player p, string[] text)
    {
        IHaveInventory container;

        if (text.Length != 3 && text.Length != 5)
        {
            return "I don't know how to look like that";
        }

        if (text[0].ToLower() != "look")
        {
            return "Error in look input";
        }

        if (text[1].ToLower() != "at")
        {
            return "What do you want to look at?";
        }

        if (text.Length == 5)
        {
            if (text[3].ToLower() != "in")
            {
                return "What do you want to look in?";
            }

            container = FetchContainer(p, text[4].ToLower());
            if (container == null)
            {
                return "I can't find the " + text[4].ToLower();
            }
        }
        else
        {
            container = p;
        }

        return LookAtIn(text[2].ToLower(), container);
    }

    private IHaveInventory FetchContainer(Player p, string containerId)
    {
        GameObject obj = p.Locate(containerId);
        return obj as IHaveInventory;
    }

    private string LookAtIn(string thingId, IHaveInventory container)
    {
        GameObject itm = container.Locate(thingId);
        if (itm == null)
        {
            return "I can't find the " + thingId;
        }
        return itm.FullDescription;
    }
}`;

// ------------------------------------------------------------------- shape

describe('week 10 shape', () => {
  it('is numbered 10 and names its sources', () => {
    expect(week10.number).toBe(10);
    expect(week10.sources.join(' ')).toMatch(/Lab10\.pdf/);
  });

  it('has unique step ids', () => {
    const ids = allSteps().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every lab lesson an assessment weight', () => {
    for (const l of week10.lessons.filter((x) => x.kind === 'lab')) {
      expect(l.assessment, l.id).toBeTruthy();
    }
  });

  it('parses every code and runnable block that is a whole program', () => {
    const bad: string[] = [];
    for (const step of allSteps()) {
      for (const b of step.blocks as Block[]) {
        if (b.t === 'code' && (b.lang ?? 'csharp') !== 'csharp') continue;
        if (b.t !== 'code' && b.t !== 'runnable' && b.t !== 'umlSpec') continue;
        const src = b.t === 'umlSpec' ? b.source : b.code;
        if (b.t === 'code' && !/^\s*public\s+(abstract\s+)?(class|interface)\s/.test(src)) continue;
        try {
          parse(personalize(src, TOKENS));
        } catch (e) {
          bad.push(`${step.id}: ${(e as Error).message}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

// ------------------------------------------------------------- predictions

describe('every predict block tells the truth', () => {
  it('runs each one against the interpreter', () => {
    for (const step of allSteps()) {
      for (const b of step.blocks as Block[]) {
        if (b.t !== 'predict') continue;
        const ex = step.exercise as Exercise | undefined;
        const harness = ex?.harness
          ? personalize(ex.harness, TOKENS).replace(/public class __Check[\s\S]*$/, '')
          : '';
        // Predict blocks sit before their step's exercise, so the class the
        // student is about to write is not in the harness yet.
        const classes = /class\s+LookCommand\b/.test(harness)
          ? harness
          : `${harness}\n\n${LOOK_FULL}`;
        const src = `${classes}

public class __P
{
    public static void Main()
    {
${personalize(b.code, TOKENS)
  .split('\n')
  .map((l) => '        ' + l)
  .join('\n')}
    }
}`;
        const r = runProgram(src);
        if (b.expect.errorContains) {
          expect(r.error?.message ?? '', `${step.id} predict should fail`).toContain(
            b.expect.errorContains,
          );
          continue;
        }
        expect(r.error?.message ?? '', `${step.id} predict should run`).toBe('');
        expect((r.output ?? '').trim(), `${step.id} predict output`).toBe(
          (b.expect.output ?? '').trim(),
        );
      }
    }
  });
});

// -------------------------------------------------------------- task 10.1

describe('task 10.1 — the abstract Command', () => {
  it('accepts the abstract Command and its first subclass', () => {
    expectPass('w10-101-command', COMMAND_ABSTRACT);
  });

  it('rejects a Command that is not abstract', () => {
    expectFail(
      'w10-101-command',
      COMMAND_ABSTRACT.replace('public abstract class Command', 'public class Command').replace(
        'public abstract string Execute(Player p, string[] text);',
        'public virtual string Execute(Player p, string[] text) { return ""; }',
      ),
    );
  });

  it('rejects an Execute that is concrete on the base class', () => {
    expectFail(
      'w10-101-command',
      COMMAND_ABSTRACT.replace(
        'public abstract string Execute(Player p, string[] text);',
        'public virtual string Execute(Player p, string[] text) { return ""; }',
      ),
    );
  });
});

describe('task 10.1 — validating the input', () => {
  it('accepts the four checks in the order the sheet gives', () => {
    expectPass('w10-101-parse', VALIDATION_ONLY);
  });

  it('rejects checking word 1 before checking the length', () => {
    // Reading text[0] on an empty array throws, which is exactly what the
    // length-first ordering prevents.
    expectFail(
      'w10-101-parse',
      `public class LookCommand : Command
{
    public LookCommand() : base(new string[] { "look" }) { }

    public override string Execute(Player p, string[] text)
    {
        if (text[0].ToLower() != "look")
        {
            return "Error in look input";
        }

        if (text.Length != 3 && text.Length != 5)
        {
            return "I don't know how to look like that";
        }

        if (text[1].ToLower() != "at")
        {
            return "What do you want to look at?";
        }

        return "ok";
    }
}`,
    );
  });

  it('rejects a 4-word command being treated as valid', () => {
    expectFail(
      'w10-101-parse',
      VALIDATION_ONLY.replace(
        'if (text.Length != 3 && text.Length != 5)',
        'if (text.Length < 3)',
      ),
    );
  });
});

describe('task 10.1 — the two helpers', () => {
  it('accepts the finished command', () => {
    expectPass('w10-101-fetch', LOOK_FULL);
  });

  it("rejects Lecture 9's wording — the sheet says \"can't\", not \"cannot\"", () => {
    // The single highest-value assertion in this file. Both messages read
    // naturally and only one is graded.
    expectFail('w10-101-fetch', LOOK_FULL.split("I can't find the ").join('I cannot find the '));
  });

  it('rejects reporting the item when the container is what went missing', () => {
    expectFail(
      'w10-101-fetch',
      LOOK_FULL.replace(
        `return "I can't find the " + text[4].ToLower();`,
        `return "I can't find the " + text[2].ToLower();`,
      ),
    );
  });

  it('rejects a hard cast, which crashes on a non-container', () => {
    expectFail(
      'w10-101-fetch',
      LOOK_FULL.replace('return obj as IHaveInventory;', 'return (IHaveInventory)obj;'),
    );
  });

  it('rejects helpers left public, which the UML marks private', () => {
    expectFail(
      'w10-101-fetch',
      LOOK_FULL.replace(
        'private IHaveInventory FetchContainer',
        'public IHaveInventory FetchContainer',
      ),
    );
  });
});

// -------------------------------------------------------------- task 10.2

describe('task 10.2 — the console application', () => {
  it('accepts the LookAtItemInBag unit test', () => {
    const ex = stepById('w10-102-tests').exercise as Exercise;
    expectPass(
      'w10-102-tests',
      ex.seed.replace(
        `    public void LookAtItemInBag()
    {

    }`,
        `    public void LookAtItemInBag()
    {
        _testPlayer.Inventory.Take("gem");
        _testMoneyBag.Inventory.Put(_testItem);
        _testPlayer.Inventory.Put(_testMoneyBag);

        string result = _testLookCommand.Execute(_testPlayer, new string[] { "look", "at", "gem", "in", "bag" });
        Assert.That(result, Is.EqualTo(_testItem.FullDescription));
    }`,
      ),
    );
  });

  it('accepts the program setup, with the fourth item inside the bag', () => {
    const ex = stepById('w10-102-program').exercise as Exercise;
    expectPass(
      'w10-102-program',
      ex.seed.replace(
        `        Player player = new Player(name, desc);
`,
        `        Player player = new Player(name, desc);

        player.Inventory.Put(new Item(new string[] { "gem", "ruby" }, "A Ruby", "A bright Pink ruby"));
        player.Inventory.Put(new Item(new string[] { "hammer" }, "A Hammer", "Heavy."));

        Bag bag = new Bag(new string[] { "bag", "money" }, "Money Bag", "Valuables");
        player.Inventory.Put(bag);
        bag.Inventory.Put(new Item(new string[] { "coin" }, "A Gold Coin", "Shiny."));
`,
      ),
    );
  });

  it('rejects putting the fourth item beside the bag instead of inside it', () => {
    const ex = stepById('w10-102-program').exercise as Exercise;
    expectFail(
      'w10-102-program',
      ex.seed.replace(
        `        Player player = new Player(name, desc);
`,
        `        Player player = new Player(name, desc);

        player.Inventory.Put(new Item(new string[] { "gem", "ruby" }, "A Ruby", "A bright Pink ruby"));
        Bag bag = new Bag(new string[] { "bag", "money" }, "Money Bag", "Valuables");
        player.Inventory.Put(bag);
`,
      ),
    );
  });
});

describe('verification task 10 — case insensitivity', () => {
  const NORMALISE = `        string[] words = new string[text.Length];
        for (int i = 0; i < text.Length; i++)
        {
            words[i] = text[i].ToLower();
        }`;

  it('accepts one normalising pass at the top of Execute', () => {
    const ex = stepById('w10-102-verify').exercise as Exercise;
    expectPass('w10-102-verify', ex.seed.replace('\n\n        if (words[0]', `\n${NORMALISE}\n\n        if (words[0]`));
  });

  it('rejects leaving the copy out, which cannot compile', () => {
    const ex = stepById('w10-102-verify').exercise as Exercise;
    expectFail('w10-102-verify', ex.seed);
  });

  it('rejects a copy that does not actually lowercase', () => {
    const ex = stepById('w10-102-verify').exercise as Exercise;
    expectFail(
      'w10-102-verify',
      ex.seed.replace(
        '\n\n        if (words[0]',
        `
        string[] words = new string[text.Length];
        for (int i = 0; i < text.Length; i++)
        {
            words[i] = text[i];
        }

        if (words[0]`,
      ),
    );
  });
});

// --------------------------------------------------------------- interview

describe('the interview drill', () => {
  it('only points at steps that exist', () => {
    const ids = new Set(allSteps().map((s) => s.id));
    for (const q of week10Interview) {
      if (q.aboutStep) expect(ids.has(q.aboutStep), `${q.id} -> ${q.aboutStep}`).toBe(true);
    }
  });
});
