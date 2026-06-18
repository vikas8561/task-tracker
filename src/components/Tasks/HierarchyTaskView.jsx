import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  BookOpen,
  Check,
  BookMarked,
  Edit2,
  Trash2,
  Calendar,
  GripVertical,
  ExternalLink,
  Link2,
  X,
  Loader2,
} from 'lucide-react';
import { toggleComplete, toggleRevision, reorderTasks, updateTask } from '../../hooks/useTasks';
import { normalizeSubjectColor } from '../../utils/subjectColor';
import Badge from '../common/Badge';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function formatDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
}

/* ------------------------------------------------------------------ */
/* Resources cell — inline link chips + add-link form                  */
/* ------------------------------------------------------------------ */
function ResourcesCell({ task, onUpdated }) {
  const { isAdmin } = useAuth();
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const urlRef = useRef(null);

  const resources = Array.isArray(task.resources) ? task.resources : [];

  async function saveLink() {
    const trimUrl = url.trim();
    if (!trimUrl) return;
    const full = trimUrl.startsWith('http') ? trimUrl : `https://${trimUrl}`;
    const newRes = [...resources, { label: label.trim() || full, url: full }];
    setSaving(true);
    try {
      const updated = await updateTask(task.id, { resources: newRes });
      onUpdated(updated);
      setUrl(''); setLabel(''); setAdding(false);
    } catch {
      toast.error('Failed to save link');
    } finally {
      setSaving(false);
    }
  }

  async function removeLink(idx) {
    const newRes = resources.filter((_, i) => i !== idx);
    try {
      const updated = await updateTask(task.id, { resources: newRes });
      onUpdated(updated);
    } catch {
      toast.error('Failed to remove link');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveLink(); }
    if (e.key === 'Escape') { setAdding(false); setUrl(''); setLabel(''); }
  }

  return (
    <div className="htv-resources" onClick={(e) => e.stopPropagation()}>
      {resources.map((r, i) => (
        <span key={i} className="htv-res-chip">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="htv-res-link" title={r.url}>
            <ExternalLink size={14} />
            {r.label}
          </a>
          {isAdmin && (
            <button className="htv-res-remove" onClick={() => removeLink(i)} title="Remove link" id={`htv-res-rm-${task.id}-${i}`}>
              <X size={14} />
            </button>
          )}
        </span>
      ))}

      {adding ? (
        <span className="htv-res-form">
          <input
            ref={urlRef}
            className="htv-res-input"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            id={`htv-res-url-${task.id}`}
          />
          <input
            className="htv-res-input htv-res-input-label"
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            id={`htv-res-label-${task.id}`}
          />
          <button className="htv-res-save" onClick={saveLink} disabled={saving || !url.trim()} id={`htv-res-save-${task.id}`}>
            {saving ? '…' : 'Add'}
          </button>
          <button className="htv-res-cancel" onClick={() => { setAdding(false); setUrl(''); setLabel(''); }} id={`htv-res-cancel-${task.id}`}>
            <X size={14} />
          </button>
        </span>
      ) : null}

      {isAdmin && !adding && (
        <button className="htv-res-add-btn" onClick={() => setAdding(true)} title="Add resource link" id={`htv-res-add-${task.id}`}>
          <Link2 size={14} />
          {resources.length === 0 && <span>Resources</span>}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SubtopicRow (individual task row with checkbox)                     */
/* ------------------------------------------------------------------ */
function SubtopicRow({ task, onUpdated, onEdit, onDelete, dragHandleProps, isDragOver }) {
  const { isAdmin } = useAuth();
  const { triggerCelebration } = useApp();
  const [toggling, setToggling] = useState(false);
  const overdue = isOverdue(task.due_date) && !task.is_completed;

  async function handleToggle() {
    setToggling(true);
    try {
      const updated = await toggleComplete(task);
      onUpdated(updated);
      if (updated.is_completed) triggerCelebration();
    } catch {
      toast.error('Failed to update task');
    } finally {
      setToggling(false);
    }
  }

  async function handleRevision() {
    try {
      const updated = await toggleRevision(task);
      onUpdated(updated);
      toast.success(updated.is_revision ? 'Marked for revision' : 'Removed from revision');
    } catch {
      toast.error('Failed to update');
    }
  }

  return (
    <div
      className={[
        'htv-subtopic-row',
        task.is_completed ? 'htv-subtopic-done' : '',
        isDragOver ? 'htv-subtopic-drag-over' : '',
      ].join(' ')}
    >
      {isAdmin && (
        <span className="htv-drag-handle" {...dragHandleProps} title="Drag to reorder">
          <GripVertical size={14} />
        </span>
      )}

      <button
        className={`htv-checkbox ${task.is_completed ? 'htv-checkbox-checked' : ''} ${toggling ? 'htv-checkbox-toggling' : ''}`}
        onClick={handleToggle}
        aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
        id={`htv-check-${task.id}`}
      >
        {task.is_completed && <Check size={11} color="white" strokeWidth={3} />}
      </button>

      <span className="htv-subtopic-title">{task.title}</span>

      <ResourcesCell task={task} onUpdated={onUpdated} />

      <div className="htv-subtopic-badges">
        {task.priority && (
          <Badge type={task.priority}>
            {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
          </Badge>
        )}
        {task.is_revision && <Badge type="revision">📖 Revision</Badge>}
        {task.due_date && (
          <span className={`htv-subtopic-due ${overdue ? 'htv-subtopic-overdue' : ''}`}>
            <Calendar size={10} />
            {overdue ? '⚠ ' : ''}{formatDate(task.due_date)}
          </span>
        )}
      </div>

      <div className="htv-subtopic-actions">
        <button
          className={`btn btn-ghost btn-icon htv-action-btn ${task.is_revision ? 'htv-action-revision' : ''}`}
          onClick={handleRevision}
          title={task.is_revision ? 'Remove revision' : 'Mark for revision'}
          id={`htv-rev-${task.id}`}
        >
          <BookMarked size={16} />
        </button>
        {isAdmin && (
          <>
            <button className="btn btn-ghost btn-icon htv-action-btn" onClick={() => onEdit(task)} title="Edit" id={`htv-edit-${task.id}`}>
              <Edit2 size={16} />
            </button>
            <button className="btn btn-ghost btn-icon htv-action-btn htv-action-delete" onClick={() => onDelete(task)} title="Delete" id={`htv-del-${task.id}`}>
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TopicSection                                                         */
/* Receives tasks[] as a direct prop (not nested inside topic object). */
/* Shows metadata count when tasks haven't been loaded yet.            */
/* ------------------------------------------------------------------ */
function TopicSection({ topic, tasks, topicTaskCount, onUpdated, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState(tasks);
  const dragSrc = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Sync incoming tasks prop without clobbering local drag-and-drop order.
  // • Same task IDs → patch data in-place (preserves reorder order)
  // • Different IDs  → full reset (task added or removed)
  useEffect(() => {
    const incomingIds = tasks.map(t => t.id).join(',');
    setLocalTasks(prev => {
      const prevIds = prev.map(t => t.id).join(',');
      if (prevIds !== incomingIds) return tasks;
      const lookup = Object.fromEntries(tasks.map(t => [t.id, t]));
      return prev.map(t => lookup[t.id] ?? t);
    });
  }, [tasks]);

  const done = localTasks.filter(t => t.is_completed).length;
  const total = localTasks.length;
  // Fall back to metadata count before chapter is loaded (total = 0)
  const displayTotal = total > 0 ? total : (topicTaskCount || 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  /* ── Drag & drop handlers ── */
  function handleDragStart(task) { dragSrc.current = task.id; }
  function handleDragOver(e, task) {
    e.preventDefault();
    if (dragSrc.current && dragSrc.current !== task.id) setDragOverId(task.id);
  }
  function handleDrop(e, targetTask) {
    e.preventDefault();
    if (!dragSrc.current || dragSrc.current === targetTask.id) return;
    setLocalTasks(prev => {
      const srcIdx = prev.findIndex(t => t.id === dragSrc.current);
      const tgtIdx = prev.findIndex(t => t.id === targetTask.id);
      const reordered = [...prev];
      const [moved] = reordered.splice(srcIdx, 1);
      reordered.splice(tgtIdx, 0, moved);
      reorderTasks(reordered).catch(() => {});
      return reordered;
    });
    dragSrc.current = null;
    setDragOverId(null);
  }
  function handleDragEnd() { dragSrc.current = null; setDragOverId(null); }

  return (
    <div className="htv-topic">
      <button className="htv-topic-header" onClick={() => setOpen(o => !o)} id={`htv-topic-${topic.id}`}>
        <span className="htv-topic-chevron">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <BookOpen size={14} className="htv-topic-icon" />
        <span className="htv-topic-name">{topic.name}</span>
        <span className="htv-topic-count">
          {total > 0 ? `${done}/${total}` : displayTotal}
        </span>
        <div className="htv-topic-bar-wrap">
          <div className="htv-topic-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="htv-topic-pct">{pct}%</span>
      </button>

      {open && (
        <div className="htv-task-list">
          {localTasks.length > 0 ? (
            localTasks.map(task => (
              <SubtopicRow
                key={task.id}
                task={task}
                onUpdated={onUpdated}
                onEdit={onEdit}
                onDelete={onDelete}
                isDragOver={dragOverId === task.id}
                dragHandleProps={{
                  draggable: true,
                  onDragStart: () => handleDragStart(task),
                  onDragOver: (e) => handleDragOver(e, task),
                  onDrop: (e) => handleDrop(e, task),
                  onDragEnd: handleDragEnd,
                }}
              />
            ))
          ) : (
            <p className="htv-topic-empty">No tasks in this topic yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ChapterFolder                                                        */
/* Triggers lazy load on first expand. Shows spinner while loading.    */
/* ------------------------------------------------------------------ */
function ChapterFolder({
  chapter, color, topics,
  topicTaskCount, chapterTaskCount,
  loadedChapters, onLoadChapter,
  onUpdated, onEdit, onDelete,
}) {
  const [open, setOpen] = useState(false);

  const chapterEntry = loadedChapters[chapter.id]; // undefined | 'loading' | Task[]
  const isLoaded  = Array.isArray(chapterEntry);
  const isLoading = chapterEntry === 'loading';

  // Stats: use metadata count until tasks are actually loaded
  const totalFromMeta = chapterTaskCount || 0;
  const total = isLoaded ? chapterEntry.length : totalFromMeta;
  const done  = isLoaded ? chapterEntry.filter(t => t.is_completed).length : 0;
  const pct   = isLoaded && total > 0 ? Math.round((done / total) * 100) : 0;

  async function handleToggle() {
    const next = !open;
    // Fire lazy load on first open (non-blocking — spinner shown inline)
    if (next && !isLoaded && !isLoading) {
      onLoadChapter(chapter.id);
    }
    setOpen(next);
  }

  // Build a topic → tasks[] map from the loaded chapter data
  const tasksByTopic = useMemo(() => {
    if (!isLoaded) return {};
    const map = {};
    chapterEntry.forEach(task => {
      if (!map[task.topic_id]) map[task.topic_id] = [];
      map[task.topic_id].push(task);
    });
    return map;
  }, [chapterEntry, isLoaded]);

  return (
    <div className="htv-chapter">
      <button
        className={`htv-chapter-header ${open ? 'htv-chapter-open' : ''}`}
        onClick={handleToggle}
        id={`htv-chapter-${chapter.id}`}
      >
        <span className="htv-folder-icon">
          {isLoading
            ? <Loader2 size={16} className="htv-loading-spin" />
            : open
              ? <FolderOpen size={16} />
              : <Folder size={16} />
          }
        </span>
        <span className="htv-chapter-name">{chapter.name}</span>
        <span className="htv-chapter-meta">
          {isLoaded
            ? `${done}/${total} · ${pct}% done`
            : `${total} task${total !== 1 ? 's' : ''}`
          }
        </span>
        <span className="htv-chapter-chevron">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      {open && (
        <div className="htv-chapter-body">
          {/* Inline loading indicator */}
          {isLoading && (
            <div className="htv-chapter-loading-row">
              <Loader2 size={16} className="htv-loading-spin" />
              <span>Loading tasks…</span>
            </div>
          )}

          {/* Loaded: render topic sections */}
          {isLoaded && topics.map(topic => (
            <TopicSection
              key={topic.id}
              topic={topic}
              tasks={tasksByTopic[topic.id] || []}
              topicTaskCount={topicTaskCount[topic.id] || 0}
              onUpdated={onUpdated}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}

          {isLoaded && topics.length === 0 && (
            <p className="htv-chapter-empty">No topics in this chapter yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SubjectFolder                                                        */
/* ------------------------------------------------------------------ */
function SubjectFolder({
  subject, chapters,
  topicsByChapter, topicTaskCount, chapterTaskCount,
  loadedChapters, onLoadChapter,
  onUpdated, onEdit, onDelete,
}) {
  const [open, setOpen] = useState(false);

  // Mix loaded task counts with metadata counts for unloaded chapters
  const { totalTasks, doneTasks } = useMemo(() => {
    let total = 0, done = 0;
    chapters.forEach(c => {
      const loaded = loadedChapters[c.id];
      if (Array.isArray(loaded)) {
        total += loaded.length;
        done  += loaded.filter(t => t.is_completed).length;
      } else {
        // Chapter not loaded yet — use metadata count, done = unknown = 0
        total += (chapterTaskCount[c.id] || 0);
      }
    });
    return { totalTasks: total, doneTasks: done };
  }, [chapters, loadedChapters, chapterTaskCount]);

  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="htv-subject" style={{ '--subject-color': subject.color }}>
      <div className="htv-subject-accent" style={{ background: subject.color }} />

      <button
        className={`htv-subject-header ${open ? 'htv-subject-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        id={`htv-subject-${subject.id}`}
      >
        <span className="htv-subject-folder-icon" style={{ color: subject.color }}>
          {open ? <FolderOpen size={20} /> : <Folder size={20} />}
        </span>

        <div className="htv-subject-info">
          <span className="htv-subject-name">{subject.name}</span>
          <span className="htv-subject-sub">
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} ·{' '}
            {doneTasks}/{totalTasks} tasks done
          </span>
        </div>

        <div className="htv-subject-progress">
          <div className="htv-subject-bar-wrap">
            <div
              className="htv-subject-bar-fill"
              style={{ width: `${pct}%`, background: subject.color }}
            />
          </div>
          <span className="htv-subject-pct" style={{ color: subject.color }}>{pct}%</span>
        </div>

        <span className="htv-subject-chevron">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {open && (
        <div className="htv-subject-body">
          {chapters.length > 0 ? (
            chapters.map(chapter => (
              <ChapterFolder
                key={chapter.id}
                chapter={chapter}
                color={subject.color}
                topics={topicsByChapter[chapter.id] || []}
                topicTaskCount={topicTaskCount}
                chapterTaskCount={chapterTaskCount[chapter.id] || 0}
                loadedChapters={loadedChapters}
                onLoadChapter={onLoadChapter}
                onUpdated={onUpdated}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <p className="htv-chapter-empty">No chapters in this subject yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root component                                                       */
/* ------------------------------------------------------------------ */
export default function HierarchyTaskView({
  subjects,
  chapters,
  topics,
  chapterTaskCount,
  topicTaskCount,
  loadedChapters,
  onLoadChapter,
  onUpdated,
  onEdit,
  onDelete,
}) {
  // Build lookup maps from flat arrays (computed once, memoised)
  const chaptersBySubject = useMemo(() => {
    const map = {};
    chapters.forEach(c => {
      if (!map[c.subject_id]) map[c.subject_id] = [];
      map[c.subject_id].push(c);
    });
    return map;
  }, [chapters]);

  const topicsByChapter = useMemo(() => {
    const map = {};
    topics.forEach(t => {
      if (!map[t.chapter_id]) map[t.chapter_id] = [];
      map[t.chapter_id].push(t);
    });
    return map;
  }, [topics]);

  if (!subjects.length) {
    return (
      <div className="htv-empty">
        <Folder size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No subjects to display.
        </p>
      </div>
    );
  }

  return (
    <div className="htv-root">
      {subjects.map(subject => (
        <SubjectFolder
          key={subject.id}
          subject={subject}
          chapters={chaptersBySubject[subject.id] || []}
          topicsByChapter={topicsByChapter}
          topicTaskCount={topicTaskCount}
          chapterTaskCount={chapterTaskCount}
          loadedChapters={loadedChapters}
          onLoadChapter={onLoadChapter}
          onUpdated={onUpdated}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
