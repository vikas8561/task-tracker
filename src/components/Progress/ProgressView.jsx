import { useState, useEffect } from 'react';
import ProgressBar from '../common/ProgressBar';
import EmptyState from '../common/EmptyState';
import { fetchDashboardStats, fetchProgressBySubject, fetchProgressByChapter } from '../../hooks/useDashboard';
import { normalizeSubjectColor } from '../../utils/subjectColor';
import { TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

function SubjectProgressCard({ subject, chapters }) {
  const [expanded, setExpanded] = useState(false);
  const subjectChapters = chapters.filter((c) => c.subjectId === subject.id);
  const color = normalizeSubjectColor(subject.color, subject.id || subject.name);

  return (
    <div className="card-3d subject-progress-card slide-up">
      <div className="subject-progress-header" onClick={() => setExpanded((v) => !v)}>
        <div className="subject-name-row">
          <div className="subject-color-bar" style={{ background: color }} />
          <div>
            <h4 style={{ color: 'var(--text-primary)' }}>{subject.name}</h4>
            <p style={{ fontSize: '0.78rem' }}>
              {subject.completed} / {subject.total} tasks completed
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color
          }}>
            {subject.percentage}%
          </span>
          {expanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
        </div>
      </div>

      <ProgressBar value={subject.percentage} size="md" color={color} />

      {expanded && subjectChapters.length > 0 && (
        <div className="chapter-progress-list">
          {subjectChapters.map((ch) => (
            <div key={ch.id} className="chapter-progress-row">
              <div className="chapter-progress-meta">
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {ch.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {ch.completed}/{ch.total} ({ch.percentage}%)
                </span>
              </div>
              <ProgressBar value={ch.percentage} size="sm" />
            </div>
          ))}
        </div>
      )}

      {expanded && subjectChapters.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
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
          background: 'var(--accent-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 12px var(--accent-1-soft)'
        }}>
          <TrendingUp size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px', marginTop: 0 }}>Progress</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>Track your study progress across all subjects and chapters.</p>
        </div>
      </div>

      {/* Overall */}
      <div className="card-3d overall-progress-card slide-up">
        <div className="overall-progress-content">
          <div className="overall-progress-header">
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Platform-wide Progress</h3>
              <p style={{ fontSize: '0.85rem' }}>
                {overall?.completedTasks ?? 0} of {overall?.totalTasks ?? 0} total tasks completed
              </p>
            </div>
            <span className="overall-percent" style={{ color: 'var(--accent-1)', fontWeight: 'bold' }}>{overall?.overallProgress ?? 0}%</span>
          </div>
          <ProgressBar value={overall?.overallProgress ?? 0} size="lg" />
        </div>
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
          <div className="section-header">
            <h3>By Subject</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
