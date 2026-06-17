/**
 * Custom Authentication System
 * 
 * Uses Supabase DATABASE (not Supabase Auth) to store users.
 * This means users are stored in the `app_users` table and work
 * across devices/browsers.
 * 
 * Sessions are cached in localStorage for instant page-load
 * (no network call needed to check if user is logged in).
 */

import { supabase } from './supabase';

const SESSION_KEY = 'taskabelle_session';

// ─── Password Hashing ────────────────────────────────────────────────────────

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_taskabelle_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Session (localStorage — instant restore on page load) ───────────────────

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// ─── Admin Check ─────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'vikas12252@gmail.com';

function isAdminEmail(email) {
  return email?.toLowerCase().trim() === ADMIN_EMAIL;
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export async function signUp(email, password) {
  const normalizedEmail = email.toLowerCase().trim();

  if (!normalizedEmail || !password) {
    return { error: new Error('Email and password are required') };
  }

  if (password.length < 6) {
    return { error: new Error('Password must be at least 6 characters') };
  }

  const passwordHash = await hashPassword(password);

  // Insert into Supabase database
  const { data, error } = await supabase
    .from('app_users')
    .insert({
      email: normalizedEmail,
      password_hash: passwordHash,
      is_admin: isAdminEmail(normalizedEmail),
      display_name: '',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: new Error('An account with this email already exists') };
    }
    return { error: new Error(error.message) };
  }

  // Build user object (strip password_hash)
  const user = buildUserObject(data);
  const session = { user };
  saveSession(session);

  return { user, session };
}

// ─── Sign In ─────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await hashPassword(password);

  // Query from Supabase database
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (error || !data) {
    return { error: new Error('Invalid email or password') };
  }

  if (data.password_hash !== passwordHash) {
    return { error: new Error('Invalid email or password') };
  }

  const user = buildUserObject(data);
  const session = { user };
  saveSession(session);

  return { user, session };
}

// ─── Sign Out ────────────────────────────────────────────────────────────────

export function signOut() {
  saveSession(null);
}

// ─── Get Current Session / User (from localStorage — instant!) ───────────────

export function getCurrentSession() {
  return getSession();
}

export function getCurrentUser() {
  const session = getSession();
  return session?.user ?? null;
}

// ─── Update User ─────────────────────────────────────────────────────────────

export async function updateUser(updates) {
  const session = getSession();
  if (!session?.user) {
    return { error: new Error('No user logged in') };
  }

  const payload = {};
  if (updates.data?.display_name !== undefined) {
    payload.display_name = updates.data.display_name;
  }
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('app_users')
    .update(payload)
    .eq('id', session.user.id)
    .select()
    .single();

  if (error) {
    return { error: new Error(error.message) };
  }

  const updatedUser = buildUserObject(data);
  saveSession({ user: updatedUser });

  return { data: { user: updatedUser } };
}

// ─── Auth State Change Listener ──────────────────────────────────────────────

export function onAuthStateChange(callback) {
  const session = getSession();
  callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);

  function handleStorage(e) {
    if (e.key === SESSION_KEY) {
      const newSession = e.newValue ? JSON.parse(e.newValue) : null;
      callback(newSession ? 'SIGNED_IN' : 'SIGNED_OUT', newSession);
    }
  }

  window.addEventListener('storage', handleStorage);

  return {
    unsubscribe: () => window.removeEventListener('storage', handleStorage),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUserObject(dbRow) {
  return {
    id: dbRow.id,
    email: dbRow.email,
    is_admin: dbRow.is_admin,
    user_metadata: {
      display_name: dbRow.display_name || '',
    },
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at,
  };
}
