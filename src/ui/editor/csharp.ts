/**
 * C# language services for the workbench editor.
 *
 * The interesting part is that completion is not a keyword list: it re-uses the
 * unit's own parser, so the names offered are the classes, fields, properties
 * and locals the student has actually written, with the declared type of a
 * variable driving what appears after the dot. When their code does not parse
 * we fall back to the last index that did, which is what keeps suggestions
 * alive mid-keystroke.
 */

import {
  snippetCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { StateEffect } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  hoverTooltip,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';

import { parse } from '@/engine/parser';
import { COLORS } from '@/engine/splashkit';
import type {
  Block as AstBlock,
  ClassDecl,
  CompilationUnit,
  InterfaceDecl,
  Member,
  Stmt,
  TypeRef,
} from '@/engine/ast';

// ------------------------------------------------------------------- index

export interface MemberInfo {
  name: string;
  kind: 'method' | 'property' | 'field' | 'ctor' | 'enumValue';
  /** Rendered signature, e.g. `public int Increment()`. */
  signature: string;
  /** Declared type, for chained member lookup. */
  type: string;
  isPrivate: boolean;
  isStatic: boolean;
  owner: string;
}

export interface TypeInfo {
  name: string;
  kind: 'class' | 'interface' | 'enum';
  bases: string[];
  members: MemberInfo[];
  line: number;
  abstract: boolean;
}

export interface SymbolIndex {
  types: TypeInfo[];
  byName: Map<string, TypeInfo>;
  /** Declared type of every local, parameter and foreach variable, by name. */
  vars: Map<string, string>;
  /** Cursor-line -> enclosing declaration, for the breadcrumb. */
  scopes: { line: number; type: string; member?: string }[];
  parsed: boolean;
}

const EMPTY_INDEX: SymbolIndex = {
  types: [],
  byName: new Map(),
  vars: new Map(),
  scopes: [],
  parsed: false,
};

function typeName(t: TypeRef | undefined): string {
  if (!t) return 'void';
  const args = t.args.length ? `<${t.args.map(typeName).join(', ')}>` : '';
  return `${t.name}${args}${'[]'.repeat(t.rank)}`;
}

function visibility(mods: readonly string[]): string {
  return mods.find((m) => m === 'public' || m === 'private' || m === 'protected' || m === 'internal') ?? 'private';
}

function memberOf(owner: string, m: Member): MemberInfo {
  const isPrivate = visibility(m.modifiers) === 'private';
  const isStatic = m.modifiers.includes('static');
  const pre = [visibility(m.modifiers), ...m.modifiers.filter((x) => x !== visibility(m.modifiers))].join(' ');

  switch (m.kind) {
    case 'method': {
      const params = m.params.map((p) => `${typeName(p.type)} ${p.name}`).join(', ');
      return {
        name: m.name,
        kind: 'method',
        signature: `${pre} ${typeName(m.returnType)} ${m.name}(${params})`,
        type: typeName(m.returnType),
        isPrivate,
        isStatic,
        owner,
      };
    }
    case 'property': {
      const acc = m.accessors.map((a) => `${a.kind};`).join(' ');
      return {
        name: m.name,
        kind: 'property',
        signature: `${pre} ${typeName(m.type)} ${m.name} { ${acc || 'get;'} }`,
        type: typeName(m.type),
        isPrivate,
        isStatic,
        owner,
      };
    }
    case 'ctor': {
      const params = m.params.map((p) => `${typeName(p.type)} ${p.name}`).join(', ');
      return {
        name: m.name,
        kind: 'ctor',
        signature: `${pre} ${m.name}(${params})`,
        type: owner,
        isPrivate,
        isStatic,
        owner,
      };
    }
    default:
      return {
        name: m.name,
        kind: 'field',
        signature: `${pre} ${typeName(m.type)} ${m.name}`,
        type: typeName(m.type),
        isPrivate,
        isStatic,
        owner,
      };
  }
}

/** Collect every declared local so `myCounter.` can find its type. */
function walkStmts(stmts: Stmt[] | undefined, vars: Map<string, string>) {
  if (!stmts) return;
  for (const s of stmts) {
    if (!s) continue;
    switch (s.kind) {
      case 'localVar':
        for (const d of s.decls) vars.set(d.name, typeName(s.type));
        break;
      case 'foreach':
        vars.set(s.varName, typeName(s.varType));
        walkStmts([s.body], vars);
        break;
      case 'block':
        walkStmts(s.body, vars);
        break;
      case 'if':
        walkStmts(s.else ? [s.then, s.else] : [s.then], vars);
        break;
      case 'while':
      case 'doWhile':
        walkStmts([s.body], vars);
        break;
      case 'for':
        walkStmts(s.init ? [s.init, s.body] : [s.body], vars);
        break;
      case 'try':
        walkStmts([s.block, ...s.catches.map((c) => c.body), ...(s.finally ? [s.finally] : [])], vars);
        for (const c of s.catches) if (c.name) vars.set(c.name, typeName(c.type));
        break;
      case 'switch':
        for (const sec of s.sections) walkStmts(sec.body, vars);
        break;
      default:
        break;
    }
  }
}

export function buildIndex(source: string): SymbolIndex {
  let unit: CompilationUnit;
  try {
    unit = parse(source);
  } catch {
    return EMPTY_INDEX;
  }

  const types: TypeInfo[] = [];
  const vars = new Map<string, string>();
  const scopes: SymbolIndex['scopes'] = [];

  walkStmts(unit.topLevel, vars);

  for (const decl of unit.types) {
    if (decl.kind === 'enum') {
      types.push({
        name: decl.name,
        kind: 'enum',
        bases: [],
        abstract: false,
        line: decl.pos.line,
        members: decl.values.map((v) => ({
          name: v.name,
          kind: 'enumValue' as const,
          signature: `${decl.name}.${v.name} = ${v.value}`,
          type: decl.name,
          isPrivate: false,
          isStatic: true,
          owner: decl.name,
        })),
      });
      scopes.push({ line: decl.pos.line, type: decl.name });
      continue;
    }

    const d = decl as ClassDecl | InterfaceDecl;
    types.push({
      name: d.name,
      kind: d.kind,
      bases: d.baseTypes.map(typeName),
      abstract: d.modifiers.includes('abstract'),
      line: d.pos.line,
      members: d.members.map((m) => memberOf(d.name, m)),
    });
    scopes.push({ line: d.pos.line, type: d.name });

    for (const m of d.members) {
      if (m.kind === 'method' || m.kind === 'ctor') {
        for (const p of m.params) vars.set(p.name, typeName(p.type));
        const body: AstBlock | undefined = m.kind === 'ctor' ? m.body : m.body;
        walkStmts(body ? [body] : undefined, vars);
        const label = m.kind === 'ctor' ? `${m.name}()` : `${m.name}()`;
        scopes.push({ line: m.pos.line, type: d.name, member: label });
      } else {
        scopes.push({ line: m.pos.line, type: d.name, member: m.name });
        if (m.kind === 'property') {
          for (const a of m.accessors) walkStmts(a.body ? [a.body] : undefined, vars);
        }
      }
    }
  }

  scopes.sort((a, b) => a.line - b.line);
  return { types, byName: new Map(types.map((t) => [t.name, t])), vars, scopes, parsed: true };
}

/** Every member of a type plus everything it inherits. */
export function allMembers(index: SymbolIndex, name: string, seen = new Set<string>()): MemberInfo[] {
  const info = index.byName.get(name);
  if (!info || seen.has(name)) return [];
  seen.add(name);
  return [...info.members, ...info.bases.flatMap((b) => allMembers(index, b, seen))];
}

/** The declaration the cursor sits inside, for the breadcrumb trail. */
export function scopeAt(index: SymbolIndex, line: number): { type: string; member?: string } | null {
  let best: SymbolIndex['scopes'][number] | null = null;
  for (const s of index.scopes) {
    if (s.line <= line) best = s;
    else break;
  }
  return best ? { type: best.type, member: best.member } : null;
}

// ---------------------------------------------------------------- builtins

interface BuiltinMember {
  name: string;
  detail: string;
  info: string;
  snippet?: string;
}

const fn = (name: string, detail: string, info: string, snippet?: string): BuiltinMember => ({
  name,
  detail,
  info,
  snippet,
});

const CONSOLE: BuiltinMember[] = [
  fn('WriteLine', 'void', 'Writes a line to the console, then a newline.', 'WriteLine(${})'),
  fn('Write', 'void', 'Writes to the console without a newline.', 'Write(${})'),
  fn('ReadLine', 'string', 'Reads one line of input.', 'ReadLine()'),
  fn('ReadKey', 'void', 'Waits for a key press.', 'ReadKey()'),
];

const MATH: BuiltinMember[] = [
  fn('Abs', 'double', 'Absolute value.', 'Abs(${})'),
  fn('Max', 'double', 'The larger of two numbers.', 'Max(${a}, ${b})'),
  fn('Min', 'double', 'The smaller of two numbers.', 'Min(${a}, ${b})'),
  fn('Pow', 'double', 'x raised to the power y.', 'Pow(${x}, ${y})'),
  fn('Sqrt', 'double', 'Square root.', 'Sqrt(${})'),
  fn('Round', 'double', 'Rounds to the nearest whole number.', 'Round(${})'),
  fn('Floor', 'double', 'Rounds down.', 'Floor(${})'),
  fn('Ceiling', 'double', 'Rounds up.', 'Ceiling(${})'),
  fn('Truncate', 'double', 'Drops the fractional part.', 'Truncate(${})'),
  fn('Sign', 'int', '-1, 0 or 1.', 'Sign(${})'),
  fn('Sin', 'double', 'Sine, in radians.', 'Sin(${})'),
  fn('Cos', 'double', 'Cosine, in radians.', 'Cos(${})'),
  fn('Tan', 'double', 'Tangent, in radians.', 'Tan(${})'),
  fn('Log', 'double', 'Natural logarithm.', 'Log(${})'),
  fn('Exp', 'double', 'e raised to a power.', 'Exp(${})'),
  fn('PI', 'double', 'The constant π.'),
];

const CONVERT: BuiltinMember[] = [
  fn('ToInt32', 'int', 'Converts to an int.', 'ToInt32(${})'),
  fn('ToDouble', 'double', 'Converts to a double.', 'ToDouble(${})'),
  fn('ToString', 'string', 'Converts to a string.', 'ToString(${})'),
  fn('ToBoolean', 'bool', 'Converts to a bool.', 'ToBoolean(${})'),
  fn('ToChar', 'char', 'Converts to a char.', 'ToChar(${})'),
];

const STRING_STATIC: BuiltinMember[] = [
  fn('Empty', 'string', 'The empty string, "".'),
  fn('Join', 'string', 'Joins values with a separator.', 'Join(${", "}, ${values})'),
  fn('Format', 'string', 'Formats a template.', 'Format(${})'),
  fn('IsNullOrEmpty', 'bool', 'True when null or "".', 'IsNullOrEmpty(${})'),
];

const STRING_INSTANCE: BuiltinMember[] = [
  fn('Length', 'int', 'How many characters the string has.'),
  fn('Substring', 'string', 'A slice of the string.', 'Substring(${start})'),
  fn('IndexOf', 'int', 'Where a value first occurs, or -1.', 'IndexOf(${})'),
  fn('LastIndexOf', 'int', 'Where a value last occurs, or -1.', 'LastIndexOf(${})'),
  fn('Contains', 'bool', 'True when the string contains a value.', 'Contains(${})'),
  fn('StartsWith', 'bool', 'True when the string starts with a value.', 'StartsWith(${})'),
  fn('EndsWith', 'bool', 'True when the string ends with a value.', 'EndsWith(${})'),
  fn('ToUpper', 'string', 'An upper-case copy.', 'ToUpper()'),
  fn('ToLower', 'string', 'A lower-case copy.', 'ToLower()'),
  fn('Trim', 'string', 'A copy without surrounding whitespace.', 'Trim()'),
  fn('TrimStart', 'string', 'Trims the front.', 'TrimStart()'),
  fn('TrimEnd', 'string', 'Trims the end.', 'TrimEnd()'),
  fn('Replace', 'string', 'Replaces every occurrence.', 'Replace(${old}, ${new})'),
  fn('Split', 'string[]', 'Splits on a separator.', 'Split(${})'),
  fn('PadLeft', 'string', 'Pads to a width on the left.', 'PadLeft(${})'),
  fn('PadRight', 'string', 'Pads to a width on the right.', 'PadRight(${})'),
  fn('ToCharArray', 'char[]', 'The characters as an array.', 'ToCharArray()'),
  fn('ToString', 'string', 'The string itself.', 'ToString()'),
];

const LIST_MEMBERS: BuiltinMember[] = [
  fn('Add', 'void', 'Appends one item.', 'Add(${})'),
  fn('AddRange', 'void', 'Appends every item of another collection.', 'AddRange(${})'),
  fn('Remove', 'bool', 'Removes the first match.', 'Remove(${})'),
  fn('RemoveAt', 'void', 'Removes the item at an index.', 'RemoveAt(${})'),
  fn('Insert', 'void', 'Inserts at an index.', 'Insert(${index}, ${item})'),
  fn('Contains', 'bool', 'True when the list holds the value.', 'Contains(${})'),
  fn('IndexOf', 'int', 'Where an item sits, or -1.', 'IndexOf(${})'),
  fn('Clear', 'void', 'Removes everything.', 'Clear()'),
  fn('Sort', 'void', 'Sorts in place.', 'Sort()'),
  fn('Reverse', 'void', 'Reverses in place.', 'Reverse()'),
  fn('ToArray', 'T[]', 'Copies to an array.', 'ToArray()'),
  fn('Count', 'int', 'How many items the list holds.'),
];

const DICT_MEMBERS: BuiltinMember[] = [
  fn('Add', 'void', 'Adds a key and value.', 'Add(${key}, ${value})'),
  fn('Remove', 'bool', 'Removes a key.', 'Remove(${})'),
  fn('ContainsKey', 'bool', 'True when the key is present.', 'ContainsKey(${})'),
  fn('ContainsValue', 'bool', 'True when the value is present.', 'ContainsValue(${})'),
  fn('TryGetValue', 'bool', 'Looks a key up without throwing.', 'TryGetValue(${key}, out ${value})'),
  fn('Keys', 'ICollection', 'Every key.'),
  fn('Values', 'ICollection', 'Every value.'),
  fn('Count', 'int', 'How many pairs the dictionary holds.'),
  fn('Clear', 'void', 'Removes everything.', 'Clear()'),
];

const ASSERT_MEMBERS: BuiltinMember[] = [
  fn('AreEqual', 'void', 'Fails unless the two values are equal.', 'AreEqual(${expected}, ${actual})'),
  fn('AreNotEqual', 'void', 'Fails when the two values are equal.', 'AreNotEqual(${a}, ${b})'),
  fn('AreSame', 'void', 'Fails unless both names point at the same object.', 'AreSame(${a}, ${b})'),
  fn('AreNotSame', 'void', 'Fails when both names point at the same object.', 'AreNotSame(${a}, ${b})'),
  fn('IsTrue', 'void', 'Fails unless the value is true.', 'IsTrue(${})'),
  fn('IsFalse', 'void', 'Fails unless the value is false.', 'IsFalse(${})'),
  fn('IsNull', 'void', 'Fails unless the value is null.', 'IsNull(${})'),
  fn('IsNotNull', 'void', 'Fails when the value is null.', 'IsNotNull(${})'),
  fn('IsInstanceOf', 'void', 'Fails unless the object is of a type.', 'IsInstanceOf<${T}>(${})'),
  fn('That', 'void', 'Constraint-style assertion.', 'That(${actual}, Is.EqualTo(${expected}))'),
  fn('Fail', 'void', 'Always fails.', 'Fail(${})'),
  fn('Pass', 'void', 'Always passes.', 'Pass()'),
];

const SPLASHKIT: BuiltinMember[] = [
  fn('OpenWindow', 'Window', 'Opens a drawing window.', 'OpenWindow(${"Title"}, ${800}, ${600})'),
  fn('CloseWindow', 'void', 'Closes a window.', 'CloseWindow(${})'),
  fn('ClearScreen', 'void', 'Fills the whole window with a colour.', 'ClearScreen(${Color.White})'),
  fn('RefreshScreen', 'void', 'Shows what you drew and waits for the next frame.', 'RefreshScreen(${60})'),
  fn('ProcessEvents', 'void', 'Reads mouse and keyboard for this frame.', 'ProcessEvents()'),
  fn('QuitRequested', 'bool', 'True once the window is closed.', 'QuitRequested()'),
  fn('FillRectangle', 'void', 'Draws a solid rectangle.', 'FillRectangle(${Color.Red}, ${x}, ${y}, ${w}, ${h})'),
  fn('DrawRectangle', 'void', 'Draws a rectangle outline.', 'DrawRectangle(${Color.Black}, ${x}, ${y}, ${w}, ${h})'),
  fn('FillCircle', 'void', 'Draws a solid circle.', 'FillCircle(${Color.Red}, ${x}, ${y}, ${r})'),
  fn('DrawCircle', 'void', 'Draws a circle outline.', 'DrawCircle(${Color.Black}, ${x}, ${y}, ${r})'),
  fn('FillEllipse', 'void', 'Draws a solid ellipse.', 'FillEllipse(${Color.Red}, ${x}, ${y}, ${w}, ${h})'),
  fn('DrawEllipse', 'void', 'Draws an ellipse outline.', 'DrawEllipse(${Color.Black}, ${x}, ${y}, ${w}, ${h})'),
  fn('DrawLine', 'void', 'Draws a line.', 'DrawLine(${Color.Black}, ${x1}, ${y1}, ${x2}, ${y2})'),
  fn('DrawText', 'void', 'Draws text.', 'DrawText(${"text"}, ${Color.Black}, ${x}, ${y})'),
  fn('MouseClicked', 'bool', 'True on the frame a button is released.', 'MouseClicked(${MouseButton.LeftButton})'),
  fn('MouseDown', 'bool', 'True while a button is held.', 'MouseDown(${MouseButton.LeftButton})'),
  fn('MouseX', 'double', 'Mouse x position.', 'MouseX()'),
  fn('MouseY', 'double', 'Mouse y position.', 'MouseY()'),
  fn('KeyDown', 'bool', 'True while a key is held.', 'KeyDown(${KeyCode.ArrowLeft})'),
  fn('KeyTyped', 'bool', 'True on the frame a key goes down.', 'KeyTyped(${KeyCode.Space})'),
  fn('AnyKeyPressed', 'bool', 'True when any key went down this frame.', 'AnyKeyPressed()'),
  fn('ScreenWidth', 'int', 'Window width.', 'ScreenWidth()'),
  fn('ScreenHeight', 'int', 'Window height.', 'ScreenHeight()'),
  fn('RandomColor', 'Color', 'A random colour.', 'RandomColor()'),
  fn('RandomRGB', 'Color', 'A random opaque colour.', 'RandomRGB(${255})'),
  fn('Delay', 'void', 'Pauses for milliseconds.', 'Delay(${})'),
  fn('PointAt', 'Point2D', 'Makes a point.', 'PointAt(${x}, ${y})'),
  fn('RectangleFrom', 'Rectangle', 'Makes a rectangle.', 'RectangleFrom(${x}, ${y}, ${w}, ${h})'),
  fn('PointInRectangle', 'bool', 'Hit test.', 'PointInRectangle(${pt}, ${rect})'),
];

const COLOR_MEMBERS: BuiltinMember[] = Object.keys(COLORS).map((c) => {
  const [r, g, b] = COLORS[c];
  return { name: c, detail: 'Color', info: `rgb(${r}, ${g}, ${b})` };
});

/** Static entry points, and the members reachable through them. */
const STATIC_MEMBERS: Record<string, BuiltinMember[]> = {
  Console: CONSOLE,
  Math: MATH,
  Convert: CONVERT,
  String: STRING_STATIC,
  Assert: ASSERT_MEMBERS,
  ClassicAssert: ASSERT_MEMBERS,
  SplashKit: SPLASHKIT,
  Color: COLOR_MEMBERS,
  KeyCode: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'Shift'].map(
    (k) => ({ name: k, detail: 'KeyCode', info: `The ${k} key.` }),
  ),
  MouseButton: ['LeftButton', 'RightButton', 'MiddleButton'].map((k) => ({
    name: k,
    detail: 'MouseButton',
    info: `The ${k.replace('Button', '')} mouse button.`,
  })),
};

