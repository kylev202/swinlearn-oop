/**
 * The slice of the .NET Base Class Library that COS20007 weeks 1-12 actually
 * touch, plus an NUnit shim so `[Test]` / `Assert.That` run for real.
 *
 * Scope is deliberate, not lazy: Week 2's lecture makes the point that you
 * should reuse framework classes rather than reinvent them, so List<T>,
 * Dictionary<K,V> and the string methods have to behave like the real thing.
 */

import type { Pos, TypeRef } from './ast';
import {
  Heap, mkBool, mkChar, mkDouble, mkFloat, mkInt, mkLong, NULL, toDisplayString, typeNameOf,
  valuesEqual, VOID, type HeapObject, type Value,
} from './values';
import type { Tick } from './interpreter';
import { installSplashKit, type SplashKitRuntime } from './splashkit';

/** Thrown by a failing NUnit assertion; caught by the test runner. */
export class AssertionFailure extends Error {
  constructor(message: string, public expected?: string, public actual?: string) {
    super(message);
    this.name = 'AssertionFailure';
  }
}

/** Thrown by Assert.Pass(). */
export class AssertionPass extends Error {
  constructor(message: string) { super(message); this.name = 'AssertionPass'; }
}

/** What builtins need from the interpreter, without importing it. */
export interface BuiltinHost {
  heap: Heap;
  student: { firstName: string; studentId: string };
  write(s: string): void;
  writeLine(s: string): void;
  readLine(): string | null;
  display(v: Value): string;
  formatValue(v: Value, format?: string): string;
  stringOf(v: Value): string | undefined;
  isString(v: Value): boolean;
  isOfType(v: Value, typeName: string): boolean;
  asInt(v: Value, pos: Pos): number;
  mkException(type: string, message: string, pos?: Pos): Error;
  applyBinary(op: string, l: Value, r: Value, pos: Pos): Value;
}

export type BGen = Generator<Tick, Value | undefined, void>;

export interface BuiltinRegistry {
  readStatic(type: string, member: string): Value | undefined;
  writeStatic(type: string, member: string, v: Value): boolean;
  callStatic(type: string, member: string, args: Value[], pos: Pos): BGen;
  readInstance(obj: HeapObject, name: string, ref: Value): Value | undefined;
  writeInstance(obj: HeapObject, name: string, v: Value, ref: Value): boolean;
  callInstance(recv: Value, name: string, args: Value[], pos: Pos): BGen;
  readValueMember(v: Value, name: string): Value | undefined;
  construct(type: TypeRef, args: Value[], pos: Pos): BGen;
  initializerAdd(target: Value, v: Value, pos: Pos): void;
  defaultFor(type: TypeRef): Value | undefined;
  statics: Set<string>;
  splashkit: SplashKitRuntime;
}

