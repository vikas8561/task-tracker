import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Pin, Archive, Trash2, MoreVertical, FileText } from 'lucide-react';
import { searchNotes, getAllTags, initFuse } from '../../lib/notesEngine';

export default function NotesList({
  notes,
  selectedSlug,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  onToggleArchive,
  loading,
  externalQuery = '',
  showArchivedOnly = false,
}) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const contextRef = useRef(null);

  useEffect(() => {
    if (notes.length > 0) initFuse(notes);
  }, [notes]);

  const allTags = useMemo(() => getAllTags(notes), [notes]);

  const filteredNotes = useMemo(() => {
    let result = externalQuery.trim() ? searchNotes(externalQuery, notes) : [...notes];
    if (selectedTags.length > 0) {
      result = result.filter((n) =>
        selectedTags.every((t) => (n.tags || []).includes(t))
      );
    }
    // Archive filter: if showArchivedOnly → show only archived; else hide archived
    if (showArchivedOnly) {
      result = result.filter((n) => n.is_archived);
    } else {
      result = result.filter((n) => !n.is_archived);
    }
    return result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });
  }, [notes, externalQuery, selectedTags, showArchivedOnly]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const openContextMenu = (e, note) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ note, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="obs-notes-list">
      {/* No search bar here — it's in the sidebar header */}

      {/* Tag chips */}

      {/* Notes as Obsidian-style file rows */}
      <div className="obs-file-list">
        {loading && (
          <div className="obs-file-list-loading">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="obs-file-skeleton" />
            ))}
          </div>
        )}

        {!loading && filteredNotes.length === 0 && (
          <div className="obs-file-empty">
            <div className="obs-file-empty-icon">📄</div>
            <p>{externalQuery ? 'No notes found' : 'No notes yet'}</p>
            <button className="obs-file-create-btn" onClick={onCreateNote}>
              <Plus size={13} /> New note
            </button>
          </div>
        )}

        {!loading && filteredNotes.map((note) => (
          <div
            key={note.id}
            className={`obs-file-row ${selectedSlug === note.slug ? 'active' : ''} ${note.is_archived ? 'archived' : ''}`}
            onClick={() => onSelectNote(note.slug)}
            onContextMenu={(e) => openContextMenu(e, note)}
            title={note.title}
          >
            {note.is_pinned
              ? <Pin size={13} className="obs-file-pin" />
              : <FileText size={13} className="obs-file-icon" />
            }
            <span className="obs-file-name">{note.title}</span>
            <button
              className="obs-file-menu-btn"
              onClick={(e) => openContextMenu(e, note)}
            >
              <MoreVertical size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="obs-context-menu"
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}
          ref={contextRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="obs-context-item"
            onClick={() => { onTogglePin(contextMenu.note); setContextMenu(null); }}
          >
            <Pin size={13} />
            {contextMenu.note.is_pinned ? 'Unpin' : 'Pin to top'}
          </button>
          <button
            className="obs-context-item"
            onClick={() => { onToggleArchive(contextMenu.note); setContextMenu(null); }}
          >
            <Archive size={13} />
            {contextMenu.note.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <div className="obs-context-sep" />
          <button
            className="obs-context-item danger"
            onClick={() => { onDeleteNote(contextMenu.note); setContextMenu(null); }}
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
