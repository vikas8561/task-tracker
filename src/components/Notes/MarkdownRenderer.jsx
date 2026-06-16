import React, { Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkToc from 'remark-toc';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import { Link } from 'react-router-dom';
import MermaidBlock from './MermaidBlock';
import CalloutBlock, { parseCallout } from './CalloutBlock';
import NoteEmbed from './NoteEmbed';

// Remark plugin to handle wiki-links: [[Title]] [[Title|Alias]] [[Title#heading]]
function remarkWikiLinks() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'text' && node.value) {
        const regex = /!\[\[([^\]|#]+)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]|\[\[([^\]|#]+)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/g;
        let match;
        const parts = [];
        let lastIndex = 0;

        while ((match = regex.exec(node.value)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
          }

          const isEmbed = match[0].startsWith('!');
          if (isEmbed) {
            const title = match[1];
            const heading = match[2] || null;
            parts.push({
              type: 'html',
              value: `<note-embed title="${encodeURIComponent(title)}" heading="${encodeURIComponent(heading || '')}"></note-embed>`,
            });
          } else {
            const title = match[4];
            const heading = match[5] ? `#${match[5]}` : '';
            const alias = match[6] || title;
            const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            parts.push({
              type: 'html',
              value: `<a href="/notes/${slug}${heading}" class="wiki-link" data-wiki-title="${encodeURIComponent(title)}">${alias}</a>`,
            });
          }

          lastIndex = match.index + match[0].length;
        }

        if (parts.length > 0) {
          if (lastIndex < node.value.length) {
            parts.push({ type: 'text', value: node.value.slice(lastIndex) });
          }
          return parts;
        }
      }
      return [node];
    };

    const traverse = (node) => {
      if (node.children) {
        const newChildren = [];
        for (const child of node.children) {
          if (child.type === 'text') {
            const replaced = visit(child);
            newChildren.push(...replaced);
          } else {
            traverse(child);
            newChildren.push(child);
          }
        }
        node.children = newChildren;
      }
    };

    traverse(tree);
  };
}

// Custom components for ReactMarkdown
function makeComponents(onLinkClick) {
  return {
    // Pre blocks: don't wrap mermaid in <pre>
    pre({ node, children, ...props }) {
      const codeChild = node.children?.[0];
      const isMermaid = codeChild && codeChild.tagName === 'code' &&
        (codeChild.properties?.className || []).includes('language-mermaid');

      if (isMermaid) {
        return <>{children}</>;
      }
      return <pre {...props}>{children}</pre>;
    },

    // Code blocks: detect mermaid, else use syntax highlighting
    code({ node, inline, className, children, ...props }) {
      const lang = /language-(\w+)/.exec(className || '');
      const code = String(children).replace(/\n$/, '');

      if (!inline && lang?.[1] === 'mermaid') {
        return <MermaidBlock code={code} />;
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },

    // Blockquotes: detect Obsidian callouts
    blockquote({ children }) {
      return <CalloutBlock>{children}</CalloutBlock>;
    },

    // Anchor tags: handle wiki-links and internal routing
    a({ href, children, className, ...props }) {
      if (className === 'wiki-link' || href?.startsWith('/notes/')) {
        return (
          <Link
            to={href}
            className={`wiki-link ${className || ''}`}
            onClick={onLinkClick}
          >
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="md-link" {...props}>
          {children}
        </a>
      );
    },

    // Custom HTML elements: note-embed
    'note-embed'({ title, heading }) {
      try {
        const decodedTitle = decodeURIComponent(title || '');
        const decodedHeading = heading ? decodeURIComponent(heading) : null;
        return <NoteEmbed title={decodedTitle} heading={decodedHeading || null} />;
      } catch {
        return null;
      }
    },

    // Images
    img({ src, alt, ...props }) {
      return (
        <span className="md-image-wrapper">
          <img src={src} alt={alt} className="md-image" {...props} />
          {alt && <span className="md-image-caption">{alt}</span>}
        </span>
      );
    },

    // Checkbox inputs (GFM task lists)
    input({ type, checked, ...props }) {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="md-task-checkbox"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },
  };
}

const remarkPlugins = [
  remarkGfm,
  remarkMath,
  remarkBreaks,
  [remarkToc, { heading: 'table of contents', tight: true }],
  remarkWikiLinks,
];

const rehypePlugins = [
  rehypeRaw,
  rehypeKatex,
  [rehypeHighlight, { detect: true, ignoreMissing: true }],
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['heading-anchor'] } }],
];

export default function MarkdownRenderer({ content = '', onLinkClick }) {
  const components = makeComponents(onLinkClick);

  // Pre-process markdown to fix CommonMark behavior where <svg> blocks break on blank lines.
  // We find any <svg ...> ... </svg> blocks and remove the blank lines inside them so they parse as a single HTML block.
  const processedContent = React.useMemo(() => {
    let text = content || '';
    // Use a regex to find <svg>...</svg> across multiple lines
    // We replace \n\s*\n with a single newline inside the match
    text = text.replace(/<svg[\s\S]*?<\/svg>/g, (match) => {
      return match.replace(/\n\s*\n/g, '\n');
    });
    return text;
  }, [content]);

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
        allowElement={(element) => true}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
