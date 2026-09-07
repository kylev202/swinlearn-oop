/**
 * Tree-walking interpreter for the COS20007 C# teaching subset.
 *
 * Every eval/exec function is a generator that yields a Tick before doing work.
 * That single decision buys four things the unit needs:
 *
 *   1. Step-through debugging + time travel (the driver snapshots on each Tick).
 *   2. A live SplashKit game loop (RefreshScreen yields a 'frame' Tick, the
 *      driver resumes it on requestAnimationFrame, so ShapeDrawer is interactive).
 *   3. Infinite-loop protection for free (the driver holds the step budget).
 *   4. Full stack + heap visibility at any moment, for the memory visualiser.
 *
 * Draining the generator in a tight loop gives the fast path for running tests.
 */

import type {
  Block, ClassDecl, CompilationUnit, CtorDecl, EnumDecl, Expr, FieldDecl, InterfaceDecl,
  MethodDecl, Modifier, Param, Pos, PropertyDecl, Stmt, TypeDecl, TypeRef,
} from './ast';
import { typeRefToString } from './parser';
import {
  ancestry, Heap, isAssignableTo, isNumeric, mkBool, mkChar, mkDouble, mkFloat, mkInt, mkLong,
  NULL, toDisplayString, typeNameOf, valuesEqual, VOID,
  type Access, type ClassInfo, type CtorInfo, type EnumInfo, type FieldInfo, type HeapObject,
  type InstanceObj, type MethodInfo, type PropertyInfo, type Value,
} from './values';
import { installBuiltins, type BuiltinHost, type BuiltinRegistry } from './builtins';

// ------------------------------------------------------------------- signals

/** A C# exception travelling up the JS stack. */
export class CsThrow extends Error {
  constructor(public value: Value, public csType: string, public csMessage: string) {
    super(`${csType}: ${csMessage}`);
    this.name = 'CsThrow';
  }
}

/** A hard stop: bad code, budget exhausted, or an unsupported construct. */
export class RuntimeError extends Error {
  constructor(message: string, public pos?: Pos, public hint?: string) {
    super(message);
    this.name = 'RuntimeError';
  }
}

export type Completion =
  | { t: 'normal' }
  | { t: 'return'; v: Value }
  | { t: 'break' }
  | { t: 'continue' };

const NORMAL: Completion = { t: 'normal' };

/** What the interpreter yields between units of work. */
export interface Tick {
  kind: 'stmt' | 'call' | 'return' | 'alloc' | 'frame' | 'assign';
  pos?: Pos;
  /** Plain-English narration of what just happened, shown beside the diagram. */
  note?: string;
  /** For 'alloc': the heap id created. */
  heapId?: number;
}

export type Ticks = Generator<Tick, Completion, void>;
export type ValueGen = Generator<Tick, Value, void>;

// -------------------------------------------------------------- environments

export class Env {
  vars = new Map<string, Value>();
  constructor(public parent: Env | null) {}

  lookup(name: string): { env: Env } | undefined {
    let e: Env | null = this;
    while (e) {
      if (e.vars.has(name)) return { env: e };
      e = e.parent;
    }
    return undefined;
  }

  get(name: string): Value | undefined {
    return this.lookup(name)?.env.vars.get(name);
  }

  set(name: string, v: Value): boolean {
    const found = this.lookup(name);
    if (!found) return false;
    found.env.vars.set(name, v);
    return true;
  }

  declare(name: string, v: Value) { this.vars.set(name, v); }
}

export interface Frame {
  /** Display name, e.g. "Counter.Increment" or "Program.Main". */
  label: string;
  thisRef?: Value;
  /** Class whose code is executing, for `base` and private access. */
  cls?: ClassInfo;
  scopes: Env[];
  pos: Pos;
}

// ------------------------------------------------------------------ options

export interface InterpreterOptions {
  /** Max ticks before we assume a runaway loop. */
  stepBudget?: number;
  /** Console.ReadLine() feeds from here, in order. */
  stdin?: string[];
  /** Personalisation used by generated lab tasks. */
  student?: { firstName: string; studentId: string };
}

// ------------------------------------------------------------- interpreter

export class Interpreter implements BuiltinHost {
  heap = new Heap();
  classes = new Map<string, ClassInfo>();
  enums = new Map<string, EnumInfo>();
  output: string[] = [];
  stack: Frame[] = [];
  globals = new Env(null);
  builtins: BuiltinRegistry;
  stdin: string[];
  stdinIndex = 0;
  student: { firstName: string; studentId: string };

  private budget: number;

  constructor(private unit: CompilationUnit, opts: InterpreterOptions = {}) {
    this.budget = opts.stepBudget ?? 4_000_000;
    this.stdin = opts.stdin ?? [];
    this.student = opts.student ?? { firstName: 'Student', studentId: '00000000' };
    this.builtins = installBuiltins(this);
    this.buildTypeTable();
  }

  // ------------------------------------------------------------ type table

  private buildTypeTable() {
    // Pass 1: create shells so forward references resolve.
    for (const t of this.unit.types) {
      if (t.kind === 'enum') {
        const members = new Map<string, number>();
        for (const v of t.values) members.set(v.name, v.value);
        this.enums.set(t.name, { name: t.name, decl: t, members });
        continue;
      }
      if (this.classes.has(t.name)) {
        throw new RuntimeError(
          `There are two types called '${t.name}'.`,
          t.pos,
          'Each class needs a unique name. Check for a duplicated class block.',
        );
      }
      this.classes.set(t.name, {
        name: t.name,
        decl: t,
        isInterface: t.kind === 'interface',
        isAbstract: t.modifiers.includes('abstract'),
        isStatic: t.modifiers.includes('static'),
        interfaces: [],
        fields: new Map(),
        methods: new Map(),
        properties: new Map(),
        ctors: [],
        staticFields: new Map(),
        staticInitDone: false,
      });
    }

    // Pass 2: link bases and collect members.
    for (const t of this.unit.types) {
      if (t.kind === 'enum') continue;
      const cls = this.classes.get(t.name)!;

      for (const b of t.baseTypes) {
        const target = this.classes.get(b.name);
        if (!target) {
          // Unknown base types are tolerated (e.g. a framework class we shim).
          continue;
        }
        if (target.isInterface) cls.interfaces.push(target);
        else if (!cls.base) cls.base = target;
        else cls.interfaces.push(target);
      }

      for (const m of t.members) this.addMember(cls, m);
    }

    // Pass 3: reject inheritance cycles rather than hanging later.
    for (const cls of this.classes.values()) {
      const seen = new Set<string>();
      let c: ClassInfo | undefined = cls;
      while (c) {
        if (seen.has(c.name)) {
          throw new RuntimeError(
            `Class '${cls.name}' ends up inheriting from itself.`,
            cls.decl.pos,
            'Follow the chain of ": BaseClass" and break the loop.',
          );
        }
        seen.add(c.name);
        c = c.base;
      }
    }
  }

  private addMember(cls: ClassInfo, m: ClassDecl['members'][number]) {
    const access = accessOf(m.modifiers);
    switch (m.kind) {
      case 'field': {
        const isStatic = m.modifiers.includes('static') || m.modifiers.includes('const');
        cls.fields.set(m.name, {
          name: m.name, decl: m, isStatic,
          isReadonly: m.modifiers.includes('readonly') || m.modifiers.includes('const'),
          access,
        });
        break;
      }
      case 'method': {
        const info: MethodInfo = {
          name: m.name, decl: m,
          isStatic: m.modifiers.includes('static'),
          isVirtual: m.modifiers.includes('virtual'),
          isOverride: m.modifiers.includes('override'),
          isAbstract: m.modifiers.includes('abstract') || (!m.body && !m.exprBody),
          access, paramCount: m.params.length, owner: cls,
        };
        const list = cls.methods.get(m.name) ?? [];
        list.push(info);
        cls.methods.set(m.name, list);
        break;
      }
      case 'property': {
        const accessors = m.accessors;
        const hasGet = !!m.exprBody || accessors.some((a) => a.kind === 'get');
        const hasSet = accessors.some((a) => a.kind === 'set');
        const isAuto = !m.exprBody && accessors.length > 0 && accessors.every((a) => a.auto);
        cls.properties.set(m.name, {
          name: m.name, decl: m,
          isStatic: m.modifiers.includes('static'),
          isVirtual: m.modifiers.includes('virtual'),
          isOverride: m.modifiers.includes('override'),
          isAbstract: m.modifiers.includes('abstract') || (accessors.length > 0 && accessors.every((a) => a.auto && !m.exprBody) && cls.isInterface),
          access, hasGet, hasSet, isAuto, owner: cls,
        });
        break;
      }
      case 'ctor':
        cls.ctors.push({ decl: m, paramCount: m.params.length, access });
        break;
    }
  }

  // ------------------------------------------------------------ tick budget

  private tick(): void {
    if (--this.budget <= 0) {
      throw new RuntimeError(
        'Your program ran for too long, so I stopped it.',
        this.currentPos(),
        'This almost always means a loop never reaches its stopping condition. Check that the loop variable actually changes.',
      );
    }
  }

  currentPos(): Pos | undefined {
    return this.stack.length ? this.stack[this.stack.length - 1].pos : undefined;
  }

  private *emit(t: Tick): Generator<Tick, void, void> {
    this.tick();
    if (t.pos && this.stack.length) this.stack[this.stack.length - 1].pos = t.pos;
    yield t;
  }

  // ------------------------------------------------------------- entry points

  /** Run top-level statements, then `Main` if one exists. */
  *runMain(): Generator<Tick, void, void> {
    if (this.unit.topLevel.length) {
      const frame: Frame = { label: '<top-level>', scopes: [new Env(this.globals)], pos: { line: 1, col: 1 } };
      this.stack.push(frame);
      yield* this.execBlockBody(this.unit.topLevel, frame);
      this.stack.pop();
    }

    const entry = this.findEntryPoint();
    if (entry) {
      yield* this.invokeMethod(entry.info, undefined, [], entry.cls, { line: 1, col: 1 });
    } else if (!this.unit.topLevel.length) {
      throw new RuntimeError(
        'I could not find a place to start.',
        undefined,
        'Add a `static void Main()` method to one of your classes, or write plain statements at the top of the file.',
      );
    }
  }

  findEntryPoint(): { cls: ClassInfo; info: MethodInfo } | undefined {
    for (const cls of this.classes.values()) {
      const list = cls.methods.get('Main');
      const info = list?.find((m) => m.isStatic);
      if (info) return { cls, info };
    }
    return undefined;
  }

  /** Drain the generator, ignoring ticks. The fast path for running tests. */
  runToCompletion(gen: Generator<Tick, unknown, void>): void {
    let r = gen.next();
    while (!r.done) r = gen.next();
  }

  // ---------------------------------------------------------------- statements

