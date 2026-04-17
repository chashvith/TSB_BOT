const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "data");
const BUDDY_FILE = path.join(DATA_PATH, "buddy.json");

function createDefaultData() {
  return {
    users: {},
  };
}

function ensureStorageFile(logger) {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
    logger.info("Created buddy data directory", { path: DATA_PATH });
  }

  if (!fs.existsSync(BUDDY_FILE)) {
    fs.writeFileSync(
      BUDDY_FILE,
      JSON.stringify(createDefaultData(), null, 2),
      "utf8",
    );
    logger.info("Created buddy data file", { path: BUDDY_FILE });
  }
}

function sanitizeData(raw) {
  const safe = raw && typeof raw === "object" ? raw : createDefaultData();
  const users = safe.users && typeof safe.users === "object" ? safe.users : {};

  const normalizedUsers = {};
  for (const [key, value] of Object.entries(users)) {
    const subject = String(value?.subject || "").trim();
    if (!subject) {
      continue;
    }

    const userId = String(value?.userId || key.split(":").pop() || "").trim();
    if (!userId) {
      continue;
    }

    const serverId =
      String(value?.serverId || value?.guildId || "").trim() || null;
    const guildId =
      String(value?.guildId || value?.serverId || "").trim() || null;
    const status = String(value?.status || "available")
      .trim()
      .toLowerCase();
    const normalizedStatus = ["available", "busy"].includes(status)
      ? status
      : "available";

    const normalizedKey = serverId ? `${serverId}:${userId}` : userId;
    const normalizedSubject = String(value?.normalizedSubject || subject)
      .trim()
      .toLowerCase();
    const keywordSet = Array.isArray(value?.keywordSet)
      ? [
          ...new Set(
            value.keywordSet
              .map((keyword) =>
                String(keyword || "")
                  .trim()
                  .toLowerCase(),
              )
              .filter(Boolean),
          ),
        ]
      : [...new Set(normalizedSubject.split(/\s+/).filter(Boolean))];

    normalizedUsers[String(normalizedKey)] = {
      userId,
      serverId,
      guildId,
      subject,
      normalizedSubject,
      keywordSet,
      username: String(value?.username || "").trim() || null,
      status: normalizedStatus,
      updatedAt: String(value?.updatedAt || "").trim() || null,
    };
  }

  return {
    users: normalizedUsers,
  };
}

function loadData(logger) {
  ensureStorageFile(logger);

  try {
    const raw = fs.readFileSync(BUDDY_FILE, "utf8").trim();
    const parsed = raw ? JSON.parse(raw) : createDefaultData();
    return sanitizeData(parsed);
  } catch (error) {
    logger.error("Failed to parse buddy data file, using defaults", {
      error: error.message,
    });
    return createDefaultData();
  }
}

function saveData(data, logger) {
  ensureStorageFile(logger);

  try {
    fs.writeFileSync(
      BUDDY_FILE,
      JSON.stringify(sanitizeData(data), null, 2),
      "utf8",
    );
  } catch (error) {
    logger.error("Failed to persist buddy data file", {
      error: error.message,
    });
  }
}

module.exports = {
  ensureStorageFile,
  loadData,
  saveData,
};
