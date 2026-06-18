import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const newNameRef = useRef(null);

  const [panelStyle, setPanelStyle] = useState({});

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (
        rootRef.current && !rootRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
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

  // Position the panel using fixed coordinates, dynamically flipping if needed
  const updatePosition = useCallback(() => {
    if (open && rootRef.current && panelRef.current) {
      const triggerRect = rootRef.current.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();
      
      const spaceBelow = window.innerHeight - triggerRect.bottom - 16;
      const spaceAbove = triggerRect.top - 16;
      const estimatedPanelHeight = panelRect.height || 280; // Estimated for ~5 items + search + create button

      let top, maxHeight;
      let isUpward = false;

      // Decide if we should open upwards
      if (spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow) {
        isUpward = true;
        maxHeight = spaceAbove;
        top = triggerRect.top - 8 - Math.min(estimatedPanelHeight, maxHeight);
      } else {
        isUpward = false;
        maxHeight = spaceBelow;
        top = triggerRect.bottom + 8;
      }

      setPanelStyle({
        position: 'fixed',
        top: isUpward ? 'auto' : triggerRect.bottom + 8,
        bottom: isUpward ? window.innerHeight - triggerRect.top + 8 : 'auto',
        left: triggerRect.left,
        width: triggerRect.width,
        maxHeight: maxHeight,
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column'
      });
    }
  }, [open, items.length, search, creating]);

  useLayoutEffect(() => {
    updatePosition();
    // A small delay to recalculate after panel renders its actual DOM
    if (open) setTimeout(updatePosition, 10);
  }, [open, updatePosition]);

  // Close on modal scroll or window resize
  useEffect(() => {
    function handleScroll(e) {
      // Don't close if they are just scrolling the dropdown list itself
      if (open && panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener('scroll', handleScroll, true); // Use capture phase
      window.addEventListener('resize', () => setOpen(false));
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', () => setOpen(false));
      };
    }
  }, [open]);

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
      {open && createPortal(
        <div className="cdd-panel" ref={panelRef} style={panelStyle} onKeyDown={handleKeyDown}>
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
        </div>,
        document.body
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
          gap: 12px;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.95);
          font-size: 0.95rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }

        .cdd-trigger:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .cdd-trigger-open {
          border-color: var(--accent-1) !important;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 4px rgba(255, 138, 0, 0.12);
        }

        .cdd-trigger-value {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cdd-trigger-placeholder {
          color: rgba(255, 255, 255, 0.4);
          flex: 1;
          font-weight: 400;
        }

        .cdd-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 6px currentColor;
        }

        .cdd-chevron {
          flex-shrink: 0;
          color: rgba(255, 255, 255, 0.4);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease;
        }
        .cdd-trigger:hover .cdd-chevron { color: rgba(255, 255, 255, 0.8); }
        .cdd-trigger-open .cdd-chevron { transform: rotate(180deg); color: var(--accent-1); }

        /* ── Panel ────────────────────────────────── */
        .cdd-panel {
          background: #1a1a1d;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.02) inset;
          z-index: 300;
          overflow: hidden; /* important so contents don't bleed out of rounded corners */
          animation: cdd-panel-fade 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cdd-panel-fade {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Search ───────────────────────────────── */
        .cdd-search-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }

        .cdd-search-icon { color: rgba(255, 255, 255, 0.3); flex-shrink: 0; }

        .cdd-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 0.95rem;
          font-family: inherit;
        }
        .cdd-search-input::placeholder { color: rgba(255, 255, 255, 0.3); }

        .cdd-clear-btn {
          background: rgba(255, 255, 255, 0.05); border: none; cursor: pointer;
          color: rgba(255, 255, 255, 0.5); display: flex; align-items: center;
          padding: 4px; border-radius: 50%;
          transition: all 0.2s;
        }
        .cdd-clear-btn:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }

        /* ── List ─────────────────────────────────── */
        .cdd-list {
          list-style: none;
          flex: 1; /* allows list to shrink when panel hits max-height */
          min-height: 50px;
          max-height: 200px; /* Limits to ~5 items */
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cdd-list::-webkit-scrollbar { width: 6px; }
        .cdd-list::-webkit-scrollbar-track { background: transparent; margin: 4px 0; }
        .cdd-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
        .cdd-list::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }

        .cdd-empty {
          padding: 24px 20px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
        }

        .cdd-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          color: rgba(255, 255, 255, 0.8);
        }

        .cdd-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .cdd-item-active {
          background: rgba(255, 138, 0, 0.1) !important;
          color: var(--accent-1) !important;
          font-weight: 500;
        }

        .cdd-item-color {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 6px currentColor;
        }

        .cdd-item-name {
          flex: 1;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cdd-item-check { color: var(--accent-1); flex-shrink: 0; }

        /* ── Create section ───────────────────────── */
        .cdd-create-section {
          background: rgba(0, 0, 0, 0.15);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 10px;
          flex-shrink: 0; /* prevents create section from shrinking */
        }

        .cdd-create-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--accent-1);
          font-size: 0.9rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cdd-create-btn:hover {
          background: rgba(255, 138, 0, 0.1);
        }

        .cdd-create-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 4px;
        }

        .cdd-create-input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .cdd-create-input:focus {
          border-color: var(--accent-1);
        }
        .cdd-create-input::placeholder { color: rgba(255, 255, 255, 0.3); }

        /* Color swatches */
        .cdd-color-swatches {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 4px 0;
        }

        .cdd-swatch {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.15s;
          padding: 0;
        }
        .cdd-swatch:hover { transform: scale(1.15); }
        .cdd-swatch-sel {
          border-color: white;
          transform: scale(1.15);
        }

        /* Create actions */
        .cdd-create-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .cdd-save-btn {
          flex: 1;
          padding: 10px 14px;
          background: var(--accent-1);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.2s;
        }
        .cdd-save-btn:hover { background: var(--accent-2); }
        .cdd-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .cdd-cancel-btn {
          flex: 1;
          padding: 10px 14px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.2s;
        }
        .cdd-cancel-btn:hover { background: rgba(255, 255, 255, 0.05); }
        .cdd-cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .cdd-spin { animation: cdd-rotate 0.8s linear infinite; }
        @keyframes cdd-rotate { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const COLORS = [
  '#ff8a00','#da1b60','#ff9f43','#ff6b35',
  '#e85d75','#f43f5e','#f59e0b','#ef4444',
  '#ec4899','#f97316',
];
