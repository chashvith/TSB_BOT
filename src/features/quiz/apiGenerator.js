const { sanitizeQuestion } = require("./fileManager");
const { dedupeByQuestionText } = require("./dedupe");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

function parseArrayFromText(content) {
  const trimmed = String(content || "").trim();
  if (!trimmed) {
    return [];
  }

  try {
    const direct = JSON.parse(trimmed);
    return Array.isArray(direct) ? direct : [];
  } catch {
    const start = trimmed.indexOf("[");
    const end = trimmed.lastIndexOf("]");
    if (start < 0 || end <= start) {
      return [];
    }

    try {
      const slice = trimmed.slice(start, end + 1);
      const parsed = JSON.parse(slice);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

async function generateQuestionsFromGroq({ theme, count = 20, logger }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn("GROQ_API_KEY missing, skipping dynamic question generation", {
      theme,
    });
    return [];
  }

  const prompt = [
    "Generate quiz questions as valid JSON array only.",
    `Theme: ${theme}`,
    `Count: ${count}`,
    "Difficulty: medium",
    "Rules:",
    "- Each item must have: question, options, answer",
    "- options must contain exactly 4 unique strings",
    "- answer must exactly match one option",
    "- Avoid overly common or repeated questions",
    "- No markdown, no explanation, no extra keys",
  ].join("\n");

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              "You create high-quality MCQ sets. Output strict JSON arrays only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      logger.warn("Groq generation request failed", {
        theme,
        status: response.status,
        body: errorBody.slice(0, 300),
      });
      return [];
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content || "";
    const parsed = parseArrayFromText(content);

    return dedupeByQuestionText(parsed.map(sanitizeQuestion).filter(Boolean));
  } catch (error) {
    logger.warn("Groq generation call threw", {
      theme,
      error: error.message,
    });
    return [];
  }
}

module.exports = {
  generateQuestionsFromGroq,
};
