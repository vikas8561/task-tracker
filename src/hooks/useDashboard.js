import { supabase } from '../lib/supabase';
import { calculateStreak } from '../utils/streakCalculator';
import { normalizeSubjectColor } from '../utils/subjectColor';
import { fetchTasks } from './useTasks';
import { getCurrentUser } from '../lib/localAuth';

// Safe query wrapper — returns fallback value instead of throwing on DB errors
async function safeQuery(fn, fallback) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function fetchDashboardStats() {
  const todayStr = new Date().toISOString().split('T')[0];
  const user = getCurrentUser();

  // Get true total tasks
  const { count: totalTasks, error: tError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true });

  // Get true todays tasks
  const { count: todaysTasks, error: todayError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('due_date', todayStr);

  let completedTasks = 0;
  let completedTimestamps = [];
  
  if (user) {
    const { data: states, error: sError } = await supabase
      .from('user_task_states')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('is_completed', true);
      
    if (!sError && states) {
      completedTasks = states.length;
      completedTimestamps = states.map(s => s.completed_at).filter(Boolean);
    }
  }

  const streak = calculateStreak(completedTimestamps);

  const finalTotal = totalTasks || 0;
  const finalTodays = todaysTasks || 0;

  return {
    totalTasks: finalTotal,
    completedTasks,
    todaysTasks: finalTodays,
    streak,
    completedTimestamps,
    overallProgress: finalTotal > 0 ? Math.round((completedTasks / finalTotal) * 100) : 0,
  };
}

export async function fetchProgressBySubject() {
  const allTasks = await safeQuery(() => fetchTasks(), []);

  const subjectMap = {};
  for (const task of allTasks) {
    const sid = task.subject_id;
    if (!subjectMap[sid]) {
      subjectMap[sid] = {
        id: sid,
        name: task.subjects?.name,
        color: normalizeSubjectColor(task.subjects?.color, sid),
        total: 0,
        completed: 0,
        createdAtDates: [],
        completedAtDates: [],
      };
    }
    subjectMap[sid].total++;
    if (task.created_at) subjectMap[sid].createdAtDates.push(new Date(task.created_at).getTime());

    if (task.is_completed) {
      subjectMap[sid].completed++;
      if (task.completed_at) {
        subjectMap[sid].completedAtDates.push(new Date(task.completed_at).getTime());
      }
    }
  }

  return Object.values(subjectMap).map((s) => {
    const percentage = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;

    let predictedCompletionDate = null;
    let lastCompletedAt = null;

    if (s.completedAtDates.length > 0) {
      const sortedCompleted = [...s.completedAtDates].sort((a, b) => a - b);
      lastCompletedAt = sortedCompleted[sortedCompleted.length - 1];
    }

    if (percentage < 100 && s.completed > 0 && s.createdAtDates.length > 0) {
      const sortedCreated = [...s.createdAtDates].sort((a, b) => a - b);
      const firstCreatedAt = sortedCreated[0];
      const now = Date.now();

      // Calculate elapsed days since the first task was created
      const elapsedMs = now - firstCreatedAt;
      const elapsedDays = Math.max(1, elapsedMs / (1000 * 60 * 60 * 24)); // Minimum 1 day to avoid infinite velocity

      const tasksPerDay = s.completed / elapsedDays;
      const remainingTasks = s.total - s.completed;

      if (tasksPerDay > 0) {
        const remainingDays = remainingTasks / tasksPerDay;
        const predictedDate = new Date(now + remainingDays * 24 * 60 * 60 * 1000);
        predictedCompletionDate = predictedDate.toISOString();
      }
    }

    // Clean up massive arrays before returning to keep payload small
    delete s.createdAtDates;
    delete s.completedAtDates;

    return {
      ...s,
      percentage,
      predictedCompletionDate,
      lastCompletedAt
    };
  });
}

export async function fetchProgressByChapter() {
  const allTasks = await safeQuery(() => fetchTasks(), []);

  const chapterMap = {};
  for (const task of allTasks) {
    const cid = task.chapter_id;
    if (!chapterMap[cid]) {
      chapterMap[cid] = {
        id: cid,
        name: task.chapters?.name,
        subjectId: task.subject_id,
        subjectName: task.subjects?.name,
        subjectColor: normalizeSubjectColor(task.subjects?.color, task.subject_id),
        total: 0,
        completed: 0,
      };
    }
    chapterMap[cid].total++;
    if (task.is_completed) chapterMap[cid].completed++;
  }

  return Object.values(chapterMap).map((c) => ({
    ...c,
    percentage: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
  }));
}

export async function fetchRecentTasks(limit = 5) {
  // Sort manually by created_at desc
  const allTasks = await safeQuery(() => fetchTasks(), []);

  const sorted = allTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const data = sorted.slice(0, limit);

  return data.map((task) => ({
    ...task,
    subjects: task.subjects
      ? {
        ...task.subjects,
        color: normalizeSubjectColor(task.subjects.color, task.subjects.id),
      }
      : null,
  }));
}
