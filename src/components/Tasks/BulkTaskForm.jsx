import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import SubjectSelector from '../Hierarchy/SubjectSelector';
import ChapterSelector from '../Hierarchy/ChapterSelector';
import TopicSelector from '../Hierarchy/TopicSelector';
import SubTopicSelector from '../Hierarchy/SubTopicSelector';
import { fetchSubjects } from '../../hooks/useSubjects';
import { fetchChapters } from '../../hooks/useChapters';
import { fetchTopics } from '../../hooks/useTopics';
import { fetchSubTopics } from '../../hooks/useSubTopics';
import { createBulkTasks } from '../../hooks/useTasks';
import { PRIORITY_LEVELS, PRIORITY_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function BulkTaskForm({ isOpen, onClose, onSaved }) {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subTopics, setSubTopics] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState(null);

  const [taskTitles, setTaskTitles] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRevision, setIsRevision] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSubjects().then(setSubjects).catch(() => {});
      setSelectedSubject(null);
      setSelectedChapter(null);
      setSelectedTopic(null);
      setSelectedSubTopic(null);
      setTaskTitles('');
      setPriority('');
      setDueDate('');
      setIsRevision(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedSubject) fetchChapters(selectedSubject.id).then(setChapters);
    else setChapters([]);
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter) fetchTopics(selectedChapter.id).then(setTopics);
    else setTopics([]);
  }, [selectedChapter]);

  useEffect(() => {
    if (selectedTopic) fetchSubTopics(selectedTopic.id).then(setSubTopics);
    else setSubTopics([]);
  }, [selectedTopic]);

  async function handleSave() {
    const lines = taskTitles.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error('Enter at least one task title'); return; }
    if (!selectedSubject || !selectedChapter || !selectedTopic) {
      toast.error('Please select Subject, Chapter and Topic');
      return;
    }

    setSaving(true);
    try {
      const tasks = lines.map((title) => ({
        subject_id: selectedSubject.id,
        chapter_id: selectedChapter.id,
        topic_id: selectedTopic.id,
        sub_topic_id: selectedSubTopic?.id || null,
        title,
        priority: priority || null,
        due_date: dueDate || null,
        is_revision: isRevision,
      }));

      const created = await createBulkTasks(tasks);
      toast.success(`${created.length} tasks created!`);
      onSaved(created);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create tasks');
    } finally {
      setSaving(false);
    }
  }

  const lineCount = taskTitles.split('\n').filter((l) => l.trim()).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Add Tasks"
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !taskTitles.trim() || !selectedSubject || !selectedChapter || !selectedTopic}
            id="bulk-save-btn"
          >
            {saving ? 'Creating...' : `Create ${lineCount > 0 ? lineCount : ''} Task${lineCount !== 1 ? 's' : ''}`}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Step 1: Hierarchy */}
        <div className="form-group">
          <p className="form-label">Step 1: Select Subject</p>
          <SubjectSelector
            subjects={subjects}
            value={selectedSubject}
            onChange={(s) => { setSelectedSubject(s); setSelectedChapter(null); setSelectedTopic(null); setSelectedSubTopic(null); }}
            onSubjectCreated={(s) => setSubjects((prev) => [...prev, s])}
          />
        </div>

        {selectedSubject && (
          <div className="form-group">
            <p className="form-label">Step 2: Select Chapter</p>
            <ChapterSelector
              chapters={chapters}
              value={selectedChapter}
              onChange={(c) => { setSelectedChapter(c); setSelectedTopic(null); setSelectedSubTopic(null); }}
              subjectId={selectedSubject.id}
              onChapterCreated={(c) => setChapters((prev) => [...prev, c])}
            />
          </div>
        )}

        {selectedChapter && (
          <div className="form-group">
            <p className="form-label">Step 3: Select Topic</p>
            <TopicSelector
              topics={topics}
              value={selectedTopic}
              onChange={(t) => { setSelectedTopic(t); setSelectedSubTopic(null); }}
              chapterId={selectedChapter.id}
              onTopicCreated={(t) => setTopics((prev) => [...prev, t])}
            />
          </div>
        )}

        {selectedTopic && (
          <div className="form-group">
            <p className="form-label">Step 4: Select Sub-topic (optional)</p>
            <SubTopicSelector
              subTopics={subTopics}
              value={selectedSubTopic}
              onChange={setSelectedSubTopic}
              topicId={selectedTopic.id}
              onSubTopicCreated={(st) => setSubTopics((prev) => [...prev, st])}
              onSkip={() => setSelectedSubTopic(null)}
            />
          </div>
        )}

        {selectedTopic && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="bulk-task-titles">
                Task Titles — one per line ({lineCount} tasks)
              </label>
              <textarea
                id="bulk-task-titles"
                className="form-textarea"
                placeholder={`Read Chapter 3\nSolve exercises 1-10\nWatch video lecture\nMake revision notes`}
                value={taskTitles}
                onChange={(e) => setTaskTitles(e.target.value)}
                style={{ minHeight: '140px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="bulk-priority">Priority (shared, optional)</label>
                <select id="bulk-priority" className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="">No priority</option>
                  {PRIORITY_LEVELS.map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="bulk-due">Due Date (shared, optional)</label>
                <input id="bulk-due" className="form-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <label className="toggle-wrapper" htmlFor="bulk-revision">
              <div className="toggle">
                <input id="bulk-revision" type="checkbox" checked={isRevision} onChange={(e) => setIsRevision(e.target.checked)} />
                <span className="toggle-slider" />
              </div>
              <span style={{ fontSize: '0.875rem' }}>Mark all for Revision</span>
            </label>
          </>
        )}
      </div>
    </Modal>
  );
}
