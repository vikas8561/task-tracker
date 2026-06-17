import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Calendar, Flame, Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatCard from './StatCard';
import StreakDisplay from './StreakDisplay';
import TaskCard from '../Tasks/TaskCard';
import CircularProgress from '../common/CircularProgress';
import EmptyState from '../common/EmptyState';
import { fetchDashboardStats, fetchRecentTasks } from '../../hooks/useDashboard';
import { toggleComplete, toggleRevision, deleteTask } from '../../hooks/useTasks';
import ConfirmDialog from '../common/ConfirmDialog';
import TaskForm from '../Tasks/TaskForm';
import ActivityHeatmap from './ActivityHeatmap';
import toast from 'react-hot-toast';
import LoadingScreen from '../common/LoadingScreen';

export default function Dashboard() {
  const { displayName, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
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

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

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

  // Dynamic Greeting
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  let emoji = '🌙';
  if (hour < 12) {
    greeting = 'Good morning';
    emoji = '🌅';
  } else if (hour < 18) {
    greeting = 'Good afternoon';
    emoji = '☀️';
  }

  // Daily Quote based on day of the year
  const quotes = [
    "Small steps taken every day create extraordinary results over time.",
    "The person you become is shaped by what you do consistently, not occasionally.",
    "Success is not about being the best; it's about being better than you were yesterday.",
    "Every day is a new opportunity to learn, grow, and move closer to your goals.",
    "Dream big, start small, and stay consistent.",
    "The future depends on what you do today, not tomorrow.",
    "Discipline is the bridge between goals and accomplishments.",
    "Growth begins at the end of your comfort zone.",
    "Don't wait for motivation. Build habits that keep you moving forward.",
    "Progress may be slow, but every step forward counts.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Your only limit is the one you refuse to challenge.",
    "Success comes from daily effort repeated over time.",
    "Every challenge you face is preparing you for something greater.",
    "Be patient with yourself. Great things take time.",
    "Focus on progress, not perfection.",
    "Consistency turns small actions into life-changing results.",
    "The best investment you can make is in yourself.",
    "Keep going. The effort you make today will reward you tomorrow.",
    "Believe in your ability to learn, improve, and succeed.",
    "A year from now, you'll be grateful you didn't give up today.",
    "Stay committed to your goals, even when progress feels invisible.",
    "Every accomplishment starts with the decision to try.",
    "The difference between ordinary and extraordinary is a little extra effort every day.",
    "Success is built one day, one habit, and one decision at a time.",
    "Your future self is watching your choices today.",
    "The road to success is paved with consistency and patience.",
    "Never underestimate the power of showing up every single day.",
    "Keep learning, keep growing, and keep moving forward.",
    "The journey may be difficult, but the destination is worth it.",
    "Today's effort is tomorrow's achievement.",
    "Don't be afraid to start over; it's a chance to build something stronger.",
    "Great things happen when determination meets persistence.",
    "The secret to success is staying focused when others give up.",
    "Make today count. It will never come again.",
    "Your dreams deserve your dedication.",
    "Every day is another chance to become the person you want to be.",
    "Work hard in silence; let your results make the noise.",
    "Success grows where consistency is planted.",
    "The strongest people are built through the challenges they overcome.",
    "Keep moving forward, even if it's only one step at a time.",
    "Learning is a lifelong journey that always pays off.",
    "Don't count the days; make the days count.",
    "Stay hungry for growth and humble in success.",
    "Believe in the process, trust your effort, and never stop improving.",
    "Little by little, day by day, you become unstoppable.",
    "The life you want is created by the choices you make every day.",
    "Success is not a destination; it's a habit.",
    "Every sunrise brings a new chance to grow.",
    "Be proud of how far you've come and excited for how far you'll go."
  ];

  const startOfYear = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const dailyQuote = quotes[dayOfYear % quotes.length];

  return (
    <>
      <LoadingScreen isLoading={loading} interval={1500} fullScreen={false} />
      {!loading && (
        <div className="dashboard-page fade-in" style={{ position: 'relative', zIndex: 1 }}>
          <div className="dashboard-3d-bg"></div>

      {/* Welcome */}
      <div className="page-header-banner slide-down">
        <div className="header-icon-badge emoji-badge" style={{
          background: 'var(--accent-grad-soft)',
          fontSize: '28px'
        }}>
          {emoji}
        </div>
        <div className="header-text-container">
          <h2>{greeting}{displayName ? `, ${displayName}` : ''}!</h2>
          <p className="daily-quote" style={{ fontStyle: 'italic', color: 'var(--accent-1)', marginTop: '4px', opacity: 0.9 }}>
            "{dailyQuote}"
          </p>
        </div>
      </div>

      {/* Overall Progress + Stats Grid */}
      <div className="dashboard-grid slide-up">
        <div className="dashboard-grid-main">
          <div className="card-3d card-3d-glowing overall-progress-card">
            <div className="overall-progress-layout">
              <CircularProgress
                value={stats?.overallProgress ?? 0}
                size={isMobile ? 96 : 140}
                strokeWidth={isMobile ? 10 : 12}
              />
              <div className="overall-progress-info">
                <h3>Overall Progress</h3>
                <p>
                  {stats?.completedTasks ?? 0} of {stats?.totalTasks ?? 0} tasks completed
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-stats">
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
            color="var(--accent-2)"
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
      </div>

      {/* Activity Heatmap */}
      <div className="dashboard-heatmap-section slide-up" style={{ marginTop: 'var(--space-6)' }}>
        <ActivityHeatmap completedTimestamps={stats?.completedTimestamps ?? []} />
      </div>

      {/* Recent Tasks */}
      <div className="dashboard-recent-section">
        <div className="section-header">
          <h3>Recent Tasks</h3>
          {isAdmin && (
            <button
              className="btn btn-secondary btn-sm dashboard-recent-add-btn"
              onClick={() => setShowForm(true)}
              id="dashboard-add-task-btn"
            >
              <Plus size={14} /> Add Task
            </button>
          )}
        </div>

        {recentTasks.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No tasks yet"
            description="Start by creating your first task!"
            action={
              isAdmin ? (
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                  Create Task
                </button>
              ) : null
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
    )}
    </>
  );
}
