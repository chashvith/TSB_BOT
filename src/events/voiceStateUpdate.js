module.exports = (client, deps) => {
  const {
    focusModeService,
    screenShareService,
    studyTracker,
    focusVoiceTracker,
    logger,
  } = deps;

  client.on("voiceStateUpdate", async (oldState, newState) => {
    try {
      await focusVoiceTracker.handleVoiceStateUpdate(oldState, newState);
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
