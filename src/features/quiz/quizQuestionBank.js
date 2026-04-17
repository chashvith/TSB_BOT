const fs = require("fs");
const path = require("path");

const QUESTIONS_DIR = path.join(__dirname, "questions");
const SUPPORTED_THEMES = [
  "math",
  "puzzles",
  "programming",
  "general",
  "indian_history",
];

const SUPPORTED_DIFFICULTIES = ["basic", "medium", "advanced"];

function normalizeQuestion(raw) {
  const question = String(raw?.question || "").trim();
  const options = Array.isArray(raw?.options)
    ? raw.options.map((option) => String(option || "").trim())
    : [];
  const answer = String(raw?.answer || "").trim();
  const difficulty = String(raw?.difficulty || "basic")
    .trim()
    .toLowerCase();

  if (
    !question ||
    options.length !== 4 ||
    options.some((opt) => !opt) ||
    !answer ||
    !SUPPORTED_DIFFICULTIES.includes(difficulty)
  ) {
    return null;
  }

  return {
    question,
    options,
    answer,
    difficulty,
  };
}

function getThemePath(theme) {
  return path.join(QUESTIONS_DIR, `${theme}.json`);
}

function loadThemeQuestions(theme) {
  const normalizedTheme = String(theme || "")
    .trim()
    .toLowerCase();

  if (!SUPPORTED_THEMES.includes(normalizedTheme)) {
    return { ok: false, code: "INVALID_THEME", questions: [] };
  }

  const filePath = getThemePath(normalizedTheme);

  if (!fs.existsSync(filePath)) {
    return { ok: false, code: "MISSING_THEME_FILE", questions: [] };
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8").trim();
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return { ok: false, code: "INVALID_THEME_DATA", questions: [] };
    }

    const questions = parsed.map(normalizeQuestion).filter(Boolean);

    return {
      ok: true,
      theme: normalizedTheme,
      questions,
    };
  } catch (error) {
    return { ok: false, code: "READ_THEME_FAILED", error, questions: [] };
  }
}

function getThemeQuestionCounts() {
  return SUPPORTED_THEMES.map((theme) => {
    const loaded = loadThemeQuestions(theme);
    return {
      theme,
      ok: loaded.ok,
      count: loaded.ok ? loaded.questions.length : 0,
      code: loaded.ok ? null : loaded.code,
    };
  });
}

module.exports = {
  SUPPORTED_THEMES,
  SUPPORTED_DIFFICULTIES,
  loadThemeQuestions,
  getThemeQuestionCounts,
};
