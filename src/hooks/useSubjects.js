import { supabase } from '../lib/supabase';


export async function fetchSubjects() {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
        .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createSubject(name, color = '#0f766e') {
  const { data, error } = await supabase
    .from('subjects')
    .insert([{ name, color }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubject(id, updates) {
  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', id)
        .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubject(id) {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)
    ;
  if (error) throw error;
}

export async function getOrCreateSubject(name, color = '#0f766e') {
  // Try to find existing
  const { data: existing } = await supabase
    .from('subjects')
    .select('*')
        .ilike('name', name)
    .single();
  if (existing) return existing;
  return createSubject(name, color);
}