  *execStmt(s: Stmt, env: Env): Ticks {
    switch (s.kind) {
      case 'block': {
        const frame = this.top();
        const inner = new Env(env);
        frame.scopes.push(inner);
        try {
          return yield* this.execBlockBody(s.body, frame, inner);
        } finally {
          frame.scopes.pop();
        }
      }

      case 'empty':
        return NORMAL;

      case 'localVar': {
        yield* this.emit({ kind: 'stmt', pos: s.pos });
        for (const d of s.decls) {
          let v: Value = this.defaultValueFor(s.type);
          if (d.init) v = this.coerceToType(yield* this.evalExpr(d.init, env), s.type, d.pos);
          if (env.vars.has(d.name)) {
            throw new RuntimeError(
              `The variable '${d.name}' is already declared in this scope.`,
              d.pos,
              'Drop the type name to assign to the existing variable instead of declaring a new one.',
            );
          }
          env.declare(d.name, v);
          yield* this.emit({
            kind: 'assign', pos: d.pos,
            note: `Declared ${typeRefToString(s.type)} ${d.name} = ${this.display(v)}`,
          });
        }
        return NORMAL;
      }

      case 'exprStmt':
        yield* this.emit({ kind: 'stmt', pos: s.pos });
        yield* this.evalExpr(s.expr, env);
        return NORMAL;

      case 'if': {
        yield* this.emit({ kind: 'stmt', pos: s.pos });
        const c = yield* this.evalExpr(s.cond, env);
        if (this.asBool(c, s.cond)) return yield* this.execStmt(s.then, env);
        if (s.else) return yield* this.execStmt(s.else, env);
        return NORMAL;
      }

      case 'while': {
        for (;;) {
          yield* this.emit({ kind: 'stmt', pos: s.pos });
          const c = yield* this.evalExpr(s.cond, env);
          if (!this.asBool(c, s.cond)) break;
          const r = yield* this.execStmt(s.body, env);
          if (r.t === 'break') break;
          if (r.t === 'return') return r;
        }
        return NORMAL;
      }

      case 'doWhile': {
        for (;;) {
          const r = yield* this.execStmt(s.body, env);
          if (r.t === 'break') break;
          if (r.t === 'return') return r;
          yield* this.emit({ kind: 'stmt', pos: s.pos });
          const c = yield* this.evalExpr(s.cond, env);
          if (!this.asBool(c, s.cond)) break;
        }
        return NORMAL;
      }

      case 'for': {
        const frame = this.top();
        const loopEnv = new Env(env);
        frame.scopes.push(loopEnv);
        try {
          if (s.init) yield* this.execStmt(s.init, loopEnv);
          for (;;) {
            yield* this.emit({ kind: 'stmt', pos: s.pos });
            if (s.cond) {
              const c = yield* this.evalExpr(s.cond, loopEnv);
              if (!this.asBool(c, s.cond)) break;
            }
            const r = yield* this.execStmt(s.body, loopEnv);
            if (r.t === 'break') break;
            if (r.t === 'return') return r;
            for (const u of s.update) yield* this.evalExpr(u, loopEnv);
          }
          return NORMAL;
        } finally {
          frame.scopes.pop();
        }
      }

      case 'foreach': {
        yield* this.emit({ kind: 'stmt', pos: s.pos });
        const coll = yield* this.evalExpr(s.iterable, env);
        const items = this.iterableToArray(coll, s.pos);
        const frame = this.top();
        for (const item of items) {
          const iterEnv = new Env(env);
          iterEnv.declare(s.varName, item);
          frame.scopes.push(iterEnv);
          try {
            yield* this.emit({
              kind: 'assign', pos: s.pos,
              note: `foreach: ${s.varName} = ${this.display(item)}`,
            });
            const r = yield* this.execStmt(s.body, iterEnv);
            if (r.t === 'break') break;
            if (r.t === 'return') return r;
          } finally {
            frame.scopes.pop();
          }
        }
        return NORMAL;
      }

      case 'return': {
        yield* this.emit({ kind: 'stmt', pos: s.pos });
        const v = s.value ? yield* this.evalExpr(s.value, env) : VOID;
        return { t: 'return', v };
      }

      case 'break':
        yield* this.emit({ kind: 'stmt', pos: s.pos });
        return { t: 'break' };

      case 'continue':
        yield* this.emit({ kind: 'stmt', pos: s.pos });
        return { t: 'continue' };

      case 'throw': {
        yield* this.emit({ kind: 'stmt', pos: s.pos });
        if (!s.value) throw new RuntimeError('`throw;` with no value is not supported here.', s.pos);
        const v = yield* this.evalExpr(s.value, env);
        throw this.toCsThrow(v, s.pos);
      }

      case 'try': {
        yield* this.emit({ kind: 'stmt', pos: s.pos });
        try {
          const r = yield* this.execStmt(s.block, env);
          return r;
        } catch (e) {
          if (!(e instanceof CsThrow)) throw e;
          for (const c of s.catches) {
            if (c.type && !this.exceptionMatches(e, c.type.name)) continue;
            const frame = this.top();
            const catchEnv = new Env(env);
            if (c.name) catchEnv.declare(c.name, e.value);
            frame.scopes.push(catchEnv);
            try {
              yield* this.emit({
                kind: 'stmt', pos: c.pos,
                note: `Caught ${e.csType}: ${e.csMessage}`,
              });
              return yield* this.execBlockBody(c.body.body, frame, catchEnv);
            } finally {
              frame.scopes.pop();
            }
          }
          throw e;
        } finally {
          if (s.finally) {
            const r = yield* this.execStmt(s.finally, env);
            if (r.t !== 'normal') {
              // A return inside finally overrides — rare, but keep it honest.
            }
          }
        }
      }

      case 'switch': {
        yield* this.emit({ kind: 'stmt', pos: s.pos });
        const subject = yield* this.evalExpr(s.subject, env);
        let start = -1;
        let defaultIndex = -1;
        outer: for (let i = 0; i < s.sections.length; i++) {
          for (const label of s.sections[i].labels) {
            if (label === 'default') { defaultIndex = i; continue; }
            const lv = yield* this.evalExpr(label, env);
            if (valuesEqual(subject, lv, this.heap)) { start = i; break outer; }
          }
        }
        if (start < 0) start = defaultIndex;
        if (start < 0) return NORMAL;
        const frame = this.top();
        for (let i = start; i < s.sections.length; i++) {
          const secEnv = new Env(env);
          frame.scopes.push(secEnv);
          try {
            const r = yield* this.execBlockBody(s.sections[i].body, frame, secEnv);
            if (r.t === 'break') return NORMAL;
            if (r.t === 'return') return r;
          } finally {
            frame.scopes.pop();
          }
        }
        return NORMAL;
      }
    }
  }

  private *execBlockBody(body: Stmt[], frame: Frame, env?: Env): Ticks {
    const e = env ?? frame.scopes[frame.scopes.length - 1];
    for (const st of body) {
      const r = yield* this.execStmt(st, e);
      if (r.t !== 'normal') return r;
    }
    return NORMAL;
  }

  // -------------------------------------------------------------- expressions

  *evalExpr(e: Expr, env: Env): ValueGen {
    switch (e.kind) {
      case 'literal':
        return this.literalValue(e.value, e.literalType);

      case 'interp': {
        let out = '';
        for (const p of e.parts) {
          if (p.kind === 'text') { out += p.text; continue; }
          const v = yield* this.evalExpr(p.expr, env);
          out += this.formatValue(v, p.format);
        }
        return this.heap.newString(out);
      }

      case 'name':
        return yield* this.readName(e.name, env, e.pos);

      case 'this': {
        const t = this.top().thisRef;
        if (!t) {
          throw new RuntimeError(
            "'this' is not available here.",
            e.pos,
            "A static method has no object, so there is no 'this'. Remove 'static', or drop the 'this'.",
          );
        }
        return t;
      }

      case 'base':
        throw new RuntimeError(
          "'base' can only be used as 'base.Something(...)'.",
          e.pos,
        );

      case 'member':
        return yield* this.readMember(e.target, e.name, env, e.pos, e.conditional);

      case 'index': {
        const target = yield* this.evalExpr(e.target, env);
        const index = yield* this.evalExpr(e.index, env);
        return this.readIndex(target, index, e.pos);
      }

      case 'call':
        return yield* this.evalCall(e.callee, e.args, env, e.pos);

      case 'new':
        return yield* this.evalNew(e.type, e.args, e.initializer, env, e.pos);

      case 'newArray': {
        let elements: Value[];
        const elemName = typeRefToString(e.elementType);
        if (e.elements) {
          elements = [];
          for (const el of e.elements) elements.push(yield* this.evalExpr(el, env));
        } else if (e.size) {
          const n = yield* this.evalExpr(e.size, env);
          const len = this.asInt(n, e.pos);
          if (len < 0) throw this.mkException('IndexOutOfRangeException', 'Array size cannot be negative.', e.pos);
          elements = new Array(len).fill(null).map(() => this.defaultValueFor(e.elementType));
        } else {
          elements = [];
        }
        const ref = this.heap.allocRef({ k: 'array', elementType: elemName, elements });
        yield* this.emit({
          kind: 'alloc', pos: e.pos, heapId: (ref as { id: number }).id,
          note: `Allocated ${elemName}[${elements.length}] on the heap`,
        });
        return ref;
      }

      case 'arrayInit': {
        const elements: Value[] = [];
        for (const el of e.elements) elements.push(yield* this.evalExpr(el, env));
        return this.heap.allocRef({ k: 'array', elementType: 'object', elements });
      }

      case 'unary': {
        const v = yield* this.evalExpr(e.operand, env);
        return this.applyUnary(e.op, v, e.pos);
      }

      case 'binary': {
        if (e.op === '&&') {
          const l = yield* this.evalExpr(e.left, env);
          if (!this.asBool(l, e.left)) return mkBool(false);
          const r = yield* this.evalExpr(e.right, env);
          return mkBool(this.asBool(r, e.right));
        }
        if (e.op === '||') {
          const l = yield* this.evalExpr(e.left, env);
          if (this.asBool(l, e.left)) return mkBool(true);
          const r = yield* this.evalExpr(e.right, env);
          return mkBool(this.asBool(r, e.right));
        }
        if (e.op === '??') {
          const l = yield* this.evalExpr(e.left, env);
          if (l.k !== 'null') return l;
          return yield* this.evalExpr(e.right, env);
        }
        const l = yield* this.evalExpr(e.left, env);
        const r = yield* this.evalExpr(e.right, env);
        return this.applyBinary(e.op, l, r, e.pos);
      }

      case 'assign': {
        let value: Value;
        if (e.op === '=') {
          value = yield* this.evalExpr(e.value, env);
        } else if (e.op === '??=') {
          const cur = yield* this.evalExpr(e.target, env);
          if (cur.k !== 'null') return cur;
          value = yield* this.evalExpr(e.value, env);
        } else {
          const cur = yield* this.evalExpr(e.target, env);
          const rhs = yield* this.evalExpr(e.value, env);
          value = this.applyBinary(e.op.slice(0, -1), cur, rhs, e.pos);
        }
        yield* this.assignTo(e.target, value, env, e.pos);
        return value;
      }

      case 'update': {
        const cur = yield* this.evalExpr(e.target, env);
        const one = cur.k === 'char' ? mkInt(1) : this.oneLike(cur);
        const next = this.applyBinary(e.op === '++' ? '+' : '-', cur, one, e.pos);
        yield* this.assignTo(e.target, next, env, e.pos);
        return e.prefix ? next : cur;
      }

      case 'ternary': {
        const c = yield* this.evalExpr(e.cond, env);
        return this.asBool(c, e.cond)
          ? yield* this.evalExpr(e.then, env)
          : yield* this.evalExpr(e.else, env);
      }

      case 'cast': {
        const v = yield* this.evalExpr(e.operand, env);
        return this.castTo(v, e.type, e.pos);
      }

      case 'is': {
        const v = yield* this.evalExpr(e.operand, env);
        const ok = this.isOfType(v, e.type.name);
        if (ok && e.binding) env.declare(e.binding, v);
        return mkBool(ok);
      }

      case 'as': {
        const v = yield* this.evalExpr(e.operand, env);
        return this.isOfType(v, e.type.name) ? v : NULL;
      }

      case 'typeof':
        return this.heap.newString(e.type.name);

      case 'lambda':
        return this.heap.allocRef({ k: 'func', params: e.params, body: e.body, closure: env });
    }
  }

