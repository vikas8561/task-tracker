import { supabase } from '../lib/supabase';


// Helper to fetch user states
async function fetchUserTaskStates(taskIds) {
  if (!taskIds || taskIds.length === 0) return {};
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return {};
  
  const { data, error } = await supabase
    .from('user_task_states')
    .select('*')
    .eq('user_id', user.user.id)
    .in('task_id', taskIds);
    
  if (error) return {};
  
  const stateMap = {};
  for (const st of data) stateMap[st.task_id] = st;
  return stateMap;
}

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
  if (filters.due_date) query = query.eq('due_date', filters.due_date);

  const { data, error } = await query;
  if (error) {
    if (error.code === '42P01' || error.code === '42703') {
      console.warn('Schema not fully applied yet:', error.message);
      return [];
    }
    throw error;
  }
  
  const stateMap = await fetchUserTaskStates(data.map(t => t.id));
  
  let mergedData = data.map(t => ({
    ...t,
    is_completed: stateMap[t.id]?.is_completed || false,
    is_revision: stateMap[t.id]?.is_revision || false,
    completed_at: stateMap[t.id]?.completed_at || null,
  }));
  
  if (filters.is_completed !== undefined) {
    mergedData = mergedData.filter(t => t.is_completed === filters.is_completed);
  }
  if (filters.is_revision !== undefined) {
    mergedData = mergedData.filter(t => t.is_revision === filters.is_revision);
  }
  
  return mergedData;
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
    .eq('id', id);
  if (error) throw error;
}

export async function toggleComplete(task) {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) throw new Error('Not authenticated');

  const nowCompleted = !task.is_completed;
  const completedAt = nowCompleted ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from('user_task_states')
    .upsert({
      user_id: user.user.id,
      task_id: task.id,
      is_completed: nowCompleted,
      completed_at: completedAt,
      is_revision: task.is_revision || false
    }, { onConflict: 'user_id, task_id' })
    .select()
    .single();

  if (error) throw error;
  return {
    ...task,
    is_completed: data.is_completed,
    completed_at: data.completed_at,
    is_revision: data.is_revision
  };
}

export async function toggleRevision(task) {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) throw new Error('Not authenticated');

  const nowRevision = !task.is_revision;

  const { data, error } = await supabase
    .from('user_task_states')
    .upsert({
      user_id: user.user.id,
      task_id: task.id,
      is_completed: task.is_completed || false,
      completed_at: task.completed_at || null,
      is_revision: nowRevision
    }, { onConflict: 'user_id, task_id' })
    .select()
    .single();

  if (error) throw error;
  return {
    ...task,
    is_completed: data.is_completed,
    completed_at: data.completed_at,
    is_revision: data.is_revision
  };
}

export async function fetchAllCompletedTimestamps() {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return [];

  const { data, error } = await supabase
    .from('user_task_states')
    .select('completed_at')
    .eq('user_id', user.user.id)
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
