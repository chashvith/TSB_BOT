const { preloadQuizQuestions } = require("./preload");
const { generateQuestionsFromGroq } = require("./apiGenerator");
const { readThemeQuestions, writeThemeQuestions } = require("./fileManager");
const { mergeUniqueQuestions, normalizeQuestionKey } = require("./dedupe");

const QUIZ_THEMES = ["general", "math", "dsa", "puzzles"];
const STARTUP_MIN_DYNAMIC = 50;
const REFILL_THRESHOLD = 20;
const REFILL_BATCH_SIZE = 20;
const REFILL_INTERVAL_MS = 5 * 60 * 1000;
const RECENT_BUFFER_SIZE = 120;

class QuizQuestionService {
  constructor({ logger }) {
    this.logger = logger;
    this.dynamicPools = new Map();
    this.fallbackPools = new Map();
    this.recentQuestionBuffers = new Map();
    this.refillTimer = null;
    this.refillInFlight = false;
  }

  async preloadOnStartup() {
    const preloaded = await preloadQuizQuestions({
      themes: QUIZ_THEMES,
      logger: this.logger,
      minDynamicCount: STARTUP_MIN_DYNAMIC,
      batchSize: REFILL_BATCH_SIZE,
      generateQuestions: generateQuestionsFromGroq,
    });

    for (const theme of QUIZ_THEMES) {
      this.dynamicPools.set(theme, preloaded.dynamicPools[theme] || []);
      this.fallbackPools.set(theme, preloaded.fallbackPools[theme] || []);
      this.recentQuestionBuffers.set(theme, []);
    }
  }

  startBackgroundRefill() {
    if (this.refillTimer) {
      return;
    }

    this.refillTimer = setInterval(() => {
      this.refillLowThemes().catch((error) => {
        this.logger.warn("Quiz refill task failed", { error: error.message });
      });
    }, REFILL_INTERVAL_MS);

    this.refillTimer.unref();
  }

  stopBackgroundRefill() {
    if (!this.refillTimer) {
      return;
    }

    clearInterval(this.refillTimer);
    this.refillTimer = null;
  }

  isSupportedTheme(theme) {
    return QUIZ_THEMES.includes(
      String(theme || "")
        .trim()
        .toLowerCase(),
    );
  }

  normalizeTheme(theme) {
    return String(theme || "")
      .trim()
      .toLowerCase();
  }

  getThemeQuestionCounts() {
    return QUIZ_THEMES.map((theme) => {
      const dynamic = this.dynamicPools.get(theme) || [];
      const fallback = this.fallbackPools.get(theme) || [];

      return {
        theme,
        dynamicCount: dynamic.length,
        fallbackCount: fallback.length,
        totalCount: dynamic.length + fallback.length,
      };
    });
  }

  getQuestion(theme) {
    const normalizedTheme = this.normalizeTheme(theme);
    if (!this.isSupportedTheme(normalizedTheme)) {
      return null;
    }

    const dynamicPool = this.dynamicPools.get(normalizedTheme) || [];
    const fallbackPool = this.fallbackPools.get(normalizedTheme) || [];

    if (dynamicPool.length > 0) {
      const question = this.pickQuestionWithRecentAvoidance(
        normalizedTheme,
        dynamicPool,
      );
      if (question) {
        return question;
      }
    }

    if (fallbackPool.length > 0) {
      return this.pickQuestionWithRecentAvoidance(
        normalizedTheme,
        fallbackPool,
      );
    }

    return null;
  }

  getQuestionsForDuel(theme, count) {
    const normalizedTheme = this.normalizeTheme(theme);
    const safeCount = Number(count);

    if (
      !this.isSupportedTheme(normalizedTheme) ||
      !Number.isFinite(safeCount)
    ) {
      return [];
    }

    const dynamicPool = this.dynamicPools.get(normalizedTheme) || [];
    const fallbackPool = this.fallbackPools.get(normalizedTheme) || [];
    const recent = this.recentQuestionBuffers.get(normalizedTheme) || [];
    const recentSet = new Set(recent);

    const mergeUniqueByQuestion = (questions) => {
      const seen = new Set();
      const unique = [];

      for (const question of questions) {
        const key = normalizeQuestionKey(question?.question);
        if (!key || seen.has(key)) {
          continue;
        }

        seen.add(key);
        unique.push(question);
      }

      return unique;
    };

    const pickShuffled = (questions, limit) => {
      const shuffled = [...questions];
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [
          shuffled[randomIndex],
          shuffled[index],
        ];
      }

      return shuffled.slice(0, limit);
    };

