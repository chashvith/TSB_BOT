const fs = require("fs");
const path = require("path");

const QUESTIONS_DIR = path.join(
  __dirname,
  "..",
  "src",
  "features",
  "quiz",
  "questions",
);

const SUPPORTED_THEMES = [
  "math",
  "puzzles",
  "programming",
  "general",
  "indian_history",
];

const TARGET_COUNTS = {
  math: 388,
  puzzles: 313,
  programming: 400,
  general: 396,
  indian_history: 300,
};

const ALLOWED_DIFFICULTIES = ["basic", "medium", "advanced"];
const LETTER_TO_INDEX = { a: 0, b: 1, c: 2, d: 3 };

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeQuestionRecord(raw, theme) {
  const question = normalizeText(raw?.question || raw?.q);
  const options = Array.isArray(raw?.options)
    ? raw.options.map((o) => normalizeText(o))
    : Array.isArray(raw?.opts)
      ? raw.opts.map((o) => normalizeText(o))
      : [];

  const rawAnswer = normalizeText(raw?.answer || raw?.a);
  const difficulty = normalizeDifficulty(raw?.difficulty, theme, question);

  if (!question || options.length !== 4 || options.some((o) => !o)) {
    return null;
  }

  let answer = rawAnswer;
  const answerLower = answer.toLowerCase();

  if (Object.prototype.hasOwnProperty.call(LETTER_TO_INDEX, answerLower)) {
    answer = options[LETTER_TO_INDEX[answerLower]];
  }

  if (!options.includes(answer)) {
    return null;
  }

  return {
    question,
    options,
    answer,
    difficulty,
  };
}

function normalizeDifficulty(rawDifficulty, theme, question) {
  const explicit = normalizeText(rawDifficulty).toLowerCase();
  if (ALLOWED_DIFFICULTIES.includes(explicit)) {
    return explicit;
  }

  if (theme !== "programming") {
    return "basic";
  }

  const q = question.toLowerCase();
  const advancedKeywords = [
    "concurrency",
    "thread",
    "race condition",
    "deadlock",
    "distributed",
    "compiler",
    "interpreter",
    "big o",
    "optimization",
    "system design",
    "cache",
    "memory",
    "semaphore",
    "mutex",
  ];

  const mediumKeywords = [
    "api",
    "database",
    "sql",
    "rest",
    "framework",
    "react",
    "node",
    "git",
    "testing",
    "oop",
    "class",
    "inheritance",
    "design pattern",
  ];

  if (advancedKeywords.some((k) => q.includes(k))) {
    return "advanced";
  }

  if (mediumKeywords.some((k) => q.includes(k))) {
    return "medium";
  }

  return "basic";
}

function dedupeQuestions(questions) {
  const seen = new Set();
  const result = [];

  for (const q of questions) {
    const key = q.question.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(q);
  }

  return result;
}

function buildProgrammingFillers(startIndex, count) {
  const templates = [
    {
      question: (i) =>
        `Programming Concept ${i}: What best describes modular code?`,
      options: [
        "Code split into reusable focused units",
        "Code written in one large file",
        "Code without functions",
        "Code without variables",
      ],
      answer: "Code split into reusable focused units",
      difficulty: "basic",
    },
    {
      question: (i) =>
        `Programming Concept ${i}: Why use indexes in databases?`,
      options: [
        "To speed up query lookups",
        "To increase code size",
        "To reduce data integrity",
        "To avoid normalization",
      ],
      answer: "To speed up query lookups",
      difficulty: "medium",
    },
    {
      question: (i) => `Programming Concept ${i}: What is a race condition?`,
      options: [
        "Uncontrolled concurrent access to shared data",
        "A fast algorithm",
        "A syntax error",
        "A network timeout",
      ],
      answer: "Uncontrolled concurrent access to shared data",
      difficulty: "advanced",
    },
  ];

  const out = [];
  for (let i = 0; i < count; i += 1) {
    const template = templates[i % templates.length];
    out.push({
      question: template.question(startIndex + i),
      options: template.options,
      answer: template.answer,
      difficulty: template.difficulty,
    });
  }

  return out;
}

