const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "data");
const PRODUCTIVITY_FILE = path.join(DATA_PATH, "productivity.json");

function createDefaultData() {
  return {
    users: {},
    tasks: [],
    meta: {
      lastResetAt: new Date().toISOString(),
      history: [],
    },
  };
}

function ensureStorageFile(logger) {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
    logger.info("Created productivity data directory", { path: DATA_PATH });
  }

  if (!fs.existsSync(PRODUCTIVITY_FILE)) {
    fs.writeFileSync(
      PRODUCTIVITY_FILE,
      JSON.stringify(createDefaultData(), null, 2),
      "utf8",
    );
    logger.info("Created productivity data file", { path: PRODUCTIVITY_FILE });
  }
}

function sanitizeData(rawData) {
  const safe =
    rawData && typeof rawData === "object" ? rawData : createDefaultData();

  return {
    users: safe.users && typeof safe.users === "object" ? safe.users : {},
    tasks: Array.isArray(safe.tasks) ? safe.tasks : [],
    meta:
      safe.meta && typeof safe.meta === "object"
        ? {
            lastResetAt:
              typeof safe.meta.lastResetAt === "string"
                ? safe.meta.lastResetAt
                : new Date().toISOString(),
            history: Array.isArray(safe.meta.history) ? safe.meta.history : [],
          }
        : {
            lastResetAt: new Date().toISOString(),
            history: [],
          },
  };
}

function loadData(logger) {
  ensureStorageFile(logger);

  try {
    const raw = fs.readFileSync(PRODUCTIVITY_FILE, "utf8").trim();
    const parsed = raw ? JSON.parse(raw) : createDefaultData();
    return sanitizeData(parsed);
  } catch (error) {
    logger.error("Failed to parse productivity data file, using defaults", {
      error: error.message,
    });
    return createDefaultData();
  }
}

function saveData(data, logger) {
  ensureStorageFile(logger);

  try {
    fs.writeFileSync(
      PRODUCTIVITY_FILE,
      JSON.stringify(sanitizeData(data), null, 2),
      "utf8",
    );
  } catch (error) {
    logger.error("Failed to persist productivity data file", {
      error: error.message,
    });
  }
}

module.exports = {
  ensureStorageFile,
  loadData,
  saveData,
};
