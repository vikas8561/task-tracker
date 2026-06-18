-- ============================================================
-- Questions Table — run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    uuid REFERENCES subjects(id)  ON DELETE CASCADE,
  chapter_id    uuid REFERENCES chapters(id)  ON DELETE CASCADE,
  topic_id      uuid REFERENCES topics(id)    ON DELETE CASCADE,
  title         text NOT NULL,
  explanation   text,
  examples      jsonb NOT NULL DEFAULT '[]'::jsonb,
  io_examples   jsonb NOT NULL DEFAULT '[]'::jsonb,
  solutions     jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_id       uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for filtering by hierarchy
CREATE INDEX IF NOT EXISTS questions_subject_id_idx  ON questions(subject_id);
CREATE INDEX IF NOT EXISTS questions_chapter_id_idx  ON questions(chapter_id);
CREATE INDEX IF NOT EXISTS questions_topic_id_idx    ON questions(topic_id);
CREATE INDEX IF NOT EXISTS questions_created_at_idx  ON questions(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS questions_updated_at_trigger ON questions;
CREATE TRIGGER questions_updated_at_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_questions_updated_at();

-- RLS policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "questions_select" ON questions
  FOR SELECT USING (true);

-- Only admins can insert/update/delete (enforced at app level too)
CREATE POLICY "questions_insert" ON questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "questions_update" ON questions
  FOR UPDATE USING (true);

CREATE POLICY "questions_delete" ON questions
  FOR DELETE USING (true);
