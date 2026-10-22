/**
 * End-to-end through Concept Focus.
 *
 * The state machine is unit-tested in `src/state/__tests__/focus.test.ts`;
 * what this file proves is that a student can actually reach it — that getting
 * a question wrong surfaces on the board, that the revision note is one click
 * from the miss, and that the mistake really does clear when both halves of
 * the rule are satisfied. That loop is the entire reason the mode exists, so
 * it is the thing worth driving through the real DOM.
 *
 * Queries are scoped to the rail or the page deliberately: the mode puts
 * "Week 2 quiz" in both, and a bare `getByRole` would pass or fail for reasons
 * that have nothing to do with the behaviour under test.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { App } from '../App';
import { reloadFromStorage } from '@/state/progress';
import { QUESTION_BY_ID, questionsOfConcept } from '@/content/focus/bank';

beforeEach(() => {
  localStorage.clear();
  reloadFromStorage();
  Element.prototype.scrollTo = Element.prototype.scrollTo ?? (() => {});
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
});

afterEach(cleanup);

const el = (selector: string) => document.querySelector(selector) as HTMLElement;
const rail = () => within(el('.focus-rail'));
const page = () => within(el('.focus-scroll'));

/**
 * Onboard and open one exam's revision.
 *
 * The exam has to be named now that there are two of them and both cards say
 * "Start the … revision". Everything below this point is about the
 * midsemester material, which is what these tests were written against.
 */
async function enterFocus(exam: 'midsem' | 'final' = 'midsem') {
  render(<App />);
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Amy' } });
  fireEvent.change(screen.getByLabelText('Student ID'), { target: { value: '104321987' } });
  fireEvent.click(screen.getByRole('button', { name: /start learning/i }));
  fireEvent.click(
    await screen.findByRole('button', { name: new RegExp(`Start the ${exam} revision`, 'i') }),
  );
  return await screen.findByText('Do this next');
}

