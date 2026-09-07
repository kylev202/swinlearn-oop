/**
 * Drives the interpreter and turns its Tick stream into the artefacts the
 * lesson UI needs: console output, stack/heap snapshots for the memory
 * visualiser, a call trace for the sequence diagram, and NUnit results.
 */

import { parse, ParseError } from './parser';
import { LexError } from './lexer';
import { CsThrow, Interpreter, RuntimeError, type Frame, type Tick } from './interpreter';
import { AssertionFailure, AssertionPass } from './builtins';
import type { SplashKitState } from './splashkit';
import {
  ancestry, toShortLabel, typeNameOf,
  type HeapObject, type InstanceObj, type Value,
} from './values';
import type { CompilationUnit, Pos } from './ast';

// ------------------------------------------------------------------- results

export interface CompileError {
  message: string;
  line: number;
  col: number;
  hint?: string;
  phase: 'parse' | 'runtime';
}

export interface SlotView {
  name: string;
  value: string;
  /** Set when the slot holds a reference, so the diagram can draw an arrow. */
  refId?: number;
  type?: string;
}

export interface FrameView {
  label: string;
  thisId?: number;
  locals: SlotView[];
  line: number;
}

export interface HeapView {
  id: number;
  kind: HeapObject['k'];
  type: string;
  /** One-line summary for compact rendering. */
  summary: string;
  fields: SlotView[];
  reachable: boolean;
}

export interface MemorySnapshot {
  step: number;
  line: number;
  col: number;
  note?: string;
  kind: Tick['kind'];
  frames: FrameView[];
  heap: HeapView[];
  output: string;
}

/** One edge in the generated UML sequence diagram. */
export interface CallEvent {
  from: string;
  to: string;
  method: string;
  args: string[];
  depth: number;
  kind: 'call' | 'return';
  returnValue?: string;
  line: number;
}

export interface RunResult {
  ok: boolean;
  output: string;
  error?: CompileError;
  /** Empty when tracing was disabled or the budget for snapshots ran out. */
  snapshots: MemorySnapshot[];
  calls: CallEvent[];
  truncated: boolean;
  steps: number;
  unit?: CompilationUnit;
  splashkit?: SplashKitState;
}

export interface RunOptions {
  /** Capture stack/heap snapshots. Off for plain "run my code" speed. */
  trace?: boolean;
  /** Cap on stored snapshots; tracing stops (but running continues) past this. */
  maxSnapshots?: number;
  stdin?: string[];
  student?: { firstName: string; studentId: string };
  stepBudget?: number;
}

// ---------------------------------------------------------------- snapshots

function describeHeapObject(o: HeapObject, interp: Interpreter): { type: string; summary: string; fields: SlotView[] } {
  const heap = interp.heap;
  const slot = (name: string, v: Value): SlotView => ({
    name,
    value: interp.display(v).slice(0, 60) || toShortLabel(v, heap),
    refId: v.k === 'ref' ? v.id : undefined,
    type: typeNameOf(v, heap),
  });

  switch (o.k) {
    case 'instance': {
      const fields: SlotView[] = [];
      for (const [name, v] of o.fields) fields.push(slot(name, v));
      for (const [name, v] of o.autoProps) fields.push(slot(`${name} «auto»`, v));
      return { type: o.cls.name, summary: o.cls.name, fields };
    }
    case 'array':
      return {
        type: `${o.elementType}[]`,
        summary: `${o.elementType}[${o.elements.length}]`,
        fields: o.elements.map((v, i) => slot(`[${i}]`, v)),
      };
    case 'list':
      return {
        type: `List<${o.elementType}>`,
        summary: `List<${o.elementType}> · ${o.elements.length} item(s)`,
        fields: o.elements.map((v, i) => slot(`[${i}]`, v)),
      };
    case 'dict':
      return {
        type: `Dictionary<${o.keyType}, ${o.valueType}>`,
        summary: `Dictionary · ${o.entries.length} entry(s)`,
        fields: o.entries.map((e) => slot(interp.display(e.key), e.value)),
      };
    case 'string':
      return {
        type: 'string',
        summary: JSON.stringify(o.value.length > 40 ? o.value.slice(0, 40) + '…' : o.value),
        fields: [],
      };
    case 'exception':
      return { type: o.type, summary: `${o.type}: ${o.message}`, fields: [] };
    case 'func':
      return { type: 'lambda', summary: 'lambda', fields: [] };
    case 'struct': {
      const fields: SlotView[] = [];
      for (const [name, v] of o.fields) fields.push(slot(name, v));
      return { type: o.type, summary: o.type, fields };
    }
  }
}

