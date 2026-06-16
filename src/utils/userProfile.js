export function getDisplayName(user) {
  if (!user) return '';

  const meta = user.user_metadata || {};
  const name = meta.display_name || meta.full_name || meta.name || '';
  return typeof name === 'string' ? name.trim() : '';
}

export function needsDisplayName(user) {
  return Boolean(user) && !getDisplayName(user);
}
