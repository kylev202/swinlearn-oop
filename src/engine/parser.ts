/**
 * Recursive-descent parser for the COS20007 C# teaching subset.
 *
 * C# has three genuinely ambiguous spots that a naive parser gets wrong, and
 * students hit all three in weeks 2-5. Each is handled by speculative parsing
 * (save the cursor, try, restore on failure):
 *
 *   1. `Counter c = ...` (local declaration) vs `c.Increment()` (expression).
 *   2. `List<Shape> x` (generic type) vs `a < b` (comparison).
 *   3. `(int)x` (cast) vs `(a) + b` (parenthesised expression).
 */

import { tokenize, type Token, LexError } from './lexer';
import type {
  Accessor, ArrayInitExpr, Block, ClassDecl, CompilationUnit, CtorDecl, EnumDecl, Expr, FieldDecl,
  InterfaceDecl, Member, MethodDecl, Modifier, Param, Pos, PropertyDecl, Stmt, TypeDecl, TypeRef,
} from './ast';

export class ParseError extends Error {
  constructor(message: string, public line: number, public col: number, public hint?: string) {
    super(message);
    this.name = 'ParseError';
  }
}

const MODIFIERS = new Set<string>([
  'public', 'private', 'protected', 'internal', 'static', 'abstract',
  'virtual', 'override', 'sealed', 'readonly', 'const',
]);

const BUILTIN_TYPES = new Set([
  'int', 'float', 'double', 'string', 'bool', 'char', 'void', 'object',
  'long', 'short', 'byte', 'decimal', 'uint', 'ulong', 'var',
]);

/** Binary operator precedence, higher binds tighter. */
const BINARY_PRECEDENCE: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '|': 3,
  '^': 4,
  '&': 5,
  '==': 6, '!=': 6,
  '<': 7, '>': 7, '<=': 7, '>=': 7,
  '<<': 8, '>>': 8,
  '+': 9, '-': 9,
  '*': 10, '/': 10, '%': 10,
};

const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '??=']);

export function parse(src: string): CompilationUnit {
  const tokens = tokenize(src);
  return new Parser(tokens, src).parseUnit();
}

class Parser {
  private i = 0;

  constructor(private tokens: Token[], private src: string) {}

  // ------------------------------------------------------------- token helpers

  private get cur(): Token { return this.tokens[this.i]; }
  private peek(o = 0): Token { return this.tokens[Math.min(this.i + o, this.tokens.length - 1)]; }
  private get pos(): Pos { return { line: this.cur.line, col: this.cur.col }; }

  /** Getter-based narrowing confuses TS across next(); this stays opaque. */
  private atEof(): boolean {
    return this.tokens[this.i].type === 'eof';
  }

  private at(value: string): boolean {
    const t = this.cur;
    return (t.type === 'punct' || t.type === 'keyword') && t.value === value;
  }
  private atAny(...values: string[]): boolean { return values.some((v) => this.at(v)); }
  private atIdent(): boolean { return this.cur.type === 'ident'; }

  private next(): Token { return this.tokens[this.i++]; }

  private eat(value: string): boolean {
    if (this.at(value)) { this.i++; return true; }
    return false;
  }

  private expect(value: string, hint?: string): Token {
    if (this.at(value)) return this.next();
    throw new ParseError(
      `Expected '${value}' but found ${this.describe(this.cur)}.`,
      this.cur.line, this.cur.col, hint,
    );
  }

  private expectIdent(what: string): string {
    if (this.cur.type === 'ident') return this.next().value;
    // Contextual keywords are legal identifiers in some spots (e.g. `value`).
    if (this.cur.type === 'keyword' && (this.cur.value === 'value' || this.cur.value === 'get' || this.cur.value === 'set')) {
      return this.next().value;
    }
    throw new ParseError(
      `Expected ${what} but found ${this.describe(this.cur)}.`,
      this.cur.line, this.cur.col,
    );
  }

  private describe(t: Token): string {
    if (t.type === 'eof') return 'the end of the file';
    if (t.type === 'string') return 'a string';
    if (t.type === 'interp') return 'an interpolated string';
    return `'${t.value}'`;
  }