/** Members reachable on an instance of a builtin type. */
function builtinInstanceMembers(type: string): BuiltinMember[] {
  const base = type.replace(/\[\]$/, '');
  if (type.endsWith('[]')) return [fn('Length', 'int', 'How many slots the array has.')];
  if (base === 'string') return STRING_INSTANCE;
  if (base.startsWith('List')) return LIST_MEMBERS;
  if (base.startsWith('Dictionary')) return DICT_MEMBERS;
  if (base === 'StringBuilder') {
    return [
      fn('Append', 'StringBuilder', 'Appends text.', 'Append(${})'),
      fn('AppendLine', 'StringBuilder', 'Appends text and a newline.', 'AppendLine(${})'),
      fn('ToString', 'string', 'The text built so far.', 'ToString()'),
      fn('Length', 'int', 'How many characters so far.'),
    ];
  }
  if (base === 'Random') {
    return [
      fn('Next', 'int', 'A random int.', 'Next(${max})'),
      fn('NextDouble', 'double', 'A random double between 0 and 1.', 'NextDouble()'),
    ];
  }
  if (['int', 'double', 'float', 'long', 'bool', 'char', 'decimal'].includes(base)) {
    return [fn('ToString', 'string', 'This value as text.', 'ToString()')];
  }
  return [];
}

