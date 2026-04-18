const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("task")
    .setDescription("Focus session task actions")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("done")
        .setDescription("Mark one focus task as done during an active session"),
    ),

  async execute(interaction, { focusTaskHandler }) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== "done") {
      await interaction.reply({
        content: "Unsupported task action.",
        ephemeral: true,
      });
      return;
    }

    const result = focusTaskHandler.markTaskDone(interaction.member);

    if (!result.ok) {
      if (result.code === "NO_ACTIVE_SESSION") {
        await interaction.reply({
          content:
            "No active focus session. Start one with /focus start <minutes>.",
          ephemeral: true,
        });
        return;
      }

      if (result.code === "NOT_IN_FOCUS_VC") {
        await interaction.reply({
          content:
            "You must be inside a focus category voice channel to use /task done.",
          ephemeral: true,
        });
        return;
      }

      if (result.code === "TASK_LIMIT_REACHED") {
        await interaction.reply({
          content: `Task cap reached for this session (${result.maxTasks}).`,
          ephemeral: true,
        });
        return;
      }

      if (result.code === "TASK_COOLDOWN") {
        await interaction.reply({
          content: `Wait **${result.remainingMinutes} min** before marking another task.`,
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: "Could not mark task done right now.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `Task counted: +${result.taskXp} XP. Session tasks: ${result.tasksCompleted}. Task XP this session: ${result.taskXpTotal}/${result.maxTaskXp}.`,
      ephemeral: true,
    });
  },
};
