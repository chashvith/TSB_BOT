function normalizeQuestionKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function dedupeByQuestionText(questions) {
  const unique = [];
  const seen = new Set();

  for (const question of Array.isArray(questions) ? questions : []) {
    const key = normalizeQuestionKey(question?.question);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(question);
  }

  return unique;
}

function mergeUniqueQuestions(existing, incoming) {
  return dedupeByQuestionText([
    ...(Array.isArray(existing) ? existing : []),
    ...(Array.isArray(incoming) ? incoming : []),
  ]);
}

module.exports = {
  normalizeQuestionKey,
  dedupeByQuestionText,
  mergeUniqueQuestions,
};
