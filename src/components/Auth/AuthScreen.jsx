import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAuth(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Logged in successfully!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Account created! You are now logged in.');
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-8)'
        }}>
          <div style={{
            background: 'var(--accent-1)',
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-md)',
            display: 'flex'
          }}>
            <CheckSquare size={24} color="var(--accent-1)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>StudyTrack</h1>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-6)', textAlign: 'center' }}>
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 'var(--space-2)', width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="btn btn-ghost"
            style={{ fontSize: '0.875rem' }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
