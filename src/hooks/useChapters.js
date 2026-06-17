import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/localAuth';


export async function fetchChapters(subjectId) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
        .eq('subject_id', subjectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createChapter(subjectId, name) {
  const { data, error } = await supabase
    .from('chapters')
    .insert([{ subject_id: subjectId, name, user_id: getCurrentUser()?.id }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChapter(id) {
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', id)
    ;
  if (error) throw error;
}

export async function getOrCreateChapter(subjectId, name) {
  const { data: existing } = await supabase
    .from('chapters')
    .select('*')
        .eq('subject_id', subjectId)
    .ilike('name', name)
    .single();
  if (existing) return existing;
  return createChapter(subjectId, name);
}
