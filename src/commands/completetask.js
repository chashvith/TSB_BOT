const { SlashCommandBuilder } = require("discord.js");
const { buildTodoResultEmbed } = require("../features/todo/todoCommands");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("completetask")
    .setDescription("Mark one of your tasks as completed")
    .addStringOption((option) =>
      option
        .setName("task_id")
        .setDescription("Task ID to complete")
        .setRequired(true),
    ),

  async execute(interaction, { todoService }) {
    const taskId = interaction.options.getString("task_id", true);
    const result = todoService.completeTask(interaction.user.id, taskId);

    if (!result.ok) {
      let description = "Invalid task ID. Use /tasks to copy a valid task ID.";
      if (result.code === "FORBIDDEN") {
        description = "You cannot complete someone else's task.";
      }
      if (result.code === "TASK_ALREADY_COMPLETED") {
        description = "That task is already completed.";
      }

      await interaction.reply({
        embeds: [
          buildTodoResultEmbed({
            title: "Completion Failed",
            description,
            color: 0xed4245,
          }),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        buildTodoResultEmbed({
          title: "Task Completed",
          description: `Completed: ${result.task.text}\nWeekly completed tasks: ${result.userStats.tasksCompleted}`,
        }),
      ],
      ephemeral: true,
    });
  },
};
