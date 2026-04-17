const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("qotd")
    .setDescription("Manage Question of the Day")
    .addSubcommand((sub) =>
      sub.setName("post").setDescription("Post a random QOTD now"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("suggest")
        .setDescription("Add your own QOTD to the queue")
        .addStringOption((option) =>
          option
            .setName("question")
            .setDescription("Your question")
            .setRequired(true)
            .setMaxLength(300),
        ),
    ),

  async execute(interaction, { qotdService, config }) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "suggest") {
      const question = interaction.options.getString("question", true).trim();
      const result = await qotdService.addQuestionToQueue(
        question,
        interaction.user,
      );

      if (!result.ok) {
        const existingPosition = result.position;
        const existingEstimatedDate = result.estimatedPostDate
          ? qotdService.formatDateForDisplay(result.estimatedPostDate)
          : "soon";

        const messages = {
          EMPTY_QUESTION: "Question cannot be empty.",
          DUPLICATE_QUEUE_QUESTION: "That question is already in the queue.",
          USER_ALREADY_HAS_QUESTION: `You already have a queued question. Position: #${existingPosition}. Estimated post date: ${existingEstimatedDate}.`,
        };

        await interaction.reply({
          content: messages[result.code] || "Failed to add question to queue.",
          ephemeral: true,
        });
        return;
      }

      const queuePosition = result.position;
      const estimatedDate = result.estimatedPostDate
        ? qotdService.formatDateForDisplay(result.estimatedPostDate)
        : "soon";

      await interaction.reply({
        content: `Your question was added to the queue. Position: #${queuePosition}. Estimated post date: ${estimatedDate}.`,
        ephemeral: true,
      });
      return;
    }

    const hasAdminRole = config.adminRoleId
      ? interaction.member?.roles?.cache?.has(config.adminRoleId)
      : false;

    if (!hasAdminRole) {
      await interaction.reply({
        content: "Only admins can post QOTD manually.",
        ephemeral: true,
      });
      return;
    }

    if (sub !== "post") {
      await interaction.reply({
        content: "Unknown qotd action.",
        ephemeral: true,
      });
      return;
    }

    const result = await qotdService.postDueQuestion(interaction.client);

    if (!result.ok) {
      const messages = {
        QOTD_DISABLED: "QOTD is disabled. Set QOTD_CHANNEL_ID in .env.",
        NO_QUESTIONS: "No questions available in qotd storage.",
        INVALID_CHANNEL:
          "Configured QOTD channel is invalid or not text-based.",
      };

      await interaction.reply({
        content: messages[result.code] || "Failed to post QOTD.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `QOTD posted for ${result.dateKey}.`,
      ephemeral: true,
    });
  },
};