  // ----------------------------------------------------------- name resolution

  private *readName(name: string, env: Env, pos: Pos): ValueGen {
    // 1. Local variable / parameter
    const local = env.get(name);
    if (local !== undefined) return local;

    const frame = this.top();

    // 2. Instance field / auto-property on `this`
    if (frame.thisRef && frame.thisRef.k === 'ref') {
      const obj = this.heap.get(frame.thisRef.id);
      if (obj.k === 'instance') {
        if (obj.fields.has(name)) {
          // Bare `_colour` is `this._colour`, and it has to obey the same
          // access rules — a derived class inherits every field of its base
          // but may only *name* the public and protected ones. Without this,
          // `private` would be enforced from outside the object and silently
          // ignored from inside a subclass, which is the one place students
          // most need to be told about it (Quiz 4 Q4).
          this.checkFieldAccess(obj.cls, name, pos);
          return obj.fields.get(name)!;
        }
        const prop = this.findProperty(obj.cls, name);
        if (prop) return yield* this.getPropertyValue(frame.thisRef, prop, pos);
      }
    }

    // 3. Static field / property on the enclosing class chain
    if (frame.cls) {
      for (const c of ancestry(frame.cls)) {
        if (c.staticFields.has(name)) return c.staticFields.get(name)!;
        const f = c.fields.get(name);
        if (f?.isStatic) {
          yield* this.ensureStaticInit(c);
          return c.staticFields.get(name) ?? this.defaultValueFor(f.decl.type);
        }
        const p = c.properties.get(name);
        if (p?.isStatic) return yield* this.getPropertyValue(undefined, p, pos, c);
      }
    }

    // 4. A type name used as a receiver (`Console`, `Math`, `Counter`, an enum)
    if (this.classes.has(name) || this.enums.has(name) || this.builtins.statics.has(name)) {
      return { k: 'ref', id: this.typeHandleId(name) };
    }

    throw new RuntimeError(
      `The name '${name}' does not exist here.`,
      pos,
      this.suggestName(name, env, frame),
    );
  }

  /** Type handles are heap cells so a type name can flow through expressions. */
  private typeHandles = new Map<string, number>();
  private typeHandleId(name: string): number {
    let id = this.typeHandles.get(name);
    if (id === undefined) {
      id = this.heap.alloc({ k: 'struct', type: '<type>', fields: new Map([['name', this.heap.newString(name)]]) });
      this.typeHandles.set(name, id);
    }
    return id;
  }

  private typeHandleName(v: Value): string | undefined {
    if (v.k !== 'ref') return undefined;
    const o = this.heap.tryGet(v.id);
    if (o?.k !== 'struct' || o.type !== '<type>') return undefined;
    const n = o.fields.get('name');
    if (n?.k !== 'ref') return undefined;
    const s = this.heap.tryGet(n.id);
    return s?.k === 'string' ? s.value : undefined;
  }

  private suggestName(name: string, env: Env, frame: Frame): string | undefined {
    const candidates: string[] = [];
    let e: Env | null = env;
    while (e) { candidates.push(...e.vars.keys()); e = e.parent; }
    if (frame.cls) {
      for (const c of ancestry(frame.cls)) {
        candidates.push(...c.fields.keys(), ...c.properties.keys());
      }
    }
    candidates.push(...this.classes.keys());
    const near = candidates.find((c) => c.toLowerCase() === name.toLowerCase());
    if (near) return `Did you mean '${near}'? C# is case-sensitive.`;
    const underscore = candidates.find((c) => c.replace(/^_/, '') === name.replace(/^_/, ''));
    if (underscore) return `Did you mean '${underscore}'?`;
    return undefined;
  }

  // ------------------------------------------------------------ member access

  /**
   * C#'s "Color Color" rule. A member may share its name with a type:
   * Lab 4.1's UML requires `public Color Color { get; set; }` on Shape, so
   * inside that class `Color.Azure` has to mean the *type*, while `Color`
   * alone means the property. Resolve the value first and fall back to the
   * type only when the value genuinely has no such member.
   */
  private *resolveMemberTarget(targetExpr: Expr, member: string, env: Env, pos: Pos): ValueGen {
    if (targetExpr.kind !== 'name') return yield* this.evalExpr(targetExpr, env);

    const name = targetExpr.name;
    const isTypeName =
      this.classes.has(name) || this.enums.has(name) || this.builtins.statics.has(name);
    if (!isTypeName) return yield* this.evalExpr(targetExpr, env);

    const asValue = yield* this.tryReadNameAsValue(name, env, pos);
    if (asValue === undefined) return { k: 'ref', id: this.typeHandleId(name) };
    if (this.hasMember(asValue, member)) return asValue;
    return { k: 'ref', id: this.typeHandleId(name) };
  }

  /** Like readName, but returns undefined instead of falling back to a type. */
  private *tryReadNameAsValue(name: string, env: Env, pos: Pos): Generator<Tick, Value | undefined, void> {
    const local = env.get(name);
    if (local !== undefined) return local;

    const frame = this.top();
    if (frame.thisRef && frame.thisRef.k === 'ref') {
      const obj = this.heap.get(frame.thisRef.id);
      if (obj.k === 'instance') {
        if (obj.fields.has(name)) return obj.fields.get(name)!;
        const prop = this.findProperty(obj.cls, name);
        if (prop) return yield* this.getPropertyValue(frame.thisRef, prop, pos);
      }
    }
    if (frame.cls) {
      for (const c of ancestry(frame.cls)) {
        if (c.staticFields.has(name)) return c.staticFields.get(name)!;
        const f = c.fields.get(name);
        if (f?.isStatic) {
          yield* this.ensureStaticInit(c);
          return c.staticFields.get(name) ?? this.defaultValueFor(f.decl.type);
        }
        const p = c.properties.get(name);
        if (p?.isStatic) return yield* this.getPropertyValue(undefined, p, pos, c);
      }
    }
    return undefined;
  }

  /** Does this runtime value expose `name`, without running any accessor? */
  private hasMember(v: Value, name: string): boolean {
    if (UNIVERSAL_MEMBERS.has(name)) return true;
    if (v.k === 'enum') return false;
    if (v.k !== 'ref') return false;

    const o = this.heap.tryGet(v.id);
    if (!o) return false;
    switch (o.k) {
      case 'instance':
        return (
          o.fields.has(name) ||
          !!this.findProperty(o.cls, name) ||
          this.findMethods(o.cls, name).length > 0
        );
      case 'struct':
        return o.fields.has(name) || this.builtins.readInstance(o, name, v) !== undefined;
      case 'string':
        return name === 'Length' || STRING_METHODS.has(name);
      case 'array':
        return name === 'Length' || name === 'Rank';
      case 'list':
        return name === 'Count' || LIST_METHODS.has(name);
      case 'dict':
        return name === 'Count' || name === 'Keys' || name === 'Values' || DICT_METHODS.has(name);
      case 'exception':
        return name === 'Message' || name === 'StackTrace';
      default:
        return false;
    }
  }

  private *readMember(targetExpr: Expr, name: string, env: Env, pos: Pos, conditional: boolean): ValueGen {
    // `base.X` reads from the base class implementation.
    if (targetExpr.kind === 'base') {
      const frame = this.top();
      const base = frame.cls?.base;
      if (!base) throw new RuntimeError("'base' has no base class here.", pos);
      const prop = this.findProperty(base, name);
      // Non-virtual on purpose: re-resolving would find the override that is
      // currently running, and recurse until the stack blows.
      if (prop) return yield* this.getPropertyValue(frame.thisRef, prop, pos, undefined, true);
      throw new RuntimeError(`'${base.name}' has no member '${name}'.`, pos);
    }

    const target = yield* this.resolveMemberTarget(targetExpr, name, env, pos);

    if (conditional && target.k === 'null') return NULL;

    // Static access on a type name: Console.Out, Math.PI, Color.Azure, MyEnum.A
    const typeName = this.typeHandleName(target);
    if (typeName) {
      const en = this.enums.get(typeName);
      if (en) {
        const v = en.members.get(name);
        if (v === undefined) throw new RuntimeError(`'${typeName}' has no member '${name}'.`, pos);
        return { k: 'enum', type: typeName, name, v };
      }
      const cls = this.classes.get(typeName);
      if (cls) {
        yield* this.ensureStaticInit(cls);
        for (const c of ancestry(cls)) {
          if (c.staticFields.has(name)) return c.staticFields.get(name)!;
          const p = c.properties.get(name);
          if (p?.isStatic) return yield* this.getPropertyValue(undefined, p, pos, c);
        }
      }
      const b = this.builtins.readStatic(typeName, name);
      if (b !== undefined) return b;
      throw new RuntimeError(`'${typeName}' has no static member '${name}'.`, pos);
    }

    if (target.k === 'null') {
      throw this.mkException(
        'NullReferenceException',
        `Tried to use '.${name}' on something that is null.`,
        pos,
      );
    }

    if (target.k === 'ref') {
      const obj = this.heap.get(target.id);
      if (obj.k === 'instance') {
        const prop = this.findProperty(obj.cls, name);
        if (prop) return yield* this.getPropertyValue(target, prop, pos);
        if (obj.fields.has(name)) {
          this.checkFieldAccess(obj.cls, name, pos);
          return obj.fields.get(name)!;
        }
        // A method used as a value is not supported; give a targeted message.
        if (this.findMethods(obj.cls, name).length) {
          throw new RuntimeError(
            `'${name}' is a method — did you forget the parentheses?`,
            pos,
            `Write ${name}() to call it.`,
          );
        }
        throw new RuntimeError(
          `'${obj.cls.name}' has no member called '${name}'.`,
          pos,
          this.suggestMember(obj.cls, name),
        );
      }
      const b = this.builtins.readInstance(obj, name, target);
      if (b !== undefined) return b;
    }

    const b2 = this.builtins.readValueMember(target, name);
    if (b2 !== undefined) return b2;

    throw new RuntimeError(
      `'${typeNameOf(target, this.heap)}' has no member called '${name}'.`,
      pos,
    );
  }

