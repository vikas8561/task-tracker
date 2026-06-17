import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, ArrowLeft, MessageSquareDashed, User } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
        await signIn(email, password);
        toast.success('Logged in successfully!');
      } else {
        await signUp(email, password);
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

      <div className="auth-split-layout">
        <div className="auth-brand-section">
          <h1 className="auth-brand-title">Taskabelle</h1>
          <div className="auth-brand-illustration">
            <MessageSquareDashed size={140} className="illustration-icon" />
          </div>
        </div>

        <div className="auth-card-section">
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="mobile-brand-title">Taskabelle</h1>
              <h2 className="auth-card-title">
                {isLogin ? 'Continue Your Progress' : 'Begin Your Success Story'}
              </h2>
              <p className="auth-card-subtitle">
                {isLogin 
                  ? 'Stay focused and keep moving toward your goals.' 
                  : 'Build habits, track progress, and achieve more every day.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="auth-form">
              <div className="form-group auth-input-group">
                <label className="form-label" htmlFor="email">EMAIL</label>
                <div className="input-with-icon">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  <Mail size={20} className="input-icon" aria-hidden="true" />
                </div>
              </div>

              <div className="form-group auth-input-group">
                <label className="form-label" htmlFor="password">PASSWORD</label>
                <div className="input-with-icon">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <Lock size={20} className="input-icon" aria-hidden="true" />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
              >
                <span>{loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}</span>
                {!loading && <ArrowRight size={20} aria-hidden="true" />}
              </button>
            </form>

            <div className="auth-footer">
              <p className="auth-switch-text">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <span
                  onClick={() => setIsLogin(!isLogin)}
                  className="auth-switch-link"
                  role="button"
                  tabIndex={0}
                >
                  {isLogin ? "Sign up now" : "Sign in"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
