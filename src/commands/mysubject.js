const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mysubject")
    .setDescription("Manage your buddy registration in this server")
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("View your current registered subject and status"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("Remove your subject registration in this server"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Set your buddy availability status")
        .addStringOption((option) =>
          option
            .setName("state")
            .setDescription("Your current availability")
            .setRequired(true)
            .addChoices(
              { name: "available", value: "available" },
              { name: "busy", value: "busy" },
            ),
        ),
    ),

  async execute(interaction, { buddyService }) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    if (sub === "view") {
      const registration = buddyService.getRegistration(userId, guildId);

      if (!registration) {
        await interaction.reply({
          content:
            "You do not have a registered subject in this server. Use /registersubject first.",
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: [
          `Subject: **${registration.subject}**`,
          `Status: **${registration.status || "available"}**`,
        ].join("\n"),
        ephemeral: true,
      });
      return;
    }

    if (sub === "clear") {
      const result = buddyService.clearRegistration(userId, guildId);

      if (!result.ok) {
        await interaction.reply({
          content: "No registration found to clear in this server.",
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: "Your subject registration has been cleared for this server.",
        ephemeral: true,
      });
      return;
    }

    if (sub === "status") {
      const state = interaction.options.getString("state", true);
      const result = buddyService.setStatus(userId, guildId, state);

      if (!result.ok) {
        if (result.code === "NOT_REGISTERED") {
          await interaction.reply({
            content:
              "You need to register a subject first with /registersubject.",
            ephemeral: true,
          });
          return;
        }

        await interaction.reply({
          content: "Could not update your status.",
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: `Your buddy status is now **${result.status}** in this server.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "Unknown mysubject action.",
      ephemeral: true,
    });
  },
};
