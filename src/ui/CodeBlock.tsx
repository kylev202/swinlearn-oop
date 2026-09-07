/**
 * Static C# code display with lightweight highlighting.
 *
 * The lexer the interpreter uses is overkill here (and would choke on the
 * deliberately-incomplete snippets in lesson prose), so this is a forgiving
 * regex pass that never throws on partial code.
 */

import type { ReactNode } from 'react';

const KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked', 'class',
  'const', 'continue', 'decimal', 'default', 'do', 'double', 'else', 'enum', 'false', 'finally',
  'float', 'for', 'foreach', 'get', 'if', 'in', 'int', 'interface', 'internal', 'is', 'long',
  'namespace', 'new', 'null', 'object', 'out', 'override', 'params', 'private', 'protected',
  'public', 'readonly', 'ref', 'return', 'sealed', 'set', 'short', 'static', 'string', 'struct',
  'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'using',
  'value', 'var', 'virtual', 'void', 'while',
]);

const COLORS = {
  keyword: '#a6316f',
  keywordDark: '#f090bd',
  string: '#2f7d55',
  stringDark: '#7fd0a0',
  comment: '#8f8d86',
  commentDark: '#76756f',
  number: '#8a5a12',
  numberDark: '#dcb861',
  type: '#2b5f8f',
  typeDark: '#7db1e0',
};

/**
 * Split into styled spans. Uses CSS custom properties so the same markup
 * works in both themes without re-rendering.
 */
export function highlightCsharp(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern =
    /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?[fdmLu]?\b)|([A-Za-z_]\w*)/g;

  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = pattern.exec(code)) !== null) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const tok = m[0];
    const key = i++;

    if (m[1] || m[2]) {
      out.push(<span key={key} style={{ color: 'var(--hl-comment)', fontStyle: 'italic' }}>{tok}</span>);
    } else if (m[3] || m[4]) {
      out.push(<span key={key} style={{ color: 'var(--hl-string)' }}>{tok}</span>);
    } else if (m[5]) {
      out.push(<span key={key} style={{ color: 'var(--hl-number)' }}>{tok}</span>);
    } else if (m[6]) {
      if (KEYWORDS.has(tok)) {
        out.push(<span key={key} style={{ color: 'var(--hl-keyword)', fontWeight: 600 }}>{tok}</span>);
      } else if (/^[A-Z]/.test(tok)) {
        out.push(<span key={key} style={{ color: 'var(--hl-type)' }}>{tok}</span>);
      } else {
        out.push(tok);
      }
    }
    last = m.index + tok.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({
  code,
  caption,
  right,
}: {
  code: string;
  caption?: string;
  right?: ReactNode;
}) {
  return (
    <div className="code-card">
      {(caption || right) && (
        <div className="code-card-head">
          <span>{caption}</span>
          <span style={{ flex: 1 }} />
          {right}
        </div>
      )}
      <pre>
        <code>{highlightCsharp(code)}</code>
      </pre>
    </div>
  );
}
