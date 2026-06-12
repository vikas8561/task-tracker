-- ============================================================
-- Task Tracker — Supabase Schema with Authentication
-- Run this entire file in your Supabase SQL Editor
-- WARNING: This will DROP existing tables to apply the new schema.
-- ============================================================

DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS sub_topics;
DROP TABLE IF EXISTS topics;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS subjects;

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subject_id, name)
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(chapter_id, name)
);

-- Sub-topics table
CREATE TABLE IF NOT EXISTS sub_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(topic_id, name)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  sub_topic_id UUID REFERENCES sub_topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE,
  is_completed BOOLEAN DEFAULT false,
  is_revision BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_subject_id ON tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_tasks_chapter_id ON tasks(chapter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_revision ON tasks(user_id, is_revision);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_user_id ON chapters(user_id);

-- Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Scoped to authenticated user)
CREATE POLICY "subjects_user_policy" ON subjects
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chapters_user_policy" ON chapters
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "topics_user_policy" ON topics
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sub_topics_user_policy" ON sub_topics
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "tasks_user_policy" ON tasks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
