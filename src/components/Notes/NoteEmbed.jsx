import React, { useEffect, useState, useContext, createContext } from 'react';
import { fetchNote } from '../../lib/notesApi';

const EmbedDepthContext = createContext(0);
const MAX_EMBED_DEPTH = 3;

export default function NoteEmbed({ title, heading = null }) {
  const depth = useContext(EmbedDepthContext);
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lazy-load MarkdownRenderer to avoid circular imports at top level
  const [MarkdownRenderer, setMarkdownRenderer] = useState(null);

  useEffect(() => {
    import('./MarkdownRenderer').then((mod) => {
      setMarkdownRenderer(() => mod.default);
    });
  }, []);

  useEffect(() => {
    if (depth >= MAX_EMBED_DEPTH) {
      setLoading(false);
      setError('Max embed depth reached');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    fetchNote(slug)
      .then((n) => {
        if (!cancelled) {
          setNote(n);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(`Note not found: "${title}"`);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [title, depth]);

  if (loading) {
    return (
      <div className="note-embed note-embed-loading">
        <div className="note-embed-spinner" />
        <span>Loading embed: {title}</span>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="note-embed note-embed-error">
        <span>🔗 {error || `Note not found: "${title}"`}</span>
      </div>
    );
  }

  // Optionally filter to a specific heading
  let content = note.content || '';
  if (heading) {
    const headingRegex = new RegExp(
      `(#{1,6})\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n([\\s\\S]*?)(?=\\n#{1,6}\\s|$)`,
      'i'
    );
    const match = headingRegex.exec(content);
    if (match) content = match[0];
  }

  return (
    <EmbedDepthContext.Provider value={depth + 1}>
      <div className="note-embed">
        <div className="note-embed-header">
          <span className="note-embed-icon">📎</span>
          <a href={`/notes/${note.slug}`} className="note-embed-title">{note.title}</a>
        </div>
        <div className="note-embed-content">
          {MarkdownRenderer ? (
            <MarkdownRenderer content={content} />
          ) : (
            <pre style={{ fontSize: '0.8rem', opacity: 0.6 }}>{content.slice(0, 200)}</pre>
          )}
        </div>
      </div>
    </EmbedDepthContext.Provider>
  );
}
