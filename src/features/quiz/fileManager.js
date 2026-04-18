const fs = require("fs");
const path = require("path");
const { dedupeByQuestionText } = require("./dedupe");

const QUESTIONS_ROOT = path.join(__dirname, "questions");
const DYNAMIC_DIR = path.join(QUESTIONS_ROOT, "dynamic");
const FALLBACK_DIR = path.join(QUESTIONS_ROOT, "fallback");

function resolvePoolDir(poolType) {
  return poolType === "fallback" ? FALLBACK_DIR : DYNAMIC_DIR;
}

function sanitizeQuestion(raw) {
  const question = String(raw?.question || "").trim();
  const options = Array.isArray(raw?.options)
    ? raw.options.map((option) => String(option || "").trim()).filter(Boolean)
    : [];
  const answer = String(raw?.answer || "").trim();

  if (!question || options.length !== 4 || !answer) {
    return null;
  }

  return {
    question,
    options,
    answer,
  };
}

function ensureFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]\n", "utf8");
  }
}

function getThemePath(poolType, theme) {
  return path.join(resolvePoolDir(poolType), `${theme}.json`);
}

function ensureThemeFiles(themes) {
  for (const theme of themes) {
    ensureFile(getThemePath("dynamic", theme));
    ensureFile(getThemePath("fallback", theme));
  }
}

function readThemeQuestions(poolType, theme, logger) {
  const filePath = getThemePath(poolType, theme);
  ensureFile(filePath);

  try {
    const raw = fs.readFileSync(filePath, "utf8").trim();
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return dedupeByQuestionText(parsed.map(sanitizeQuestion).filter(Boolean));
  } catch (error) {
    logger.warn("Failed to read quiz question file", {
      poolType,
      theme,
      filePath,
      error: error.message,
    });
    return [];
  }
}

function writeThemeQuestions(poolType, theme, questions, logger) {
  const filePath = getThemePath(poolType, theme);
  ensureFile(filePath);

  const safeQuestions = dedupeByQuestionText(
    (Array.isArray(questions) ? questions : [])
      .map(sanitizeQuestion)
      .filter(Boolean),
  );

  try {
    fs.writeFileSync(
      filePath,
      `${JSON.stringify(safeQuestions, null, 2)}\n`,
      "utf8",
    );
  } catch (error) {
    logger.error("Failed to write quiz question file", {
      poolType,
      theme,
      filePath,
      error: error.message,
    });
  }

  return safeQuestions;
}

module.exports = {
  QUESTIONS_ROOT,
  DYNAMIC_DIR,
  FALLBACK_DIR,
  sanitizeQuestion,
  ensureThemeFiles,
  getThemePath,
  readThemeQuestions,
  writeThemeQuestions,
};
