import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/localAuth';

// Tracks whether user_task_states table exists in the DB.
// Set to false on first 400 so we stop firing failing requests.
let userTaskStatesAvailable = true;


// Helper to fetch ALL user task states (avoids URL-length issues with large IN lists)
async function fetchUserTaskStates(taskIds) {
  if (!userTaskStatesAvailable) return {};
  if (!taskIds || taskIds.length === 0) return {};
  const user = getCurrentUser();
  if (!user) return {};

  // Fetch all states for the user in one query — no IN clause needed.
  // For very targeted fetches (≤50 IDs) we still use IN to avoid over-fetching.
  let query = supabase
    .from('user_task_states')
    .select('*')
    .eq('user_id', user.id);

  if (taskIds.length <= 50) {
    query = query.in('task_id', taskIds);
  }

  const { data, error } = await query;
  if (error) {
    // 400 = table doesn't exist yet — stop trying until page reload
    if (error.code === '42P01' || error.message?.includes('relation') || error.status === 400) {
      userTaskStatesAvailable = false;
      console.warn('[user_task_states] Table not found. Run the schema SQL in Supabase to enable task state persistence.');
    }
    return {};
  }

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
    .order('created_at', { ascending: true })
    .limit(10000); // override PostgREST default cap (often 100–1000 on free tier)

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

/**
 * Fetch all tasks for a single chapter (lazy-loaded on chapter expand).
 * Returns tasks with user task states (is_completed, is_revision) merged in.
 * Only called when the user first opens a chapter — never on initial page load.
 */
export async function fetchChapterTasks(chapterId) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      subjects(id, name, color),
      chapters(id, name),
      topics(id, name),
      sub_topics(id, name)
    `)
    .eq('chapter_id', chapterId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(5000);

  if (error) {
    if (error.code === '42P01' || error.code === '42703') {
      console.warn('Schema not fully applied yet:', error.message);
      return [];
    }
    throw error;
  }

  if (!data.length) return [];

  const stateMap = await fetchUserTaskStates(data.map(t => t.id));
  return data.map(t => ({
    ...t,
    is_completed: stateMap[t.id]?.is_completed || false,
    is_revision:  stateMap[t.id]?.is_revision  || false,
    completed_at: stateMap[t.id]?.completed_at || null,
  }));
}

export async function createTask(taskData) {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...taskData, user_id: user.id }])
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
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const tasksWithUser = tasksArray.map(task => ({
    ...task,
    user_id: user.id
  }));

  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksWithUser)
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


// Upsert task state: SELECT first, then UPDATE or INSERT.
// Skips entirely if the table is known to be unavailable.
async function upsertTaskState(userId, taskId, fields) {
  if (!userTaskStatesAvailable) throw new Error('user_task_states table unavailable');

  const { data: existing, error: selectError } = await supabase
    .from('user_task_states')
    .select('user_id,task_id')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .maybeSingle();

  if (selectError) {
    // Mark table as unavailable so we stop hitting the DB on every toggle
    if (selectError.code === '42P01' || selectError.message?.includes('relation') || selectError.status === 400) {
      userTaskStatesAvailable = false;
      console.warn('[user_task_states] Table not found. Run the schema SQL in Supabase to enable task state persistence.');
    }
    throw selectError;
  }

  if (existing) {
    // Row exists → UPDATE
    const { data, error } = await supabase
      .from('user_task_states')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // No row yet → INSERT
    const { data, error } = await supabase
      .from('user_task_states')
      .insert({ user_id: userId, task_id: taskId, ...fields })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function toggleComplete(task) {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const nowCompleted = !task.is_completed;
  const completedAt = nowCompleted ? new Date().toISOString() : null;

  try {
    const data = await upsertTaskState(user.id, task.id, {
      is_completed: nowCompleted,
      completed_at: completedAt,
      is_revision: task.is_revision || false,
    });
    return {
      ...task,
      is_completed: data.is_completed,
      completed_at: data.completed_at,
      is_revision: data.is_revision,
    };
  } catch (err) {
    // Table missing (400) — degrade to local-state-only so UI still responds
    console.warn('[toggleComplete] DB unavailable, using local state:', err.message);
    return { ...task, is_completed: nowCompleted, completed_at: completedAt };
  }
}

export async function toggleRevision(task) {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const nowRevision = !task.is_revision;

  try {
    const data = await upsertTaskState(user.id, task.id, {
      is_completed: task.is_completed || false,
      completed_at: task.completed_at || null,
      is_revision: nowRevision,
    });
    return {
      ...task,
      is_completed: data.is_completed,
      completed_at: data.completed_at,
      is_revision: data.is_revision,
    };
  } catch (err) {
    // Table missing (400) — degrade to local-state-only so UI still responds
    console.warn('[toggleRevision] DB unavailable, using local state:', err.message);
    return { ...task, is_revision: nowRevision };
  }
}

export async function fetchAllCompletedTimestamps() {
  const user = getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_task_states')
    .select('completed_at')
    .eq('user_id', user.id)
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