  /** Run `fn`; if it throws a ParseError, rewind the cursor and return undefined. */
  private speculate<T>(fn: () => T): T | undefined {
    const save = this.i;
    try {
      return fn();
    } catch (e) {
      this.i = save;
      if (e instanceof ParseError || e instanceof LexError) return undefined;
      throw e;
    }
  }

  // ------------------------------------------------------------ compilation unit

  parseUnit(): CompilationUnit {
    const unit: CompilationUnit = { usings: [], types: [], topLevel: [] };

    while (this.at('using')) {
      this.next();
      let name = this.expectIdent('a namespace name');
      while (this.eat('.')) name += '.' + this.expectIdent('a namespace part');
      this.expect(';');
      unit.usings.push(name);
    }

    while (!this.atEof()) {
      if (this.at('namespace')) {
        this.next();
        let ns = this.expectIdent('a namespace name');
        while (this.eat('.')) ns += '.' + this.expectIdent('a namespace part');
        if (this.eat(';')) {
          // file-scoped namespace
          while (!this.atEof()) this.collectTypeOrTopLevel(unit, ns);
        } else {
          this.expect('{');
          while (!this.at('}') && !this.atEof()) this.collectTypeOrTopLevel(unit, ns);
          this.expect('}');
        }
        continue;
      }
      this.collectTypeOrTopLevel(unit, undefined);
    }

    return unit;
  }

  private collectTypeOrTopLevel(unit: CompilationUnit, ns: string | undefined) {
    const before = this.i;
    const decl = this.speculate(() => this.parseTypeDecl(ns));
    if (decl) { unit.types.push(decl); return; }

    this.i = before;
    // Not a type declaration -> treat as a top-level statement (C# 9 style).
    const stmt = this.speculate(() => this.parseStatement());
    if (stmt) { unit.topLevel.push(stmt); return; }

    // Neither parsed. Re-run the type parse so the real error surfaces.
    this.i = before;
    this.parseTypeDecl(ns);
  }

  // ------------------------------------------------------------- declarations

  private parseAttributes(): string[] {
    const attrs: string[] = [];
    while (this.at('[')) {
      // Distinguish `[Test]` from an array type by requiring an identifier inside.
      const save = this.i;
      this.next();
      if (!this.atIdent()) { this.i = save; break; }
      for (;;) {
        let name = this.expectIdent('an attribute name');
        // Skip attribute arguments: [Test(Description = "x")]
        if (this.at('(')) {
          let depth = 0;
          do {
            if (this.at('(')) depth++;
            else if (this.at(')')) depth--;
            this.next();
          } while (depth > 0 && !this.atEof());
        }
        attrs.push(name);
        if (!this.eat(',')) break;
      }
      this.expect(']');
    }
    return attrs;
  }

  private parseModifiers(): Modifier[] {
    const mods: Modifier[] = [];
    while (this.cur.type === 'keyword' && MODIFIERS.has(this.cur.value)) {
      mods.push(this.next().value as Modifier);
    }
    return mods;
  }

  private parseTypeDecl(ns: string | undefined): TypeDecl {
    const attributes = this.parseAttributes();
    const pos = this.pos;
    const modifiers = this.parseModifiers();

    if (this.at('enum')) {
      this.next();
      const name = this.expectIdent('an enum name');
      this.expect('{');
      const values: EnumDecl['values'] = [];
      let auto = 0;
      while (!this.at('}')) {
        const vpos = this.pos;
        const vname = this.expectIdent('an enum member name');
        let value = auto;
        if (this.eat('=')) {
          const lit = this.parseExpression();
          if (lit.kind === 'literal' && typeof lit.value === 'number') value = lit.value;
        }
        auto = value + 1;
        values.push({ name: vname, value, pos: vpos });
        if (!this.eat(',')) break;
      }
      this.expect('}');
      this.eat(';');
      return { kind: 'enum', name, modifiers, values, pos, namespace: ns };
    }

    const isInterface = this.at('interface');
    if (!isInterface && !this.at('class') && !this.at('struct')) {
      throw new ParseError(
        `Expected 'class', 'interface' or 'enum' but found ${this.describe(this.cur)}.`,
        this.cur.line, this.cur.col,
        'Top-level code must live inside a class, or be a plain statement.',
      );
    }
    this.next();

    const name = this.expectIdent('a type name');
    // Generic type parameters are parsed and ignored (the subset is not generic).
    if (this.at('<')) this.skipBalanced('<', '>');

    const baseTypes: TypeRef[] = [];
    if (this.eat(':')) {
      do { baseTypes.push(this.parseTypeRef()); } while (this.eat(','));
    }
    // where T : ... constraints
    while (this.atIdent() && this.cur.value === 'where') {
      while (!this.at('{') && !this.atEof()) this.next();
    }

    this.expect('{', `Class '${name}' needs an opening { for its body.`);
    const members: Member[] = [];
    while (!this.at('}') && !this.atEof()) {
      members.push(this.parseMember(name));
    }
    this.expect('}', `Class '${name}' is missing its closing }.`);
    this.eat(';');

    return isInterface
      ? { kind: 'interface', name, modifiers, baseTypes, members, pos, namespace: ns }
      : { kind: 'class', name, modifiers, baseTypes, members, pos, namespace: ns };
  }

