-- ============================================================
-- user_task_states — safe idempotent setup
-- Works whether the table already exists or not.
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- Step 1: Create the table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS user_task_states (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL,
  task_id      UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  is_completed BOOLEAN     NOT NULL DEFAULT false,
  is_revision  BOOLEAN     NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Add the unique constraint if it doesn't already exist.
-- This is the KEY fix — without this, upsert onConflict cannot resolve and returns 409.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_task_states_user_task_unique'
      AND conrelid = 'user_task_states'::regclass
  ) THEN
    ALTER TABLE user_task_states
      ADD CONSTRAINT user_task_states_user_task_unique UNIQUE (user_id, task_id);
  END IF;
END
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uts_user_id   ON user_task_states(user_id);
CREATE INDEX IF NOT EXISTS idx_uts_task_id   ON user_task_states(task_id);
CREATE INDEX IF NOT EXISTS idx_uts_completed ON user_task_states(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_uts_revision  ON user_task_states(user_id, is_revision);

-- Keep updated_at current on every write
CREATE OR REPLACE FUNCTION update_user_task_states_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_uts_updated_at ON user_task_states;
CREATE TRIGGER trg_uts_updated_at
  BEFORE UPDATE ON user_task_states
  FOR EACH ROW EXECUTE FUNCTION update_user_task_states_updated_at();

-- Enable RLS
ALTER TABLE user_task_states ENABLE ROW LEVEL SECURITY;

-- Open policy (matches the rest of the app's custom-auth setup)
DROP POLICY IF EXISTS "user_task_states_user_policy" ON user_task_states;
DROP POLICY IF EXISTS "user_task_states_open_policy"  ON user_task_states;
CREATE POLICY "user_task_states_open_policy" ON user_task_states
  FOR ALL USING (true) WITH CHECK (true);
