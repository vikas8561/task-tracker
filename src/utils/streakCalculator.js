/**
 * Calculates the current streak of consecutive days with at least one completed task.
 * @param {string[]} completedAtTimestamps - Array of ISO timestamp strings from completed tasks
 * @returns {number} - Current streak in days
 */
export function calculateStreak(completedAtTimestamps) {
  if (!completedAtTimestamps || completedAtTimestamps.length === 0) return 0;

  // Normalize timestamps to local date strings (YYYY-MM-DD)
  const dateSet = new Set(
    completedAtTimestamps.map((ts) => {
      const d = new Date(ts);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })
  );

  const today = new Date();
  let streak = 0;

  // Check today first; if not completed today, start from yesterday
  const todayStr = formatDate(today);
  const startFromYesterday = !dateSet.has(todayStr);

  let checkDate = new Date(today);
  if (startFromYesterday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = formatDate(checkDate);
    if (dateSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Returns the last N days as date strings and whether each has a completion
 * @param {string[]} completedAtTimestamps
 * @param {number} days
 * @returns {{ date: string, completed: boolean }[]}
 */
export function getLastNDays(completedAtTimestamps, days = 7) {
  const dateSet = new Set(
    (completedAtTimestamps || []).map((ts) => {
      const d = new Date(ts);
      return formatDate(d);
    })
  );

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    result.push({ date: dateStr, completed: dateSet.has(dateStr) });
  }
  return result;
}
