/**
 * End-to-end smoke test through the real UI.
 *
 * Type checking proves the code compiles; this proves a student can actually
 * get from a cold start to a passing lab step. It drives the same DOM a
 * browser would: onboarding, navigation, editing, running, and checking.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { App } from '../App';
import { reloadFromStorage } from '@/state/progress';

// CodeMirror needs a few browser APIs jsdom does not implement.
beforeEach(() => {
  localStorage.clear();
  reloadFromStorage();
  (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(0), 0) as unknown as number;
  (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame = (id: number) => clearTimeout(id);
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList;
    Range.prototype.getBoundingClientRect = () => new DOMRect();
  }
  Element.prototype.scrollTo = Element.prototype.scrollTo ?? (() => {});
});

afterEach(cleanup);

async function completeOnboarding() {
  render(<App />);
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Amy' } });
  fireEvent.change(screen.getByLabelText('Student ID'), { target: { value: '104321987' } });

  // Derived values must appear before the student commits to them. Scope each
  // assertion to its own row — Amy gets Azure for both labs, so a bare text
  // query would be ambiguous.
  const row = async (label: string) =>
    (await screen.findByText(label)).parentElement as HTMLElement;

  expect(within(await row('Shape colour (Lab 2.2)')).getByText('Color.Azure')).toBeInTheDocument();
  expect(within(await row('Shape constructor argument')).getByText('187')).toBeInTheDocument();
  expect(within(await row('Outline width (Lab 5.1)')).getByText('12 px')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /start learning/i }));
}


/** The lesson list, scoped — lab titles also appear in the assessment summary. */
function nav() {
  return within(screen.getByRole('navigation', { name: 'Lessons' }));
}

function openLesson(title: string) {
  fireEvent.click(nav().getByText(title));
}

/** One option of the first predict block, by position — they hold markup, not just text. */
function predictOption(i: number): HTMLElement {
  return document.querySelectorAll<HTMLElement>('.predict-opt')[i];
}

/** Jump straight to a step by its title, from the open lesson's step list. */
function openStep(title: string) {
  fireEvent.click(nav().getByText(title));
}

