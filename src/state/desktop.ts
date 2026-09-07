/**
 * The desktop app, as seen from the renderer.
 *
 * `window.swinlearn` is injected by desktop/preload.cjs and is simply absent in
 * the browser build. Every use of it is behind `isDesktop`, so the same source
 * builds both — the site keeps working from localStorage, and the app upgrades
 * to a real file on disk.
 */

export type MenuCommand =
  | 'export' | 'import' | 'palette' | 'home'
  | 'prev' | 'next' | 'sidebar' | 'theme' | 'profile';

export interface ExportResult {
  ok: boolean;
  canceled?: boolean;
  path?: string;
  error?: string;
}

export interface ImportResult extends ExportResult {
  /** The imported file's contents, still as JSON text. */
  data?: string;
}

export interface DesktopBridge {
  isDesktop: true;
  platform: string;
  version: string;
  readState(): string | null;
  writeState(json: string): void;
  flushState(): void;
  dataPath(): string;
  exportData(): Promise<ExportResult>;
  importData(): Promise<ImportResult>;
  revealData(): Promise<string>;
  setTheme(theme: 'light' | 'dark'): void;
  onMenu(handler: (command: MenuCommand) => void): () => void;
}

declare global {
  interface Window {
    swinlearn?: DesktopBridge;
  }
}

export const desktop: DesktopBridge | undefined =
  typeof window !== 'undefined' ? window.swinlearn : undefined;

export const isDesktop = !!desktop;
