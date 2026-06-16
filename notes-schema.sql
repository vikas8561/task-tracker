-- ============================================================
-- Notes Feature Schema — Run AFTER notes-schema.sql
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Folders table (supports nested hierarchy)
CREATE TABLE IF NOT EXISTS note_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES note_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, parent_id, name)
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  frontmatter JSONB DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Note images (Supabase Storage references)
CREATE TABLE IF NOT EXISTS note_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  size_bytes INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_slug ON notes(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_folders_user ON note_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON note_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_note_images_user ON note_images(user_id);
CREATE INDEX IF NOT EXISTS idx_note_images_note ON note_images(note_id);

-- Enable RLS
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "note_folders_user_policy" ON note_folders
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notes_user_policy" ON notes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "note_images_user_policy" ON note_images
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER note_folders_updated_at BEFORE UPDATE ON note_folders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- ============================================================
-- Supabase Storage Bucket for note images
-- Run this in your Supabase SQL Editor or Dashboard → Storage
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('note-images', 'note-images', false);
-- (Uncomment if your project doesn't already have this bucket)

-- Storage RLS Policy (run separately in Storage tab)
-- CREATE POLICY "note_images_storage_policy" ON storage.objects
--   FOR ALL TO authenticated
--   USING (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1])
--   WITH CHECK (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);
