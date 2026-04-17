const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "data");
const ALERTS_FILE = path.join(DATA_PATH, "alerts.json");

function ensureAlertsFile(logger) {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
    logger.info("Created alerts data directory", { path: DATA_PATH });
  }

  if (!fs.existsSync(ALERTS_FILE)) {
    fs.writeFileSync(ALERTS_FILE, "[]", "utf8");
    logger.info("Created alerts file", { path: ALERTS_FILE });
  }
}

function loadAlerts(logger) {
  ensureAlertsFile(logger);

  try {
    const raw = fs.readFileSync(ALERTS_FILE, "utf8").trim();
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    logger.error("Failed to parse alerts file, using empty array", error);
    return [];
  }
}

function saveAlerts(alerts, logger) {
  ensureAlertsFile(logger);

  try {
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2), "utf8");
  } catch (error) {
    logger.error("Failed to persist alerts file", error);
  }
}

module.exports = {
  ensureAlertsFile,
  loadAlerts,
  saveAlerts,
};