function snapshot(interp: Interpreter, tick: Tick, step: number): MemorySnapshot {
  const heap = interp.heap;

  const frames: FrameView[] = interp.stack.map((f: Frame) => {
    const locals: SlotView[] = [];
    for (const scope of f.scopes) {
      for (const [name, v] of scope.vars) {
        locals.push({
          name,
          value: interp.display(v).slice(0, 60) || toShortLabel(v, heap),
          refId: v.k === 'ref' ? v.id : undefined,
          type: typeNameOf(v, heap),
        });
      }
    }
    return {
      label: f.label,
      thisId: f.thisRef?.k === 'ref' ? f.thisRef.id : undefined,
      locals,
      line: f.pos.line,
    };
  });

  // Roots = everything currently referenced from any live frame or static field.
  const roots: Value[] = [];
  for (const f of interp.stack) {
    if (f.thisRef) roots.push(f.thisRef);
    for (const scope of f.scopes) for (const v of scope.vars.values()) roots.push(v);
  }
  for (const cls of interp.classes.values()) {
    for (const v of cls.staticFields.values()) roots.push(v);
  }
  const reachable = heap.reachableFrom(roots);

  const heapView: HeapView[] = [];
  for (const [id, o] of heap.entries()) {
    // Type handles are an implementation detail, not something a student wrote.
    if (o.k === 'struct' && o.type === '<type>') continue;
    if (o.k === 'struct' && o.type === 'Constraint') continue;
    const d = describeHeapObject(o, interp);
    heapView.push({ id, kind: o.k, type: d.type, summary: d.summary, fields: d.fields, reachable: reachable.has(id) });
  }

  return {
    step,
    line: tick.pos?.line ?? 0,
    col: tick.pos?.col ?? 0,
    note: tick.note,
    kind: tick.kind,
    frames,
    heap: heapView,
    output: interp.outputText,
  };
}

// ------------------------------------------------------------------- errors

function toCompileError(e: unknown): CompileError {
  if (e instanceof ParseError || e instanceof LexError) {
    return {
      message: e.message,
      line: e.line,
      col: e.col,
      hint: (e as ParseError).hint,
      phase: 'parse',
    };
  }
  if (e instanceof RuntimeError) {
    return {
      message: e.message,
      line: e.pos?.line ?? 0,
      col: e.pos?.col ?? 0,
      hint: e.hint,
      phase: 'runtime',
    };
  }
  if (e instanceof CsThrow) {
    return {
      message: `Unhandled ${e.csType}: ${e.csMessage}`,
      line: 0,
      col: 0,
      hint: hintForException(e.csType),
      phase: 'runtime',
    };
  }
  if (e instanceof AssertionFailure) {
    return { message: e.message, line: 0, col: 0, phase: 'runtime' };
  }
  return { message: e instanceof Error ? e.message : String(e), line: 0, col: 0, phase: 'runtime' };
}

function hintForException(type: string): string | undefined {
  switch (type) {
    case 'NullReferenceException':
      return 'Something was never given a value. Check that every object you use was created with `new`, and that constructors assign every field.';
    case 'IndexOutOfRangeException':
      return 'Array indexes run from 0 to Length-1. A loop that ends at `<= Length` goes one step too far.';
    case 'DivideByZeroException':
      return 'Guard the divisor with an if before dividing.';
    case 'InvalidCastException':
      return 'Use `is` to check the real type before casting, or use `as` which gives null instead of throwing.';
    case 'KeyNotFoundException':
      return 'Call ContainsKey first, or use TryGetValue.';
    default:
      return undefined;
  }
}

// --------------------------------------------------------------- call trace

