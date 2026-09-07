/**
 * Runs a step's checks against student code and reports one row per check.
 *
 * Two rules govern the messages here:
 *  1. Say what is missing, never how to write it — the unit assesses these
 *     tasks and interviews students on their own code.
 *  2. Phrase failures against the requirement the student read, so the test
 *     list doubles as a checklist.
 */

import { parse } from './parser';
import { runProgram, runTests, type CompileError } from './runner';
import type { Check, StructureRule } from '@/content/types';
import type { ClassDecl, CompilationUnit, InterfaceDecl } from './ast';
import { typeRefToString } from './parser';

export interface CheckResult {
  label: string;
  passed: boolean;
  detail?: string;
}

export interface CheckRunResult {
  results: CheckResult[];
  allPassed: boolean;
  /** A parse/runtime error that stopped everything before checks could run. */
  error?: CompileError;
  output: string;
}

export interface CheckContext {
  source: string;
  harness?: string;
  stdin?: string[];
  student: { firstName: string; studentId: string };
}

export function runChecks(checks: Check[], ctx: CheckContext): CheckRunResult {
  const full = ctx.harness ? `${ctx.source}\n\n${ctx.harness}` : ctx.source;

  // Parse once: a syntax error fails everything with one clear message.
  let unit: CompilationUnit;
  try {
    unit = parse(full);
  } catch (e) {
    const run = runProgram(full, { student: ctx.student });
    return {
      results: checks.map((c) => ({ label: labelOf(c), passed: false })),
      allPassed: false,
      error: run.error,
      output: '',
    };
  }

  // Run once and reuse for every output-shaped check. `expression` is excluded
  // deliberately: it builds its own driver, and the student's code at that
  // point often has no Main of its own.
  const needsRun = checks.some((c) =>
    ['output', 'outputContains', 'outputMatches', 'runsClean'].includes(c.kind),
  );
  const run = needsRun
    ? runProgram(full, { stdin: ctx.stdin, student: ctx.student, stepBudget: 3_000_000 })
    : undefined;

  const results: CheckResult[] = [];

  for (const check of checks) {
    switch (check.kind) {
      case 'runsClean':
        results.push({
          label: check.label,
          passed: !!run?.ok,
          detail: run?.ok ? undefined : run?.error?.message,
        });
        break;

      case 'output': {
        const actual = check.trim === false ? (run?.output ?? '') : (run?.output ?? '').trim();
        const expect = check.trim === false ? check.expect : check.expect.trim();
        const passed = !!run?.ok && actual === expect;
        results.push({
          label: check.label,
          passed,
          detail: passed
            ? undefined
            : run?.ok
              ? diffText(expect, actual)
              : run?.error?.message,
        });
        break;
      }

      case 'outputContains': {
        const actual = run?.output ?? '';
        const passed = !!run?.ok && actual.includes(check.expect);
        results.push({
          label: check.label,
          passed,
          detail: passed
            ? undefined
            : run?.ok
              ? `I could not find "${check.expect}" in your output.\n\nYour output was:\n${actual || '(nothing)'}`
              : run?.error?.message,
        });
        break;
      }

      case 'outputMatches': {
        const actual = run?.output ?? '';
        const re = new RegExp(check.pattern, check.flags ?? '');
        const passed = !!run?.ok && re.test(actual);
        results.push({
          label: check.label,
          passed,
          detail: passed
            ? undefined
            : run?.ok
              ? `Your output did not have the shape this step needs.\n\nYour output was:\n${actual || '(nothing)'}`
              : run?.error?.message,
        });
        break;
      }

      case 'forbid': {
        const re = new RegExp(check.pattern, 'm');
        const hit = re.test(ctx.source);
        results.push({
          label: check.label,
          passed: !hit,
          detail: hit ? check.message ?? 'This step asks you to solve it a different way.' : undefined,
        });
        break;
      }

      case 'structure': {
        const r = checkStructure(unit, check.rule);
        results.push({ label: check.label, passed: r.passed, detail: r.detail });
        break;
      }

      case 'expression': {
        // Wrap the student's code with a generated entry point so a single
        // expression can be observed without them having written a Main yet.
        const driver = `${full}\n\npublic class __ProbeMain { public static void Main() { ${check.setup ?? ''} Console.Write(${check.expr}); } }`;
        const dr = runProgram(driver, { student: ctx.student, stepBudget: 2_000_000 });
        const actual = (dr.output ?? '').trim();
        const passed = dr.ok && actual === check.expect.trim();
        results.push({
          label: check.label,
          passed,
          detail: passed ? undefined : dr.ok ? diffText(check.expect.trim(), actual) : dr.error?.message,
        });
        break;
      }

      case 'nunit': {
        const tr = runTests(`${full}\n\n${check.source}`, { student: ctx.student });
        const failed = tr.results.filter((r) => !r.passed);
        results.push({
          label: check.label,
          passed: tr.ok,
          detail: tr.error
            ? tr.error.message
            : failed.length
              ? failed.map((f) => `${f.name}: ${f.message ?? 'failed'}`).join('\n')
              : tr.results.length === 0
                ? 'No tests ran.'
                : undefined,
        });
        break;
      }
    }
  }

  const allPassed = results.length > 0 && results.every((r) => r.passed);

  return {
    results,
    allPassed,
    // Only surface a top-level error when it actually broke something. A step
    // whose checks all pass must never show a scary banner.
    error: !allPassed && run && !run.ok ? run.error : undefined,
    output: run?.output ?? '',
  };
}

