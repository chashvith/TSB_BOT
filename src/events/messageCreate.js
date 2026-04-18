module.exports = (client, deps) => {
  const { logger } = deps;
  const everyoneCounter = new Map();

  client.on("messageCreate", async (message) => {
    if (message.author.bot) {
      return;
    }

    const normalizedContent = String(message.content || "")
      .trim()
      .toLowerCase();

    if (normalizedContent === "hi") {
      try {
        await message.reply("kill bill pandey here");
      } catch (error) {
        logger.warn("Failed to send hi auto-reply", {
          userId: message.author.id,
          error: error.message,
        });
      }
      return;
    }

    if (message.mentionEveryone) {
      const counter = (everyoneCounter.get(message.author.id) || 0) + 1;
      everyoneCounter.set(message.author.id, counter);

      if (counter >= 3) {
        try {
          await message.delete();
        } catch (error) {
          logger.warn("Failed to delete spam message", {
            userId: message.author.id,
            error: error.message,
          });
        }

        try {
          if (message.member) {
            await message.member.timeout(
              3 * 60 * 1000,
              "Repeated @everyone mentions",
            );
          }
        } catch (error) {
          logger.error("Failed to timeout member", {
            userId: message.author.id,
            error: error.message,
          });
        }

        try {
          await message.channel.send(
            `${message.author} ⚠️ Please do not spam @everyone.`,
          );
        } catch (error) {
          logger.warn("Failed to send moderation warning", error);
        }

        everyoneCounter.set(message.author.id, 0);
      }
      return;
    }

    everyoneCounter.set(message.author.id, 0);
  });
};
