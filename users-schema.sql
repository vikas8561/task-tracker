-- ─── Custom Users Table (replaces Supabase Auth) ─────────────────────────────
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (clean slate)
DROP POLICY IF EXISTS "Allow anon select on app_users" ON app_users;
DROP POLICY IF EXISTS "Allow anon insert on app_users" ON app_users;
DROP POLICY IF EXISTS "Allow anon update on app_users" ON app_users;

-- Re-create policies for anon role
CREATE POLICY "Allow anon select on app_users"
  ON app_users FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on app_users"
  ON app_users FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on app_users"
  ON app_users FOR UPDATE USING (true) WITH CHECK (true);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
