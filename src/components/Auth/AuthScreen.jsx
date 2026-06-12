import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckSquare, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

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
    <div className="auth-wrapper">
      <div className="auth-background-mesh"></div>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <CheckSquare size={32} className="auth-logo-icon" />
            </div>
            <h1 className="auth-title">TaskTrack</h1>
            <p className="auth-subtitle">
              {isLogin ? 'Welcome back' : 'Start your journey'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            <div className="form-group auth-input-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div className="input-with-icon">
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Mail size={20} className="input-icon" />
              </div>
            </div>
            
            <div className="form-group auth-input-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-with-icon">
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
                <Lock size={20} className="input-icon" />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              <span>{loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}</span>
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-switch-text">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              onClick={() => setIsLogin(!isLogin)}
              type="button"
              className="btn btn-ghost auth-switch-btn"
            >
              {isLogin ? "Sign up now" : "Sign in instead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