  private skipBalanced(open: string, close: string) {
    let depth = 0;
    do {
      if (this.at(open)) depth++;
      else if (this.at(close)) depth--;
      this.next();
    } while (depth > 0 && !this.atEof());
  }

  private parseMember(ownerName: string): Member {
    const attributes = this.parseAttributes();
    const pos = this.pos;
    const modifiers = this.parseModifiers();

    // Nested type declarations are not supported in the subset; report clearly.
    if (this.atAny('class', 'interface', 'enum', 'struct')) {
      throw new ParseError(
        'Nested types are not supported in this playground.',
        this.cur.line, this.cur.col,
        'Move the nested type out to its own top-level class.',
      );
    }

    // Constructor: IDENT '(' where IDENT === the class name.
    if (this.atIdent() && this.cur.value === ownerName && this.peek(1).value === '(') {
      const ctorPos = this.pos;
      const name = this.next().value;
      const params = this.parseParamList();
      let initializer: CtorDecl['initializer'];
      if (this.eat(':')) {
        const initPos = this.pos;
        const target = this.at('this') ? 'this' : 'base';
        if (!this.eat('this') && !this.eat('base')) {
          throw new ParseError(
            "A constructor initialiser must be ': this(...)' or ': base(...)'.",
            this.cur.line, this.cur.col,
          );
        }
        const args = this.parseArgList();
        initializer = { target, args, pos: initPos };
      }
      const body = this.parseBlock();
      return { kind: 'ctor', name, params, modifiers, body, initializer, pos: ctorPos, attributes };
    }

    const type = this.parseTypeRef();
    const nameTok = this.cur;
    const name = this.expectIdent('a member name');

    // Generic method type params -> skip
    if (this.at('<')) this.skipBalanced('<', '>');

    // Method
    if (this.at('(')) {
      const params = this.parseParamList();
      let body: Block | undefined;
      let exprBody: Expr | undefined;
      if (this.eat('=>')) {
        exprBody = this.parseExpression();
        this.expect(';');
      } else if (this.eat(';')) {
        body = undefined; // abstract or interface method
      } else {
        body = this.parseBlock();
      }
      return { kind: 'method', name, returnType: type, params, modifiers, body, exprBody, pos, attributes };
    }

    // Expression-bodied property: public int X => _x;
    if (this.eat('=>')) {
      const exprBody = this.parseExpression();
      this.expect(';');
      return { kind: 'property', name, type, modifiers, accessors: [], exprBody, pos, attributes };
    }

    // Property with accessor block
    if (this.at('{')) {
      this.next();
      const accessors: Accessor[] = [];
      while (!this.at('}') && !this.atEof()) {
        const aPos = this.pos;
        const aMods = this.parseModifiers();
        const which = this.cur.value;
        if (which !== 'get' && which !== 'set') {
          throw new ParseError(
            `Expected 'get' or 'set' inside property '${name}' but found ${this.describe(this.cur)}.`,
            this.cur.line, this.cur.col,
            'A property body may only contain get and set accessors.',
          );
        }
        this.next();
        if (this.eat(';')) {
          accessors.push({ kind: which, auto: true, modifiers: aMods, pos: aPos });
        } else if (this.eat('=>')) {
          const e = this.parseExpression();
          this.expect(';');
          accessors.push({ kind: which, auto: false, exprBody: e, modifiers: aMods, pos: aPos });
        } else {
          accessors.push({ kind: which, auto: false, body: this.parseBlock(), modifiers: aMods, pos: aPos });
        }
      }
      this.expect('}', `Property '${name}' is missing its closing }.`);
      let init: Expr | undefined;
      if (this.eat('=')) { init = this.parseExpression(); this.expect(';'); }
      return { kind: 'property', name, type, modifiers, accessors, init, pos, attributes };
    }

    // Field (possibly several comma-separated declarators; we emit the first
    // and fold the rest by re-reading — the interpreter sees one FieldDecl each).
    let init: Expr | undefined;
    if (this.eat('=')) init = this.parseExpression();
    if (this.at(',')) {
      // Multiple declarators: rewrite as separate fields is handled by caller
      // reading them one at a time, so just consume and warn via a clear error.
      throw new ParseError(
        'Declare one field per statement in this playground.',
        this.cur.line, this.cur.col,
        `Write:  ${typeRefToString(type)} a;  then  ${typeRefToString(type)} b;  on separate lines.`,
      );
    }
    this.expect(';', `Field '${name}' needs a semicolon at the end.`);
    return { kind: 'field', name, type, modifiers, init, pos, attributes };
  }