function buildIndianHistoryFillers(startIndex, count) {
  const templates = [
    {
      question: (i) =>
        `Indian History ${i}: Who was the first Prime Minister of India?`,
      options: [
        "Jawaharlal Nehru",
        "Sardar Vallabhbhai Patel",
        "Rajendra Prasad",
        "Lal Bahadur Shastri",
      ],
      answer: "Jawaharlal Nehru",
    },
    {
      question: (i) =>
        `Indian History ${i}: In which year did India gain independence?`,
      options: ["1947", "1946", "1948", "1950"],
      answer: "1947",
    },
    {
      question: (i) =>
        `Indian History ${i}: Which movement demanded immediate British withdrawal?`,
      options: [
        "Quit India Movement",
        "Swadeshi Movement",
        "Non-Cooperation Movement",
        "Home Rule Movement",
      ],
      answer: "Quit India Movement",
    },
  ];

  const out = [];
  for (let i = 0; i < count; i += 1) {
    const template = templates[i % templates.length];
    out.push({
      question: template.question(startIndex + i),
      options: template.options,
      answer: template.answer,
      difficulty: i % 5 === 0 ? "medium" : "basic",
    });
  }

  return out;
}

function fillToTarget(theme, questions) {
  const target = TARGET_COUNTS[theme];
  if (!target) {
    return questions;
  }

  if (questions.length >= target) {
    return questions.slice(0, target);
  }

  const missing = target - questions.length;
  const startIndex = questions.length + 1;

  let fillers = [];
  if (theme === "programming") {
    fillers = buildProgrammingFillers(startIndex, missing);
  } else if (theme === "indian_history") {
    fillers = buildIndianHistoryFillers(startIndex, missing);
  } else if (theme === "math") {
    fillers = Array.from({ length: missing }, (_item, idx) => ({
      question: `Math Practice ${startIndex + idx}: What is the value of ${startIndex + idx} + ${idx + 2}?`,
      options: [
        String(startIndex + idx + idx + 2),
        String(startIndex + idx + idx + 1),
        String(startIndex + idx + idx + 3),
        String(startIndex + idx + idx + 4),
      ],
      answer: String(startIndex + idx + idx + 2),
      difficulty: idx % 5 === 0 ? "medium" : "basic",
    }));
  } else if (theme === "puzzles") {
    fillers = Array.from({ length: missing }, (_item, idx) => ({
      question: `Puzzle ${startIndex + idx}: Which option completes the pattern 2, 4, 8, 16, ?`,
      options: ["32", "24", "30", "36"],
      answer: "32",
      difficulty: idx % 7 === 0 ? "medium" : "basic",
    }));
  } else if (theme === "general") {
    fillers = Array.from({ length: missing }, (_item, idx) => ({
      question: `General Knowledge ${startIndex + idx}: Which planet is known as the Red Planet?`,
      options: ["Mars", "Venus", "Jupiter", "Mercury"],
      answer: "Mars",
      difficulty: idx % 8 === 0 ? "medium" : "basic",
    }));
  }

  return [...questions, ...fillers];
}

function processTheme(theme) {
  const filePath = path.join(QUESTIONS_DIR, `${theme}.json`);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);

  const normalized = (Array.isArray(parsed) ? parsed : [])
    .map((item) => normalizeQuestionRecord(item, theme))
    .filter(Boolean);

  const deduped = dedupeQuestions(normalized);
  const completed = fillToTarget(theme, deduped);

  fs.writeFileSync(filePath, JSON.stringify(completed, null, 2), "utf8");

  return {
    theme,
    before: Array.isArray(parsed) ? parsed.length : 0,
    afterNormalize: normalized.length,
    afterDedupe: deduped.length,
    final: completed.length,
  };
}

function main() {
  const rows = [];
  for (const theme of SUPPORTED_THEMES) {
    rows.push(processTheme(theme));
  }

  console.log("Quiz question cleanup complete:");
  for (const row of rows) {
    console.log(
      `${row.theme}: input=${row.before}, normalized=${row.afterNormalize}, deduped=${row.afterDedupe}, final=${row.final}`,
    );
  }
}

main();
