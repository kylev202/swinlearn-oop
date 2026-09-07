/**
 * The only doorway between the lesson app and the machine it runs on.
 *
 * The renderer runs sandboxed with no Node access, so this file decides exactly
 * what it is allowed to ask for: read my saved work, save it, put it in a file
 * I choose, tell me where it lives. Nothing here takes a path from the
 * renderer — the main process picks every filename, and the student picks the
 * export location through a real OS dialog.
 */

const { contextBridge, ipcRenderer } = require('electron');

/** Menu commands the main process may push at us, and nothing else. */
const MENU_COMMANDS = new Set([
  'export', 'import', 'palette', 'home', 'prev', 'next', 'sidebar', 'theme', 'profile',
]);

contextBridge.exposeInMainWorld('swinlearn', {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,

  /** Saved progress as JSON text, or null on a first run. Synchronous so the
   *  app can paint the right state on its very first render. */
  readState: () => ipcRenderer.sendSync('state:read'),

  /** Hand new state to the main process, which debounces the disk write. */
  writeState: (json) => ipcRenderer.send('state:write', json),

  /** Force the pending write out now — used before the window goes away. */
  flushState: () => ipcRenderer.sendSync('state:flush'),

  /** The folder the data file lives in, for showing the student. */
  dataPath: () => ipcRenderer.sendSync('data:path'),

  exportData: () => ipcRenderer.invoke('data:export'),
  importData: () => ipcRenderer.invoke('data:import'),
  revealData: () => ipcRenderer.invoke('data:reveal'),

  /** Keep the native title bar in step with the in-app theme. */
  setTheme: (theme) => ipcRenderer.send('theme:set', theme),

  /** Subscribe to menu commands. Returns an unsubscribe function. */
  onMenu: (handler) => {
    const listener = (_event, command) => {
      if (MENU_COMMANDS.has(command)) handler(command);
    };
    ipcRenderer.on('menu', listener);
    return () => ipcRenderer.off('menu', listener);
  },
});
