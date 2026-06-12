import { createClient } from '@supabase/supabase-js';

function isValidUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizeSupabaseUrl(url) {
  if (!url) return null;
  if (url.startsWith('https://')) return url;
  const poolerMatch = url.match(/postgres\.([\w]+):[^@]+@.*pooler\.supabase\.com/);
  if (poolerMatch) return `https://${poolerMatch[1]}.supabase.co`;
  const directMatch = url.match(/@db\.([\w]+)\.supabase\.co/);
  if (directMatch) return `https://${directMatch[1]}.supabase.co`;
  return null;
}

function getCredentials() {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const envUrl = normalizeSupabaseUrl(rawUrl);

  if (isValidUrl(envUrl) && envKey && envKey.length > 10) {
    return { url: envUrl, key: envKey };
  }
  return null;
}

export function isSupabaseConfigured() {
  return getCredentials() !== null;
}

let _client = null;

export function getSupabase() {
  if (_client) return _client;
  const creds = getCredentials();
  if (!creds) throw new Error('Supabase not configured');
  _client = createClient(creds.url, creds.key);
  return _client;
}

// ─── Connection Check ────────────────────────────────────────────────
export async function checkConnection() {
  const creds = getCredentials();

  if (!creds) {
    console.warn(
      '%c[StudyTrack DB] ❌ Not configured',
      'color: #f87171; font-weight: bold;',
      '\nSet VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
    return false;
  }

  console.info(
    '%c[StudyTrack DB] 🔄 Connecting...',
    'color: #facc15; font-weight: bold;',
    `\nURL: ${creds.url}`
  );

  try {
    const client = getSupabase();
    // Use an RPC or simple query to check connection
    const { error } = await client.from('subjects').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.warn(
          '%c[StudyTrack DB] ⚠️  Connected — but schema not applied yet',
          'color: #fb923c; font-weight: bold;',
          '\nRun supabase-schema.sql in your Supabase SQL Editor.'
        );
        return 'schema_missing';
      }
      console.error(
        '%c[StudyTrack DB] ❌ Connection failed',
        'color: #f87171; font-weight: bold;',
        `\nError: ${error.message} (${error.code})`
      );
      return false;
    }

    console.info(
      '%c[StudyTrack DB] ✅ Connected successfully',
      'color: #4ade80; font-weight: bold;'
    );
    return true;
  } catch (err) {
    console.error(
      '%c[StudyTrack DB] ❌ Connection error',
      'color: #f87171; font-weight: bold;',
      '\n' + err.message
    );
    return false;
  }
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop];
  },
});
