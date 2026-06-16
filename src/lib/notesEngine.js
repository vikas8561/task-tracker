import Fuse from 'fuse.js';

// ─── Backlink Indexing ────────────────────────────────────────────────────────

/**
 * Extract all [[wiki-link]] references from markdown content.
 * Handles [[Note Title]], [[Note Title|Alias]], [[Note Title#heading]]
 */
export function extractWikiLinks(content) {
  const links = new Set();
  const regex = /\[\[([^\]|#]+)(?:#[^\]|]*)?\|?[^\]]*\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawTitle = match[1].trim();
    links.add(rawTitle.toLowerCase());
  }
  return [...links];
}

/**
 * Build a backlinks index: for each note slug, which other note slugs link to it?
 * @param {Array} notes - array of { slug, title, content }
 * @returns {Object} { [targetSlug]: [{ slug, title, context }] }
 */
export function buildBacklinkIndex(notes) {
  const slugToNote = {};
  const titleToSlug = {};

  for (const note of notes) {
    slugToNote[note.slug] = note;
    titleToSlug[note.title.toLowerCase()] = note.slug;
  }

  const backlinks = {};

  for (const note of notes) {
    const outLinks = extractWikiLinks(note.content || '');
    for (const linkedTitle of outLinks) {
      const targetSlug = titleToSlug[linkedTitle] || linkedTitle;

      if (!backlinks[targetSlug]) {
        backlinks[targetSlug] = [];
      }

      // Find context around the wiki-link
      const context = findLinkContext(note.content, linkedTitle);

      backlinks[targetSlug].push({
        slug: note.slug,
        title: note.title,
        context,
      });
    }
  }

  return backlinks;
}

/**
 * Find surrounding context text for a wiki-link mention
 */
function findLinkContext(content, linkedTitle) {
  const escapedTitle = linkedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\[\\[${escapedTitle}[^\\]]*\\]\\]`, 'gi');
  const match = regex.exec(content);
  if (!match) return '';

  const start = Math.max(0, match.index - 80);
  const end = Math.min(content.length, match.index + match[0].length + 80);
  let ctx = content.slice(start, end).replace(/\n/g, ' ').trim();
  if (start > 0) ctx = '...' + ctx;
  if (end < content.length) ctx = ctx + '...';
  return ctx;
}

// ─── Graph Data Builder ───────────────────────────────────────────────────────

/**
 * Convert notes + backlink index into graph data for react-force-graph
 * @param {Array} notes
 * @param {Object} backlinkIndex
 * @returns {{ nodes: Array, links: Array }}
 */
export function buildGraphData(notes, backlinkIndex = {}) {
  const nodeMap = new Map();
  const links = [];
  const linkedSlugs = new Set();

  // Count connections per node
  const connectionCount = {};
  for (const [targetSlug, sources] of Object.entries(backlinkIndex)) {
    connectionCount[targetSlug] = (connectionCount[targetSlug] || 0) + sources.length;
    for (const src of sources) {
      connectionCount[src.slug] = (connectionCount[src.slug] || 0) + 1;
    }
  }

  // Build nodes
  for (const note of notes) {
    nodeMap.set(note.slug, {
      id: note.slug,
      title: note.title,
      tags: note.tags || [],
      connections: connectionCount[note.slug] || 0,
      folderId: note.folder_id,
    });
  }

  // Build edges
  const addedLinks = new Set();
  for (const [targetSlug, sources] of Object.entries(backlinkIndex)) {
    for (const src of sources) {
      const key = `${src.slug}→${targetSlug}`;
      if (!addedLinks.has(key) && nodeMap.has(src.slug) && nodeMap.has(targetSlug)) {
        addedLinks.add(key);
        linkedSlugs.add(src.slug);
        linkedSlugs.add(targetSlug);
        links.push({ source: src.slug, target: targetSlug });
      }
    }
  }

  return {
    nodes: [...nodeMap.values()],
    links,
  };
}

// ─── Fuzzy Search ─────────────────────────────────────────────────────────────

let fuseInstance = null;
let fuseNotes = null;

/**
 * Initialize or update the Fuse.js index
 */
export function initFuse(notes) {
  fuseNotes = notes;
  fuseInstance = new Fuse(notes, {
    keys: [
      { name: 'title', weight: 3 },
      { name: 'tags', weight: 2 },
      { name: 'content', weight: 1 },
    ],
    threshold: 0.35,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
  });
  return fuseInstance;
}

/**
 * Search notes using fuzzy matching
 */
export function searchNotes(query, notes = null) {
  if (!query || !query.trim()) return notes || fuseNotes || [];

  if (notes || !fuseInstance || fuseNotes !== notes) {
    initFuse(notes || fuseNotes || []);
  }

  const results = fuseInstance.search(query);
  return results.map((r) => r.item);
}

// ─── Folder Tree Builder ─────────────────────────────────────────────────────

/**
 * Build a nested tree from flat folder array
 */
export function buildFolderTree(folders, notes = []) {
  const folderMap = new Map();
  const roots = [];

  // Index folders
  for (const folder of folders) {
    folderMap.set(folder.id, { ...folder, children: [], notes: [] });
  }

  // Assign notes to folders
  for (const note of notes) {
    if (note.folder_id && folderMap.has(note.folder_id)) {
      folderMap.get(note.folder_id).notes.push(note);
    }
  }

  // Build tree
  for (const folder of folderMap.values()) {
    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      folderMap.get(folder.parent_id).children.push(folder);
    } else {
      roots.push(folder);
    }
  }

  return roots;
}

// ─── Wiki-link Resolution ────────────────────────────────────────────────────

/**
 * Resolve a wiki-link title to a note slug
 */
export function resolveWikiLink(linkText, notes) {
  const lower = linkText.toLowerCase();
  // Exact slug match
  const bySlug = notes.find((n) => n.slug === lower);
  if (bySlug) return bySlug;
  // Exact title match
  const byTitle = notes.find((n) => n.title.toLowerCase() === lower);
  if (byTitle) return byTitle;
  // Partial title match
  const partial = notes.find((n) => n.title.toLowerCase().includes(lower));
  return partial || null;
}

// ─── Tag Extraction ───────────────────────────────────────────────────────────

/**
 * Collect all unique tags across notes
 */
export function getAllTags(notes) {
  const tagSet = new Set();
  for (const note of notes) {
    for (const tag of note.tags || []) {
      tagSet.add(tag);
    }
  }
  return [...tagSet].sort();
}
