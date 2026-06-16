import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, FilePlus2, Eye, Edit3, Columns, GitBranch,
  FileText, Folder, Search, X, Archive, FolderPlus, Trash2, PanelRightOpen, PanelRightClose
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  fetchNotes, fetchAllNotesMeta, fetchNote,
  createNote, updateNote, deleteNote,
  togglePin, toggleArchive,
  fetchFolders, createFolder, updateFolder, deleteFolder,
  uploadNoteImage,
} from '../../lib/notesApi';
import { buildBacklinkIndex, buildGraphData, initFuse } from '../../lib/notesEngine';
import { useAuth } from '../../context/AuthContext';

import NoteEditor from './NoteEditor';
import MarkdownRenderer from './MarkdownRenderer';
import BacklinksPanel from './BacklinksPanel';
import FolderTree from './FolderTree';
import GraphView from './GraphView';

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractToc(content) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length;
    const text = match[2].trim().replace(/[*_`[\]]/g, '');
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    toc.push({ depth, text, id });
  }
  return toc;
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NotesView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Data
  const [notes, setNotes] = useState([]);
  const [allNotesMeta, setAllNotesMeta] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteLoading, setNoteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editor
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [editorTags, setEditorTags] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [viewMode, setViewMode] = useState('preview'); // 'edit' | 'split' | 'preview' | 'graph'

  // UI
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [showGraph, setShowGraph] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Unified creation dialog state: { type: 'note' | 'folder', parentId: string | null }
  const [createItemDialog, setCreateItemDialog] = useState(null);
  const [createItemName, setCreateItemName] = useState('');

  // Custom confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState(null);
  const sidebarSearchRef = useRef(null);

  // Notes nav panel collapsed state — persisted
  const [navCollapsed, setNavCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return true;
    try { return localStorage.getItem('notes-nav-collapsed') === 'true'; } catch { return false; }
  });

  const toggleNavCollapse = () => {
    setNavCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem('notes-nav-collapsed', String(next)); } catch {}
      return next;
    });
  };

  // Scroll to hide topbar on mobile
  const [topbarVisible, setTopbarVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback((e) => {
    if (typeof window === 'undefined' || window.innerWidth > 768) return;
    const currentScrollY = e.target.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      setTopbarVisible(false);
    } else if (currentScrollY < lastScrollY.current) {
      setTopbarVisible(true);
    }
    lastScrollY.current = currentScrollY;
  }, []);

  // Derived
  const debouncedContent = useDebounce(editorContent, 800);

  const backlinkIndex = useMemo(() => buildBacklinkIndex(allNotesMeta), [allNotesMeta]);
  const graphData = useMemo(() => buildGraphData(allNotesMeta, backlinkIndex), [allNotesMeta, backlinkIndex]);
  const currentBacklinks = useMemo(
    () => activeNote ? (backlinkIndex[activeNote.slug] || []) : [],
    [activeNote, backlinkIndex]
  );
  const toc = useMemo(() => extractToc(editorContent), [editorContent]);

  // Load initial data
  useEffect(() => {
    Promise.all([fetchNotes(), fetchFolders(), fetchAllNotesMeta()])
      .then(([notesData, foldersData, metaData]) => {
        setNotes(notesData);
        setFolders(foldersData);
        setAllNotesMeta(metaData);
        initFuse(notesData);
        setLoading(false);
      })
      .catch((err) => { console.error('Failed to load notes:', err); setLoading(false); });
  }, []);

  // Load note when slug changes
  useEffect(() => {
    if (!slug || slug === 'undefined' || slug === 'null') {
      setActiveNote(null); setEditorContent(''); setEditorTitle(''); setEditorTags(''); setIsDirty(false);
      return;
    }
    setNoteLoading(true);
    fetchNote(slug)
      .then((note) => {
        setActiveNote(note);
        setEditorContent(note.content || '');
        setEditorTitle(note.title || '');
        setEditorTags((note.tags || []).join(', '));
        setIsDirty(false);
        setNoteLoading(false);
      })
      .catch(() => { 
        // Only show error if the user actually has notes (prevents error loop on empty accounts)
        if (allNotesMeta.length > 0) {
          toast.error('Note not found'); 
        }
        navigate('/notes', { replace: true }); 
        setNoteLoading(false); 
      });
  }, [slug, navigate, allNotesMeta.length]);

  // Auto-save
  useEffect(() => {
    if (!activeNote || !isDirty) return;
    if (debouncedContent === activeNote.content && editorTitle === activeNote.title) return;
    setSaving(true);
    const tags = editorTags.split(',').map((t) => t.trim()).filter(Boolean);
    updateNote(activeNote.id, { title: editorTitle, content: debouncedContent, tags })
      .then((updated) => {
        setActiveNote(updated);
        setNotes((prev) => prev.map((n) => n.id === updated.id ? { ...n, ...updated, content: undefined } : n));
        setAllNotesMeta((prev) => prev.map((n) => n.id === updated.id ? { ...n, ...updated } : n));
        setSaving(false); setIsDirty(false);
      })
      .catch(() => setSaving(false));
  }, [debouncedContent, activeNote, isDirty]);

  // Handlers
  const handleSelectNote = useCallback((noteSlug) => navigate(`/notes/${noteSlug}`), [navigate]);

  const handleCreateNote = useCallback((folderId = null) => {
    setCreateItemDialog({ type: 'note', parentId: folderId });
    setCreateItemName('');
  }, []);

  const handleConfirmCreateItem = useCallback(async () => {
    if (!createItemDialog) return;
    const { type, parentId } = createItemDialog;
    const name = createItemName.trim() || (type === 'note' ? 'Untitled' : 'New Folder');

    if (type === 'note') {
      try {
        const note = await createNote({ title: name, content: `# ${name}\n\n`, folderId: parentId });
        setNotes((prev) => [note, ...prev]);
        setAllNotesMeta((prev) => [note, ...prev]);
        setCreateItemDialog(null);
        navigate(`/notes/${note.slug}`);
        toast.success('Note created');
      } catch (err) { toast.error('Failed to create note: ' + err.message); }
    } else {
      try {
        const folder = await createFolder({ name, parentId });
        setFolders((prev) => [...prev, folder]);
        setCreateItemDialog(null);
        toast.success('Folder created');
      } catch (err) { toast.error('Failed to create folder: ' + err.message); }
    }
  }, [createItemDialog, createItemName, navigate]);

  const handleDeleteNote = useCallback((note) => {
    setConfirmDialog({
      title: 'Delete Note',
      message: `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
      confirmText: 'Delete Note',
      onConfirm: async () => {
        try {
          await deleteNote(note.id);
          setNotes((prev) => prev.filter((n) => n.id !== note.id));
          setAllNotesMeta((prev) => prev.filter((n) => n.id !== note.id));
          if (activeNote?.id === note.id) navigate('/notes');
          toast.success('Note deleted');
        } catch { toast.error('Failed to delete note'); }
        setConfirmDialog(null);
      }
    });
  }, [activeNote, navigate]);

  const handleRenameNote = useCallback(async (note) => {
    const title = prompt('Rename note:', note.title);
    if (!title || title === note.title) return;
    try {
      const updated = await updateNote(note.id, { title });
      setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, title: updated.title } : n));
      setAllNotesMeta((prev) => prev.map((n) => n.id === note.id ? { ...n, title: updated.title } : n));
      if (activeNote?.id === note.id) {
        setActiveNote((prev) => ({ ...prev, title: updated.title }));
        setEditorTitle(updated.title);
      }
      toast.success('Note renamed');
    } catch { toast.error('Failed to rename note'); }
  }, [activeNote]);

  const handleTogglePin = useCallback(async (note) => {
    try {
      const updated = await togglePin(note.id, note.is_pinned);
      setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, is_pinned: updated.is_pinned } : n));
    } catch { toast.error('Failed to update pin'); }
  }, []);

  const handleToggleArchive = useCallback(async (note) => {
    try {
      const updated = await toggleArchive(note.id, note.is_archived);
      setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, is_archived: updated.is_archived } : n));
      toast.success(updated.is_archived ? 'Note archived' : 'Note unarchived');
    } catch { toast.error('Failed to update archive'); }
  }, []);

  const handleCreateFolder = useCallback((parentId = null) => {
    setCreateItemDialog({ type: 'folder', parentId });
    setCreateItemName('');
  }, []);

  const handleRenameFolder = useCallback(async (folder) => {
    const name = prompt('Rename folder:', folder.name);
    if (!name || name === folder.name) return;
    try {
      const updated = await updateFolder(folder.id, { name });
      setFolders((prev) => prev.map((f) => f.id === folder.id ? updated : f));
    } catch { toast.error('Failed to rename folder'); }
  }, []);

  const handleDeleteFolder = useCallback((folderId) => {
    setConfirmDialog({
      title: 'Delete Folder',
      message: 'Are you sure you want to delete this folder? Notes inside will be moved to the root.',
      confirmText: 'Delete Folder',
      onConfirm: async () => {
        try {
          await deleteFolder(folderId);
          setFolders((prev) => prev.filter((f) => f.id !== folderId));
          setNotes((prev) => prev.map((n) => n.folder_id === folderId ? { ...n, folder_id: null } : n));
          toast.success('Folder deleted');
        } catch { toast.error('Failed to delete folder'); }
        setConfirmDialog(null);
      }
    });
  }, []);

  const handleImageUpload = useCallback(async (file) => uploadNoteImage(file, activeNote?.id), [activeNote]);
  const handleEditorChange = useCallback((val) => { setEditorContent(val); setIsDirty(true); }, []);
  const handleTitleChange = useCallback((val) => { setEditorTitle(val); setIsDirty(true); }, []);
  const handleTagsChange = useCallback((val) => { setEditorTags(val); setIsDirty(true); }, []);

  const filteredNotes = useMemo(() => {
    if (selectedFolderId === null) return notes;
    return notes.filter((n) => n.folder_id === selectedFolderId);
  }, [notes, selectedFolderId]);

  return (
    <div className="notes-view">
      <div className={`notes-shell${navCollapsed ? ' notes-shell-collapsed' : ''}`}>
        {/* ── Editor area ── */}
        <div className="notes-main">
        <button
          type="button"
          className={`notes-mobile-sidebar-btn mobile-only ${!topbarVisible ? 'topbar-hidden' : ''}`}
          onClick={toggleNavCollapse}
          aria-label="Toggle notes sidebar"
          title="Toggle sidebar"
        >
          <PanelRightOpen size={18} />
        </button>
        {/* Topbar */}
        <div className={`notes-editor-topbar ${!topbarVisible ? 'topbar-hidden' : ''}`}>
          {activeNote ? (
            <>
              <div className="notes-breadcrumb">
                <span className="breadcrumb-path">
                  {activeNote.folder_id ? folders.find(f => f.id === activeNote.folder_id)?.name : 'All Notes'} / 
                </span>
                <input
                  className="breadcrumb-title-input"
                  value={editorTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled Note"
                  spellCheck="false"
                  readOnly={!isAdmin}
                />
                {saving && <span className="notes-saving-indicator">Saving...</span>}
                {isDirty && !saving && <span className="notes-dirty-indicator">●</span>}
              </div>

              <div className="notes-view-toggle">
                <div className="notes-topbar-tags">
                  <span className="notes-tags-icon">🏷️</span>
                  <input
                    className="notes-tags-input-small"
                    value={editorTags}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="Add tags..."
                    readOnly={!isAdmin}
                  />
                </div>
                <div className="notes-view-divider" />
                {isAdmin && (
                  <>
                    <button className={`notes-view-btn ${viewMode === 'edit' ? 'active' : ''}`} onClick={() => setViewMode('edit')}>
                      <Edit3 size={16} /> Edit
                    </button>
                    <button className={`notes-view-btn ${viewMode === 'split' ? 'active' : ''}`} onClick={() => setViewMode('split')}>
                      <Columns size={16} /> Split
                    </button>
                  </>
                )}
                <button className={`notes-view-btn ${viewMode === 'preview' ? 'active' : ''}`} onClick={() => setViewMode('preview')}>
                  <Eye size={16} /> Preview
                </button>
                <div className="notes-view-divider" />
                <button
                  className={`notes-view-btn ${viewMode === 'graph' ? 'active' : ''}`}
                  onClick={() => setViewMode((v) => v === 'graph' ? 'split' : 'graph')}
                  title="Toggle graph view"
                >
                  <GitBranch size={16} /> Graph
                </button>
              </div>
            </>
          ) : (
            <div className="notes-empty-state">
              <div className="notes-empty-icon">📝</div>
              <h2>Your Notes</h2>
              <p>Select a note to edit, or create a new one.</p>
              <div className="notes-empty-actions">
                {isAdmin && (
                  <button className="btn btn-primary" onClick={() => handleCreateNote(null)}>
                    <Plus size={16} /> Create note
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => setShowGraph((v) => !v)}>
                  <GitBranch size={16} /> View Graph
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Editor / Preview panes */}
        {activeNote && !noteLoading && viewMode !== 'graph' && (
          <div className={`notes-content-area notes-mode-${viewMode}`}>
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className="notes-editor-pane" onScroll={handleScroll}>
                <NoteEditor
                  value={editorContent}
                  onChange={handleEditorChange}
                  notes={allNotesMeta}
                  onImageUpload={handleImageUpload}
                />
              </div>
            )}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className="notes-preview-pane" onScroll={handleScroll}>
                <MarkdownRenderer content={editorContent} onLinkClick={() => {}} />
              </div>
            )}
          </div>
        )}

        {noteLoading && (
          <div className="notes-loading-overlay">
            <div className="notes-loading-spinner" />
          </div>
        )}

        {/* Full-panel Graph view */}
        {viewMode === 'graph' && (
          <div className="notes-graph-panel">
            <GraphView
              graphData={graphData}
              currentSlug={activeNote?.slug}
              onClose={() => setViewMode('split')}
            />
          </div>
        )}

        {/* Legacy floating graph (when no note selected) */}
        {!activeNote && showGraph && (
          <div className="notes-graph-panel">
            <GraphView
              graphData={graphData}
              currentSlug={null}
              onClose={() => setShowGraph(false)}
            />
          </div>
        )}
        </div>

        {!navCollapsed && (
          <div
            className="notes-sidebar-backdrop mobile-only"
            onClick={toggleNavCollapse}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar (merged into shell) ── */}
        <aside className={`notes-nav-panel ${navCollapsed ? 'notes-nav-collapsed' : ''}`}>
          <div className="notes-nav-header">
            {!navCollapsed ? (
              <div className="notes-nav-header-row">
                <button
                  className="notes-nav-collapse-btn"
                  onClick={toggleNavCollapse}
                  title="Hide sidebar"
                  aria-label="Hide sidebar"
                  id="notes-nav-collapse-btn"
                >
                  <PanelRightClose size={18} />
                </button>
                <div className="notes-nav-header-search">
                  <Search size={16} className="notes-nav-search-icon" />
                  <input
                    ref={sidebarSearchRef}
                    className="notes-nav-search-input"
                    placeholder="Search notes..."
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    id="notes-sidebar-search"
                  />
                  {sidebarSearch && (
                    <button
                      className="notes-nav-search-clear"
                      onClick={() => setSidebarSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                className="notes-nav-collapse-btn notes-nav-collapse-btn--expand"
                onClick={toggleNavCollapse}
                title="Show sidebar"
                aria-label="Show sidebar"
                id="notes-nav-collapse-btn"
              >
                <PanelRightOpen size={18} />
              </button>
            )}
          </div>

          {navCollapsed ? (
            <div className="notes-nav-scroll notes-nav-scroll--collapsed">
              <div className="notes-nav-icon-strip">
                {isAdmin && (
                  <button
                    className="notes-nav-icon-btn"
                    onClick={() => handleCreateNote(null)}
                    title="New note"
                  >
                    <Plus size={17} />
                  </button>
                )}
                <button
                  className={`notes-nav-icon-btn ${selectedFolderId === null ? 'active' : ''}`}
                  onClick={() => setSelectedFolderId(null)}
                  title="All Notes"
                >
                  <FileText size={17} />
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    className={`notes-nav-icon-btn ${selectedFolderId === f.id ? 'active' : ''}`}
                    onClick={() => setSelectedFolderId(f.id)}
                    title={f.name}
                  >
                    <Folder size={17} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="notes-nav-body">
              <div className="notes-nav-actions">
                {isAdmin && (
                  <>
                    <button
                      className="notes-nav-action-btn"
                      onClick={() => handleCreateNote(null)}
                      title="New note"
                      id="notes-new-btn"
                    >
                      <FilePlus2 size={18} />
                    </button>
                    <button
                      className="notes-nav-action-btn"
                      onClick={() => handleCreateFolder(null)}
                      title="New folder"
                    >
                      <FolderPlus size={18} />
                    </button>
                  </>
                )}
                <button
                  className={`notes-nav-action-btn ${showArchivedOnly ? 'active' : ''}`}
                  onClick={() => setShowArchivedOnly((v) => !v)}
                  title={showArchivedOnly ? 'Show all notes' : 'Show archived'}
                >
                  <Archive size={18} />
                </button>
              </div>

              <div className="notes-nav-scroll">
                <FolderTree
                  folders={folders}
                  notes={showArchivedOnly ? notes.filter((n) => n.is_archived) : notes.filter((n) => !n.is_archived)}
                  selectedFolderId={selectedFolderId}
                  selectedSlug={activeNote?.slug}
                  onSelectFolder={setSelectedFolderId}
                  onSelectNote={handleSelectNote}
                  onSelectAll={() => setSelectedFolderId(null)}
                  onCreateFolder={handleCreateFolder}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onCreateNote={handleCreateNote}
                  onRenameNote={handleRenameNote}
                  onDeleteNote={handleDeleteNote}
                  onTogglePin={handleTogglePin}
                  onToggleArchive={handleToggleArchive}
                />
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Custom Confirm Dialog */}
      {confirmDialog && (
        <div className="notes-confirm-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="notes-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="notes-confirm-icon-wrapper">
              <Trash2 size={24} color="var(--danger)" />
            </div>
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="notes-confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={confirmDialog.onConfirm}>
                {confirmDialog.confirmText || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Create Dialog */}
      {createItemDialog && (
        <div className="notes-confirm-overlay" onClick={() => setCreateItemDialog(null)}>
          <div className="notes-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="notes-confirm-icon-wrapper" style={{ background: 'rgba(255, 51, 102, 0.1)' }}>
              {createItemDialog.type === 'note' ? <FilePlus2 size={24} color="var(--accent-1)" /> : <FolderPlus size={24} color="var(--accent-1)" />}
            </div>
            <h3>{createItemDialog.type === 'note' ? 'Create New Note' : 'Create New Folder'}</h3>
            <p style={{ marginBottom: '16px' }}>
              {createItemDialog.type === 'note' 
                ? 'Enter a title for your new note.' 
                : 'Enter a name for your new folder.'}
            </p>
            <input
              autoFocus
              className="notes-create-modal-input"
              placeholder={createItemDialog.type === 'note' ? 'Note title...' : 'Folder name...'}
              value={createItemName}
              onChange={(e) => setCreateItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreateItem();
                if (e.key === 'Escape') setCreateItemDialog(null);
              }}
            />
            <div className="notes-confirm-actions" style={{ marginTop: '20px' }}>
              <button className="btn btn-ghost" onClick={() => setCreateItemDialog(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmCreateItem}>
                Create {createItemDialog.type === 'note' ? 'Note' : 'Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
