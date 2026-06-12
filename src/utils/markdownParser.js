/**
 * Parses a markdown string into structured task objects.
 *
 * Supported format:
 * # Subject: <name>
 * ## Chapter: <name>
 * ### Topic: <name>
 * #### Sub-topic: <name>  (optional)
 * - [ ] Task title | priority: high | due: YYYY-MM-DD | revision: true
 * - [x] Already completed task
 */
export function parseMarkdown(content) {
  const lines = content.split('\n');
  const tasks = [];

  let currentSubject = null;
  let currentChapter = null;
  let currentTopic = null;
  let currentSubTopic = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // # Subject:
    const subjectMatch = line.match(/^#\s+Subject:\s*(.+)/i);
    if (subjectMatch) {
      currentSubject = subjectMatch[1].trim();
      currentChapter = null;
      currentTopic = null;
      currentSubTopic = null;
      continue;
    }

    // ## Chapter:
    const chapterMatch = line.match(/^##\s+Chapter:\s*(.+)/i);
    if (chapterMatch) {
      currentChapter = chapterMatch[1].trim();
      currentTopic = null;
      currentSubTopic = null;
      continue;
    }

    // ### Topic:
    const topicMatch = line.match(/^###\s+Topic:\s*(.+)/i);
    if (topicMatch) {
      currentTopic = topicMatch[1].trim();
      currentSubTopic = null;
      continue;
    }

    // #### Sub-topic:
    const subTopicMatch = line.match(/^####\s+Sub-topic:\s*(.+)/i);
    if (subTopicMatch) {
      currentSubTopic = subTopicMatch[1].trim();
      continue;
    }

    // - [ ] or - [x] task line
    const taskMatch = line.match(/^-\s+\[([ xX])\]\s+(.+)/);
    if (taskMatch) {
      const isCompleted = taskMatch[1].toLowerCase() === 'x';
      const rest = taskMatch[2];

      // Split on | to get metadata
      const parts = rest.split('|').map((p) => p.trim());
      const title = parts[0];
      let priority = null;
      let dueDate = null;
      let isRevision = false;

      for (let i = 1; i < parts.length; i++) {
        const meta = parts[i].toLowerCase();
        if (meta.startsWith('priority:')) {
          const val = parts[i].split(':')[1].trim().toLowerCase();
          if (['high', 'medium', 'low'].includes(val)) priority = val;
        } else if (meta.startsWith('due:')) {
          dueDate = parts[i].split(':')[1].trim();
        } else if (meta.startsWith('revision:')) {
          isRevision = parts[i].split(':')[1].trim().toLowerCase() === 'true';
        }
      }

      if (title && currentSubject && currentChapter && currentTopic) {
        tasks.push({
          subjectName: currentSubject,
          chapterName: currentChapter,
          topicName: currentTopic,
          subTopicName: currentSubTopic || null,
          title,
          priority,
          due_date: dueDate || null,
          is_revision: isRevision,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        });
      }
    }
  }

  return tasks;
}

/**
 * Returns a summary of what was parsed
 */
export function getParseStats(tasks) {
  const subjects = new Set(tasks.map((t) => t.subjectName));
  const chapters = new Set(tasks.map((t) => `${t.subjectName}::${t.chapterName}`));
  const topics = new Set(tasks.map((t) => `${t.chapterName}::${t.topicName}`));
  return {
    subjects: subjects.size,
    chapters: chapters.size,
    topics: topics.size,
    tasks: tasks.length,
  };
}