  private parseParamList(): Param[] {
    this.expect('(');
    const params: Param[] = [];
    while (!this.at(')')) {
      const pPos = this.pos;
      let modifier: Param['modifier'];
      if (this.at('ref')) { this.next(); modifier = 'ref'; }
      else if (this.at('out')) { this.next(); modifier = 'out'; }
      else if (this.at('params')) { this.next(); modifier = 'params'; }
      const type = this.parseTypeRef();
      const name = this.expectIdent('a parameter name');
      let defaultValue: Expr | undefined;
      if (this.eat('=')) defaultValue = this.parseExpression();
      params.push({ name, type, pos: pPos, defaultValue, modifier });
      if (!this.eat(',')) break;
    }
    this.expect(')');
    return params;
  }

  private parseArgList(): Expr[] {
    this.expect('(');
    const args: Expr[] = [];
    while (!this.at(')')) {
      // named argument `name:` -> skip the label, keep positional semantics
      if (this.atIdent() && this.peek(1).value === ':' && this.peek(1).type === 'punct') {
        this.next(); this.next();
      }
      if (this.at('ref') || this.at('out')) this.next();
      args.push(this.parseExpression());
      if (!this.eat(',')) break;
    }
    this.expect(')');
    return args;
  }

  // ---------------------------------------------------------------- type refs

  /**
   * Parse a type reference. Throws if the tokens are not a plausible type,
   * which is what makes speculative local-declaration parsing work.
   */
  private parseTypeRef(): TypeRef {
    const t = this.cur;
    let name: string;

    if (t.type === 'keyword' && BUILTIN_TYPES.has(t.value)) {
      name = this.next().value;
    } else if (t.type === 'ident') {
      name = this.next().value;
      while (this.at('.')) {
        // Qualified type name: SplashKitSDK.Color
        if (this.peek(1).type !== 'ident') break;
        this.next();
        name += '.' + this.next().value;
      }
    } else {
      throw new ParseError(`Expected a type but found ${this.describe(t)}.`, t.line, t.col);
    }

    const args: TypeRef[] = [];
    if (this.at('<')) {
      // Only treat < as generics if it closes cleanly as a type argument list.
      const parsed = this.speculate(() => {
        this.expect('<');
        const list: TypeRef[] = [];
        do { list.push(this.parseTypeRef()); } while (this.eat(','));
        this.expect('>');
        return list;
      });
      if (parsed) args.push(...parsed);
    }

    let nullable = false;
    // `int?` — but not the ternary `cond ? a : b`, which never follows a type here.
    if (this.at('?') && this.peek(1).value !== '?') {
      const save = this.i;
      this.next();
      if (this.atIdent() || this.at('[')) nullable = true;
      else this.i = save;
    }

    let rank = 0;
    while (this.at('[') && this.peek(1).value === ']') {
      this.next(); this.next();
      rank++;
    }

    return { name, args, rank, nullable };
  }

