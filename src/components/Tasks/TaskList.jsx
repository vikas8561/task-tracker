import { useState, useEffect, useCallback } from 'react';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import HierarchyTaskView from './HierarchyTaskView';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import { fetchChapterTasks, deleteTask } from '../../hooks/useTasks';
import { fetchHierarchyMeta } from '../../hooks/useHierarchy';
import { CheckSquare, List, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../common/LoadingScreen';

export default function TaskList({ searchQuery, onAddTask, showFormProp, onFormClose, editTaskProp, refreshKey }) {
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
  const [viewMode, setViewMode] = useState('hierarchy');

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

  // ── List view: flatten all already-loaded tasks ───────────────────────────
  const allLoadedTasks = Object.values(loadedChapters)
    .filter(v => Array.isArray(v))
    .flat();

  const filteredForList = allLoadedTasks.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.subjects?.name?.toLowerCase().includes(q) ||
      t.chapters?.name?.toLowerCase().includes(q)
    );
  });

  const hasSubjects = (hierarchy?.subjects?.length ?? 0) > 0;

  return (
    <div className="task-page">
      {/* Toolbar */}
      <div className="task-page-toolbar">
        <div className="htv-view-toggle task-page-view-toggle">
          <button
            className={`htv-toggle-btn ${viewMode === 'list' ? 'htv-toggle-active' : ''}`}
            onClick={() => setViewMode('list')}
            id="view-mode-list"
            title="List view"
          >
            <List size={14} /> List
          </button>
          <button
            className={`htv-toggle-btn ${viewMode === 'hierarchy' ? 'htv-toggle-active' : ''}`}
            onClick={() => setViewMode('hierarchy')}
            id="view-mode-hierarchy"
            title="Hierarchy view"
          >
            <FolderTree size={14} /> Hierarchy
          </button>
        </div>
      </div>

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
      {!loading && hasSubjects && viewMode === 'hierarchy' && (
        <HierarchyTaskView
          subjects={hierarchy.subjects}
          chapters={hierarchy.chapters}
          topics={hierarchy.topics}
          chapterTaskCount={hierarchy.chapterTaskCount}
          topicTaskCount={hierarchy.topicTaskCount}
          loadedChapters={loadedChapters}
          onLoadChapter={handleLoadChapter}
          onUpdated={handleTaskUpdated}
          onEdit={(t) => { setEditTask(t); setShowForm(true); }}
          onDelete={setDeleteTarget}
          searchQuery={searchQuery}
        />
      )}

      {/* List view — only loaded tasks */}
      {!loading && hasSubjects && viewMode === 'list' && (
        filteredForList.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={searchQuery ? 'No matching tasks loaded' : 'No tasks loaded yet'}
            description={
              searchQuery
                ? 'No loaded tasks match your search. Expand chapters in Hierarchy view to load more.'
                : 'Switch to Hierarchy view and expand chapters to load tasks.'
            }
          />
        ) : (
          <div className="tasks-list">
            {filteredForList.map((task, i) => (
              <div key={task.id} style={{ animationDelay: `${i * 30}ms` }}>
                <TaskCard
                  task={task}
                  onUpdated={handleTaskUpdated}
                  onEdit={(t) => { setEditTask(t); setShowForm(true); }}
                  onDelete={setDeleteTarget}
                />
              </div>
            ))}
          </div>
        )
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
    </div>
  );
}
