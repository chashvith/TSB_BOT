const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "data");
const QOTD_FILE = path.join(DATA_PATH, "qotd.json");

const DEFAULT_QUESTIONS = [
  "If you could restart your life from age 10 with your current knowledge, would you?",
  "What’s something you pretend to understand but actually don’t?",
  "If your thoughts were visible, how cooked would you be?",
  "What’s one thing you’d do if there were zero consequences?",
  "What’s something society normalizes that you think is weird?",
  "If you could read one person’s mind for a day, who would it be?",
  "What’s your villain origin story?",
  "What’s something you’re 100% sure about that others disagree with?",
  "If your life had a title right now, what would it be?",
  "What’s a small decision that changed your life a lot?",

  "What’s your biggest what-if in life?",
  "If you could erase one memory, would you? Which one?",
  "What’s something you’re scared to admit?",
  "When was the last time you felt truly proud of yourself?",
  "What’s a belief you had that completely changed?",
  "What’s something you’re avoiding right now?",
  "What’s your biggest internal struggle?",
  "If you could swap lives with someone for a week, who and why?",
  "What’s something you thought would make you happy but didn’t?",
  "What’s your biggest silent flex?",
  "What’s something people assume about you that’s wrong?",
  "What’s a habit that quietly ruined your time?",
  "What’s something you wish people noticed about you?",
  "What’s your most random fear?",
  "What’s a moment you wish you handled differently?",
  "What’s your biggest distraction right now?",
  "What’s something you keep overthinking?",
  "If no one judged you, what would you do differently?",
  "What’s a mistake you keep repeating?",
  "What’s something you’ve outgrown recently?",
  "What’s one thing you’re secretly proud of?",
  "What’s something you wish you could say to someone but haven’t?",
  "What’s your biggest motivation right now?",
  "What’s something you’re tired of pretending?",
  "What’s something you learned too late?",
  "What’s something you’d tell your younger self?",
  "If your life was a game, what level are you on?",
  "What’s something you’re addicted to but don’t admit?",
  "What’s your most main character moment?",
  "What instantly ruins your mood?",
  "What instantly makes your day better?",
  "What’s your biggest time waste right now?",
  "What’s something you’re chasing but not getting?",
  "What’s something you gave up on too early?",
  "What’s something you regret not starting sooner?",
  "What’s your biggest excuse lately?",
  "If you had unlimited money for 24 hours, what would you do first?",
  "What’s something slightly illegal but harmless you’d try once?",
  "If you could disappear for a year, would you?",
  "What’s something you’d do if you knew you couldn’t fail?",
  "What’s your biggest I should’ve done that moment?",
  "What’s something you want but haven’t worked for yet?",
  "What’s a risk you wish you took?",
  "What’s something you’re afraid to start?",
  "What’s something you’re proud you didn’t give up on?",
  "What’s your biggest current goal?",
  "What’s something people glorify too much?",
  "What’s something underrated in life?",
  "What’s a harsh truth people avoid?",
  "What’s something you’ve normalized but shouldn’t have?",
  "What’s something you wish society did differently?",
  "What’s something people fake a lot?",
  "What’s something you wish was easier?",
  "What drains your energy the most?",
  "What gives you energy instantly?",
  "What’s something you need to stop doing?",
  "What’s your current mindset in one sentence?",
  "What’s something you’re grateful for but don’t say often?",
  "What’s something you’re working on silently?",
  "What’s something you’re still figuring out?",
  "What’s something you wish you understood better?",
  "What’s something you’re improving right now?",
  "What’s something you’re ignoring but shouldn’t?",
  "What’s something you’re afraid of losing?",
  "What’s something you want to fix in your life?",
  "What’s something you’re excited about right now?",
  "If someone observed your life for a week, what would they notice?",
  "What’s something you do differently from most people?",
  "What’s something you hide from people?",
  "What do you want to be known for?",
  "What’s something you’ve been thinking about a lot lately?",
  "What’s something you wish you could restart?",
  "What’s something you’re proud you survived?",
  "What shaped who you are the most?",
  "What’s something you wish people understood about you?",
  "What’s something you need to hear right now?",
  "If today was your last day, what would you regret not doing?",
  "What’s something you’d never do no matter what?",
  "What’s something you’re still holding onto?",
  "What’s something you wish you could let go of?",
  "What’s something you want to experience at least once?",
  "What would you change about your life instantly?",
  "What do you need more of in life right now?",
  "What do you need less of in life right now?",
  "What are you chasing that might not matter later?",
  "What are you doing today that future you will thank you for?",
];

function createDefaultData() {
  return {
    lastPostedAt: null,
    queue: [],
    questions: [...DEFAULT_QUESTIONS],
  };
}

function ensureStorageFile(logger) {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
    logger.info("Created QOTD data directory", { path: DATA_PATH });
  }

  if (!fs.existsSync(QOTD_FILE)) {
    fs.writeFileSync(
      QOTD_FILE,
      JSON.stringify(createDefaultData(), null, 2),
      "utf8",
    );
    logger.info("Created QOTD file", { path: QOTD_FILE });
  }
}

function sanitizeData(raw) {
  const safe = raw && typeof raw === "object" ? raw : createDefaultData();
  const questions = Array.isArray(safe.questions)
    ? safe.questions.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  const queue = Array.isArray(safe.queue)
    ? safe.queue
        .map((item) => ({
          id: String(item?.id || "").trim(),
          question: String(item?.question || "").trim(),
          userId: String(item?.userId || "").trim(),
          username: String(item?.username || "").trim(),
          createdAt: String(item?.createdAt || "").trim(),
        }))
        .filter((item) => item.id && item.question)
    : [];

  return {
    lastPostedAt:
      typeof safe.lastPostedAt === "string" && safe.lastPostedAt
        ? safe.lastPostedAt
        : null,
    queue,
    questions: questions.length ? questions : [...DEFAULT_QUESTIONS],
  };
}

function loadData(logger) {
  ensureStorageFile(logger);

  try {
    const raw = fs.readFileSync(QOTD_FILE, "utf8").trim();
    const parsed = raw ? JSON.parse(raw) : createDefaultData();
    return sanitizeData(parsed);
  } catch (error) {
    logger.error("Failed to parse qotd file, using defaults", {
      error: error.message,
    });
    return createDefaultData();
  }
}

function saveData(data, logger) {
  ensureStorageFile(logger);

  try {
    fs.writeFileSync(
      QOTD_FILE,
      JSON.stringify(sanitizeData(data), null, 2),
      "utf8",
    );
  } catch (error) {
    logger.error("Failed to persist qotd file", {
      error: error.message,
    });
  }
}

module.exports = {
  ensureStorageFile,
  loadData,
  saveData,
};
