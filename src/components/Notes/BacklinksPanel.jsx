import React from 'react';
import { Link } from 'react-router-dom';
import { Link2, FileText } from 'lucide-react';

export default function BacklinksPanel({ backlinks = [], toc = [], currentSlug }) {
  return (
    <div className="backlinks-panel">
      {/* Table of Contents */}
      {toc.length > 0 && (
        <div className="backlinks-section">
          <h3 className="backlinks-section-title">
            <span>📑</span> On this page
          </h3>
          <nav className="toc-list">
            {toc.map((item, i) => (
              <a
                key={i}
                href={`#${item.id}`}
                className="toc-item"
                style={{ paddingLeft: `${(item.depth - 1) * 12}px` }}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* Backlinks */}
      <div className="backlinks-section">
        <h3 className="backlinks-section-title">
          <Link2 size={14} />
          Backlinks
          {backlinks.length > 0 && (
            <span className="backlinks-count">{backlinks.length}</span>
          )}
        </h3>

        {backlinks.length === 0 ? (
          <div className="backlinks-empty">
            <span>No notes link here yet.</span>
          </div>
        ) : (
          <div className="backlinks-list">
            {backlinks.map((bl, i) => (
              <Link
                key={`${bl.slug}-${i}`}
                to={`/notes/${bl.slug}`}
                className="backlink-item"
              >
                <div className="backlink-item-header">
                  <FileText size={13} />
                  <span className="backlink-item-title">{bl.title}</span>
                </div>
                {bl.context && (
                  <p className="backlink-item-context">
                    {bl.context}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
