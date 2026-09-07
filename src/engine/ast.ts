/** AST for the COS20007 C# teaching subset. */

export interface Pos {
  line: number;
  col: number;
}

export interface TypeRef {
  name: string;
  args: TypeRef[];
  /** Array rank: 0 = not an array, 1 = T[], 2 = T[][]. */
  rank: number;
  nullable?: boolean;
}

export type Modifier =
  | 'public' | 'private' | 'protected' | 'internal'
  | 'static' | 'abstract' | 'virtual' | 'override' | 'sealed' | 'readonly' | 'const';

export interface Param {
  name: string;
  type: TypeRef;
  pos: Pos;
  defaultValue?: Expr;
  modifier?: 'ref' | 'out' | 'params';
}

// ---------------------------------------------------------------- declarations

export interface CompilationUnit {
  usings: string[];
  types: TypeDecl[];
  /** Top-level statements (C# 9 style), used by the simplest lessons. */
  topLevel: Stmt[];
}

export type TypeDecl = ClassDecl | InterfaceDecl | EnumDecl;

export interface ClassDecl {
  kind: 'class';
  name: string;
  modifiers: Modifier[];
  baseTypes: TypeRef[];
  members: Member[];
  pos: Pos;
  namespace?: string;
}

export interface InterfaceDecl {
  kind: 'interface';
  name: string;
  modifiers: Modifier[];
  baseTypes: TypeRef[];
  members: Member[];
  pos: Pos;
  namespace?: string;
}

export interface EnumDecl {
  kind: 'enum';
  name: string;
  modifiers: Modifier[];
  values: { name: string; value: number; pos: Pos }[];
  pos: Pos;
  namespace?: string;
}

export type Member = FieldDecl | MethodDecl | CtorDecl | PropertyDecl;

export interface FieldDecl {
  kind: 'field';
  name: string;
  type: TypeRef;
  modifiers: Modifier[];
  init?: Expr;
  pos: Pos;
  /** Attributes such as [Test] are captured but only NUnit ones are meaningful. */
  attributes: string[];
}

export interface MethodDecl {
  kind: 'method';
  name: string;
  returnType: TypeRef;
  params: Param[];
  modifiers: Modifier[];
  body?: Block;
  /** Expression-bodied member: int Foo() => 1; */
  exprBody?: Expr;
  pos: Pos;
  attributes: string[];
}

export interface CtorDecl {
  kind: 'ctor';
  name: string;
  params: Param[];
  modifiers: Modifier[];
  body: Block;
  /** : this(...) or : base(...) */
  initializer?: { target: 'this' | 'base'; args: Expr[]; pos: Pos };
  pos: Pos;
  attributes: string[];
}

export interface Accessor {
  kind: 'get' | 'set';
  body?: Block;
  exprBody?: Expr;
  /** Auto-accessor: `get;` with no body. */
  auto: boolean;
  modifiers: Modifier[];
  pos: Pos;
}

export interface PropertyDecl {
  kind: 'property';
  name: string;
  type: TypeRef;
  modifiers: Modifier[];
  accessors: Accessor[];
  /** Expression-bodied property: public int X => _x; */
  exprBody?: Expr;
  /** Auto-property initialiser: public int X { get; set; } = 5; */
  init?: Expr;
  pos: Pos;
  attributes: string[];
}

// ------------------------------------------------------------------ statements

export type Stmt =
  | Block
  | LocalVarStmt
  | ExprStmt
  | IfStmt
  | WhileStmt
  | DoWhileStmt
  | ForStmt
  | ForeachStmt
  | ReturnStmt
  | BreakStmt
  | ContinueStmt
  | ThrowStmt
  | TryStmt
  | SwitchStmt
  | EmptyStmt;

