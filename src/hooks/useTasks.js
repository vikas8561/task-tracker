import { supabase } from '../lib/supabase';


export async function fetchTasks(filters = {}) {
  let query = supabase
    .from('tasks')
    .select(`
      *,
      subjects(id, name, color),
      chapters(id, name),
      topics(id, name),
      sub_topics(id, name)
    `)
        .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });


  if (filters.subject_id) query = query.eq('subject_id', filters.subject_id);
  if (filters.chapter_id) query = query.eq('chapter_id', filters.chapter_id);
  if (filters.topic_id) query = query.eq('topic_id', filters.topic_id);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.is_completed !== undefined) query = query.eq('is_completed', filters.is_completed);
  if (filters.is_revision !== undefined) query = query.eq('is_revision', filters.is_revision);
  if (filters.due_date) query = query.eq('due_date', filters.due_date);

  const { data, error } = await query;
  if (error) {
    if (error.code === '42P01' || error.code === '42703') {
      console.warn('Schema not fully applied yet:', error.message);
      return [];
    }
    throw error;
  }
  return data;
}

export async function createTask(taskData) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...taskData }])
    .select(`
      *,
      subjects(id, name, color),
      chapters(id, name),
      topics(id, name),
      sub_topics(id, name)
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function createBulkTasks(tasksArray) {
  const tasksWithDevice = tasksArray;
  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksWithDevice)
    .select(`
      *,
      subjects(id, name, color),
      chapters(id, name),
      topics(id, name),
      sub_topics(id, name)
    `);
  if (error) throw error;
  return data;
}

export async function updateTask(id, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
        .select(`
      *,
      subjects(id, name, color),
      chapters(id, name),
      topics(id, name),
      sub_topics(id, name)
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    ;
  if (error) throw error;
}

export async function toggleComplete(task) {
  const nowCompleted = !task.is_completed;
  return updateTask(task.id, {
    is_completed: nowCompleted,
    completed_at: nowCompleted ? new Date().toISOString() : null,
  });
}

export async function toggleRevision(task) {
  return updateTask(task.id, { is_revision: !task.is_revision });
}

export async function fetchAllCompletedTimestamps() {
  const { data, error } = await supabase
    .from('tasks')
    .select('completed_at')
        .eq('is_completed', true)
    .not('completed_at', 'is', null);
  if (error) throw error;
  return data.map((t) => t.completed_at);
}

export async function fetchTasksCreatedToday() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data, error } = await supabase
    .from('tasks')
    .select('id')
        .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);
  if (error) throw error;
  return data.length;
}

/**
 * Persist a new ordering for a list of tasks.
 * @param {Array<{id: string}>} orderedTasks  – tasks in the desired order
 */
export async function reorderTasks(orderedTasks) {
  const updates = orderedTasks.map((t, i) =>
    supabase
      .from('tasks')
      .update({ sort_order: i })
      .eq('id', t.id)
        );
  await Promise.all(updates);
}
