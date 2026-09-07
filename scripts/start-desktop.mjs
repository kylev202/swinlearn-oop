/**
 * `npm run desktop:start` — the built app in the real Electron shell.
 *
 * Same job as `electron desktop/main.cjs`, except it scrubs
 * ELECTRON_RUN_AS_NODE from the environment first. VS Code's integrated
 * terminal sets that variable, and with it set the electron binary runs as a
 * plain Node process: no window, and a confusing crash inside main.cjs.
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const electron = require('electron');

if (!existsSync(new URL('../dist/index.html', import.meta.url))) {
  console.error('dist/ is missing — run `npm run build` first.');
  process.exit(1);
}

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electron, ['desktop/main.cjs'], { stdio: 'inherit', env });
child.on('close', (code) => process.exit(code ?? 0));