// --------------------------------------------------------------- keywords

const KEYWORDS: [string, string][] = [
  ['public', 'Visible to everything.'],
  ['private', 'Visible only inside this class — the default, and what encapsulation wants.'],
  ['protected', 'Visible to this class and everything that inherits from it.'],
  ['internal', 'Visible inside this assembly.'],
  ['class', 'Declares a class: the blueprint objects are made from.'],
  ['interface', 'Declares a contract that classes promise to honour.'],
  ['abstract', 'Cannot be created directly; describes what its children share.'],
  ['virtual', 'Marks a method a subclass is allowed to override.'],
  ['override', 'Replaces a virtual or abstract member from the parent.'],
  ['sealed', 'Nothing may inherit from this.'],
  ['static', 'Belongs to the class, not to any one object.'],
  ['readonly', 'Assignable only in the declaration or a constructor.'],
  ['const', 'A compile-time constant.'],
  ['new', 'Creates an object.'],
  ['this', 'The object the method was called on.'],
  ['base', 'The parent class part of this object.'],
  ['return', 'Hands a value back and leaves the method.'],
  ['if', 'Runs a block when a condition is true.'],
  ['else', 'Runs when the matching if did not.'],
  ['while', 'Repeats while a condition holds.'],
  ['for', 'Counting loop.'],
  ['foreach', 'Visits every item of a collection.'],
  ['in', 'Separates the loop variable from the collection.'],
  ['do', 'Runs the body once, then repeats while a condition holds.'],
  ['switch', 'Branches on a value.'],
  ['case', 'One branch of a switch.'],
  ['default', 'The fallback branch, or a type default value.'],
  ['break', 'Leaves the loop or switch section.'],
  ['continue', 'Skips to the next turn of the loop.'],
  ['try', 'Guards a block against exceptions.'],
  ['catch', 'Handles an exception.'],
  ['finally', 'Runs whether or not an exception happened.'],
  ['throw', 'Raises an exception.'],
  ['using', 'Brings a namespace into scope.'],
  ['namespace', 'Groups types under a name.'],
  ['get', 'The read half of a property.'],
  ['set', 'The write half of a property.'],
  ['value', 'The incoming value inside a set accessor.'],
  ['void', 'Returns nothing.'],
  ['var', 'Infers the type from the initialiser.'],
  ['null', 'A reference that points at no object.'],
  ['true', 'The boolean true.'],
  ['false', 'The boolean false.'],
  ['is', 'Type test.'],
  ['as', 'Cast that gives null instead of throwing.'],
  ['out', 'Passes a parameter by reference, to be assigned.'],
  ['ref', 'Passes a parameter by reference.'],
  ['params', 'Accepts any number of trailing arguments.'],
  ['unchecked', 'Lets integer arithmetic wrap instead of throwing.'],
  ['checked', 'Throws on integer overflow.'],
  ['struct', 'A value type.'],
  ['enum', 'A named set of integer constants.'],
];

