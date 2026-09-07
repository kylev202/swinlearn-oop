/**
 * Runtime value + heap model.
 *
 * The split between stack-allocated value types and heap-allocated reference
 * types is modelled honestly rather than conveniently, because Week 3 assesses
 * exactly that distinction (Quiz 3 Q3, Q7, Q8, Q12). So:
 *
 *   - int / long / float / double / bool / char  -> Value carried inline (stack)
 *   - class instances, arrays, strings, List, Dictionary -> heap, referenced by id
 *
 * That means `string s = "hi"` really does put a reference on the stack and the
 * characters on the heap, and the visualiser can show it.
 */

import type { ClassDecl, InterfaceDecl, EnumDecl, MethodDecl, PropertyDecl, FieldDecl, CtorDecl } from './ast';

export type NumericKind = 'int' | 'long' | 'float' | 'double';

export type Value =
  | { k: 'int'; v: number }
  | { k: 'long'; v: number }
  | { k: 'float'; v: number }
  | { k: 'double'; v: number }
  | { k: 'bool'; v: boolean }
  | { k: 'char'; v: string }
  | { k: 'enum'; type: string; name: string; v: number }
  | { k: 'null' }
  | { k: 'void' }
  | { k: 'ref'; id: number };

export const VOID: Value = { k: 'void' };
export const NULL: Value = { k: 'null' };

export const mkInt = (v: number): Value => ({ k: 'int', v: v | 0 });
export const mkLong = (v: number): Value => ({ k: 'long', v: Math.trunc(v) });
export const mkFloat = (v: number): Value => ({ k: 'float', v: Math.fround(v) });
export const mkDouble = (v: number): Value => ({ k: 'double', v });
export const mkBool = (v: boolean): Value => ({ k: 'bool', v });
export const mkChar = (v: string): Value => ({ k: 'char', v });

export function isNumeric(v: Value): v is Extract<Value, { k: NumericKind }> {
  return v.k === 'int' || v.k === 'long' || v.k === 'float' || v.k === 'double';
}

export function isTruthy(v: Value): boolean {
  if (v.k === 'bool') return v.v;
  throw new Error('Expected a bool here.');
}

// --------------------------------------------------------------- heap objects

export interface InstanceObj {
  k: 'instance';
  /** Runtime class — drives virtual dispatch and `is` checks. */
  cls: ClassInfo;
  fields: Map<string, Value>;
  /** Auto-property backing stores, keyed by property name. */
  autoProps: Map<string, Value>;
}

export interface ArrayObj {
  k: 'array';
  elementType: string;
  elements: Value[];
}

export interface StringObj {
  k: 'string';
  value: string;
}

export interface ListObj {
  k: 'list';
  elementType: string;
  elements: Value[];
}

export interface DictObj {
  k: 'dict';
  keyType: string;
  valueType: string;
  /** Insertion-ordered, like the .NET Dictionary a student will observe. */
  entries: { key: Value; value: Value }[];
}

export interface FuncObj {
  k: 'func';
  params: string[];
  body: unknown;
  closure: unknown;
}

/** A .NET exception object the student can catch. */
export interface ExceptionObj {
  k: 'exception';
  type: string;
  message: string;
}

/** SplashKit value-ish structs, kept on the heap for simplicity of display. */
export interface StructObj {
  k: 'struct';
  type: string;
  fields: Map<string, Value>;
}

export type HeapObject =
  | InstanceObj | ArrayObj | StringObj | ListObj | DictObj | FuncObj | ExceptionObj | StructObj;

// ---------------------------------------------------------------- class model

export interface FieldInfo {
  name: string;
  decl: FieldDecl;
  isStatic: boolean;
  isReadonly: boolean;
  access: Access;
}

export interface MethodInfo {
  name: string;
  decl: MethodDecl;
  isStatic: boolean;
  isVirtual: boolean;
  isOverride: boolean;
  isAbstract: boolean;
  access: Access;
  paramCount: number;
  owner: ClassInfo;
}

export interface PropertyInfo {
  name: string;
  decl: PropertyDecl;
  isStatic: boolean;
  isVirtual: boolean;
  isOverride: boolean;
  isAbstract: boolean;
  access: Access;
  hasGet: boolean;
  hasSet: boolean;
  isAuto: boolean;
  owner: ClassInfo;
}

export interface CtorInfo {
  decl: CtorDecl;
  paramCount: number;
  access: Access;
}

