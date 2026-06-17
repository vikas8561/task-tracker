import { supabase } from './supabase';
import { getCurrentUser } from './localAuth';
import GithubSlugger from 'github-slugger';

const slugger = new GithubSlugger();

// ─── Browser-safe reading time (replaces the 'reading-time' npm package) ─────
// Average adult reading speed: 200 words per minute
function calcReadingTime(text = '') {
  const plain = text
    .replace(/```[\s\S]*?```/g, '') // strip code blocks
    .replace(/`[^`]+`/g, '')        // strip inline code
    .replace(/\[\[[^\]]*\]\]/g, '') // strip wiki-links
    .replace(/[#*_~>|]/g, '');      // strip markdown symbols
  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return { words, minutes };
}

// ─── Browser-safe frontmatter parser (replaces 'gray-matter') ────────────────
// Handles YAML frontmatter delimited by ---
function parseFrontmatter(content = '') {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, content };
  const yaml = match[1];
  const body = content.slice(match[0].length).trimStart();
  const data = {};
  for (const line of yaml.split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    // Arrays: [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val.slice(1, -1).split(',').map((v) => v.trim().replace(/["']/g, ''));
    } else {
      // Remove surrounding quotes
      val = val.replace(/^["']|["']$/g, '');
      data[key] = val === 'true' ? true : val === 'false' ? false : isNaN(val) || val === '' ? val : Number(val);
    }
  }
  return { data, content: body };
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseNote(raw) {
  if (!raw) return null;
  let frontmatter = {};
  let body = raw.content || '';
  try {
    const parsed = parseFrontmatter(body);
    frontmatter = parsed.data || {};
    body = parsed.content;
  } catch (_) {}
  const rt = calcReadingTime(body);
  return {
    ...raw,
    content: raw.content || '',
    body,
    frontmatter,
    readingTime: rt,
    wordCount: rt.words,
  };
}

function generateSlug(title) {
  slugger.reset();
  return slugger.slug(title);
}

// ─── Folders API ─────────────────────────────────────────────────────────────

export async function fetchFolders() {
  const { data, error } = await supabase
    .from('note_folders')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createFolder({ name, parentId = null, icon = '📁', color = null }) {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('note_folders')
    .insert({ name, parent_id: parentId, icon, color, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFolder(id, updates) {
  const { data, error } = await supabase
    .from('note_folders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFolder(id) {
  const { error } = await supabase
    .from('note_folders')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── Notes API ────────────────────────────────────────────────────────────────

async function fetchUserNoteStates(noteIds) {
  if (!noteIds || noteIds.length === 0) return {};
  const user = getCurrentUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('user_note_states')
    .select('*')
    .eq('user_id', user.id)
    .in('note_id', noteIds);

  if (error) return {};

  const stateMap = {};
  for (const st of data) stateMap[st.note_id] = st;
  return stateMap;
}

export async function fetchNotes(options = {}) {
  let query = supabase
    .from('notes')
    .select('id, user_id, folder_id, title, slug, tags, is_pinned, is_archived, word_count, reading_time, created_at, updated_at');

  if (options.folderId !== undefined) {
    if (options.folderId === null) {
      query = query.is('folder_id', null);
    } else {
      query = query.eq('folder_id', options.folderId);
    }
  }
  if (options.tags && options.tags.length > 0) {
    query = query.contains('tags', options.tags);
  }

  const { data, error } = await query;
  if (error) throw error;

  const stateMap = await fetchUserNoteStates(data.map(n => n.id));
  
  let mergedData = data.map(n => ({
    ...n,
    is_pinned: stateMap[n.id]?.is_pinned || false,
    is_archived: stateMap[n.id]?.is_archived || false
  }));

  if (options.includeArchived !== true) {
    mergedData = mergedData.filter(n => !n.is_archived);
  }
  
  mergedData.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime() > 0 ? -1 : 1;
  });

  return mergedData;
}

export async function fetchAllNotesMeta() {
  const { data, error } = await supabase
    .from('notes')
    .select('id, title, slug, tags, content, folder_id, updated_at');
  if (error) throw error;

  const stateMap = await fetchUserNoteStates(data.map(n => n.id));
  let mergedData = data.map(n => ({
    ...n,
    is_pinned: stateMap[n.id]?.is_pinned || false,
    is_archived: stateMap[n.id]?.is_archived || false
  }));
  
  mergedData = mergedData.filter(n => !n.is_archived);
  return mergedData.map(parseNote);
}

export async function fetchNote(slug) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  
  const stateMap = await fetchUserNoteStates([data.id]);
  data.is_pinned = stateMap[data.id]?.is_pinned || false;
  data.is_archived = stateMap[data.id]?.is_archived || false;
  return parseNote(data);
}

export async function fetchNoteById(id) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  
  const stateMap = await fetchUserNoteStates([data.id]);
  data.is_pinned = stateMap[data.id]?.is_pinned || false;
  data.is_archived = stateMap[data.id]?.is_archived || false;
  return parseNote(data);
}

export async function createNote({ title, content = '', folderId = null, tags = [] }) {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const slug = generateSlug(title);
  const rt = calcReadingTime(content);
  let frontmatter = {};
  try { frontmatter = parseFrontmatter(content).data || {}; } catch (_) {}

  const { data, error } = await supabase
    .from('notes')
    .insert({
      title,
      slug,
      content,
      folder_id: folderId,
      tags,
      frontmatter,
      word_count: rt.words,
      reading_time: rt.minutes,
      user_id: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return parseNote(data);
}

export async function updateNote(id, updates) {
  const payload = { ...updates, updated_at: new Date().toISOString() };

  if (updates.content !== undefined) {
    const rt = calcReadingTime(updates.content);
    payload.word_count = rt.words;
    payload.reading_time = rt.minutes;
    try { payload.frontmatter = parseFrontmatter(updates.content).data || {}; } catch (_) {}
  }

  const { data, error } = await supabase
    .from('notes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  
  // Refetch state map so it returns updated data with correctly mapped pins
  const stateMap = await fetchUserNoteStates([data.id]);
  data.is_pinned = stateMap[data.id]?.is_pinned || false;
  data.is_archived = stateMap[data.id]?.is_archived || false;
  
  return parseNote(data);
}

export async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

export async function togglePin(id, isPinned) {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const note = await fetchNoteById(id);

  const { data, error } = await supabase
    .from('user_note_states')
    .upsert({
      user_id: user.id,
      note_id: id,
      is_pinned: !isPinned,
      is_archived: note.is_archived || false
    }, { onConflict: 'user_id, note_id' })
    .select()
    .single();

  if (error) throw error;
  return { ...note, is_pinned: data.is_pinned, is_archived: data.is_archived };
}

export async function toggleArchive(id, isArchived) {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const note = await fetchNoteById(id);

  const { data, error } = await supabase
    .from('user_note_states')
    .upsert({
      user_id: user.id,
      note_id: id,
      is_pinned: note.is_pinned || false,
      is_archived: !isArchived
    }, { onConflict: 'user_id, note_id' })
    .select()
    .single();

  if (error) throw error;
  return { ...note, is_pinned: data.is_pinned, is_archived: data.is_archived };
}

// ─── Images API ───────────────────────────────────────────────────────────────

export async function uploadNoteImage(file, noteId = null) {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `${user.id}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from('note-images')
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('note-images')
    .getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  const { data, error } = await supabase
    .from('note_images')
    .insert({
      note_id: noteId,
      filename: file.name,
      storage_path: storagePath,
      public_url: publicUrl,
      size_bytes: file.size,
      mime_type: file.type,
      user_id: user.id,
    })
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function fetchNoteImages(noteId) {
  const { data, error } = await supabase
    .from('note_images')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchUserImages() {
  const { data, error } = await supabase
    .from('note_images')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