const TYPES: [string, string][] = [
  ['int', 'A 32-bit whole number.'],
  ['double', 'A 64-bit floating point number.'],
  ['float', 'A 32-bit floating point number.'],
  ['decimal', 'A high-precision decimal.'],
  ['long', 'A 64-bit whole number.'],
  ['bool', 'true or false.'],
  ['char', 'A single character.'],
  ['string', 'Text.'],
  ['object', 'The root of every type.'],
  ['List', 'A resizable list: List<int> numbers = new List<int>();'],
  ['Dictionary', 'Key-value pairs: Dictionary<string, int> ages = new ...;'],
  ['Console', 'Console input and output.'],
  ['Math', 'Maths helpers.'],
  ['Convert', 'Type conversions.'],
  ['Random', 'Random numbers.'],
  ['Exception', 'The base of every exception.'],
  ['ArgumentException', 'A bad argument was passed.'],
  ['InvalidOperationException', 'The object is not in a state that allows this.'],
  ['SplashKit', 'Graphics, input and windows.'],
  ['Color', 'A SplashKit colour.'],
];

const SNIPPETS: Completion[] = [
  snippetCompletion('public class ${Name}\n{\n\t${}\n}', {
    label: 'class',
    detail: 'declaration',
    type: 'class',
    info: 'A public class with an empty body.',
    boost: 40,
  }),
  snippetCompletion('private ${int} _${name};\n\npublic ${int} ${Name}\n{\n\tget { return _${name}; }\n\tset { _${name} = value; }\n}', {
    label: 'propfull',
    detail: 'field + property',
    type: 'property',
    info: 'A private field with a full property in front of it.',
    boost: 38,
  }),
  snippetCompletion('public ${int} ${Name} { get; set; }', {
    label: 'prop',
    detail: 'auto-property',
    type: 'property',
    info: 'An auto-property — the compiler writes the hidden field.',
    boost: 39,
  }),
  snippetCompletion('public ${Name}()\n{\n\t${}\n}', {
    label: 'ctor',
    detail: 'constructor',
    type: 'method',
    info: 'A parameterless constructor.',
    boost: 37,
  }),
  snippetCompletion('public override string ToString()\n{\n\treturn ${};\n}', {
    label: 'override ToString',
    detail: 'method',
    type: 'method',
    info: 'Overrides ToString so the object prints itself.',
    boost: 30,
  }),
  snippetCompletion('foreach (${int} ${item} in ${collection})\n{\n\t${}\n}', {
    label: 'foreach',
    detail: 'loop',
    type: 'keyword',
    boost: 36,
  }),
  snippetCompletion('for (int i = 0; i < ${n}; i++)\n{\n\t${}\n}', {
    label: 'for',
    detail: 'loop',
    type: 'keyword',
    boost: 35,
  }),
  snippetCompletion('while (${condition})\n{\n\t${}\n}', {
    label: 'while',
    detail: 'loop',
    type: 'keyword',
    boost: 34,
  }),
  snippetCompletion('if (${condition})\n{\n\t${}\n}', {
    label: 'if',
    detail: 'branch',
    type: 'keyword',
    boost: 33,
  }),
  snippetCompletion('Console.WriteLine(${});', {
    label: 'cw',
    detail: 'Console.WriteLine',
    type: 'method',
    info: 'Prints a line to the console.',
    boost: 45,
  }),
  snippetCompletion('try\n{\n\t${}\n}\ncatch (${Exception} ex)\n{\n\t${}\n}', {
    label: 'try',
    detail: 'exception handling',
    type: 'keyword',
    boost: 30,
  }),
];

