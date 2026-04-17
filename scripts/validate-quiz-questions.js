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

const THEMES = ["math", "puzzles", "programming", "general", "indian_history"];
const TARGET_COUNTS = {
  programming: 400,
  indian_history: 300,
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function validateTheme(theme) {
  const filePath = path.join(QUESTIONS_DIR, `${theme}.json`);
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const issues = [];

  if (!Array.isArray(parsed)) {
    issues.push("File must contain a JSON array");
    return { theme, count: 0, issues };
  }

  const seen = new Set();

  parsed.forEach((q, index) => {
    const id = `${theme}[${index}]`;
    const question = normalizeText(q?.question);
    const options = Array.isArray(q?.options)
      ? q.options.map((o) => normalizeText(o))
      : [];
    const answer = normalizeText(q?.answer);

    if (!question) {
      issues.push(`${id}: empty question`);
      return;
    }

    const key = question.toLowerCase();
    if (seen.has(key)) {
      issues.push(`${id}: duplicate question text`);
    }
    seen.add(key);

    if (options.length !== 4 || options.some((o) => !o)) {
      issues.push(`${id}: options must be 4 non-empty values`);
    }

    if (!answer) {
      issues.push(`${id}: missing answer`);
    } else if (!options.includes(answer)) {
      issues.push(`${id}: answer is not one of the options`);
    }

    const difficulty = normalizeText(q?.difficulty).toLowerCase();
    if (!["basic", "medium", "advanced"].includes(difficulty)) {
      issues.push(`${id}: invalid or missing difficulty`);
    }
  });

  const target = TARGET_COUNTS[theme];
  if (target && parsed.length !== target) {
    issues.push(
      `${theme}: expected ${target} questions, found ${parsed.length}`,
    );
  }

  return {
    theme,
    count: parsed.length,
    issues,
  };
}

function main() {
  const results = THEMES.map(validateTheme);
  const allIssues = results.flatMap((r) => r.issues);

  for (const result of results) {
    console.log(`${result.theme}: ${result.count} questions`);
  }

  if (allIssues.length) {
    console.error("\nValidation failed with issues:");
    allIssues.forEach((issue) => console.error(`- ${issue}`));
    process.exit(1);
  }

  console.log("\nValidation passed: all quiz themes are consistent.");
}

main();
