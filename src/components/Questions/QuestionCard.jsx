import { Code2, BookOpen, Layers, ChevronRight, Pencil, Trash2 } from 'lucide-react';

export default function QuestionCard({ question, onClick, onEdit, onDelete, isAdmin }) {
  const subject = question.subjects;
  const chapter = question.chapters;
  const topic   = question.topics;
  const accentColor = subject?.color || 'var(--accent-1)';

  const examplesCount  = (question.examples  || []).length;
  const ioCount        = (question.io_examples || []).length;
  const solutionsCount = (question.solutions  || []).length;

  return (
    <article
      className="question-card"
      style={{ '--q-accent': accentColor }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={`Question: ${question.title}`}
    >
      {/* Left accent bar */}
      <div className="question-card-accent" />

      <div className="question-card-body">
        {/* Breadcrumb */}
        <div className="question-card-breadcrumb">
          {subject && (
            <span className="question-card-subject" style={{ color: accentColor }}>
              <span
                className="question-card-subject-dot"
                style={{ background: accentColor }}
              />
              {subject.name}
            </span>
          )}
          {chapter && (
            <>
              <ChevronRight size={12} className="question-card-chevron" />
              <span className="question-card-bc-part">{chapter.name}</span>
            </>
          )}
          {topic && (
            <>
              <ChevronRight size={12} className="question-card-chevron" />
              <span className="question-card-bc-part">{topic.name}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="question-card-title">{question.title}</h3>

        {/* Explanation preview */}
        {question.explanation && (
          <p className="question-card-excerpt">
            {question.explanation.slice(0, 110)}
            {question.explanation.length > 110 ? '…' : ''}
          </p>
        )}

        {/* Meta badges */}
        <div className="question-card-meta">
          {examplesCount > 0 && (
            <span className="question-meta-badge">
              <BookOpen size={11} />
              {examplesCount} Example{examplesCount !== 1 ? 's' : ''}
            </span>
          )}
          {ioCount > 0 && (
            <span className="question-meta-badge">
              <Layers size={11} />
              {ioCount} I/O
            </span>
          )}
          {solutionsCount > 0 && (
            <span className="question-meta-badge question-meta-badge--solutions">
              <Code2 size={11} />
              {solutionsCount} Solution{solutionsCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="question-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-ghost btn-icon question-card-action-btn"
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            aria-label="Edit question"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            className="btn btn-ghost btn-icon question-card-action-btn question-card-action-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            aria-label="Delete question"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </article>
  );
}
