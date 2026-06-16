import { useState, useEffect } from 'react';
import ProgressBar from '../common/ProgressBar';
import EmptyState from '../common/EmptyState';
import { fetchDashboardStats, fetchProgressBySubject, fetchProgressByChapter } from '../../hooks/useDashboard';
import { normalizeSubjectColor } from '../../utils/subjectColor';
import { TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import ProgressLineChart from './ProgressLineChart';
import KnowledgeConstellation from './KnowledgeConstellation';

function SubjectProgressCard({ subject, chapters }) {
  const [expanded, setExpanded] = useState(false);
  const subjectChapters = chapters.filter((c) => c.subjectId === subject.id);
  const color = normalizeSubjectColor(subject.color, subject.id || subject.name);

  return (
    <div className="card-3d subject-progress-card slide-up">
      <div className="subject-progress-header" onClick={() => setExpanded((v) => !v)}>
        <div className="subject-name-row">
          <div className="subject-color-bar" style={{ background: color }} />
          <div className="subject-progress-info">
            <h4 className="subject-name">{subject.name}</h4>
            <p className="subject-task-count">
              {subject.completed} / {subject.total} tasks completed
            </p>
          </div>
        </div>
        <div className="subject-progress-stats">
          <span className="subject-percent" style={{ color }}>
            {subject.percentage}%
          </span>
          {expanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
        </div>
      </div>

      <ProgressBar value={subject.percentage} size="md" color={color} />

      {/* Predictive Analytics Badge */}
      <div style={{ 
        marginTop: 'var(--space-3)', 
        padding: 'var(--space-2) var(--space-3)', 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '8px', 
        border: '1px solid rgba(255,255,255,0.05)', 
        fontSize: '0.85rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px' 
      }}>
        {subject.percentage === 100 ? (
          <><span style={{fontSize: '1rem'}}>✨</span> <span style={{color: 'var(--text-muted)'}}>Mastered on <strong style={{color: 'var(--text-primary)'}}>{new Date(subject.lastCompletedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</strong></span></>
        ) : subject.predictedCompletionDate ? (
          <><span style={{fontSize: '1rem'}}>🚀</span> <span style={{color: 'var(--text-muted)'}}>At current pace, mastering by <strong style={{color: color}}>{new Date(subject.predictedCompletionDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</strong></span></>
        ) : (
          <><span style={{fontSize: '1rem'}}>⏳</span> <span style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>Complete a task to get a mastery prediction</span></>
        )}
      </div>

      {expanded && subjectChapters.length > 0 && (
        <div className="chapter-progress-list">
          {subjectChapters.map((ch) => (
            <div key={ch.id} className="chapter-progress-row">
              <div className="chapter-progress-meta">
                <span className="chapter-progress-name">
                  {ch.name}
                </span>
                <span className="chapter-progress-stats">
                  {ch.completed}/{ch.total} ({ch.percentage}%)
                </span>
              </div>
              <ProgressBar value={ch.percentage} size="sm" />
            </div>
          ))}
        </div>
      )}

      {expanded && subjectChapters.length === 0 && (
        <p className="chapter-progress-empty">
          No chapters found
        </p>
      )}
    </div>
  );
}

export default function ProgressView() {
  const [overall, setOverall] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, subj, chap] = await Promise.all([
          fetchDashboardStats(),
          fetchProgressBySubject(),
          fetchProgressByChapter(),
        ]);
        setOverall(s);
        setSubjects(subj);
        setChapters(chap);
      } catch {
        toast.error('Failed to load progress');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
        Loading progress...
      </div>
    );
  }

  return (
    <div className="progress-page fade-in">
      <div className="page-header progress-page-header slide-down">
        <div className="progress-page-icon">
          <TrendingUp size={28} />
        </div>
        <div className="progress-page-text">
          <h2 className="progress-page-title">Progress</h2>
          <p className="progress-page-desc">Track your study progress across all subjects and chapters.</p>
        </div>
      </div>

      {/* Overall */}
      <div className="card-3d overall-progress-card slide-up">
        <div className="overall-progress-content">
          <div className="overall-progress-header">
            <div className="overall-progress-info">
              <h3 className="overall-progress-title">Platform-wide Progress</h3>
              <p className="overall-progress-desc">
                {overall?.completedTasks ?? 0} of {overall?.totalTasks ?? 0} total tasks completed
              </p>
            </div>
            <span className="overall-percent">{overall?.overallProgress ?? 0}%</span>
          </div>
          <ProgressBar value={overall?.overallProgress ?? 0} size="lg" />
        </div>
      </div>

      {/* Completion Trends Chart */}
      <div className="progress-section-container slide-up" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <ProgressLineChart completedTimestamps={overall?.completedTimestamps ?? []} />
      </div>

      {/* Knowledge Constellation Graph */}
      <div className="progress-section-container slide-up" style={{ marginBottom: 'var(--space-8)' }}>
        <KnowledgeConstellation subjects={subjects} chapters={chapters} />
      </div>

      {/* Subject breakdown */}
      {subjects.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No progress data yet"
          description="Create tasks to start tracking your progress!"
        />
      ) : (
        <>
          <div className="section-header progress-section-header">
            <h3>By Subject</h3>
            <span className="section-header-meta">
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="subject-progress-list">
            {subjects.map((s, i) => (
              <div key={s.id} style={{ animationDelay: `${i * 50}ms` }}>
                <SubjectProgressCard subject={s} chapters={chapters} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
