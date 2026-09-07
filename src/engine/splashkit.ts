/**
 * SplashKit shim backed by an HTML canvas.
 *
 * Weeks 4 and 5 build ShapeDrawer against the real SplashKit SDK, which needs
 * MSYS2, `skm`, and a native toolchain — the single biggest reason students
 * stall before writing any OOP. This shim implements the exact surface those
 * two labs use, so the same source runs unmodified in the browser while the
 * student is still learning, and again on their machine when they submit.
 *
 * Only what the labs touch is implemented. Anything else raises a clear
 * "not available in the browser" message rather than failing silently.
 */

import type { Pos, TypeRef } from './ast';
import {
  mkBool, mkDouble, mkFloat, mkInt, NULL, VOID,
  type HeapObject, type StructObj, type Value,
} from './values';
import type { BGen, BuiltinHost } from './builtins';

// ------------------------------------------------------------- draw commands

export type DrawCommand =
  | { c: 'clear'; color: RGBA }
  | { c: 'fillRect'; color: RGBA; x: number; y: number; w: number; h: number }
  | { c: 'drawRect'; color: RGBA; x: number; y: number; w: number; h: number }
  | { c: 'fillCircle'; color: RGBA; x: number; y: number; r: number }
  | { c: 'drawCircle'; color: RGBA; x: number; y: number; r: number }
  | { c: 'fillEllipse'; color: RGBA; x: number; y: number; w: number; h: number }
  | { c: 'drawEllipse'; color: RGBA; x: number; y: number; w: number; h: number }
  | { c: 'line'; color: RGBA; x1: number; y1: number; x2: number; y2: number }
  | { c: 'text'; color: RGBA; text: string; x: number; y: number; size: number };

export interface RGBA { r: number; g: number; b: number; a: number }

export interface SplashKitInput {
  mouseX: number;
  mouseY: number;
  /** Buttons clicked since the last ProcessEvents. */
  clicked: Set<string>;
  down: Set<string>;
  /** Keys typed since the last ProcessEvents. */
  typed: Set<string>;
  keysDown: Set<string>;
}

export interface SplashKitState {
  /** True once the program creates a Window. */
  active: boolean;
  title: string;
  width: number;
  height: number;
  /** Commands accumulating for the frame being built. */
  pending: DrawCommand[];
  /** The last completed frame, ready to paint. */
  frame: DrawCommand[];
  frameCount: number;
  closeRequested: boolean;
  input: SplashKitInput;
  /** Events staged by the UI, applied on the next ProcessEvents. */
  queued: SplashKitInput;
  /** Safety net when nothing is driving frames (e.g. a headless test run). */
  maxFrames: number;
}

export function newSplashKitState(): SplashKitState {
  const emptyInput = (): SplashKitInput => ({
    mouseX: 0, mouseY: 0,
    clicked: new Set(), down: new Set(), typed: new Set(), keysDown: new Set(),
  });
  return {
    active: false,
    title: 'SplashKit',
    width: 800,
    height: 600,
    pending: [],
    frame: [],
    frameCount: 0,
    closeRequested: false,
    input: emptyInput(),
    queued: emptyInput(),
    maxFrames: 100_000,
  };
}

export interface SplashKitRuntime {
  staticTypes: string[];
  state: SplashKitState;
  readStatic(type: string, member: string): Value | undefined;
  writeStatic(type: string, member: string, v: Value): boolean;
  callStatic(type: string, member: string, args: Value[], pos: Pos): BGen;
  construct(type: TypeRef, args: Value[], pos: Pos): BGen;
  readStructMember(obj: StructObj, name: string, ref: Value): Value | undefined;
  writeStructMember(obj: StructObj, name: string, v: Value, ref: Value): boolean;
  callStructMethod(obj: StructObj, name: string, args: Value[], pos: Pos, recv: Value): BGen;
  defaultFor(type: TypeRef): Value | undefined;
}

// --------------------------------------------------------------- the palette

