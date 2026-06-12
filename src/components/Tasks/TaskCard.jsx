import { Check, Edit2, Trash2, BookMarked, Calendar, ChevronRight } from 'lucide-react';
import Badge from '../common/Badge';
import { toggleComplete, toggleRevision } from '../../hooks/useTasks';
import toast from 'react-hot-toast';

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

// Helper to convert hex to rgba for soft backgrounds
function hexToRgba(hex, alpha = 0.1) {
  if (!hex || !hex.startsWith('#')) return `rgba(139, 92, 246, ${alpha})`; // fallback amethyst
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function TaskCard({ task, onUpdated, onEdit, onDelete }) {
  async function handleToggleComplete() {
    try {
      const updated = await toggleComplete(task);
      onUpdated(updated);
    } catch {
      toast.error('Failed to update task');
    }
  }

  async function handleToggleRevision() {
    try {
      const updated = await toggleRevision(task);
      onUpdated(updated);
      toast.success(updated.is_revision ? 'Marked for revision' : 'Removed from revision');
    } catch {
      toast.error('Failed to update task');
    }
  }

  const overdue = isOverdue(task.due_date) && !task.is_completed;
  
  // Calculate dynamic colors
  const subColor = task.subjects?.color || '#8b5cf6';
  const softBg = hexToRgba(subColor, 0.08);
  const glowShadow = `0 8px 24px ${hexToRgba(subColor, 0.2)}`;

  return (
    <div 
      className={`task-card ${task.is_completed ? 'completed' : ''} slide-up`}
      style={{ 
        '--subject-color': subColor,
        background: task.is_completed ? '#f8fafc' : '#ffffff'
      }}
    >
      {/* Checkbox */}
      <button
        className={`task-checkbox ${task.is_completed ? 'checked' : ''}`}
        onClick={handleToggleComplete}
        aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
        id={`task-check-${task.id}`}
        style={{
          width: '28px', height: '28px', borderRadius: '50%',
          border: task.is_completed ? 'none' : `2px solid ${subColor}`,
          background: task.is_completed ? subColor : 'transparent',
          boxShadow: task.is_completed ? glowShadow : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          marginTop: '4px', flexShrink: 0
        }}
      >
        {task.is_completed && <Check size={16} color="white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="task-content" style={{ flex: 1 }}>
        {/* Colorful Hierarchy Badges */}
        <div className="task-breadcrumb">
          {task.subjects && (
            <span className="colorful-badge" style={{ background: softBg, color: subColor, boxShadow: glowShadow }}>
              {task.subjects.name}
            </span>
          )}
          
          {task.chapters && (
            <>
              <ChevronRight size={14} style={{ color: 'rgba(0,0,0,0.2)' }} />
              <span className="colorful-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                {task.chapters.name}
              </span>
            </>
          )}

          {task.topics && task.topics.name !== task.title && (
             <>
               <ChevronRight size={14} style={{ color: 'rgba(0,0,0,0.2)' }} />
               <span className="colorful-badge" style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 500 }}>
                 {task.topics.name}
               </span>
             </>
          )}

          {task.sub_topics && task.sub_topics.name !== task.title && (
             <>
               <ChevronRight size={14} style={{ color: 'rgba(0,0,0,0.2)' }} />
               <span className="colorful-badge" style={{ background: '#f8fafc', color: '#94a3b8', fontWeight: 500 }}>
                 {task.sub_topics.name}
               </span>
             </>
          )}
        </div>

        {/* Title */}
        <p className={`task-title ${task.is_completed ? 'completed-text' : ''}`} style={{ fontSize: '1.2rem', fontWeight: 700, color: task.is_completed ? '#94a3b8' : '#0f172a', margin: '0 0 16px 0', textDecoration: 'none' }}>
          {task.title}
        </p>

        {/* Meta */}
        <div className="task-meta" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {task.priority && (
            <span className="colorful-badge" style={{ 
              background: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? '#fef3c7' : '#e0f2fe',
              color: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6'
            }}>
              {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🔵'} {task.priority.toUpperCase()}
            </span>
          )}
          {task.is_revision && (
             <span className="colorful-badge" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: 'white', boxShadow: '0 4px 10px rgba(236, 72, 153, 0.3)' }}>
               📖 REVISION
             </span>
          )}
          {task.due_date && (
            <span className="colorful-badge" style={{ background: overdue ? '#fee2e2' : '#f1f5f9', color: overdue ? '#ef4444' : '#64748b' }}>
              <Calendar size={12} />
              {overdue ? '⚠ ' : ''}{formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="task-actions" style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button
          className="action-btn"
          onClick={handleToggleRevision}
          aria-label="Toggle Revision"
          style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: task.is_revision ? '#fdf2f8' : 'transparent', color: task.is_revision ? '#ec4899' : '#94a3b8', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <BookMarked size={18} fill={task.is_revision ? 'currentColor' : 'none'} />
        </button>
        <button
          className="action-btn"
          onClick={() => onEdit(task)}
          aria-label="Edit Task"
          style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Edit2 size={18} />
        </button>
        <button
          className="action-btn"
          onClick={() => onDelete(task)}
          aria-label="Delete Task"
          style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