export type Access = 'public' | 'private' | 'protected' | 'internal';

export interface ClassInfo {
  name: string;
  decl: ClassDecl | InterfaceDecl;
  isInterface: boolean;
  isAbstract: boolean;
  isStatic: boolean;
  base?: ClassInfo;
  interfaces: ClassInfo[];
  fields: Map<string, FieldInfo>;
  /** Overloads share a name, so methods map to a list. */
  methods: Map<string, MethodInfo[]>;
  properties: Map<string, PropertyInfo>;
  ctors: CtorInfo[];
  staticFields: Map<string, Value>;
  staticInitDone: boolean;
}

export interface EnumInfo {
  name: string;
  decl: EnumDecl;
  members: Map<string, number>;
}

/** Does `cls` derive from (or implement) `name`? */
export function isAssignableTo(cls: ClassInfo, name: string): boolean {
  if (name === 'object') return true;
  let c: ClassInfo | undefined = cls;
  while (c) {
    if (c.name === name) return true;
    if (c.interfaces.some((i) => isAssignableTo(i, name))) return true;
    c = c.base;
  }
  return false;
}

/** Walk the inheritance chain from `cls` upward. */
export function* ancestry(cls: ClassInfo): Generator<ClassInfo> {
  let c: ClassInfo | undefined = cls;
  while (c) { yield c; c = c.base; }
}

// ----------------------------------------------------------------------- heap

export class Heap {
  private objects = new Map<number, HeapObject>();
  private nextId = 1;
  /** Interned string literals, so `"a" == "a"` compares equal by reference too. */
  private internTable = new Map<string, number>();

  alloc(obj: HeapObject): number {
    const id = this.nextId++;
    this.objects.set(id, obj);
    return id;
  }

  allocRef(obj: HeapObject): Value {
    return { k: 'ref', id: this.alloc(obj) };
  }

  get(id: number): HeapObject {
    const o = this.objects.get(id);
    if (!o) throw new Error(`Dangling reference to heap object #${id}.`);
    return o;
  }

  tryGet(id: number): HeapObject | undefined { return this.objects.get(id); }

  /** Strings are interned so identical literals share one heap cell. */
  intern(s: string): Value {
    const existing = this.internTable.get(s);
    if (existing !== undefined) return { k: 'ref', id: existing };
    const id = this.alloc({ k: 'string', value: s });
    this.internTable.set(s, id);
    return { k: 'ref', id };
  }

  newString(s: string): Value {
    // Short strings behave like literals for display purposes; interning keeps
    // the heap small and makes `==` on strings behave the way students expect.
    return this.intern(s);
  }

  get size(): number { return this.objects.size; }

  entries(): IterableIterator<[number, HeapObject]> { return this.objects.entries(); }

  /**
   * Ids reachable from a set of roots. Used to grey out garbage in the
   * visualiser, which is how Week 3's garbage-collection slide is taught.
   */
  reachableFrom(roots: Value[]): Set<number> {
    const seen = new Set<number>();
    const stack: Value[] = [...roots];
    while (stack.length) {
      const v = stack.pop()!;
      if (v.k !== 'ref' || seen.has(v.id)) continue;
      seen.add(v.id);
      const o = this.objects.get(v.id);
      if (!o) continue;
      switch (o.k) {
        case 'instance':
          for (const fv of o.fields.values()) stack.push(fv);
          for (const pv of o.autoProps.values()) stack.push(pv);
          break;
        case 'array':
        case 'list':
          for (const ev of o.elements) stack.push(ev);
          break;
        case 'dict':
          for (const e of o.entries) { stack.push(e.key); stack.push(e.value); }
          break;
        case 'struct':
          for (const fv of o.fields.values()) stack.push(fv);
          break;
        default:
          break;
      }
    }
    return seen;
  }
}

// ------------------------------------------------------------------- printing

/** Render a value the way `Console.WriteLine` would. */
export function toDisplayString(v: Value, heap: Heap): string {
  switch (v.k) {
    case 'int':
    case 'long':
      return String(v.v);
    case 'float':
    case 'double':
      return formatReal(v.v);
    case 'bool':
      return v.v ? 'True' : 'False';
    case 'char':
      return v.v;
    case 'enum':
      return v.name;
    case 'null':
      return '';
    case 'void':
      return '';
    case 'ref': {
      const o = heap.tryGet(v.id);
      if (!o) return '';
      switch (o.k) {
        case 'string': return o.value;
        case 'instance': {
          // Honour a user-defined ToString() override if the interpreter set one up.
          return o.cls.name;
        }
        case 'array': return `${o.elementType}[]`;
        case 'list': return `System.Collections.Generic.List\`1[${o.elementType}]`;
        case 'dict': return `System.Collections.Generic.Dictionary\`2[${o.keyType},${o.valueType}]`;
        case 'exception': return `${o.type}: ${o.message}`;
        case 'struct': return structToString(o, heap);
        case 'func': return 'System.Delegate';
      }
    }
  }
}

