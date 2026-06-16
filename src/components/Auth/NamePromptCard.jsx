import { useState } from 'react';
import { User, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

export default function NamePromptCard({ onSave }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      toast.error('Please enter at least 2 characters');
      return;
    }

    setSaving(true);
    try {
      await onSave(trimmed);
      toast.success(`Welcome, ${trimmed}!`);
    } catch (err) {
      toast.error(err.message || 'Could not save your name');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="name-prompt-overlay" role="dialog" aria-modal="true" aria-labelledby="name-prompt-title">
      <div className="name-prompt-backdrop" />
      <div className="name-prompt-card card-3d slide-up">
        <div className="name-prompt-glow" aria-hidden="true" />

        <div className="name-prompt-header">
          <div className="name-prompt-icon">
            <User size={28} className="name-prompt-icon-svg" />
            <Sparkles size={14} className="name-prompt-sparkle" />
          </div>
          <h2 id="name-prompt-title">What should we call you?</h2>
          <p>We&apos;d love to personalize your dashboard. Enter your name to get started.</p>
        </div>

        <form className="name-prompt-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="display-name">Your name</label>
          <div className="input-with-icon">
            <User size={18} className="input-icon" />
            <input
              id="display-name"
              type="text"
              className="form-input"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              autoComplete="name"
              maxLength={60}
              disabled={saving}
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={saving || !name.trim()}>
            <span>{saving ? 'Saving...' : 'Continue'}</span>
            {!saving && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
