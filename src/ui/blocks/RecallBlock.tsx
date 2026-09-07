/**
 * Free recall, then mark your own answer against a checklist.
 *
 * The lab mark is decided in an interview where a tutor asks why the code is
 * the way it is, so the useful drill is producing the explanation from an
 * empty page — not recognising it in a list of four options. Reading a model
 * answer feels like learning and mostly is not; ticking your own sentences
 * off against the points a tutor listens for is a much harder thing to fake.
 *
 * The checklist stays hidden until they have written something, because it
 * cannot be unseen.
 */

import type { Recall } from '@/content/types';
import type { RecallState } from '@/state/progress';

import { InlineMd, Markdown } from '../Markdown';

/** Enough to be an attempt, short enough not to nag. */
const MIN_CHARS = 25;

export function RecallBlock({
  block,
  state,
  onChange,
}: {
  block: Recall;
  state?: RecallState;
  onChange: (next: RecallState) => void;
}) {
  const text = state?.text ?? '';
  const shown = state?.shown ?? false;
  const got = state?.got ?? [];
  const ready = text.trim().length >= MIN_CHARS;

  const toggle = (i: number) =>
    onChange({
      ...state,
      got: got.includes(i) ? got.filter((g) => g !== i) : [...got, i].sort((a, b) => a - b),
    });

  return (
    <div className={`ask recall${shown ? ' is-solved' : ''}`}>
      <div className="ask-head">
        <span className="ask-badge">From memory</span>
      </div>

      <div className="recall-prompt">
        <Markdown md={block.prompt} />
      </div>

      <textarea
        className="recall-pad"
        value={text}
        aria-label={block.prompt}
        placeholder="Say it in your own words. Nobody is marking the spelling."
        rows={5}
        onChange={(e) => onChange({ ...state, text: e.target.value })}
      />

      {!shown && (
        <div className="recall-foot">
          <button className="primary" disabled={!ready} onClick={() => onChange({ ...state, shown: true })}>
            I've written mine
          </button>
          <span className="recall-hint">
            {ready
              ? 'Then mark your own answer against what a tutor listens for.'
              : `The checklist cannot be unseen, so write first — a sentence or two is plenty (${text.trim().length}/${MIN_CHARS}).`}
          </span>
        </div>
      )}

      {!shown && block.nudge && (
        <details className="recall-nudge">
          <summary>Stuck on where to start?</summary>
          <Markdown md={block.nudge} />
        </details>
      )}

      {shown && (
        <div className="recall-check">
          <div className="recall-check-head">
            <span>What a tutor is listening for</span>
            <span className="recall-score">
              {got.length} of {block.points.length} covered
            </span>
          </div>
          <ul className="recall-points">
            {block.points.map((point, i) => (
              <li key={i}>
                <label className={got.includes(i) ? 'got' : ''}>
                  <input type="checkbox" checked={got.includes(i)} onChange={() => toggle(i)} />
                  <span className="recall-tick" aria-hidden>
                    {got.includes(i) ? '✓' : ''}
                  </span>
                  <span>
                    <InlineMd md={point} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="recall-note">
            Tick only what you actually wrote. The ones you did not are the ones to say out loud
            before the interview.
          </div>
        </div>
      )}
    </div>
  );
}
