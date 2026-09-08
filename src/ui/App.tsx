/**
 * App shell: topbar, lesson sidebar, and the view router.
 *
 * Routing is a small piece of local state rather than a router library — the
 * whole site is one week's worth of lessons plus a home view, and keeping it
 * in state means progress restoration needs no URL parsing.
 */

import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { week2, week2Interview } from '@/content/week2';
import { week3, week3Interview } from '@/content/week3';
import { week4, week4Interview } from '@/content/week4';
import { week5, week5Interview } from '@/content/week5';
import type { InterviewQuestion, Week } from '@/content/types';
import { isProfileComplete } from '@/content/personalize';
import {
  completionOf,
  exportProgress,
  getState,
  importProgress,
  maxUnlockedStepIndex,
  stepState,
  useAppState,
  whereSaved,
} from '@/state/progress';
import { desktop, isDesktop, type MenuCommand } from '@/state/desktop';

import { Home } from './Home';
import { LessonPlayer } from './LessonPlayer';
import { Onboarding } from './Onboarding';
import { CommandPalette, type Command } from './CommandPalette';

// Concept focus is a whole second app's worth of question bank and revision
// notes for Weeks 1-5 — bigger than the lessons it sits next to — and a
// student may spend an entire session in the lessons without opening it.
// Lazy, the same way Workbench is in LessonPlayer.tsx, so that content never
// loads until "Concept focus" is actually clicked.
const FocusMode = lazy(() => import('./focus/FocusMode').then((m) => ({ default: m.FocusMode })));

const WEEKS: Week[] = [week2, week3, week4, week5];
const INTERVIEWS: Record<number, InterviewQuestion[]> = {
  [week2.number]: week2Interview,
  [week3.number]: week3Interview,
  [week4.number]: week4Interview,
  [week5.number]: week5Interview,
};

type View =
  | { name: 'home' }
  | { name: 'lesson'; weekNumber: number; lessonId: string; step: number }
  /** The midterm study mode, which owns its own routing from here down. */
  | { name: 'focus' };

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');
const MOD = isMac ? '⌘' : 'Ctrl';

