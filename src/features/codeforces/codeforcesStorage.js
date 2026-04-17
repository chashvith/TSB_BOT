const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(DATA_PATH, "codeforces-notified.json");

function ensureStorageFile(logger) {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
    logger.info("Created codeforces data directory", { path: DATA_PATH });
  }

  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, "[]", "utf8");
    logger.info("Created codeforces notification storage file", {
      path: STORAGE_FILE,
    });
  }
}

function loadNotifiedContestIds(logger) {
  ensureStorageFile(logger);

  try {
    const raw = fs.readFileSync(STORAGE_FILE, "utf8").trim();
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch (error) {
    logger.error("Failed to load codeforces notification storage", error);
    return new Set();
  }
}

function saveNotifiedContestIds(notifiedSet, logger) {
  ensureStorageFile(logger);

  try {
    const entries = [...notifiedSet];
    const capped =
      entries.length > 1000 ? entries.slice(entries.length - 1000) : entries;
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(capped, null, 2), "utf8");
  } catch (error) {
    logger.error("Failed to save codeforces notification storage", error);
  }
}

module.exports = {
  ensureStorageFile,
  loadNotifiedContestIds,
  saveNotifiedContestIds,
};