  private suggestMember(cls: ClassInfo, name: string): string | undefined {
    const all: string[] = [];
    for (const c of ancestry(cls)) all.push(...c.fields.keys(), ...c.properties.keys(), ...c.methods.keys());
    const near = all.find((c) => c.toLowerCase() === name.toLowerCase());
    if (near) return `Did you mean '${near}'? C# is case-sensitive.`;
    const noUnderscore = all.find((c) => c === '_' + name.charAt(0).toLowerCase() + name.slice(1));
    if (noUnderscore) return `There is a private field '${noUnderscore}'. Add a public property if you need it from outside.`;
    return undefined;
  }

  private checkFieldAccess(cls: ClassInfo, name: string, pos: Pos) {
    let info: FieldInfo | undefined;
    let owner: ClassInfo | undefined;
    for (const c of ancestry(cls)) { info = c.fields.get(name); if (info) { owner = c; break; } }
    if (!info || !owner) return;
    if (info.access === 'public' || info.access === 'internal') return;
    const frameCls = this.top().cls;
    if (frameCls && this.canAccess(frameCls, owner, info.access)) return;

    // A subclass reaching for its parent's private field is a different
    // mistake from an outsider reaching in, and it deserves a different
    // sentence: the field really is there, inherited, and still off limits.
    const inherited =
      info.access === 'private' && !!frameCls && frameCls.name !== owner.name &&
      isAssignableTo(frameCls, owner.name);
    throw new RuntimeError(
      inherited
        ? `'${name}' is private to '${owner.name}', so '${frameCls!.name}' cannot use it even though it inherits it.`
        : `'${name}' is ${info.access} inside '${owner.name}', so it cannot be read from out here.`,
      pos,
      inherited
        ? `Every ${frameCls!.name} object contains a '${name}' — private just means only '${owner.name}' may name it. Mark it protected if the children need it, or read it through a public property.`
        : 'That is encapsulation working as intended. Add a public property if the outside world needs this value.',
    );
  }

  private canAccess(from: ClassInfo, owner: ClassInfo, access: Access): boolean {
    if (access === 'public' || access === 'internal') return true;
    // A protected/private member is only reachable from the class that
    // actually declares it (private) or that class and its subclasses
    // (protected) -- `owner` must be the declaring class, never the runtime
    // type of the receiving object, or a derived class reading its own
    // inherited protected field (e.g. `this.name = name;` in a base
    // constructor, called on a more-derived instance) would be wrongly
    // rejected.
    if (access === 'private') return from.name === owner.name;
    // protected
    return isAssignableTo(from, owner.name);
  }

  // -------------------------------------------------------------- assignment

  private *assignTo(target: Expr, value: Value, env: Env, pos: Pos): Generator<Tick, void, void> {
    switch (target.kind) {
      case 'name': {
        const name = target.name;
        if (env.lookup(name)) {
          const declared = env.get(name)!;
          const coerced = this.coerceLike(value, declared);
          env.set(name, coerced);
          yield* this.emit({ kind: 'assign', pos, note: `${name} = ${this.display(coerced)}` });
          return;
        }
        const frame = this.top();
        if (frame.thisRef && frame.thisRef.k === 'ref') {
          const obj = this.heap.get(frame.thisRef.id);
          if (obj.k === 'instance') {
            if (obj.fields.has(name)) {
              // Writing through a bare name is `this.name = ...`, so the same
              // access rule applies as on the read path above.
              this.checkFieldAccess(obj.cls, name, pos);
              const coerced = this.coerceToField(obj.cls, name, value);
              obj.fields.set(name, coerced);
              yield* this.emit({ kind: 'assign', pos, note: `this.${name} = ${this.display(coerced)}` });
              return;
            }
            const prop = this.findProperty(obj.cls, name);
            if (prop) { yield* this.setPropertyValue(frame.thisRef, prop, value, pos); return; }
          }
        }
        if (frame.cls) {
          for (const c of ancestry(frame.cls)) {
            const f = c.fields.get(name);
            if (f?.isStatic) { c.staticFields.set(name, value); return; }
            const p = c.properties.get(name);
            if (p?.isStatic) { yield* this.setPropertyValue(undefined, p, value, pos, c); return; }
          }
        }
        throw new RuntimeError(
          `Cannot assign to '${name}' because it does not exist here.`,
          pos,
          this.suggestName(name, env, frame),
        );
      }

      case 'member': {
        if (target.target.kind === 'base') {
          const frame = this.top();
          const base = frame.cls?.base;
          if (!base) throw new RuntimeError("'base' has no base class here.", pos);
          const prop = this.findProperty(base, target.name);
          if (prop) { yield* this.setPropertyValue(frame.thisRef, prop, value, pos); return; }
          throw new RuntimeError(`'${base.name}' has no member '${target.name}'.`, pos);
        }

        const recv = yield* this.evalExpr(target.target, env);

        const typeName = this.typeHandleName(recv);
        if (typeName) {
          const cls = this.classes.get(typeName);
          if (cls) {
            for (const c of ancestry(cls)) {
              const f = c.fields.get(target.name);
              if (f?.isStatic) { c.staticFields.set(target.name, value); return; }
              const p = c.properties.get(target.name);
              if (p?.isStatic) { yield* this.setPropertyValue(undefined, p, value, pos, c); return; }
            }
          }
          if (this.builtins.writeStatic(typeName, target.name, value)) return;
          throw new RuntimeError(`Cannot assign to '${typeName}.${target.name}'.`, pos);
        }

        if (recv.k === 'null') {
          throw this.mkException('NullReferenceException', `Tried to set '.${target.name}' on null.`, pos);
        }
        if (recv.k !== 'ref') throw new RuntimeError(`Cannot assign to '.${target.name}' here.`, pos);

        const obj = this.heap.get(recv.id);
        if (obj.k === 'instance') {
          const prop = this.findProperty(obj.cls, target.name);
          if (prop) { yield* this.setPropertyValue(recv, prop, value, pos); return; }
          if (obj.fields.has(target.name)) {
            this.checkFieldAccess(obj.cls, target.name, pos);
            this.checkReadonly(obj.cls, target.name, pos);
            const coerced = this.coerceToField(obj.cls, target.name, value);
            obj.fields.set(target.name, coerced);
            yield* this.emit({ kind: 'assign', pos, note: `${obj.cls.name}.${target.name} = ${this.display(coerced)}` });
            return;
          }
          throw new RuntimeError(
            `'${obj.cls.name}' has no member '${target.name}' to assign to.`,
            pos,
            this.suggestMember(obj.cls, target.name),
          );
        }
        if (this.builtins.writeInstance(obj, target.name, value, recv)) return;
        throw new RuntimeError(`Cannot assign to '.${target.name}' on this value.`, pos);
      }

      case 'index': {
        const recv = yield* this.evalExpr(target.target, env);
        const idx = yield* this.evalExpr(target.index, env);
        this.writeIndex(recv, idx, value, pos);
        yield* this.emit({ kind: 'assign', pos, note: `Element set to ${this.display(value)}` });
        return;
      }

      default:
        throw new RuntimeError('The left side of = must be a variable, field, property, or element.', pos);
    }
  }

  private checkReadonly(cls: ClassInfo, name: string, pos: Pos) {
    for (const c of ancestry(cls)) {
      const f = c.fields.get(name);
      if (!f) continue;
      if (f.isReadonly && this.top().label.indexOf('..ctor') === -1) {
        throw new RuntimeError(
          `'${name}' is readonly, so it can only be set in the constructor.`,
          pos,
          'That is the point of readonly: the reference is fixed once the object exists. You can still change what it points at.',
        );
      }
      return;
    }
  }

  // ---------------------------------------------------------------- properties

  findProperty(cls: ClassInfo, name: string): PropertyInfo | undefined {
    for (const c of ancestry(cls)) {
      const p = c.properties.get(name);
      if (p) return p;
    }
    for (const i of cls.interfaces) {
      const p = this.findProperty(i, name);
      if (p) return p;
    }
    return undefined;
  }

  /**
   * Virtual property lookup: start at the runtime class so an `override`
   * in a subclass wins. This is what makes Week 4's FullDescription work.
   */
  private resolveVirtualProperty(runtimeCls: ClassInfo, name: string): PropertyInfo | undefined {
    for (const c of ancestry(runtimeCls)) {
      const p = c.properties.get(name);
      if (p && !p.isAbstract) return p;
    }
    return this.findProperty(runtimeCls, name);
  }

  *getPropertyValue(
    thisRef: Value | undefined,
    prop: PropertyInfo,
    pos: Pos,
    staticCls?: ClassInfo,
    nonVirtual = false,
  ): ValueGen {
    let effective = prop;
    if (thisRef?.k === 'ref' && !nonVirtual) {
      const obj = this.heap.get(thisRef.id);
      if (obj.k === 'instance') effective = this.resolveVirtualProperty(obj.cls, prop.name) ?? prop;
    }

    if (!effective.hasGet) {
      throw new RuntimeError(
        `Property '${effective.name}' has no get accessor, so it cannot be read.`,
        pos,
        'Add `get { ... }`, or use it only on the left of an assignment.',
      );
    }

    if (effective.isAuto) {
      if (effective.isStatic) {
        const c = staticCls ?? effective.owner;
        return c.staticFields.get('<prop>' + effective.name) ?? this.defaultValueFor(effective.decl.type);
      }
      if (thisRef?.k !== 'ref') throw new RuntimeError(`Cannot read '${effective.name}' without an object.`, pos);
      const obj = this.heap.get(thisRef.id) as InstanceObj;
      return obj.autoProps.get(effective.name) ?? this.defaultValueFor(effective.decl.type);
    }

    const decl = effective.decl;
    const body = decl.exprBody
      ? undefined
      : decl.accessors.find((a) => a.kind === 'get');

    const frame: Frame = {
      label: `${effective.owner.name}.${effective.name}.get`,
      thisRef, cls: effective.owner,
      scopes: [new Env(this.globals)],
      pos,
    };
    this.pushFrame(frame, pos);
    try {
      yield* this.emit({ kind: 'call', pos, note: `get ${effective.owner.name}.${effective.name}` });
      if (decl.exprBody) {
        const v = yield* this.evalExpr(decl.exprBody, frame.scopes[0]);
        return this.coerceToType(v, decl.type, pos);
      }
      if (body?.exprBody) {
        const v = yield* this.evalExpr(body.exprBody, frame.scopes[0]);
        return this.coerceToType(v, decl.type, pos);
      }
      if (body?.body) {
        const r = yield* this.execBlockBody(body.body.body, frame);
        if (r.t === 'return') return this.coerceToType(r.v, decl.type, pos);
        throw new RuntimeError(
          `The get accessor for '${effective.name}' finished without returning a value.`,
          pos,
          'Every path through a get accessor needs a `return`.',
        );
      }
      throw new RuntimeError(`Property '${effective.name}' has no readable body.`, pos);
    } finally {
      this.popFrame();
    }
  }

