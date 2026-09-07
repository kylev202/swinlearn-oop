/**
 * `npm run dev:desktop` — Vite's dev server inside the Electron window.
 *
 * Vite is started through its Node API rather than a second terminal, so the
 * Electron process can be handed the real URL once the server is actually
 * listening. No `concurrently`, no `wait-on`, no fixed port to collide with.
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const electron = require('electron');

const server = await createServer({ server: { port: 5173 } });
await server.listen();

const url = server.resolvedUrls?.local?.[0];
if (!url) {
  console.error('Vite started but reported no local URL.');
  await server.close();
  process.exit(1);
}

console.log(`\n  vite ready on ${url}\n  starting electron…\n`);

// VS Code's integrated terminal exports ELECTRON_RUN_AS_NODE=1, which turns the
// electron binary into a plain Node and leaves you staring at a stack trace
// about `ipcMain` being undefined. Strip it for the child.
const env = { ...process.env, VITE_DEV_SERVER_URL: url, ELECTRON_ENABLE_LOGGING: '1' };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electron, ['desktop/main.cjs'], { stdio: 'inherit', env });

const shutdown = async (code = 0) => {
  await server.close().catch(() => {});
  process.exit(code);
};

child.on('close', (code) => shutdown(code ?? 0));
process.on('SIGINT', () => { child.kill(); });
process.on('SIGTERM', () => { child.kill(); });