export function installBuiltins(host: BuiltinHost): BuiltinRegistry {
  const heap = host.heap;
  const S = (s: string) => heap.newString(s);
  const str = (v: Value, pos: Pos): string => {
    const s = host.stringOf(v);
    if (s === undefined) return host.display(v);
    return s;
  };
  const num = (v: Value, pos: Pos): number => {
    if (v.k === 'int' || v.k === 'long' || v.k === 'float' || v.k === 'double') return v.v;
    if (v.k === 'char') return v.v.charCodeAt(0);
    if (v.k === 'enum') return v.v;
    throw host.mkException('ArgumentException', `Expected a number but got a ${typeNameOf(v, heap)}.`, pos);
  };

  const splashkit = installSplashKit(host);

  // A deterministic RNG so a student's run is reproducible when they retry.
  let seed = 0x2545f491;
  const nextRandom = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return ((seed >>> 0) % 1_000_000) / 1_000_000;
  };

  const statics = new Set([
    'Console', 'Math', 'Convert', 'String', 'string', 'int', 'double', 'float', 'long', 'bool', 'char',
    'Int32', 'Double', 'Boolean', 'Assert', 'ClassicAssert', 'Is', 'Has', 'Guid', 'Environment',
    ...splashkit.staticTypes,
  ]);

  // ------------------------------------------------------------ NUnit shim

  /** Constraints are heap structs so `Is.EqualTo(5)` can travel as a value. */
  const constraint = (kind: string, arg?: Value, negated = false): Value =>
    heap.allocRef({
      k: 'struct', type: 'Constraint',
      fields: new Map<string, Value>([
        ['kind', S(kind)],
        ['negated', mkBool(negated)],
        ...(arg ? ([['arg', arg]] as [string, Value][]) : []),
      ]),
    });

  const readConstraint = (v: Value) => {
    if (v.k !== 'ref') return undefined;
    const o = heap.tryGet(v.id);
    if (o?.k !== 'struct' || o.type !== 'Constraint') return undefined;
    const kindV = o.fields.get('kind')!;
    const negV = o.fields.get('negated');
    return {
      kind: host.stringOf(kindV)!,
      negated: negV?.k === 'bool' ? negV.v : false,
      arg: o.fields.get('arg'),
    };
  };

  function describe(v: Value): string {
    if (v.k === 'null') return 'null';
    if (host.isString(v)) return JSON.stringify(host.stringOf(v));
    if (v.k === 'bool') return v.v ? 'True' : 'False';
    return host.display(v);
  }

  function checkConstraint(actual: Value, c: { kind: string; negated: boolean; arg?: Value }, pos: Pos): { ok: boolean; expected: string } {
    let ok: boolean;
    let expected: string;
    switch (c.kind) {
      case 'True': ok = actual.k === 'bool' && actual.v === true; expected = 'True'; break;
      case 'False': ok = actual.k === 'bool' && actual.v === false; expected = 'False'; break;
      case 'Null': ok = actual.k === 'null'; expected = 'null'; break;
      case 'Empty': {
        const s = host.stringOf(actual);
        if (s !== undefined) { ok = s.length === 0; }
        else { const n = collectionLength(actual); ok = n === 0; }
        expected = 'empty';
        break;
      }
      case 'EqualTo':
        ok = valuesEqual(actual, c.arg!, heap) || host.display(actual) === host.display(c.arg!);
        expected = describe(c.arg!);
        break;
      case 'SameAs':
        ok = actual.k === 'ref' && c.arg!.k === 'ref' && actual.id === c.arg!.id;
        expected = `the same object as ${describe(c.arg!)}`;
        break;
      case 'GreaterThan': ok = num(actual, pos) > num(c.arg!, pos); expected = `greater than ${describe(c.arg!)}`; break;
      case 'GreaterThanOrEqualTo': ok = num(actual, pos) >= num(c.arg!, pos); expected = `at least ${describe(c.arg!)}`; break;
      case 'LessThan': ok = num(actual, pos) < num(c.arg!, pos); expected = `less than ${describe(c.arg!)}`; break;
      case 'LessThanOrEqualTo': ok = num(actual, pos) <= num(c.arg!, pos); expected = `at most ${describe(c.arg!)}`; break;
      case 'InstanceOf': {
        const t = host.stringOf(c.arg!) ?? '';
        ok = host.isOfType(actual, t);
        expected = `an instance of ${t}`;
        break;
      }
      case 'Contains': {
        const s = host.stringOf(actual);
        if (s !== undefined) ok = s.includes(host.stringOf(c.arg!) ?? host.display(c.arg!));
        else ok = collectionElements(actual).some((e) => valuesEqual(e, c.arg!, heap));
        expected = `something containing ${describe(c.arg!)}`;
        break;
      }
      default:
        ok = false;
        expected = c.kind;
    }
    if (c.negated) { ok = !ok; expected = `not ${expected}`; }
    return { ok, expected };
  }

  function collectionElements(v: Value): Value[] {
    if (v.k !== 'ref') return [];
    const o = heap.tryGet(v.id);
    if (o?.k === 'list' || o?.k === 'array') return o.elements;
    if (o?.k === 'dict') return o.entries.map((e) => e.value);
    return [];
  }

  function collectionLength(v: Value): number {
    if (v.k !== 'ref') return -1;
    const o = heap.tryGet(v.id);
    if (o?.k === 'list' || o?.k === 'array') return o.elements.length;
    if (o?.k === 'dict') return o.entries.length;
    if (o?.k === 'string') return o.value.length;
    return -1;
  }

  function failAssert(message: string, expected: string, actual: string, custom?: Value): never {
    const extra = custom ? host.display(custom) : '';
    throw new AssertionFailure(extra ? `${extra}\n${message}` : message, expected, actual);
  }

  // ------------------------------------------------------------- statics

  function readStatic(type: string, member: string): Value | undefined {
    switch (type) {
      case 'Math':
        if (member === 'PI') return mkDouble(Math.PI);
        if (member === 'E') return mkDouble(Math.E);
        break;
      case 'int':
      case 'Int32':
        if (member === 'MaxValue') return mkInt(2147483647);
        if (member === 'MinValue') return mkInt(-2147483648);
        break;
      case 'long':
        if (member === 'MaxValue') return mkLong(9223372036854775807);
        if (member === 'MinValue') return mkLong(-9223372036854775808);
        break;
      case 'double':
      case 'Double':
        if (member === 'MaxValue') return mkDouble(Number.MAX_VALUE);
        if (member === 'MinValue') return mkDouble(-Number.MAX_VALUE);
        if (member === 'NaN') return mkDouble(NaN);
        if (member === 'PositiveInfinity') return mkDouble(Infinity);
        if (member === 'NegativeInfinity') return mkDouble(-Infinity);
        break;
      case 'float':
        if (member === 'MaxValue') return mkFloat(3.4028235e38);
        if (member === 'MinValue') return mkFloat(-3.4028235e38);
        break;
      case 'string':
      case 'String':
        if (member === 'Empty') return S('');
        break;
      case 'Environment':
        if (member === 'NewLine') return S('\n');
        break;
      case 'Is': {
        // `Is.True` etc. are properties; `Is.EqualTo(x)` is handled as a call.
        const simple: Record<string, string> = {
          True: 'True', False: 'False', Null: 'Null', Empty: 'Empty',
        };
        if (simple[member]) return constraint(simple[member]);
        if (member === 'Not') return heap.allocRef({ k: 'struct', type: '<Is.Not>', fields: new Map() });
        break;
      }
    }
    return splashkit.readStatic(type, member);
  }

  function writeStatic(type: string, member: string, v: Value): boolean {
    return splashkit.writeStatic(type, member, v);
  }

  function* callStatic(type: string, member: string, args: Value[], pos: Pos): BGen {
    switch (type) {
      case 'Console':
        return consoleCall(member, args, pos);
      case 'Math':
        return mathCall(member, args, pos);
      case 'Convert':
        return convertCall(member, args, pos);
      case 'int':
      case 'Int32':
        if (member === 'Parse') return parseIntOrThrow(str(args[0], pos), pos);
        if (member === 'TryParse') return mkBool(/^\s*[-+]?\d+\s*$/.test(str(args[0], pos)));
        break;
      case 'double':
      case 'Double':
        if (member === 'Parse') {
          const n = Number(str(args[0], pos).trim());
          if (Number.isNaN(n)) {
            throw host.mkException('FormatException', `The string '${str(args[0], pos)}' is not a valid number.`, pos);
          }
          return mkDouble(n);
        }
        break;
      case 'float':
        if (member === 'Parse') return mkFloat(Number(str(args[0], pos).trim()));
        break;
      case 'bool':
      case 'Boolean':
        if (member === 'Parse') return mkBool(str(args[0], pos).trim().toLowerCase() === 'true');
        break;
      case 'string':
      case 'String':
        if (member === 'Join') {
          const sep = str(args[0], pos);
          const items = collectionElements(args[1]).map((e) => host.display(e));
          return S(items.join(sep));
        }
        if (member === 'IsNullOrEmpty') {
          const s = host.stringOf(args[0]);
          return mkBool(args[0].k === 'null' || s === '');
        }
        if (member === 'IsNullOrWhiteSpace') {
          const s = host.stringOf(args[0]);
          return mkBool(args[0].k === 'null' || (s ?? '').trim() === '');
        }
        if (member === 'Format') {
          return S(formatComposite(str(args[0], pos), args.slice(1)));
        }
        if (member === 'Concat') return S(args.map((a) => host.display(a)).join(''));
        break;
      case 'Assert':
      case 'ClassicAssert':
        return assertCall(member, args, pos);
      case 'Is':
        return isCall(member, args, pos);
    }
    return yield* splashkit.callStatic(type, member, args, pos);
  }

  function parseIntOrThrow(s: string, pos: Pos): Value {
    const t = s.trim();
    if (!/^[-+]?\d+$/.test(t)) {
      throw host.mkException(
        'FormatException',
        `The string '${s}' is not a whole number, so int.Parse could not convert it.`,
        pos,
      );
    }
    return mkInt(parseInt(t, 10));
  }

  function consoleCall(member: string, args: Value[], pos: Pos): Value {
    switch (member) {
      case 'WriteLine':
        if (args.length === 0) { host.writeLine(''); return VOID; }
        host.writeLine(compose(args, pos));
        return VOID;
      case 'Write':
        host.write(compose(args, pos));
        return VOID;
      case 'ReadLine': {
        const line = host.readLine();
        return line === null ? NULL : S(line);
      }
      case 'Read': {
        const line = host.readLine();
        return mkInt(line && line.length ? line.charCodeAt(0) : -1);
      }
      case 'ReadKey':
        return VOID;
      case 'Clear':
        return VOID;
      default:
        return VOID;
    }
  }

  /**
   * Console.WriteLine("{0} is {1}", a, b) — the composite format the Lab 2.1
   * pseudocode asks for, which trips students up when they mix it with `+`.
   */
  function compose(args: Value[], pos: Pos): string {
    if (args.length === 0) return '';
    const first = host.stringOf(args[0]);
    if (args.length > 1 && first !== undefined && /\{\d+/.test(first)) {
      return formatComposite(first, args.slice(1));
    }
    return args.map((a) => host.display(a)).join('');
  }

  function formatComposite(fmt: string, args: Value[]): string {
    return fmt.replace(/\{(\d+)(?::([^}]*))?\}/g, (whole, idx, spec) => {
      const i = parseInt(idx, 10);
      if (i >= args.length) return whole;
      return host.formatValue(args[i], spec);
    });
  }

  function mathCall(member: string, args: Value[], pos: Pos): Value {
    const a = args.length ? num(args[0], pos) : 0;
    const b = args.length > 1 ? num(args[1], pos) : 0;
    const isIntArgs = args.every((x) => x.k === 'int' || x.k === 'long');
    switch (member) {
      case 'Abs': return isIntArgs ? mkInt(Math.abs(a)) : mkDouble(Math.abs(a));
      case 'Max': return isIntArgs ? mkInt(Math.max(a, b)) : mkDouble(Math.max(a, b));
      case 'Min': return isIntArgs ? mkInt(Math.min(a, b)) : mkDouble(Math.min(a, b));
      case 'Pow': return mkDouble(Math.pow(a, b));
      case 'Sqrt': return mkDouble(Math.sqrt(a));
      case 'Floor': return mkDouble(Math.floor(a));
      case 'Ceiling': return mkDouble(Math.ceil(a));
      case 'Round': {
        if (args.length > 1) {
          const f = Math.pow(10, b);
          return mkDouble(Math.round(a * f) / f);
        }
        // .NET rounds halves to even; students rarely hit it but it is free to be right.
        const r = Math.round(a);
        return mkDouble(Math.abs(a % 1) === 0.5 && r % 2 !== 0 ? r - Math.sign(a) : r);
      }
      case 'Truncate': return mkDouble(Math.trunc(a));
      case 'Sign': return mkInt(Math.sign(a));
      case 'Sin': return mkDouble(Math.sin(a));
      case 'Cos': return mkDouble(Math.cos(a));
      case 'Tan': return mkDouble(Math.tan(a));
      case 'Log': return mkDouble(args.length > 1 ? Math.log(a) / Math.log(b) : Math.log(a));
      case 'Log10': return mkDouble(Math.log10(a));
      case 'Exp': return mkDouble(Math.exp(a));
      default: return VOID;
    }
  }

  function convertCall(member: string, args: Value[], pos: Pos): Value {
    const v = args[0];
    switch (member) {
      case 'ToInt32': {
        const s = host.stringOf(v);
        if (s !== undefined) return parseIntOrThrow(s, pos);
        if (v.k === 'bool') return mkInt(v.v ? 1 : 0);
        return mkInt(Math.round(num(v, pos)));
      }
      case 'ToDouble': {
        const s = host.stringOf(v);
        if (s !== undefined) return mkDouble(Number(s.trim()));
        return mkDouble(num(v, pos));
      }
      case 'ToString': return S(host.display(v));
      case 'ToBoolean': {
        const s = host.stringOf(v);
        if (s !== undefined) return mkBool(s.trim().toLowerCase() === 'true');
        return mkBool(num(v, pos) !== 0);
      }
      case 'ToChar': return mkChar(String.fromCharCode(num(v, pos)));
      default: return VOID;
    }
  }

  function isCall(member: string, args: Value[], pos: Pos): Value {
    const withArg: Record<string, string> = {
      EqualTo: 'EqualTo', SameAs: 'SameAs', GreaterThan: 'GreaterThan',
      GreaterThanOrEqualTo: 'GreaterThanOrEqualTo', LessThan: 'LessThan',
      LessThanOrEqualTo: 'LessThanOrEqualTo', InstanceOf: 'InstanceOf', Contains: 'Contains',
    };
    if (withArg[member]) return constraint(withArg[member], args[0]);
    return constraint(member, args[0]);
  }

  function assertCall(member: string, args: Value[], pos: Pos): Value {
    switch (member) {
      case 'That': {
        const actual = args[0];
        const c = args.length > 1 ? readConstraint(args[1]) : undefined;
        if (!c) {
          // Assert.That(bool) form
          if (actual.k === 'bool') {
            if (!actual.v) failAssert('Expected the condition to be true, but it was false.', 'True', 'False', args[1]);
            return VOID;
          }
          failAssert('Assert.That needs a condition or a constraint.', 'a constraint', describe(actual));
        }
        const { ok, expected } = checkConstraint(actual, c, pos);
        if (!ok) {
          failAssert(
            `Expected: ${expected}\n  But was: ${describe(actual)}`,
            expected, describe(actual), args[2],
          );
        }
        return VOID;
      }
      case 'AreEqual': {
        const [expected, actual] = args;
        const ok = valuesEqual(expected, actual, heap) || host.display(expected) === host.display(actual);
        if (!ok) {
          failAssert(
            `Expected: ${describe(expected)}\n  But was: ${describe(actual)}`,
            describe(expected), describe(actual), args[2],
          );
        }
        return VOID;
      }
      case 'AreNotEqual': {
        const [notExpected, actual] = args;
        if (valuesEqual(notExpected, actual, heap)) {
          failAssert(`Expected anything except ${describe(notExpected)}, but got it.`, `not ${describe(notExpected)}`, describe(actual), args[2]);
        }
        return VOID;
      }
      case 'AreSame':
        if (!(args[0].k === 'ref' && args[1].k === 'ref' && args[0].id === args[1].id)) {
          failAssert('Expected both to be the same object, but they are different objects.', 'same object', 'different objects', args[2]);
        }
        return VOID;
      case 'AreNotSame':
        if (args[0].k === 'ref' && args[1].k === 'ref' && args[0].id === args[1].id) {
          failAssert('Expected different objects, but both refer to the same one.', 'different objects', 'same object', args[2]);
        }
        return VOID;
      case 'IsTrue':
      case 'True':
        if (!(args[0].k === 'bool' && args[0].v)) {
          failAssert('Expected True, but it was False.', 'True', describe(args[0]), args[1]);
        }
        return VOID;
      case 'IsFalse':
      case 'False':
        if (!(args[0].k === 'bool' && !args[0].v)) {
          failAssert('Expected False, but it was True.', 'False', describe(args[0]), args[1]);
        }
        return VOID;
      case 'IsNull':
      case 'Null':
        if (args[0].k !== 'null') failAssert('Expected null.', 'null', describe(args[0]), args[1]);
        return VOID;
      case 'IsNotNull':
      case 'NotNull':
        if (args[0].k === 'null') failAssert('Expected something that is not null, but it was null.', 'not null', 'null', args[1]);
        return VOID;
      case 'IsEmpty':
        if (collectionLength(args[0]) !== 0) failAssert('Expected an empty collection.', 'empty', describe(args[0]), args[1]);
        return VOID;
      case 'IsNotEmpty':
        if (collectionLength(args[0]) === 0) failAssert('Expected a non-empty collection.', 'not empty', 'empty', args[1]);
        return VOID;
      case 'IsInstanceOf': {
        const t = host.stringOf(args[0]) ?? '';
        if (!host.isOfType(args[1] ?? args[0], t)) {
          failAssert(`Expected an instance of ${t}.`, t, typeNameOf(args[1] ?? args[0], heap));
        }
        return VOID;
      }
      case 'Fail':
        throw new AssertionFailure(args.length ? host.display(args[0]) : 'Assert.Fail() was called.');
      case 'Pass':
        throw new AssertionPass(args.length ? host.display(args[0]) : 'Assert.Pass()');
      case 'Greater':
        if (!(num(args[0], pos) > num(args[1], pos))) {
          failAssert(`Expected ${describe(args[0])} to be greater than ${describe(args[1])}.`, `> ${describe(args[1])}`, describe(args[0]));
        }
        return VOID;
      case 'Less':
        if (!(num(args[0], pos) < num(args[1], pos))) {
          failAssert(`Expected ${describe(args[0])} to be less than ${describe(args[1])}.`, `< ${describe(args[1])}`, describe(args[0]));
        }
        return VOID;
      default:
        return VOID;
    }
  }

  // ------------------------------------------------------------- instances

  function readInstance(obj: HeapObject, name: string, ref: Value): Value | undefined {
    switch (obj.k) {
      case 'string':
        if (name === 'Length') return mkInt(obj.value.length);
        break;
      case 'array':
        if (name === 'Length') return mkInt(obj.elements.length);
        if (name === 'Rank') return mkInt(1);
        break;
      case 'list':
        if (name === 'Count') return mkInt(obj.elements.length);
        if (name === 'Capacity') return mkInt(Math.max(4, obj.elements.length));
        break;
      case 'dict':
        if (name === 'Count') return mkInt(obj.entries.length);
        if (name === 'Keys') return heap.allocRef({ k: 'list', elementType: obj.keyType, elements: obj.entries.map((e) => e.key) });
        if (name === 'Values') return heap.allocRef({ k: 'list', elementType: obj.valueType, elements: obj.entries.map((e) => e.value) });
        break;
      case 'exception':
        if (name === 'Message') return S(obj.message);
        if (name === 'StackTrace') return S('');
        break;
      case 'struct': {
        const f = obj.fields.get(name);
        if (f !== undefined) return f;
        return splashkit.readStructMember(obj, name, ref);
      }
    }
    return undefined;
  }

  function writeInstance(obj: HeapObject, name: string, v: Value, ref: Value): boolean {
    if (obj.k === 'struct') {
      if (splashkit.writeStructMember(obj, name, v, ref)) return true;
      if (obj.fields.has(name)) { obj.fields.set(name, v); return true; }
    }
    return false;
  }

  function* callInstance(recv: Value, name: string, args: Value[], pos: Pos): BGen {
    if (recv.k === 'enum') {
      if (name === 'ToString') return S(recv.name);
      if (name === 'CompareTo') return mkInt(Math.sign(recv.v - num(args[0], pos)));
      if (name === 'Equals') return mkBool(valuesEqual(recv, args[0], heap));
      return undefined;
    }
    if (recv.k !== 'ref') {
      // Value-type members: (5).ToString(), 'a'.ToString()
      if (name === 'ToString') return S(host.formatValue(recv, args.length ? host.stringOf(args[0]) : undefined));
      if (name === 'Equals') return mkBool(valuesEqual(recv, args[0], heap));
      if (name === 'CompareTo') return mkInt(Math.sign(num(recv, pos) - num(args[0], pos)));
      if (name === 'GetType') return S(typeNameOf(recv, heap));
      return undefined;
    }

    const obj = heap.get(recv.id);
    switch (obj.k) {
      case 'string': return stringCall(obj.value, name, args, pos);
      case 'list': return listCall(obj, name, args, pos, recv);
      case 'dict': return dictCall(obj, name, args, pos);
      case 'array': return arrayCall(obj, name, args, pos);
      case 'exception':
        if (name === 'ToString') return S(`${obj.type}: ${obj.message}`);
        return undefined;
      case 'struct':
        return yield* splashkit.callStructMethod(obj, name, args, pos, recv);
      default:
        return undefined;
    }
  }

  function stringCall(s: string, name: string, args: Value[], pos: Pos): Value | undefined {
    const a0 = () => args[0];
    switch (name) {
      case 'ToUpper': return S(s.toUpperCase());
      case 'ToLower': return S(s.toLowerCase());
      case 'Trim': return S(s.trim());
      case 'TrimStart': return S(s.replace(/^\s+/, ''));
      case 'TrimEnd': return S(s.replace(/\s+$/, ''));
      case 'Substring': {
        const start = host.asInt(a0(), pos);
        if (start < 0 || start > s.length) {
          throw host.mkException('ArgumentOutOfRangeException', `Substring start ${start} is outside a string of length ${s.length}.`, pos);
        }
        const len = args.length > 1 ? host.asInt(args[1], pos) : undefined;
        if (len !== undefined && start + len > s.length) {
          throw host.mkException('ArgumentOutOfRangeException', `Substring(${start}, ${len}) runs past the end of a string of length ${s.length}.`, pos);
        }
        return S(len === undefined ? s.slice(start) : s.substr(start, len));
      }
      case 'IndexOf': {
        const needle = host.stringOf(a0()) ?? host.display(a0());
        return mkInt(s.indexOf(needle));
      }
      case 'LastIndexOf': {
        const needle = host.stringOf(a0()) ?? host.display(a0());
        return mkInt(s.lastIndexOf(needle));
      }
      case 'Contains': return mkBool(s.includes(host.stringOf(a0()) ?? host.display(a0())));
      case 'StartsWith': return mkBool(s.startsWith(host.stringOf(a0()) ?? ''));
      case 'EndsWith': return mkBool(s.endsWith(host.stringOf(a0()) ?? ''));
      case 'Replace': return S(s.split(host.stringOf(a0()) ?? host.display(a0())).join(host.stringOf(args[1]) ?? host.display(args[1])));
      case 'Split': {
        const sep = host.stringOf(a0()) ?? host.display(a0());
        const parts = s.split(sep);
        return heap.allocRef({ k: 'array', elementType: 'string', elements: parts.map(S) });
      }
      case 'ToString': return S(s);
      case 'Equals': return mkBool(host.stringOf(a0()) === s);
      case 'ToCharArray':
        return heap.allocRef({ k: 'array', elementType: 'char', elements: [...s].map(mkChar) });
      case 'PadLeft': return S(s.padStart(host.asInt(a0(), pos), args[1]?.k === 'char' ? args[1].v : ' '));
      case 'PadRight': return S(s.padEnd(host.asInt(a0(), pos), args[1]?.k === 'char' ? args[1].v : ' '));
      case 'Insert': return S(s.slice(0, host.asInt(a0(), pos)) + (host.stringOf(args[1]) ?? '') + s.slice(host.asInt(a0(), pos)));
      case 'Remove': {
        const start = host.asInt(a0(), pos);
        const len = args.length > 1 ? host.asInt(args[1], pos) : s.length - start;
        return S(s.slice(0, start) + s.slice(start + len));
      }
      case 'CompareTo': return mkInt(Math.sign(s.localeCompare(host.stringOf(a0()) ?? '')));
      case 'GetType': return S('string');
      default: return undefined;
    }
  }

  function listCall(obj: Extract<HeapObject, { k: 'list' }>, name: string, args: Value[], pos: Pos, recv: Value): Value | undefined {
    switch (name) {
      case 'Add': obj.elements.push(args[0]); return VOID;
      case 'AddRange': obj.elements.push(...collectionElements(args[0])); return VOID;
      case 'Insert': {
        const i = host.asInt(args[0], pos);
        if (i < 0 || i > obj.elements.length) {
          throw host.mkException('ArgumentOutOfRangeException', `Insert index ${i} is outside a list of ${obj.elements.length}.`, pos);
        }
        obj.elements.splice(i, 0, args[1]);
        return VOID;
      }
      case 'Remove': {
        const i = obj.elements.findIndex((e) => valuesEqual(e, args[0], heap));
        if (i >= 0) obj.elements.splice(i, 1);
        return mkBool(i >= 0);
      }
      case 'RemoveAt': {
        const i = host.asInt(args[0], pos);
        if (i < 0 || i >= obj.elements.length) {
          throw host.mkException('ArgumentOutOfRangeException', `RemoveAt index ${i} is outside a list of ${obj.elements.length}.`, pos);
        }
        obj.elements.splice(i, 1);
        return VOID;
      }
      case 'Contains': return mkBool(obj.elements.some((e) => valuesEqual(e, args[0], heap)));
      case 'IndexOf': return mkInt(obj.elements.findIndex((e) => valuesEqual(e, args[0], heap)));
      case 'Clear': obj.elements.length = 0; return VOID;
      case 'Reverse': obj.elements.reverse(); return VOID;
      case 'Sort':
        obj.elements.sort((a, b) => {
          const sa = host.stringOf(a), sb = host.stringOf(b);
          if (sa !== undefined && sb !== undefined) return sa.localeCompare(sb);
          return num(a, pos) - num(b, pos);
        });
        return VOID;
      case 'ToArray':
        return heap.allocRef({ k: 'array', elementType: obj.elementType, elements: [...obj.elements] });
      case 'ToList':
        return heap.allocRef({ k: 'list', elementType: obj.elementType, elements: [...obj.elements] });
      case 'GetType': return S(`List<${obj.elementType}>`);
      case 'Count': return mkInt(obj.elements.length);
      default: return undefined;
    }
  }

  function dictCall(obj: Extract<HeapObject, { k: 'dict' }>, name: string, args: Value[], pos: Pos): Value | undefined {
    const find = (k: Value) => obj.entries.findIndex((e) => valuesEqual(e.key, k, heap));
    switch (name) {
      case 'Add': {
        if (find(args[0]) >= 0) {
          throw host.mkException(
            'ArgumentException',
            `An item with the key '${host.display(args[0])}' has already been added.`,
            pos,
          );
        }
        obj.entries.push({ key: args[0], value: args[1] });
        return VOID;
      }
      case 'ContainsKey': return mkBool(find(args[0]) >= 0);
      case 'ContainsValue': return mkBool(obj.entries.some((e) => valuesEqual(e.value, args[0], heap)));
      case 'Remove': {
        const i = find(args[0]);
        if (i >= 0) obj.entries.splice(i, 1);
        return mkBool(i >= 0);
      }
      case 'Clear': obj.entries.length = 0; return VOID;
      case 'TryGetValue': {
        const i = find(args[0]);
        return mkBool(i >= 0);
      }
      case 'GetType': return S(`Dictionary<${obj.keyType}, ${obj.valueType}>`);
      default: return undefined;
    }
  }

  function arrayCall(obj: Extract<HeapObject, { k: 'array' }>, name: string, args: Value[], pos: Pos): Value | undefined {
    switch (name) {
      case 'GetLength': return mkInt(obj.elements.length);
      case 'ToString': return S(`${obj.elementType}[]`);
      case 'Contains': return mkBool(obj.elements.some((e) => valuesEqual(e, args[0], heap)));
      case 'GetType': return S(`${obj.elementType}[]`);
      default: return undefined;
    }
  }

  function readValueMember(v: Value, name: string): Value | undefined {
    if (v.k === 'enum' && name === 'Value') return mkInt(v.v);
    return undefined;
  }

  // ---------------------------------------------------------- construction

  function* construct(type: TypeRef, args: Value[], pos: Pos): BGen {
    const name = type.name;

    if (name === 'List') {
      const elementType = type.args[0] ? type.args[0].name : 'object';
      const seed = args.length && args[0].k === 'ref' ? collectionElements(args[0]) : [];
      return heap.allocRef({ k: 'list', elementType, elements: [...seed] });
    }
    if (name === 'Dictionary') {
      return heap.allocRef({
        k: 'dict',
        keyType: type.args[0]?.name ?? 'object',
        valueType: type.args[1]?.name ?? 'object',
        entries: [],
      });
    }
    if (name === 'Random') {
      return heap.allocRef({ k: 'struct', type: 'Random', fields: new Map() });
    }
    if (name === 'StringBuilder') {
      return heap.allocRef({ k: 'struct', type: 'StringBuilder', fields: new Map([['value', S('')]]) });
    }
    if (EXCEPTION_TYPES.has(name)) {
      const message = args.length ? (host.stringOf(args[0]) ?? host.display(args[0])) : defaultExceptionMessage(name);
      return heap.allocRef({ k: 'exception', type: name, message });
    }

    return yield* splashkit.construct(type, args, pos);
  }

  function initializerAdd(target: Value, v: Value, pos: Pos): void {
    if (target.k !== 'ref') return;
    const o = heap.tryGet(target.id);
    if (o?.k === 'list' || o?.k === 'array') o.elements.push(v);
  }

  function defaultFor(type: TypeRef): Value | undefined {
    return splashkit.defaultFor(type);
  }

  return {
    readStatic, writeStatic, callStatic,
    readInstance, writeInstance, callInstance, readValueMember,
    construct, initializerAdd, defaultFor,
    statics, splashkit,
  };
}

const EXCEPTION_TYPES = new Set([
  'Exception', 'ArgumentException', 'ArgumentNullException', 'ArgumentOutOfRangeException',
  'InvalidOperationException', 'NotImplementedException', 'NotSupportedException',
  'IndexOutOfRangeException', 'NullReferenceException', 'FormatException',
  'DivideByZeroException', 'KeyNotFoundException', 'OverflowException', 'InvalidCastException',
]);

function defaultExceptionMessage(name: string): string {
  switch (name) {
    case 'NotImplementedException': return 'The method or operation is not implemented.';
    case 'InvalidOperationException': return 'Operation is not valid due to the current state of the object.';
    case 'ArgumentNullException': return 'Value cannot be null.';
    default: return `Exception of type '${name}' was thrown.`;
  }
}