  // --------------------------------------------------------------- statements

  private parseBlock(): Block {
    const pos = this.pos;
    this.expect('{');
    const body: Stmt[] = [];
    while (!this.at('}') && !this.atEof()) body.push(this.parseStatement());
    this.expect('}', 'This block is missing its closing }.');
    return { kind: 'block', body, pos };
  }

  private parseStatement(): Stmt {
    const pos = this.pos;

    if (this.at('{')) return this.parseBlock();
    if (this.eat(';')) return { kind: 'empty', pos };

    if (this.at('if')) {
      this.next();
      this.expect('(');
      const cond = this.parseExpression();
      this.expect(')');
      const then = this.parseStatement();
      let els: Stmt | undefined;
      if (this.eat('else')) els = this.parseStatement();
      return { kind: 'if', cond, then, else: els, pos };
    }

    if (this.at('while')) {
      this.next();
      this.expect('(');
      const cond = this.parseExpression();
      this.expect(')');
      return { kind: 'while', cond, body: this.parseStatement(), pos };
    }

    if (this.at('do')) {
      this.next();
      const body = this.parseStatement();
      this.expect('while');
      this.expect('(');
      const cond = this.parseExpression();
      this.expect(')');
      this.expect(';');
      return { kind: 'doWhile', cond, body, pos };
    }

    if (this.at('for')) {
      this.next();
      this.expect('(');
      let init: Stmt | undefined;
      if (!this.at(';')) init = this.parseSimpleStatement();
      else this.next();
      let cond: Expr | undefined;
      if (!this.at(';')) cond = this.parseExpression();
      this.expect(';');
      const update: Expr[] = [];
      while (!this.at(')')) {
        update.push(this.parseExpression());
        if (!this.eat(',')) break;
      }
      this.expect(')');
      return { kind: 'for', init, cond, update, body: this.parseStatement(), pos };
    }

    if (this.at('foreach')) {
      this.next();
      this.expect('(');
      const varType = this.parseTypeRef();
      const varName = this.expectIdent('a loop variable name');
      this.expect('in', "A foreach loop reads: foreach (Type name in collection).");
      const iterable = this.parseExpression();
      this.expect(')');
      return { kind: 'foreach', varType, varName, iterable, body: this.parseStatement(), pos };
    }

    if (this.at('return')) {
      this.next();
      let value: Expr | undefined;
      if (!this.at(';')) value = this.parseExpression();
      this.expect(';', "A return statement needs a semicolon.");
      return { kind: 'return', value, pos };
    }

    if (this.at('break')) { this.next(); this.expect(';'); return { kind: 'break', pos }; }
    if (this.at('continue')) { this.next(); this.expect(';'); return { kind: 'continue', pos }; }

    if (this.at('throw')) {
      this.next();
      let value: Expr | undefined;
      if (!this.at(';')) value = this.parseExpression();
      this.expect(';');
      return { kind: 'throw', value, pos };
    }

    if (this.at('try')) {
      this.next();
      const block = this.parseBlock();
      const catches: any[] = [];
      while (this.at('catch')) {
        const cPos = this.pos;
        this.next();
        let type: TypeRef | undefined;
        let name: string | undefined;
        if (this.eat('(')) {
          type = this.parseTypeRef();
          if (this.atIdent()) name = this.next().value;
          this.expect(')');
        }
        catches.push({ type, name, body: this.parseBlock(), pos: cPos });
      }
      let fin: Block | undefined;
      if (this.eat('finally')) fin = this.parseBlock();
      return { kind: 'try', block, catches, finally: fin, pos };
    }

    if (this.at('switch')) {
      this.next();
      this.expect('(');
      const subject = this.parseExpression();
      this.expect(')');
      this.expect('{');
      const sections: any[] = [];
      while (!this.at('}') && !this.atEof()) {
        const sPos = this.pos;
        const labels: (Expr | 'default')[] = [];
        while (this.at('case') || this.at('default')) {
          if (this.eat('default')) labels.push('default');
          else { this.next(); labels.push(this.parseExpression()); }
          this.expect(':');
        }
        const body: Stmt[] = [];
        while (!this.at('case') && !this.at('default') && !this.at('}') && !this.atEof()) {
          body.push(this.parseStatement());
        }
        sections.push({ labels, body, pos: sPos });
      }
      this.expect('}');
      return { kind: 'switch', subject, sections, pos };
    }

    // `checked { }` / `unchecked { }` — Lab 2.1 step 13 sends students here.
    if (this.at('checked') || this.at('unchecked')) {
      this.next();
      if (this.at('{')) return this.parseBlock();
    }

    return this.parseSimpleStatement();
  }

