/**
 * Lexer for the COS20007 C# teaching subset.
 *
 * Produces a flat token stream with 1-based line/col so every runtime step can
 * point back at the exact source the student wrote.
 */

export type TokenType =
  | 'ident'
  | 'keyword'
  | 'int'
  | 'real'
  | 'string'
  | 'interp'
  | 'char'
  | 'punct'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  /** For interpolated strings: the raw parts split on holes. */
  parts?: InterpPart[];
  line: number;
  col: number;
  pos: number;
  end: number;
}

export type InterpPart =
  | { kind: 'text'; text: string }
  | { kind: 'hole'; src: string; line: number; col: number };

export const KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked', 'class',
  'const', 'continue', 'decimal', 'default', 'do', 'double', 'else', 'enum', 'false', 'finally',
  'float', 'for', 'foreach', 'get', 'if', 'in', 'int', 'interface', 'internal', 'is', 'long',
  'namespace', 'new', 'null', 'object', 'out', 'override', 'params', 'private', 'protected',
  'public', 'readonly', 'ref', 'return', 'sealed', 'set', 'short', 'static', 'string', 'struct',
  'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'using',
  'value', 'var', 'virtual', 'void', 'while',
]);

/** Multi-char operators, longest first so greedy matching works. */
const PUNCT = [
  '<<=', '>>=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=',
  '^=', '??', '?.', '::', '<<', '>>',
  '{', '}', '(', ')', '[', ']', ';', ',', '.', ':', '?', '+', '-', '*', '/', '%', '=', '<', '>',
  '!', '&', '|', '^', '~',
];

export class LexError extends Error {
  constructor(message: string, public line: number, public col: number) {
    super(message);
    this.name = 'LexError';
  }
}

