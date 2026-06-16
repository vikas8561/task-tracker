import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Calendar, Flame, Plus, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';
import StreakDisplay from './StreakDisplay';
import TaskCard from '../Tasks/TaskCard';
import ProgressBar from '../common/ProgressBar';
import EmptyState from '../common/EmptyState';
import { fetchDashboardStats, fetchRecentTasks } from '../../hooks/useDashboard';
import { toggleComplete, toggleRevision, deleteTask } from '../../hooks/useTasks';
import ConfirmDialog from '../common/ConfirmDialog';
import TaskForm from '../Tasks/TaskForm';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    try {
      const [s, r] = await Promise.all([fetchDashboardStats(), fetchRecentTasks(6)]);
      setStats(s);
      setRecentTasks(r);
    } catch {
      // Silently fall back to zeros if DB not set up yet
      setStats({ totalTasks: 0, completedTasks: 0, todaysTasks: 0, streak: 0, completedTimestamps: [], overallProgress: 0 });
      setRecentTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handleTaskUpdated(updated) {
    setRecentTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    // Refresh stats since completion status changed
    fetchDashboardStats().then(setStats).catch(() => { });
  }

  function handleTaskSaved(task, isEdit) {
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTask(deleteTarget.id);
      setRecentTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success('Task deleted');
      fetchDashboardStats().then(setStats);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-muted)' }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ position: 'relative', zIndex: 1 }}>
      <div className="dashboard-3d-bg"></div>
      {/* Page Header */}
      <div className="page-header-banner slide-down">
        <div className="header-icon-badge emoji-badge" style={{
          background: 'var(--accent-grad-soft)',
          fontSize: '28px'
        }}>
          👋
        </div>
        <div className="header-text-container">
          <h2>Welcome back!</h2>
          <p>Here's an overview of your study progress.</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="card-3d card-3d-glowing overall-progress-card slide-up">
        <div className="overall-progress-content">
          <div className="overall-progress-header">
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Overall Progress</h3>
              <p style={{ fontSize: '0.8rem' }}>
                {stats?.completedTasks ?? 0} of {stats?.totalTasks ?? 0} tasks completed
              </p>
            </div>
            <span className="overall-percent">{stats?.overallProgress ?? 0}%</span>
          </div>
          <ProgressBar value={stats?.overallProgress ?? 0} size="lg" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          icon={ClipboardList}
          label="Total Tasks"
          value={stats?.totalTasks ?? 0}
          color="var(--accent-1)"
          delay="stagger-1"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats?.completedTasks ?? 0}
          color="var(--success)"
          delay="stagger-2"
        />
        <StatCard
          icon={Calendar}
          label="Due Today"
          value={stats?.todaysTasks ?? 0}
          color="var(--warning)"
          delay="stagger-3"
        />
        <StreakDisplay
          streak={stats?.streak ?? 0}
          completedTimestamps={stats?.completedTimestamps ?? []}
        />
      </div>

      {/* Recent Tasks */}
      <div>
        <div className="section-header">
          <h3>Recent Tasks</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowForm(true)}
            id="dashboard-add-task-btn"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No tasks yet"
            description="Start by creating your first task!"
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                Create Task
              </button>
            }
          />
        ) : (
          <div className="tasks-list">
            {recentTasks.map((task, i) => (
              <div key={task.id} style={{ animationDelay: `${i * 40}ms` }}>
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
      </div>

      {/* Modals */}
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