/** The named colours SplashKit exposes, matching the .NET/X11 names. */
const COLORS: Record<string, [number, number, number]> = {
  AliceBlue: [240, 248, 255], AntiqueWhite: [250, 235, 215], Aqua: [0, 255, 255],
  Aquamarine: [127, 255, 212], Azure: [240, 255, 255], Beige: [245, 245, 220],
  Bisque: [255, 228, 196], Black: [0, 0, 0], BlanchedAlmond: [255, 235, 205],
  Blue: [0, 0, 255], BlueViolet: [138, 43, 226], Brown: [165, 42, 42],
  BurlyWood: [222, 184, 135], CadetBlue: [95, 158, 160], Chartreuse: [127, 255, 0],
  Chocolate: [210, 105, 30], Coral: [255, 127, 80], CornflowerBlue: [100, 149, 237],
  Cornsilk: [255, 248, 220], Crimson: [220, 20, 60], Cyan: [0, 255, 255],
  DarkBlue: [0, 0, 139], DarkCyan: [0, 139, 139], DarkGoldenrod: [184, 134, 11],
  DarkGray: [169, 169, 169], DarkGreen: [0, 100, 0], DarkKhaki: [189, 183, 107],
  DarkMagenta: [139, 0, 139], DarkOliveGreen: [85, 107, 47], DarkOrange: [255, 140, 0],
  DarkOrchid: [153, 50, 204], DarkRed: [139, 0, 0], DarkSalmon: [233, 150, 122],
  DarkSeaGreen: [143, 188, 143], DarkSlateBlue: [72, 61, 139], DarkSlateGray: [47, 79, 79],
  DarkTurquoise: [0, 206, 209], DarkViolet: [148, 0, 211], DeepPink: [255, 20, 147],
  DeepSkyBlue: [0, 191, 255], DimGray: [105, 105, 105], DodgerBlue: [30, 144, 255],
  Firebrick: [178, 34, 34], FloralWhite: [255, 250, 240], ForestGreen: [34, 139, 34],
  Fuchsia: [255, 0, 255], Gainsboro: [220, 220, 220], GhostWhite: [248, 248, 255],
  Gold: [255, 215, 0], Goldenrod: [218, 165, 32], Gray: [128, 128, 128],
  Green: [0, 128, 0], GreenYellow: [173, 255, 47], Honeydew: [240, 255, 240],
  HotPink: [255, 105, 180], IndianRed: [205, 92, 92], Indigo: [75, 0, 130],
  Ivory: [255, 255, 240], Khaki: [240, 230, 140], Lavender: [230, 230, 250],
  LavenderBlush: [255, 240, 245], LawnGreen: [124, 252, 0], LemonChiffon: [255, 250, 205],
  LightBlue: [173, 216, 230], LightCoral: [240, 128, 128], LightCyan: [224, 255, 255],
  LightGoldenrodYellow: [250, 250, 210], LightGray: [211, 211, 211], LightGreen: [144, 238, 144],
  LightPink: [255, 182, 193], LightSalmon: [255, 160, 122], LightSeaGreen: [32, 178, 170],
  LightSkyBlue: [135, 206, 250], LightSlateGray: [119, 136, 153], LightSteelBlue: [176, 196, 222],
  LightYellow: [255, 255, 224], Lime: [0, 255, 0], LimeGreen: [50, 205, 50],
  Linen: [250, 240, 230], Magenta: [255, 0, 255], Maroon: [128, 0, 0],
  MediumAquamarine: [102, 205, 170], MediumBlue: [0, 0, 205], MediumOrchid: [186, 85, 211],
  MediumPurple: [147, 112, 219], MediumSeaGreen: [60, 179, 113], MediumSlateBlue: [123, 104, 238],
  MediumSpringGreen: [0, 250, 154], MediumTurquoise: [72, 209, 204], MediumVioletRed: [199, 21, 133],
  MidnightBlue: [25, 25, 112], MintCream: [245, 255, 250], MistyRose: [255, 228, 225],
  Moccasin: [255, 228, 181], NavajoWhite: [255, 222, 173], Navy: [0, 0, 128],
  OldLace: [253, 245, 230], Olive: [128, 128, 0], OliveDrab: [107, 142, 35],
  Orange: [255, 165, 0], OrangeRed: [255, 69, 0], Orchid: [218, 112, 214],
  PaleGoldenrod: [238, 232, 170], PaleGreen: [152, 251, 152], PaleTurquoise: [175, 238, 238],
  PaleVioletRed: [219, 112, 147], PapayaWhip: [255, 239, 213], PeachPuff: [255, 218, 185],
  Peru: [205, 133, 63], Pink: [255, 192, 203], Plum: [221, 160, 221],
  PowderBlue: [176, 224, 230], Purple: [128, 0, 128], Red: [255, 0, 0],
  RosyBrown: [188, 143, 143], RoyalBlue: [65, 105, 225], SaddleBrown: [139, 69, 19],
  Salmon: [250, 128, 114], SandyBrown: [244, 164, 96], SeaGreen: [46, 139, 87],
  SeaShell: [255, 245, 238], Sienna: [160, 82, 45], Silver: [192, 192, 192],
  SkyBlue: [135, 206, 235], SlateBlue: [106, 90, 205], SlateGray: [112, 128, 144],
  Snow: [255, 250, 250], SpringGreen: [0, 255, 127], SteelBlue: [70, 130, 180],
  Tan: [210, 180, 140], Teal: [0, 128, 128], Thistle: [216, 191, 216],
  Tomato: [255, 99, 71], Turquoise: [64, 224, 208], Violet: [238, 130, 238],
  Wheat: [245, 222, 179], White: [255, 255, 255], WhiteSmoke: [245, 245, 245],
  Yellow: [255, 255, 0], YellowGreen: [154, 205, 50],
};