function structToString(o: StructObj, heap: Heap): string {
  if (o.type === 'Point2D') {
    const x = o.fields.get('X');
    const y = o.fields.get('Y');
    return `Point2D(${x ? toDisplayString(x, heap) : '0'}, ${y ? toDisplayString(y, heap) : '0'})`;
  }
  if (o.type === 'Color') {
    const n = o.fields.get('Name');
    return n ? toDisplayString(n, heap) : 'Color';
  }
  return o.type;
}

/**
 * .NET's default double formatting: shortest round-trippable form, with no
 * trailing ".0" on whole numbers. `2.0 / 1.0` prints "2", not "2.0".
 */
export function formatReal(n: number): string {
  if (Number.isNaN(n)) return 'NaN';
  if (n === Infinity) return '∞';
  if (n === -Infinity) return '-∞';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  return String(n);
}

/** A short, one-line label for a value, used in the memory diagram. */
export function toShortLabel(v: Value, heap: Heap): string {
  switch (v.k) {
    case 'null': return 'null';
    case 'void': return 'void';
    case 'bool': return v.v ? 'true' : 'false';
    case 'char': return `'${v.v}'`;
    case 'enum': return `${v.type}.${v.name}`;
    case 'ref': {
      const o = heap.tryGet(v.id);
      if (!o) return `#${v.id}`;
      if (o.k === 'string') return JSON.stringify(o.value);
      return `#${v.id}`;
    }
    default: return toDisplayString(v, heap);
  }
}

/** The C# type name of a runtime value, for `GetType()` and error messages. */
export function typeNameOf(v: Value, heap: Heap): string {
  switch (v.k) {
    case 'int': return 'int';
    case 'long': return 'long';
    case 'float': return 'float';
    case 'double': return 'double';
    case 'bool': return 'bool';
    case 'char': return 'char';
    case 'enum': return v.type;
    case 'null': return 'null';
    case 'void': return 'void';
    case 'ref': {
      const o = heap.tryGet(v.id);
      if (!o) return 'object';
      switch (o.k) {
        case 'string': return 'string';
        case 'instance': return o.cls.name;
        case 'array': return `${o.elementType}[]`;
        case 'list': return `List<${o.elementType}>`;
        case 'dict': return `Dictionary<${o.keyType}, ${o.valueType}>`;
        case 'exception': return o.type;
        case 'struct': return o.type;
        case 'func': return 'Func';
      }
    }
  }
}

/** Structural equality matching C#'s `==` for the subset. */
export function valuesEqual(a: Value, b: Value, heap: Heap): boolean {
  if (a.k === 'null' && b.k === 'null') return true;
  if (a.k === 'null' || b.k === 'null') return false;

  if (isNumeric(a) && isNumeric(b)) return a.v === b.v;
  if (a.k === 'bool' && b.k === 'bool') return a.v === b.v;
  if (a.k === 'char' && b.k === 'char') return a.v === b.v;
  if (a.k === 'enum' && b.k === 'enum') return a.type === b.type && a.v === b.v;
  if (a.k === 'char' && isNumeric(b)) return a.v.charCodeAt(0) === b.v;
  if (isNumeric(a) && b.k === 'char') return a.v === b.v.charCodeAt(0);

  if (a.k === 'ref' && b.k === 'ref') {
    if (a.id === b.id) return true;
    const oa = heap.tryGet(a.id);
    const ob = heap.tryGet(b.id);
    // string == string compares by value in C#.
    if (oa?.k === 'string' && ob?.k === 'string') return oa.value === ob.value;
    // Struct-ish SplashKit values compare field-wise.
    if (oa?.k === 'struct' && ob?.k === 'struct' && oa.type === ob.type) {
      for (const [key, av] of oa.fields) {
        const bv = ob.fields.get(key);
        if (!bv || !valuesEqual(av, bv, heap)) return false;
      }
      return true;
    }
    return false;
  }
  return false;
}
