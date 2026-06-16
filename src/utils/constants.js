export const PRIORITY_LEVELS = ['high', 'medium', 'low'];

export const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#ff8a00',
};

export const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const SUBJECT_COLORS = [
  '#ff8a00',
  '#da1b60',
  '#ff6b35',
  '#ff9f43',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#e85d75',
  '#f97316',
  '#f43f5e',
];

export const TODAY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
