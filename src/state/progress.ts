/**
 * Progress and profile, persisted to whichever store this build has.
 *
 * No accounts, no server, no student data leaving the machine — which also
 * means nothing to maintain once this is handed to the unit.
 *
 * In the browser that store is localStorage, which a cleared cache throws away.
 * In the desktop app it is a real file in the user's app-data folder, written
 * atomically with a backup: see desktop/store.cjs. Nothing else in the app has
 * to know which one it got.
 */

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_PROFILE, type StudentProfile } from '@/content/personalize';
import { EMPTY_FOCUS, hydrateFocus, type FocusState } from './focus';
import { desktop } from './desktop';

const KEY = 'swinlearn.v1';

export interface StepState {
  /** Their current code, so nothing is lost on refresh. */
  code?: string;
  completed?: boolean;
  /** Hints revealed so far — kept so the count does not reset. */
  hintsShown?: number;
  /** Quiz answers, by block index. */
  quiz?: Record<number, number>;
  /** Predictions committed to before running, by block index. */
  predict?: Record<number, number>;
  /** Parsons orderings in progress, by block index. */
  parsons?: Record<number, number[]>;
  /** Free-recall answers and self-marking, by block index. */
  recall?: Record<number, RecallState>;
  /** Interview self-ratings, by question id. */
  rated?: Record<string, 'confident' | 'shaky'>;
}

export interface RecallState {
  /** What the student wrote. Kept, because it is their work like any other. */
  text?: string;
  /** Whether the checklist has been revealed — no un-seeing it. */
  shown?: boolean;
  /** Indices of the points they marked as covered. */
  got?: number[];
}

/** Where the student last was, so the app can offer to put them back. */
export interface LastPlace {
  weekNumber: number;
  lessonId: string;
  step: number;
}

export interface AppState {
  profile: StudentProfile;
  onboarded: boolean;
  theme: 'light' | 'dark';
  steps: Record<string, StepState>;
  last?: LastPlace;
  /** Midterm study mode: attempts, mistakes still to clear, mock papers sat. */
  focus: FocusState;
}

const EMPTY: AppState = {
  profile: DEFAULT_PROFILE,
  onboarded: false,
  theme: 'light',
  steps: {},
  focus: EMPTY_FOCUS,
};

/** Whatever the store holds, as JSON text. */
function readRaw(): string | null {
  if (desktop) return desktop.readState();
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Fill in anything a saved file predates, so an old export still opens. */
function hydrate(raw: string | null): AppState {
  try {
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...EMPTY,
      ...parsed,
      profile: { ...DEFAULT_PROFILE, ...(parsed.profile ?? {}) },
      steps: parsed.steps ?? {},
      focus: hydrateFocus(parsed.focus),
    };
  } catch {
    // A corrupt or blocked store must never stop the app loading.
    return EMPTY;
  }
}

function load(): AppState {
  return hydrate(readRaw());
}

function save(state: AppState) {
  const json = JSON.stringify(state);
  if (desktop) {
    // The main process debounces the actual disk write, so this stays cheap
    // enough to call on every keystroke in the editor.
    desktop.writeState(json);
    return;
  }
  try {
    localStorage.setItem(KEY, json);
  } catch {
    // Private windows and blocked site data are fine — just do not persist.
  }
}

let current = load();
const listeners = new Set<(s: AppState) => void>();

function setState(next: AppState) {
  current = next;
  save(next);
  for (const l of listeners) l(next);
}

/**
 * Re-read localStorage into the in-memory singleton.
 *
 * The app never needs this — state is authoritative in memory for the life of
 * the tab — but tests clear storage between cases and must see the reset.
 */
export function reloadFromStorage() {
  setState(load());
}

