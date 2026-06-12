import { supabase } from '../lib/supabase';


export async function fetchTopics(chapterId) {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
        .eq('chapter_id', chapterId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTopic(chapterId, name) {
  const { data, error } = await supabase
    .from('topics')
    .insert([{ chapter_id: chapterId, name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTopic(id) {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)
    ;
  if (error) throw error;
}

export async function getOrCreateTopic(chapterId, name) {
  const { data: existing } = await supabase
    .from('topics')
    .select('*')
        .eq('chapter_id', chapterId)
    .ilike('name', name)
    .single();
  if (existing) return existing;
  return createTopic(chapterId, name);
}