    // Prefer dynamic pool, then fallback, while avoiding recently used questions.
    const preferredPool = mergeUniqueByQuestion([...dynamicPool, ...fallbackPool]);
    const nonRecentPool = preferredPool.filter(
      (question) => !recentSet.has(normalizeQuestionKey(question.question)),
    );

    let picked = pickShuffled(nonRecentPool, safeCount);
    if (picked.length < safeCount) {
      const missing = safeCount - picked.length;
      const pickedSet = new Set(
        picked.map((question) => normalizeQuestionKey(question.question)),
      );

      const refillCandidates = preferredPool.filter((question) => {
        const key = normalizeQuestionKey(question.question);
        return key && !pickedSet.has(key);
      });

      picked = [...picked, ...pickShuffled(refillCandidates, missing)];
    }

    // Mark selected prompts as recent so next duel rotates to fresh ones.
    for (const question of picked) {
      this.markRecent(normalizedTheme, question.question);
    }

    return picked;
  }

  pickQuestionWithRecentAvoidance(theme, pool) {
    if (!Array.isArray(pool) || !pool.length) {
      return null;
    }

    const recent = this.recentQuestionBuffers.get(theme) || [];
    const recentSet = new Set(recent);

    let candidates = pool.filter(
      (question) => !recentSet.has(normalizeQuestionKey(question.question)),
    );

    if (!candidates.length) {
      candidates = pool;
    }

    const index = Math.floor(Math.random() * candidates.length);
    const selected = candidates[index] || null;

    if (selected) {
      this.markRecent(theme, selected.question);
    }

    return selected;
  }

  markRecent(theme, questionText) {
    const key = normalizeQuestionKey(questionText);
    if (!key) {
      return;
    }

    const recent = this.recentQuestionBuffers.get(theme) || [];
    recent.push(key);

    if (recent.length > RECENT_BUFFER_SIZE) {
      recent.splice(0, recent.length - RECENT_BUFFER_SIZE);
    }

    this.recentQuestionBuffers.set(theme, recent);
  }

  async refillLowThemes() {
    if (this.refillInFlight) {
      return;
    }

    this.refillInFlight = true;

    try {
      for (const theme of QUIZ_THEMES) {
        const existing = this.dynamicPools.get(theme) || [];
        if (existing.length >= REFILL_THRESHOLD) {
          continue;
        }

        const generated = await generateQuestionsFromGroq({
          theme,
          count: REFILL_BATCH_SIZE,
          logger: this.logger,
        });

        if (!generated.length) {
          continue;
        }

        const merged = mergeUniqueQuestions(existing, generated);
        const saved = writeThemeQuestions(
          "dynamic",
          theme,
          merged,
          this.logger,
        );

        this.dynamicPools.set(theme, saved);
        this.logger.info("Quiz dynamic pool refilled", {
          theme,
          previousCount: existing.length,
          generatedCount: generated.length,
          newCount: saved.length,
        });
      }
    } finally {
      this.refillInFlight = false;
    }
  }

  reloadTheme(theme) {
    const normalizedTheme = this.normalizeTheme(theme);
    if (!this.isSupportedTheme(normalizedTheme)) {
      return null;
    }

    const dynamic = readThemeQuestions("dynamic", normalizedTheme, this.logger);
    const fallback = readThemeQuestions(
      "fallback",
      normalizedTheme,
      this.logger,
    );

    this.dynamicPools.set(normalizedTheme, dynamic);
    this.fallbackPools.set(normalizedTheme, fallback);

    return {
      theme: normalizedTheme,
      dynamicCount: dynamic.length,
      fallbackCount: fallback.length,
    };
  }
}

module.exports = {
  QuizQuestionService,
  QUIZ_THEMES,
};