// ------------------------------------------------------------- completion

function toCompletion(m: MemberInfo): Completion {
  const type =
    m.kind === 'method' ? 'method' : m.kind === 'property' ? 'property' : m.kind === 'ctor' ? 'class' : 'variable';
  return {
    label: m.name,
    type,
    detail: m.kind === 'method' ? m.type : m.type,
    info: m.signature,
    apply: m.kind === 'method' ? `${m.name}(` : undefined,
    boost: m.isPrivate ? 0 : 10,
  };
}

function fromBuiltin(b: BuiltinMember): Completion {
  return {
    label: b.name,
    type: b.snippet ? 'method' : 'variable',
    detail: b.detail,
    info: b.info,
    apply: b.snippet && b.snippet.endsWith('()') ? b.snippet : b.snippet ? `${b.name}(` : undefined,
    boost: 5,
  };
}

/**
 * Resolve what sits to the left of the dot to a type name, so the member list
 * is the one that variable can actually offer.
 */
function receiverType(index: SymbolIndex, receiver: string, cursorLine: number): string | null {
  if (receiver === 'this') return scopeAt(index, cursorLine)?.type ?? null;
  if (receiver === 'base') {
    const here = scopeAt(index, cursorLine)?.type;
    const bases = here ? index.byName.get(here)?.bases : undefined;
    return bases?.[0] ?? null;
  }
  if (index.byName.has(receiver)) return receiver;
  const declared = index.vars.get(receiver);
  if (declared) return declared;
  // A field on the enclosing class, reached without `this.`
  const here = scopeAt(index, cursorLine)?.type;
  if (here) {
    const m = allMembers(index, here).find((x) => x.name === receiver);
    if (m) return m.type;
  }
  return null;
}

