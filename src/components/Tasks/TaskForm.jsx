import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import SubjectSelector from '../Hierarchy/SubjectSelector';
import ChapterSelector from '../Hierarchy/ChapterSelector';
import TopicSelector from '../Hierarchy/TopicSelector';
import SubTopicSelector from '../Hierarchy/SubTopicSelector';
import { fetchSubjects } from '../../hooks/useSubjects';
import { fetchChapters } from '../../hooks/useChapters';
import { fetchTopics } from '../../hooks/useTopics';
import { getOrCreateSubTopic } from '../../hooks/useSubTopics';
import { createTask, createBulkTasks, updateTask } from '../../hooks/useTasks';
import { PRIORITY_LEVELS, PRIORITY_LABELS } from '../../utils/constants';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

// Normal flow:  Subject(0) → Chapter(1) → Topic(2) → Sub-topics(3)  → auto-creates all tasks
// Skip flow:    Subject(0) → Chapter(1) → Topic(2) → Sub-topics(3) → Details(4) → manual save
const STEPS = ['Subject', 'Chapter', 'Topic', 'Sub-topics', 'Details'];

export default function TaskForm({ isOpen, onClose, onSaved, editTask }) {
  const [step, setStep] = useState(0);
  const [subjects, setSubjects]   = useState([]);
  const [chapters, setChapters]   = useState([]);
  const [topics,   setTopics]     = useState([]);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedTopic,   setSelectedTopic]   = useState(null);

  // Details-step fields (skip path only)
  const [title,      setTitle]      = useState('');
  const [description,setDescription]= useState('');
  const [priority,   setPriority]   = useState('');
  const [dueDate,    setDueDate]    = useState('');
  const [isRevision, setIsRevision] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Loaders ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    fetchSubjects().then(setSubjects).catch(() => {});
    if (editTask) {
      setSelectedSubject(editTask.subjects || null);
      setSelectedChapter(editTask.chapters || null);
      setSelectedTopic(editTask.topics   || null);
      setTitle(editTask.title       || '');
      setDescription(editTask.description || '');
      setPriority(editTask.priority  || '');
      setDueDate(editTask.due_date  || '');
      setIsRevision(editTask.is_revision || false);
      setStep(4);
    } else {
      resetForm();
    }
  }, [isOpen, editTask]);

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
    setTitle(''); setDescription(''); setPriority(''); setDueDate(''); setIsRevision(false);
  }

  function handleClose() { resetForm(); onClose(); }

  function canGoNext() {
    if (step === 0) return !!selectedSubject;
    if (step === 1) return !!selectedChapter;
    if (step === 2) return !!selectedTopic;
    return false;
  }

  function goNext() { setStep((s) => Math.min(s + 1, 4)); }
  function goPrev() { setStep((s) => Math.max(s - 1, 0)); }

  // ── Bulk create tasks for all sub-topic names typed in step 3 ────────────
  async function handleCreateAll(names) {
    if (!names.length) return;
    setSaving(true);
    try {
      // 1. Ensure sub-topic records exist (getOrCreate each name)
      const subTopics = await Promise.all(
        names.map((name) => getOrCreateSubTopic(selectedTopic.id, name))
      );

      // 2. Build task rows
      const base = {
        subject_id:  selectedSubject?.id,
        chapter_id:  selectedChapter?.id,
        topic_id:    selectedTopic?.id,
        description: null,
        priority:    null,
        due_date:    null,
        is_revision: false,
      };

      const taskRows = subTopics.map((st) => ({
        ...base,
        sub_topic_id: st.id,
        title:        st.name,   // sub-topic name IS the task title
      }));

      // 3. Bulk insert
      const created = await createBulkTasks(taskRows);
      toast.success(`✓ ${created.length} task${created.length !== 1 ? 's' : ''} created!`);

      // Notify parent for each task
      created.forEach((t) => onSaved(t, false));
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create tasks');
    } finally {
      setSaving(false);
    }
  }

  // ── Save (details / edit path) ────────────────────────────────────────────
  async function handleSave() {
    if (!title.trim()) { toast.error('Task title is required'); return; }
    setSaving(true);
    try {
      const taskData = {
        subject_id:  selectedSubject?.id,
        chapter_id:  selectedChapter?.id,
        topic_id:    selectedTopic?.id,
        sub_topic_id: null,
        title:       title.trim(),
        description: description.trim() || null,
        priority:    priority || null,
        due_date:    dueDate  || null,
        is_revision: isRevision,
      };
      let saved;
      if (editTask) {
        saved = await updateTask(editTask.id, taskData);
        toast.success('Task updated!');
      } else {
        saved = await createTask(taskData);
        toast.success('Task created!');
      }
      onSaved(saved, !!editTask);
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  }

  // Accent color follows selected subject for visual continuity
  const accent = selectedSubject?.color;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editTask ? 'Edit Task' : 'New Task'}
      size="lg"
    >
      {/* Wizard step indicator */}
      {!editTask && (
        <div style={{ marginBottom: 4 }}>
          <div className="wizard-steps">
            {STEPS.slice(0, step === 4 ? 5 : 4).map((s, i) => (
              <div key={s} className={`wizard-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                <div className="wizard-step-circle">
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <span className="wizard-step-label">{s}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 -32px 4px' }} />
        </div>
      )}

      {/* ── Step 0 : Subject ─────────────────────────────── */}
      {step === 0 && (
        <div className="slide-up tf-step-card">
          <p className="tf-step-label">Select or create a subject</p>
          <SubjectSelector
            subjects={subjects}
            value={selectedSubject}
            onChange={(s) => {
              setSelectedSubject(s);
              setSelectedChapter(null);
              setSelectedTopic(null);
            }}
            onSubjectCreated={(s) => setSubjects((p) => [...p, s])}
          />
        </div>
      )}

      {/* ── Step 1 : Chapter ─────────────────────────────── */}
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

      {/* ── Step 2 : Topic ───────────────────────────────── */}
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

      {/* ── Step 3 : Sub-topics ──────────────────────────── */}
      {step === 3 && (
        <div className="slide-up tf-step-card">
          <Breadcrumb parts={[
            { name: selectedSubject?.name, color: accent },
            { name: selectedChapter?.name },
            { name: selectedTopic?.name },
          ]} />
          <p className="tf-step-label" style={{ marginTop: 16 }}>Add sub-topics</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
            Type each sub-topic name and press{' '}
            <kbd style={{ fontSize: '0.72rem', padding: '2px 6px', background: 'rgba(0,0,0,0.1)', borderRadius: 4, fontFamily: 'inherit' }}>Enter</kbd>.
            {' '}One task will be created per sub-topic.
          </p>
          <SubTopicSelector
            topicId={selectedTopic?.id}
            onCreateAll={handleCreateAll}
            onSkip={goNext}
            saving={saving}
          />
        </div>
      )}

      {/* ── Step 4 : Details (skip path / edit) ──────────── */}
      {step === 4 && (
        <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {!editTask && (
            <Breadcrumb parts={[
              { name: selectedSubject?.name, color: accent },
              { name: selectedChapter?.name },
              { name: selectedTopic?.name },
            ]} />
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              className="form-input"
              placeholder="e.g. Read chapter 3 and make notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              className="form-textarea"
              placeholder="Additional notes…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">Priority (optional)</label>
              <select
                id="task-priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">No priority</option>
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-due-date">Due Date (optional)</label>
              <input
                id="task-due-date"
                className="form-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <label className="toggle-wrapper" htmlFor="task-revision">
            <div className="toggle">
              <input
                id="task-revision"
                type="checkbox"
                checked={isRevision}
                onChange={(e) => setIsRevision(e.target.checked)}
              />
              <span className="toggle-slider" />
            </div>
            <span style={{ fontSize: '0.875rem' }}>Mark for Revision</span>
          </label>
        </div>
      )}

      {/* ── Footer navigation ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 4 }}>
        <button
          className="btn btn-secondary"
          onClick={editTask ? handleClose : goPrev}
          disabled={(step === 0 && !editTask) || saving}
          style={{ minWidth: 100 }}
        >
          {editTask ? 'Cancel' : <><ChevronLeft size={15} /> Back</>}
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {/* Steps 0-2: show Next */}
          {step < 3 && (
            <button
              className="btn btn-primary"
              onClick={goNext}
              disabled={!canGoNext()}
              id="wizard-next-btn"
              style={{ minWidth: 100 }}
            >
              Next <ChevronRight size={15} />
            </button>
          )}
          {/* Step 4 (skip/edit): show Save */}
          {step === 4 && (
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              id="task-save-btn"
              style={{ minWidth: 120 }}
            >
              {saving ? 'Saving…' : editTask ? 'Update Task' : 'Create Task'}
            </button>
          )}
          {/* Step 3: no Next — SubTopicSelector has its own Create button */}
        </div>
      </div>
    </Modal>
  );
}

// ── Tiny breadcrumb component ────────────────────────────────────────────────
function Breadcrumb({ parts }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: '0.75rem', color: 'var(--text-muted)',
      padding: '7px 10px',
      background: 'rgba(0,0,0,0.04)',
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
