export const PRIORITY_LEVELS = ['high', 'medium', 'low'];

export const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#06b6d4',
};

export const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const SUBJECT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#84cc16', // Lime
];

export const TODAY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