/** An option's text as it lands in the DOM, with the markdown markers gone. */
function asShown(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Answer whichever question is on screen, right or wrong.
 *
 * The question is read from the DOM rather than named by the caller: a weekly
 * quiz and a fix-up deliberately order the same questions differently, so a
 * test that assumed an order would be asserting against its own guess.
 *
 * The option is then found by its *text*, for the same reason one step down —
 * options are shuffled per sitting, so "the button at index `q.answer`" is a
 * guess about this run's permutation rather than a fact about the question.
 */
async function answer(correct: boolean): Promise<string> {
  await waitFor(() => expect(el('.fq')).toBeTruthy());
  const id = el('.fq').dataset.qid as string;
  const q = QUESTION_BY_ID[id];
  const options = within(el('.fq-opts')).getAllByRole('button');
  expect(options.length).toBe(q.options.length);

  const wanted = asShown(q.options[correct ? q.answer : (q.answer + 1) % q.options.length]);
  // A button reads as its A-D marker followed by the option; drop the marker.
  const target = options.find((b) => {
    const marker = b.querySelector('.quiz-marker')?.textContent ?? '';
    return asShown((b.textContent ?? '').slice(marker.length)) === wanted;
  });
  expect(target, `no option reading "${wanted}" on ${id}`).toBeTruthy();
  fireEvent.click(target as HTMLElement);
  return id;
}

/** Answer `count` questions correctly and advance past each. */
async function passDrill(count: number) {
  for (let i = 0; i < count; i++) {
    await answer(true);
    fireEvent.click(page().getByRole('button', { name: /Next →|Finish/ }));
  }
}

describe('concept focus', () => {
  it('opens on the readiness board with the exam conditions stated', async () => {
    await enterFocus();
    expect(page().getByText('10 questions')).toBeInTheDocument();
    expect(page().getByText('Weeks 1–5')).toBeInTheDocument();
    expect(page().getByText(/0% ready/)).toBeInTheDocument();
  });

  it('sends an untouched student to a weekly quiz rather than a mock paper', async () => {
    await enterFocus();
    expect(page().getByRole('button', { name: /Start the quiz/ })).toBeInTheDocument();
  });

  it('turns a wrong answer into a mistake that will not clear itself', async () => {
    await enterFocus();

    fireEvent.click(page().getByRole('button', { name: /Start the quiz/ }));
    const missed = QUESTION_BY_ID[await answer(false)];
    expect(await page().findByText(/Not quite/)).toBeInTheDocument();
    fireEvent.click(page().getByRole('button', { name: 'Leave' }));

    // It is on the board, and the board says what it will take to clear it.
    expect(await page().findByText('Mistakes to clear (1)')).toBeInTheDocument();
    expect(page().getByText('Read the note first')).toBeInTheDocument();

    // Answering correctly is not enough on its own — the note is still unread.
    fireEvent.click(page().getByRole('button', { name: 'Test me' }));
    expect(await page().findByText(/only clears once you have also read/)).toBeInTheDocument();
    await passDrill(questionsOfConcept(missed.conceptId).length);
    fireEvent.click(await page().findByRole('button', { name: /Back to the board/ }));

    expect(await page().findByText('Mistakes to clear (1)')).toBeInTheDocument();
  });

  it('clears the mistake once the note has been read as well', async () => {
    await enterFocus();

    fireEvent.click(page().getByRole('button', { name: /Start the quiz/ }));
    const missed = QUESTION_BY_ID[await answer(false)];
    // The fix-up rule needs two *further* questions on the concept, which
    // `bank.test.ts` guarantees for every concept in the bank.
    expect(questionsOfConcept(missed.conceptId).length).toBeGreaterThanOrEqual(3);
    await page().findByText(/Not quite/);
    fireEvent.click(page().getByRole('button', { name: 'Leave' }));

    // The note is one click from the miss, and lands on the right section.
    fireEvent.click(await page().findByRole('button', { name: 'Read the note' }));
    const banner = await page().findByText(/This is the one you missed/);
    const section = within(banner.closest('.note-section') as HTMLElement);
    fireEvent.click(section.getByRole('button', { name: 'I have read this' }));
    expect(await section.findByText('✓ Marked as revised')).toBeInTheDocument();

    // Now two correct answers on the same concept close it. The fix-up drill
    // puts the unseen questions first, so these are not the one just missed.
    fireEvent.click(rail().getByRole('button', { name: /Readiness board/ }));
    fireEvent.click(await page().findByRole('button', { name: 'Test me' }));
    await passDrill(2);
    fireEvent.click(page().getByRole('button', { name: 'Leave' }));

    await waitFor(() => {
      expect(page().queryByText(/Mistakes to clear/)).not.toBeInTheDocument();
    });
  });

  it('re-offers the read button after a second miss, once the first read already ticked it', async () => {
    await enterFocus();

    fireEvent.click(page().getByRole('button', { name: /Start the quiz/ }));
    await answer(false);
    await page().findByText(/Not quite/);
    fireEvent.click(page().getByRole('button', { name: 'Leave' }));

    fireEvent.click(await page().findByRole('button', { name: 'Read the note' }));
    const banner = await page().findByText(/This is the one you missed/);
    const section = within(banner.closest('.note-section') as HTMLElement);
    fireEvent.click(section.getByRole('button', { name: 'I have read this' }));
    expect(await section.findByText('✓ Marked as revised')).toBeInTheDocument();

    // Miss the same concept again — the state layer reopens the reading
    // requirement (`revised` goes back to false), so the board must offer
    // "Read the note" again rather than "Re-read the note".
    fireEvent.click(rail().getByRole('button', { name: /Readiness board/ }));
    fireEvent.click(await page().findByRole('button', { name: 'Test me' }));
    await answer(false);
    fireEvent.click(page().getByRole('button', { name: 'Leave' }));
    expect(await page().findByRole('button', { name: 'Read the note' })).toBeInTheDocument();

    // And critically, the note section itself must offer the button again —
    // not stay stuck showing the checkmark from the first read with no way
    // to satisfy the reopened requirement.
    fireEvent.click(page().getByRole('button', { name: 'Read the note' }));
    const bannerAgain = await page().findByText(/This is the one you missed/);
    const sectionAgain = within(bannerAgain.closest('.note-section') as HTMLElement);
    expect(sectionAgain.getByRole('button', { name: 'I have read this' })).toBeInTheDocument();
    expect(sectionAgain.queryByText('✓ Marked as revised')).not.toBeInTheDocument();

    // Reading it again should tick it once more, and the fix-up can still close.
    fireEvent.click(sectionAgain.getByRole('button', { name: 'I have read this' }));
    expect(await sectionAgain.findByText('✓ Marked as revised')).toBeInTheDocument();
    fireEvent.click(rail().getByRole('button', { name: /Readiness board/ }));
    fireEvent.click(await page().findByRole('button', { name: 'Test me' }));
    await passDrill(2);
    fireEvent.click(page().getByRole('button', { name: 'Leave' }));

    await waitFor(() => {
      expect(page().queryByText(/Mistakes to clear/)).not.toBeInTheDocument();
    });
  });

  it('sits a mock paper against a real clock and marks it', async () => {
    await enterFocus();

    fireEvent.click(rail().getByRole('button', { name: /Mock paper 1/ }));
    expect(await page().findByText('Sit it like the real one')).toBeInTheDocument();
    expect(page().getByText(/20 minutes, counting down/)).toBeInTheDocument();

    fireEvent.click(page().getByRole('button', { name: /Start the clock/ }));
    expect(await screen.findByRole('timer')).toHaveTextContent('20:00');

    // No feedback while the paper is live — that is the whole difference from
    // a drill, so a leaked explanation here would be a real defect.
    fireEvent.click(within(el('.fq-opts')).getAllByRole('button')[0]);
    expect(page().queryByText(/Not quite|^Correct$/)).not.toBeInTheDocument();
    expect(page().getByText('1 of 10 answered')).toBeInTheDocument();

    fireEvent.click(page().getByRole('button', { name: 'Submit paper' }));

    // Marked, with a per-week breakdown and every question explained.
    expect(await page().findByRole('heading', { name: 'Paper 1' })).toBeInTheDocument();
    expect(page().getByText(/9 left blank/)).toBeInTheDocument();
    expect(page().getByText('Every question, and what it was testing')).toBeInTheDocument();
  });

  it('keeps the mistakes list across a remount', async () => {
    await enterFocus();
    fireEvent.click(rail().getByRole('button', { name: /Week 2 quiz/ }));
    await answer(false);
    await page().findByText(/Not quite/);

    cleanup();
    reloadFromStorage();
    render(<App />);
    // The whole exam card is the button, so name it by the exam rather than by
    // the call to action — the arrow beside it is decorative and aria-hidden.
    fireEvent.click(await screen.findByRole('button', { name: /Midsemester test/ }));
    expect(await page().findByText('Mistakes to clear (1)')).toBeInTheDocument();
  });
});

/*
 * The two exams.
 *
 * Concept Focus answers to a paper rather than to itself, and both papers now
 * have material behind them. These tests used to be about the opposite case —
 * the Final tab when nothing had been written for it — and that state no
 * longer exists, so what they check now is that the two tabs are genuinely
 * *different*: different weeks in the rail, a different paper length and
 * duration, and a board that describes the paper it belongs to.
 *
 * The thing most likely to break here is a view that quietly keeps showing
 * midsemester material after the tab is switched, which is what every
 * assertion about Weeks 9-11 below is guarding.
 */
describe('the two exams', () => {
  async function onboard() {
    render(<App />);
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Amy' } });
    fireEvent.change(screen.getByLabelText('Student ID'), { target: { value: '104321987' } });
    fireEvent.click(screen.getByRole('button', { name: /start learning/i }));
    return await screen.findByText('Revision');
  }

  it('offers both papers from the portal, with the final\'s real details', async () => {
    await onboard();
    expect(screen.getByRole('button', { name: /Midsemester test/ })).toBeInTheDocument();
    const final = screen.getByRole('button', { name: /Final-term test/ });
    expect(final).toBeInTheDocument();
    // The mockup paper's own header, not a placeholder.
    expect(final).toHaveTextContent(/Week 12/);
    expect(final).not.toHaveTextContent(/not announced/i);
  });

  it('opens a week\'s revision notes straight from the portal', async () => {
    await onboard();
    fireEvent.click(screen.getByRole('button', { name: /^W3Collaboration, memory, sequence diagrams$/i }));
    expect(await page().findByRole('heading', { level: 1 })).toHaveTextContent(
      'Collaboration, memory, sequence diagrams',
    );
  });

  it('sends the final to a real board, describing the final\'s own paper', async () => {
    await onboard();
    fireEvent.click(screen.getByRole('button', { name: /Final-term test/ }));

    // Scoped to the board's own fact strip — the rail also advertises the
    // paper's length, so an unscoped text match finds two of everything.
    await page().findByText(/Everything the paper can ask/);
    const facts = within(el('.board-facts')!);
    expect(facts.getByText('20 questions')).toBeInTheDocument();
    expect(facts.getByText('40 minutes')).toBeInTheDocument();
    expect(facts.getByText('Weeks 1–11')).toBeInTheDocument();
    // A readiness dial, because there is now something to be ready for.
    expect(el('.focus-rail .side-progress')).not.toBeNull();
  });

  it('lists all eleven weeks in the final\'s rail, not just the midsem five', async () => {
    await onboard();
    fireEvent.click(screen.getByRole('button', { name: /Final-term test/ }));
    await page().findByText(/Everything the paper can ask/);

    const rail = el('.focus-rail')!;
    // Weeks 9-11 exist only for the final, so they are the real test that the
    // rail is reading the current exam rather than FOCUS_WEEKS.
    for (const week of [1, 6, 9, 10, 11]) {
      expect(within(rail).getAllByText(`Week ${week}`).length, `week ${week}`).toBeGreaterThan(0);
    }
  });

  it('switches back to the midsemester board, and drops the extra weeks again', async () => {
    await onboard();
    fireEvent.click(screen.getByRole('button', { name: /Final-term test/ }));
    await page().findByText(/Everything the paper can ask/);

    fireEvent.click(within(el('.focus-rail')!).getByRole('tab', { name: /Midsem/ }));
    expect(await page().findByText('Do this next')).toBeInTheDocument();
    expect(el('.focus-rail .exam-tab.active')).toHaveTextContent('Midsem');
    expect(within(el('.focus-rail')!).queryByText('Week 9')).toBeNull();
  });

  it('reaches the new Weeks 6-11 notes from the final tab', async () => {
    await onboard();
    fireEvent.click(screen.getByRole('button', { name: /Final-term test/ }));
    await page().findByText(/Everything the paper can ask/);

    const rail = el('.focus-rail')!;
    fireEvent.click(within(rail).getAllByText('Week 10')[0].closest('button')!);
    expect(await page().findByRole('heading', { level: 1 })).toHaveTextContent('Design patterns');
  });
});