  /** A local declaration or an expression statement, terminated by ';'. */
  private parseSimpleStatement(): Stmt {
    const pos = this.pos;

    // Try a local variable declaration first: `Type name (= expr)? (, name)* ;`
    const decl = this.speculate<Stmt>(() => {
      const type = this.parseTypeRef();
      if (!this.atIdent()) throw new ParseError('not a declaration', this.cur.line, this.cur.col);
      const decls: { name: string; init?: Expr; pos: Pos }[] = [];
      do {
        const dPos = this.pos;
        const name = this.expectIdent('a variable name');
        let init: Expr | undefined;
        if (this.eat('=')) init = this.parseExpression();
        decls.push({ name, init, pos: dPos });
      } while (this.eat(','));
      this.expect(';');
      return { kind: 'localVar', type, decls, pos } as Stmt;
    });
    if (decl) return decl;

    const expr = this.parseExpression();
    this.expect(';', 'Statements in C# end with a semicolon.');
    return { kind: 'exprStmt', expr, pos };
  }

  // -------------------------------------------------------------- expressions

  private parseExpression(): Expr { return this.parseAssignment(); }

  private parseAssignment(): Expr {
    const pos = this.pos;
    const left = this.parseTernary();
    if (this.cur.type === 'punct' && ASSIGN_OPS.has(this.cur.value)) {
      const op = this.next().value;
      const value = this.parseAssignment();
      return { kind: 'assign', op, target: left, value, pos };
    }
    return left;
  }

  private parseTernary(): Expr {
    const pos = this.pos;
    const cond = this.parseNullCoalescing();
    if (this.at('?')) {
      this.next();
      const then = this.parseAssignment();
      this.expect(':', 'A ternary reads: condition ? valueIfTrue : valueIfFalse');
      const els = this.parseAssignment();
      return { kind: 'ternary', cond, then, else: els, pos };
    }
    return cond;
  }

  private parseNullCoalescing(): Expr {
    const pos = this.pos;
    let left = this.parseBinary(1);
    while (this.at('??')) {
      this.next();
      const right = this.parseBinary(1);
      left = { kind: 'binary', op: '??', left, right, pos };
    }
    return left;
  }

  private parseBinary(minPrec: number): Expr {
    let left = this.parseIsAs();
    for (;;) {
      const t = this.cur;
      if (t.type !== 'punct') break;
      const prec = BINARY_PRECEDENCE[t.value];
      if (prec === undefined || prec < minPrec) break;
      const pos = this.pos;
      const op = this.next().value;
      const right = this.parseBinary(prec + 1);
      left = { kind: 'binary', op, left, right, pos };
    }
    return left;
  }

  private parseIsAs(): Expr {
    const pos = this.pos;
    let e = this.parseUnary();
    for (;;) {
      if (this.at('is')) {
        this.next();
        const type = this.parseTypeRef();
        let binding: string | undefined;
        if (this.atIdent()) binding = this.next().value;
        e = { kind: 'is', operand: e, type, binding, pos };
      } else if (this.at('as')) {
        this.next();
        e = { kind: 'as', operand: e, type: this.parseTypeRef(), pos };
      } else break;
    }
    return e;
  }

