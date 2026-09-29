/**
 * The Diagram tab: the class diagram your code produces, and — when the lab
 * hands out a target — the one it is asking for, side by side.
 *
 * Every lab in this unit opens with a UML diagram the student is supposed to
 * implement, and the diagram lives in a step they have long since scrolled
 * past by the time they are typing. Reproducing it here turns the task into
 * the comparison it always was: two pictures, spot what is different. The
 * difference list underneath says it in words as well, because "one of these
 * boxes is missing a property" is not something a beginner reliably sees.
 */

import { useMemo, useState } from 'react';

import { parse } from '@/engine/parser';
import { buildUml, diffAgainstSpec, type LaidOutDiagram } from '@/tools/uml';

import { UmlLegend, UmlView } from './UmlView';

type Mode = 'yours' | 'target' | 'both';

export interface UmlPanelProps {
  /** The student's diagram, or null when their code does not parse. */
  model: LaidOutDiagram | null;
  /** C# for the lab's target diagram, if this exercise has one. */
  target?: { source: string; caption?: string };
}

export function UmlPanel({ model, target }: UmlPanelProps) {
  const targetModel = useMemo(() => {
    if (!target) return null;
    try {
      return buildUml(parse(target.source));
    } catch {
      return null;
    }
  }, [target?.source]);

  const [mode, setMode] = useState<Mode>('yours');
  // A target that fails to parse is a content bug, not the student's problem —
  // fall back to the plain single view rather than showing an empty pane.
  const hasTarget = !!targetModel;
  const shown: Mode = hasTarget ? mode : 'yours';

  const gaps = useMemo(() => {
    if (!model || !targetModel) return [];
    return targetModel.classes.flatMap((want) => describeGap(model, targetModel, want.name));
  }, [model, targetModel]);

  return (
    <>
      <div className="diagram-note diagram-note-bar">
        {hasTarget ? (
          <div className="uml-modes" role="tablist" aria-label="Which diagram to show">
            {(
              [
                ['yours', 'Your code', 'The diagram your code produces right now'],
                ['target', 'Target', target?.caption ?? 'The diagram this task is asking for'],
                ['both', 'Compare', 'Both diagrams, side by side'],
              ] as [Mode, string, string][]
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={shown === value}
                title={hint}
                className={`uml-mode${shown === value ? ' active' : ''}`}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span>Generated from the code above — it updates as you type.</span>
        )}

        {shown === 'target' && target?.caption ? (
          <span className="uml-caption">{target.caption}</span>
        ) : (
          model && <UmlLegend model={model} />
        )}
      </div>

      {shown === 'both' ? (
        <div className="diagram-wrap uml-compare">
          <Pane title="Your code" model={model} emptyNote="Fix the syntax errors and your diagram appears here." />
          <Pane title="Target" model={targetModel} emptyNote="" />
        </div>
      ) : (
        <div className="diagram-wrap">
          {shown === 'target' ? (
            <UmlView model={targetModel!} />
          ) : model ? (
            <UmlView model={model} />
          ) : (
            <p className="mem-empty">Fix the syntax errors and the diagram will appear.</p>
          )}
        </div>
      )}

      {hasTarget && shown !== 'target' && (
        <div className="uml-gaps">
          {!model ? (
            <span className="uml-gap-none">Waiting on code that parses.</span>
          ) : gaps.length === 0 ? (
            <span className="uml-gap-ok">
              <span aria-hidden>✓</span> Your classes match the target diagram.
            </span>
          ) : (
            <>
              <span className="uml-gap-head">Still different from the target:</span>
              <ul>
                {gaps.slice(0, 6).map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
              {gaps.length > 6 && <span className="uml-gap-none">…and {gaps.length - 6} more.</span>}
            </>
          )}
        </div>
      )}
    </>
  );
}

function Pane({
  title,
  model,
  emptyNote,
}: {
  title: string;
  model: LaidOutDiagram | null;
  emptyNote: string;
}) {
  return (
    <div className="uml-pane">
      <div className="uml-pane-head">{title}</div>
      {model ? <UmlView model={model} className="uml-stage-pane" /> : <p className="mem-empty">{emptyNote}</p>}
    </div>
  );
}

/**
 * Compare the student's diagram against the target's, class by class, in the
 * words a student can act on.
 *
 * `diffAgainstSpec` already does the comparing; a target *diagram* is just a
 * spec expressed as boxes, so this converts one target class box into a spec
 * and translates the findings. Only the target's classes are checked — extra
 * helper classes a student writes are their business.
 */
function describeGap(mine: LaidOutDiagram, targetModel: LaidOutDiagram, className: string): string[] {
  const want = targetModel.classes.find((c) => c.name === className);
  if (!want) return [];

  const base = targetModel.relations.find(
    (r) => r.from === className && (r.kind === 'inheritance' || r.kind === 'realization'),
  );

  const diff = diffAgainstSpec(mine, {
    className,
    isAbstract: want.isAbstract,
    baseType: base?.to,
    attributes: want.attributes
      .filter((a) => !a.stereotype)
      .map((a) => ({ name: a.name, type: a.type, visibility: a.visibility })),
    properties: want.attributes
      .filter((a) => !!a.stereotype)
      .map((a) => ({ name: a.name, readonly: a.isReadonly })),
    operations: want.operations
      .filter((o) => !o.isConstructor)
      .map((o) => ({ name: o.name, visibility: o.visibility })),
  });

  if (diff.ok) return [];

  // A missing class is one fact, and `diffAgainstSpec` reports it twice — once
  // in `missing` and again as a note. Say it once, in the student's terms.
  if (diff.missing.includes(`class ${className}`)) {
    return [`Your code has no ${className} class yet — the target diagram has one.`];
  }

  const out = diff.missing.map((m) => `${className}: add the ${m}.`);
  for (const w of diff.wrongVisibility) out.push(`${className}: ${w}.`);
  for (const n of diff.notes) out.push(`${className}: ${n}.`);
  return out;
}