function recordCall(interp: Interpreter, tick: Tick, calls: CallEvent[], depth: number) {
  const stack = interp.stack;
  if (tick.kind === 'call') {
    const callee = stack[stack.length - 1];
    const caller = stack[stack.length - 2];
    if (!callee) return;
    calls.push({
      from: caller ? actorOf(caller) : 'Program',
      to: actorOf(callee),
      method: callee.label.split('.').slice(1).join('.') || callee.label,
      args: [],
      depth,
      kind: 'call',
      line: tick.pos?.line ?? 0,
    });
  } else if (tick.kind === 'return') {
    const callee = stack[stack.length - 1];
    const caller = stack[stack.length - 2];
    if (!callee) return;
    calls.push({
      from: actorOf(callee),
      to: caller ? actorOf(caller) : 'Program',
      method: callee.label.split('.').slice(1).join('.') || callee.label,
      args: [],
      depth,
      kind: 'return',
      returnValue: tick.note?.includes('returned ') ? tick.note.split('returned ')[1] : undefined,
      line: tick.pos?.line ?? 0,
    });
  }
}

/** The lifeline a frame belongs to: the object if there is one, else the class. */
function actorOf(f: Frame): string {
  if (f.thisRef?.k === 'ref') return `${f.cls?.name ?? 'object'}#${f.thisRef.id}`;
  return f.cls?.name ?? f.label;
}

// ----------------------------------------------------------------- run once

export function runProgram(source: string, opts: RunOptions = {}): RunResult {
  const maxSnapshots = opts.maxSnapshots ?? 1200;
  const snapshots: MemorySnapshot[] = [];
  const calls: CallEvent[] = [];
  let truncated = false;
  let steps = 0;

  let unit: CompilationUnit;
  try {
    unit = parse(source);
  } catch (e) {
    return { ok: false, output: '', error: toCompileError(e), snapshots, calls, truncated, steps };
  }

  const interp = new Interpreter(unit, {
    stdin: opts.stdin,
    student: opts.student,
    stepBudget: opts.stepBudget,
  });

  // Without a UI driving frames, a game loop must not spin forever.
  interp.builtins.splashkit.state.maxFrames = 600;

  try {
    const gen = interp.runMain();
    let r = gen.next();
    while (!r.done) {
      steps++;
      const tick = r.value;
      if (opts.trace) {
        if (snapshots.length < maxSnapshots) snapshots.push(snapshot(interp, tick, steps));
        else truncated = true;
        recordCall(interp, tick, calls, interp.stack.length);
      }
      r = gen.next();
    }
    return {
      ok: true,
      output: interp.outputText,
      snapshots, calls, truncated, steps, unit,
      splashkit: interp.builtins.splashkit.state,
    };
  } catch (e) {
    return {
      ok: false,
      output: interp.outputText,
      error: toCompileError(e),
      snapshots, calls, truncated, steps, unit,
      splashkit: interp.builtins.splashkit.state,
    };
  }
}

// --------------------------------------------------------------- unit tests

export interface TestResult {
  name: string;
  fixture: string;
  passed: boolean;
  message?: string;
  expected?: string;
  actual?: string;
  durationSteps: number;
}

export interface TestRunResult {
  ok: boolean;
  results: TestResult[];
  error?: CompileError;
  output: string;
  passed: number;
  failed: number;
}

/**
 * Discover `[TestFixture]` classes (or any class whose name ends in Test/Tests)
 * and run every `[Test]` method, honouring `[SetUp]` and `[TearDown]`.
 */
