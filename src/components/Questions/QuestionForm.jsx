import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import SubjectSelector from '../Hierarchy/SubjectSelector';
import ChapterSelector from '../Hierarchy/ChapterSelector';
import TopicSelector from '../Hierarchy/TopicSelector';
import { fetchSubjects } from '../../hooks/useSubjects';
import { fetchChapters } from '../../hooks/useChapters';
import { fetchTopics } from '../../hooks/useTopics';
import { createQuestion, updateQuestion } from '../../hooks/useQuestions';
import { Check, ChevronLeft, ChevronRight, Plus, X, Code2, BookOpen, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['Subject', 'Chapter', 'Topic', 'Question'];

const LANGUAGES = ['python', 'javascript', 'java', 'c++', 'c', 'go', 'typescript', 'rust', 'kotlin', 'swift', 'text'];

function Breadcrumb({ parts }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: '0.75rem', color: 'var(--text-muted)',
      padding: '7px 10px',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 'var(--radius-sm)',
      flexWrap: 'wrap',
    }}>
      {parts.map((p, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ opacity: 0.4 }}>›</span>}
          {p.color && <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block' }} />}
          <span style={{ color: p.color || 'var(--text-secondary)', fontWeight: 500 }}>{p.name}</span>
        </span>
      ))}
    </div>
  );
}

