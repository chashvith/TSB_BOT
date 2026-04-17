const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("findbuddy")
    .setDescription("Find an accountability buddy with the same subject"),

  async execute(interaction, { buddyService }) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const result = buddyService.findBuddyForUser(
      interaction.user.id,
      interaction.guild.id,
    );

    if (!result.ok) {
      const messages = {
        NOT_REGISTERED:
          "You have not registered a subject yet. Use /registersubject first.",
        USER_BUSY:
          "Your buddy status is set to busy. Use /mysubject status and switch to available, then try again.",
        NO_BUDDY_FOUND: "No study buddy available yet. Try again later.",
      };

      await interaction.reply({
        content: messages[result.code] || "Could not find a buddy right now.",
        ephemeral: true,
      });
      return;
    }

    const matchedUsername =
      result.buddy.username || `User ${result.buddy.userId}`;

    await interaction.reply({
      content: [
        `Your subject: **${result.subject}**`,
        `Matched buddy: **${matchedUsername}**`,
        "Start by sharing goals and checking in daily.",
      ].join("\n"),
      ephemeral: true,
    });
  },
};
