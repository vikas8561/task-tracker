/**
 * Shared callout type configuration.
 * Single source of truth for the remark plugin and CalloutBlock component.
 *
 * @typedef {'note'|'tip'|'important'|'warning'|'caution'|'info'|'success'|'question'
 *   |'failure'|'bug'|'example'|'quote'|'abstract'|'definition'|'formula'|'theorem'
 *   |'proof'|'common-mistake'|'shortcut'|'memory-trick'|'key-point'|'ai-connection'
 *   |'ml-connection'|'research-connection'|'interview-tip'|'revision'|'checkpoint'} CalloutType
 */

/**
 * @typedef {Object} CalloutConfig
 * @property {string} icon     - Lucide icon name (PascalCase)
 * @property {string} color    - Accent color (hex)
 * @property {string} bg       - Background color (rgba)
 * @property {string} border   - Border color (rgba)
 * @property {string} label    - Default title label
 */

/** Helper: derive bg and border from a hex color */
function palette(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.06)`,
    border: `rgba(${r}, ${g}, ${b}, 0.25)`,
  };
}

function entry(icon, color, label) {
  const { bg, border } = palette(color);
  return { icon, color, bg, border, label };
}

/** @type {Record<string, CalloutConfig>} */
export const CALLOUT_CONFIG = {
  // ── Standard types ───────────────────────────────────────────
  note:       entry('Pencil',         '#448aff', 'Note'),
  tip:        entry('Lightbulb',      '#00bfa5', 'Tip'),
  important:  entry('AlertCircle',    '#a855f7', 'Important'),
  warning:    entry('TriangleAlert',  '#ff9100', 'Warning'),
  caution:    entry('Flame',          '#ff5252', 'Caution'),
  info:       entry('Info',           '#2196f3', 'Info'),
  success:    entry('CircleCheck',    '#00c853', 'Success'),
  question:   entry('CircleHelp',     '#ffd740', 'Question'),
  failure:    entry('CircleX',        '#ff1744', 'Failure'),
  bug:        entry('Bug',            '#f50057', 'Bug'),
  example:    entry('FlaskConical',   '#7c4dff', 'Example'),
  quote:      entry('Quote',          '#9e9e9e', 'Quote'),
  abstract:   entry('ClipboardList',  '#00b0ff', 'Abstract'),

  // ── Educational extensions ───────────────────────────────────
  definition:           entry('BookOpen',       '#536dfe', 'Definition'),
  formula:              entry('Sigma',          '#e040fb', 'Formula'),
  theorem:              entry('GraduationCap',  '#651fff', 'Theorem'),
  proof:                entry('CheckCheck',     '#00e676', 'Proof'),
  'common-mistake':     entry('ShieldAlert',    '#ff6e40', 'Common Mistake'),
  shortcut:             entry('Zap',            '#ffab00', 'Shortcut'),
  'memory-trick':       entry('Brain',          '#ea80fc', 'Memory Trick'),
  'key-point':          entry('Star',           '#ffd600', 'Key Point'),
  'ai-connection':      entry('Cpu',            '#00e5ff', 'AI Connection'),
  'ml-connection':      entry('BarChart3',      '#69f0ae', 'ML Connection'),
  'research-connection': entry('Microscope',    '#8c9eff', 'Research Connection'),
  'interview-tip':      entry('MessageSquare',  '#ff80ab', 'Interview Tip'),
  revision:             entry('RotateCcw',      '#b388ff', 'Revision'),
  checkpoint:           entry('Flag',           '#aeea00', 'Checkpoint'),
};

/** Aliases — map alternate names to canonical types */
const ALIASES = {
  danger: 'caution',
  summary: 'abstract',
  todo: 'tip',
  hint: 'tip',
  faq: 'question',
  fail: 'failure',
  error: 'failure',
  attention: 'warning',
  remember: 'memory-trick',
  recap: 'revision',
};

/**
 * Resolve a callout type string to its configuration.
 * Falls back to `note` for unknown types.
 * @param {string} type
 * @returns {{ resolvedType: string, config: CalloutConfig }}
 */
export function resolveCalloutType(type) {
  const key = (type || '').toLowerCase();
  const resolved = ALIASES[key] || key;
  const config = CALLOUT_CONFIG[resolved] || CALLOUT_CONFIG.note;
  return { resolvedType: resolved, config };
}

/** All valid callout type keys (for toolbar pickers, etc.) */
export const ALL_CALLOUT_TYPES = Object.keys(CALLOUT_CONFIG);

/**
 * Grouped types for the editor toolbar picker.
 */
export const CALLOUT_GROUPS = [
  {
    label: 'Standard',
    types: ['note', 'tip', 'info', 'important', 'warning', 'caution', 'success', 'question', 'failure', 'bug', 'example', 'quote', 'abstract'],
  },
  {
    label: 'Educational',
    types: ['definition', 'formula', 'theorem', 'proof', 'common-mistake', 'shortcut', 'memory-trick', 'key-point'],
  },
  {
    label: 'Connections',
    types: ['ai-connection', 'ml-connection', 'research-connection', 'interview-tip', 'revision', 'checkpoint'],
  },
];
