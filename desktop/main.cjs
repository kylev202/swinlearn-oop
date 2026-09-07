/**
 * The desktop shell.
 *
 * The renderer is the same app that ships to the browser; what the desktop
 * build adds is the thing a browser cannot promise — that a student's work is
 * still there next semester. Progress goes to a real file under the user's app
 * data folder, written atomically, backed up, and exportable to a file they can
 * carry to another machine.
 *
 * Everything privileged lives here. The renderer gets a named list of things it
 * may ask for (see preload.cjs) and no direct access to Node.
 */

const { app, BrowserWindow, Menu, dialog, ipcMain, nativeTheme, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { JsonStore } = require('./store.cjs');

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const isMac = process.platform === 'darwin';

/** Where the student's work lives. One folder, two files, no database. */
const dataDir = path.join(app.getPath('userData'), 'data');
const progress = new JsonStore(dataDir, 'progress');
const windowStore = new JsonStore(dataDir, 'window');

/** @type {BrowserWindow | null} */
let win = null;

// ---------------------------------------------------------------- saving

/**
 * Disk writes are debounced here rather than in the renderer, so typing in the
 * editor never waits on the filesystem and the app still owns the final flush
 * when the window closes.
 */
let pending = null;
let timer = null;

function queueSave(text) {
  pending = text;
  if (timer) return;
  timer = setTimeout(flushSave, 400);
}

function flushSave() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (pending === null) return;
  const text = pending;
  pending = null;
  progress.write(text);
}

// ----------------------------------------------------------------- chrome

/** Title-bar colours have to be pushed to Windows; CSS cannot reach them. */
const OVERLAY = {
  light: { color: '#fdfcfa', symbolColor: '#3a3733' },
  dark: { color: '#17171b', symbolColor: '#c8c6c0' },
};
const TITLEBAR_HEIGHT = 46;

function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  nativeTheme.themeSource = t;
  if (win && !win.isDestroyed() && !isMac && typeof win.setTitleBarOverlay === 'function') {
    try {
      win.setTitleBarOverlay({ ...OVERLAY[t], height: TITLEBAR_HEIGHT });
    } catch { /* a Linux desktop without overlay support — the app still runs */ }
  }
}

function savedBounds() {
  try {
    const raw = windowStore.read();
    const b = raw ? JSON.parse(raw) : null;
    if (b && Number.isFinite(b.width) && Number.isFinite(b.height)) return b;
  } catch { /* fall through to defaults */ }
  return null;
}

function rememberBounds() {
  if (!win || win.isDestroyed() || win.isMinimized()) return;
  const { x, y, width, height } = win.getNormalBounds();
  windowStore.write(JSON.stringify({ x, y, width, height, maximized: win.isMaximized() }));
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => { t = null; fn(...args); }, ms);
  };
}

