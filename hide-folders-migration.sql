-- ─────────────────────────────────────────────────────────────────────────────
-- Hide Folders Migration
-- Run this in your Supabase SQL Editor to enable the hide/unhide feature.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add is_hidden to note_folders (notes sidebar folders)
ALTER TABLE note_folders
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Add is_hidden to subjects (top-level task folders)
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Add is_hidden to chapters (nested task folders)
ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Verify
SELECT 'note_folders' AS tbl, column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'note_folders' AND column_name = 'is_hidden'
UNION ALL
SELECT 'subjects', column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'subjects' AND column_name = 'is_hidden'
UNION ALL
SELECT 'chapters', column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'chapters' AND column_name = 'is_hidden';