export function App() {
  const { state, setProfile, setTheme, setLast, updateStep, updateFocus } = useAppState();
  const [view, setView] = useState<View>({ name: 'home' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  /*
   * The same panel, in the two shapes a screen can want it.
   *
   * Wide, it is a column beside the page and `sidebarOpen` says whether it is
   * there. Narrow, there is no room for a column, so it becomes a drawer over
   * the page and `navOpen` says whether it is out. One control in the topbar
   * drives whichever of the two applies, because to a reader they are the same
   * request: show me the list.
   */
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; sub?: string; bad?: boolean } | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    // The window's own title bar is painted by the OS, not by CSS.
    desktop?.setTheme(state.theme);
  }, [state.theme]);

  // Toasts say what happened to a student's data; four seconds is long enough
  // to read a file path and short enough not to sit over the editor.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const week = WEEKS.find((w) => (view.name === 'lesson' ? w.number === view.weekNumber : false));
  const lesson = week && view.name === 'lesson' ? week.lessons.find((l) => l.id === view.lessonId) : undefined;

  const isNarrow = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 780px)').matches;

  const toggleNav = useCallback(() => {
    if (isNarrow()) setNavOpen((o) => !o);
    else setSidebarOpen((o) => !o);
  }, []);

  const openLesson = useCallback(
    (weekNumber: number, lessonId: string, step = 0) => {
      setView({ name: 'lesson', weekNumber, lessonId, step });
      setLast({ weekNumber, lessonId, step });
      // Picking something is the end of the drawer's job.
      setNavOpen(false);
    },
    [setLast],
  );

  /** Find whichever lesson owns a step id, and open it there. */
  const jumpToStep = useCallback(
    (stepId: string) => {
      for (const w of WEEKS) {
        for (const l of w.lessons) {
          const idx = l.steps.findIndex((s) => s.id === stepId);
          if (idx >= 0) {
            openLesson(w.number, l.id, Math.min(idx, maxUnlockedStepIndex(l, getState())));
            return;
          }
        }
      }
    },
    [openLesson],
  );

  const stepCount = lesson?.steps.length ?? 0;
  const goToStep = useCallback(
    (step: number) => {
      if (view.name !== 'lesson' || !stepCount || !lesson) return;
      const cap = maxUnlockedStepIndex(lesson, getState());
      const next = Math.max(0, Math.min(step, stepCount - 1, cap));
      setView({ ...view, step: next });
      setLast({ weekNumber: view.weekNumber, lessonId: view.lessonId, step: next });
    },
    [view, stepCount, lesson, setLast],
  );

  const move = useCallback((delta: number) => {
    if (view.name !== 'lesson') return;
    goToStep(view.step + delta);
  }, [view, goToStep]);

  // ---- keeping a copy of the work
  const runExport = useCallback(async () => {
    const r = await exportProgress();
    if (r.canceled) return;
    setToast(r.ok
      ? { title: 'Progress exported.', sub: r.where }
      : { title: 'Could not export.', sub: r.error, bad: true });
  }, []);

  const runImport = useCallback(async () => {
    const r = await importProgress();
    if (r.canceled) return;
    setToast(r.ok
      ? { title: 'Progress restored.', sub: 'Everything is back where that file left it.' }
      : { title: 'Could not import.', sub: r.error, bad: true });
    if (r.ok) setView({ name: 'home' });
  }, []);

  // ---- keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === 'k' || e.key === 'K' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (mod && e.key === 'b') {
        e.preventDefault();
        toggleNav();
        return;
      }
      if (e.key === 'Escape') {
        setNavOpen(false);
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        move(1);
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        move(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, toggleNav]);

  // ---- the native menu, in the desktop build
  useEffect(() => {
    if (!desktop) return;
    const actions: Record<MenuCommand, () => void> = {
      export: runExport,
      import: runImport,
      palette: () => setPaletteOpen((o) => !o),
      home: () => setView({ name: 'home' }),
      prev: () => move(-1),
      next: () => move(1),
      sidebar: toggleNav,
      theme: () => setTheme(state.theme === 'dark' ? 'light' : 'dark'),
      profile: () => setEditingProfile(true),
    };
    return desktop.onMenu((command) => actions[command]?.());
  }, [move, runExport, runImport, setTheme, state.theme, toggleNav]);

  const commands = useMemo<Command[]>(() => {
    const out: Command[] = [
      {
        id: 'home',
        group: 'Go',
        title: 'Home — week overview',
        run: () => setView({ name: 'home' }),
      },
      {
        id: 'theme',
        group: 'Settings',
        title: `Switch to the ${state.theme === 'dark' ? 'light' : 'dark'} theme`,
        run: () => setTheme(state.theme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'profile',
        group: 'Settings',
        title: 'Change my name and student ID',
        subtitle: 'Re-derives every personalised lab value',
        run: () => setEditingProfile(true),
      },
      {
        id: 'focus',
        group: 'Go',
        title: 'Concept focus — prepare for the midterm',
        subtitle: 'Weeks 1-5 notes, quizzes, mistakes and mock papers',
        run: () => setView({ name: 'focus' }),
      },
      {
        id: 'sidebar',
        group: 'View',
        title: 'Toggle the lesson sidebar',
        hint: `${MOD} B`,
        run: () => setSidebarOpen((o) => !o),
      },
      {
        id: 'export',
        group: 'My work',
        title: 'Export my progress',
        subtitle: isDesktop ? 'A copy you can keep or move to another machine' : 'Downloads a JSON file',
        hint: `${MOD} ⇧ E`,
        run: runExport,
      },
      {
        id: 'import',
        group: 'My work',
        title: 'Restore my progress',
        subtitle: 'Replaces everything currently saved',
        hint: `${MOD} ⇧ I`,
        run: runImport,
      },
    ];

    if (desktop) {
      const bridge = desktop;
      out.push({
        id: 'reveal',
        group: 'My work',
        title: 'Open the folder my work is saved in',
        subtitle: whereSaved(),
        run: () => { void bridge.revealData(); },
      });
    }

    for (const w of WEEKS) {
      for (const l of w.lessons) {
        out.push({
          id: `lesson:${l.id}`,
          group: `Week ${w.number}`,
          title: l.title,
          subtitle: `${l.kind} · ${l.minutes} min`,
          run: () => openLesson(w.number, l.id, 0),
        });
        // A lab step past the lock isn't listed — jumping to it from here would
        // be the same answer-peek the sidebar and Next button already block.
        const cap = maxUnlockedStepIndex(l, state);
        l.steps.forEach((s, i) => {
          if (i > cap) return;
          out.push({
            id: `step:${s.id}`,
            group: l.title,
            title: s.title,
            subtitle: `step ${i + 1}`,
            run: () => openLesson(w.number, l.id, i),
          });
        });
      }
    }
    return out;
  }, [openLesson, setTheme, state, runExport, runImport]);

  const needsOnboarding = !state.onboarded || !isProfileComplete(state.profile);

  return (
    <div className={`app${isDesktop ? ' is-desktop' : ''}${isMac ? ' is-mac' : ''}`}>
      <header className="topbar">
        {(view.name === 'lesson' || view.name === 'focus') && (
          <button
            className="icon-btn nav-toggle"
            onClick={toggleNav}
            aria-expanded={navOpen}
            aria-label={sidebarOpen || navOpen ? 'Hide the contents' : 'Show the contents'}
            title={`Contents (${MOD}+B)`}
          >
            <SidebarIcon />
          </button>
        )}

        <button className="brand" onClick={() => { setView({ name: 'home' }); setNavOpen(false); }}>
          <span className="brand-mark">{'{}'}</span>
          <span>
            SwinLearn OOP <small>COS20007</small>
          </span>
        </button>

        {lesson && (
          <nav className="crumbs" aria-label="Breadcrumb">
            <span className="crumb-sep" aria-hidden>
              /
            </span>
            <button className="crumb-link" onClick={() => setView({ name: 'home' })}>
              Week {week!.number}
            </button>
            <span className="crumb-sep" aria-hidden>
              /
            </span>
            <span className="crumb-now">{lesson.title}</span>
          </nav>
        )}

        <span className="spacer" />

        <button
          className={`focus-btn${view.name === 'focus' ? ' active' : ''}`}
          onClick={() => { setView({ name: 'focus' }); setNavOpen(false); }}
          title="Midterm study mode: notes, quizzes and mock papers for Weeks 1-5"
        >
          <TargetIcon />
          <span>Concept focus</span>
        </button>

        <button className="jump-btn" onClick={() => setPaletteOpen(true)} title="Jump to anything">
          <SearchIcon />
          <span>Jump to…</span>
          <span className="keys">
            <kbd>{MOD}</kbd>
            <kbd>K</kbd>
          </span>
        </button>

        {state.profile.firstName && (
          <button className="ghost profile-btn" onClick={() => setEditingProfile(true)} title="Change your personalised values">
            <span className="avatar" aria-hidden>
              {state.profile.firstName.slice(0, 1).toUpperCase()}
            </span>
            <span className="profile-name">
              {state.profile.firstName}{' '}
              <span className="profile-id">
                {state.profile.studentId.replace(/\D/g, '').slice(-4) || '····'}
              </span>
            </span>
          </button>
        )}

        <button
          className="ghost icon-btn"
          onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
          aria-label="Toggle light or dark theme"
        >
          {state.theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <div className="body">
        {/* Only ever hit on a phone: above 780px the drawer is never open. */}
        {navOpen && (
          <button className="nav-scrim" aria-label="Close the contents" onClick={() => setNavOpen(false)} />
        )}

        {view.name === 'lesson' && week && (sidebarOpen || navOpen) && (
          <aside className={`sidebar${navOpen ? ' nav-open' : ''}`}>
            <div className="side-week">
              <div className="side-week-num">Week {week.number}</div>
              <div className="side-week-title">{week.title}</div>
              <WeekProgress week={week} state={state} />
            </div>

            <nav aria-label="Lessons">
              {week.lessons.map((l) => {
                const ids = l.steps.map((s) => s.id);
                const pct = Math.round(completionOf(state, ids) * 100);
                const active = l.id === lesson?.id;
                return (
                  <div key={l.id} className="lesson-group">
                    <button
                      className={`lesson-link${active ? ' active' : ''}`}
                      onClick={() => openLesson(week.number, l.id, 0)}
                    >
                      <span className="lesson-title">{l.title}</span>
                      <span className="lesson-meta">
                        <span className={`kind-chip kind-${l.kind}`}>{l.kind}</span>
                        <span>{l.minutes} min</span>
                        {pct > 0 && <span className={pct === 100 ? 'meta-done' : ''}>· {pct}%</span>}
                      </span>
                      {pct > 0 && (
                        <span className="lesson-bar" aria-hidden>
                          <span className="lesson-bar-fill" style={{ width: `${pct}%` }} />
                        </span>
                      )}
                    </button>

                    {active && (
                      <div className="step-list">
                        {(() => {
                          const cap = maxUnlockedStepIndex(l, state);
                          return l.steps.map((s, i) => {
                            const done = stepState(state, s.id).completed;
                            const here = view.step === i;
                            const locked = i > cap;
                            return (
                              <button
                                key={s.id}
                                className={`step-link${here ? ' active' : ''}${done ? ' done' : ''}${locked ? ' locked' : ''}`}
                                disabled={locked}
                                title={locked ? 'Finish the previous step first' : undefined}
                                onClick={() => openLesson(week.number, l.id, i)}
                              >
                                <span className={`step-dot${done ? ' done' : here ? ' active' : ''}`} />
                                <span className="step-name">{s.title}</span>
                                {locked ? (
                                  <span className="step-tag" aria-hidden>
                                    🔒
                                  </span>
                                ) : (
                                  s.exercise && (
                                    <span className="step-tag" title="This step has code to write">
                                      {'</>'}
                                    </span>
                                  )
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="side-heading">Assessment</div>
            <div className="side-assessment">
              {week.lessons
                .filter((l) => l.assessment)
                .map((l) => (
                  <div key={l.id} className="assess-row">
                    <strong>{l.title}</strong>
                    <span>{l.assessment}</span>
                  </div>
                ))}
            </div>

            <div className="side-keys">
              <div className="side-heading">Shortcuts</div>
              <div className="key-row">
                <span className="keys">
                  <kbd>{MOD}</kbd>
                  <kbd>K</kbd>
                </span>
                jump to anything
              </div>
              <div className="key-row">
                <span className="keys">
                  <kbd>{MOD}</kbd>
                  <kbd>↵</kbd>
                </span>
                run the code
              </div>
              <div className="key-row">
                <span className="keys">
                  <kbd>Alt</kbd>
                  <kbd>←</kbd>
                  <kbd>→</kbd>
                </span>
                change step
              </div>
            </div>

            <div className="side-foot">
              <strong>Your work is saved</strong>
              {isDesktop ? (
                <>
                  on this computer, as you type.
                  <span className="path">{whereSaved()}</span>
                </>
              ) : (
                <>in this browser. Clearing site data clears it.</>
              )}
              <div className="side-foot-actions">
                <button onClick={runExport}>Export…</button>
                <button onClick={runImport}>Restore…</button>
                {isDesktop && (
                  <button onClick={() => { void desktop!.revealData(); }}>Open folder</button>
                )}
              </div>
            </div>
          </aside>
        )}

        <main className="main">
          {view.name === 'home' && (
            <div className="home-scroll">
              <Home
                weeks={WEEKS}
                state={state}
                onOpen={openLesson}
                onFocus={() => setView({ name: 'focus' })}
              />
            </div>
          )}

          {view.name === 'focus' && (
            <Suspense fallback={<div className="home-scroll"><p className="focus-empty">Loading Concept focus…</p></div>}>
              <FocusMode
                focus={state.focus}
                student={state.profile}
                railOpen={sidebarOpen}
                navOpen={navOpen}
                onUpdate={updateFocus}
                onLeave={() => { setView({ name: 'home' }); setNavOpen(false); }}
                onCloseNav={() => setNavOpen(false)}
              />
            </Suspense>
          )}

          {view.name === 'lesson' && week && lesson && (
            <LessonPlayer
              key={lesson.id}
              week={week}
              lesson={lesson}
              stepIndex={view.step}
              state={state}
              student={state.profile}
              interviewQuestions={week ? INTERVIEWS[week.number] ?? [] : []}
              onStepChange={goToStep}
              onUpdateStep={updateStep}
              onJumpToStep={jumpToStep}
            />
          )}
        </main>
      </div>

      {toast && (
        <div className={`toast${toast.bad ? ' toast-bad' : ''}`} role="status">
          <span className="toast-mark" aria-hidden>{toast.bad ? '!' : '✓'}</span>
          <div>
            <strong>{toast.title}</strong>
            {toast.sub && <div className="toast-sub">{toast.sub}</div>}
          </div>
        </div>
      )}

      <CommandPalette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />

      {(needsOnboarding || editingProfile) && (
        <Onboarding
          initial={state.profile}
          onDone={(p) => {
            setProfile(p);
            setEditingProfile(false);
          }}
          onCancel={editingProfile ? () => setEditingProfile(false) : undefined}
        />
      )}
    </div>
  );
}

function WeekProgress({ week, state }: { week: Week; state: ReturnType<typeof useAppState>['state'] }) {
  const ids = week.lessons.flatMap((l) => l.steps.map((s) => s.id));
  const pct = Math.round(completionOf(state, ids) * 100);
  return (
    <div className="side-progress">
      <div className="progress-track">
        <div className={`progress-fill${pct === 100 ? ' full' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <span>{pct}%</span>
    </div>
  );
}

const SidebarIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
    <rect x="1.6" y="2.6" width="12.8" height="10.8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <path d="M6 2.8v10.4" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
    <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="8" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="8" r="0.9" fill="currentColor" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
    <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.4 10.4L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
