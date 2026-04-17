const { SlashCommandBuilder } = require("discord.js");
const {
  buildTasksEmbed,
  buildTaskSelectRow,
  buildTaskActionRows,
} = require("../features/todo/todoUI");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tasks")
    .setDescription("View your tasks"),

  async execute(interaction, { todoService }) {
    const tasks = todoService.getTasksByUser(interaction.user.id);
    const selectedTaskId = todoService.getSelectedTask(interaction.user.id);
    const embed = buildTasksEmbed(
      interaction.user.username,
      tasks,
      selectedTaskId,
    );

    const components = tasks.length
      ? [
          buildTaskSelectRow(tasks, selectedTaskId),
          ...buildTaskActionRows(selectedTaskId),
        ]
      : [];

    await interaction.reply({ embeds: [embed], components, ephemeral: true });
  },
};
