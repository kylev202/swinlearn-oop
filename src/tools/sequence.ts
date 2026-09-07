/**
 * Builds a UML sequence diagram from a recorded call trace.
 *
 * Week 3 teaches sequence diagrams (lifelines, activation boxes, call arrows —
 * Quiz 3 Q4/Q9/Q10/Q14) using a fixed Blackjack slide. Deriving one from the
 * student's own run means the notation is attached to code they wrote, and the
 * activation boxes line up with the frames they can see in the memory view.
 */

import type { CallEvent } from '@/engine/runner';

export interface Lifeline {
  /** Internal id, e.g. "Deck#3". */
  id: string;
  /** Displayed label, e.g. "aDeck : Deck". */
  label: string;
  className: string;
  x: number;
  index: number;
}

export interface SequenceMessage {
  from: string;
  to: string;
  label: string;
  kind: 'call' | 'return';
  y: number;
  line: number;
  /** Self-calls are drawn as a loop rather than a straight arrow. */
  self: boolean;
}

export interface Activation {
  lifeline: string;
  top: number;
  bottom: number;
  depth: number;
}

export interface SequenceModel {
  lifelines: Lifeline[];
  messages: SequenceMessage[];
  activations: Activation[];
  width: number;
  height: number;
  truncated: boolean;
}

const COL_W = 168;
const HEAD_Y = 58;
const ROW_H = 34;
const MARGIN_X = 28;

export interface SequenceOptions {
  /** Skip property get/set frames, which otherwise swamp the diagram. */
  hideAccessors?: boolean;
  maxMessages?: number;
}

export function buildSequence(calls: CallEvent[], opts: SequenceOptions = {}): SequenceModel {
  const hideAccessors = opts.hideAccessors ?? true;
  const maxMessages = opts.maxMessages ?? 60;

  const filtered = calls.filter((c) => {
    if (!hideAccessors) return true;
    return !/\.(get|set)$/.test(c.method) && c.method !== '' && !c.method.startsWith('<');
  });

  const truncated = filtered.length > maxMessages;
  const used = filtered.slice(0, maxMessages);

  // Lifelines appear in the order the run first touches them.
  const order: string[] = [];
  const push = (id: string) => { if (id && !order.includes(id)) order.push(id); };
  for (const c of used) { push(c.from); push(c.to); }

  const lifelines: Lifeline[] = order.map((id, index) => {
    const [className, instance] = id.split('#');
    return {
      id,
      className,
      label: instance ? `a${className} : ${className}` : className,
      x: MARGIN_X + index * COL_W + COL_W / 2,
      index,
    };
  });

  const xOf = new Map(lifelines.map((l) => [l.id, l.x]));

  const messages: SequenceMessage[] = [];
  const activations: Activation[] = [];
  const openStack: { lifeline: string; top: number; depth: number }[] = [];

  used.forEach((c, i) => {
    const y = HEAD_Y + (i + 1) * ROW_H;
    messages.push({
      from: c.from,
      to: c.to,
      label: c.kind === 'call'
        ? `${c.method}(${c.args.join(', ')})`
        : c.returnValue
          ? `return ${c.returnValue}`
          : 'return',
      kind: c.kind,
      y,
      line: c.line,
      self: c.from === c.to,
    });

    if (c.kind === 'call') {
      openStack.push({ lifeline: c.to, top: y, depth: openStack.length });
    } else {
      const open = openStack.pop();
      if (open) activations.push({ lifeline: open.lifeline, top: open.top, bottom: y, depth: open.depth });
    }
  });

  const bottom = HEAD_Y + (used.length + 1) * ROW_H + 24;
  for (const open of openStack) {
    activations.push({ lifeline: open.lifeline, top: open.top, bottom, depth: open.depth });
  }

  return {
    lifelines,
    messages,
    activations,
    width: Math.max(MARGIN_X * 2 + lifelines.length * COL_W, 380),
    height: bottom + 16,
    truncated,
  };
}

/** Lifeline x-coordinate lookup for renderers. */
export function lifelineX(model: SequenceModel, id: string): number {
  return model.lifelines.find((l) => l.id === id)?.x ?? MARGIN_X;
}
