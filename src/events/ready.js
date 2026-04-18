const { fetchTextChannel, clearBotMessages } = require("../utils/discord");
const { buildAlertPanelMessage } = require("../features/alerts/alertUI");
const { buildIntroPanelMessage } = require("../features/intro/introUI");

module.exports = (client, deps) => {
  const {
    logger,
    config,
    commandData,
    alertService,
    codeforcesService,
    leaderboardService,
    focusVoiceTracker,
    qotdService,
    factsService,
    riddleService,
  } = deps;

  client.once("clientReady", async () => {
    try {
      await client.application.commands.set(commandData);
      logger.info("Slash commands synced", { count: commandData.length });
    } catch (error) {
      logger.error("Slash command sync failed", error);
    }

    const introPanelChannel = await fetchTextChannel(
      client,
      config.introPanelChannelId,
      logger,
      "intro panel channel",
    );
    if (introPanelChannel) {
      await clearBotMessages(introPanelChannel, client.user.id, 5, logger);
      await introPanelChannel.send(buildIntroPanelMessage());
    }

    const alertPanelChannel = await fetchTextChannel(
      client,
      config.alertPanelChannelId,
      logger,
      "alert panel channel",
    );
    if (alertPanelChannel) {
      await clearBotMessages(alertPanelChannel, client.user.id, 20, logger);
      await alertPanelChannel.send(buildAlertPanelMessage());
    }

    alertService.start(client);
    codeforcesService.start(client);
    leaderboardService.startWeeklyResetScheduler(client);
    await focusVoiceTracker.ensureJoinToCreateChannels(client);
    qotdService.start(client);
    factsService.start(client);
    riddleService.start(client);

    logger.info(`Logged in as ${client.user.tag}`);
    logger.info("Bot started successfully and ready to use.");
  });
};
