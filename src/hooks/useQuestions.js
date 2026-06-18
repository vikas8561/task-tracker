import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/localAuth';

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Fetch questions with optional hierarchy filters.
 * @param {{ subjectId?: string, chapterId?: string, topicId?: string }} filters
 */
export async function fetchQuestions({ subjectId, chapterId, topicId } = {}) {
  let query = supabase
    .from('questions')
    .select(`
      id, title, explanation, examples, io_examples, solutions,
      created_at, updated_at,
      subject_id, chapter_id, topic_id,
      subjects ( id, name, color ),
      chapters ( id, name ),
      topics   ( id, name )
    `)
    .order('created_at', { ascending: false })
    .limit(500);

  if (topicId) query = query.eq('topic_id', topicId);
  else if (chapterId) query = query.eq('chapter_id', chapterId);
  else if (subjectId) query = query.eq('subject_id', subjectId);

  const { data, error } = await query;
  if (error) {
    if (
      error.code === '42P01' || 
      error.code === 'PGRST204' || 
      error.code === 'PGRST106' || 
      error.message?.includes('404') || 
      error.details?.includes('does not exist') ||
      error.message?.includes('does not exist')
    ) {
      return [];
    }
    throw error;
  }
  return data || [];
}

/**
 * Fetch a single question by id.
 */
export async function fetchQuestion(id) {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id, title, explanation, examples, io_examples, solutions,
      created_at, updated_at,
      subject_id, chapter_id, topic_id,
      subjects ( id, name, color ),
      chapters ( id, name ),
      topics   ( id, name )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createQuestion(data) {
  const { data: created, error } = await supabase
    .from('questions')
    .insert([{ ...data, user_id: getCurrentUser()?.id }])
    .select(`
      id, title, explanation, examples, io_examples, solutions,
      created_at, updated_at,
      subject_id, chapter_id, topic_id,
      subjects ( id, name, color ),
      chapters ( id, name ),
      topics   ( id, name )
    `)
    .single();
  if (error) throw error;
  return created;
}

export async function createBulkQuestions(rows) {
  const userId = getCurrentUser()?.id;
  const payload = rows.map((r) => ({ ...r, user_id: userId }));
  const { data, error } = await supabase
    .from('questions')
    .insert(payload)
    .select('id, title, subject_id, chapter_id, topic_id');
  if (error) throw error;
  return data;
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateQuestion(id, data) {
  const { data: updated, error } = await supabase
    .from('questions')
    .update(data)
    .eq('id', id)
    .select(`
      id, title, explanation, examples, io_examples, solutions,
      created_at, updated_at,
      subject_id, chapter_id, topic_id,
      subjects ( id, name, color ),
      chapters ( id, name ),
      topics   ( id, name )
    `)
    .single();
  if (error) throw error;
  return updated;
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteQuestion(id) {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
