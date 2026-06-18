import { supabase } from '../lib/supabase';
import { normalizeSubjectColor } from '../utils/subjectColor';

/**
 * Fetch the full hierarchy skeleton — subjects, chapters, topics — plus
 * lightweight task counts (only task IDs + foreign keys, no content).
 *
 * This is the ONLY query that runs on initial page load.
 * No task titles, dates, priorities, or joins are fetched.
 *
 * Returns:
 *   subjects[]         – Subject rows with normalized color
 *   chapters[]         – Chapter rows
 *   topics[]           – Topic rows
 *   chapterTaskCount   – { [chapterId]: totalTaskCount }
 *   topicTaskCount     – { [topicId]:   totalTaskCount }
 */
export async function fetchHierarchyMeta() {
  const [
    { data: subjectsRaw, error: sErr },
    { data: chaptersRaw, error: cErr },
    { data: topicsRaw,   error: tErr },
    { data: countsMeta,  error: mErr },
  ] = await Promise.all([
    supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1000),

    supabase
      .from('chapters')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(5000),

    supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(10000),

    // Lightweight: only IDs for counting — no task content fetched
    supabase
      .from('tasks')
      .select('id, chapter_id, topic_id')
      .limit(50000),
  ]);

  // Treat schema errors as "not set up yet" — return empty safely
  for (const err of [sErr, cErr, tErr]) {
    if (err) {
      if (err.code === '42P01' || err.code === '42703') {
        return {
          subjects: [],
          chapters: [],
          topics: [],
          chapterTaskCount: {},
          topicTaskCount: {},
        };
      }
      throw err;
    }
  }
  if (mErr) console.warn('[useHierarchy] Could not fetch task counts:', mErr.message);

  // Build count maps from the lightweight task metadata
  const chapterTaskCount = {};
  const topicTaskCount = {};
  for (const row of (countsMeta || [])) {
    if (row.chapter_id) {
      chapterTaskCount[row.chapter_id] = (chapterTaskCount[row.chapter_id] || 0) + 1;
    }
    if (row.topic_id) {
      topicTaskCount[row.topic_id] = (topicTaskCount[row.topic_id] || 0) + 1;
    }
  }

  // Normalize subject colors
  const subjects = (subjectsRaw || []).map(s => ({
    ...s,
    color: normalizeSubjectColor(s.color || 'var(--accent-1)', s.id),
  }));

  return {
    subjects,
    chapters: chaptersRaw || [],
    topics:   topicsRaw   || [],
    chapterTaskCount,
    topicTaskCount,
  };
}
