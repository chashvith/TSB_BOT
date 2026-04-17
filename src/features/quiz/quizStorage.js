const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "data");
const QUIZ_FILE = path.join(DATA_PATH, "quiz-duels.json");

function createDefaultData() {
  return {
    allTimeStats: {},
    weeklyStats: {},
  };
}

function normalizeStatEntry(value) {
  return {
    wins: Number.isFinite(Number(value?.wins)) ? Number(value.wins) : 0,
    losses: Number.isFinite(Number(value?.losses)) ? Number(value.losses) : 0,
    draws: Number.isFinite(Number(value?.draws)) ? Number(value.draws) : 0,
    gamesPlayed: Number.isFinite(Number(value?.gamesPlayed))
      ? Number(value.gamesPlayed)
      : 0,
    winStreak: Number.isFinite(Number(value?.winStreak))
      ? Number(value.winStreak)
      : 0,
    bestWinStreak: Number.isFinite(Number(value?.bestWinStreak))
      ? Number(value.bestWinStreak)
      : 0,
    updatedAt: String(value?.updatedAt || "").trim() || null,
  };
}

function normalizeStatsMap(stats) {
  const safeStats =
    stats && typeof stats === "object" && !Array.isArray(stats) ? stats : {};

  const normalizedStats = {};
  for (const [key, value] of Object.entries(safeStats)) {
    normalizedStats[String(key)] = normalizeStatEntry(value);
  }

  return normalizedStats;
}

function getWeekKeyFromDate(date) {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);

  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(current.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

function ensureStorageFile(logger) {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
    logger.info("Created quiz data directory", { path: DATA_PATH });
  }

  if (!fs.existsSync(QUIZ_FILE)) {
    fs.writeFileSync(
      QUIZ_FILE,
      JSON.stringify(createDefaultData(), null, 2),
      "utf8",
    );
    logger.info("Created quiz data file", { path: QUIZ_FILE });
  }
}

function sanitizeData(rawData) {
  const safe =
    rawData && typeof rawData === "object" ? rawData : createDefaultData();

  // Backward compatibility for previous single-map schema.
  const legacyStats =
    safe.stats && typeof safe.stats === "object" && !Array.isArray(safe.stats)
      ? safe.stats
      : null;

  const allTimeStats = normalizeStatsMap(
    safe.allTimeStats || legacyStats || {},
  );

  const rawWeeklyStats =
    safe.weeklyStats &&
    typeof safe.weeklyStats === "object" &&
    !Array.isArray(safe.weeklyStats)
      ? safe.weeklyStats
      : {};

  const weeklyStats = {};
  for (const [weekKey, weekValue] of Object.entries(rawWeeklyStats)) {
    weeklyStats[String(weekKey)] = normalizeStatsMap(weekValue);
  }

  if (!Object.keys(weeklyStats).length && legacyStats) {
    weeklyStats[getWeekKeyFromDate(new Date())] =
      normalizeStatsMap(legacyStats);
  }

  return {
    allTimeStats,
    weeklyStats,
  };
}

function loadData(logger) {
  ensureStorageFile(logger);

  try {
    const raw = fs.readFileSync(QUIZ_FILE, "utf8").trim();
    const parsed = raw ? JSON.parse(raw) : createDefaultData();
    return sanitizeData(parsed);
  } catch (error) {
    logger.error("Failed to parse quiz duel data file, using defaults", {
      error: error.message,
    });
    return createDefaultData();
  }
}

function saveData(data, logger) {
  ensureStorageFile(logger);

  try {
    fs.writeFileSync(
      QUIZ_FILE,
      JSON.stringify(sanitizeData(data), null, 2),
      "utf8",
    );
  } catch (error) {
    logger.error("Failed to persist quiz duel data file", {
      error: error.message,
    });
  }
}

module.exports = {
  ensureStorageFile,
  loadData,
  saveData,
  getWeekKeyFromDate,
};
