import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/localAuth';


export async function fetchSubTopics(topicId) {
  const { data, error } = await supabase
    .from('sub_topics')
    .select('*')
        .eq('topic_id', topicId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createSubTopic(topicId, name) {
  const { data, error } = await supabase
    .from('sub_topics')
    .insert([{ topic_id: topicId, name, user_id: getCurrentUser()?.id }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubTopic(id) {
  const { error } = await supabase
    .from('sub_topics')
    .delete()
    .eq('id', id)
    ;
  if (error) throw error;
}

export async function getOrCreateSubTopic(topicId, name) {
  const { data: existing } = await supabase
    .from('sub_topics')
    .select('*')
        .eq('topic_id', topicId)
    .ilike('name', name)
    .single();
  if (existing) return existing;
  return createSubTopic(topicId, name);
}
