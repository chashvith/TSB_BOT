require("dotenv").config();

const { createClient } = require("./config/client");
const { loadConfig } = require("./config/env");
const { loadCommands } = require("./commands");
const { registerEvents } = require("./events");
const logger = require("./utils/logger");
const alertStorage = require("./features/alerts/alertStorage");
const { AlertService } = require("./features/alerts/alertService");
const codeforcesStorage = require("./features/codeforces/codeforcesStorage");
const {
  CodeforcesService,
} = require("./features/codeforces/codeforcesService");
const { FocusModeService } = require("./features/voice/focusModeService");
const { ScreenShareService } = require("./features/voice/screenShareService");
const productivityStorage = require("./features/leaderboard/productivityStorage");
const { TodoService } = require("./features/todo/todoService");
const {
  LeaderboardService,
} = require("./features/leaderboard/leaderboardService");
const { StudyTracker } = require("./features/study/studyTracker");
const qotdStorage = require("./features/qotd/qotdStorage");
const { QotdService } = require("./features/qotd/qotdService");
const factsStorage = require("./features/facts/factsStorage");
const { FactsService } = require("./features/facts/factsService");
const riddleStorage = require("./features/riddles/riddleStorage");
const { RiddleService } = require("./features/riddles/riddleService");
const buddyStorage = require("./features/buddy/buddyStorage");
const { BuddyService } = require("./features/buddy/buddyService");
const quizStorage = require("./features/quiz/quizStorage");
const { QuizDuelService } = require("./features/quiz/quizService");

async function bootstrap() {
  const config = loadConfig(process.env);

  alertStorage.ensureAlertsFile(logger);
  codeforcesStorage.ensureStorageFile(logger);
  productivityStorage.ensureStorageFile(logger);
  qotdStorage.ensureStorageFile(logger);
  factsStorage.ensureStorageFile(logger);
  riddleStorage.ensureStorageFile(logger);
  buddyStorage.ensureStorageFile(logger);
  quizStorage.ensureStorageFile(logger);

  const client = createClient();
  client.config = config;

  const alertService = new AlertService({
    storage: alertStorage,
    logger,
  });

  const screenShareService = new ScreenShareService({
    logger,
    config,
  });

  const codeforcesService = new CodeforcesService({
    logger,
    config,
    storage: codeforcesStorage,
  });

  const focusModeService = new FocusModeService({
    logger,
    config,
  });

  const todoService = new TodoService({
    storage: productivityStorage,
    logger,
  });

  const leaderboardService = new LeaderboardService({
    storage: productivityStorage,
    logger,
    resetDays: 7,
  });

  const studyTracker = new StudyTracker({
    storage: productivityStorage,
    logger,
    config,
  });

  const qotdService = new QotdService({
    storage: qotdStorage,
    logger,
    config,
  });

  const factsService = new FactsService({
    storage: factsStorage,
    logger,
    config,
  });

  const riddleService = new RiddleService({
    storage: riddleStorage,
    factsStorage,
    logger,
    config,
  });

  const buddyService = new BuddyService({
    storage: buddyStorage,
    logger,
  });

  const quizDuelService = new QuizDuelService({
    storage: quizStorage,
    logger,
  });

  const { commands, commandData } = loadCommands(logger);

  registerEvents(client, {
    logger,
    config,
    commands,
    commandData,
    alertService,
    codeforcesService,
    focusModeService,
    screenShareService,
    todoService,
    leaderboardService,
    studyTracker,
    qotdService,
    factsService,
    riddleService,
    buddyService,
    quizDuelService,
  });

  await client.login(config.token);
}

bootstrap().catch((error) => {
  logger.error("Fatal startup error", error);
  process.exit(1);
});
