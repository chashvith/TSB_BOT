const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("registersubject")
    .setDescription("Register your study subject for buddy matching")
    .addStringOption((option) =>
      option
        .setName("subject")
        .setDescription("Your main study subject (e.g., calculus, chemistry)")
        .setRequired(true)
        .setMaxLength(80),
    ),

  async execute(interaction, { buddyService }) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const subject = interaction.options.getString("subject", true);
    const result = buddyService.registerSubject(
      interaction.user,
      interaction.guild.id,
      subject,
    );

    if (!result.ok) {
      await interaction.reply({
        content: "Please provide a valid subject.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `Registered your subject as **${result.subject}** for this server. Use /findbuddy to get matched.`,
      ephemeral: true,
    });
  },
};
