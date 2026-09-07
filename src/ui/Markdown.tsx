/**
 * A deliberately small markdown renderer.
 *
 * Content is authored in this repo, never supplied by a user, so this covers
 * exactly what the lessons use — paragraphs, lists, bold/italic, inline code,
 * indented code blocks and links — without pulling in a parser and a
 * sanitiser. Nothing here interprets raw HTML.
 */

import { Fragment, type ReactNode } from 'react';

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Order matters: code first, so **bold** inside `code` stays literal.
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${i++}`;

    if (tok.startsWith('`')) {
      out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith('**')) {
      out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('[')) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (linkMatch) {
        out.push(
          <a key={key} href={linkMatch[2]} target="_blank" rel="noreferrer noopener">
            {linkMatch[1]}
          </a>,
        );
      }
    } else {
      out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * The same inline pass without the block wrapper, for the places that hold one
 * line of authored text inside their own chrome — a quiz option, a checklist
 * point — and must not gain a paragraph's margins.
 */
export function InlineMd({ md }: { md: string }) {
  return <>{inline(md, 'i')}</>;
}

export function Markdown({ md }: { md: string }) {
  const lines = md.split('\n');
  const blocks: ReactNode[] = [];

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;
  let key = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ').trim();
    if (text) blocks.push(<p key={`p${key++}`}>{inline(text, `p${key}`)}</p>);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it, `li${key}-${i}`)}</li>);
    blocks.push(list.ordered ? <ol key={`l${key++}`}>{items}</ol> : <ul key={`l${key++}`}>{items}</ul>);
    list = null;
  };

  const flushCode = () => {
    if (!code) return;
    blocks.push(
      <pre key={`c${key++}`}>
        <code>{code.join('\n')}</code>
      </pre>,
    );
    code = null;
  };

  for (const raw of lines) {
    // A four-space indent starts (or continues) a code block.
    if (/^ {4}\S/.test(raw) || (code !== null && /^ {4}/.test(raw))) {
      flushParagraph();
      flushList();
      code = code ?? [];
      code.push(raw.slice(4));
      continue;
    }
    if (code !== null && raw.trim() === '') {
      code.push('');
      continue;
    }
    if (code !== null) {
      // Trailing blank lines belong to the paragraph after, not the code.
      while (code.length && code[code.length - 1] === '') code.pop();
      flushCode();
    }

    if (raw.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(raw);
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(raw);

    if (bullet || numbered) {
      flushParagraph();
      const ordered = !!numbered;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }

    flushList();
    paragraph.push(raw.trim());
  }

  if (code !== null) {
    while (code.length && code[code.length - 1] === '') code.pop();
    flushCode();
  }
  flushParagraph();
  flushList();

  return <div className="md">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