export default function QuestionForm({ isOpen, onClose, onSaved, editQuestion }) {
  const [step, setStep] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics,   setTopics]   = useState([]);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedTopic,   setSelectedTopic]   = useState(null);

  // Question detail fields
  const [title,       setTitle]       = useState('');
  const [explanation, setExplanation] = useState('');
  const [examples,    setExamples]    = useState([{ text: '' }]);
  const [ioExamples,  setIoExamples]  = useState([{ input: '', output: '' }]);
  const [solutions,   setSolutions]   = useState([{ language: 'python', code: '' }]);
  const [saving, setSaving] = useState(false);

  // ── Loaders ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    fetchSubjects().then(setSubjects).catch(() => {});
    if (editQuestion) {
      setSelectedSubject(editQuestion.subjects || null);
      setSelectedChapter(editQuestion.chapters || null);
      setSelectedTopic(editQuestion.topics     || null);
      setTitle(editQuestion.title         || '');
      setExplanation(editQuestion.explanation  || '');
      setExamples((editQuestion.examples  || []).length ? editQuestion.examples  : [{ text: '' }]);
      setIoExamples((editQuestion.io_examples || []).length ? editQuestion.io_examples : [{ input: '', output: '' }]);
      setSolutions((editQuestion.solutions || []).length ? editQuestion.solutions : [{ language: 'python', code: '' }]);
      setStep(3);
    } else {
      resetForm();
    }
  }, [isOpen, editQuestion]);

  useEffect(() => {
    if (selectedSubject) fetchChapters(selectedSubject.id).then(setChapters).catch(() => {});
    else setChapters([]);
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter) fetchTopics(selectedChapter.id).then(setTopics).catch(() => {});
    else setTopics([]);
  }, [selectedChapter]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function resetForm() {
    setStep(0);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setTitle('');
    setExplanation('');
    setExamples([{ text: '' }]);
    setIoExamples([{ input: '', output: '' }]);
    setSolutions([{ language: 'python', code: '' }]);
  }

  function handleClose() { resetForm(); onClose(); }

  function canGoNext() {
    if (step === 0) return !!selectedSubject;
    if (step === 1) return !!selectedChapter;
    if (step === 2) return !!selectedTopic;
    return false;
  }

  function goNext() { setStep((s) => Math.min(s + 1, 3)); }
  function goPrev() { setStep((s) => Math.max(s - 1, 0)); }

  // ── Dynamic list helpers ──────────────────────────────────────────────────
  function addExample()    { setExamples((p)   => [...p, { text: '' }]); }
  function removeExample(i){ setExamples((p)   => p.filter((_, idx) => idx !== i)); }
  function updateExample(i, val) { setExamples((p) => p.map((e, idx) => idx === i ? { ...e, text: val } : e)); }

  function addIo()    { setIoExamples((p)   => [...p, { input: '', output: '' }]); }
  function removeIo(i){ setIoExamples((p)   => p.filter((_, idx) => idx !== i)); }
  function updateIo(i, key, val) { setIoExamples((p) => p.map((e, idx) => idx === i ? { ...e, [key]: val } : e)); }

  function addSolution()    { setSolutions((p)   => [...p, { language: 'python', code: '' }]); }
  function removeSolution(i){ setSolutions((p)   => p.filter((_, idx) => idx !== i)); }
  function updateSolution(i, key, val) { setSolutions((p) => p.map((s, idx) => idx === i ? { ...s, [key]: val } : s)); }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!title.trim()) { toast.error('Question title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        subject_id:  selectedSubject?.id || null,
        chapter_id:  selectedChapter?.id || null,
        topic_id:    selectedTopic?.id   || null,
        title:       title.trim(),
        explanation: explanation.trim() || null,
        examples:    examples.filter((e) => e.text.trim()),
        io_examples: ioExamples.filter((e) => e.input.trim() || e.output.trim()),
        solutions:   solutions.filter((s) => s.code.trim()),
      };
      let saved;
      if (editQuestion) {
        saved = await updateQuestion(editQuestion.id, payload);
        toast.success('Question updated!');
      } else {
        saved = await createQuestion(payload);
        toast.success('Question created!');
      }
      onSaved(saved, !!editQuestion);
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  }

  const accent = selectedSubject?.color;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editQuestion ? 'Edit Question' : 'New Question'}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button
            className="btn btn-secondary"
            onClick={editQuestion ? handleClose : goPrev}
            disabled={(step === 0 && !editQuestion) || saving}
            style={{ minWidth: 100 }}
          >
            {editQuestion ? 'Cancel' : <><ChevronLeft size={15} /> Back</>}
          </button>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {step < 3 && (
              <button
                className="btn btn-primary"
                onClick={goNext}
                disabled={!canGoNext()}
                id="qform-next-btn"
                style={{ minWidth: 100 }}
              >
                Next <ChevronRight size={15} />
              </button>
            )}
            {step === 3 && (
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !title.trim()}
                id="qform-save-btn"
                style={{ minWidth: 130 }}
              >
                {saving ? 'Saving…' : editQuestion ? 'Update Question' : 'Create Question'}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Wizard step indicator */}
      {!editQuestion && (
        <div style={{ marginBottom: 4 }}>
          <div className="wizard-steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`wizard-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                <div className="wizard-step-circle">
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <span className="wizard-step-label">{s}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--border-glass)', margin: '0 -32px 4px' }} />
        </div>
      )}

      {/* ── Step 0: Subject ───────────────────────────── */}
      {step === 0 && (
        <div className="slide-up tf-step-card">
          <p className="tf-step-label">Select or create a subject</p>
          <SubjectSelector
            subjects={subjects}
            value={selectedSubject}
            onChange={(s) => { setSelectedSubject(s); setSelectedChapter(null); setSelectedTopic(null); }}
            onSubjectCreated={(s) => setSubjects((p) => [...p, s])}
          />
        </div>
      )}

      {/* ── Step 1: Chapter ──────────────────────────── */}
      {step === 1 && (
        <div className="slide-up tf-step-card">
          <Breadcrumb parts={[{ name: selectedSubject?.name, color: accent }]} />
          <p className="tf-step-label" style={{ marginTop: 16 }}>Select or create a chapter</p>
          <ChapterSelector
            chapters={chapters}
            value={selectedChapter}
            onChange={(c) => { setSelectedChapter(c); setSelectedTopic(null); }}
            subjectId={selectedSubject?.id}
            onChapterCreated={(c) => setChapters((p) => [...p, c])}
            accentColor={accent}
          />
        </div>
      )}

      {/* ── Step 2: Topic ───────────────────────────── */}
      {step === 2 && (
        <div className="slide-up tf-step-card">
          <Breadcrumb parts={[
            { name: selectedSubject?.name, color: accent },
            { name: selectedChapter?.name },
          ]} />
          <p className="tf-step-label" style={{ marginTop: 16 }}>Select or create a topic</p>
          <TopicSelector
            topics={topics}
            value={selectedTopic}
            onChange={(t) => setSelectedTopic(t)}
            chapterId={selectedChapter?.id}
            onTopicCreated={(t) => setTopics((p) => [...p, t])}
            accentColor={accent}
          />
        </div>
      )}

      {/* ── Step 3: Question Details ─────────────────── */}
      {step === 3 && (
        <div className="slide-up question-form-details">
          {!editQuestion && (
            <Breadcrumb parts={[
              { name: selectedSubject?.name, color: accent },
              { name: selectedChapter?.name },
              { name: selectedTopic?.name },
            ]} />
          )}

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="q-title">Question Title *</label>
            <input
              id="q-title"
              className="form-input"
              placeholder="e.g. Find the longest increasing subsequence"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Explanation */}
          <div className="form-group">
            <label className="form-label" htmlFor="q-explanation">Explanation</label>
            <textarea
              id="q-explanation"
              className="form-textarea"
              placeholder="Describe the problem, constraints, and approach…"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              style={{ minHeight: 80 }}
            />
          </div>

          {/* Examples */}
          <div className="form-group">
            <div className="qf-field-header">
              <label className="form-label" style={{ margin: 0 }}>
                <BookOpen size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                Examples
              </label>
              <button type="button" className="btn btn-ghost btn-sm qf-add-btn" onClick={addExample}>
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="qf-list">
              {examples.map((ex, i) => (
                <div key={i} className="qf-list-row">
                  <textarea
                    className="form-textarea qf-list-textarea"
                    placeholder={`Example ${i + 1}…`}
                    value={ex.text}
                    onChange={(e) => updateExample(i, e.target.value)}
                    rows={2}
                  />
                  {examples.length > 1 && (
                    <button type="button" className="btn btn-ghost btn-icon qf-remove-btn" onClick={() => removeExample(i)} aria-label="Remove">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* I/O Examples */}
          <div className="form-group">
            <div className="qf-field-header">
              <label className="form-label" style={{ margin: 0 }}>
                <Layers size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                Input / Output Examples
              </label>
              <button type="button" className="btn btn-ghost btn-sm qf-add-btn" onClick={addIo}>
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="qf-list">
              {ioExamples.map((io, i) => (
                <div key={i} className="qf-io-row">
                  <div className="qf-io-pair">
                    <div className="qf-io-side">
                      <span className="qf-io-label">Input</span>
                      <textarea
                        className="form-textarea qf-io-textarea"
                        placeholder="Input value…"
                        value={io.input}
                        onChange={(e) => updateIo(i, 'input', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="qf-io-arrow-icon">→</div>
                    <div className="qf-io-side">
                      <span className="qf-io-label">Output</span>
                      <textarea
                        className="form-textarea qf-io-textarea"
                        placeholder="Expected output…"
                        value={io.output}
                        onChange={(e) => updateIo(i, 'output', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                  {ioExamples.length > 1 && (
                    <button type="button" className="btn btn-ghost btn-icon qf-remove-btn" onClick={() => removeIo(i)} aria-label="Remove">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div className="form-group">
            <div className="qf-field-header">
              <label className="form-label" style={{ margin: 0 }}>
                <Code2 size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                Solutions
              </label>
              <button type="button" className="btn btn-ghost btn-sm qf-add-btn" onClick={addSolution}>
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="qf-list">
              {solutions.map((sol, i) => (
                <div key={i} className="qf-solution-block">
                  <div className="qf-solution-top">
                    <select
                      className="form-select qf-lang-select"
                      value={sol.language}
                      onChange={(e) => updateSolution(i, 'language', e.target.value)}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <span className="qf-solution-num">Solution {i + 1}</span>
                    {solutions.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-icon qf-remove-btn" onClick={() => removeSolution(i)} aria-label="Remove">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <textarea
                    className="form-textarea qf-code-textarea"
                    placeholder={`# Write your ${sol.language} solution here…`}
                    value={sol.code}
                    onChange={(e) => updateSolution(i, 'code', e.target.value)}
                    rows={5}
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
