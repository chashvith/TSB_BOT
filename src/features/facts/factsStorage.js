const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "data");
const FACTS_FILE = path.join(DATA_PATH, "facts.json");

function createDefaultData() {
  return {
    lastPostedAt: null,
  };
}

function ensureStorageFile(logger) {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
    logger.info("Created facts data directory", { path: DATA_PATH });
  }

  if (!fs.existsSync(FACTS_FILE)) {
    fs.writeFileSync(
      FACTS_FILE,
      JSON.stringify(createDefaultData(), null, 2),
      "utf8",
    );
    logger.info("Created facts data file", { path: FACTS_FILE });
  }
}

function sanitizeData(raw) {
  const safe = raw && typeof raw === "object" ? raw : createDefaultData();

  return {
    lastPostedAt:
      typeof safe.lastPostedAt === "string" && safe.lastPostedAt
        ? safe.lastPostedAt
        : null,
  };
}

function loadData(logger) {
  ensureStorageFile(logger);

  try {
    const raw = fs.readFileSync(FACTS_FILE, "utf8").trim();
    const parsed = raw ? JSON.parse(raw) : createDefaultData();
    return sanitizeData(parsed);
  } catch (error) {
    logger.error("Failed to parse facts data file, using defaults", {
      error: error.message,
    });
    return createDefaultData();
  }
}

function saveData(data, logger) {
  ensureStorageFile(logger);

  try {
    fs.writeFileSync(
      FACTS_FILE,
      JSON.stringify(sanitizeData(data), null, 2),
      "utf8",
    );
  } catch (error) {
    logger.error("Failed to persist facts data file", {
      error: error.message,
    });
  }
}

module.exports = {
  ensureStorageFile,
  loadData,
  saveData,
};
