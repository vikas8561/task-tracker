-- ============================================================
-- Task Counts RPC Function
-- Run this ONCE in your Supabase SQL Editor.
-- It returns per-chapter and per-topic task counts in a single
-- fast GROUP BY query — no row data is transferred, just counts.
-- ============================================================

CREATE OR REPLACE FUNCTION get_task_counts()
RETURNS TABLE(
  chapter_id uuid,
  topic_id   uuid,
  task_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    chapter_id,
    topic_id,
    COUNT(*)::bigint AS task_count
  FROM tasks
  GROUP BY chapter_id, topic_id;
$$;

-- Grant execution rights to authenticated users and the anon role
GRANT EXECUTE ON FUNCTION get_task_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_task_counts() TO anon;
