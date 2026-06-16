import { Check, Edit2, Trash2, BookMarked, Calendar, ChevronRight } from 'lucide-react';
import Badge from '../common/Badge';
import { toggleComplete, toggleRevision } from '../../hooks/useTasks';
import { normalizeSubjectColor } from '../../utils/subjectColor';
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
  
  const subColor = normalizeSubjectColor(
    task.subjects?.color,
    task.subjects?.id || task.subjects?.name
  );

  return (
    <div 
      className={`task-card ${task.is_completed ? 'completed' : ''}`}
      style={{ '--subject-color': subColor }}
    >
      {/* Checkbox */}
      <button
        className={`task-checkbox ${task.is_completed ? 'checked' : ''}`}
        onClick={handleToggleComplete}
        aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
        id={`task-check-${task.id}`}
      >
        {task.is_completed && <Check size={16} color="white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="task-content">
        {/* Colorful Hierarchy Badges */}
        <div className="task-breadcrumb">
          {task.subjects && (
            <span className="breadcrumb-subject" style={{ '--subject-color': subColor }}>
              {task.subjects.name}
            </span>
          )}
          
          {task.chapters && (
            <>
              <ChevronRight size={14} className="breadcrumb-separator" />
              <span className="breadcrumb-item">
                {task.chapters.name}
              </span>
            </>
          )}

          {task.topics && task.topics.name !== task.title && (
             <>
               <ChevronRight size={14} className="breadcrumb-separator" />
               <span className="breadcrumb-item">
                 {task.topics.name}
               </span>
             </>
          )}

          {task.sub_topics && task.sub_topics.name !== task.title && (
             <>
               <ChevronRight size={14} className="breadcrumb-separator" />
               <span className="breadcrumb-item">
                 {task.sub_topics.name}
               </span>
             </>
          )}
        </div>

        {/* Title */}
        <p className={`task-title ${task.is_completed ? 'completed-text' : ''}`}>
          {task.title}
        </p>

        {/* Meta */}
        <div className="task-meta">
          {task.priority && (
            <Badge type={task.priority}>
              {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
            </Badge>
          )}
          {task.is_revision && (
             <Badge type="revision">📖 Revision</Badge>
          )}
          {task.due_date && (
            <span className={`task-due ${overdue ? 'overdue' : ''}`}>
              <Calendar size={12} />
              {overdue ? '⚠ ' : ''}{formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="task-actions">
        <button
          className="btn btn-ghost btn-icon htv-action-btn"
          style={{ color: task.is_revision ? 'var(--revision)' : '' }}
          onClick={handleToggleRevision}
          aria-label="Toggle Revision"
        >
          <BookMarked size={18} fill={task.is_revision ? 'currentColor' : 'none'} />
        </button>
        <button
          className="btn btn-ghost btn-icon htv-action-btn"
          onClick={() => onEdit(task)}
          aria-label="Edit Task"
        >
          <Edit2 size={18} />
        </button>
        <button
          className="btn btn-ghost btn-icon htv-action-btn htv-action-delete"
          onClick={() => onDelete(task)}
          aria-label="Delete Task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
