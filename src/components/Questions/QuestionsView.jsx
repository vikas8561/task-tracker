import { useState, useEffect, useCallback } from 'react';
import { BrainCircuit } from 'lucide-react';
import './questions.css';
import toast from 'react-hot-toast';
import { fetchQuestions, deleteQuestion } from '../../hooks/useQuestions';
import { fetchHierarchyMeta } from '../../hooks/useHierarchy';
import { useAuth } from '../../context/AuthContext';
import HierarchyQuestionView from './HierarchyQuestionView';
import QuestionForm from './QuestionForm';
import QuestionDetailModal from './QuestionDetailModal';
import QuestionMarkdownImport from './QuestionMarkdownImport';

// ── Tiny loading spinner ──────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-10)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--border-glass)',
        borderTopColor: 'var(--accent-1)',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

export default function QuestionsView({ showFormProp, onFormClose, showImportProp, onImportClose }) {
  const { isAdmin } = useAuth();

  // Data
  const [questions,  setQuestions]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Hierarchy Data
  const [hierarchy, setHierarchy] = useState({ subjects: [], chapters: [], topics: [] });
  const [loadedChapters, setLoadedChapters] = useState({});
  const [chapterQuestionCount, setChapterQuestionCount] = useState({});
  const [topicQuestionCount, setTopicQuestionCount] = useState({});

  // Modals
  const [showForm,         setShowForm]         = useState(false);
  const [showImport,       setShowImport]       = useState(false);
  const [editQuestion,     setEditQuestion]     = useState(null);
  const [detailQuestion,   setDetailQuestion]   = useState(null);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const [qs, meta] = await Promise.all([
        fetchQuestions(),
        fetchHierarchyMeta(),
      ]);
      setQuestions(qs);
      
      // Group all loaded questions by chapter
      const lc = {};
      const cQC = {};
      const tQC = {};
      const sQC = {};
      
      qs.forEach(q => {
        if (!lc[q.chapter_id]) lc[q.chapter_id] = [];
        lc[q.chapter_id].push(q);
        
        cQC[q.chapter_id] = (cQC[q.chapter_id] || 0) + 1;
        tQC[q.topic_id] = (tQC[q.topic_id] || 0) + 1;
        sQC[q.subject_id] = (sQC[q.subject_id] || 0) + 1;
      });

      // Filter out empty hierarchy items
      const activeSubjects = (meta?.subjects || []).filter(s => sQC[s.id] > 0);
      const activeChapters = (meta?.chapters || []).filter(c => cQC[c.id] > 0);
      const activeTopics   = (meta?.topics || []).filter(t => tQC[t.id] > 0);

      setHierarchy({
        subjects: activeSubjects,
        chapters: activeChapters,
        topics: activeTopics,
      });

      setLoadedChapters(lc);
      setChapterQuestionCount(cQC);
      setTopicQuestionCount(tQC);

    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // Open modals from navbar buttons
  useEffect(() => { if (showFormProp)   setShowForm(true); },   [showFormProp]);
  useEffect(() => { if (showImportProp) setShowImport(true); }, [showImportProp]);


  // ── CRUD handlers ─────────────────────────────────────────────────────────
  function handleSaved(saved, isEdit) {
    // A full reload ensures hierarchy counts update correctly.
    // Alternatively, we could update the arrays locally, but reloading is safer
    // since question might have changed chapters or topics.
    loadQuestions();
  }

  function handleImported() {
    loadQuestions();
  }

  function openEdit(q) {
    setDetailQuestion(null);
    setEditQuestion(q);
    setShowForm(true);
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteQuestion(confirmDelete.id);
      if (detailQuestion?.id === confirmDelete.id) setDetailQuestion(null);
      toast.success('Question deleted');
      loadQuestions();
    } catch {
      toast.error('Failed to delete question');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  return (
    <div className="questions-view page-content">
      {/* ── Main content ──────────────────────────────────────────────── */}
      {loading ? (
        <Spinner />
      ) : questions.length === 0 && hierarchy.subjects.length === 0 ? (
        <div className="questions-empty">
          <div className="questions-empty-icon">🧠</div>
          <h2>No questions yet</h2>
          <p>
            {isAdmin
              ? 'Use "Import MD" or "New Question" in the navbar to get started.'
              : 'Questions will appear here once they are added.'}
          </p>
        </div>
      ) : (
        <HierarchyQuestionView
          subjects={hierarchy.subjects}
          chapters={hierarchy.chapters}
          topics={hierarchy.topics}
          chapterQuestionCount={chapterQuestionCount}
          topicQuestionCount={topicQuestionCount}
          loadedChapters={loadedChapters}
          onLoadChapter={() => {}} // No-op, all questions are pre-loaded!
          onClick={(q) => setDetailQuestion(q)}
          onUpdated={loadQuestions}
          onEdit={(q) => openEdit(q)}
          onDelete={(q) => setConfirmDelete(q)}
        />
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <QuestionForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditQuestion(null); onFormClose?.(); }}
        onSaved={(saved, isEdit) => { handleSaved(saved, isEdit); setShowForm(false); setEditQuestion(null); onFormClose?.(); }}
        editQuestion={editQuestion}
      />

      <QuestionMarkdownImport
        isOpen={showImport}
        onClose={() => { setShowImport(false); onImportClose?.(); }}
        onImported={handleImported}
      />

      {detailQuestion && (
        <QuestionDetailModal
          question={detailQuestion}
          onClose={() => setDetailQuestion(null)}
          onEdit={() => openEdit(detailQuestion)}
          isAdmin={isAdmin}
        />
      )}

      {/* ── Confirm Delete Dialog ────────────────────────────────────── */}
      {confirmDelete && (
        <div className="notes-confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="notes-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="notes-confirm-icon-wrapper">
              <BrainCircuit size={24} color="var(--danger)" />
            </div>
            <h3>Delete Question</h3>
            <p>Are you sure you want to delete <strong>"{confirmDelete.title}"</strong>? This action cannot be undone.</p>
            <div className="notes-confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</button>
              <button
                className="btn"
                style={{ background: 'var(--danger)', color: 'white' }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
