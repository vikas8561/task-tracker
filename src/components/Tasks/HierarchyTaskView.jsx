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
  Plus,
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

/** Group flat tasks array into Subject → Chapter → Topic → tasks */
function groupTasks(tasks) {
  const subjectMap = {};

  tasks.forEach((task) => {
    const sId = task.subject_id || '__none__';
    const sName = task.subjects?.name || 'Uncategorized';
    const sColor = normalizeSubjectColor(
      task.subjects?.color || 'var(--accent-1)',
      sId
    );

    const cId = task.chapter_id || '__none__';
    const cName = task.chapters?.name || 'General';

    const tId = task.topic_id || '__none__';
    const tName = task.topics?.name || 'General';

    if (!subjectMap[sId]) {
      subjectMap[sId] = { id: sId, name: sName, color: sColor, chapters: {} };
    }
    const subject = subjectMap[sId];

    if (!subject.chapters[cId]) {
      subject.chapters[cId] = { id: cId, name: cName, topics: {} };
    }
    const chapter = subject.chapters[cId];

    if (!chapter.topics[tId]) {
      chapter.topics[tId] = { id: tId, name: tName, tasks: [] };
    }
    chapter.topics[tId].tasks.push(task);
  });

  return Object.values(subjectMap).map((s) => ({
    ...s,
    chapters: Object.values(s.chapters).map((c) => ({
      ...c,
      topics: Object.values(c.topics),
    })),
  }));
}