  *setPropertyValue(
    thisRef: Value | undefined,
    prop: PropertyInfo,
    value: Value,
    pos: Pos,
    staticCls?: ClassInfo,
    nonVirtual = false,
  ): Generator<Tick, void, void> {
    let effective = prop;
    if (thisRef?.k === 'ref' && !nonVirtual) {
      const obj = this.heap.get(thisRef.id);
      if (obj.k === 'instance') effective = this.resolveVirtualProperty(obj.cls, prop.name) ?? prop;
    }

    if (!effective.hasSet) {
      throw new RuntimeError(
        `Property '${effective.name}' is read-only.`,
        pos,
        'It has a get but no set. That is deliberate for things like Ticks — add `set { ... }` only if the design really allows changing it.',
      );
    }

    const coerced = this.coerceToType(value, effective.decl.type, pos);

    if (effective.isAuto) {
      if (effective.isStatic) {
        (staticCls ?? effective.owner).staticFields.set('<prop>' + effective.name, coerced);
        return;
      }
      if (thisRef?.k !== 'ref') throw new RuntimeError(`Cannot set '${effective.name}' without an object.`, pos);
      const obj = this.heap.get(thisRef.id) as InstanceObj;
      obj.autoProps.set(effective.name, coerced);
      yield* this.emit({ kind: 'assign', pos, note: `${effective.name} = ${this.display(coerced)}` });
      return;
    }

    const setter = effective.decl.accessors.find((a) => a.kind === 'set');
    const frame: Frame = {
      label: `${effective.owner.name}.${effective.name}.set`,
      thisRef, cls: effective.owner,
      scopes: [new Env(this.globals)],
      pos,
    };
    frame.scopes[0].declare('value', coerced);
    this.pushFrame(frame, pos);
    try {
      yield* this.emit({ kind: 'call', pos, note: `set ${effective.owner.name}.${effective.name} = ${this.display(coerced)}` });
      if (setter?.exprBody) { yield* this.evalExpr(setter.exprBody, frame.scopes[0]); return; }
      if (setter?.body) { yield* this.execBlockBody(setter.body.body, frame); return; }
      throw new RuntimeError(`Property '${effective.name}' has no writable body.`, pos);
    } finally {
      this.popFrame();
    }
  }

  // ------------------------------------------------------------------- calls

  private *evalCall(callee: Expr, argExprs: Expr[], env: Env, pos: Pos): ValueGen {
    // base.Method(...) — non-virtual dispatch into the base class.
    if (callee.kind === 'member' && callee.target.kind === 'base') {
      const frame = this.top();
      const base = frame.cls?.base;
      if (!base) throw new RuntimeError("'base' has no base class here.", pos);
      const args = yield* this.evalArgs(argExprs, env);
      const m = this.pickOverload(this.findMethods(base, callee.name), args, callee.name, pos, base.name);
      // Non-virtual: `base.Draw()` must reach the base implementation, not
      // bounce back into the override that is calling it.
      return yield* this.invokeMethod(m, frame.thisRef, args, base, pos, true);
    }

    if (callee.kind === 'member') {
      // Static or instance member call.
      const recvExpr = callee.target;
      const name = callee.name;

      // Resolve the receiver once, honouring the "Color Color" rule.
      const recv = yield* this.resolveMemberTarget(recvExpr, name, env, pos);

      if (callee.conditional && recv.k === 'null') return NULL;

      const typeName = this.typeHandleName(recv);
      if (typeName) {
        const args = yield* this.evalArgs(argExprs, env);
        const cls = this.classes.get(typeName);
        if (cls) {
          yield* this.ensureStaticInit(cls);
          const methods = this.findMethods(cls, name).filter((m) => m.isStatic);
          if (methods.length) {
            const m = this.pickOverload(methods, args, name, pos, typeName);
            return yield* this.invokeMethod(m, undefined, args, cls, pos);
          }
        }
        const b = yield* this.builtins.callStatic(typeName, name, args, pos);
        if (b !== undefined) return b;
        throw new RuntimeError(
          `'${typeName}' has no static method '${name}' taking ${argExprs.length} argument(s).`,
          pos,
        );
      }

      if (recv.k === 'null') {
        throw this.mkException(
          'NullReferenceException',
          `Tried to call '${name}()' on something that is null.`,
          pos,
        );
      }

      const args = yield* this.evalArgs(argExprs, env);

      if (recv.k === 'ref') {
        const obj = this.heap.get(recv.id);
        if (obj.k === 'instance') {
          const methods = this.findMethods(obj.cls, name);
          if (methods.length) {
            const m = this.pickOverload(methods, args, name, pos, obj.cls.name);
            return yield* this.invokeMethod(m, recv, args, obj.cls, pos);
          }
          // ToString()/Equals()/GetType() fall back to object behaviour.
          const objMember = this.objectMember(recv, obj, name, args, pos);
          if (objMember !== undefined) return objMember;
          // A property holding a lambda, called like a method.
          const prop = this.findProperty(obj.cls, name);
          if (prop) {
            const fn = yield* this.getPropertyValue(recv, prop, pos);
            const called = yield* this.tryCallFunc(fn, args, pos);
            if (called !== undefined) return called;
          }
          throw new RuntimeError(
            `'${obj.cls.name}' has no method '${name}' taking ${args.length} argument(s).`,
            pos,
            this.suggestMember(obj.cls, name),
          );
        }
        if (obj.k === 'func') {
          const called = yield* this.tryCallFunc(recv, args, pos);
          if (called !== undefined) return called;
        }
      }

      const b = yield* this.builtins.callInstance(recv, name, args, pos);
      if (b !== undefined) return b;

      throw new RuntimeError(
        `'${typeNameOf(recv, this.heap)}' has no method '${name}'.`,
        pos,
      );
    }

    // Bare call: a method on `this` or a static in the enclosing class.
    if (callee.kind === 'name') {
      const args = yield* this.evalArgs(argExprs, env);
      const frame = this.top();

      // A local holding a lambda.
      const local = env.get(callee.name);
      if (local) {
        const called = yield* this.tryCallFunc(local, args, pos);
        if (called !== undefined) return called;
      }

      if (frame.thisRef?.k === 'ref') {
        const obj = this.heap.get(frame.thisRef.id);
        if (obj.k === 'instance') {
          const methods = this.findMethods(obj.cls, callee.name);
          if (methods.length) {
            const m = this.pickOverload(methods, args, callee.name, pos, obj.cls.name);
            return yield* this.invokeMethod(m, m.isStatic ? undefined : frame.thisRef, args, obj.cls, pos);
          }
        }
      }
      if (frame.cls) {
        for (const c of ancestry(frame.cls)) {
          const methods = this.findMethods(c, callee.name);
          if (methods.length) {
            const m = this.pickOverload(methods, args, callee.name, pos, c.name);
            if (!m.isStatic && !frame.thisRef) {
              throw new RuntimeError(
                `'${callee.name}' is not static, so it needs an object to run on.`,
                pos,
                `Either mark '${callee.name}' static, or create an object first: var o = new ${c.name}(); o.${callee.name}();`,
              );
            }
            return yield* this.invokeMethod(m, m.isStatic ? undefined : frame.thisRef, args, c, pos);
          }
        }
      }
      throw new RuntimeError(
        `There is no method called '${callee.name}' here.`,
        pos,
        this.suggestName(callee.name, env, frame),
      );
    }

    // Calling the result of an expression (a lambda in a variable).
    const fn = yield* this.evalExpr(callee, env);
    const args = yield* this.evalArgs(argExprs, env);
    const called = yield* this.tryCallFunc(fn, args, pos);
    if (called !== undefined) return called;
    throw new RuntimeError('This expression is not something you can call.', pos);
  }

  private *tryCallFunc(fn: Value, args: Value[], pos: Pos): Generator<Tick, Value | undefined, void> {
    if (fn.k !== 'ref') return undefined;
    const o = this.heap.tryGet(fn.id);
    if (o?.k !== 'func') return undefined;
    const frame: Frame = { label: '<lambda>', scopes: [new Env(o.closure as Env)], pos };
    o.params.forEach((p, i) => frame.scopes[0].declare(p, args[i] ?? NULL));
    this.pushFrame(frame, pos);
    try {
      const body = o.body as Expr | Block;
      if ((body as Block).kind === 'block') {
        const r = yield* this.execBlockBody((body as Block).body, frame);
        return r.t === 'return' ? r.v : VOID;
      }
      return yield* this.evalExpr(body as Expr, frame.scopes[0]);
    } finally {
      this.popFrame();
    }
  }

  private objectMember(recv: Value, obj: InstanceObj, name: string, args: Value[], pos: Pos): Value | undefined {
    if (name === 'GetType' && args.length === 0) return this.heap.newString(obj.cls.name);
    if (name === 'Equals' && args.length === 1) return mkBool(valuesEqual(recv, args[0], this.heap));
    if (name === 'GetHashCode' && args.length === 0) return mkInt(recv.k === 'ref' ? recv.id : 0);
    return undefined;
  }

  private *evalArgs(exprs: Expr[], env: Env): Generator<Tick, Value[], void> {
    const out: Value[] = [];
    for (const e of exprs) out.push(yield* this.evalExpr(e, env));
    return out;
  }

  findMethods(cls: ClassInfo, name: string): MethodInfo[] {
    const out: MethodInfo[] = [];
    const seen = new Set<string>();
    for (const c of ancestry(cls)) {
      for (const m of c.methods.get(name) ?? []) {
        // A derived override shadows the base version of the same signature.
        const sig = `${m.paramCount}`;
        if (seen.has(sig)) continue;
        seen.add(sig);
        out.push(m);
      }
    }
    return out;
  }

  private pickOverload(methods: MethodInfo[], args: Value[], name: string, pos: Pos, ownerName: string): MethodInfo {
    if (!methods.length) {
      throw new RuntimeError(`There is no method called '${name}' on '${ownerName}'.`, pos);
    }
    const byCount = methods.filter((m) => m.paramCount === args.length);
    if (byCount.length === 1) return byCount[0];
    if (byCount.length > 1) {
      // Score by how well each parameter type matches the runtime value.
      let best = byCount[0];
      let bestScore = -1;
      for (const m of byCount) {
        let score = 0;
        m.decl.params.forEach((p, i) => { score += this.matchScore(args[i], p.type); });
        if (score > bestScore) { bestScore = score; best = m; }
      }
      return best;
    }
    // Optional parameters
    const withDefaults = methods.find(
      (m) => args.length < m.paramCount && m.decl.params.slice(args.length).every((p) => p.defaultValue),
    );
    if (withDefaults) return withDefaults;

    const counts = [...new Set(methods.map((m) => m.paramCount))].sort().join(' or ');
    throw new RuntimeError(
      `'${name}' expects ${counts} argument(s), but you passed ${args.length}.`,
      pos,
      'Count the values inside the parentheses, separated by commas.',
    );
  }