/** The theme the window should paint before React has had a chance to say. */
function readStartTheme() {
  try {
    const raw = progress.read();
    const t = raw ? JSON.parse(raw).theme : null;
    return t === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function createWindow() {
  const b = savedBounds();
  const startTheme = readStartTheme();

  win = new BrowserWindow({
    x: b ? b.x : undefined,
    y: b ? b.y : undefined,
    width: b ? b.width : 1440,
    height: b ? b.height : 940,
    minWidth: 900,
    minHeight: 620,
    show: false,
    backgroundColor: startTheme === 'dark' ? '#17171b' : '#fdfcfa',
    title: 'SwinLearn OOP',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    trafficLightPosition: isMac ? { x: 14, y: 15 } : undefined,
    titleBarOverlay: isMac ? undefined : { ...OVERLAY[startTheme], height: TITLEBAR_HEIGHT },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  if (b && b.maximized) win.maximize();
  applyTheme(startTheme);

  win.once('ready-to-show', () => { if (win) win.show(); });
  const remember = debounce(rememberBounds, 300);
  for (const ev of ['resize', 'move', 'maximize', 'unmaximize']) win.on(ev, remember);
  win.on('close', () => { flushSave(); rememberBounds(); });
  win.on('closed', () => { win = null; });

  // A learning app has no business navigating anywhere. Links to the unit's
  // real documentation open in the student's own browser instead.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (DEV_URL && url.startsWith(DEV_URL)) return;
    e.preventDefault();
    if (/^https?:/.test(url)) shell.openExternal(url);
  });

  if (DEV_URL) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// -------------------------------------------------------------------- ipc

ipcMain.on('state:read', (e) => { e.returnValue = progress.read(); });
ipcMain.on('state:write', (_e, text) => { if (typeof text === 'string') queueSave(text); });
ipcMain.on('state:flush', (e) => { flushSave(); e.returnValue = true; });
ipcMain.on('data:path', (e) => { e.returnValue = dataDir; });
ipcMain.on('theme:set', (_e, theme) => applyTheme(theme));

ipcMain.handle('data:reveal', async () => {
  fs.mkdirSync(dataDir, { recursive: true });
  await shell.openPath(dataDir);
  return dataDir;
});

ipcMain.handle('data:export', async () => {
  flushSave();
  const stamp = new Date().toISOString().slice(0, 10);
  const result = await dialog.showSaveDialog(win, {
    title: 'Export your progress',
    defaultPath: path.join(app.getPath('documents'), 'swinlearn-oop-' + stamp + '.json'),
    filters: [{ name: 'SwinLearn progress', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(result.filePath, progress.read() || '{}', 'utf8');
    return { ok: true, path: result.filePath };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
});

ipcMain.handle('data:import', async () => {
  const result = await dialog.showOpenDialog(win, {
    title: 'Restore progress from a file',
    properties: ['openFile'],
    filters: [{ name: 'SwinLearn progress', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePaths.length) return { ok: false, canceled: true };
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('steps' in parsed)) {
      return { ok: false, error: 'That file is not a SwinLearn progress export.' };
    }
    return { ok: true, data: raw, path: result.filePaths[0] };
  } catch {
    return { ok: false, error: 'That file could not be read as JSON.' };
  }
});

// ------------------------------------------------------------------- menu

function send(command) {
  if (win && !win.isDestroyed()) win.webContents.send('menu', command);
}

function buildMenu() {
  /** @type {import('electron').MenuItemConstructorOptions[]} */
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: '&File',
      submenu: [
        { label: 'Export progress…', accelerator: 'CmdOrCtrl+Shift+E', click: () => send('export') },
        { label: 'Import progress…', accelerator: 'CmdOrCtrl+Shift+I', click: () => send('import') },
        { type: 'separator' },
        {
          label: 'Open the data folder',
          click: () => { fs.mkdirSync(dataDir, { recursive: true }); shell.openPath(dataDir); },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: '&Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: '&Go',
      submenu: [
        // The renderer already binds these four on window keydown. The menu
        // shows the shortcut but does not register it, so one press is one
        // action rather than a menu command and a keydown that cancel out.
        { label: 'Jump to…', accelerator: 'CmdOrCtrl+K', registerAccelerator: false, click: () => send('palette') },
        { label: 'Week overview', accelerator: 'CmdOrCtrl+Shift+H', click: () => send('home') },
        { type: 'separator' },
        { label: 'Previous step', accelerator: 'Alt+Left', registerAccelerator: false, click: () => send('prev') },
        { label: 'Next step', accelerator: 'Alt+Right', registerAccelerator: false, click: () => send('next') },
      ],
    },
    {
      label: '&View',
      submenu: [
        { label: 'Toggle the lesson list', accelerator: 'CmdOrCtrl+B', registerAccelerator: false, click: () => send('sidebar') },
        { label: 'Toggle dark theme', accelerator: 'CmdOrCtrl+Shift+D', click: () => send('theme') },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: '&Help',
      submenu: [
        { label: 'Change my name and student ID', click: () => send('profile') },
        { type: 'separator' },
        {
          label: 'About SwinLearn OOP',
          click: () => dialog.showMessageBox(win, {
            type: 'info',
            title: 'SwinLearn OOP',
            message: 'SwinLearn OOP ' + app.getVersion(),
            detail:
              'COS20007 Object-Oriented Programming.\n\n' +
              'Your work is saved on this computer only:\n' + dataDir,
            buttons: ['Close'],
          }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ------------------------------------------------------------------ boot

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(() => {
    buildMenu();
    createWindow();
    app.on('activate', () => {
      if (!BrowserWindow.getAllWindows().length) createWindow();
    });
  });

  app.on('window-all-closed', () => { if (!isMac) app.quit(); });
  app.on('before-quit', flushSave);
}