  private parseUnary(): Expr {
    const pos = this.pos;

    if (this.atAny('-', '+', '!', '~')) {
      const op = this.next().value as '-' | '+' | '!' | '~';
      return { kind: 'unary', op, operand: this.parseUnary(), pos };
    }

    if (this.atAny('++', '--')) {
      const op = this.next().value as '++' | '--';
      return { kind: 'update', op, target: this.parseUnary(), prefix: true, pos };
    }

    // Cast `(Type)expr` vs parenthesised `(a) + b`.
    if (this.at('(')) {
      const cast = this.speculate<Expr>(() => {
        this.expect('(');
        const type = this.parseTypeRef();
        this.expect(')');
        // A cast must be followed by something that can start an operand.
        const t = this.cur;
        const startsOperand =
          t.type === 'ident' || t.type === 'int' || t.type === 'real' || t.type === 'string' ||
          t.type === 'char' || t.type === 'interp' ||
          (t.type === 'keyword' && ['this', 'base', 'new', 'true', 'false', 'null'].includes(t.value)) ||
          (t.type === 'keyword' && BUILTIN_TYPES.has(t.value)) ||
          (t.type === 'punct' && (t.value === '(' || t.value === '!' || t.value === '~'));
        // `(a) - b` is subtraction, not a cast, unless the type is a builtin.
        if (!startsOperand) throw new ParseError('not a cast', t.line, t.col);
        if (!BUILTIN_TYPES.has(type.name) && type.rank === 0 && t.type === 'punct' && t.value === '(') {
          throw new ParseError('ambiguous cast', t.line, t.col);
        }
        return { kind: 'cast', type, operand: this.parseUnary(), pos } as Expr;
      });
      if (cast) return cast;
    }

    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let e = this.parsePrimary();
    for (;;) {
      const pos = this.pos;
      if (this.at('.')) {
        this.next();
        const name = this.expectIdent('a member name after the dot');
        e = { kind: 'member', target: e, name, conditional: false, pos };
      } else if (this.at('?.')) {
        this.next();
        const name = this.expectIdent('a member name after ?.');
        e = { kind: 'member', target: e, name, conditional: true, pos };
      } else if (this.at('(')) {
        e = { kind: 'call', callee: e, args: this.parseArgList(), pos };
      } else if (this.at('[')) {
        this.next();
        const index = this.parseExpression();
        this.expect(']');
        e = { kind: 'index', target: e, index, pos };
      } else if (this.atAny('++', '--')) {
        const op = this.next().value as '++' | '--';
        e = { kind: 'update', op, target: e, prefix: false, pos };
      } else break;
    }
    return e;
  }