export function csharpCompletions(getIndex: () => SymbolIndex) {
  return (context: CompletionContext): CompletionResult | null => {
    const index = getIndex();
    const line = context.state.doc.lineAt(context.pos).number;

    // ---- after a dot: members of whatever is on the left
    const dotted = context.matchBefore(/([A-Za-z_]\w*)\s*\.\s*\w*$/);
    if (dotted) {
      const receiver = /^([A-Za-z_]\w*)/.exec(dotted.text)?.[1] ?? '';
      const from = context.pos - (/\w*$/.exec(dotted.text)?.[0].length ?? 0);

      const statics = STATIC_MEMBERS[receiver];
      if (statics) {
        return { from, options: statics.map(fromBuiltin), validFor: /^\w*$/ };
      }

      const type = receiverType(index, receiver, line);
      if (type) {
        const own = allMembers(index, type)
          // A private member is invisible from outside — the interpreter enforces
          // this, so offering it here would only teach the wrong lesson.
          .filter((m) => m.kind !== 'ctor' && (!m.isPrivate || receiver === 'this'))
          .map(toCompletion);
        const builtin = builtinInstanceMembers(type).map(fromBuiltin);
        const options = [...own, ...builtin];
        if (options.length) return { from, options, validFor: /^\w*$/ };
      }
      // Unknown receiver: everything declared anywhere beats nothing.
      const guess = index.types
        .flatMap((t) => t.members)
        .filter((m) => m.kind !== 'ctor' && !m.isPrivate);
      if (guess.length) {
        const seen = new Set<string>();
        const options = guess
          .filter((m) => (seen.has(m.name) ? false : (seen.add(m.name), true)))
          .map(toCompletion);
        return { from, options, validFor: /^\w*$/ };
      }
      return null;
    }

    // ---- a bare word
    const word = context.matchBefore(/[A-Za-z_]\w*/);
    if (!word && !context.explicit) return null;
    const from = word ? word.from : context.pos;

    const here = scopeAt(index, line)?.type;
    const options: Completion[] = [
      ...SNIPPETS,
      ...KEYWORDS.map(([label, info]) => ({ label, type: 'keyword', info, boost: 20 })),
      ...TYPES.map(([label, info]) => ({ label, type: 'type', info, boost: 22 })),
      ...index.types.map((t) => ({
        label: t.name,
        type: t.kind === 'interface' ? 'interface' : t.kind === 'enum' ? 'enum' : 'class',
        detail: t.kind,
        info: `${t.abstract ? 'abstract ' : ''}${t.kind} ${t.name}${t.bases.length ? ` : ${t.bases.join(', ')}` : ''}`,
        boost: 26,
      })),
      ...[...index.vars].map(([name, type]) => ({
        label: name,
        type: 'variable',
        detail: type,
        info: `${type} ${name}`,
        boost: 28,
      })),
      // Members of the class the cursor is inside are reachable unqualified.
      ...(here ? allMembers(index, here).filter((m) => m.kind !== 'ctor').map(toCompletion) : []),
    ];

    const seen = new Set<string>();
    const deduped = options.filter((o) => (seen.has(o.label) ? false : (seen.add(o.label), true)));
    return { from, options: deduped, validFor: /^\w*$/ };
  };
}

