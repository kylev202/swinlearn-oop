/**
 * CodeMirror theming for the workbench editor.
 *
 * Every colour is a CSS custom property from styles.css, so one theme object
 * serves both light and dark and the editor recolours the instant the topbar
 * toggle flips — no re-mount, no second palette to keep in sync.
 */

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/** Editor chrome: gutters, selection, cursor, tooltips, panels. */
export function editorTheme(dark: boolean) {
  return EditorView.theme(
    {
      '&': {
        color: 'var(--text)',
        backgroundColor: 'var(--editor-bg)',
        height: '100%',
        fontSize: 'var(--editor-size)',
      },
      '.cm-content': {
        caretColor: 'var(--accent)',
        fontFamily: 'var(--mono)',
        padding: '10px 0 32vh',
      },
      '.cm-scroller': {
        fontFamily: 'var(--mono)',
        lineHeight: '1.62',
        overflow: 'auto',
      },

      // ---- cursor and selection
      '.cm-cursor, .cm-dropCursor': { borderLeft: '2px solid var(--accent)' },
      '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--accent)' },
      '.cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'var(--editor-sel) !important',
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: 'var(--editor-sel-focus) !important',
      },
      '.cm-selectionMatch': {
        backgroundColor: 'var(--editor-sel)',
        outline: '1px solid var(--border-strong)',
        borderRadius: '2px',
      },

      // ---- active line
      '.cm-activeLine': { backgroundColor: 'var(--editor-active)' },
      '.cm-activeLineGutter': { backgroundColor: 'var(--editor-active)', color: 'var(--text)' },

      // ---- gutters
      '.cm-gutters': {
        backgroundColor: 'var(--editor-bg)',
        color: 'var(--text-faint)',
        border: 'none',
        borderRight: '1px solid var(--editor-gutter-line)',
        fontVariantNumeric: 'tabular-nums',
        userSelect: 'none',
      },
      '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 14px', minWidth: '38px' },
      '.cm-foldGutter .cm-gutterElement': { padding: '0 3px', opacity: '0.5' },
      '.cm-foldGutter .cm-gutterElement:hover': { opacity: '1', color: 'var(--text)' },

      // ---- brackets
      '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
        backgroundColor: 'transparent',
        outline: '1px solid var(--accent)',
        borderRadius: '2px',
        color: 'inherit !important',
      },
      '.cm-nonmatchingBracket': { color: 'var(--bad) !important' },

      // ---- autocomplete popup
      '.cm-tooltip': {
        border: '1px solid var(--border-strong)',
        backgroundColor: 'var(--bg-raised)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-pop)',
        overflow: 'hidden',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul': {
        fontFamily: 'var(--mono)',
        fontSize: '12.5px',
        maxHeight: '17em',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
        padding: '3px 9px',
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        lineHeight: '1.7',
      },
      '.cm-tooltip-autocomplete ul li[aria-selected]': {
        backgroundColor: 'var(--accent-soft)',
        color: 'var(--text)',
      },
      '.cm-completionLabel': { flex: '1 1 auto' },
      '.cm-completionMatchedText': {
        textDecoration: 'none',
        color: 'var(--accent)',
        fontWeight: '700',
      },
      '.cm-completionDetail': {
        fontStyle: 'normal',
        color: 'var(--text-faint)',
        fontSize: '11px',
        marginLeft: 'auto',
        paddingLeft: '12px',
      },
      '.cm-completionIcon': {
        width: '15px',
        textAlign: 'center',
        opacity: '1',
        paddingRight: '0',
        fontSize: '11px',
        fontWeight: '700',
      },
      '.cm-completionInfo': {
        border: '1px solid var(--border-strong)',
        backgroundColor: 'var(--bg-raised)',
        borderRadius: 'var(--radius-sm)',
        padding: '9px 11px',
        fontFamily: 'var(--sans)',
        fontSize: '12.5px',
        maxWidth: '330px',
        lineHeight: '1.5',
        color: 'var(--text-dim)',
      },

      // ---- hover tooltip
      '.cm-tooltip-hover': {
        padding: '8px 11px',
        fontFamily: 'var(--sans)',
        fontSize: '12.5px',
        maxWidth: '340px',
        color: 'var(--text-dim)',
      },

      // ---- diagnostics
      '.cm-diagnostic': {
        fontFamily: 'var(--sans)',
        fontSize: '12.5px',
        padding: '7px 10px',
        borderLeft: '3px solid var(--bad)',
      },
      '.cm-diagnostic-error': { borderLeftColor: 'var(--bad)' },
      '.cm-diagnostic-warning': { borderLeftColor: 'var(--warn)' },
      '.cm-lintRange-error': {
        backgroundImage: 'none',
        textDecoration: 'underline wavy var(--bad)',
        textDecorationSkipInk: 'none',
      },
      '.cm-lintRange-warning': {
        backgroundImage: 'none',
        textDecoration: 'underline wavy var(--warn)',
        textDecorationSkipInk: 'none',
      },
      '.cm-lintPoint::after': { borderBottomColor: 'var(--bad)' },

      // ---- search panel
      '.cm-panels': {
        backgroundColor: 'var(--bg-raised)',
        color: 'var(--text)',
        borderTop: '1px solid var(--border)',
      },
      '.cm-panel.cm-search': { padding: '7px 9px', fontFamily: 'var(--sans)', fontSize: '12.5px' },
      '.cm-panel.cm-search input': {
        width: 'auto',
        padding: '3px 7px',
        fontSize: '12.5px',
        borderRadius: '5px',
      },
      '.cm-panel.cm-search label': { fontSize: '12px', color: 'var(--text-dim)' },
      '.cm-panel.cm-search button': {
        backgroundImage: 'none',
        background: 'var(--bg-sunken)',
        border: '1px solid var(--border-strong)',
        borderRadius: '5px',
        color: 'var(--text)',
        padding: '3px 9px',
        fontSize: '12px',
      },
      '.cm-searchMatch': {
        backgroundColor: 'var(--warn-soft)',
        outline: '1px solid var(--warn-border)',
      },
      '.cm-searchMatch-selected': {
        backgroundColor: 'var(--accent-soft)',
        outline: '1px solid var(--accent)',
      },

      // ---- completion kind icons
      '.cm-completionIcon-keyword::after': { content: '"K"', color: 'var(--hl-keyword)' },
      '.cm-completionIcon-method::after': { content: '"ƒ"', color: 'var(--hl-func)' },
      '.cm-completionIcon-function::after': { content: '"ƒ"', color: 'var(--hl-func)' },
      '.cm-completionIcon-property::after': { content: '"◈"', color: 'var(--hl-prop)' },
      '.cm-completionIcon-variable::after': { content: '"x"', color: 'var(--hl-var)' },
      '.cm-completionIcon-class::after': { content: '"◇"', color: 'var(--hl-type)' },
      '.cm-completionIcon-type::after': { content: '"T"', color: 'var(--hl-type)' },
      '.cm-completionIcon-interface::after': { content: '"I"', color: 'var(--info)' },
      '.cm-completionIcon-enum::after': { content: '"E"', color: 'var(--heap)' },

      // ---- decorations the Java grammar cannot produce
      '.cm-csKeyword': { color: 'var(--hl-keyword)', fontWeight: '600' },
      '.cm-csAttribute': { color: 'var(--hl-const)', fontStyle: 'italic' },
      '.cm-csType': { color: 'var(--hl-type)' },
      '.cm-csFunc': { color: 'var(--hl-func)' },
      // A type name wins over the call colour when both land on one token.
      '.cm-csType.cm-csFunc': { color: 'var(--hl-type)' },

      // ---- hover card
      '.cm-hoverCard .cm-hoverSig': {
        fontFamily: 'var(--mono)',
        fontSize: '12px',
        color: 'var(--text)',
        marginBottom: '5px',
      },
      '.cm-hoverCard .cm-hoverBody': { color: 'var(--text-dim)' },

      // ---- misc
      '.cm-foldMarker': { fontSize: '11px', lineHeight: '1' },
      '.cm-placeholder': { color: 'var(--text-faint)', fontStyle: 'italic' },
      '.cm-specialChar': { color: 'var(--bad)' },
      '.cm-line': { padding: '0 14px 0 6px' },
    },
    { dark },
  );
}

