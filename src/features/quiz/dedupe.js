function normalizeQuestionKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    // Remove synthetic numbering prefixes like "Puzzle 301:".
    .replace(/^[a-z\s]{2,40}\s\d{1,5}\s*:\s*/i, "")
    // Normalize punctuation so tiny formatting differences dedupe correctly.
    .replace(/[^a-z0-9\s]/g, " ")
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
