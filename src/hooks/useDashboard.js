import { supabase } from '../lib/supabase';
import { calculateStreak } from '../utils/streakCalculator';
import { normalizeSubjectColor } from '../utils/subjectColor';
import { fetchTasks } from './useTasks';

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
  const allTasks = await safeQuery(() => fetchTasks(), []);

  const totalTasks = allTasks.length;
  const todaysTasks = allTasks.filter(t => t.due_date === todayStr).length;
  const completedTasksData = allTasks.filter(t => t.is_completed);
  const completedTasks = completedTasksData.length;
  const completedTimestamps = completedTasksData.map(t => t.completed_at).filter(Boolean);
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