/**
 * Token colours. The grammar is Java's — close enough to C# that the shapes
 * line up — with a decoration overlay in `csharp.ts` covering the keywords
 * Java does not have.
 */
const highlight = HighlightStyle.define([
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: 'var(--hl-comment)', fontStyle: 'italic' },
  { tag: [t.keyword, t.modifier, t.self, t.null, t.atom], color: 'var(--hl-keyword)', fontWeight: '600' },
  { tag: [t.controlKeyword, t.moduleKeyword], color: 'var(--hl-control)', fontWeight: '600' },
  { tag: [t.string, t.special(t.string), t.character], color: 'var(--hl-string)' },
  { tag: [t.number, t.bool, t.integer, t.float], color: 'var(--hl-number)' },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: 'var(--hl-type)' },
  { tag: t.definition(t.className), color: 'var(--hl-type)', fontWeight: '650' },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))],
    color: 'var(--hl-func)',
  },
  { tag: t.propertyName, color: 'var(--hl-prop)' },
  { tag: [t.variableName, t.definition(t.variableName), t.local(t.variableName)], color: 'var(--hl-var)' },
  { tag: [t.constant(t.variableName), t.standard(t.variableName)], color: 'var(--hl-const)' },
  {
    tag: [t.operator, t.operatorKeyword, t.compareOperator, t.arithmeticOperator, t.logicOperator],
    color: 'var(--hl-op)',
  },
  {
    tag: [t.punctuation, t.separator, t.bracket, t.paren, t.brace, t.squareBracket, t.angleBracket],
    color: 'var(--hl-punct)',
  },
  { tag: [t.annotation, t.meta], color: 'var(--hl-const)' },
  { tag: t.invalid, color: 'var(--bad)' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
]);

export const syntaxColors = syntaxHighlighting(highlight, { fallback: true });
