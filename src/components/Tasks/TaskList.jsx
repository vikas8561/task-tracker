import { useState, useEffect, useCallback, useRef } from 'react';
import TaskForm from './TaskForm';
import HierarchyTaskView from './HierarchyTaskView';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import { fetchChapterTasks, deleteTask } from '../../hooks/useTasks';
import { fetchHierarchyMeta } from '../../hooks/useHierarchy';
import { CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../common/LoadingScreen';
import { supabase } from '../../lib/supabase';

export default function TaskList({ onAddTask, showFormProp, onFormClose, editTaskProp, refreshKey }) {
  const { isAdmin } = useAuth();

  // ── Hierarchy skeleton (subjects + chapters + topics + counts, NO task data)
  const [hierarchy, setHierarchy] = useState(null);

  // ── Lazy-loaded chapter tasks: { [chapterId]: Task[] | 'loading' }
  // Absent key = chapter has never been opened.
  const [loadedChapters, setLoadedChapters] = useState({});

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState(null); // { type: 'subject'|'chapter', item }
  const [folderDeleting, setFolderDeleting] = useState(false);

  // ── Load hierarchy skeleton on mount / refresh ────────────────────────────
  const loadHierarchy = useCallback(async () => {
    setLoading(true);
    try {
      const meta = await fetchHierarchyMeta();
      setHierarchy(meta);
      setLoadedChapters({}); // clear all cached chapter data on any refresh
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHierarchy(); }, [loadHierarchy, refreshKey]);
  useEffect(() => { if (showFormProp) setShowForm(true); }, [showFormProp]);

  // ── Chapter lazy loader (called when chapter is first expanded) ───────────
  async function handleLoadChapter(chapterId) {
    // Already loaded or currently loading — do nothing
    if (loadedChapters[chapterId] !== undefined) return;

    setLoadedChapters(prev => ({ ...prev, [chapterId]: 'loading' }));
    try {
      const tasks = await fetchChapterTasks(chapterId);
      setLoadedChapters(prev => ({ ...prev, [chapterId]: tasks }));
    } catch {
      toast.error('Failed to load tasks for this chapter');
      // Remove the loading marker so the user can retry by clicking again
      setLoadedChapters(prev => {
        const next = { ...prev };
        delete next[chapterId];
        return next;
      });
    }
  }

  // ── Task state handlers ───────────────────────────────────────────────────
  function handleTaskUpdated(updated) {
    const chapterId = updated.chapter_id;
    if (!chapterId) return;
    setLoadedChapters(prev => ({
      ...prev,
      [chapterId]: Array.isArray(prev[chapterId])
        ? prev[chapterId].map(t => t.id === updated.id ? updated : t)
        : prev[chapterId],
    }));
  }

  function handleTaskSaved(task, isEdit) {
    if (isEdit) {
      // Patch in-place for edits
      handleTaskUpdated(task);
    } else {
      // For new tasks: evict the affected chapter so it re-fetches on next open
      const chapterId = task?.chapter_id;
      if (chapterId) {
        setLoadedChapters(prev => {
          const next = { ...prev };
          delete next[chapterId];
          return next;
        });
      }
    }
    // Always refresh hierarchy counts after any save (totals may have changed)
    fetchHierarchyMeta().then(setHierarchy).catch(() => {});
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTask(deleteTarget.id);
      const chapterId = deleteTarget.chapter_id;
      // Remove from loaded chapter cache
      setLoadedChapters(prev => ({
        ...prev,
        [chapterId]: Array.isArray(prev[chapterId])
          ? prev[chapterId].filter(t => t.id !== deleteTarget.id)
          : prev[chapterId],
      }));
      // Refresh hierarchy counts
      fetchHierarchyMeta().then(setHierarchy).catch(() => {});
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  // ── Reorder Subject / Chapter ────────────────────────────────────────────
  const reorderTimer = useRef(null);

  function handleReorderSubjects(ordered) {
    // Optimistic: hierarchy state is already updated inside HierarchyTaskView
    clearTimeout(reorderTimer.current);
    reorderTimer.current = setTimeout(async () => {
      try {
        await Promise.all(
          ordered.map((s, i) => supabase.from('subjects').update({ sort_order: i }).eq('id', s.id))
        );
      } catch {
        toast.error('Failed to save subject order');
      }
    }, 600);
  }

  function handleReorderChapters(ordered) {
    clearTimeout(reorderTimer.current);
    reorderTimer.current = setTimeout(async () => {
      try {
        await Promise.all(
          ordered.map((c, i) => supabase.from('chapters').update({ sort_order: i }).eq('id', c.id))
        );
      } catch {
        toast.error('Failed to save chapter order');
      }
    }, 600);
  }

  // ── Delete Subject / Chapter ──────────────────────────────────────────────
  function handleDeleteSubject(subject) {
    setFolderDeleteTarget({ type: 'subject', item: subject });
  }

  function handleDeleteChapter(chapter) {
    setFolderDeleteTarget({ type: 'chapter', item: chapter });
  }

  async function confirmFolderDelete() {
    if (!folderDeleteTarget) return;
    const { type, item } = folderDeleteTarget;
    setFolderDeleting(true);
    try {
      if (type === 'subject') {
        const { error } = await supabase.from('subjects').delete().eq('id', item.id);
        if (error) throw error;
        setHierarchy(prev => ({
          ...prev,
          subjects: prev.subjects.filter(s => s.id !== item.id),
          chapters: prev.chapters.filter(c => c.subject_id !== item.id),
        }));
        toast.success(`Subject "${item.name}" deleted`);
      } else {
        const { error } = await supabase.from('chapters').delete().eq('id', item.id);
        if (error) throw error;
        setHierarchy(prev => ({
          ...prev,
          chapters: prev.chapters.filter(c => c.id !== item.id),
        }));
        toast.success(`Chapter "${item.name}" deleted`);
      }
      fetchHierarchyMeta().then(setHierarchy).catch(() => {});
    } catch {
      toast.error(`Failed to delete ${type}`);
    } finally {
      setFolderDeleting(false);
      setFolderDeleteTarget(null);
    }
  }

  // ── Hide/Unhide handlers ──────────────────────────────────────────────────
  async function handleHideSubject(subject) {
    try {
      const newValue = !subject.is_hidden;
      const { error } = await supabase
        .from('subjects')
        .update({ is_hidden: newValue })
        .eq('id', subject.id);
      if (error) throw error;

      setHierarchy(prev => ({
        ...prev,
        subjects: prev.subjects.map(s =>
          s.id === subject.id ? { ...s, is_hidden: newValue } : s
        ),
      }));
      toast.success(newValue ? 'Subject hidden from users' : 'Subject is now visible');
    } catch {
      toast.error('Failed to update subject visibility');
    }
  }

  async function handleHideChapter(chapter) {
    try {
      const newValue = !chapter.is_hidden;
      const { error } = await supabase
        .from('chapters')
        .update({ is_hidden: newValue })
        .eq('id', chapter.id);
      if (error) throw error;

      setHierarchy(prev => ({
        ...prev,
        chapters: prev.chapters.map(c =>
          c.id === chapter.id ? { ...c, is_hidden: newValue } : c
        ),
      }));
      toast.success(newValue ? 'Chapter hidden from users' : 'Chapter is now visible');
    } catch {
      toast.error('Failed to update chapter visibility');
    }
  }

  // Filter hidden subjects/chapters for non-admin users
  const visibleSubjects = hierarchy
    ? (isAdmin ? hierarchy.subjects : hierarchy.subjects.filter(s => !s.is_hidden))
    : [];
  const visibleChapters = hierarchy
    ? (isAdmin ? hierarchy.chapters : hierarchy.chapters.filter(c => !c.is_hidden))
    : [];

  const hasSubjects = visibleSubjects.length > 0;

  return (
    <div className="task-page">

      <LoadingScreen isLoading={loading} interval={1500} fullScreen={false} />

      {/* Empty state — no subjects at all */}
      {!loading && !hasSubjects && (
        <EmptyState
          icon={CheckSquare}
          title="No subjects found"
          description="Create your first task to get started!"
          action={
            isAdmin ? (
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                + Add Task
              </button>
            ) : null
          }
        />
      )}

      {/* Hierarchy view */}
      {!loading && hasSubjects && (
        <HierarchyTaskView
          subjects={visibleSubjects}
          chapters={visibleChapters}
          topics={hierarchy.topics}
          chapterTaskCount={hierarchy.chapterTaskCount}
          topicTaskCount={hierarchy.topicTaskCount}
          loadedChapters={loadedChapters}
          onLoadChapter={handleLoadChapter}
          onUpdated={handleTaskUpdated}
          onEdit={(t) => { setEditTask(t); setShowForm(true); }}
          onDelete={setDeleteTarget}
          onHideSubject={isAdmin ? handleHideSubject : undefined}
          onHideChapter={isAdmin ? handleHideChapter : undefined}
          onDeleteSubject={isAdmin ? handleDeleteSubject : undefined}
          onDeleteChapter={isAdmin ? handleDeleteChapter : undefined}
          onReorderSubjects={isAdmin ? handleReorderSubjects : undefined}
          onReorderChapters={isAdmin ? handleReorderChapters : undefined}
        />
      )}

      {/* Modals */}
      <TaskForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditTask(null); onFormClose?.(); }}
        onSaved={handleTaskSaved}
        editTask={editTask}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        loading={deleting}
      />

      <ConfirmDialog
        isOpen={!!folderDeleteTarget}
        onClose={() => setFolderDeleteTarget(null)}
        onConfirm={confirmFolderDelete}
        title={folderDeleteTarget?.type === 'subject' ? 'Delete Subject' : 'Delete Chapter'}
        message={
          folderDeleteTarget?.type === 'subject'
            ? `Delete subject "${folderDeleteTarget?.item?.name}"? This will also delete all its chapters, topics and tasks permanently.`
            : `Delete chapter "${folderDeleteTarget?.item?.name}"? All topics and tasks inside will be permanently deleted.`
        }
        loading={folderDeleting}
      />
    </div>
  );
}