// ------------------------------------------------------------------ hover

export function csharpHover(getIndex: () => SymbolIndex) {
  return hoverTooltip((view, pos) => {
    const { text, from } = view.state.doc.lineAt(pos);
    const offset = pos - from;
    const before = /[\w]*$/.exec(text.slice(0, offset))?.[0] ?? '';
    const after = /^[\w]*/.exec(text.slice(offset))?.[0] ?? '';
    const wordStart = offset - before.length;
    const word = before + after;
    if (!word || /^\d/.test(word)) return null;

    const index = getIndex();
    const line = view.state.doc.lineAt(pos).number;

    let title = '';
    let body = '';

    const type = index.byName.get(word);
    if (type) {
      title = `${type.abstract ? 'abstract ' : ''}${type.kind} ${type.name}${
        type.bases.length ? ` : ${type.bases.join(', ')}` : ''
      }`;
      const counts = { field: 0, property: 0, method: 0, ctor: 0, enumValue: 0 };
      for (const m of type.members) counts[m.kind]++;
      body = `${counts.field} field(s) · ${counts.property} propert(ies) · ${counts.method} method(s)`;
    } else if (index.vars.has(word)) {
      title = `${index.vars.get(word)} ${word}`;
      body = 'Local variable or parameter.';
    } else {
      const scope = scopeAt(index, line)?.type;
      const member =
        (scope ? allMembers(index, scope).find((m) => m.name === word) : undefined) ??
        index.types.flatMap((t) => t.members).find((m) => m.name === word);
      if (member) {
        title = member.signature;
        body = `Declared on ${member.owner}.`;
      } else {
        const kw = KEYWORDS.find(([k]) => k === word) ?? TYPES.find(([k]) => k === word);
        if (kw) {
          title = word;
          body = kw[1];
        } else {
          for (const [owner, members] of Object.entries(STATIC_MEMBERS)) {
            const b = members.find((m) => m.name === word);
            if (b) {
              title = `${b.detail} ${owner}.${b.name}`;
              body = b.info;
              break;
            }
          }
        }
      }
    }

    if (!title) return null;

    return {
      pos: from + wordStart,
      end: from + wordStart + word.length,
      // Below the token: above it would sit on top of the run toolbar.
      above: false,
      create() {
        const dom = document.createElement('div');
        dom.className = 'cm-hoverCard';
        const code = document.createElement('div');
        code.className = 'cm-hoverSig';
        code.textContent = title;
        dom.appendChild(code);
        if (body) {
          const p = document.createElement('div');
          p.className = 'cm-hoverBody';
          p.textContent = body;
          dom.appendChild(p);
        }
        return { dom };
      },
    };
  });
}