export function runTests(source: string, opts: RunOptions = {}): TestRunResult {
  let unit: CompilationUnit;
  try {
    unit = parse(source);
  } catch (e) {
    return { ok: false, results: [], error: toCompileError(e), output: '', passed: 0, failed: 0 };
  }

  const results: TestResult[] = [];
  let output = '';

  const fixtures = unit.types.filter(
    (t) =>
      t.kind === 'class' &&
      (t.members.some((m) => m.attributes?.includes('Test') || m.attributes?.includes('TestCase')) ||
        (t as { modifiers: string[] }).modifiers.includes('public') &&
          /Tests?$/.test(t.name) &&
          t.members.some((m) => m.kind === 'method')),
  );

  for (const fixture of fixtures) {
    if (fixture.kind !== 'class') continue;
    const testMethods = fixture.members.filter(
      (m) => m.kind === 'method' && (m.attributes?.includes('Test') || m.attributes?.includes('TestCase')),
    );
    if (!testMethods.length) continue;

    for (const tm of testMethods) {
      if (tm.kind !== 'method') continue;

      // Every test gets a fresh interpreter so state never leaks between tests.
      const interp = new Interpreter(unit, {
        stdin: opts.stdin,
        student: opts.student,
        stepBudget: opts.stepBudget ?? 2_000_000,
      });
      interp.builtins.splashkit.state.maxFrames = 200;

      let steps = 0;
      const drive = (gen: Generator<Tick, unknown, void>) => {
        let r = gen.next();
        while (!r.done) { steps++; r = gen.next(); }
        return r.value;
      };

      try {
        const cls = interp.classes.get(fixture.name);
        if (!cls) continue;

        const instance = drive(interp.instantiate(cls, [], fixture.pos)) as Value;

        // [SetUp] runs before each test, like real NUnit.
        const setup = fixture.members.find(
          (m) => m.kind === 'method' && m.attributes?.includes('SetUp'),
        );
        if (setup && setup.kind === 'method') {
          const info = interp.findMethods(cls, setup.name).find((m) => m.paramCount === 0);
          if (info) drive(interp.invokeMethod(info, instance, [], cls, setup.pos));
        }

        const info = interp.findMethods(cls, tm.name).find((m) => m.paramCount === 0);
        if (!info) {
          results.push({
            name: tm.name, fixture: fixture.name, passed: false,
            message: 'Test methods must take no parameters.', durationSteps: 0,
          });
          continue;
        }

        drive(interp.invokeMethod(info, instance, [], cls, tm.pos));

        const teardown = fixture.members.find(
          (m) => m.kind === 'method' && m.attributes?.includes('TearDown'),
        );
        if (teardown && teardown.kind === 'method') {
          const tinfo = interp.findMethods(cls, teardown.name).find((m) => m.paramCount === 0);
          if (tinfo) drive(interp.invokeMethod(tinfo, instance, [], cls, teardown.pos));
        }

        results.push({ name: tm.name, fixture: fixture.name, passed: true, durationSteps: steps });
      } catch (e) {
        if (e instanceof AssertionPass) {
          results.push({ name: tm.name, fixture: fixture.name, passed: true, durationSteps: steps });
        } else if (e instanceof AssertionFailure) {
          results.push({
            name: tm.name, fixture: fixture.name, passed: false,
            message: e.message, expected: e.expected, actual: e.actual, durationSteps: steps,
          });
        } else {
          const ce = toCompileError(e);
          results.push({
            name: tm.name, fixture: fixture.name, passed: false,
            message: ce.line ? `${ce.message} (line ${ce.line})` : ce.message,
            durationSteps: steps,
          });
        }
      } finally {
        if (interp.outputText) output += interp.outputText + '\n';
      }
    }
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    ok: results.length > 0 && passed === results.length,
    results,
    output: output.trimEnd(),
    passed,
    failed: results.length - passed,
  };
}

// ------------------------------------------------------- interactive driver

/**
 * Runs a SplashKit program frame by frame so the browser stays responsive and
 * real mouse/keyboard input reaches the student's event loop.
 */
export class InteractiveRun {
  private gen: Generator<Tick, void, void> | null = null;
  private interp: Interpreter | null = null;
  finished = false;
  error?: CompileError;
  output = '';

  constructor(source: string, private opts: RunOptions = {}) {
    try {
      const unit = parse(source);
      this.interp = new Interpreter(unit, {
        stdin: opts.stdin,
        student: opts.student,
        stepBudget: opts.stepBudget ?? 200_000_000,
      });
      this.gen = this.interp.runMain();
    } catch (e) {
      this.error = toCompileError(e);
      this.finished = true;
    }
  }

  get splashkit(): SplashKitState | undefined {
    return this.interp?.builtins.splashkit.state;
  }

  /** Advance until the program finishes the next frame, or ends. */
  stepFrame(): void {
    if (!this.gen || this.finished) return;
    try {
      for (;;) {
        const r = this.gen.next();
        if (r.done) {
          this.finished = true;
          this.output = this.interp!.outputText;
          return;
        }
        if (r.value.kind === 'frame') {
          this.output = this.interp!.outputText;
          return;
        }
      }
    } catch (e) {
      this.error = toCompileError(e);
      this.output = this.interp?.outputText ?? '';
      this.finished = true;
    }
  }

  requestClose() {
    const s = this.splashkit;
    if (s) s.closeRequested = true;
  }
}
