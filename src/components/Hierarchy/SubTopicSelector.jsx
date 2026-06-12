import { useState, useRef } from 'react';
import { Plus, X, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * SubTopicSelector — numbered list builder.
 * User types names one by one, they appear as a numbered list.
 * Clicking "Create N Tasks" passes the final list to parent via onCreateAll.
 */
export default function SubTopicSelector({ topicId, onCreateAll, onSkip, saving }) {
  const [items, setItems] = useState([]);  // array of name strings
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  function addItem() {
    const name = input.trim();
    if (!name) return;
    if (items.includes(name)) { setInput(''); return; } // skip exact duplicate
    setItems((prev) => [...prev, name]);
    setInput('');
    inputRef.current?.focus();
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
  }

  return (
    <div className="stb-root">
      {/* Input row */}
      <div className="stb-input-row">
        <input
          ref={inputRef}
          className="form-input stb-input"
          placeholder="Type a sub-topic name and press Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          id="subtopic-input"
          autoFocus
        />
        <button
          className="btn btn-secondary btn-sm stb-add-btn"
          onClick={addItem}
          disabled={!input.trim() || saving}
          id="subtopic-add-btn"
          title="Add to list"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Numbered list */}
      {items.length > 0 && (
        <ol className="stb-list">
          {items.map((name, i) => (
            <li key={i} className="stb-list-item">
              <span className="stb-num">{i + 1}.</span>
              <span className="stb-item-name">{name}</span>
              {!saving && (
                <button
                  className="stb-remove-btn"
                  onClick={() => removeItem(i)}
                  title="Remove"
                  aria-label={`Remove ${name}`}
                >
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* Action row */}
      <div className="stb-footer">
        {items.length > 0 ? (
          <button
            className="btn btn-primary stb-create-btn"
            onClick={() => onCreateAll(items)}
            disabled={saving}
            id="create-tasks-btn"
          >
            {saving ? (
              <><Loader2 size={15} className="stb-spin" /> Creating tasks…</>
            ) : (
              <><CheckCircle2 size={15} /> Create {items.length} Task{items.length !== 1 ? 's' : ''}</>
            )}
          </button>
        ) : (
          <p className="stb-hint">Add at least one sub-topic above to create tasks.</p>
        )}

        {!saving && (
          <button
            className="btn btn-ghost btn-sm stb-skip-btn"
            onClick={onSkip}
            id="skip-subtopic-btn"
          >
            Skip — enter title manually instead
          </button>
        )}
      </div>

      <style>{`
        .stb-root { display: flex; flex-direction: column; gap: var(--space-4); }

        .stb-input-row { display: flex; gap: var(--space-2); align-items: center; }
        .stb-input { flex: 1; }
        .stb-add-btn {
          flex-shrink: 0; width: 38px; height: 38px; min-height: 38px;
          padding: 0; display: flex; align-items: center; justify-content: center;
        }

        .stb-list {
          list-style: none;
          display: flex; flex-direction: column; gap: 4px;
          padding: var(--space-3);
          background: rgba(0,0,0,0.04);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          max-height: 220px; overflow-y: auto;
        }

        .stb-list-item {
          display: flex; align-items: center; gap: var(--space-3);
          padding: 8px var(--space-3);
          border-radius: var(--radius-sm);
          background: var(--bg-glass);
          border: 1px solid var(--border-glass);
          animation: stb-in 160ms ease;
        }

        @keyframes stb-in {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .stb-num {
          font-size: 0.7rem; font-weight: 700;
          color: var(--text-muted); width: 22px;
          text-align: right; flex-shrink: 0;
        }

        .stb-item-name {
          flex: 1; font-size: 0.875rem; font-weight: 500; color: var(--text-primary);
        }

        .stb-remove-btn {
          flex-shrink: 0; background: none; border: none; cursor: pointer;
          color: var(--text-muted); display: flex; align-items: center;
          justify-content: center; width: 22px; height: 22px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast); padding: 0;
        }
        .stb-remove-btn:hover { background: var(--danger-bg); color: var(--danger); }

        .stb-footer { display: flex; flex-direction: column; gap: var(--space-3); align-items: flex-start; }
        .stb-create-btn { width: 100%; justify-content: center; }
        .stb-hint { font-size: 0.8rem; color: var(--text-muted); font-style: italic; }
        .stb-skip-btn { color: var(--text-muted); font-size: 0.78rem; }

        .stb-spin { animation: stb-rotate 0.8s linear infinite; }
        @keyframes stb-rotate { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
