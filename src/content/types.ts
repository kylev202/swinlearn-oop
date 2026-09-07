/**
 * Content model for the lesson player.
 *
 * Shaped after freeCodeCamp's challenge anatomy (seed code + editable region +
 * a visible test list + escalating hints) with its two-minute rule applied
 * hard: every step teaches exactly one idea and should be finishable in about
 * two minutes. That is the direct antidote to an 8-page lab PDF whose step 4
 * silently contains six separate decisions.
 */

// --------------------------------------------------------------- structure

export type LessonKind = 'concept' | 'practice' | 'lab' | 'quiz' | 'interview';

export interface Week {
  number: number;
  title: string;
  subtitle: string;
  /** Shown on the week card: what they can do by the end. */
  outcomes: string[];
  /** Which source documents this week maps to, for trust. */
  sources: string[];
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  kind: LessonKind;
  /** Realistic minutes, shown up front so nothing feels open-ended. */
  minutes: number;
  summary: string;
  /** Marks this lesson carries in the real unit, if any. */
  assessment?: string;
  steps: Step[];
}

export interface Step {
  id: string;
  title: string;
  blocks: Block[];
  exercise?: Exercise;
}

// ------------------------------------------------------------------ blocks

export type Tool = 'console' | 'memory' | 'uml' | 'sequence' | 'canvas' | 'tests';

export type Block =
  | { t: 'text'; md: string }
  | { t: 'callout'; tone: 'note' | 'warn' | 'tip' | 'key' | 'trap'; title?: string; md: string }
  | { t: 'code'; code: string; caption?: string; lang?: 'csharp' | 'bash' | 'text' }
  | {
      t: 'runnable';
      code: string;
      caption?: string;
      /** Which panel opens by default when the student presses Run. */
      tool?: Tool;
      /** Pre-expand the tool without the student pressing anything. */
      autoRun?: boolean;
    }
  | { t: 'compare'; title?: string; left: ComparePane; right: ComparePane }
  | { t: 'umlSpec'; caption?: string; source: string }
  | {
      t: 'quiz';
      question: string;
      options: string[];
      answer: number;
      /**
       * Why each option is or is not right, index-aligned with `options`.
       * Elaborative feedback beats "wrong, try again": a student who picked C
       * needs to know what C would have been true of.
       */
      why?: string[];
      explain: string;
    }
  | { t: 'table'; headers: string[]; rows: string[][]; caption?: string }
  | Predict
  | Parsons
  | Recall;

// ------------------------------------------------------ active-recall blocks

/**
 * Predict, then run.
 *
 * A demo a student scrolls past teaches nothing; the same demo teaches a lot
 * once they have committed to an answer and been wrong. So the Run button does
 * not exist until a prediction is made, and the result is shown next to what
 * they said rather than on its own.
 */
export interface Predict {
  t: 'predict';
  /** Asked before the code is readable as an answer, e.g. "What prints?" */
  question: string;
  code: string;
  caption?: string;
  /**
   * Multi-line options are rendered as program output; single-line ones as
   * prose with inline markdown, so "It refuses to compile" and a three-line
   * console dump can sit in the same list.
   */
  options: string[];
  answer: number;
  /** Index-aligned with `options`: what that answer would have been true of. */
  why?: string[];
  explain: string;
  /** Which panel opens with the result. Defaults to the console. */
  tool?: Tool;
  /**
   * What the program really does. Asserted against the interpreter in
   * `week2.test.ts`, so a predict block can never drift from reality — the one
   * kind of content bug that would teach a student something false.
   */
  expect: { output?: string; errorContains?: string };
}

/**
 * A Parsons problem: correct lines, wrong order.
 *
 * Ordering code exercises the same schema as writing it without the syntax
 * tax, which is why it belongs in a concept lesson where the editor does not.
 * The scramble is derived from the lines (see `src/tools/parsons.ts`), so it
 * is the same every time — a student comparing notes sees the same puzzle.
 */
export interface Parsons {
  t: 'parsons';
  prompt: string;
  /** The lines in their correct order; leading spaces are shown as indent. */
  lines: string[];
  caption?: string;
  explain?: string;
}

/**
 * Free recall against a checklist.
 *
 * Writing the answer from memory and then marking it yourself is the drill the
 * tutor interview actually is, so the model answer is a list of points to tick
 * off rather than a paragraph to nod along to.
 */
export interface Recall {
  t: 'recall';
  prompt: string;
  /** What a complete answer covers. The student ticks each against their own. */
  points: string[];
  /** Available before they commit, for when the page is a blank wall. */
  nudge?: string;
}

export interface ComparePane {
  title: string;
  md?: string;
  code?: string;
  tone?: 'bad' | 'good' | 'neutral';
}

// --------------------------------------------------------------- exercises

export interface Exercise {
  /** One sentence. If it needs two, it is two steps. */
  prompt: string;
  /** Starter code the student edits. */
  seed: string;
  /**
   * Lines the student may edit, 1-based inclusive. Everything else is locked,
   * which is how fCC keeps a step focused on one idea.
   */
  editable?: { from: number; to: number };
  /** Extra code appended before running, invisible to the student. */
  harness?: string;
  tests: Check[];
  /** Escalating: nudge, then structural, then near-answer. Never the answer. */
  hints: string[];
  tool?: Tool;
  /** Console input lines fed to Console.ReadLine(). */
  stdin?: string[];
}

// ------------------------------------------------------------------ checks

/**
 * A check is one visible row in the test list. `label` is what the student
 * reads, so it is phrased as the requirement, not as an assertion.
 */
export type Check =
  | { kind: 'output'; label: string; expect: string; trim?: boolean }
  | { kind: 'outputContains'; label: string; expect: string }
  | { kind: 'outputMatches'; label: string; pattern: string; flags?: string }
  | { kind: 'runsClean'; label: string }
  | { kind: 'structure'; label: string; rule: StructureRule }
  | { kind: 'nunit'; label: string; source: string }
  | { kind: 'expression'; label: string; expr: string; expect: string; setup?: string }
  | { kind: 'forbid'; label: string; pattern: string; message?: string };

export type StructureRule =
  | {
      on: 'class';
      name: string;
      exists?: boolean;
      isAbstract?: boolean;
      baseType?: string;
      implements?: string;
    }
  | {
      on: 'field';
      inClass: string;
      name: string;
      visibility?: 'public' | 'private' | 'protected' | 'internal';
      type?: string;
      isStatic?: boolean;
      isReadonly?: boolean;
    }
  | {
      on: 'property';
      inClass: string;
      name: string;
      visibility?: 'public' | 'private' | 'protected';
      type?: string;
      hasGet?: boolean;
      hasSet?: boolean;
      isVirtual?: boolean;
      isOverride?: boolean;
    }
  | {
      on: 'method';
      inClass: string;
      name: string;
      visibility?: 'public' | 'private' | 'protected';
      params?: number;
      returns?: string;
      isStatic?: boolean;
      isVirtual?: boolean;
      isOverride?: boolean;
      isAbstract?: boolean;
    }
  | { on: 'ctor'; inClass: string; params: number; visibility?: 'public' | 'private' | 'protected' };

// ------------------------------------------------- interview drill (Week 1+)

/**
 * The lab mark is decided by an interview where the tutor asks why the code is
 * the way it is. These rehearse that, against the student's own submission.
 */
export interface InterviewQuestion {
  id: string;
  question: string;
  /** What a tutor is listening for. Shown after the student self-rates. */
  lookingFor: string[];
  /** Optional pointer back into the code they just wrote. */
  aboutStep?: string;
}
