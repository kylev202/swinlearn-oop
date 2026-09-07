/**
 * Generates a UML class diagram from the student's own code.
 *
 * The unit assesses UML twice over (Week 2 lecture, Quiz 2 Q5/Q17, and every
 * lab hands out a target diagram), and students normally draw these by hand in
 * Draw.io with no way to tell whether the picture matches the code they wrote.
 * Here the diagram is derived from the AST, so it is always the truth, and it
 * can be diffed against the lab's target diagram.
 *
 * Relationship inference follows the Week 2 lecture's three categories:
 *   association  — a field whose type is one other user class      (1)
 *   aggregation  — a field holding a collection of a user class    (*)
 *   inheritance  — `: BaseClass`      realization — `: IInterface`
 */

import type { ClassDecl, CompilationUnit, InterfaceDecl, Member, TypeRef } from '@/engine/ast';
import { typeRefToString } from '@/engine/parser';

export type Visibility = '+' | '-' | '#' | '~';

export interface UmlAttribute {
  visibility: Visibility;
  name: string;
  type: string;
  isStatic: boolean;
  isReadonly: boolean;
  /** Properties are shown with a «property» stereotype, as the labs do. */
  stereotype?: string;
}

export interface UmlOperation {
  visibility: Visibility;
  name: string;
  params: string;
  returns: string;
  isStatic: boolean;
  isAbstract: boolean;
  isVirtual: boolean;
  isOverride: boolean;
  isConstructor: boolean;
}

