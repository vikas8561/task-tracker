import { useState, useRef } from 'react';
import Modal from '../common/Modal';
import { parseMarkdown, getParseStats } from '../../utils/markdownParser';
import { fetchSubjects, getOrCreateSubject } from '../../hooks/useSubjects';
import { getOrCreateChapter } from '../../hooks/useChapters';
import { getOrCreateTopic } from '../../hooks/useTopics';
import { getOrCreateSubTopic } from '../../hooks/useSubTopics';
import { createBulkTasks } from '../../hooks/useTasks';
import { Upload, FileText, AlertCircle, Check } from 'lucide-react';
import { SUBJECT_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';

const EXAMPLE_MD = `# Subject: Physics

## Chapter: Mechanics
### Topic: Newton's Laws
#### Sub-topic: First Law of Motion
- [ ] Read about inertia and rest | priority: high | due: 2026-06-20 | revision: true
- [ ] Solve numerical problems on inertia | priority: medium

### Topic: Work, Energy & Power
- [ ] Study kinetic energy derivation | priority: low
- [ ] Solve worksheet problems

## Chapter: Thermodynamics
### Topic: Laws of Thermodynamics
- [ ] Read about Zeroth Law | priority: medium | due: 2026-06-25`;

export default function MarkdownImport({ isOpen, onClose, onImported }) {
  const [content, setContent] = useState('');
  const [parsed, setParsed] = useState(null);
  const [stats, setStats] = useState(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  function handleContentChange(text) {
    setContent(text);
    if (text.trim()) {
      const tasks = parseMarkdown(text);
      setParsed(tasks);
      setStats(getParseStats(tasks));
    } else {
      setParsed(null);
      setStats(null);
    }
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => handleContentChange(e.target.result);
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.md') || file?.type === 'text/markdown' || file?.type === 'text/plain') {
      handleFile(file);
    } else {
      toast.error('Please upload a .md file');
    }
  }

  async function handleImport() {
    if (!parsed?.length) return;
    setImporting(true);
    try {
      // Build hierarchy mappings
      const subjectCache = {};
      const chapterCache = {};
      const topicCache = {};
      const subTopicCache = {};

      const colorPool = [...SUBJECT_COLORS];
      let colorIdx = 0;

      const tasksToCreate = [];
      for (const t of parsed) {
        // Subject
        let subject = subjectCache[t.subjectName];
        if (!subject) {
          subject = await getOrCreateSubject(t.subjectName, colorPool[colorIdx % colorPool.length]);
          colorIdx++;
          subjectCache[t.subjectName] = subject;
        }

        // Chapter
        const chapKey = `${t.subjectName}::${t.chapterName}`;
        let chapter = chapterCache[chapKey];
        if (!chapter) {
          chapter = await getOrCreateChapter(subject.id, t.chapterName);
          chapterCache[chapKey] = chapter;
        }

        // Topic
        const topicKey = `${chapKey}::${t.topicName}`;
        let topic = topicCache[topicKey];
        if (!topic) {
          topic = await getOrCreateTopic(chapter.id, t.topicName);
          topicCache[topicKey] = topic;
        }

        // Sub-topic (optional)
        let subTopic = null;
        if (t.subTopicName) {
          const stKey = `${topicKey}::${t.subTopicName}`;
          subTopic = subTopicCache[stKey];
          if (!subTopic) {
            subTopic = await getOrCreateSubTopic(topic.id, t.subTopicName);
            subTopicCache[stKey] = subTopic;
          }
        }

        tasksToCreate.push({
          subject_id: subject.id,
          chapter_id: chapter.id,
          topic_id: topic.id,
          sub_topic_id: subTopic?.id || null,
          title: t.title,
          priority: t.priority || null,
          due_date: t.due_date || null,
          is_revision: t.is_revision || false,
          is_completed: t.is_completed || false,
          completed_at: t.completed_at || null,
        });
      }

      const created = await createBulkTasks(tasksToCreate);
      toast.success(`Imported ${created.length} tasks successfully!`);
      onImported(created);
      setContent('');
      setParsed(null);
      setStats(null);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function loadExample() {
    handleContentChange(EXAMPLE_MD);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { setContent(''); setParsed(null); setStats(null); onClose(); }}
      title="Import Tasks from Markdown"
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={importing || !parsed?.length}
            id="import-confirm-btn"
          >
            {importing ? 'Importing...' : `Import ${parsed?.length || 0} Tasks`}
          </button>
        </>
      }
    >
      {/* Drop Zone */}
      <div
        className={`dropzone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        id="md-dropzone"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".md,.txt"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <Upload size={28} className="dropzone-icon" />
        <p style={{ fontWeight: 600 }}>Drop your .md file here or click to browse</p>
        <p style={{ fontSize: '0.8rem' }}>Supports .md and .txt files</p>
      </div>

      {/* Or paste */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className="form-label">Or paste markdown content</p>
          <button className="btn btn-ghost btn-sm" onClick={loadExample} style={{ fontSize: '0.75rem' }}>
            Load Example
          </button>
        </div>
        <textarea
          className="form-textarea"
          placeholder="Paste your markdown here..."
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '0.82rem' }}
          id="md-paste-area"
        />
      </div>

      {/* Preview Stats */}
      {stats && (
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          display: 'flex',
          gap: 'var(--space-6)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Check size={14} color="var(--success)" />
            <span style={{ fontSize: '0.85rem' }}><strong>{stats.subjects}</strong> Subject{stats.subjects !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Check size={14} color="var(--success)" />
            <span style={{ fontSize: '0.85rem' }}><strong>{stats.chapters}</strong> Chapter{stats.chapters !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Check size={14} color="var(--success)" />
            <span style={{ fontSize: '0.85rem' }}><strong>{stats.topics}</strong> Topic{stats.topics !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FileText size={14} color="var(--accent-1)" />
            <span style={{ fontSize: '0.85rem' }}><strong>{stats.tasks}</strong> Task{stats.tasks !== 1 ? 's' : ''} to import</span>
          </div>
        </div>
      )}

      {parsed?.length === 0 && content && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', color: 'var(--warning)', fontSize: '0.85rem' }}>
          <AlertCircle size={14} />
          No tasks found. Check the markdown format.
        </div>
      )}

      {/* Format reminder */}
      <details>
        <summary style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
          View format reference
        </summary>
        <pre style={{
          marginTop: '8px',
          padding: '12px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          overflowX: 'auto',
          lineHeight: 1.6
        }}>
{`# Subject: Physics
## Chapter: Mechanics
### Topic: Newton's Laws
#### Sub-topic: First Law (optional)
- [ ] Task title | priority: high | due: YYYY-MM-DD | revision: true
- [x] Already completed task`}
        </pre>
      </details>
    </Modal>
  );
}
