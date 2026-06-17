import { useState, useEffect, useCallback } from 'react';
import TaskCard from '../Tasks/TaskCard';
import TaskForm from '../Tasks/TaskForm';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import CustomDropdown from '../common/CustomDropdown';
import { fetchTasks, deleteTask } from '../../hooks/useTasks';
import { fetchSubjects } from '../../hooks/useSubjects';
import { BookMarked } from 'lucide-react';
import toast from 'react-hot-toast';

import LoadingScreen from '../common/LoadingScreen';

export default function RevisionView() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([fetchTasks({ is_revision: true }), fetchSubjects()]);
      setTasks(t);
      setSubjects(s);
    } catch {
      toast.error('Failed to load revision tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = tasks.filter((t) => {
    if (subjectFilter !== 'all' && t.subject_id !== subjectFilter) return false;
    if (statusFilter === 'active' && t.is_completed) return false;
    if (statusFilter === 'completed' && !t.is_completed) return false;
    return true;
  });

  function handleTaskUpdated(updated) {
    // If revision was toggled off, remove from view
    if (!updated.is_revision) {
      setTasks((prev) => prev.filter((t) => t.id !== updated.id));
    } else {
      setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function handleTaskSaved(task, isEdit) {
    if (isEdit) {
      if (!task.is_revision) {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
      } else {
        setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
      }
    } else {
      if (task.is_revision) setTasks((prev) => [task, ...prev]);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header progress-page-header slide-down">
        <div className="progress-page-icon" style={{ background: 'var(--warning)', boxShadow: '0 4px 12px var(--warning-soft)' }}>
          <BookMarked size={28} />
        </div>
        <div className="progress-page-text">
          <h2 className="progress-page-title">Revision Tasks</h2>
          <p className="progress-page-desc">Tasks marked for revision. Review and reinforce your knowledge.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar revision-filters">
        <CustomDropdown
          className="revision-filter-select"
          value={subjectFilter}
          onChange={(val) => setSubjectFilter(val)}
          options={[
            { value: 'all', label: 'All Subjects' },
            ...subjects.map(s => ({ value: s.id, label: s.name }))
          ]}
        />

        <div className="revision-filter-chips">
          {['all', 'active', 'completed'].map((s) => (
            <button
              key={s}
              className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
              id={`revision-filter-${s}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="revision-tasks-count">
        {filtered.length} revision task{filtered.length !== 1 ? 's' : ''}
      </p>

      <LoadingScreen isLoading={loading} interval={1500} fullScreen={false} />

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No revision tasks"
          description="Mark tasks for revision using the 📖 button on any task card."
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

      <TaskForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditTask(null); }}
        onSaved={handleTaskSaved}
        editTask={editTask}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Delete "${deleteTarget?.title}"?`}
        loading={deleting}
      />
    </div>
  );
}