function labelOf(c: Check): string {
  return (c as { label: string }).label;
}

function diffText(expected: string, actual: string): string {
  if (!actual) return `Expected:\n${expected}\n\nBut your program printed nothing.`;
  const e = expected.split('\n');
  const a = actual.split('\n');
  const firstDiff = e.findIndex((line, i) => line !== a[i]);
  let pointer = '';
  if (firstDiff >= 0) {
    pointer = `\n\nFirst difference on line ${firstDiff + 1}:\n  expected: ${JSON.stringify(e[firstDiff] ?? '')}\n  yours:    ${JSON.stringify(a[firstDiff] ?? '')}`;
  } else if (e.length !== a.length) {
    pointer = `\n\nExpected ${e.length} line(s) but got ${a.length}.`;
  }
  return `Expected:\n${expected}\n\nYours:\n${actual}${pointer}`;
}

// ------------------------------------------------------------ structure

function findType(unit: CompilationUnit, name: string): ClassDecl | InterfaceDecl | undefined {
  const t = unit.types.find((x) => x.name === name);
  if (!t || t.kind === 'enum') return undefined;
  return t;
}

const VIS = ['public', 'private', 'protected', 'internal'] as const;
type Vis = (typeof VIS)[number];

function visibilityOf(modifiers: string[]): Vis {
  for (const v of VIS) if (modifiers.includes(v)) return v;
  return 'private';
}

