import { SUBJECT_COLORS } from './constants';

const COOL_HEX_FRAGMENTS = [
  '6366f1', '8b5cf6', '06b6d4', '0891b2', '14b8a6', '10b981',
  '0f766e', '115e59', '3b82f6', '0ea5e9', '22d3ee', '38bdf8',
  '60a5fa', '818cf8', 'a78bfa', '2dd4bf', '34d399', '0f74cd',
  '0284c7', '2563eb', '1d4ed8', '0d9488', '059669', '047857',
];

function parseHex(color) {
  if (!color || typeof color !== 'string') return null;
  let hex = color.trim().toLowerCase();
  if (hex.startsWith('var(')) return null;
  if (!hex.startsWith('#')) hex = `#${hex}`;
  const raw = hex.slice(1);
  if (raw.length === 3) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  }
  if (raw.length === 6) return `#${raw}`;
  return null;
}

function hexToHue(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return h * 360;
}

/** True for blue, cyan, teal, violet, and other cool stored subject colors. */
export function isCoolSubjectColor(color) {
  const hex = parseHex(color);
  if (!hex) return false;
  const body = hex.slice(1);
  if (COOL_HEX_FRAGMENTS.some((frag) => body.includes(frag))) return true;
  const hue = hexToHue(hex);
  return hue >= 145 && hue <= 295;
}

/** Map cool/blue subject colors to a stable warm palette color. */
export function normalizeSubjectColor(color, seed = '') {
  const fallback = SUBJECT_COLORS[0];
  if (!color) return fallback;
  if (!isCoolSubjectColor(color)) return color;
  const key = String(seed || color);
  const hash = key.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
}