  private parsePrimary(): Expr {
    const t = this.cur;
    const pos = this.pos;

    switch (t.type) {
      case 'int': {
        this.next();
        const [digits, suffix] = t.value.split('#');
        const isLong = suffix?.includes('l');
        return {
          kind: 'literal',
          value: Number(digits),
          literalType: isLong ? 'long' : 'int',
          pos,
        };
      }
      case 'real': {
        this.next();
        const [digits, suffix] = t.value.split('#');
        return {
          kind: 'literal',
          value: Number(digits),
          literalType: suffix?.includes('f') ? 'float' : 'double',
          pos,
        };
      }
      case 'string':
        this.next();
        return { kind: 'literal', value: t.value, literalType: 'string', pos };
      case 'char':
        this.next();
        return { kind: 'literal', value: t.value, literalType: 'char', pos };
      case 'interp': {
        this.next();
        const parts = (t.parts ?? []).map((p) => {
          if (p.kind === 'text') return p as { kind: 'text'; text: string };
          // Split a trailing format spec such as `:F2` that is not code.
          let src = p.src;
          let format: string | undefined;
          const colon = findFormatColon(src);
          if (colon >= 0) { format = src.slice(colon + 1).trim(); src = src.slice(0, colon); }
          const sub = new Parser(tokenize(src), src);
          return { kind: 'hole' as const, expr: sub.parseExpression(), format };
        });
        return { kind: 'interp', parts, pos };
      }
    }

    if (this.at('true')) { this.next(); return { kind: 'literal', value: true, literalType: 'bool', pos }; }
    if (this.at('false')) { this.next(); return { kind: 'literal', value: false, literalType: 'bool', pos }; }
    if (this.at('null')) { this.next(); return { kind: 'literal', value: null, literalType: 'null', pos }; }
    if (this.at('this')) { this.next(); return { kind: 'this', pos }; }
    if (this.at('base')) { this.next(); return { kind: 'base', pos }; }

    if (this.at('typeof')) {
      this.next();
      this.expect('(');
      const type = this.parseTypeRef();
      this.expect(')');
      return { kind: 'typeof', type, pos };
    }

    if (this.at('new')) {
      this.next();

      // new[] { ... } / new int[5] / new int[] { ... }
      const save = this.i;
      const type = this.parseTypeRef();

      if (type.rank > 0) {
        // `new int[] { 1, 2 }`
        let elements: Expr[] | undefined;
        if (this.at('{')) elements = this.parseInitializerList();
        return { kind: 'newArray', elementType: { ...type, rank: type.rank - 1 }, elements, pos };
      }

      if (this.at('[')) {
        // `new int[5]`
        this.next();
        const size = this.parseExpression();
        this.expect(']');
        let elements: Expr[] | undefined;
        if (this.at('{')) elements = this.parseInitializerList();
        return { kind: 'newArray', elementType: type, size, elements, pos };
      }

      const args = this.at('(') ? this.parseArgList() : [];
      let initializer: Expr[] | undefined;
      if (this.at('{')) initializer = this.parseInitializerList();
      return { kind: 'new', type, args, initializer, pos };
    }

    // Lambda: `x => ...` or `(a, b) => ...`
    if (t.type === 'ident' && this.peek(1).value === '=>') {
      const p = this.next().value;
      this.expect('=>');
      const body = this.at('{') ? this.parseBlock() : this.parseExpression();
      return { kind: 'lambda', params: [p], body, pos };
    }
    if (this.at('(')) {
      const lambda = this.speculate<Expr>(() => {
        this.expect('(');
        const params: string[] = [];
        while (!this.at(')')) {
          if (this.atIdent() && (this.peek(1).value === ',' || this.peek(1).value === ')')) {
            params.push(this.next().value);
          } else {
            // typed lambda parameter: (int x) => ...
            this.parseTypeRef();
            params.push(this.expectIdent('a lambda parameter'));
          }
          if (!this.eat(',')) break;
        }
        this.expect(')');
        this.expect('=>');
        const body = this.at('{') ? this.parseBlock() : this.parseExpression();
        return { kind: 'lambda', params, body, pos } as Expr;
      });
      if (lambda) return lambda;

      this.expect('(');
      const inner = this.parseExpression();
      this.expect(')', 'This parenthesised expression is missing its closing ).');
      return inner;
    }

    if (this.at('{')) {
      return { kind: 'arrayInit', elements: this.parseInitializerList(), pos } as ArrayInitExpr;
    }

    if (t.type === 'ident') {
      this.next();
      return { kind: 'name', name: t.value, pos };
    }

    // Builtin type used as a receiver, e.g. `int.Parse("5")` or `string.Join`.
    if (t.type === 'keyword' && BUILTIN_TYPES.has(t.value)) {
      this.next();
      return { kind: 'name', name: t.value, pos };
    }
    if (t.type === 'keyword' && (t.value === 'value' || t.value === 'get' || t.value === 'set')) {
      this.next();
      return { kind: 'name', name: t.value, pos };
    }

    throw new ParseError(
      `I didn't expect ${this.describe(t)} here.`,
      t.line, t.col,
      'Check for a missing operator, semicolon, or closing bracket just before this point.',
    );
  }

  private parseInitializerList(): Expr[] {
    this.expect('{');
    const elements: Expr[] = [];
    while (!this.at('}')) {
      if (this.at('{')) elements.push({ kind: 'arrayInit', elements: this.parseInitializerList(), pos: this.pos });
      else elements.push(this.parseExpression());
      if (!this.eat(',')) break;
    }
    this.expect('}');
    return elements;
  }
}

/**
 * Find the colon that starts a format specifier in an interpolation hole,
 * ignoring colons inside strings, parentheses, brackets, or a ternary.
 */
function findFormatColon(src: string): number {
  let depth = 0;
  let question = 0;
  let inString: string | null = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === inString) inString = null;
      continue;
    }
    if (c === '"' || c === "'") { inString = c; continue; }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === '?') question++;
    else if (c === ':') {
      if (depth === 0 && question === 0) return i;
      if (question > 0) question--;
    }
  }
  return -1;
}

export function typeRefToString(t: TypeRef): string {
  let s = t.name;
  if (t.args.length) s += '<' + t.args.map(typeRefToString).join(', ') + '>';
  if (t.nullable) s += '?';
  s += '[]'.repeat(t.rank);
  return s;
}
