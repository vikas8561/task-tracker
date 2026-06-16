import { useState, useEffect, useCallback } from 'react';
import TaskCard from '../Tasks/TaskCard';
import TaskForm from '../Tasks/TaskForm';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import { fetchTasks, deleteTask } from '../../hooks/useTasks';
import { fetchSubjects } from '../../hooks/useSubjects';
import { BookMarked } from 'lucide-react';
import toast from 'react-hot-toast';

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
      <div className="page-header slide-down" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        background: 'var(--bg-secondary)',
        padding: '24px 32px',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        marginBottom: '32px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--warning)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 12px var(--warning-soft)'
        }}>
          <BookMarked size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px', marginTop: 0 }}>Revision Tasks</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>Tasks marked for revision. Review and reinforce your knowledge.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          id="revision-filter-subject"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

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

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
        {filtered.length} revision task{filtered.length !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No revision tasks"
          description="Mark tasks for revision using the 📖 button on any task card."
        />
      ) : (
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
      )}

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