  private matchScore(v: Value | undefined, t: TypeRef): number {
    if (!v) return 0;
    const tn = t.name;
    const vn = typeNameOf(v, this.heap);
    if (tn === vn) return 3;
    if (tn === 'object') return 1;
    if (isNumeric(v) && ['int', 'long', 'float', 'double'].includes(tn)) return 2;
    if (v.k === 'ref') {
      const o = this.heap.tryGet(v.id);
      if (o?.k === 'instance' && isAssignableTo(o.cls, tn)) return 2;
    }
    return 0;
  }

  *invokeMethod(
    m: MethodInfo,
    thisRef: Value | undefined,
    args: Value[],
    cls: ClassInfo,
    pos: Pos,
    nonVirtual = false,
  ): ValueGen {
    if (m.isAbstract || (!m.decl.body && !m.decl.exprBody)) {
      const runtimeName = thisRef?.k === 'ref'
        ? (this.heap.get(thisRef.id) as InstanceObj).cls.name
        : cls.name;
      throw new RuntimeError(
        `'${runtimeName}' does not provide a body for the abstract method '${m.name}'.`,
        pos,
        `Add:  public override ${typeRefToString(m.decl.returnType)} ${m.name}(...) { ... }  to '${runtimeName}'.`,
      );
    }

    // Virtual dispatch: re-resolve from the runtime class.
    let target = m;
    if (thisRef?.k === 'ref' && !m.isStatic && !nonVirtual) {
      const obj = this.heap.get(thisRef.id);
      if (obj.k === 'instance') {
        for (const c of ancestry(obj.cls)) {
          const cand = (c.methods.get(m.name) ?? []).find(
            (x) => x.paramCount === m.paramCount && !x.isAbstract,
          );
          if (cand) { target = cand; break; }
        }
      }
    }

    const frame: Frame = {
      label: `${target.owner.name}.${target.name}`,
      thisRef: target.isStatic ? undefined : thisRef,
      cls: target.owner,
      scopes: [new Env(this.globals)],
      pos,
    };
    const scope = frame.scopes[0];
    target.decl.params.forEach((p, i) => {
      let v = args[i];
      if (v === undefined && p.defaultValue) {
        // Defaults are literals in the subset, so a shallow eval is enough.
        v = this.constEval(p.defaultValue);
      }
      scope.declare(p.name, this.coerceToType(v ?? this.defaultValueFor(p.type), p.type, pos));
    });

    this.pushFrame(frame, pos);
    try {
      yield* this.emit({
        kind: 'call', pos,
        note: `Called ${target.owner.name}.${target.name}(${args.map((a) => this.display(a)).join(', ')})`,
      });

      let result: Value = VOID;
      if (target.decl.exprBody) {
        result = yield* this.evalExpr(target.decl.exprBody, scope);
      } else {
        const r = yield* this.execBlockBody(target.decl.body!.body, frame);
        if (r.t === 'return') result = r.v;
        else if (target.decl.returnType.name !== 'void') {
          throw new RuntimeError(
            `'${target.name}' should return ${typeRefToString(target.decl.returnType)}, but it finished without a return.`,
            pos,
            'Add a `return` on every path out of the method.',
          );
        }
      }

      const coerced = target.decl.returnType.name === 'void'
        ? VOID
        : this.coerceToType(result, target.decl.returnType, pos);

      yield* this.emit({
        kind: 'return', pos,
        note: coerced.k === 'void'
          ? `Returned from ${target.name}()`
          : `${target.name}() returned ${this.display(coerced)}`,
      });
      return coerced;
    } finally {
      this.popFrame();
    }
  }

  private constEval(e: Expr): Value {
    if (e.kind === 'literal') return this.literalValue(e.value, e.literalType);
    if (e.kind === 'unary' && e.op === '-' && e.operand.kind === 'literal') {
      const v = this.literalValue(e.operand.value, e.operand.literalType);
      return isNumeric(v) ? { ...v, v: -v.v } as Value : v;
    }
    return NULL;
  }

  private pushFrame(f: Frame, pos: Pos) {
    if (this.stack.length >= 220) {
      throw new RuntimeError(
        'The call stack got too deep, so I stopped.',
        pos,
        'A method is calling itself without a base case. Check your recursion, or a property whose get accessor reads itself.',
      );
    }
    this.stack.push(f);
  }

  private popFrame() { this.stack.pop(); }

  private top(): Frame {
    if (!this.stack.length) {
      const f: Frame = { label: '<script>', scopes: [new Env(this.globals)], pos: { line: 1, col: 1 } };
      this.stack.push(f);
    }
    return this.stack[this.stack.length - 1];
  }

  // ---------------------------------------------------------- object creation

  private *evalNew(type: TypeRef, argExprs: Expr[], initializer: Expr[] | undefined, env: Env, pos: Pos): ValueGen {
    const args = yield* this.evalArgs(argExprs, env);
    const name = type.name;

    // Framework collections and shimmed types.
    const builtin = yield* this.builtins.construct(type, args, pos);
    if (builtin !== undefined) {
      if (initializer) {
        for (const el of initializer) {
          const v = yield* this.evalExpr(el, env);
          this.builtins.initializerAdd(builtin, v, pos);
        }
      }
      return builtin;
    }

    const cls = this.classes.get(name);
    if (!cls) {
      throw new RuntimeError(
        `There is no class called '${name}'.`,
        pos,
        this.suggestType(name),
      );
    }
    if (cls.isInterface) {
      throw new RuntimeError(
        `'${name}' is an interface, so you cannot create one with 'new'.`,
        pos,
        'Create a class that implements it, and new that up instead.',
      );
    }
    if (cls.isAbstract) {
      throw new RuntimeError(
        `'${name}' is abstract, so it cannot be created directly.`,
        pos,
        `That is the point of 'abstract': ${name} describes what its children share, but is never a real object itself. Create one of its subclasses.`,
      );
    }

    const ref = yield* this.instantiate(cls, args, pos);

    if (initializer) {
      for (const el of initializer) {
        if (el.kind === 'assign' && el.target.kind === 'name') {
          const v = yield* this.evalExpr(el.value, env);
          const obj = this.heap.get((ref as { id: number }).id) as InstanceObj;
          const prop = this.findProperty(obj.cls, el.target.name);
          if (prop) yield* this.setPropertyValue(ref, prop, v, pos);
          else obj.fields.set(el.target.name, v);
        }
      }
    }
    return ref;
  }

  private suggestType(name: string): string | undefined {
    const all = [...this.classes.keys(), ...this.enums.keys()];
    const near = all.find((c) => c.toLowerCase() === name.toLowerCase());
    if (near) return `Did you mean '${near}'? C# is case-sensitive.`;
    return undefined;
  }

  *instantiate(cls: ClassInfo, args: Value[], pos: Pos): ValueGen {
    yield* this.ensureStaticInit(cls);

    const obj: InstanceObj = { k: 'instance', cls, fields: new Map(), autoProps: new Map() };
    const id = this.heap.alloc(obj);
    const ref: Value = { k: 'ref', id };

    yield* this.emit({
      kind: 'alloc', pos, heapId: id,
      note: `Created a new ${cls.name} object on the heap (#${id})`,
    });

    // Field defaults run base-first so a subclass can rely on base state.
    const chain = [...ancestry(cls)].reverse();
    for (const c of chain) {
      for (const f of c.fields.values()) {
        if (f.isStatic) continue;
        obj.fields.set(f.name, this.defaultValueFor(f.decl.type));
      }
      for (const p of c.properties.values()) {
        if (p.isStatic || !p.isAuto) continue;
        obj.autoProps.set(p.name, this.defaultValueFor(p.decl.type));
      }
    }
    // Then field initialisers, which may reference other fields.
    for (const c of chain) {
      for (const f of c.fields.values()) {
        if (f.isStatic || !f.decl.init) continue;
        const frame: Frame = { label: `${c.name}..init`, thisRef: ref, cls: c, scopes: [new Env(this.globals)], pos };
        this.pushFrame(frame, pos);
        try {
          const v = yield* this.evalExpr(f.decl.init, frame.scopes[0]);
          obj.fields.set(f.name, this.coerceToType(v, f.decl.type, pos));
        } finally { this.popFrame(); }
      }
      for (const p of c.properties.values()) {
        if (p.isStatic || !p.isAuto || !p.decl.init) continue;
        const frame: Frame = { label: `${c.name}..init`, thisRef: ref, cls: c, scopes: [new Env(this.globals)], pos };
        this.pushFrame(frame, pos);
        try {
          const v = yield* this.evalExpr(p.decl.init, frame.scopes[0]);
          obj.autoProps.set(p.name, this.coerceToType(v, p.decl.type, pos));
        } finally { this.popFrame(); }
      }
    }

    yield* this.runConstructor(cls, ref, args, pos);
    return ref;
  }

  private *runConstructor(cls: ClassInfo, thisRef: Value, args: Value[], pos: Pos): Generator<Tick, void, void> {
    if (!cls.ctors.length) {
      if (args.length > 0) {
        throw new RuntimeError(
          `'${cls.name}' has no constructor taking ${args.length} argument(s).`,
          pos,
          `Add:  public ${cls.name}(...) { ... }  to '${cls.name}', or call new ${cls.name}() with no arguments.`,
        );
      }
      // Implicit default constructor still has to run the base constructor.
      if (cls.base) yield* this.runConstructor(cls.base, thisRef, [], pos);
      return;
    }

    const matches = cls.ctors.filter((c) => c.paramCount === args.length);
    let ctor = matches[0];
    if (matches.length > 1) {
      let bestScore = -1;
      for (const c of matches) {
        let score = 0;
        c.decl.params.forEach((p, i) => { score += this.matchScore(args[i], p.type); });
        if (score > bestScore) { bestScore = score; ctor = c; }
      }
    }
    if (!ctor) {
      const counts = [...new Set(cls.ctors.map((c) => c.paramCount))].sort().join(' or ');
      throw new RuntimeError(
        `'${cls.name}' has a constructor taking ${counts} argument(s), but you passed ${args.length}.`,
        pos,
        `Check the UML diagram for ${cls.name} — the constructor's parameters are listed there.`,
      );
    }

    const frame: Frame = {
      label: `${cls.name}..ctor`,
      thisRef, cls,
      scopes: [new Env(this.globals)],
      pos,
    };
    ctor.decl.params.forEach((p, i) => {
      frame.scopes[0].declare(p.name, this.coerceToType(args[i] ?? this.defaultValueFor(p.type), p.type, pos));
    });

    this.pushFrame(frame, pos);
    try {
      yield* this.emit({
        kind: 'call', pos,
        note: `Running ${cls.name}(${args.map((a) => this.display(a)).join(', ')})`,
      });

      const init = ctor.decl.initializer;
      if (init?.target === 'this') {
        const chained: Value[] = [];
        for (const a of init.args) chained.push(yield* this.evalExpr(a, frame.scopes[0]));
        yield* this.runConstructor(cls, thisRef, chained, init.pos);
      } else if (init?.target === 'base') {
        const chained: Value[] = [];
        for (const a of init.args) chained.push(yield* this.evalExpr(a, frame.scopes[0]));
        if (cls.base) yield* this.runConstructor(cls.base, thisRef, chained, init.pos);
      } else if (cls.base) {
        yield* this.runConstructor(cls.base, thisRef, [], pos);
      }

      yield* this.execBlockBody(ctor.decl.body.body, frame);
    } finally {
      this.popFrame();
    }
  }

