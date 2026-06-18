import { supabase } from '../lib/supabase';
import { normalizeSubjectColor } from '../utils/subjectColor';

/**
 * Fetch the full hierarchy skeleton — subjects, chapters, topics — plus
 * lightweight task counts via a server-side RPC (single GROUP BY query).
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

/**
 * PRIMARY: Call the get_task_counts() Postgres RPC function.
 * Single round-trip, server-side GROUP BY — returns only counts, no row data.
 * Returns null if the function doesn't exist yet (triggers fallback).
 */
async function fetchTaskCountsViaRpc() {
  const { data, error } = await supabase.rpc('get_task_counts');

  if (error) {
    // PGRST202 = function not found; 42883 = undefined function
    // Gracefully fall back to pagination in that case.
    if (
      error.code === 'PGRST202' ||
      error.code === '42883' ||
      error.message?.includes('function') ||
      error.message?.includes('get_task_counts')
    ) {
      console.warn(
        '[useHierarchy] get_task_counts() RPC not found. ' +
        'Run task-counts-rpc.sql in your Supabase SQL Editor for better performance. ' +
        'Falling back to paginated fetch.'
      );
      return null; // signal to use fallback
    }
    console.warn('[useHierarchy] RPC error:', error.message);
    return null;
  }

  return data || [];
}

/**
 * FALLBACK: Paginate through all task rows when the RPC doesn't exist.
 * Fetches only id, chapter_id, topic_id — 1000 rows per page.
 * Handles Supabase's 1000-row-per-request cap on free tier.
 */
async function fetchTaskCountsViaPagination() {
  const PAGE_SIZE = 1000;
  let allRows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, chapter_id, topic_id')
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.warn('[useHierarchy] Pagination fetch error:', error.message);
      break;
    }

    if (!data || data.length === 0) break;

    allRows = allRows.concat(data);

    if (data.length < PAGE_SIZE) break; // last page reached
    from += PAGE_SIZE;
  }

  // Convert flat rows into the same shape the RPC returns
  return allRows.map(r => ({
    chapter_id: r.chapter_id,
    topic_id:   r.topic_id,
    task_count: 1, // each row = 1 task; aggregated below
  }));
}

/**
 * Build chapterTaskCount and topicTaskCount maps from RPC or pagination data.
 * RPC rows already have task_count aggregated; pagination rows each have task_count=1.
 */
function buildCountMaps(rows) {
  const chapterTaskCount = {};
  const topicTaskCount   = {};

  for (const row of rows) {
    const count = Number(row.task_count) || 1;

    if (row.chapter_id) {
      chapterTaskCount[row.chapter_id] = (chapterTaskCount[row.chapter_id] || 0) + count;
    }
    if (row.topic_id) {
      topicTaskCount[row.topic_id] = (topicTaskCount[row.topic_id] || 0) + count;
    }
  }

  return { chapterTaskCount, topicTaskCount };
}

export async function fetchHierarchyMeta() {
  // Run hierarchy skeleton queries in parallel with the count fetch
  const [
    { data: subjectsRaw, error: sErr },
    { data: chaptersRaw, error: cErr },
    { data: topicsRaw,   error: tErr },
    rpcRows,
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

    // Try RPC first; returns null if function not deployed yet
    fetchTaskCountsViaRpc(),
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

  // If RPC returned null (function not found), fall back to pagination
  const countRows = rpcRows ?? await fetchTaskCountsViaPagination();

  const { chapterTaskCount, topicTaskCount } = buildCountMaps(countRows);

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
