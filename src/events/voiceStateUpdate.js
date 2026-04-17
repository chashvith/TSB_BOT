module.exports = (client, deps) => {
  const { focusModeService, screenShareService, studyTracker, logger } = deps;

  client.on("voiceStateUpdate", async (oldState, newState) => {
    try {
      await focusModeService.handleVoiceStateUpdate(oldState, newState);
      await screenShareService.handleVoiceStateUpdate(
        client,
        oldState,
        newState,
      );
      await studyTracker.handleVoiceStateUpdate(oldState, newState);
    } catch (error) {
      logger.error("voiceStateUpdate handler failed", error);
    }
  });
};
