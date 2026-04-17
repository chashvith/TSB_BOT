async function fetchTextChannel(client, channelId, logger, label) {
  if (!channelId) {
    return null;
  }

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      logger.warn(`Configured ${label || "channel"} is not text-based`, {
        channelId,
      });
      return null;
    }

    return channel;
  } catch (error) {
    logger.error(`Failed to fetch ${label || "channel"}`, {
      channelId,
      error: error.message,
    });
    return null;
  }
}

async function clearBotMessages(channel, botUserId, limit, logger) {
  try {
    const messages = await channel.messages.fetch({ limit });

    for (const message of messages.values()) {
      if (message.author?.id === botUserId) {
        try {
          await message.delete();
        } catch (error) {
          logger.warn("Failed to delete old panel message", {
            channelId: channel.id,
            messageId: message.id,
            error: error.message,
          });
        }
      }
    }
  } catch (error) {
    logger.error("Failed to fetch messages for cleanup", {
      channelId: channel.id,
      error: error.message,
    });
  }
}

module.exports = {
  fetchTextChannel,
  clearBotMessages,
};
