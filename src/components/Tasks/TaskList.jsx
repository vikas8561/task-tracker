import { useState, useEffect, useCallback } from 'react';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import MarkdownImport from './MarkdownImport';
import HierarchyTaskView from './HierarchyTaskView';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import { fetchTasks, deleteTask } from '../../hooks/useTasks';
import { CheckSquare, Upload, List, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../common/LoadingScreen';

export default function TaskList({ searchQuery, onAddTask, showFormProp, onFormClose, editTaskProp, refreshKey }) {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState('hierarchy');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const t = await fetchTasks();
      setTasks(t);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks, refreshKey]);
  useEffect(() => { if (showFormProp) setShowForm(true); }, [showFormProp]);

  // Only apply search filter
  const filtered = tasks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.subjects?.name?.toLowerCase().includes(q) ||
      t.chapters?.name?.toLowerCase().includes(q)
    );
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function handleTaskUpdated(updated) {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
  }

  function handleTaskSaved(task, isEdit) {
    if (isEdit) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
    } else {
      loadTasks(); // reload to get fresh hierarchy data
    }
  }

  return (
    <div className="task-page">
      {/* Toolbar */}
      <div className="task-page-toolbar">
        {/* View toggle */}
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

      {/* Content */}
      <LoadingScreen isLoading={loading} interval={1500} fullScreen={false} />
      
      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={searchQuery ? 'No tasks match your search.' : 'Create your first task to get started!'}
          action={
            isAdmin ? (
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                + Add Task
              </button>
            ) : null
          }
        />
      ) : !loading && viewMode === 'hierarchy' ? (
        <HierarchyTaskView
          tasks={filtered}
          onUpdated={handleTaskUpdated}
          onEdit={(t) => { setEditTask(t); setShowForm(true); }}
          onDelete={setDeleteTarget}
        />
      ) : !loading ? (
        <div className="tasks-list">
          {filtered.map((task, i) => (
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
      ) : null}

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