  private *ensureStaticInit(cls: ClassInfo): Generator<Tick, void, void> {
    if (cls.staticInitDone) return;
    cls.staticInitDone = true;
    if (cls.base) yield* this.ensureStaticInit(cls.base);
    for (const f of cls.fields.values()) {
      if (!f.isStatic) continue;
      cls.staticFields.set(f.name, this.defaultValueFor(f.decl.type));
    }
    for (const f of cls.fields.values()) {
      if (!f.isStatic || !f.decl.init) continue;
      const frame: Frame = { label: `${cls.name}..cctor`, cls, scopes: [new Env(this.globals)], pos: f.decl.pos };
      this.pushFrame(frame, f.decl.pos);
      try {
        const v = yield* this.evalExpr(f.decl.init, frame.scopes[0]);
        cls.staticFields.set(f.name, this.coerceToType(v, f.decl.type, f.decl.pos));
      } finally { this.popFrame(); }
    }
  }

  // ------------------------------------------------------------ indexing

  readIndex(target: Value, index: Value, pos: Pos): Value {
    if (target.k === 'null') {
      throw this.mkException('NullReferenceException', 'Tried to index into null.', pos);
    }
    if (target.k !== 'ref') throw new RuntimeError('This value cannot be indexed with [].', pos);
    const o = this.heap.get(target.id);

    if (o.k === 'array' || o.k === 'list') {
      const i = this.asInt(index, pos);
      if (i < 0 || i >= o.elements.length) {
        throw this.mkException(
          o.k === 'array' ? 'IndexOutOfRangeException' : 'ArgumentOutOfRangeException',
          `Index ${i} is outside the bounds of a ${o.k} with ${o.elements.length} element(s). Valid indexes are 0 to ${o.elements.length - 1}.`,
          pos,
        );
      }
      return o.elements[i];
    }
    if (o.k === 'string') {
      const i = this.asInt(index, pos);
      if (i < 0 || i >= o.value.length) {
        throw this.mkException('IndexOutOfRangeException', `Index ${i} is outside a string of length ${o.value.length}.`, pos);
      }
      return mkChar(o.value[i]);
    }
    if (o.k === 'dict') {
      const hit = o.entries.find((e) => valuesEqual(e.key, index, this.heap));
      if (!hit) {
        throw this.mkException(
          'KeyNotFoundException',
          `The key '${this.display(index)}' was not present in the dictionary.`,
          pos,
        );
      }
      return hit.value;
    }
    throw new RuntimeError('This value cannot be indexed with [].', pos);
  }

  writeIndex(target: Value, index: Value, value: Value, pos: Pos) {
    if (target.k !== 'ref') throw new RuntimeError('This value cannot be indexed with [].', pos);
    const o = this.heap.get(target.id);
    if (o.k === 'array' || o.k === 'list') {
      const i = this.asInt(index, pos);
      if (i < 0 || i >= o.elements.length) {
        throw this.mkException(
          'IndexOutOfRangeException',
          `Index ${i} is outside the bounds of a ${o.k} with ${o.elements.length} element(s).`,
          pos,
        );
      }
      o.elements[i] = value;
      return;
    }
    if (o.k === 'dict') {
      const hit = o.entries.find((e) => valuesEqual(e.key, index, this.heap));
      if (hit) hit.value = value;
      else o.entries.push({ key: index, value });
      return;
    }
    if (o.k === 'string') {
      throw new RuntimeError(
        'Strings are immutable in C#, so you cannot assign to s[i].',
        pos,
        'Build a new string instead, e.g. with Substring or a StringBuilder.',
      );
    }
    throw new RuntimeError('This value cannot be indexed with [].', pos);
  }

  iterableToArray(v: Value, pos: Pos): Value[] {
    if (v.k === 'null') {
      throw this.mkException('NullReferenceException', 'Tried to loop over something that is null.', pos);
    }
    if (v.k !== 'ref') throw new RuntimeError('foreach needs a collection to loop over.', pos);
    const o = this.heap.get(v.id);
    if (o.k === 'array' || o.k === 'list') return [...o.elements];
    if (o.k === 'string') return [...o.value].map(mkChar);
    if (o.k === 'dict') {
      return o.entries.map((e) =>
        this.heap.allocRef({
          k: 'struct', type: 'KeyValuePair',
          fields: new Map([['Key', e.key], ['Value', e.value]]),
        }),
      );
    }
    throw new RuntimeError(
      `You cannot use foreach over a ${typeNameOf(v, this.heap)}.`,
      pos,
      'foreach works on arrays, List<T>, Dictionary<K,V> and strings.',
    );
  }

  // ------------------------------------------------------------- operators

  applyUnary(op: string, v: Value, pos: Pos): Value {
    switch (op) {
      case '-':
        if (!isNumeric(v)) throw this.opError('-', v, undefined, pos);
        return { ...v, v: -v.v } as Value;
      case '+':
        return v;
      case '!':
        if (v.k !== 'bool') throw this.opError('!', v, undefined, pos);
        return mkBool(!v.v);
      case '~':
        if (!isNumeric(v)) throw this.opError('~', v, undefined, pos);
        return mkInt(~v.v);
    }
    throw new RuntimeError(`Unsupported operator '${op}'.`, pos);
  }

  applyBinary(op: string, l: Value, r: Value, pos: Pos): Value {
    // String concatenation wins over arithmetic when either side is a string.
    if (op === '+' && (this.isString(l) || this.isString(r))) {
      return this.heap.newString(this.display(l) + this.display(r));
    }

    if (op === '==' ) return mkBool(valuesEqual(l, r, this.heap));
    if (op === '!=') return mkBool(!valuesEqual(l, r, this.heap));

    if (op === '&&' || op === '||') {
      if (l.k !== 'bool' || r.k !== 'bool') throw this.opError(op, l, r, pos);
      return mkBool(op === '&&' ? l.v && r.v : l.v || r.v);
    }

    if (op === '&' || op === '|' || op === '^') {
      if (l.k === 'bool' && r.k === 'bool') {
        return mkBool(op === '&' ? l.v && r.v : op === '|' ? l.v || r.v : l.v !== r.v);
      }
    }

    const ln = this.toNumeric(l);
    const rn = this.toNumeric(r);
    if (ln === undefined || rn === undefined) throw this.opError(op, l, r, pos);

    switch (op) {
      case '<': return mkBool(ln.v < rn.v);
      case '>': return mkBool(ln.v > rn.v);
      case '<=': return mkBool(ln.v <= rn.v);
      case '>=': return mkBool(ln.v >= rn.v);
    }

    const resultKind = this.promote(ln.k, rn.k);

    switch (op) {
      case '+': return this.makeNumeric(resultKind, ln.v + rn.v, pos);
      case '-': return this.makeNumeric(resultKind, ln.v - rn.v, pos);
      case '*': return this.makeNumeric(resultKind, ln.v * rn.v, pos);
      case '/': {
        if (rn.v === 0 && (resultKind === 'int' || resultKind === 'long')) {
          throw this.mkException(
            'DivideByZeroException',
            'Attempted to divide by zero.',
            pos,
          );
        }
        const q = ln.v / rn.v;
        return this.makeNumeric(resultKind, resultKind === 'int' || resultKind === 'long' ? Math.trunc(q) : q, pos);
      }
      case '%': {
        if (rn.v === 0 && (resultKind === 'int' || resultKind === 'long')) {
          throw this.mkException('DivideByZeroException', 'Attempted to divide by zero.', pos);
        }
        return this.makeNumeric(resultKind, ln.v % rn.v, pos);
      }
      case '<<': return mkInt(ln.v << rn.v);
      case '>>': return mkInt(ln.v >> rn.v);
      case '&': return mkInt(ln.v & rn.v);
      case '|': return mkInt(ln.v | rn.v);
      case '^': return mkInt(ln.v ^ rn.v);
    }
    throw new RuntimeError(`Unsupported operator '${op}'.`, pos);
  }

  private promote(a: string, b: string): NumKind {
    if (a === 'double' || b === 'double') return 'double';
    if (a === 'float' || b === 'float') return 'float';
    if (a === 'long' || b === 'long') return 'long';
    return 'int';
  }

  /**
   * int arithmetic wraps at 32 bits like real C# in an unchecked context.
   * Lab 2.1 step 13 asks students to explain exactly this, so getting it
   * right matters more here than it looks.
   */
  private makeNumeric(kind: NumKind, v: number, pos: Pos): Value {
    switch (kind) {
      case 'int': return mkInt(v | 0);
      case 'long': return mkLong(v);
      case 'float': return mkFloat(v);
      case 'double': return mkDouble(v);
    }
  }

  private toNumeric(v: Value): { k: NumKind; v: number } | undefined {
    if (isNumeric(v)) return { k: v.k, v: v.v };
    if (v.k === 'char') return { k: 'int', v: v.v.charCodeAt(0) };
    if (v.k === 'enum') return { k: 'int', v: v.v };
    return undefined;
  }

  private opError(op: string, l: Value, r: Value | undefined, pos: Pos): RuntimeError {
    const lt = typeNameOf(l, this.heap);
    if (!r) return new RuntimeError(`Cannot apply '${op}' to a ${lt}.`, pos);
    const rt = typeNameOf(r, this.heap);
    return new RuntimeError(
      `Cannot apply '${op}' to a ${lt} and a ${rt}.`,
      pos,
      lt === 'string' || rt === 'string'
        ? 'To turn a string into a number use int.Parse(text). To turn a number into a string use .ToString().'
        : undefined,
    );
  }

  private oneLike(v: Value): Value {
    switch (v.k) {
      case 'double': return mkDouble(1);
      case 'float': return mkFloat(1);
      case 'long': return mkLong(1);
      default: return mkInt(1);
    }
  }

  // ------------------------------------------------------- types and coercion

  literalValue(v: number | string | boolean | null, t: string): Value {
    switch (t) {
      case 'int': return mkInt(v as number);
      case 'long': return mkLong(v as number);
      case 'float': return mkFloat(v as number);
      case 'double': return mkDouble(v as number);
      case 'bool': return mkBool(v as boolean);
      case 'char': return mkChar(v as string);
      case 'string': return this.heap.newString(v as string);
      default: return NULL;
    }
  }

