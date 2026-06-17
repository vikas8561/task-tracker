-- ============================================================
-- Fix RLS policies for custom auth (allow anon access)
-- Since we no longer use Supabase Auth, all requests come as 'anon' role.
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- ─── TASKS ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "tasks_user_policy" ON tasks;
CREATE POLICY "tasks_open_policy" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- ─── SUBJECTS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "subjects_user_policy" ON subjects;
CREATE POLICY "subjects_open_policy" ON subjects
  FOR ALL USING (true) WITH CHECK (true);

-- ─── CHAPTERS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "chapters_user_policy" ON chapters;
CREATE POLICY "chapters_open_policy" ON chapters
  FOR ALL USING (true) WITH CHECK (true);

-- ─── TOPICS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "topics_user_policy" ON topics;
CREATE POLICY "topics_open_policy" ON topics
  FOR ALL USING (true) WITH CHECK (true);

-- ─── SUB_TOPICS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "sub_topics_user_policy" ON sub_topics;
CREATE POLICY "sub_topics_open_policy" ON sub_topics
  FOR ALL USING (true) WITH CHECK (true);

-- ─── USER_TASK_STATES ────────────────────────────────────────
DROP POLICY IF EXISTS "user_task_states_user_policy" ON user_task_states;
CREATE POLICY "user_task_states_open_policy" ON user_task_states
  FOR ALL USING (true) WITH CHECK (true);

-- ─── NOTE_FOLDERS ────────────────────────────────────────────
DROP POLICY IF EXISTS "note_folders_user_policy" ON note_folders;
CREATE POLICY "note_folders_open_policy" ON note_folders
  FOR ALL USING (true) WITH CHECK (true);

-- ─── NOTES ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "notes_user_policy" ON notes;
CREATE POLICY "notes_open_policy" ON notes
  FOR ALL USING (true) WITH CHECK (true);

-- ─── NOTE_IMAGES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "note_images_user_policy" ON note_images;
CREATE POLICY "note_images_open_policy" ON note_images
  FOR ALL USING (true) WITH CHECK (true);

-- ─── USER_NOTE_STATES ────────────────────────────────────────
DROP POLICY IF EXISTS "user_note_states_user_policy" ON user_note_states;
CREATE POLICY "user_note_states_open_policy" ON user_note_states
  FOR ALL USING (true) WITH CHECK (true);

-- ─── Remove auth.uid() DEFAULT from columns ─────────────────
-- These columns had DEFAULT auth.uid() which will fail for anon role.
-- We remove the default so the app must explicitly pass user_id.
ALTER TABLE subjects ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE chapters ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE topics ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE sub_topics ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE tasks ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE note_folders ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE notes ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE note_images ALTER COLUMN user_id DROP DEFAULT;

-- Also drop the foreign key constraint to auth.users since we no longer use it
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_user_id_fkey;
ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_user_id_fkey;
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_user_id_fkey;
ALTER TABLE sub_topics DROP CONSTRAINT IF EXISTS sub_topics_user_id_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE note_folders DROP CONSTRAINT IF EXISTS note_folders_user_id_fkey;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
ALTER TABLE note_images DROP CONSTRAINT IF EXISTS note_images_user_id_fkey;
