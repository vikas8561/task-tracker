import { useState } from 'react';
import { initSupabase } from '../../lib/supabase';
import { Zap, ExternalLink, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SetupScreen({ onSetupComplete }) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleConnect() {
    if (!url.trim() || !anonKey.trim()) {
      toast.error('Please enter both URL and Anon Key');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast.error('Invalid URL format. It should look like: https://xxxx.supabase.co');
      return;
    }

    setTesting(true);
    try {
      const client = initSupabase(url.trim(), anonKey.trim());
      // Quick connectivity test
      const { error } = await client.from('subjects').select('id').limit(1);

      // If error is "relation does not exist" that's fine — DB needs schema applied
      // If error is auth/connection error, that's a problem
      if (error && (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('Invalid API key'))) {
        toast.error('Invalid Anon Key. Check your Supabase API settings.');
        setTesting(false);
        return;
      }

      // Save to localStorage for persistence across page refreshes
      localStorage.setItem('sb_url', url.trim());
      localStorage.setItem('sb_key', anonKey.trim());

      toast.success('Connected to Supabase!');
      onSetupComplete();
    } catch (err) {
      toast.error('Connection failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTesting(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'var(--accent-grad)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)',
            boxShadow: 'var(--shadow-accent)',
          }}>
            <Zap size={28} color="var(--accent-1)" />
          </div>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>
            <span className="text-gradient">StudyTrack</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Connect your Supabase project to get started
          </p>
        </div>

        {/* Setup Card */}
        <div className="glass-card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            Connect Supabase
          </h3>
          <p style={{ fontSize: '0.85rem', marginBottom: 'var(--space-6)' }}>
            Enter your Supabase project credentials below.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="setup-url">Project URL</label>
              <input
                id="setup-url"
                className="form-input"
                type="url"
                placeholder="https://your-project-id.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="setup-key">Anon / Public Key</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="setup-key"
                  className="form-input"
                  type={showKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setShowKey((v) => !v)}
                  style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}
                  type="button"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleConnect}
              disabled={testing || !url || !anonKey}
              id="setup-connect-btn"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {testing ? 'Connecting...' : 'Connect & Continue'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
            🚀 Quick Setup Guide
          </h4>
          <ol style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              <>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-3)' }}>supabase.com</a> and create a free project</>,
              <>In your project, go to <strong style={{ color: 'var(--text-primary)' }}>SQL Editor</strong> and run the contents of <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem' }}>supabase-schema.sql</code> (included in this project)</>,
              <>Go to <strong style={{ color: 'var(--text-primary)' }}>Project Settings → API</strong></>,
              <>Copy your <strong style={{ color: 'var(--text-primary)' }}>Project URL</strong> and <strong style={{ color: 'var(--text-primary)' }}>anon/public key</strong></>,
              <>Paste them above and click Connect</>,
            ].map((step, i) => (
              <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-4)' }}>
          Your data is stored in your own Supabase project. We never see your data.
        </p>
      </div>
    </div>
  );
}