  defaultValueFor(t: TypeRef): Value {
    if (t.rank > 0) return NULL;
    switch (t.name) {
      case 'int': case 'short': case 'byte': case 'uint': return mkInt(0);
      case 'long': case 'ulong': return mkLong(0);
      case 'float': return mkFloat(0);
      case 'double': case 'decimal': return mkDouble(0);
      case 'bool': return mkBool(false);
      case 'char': return mkChar('\0');
      case 'var': return NULL;
      default: {
        const en = this.enums.get(t.name);
        if (en) {
          const first = [...en.members.entries()].find(([, v]) => v === 0) ?? [...en.members.entries()][0];
          if (first) return { k: 'enum', type: t.name, name: first[0], v: first[1] };
        }
        const shim = this.builtins.defaultFor(t);
        if (shim !== undefined) return shim;
        return NULL;
      }
    }
  }

  /** Narrow/widen a value to a declared type, the way an assignment would. */
  coerceToType(v: Value, t: TypeRef, pos: Pos): Value {
    if (t.rank > 0 || t.name === 'var' || t.name === 'object' || t.name === 'void') return v;
    switch (t.name) {
      case 'int': case 'short': case 'byte': case 'uint':
        if (v.k === 'char') return mkInt(v.v.charCodeAt(0));
        if (v.k === 'enum') return mkInt(v.v);
        if (isNumeric(v)) {
          if ((v.k === 'float' || v.k === 'double') && !Number.isInteger(v.v)) {
            throw new RuntimeError(
              `Cannot store the ${v.k} ${v.v} in an int without rounding.`,
              pos,
              `Add an explicit cast: (int)${v.v}, which truncates toward zero.`,
            );
          }
          return mkInt(v.v);
        }
        return v;
      case 'long': case 'ulong':
        return isNumeric(v) ? mkLong(v.v) : v;
      case 'float':
        return isNumeric(v) ? mkFloat(v.v) : v;
      case 'double': case 'decimal':
        return isNumeric(v) ? mkDouble(v.v) : v;
      case 'bool':
        return v;
      case 'char':
        return v;
      case 'string':
        return v;
      default:
        return v;
    }
  }

  private coerceLike(v: Value, existing: Value): Value {
    if (!isNumeric(existing) || !isNumeric(v)) return v;
    switch (existing.k) {
      case 'int': return Number.isInteger(v.v) ? mkInt(v.v) : v;
      case 'long': return mkLong(v.v);
      case 'float': return mkFloat(v.v);
      case 'double': return mkDouble(v.v);
    }
  }

  private coerceToField(cls: ClassInfo, name: string, v: Value): Value {
    for (const c of ancestry(cls)) {
      const f = c.fields.get(name);
      if (f) return this.coerceToType(v, f.decl.type, f.decl.pos);
    }
    return v;
  }

  castTo(v: Value, t: TypeRef, pos: Pos): Value {
    switch (t.name) {
      case 'int': {
        if (v.k === 'char') return mkInt(v.v.charCodeAt(0));
        if (v.k === 'enum') return mkInt(v.v);
        const n = this.toNumeric(v);
        if (n) return mkInt(Math.trunc(n.v));
        break;
      }
      case 'long': {
        const n = this.toNumeric(v);
        if (n) return mkLong(Math.trunc(n.v));
        break;
      }
      case 'float': {
        const n = this.toNumeric(v);
        if (n) return mkFloat(n.v);
        break;
      }
      case 'double': {
        const n = this.toNumeric(v);
        if (n) return mkDouble(n.v);
        break;
      }
      case 'char': {
        const n = this.toNumeric(v);
        if (n) return mkChar(String.fromCharCode(n.v));
        break;
      }
      case 'string':
        if (this.isString(v) || v.k === 'null') return v;
        break;
      case 'object':
        return v;
    }

    const en = this.enums.get(t.name);
    if (en) {
      const n = this.toNumeric(v);
      if (n) {
        const hit = [...en.members.entries()].find(([, mv]) => mv === n.v);
        if (hit) return { k: 'enum', type: t.name, name: hit[0], v: hit[1] };
      }
    }

    // Reference cast: allowed only when the runtime type really is compatible.
    if (v.k === 'null') return v;
    if (this.isOfType(v, t.name)) return v;

    throw this.mkException(
      'InvalidCastException',
      `Cannot cast a ${typeNameOf(v, this.heap)} to ${typeRefToString(t)}.`,
      pos,
    );
  }

  isOfType(v: Value, typeName: string): boolean {
    if (typeName === 'object') return v.k !== 'null';
    switch (v.k) {
      case 'int': return typeName === 'int';
      case 'long': return typeName === 'long';
      case 'float': return typeName === 'float';
      case 'double': return typeName === 'double';
      case 'bool': return typeName === 'bool';
      case 'char': return typeName === 'char';
      case 'enum': return typeName === v.type;
      case 'null': return false;
      case 'void': return false;
      case 'ref': {
        const o = this.heap.tryGet(v.id);
        if (!o) return false;
        if (o.k === 'string') return typeName === 'string';
        if (o.k === 'instance') return isAssignableTo(o.cls, typeName);
        if (o.k === 'list') return typeName === 'List';
        if (o.k === 'dict') return typeName === 'Dictionary';
        if (o.k === 'array') return typeName.endsWith('[]') || typeName === 'Array';
        if (o.k === 'exception') return typeName === 'Exception' || typeName === o.type;
        if (o.k === 'struct') return typeName === o.type;
        return false;
      }
    }
  }

  isString(v: Value): boolean {
    return v.k === 'ref' && this.heap.tryGet(v.id)?.k === 'string';
  }

  stringOf(v: Value): string | undefined {
    if (v.k !== 'ref') return undefined;
    const o = this.heap.tryGet(v.id);
    return o?.k === 'string' ? o.value : undefined;
  }

  asBool(v: Value, e: Expr): boolean {
    if (v.k === 'bool') return v.v;
    const pos = (e as { pos?: Pos }).pos;
    throw new RuntimeError(
      `A condition must be a bool, but this is a ${typeNameOf(v, this.heap)}.`,
      pos,
      isNumeric(v)
        ? 'C# does not treat 0 as false. Compare it explicitly, e.g. `x != 0`.'
        : 'Did you write `=` (assignment) where you meant `==` (comparison)?',
    );
  }

  asInt(v: Value, pos: Pos): number {
    const n = this.toNumeric(v);
    if (!n) throw new RuntimeError(`Expected a whole number but got a ${typeNameOf(v, this.heap)}.`, pos);
    return Math.trunc(n.v);
  }

  // ------------------------------------------------------------- exceptions

  mkException(type: string, message: string, pos?: Pos): CsThrow {
    const ref = this.heap.allocRef({ k: 'exception', type, message });
    return new CsThrow(ref, type, message);
  }

  private toCsThrow(v: Value, pos: Pos): CsThrow {
    if (v.k === 'ref') {
      const o = this.heap.tryGet(v.id);
      if (o?.k === 'exception') return new CsThrow(v, o.type, o.message);
      if (o?.k === 'instance') {
        const msg = o.fields.get('_message') ?? o.autoProps.get('Message');
        return new CsThrow(v, o.cls.name, msg ? this.display(msg) : o.cls.name);
      }
    }
    return new CsThrow(v, 'Exception', this.display(v));
  }

  private exceptionMatches(e: CsThrow, typeName: string): boolean {
    if (typeName === 'Exception') return true;
    if (e.csType === typeName) return true;
    if (typeName === 'SystemException') return true;
    if (typeName === 'ArgumentException' &&
        (e.csType === 'ArgumentNullException' || e.csType === 'ArgumentOutOfRangeException')) return true;
    if (e.value.k === 'ref') {
      const o = this.heap.tryGet(e.value.id);
      if (o?.k === 'instance') return isAssignableTo(o.cls, typeName);
    }
    return false;
  }

  // ---------------------------------------------------------------- display

  /** Console/ToString rendering, honouring a user-defined ToString override. */
  display(v: Value): string {
    if (v.k === 'ref') {
      const o = this.heap.tryGet(v.id);
      if (o?.k === 'instance') {
        const ts = this.findMethods(o.cls, 'ToString').find((m) => m.paramCount === 0);
        if (ts && (ts.decl.body || ts.decl.exprBody)) {
          // ToString may run arbitrary code, so drive its generator to completion.
          const gen = this.invokeMethod(ts, v, [], o.cls, ts.decl.pos);
          let r = gen.next();
          while (!r.done) r = gen.next();
          return this.stringOf(r.value) ?? o.cls.name;
        }
      }
    }
    return toDisplayString(v, this.heap);
  }

  formatValue(v: Value, format?: string): string {
    if (!format) return this.display(v);
    const n = this.toNumeric(v);
    if (n) {
      const m = /^([FfNn])(\d*)$/.exec(format);
      if (m) {
        const digits = m[2] ? parseInt(m[2], 10) : 2;
        const s = n.v.toFixed(digits);
        if (m[1].toLowerCase() === 'n') {
          const [i, f] = s.split('.');
          return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : '');
        }
        return s;
      }
      if (/^[Dd]\d*$/.test(format)) {
        const digits = parseInt(format.slice(1) || '1', 10);
        return String(Math.trunc(n.v)).padStart(digits, '0');
      }
      if (/^[Pp]\d*$/.test(format)) {
        const digits = parseInt(format.slice(1) || '2', 10);
        return (n.v * 100).toFixed(digits) + '%';
      }
    }
    return this.display(v);
  }

  // --------------------------------------------------------- host interface

  write(s: string) {
    if (this.output.length === 0) this.output.push('');
    this.output[this.output.length - 1] += s;
  }

  writeLine(s: string) {
    this.write(s);
    this.output.push('');
  }

  readLine(): string | null {
    if (this.stdinIndex >= this.stdin.length) return null;
    return this.stdin[this.stdinIndex++];
  }

  get outputText(): string {
    const lines = [...this.output];
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines.join('\n');
  }
}

type NumKind = 'int' | 'long' | 'float' | 'double';

/** Members every value answers to, used by the "Color Color" disambiguation. */
const UNIVERSAL_MEMBERS = new Set(['ToString', 'Equals', 'GetHashCode', 'GetType']);

const STRING_METHODS = new Set([
  'ToUpper', 'ToLower', 'Trim', 'TrimStart', 'TrimEnd', 'Substring', 'IndexOf', 'LastIndexOf',
  'Contains', 'StartsWith', 'EndsWith', 'Replace', 'Split', 'ToCharArray', 'PadLeft', 'PadRight',
  'Insert', 'Remove', 'CompareTo',
]);

const LIST_METHODS = new Set([
  'Add', 'AddRange', 'Insert', 'Remove', 'RemoveAt', 'Contains', 'IndexOf', 'Clear', 'Reverse',
  'Sort', 'ToArray', 'ToList',
]);

const DICT_METHODS = new Set([
  'Add', 'ContainsKey', 'ContainsValue', 'Remove', 'Clear', 'TryGetValue',
]);

function accessOf(mods: Modifier[]): Access {
  if (mods.includes('public')) return 'public';
  if (mods.includes('protected')) return 'protected';
  if (mods.includes('internal')) return 'internal';
  return 'private';
}