const COLOR_NAMES = Object.keys(COLORS);

/** Key names accepted by KeyCode, mapped to browser KeyboardEvent.key values. */
const KEY_ALIASES: Record<string, string> = {
  SpaceKey: ' ', ReturnKey: 'Enter', EscapeKey: 'Escape', TabKey: 'Tab',
  BackspaceKey: 'Backspace', DeleteKey: 'Delete', UpKey: 'ArrowUp', DownKey: 'ArrowDown',
  LeftKey: 'ArrowLeft', RightKey: 'ArrowRight', LeftShiftKey: 'Shift', RightShiftKey: 'Shift',
};

function keyCodeToBrowserKey(name: string): string {
  if (KEY_ALIASES[name]) return KEY_ALIASES[name];
  const m = /^([A-Z])Key$/.exec(name);
  if (m) return m[1].toLowerCase();
  const d = /^Num([0-9])Key$/.exec(name);
  if (d) return d[1];
  return name.replace(/Key$/, '').toLowerCase();
}

// ------------------------------------------------------------------ install

export function installSplashKit(host: BuiltinHost): SplashKitRuntime {
  const heap = host.heap;
  const state = newSplashKitState();
  const S = (s: string) => heap.newString(s);

  const num = (v: Value, pos: Pos): number => {
    if (v.k === 'int' || v.k === 'long' || v.k === 'float' || v.k === 'double') return v.v;
    if (v.k === 'char') return v.v.charCodeAt(0);
    if (v.k === 'enum') return v.v;
    throw host.mkException('ArgumentException', `SplashKit expected a number here but got a ${v.k}.`, pos);
  };

  function makeColor(name: string, r: number, g: number, b: number, a = 255): Value {
    return heap.allocRef({
      k: 'struct', type: 'Color',
      fields: new Map<string, Value>([
        ['Name', S(name)],
        ['R', mkInt(r)], ['G', mkInt(g)], ['B', mkInt(b)], ['A', mkInt(a)],
      ]),
    });
  }

  function namedColor(name: string): Value | undefined {
    const c = COLORS[name];
    if (!c) return undefined;
    return makeColor(name, c[0], c[1], c[2]);
  }

  function toRGBA(v: Value): RGBA {
    if (v.k === 'ref') {
      const o = heap.tryGet(v.id);
      if (o?.k === 'struct' && o.type === 'Color') {
        const g = (k: string, d: number) => {
          const f = o.fields.get(k);
          return f && (f.k === 'int' || f.k === 'double' || f.k === 'float') ? f.v : d;
        };
        return { r: g('R', 0), g: g('G', 0), b: g('B', 0), a: g('A', 255) };
      }
    }
    return { r: 0, g: 0, b: 0, a: 255 };
  }

  function makePoint(x: number, y: number): Value {
    return heap.allocRef({
      k: 'struct', type: 'Point2D',
      fields: new Map<string, Value>([['X', mkDouble(x)], ['Y', mkDouble(y)]]),
    });
  }

  function pointOf(v: Value): { x: number; y: number } | undefined {
    if (v.k !== 'ref') return undefined;
    const o = heap.tryGet(v.id);
    if (o?.k !== 'struct' || o.type !== 'Point2D') return undefined;
    const gx = o.fields.get('X'), gy = o.fields.get('Y');
    const n = (f?: Value) => (f && (f.k === 'int' || f.k === 'double' || f.k === 'float') ? f.v : 0);
    return { x: n(gx), y: n(gy) };
  }

  function makeRectangle(x: number, y: number, w: number, h: number): Value {
    return heap.allocRef({
      k: 'struct', type: 'Rectangle',
      fields: new Map<string, Value>([
        ['X', mkDouble(x)], ['Y', mkDouble(y)],
        ['Width', mkDouble(w)], ['Height', mkDouble(h)],
      ]),
    });
  }

  let randomSeed = 0x9e3779b9;
  const rand = () => {
    randomSeed ^= randomSeed << 13; randomSeed ^= randomSeed >>> 17; randomSeed ^= randomSeed << 5;
    return ((randomSeed >>> 0) % 1_000_000) / 1_000_000;
  };

  /** Enum-ish members exposed as `MouseButton.LeftButton` / `KeyCode.SpaceKey`. */
  function enumMember(type: string, member: string): Value {
    return { k: 'enum', type, name: member, v: hashName(member) };
  }

  function requireWindow(what: string, pos: Pos) {
    if (!state.active) {
      throw host.mkException(
        'InvalidOperationException',
        `${what} needs a window. Create one first: Window w = new Window("Title", 800, 600);`,
        pos,
      );
    }
  }

  // ------------------------------------------------------------- statics

  function readStatic(type: string, member: string): Value | undefined {
    if (type === 'Color') {
      const c = namedColor(member);
      if (c) return c;
    }
    if (type === 'MouseButton' || type === 'KeyCode') return enumMember(type, member);
    return undefined;
  }

  function writeStatic(): boolean { return false; }

  function* callStatic(type: string, member: string, args: Value[], pos: Pos): BGen {
    if (type === 'Color') {
      if (member === 'RGBColor' || member === 'RGBAColor') {
        return makeColor('custom', num(args[0], pos), num(args[1], pos), num(args[2], pos),
          args.length > 3 ? num(args[3], pos) : 255);
      }
      if (member === 'RandomRGB' || member === 'RandomColor') {
        const name = COLOR_NAMES[Math.floor(rand() * COLOR_NAMES.length)];
        return namedColor(name)!;
      }
      const c = namedColor(member);
      if (c) return c;
      return undefined;
    }

    if (type !== 'SplashKit') return undefined;

    switch (member) {
      // ---- lifecycle -------------------------------------------------------
      case 'ProcessEvents': {
        // Adopt whatever the UI staged since the last frame.
        state.input.mouseX = state.queued.mouseX;
        state.input.mouseY = state.queued.mouseY;
        state.input.clicked = new Set(state.queued.clicked);
        state.input.typed = new Set(state.queued.typed);
        state.input.down = new Set(state.queued.down);
        state.input.keysDown = new Set(state.queued.keysDown);
        state.queued.clicked.clear();
        state.queued.typed.clear();
        return VOID;
      }
      case 'ClearScreen': {
        const color = args.length ? toRGBA(args[0]) : { r: 255, g: 255, b: 255, a: 255 };
        state.pending = [{ c: 'clear', color }];
        return VOID;
      }
      case 'RefreshScreen': {
        state.frame = state.pending;
        state.pending = [];
        state.frameCount++;
        if (state.frameCount > state.maxFrames) {
          throw host.mkException(
            'InvalidOperationException',
            'The game loop ran for too many frames without being stopped.',
            pos,
          );
        }
        // Hand control back so the browser can paint and collect input.
        yield { kind: 'frame', pos, note: `Frame ${state.frameCount}` };
        return VOID;
      }
      case 'OpenWindow': {
        state.active = true;
        state.title = host.stringOf(args[0]) ?? 'SplashKit';
        state.width = num(args[1], pos);
        state.height = num(args[2], pos);
        return heap.allocRef({ k: 'struct', type: 'Window', fields: new Map([['Title', args[0]]]) });
      }
      case 'CloseWindow':
        state.closeRequested = true;
        return VOID;
      case 'Delay':
        return VOID;

      // ---- drawing ---------------------------------------------------------
      case 'FillRectangle':
      case 'DrawRectangle': {
        requireWindow(member, pos);
        const color = toRGBA(args[0]);
        // Overload: (color, Rectangle) or (color, x, y, w, h)
        if (args.length === 2) {
          const r = rectOf(args[1]);
          if (r) {
            state.pending.push({ c: member === 'FillRectangle' ? 'fillRect' : 'drawRect', color, ...r });
            return VOID;
          }
        }
        state.pending.push({
          c: member === 'FillRectangle' ? 'fillRect' : 'drawRect',
          color,
          x: num(args[1], pos), y: num(args[2], pos),
          w: num(args[3], pos), h: num(args[4], pos),
        });
        return VOID;
      }
      case 'FillCircle':
      case 'DrawCircle': {
        requireWindow(member, pos);
        state.pending.push({
          c: member === 'FillCircle' ? 'fillCircle' : 'drawCircle',
          color: toRGBA(args[0]),
          x: num(args[1], pos), y: num(args[2], pos), r: num(args[3], pos),
        });
        return VOID;
      }
      case 'FillEllipse':
      case 'DrawEllipse': {
        requireWindow(member, pos);
        state.pending.push({
          c: member === 'FillEllipse' ? 'fillEllipse' : 'drawEllipse',
          color: toRGBA(args[0]),
          x: num(args[1], pos), y: num(args[2], pos),
          w: num(args[3], pos), h: num(args[4], pos),
        });
        return VOID;
      }
      case 'DrawLine': {
        requireWindow(member, pos);
        state.pending.push({
          c: 'line', color: toRGBA(args[0]),
          x1: num(args[1], pos), y1: num(args[2], pos),
          x2: num(args[3], pos), y2: num(args[4], pos),
        });
        return VOID;
      }
      case 'DrawText': {
        requireWindow(member, pos);
        state.pending.push({
          c: 'text', color: toRGBA(args[1]),
          text: host.display(args[0]),
          x: num(args[2], pos), y: num(args[3], pos), size: 14,
        });
        return VOID;
      }

      // ---- input -----------------------------------------------------------
      case 'MouseX': return mkDouble(state.input.mouseX);
      case 'MouseY': return mkDouble(state.input.mouseY);
      case 'MousePosition': return makePoint(state.input.mouseX, state.input.mouseY);
      case 'MouseClicked': {
        const b = args[0].k === 'enum' ? args[0].name : 'LeftButton';
        return mkBool(state.input.clicked.has(b));
      }
      case 'MouseDown': {
        const b = args[0].k === 'enum' ? args[0].name : 'LeftButton';
        return mkBool(state.input.down.has(b));
      }
      case 'MouseUp': {
        const b = args[0].k === 'enum' ? args[0].name : 'LeftButton';
        return mkBool(!state.input.down.has(b));
      }
      case 'KeyTyped': {
        const k = args[0].k === 'enum' ? keyCodeToBrowserKey(args[0].name) : '';
        return mkBool(state.input.typed.has(k));
      }
      case 'KeyDown': {
        const k = args[0].k === 'enum' ? keyCodeToBrowserKey(args[0].name) : '';
        return mkBool(state.input.keysDown.has(k));
      }
      case 'AnyKeyPressed': return mkBool(state.input.typed.size > 0);
      case 'QuitRequested': return mkBool(state.closeRequested);

      // ---- geometry --------------------------------------------------------
      case 'PointAt': return makePoint(num(args[0], pos), num(args[1], pos));
      case 'RectangleFrom':
        return makeRectangle(num(args[0], pos), num(args[1], pos), num(args[2], pos), num(args[3], pos));
      case 'PointInRectangle': {
        const p = pointOf(args[0]);
        const r = rectOf(args[1]);
        if (!p || !r) return mkBool(false);
        return mkBool(p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
      }
      case 'RandomColor': {
        const name = COLOR_NAMES[Math.floor(rand() * COLOR_NAMES.length)];
        return namedColor(name)!;
      }
      case 'Rnd': {
        if (args.length === 0) return mkDouble(rand());
        return mkInt(Math.floor(rand() * num(args[0], pos)));
      }
      case 'ScreenWidth': return mkInt(state.width);
      case 'ScreenHeight': return mkInt(state.height);
      case 'WriteLine':
        host.writeLine(host.display(args[0]));
        return VOID;

      default:
        throw host.mkException(
          'NotSupportedException',
          `SplashKit.${member}() is not available in the browser playground.`,
          pos,
        );
    }
  }

  function rectOf(v: Value): { x: number; y: number; w: number; h: number } | undefined {
    if (v.k !== 'ref') return undefined;
    const o = heap.tryGet(v.id);
    if (o?.k !== 'struct' || o.type !== 'Rectangle') return undefined;
    const n = (k: string) => {
      const f = o.fields.get(k);
      return f && (f.k === 'int' || f.k === 'double' || f.k === 'float') ? f.v : 0;
    };
    return { x: n('X'), y: n('Y'), w: n('Width'), h: n('Height') };
  }

  // --------------------------------------------------------- construction

  function* construct(type: TypeRef, args: Value[], pos: Pos): BGen {
    switch (type.name) {
      case 'Window': {
        state.active = true;
        state.title = host.stringOf(args[0]) ?? 'SplashKit';
        state.width = args.length > 1 ? num(args[1], pos) : 800;
        state.height = args.length > 2 ? num(args[2], pos) : 600;
        state.closeRequested = false;
        state.frameCount = 0;
        return heap.allocRef({
          k: 'struct', type: 'Window',
          fields: new Map<string, Value>([
            ['Title', S(state.title)],
            ['Width', mkInt(state.width)],
            ['Height', mkInt(state.height)],
          ]),
        });
      }
      case 'Point2D':
        return makePoint(args.length ? num(args[0], pos) : 0, args.length > 1 ? num(args[1], pos) : 0);
      case 'Rectangle':
        return makeRectangle(num(args[0], pos), num(args[1], pos), num(args[2], pos), num(args[3], pos));
      case 'Color':
        return makeColor('custom', num(args[0], pos), num(args[1], pos), num(args[2], pos),
          args.length > 3 ? num(args[3], pos) : 255);
      default:
        return undefined;
    }
  }

  function defaultFor(type: TypeRef): Value | undefined {
    switch (type.name) {
      case 'Color': return makeColor('Black', 0, 0, 0);
      case 'Point2D': return makePoint(0, 0);
      case 'Rectangle': return makeRectangle(0, 0, 0, 0);
      default: return undefined;
    }
  }

  // ------------------------------------------------------- struct members

  function readStructMember(obj: StructObj, name: string, ref: Value): Value | undefined {
    if (obj.type === 'Window') {
      if (name === 'CloseRequested') return mkBool(state.closeRequested);
      if (name === 'Width') return mkInt(state.width);
      if (name === 'Height') return mkInt(state.height);
      if (name === 'Caption' || name === 'Title') return obj.fields.get('Title');
    }
    if (obj.type === 'Color' && name === 'Name') return obj.fields.get('Name');
    if (obj.type === 'StringBuilder' && name === 'Length') {
      const s = host.stringOf(obj.fields.get('value') ?? NULL) ?? '';
      return mkInt(s.length);
    }
    return undefined;
  }

  function writeStructMember(obj: StructObj, name: string, v: Value, ref: Value): boolean {
    if (obj.type === 'Point2D' && (name === 'X' || name === 'Y')) {
      obj.fields.set(name, v);
      return true;
    }
    if (obj.type === 'Rectangle' && ['X', 'Y', 'Width', 'Height'].includes(name)) {
      obj.fields.set(name, v);
      return true;
    }
    return false;
  }

  function* callStructMethod(obj: StructObj, name: string, args: Value[], pos: Pos, recv: Value): BGen {
    switch (obj.type) {
      case 'Window':
        switch (name) {
          case 'Clear':
            state.pending = [{ c: 'clear', color: args.length ? toRGBA(args[0]) : { r: 255, g: 255, b: 255, a: 255 } }];
            return VOID;
          case 'Refresh': {
            state.frame = state.pending;
            state.pending = [];
            state.frameCount++;
            yield { kind: 'frame', pos, note: `Frame ${state.frameCount}` };
            return VOID;
          }
          case 'Close':
            state.closeRequested = true;
            return VOID;
          case 'FillRectangle':
            return yield* callStatic('SplashKit', 'FillRectangle', args, pos);
          case 'DrawRectangle':
            return yield* callStatic('SplashKit', 'DrawRectangle', args, pos);
          case 'ToString':
            return S('Window');
          default:
            return undefined;
        }
      case 'Random':
        if (name === 'Next') {
          if (args.length === 0) return mkInt(Math.floor(rand() * 2147483647));
          if (args.length === 1) return mkInt(Math.floor(rand() * num(args[0], pos)));
          const lo = num(args[0], pos), hi = num(args[1], pos);
          return mkInt(lo + Math.floor(rand() * (hi - lo)));
        }
        if (name === 'NextDouble') return mkDouble(rand());
        return undefined;
      case 'StringBuilder': {
        const cur = host.stringOf(obj.fields.get('value') ?? NULL) ?? '';
        if (name === 'Append') { obj.fields.set('value', S(cur + host.display(args[0]))); return recv; }
        if (name === 'AppendLine') { obj.fields.set('value', S(cur + host.display(args[0] ?? NULL) + '\n')); return recv; }
        if (name === 'ToString') return S(cur);
        if (name === 'Clear') { obj.fields.set('value', S('')); return recv; }
        return undefined;
      }
      case 'Point2D':
        if (name === 'ToString') {
          const p = pointOf(recv)!;
          return S(`Point2D(${p.x}, ${p.y})`);
        }
        return undefined;
      case 'Color':
        if (name === 'ToString') return obj.fields.get('Name');
        return undefined;
      case 'KeyValuePair':
        if (name === 'ToString') {
          return S(`[${host.display(obj.fields.get('Key')!)}, ${host.display(obj.fields.get('Value')!)}]`);
        }
        return undefined;
      default:
        return undefined;
    }
  }

  return {
    staticTypes: ['SplashKit', 'Color', 'MouseButton', 'KeyCode', 'Window', 'Point2D', 'Rectangle'],
    state,
    readStatic, writeStatic, callStatic, construct,
    readStructMember, writeStructMember, callStructMethod, defaultFor,
  };
}

function hashName(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export { COLORS, keyCodeToBrowserKey };