// ---------------------------------------------- C# keywords Java does not have

/**
 * The Java grammar carries most of C#, but not these. Rather than ship a whole
 * C# grammar for a dozen words, decorate them directly — skipping anything the
 * tree already says is a string or a comment.
 */
const CS_ONLY =
  /\b(foreach|string|bool|object|decimal|uint|ulong|ushort|sbyte|override|virtual|readonly|internal|namespace|using|params|out|ref|base|unchecked|checked|struct|partial|sealed|nameof|get|set|in)\b/g;

/** Words that take a parenthesis but are not calls. */
const NOT_A_CALL = new Set([
  'if', 'while', 'for', 'foreach', 'switch', 'catch', 'using', 'lock', 'return',
  'new', 'typeof', 'sizeof', 'nameof', 'checked', 'unchecked', 'do', 'else',
]);

/** Types the engine provides, so they colour like types before any parse. */
const BUILTIN_TYPES = new Set([
  'Console', 'Math', 'Convert', 'String', 'SplashKit', 'Color', 'Random', 'StringBuilder',
  'List', 'Dictionary', 'KeyCode', 'MouseButton', 'Window', 'Point2D', 'Rectangle',
  'Assert', 'ClassicAssert', 'Is', 'Environment', 'Exception', 'ArgumentException',
  'ArgumentNullException', 'InvalidOperationException', 'NotImplementedException',
  'NotSupportedException', 'FormatException', 'IndexOutOfRangeException',
  'DivideByZeroException', 'NullReferenceException', 'KeyValuePair',
]);

const IDENT = /\b[A-Za-z_]\w*\b/g;
const CALL = /\b([A-Za-z_]\w*)\s*(?=\()/g;
const ATTRIBUTE = /^\s*(\[[A-Z]\w*(?:\([^)]*\))?\])\s*$/;

const keywordMark = Decoration.mark({ class: 'cm-csKeyword' });
const attributeMark = Decoration.mark({ class: 'cm-csAttribute' });
const typeMark = Decoration.mark({ class: 'cm-csType' });
const funcMark = Decoration.mark({ class: 'cm-csFunc' });

/**
 * Semantic colouring the grammar cannot do.
 *
 * Java tags every declared name — a class, a method, a local — as one
 * `Definition`, so out of the box `Counter` and `count` are the same colour.
 * The symbol index knows which is which, so type names and call targets are
 * coloured from the student's own declarations rather than from a guess.
 */
function buildOverlay(view: EditorView, index: SymbolIndex): DecorationSet {
  const marks: { from: number; to: number; deco: Decoration }[] = [];
  const tree = syntaxTree(view.state);
  const types = new Set([...BUILTIN_TYPES, ...index.types.map((t) => t.name)]);

  const inCode = (at: number) => !/String|Comment|Literal/.test(tree.resolveInner(at + 1, 1).name);

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    let m: RegExpExecArray | null;

    CS_ONLY.lastIndex = 0;
    while ((m = CS_ONLY.exec(text)) !== null) {
      const start = from + m.index;
      if (!inCode(start)) continue;
      marks.push({ from: start, to: start + m[0].length, deco: keywordMark });
    }

    IDENT.lastIndex = 0;
    while ((m = IDENT.exec(text)) !== null) {
      if (!types.has(m[0])) continue;
      const start = from + m.index;
      if (!inCode(start)) continue;
      marks.push({ from: start, to: start + m[0].length, deco: typeMark });
    }

    CALL.lastIndex = 0;
    while ((m = CALL.exec(text)) !== null) {
      // A constructor call is a type, and `if (` is not a call at all.
      if (NOT_A_CALL.has(m[1]) || types.has(m[1])) continue;
      const start = from + m.index;
      if (!inCode(start)) continue;
      marks.push({ from: start, to: start + m[1].length, deco: funcMark });
    }

    // Attributes such as [Test] sit on their own line in this subset.
    let line = view.state.doc.lineAt(from);
    while (line.from <= to) {
      const am = ATTRIBUTE.exec(line.text);
      if (am) {
        const start = line.from + line.text.indexOf(am[1]);
        marks.push({ from: start, to: start + am[1].length, deco: attributeMark });
      }
      if (line.to >= view.state.doc.length) break;
      line = view.state.doc.lineAt(line.to + 1);
    }
  }

  marks.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(
    marks.map((x) => x.deco.range(x.from, x.to)),
    true,
  );
}

/**
 * Dispatched when a fresh parse lands, so the overlay recolours a class the
 * moment its declaration becomes valid rather than on the next keystroke.
 */
export const indexChanged = StateEffect.define<null>();

export function csharpOverlay(getIndex: () => SymbolIndex) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildOverlay(view, getIndex());
      }
      update(u: ViewUpdate) {
        const refreshed = u.transactions.some((tr) => tr.effects.some((e) => e.is(indexChanged)));
        if (u.docChanged || u.viewportChanged || refreshed) {
          this.decorations = buildOverlay(u.view, getIndex());
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}
