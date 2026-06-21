import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, Plus, MoreVertical, Pencil, Trash2, FileText, Pin, Archive, EyeOff, Eye } from 'lucide-react';
import { buildFolderTree } from '../../lib/notesEngine';
import { useAuth } from '../../context/AuthContext';

function NoteRow({ note, selectedSlug, onSelectNote, onRenameNote, onDeleteNote, onTogglePin, onToggleArchive, rootLevel = false }) {
  const { isAdmin } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleContextMenu = (e) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(true);
  };

  return (
    <div
      className={`obs-tree-file-row ${selectedSlug === note.slug ? 'active' : ''} ${rootLevel ? 'root-level' : ''}`}
      onClick={() => onSelectNote(note.slug)}
      onContextMenu={handleContextMenu}
      title={note.title}
    >
      {note.is_pinned ? <Pin size={13} className="obs-tree-file-icon" /> : <FileText size={13} className="obs-tree-file-icon" />}
      <span className="obs-tree-file-label">{note.title}</span>

      {/* Context actions */}
      {isAdmin && (
        <div className="obs-tree-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="obs-tree-action-btn"
            onClick={() => setShowMenu((m) => !m)}
            title="Options"
          >
            <MoreVertical size={12} />
          </button>
          {showMenu && (
            <div className="obs-tree-menu" onMouseLeave={() => setShowMenu(false)}>
              <button className="obs-tree-menu-item" onClick={() => { onRenameNote(note); setShowMenu(false); }}>
                <Pencil size={12} /> Rename
              </button>
              <button className="obs-tree-menu-item" onClick={() => { onTogglePin(note); setShowMenu(false); }}>
                <Pin size={12} /> {note.is_pinned ? 'Unpin' : 'Pin'}
              </button>
              <button className="obs-tree-menu-item" onClick={() => { onToggleArchive(note); setShowMenu(false); }}>
                <Archive size={12} /> {note.is_archived ? 'Unarchive' : 'Archive'}
              </button>
              <div className="obs-tree-menu-sep" />
              <button className="obs-tree-menu-item danger" onClick={() => { onDeleteNote(note); setShowMenu(false); }}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FolderNode({
  folder,
  depth,
  selectedFolderId,
  selectedSlug,
  onSelectFolder,
  onSelectNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateNote,
  onRenameNote,
  onDeleteNote,
  onTogglePin,
  onToggleArchive,
  onToggleHide,
}) {
  const { isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(depth === 0);
  const [showMenu, setShowMenu] = useState(false);
  const hasChildren = folder.children?.length > 0;
  const folderNotes = folder.notes || [];
  const hasContent = hasChildren || folderNotes.length > 0;

  const handleContextMenu = (e) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(true);
  };

  return (
    <div className={`obs-tree-node ${folder.is_hidden ? 'obs-tree-node--hidden' : ''}`}>
      {/* Folder row */}
      <div
        className={`obs-tree-row ${selectedFolderId === folder.id ? 'folder-selected' : ''}`}
        style={{ paddingLeft: 8 + depth * 20 }}
        onClick={() => { setExpanded((e) => !e); onSelectFolder(folder.id); }}
        onContextMenu={handleContextMenu}
      >
        <span
          className="obs-tree-arrow"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        >
          {hasContent
            ? (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)
            : <span className="obs-tree-arrow-spacer" />}
        </span>

        <span className="obs-tree-icon">
          {expanded && hasContent ? <FolderOpen size={14} /> : <Folder size={14} />}
        </span>

        <span className="obs-tree-label">{folder.name}</span>

        {/* Hidden indicator badge (admin only) */}
        {isAdmin && folder.is_hidden && (
          <span className="obs-tree-hidden-badge" title="Hidden from users">
            <EyeOff size={11} />
          </span>
        )}

        {/* Context actions */}
        {isAdmin && (
          <div className="obs-tree-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="obs-tree-action-btn"
              onClick={() => setShowMenu((m) => !m)}
              title="Options"
            >
              <MoreVertical size={12} />
            </button>
            {showMenu && (
              <div className="obs-tree-menu" onMouseLeave={() => setShowMenu(false)}>
                <button className="obs-tree-menu-item" onClick={() => { onCreateNote(folder.id); setShowMenu(false); }}>
                  <Plus size={12} /> New note
                </button>
                <button className="obs-tree-menu-item" onClick={() => { onCreateFolder(folder.id); setShowMenu(false); }}>
                  <Folder size={12} /> New subfolder
                </button>
                <button className="obs-tree-menu-item" onClick={() => { onRenameFolder(folder); setShowMenu(false); }}>
                  <Pencil size={12} /> Rename
                </button>
                <div className="obs-tree-menu-sep" />
                <button className="obs-tree-menu-item" onClick={() => { onToggleHide(folder); setShowMenu(false); }}>
                  {folder.is_hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                  {folder.is_hidden ? 'Unhide' : 'Hide from users'}
                </button>
                <div className="obs-tree-menu-sep" />
                <button className="obs-tree-menu-item danger" onClick={() => { onDeleteFolder(folder.id); setShowMenu(false); }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Children: subfolders + notes */}
      {expanded && hasContent && (
        <div className="obs-tree-children" style={{ marginLeft: 8 + depth * 20 + 8 }}>
          {folder.children?.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              selectedSlug={selectedSlug}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateNote={onCreateNote}
              onRenameNote={onRenameNote}
              onDeleteNote={onDeleteNote}
              onTogglePin={onTogglePin}
              onToggleArchive={onToggleArchive}
              onToggleHide={onToggleHide}
            />
          ))}
          {folderNotes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              selectedSlug={selectedSlug}
              onSelectNote={onSelectNote}
              onRenameNote={onRenameNote}
              onDeleteNote={onDeleteNote}
              onTogglePin={onTogglePin}
              onToggleArchive={onToggleArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  notes,
  selectedFolderId,
  selectedSlug,
  onSelectFolder,
  onSelectNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateNote,
  onRenameNote,
  onDeleteNote,
  onTogglePin,
  onToggleArchive,
  onToggleHide,
  onSelectAll,
}) {
  const { isAdmin } = useAuth();

  // Filter hidden folders for non-admin users
  const visibleFolders = isAdmin ? folders : folders.filter((f) => !f.is_hidden);

  const tree = buildFolderTree(visibleFolders, notes);

  // Root-level folders (no parent)
  const rootFolders = tree; // buildFolderTree already returns root-level folders

  // Notes not belonging to any folder
  const folderIds = new Set(visibleFolders.map((f) => f.id));
  const unfolderedNotes = notes.filter((n) => !n.folder_id || !folderIds.has(n.folder_id));

  // Merge folders and unfoldered notes, sort by created_at ascending
  const rootItems = [
    ...rootFolders.map((f) => ({ type: 'folder', item: f, created_at: f.created_at || '' })),
    ...unfolderedNotes.map((n) => ({ type: 'note', item: n, created_at: n.created_at || '' })),
  ].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

  return (
    <div className="obs-folder-tree">
      {rootItems.map(({ type, item }) =>
        type === 'folder' ? (
          <FolderNode
            key={item.id}
            folder={item}
            depth={0}
            selectedFolderId={selectedFolderId}
            selectedSlug={selectedSlug}
            onSelectFolder={onSelectFolder}
            onSelectNote={onSelectNote}
            onCreateFolder={(parentId) => onCreateFolder(parentId)}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onCreateNote={onCreateNote}
            onRenameNote={onRenameNote}
            onDeleteNote={onDeleteNote}
            onTogglePin={onTogglePin}
            onToggleArchive={onToggleArchive}
            onToggleHide={onToggleHide}
          />
        ) : (
          <NoteRow
            key={item.id}
            note={item}
            selectedSlug={selectedSlug}
            onSelectNote={onSelectNote}
            onRenameNote={onRenameNote}
            onDeleteNote={onDeleteNote}
            onTogglePin={onTogglePin}
            onToggleArchive={onToggleArchive}
            rootLevel
          />
        )
      )}
    </div>
  );
}
