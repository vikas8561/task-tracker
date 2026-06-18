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
- [ ] First Law of Motion | priority: high | due: 2026-06-20 | revision: true
- [ ] Solve numerical problems on inertia | priority: medium

### Topic: Work, Energy & Power
- [ ] Kinetic energy derivation | priority: low
- [ ] Solve worksheet problems

## Chapter: Thermodynamics
### Topic: Laws of Thermodynamics
- [ ] Zeroth Law | priority: medium | due: 2026-06-25`;

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
      const subjectCache = {};
      const chapterCache = {};
      const topicCache = {};
      const subTopicCache = {};

      const colorPool = [...SUBJECT_COLORS];
      let colorIdx = 0;

      // 1. Gather unique subjects
      const uniqueSubjects = [...new Set(parsed.map(t => t.subjectName))];
      for (const sName of uniqueSubjects) {
        if (!subjectCache[sName]) {
          subjectCache[sName] = await getOrCreateSubject(sName, colorPool[colorIdx % colorPool.length]);
          colorIdx++;
        }
      }

      // 2. Gather unique chapters
      const uniqueChapters = [...new Set(parsed.map(t => `${t.subjectName}::${t.chapterName}`))];
      for (const chapKey of uniqueChapters) {
        if (!chapterCache[chapKey]) {
          const [sName, cName] = chapKey.split('::');
          chapterCache[chapKey] = await getOrCreateChapter(subjectCache[sName].id, cName);
        }
      }

      // 3. Gather unique topics
      const uniqueTopics = [...new Set(parsed.map(t => `${t.subjectName}::${t.chapterName}::${t.topicName}`))];
      for (const topicKey of uniqueTopics) {
        if (!topicCache[topicKey]) {
          const [sName, cName, tName] = topicKey.split('::');
          const chapKey = `${sName}::${cName}`;
          topicCache[topicKey] = await getOrCreateTopic(chapterCache[chapKey].id, tName);
        }
      }

      // 4. Gather unique sub-topics and create them concurrently
      const uniqueSubTopics = [...new Set(parsed.filter(t => t.subTopicName).map(t => `${t.subjectName}::${t.chapterName}::${t.topicName}::${t.subTopicName}`))];
      const subTopicPromises = uniqueSubTopics.map(async (stKey) => {
        if (!subTopicCache[stKey]) {
          const [sName, cName, tName, stName] = stKey.split('::');
          const topicKey = `${sName}::${cName}::${tName}`;
          const topicId = topicCache[topicKey].id;
          const st = await getOrCreateSubTopic(topicId, stName);
          subTopicCache[stKey] = st;
        }
      });
      await Promise.all(subTopicPromises);

      // 5. Build bulk task rows
      const tasksToCreate = parsed.map(t => {
        const sName = t.subjectName;
        const cName = t.chapterName;
        const tName = t.topicName;
        const stName = t.subTopicName;
        
        const chapKey = `${sName}::${cName}`;
        const topicKey = `${chapKey}::${tName}`;
        const stKey = `${topicKey}::${stName}`;

        return {
          subject_id: subjectCache[sName].id,
          chapter_id: chapterCache[chapKey].id,
          topic_id: topicCache[topicKey].id,
          sub_topic_id: stName ? subTopicCache[stKey].id : null,
          title: t.title,
          priority: t.priority || null,
          due_date: t.due_date || null,
        };
      });

      // 6. Bulk Insert Tasks
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
- [ ] Task title | priority: high | due: YYYY-MM-DD | revision: true
- [x] Already completed task`}
        </pre>
      </details>
    </Modal>
  );
}
