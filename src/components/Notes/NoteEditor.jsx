import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, Code, Link2, Image, List, ListOrdered, CheckSquare, Table, Quote, FileCode, Minus, Pilcrow } from 'lucide-react';

const WIKI_LINK_TRIGGER = '[[';

export default function NoteEditor({
  title,
  onTitleChange,
  tags,
  onTagsChange,
  value,
  onChange,
  notes = [],
  onImageUpload,
  readOnly = false,
  placeholder = 'Start writing in Markdown...',
}) {
  const textareaRef = useRef(null);
  const [showWikiPopup, setShowWikiPopup] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiPos, setWikiPos] = useState({ top: 0, left: 0 });
  const [wikiCursorPos, setWikiCursorPos] = useState(null);
  const [wikiSelected, setWikiSelected] = useState(0);
  const autoSaveTimer = useRef(null);

  // ── Filtered notes for wiki-link popup ────────────────────────────────────
  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(wikiQuery.toLowerCase())
  ).slice(0, 8);

  // ── Insert text at cursor ──────────────────────────────────────────────────
  const insertAtCursor = useCallback((before, after = '', placeholder = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
      ta.focus();
    });
  }, [value, onChange]);

  // ── Toolbar actions ────────────────────────────────────────────────────────
  const toolbarActions = [
    { icon: Bold,         label: 'Bold',          action: () => insertAtCursor('**', '**', 'bold text') },
    { icon: Italic,       label: 'Italic',        action: () => insertAtCursor('*', '*', 'italic text') },
    { icon: Heading1,     label: 'H1',            action: () => insertAtCursor('# ', '', 'Heading 1') },
    { icon: Heading2,     label: 'H2',            action: () => insertAtCursor('## ', '', 'Heading 2') },
    { icon: Heading3,     label: 'H3',            action: () => insertAtCursor('### ', '', 'Heading 3') },
    null, // separator
    { icon: Link2,        label: 'Link',          action: () => insertAtCursor('[', '](url)', 'link text') },
    { icon: Image,        label: 'Image',         action: () => insertAtCursor('![', '](url)', 'alt text') },
    { icon: Code,         label: 'Inline code',   action: () => insertAtCursor('`', '`', 'code') },
    { icon: FileCode,     label: 'Code block',    action: () => insertAtCursor('```\n', '\n```', 'code here') },
    null,
    { icon: List,         label: 'Bullet list',   action: () => insertAtCursor('- ', '', 'List item') },
    { icon: ListOrdered,  label: 'Ordered list',  action: () => insertAtCursor('1. ', '', 'List item') },
    { icon: CheckSquare,  label: 'Task list',     action: () => insertAtCursor('- [ ] ', '', 'Task item') },
    { icon: Table,        label: 'Table',         action: () => insertAtCursor('\n| Column 1 | Column 2 |\n|----------|----------|\n| Cell     | Cell     |\n', '') },
    { icon: Quote,        label: 'Callout',       action: () => insertAtCursor('> [!NOTE]\n> ', '', 'Callout content') },
    { icon: Minus,        label: 'Divider',       action: () => insertAtCursor('\n---\n', '') },
    { icon: Pilcrow,      label: 'Math',          action: () => insertAtCursor('$$\n', '\n$$', 'LaTeX math') },
  ];

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    const ta = textareaRef.current;

    // Wiki-link navigation
    if (showWikiPopup) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setWikiSelected((s) => Math.min(s + 1, filteredNotes.length));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setWikiSelected((s) => Math.max(s - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (wikiSelected < filteredNotes.length) {
          insertWikiLink(filteredNotes[wikiSelected]);
        } else {
          insertWikiLink({ title: wikiQuery, slug: null });
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowWikiPopup(false);
        return;
      }
    }

    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); insertAtCursor('**', '**', 'bold text'); break;
        case 'i': e.preventDefault(); insertAtCursor('*', '*', 'italic text'); break;
        case 'k': e.preventDefault(); insertAtCursor('[', '](url)', 'link text'); break;
        case 'm': if (e.shiftKey) { e.preventDefault(); insertAtCursor('$$\n', '\n$$', 'LaTeX'); } break;
      }
    }

    // Tab → 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.slice(0, start) + '  ' + value.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }

    // Auto-close brackets
    const autoPairs = { '[': ']', '(': ')', '{': '}', '`': '`', '"': '"', "'": "'" };
    if (e.key in autoPairs && !e.ctrlKey && !e.metaKey) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      if (start === end) {
        // No selection — just let it type normally but check for [[
      }
    }

    // Enter: auto-indent lists
    if (e.key === 'Enter') {
      const start = ta.selectionStart;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const line = value.slice(lineStart, start);

      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s(\[[ x]\]\s)?/);
      if (listMatch) {
        // If line is empty list item, remove the marker
        const afterMarker = line.slice(listMatch[0].length);
        if (!afterMarker.trim()) {
          e.preventDefault();
          const newVal = value.slice(0, lineStart) + '\n' + value.slice(start);
          onChange(newVal);
          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart + 1; });
          return;
        }
        e.preventDefault();
        const indent = listMatch[1];
        const marker = listMatch[2].match(/^\d/) ? (parseInt(listMatch[2]) + 1) + '.' : listMatch[2];
        const taskPrefix = listMatch[3] ? '[ ] ' : '';
        const insert = '\n' + indent + marker + ' ' + taskPrefix;
        const newVal = value.slice(0, start) + insert + value.slice(start);
        onChange(newVal);
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + insert.length; });
      }
    }
  }, [showWikiPopup, wikiSelected, filteredNotes, insertAtCursor, value, onChange, wikiQuery]);

  // ── Wiki-link detection on input ──────────────────────────────────────────
  const handleInput = useCallback((e) => {
    const ta = e.target;
    const pos = ta.selectionStart;
    const beforeCursor = ta.value.slice(0, pos);
    const triggerIdx = beforeCursor.lastIndexOf('[[');

    if (triggerIdx !== -1 && !beforeCursor.slice(triggerIdx).includes('\n')) {
      const query = beforeCursor.slice(triggerIdx + 2);
      if (!query.includes(']')) {
        setWikiQuery(query);
        setWikiCursorPos(triggerIdx);
        setWikiSelected(0);
        setShowWikiPopup(true);

        // Position the popup below the cursor (approximate)
        const linesBefore = beforeCursor.split('\n').length;
        const lineHeight = 22;
        setWikiPos({ top: linesBefore * lineHeight, left: (query.length + 2) * 8 });
        return;
      }
    }

    setShowWikiPopup(false);
  }, []);

  const insertWikiLink = useCallback((note) => {
    const ta = textareaRef.current;
    const pos = ta.selectionStart;
    const beforeCursor = value.slice(0, pos);
    const triggerIdx = beforeCursor.lastIndexOf('[[');

    if (triggerIdx !== -1) {
      const linkText = note.title || wikiQuery;
      const insert = `[[${linkText}]]`;
      const newVal = value.slice(0, triggerIdx) + insert + value.slice(pos);
      onChange(newVal);
      requestAnimationFrame(() => {
        const newPos = triggerIdx + insert.length;
        ta.selectionStart = ta.selectionEnd = newPos;
        ta.focus();
      });
    }

    setShowWikiPopup(false);
    setWikiQuery('');
  }, [value, onChange, wikiQuery]);

  // ── Image upload handler ──────────────────────────────────────────────────
  const handleImageUpload = useCallback(async (file) => {
    if (!onImageUpload) return;
    try {
      const img = await onImageUpload(file);
      if (img?.public_url) {
        insertAtCursor(`![${file.name}](`, ')', img.public_url);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  }, [onImageUpload, insertAtCursor]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
    files.forEach(handleImageUpload);
  }, [handleImageUpload]);

  const handlePaste = useCallback((e) => {
    const items = [...(e.clipboardData?.items || [])];
    const imageItem = items.find((it) => it.type.startsWith('image/'));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) handleImageUpload(file);
    }
  }, [handleImageUpload]);

  return (
    <div className="note-editor-wrapper">
      {/* Toolbar */}
      {!readOnly && (
        <div className="editor-toolbar">
          {toolbarActions.map((action, i) =>
            action === null ? (
              <div key={`sep-${i}`} className="editor-toolbar-sep" />
            ) : (
              <button
                key={action.label}
                className="editor-toolbar-btn"
                title={action.label}
                onClick={(e) => { e.preventDefault(); action.action(); }}
                type="button"
              >
                <action.icon size={15} />
              </button>
            )
          )}

          {onImageUpload && (
            <>
              <div className="editor-toolbar-sep" />
              <label className="editor-toolbar-btn" title="Upload image">
                <Image size={15} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </>
          )}
        </div>
      )}

      {/* Editor textarea */}
      <div className="editor-body-wrapper" style={{ position: 'relative' }}>        <textarea
          ref={textareaRef}
          className="note-textarea"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            handleInput(e);
          }}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onPaste={handlePaste}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck
          autoCapitalize="off"
          autoCorrect="off"
        />

        {/* Wiki-link popup */}
        {showWikiPopup && (
          <div
            className="wiki-link-popup"
            style={{ top: wikiPos.top + 24, left: Math.min(wikiPos.left, 300) }}
          >
            <div className="wiki-link-popup-header">
              🔗 Link to note
            </div>
            {filteredNotes.map((note, i) => (
              <button
                key={note.slug || note.id}
                className={`wiki-link-popup-item ${i === wikiSelected ? 'active' : ''}`}
                onClick={() => insertWikiLink(note)}
                type="button"
              >
                <span className="wiki-link-popup-icon">📄</span>
                <span className="wiki-link-popup-title">{note.title}</span>
              </button>
            ))}
            {wikiQuery && (
              <button
                className={`wiki-link-popup-item wiki-link-popup-new ${wikiSelected === filteredNotes.length ? 'active' : ''}`}
                onClick={() => insertWikiLink({ title: wikiQuery, slug: null })}
                type="button"
              >
                <span className="wiki-link-popup-icon">✨</span>
                <span>Create "{wikiQuery}"</span>
              </button>
            )}
            {filteredNotes.length === 0 && !wikiQuery && (
              <div className="wiki-link-popup-empty">Type to search notes...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
