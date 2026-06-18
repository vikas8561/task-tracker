import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  BookOpen,
  Layers,
  Code2,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';
import Badge from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* QuestionRow (individual question row)                                 */
/* ------------------------------------------------------------------ */
function QuestionRow({ question, onClick, onEdit, onDelete }) {
  const { isAdmin } = useAuth();
  
  const examplesCount  = (question.examples  || []).length;
  const ioCount        = (question.io_examples || []).length;
  const solutionsCount = (question.solutions  || []).length;

  return (
    <div
      className="htv-subtopic-row"
      onClick={() => onClick(question)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(question)}
    >

      <span className="htv-subtopic-title">{question.title}</span>

      <div className="htv-subtopic-badges">
        {examplesCount > 0 && (
          <Badge type="default">
            <BookOpen size={10} style={{ marginRight: 4 }}/>
            {examplesCount} Ex
          </Badge>
        )}
        {ioCount > 0 && (
          <Badge type="default">
            <Layers size={10} style={{ marginRight: 4 }}/>
            {ioCount} I/O
          </Badge>
        )}
        {solutionsCount > 0 && (
          <Badge type="high">
            <Code2 size={10} style={{ marginRight: 4 }}/>
            {solutionsCount} Sol
          </Badge>
        )}
      </div>

      <div className="htv-subtopic-actions" onClick={e => e.stopPropagation()}>
        {isAdmin && (
          <>
            <button className="btn btn-ghost btn-icon htv-action-btn" onClick={() => onEdit(question)} title="Edit" id={`htv-edit-${question.id}`}>
              <Edit2 size={16} />
            </button>
            <button className="btn btn-ghost btn-icon htv-action-btn htv-action-delete" onClick={() => onDelete(question)} title="Delete" id={`htv-del-${question.id}`}>
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TopicSection                                                         */
/* Receives questions[] as a direct prop (not nested inside topic object). */
/* Shows metadata count when questions haven't been loaded yet.            */
/* ------------------------------------------------------------------ */
function TopicSection({ topic, questions, topicQuestionCount, onClick, onUpdated, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  const displayTotal = questions.length > 0 ? questions.length : (topicQuestionCount || 0);

  return (
    <div className="htv-topic">
      <button className="htv-topic-header" onClick={() => setOpen(o => !o)} id={`htv-topic-${topic.id}`}>
        <span className="htv-topic-chevron">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <BookOpen size={14} className="htv-topic-icon" />
        <span className="htv-topic-name">{topic.name}</span>
        <span className="htv-topic-count">
          {displayTotal} Qs
        </span>
      </button>

      {open && (
        <div className="htv-question-list">
          {questions.length > 0 ? (
            questions.map(question => (
              <QuestionRow
                key={question.id}
                question={question}
                onClick={onClick}
                onUpdated={onUpdated}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <p className="htv-topic-empty">No questions in this topic yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ChapterFolder                                                        */
/* Triggers lazy load on first expand. Shows spinner while loading.    */
/* ------------------------------------------------------------------ */
function ChapterFolder({
  chapter, topics,
  topicQuestionCount, chapterQuestionCount,
  loadedChapters, onLoadChapter,
  onClick, onUpdated, onEdit, onDelete,
}) {
  const [open, setOpen] = useState(false);

  const chapterEntry = loadedChapters[chapter.id]; // undefined | 'loading' | Question[]
  const isLoaded  = Array.isArray(chapterEntry);
  const isLoading = chapterEntry === 'loading';

  // Stats: use metadata count until questions are actually loaded
  const totalFromMeta = chapterQuestionCount || 0;
  const total = isLoaded ? chapterEntry.length : totalFromMeta;

  async function handleToggle() {
    const next = !open;
    // Fire lazy load on first open (non-blocking — spinner shown inline)
    if (next && !isLoaded && !isLoading) {
      onLoadChapter(chapter.id);
    }
    setOpen(next);
  }

  // Build a topic → questions[] map from the loaded chapter data
  const questionsByTopic = useMemo(() => {
    if (!isLoaded) return {};
    const map = {};
    chapterEntry.forEach(question => {
      if (!map[question.topic_id]) map[question.topic_id] = [];
      map[question.topic_id].push(question);
    });
    return map;
  }, [chapterEntry, isLoaded]);

  return (
    <div className="htv-chapter">
      <button
        className={`htv-chapter-header ${open ? 'htv-chapter-open' : ''}`}
        onClick={handleToggle}
        id={`htv-chapter-${chapter.id}`}
      >
        <span className="htv-folder-icon">
          {isLoading
            ? <Loader2 size={16} className="htv-loading-spin" />
            : open
              ? <FolderOpen size={16} />
              : <Folder size={16} />
          }
        </span>
        <span className="htv-chapter-name">{chapter.name}</span>
        <span className="htv-chapter-meta">
          {total} Qs
        </span>
        <span className="htv-chapter-chevron">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      {open && (
        <div className="htv-chapter-body">
          {/* Inline loading indicator */}
          {isLoading && (
            <div className="htv-chapter-loading-row">
              <Loader2 size={16} className="htv-loading-spin" />
              <span>Loading questions…</span>
            </div>
          )}

          {/* Loaded: render topic sections */}
          {isLoaded && topics.map(topic => (
            <TopicSection
              key={topic.id}
              topic={topic}
              questions={questionsByTopic[topic.id] || []}
              topicQuestionCount={topicQuestionCount[topic.id] || 0}
              onClick={onClick}
              onUpdated={onUpdated}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}

          {isLoaded && topics.length === 0 && (
            <p className="htv-chapter-empty">No topics in this chapter yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SubjectFolder                                                        */
/* ------------------------------------------------------------------ */
function SubjectFolder({
  subject, chapters,
  topicsByChapter, topicQuestionCount, chapterQuestionCount,
  loadedChapters, onLoadChapter,
  onClick, onUpdated, onEdit, onDelete,
}) {
  const [open, setOpen] = useState(false);

  // Mix loaded question counts with metadata counts for unloaded chapters
  const { totalQuestions } = useMemo(() => {
    let total = 0;
    chapters.forEach(c => {
      const loaded = loadedChapters[c.id];
      if (Array.isArray(loaded)) {
        total += loaded.length;
      } else {
        total += (chapterQuestionCount[c.id] || 0);
      }
    });
    return { totalQuestions: total };
  }, [chapters, loadedChapters, chapterQuestionCount]);

  return (
    <div className="htv-subject" style={{ '--subject-color': subject.color }}>
      <div className="htv-subject-accent" style={{ background: subject.color }} />

      <button
        className={`htv-subject-header ${open ? 'htv-subject-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        id={`htv-subject-${subject.id}`}
      >
        <span className="htv-subject-folder-icon" style={{ color: subject.color }}>
          {open ? <FolderOpen size={20} /> : <Folder size={20} />}
        </span>

        <div className="htv-subject-info">
          <span className="htv-subject-name">{subject.name}</span>
          <span className="htv-subject-sub">
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} ·{' '}
            {totalQuestions} questions
          </span>
        </div>

        <span className="htv-subject-chevron">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {open && (
        <div className="htv-subject-body">
          {chapters.length > 0 ? (
            chapters.map(chapter => (
              <ChapterFolder
                key={chapter.id}
                chapter={chapter}
                topics={topicsByChapter[chapter.id] || []}
                topicQuestionCount={topicQuestionCount}
                chapterQuestionCount={chapterQuestionCount[chapter.id] || 0}
                loadedChapters={loadedChapters}
                onLoadChapter={onLoadChapter}
                onClick={onClick}
                onUpdated={onUpdated}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <p className="htv-chapter-empty">No chapters in this subject yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root component                                                       */
/* ------------------------------------------------------------------ */
export default function HierarchyQuestionView({
  subjects,
  chapters,
  topics,
  chapterQuestionCount,
  topicQuestionCount,
  loadedChapters,
  onLoadChapter,
  onClick,
  onUpdated,
  onEdit,
  onDelete,
}) {
  // Build lookup maps from flat arrays (computed once, memoised)
  const chaptersBySubject = useMemo(() => {
    const map = {};
    chapters.forEach(c => {
      if (!map[c.subject_id]) map[c.subject_id] = [];
      map[c.subject_id].push(c);
    });
    return map;
  }, [chapters]);

  const topicsByChapter = useMemo(() => {
    const map = {};
    topics.forEach(t => {
      if (!map[t.chapter_id]) map[t.chapter_id] = [];
      map[t.chapter_id].push(t);
    });
    return map;
  }, [topics]);

  if (!subjects.length) {
    return (
      <div className="htv-empty">
        <Folder size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No subjects to display.
        </p>
      </div>
    );
  }

  return (
    <div className="htv-root">
      {subjects.map(subject => (
        <SubjectFolder
          key={subject.id}
          subject={subject}
          chapters={chaptersBySubject[subject.id] || []}
          topicsByChapter={topicsByChapter}
          topicQuestionCount={topicQuestionCount}
          chapterQuestionCount={chapterQuestionCount}
          loadedChapters={loadedChapters}
          onLoadChapter={onLoadChapter}
          onClick={onClick}
          onUpdated={onUpdated}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
