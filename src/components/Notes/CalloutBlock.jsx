import React, { useState } from 'react';

const CALLOUT_TYPES = {
  note: { icon: '📝', color: '#ffaa00', bg: 'rgba(255,170,0,0.08)', border: 'rgba(255,170,0,0.3)', label: 'Note' },
  info: { icon: 'ℹ️', color: '#e85d75', bg: 'rgba(232,93,117,0.08)', border: 'rgba(232,93,117,0.3)', label: 'Info' },
  tip: { icon: '💡', color: '#ff9f43', bg: 'rgba(255,159,67,0.08)', border: 'rgba(255,159,67,0.3)', label: 'Tip' },
  success: { icon: '✅', color: '#ff9f43', bg: 'rgba(255,159,67,0.08)', border: 'rgba(255,159,67,0.3)', label: 'Success' },
  warning: { icon: '⚠️', color: '#ffaa00', bg: 'rgba(255,170,0,0.08)', border: 'rgba(255,170,0,0.3)', label: 'Warning' },
  caution: { icon: '🔥', color: '#ff6b35', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.3)', label: 'Caution' },
  danger: { icon: '❌', color: '#da1b60', bg: 'rgba(218,27,96,0.08)', border: 'rgba(218,27,96,0.3)', label: 'Danger' },
  bug: { icon: '🐛', color: '#da1b60', bg: 'rgba(218,27,96,0.08)', border: 'rgba(218,27,96,0.3)', label: 'Bug' },
  failure: { icon: '💥', color: '#da1b60', bg: 'rgba(218,27,96,0.08)', border: 'rgba(218,27,96,0.3)', label: 'Failure' },
  question: { icon: '❓', color: '#ffaa00', bg: 'rgba(255,170,0,0.08)', border: 'rgba(255,170,0,0.3)', label: 'Question' },
  abstract: { icon: '📋', color: '#e85d75', bg: 'rgba(232,93,117,0.08)', border: 'rgba(232,93,117,0.3)', label: 'Abstract' },
  summary: { icon: '📋', color: '#e85d75', bg: 'rgba(232,93,117,0.08)', border: 'rgba(232,93,117,0.3)', label: 'Summary' },
  todo: { icon: '☑️', color: '#ff9f43', bg: 'rgba(255,159,67,0.08)', border: 'rgba(255,159,67,0.3)', label: 'Todo' },
  example: { icon: '🧪', color: '#ff8a00', bg: 'rgba(255,138,0,0.08)', border: 'rgba(255,138,0,0.3)', label: 'Example' },
  quote: { icon: '💬', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.3)', label: 'Quote' },
  important: { icon: '❗', color: '#da1b60', bg: 'rgba(218,27,96,0.08)', border: 'rgba(218,27,96,0.3)', label: 'Important' },
};

/**
 * Parse Obsidian callout from blockquote children text.
 * Returns { type, foldable, defaultFolded, title, body } or null
 */
export function parseCallout(children) {
  // Flatten children to get the raw text content
  const getTextContent = (node) => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(getTextContent).join('');
    if (node?.props?.children) return getTextContent(node.props.children);
    return '';
  };

  const raw = getTextContent(children);
  const firstLine = raw.split('\n')[0];
  const match = firstLine.match(/^\[!(\w+)\](-|\+)?\s*(.*)?$/i);
  if (!match) return null;

  const type = match[1].toLowerCase();
  const foldChar = match[2];
  const foldable = !!foldChar;
  const defaultFolded = foldChar === '-';
  const titleOverride = match[3]?.trim() || '';

  const config = CALLOUT_TYPES[type] || CALLOUT_TYPES.note;
  const title = titleOverride || config.label;
  const rest = raw.split('\n').slice(1).join('\n').trim();

  return { type, foldable, defaultFolded, title, body: rest, config };
}

export default function CalloutBlock({ children }) {
  const parsed = parseCallout(children);

  if (!parsed) {
    // Regular blockquote
    return (
      <blockquote className="md-blockquote">
        {children}
      </blockquote>
    );
  }

  const { type, foldable, defaultFolded, title, body, config } = parsed;
  const [folded, setFolded] = useState(defaultFolded);

  return (
    <div
      className="callout-block"
      data-callout={type}
      style={{
        '--callout-color': config.color,
        '--callout-bg': config.bg,
        '--callout-border': config.border,
      }}
    >
      <div
        className={`callout-header ${foldable ? 'callout-foldable' : ''}`}
        onClick={foldable ? () => setFolded((f) => !f) : undefined}
      >
        <span className="callout-icon">{config.icon}</span>
        <span className="callout-title">{title}</span>
        {foldable && (
          <span className={`callout-fold-arrow ${folded ? 'folded' : ''}`}>
            ▼
          </span>
        )}
      </div>
      {(!foldable || !folded) && body && (
        <div className="callout-body">
          {body}
        </div>
      )}
    </div>
  );
}
