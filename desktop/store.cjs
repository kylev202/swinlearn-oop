/**
 * A JSON file on disk that will not lose a student's work.
 *
 * Everything a student does — code, completed steps, quiz answers, hints they
 * have spent — lives in one file under the OS's per-user app data folder. The
 * browser build keeps the same shape in localStorage, which a cleared cache
 * throws away; this one survives reinstalls of the app itself.
 *
 * Three guarantees, in the order they matter:
 *
 *   1. A write is atomic. The new contents land in a temp file and are then
 *      renamed over the real one, so a crash mid-write leaves either the whole
 *      old file or the whole new one — never a half-written mixture.
 *   2. The last good copy is kept. Before each rename the current file is
 *      copied to `.backup.json`, so even a logically bad save is recoverable.
 *   3. A corrupt file is never silently dropped. It is moved aside with a
 *      timestamp so the student can send it to a tutor if they want it back.
 */

const fs = require('node:fs');
const path = require('node:path');

class JsonStore {
  /**
   * @param {string} dir  folder to keep the data in
   * @param {string} name base filename, without extension
   */
  constructor(dir, name) {
    this.dir = dir;
    this.file = path.join(dir, `${name}.json`);
    this.backupFile = path.join(dir, `${name}.backup.json`);
    this.tmpFile = path.join(dir, `${name}.tmp`);
  }

  /** The raw JSON text, or null if there is nothing (usable) to read. */
  read() {
    const fromMain = this.#readValid(this.file);
    if (fromMain !== null) return fromMain;

    // The main file is missing or unreadable. If it existed but did not parse,
    // keep it — a student who has lost a week of work deserves the evidence.
    if (fs.existsSync(this.file)) this.#quarantine(this.file);

    const fromBackup = this.#readValid(this.backupFile);
    if (fromBackup !== null) {
      // Promote the backup so the next write does not overwrite it.
      try { fs.copyFileSync(this.backupFile, this.file); } catch { /* best effort */ }
      return fromBackup;
    }
    return null;
  }

  /**
   * Replace the file's contents atomically.
   * @param {string} text JSON text; assumed already validated by the caller
   * @returns {boolean} whether the write landed
   */
  write(text) {
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      fs.writeFileSync(this.tmpFile, text, 'utf8');
      if (fs.existsSync(this.file)) {
        try { fs.copyFileSync(this.file, this.backupFile); } catch { /* backup is a bonus */ }
      }
      fs.renameSync(this.tmpFile, this.file);
      return true;
    } catch (err) {
      console.error('[store] could not save progress:', err);
      return false;
    }
  }

  /** Read a file only if it parses as JSON. */
  #readValid(file) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      JSON.parse(raw);
      return raw;
    } catch {
      return null;
    }
  }

  #quarantine(file) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    try { fs.renameSync(file, `${file}.corrupt-${stamp}`); } catch { /* nothing further to try */ }
  }
}

module.exports = { JsonStore };
