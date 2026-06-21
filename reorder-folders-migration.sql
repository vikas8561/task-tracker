-- ─────────────────────────────────────────────────────────────────────────────
-- Reorder Folders Migration
-- Run this in your Supabase SQL Editor to enable drag-and-drop reordering
-- of subjects and chapters.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add sort_order to subjects
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add sort_order to chapters
ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize sort_order using current created_at order so existing items
-- get a sensible default order without any manual work.
WITH ranked_subjects AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS rn
  FROM subjects
)
UPDATE subjects s SET sort_order = rs.rn
FROM ranked_subjects rs WHERE s.id = rs.id;

WITH ranked_chapters AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY subject_id ORDER BY created_at ASC) - 1 AS rn
  FROM chapters
)
UPDATE chapters c SET sort_order = rc.rn
FROM ranked_chapters rc WHERE c.id = rc.id;

-- Indexes for fast ordering queries
CREATE INDEX IF NOT EXISTS idx_subjects_sort_order ON subjects(sort_order);
CREATE INDEX IF NOT EXISTS idx_chapters_sort_order ON chapters(sort_order);

-- Verify
SELECT 'subjects' AS tbl, column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'subjects' AND column_name = 'sort_order'
UNION ALL
SELECT 'chapters', column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'chapters' AND column_name = 'sort_order';
