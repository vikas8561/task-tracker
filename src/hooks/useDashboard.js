import { supabase } from '../lib/supabase';
import { calculateStreak } from '../utils/streakCalculator';


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

  const [totalRes, completedRes, todayRes, completedData] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_completed', true),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('due_date', todayStr),
    supabase.from('tasks').select('completed_at').eq('is_completed', true).not('completed_at', 'is', null),
  ]);

  const totalTasks = totalRes.count || 0;
  const completedTasks = completedRes.count || 0;
  const todaysTasks = todayRes.count || 0;
  const completedTimestamps = (completedData.data || []).map((t) => t.completed_at);
  const streak = calculateStreak(completedTimestamps);

  return {
    totalTasks,
    completedTasks,
    todaysTasks,
    streak,
    completedTimestamps,
    overallProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
}

export async function fetchProgressBySubject() {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('subject_id, is_completed, subjects(id, name, color)')
    ;

  const subjectMap = {};
  for (const task of tasks || []) {
    const sid = task.subject_id;
    if (!subjectMap[sid]) {
      subjectMap[sid] = {
        id: sid,
        name: task.subjects?.name,
        color: task.subjects?.color,
        total: 0,
        completed: 0,
      };
    }
    subjectMap[sid].total++;
    if (task.is_completed) subjectMap[sid].completed++;
  }

  return Object.values(subjectMap).map((s) => ({
    ...s,
    percentage: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
  }));
}

export async function fetchProgressByChapter() {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('chapter_id, subject_id, is_completed, chapters(id, name), subjects(id, name, color)')
    ;

  const chapterMap = {};
  for (const task of tasks || []) {
    const cid = task.chapter_id;
    if (!chapterMap[cid]) {
      chapterMap[cid] = {
        id: cid,
        name: task.chapters?.name,
        subjectId: task.subject_id,
        subjectName: task.subjects?.name,
        subjectColor: task.subjects?.color,
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
  const { data } = await supabase
    .from('tasks')
    .select(`*, subjects(id, name, color), chapters(id, name), topics(id, name)`)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}