function checkStructure(unit: CompilationUnit, rule: StructureRule): { passed: boolean; detail?: string } {
  switch (rule.on) {
    case 'class': {
      const t = unit.types.find((x) => x.name === rule.name);
      if (rule.exists === false) {
        return t ? { passed: false, detail: `There should be no class called '${rule.name}'.` } : { passed: true };
      }
      if (!t) {
        return { passed: false, detail: `I could not find a class called '${rule.name}'. Check the spelling and the capital letter.` };
      }
      if (t.kind === 'enum') return { passed: true };
      if (rule.isAbstract && !t.modifiers.includes('abstract')) {
        return { passed: false, detail: `'${rule.name}' needs to be declared abstract.` };
      }
      if (rule.baseType) {
        const has = t.baseTypes.some((b) => b.name === rule.baseType);
        if (!has) return { passed: false, detail: `'${rule.name}' should inherit from '${rule.baseType}'.` };
      }
      if (rule.implements) {
        const has = t.baseTypes.some((b) => b.name === rule.implements);
        if (!has) return { passed: false, detail: `'${rule.name}' should implement '${rule.implements}'.` };
      }
      return { passed: true };
    }

    case 'field': {
      const t = findType(unit, rule.inClass);
      if (!t) return { passed: false, detail: `I could not find the class '${rule.inClass}'.` };
      const f = t.members.find((m) => m.kind === 'field' && m.name === rule.name);
      if (!f || f.kind !== 'field') {
        const near = t.members.find(
          (m) => m.kind === 'field' && m.name.toLowerCase() === rule.name.toLowerCase(),
        );
        return {
          passed: false,
          detail: near
            ? `'${rule.inClass}' has a field spelled differently. The diagram calls it '${rule.name}' — C# is case-sensitive.`
            : `'${rule.inClass}' needs a field called '${rule.name}'.`,
        };
      }
      if (rule.visibility && visibilityOf(f.modifiers) !== rule.visibility) {
        return {
          passed: false,
          detail: `'${rule.name}' should be ${rule.visibility}, but yours is ${visibilityOf(f.modifiers)}. In the UML diagram, ${rule.visibility === 'private' ? '"-" means private' : '"+" means public'}.`,
        };
      }
      if (rule.type && typeRefToString(f.type).toLowerCase() !== rule.type.toLowerCase()) {
        return { passed: false, detail: `'${rule.name}' should be of type ${rule.type}, but yours is ${typeRefToString(f.type)}.` };
      }
      if (rule.isStatic !== undefined && f.modifiers.includes('static') !== rule.isStatic) {
        return { passed: false, detail: `'${rule.name}' should${rule.isStatic ? '' : ' not'} be static.` };
      }
      if (rule.isReadonly !== undefined && f.modifiers.includes('readonly') !== rule.isReadonly) {
        return { passed: false, detail: `'${rule.name}' should${rule.isReadonly ? '' : ' not'} be readonly.` };
      }
      return { passed: true };
    }

    case 'property': {
      const t = findType(unit, rule.inClass);
      if (!t) return { passed: false, detail: `I could not find the class '${rule.inClass}'.` };
      const p = t.members.find((m) => m.kind === 'property' && m.name === rule.name);
      if (!p || p.kind !== 'property') {
        const asField = t.members.find((m) => m.kind === 'field' && m.name === rule.name);
        return {
          passed: false,
          detail: asField
            ? `'${rule.name}' exists, but as a field. The diagram marks it «property», so it needs get/set accessors.`
            : `'${rule.inClass}' needs a property called '${rule.name}'.`,
        };
      }
      const hasGet = !!p.exprBody || p.accessors.some((a) => a.kind === 'get');
      const hasSet = p.accessors.some((a) => a.kind === 'set');
      if (rule.hasGet && !hasGet) {
        return { passed: false, detail: `'${rule.name}' needs a get accessor so its value can be read.` };
      }
      if (rule.hasSet === true && !hasSet) {
        return { passed: false, detail: `'${rule.name}' needs a set accessor so its value can be changed.` };
      }
      if (rule.hasSet === false && hasSet) {
        return {
          passed: false,
          detail: `'${rule.name}' is read-only in the diagram, so it should have a get but no set. Remove the set accessor.`,
        };
      }
      if (rule.visibility && visibilityOf(p.modifiers) !== rule.visibility) {
        return { passed: false, detail: `'${rule.name}' should be ${rule.visibility}.` };
      }
      if (rule.type && typeRefToString(p.type).toLowerCase() !== rule.type.toLowerCase()) {
        return { passed: false, detail: `'${rule.name}' should be of type ${rule.type}, but yours is ${typeRefToString(p.type)}.` };
      }
      if (rule.isVirtual && !p.modifiers.includes('virtual')) {
        return { passed: false, detail: `'${rule.name}' should be marked virtual so a child class can override it.` };
      }
      if (rule.isOverride && !p.modifiers.includes('override')) {
        return { passed: false, detail: `'${rule.name}' should be marked override.` };
      }
      return { passed: true };
    }

    case 'method': {
      const t = findType(unit, rule.inClass);
      if (!t) return { passed: false, detail: `I could not find the class '${rule.inClass}'.` };
      const candidates = t.members.filter((m) => m.kind === 'method' && m.name === rule.name);
      if (!candidates.length) {
        const near = t.members.find(
          (m) => m.kind === 'method' && m.name.toLowerCase() === rule.name.toLowerCase(),
        );
        return {
          passed: false,
          detail: near
            ? `There is a method spelled differently. The diagram calls it '${rule.name}' — check the capital letters.`
            : `'${rule.inClass}' needs a method called '${rule.name}'.`,
        };
      }
      const m = candidates.find(
        (c) => c.kind === 'method' && (rule.params === undefined || c.params.length === rule.params),
      );
      if (!m || m.kind !== 'method') {
        const got = (candidates[0] as { params: unknown[] }).params.length;
        return {
          passed: false,
          detail: `'${rule.name}' should take ${rule.params} parameter(s), but yours takes ${got}.`,
        };
      }
      if (rule.visibility && visibilityOf(m.modifiers) !== rule.visibility) {
        return { passed: false, detail: `'${rule.name}' should be ${rule.visibility}.` };
      }
      if (rule.returns && typeRefToString(m.returnType).toLowerCase() !== rule.returns.toLowerCase()) {
        return {
          passed: false,
          detail: `'${rule.name}' should return ${rule.returns}, but yours returns ${typeRefToString(m.returnType)}.`,
        };
      }
      if (rule.isStatic !== undefined && m.modifiers.includes('static') !== rule.isStatic) {
        return { passed: false, detail: `'${rule.name}' should${rule.isStatic ? '' : ' not'} be static.` };
      }
      if (rule.isVirtual && !m.modifiers.includes('virtual')) {
        return { passed: false, detail: `'${rule.name}' should be marked virtual.` };
      }
      if (rule.isOverride && !m.modifiers.includes('override')) {
        return { passed: false, detail: `'${rule.name}' should be marked override.` };
      }
      if (rule.isAbstract && !m.modifiers.includes('abstract')) {
        return { passed: false, detail: `'${rule.name}' should be marked abstract.` };
      }
      return { passed: true };
    }

    case 'ctor': {
      const t = findType(unit, rule.inClass);
      if (!t) return { passed: false, detail: `I could not find the class '${rule.inClass}'.` };
      const ctors = t.members.filter((m) => m.kind === 'ctor');
      if (!ctors.length) {
        return {
          passed: false,
          detail: `'${rule.inClass}' needs a constructor taking ${rule.params} parameter(s). A constructor has the same name as the class and no return type.`,
        };
      }
      const match = ctors.find((c) => c.kind === 'ctor' && c.params.length === rule.params);
      if (!match) {
        const counts = ctors.map((c) => (c as { params: unknown[] }).params.length).join(', ');
        return {
          passed: false,
          detail: `'${rule.inClass}' needs a constructor taking ${rule.params} parameter(s). Yours takes ${counts}.`,
        };
      }
      return { passed: true };
    }
  }
}
