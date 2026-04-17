const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "data");
const RIDDLE_FILE = path.join(DATA_PATH, "riddles.json");

function createDefaultData() {
  return {
    lastPostedAt: null,
    lastPostedForFactsAt: null,
  };
}

function ensureStorageFile(logger) {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
    logger.info("Created riddles data directory", { path: DATA_PATH });
  }

  if (!fs.existsSync(RIDDLE_FILE)) {
    fs.writeFileSync(
      RIDDLE_FILE,
      JSON.stringify(createDefaultData(), null, 2),
      "utf8",
    );
    logger.info("Created riddles data file", { path: RIDDLE_FILE });
  }
}

function sanitizeData(raw) {
  const safe = raw && typeof raw === "object" ? raw : createDefaultData();

  return {
    lastPostedAt:
      typeof safe.lastPostedAt === "string" && safe.lastPostedAt
        ? safe.lastPostedAt
        : null,
    lastPostedForFactsAt:
      typeof safe.lastPostedForFactsAt === "string" && safe.lastPostedForFactsAt
        ? safe.lastPostedForFactsAt
        : null,
  };
}

function loadData(logger) {
  ensureStorageFile(logger);

  try {
    const raw = fs.readFileSync(RIDDLE_FILE, "utf8").trim();
    const parsed = raw ? JSON.parse(raw) : createDefaultData();
    return sanitizeData(parsed);
  } catch (error) {
    logger.error("Failed to parse riddles data file, using defaults", {
      error: error.message,
    });
    return createDefaultData();
  }
}

function saveData(data, logger) {
  ensureStorageFile(logger);

  try {
    fs.writeFileSync(
      RIDDLE_FILE,
      JSON.stringify(sanitizeData(data), null, 2),
      "utf8",
    );
  } catch (error) {
    logger.error("Failed to persist riddles data file", {
      error: error.message,
    });
  }
}

module.exports = {
  ensureStorageFile,
  loadData,
  saveData,
};
