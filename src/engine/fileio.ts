/**
 * A text filesystem that lives for the length of one run.
 *
 * Week 8's Task 8.2 is "save the player to a file, then read the file back",
 * and the lecture is emphatic about *why* it uses `StreamWriter` rather than
 * `BinaryWriter`: you can open the file and eyeball it, which is how you find
 * out your save format is wrong. A student who cannot run that loop here has
 * to go and set up a real project to learn the one thing the task teaches.
 *
 * So files are a `Map<string, string>` scoped to the interpreter instance.
 * Writing then reading inside one program works exactly as it does on disk;
 * nothing survives pressing Run again, which is the honest simulation — a real
 * save file would persist, but a lesson that quietly accumulated state between
 * runs would be a worse lie than one that starts clean every time.
 *
 * Only the surface the lab touches is implemented. `using` *statements* are not
 * parsed by this playground at all, so every example closes its writer by hand
 * with `Close()`, which is also what Lab8.pdf's own screenshots do.
 */

import type { Pos } from './ast';
import { mkBool, mkInt, NULL, VOID, type StructObj, type Value } from './values';
import type { BuiltinHost } from './builtins';

/** Reader/writer state is kept under keys a C# identifier cannot spell. */
const PATH = '$path';
const BUF = '$buf';
const LINES = '$lines';
const AT = '$at';
const OPEN = '$open';

export interface FileSystem {
  /** Path -> whole file contents. Reset with the interpreter. */
  files: Map<string, string>;
  statics: string[];
  construct(name: string, args: Value[], pos: Pos): Value | undefined;
  callStatic(member: string, args: Value[], pos: Pos): Value | undefined;
  readMember(obj: StructObj, name: string): Value | undefined;
  callMethod(obj: StructObj, name: string, args: Value[], pos: Pos, recv: Value): Value | undefined;
  /** True for the two struct types this module owns. */
  owns(type: string): boolean;
}