const isDigit = (c: string) => c >= '0' && c <= '9';
const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
const isIdentPart = (c: string) => /[A-Za-z0-9_]/.test(c);

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const peek = (o = 0) => src[i + o] ?? '';
  const atEnd = () => i >= src.length;

  function advance(n = 1) {
    for (let k = 0; k < n; k++) {
      if (src[i] === '\n') { line++; col = 1; } else { col++; }
      i++;
    }
  }

  function push(
    type: TokenType,
    value: string,
    startLine: number,
    startCol: number,
    startPos: number,
    parts?: InterpPart[],
  ) {
    tokens.push({ type, value, line: startLine, col: startCol, pos: startPos, end: i, parts });
  }

  function readEscape(): string {
    const e = peek();
    advance();
    switch (e) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case '0': return '\0';
      case '\\': return '\\';
      case "'": return "'";
      case '"': return '"';
      case 'a': return '\x07';
      case 'b': return '\b';
      case 'f': return '\f';
      case 'v': return '\v';
      case 'u': {
        let hex = '';
        for (let k = 0; k < 4; k++) { hex += peek(); advance(); }
        return String.fromCharCode(parseInt(hex, 16));
      }
      default: return e;
    }
  }

  function readPlainString(verbatim: boolean): string {
    const sl = line, sc = col;
    let out = '';
    for (;;) {
      if (atEnd()) throw new LexError('Unterminated string — I never found the closing quote.', sl, sc);
      const ch = peek();
      if (ch === '"') {
        if (verbatim && peek(1) === '"') { out += '"'; advance(2); continue; }
        advance();
        return out;
      }
      if (!verbatim && ch === '\\') { advance(); out += readEscape(); continue; }
      if (!verbatim && ch === '\n') {
        throw new LexError('Unterminated string — a plain "..." cannot span lines.', sl, sc);
      }
      out += ch;
      advance();
    }
  }

  function readInterpolated(verbatim: boolean): InterpPart[] {
    const sl = line, sc = col;
    const parts: InterpPart[] = [];
    let text = '';
    for (;;) {
      if (atEnd()) throw new LexError('Unterminated interpolated string — I never found the closing quote.', sl, sc);
      const ch = peek();
      if (ch === '"') {
        if (verbatim && peek(1) === '"') { text += '"'; advance(2); continue; }
        advance();
        if (text) parts.push({ kind: 'text', text });
        return parts;
      }
      if (ch === '{') {
        if (peek(1) === '{') { text += '{'; advance(2); continue; }
        if (text) { parts.push({ kind: 'text', text }); text = ''; }
        advance();
        const hl = line, hc = col;
        let depth = 1;
        let expr = '';
        while (!atEnd() && depth > 0) {
          const h = peek();
          if (h === '{') { depth++; }
          else if (h === '}') { depth--; if (depth === 0) break; }
          else if (h === '"') {
            expr += h;
            advance();
            while (!atEnd() && peek() !== '"') {
              if (peek() === '\\') { expr += peek(); advance(); }
              expr += peek();
              advance();
            }
          }
          expr += peek();
          advance();
        }
        advance();
        parts.push({ kind: 'hole', src: expr, line: hl, col: hc });
        continue;
      }
      if (ch === '}' && peek(1) === '}') { text += '}'; advance(2); continue; }
      if (!verbatim && ch === '\\') { advance(); text += readEscape(); continue; }
      text += ch;
      advance();
    }
  }

  while (!atEnd()) {
    const c = peek();

    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { advance(); continue; }

    if (c === '/' && peek(1) === '/') {
      while (!atEnd() && peek() !== '\n') advance();
      continue;
    }
    if (c === '/' && peek(1) === '*') {
      const sl = line, sc = col;
      advance(2);
      while (!atEnd() && !(peek() === '*' && peek(1) === '/')) advance();
      if (atEnd()) throw new LexError('Unterminated block comment — did you forget the closing */ ?', sl, sc);
      advance(2);
      continue;
    }

    const startLine = line, startCol = col, startPos = i;

    // $"..", @"..", $@".." and @$".."
    if (c === '$' || c === '@') {
      let interp = false, verbatim = false, k = 0;
      while (peek(k) === '$' || peek(k) === '@') {
        if (peek(k) === '$') interp = true; else verbatim = true;
        k++;
      }
      if (peek(k) === '"') {
        advance(k + 1);
        if (interp) {
          push('interp', '', startLine, startCol, startPos, readInterpolated(verbatim));
        } else {
          push('string', readPlainString(verbatim), startLine, startCol, startPos);
        }
        continue;
      }
    }

    if (c === '"') {
      advance();
      push('string', readPlainString(false), startLine, startCol, startPos);
      continue;
    }

    if (c === "'") {
      advance();
      let ch: string;
      if (peek() === '\\') { advance(); ch = readEscape(); }
      else { ch = peek(); advance(); }
      if (peek() !== "'") {
        throw new LexError('Unterminated character literal — expected a closing quote.', startLine, startCol);
      }
      advance();
      push('char', ch, startLine, startCol, startPos);
      continue;
    }

    if (isDigit(c) || (c === '.' && isDigit(peek(1)))) {
      let text = '';
      let isReal = false;
      while (isDigit(peek()) || peek() === '_') { if (peek() !== '_') text += peek(); advance(); }
      if (peek() === '.' && isDigit(peek(1))) {
        isReal = true; text += '.'; advance();
        while (isDigit(peek()) || peek() === '_') { if (peek() !== '_') text += peek(); advance(); }
      }
      if (peek() === 'e' || peek() === 'E') {
        isReal = true; text += 'e'; advance();
        if (peek() === '+' || peek() === '-') { text += peek(); advance(); }
        while (isDigit(peek())) { text += peek(); advance(); }
      }
      let suffix = '';
      while (/[fFdDmMlLuU]/.test(peek())) { suffix += peek().toLowerCase(); advance(); }
      if (suffix.includes('f') || suffix.includes('d') || suffix.includes('m')) isReal = true;
      push(isReal ? 'real' : 'int', text + (suffix ? '#' + suffix : ''), startLine, startCol, startPos);
      continue;
    }

    if (isIdentStart(c)) {
      let text = '';
      while (isIdentPart(peek())) { text += peek(); advance(); }
      push(KEYWORDS.has(text) ? 'keyword' : 'ident', text, startLine, startCol, startPos);
      continue;
    }

    const op = PUNCT.find((p) => src.startsWith(p, i));
    if (op) {
      advance(op.length);
      push('punct', op, startLine, startCol, startPos);
      continue;
    }

    throw new LexError(`I don't recognise the character '${c}' here.`, line, col);
  }

  tokens.push({ type: 'eof', value: '', line, col, pos: i, end: i });
  return tokens;
}
