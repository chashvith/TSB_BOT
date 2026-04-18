const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("focus")
    .setDescription("Manage your focus session")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Start a timed focus session")
        .addIntegerOption((option) =>
          option
            .setName("minutes")
            .setDescription("Session duration in minutes")
            .setRequired(true)
            .setMinValue(5)
            .setMaxValue(300),
        ),
    ),

  async execute(interaction, { focusSessionManager, focusVoiceTracker }) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== "start") {
      await interaction.reply({
        content: "Unsupported focus action.",
        ephemeral: true,
      });
      return;
    }

    const minutes = interaction.options.getInteger("minutes", true);
    const member = interaction.member;
    const voiceState = member?.voice;
    const snapshot = focusVoiceTracker.buildVoiceSnapshot(voiceState);

    const result = focusSessionManager.startSession({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      durationMinutes: minutes,
      initialVoiceState: snapshot,
    });

    if (!result.ok) {
      if (result.code === "SESSION_ALREADY_ACTIVE") {
        await interaction.reply({
          content: "You already have an active focus session.",
          ephemeral: true,
        });
        return;
      }

      if (result.code === "USER_NOT_IN_VC") {
        await interaction.reply({
          content: "Join a voice channel first, then start your session.",
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: "Unable to start focus session right now.",
        ephemeral: true,
      });
      return;
    }

    const endsAtSeconds = Math.floor(result.session.endsAt / 1000);
    await interaction.reply({
      content: `Focus session started for **${minutes} minutes**. Stay in voice until <t:${endsAtSeconds}:t> to get XP.`,
      ephemeral: true,
    });
  },
};
