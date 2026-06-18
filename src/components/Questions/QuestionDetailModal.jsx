import { X, Code2, BookOpen, Layers, ChevronRight, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
export default function QuestionDetailModal({ question, onClose, onEdit, isAdmin }) {
  if (!question) return null;

  const subject = question.subjects;
  const chapter = question.chapters;
  const topic = question.topics;
  const accentColor = subject?.color || 'var(--accent-1)';
  const examples = question.examples || [];
  const ioExamples = question.io_examples || [];
  const solutions = question.solutions || [];

  return (
    <div className="modal-backdrop">
      <div
        className="modal question-detail-modal"
        style={{ maxWidth: '1800px', width: '98vw', height: '96vh', maxHeight: 'none' }}
        role="dialog"
        aria-modal="true"
        aria-label={question.title}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header question-detail-header" style={{ borderColor: `${accentColor}30` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Breadcrumb */}
            <div className="question-detail-breadcrumb">
              {subject && (
                <span style={{ color: accentColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, display: 'inline-block' }} />
                  {subject.name}
                </span>
              )}
              {chapter && <><ChevronRight size={13} style={{ color: 'var(--text-muted)' }} /><span style={{ color: 'var(--text-secondary)' }}>{chapter.name}</span></>}
              {topic && <><ChevronRight size={13} style={{ color: 'var(--text-muted)' }} /><span style={{ color: 'var(--text-secondary)' }}>{topic.name}</span></>}
            </div>
            <h2 className="question-detail-title">{question.title}</h2>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
            {isAdmin && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={onEdit}
                aria-label="Edit question"
                title="Edit"
              >
                <Pencil size={17} />
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body question-detail-body">

          {/* Explanation */}
          {question.explanation && (
            <section className="qd-section">
              <div className="qd-section-header">
                <span className="qd-section-icon">💡</span>
                <h4 className="qd-section-title">Explanation</h4>
              </div>
              <div className="qd-dark-card">
                <div className="qd-explanation-md">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {question.explanation}
                  </ReactMarkdown>
                </div>
              </div>
            </section>
          )}

          {/* Examples */}
          {examples.length > 0 && (
            <section className="qd-section">
              <div className="qd-section-header">
                <span className="qd-section-icon"><BookOpen size={15} /></span>
                <h4 className="qd-section-title">Examples</h4>
                <span className="qd-count-badge">{examples.length}</span>
              </div>
              <div className="qd-dark-card" style={{ padding: 'var(--space-3)' }}>
                <ul className="qd-examples-list">
                  {examples.map((ex, i) => (
                    <li key={i} className="qd-example-item">
                      <span className="qd-example-num">{i + 1}</span>
                      <span className="qd-example-text">{ex.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* I/O Examples */}
          {ioExamples.length > 0 && (
            <section className="qd-section">
              <div className="qd-section-header">
                <span className="qd-section-icon"><Layers size={15} /></span>
                <h4 className="qd-section-title">Input / Output Examples</h4>
                <span className="qd-count-badge">{ioExamples.length}</span>
              </div>
              <div className="qd-io-grid">
                {ioExamples.map((io, i) => (
                  <div key={i} className="qd-io-pair">
                    <div className="qd-io-side qd-io-input">
                      <span className="qd-io-label">Input</span>
                      <pre className="qd-io-code">
                        {io.input?.replace(/^input\s*:/i, '').trim().split(', ').join('\n')}
                      </pre>
                    </div>
                    <div className="qd-io-arrow">→</div>
                    <div className="qd-io-side qd-io-output">
                      <span className="qd-io-label">Output</span>
                      <pre className="qd-io-code">
                        {io.output?.replace(/^output\s*:/i, '').trim().split(', ').join('\n')}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Solutions */}
          {solutions.length > 0 && (
            <section className="qd-section">
              <div className="qd-section-header">
                <span className="qd-section-icon"><Code2 size={15} /></span>
                <h4 className="qd-section-title">Solutions</h4>
                <span className="qd-count-badge">{solutions.length}</span>
              </div>
              <div className="qd-solutions-list">
                {solutions.map((sol, i) => (
                  <div key={i} className="qd-solution-block">
                    <div className="qd-solution-lang-bar">
                      <span className="qd-lang-badge">{sol.language || 'text'}</span>
                      <span className="qd-solution-num">Solution {i + 1}</span>
                    </div>
                    <pre className="qd-solution-code">{sol.code}</pre>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!question.explanation && examples.length === 0 && ioExamples.length === 0 && solutions.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              No additional details added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

