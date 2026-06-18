/**
 * Parses a Markdown file into an array of question objects.
 *
 * Supported format:
 * ─────────────────────────────────────────────────────────────
 * # Subject: Data Structures
 *
 * ## Chapter: Arrays
 *
 * ### Topic: Two Pointers
 *
 * #### Question: Find pair with target sum
 * **Explanation:** Use two pointers starting from both ends...
 *
 * **Examples:**
 * - Given [1, 2, 3] and target 4
 * - Given [0, 0] and target 0
 *
 * **Input/Output:**
 * - Input: [1,2,3], 4 | Output: [1,3]
 * - Input: [0,0], 0   | Output: [0,0]
 *
 * **Solutions:**
 * ```python
 * def find_pair(arr, t): ...
 * ```
 * ─────────────────────────────────────────────────────────────
 */

/**
 * @typedef {{ text: string }} Example
 * @typedef {{ input: string, output: string }} IOExample
 * @typedef {{ language: string, code: string }} Solution
 * @typedef {{
 *   subjectName: string,
 *   chapterName: string,
 *   topicName:   string,
 *   title:       string,
 *   explanation: string,
 *   examples:    Example[],
 *   ioExamples:  IOExample[],
 *   solutions:   Solution[],
 * }} ParsedQuestion
 */

function trimLabel(line, prefix) {
  return line.replace(new RegExp(`^${prefix}\\s*`, 'i'), '').trim();
}

function extractCodeBlocks(text) {
  const solutions = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    solutions.push({
      language: match[1] || 'text',
      code: match[2].trimEnd(),
    });
  }
  return solutions;
}

function parseSectionContent(rawBlock) {
  const explanation_match = rawBlock.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/i);
  const explanation = explanation_match
    ? explanation_match[1].trim()
    : '';

  // Examples: lines under **Examples:**
  const examples = [];
  const examplesMatch = rawBlock.match(/\*\*Examples?:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/i);
  if (examplesMatch) {
    const lines = examplesMatch[1].split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/^[-*]\s*/, '').trim();
      if (trimmed) examples.push({ text: trimmed });
    }
  }

  // Input/Output pairs
  const ioExamples = [];
  const ioMatch = rawBlock.match(/\*\*Input\s*\/?\s*Output[^:]*:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/i);
  if (ioMatch) {
    const lines = ioMatch[1].split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/^[-*]\s*/, '').trim();
      if (!trimmed) continue;
      // Supports: "Input: X | Output: Y"  or  "Input: X → Output: Y"
      const sep = trimmed.match(/[|→]/);
      if (sep) {
        const parts = trimmed.split(/[|→]/);
        const inputPart = parts[0].trim().replace(/^input\s*:/i, '').trim();
        const outputPart = parts[1] ? parts[1].trim().replace(/^output\s*:/i, '').trim() : '';
        ioExamples.push({ input: inputPart, output: outputPart });
      } else {
        ioExamples.push({ input: trimmed, output: '' });
      }
    }
  }

  // Solutions: code blocks
  const solutions = extractCodeBlocks(rawBlock);

  return { explanation, examples, ioExamples, solutions };
}

/**
 * Main parser entry point.
 * @param {string} markdown
 * @returns {ParsedQuestion[]}
 */
export function parseQuestionMarkdown(markdown) {
  const lines = markdown.split('\n');
  const questions = [];

  let currentSubject = '';
  let currentChapter = '';
  let currentTopic = '';
  let currentTitle = '';
  let currentBlock = [];
  let inQuestion = false;

  function flushQuestion() {
    if (!inQuestion || !currentTitle) return;
    const block = currentBlock.join('\n');
    const { explanation, examples, ioExamples, solutions } = parseSectionContent(block);
    questions.push({
      subjectName: currentSubject,
      chapterName: currentChapter,
      topicName: currentTopic,
      title: currentTitle,
      explanation,
      examples,
      ioExamples,
      solutions,
    });
    currentBlock = [];
    inQuestion = false;
    currentTitle = '';
  }

  for (const line of lines) {
    // # Subject:
    if (/^#\s+Subject:\s*/i.test(line)) {
      flushQuestion();
      currentSubject = trimLabel(line, '#\\s+Subject:');
      currentChapter = '';
      currentTopic = '';
      continue;
    }
    // ## Chapter:
    if (/^##\s+Chapter:\s*/i.test(line)) {
      flushQuestion();
      currentChapter = trimLabel(line, '##\\s+Chapter:');
      currentTopic = '';
      continue;
    }
    // ### Topic:
    if (/^###\s+Topic:\s*/i.test(line)) {
      flushQuestion();
      currentTopic = trimLabel(line, '###\\s+Topic:');
      continue;
    }
    // #### Question:
    if (/^####\s+Question:\s*/i.test(line)) {
      flushQuestion();
      currentTitle = trimLabel(line, '####\\s+Question:');
      inQuestion = true;
      continue;
    }

    if (inQuestion) {
      currentBlock.push(line);
    }
  }

  flushQuestion();

  return questions.filter(
    (q) => q.subjectName && q.chapterName && q.topicName && q.title
  );
}

/**
 * Returns summary stats for a parsed questions array.
 */
export function getQuestionParseStats(questions) {
  return {
    subjects: new Set(questions.map((q) => q.subjectName)).size,
    chapters: new Set(questions.map((q) => `${q.subjectName}::${q.chapterName}`)).size,
    topics: new Set(questions.map((q) => `${q.subjectName}::${q.chapterName}::${q.topicName}`)).size,
    questions: questions.length,
  };
}