export interface Block { kind: 'block'; body: Stmt[]; pos: Pos }
export interface LocalVarStmt {
  kind: 'localVar';
  type: TypeRef;
  decls: { name: string; init?: Expr; pos: Pos }[];
  pos: Pos;
}
export interface ExprStmt { kind: 'exprStmt'; expr: Expr; pos: Pos }
export interface IfStmt { kind: 'if'; cond: Expr; then: Stmt; else?: Stmt; pos: Pos }
export interface WhileStmt { kind: 'while'; cond: Expr; body: Stmt; pos: Pos }
export interface DoWhileStmt { kind: 'doWhile'; cond: Expr; body: Stmt; pos: Pos }
export interface ForStmt {
  kind: 'for';
  init?: Stmt;
  cond?: Expr;
  update: Expr[];
  body: Stmt;
  pos: Pos;
}
export interface ForeachStmt {
  kind: 'foreach';
  varType: TypeRef;
  varName: string;
  iterable: Expr;
  body: Stmt;
  pos: Pos;
}
export interface ReturnStmt { kind: 'return'; value?: Expr; pos: Pos }
export interface BreakStmt { kind: 'break'; pos: Pos }
export interface ContinueStmt { kind: 'continue'; pos: Pos }
export interface ThrowStmt { kind: 'throw'; value?: Expr; pos: Pos }
export interface TryStmt {
  kind: 'try';
  block: Block;
  catches: { type?: TypeRef; name?: string; body: Block; pos: Pos }[];
  finally?: Block;
  pos: Pos;
}
export interface SwitchStmt {
  kind: 'switch';
  subject: Expr;
  sections: { labels: (Expr | 'default')[]; body: Stmt[]; pos: Pos }[];
  pos: Pos;
}
export interface EmptyStmt { kind: 'empty'; pos: Pos }

// ----------------------------------------------------------------- expressions

export type Expr =
  | LiteralExpr
  | InterpExpr
  | NameExpr
  | ThisExpr
  | BaseExpr
  | MemberExpr
  | IndexExpr
  | CallExpr
  | NewExpr
  | NewArrayExpr
  | ArrayInitExpr
  | UnaryExpr
  | BinaryExpr
  | AssignExpr
  | UpdateExpr
  | TernaryExpr
  | CastExpr
  | IsExpr
  | AsExpr
  | TypeofExpr
  | LambdaExpr;

export interface LiteralExpr {
  kind: 'literal';
  value: number | string | boolean | null;
  /** The declared C# type of the literal, used for int-vs-float division. */
  literalType: 'int' | 'long' | 'float' | 'double' | 'string' | 'char' | 'bool' | 'null';
  pos: Pos;
}
export interface InterpExpr {
  kind: 'interp';
  parts: ({ kind: 'text'; text: string } | { kind: 'hole'; expr: Expr; format?: string })[];
  pos: Pos;
}
export interface NameExpr { kind: 'name'; name: string; pos: Pos }
export interface ThisExpr { kind: 'this'; pos: Pos }
export interface BaseExpr { kind: 'base'; pos: Pos }
export interface MemberExpr {
  kind: 'member';
  target: Expr;
  name: string;
  /** ?. rather than . */
  conditional: boolean;
  pos: Pos;
}
export interface IndexExpr { kind: 'index'; target: Expr; index: Expr; pos: Pos }
export interface CallExpr { kind: 'call'; callee: Expr; args: Expr[]; pos: Pos }
export interface NewExpr {
  kind: 'new';
  type: TypeRef;
  args: Expr[];
  /** Object/collection initialiser: new List<int> { 1, 2, 3 } */
  initializer?: Expr[];
  pos: Pos;
}
export interface NewArrayExpr {
  kind: 'newArray';
  elementType: TypeRef;
  size?: Expr;
  elements?: Expr[];
  pos: Pos;
}
export interface ArrayInitExpr { kind: 'arrayInit'; elements: Expr[]; pos: Pos }
export interface UnaryExpr { kind: 'unary'; op: '-' | '+' | '!' | '~'; operand: Expr; pos: Pos }
export interface BinaryExpr { kind: 'binary'; op: string; left: Expr; right: Expr; pos: Pos }
export interface AssignExpr { kind: 'assign'; op: string; target: Expr; value: Expr; pos: Pos }
export interface UpdateExpr {
  kind: 'update';
  op: '++' | '--';
  target: Expr;
  prefix: boolean;
  pos: Pos;
}
export interface TernaryExpr { kind: 'ternary'; cond: Expr; then: Expr; else: Expr; pos: Pos }
export interface CastExpr { kind: 'cast'; type: TypeRef; operand: Expr; pos: Pos }
export interface IsExpr { kind: 'is'; operand: Expr; type: TypeRef; binding?: string; pos: Pos }
export interface AsExpr { kind: 'as'; operand: Expr; type: TypeRef; pos: Pos }
export interface TypeofExpr { kind: 'typeof'; type: TypeRef; pos: Pos }
export interface LambdaExpr {
  kind: 'lambda';
  params: string[];
  body: Expr | Block;
  pos: Pos;
}
