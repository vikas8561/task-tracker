-- ============================================================
-- Patch existing user_task_states table with missing columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop the foreign key on user_id → auth.users
-- (app uses custom auth, so user IDs are not Supabase auth users)
ALTER TABLE user_task_states
  DROP CONSTRAINT IF EXISTS user_task_states_user_id_fkey;

-- Add missing columns if they don't already exist
ALTER TABLE user_task_states
  ADD COLUMN IF NOT EXISTS id           UUID        DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_revision  BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now();

-- Add unique constraint if missing (required to prevent duplicate rows)
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

-- Ensure RLS open policy exists
ALTER TABLE user_task_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_task_states_open_policy" ON user_task_states;
CREATE POLICY "user_task_states_open_policy" ON user_task_states
  FOR ALL USING (true) WITH CHECK (true);

-- Verify: check current columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_task_states'
ORDER BY ordinal_position;