export interface UmlClassBox {
  name: string;
  kind: 'class' | 'interface' | 'enum';
  isAbstract: boolean;
  attributes: UmlAttribute[];
  operations: UmlOperation[];
  /** Filled in by layout(). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export type RelationKind = 'inheritance' | 'realization' | 'aggregation' | 'association';

export interface UmlRelation {
  from: string;
  to: string;
  kind: RelationKind;
  label?: string;
  multiplicity?: string;
}

export interface UmlModel {
  classes: UmlClassBox[];
  relations: UmlRelation[];
  width: number;
  height: number;
}

const BUILTIN_TYPES = new Set([
  'int', 'float', 'double', 'string', 'bool', 'char', 'void', 'object', 'long', 'short', 'byte',
  'decimal', 'uint', 'ulong', 'var', 'List', 'Dictionary', 'Color', 'Point2D', 'Rectangle',
  'Window', 'Random', 'StringBuilder',
]);

const COLLECTION_TYPES = new Set(['List', 'Dictionary', 'IEnumerable', 'ICollection', 'IList']);

function visibilityOf(modifiers: string[]): Visibility {
  if (modifiers.includes('public')) return '+';
  if (modifiers.includes('protected')) return '#';
  if (modifiers.includes('internal')) return '~';
  return '-';
}

/** The user-defined class a type refers to, if any — used for relations. */
function referencedUserType(t: TypeRef, known: Set<string>): { name: string; many: boolean } | undefined {
  if (t.rank > 0 && known.has(t.name)) return { name: t.name, many: true };
  if (COLLECTION_TYPES.has(t.name)) {
    for (const arg of t.args) {
      if (known.has(arg.name)) return { name: arg.name, many: true };
    }
    return undefined;
  }
  if (known.has(t.name)) return { name: t.name, many: false };
  return undefined;
}

export function buildUml(unit: CompilationUnit): UmlModel {
  const known = new Set(unit.types.map((t) => t.name));
  const classes: UmlClassBox[] = [];
  const relations: UmlRelation[] = [];
  const seenRelations = new Set<string>();

  const addRelation = (r: UmlRelation) => {
    const key = `${r.from}->${r.to}:${r.kind}`;
    if (seenRelations.has(key)) return;
    seenRelations.add(key);
    relations.push(r);
  };

  for (const t of unit.types) {
    if (t.kind === 'enum') {
      classes.push({
        name: t.name,
        kind: 'enum',
        isAbstract: false,
        attributes: t.values.map((v) => ({
          visibility: '+' as Visibility,
          name: v.name,
          type: '',
          isStatic: true,
          isReadonly: true,
        })),
        operations: [],
        x: 0, y: 0, w: 0, h: 0,
      });
      continue;
    }

    const decl = t as ClassDecl | InterfaceDecl;
    const attributes: UmlAttribute[] = [];
    const operations: UmlOperation[] = [];

    for (const m of decl.members as Member[]) {
      switch (m.kind) {
        case 'field': {
          attributes.push({
            visibility: visibilityOf(m.modifiers),
            name: m.name,
            type: typeRefToString(m.type),
            isStatic: m.modifiers.includes('static'),
            isReadonly: m.modifiers.includes('readonly') || m.modifiers.includes('const'),
          });
          const ref = referencedUserType(m.type, known);
          if (ref && ref.name !== decl.name) {
            addRelation({
              from: decl.name,
              to: ref.name,
              kind: ref.many ? 'aggregation' : 'association',
              multiplicity: ref.many ? '*' : '1',
              label: m.name,
            });
          }
          break;
        }
        case 'property': {
          const hasSet = m.accessors.some((a) => a.kind === 'set');
          const hasGet = !!m.exprBody || m.accessors.some((a) => a.kind === 'get');
          const stereo = hasGet && !hasSet ? 'readonly, property' : 'property';
          attributes.push({
            visibility: visibilityOf(m.modifiers),
            name: m.name,
            type: typeRefToString(m.type),
            isStatic: m.modifiers.includes('static'),
            isReadonly: !hasSet,
            stereotype: stereo,
          });
          const ref = referencedUserType(m.type, known);
          if (ref && ref.name !== decl.name) {
            addRelation({
              from: decl.name,
              to: ref.name,
              kind: ref.many ? 'aggregation' : 'association',
              multiplicity: ref.many ? '*' : '1',
              label: m.name,
            });
          }
          break;
        }
        case 'method':
          operations.push({
            visibility: visibilityOf(m.modifiers),
            name: m.name,
            params: m.params.map((p) => `${p.name}: ${typeRefToString(p.type)}`).join(', '),
            returns: typeRefToString(m.returnType),
            isStatic: m.modifiers.includes('static'),
            isAbstract: m.modifiers.includes('abstract') || (!m.body && !m.exprBody),
            isVirtual: m.modifiers.includes('virtual'),
            isOverride: m.modifiers.includes('override'),
            isConstructor: false,
          });
          break;
        case 'ctor':
          operations.unshift({
            visibility: visibilityOf(m.modifiers),
            name: m.name,
            params: m.params.map((p) => `${p.name}: ${typeRefToString(p.type)}`).join(', '),
            returns: '',
            isStatic: false,
            isAbstract: false,
            isVirtual: false,
            isOverride: false,
            isConstructor: true,
          });
          break;
      }
    }

    for (const b of decl.baseTypes) {
      if (!known.has(b.name)) continue;
      const target = unit.types.find((x) => x.name === b.name);
      addRelation({
        from: decl.name,
        to: b.name,
        kind: target?.kind === 'interface' ? 'realization' : 'inheritance',
      });
    }

    classes.push({
      name: decl.name,
      kind: decl.kind === 'interface' ? 'interface' : 'class',
      isAbstract: decl.modifiers.includes('abstract'),
      attributes,
      operations,
      x: 0, y: 0, w: 0, h: 0,
    });
  }

  return layout({ classes, relations, width: 0, height: 0 });
}

// ------------------------------------------------------------------- layout

const CHAR_W = 6.3;
const HEADER_H = 30;
const ROW_H = 17;
const PAD_X = 12;
const GAP_X = 56;
const GAP_Y = 66;
const MIN_W = 150;

function boxSize(c: UmlClassBox): { w: number; h: number } {
  const lines: string[] = [c.name];
  for (const a of c.attributes) lines.push(attrLabel(a));
  for (const o of c.operations) lines.push(opLabel(o));
  const w = Math.max(MIN_W, ...lines.map((l) => l.length * CHAR_W + PAD_X * 2));
  const sections = (c.attributes.length ? 1 : 0) + (c.operations.length ? 1 : 0);
  const h = HEADER_H + (c.attributes.length + c.operations.length) * ROW_H + sections * 8 + 10;
  return { w: Math.min(w, 330), h };
}

export function attrLabel(a: UmlAttribute): string {
  const stat = a.isStatic ? 'static ' : '';
  const type = a.type ? `: ${a.type}` : '';
  const stereo = a.stereotype ? ` «${a.stereotype}»` : '';
  return `${a.visibility} ${stat}${a.name}${type}${stereo}`;
}

export function opLabel(o: UmlOperation): string {
  const stat = o.isStatic ? 'static ' : '';
  const ret = o.returns && o.returns !== 'void' ? `: ${o.returns}` : o.returns === 'void' ? '' : '';
  const mods = o.isAbstract ? ' «abstract»' : o.isOverride ? ' «override»' : o.isVirtual ? ' «virtual»' : '';
  return `${o.visibility} ${stat}${o.name}(${o.params})${ret}${mods}`;
}

/**
 * Layered layout: inheritance depth drives the row, so base classes sit above
 * their children the way every lab diagram draws them.
 */
function layout(model: UmlModel): UmlModel {
  const { classes, relations } = model;
  const byName = new Map(classes.map((c) => [c.name, c]));

  const parents = new Map<string, string[]>();
  for (const r of relations) {
    if (r.kind !== 'inheritance' && r.kind !== 'realization') continue;
    parents.set(r.from, [...(parents.get(r.from) ?? []), r.to]);
  }

  const depthCache = new Map<string, number>();
  const depthOf = (name: string, seen = new Set<string>()): number => {
    if (depthCache.has(name)) return depthCache.get(name)!;
    if (seen.has(name)) return 0;
    seen.add(name);
    const ps = parents.get(name) ?? [];
    const d = ps.length ? Math.max(...ps.map((p) => (byName.has(p) ? depthOf(p, seen) + 1 : 0))) : 0;
    depthCache.set(name, d);
    return d;
  };

  const rows = new Map<number, UmlClassBox[]>();
  for (const c of classes) {
    const size = boxSize(c);
    c.w = size.w;
    c.h = size.h;
    const d = depthOf(c.name);
    rows.set(d, [...(rows.get(d) ?? []), c]);
  }

  let y = 24;
  let maxW = 0;
  const sortedDepths = [...rows.keys()].sort((a, b) => a - b);
  for (const d of sortedDepths) {
    const row = rows.get(d)!;
    // Keep children roughly under their parents by sorting on parent position.
    row.sort((a, b) => a.name.localeCompare(b.name));
    let x = 24;
    let rowH = 0;
    for (const c of row) {
      c.x = x;
      c.y = y;
      x += c.w + GAP_X;
      rowH = Math.max(rowH, c.h);
    }
    maxW = Math.max(maxW, x);
    y += rowH + GAP_Y;
  }

  return { classes, relations, width: Math.max(maxW + 8, 360), height: y + 8 };
}

// ------------------------------------------------------- comparing to a spec

export interface UmlSpec {
  className: string;
  attributes?: { name: string; type?: string; visibility?: Visibility }[];
  operations?: { name: string; visibility?: Visibility }[];
  properties?: { name: string; readonly?: boolean }[];
  baseType?: string;
  isAbstract?: boolean;
}

export interface UmlDiff {
  ok: boolean;
  missing: string[];
  wrongVisibility: string[];
  extra: string[];
  notes: string[];
}

/**
 * Compare the student's code against the lab's target UML so the site can say
 * "your Counter is missing the Ticks property" instead of "wrong".
 */
export function diffAgainstSpec(model: UmlModel, spec: UmlSpec): UmlDiff {
  const cls = model.classes.find((c) => c.name === spec.className);
  if (!cls) {
    return {
      ok: false,
      missing: [`class ${spec.className}`],
      wrongVisibility: [],
      extra: [],
      notes: [`I could not find a class called '${spec.className}'.`],
    };
  }

  const missing: string[] = [];
  const wrongVisibility: string[] = [];
  const notes: string[] = [];

  for (const want of spec.attributes ?? []) {
    const got = cls.attributes.find((a) => a.name === want.name && !a.stereotype);
    if (!got) {
      missing.push(`field ${want.name}`);
      continue;
    }
    if (want.visibility && got.visibility !== want.visibility) {
      wrongVisibility.push(
        `${want.name} should be ${want.visibility === '-' ? 'private' : 'public'} in the diagram, but yours is ${got.visibility === '-' ? 'private' : 'public'}`,
      );
    }
    if (want.type && got.type.toLowerCase() !== want.type.toLowerCase()) {
      notes.push(`${want.name} should be ${want.type}, yours is ${got.type}`);
    }
  }

  for (const want of spec.properties ?? []) {
    const got = cls.attributes.find((a) => a.name === want.name && a.stereotype);
    if (!got) {
      missing.push(`property ${want.name}`);
      continue;
    }
    if (want.readonly && !got.isReadonly) {
      notes.push(`${want.name} is marked read-only in the diagram, so it should have a get but no set`);
    }
    if (want.readonly === false && got.isReadonly) {
      notes.push(`${want.name} needs both get and set`);
    }
  }

  for (const want of spec.operations ?? []) {
    const got = cls.operations.find((o) => o.name === want.name);
    if (!got) missing.push(`method ${want.name}()`);
  }

  if (spec.isAbstract && !cls.isAbstract) notes.push(`${spec.className} should be declared abstract`);

  if (spec.baseType) {
    const rel = model.relations.find(
      (r) => r.from === spec.className && (r.kind === 'inheritance' || r.kind === 'realization'),
    );
    if (!rel || rel.to !== spec.baseType) {
      missing.push(`inheritance from ${spec.baseType}`);
    }
  }

  return {
    ok: missing.length === 0 && wrongVisibility.length === 0 && notes.length === 0,
    missing,
    wrongVisibility,
    extra: [],
    notes,
  };
}
