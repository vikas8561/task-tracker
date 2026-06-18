import { useState, useRef } from 'react';
import Modal from '../common/Modal';
import { parseQuestionMarkdown, getQuestionParseStats } from '../../utils/questionMarkdownParser';
import { fetchSubjects, getOrCreateSubject } from '../../hooks/useSubjects';
import { getOrCreateChapter } from '../../hooks/useChapters';
import { getOrCreateTopic } from '../../hooks/useTopics';
import { createBulkQuestions } from '../../hooks/useQuestions';
import { Upload, FileText, AlertCircle, Check } from 'lucide-react';
import { SUBJECT_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';

const EXAMPLE_MD = `# Subject: Data Structures

## Chapter: Arrays

### Topic: Two Pointers

#### Question: Find pair with target sum
**Explanation:** Use two pointers starting from both ends of the sorted array. Move the left pointer right when the sum is too small, move the right pointer left when it is too large.

**Examples:**
- Given arr=[1,2,3,4], target=5 → answer exists (1+4=5)
- Given arr=[0,0], target=0 → both zeros sum to target
- Given arr=[-1,0,1,2], target=1 → answer exists (-1+2=1)

**Input/Output:**
- Input: [1,2,3,4], 5 | Output: [1,4]
- Input: [0,0], 0 | Output: [0,0]
- Input: [-1,0,1,2], 1 | Output: [-1,2]

**Solutions:**
\`\`\`python
def find_pair(arr, target):
    left, right = 0, len(arr) - 1
    while left < right:
        s = arr[left] + arr[right]
        if s == target:
            return [arr[left], arr[right]]
        elif s < target:
            left += 1
        else:
            right -= 1
    return []
\`\`\`

\`\`\`javascript
function findPair(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const s = arr[left] + arr[right];
    if (s === target) return [arr[left], arr[right]];
    else if (s < target) left++;
    else right--;
  }
  return [];
}
\`\`\`

#### Question: Maximum subarray sum
**Explanation:** Kadane's algorithm — track the current running sum and reset to the current element whenever the running sum goes negative.

**Examples:**
- Given nums=[-2,1,-3,4,-1,2,1,-5,4] → max subarray is [4,-1,2,1] with sum 6
- Given nums=[1] → single element, answer is 1

**Input/Output:**
- Input: [-2,1,-3,4,-1,2,1,-5,4] | Output: 6
- Input: [1] | Output: 1

**Solutions:**
\`\`\`python
def max_subarray(nums):
    max_sum = cur = nums[0]
    for n in nums[1:]:
        cur = max(n, cur + n)
        max_sum = max(max_sum, cur)
    return max_sum
\`\`\``;

export default function QuestionMarkdownImport({ isOpen, onClose, onImported }) {
  const [content,    setContent]    = useState('');
  const [parsed,     setParsed]     = useState(null);
  const [stats,      setStats]      = useState(null);
  const [importing,  setImporting]  = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const [errors,     setErrors]     = useState([]);
  const fileRef = useRef();

  function handleContentChange(text) {
    setContent(text);
    if (text.trim()) {
      try {
        const questions = parseQuestionMarkdown(text);
        setParsed(questions);
        setStats(getQuestionParseStats(questions));
        setErrors([]);
      } catch (err) {
        setParsed([]);
        setStats(null);
        setErrors([err.message || 'Failed to parse markdown']);
      }
    } else {
      setParsed(null);
      setStats(null);
      setErrors([]);
    }
  }

  function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.md') && file.type !== 'text/markdown' && file.type !== 'text/plain') {
      toast.error('Please upload a .md file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => handleContentChange(e.target.result);
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleImport() {
    if (!parsed?.length) return;
    setImporting(true);
    try {
      const subjectCache = {};
      const chapterCache = {};
      const topicCache   = {};

      const colorPool = [...SUBJECT_COLORS];
      let colorIdx = 0;

      // 1. Ensure subjects exist
      const uniqueSubjects = [...new Set(parsed.map((q) => q.subjectName))];
      for (const sName of uniqueSubjects) {
        if (!subjectCache[sName]) {
          subjectCache[sName] = await getOrCreateSubject(sName, colorPool[colorIdx % colorPool.length]);
          colorIdx++;
        }
      }

      // 2. Ensure chapters exist
      const uniqueChapters = [...new Set(parsed.map((q) => `${q.subjectName}::${q.chapterName}`))];
      for (const key of uniqueChapters) {
        if (!chapterCache[key]) {
          const [sName, cName] = key.split('::');
          chapterCache[key] = await getOrCreateChapter(subjectCache[sName].id, cName);
        }
      }

      // 3. Ensure topics exist
      const uniqueTopics = [...new Set(parsed.map((q) => `${q.subjectName}::${q.chapterName}::${q.topicName}`))];
      for (const key of uniqueTopics) {
        if (!topicCache[key]) {
          const [sName, cName, tName] = key.split('::');
          topicCache[key] = await getOrCreateTopic(chapterCache[`${sName}::${cName}`].id, tName);
        }
      }

      // 4. Build bulk payload
      const rows = parsed.map((q) => {
        const chapKey  = `${q.subjectName}::${q.chapterName}`;
        const topicKey = `${chapKey}::${q.topicName}`;
        return {
          subject_id:  subjectCache[q.subjectName].id,
          chapter_id:  chapterCache[chapKey].id,
          topic_id:    topicCache[topicKey].id,
          title:       q.title,
          explanation: q.explanation || null,
          examples:    q.examples,
          io_examples: q.ioExamples,
          solutions:   q.solutions,
        };
      });

      // 5. Bulk insert
      const created = await createBulkQuestions(rows);
      toast.success(`Imported ${created.length} question${created.length !== 1 ? 's' : ''} successfully!`);
      onImported(created);
      resetState();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function resetState() {
    setContent(''); setParsed(null); setStats(null); setErrors([]);
  }

  function loadExample() { handleContentChange(EXAMPLE_MD); }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { resetState(); onClose(); }}
      title="Import Questions from Markdown"
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={() => { resetState(); onClose(); }}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={importing || !parsed?.length}
            id="qi-import-confirm-btn"
          >
            {importing ? 'Importing…' : `Import ${parsed?.length || 0} Question${(parsed?.length || 0) !== 1 ? 's' : ''}`}
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
        id="qi-dropzone"
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

      {/* Paste area */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className="form-label">Or paste markdown content</p>
          <button className="btn btn-ghost btn-sm" onClick={loadExample} style={{ fontSize: '0.75rem' }}>
            Load Example
          </button>
        </div>
        <textarea
          className="form-textarea"
          placeholder="Paste your questions markdown here…"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '0.82rem' }}
          id="qi-paste-area"
        />
      </div>

      {/* Preview stats */}
      {stats && (
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          display: 'flex',
          gap: 'var(--space-6)',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Subject',  value: stats.subjects,  plural: 's' },
            { label: 'Chapter',  value: stats.chapters,  plural: 's' },
            { label: 'Topic',    value: stats.topics,    plural: 's' },
          ].map(({ label, value, plural }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Check size={14} color="var(--success)" />
              <span style={{ fontSize: '0.85rem' }}><strong>{value}</strong> {label}{value !== 1 ? plural : ''}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FileText size={14} color="var(--accent-1)" />
            <span style={{ fontSize: '0.85rem' }}><strong>{stats.questions}</strong> Question{stats.questions !== 1 ? 's' : ''} to import</span>
          </div>
        </div>
      )}

      {/* Parse errors */}
      {errors.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', color: 'var(--danger)', fontSize: '0.85rem', background: 'var(--danger-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
          <AlertCircle size={14} />
          {errors[0]}
        </div>
      )}

      {parsed?.length === 0 && content && errors.length === 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', color: 'var(--warning)', fontSize: '0.85rem' }}>
          <AlertCircle size={14} />
          No questions found. Check the markdown format below.
        </div>
      )}

      {/* Format reference */}
      <details>
        <summary style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
          View format reference
        </summary>
        <pre style={{
          marginTop: '8px', padding: '12px',
          background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
          fontSize: '0.72rem', color: 'var(--text-secondary)',
          overflowX: 'auto', lineHeight: 1.6,
        }}>
{`# Subject: <Subject Name>
## Chapter: <Chapter Name>
### Topic: <Topic Name>

#### Question: <Your question title>
**Explanation:** Describe the problem approach here.

# ── Multiple examples (add as many bullet lines as needed) ──
**Examples:**
- Example description 1
- Example description 2
- Example description 3

# ── Multiple I/O pairs (use  |  to separate input and output) ──
**Input/Output:**
- Input: value1 | Output: result1
- Input: value2 | Output: result2
- Input: value3 | Output: result3

# ── Multiple solutions (add more fenced code blocks) ──
**Solutions:**
\`\`\`python
def solution(): pass
\`\`\`

\`\`\`javascript
function solution() {}
\`\`\``}
        </pre>
      </details>
    </Modal>
  );
}