function countStats(chapters) {
  let total = 0, done = 0;
  chapters.forEach((c) =>
    c.topics.forEach((t) =>
      t.tasks.forEach((task) => { total++; if (task.is_completed) done++; })
    )
  );
  return { total, done };
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
      {/* Existing link chips */}
      {resources.map((r, i) => (
        <span key={i} className="htv-res-chip">
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="htv-res-link"
            title={r.url}
          >
            <ExternalLink size={14} />
            {r.label}
          </a>
          {isAdmin && (
            <button
              className="htv-res-remove"
              onClick={() => removeLink(i)}
              title="Remove link"
              id={`htv-res-rm-${task.id}-${i}`}
            >
              <X size={14} />
            </button>
          )}
        </span>
      ))}

      {/* Add link */}
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
          <button
            className="htv-res-save"
            onClick={saveLink}
            disabled={saving || !url.trim()}
            id={`htv-res-save-${task.id}`}
          >
            {saving ? '…' : 'Add'}
          </button>
          <button
            className="htv-res-cancel"
            onClick={() => { setAdding(false); setUrl(''); setLabel(''); }}
            id={`htv-res-cancel-${task.id}`}
          >
            <X size={14} />
          </button>
        </span>
      ) : null}

      {isAdmin && !adding && (
        <button
          className="htv-res-add-btn"
          onClick={() => setAdding(true)}
          title="Add resource link"
          id={`htv-res-add-${task.id}`}
        >
          <Link2 size={14} />
          {resources.length === 0 && <span>Resources</span>}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SubTopic row (individual task with checkbox)                        */
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
      if (updated.is_completed) {
        triggerCelebration();
      }
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
      {/* Drag handle */}
      {isAdmin && (
        <span className="htv-drag-handle" {...dragHandleProps} title="Drag to reorder">
          <GripVertical size={14} />
        </span>
      )}

      {/* Checkbox */}
      <button
        className={`htv-checkbox ${task.is_completed ? 'htv-checkbox-checked' : ''} ${toggling ? 'htv-checkbox-toggling' : ''}`}
        onClick={handleToggle}
        aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
        id={`htv-check-${task.id}`}
      >
        {task.is_completed && <Check size={11} color="white" strokeWidth={3} />}
      </button>

      {/* Title — no strikethrough, row bg is green when done */}
      <span className="htv-subtopic-title">
        {task.title}
      </span>

      {/* Resources */}
      <ResourcesCell task={task} onUpdated={onUpdated} />

      {/* Badges */}
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

      {/* Actions */}
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
            <button
              className="btn btn-ghost btn-icon htv-action-btn"
              onClick={() => onEdit(task)}
              title="Edit"
              id={`htv-edit-${task.id}`}
            >
              <Edit2 size={16} />
            </button>
            <button
              className="btn btn-ghost btn-icon htv-action-btn htv-action-delete"
              onClick={() => onDelete(task)}
              title="Delete"
              id={`htv-del-${task.id}`}
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Topic section (collapsible, contains subtopic rows)                 */
/* ------------------------------------------------------------------ */
function TopicSection({ topic, onUpdated, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState(topic.tasks);
  const dragSrc = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Sync parent data → local state without clobbering visual order.
  // • If task IDs changed (add/delete) → full reset to keep IDs consistent.
  // • If only task DATA changed (e.g. is_completed toggled) → patch in-place
  //   so the current display order is preserved.
  useEffect(() => {
    const incomingIds = topic.tasks.map((t) => t.id).join(',');
    setTasks((prev) => {
      const prevIds = prev.map((t) => t.id).join(',');
      if (prevIds !== incomingIds) {
        // Different set of tasks — full reset
        return topic.tasks;
      }
      // Same tasks, just data updated — patch each task in-place
      const lookup = Object.fromEntries(topic.tasks.map((t) => [t.id, t]));
      return prev.map((t) => lookup[t.id] ?? t);
    });
  }, [topic.tasks]);

  const done = tasks.filter((t) => t.is_completed).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  /* ── Drag handlers ── */
  function handleDragStart(task) {
    dragSrc.current = task.id;
  }

  function handleDragOver(e, task) {
    e.preventDefault();
    if (dragSrc.current && dragSrc.current !== task.id) {
      setDragOverId(task.id);
    }
  }

  function handleDrop(e, targetTask) {
    e.preventDefault();
    if (!dragSrc.current || dragSrc.current === targetTask.id) return;

    setTasks((prev) => {
      const srcIdx = prev.findIndex((t) => t.id === dragSrc.current);
      const tgtIdx = prev.findIndex((t) => t.id === targetTask.id);
      const reordered = [...prev];
      const [moved] = reordered.splice(srcIdx, 1);
      reordered.splice(tgtIdx, 0, moved);
      // Persist async — no await needed; optimistic UI
      reorderTasks(reordered).catch(() => { });
      return reordered;
    });

    dragSrc.current = null;
    setDragOverId(null);
  }

  function handleDragEnd() {
    dragSrc.current = null;
    setDragOverId(null);
  }

  return (
    <div className="htv-topic">
      {/* Topic header – click to collapse */}
      <button className="htv-topic-header" onClick={() => setOpen((o) => !o)} id={`htv-topic-${topic.id}`}>
        <span className="htv-topic-chevron">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <BookOpen size={14} className="htv-topic-icon" />
        <span className="htv-topic-name">{topic.name}</span>

        <span className="htv-topic-count">
          {done}/{total}
        </span>

        {/* Mini progress bar */}
        <div className="htv-topic-bar-wrap">
          <div className="htv-topic-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        <span className="htv-topic-pct">{pct}%</span>
      </button>

      {/* Task list */}
      {open && (
        <div className="htv-task-list">
          {tasks.map((task) => (
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
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter folder                                                       */
/* ------------------------------------------------------------------ */
function ChapterFolder({ chapter, color, onUpdated, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  const done = chapter.topics.reduce(
    (acc, t) => acc + t.tasks.filter((tk) => tk.is_completed).length,
    0
  );
  const total = chapter.topics.reduce((acc, t) => acc + t.tasks.length, 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="htv-chapter">
      <button
        className={`htv-chapter-header ${open ? 'htv-chapter-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        id={`htv-chapter-${chapter.id}`}
      >
        <span className="htv-folder-icon">
          {open ? <FolderOpen size={16} /> : <Folder size={16} />}
        </span>
        <span className="htv-chapter-name">{chapter.name}</span>
        <span className="htv-chapter-meta">
          {total} task{total !== 1 ? 's' : ''} · {pct}% done
        </span>
        <span className="htv-chapter-chevron">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      {open && (
        <div className="htv-chapter-body">
          {chapter.topics.map((topic) => (
            <TopicSection
              key={topic.id}
              topic={topic}
              onUpdated={onUpdated}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subject folder                                                       */
/* ------------------------------------------------------------------ */
function SubjectFolder({ subject, onUpdated, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const { total, done } = countStats(subject.chapters);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="htv-subject" style={{ '--subject-color': subject.color }}>
      {/* Color accent bar */}
      <div className="htv-subject-accent" style={{ background: subject.color }} />

      <button
        className={`htv-subject-header ${open ? 'htv-subject-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        id={`htv-subject-${subject.id}`}
      >
        <span className="htv-subject-folder-icon" style={{ color: subject.color }}>
          {open ? <FolderOpen size={20} /> : <Folder size={20} />}
        </span>

        <div className="htv-subject-info">
          <span className="htv-subject-name">{subject.name}</span>
          <span className="htv-subject-sub">
            {subject.chapters.length} chapter{subject.chapters.length !== 1 ? 's' : ''} ·{' '}
            {done}/{total} tasks done
          </span>
        </div>

        {/* Progress pill */}
        <div className="htv-subject-progress">
          <div className="htv-subject-bar-wrap">
            <div
              className="htv-subject-bar-fill"
              style={{ width: `${pct}%`, background: subject.color }}
            />
          </div>
          <span className="htv-subject-pct" style={{ color: subject.color }}>
            {pct}%
          </span>
        </div>

        <span className="htv-subject-chevron">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {open && (
        <div className="htv-subject-body">
          {subject.chapters.map((chapter) => (
            <ChapterFolder
              key={chapter.id}
              chapter={chapter}
              color={subject.color}
              onUpdated={onUpdated}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root component                                                       */
/* ------------------------------------------------------------------ */
export default function HierarchyTaskView({ tasks, onUpdated, onEdit, onDelete }) {
  const hierarchy = useMemo(() => groupTasks(tasks), [tasks]);

  if (hierarchy.length === 0) {
    return (
      <div className="htv-empty">
        <Folder size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No tasks to display in hierarchy view.
        </p>
      </div>
    );
  }

  return (
    <div className="htv-root">
      {hierarchy.map((subject) => (
        <SubjectFolder
          key={subject.id}
          subject={subject}
          onUpdated={onUpdated}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