export function useAppState() {
  const [state, setLocal] = useState(current);

  useEffect(() => {
    const l = (s: AppState) => setLocal(s);
    listeners.add(l);
    setLocal(current);
    return () => { listeners.delete(l); };
  }, []);

  const setProfile = useCallback((profile: StudentProfile) => {
    setState({ ...current, profile, onboarded: true });
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState({ ...current, theme });
  }, []);

  const setLast = useCallback((last: LastPlace) => {
    const now = current.last;
    if (now && now.lessonId === last.lessonId && now.step === last.step && now.weekNumber === last.weekNumber) return;
    setState({ ...current, last });
  }, []);

  const updateStep = useCallback((id: string, patch: Partial<StepState>) => {
    setState({
      ...current,
      steps: { ...current.steps, [id]: { ...current.steps[id], ...patch } },
    });
  }, []);

  /**
   * Replace the focus slice.
   *
   * Takes a function rather than a value because every caller is deriving the
   * next state from the current one, and two answers recorded in the same tick
   * must not clobber each other — `current` is authoritative, the React state
   * a component closed over may not be.
   */
  const updateFocus = useCallback((fn: (f: FocusState) => FocusState) => {
    setState({ ...current, focus: fn(current.focus) });
  }, []);

  const resetAll = useCallback(() => {
    setState({ ...EMPTY, profile: current.profile, onboarded: current.onboarded, theme: current.theme });
  }, []);

  return { state, setProfile, setTheme, setLast, updateStep, updateFocus, resetAll };
}

export function stepState(state: AppState, id: string): StepState {
  return state.steps[id] ?? {};
}

// ------------------------------------------------------------ backing up

/**
 * Human-readable answer to "where is my work?", for the UI to show.
 *
 * Cached, because it is read during render and the desktop answer comes back
 * over a synchronous IPC call. The folder cannot move while the app is open.
 */
let savedLocation: string | null = null;
export function whereSaved(): string {
  if (savedLocation === null) savedLocation = desktop ? desktop.dataPath() : 'this browser';
  return savedLocation;
}

export interface DataResult {
  ok: boolean;
  canceled?: boolean;
  /** A short phrase naming what happened, for the toast. */
  where?: string;
  error?: string;
}

const stamp = () => new Date().toISOString().slice(0, 10);

/**
 * Write the whole store to a file the student chooses.
 *
 * On the desktop that is an OS save dialog; in the browser it is a download,
 * which is the closest thing a page is allowed to do.
 */
export async function exportProgress(): Promise<DataResult> {
  if (desktop) {
    const r = await desktop.exportData();
    return { ok: r.ok, canceled: r.canceled, where: r.path, error: r.error };
  }
  try {
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swinlearn-oop-${stamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true, where: a.download };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/** Replace everything with a previously exported file. */
export async function importProgress(): Promise<DataResult> {
  const apply = (raw: string): DataResult => {
    const next = hydrate(raw);
    if (!next.steps) return { ok: false, error: 'That file has no progress in it.' };
    setState(next);
    return { ok: true };
  };

  if (desktop) {
    const r = await desktop.importData();
    if (!r.ok || !r.data) return { ok: false, canceled: r.canceled, error: r.error };
    return apply(r.data);
  }

  return new Promise<DataResult>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve({ ok: false, canceled: true });
      try {
        resolve(apply(await file.text()));
      } catch {
        resolve({ ok: false, error: 'That file could not be read as JSON.' });
      }
    };
    input.oncancel = () => resolve({ ok: false, canceled: true });
    input.click();
  });
}

// The debounce in the main process is generous; make sure the last edit of a
// session is on disk before the window goes away.
if (desktop && typeof window !== 'undefined') {
  const bridge = desktop;
  window.addEventListener('pagehide', () => bridge.flushState());
}

/** Fraction of the given steps marked complete, 0..1. */
export function completionOf(state: AppState, stepIds: string[]): number {
  if (!stepIds.length) return 0;
  const done = stepIds.filter((id) => state.steps[id]?.completed).length;
  return done / stepIds.length;
}
