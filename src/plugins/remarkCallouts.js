/**
 * remarkCallouts — Remark plugin for Obsidian-style callouts.
 *
 * Transforms blockquotes that start with `[!TYPE]` into custom AST nodes
 * that render as `<div data-callout="type" ...>` in the HTML output.
 *
 * Supports:
 *   > [!NOTE]                     — basic callout
 *   > [!NOTE] Custom Title        — with custom title
 *   > [!NOTE]-                    — foldable, collapsed by default
 *   > [!NOTE]+                    — foldable, expanded by default
 *   > [!COMMON-MISTAKE]           — hyphenated types
 *
 * The callout body is preserved as proper MDAST children, so downstream
 * plugins (rehype-katex, rehype-highlight, etc.) process it normally.
 */

import { visit, SKIP } from 'unist-util-visit';

// Match: [!TYPE], [!TYPE]+, [!TYPE]-, [!TYPE] Custom Title
// Supports hyphenated types like COMMON-MISTAKE, AI-CONNECTION
const CALLOUT_REGEX = /^\[!([\w-]+)\]([+-])?\s*(.*)?$/i;

export default function remarkCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node, index, parent) => {
      if (!node.children || node.children.length === 0) return;

      // The first child of the blockquote should be a paragraph
      const firstChild = node.children[0];
      if (firstChild.type !== 'paragraph' || !firstChild.children?.length) return;

      // Get the first text-like node in the paragraph
      const firstInline = firstChild.children[0];
      if (!firstInline || firstInline.type !== 'text') return;

      // The text value can be multi-line (e.g. "[!NOTE]\nContent").
      // We only match the callout pattern against the FIRST line.
      const fullText = firstInline.value;
      const firstNewline = fullText.indexOf('\n');
      const firstLine = firstNewline === -1 ? fullText : fullText.slice(0, firstNewline);

      // Try matching the callout pattern on the first line only
      const match = firstLine.match(CALLOUT_REGEX);
      if (!match) return;

      const calloutType = match[1].toLowerCase();
      const foldChar = match[2] || '';
      const customTitle = (match[3] || '').trim();
      const foldable = foldChar === '+' || foldChar === '-';
      const defaultFolded = foldChar === '-';

      // ── Build body children ───────────────────────────────────
      // Remove the [!TYPE] line from the first paragraph's children.
      // Any text on subsequent lines and other inline children stay as body content.
      const remainingFirstParaChildren = [];

      // Text after the matched first line (everything past the \n)
      const afterFirstLine = firstNewline === -1 ? '' : fullText.slice(firstNewline + 1);
      if (afterFirstLine) {
        remainingFirstParaChildren.push({
          type: 'text',
          value: afterFirstLine,
        });
      }

      // Add the rest of the inline children from the first paragraph
      // (bold, italic, math, etc. that follow the first text node)
      for (let i = 1; i < firstChild.children.length; i++) {
        remainingFirstParaChildren.push(firstChild.children[i]);
      }

      // Build the body: remaining first paragraph content + rest of blockquote children
      const bodyChildren = [];

      if (remainingFirstParaChildren.length > 0) {
        bodyChildren.push({
          type: 'paragraph',
          children: remainingFirstParaChildren,
        });
      }

      // Add all subsequent children of the blockquote
      for (let i = 1; i < node.children.length; i++) {
        bodyChildren.push(node.children[i]);
      }

      // ── Create the callout node ───────────────────────────────
      // We use hName/hProperties to tell rehype to render this as a div.
      const calloutNode = {
        type: 'callout',
        data: {
          hName: 'div',
          hProperties: {
            'data-callout': calloutType,
            'data-callout-foldable': foldable ? 'true' : undefined,
            'data-callout-folded': defaultFolded ? 'true' : undefined,
            'data-callout-title': customTitle || undefined,
            className: ['callout-block'],
          },
        },
        children: bodyChildren,
      };

      // Replace the blockquote node in the parent
      parent.children.splice(index, 1, calloutNode);

      // Tell visit to skip children of the replaced node and
      // continue from the same index (callout node won't match 'blockquote')
      return [SKIP, index];
    });
  };
}