export function installFileSystem(host: BuiltinHost): FileSystem {
  const heap = host.heap;
  const S = (s: string) => heap.newString(s);
  const files = new Map<string, string>();

  const pathOf = (v: Value, pos: Pos): string => {
    const s = host.stringOf(v);
    if (s === undefined) {
      throw host.mkException('ArgumentException', 'A file path has to be a string.', pos);
    }
    return s;
  };

  /** What `WriteLine(x)` puts in the file, for any x the student passes. */
  const textOf = (v: Value | undefined): string => {
    if (v === undefined || v.k === 'null') return '';
    return host.stringOf(v) ?? host.display(v);
  };

  /**
   * Split a file into lines the way `StreamReader.ReadLine` walks it.
   *
   * A file written with `WriteLine` ends in a newline, and .NET does *not*
   * report a final empty line for that trailing terminator — it just reports
   * end of stream. Getting this wrong would hand students a phantom blank
   * line at the end of every save file they read back.
   */
  const linesOf = (text: string): string[] => {
    const normalised = text.replace(/\r\n/g, '\n');
    const parts = normalised.split('\n');
    if (parts.length && parts[parts.length - 1] === '') parts.pop();
    return parts;
  };

  const readerState = (obj: StructObj) => {
    const lines = obj.fields.get(LINES);
    const at = obj.fields.get(AT);
    const all = lines?.k === 'ref' ? heap.tryGet(lines.id) : undefined;
    const items = all?.k === 'list' ? all.elements : [];
    return { items, at: at?.k === 'int' ? at.v : 0 };
  };

  const isOpen = (obj: StructObj): boolean => {
    const f = obj.fields.get(OPEN);
    return f?.k === 'bool' ? f.v : false;
  };

  const requireOpen = (obj: StructObj, what: string, pos: Pos) => {
    if (!isOpen(obj)) {
      throw host.mkException(
        'ObjectDisposedException',
        `This ${obj.type} has already been closed, so ${what} cannot run. Do the reading and writing before you call Close().`,
        pos,
      );
    }
  };

  function construct(name: string, args: Value[], pos: Pos): Value | undefined {
    if (name === 'StreamWriter') {
      const path = pathOf(args[0], pos);
      // `new StreamWriter(path, true)` appends; the one-argument form truncates,
      // which is the difference between a save file and a growing log.
      const append = args[1]?.k === 'bool' ? args[1].v : false;
      const start = append ? files.get(path) ?? '' : '';
      files.set(path, start);
      return heap.allocRef({
        k: 'struct',
        type: 'StreamWriter',
        fields: new Map<string, Value>([
          [PATH, S(path)],
          [BUF, S(start)],
          [OPEN, mkBool(true)],
        ]),
      });
    }

    if (name === 'StreamReader') {
      const path = pathOf(args[0], pos);
      const text = files.get(path);
      if (text === undefined) {
        throw host.mkException(
          'FileNotFoundException',
          `There is no file called "${path}" yet. Write it with a StreamWriter earlier in the same run before you try to read it back.`,
          pos,
        );
      }
      return heap.allocRef({
        k: 'struct',
        type: 'StreamReader',
        fields: new Map<string, Value>([
          [PATH, S(path)],
          [
            LINES,
            heap.allocRef({ k: 'list', elementType: 'string', elements: linesOf(text).map(S) }),
          ],
          [AT, mkInt(0)],
          [OPEN, mkBool(true)],
        ]),
      });
    }

    return undefined;
  }

  function callStatic(member: string, args: Value[], pos: Pos): Value | undefined {
    switch (member) {
      case 'Exists':
        return mkBool(files.has(pathOf(args[0], pos)));
      case 'ReadAllText': {
        const path = pathOf(args[0], pos);
        const text = files.get(path);
        if (text === undefined) {
          throw host.mkException(
            'FileNotFoundException',
            `There is no file called "${path}" yet.`,
            pos,
          );
        }
        return S(text);
      }
      case 'ReadAllLines': {
        const path = pathOf(args[0], pos);
        const text = files.get(path);
        if (text === undefined) {
          throw host.mkException(
            'FileNotFoundException',
            `There is no file called "${path}" yet.`,
            pos,
          );
        }
        return heap.allocRef({
          k: 'array',
          elementType: 'string',
          elements: linesOf(text).map(S),
        });
      }
      case 'WriteAllText':
        files.set(pathOf(args[0], pos), textOf(args[1]));
        return VOID;
      case 'AppendAllText': {
        const path = pathOf(args[0], pos);
        files.set(path, (files.get(path) ?? '') + textOf(args[1]));
        return VOID;
      }
      case 'Delete':
        files.delete(pathOf(args[0], pos));
        return VOID;
      default:
        return undefined;
    }
  }

  function readMember(obj: StructObj, name: string): Value | undefined {
    if (obj.type === 'StreamReader' && name === 'EndOfStream') {
      const { items, at } = readerState(obj);
      return mkBool(at >= items.length);
    }
    return undefined;
  }

  function callMethod(
    obj: StructObj,
    name: string,
    args: Value[],
    pos: Pos,
    recv: Value,
  ): Value | undefined {
    if (obj.type === 'StreamWriter') {
      const path = host.stringOf(obj.fields.get(PATH) ?? NULL) ?? '';
      const buf = host.stringOf(obj.fields.get(BUF) ?? NULL) ?? '';
      const commit = (next: string) => {
        obj.fields.set(BUF, S(next));
        files.set(path, next);
      };
      switch (name) {
        case 'Write':
          requireOpen(obj, 'Write', pos);
          commit(buf + textOf(args[0]));
          return VOID;
        case 'WriteLine':
          requireOpen(obj, 'WriteLine', pos);
          commit(buf + textOf(args[0]) + '\n');
          return VOID;
        case 'Flush':
          requireOpen(obj, 'Flush', pos);
          return VOID;
        case 'Close':
        case 'Dispose':
          obj.fields.set(OPEN, mkBool(false));
          return VOID;
        case 'ToString':
          return S('System.IO.StreamWriter');
        default:
          return undefined;
      }
    }

    if (obj.type === 'StreamReader') {
      switch (name) {
        case 'ReadLine': {
          requireOpen(obj, 'ReadLine', pos);
          const { items, at } = readerState(obj);
          // Past the end, .NET hands back null rather than throwing — which is
          // exactly the loop condition `while ((line = r.ReadLine()) != null)`
          // depends on.
          if (at >= items.length) return NULL;
          obj.fields.set(AT, mkInt(at + 1));
          return items[at];
        }
        case 'ReadToEnd': {
          requireOpen(obj, 'ReadToEnd', pos);
          const { items, at } = readerState(obj);
          obj.fields.set(AT, mkInt(items.length));
          const rest = items.slice(at).map((v) => host.stringOf(v) ?? '');
          return S(rest.length ? rest.join('\n') + '\n' : '');
        }
        case 'Close':
        case 'Dispose':
          obj.fields.set(OPEN, mkBool(false));
          return VOID;
        case 'ToString':
          return S('System.IO.StreamReader');
        default:
          return undefined;
      }
    }

    void recv;
    return undefined;
  }

  return {
    files,
    statics: ['File'],
    construct,
    callStatic,
    readMember,
    callMethod,
    owns: (type: string) => type === 'StreamWriter' || type === 'StreamReader',
  };
}
