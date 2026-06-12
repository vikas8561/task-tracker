import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Plus, Search, X, Loader2 } from 'lucide-react';

/**
 * Beautiful custom dropdown used by Subject, Chapter, and Topic selectors.
 *
 * Props:
 *   items         – array of { id, name, color? }
 *   value         – selected item or null
 *   onChange      – (item) => void
 *   placeholder   – string shown when nothing selected
 *   onCreate      – async (name, color?) => item    (handles DB insert)
 *   colorPicker   – show color swatches when creating (subjects only)
 *   accentColor   – left stripe color for selected state (pass subject.color)
 *   id            – base id for testing
 */
export default function CustomDropdown({
  items = [],
  value,
  onChange,
  placeholder = 'Select…',
  onCreate,
  colorPicker = false,
  accentColor,
  id = 'dropdown',
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const newNameRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
        setCreating(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Focus search when opening
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  // Focus new name input when entering create mode
  useEffect(() => {
    if (creating) setTimeout(() => newNameRef.current?.focus(), 60);
  }, [creating]);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(item) {
    onChange(item);
    setOpen(false);
    setSearch('');
    setCreating(false);
  }

  async function handleCreate() {
    if (!newName.trim() || !onCreate) return;
    setSaving(true);
    try {
      const item = await onCreate(newName.trim(), newColor);
      onChange(item);
      setOpen(false);
      setSearch('');
      setCreating(false);
      setNewName('');
      setNewColor(COLORS[0]);
    } catch {
      // parent shows toast
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); setSearch(''); setCreating(false); }
    if (e.key === 'Enter' && creating) { e.preventDefault(); handleCreate(); }
  }

  const accent = accentColor || value?.color || 'rgba(0,0,0,0.3)';

  return (
    <div className="cdd-root" ref={rootRef} id={id}>
      {/* Trigger */}
      <button
        className={`cdd-trigger ${open ? 'cdd-trigger-open' : ''} ${value ? 'cdd-trigger-selected' : ''}`}
        onClick={() => setOpen((o) => !o)}
        type="button"
        id={`${id}-trigger`}
        style={value ? { borderColor: accent + '55' } : {}}
      >
        {value ? (
          <span className="cdd-trigger-value">
            {value.color && (
              <span className="cdd-color-dot" style={{ background: value.color }} />
            )}
            {value.name}
          </span>
        ) : (
          <span className="cdd-trigger-placeholder">{placeholder}</span>
        )}
        <ChevronDown
          size={15}
          className={`cdd-chevron ${open ? 'cdd-chevron-up' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="cdd-panel" onKeyDown={handleKeyDown}>
          {/* Search */}
          <div className="cdd-search-row">
            <Search size={13} className="cdd-search-icon" />
            <input
              ref={searchRef}
              className="cdd-search-input"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id={`${id}-search`}
            />
            {search && (
              <button className="cdd-clear-btn" onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Item list */}
          <ul className="cdd-list" role="listbox">
            {filtered.length === 0 && !creating && (
              <li className="cdd-empty">No results for "{search}"</li>
            )}
            {filtered.map((item) => (
              <li
                key={item.id}
                className={`cdd-item ${value?.id === item.id ? 'cdd-item-active' : ''}`}
                onClick={() => handleSelect(item)}
                role="option"
                aria-selected={value?.id === item.id}
                id={`${id}-item-${item.id}`}
              >
                {item.color && (
                  <span
                    className="cdd-item-color"
                    style={{ background: item.color }}
                  />
                )}
                <span className="cdd-item-name">{item.name}</span>
                {value?.id === item.id && (
                  <Check size={13} className="cdd-item-check" />
                )}
              </li>
            ))}
          </ul>

          {/* Divider + Create section */}
          {onCreate && (
            <div className="cdd-create-section">
              {!creating ? (
                <button
                  className="cdd-create-btn"
                  onClick={() => setCreating(true)}
                  id={`${id}-create-btn`}
                >
                  <Plus size={14} />
                  <span>Create new{search ? ` "${search}"` : ''}</span>
                </button>
              ) : (
                <div className="cdd-create-form">
                  <input
                    ref={newNameRef}
                    className="cdd-create-input"
                    placeholder="Name…"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    disabled={saving}
                    id={`${id}-new-name`}
                  />

                  {colorPicker && (
                    <div className="cdd-color-swatches">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          className={`cdd-swatch ${newColor === c ? 'cdd-swatch-sel' : ''}`}
                          style={{ background: c }}
                          onClick={() => setNewColor(c)}
                          title={c}
                        />
                      ))}
                    </div>
                  )}

                  <div className="cdd-create-actions">
                    <button
                      className="cdd-save-btn"
                      onClick={handleCreate}
                      disabled={saving || !newName.trim()}
                    >
                      {saving
                        ? <><Loader2 size={12} className="cdd-spin" /> Saving…</>
                        : 'Create'}
                    </button>
                    <button
                      className="cdd-cancel-btn"
                      onClick={() => { setCreating(false); setNewName(''); }}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        /* ── Root ─────────────────────────────────── */
        .cdd-root {
          position: relative;
          width: 100%;
          font-family: 'Inter', sans-serif;
        }

        /* ── Trigger ──────────────────────────────── */
        .cdd-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 14px;
          background: var(--bg-input);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.9rem;
          font-family: inherit;
          cursor: pointer;
          transition: border-color 150ms ease, background 150ms ease, box-shadow 150ms ease;
          text-align: left;
        }

        .cdd-trigger:hover {
          border-color: var(--border-glass-strong);
          background: rgba(0,0,0,0.07);
        }

        .cdd-trigger-open {
          border-color: rgba(0,0,0,0.35) !important;
          background: rgba(0,0,0,0.07);
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
          border-radius: var(--radius-md) var(--radius-md) 0 0;
        }

        .cdd-trigger-value {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cdd-trigger-placeholder {
          color: var(--text-muted);
          flex: 1;
          font-weight: 400;
        }

        .cdd-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .cdd-chevron {
          flex-shrink: 0;
          color: var(--text-muted);
          transition: transform 200ms ease;
        }
        .cdd-chevron-up { transform: rotate(180deg); }

        /* ── Panel ────────────────────────────────── */
        .cdd-panel {
          position: absolute;
          top: calc(100% - 1px);
          left: 0; right: 0;
          background: var(--bg-tertiary);
          border: 1px solid rgba(0,0,0,0.18);
          border-top: none;
          border-radius: 0 0 var(--radius-md) var(--radius-md);
          box-shadow: 0 16px 48px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.08);
          z-index: 300;
          overflow: hidden;
          animation: cdd-panel-in 140ms ease;
        }

        @keyframes cdd-panel-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Search ───────────────────────────────── */
        .cdd-search-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(0,0,0,0.07);
        }

        .cdd-search-icon { color: var(--text-muted); flex-shrink: 0; }

        .cdd-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-family: inherit;
        }
        .cdd-search-input::placeholder { color: var(--text-muted); }

        .cdd-clear-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); display: flex; align-items: center;
          padding: 2px; border-radius: 4px;
          transition: color 120ms;
        }
        .cdd-clear-btn:hover { color: var(--text-primary); }

        /* ── List ─────────────────────────────────── */
        .cdd-list {
          list-style: none;
          max-height: 200px;
          overflow-y: auto;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cdd-list::-webkit-scrollbar { width: 4px; }
        .cdd-list::-webkit-scrollbar-track { background: transparent; }
        .cdd-list::-webkit-scrollbar-thumb { background: var(--border-glass-strong); border-radius: 99px; }

        .cdd-empty {
          padding: 12px 10px;
          font-size: 0.8rem;
          color: var(--text-muted);
          text-align: center;
          font-style: italic;
        }

        .cdd-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 120ms ease;
          position: relative;
          overflow: hidden;
        }

        .cdd-item:hover {
          background: rgba(0,0,0,0.06);
        }

        .cdd-item-active {
          background: rgba(0,0,0,0.1) !important;
        }

        .cdd-item-color {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .cdd-item-name {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cdd-item-check { color: var(--success); flex-shrink: 0; }

        /* ── Create section ───────────────────────── */
        .cdd-create-section {
          border-top: 1px solid rgba(0,0,0,0.07);
          padding: 8px 6px;
        }

        .cdd-create-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: none;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 0.83rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: background 120ms, color 120ms;
          text-align: left;
        }
        .cdd-create-btn:hover {
          background: rgba(0,0,0,0.05);
          color: var(--text-primary);
        }

        .cdd-create-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 4px 6px 4px;
        }

        .cdd-create-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.15);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: inherit;
          outline: none;
          transition: border-color 150ms;
        }
        .cdd-create-input:focus {
          border-color: rgba(0,0,0,0.4);
        }
        .cdd-create-input::placeholder { color: var(--text-muted); }

        /* Color swatches */
        .cdd-color-swatches {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 2px 0;
        }

        .cdd-swatch {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 120ms, border-color 120ms;
          padding: 0;
        }
        .cdd-swatch:hover { transform: scale(1.2); }
        .cdd-swatch-sel {
          border-color: white;
          transform: scale(1.15);
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3);
        }

        /* Create actions */
        .cdd-create-actions {
          display: flex;
          gap: 6px;
        }

        .cdd-save-btn {
          flex: 1;
          padding: 7px 14px;
          background: var(--accent-1);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 120ms;
        }
        .cdd-save-btn:hover { background: var(--accent-2); }
        .cdd-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .cdd-cancel-btn {
          padding: 7px 14px;
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-family: inherit;
          cursor: pointer;
          transition: background 120ms;
        }
        .cdd-cancel-btn:hover { background: rgba(0,0,0,0.1); }
        .cdd-cancel-btn:disabled { opacity: 0.5; }

        .cdd-spin { animation: cdd-rotate 0.8s linear infinite; }
        @keyframes cdd-rotate { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const COLORS = [
  '#0f766e','#8b5cf6','#06b6d4','#10b981',
  '#f59e0b','#ef4444','#ec4899','#14b8a6',
  '#f97316','#84cc16',
];