describe('the app', () => {
  it('onboards, then shows the week overview', async () => {
    await completeOnboarding();
    expect(await screen.findByText(/Learn OOP by building it/i)).toBeInTheDocument();
    expect(screen.getByText('Basic Objects')).toBeInTheDocument();
    expect(screen.getByText(/Your student ID fills in every lab/i)).toBeInTheDocument();
  });

  it('opens a lesson and renders its first step', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));

    expect(await screen.findByRole('heading', { name: 'Why not just use functions?' })).toBeInTheDocument();
    // The sidebar should list every lesson in the week.
    expect(nav().getByText('Task 2.1 — Build the Counter')).toBeInTheDocument();
    expect(nav().getByText('Lab interview drill')).toBeInTheDocument();
  });

  it('marks a quiz answer, and says why the chosen one was wrong', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));
    openStep('Check yourself');

    const wrong = await screen.findByRole('button', { name: /A running instance that holds real data/i });
    fireEvent.click(wrong);
    expect(await screen.findByText(/Not quite\./)).toBeInTheDocument();
    expect(screen.getByText(/Quiz 1 Q3/)).toBeInTheDocument();
    // Elaborative feedback: what the option they picked would have been true of.
    expect(screen.getByText(/The class is the description it was built from/i)).toBeInTheDocument();
  });

  it('holds the result back until a prediction is committed, then shows both', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));
    openStep('Two objects, same values');

    // Nothing has run yet: the answer is not on the page.
    expect(screen.getByText('Predict first')).toBeInTheDocument();
    expect(screen.queryByText(/What it really did/i)).not.toBeInTheDocument();

    fireEvent.click(predictOption(0));

    expect(await screen.findByText('Not what happens')).toBeInTheDocument();
    expect(screen.getByText(/What it really did/i)).toBeInTheDocument();
    // The real output, from the interpreter rather than from the content file.
    const console = document.querySelector('.predict-actual .console');
    expect(console?.textContent).toBe('True\nFalse\nTrue');
  });

  it('orders a Parsons problem with the arrows and reports the score', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));
    openStep('Put one together');

    fireEvent.click(screen.getByRole('button', { name: /Check the order/i }));
    expect(await screen.findByText(/lines are in the right place/i)).toBeInTheDocument();

    // Bubble each line into place with the up arrow, which is the keyboard path.
    const lines = [
      'public class Book',
      '{',
      'private int _pages;',
      'public Book(int pages) { _pages = pages; }',
      'public int Pages { get { return _pages; } }',
      'public bool IsLong() { return _pages > 400; }',
      '}',
    ];
    for (let target = 0; target < lines.length; target++) {
      for (;;) {
        const rows = [...document.querySelectorAll<HTMLElement>('.parsons-list li')];
        // Match the code cell exactly: a naive `includes` would find the brace
        // of a one-line method body before it found the class's own brace.
        const at = rows.findIndex(
          (r) => r.querySelector('.parsons-code')?.textContent === lines[target],
        );
        if (at <= target) break;
        fireEvent.click(within(rows[at]).getByLabelText(`Move line ${at + 1} up`));
      }
    }

    fireEvent.click(screen.getByRole('button', { name: /Check the order/i }));
    expect(await screen.findByText(/That is the order\./)).toBeInTheDocument();
  });

  it('keeps the recall checklist hidden until something is written', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));
    openStep('Check yourself');

    const written = screen.getByRole('button', { name: /I've written mine/i });
    expect(written).toBeDisabled();
    expect(screen.queryByText(/What a tutor is listening for/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'A class is the declaration; an object is the thing built from it while the program runs.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /I've written mine/i }));

    expect(await screen.findByText(/What a tutor is listening for/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 5 covered/)).toBeInTheDocument();
  });

  it('ticks a concept step off once every question on it is answered', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));
    openStep('Two objects, same values');

    // One predict block on this step, and no "Mark as read" escape hatch.
    expect(screen.queryByRole('button', { name: /Mark as read/i })).not.toBeInTheDocument();
    expect(screen.getByText(/1 to answer on this step/i)).toBeInTheDocument();

    fireEvent.click(predictOption(1));
    expect(await screen.findByText('✓ Done')).toBeInTheDocument();
  });

  it('personalises the Shape task with the student\'s own values', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));
    openLesson('Task 2.2 — A Basic Shape');

    expect(await screen.findByRole('heading', { name: 'Your values for this task' })).toBeInTheDocument();
    // Amy -> A..L -> Azure; 104321987 -> last two digits 87 -> 187
    expect(screen.getByText('"Color.Azure"')).toBeInTheDocument();
    expect(screen.getByText('187')).toBeInTheDocument();
  });

  it('runs a step\'s checks and reports failures before a solution is written', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));
    openLesson('Task 2.1 — Build the Counter');

    // Step 2 of that lesson is the first exercise. This is also the first step
    // in the whole file to need the workbench, which arrives as a lazy chunk —
    // so it is the one assertion that waits on a dynamic import rather than on
    // a render, and the default one-second timeout is not always enough for it
    // on a cold module cache.
    fireEvent.click(await screen.findByRole('button', { name: /Next →/i }));
    expect(
      await screen.findByText(/Declare a public class called Counter/i, undefined, { timeout: 5000 }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Run & check/i }));

    await waitFor(() => {
      expect(screen.getByText('A class called Counter exists')).toBeInTheDocument();
    });
    // The seed is only a comment, so the check must fail and say why.
    expect(await screen.findByText(/could not find a class called 'Counter'/i)).toBeInTheDocument();
  });

  it('shows hints one at a time, and never the answer', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));
    openLesson('Task 2.1 — Build the Counter');
    fireEvent.click(await screen.findByRole('button', { name: /Next →/i }));

    fireEvent.click(await screen.findByRole('button', { name: /Need a hint\?/i }));
    expect(await screen.findByText('Hint 1')).toBeInTheDocument();
    expect(screen.queryByText('Hint 2')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Another hint \(1\/3\)/i }));
    expect(await screen.findByText('Hint 2')).toBeInTheDocument();

    // No hint anywhere in this step may contain a complete class declaration.
    for (const el of screen.getAllByText(/./, { selector: '.hint-box' })) {
      expect(el.textContent ?? '').not.toMatch(/public\s+class\s+Counter\s*\{/);
    }
  });

  it('runs the interview drill and reveals what a tutor listens for', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));
    openLesson('Lab interview drill');

    expect(await screen.findByRole('heading', { name: /Can you explain your own code/i })).toBeInTheDocument();
    expect(screen.getByText(/Why is _count private rather than public/i)).toBeInTheDocument();

    const cards = screen.getAllByRole('button', { name: /I've answered/i });
    fireEvent.click(cards[0]);

    expect(await screen.findByText(/Encapsulation — the object controls its own state/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /I covered that/i }));
    expect(await screen.findByText(/1 of 8 rehearsed/i)).toBeInTheDocument();
  });

  it('persists progress across a remount', async () => {
    await completeOnboarding();
    fireEvent.click(await screen.findByRole('button', { name: /Start week 2/i }));
    openLesson('Task 2.1 — Build the Counter');
    // Mark the first (read-only) step as read.
    fireEvent.click(await screen.findByRole('button', { name: /Mark as read/i }));
    expect(await screen.findByText('✓ Done')).toBeInTheDocument();

    cleanup();
    render(<App />);
    // Onboarding must not reappear.
    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
    expect(await screen.findByText(/Learn OOP by building it/i)).toBeInTheDocument();
    // And the week card should show partial progress.
    const pctTexts = screen.getAllByText(/% complete/);
    expect(pctTexts.some((el) => !/^0% complete/.test(el.textContent ?? ''))).toBe(true);
  });

  it('toggles the theme', async () => {
    await completeOnboarding();
    const toggle = screen.getByLabelText(/Toggle light or dark theme/i);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});
