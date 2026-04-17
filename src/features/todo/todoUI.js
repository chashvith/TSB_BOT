const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

function truncate(text, max = 80) {
  const value = String(text || "").trim();
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 3)}...`;
}

function buildTasksEmbed(username, tasks, selectedTaskId = null) {
  const embed = new EmbedBuilder()
    .setTitle(`${username}'s Tasks`)
    .setColor(0x7c9cff)
    .setTimestamp();

  if (!tasks.length) {
    embed.setDescription("No tasks yet. Click Add Task below.");
    return embed;
  }

  const lines = tasks.map((task, index) => {
    const marker = task.completed ? "✅" : "🟨";
    const selectedMarker = selectedTaskId === task.id ? " [selected]" : "";
    return `${index + 1}. ${marker} ${truncate(task.text, 90)}${selectedMarker}`;
  });

  embed.setDescription(
    [
      "Pick a task from the dropdown, then choose what to do with it.",
      "",
      ...lines,
    ].join("\n"),
  );

  return embed;
}

function buildTaskSelectRow(tasks, selectedTaskId = null) {
  const limitedTasks = tasks.slice(0, 25);
  const select = new StringSelectMenuBuilder()
    .setCustomId("todo:select-task")
    .setPlaceholder(
      tasks.length > 25 ? "Showing first 25 tasks only" : "Select a task",
    )
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      limitedTasks.map((task) => ({
        label: truncate(task.text, 100),
        value: task.id,
        description: task.completed ? "Completed" : "Pending",
        default: selectedTaskId === task.id,
      })),
    );

  return new ActionRowBuilder().addComponents(select);
}

function buildTaskActionRows(selectedTaskId = null) {
  const addButton = new ButtonBuilder()
    .setCustomId("todo:add-open")
    .setLabel("Add Task")
    .setStyle(ButtonStyle.Primary);

  const completeButton = new ButtonBuilder()
    .setCustomId("todo:complete-selected")
    .setLabel("Complete Selected")
    .setStyle(ButtonStyle.Success)
    .setDisabled(!selectedTaskId);

  const removeButton = new ButtonBuilder()
    .setCustomId("todo:remove-selected")
    .setLabel("Remove Selected")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!selectedTaskId);

  const refreshButton = new ButtonBuilder()
    .setCustomId("todo:refresh")
    .setLabel("Refresh Tasks")
    .setStyle(ButtonStyle.Secondary);

  return [
    new ActionRowBuilder().addComponents(
      addButton,
      completeButton,
      removeButton,
      refreshButton,
    ),
  ];
}

function buildAddTaskModal() {
  const modal = new ModalBuilder()
    .setCustomId("todo:add-modal")
    .setTitle("Add Study Task");

  const taskInput = new TextInputBuilder()
    .setCustomId("task")
    .setLabel("Task")
    .setPlaceholder("Example: Solve 2 graph problems")
    .setRequired(true)
    .setMaxLength(300)
    .setStyle(TextInputStyle.Paragraph);

  modal.addComponents(new ActionRowBuilder().addComponents(taskInput));
  return modal;
}

module.exports = {
  buildTasksEmbed,
  buildTaskSelectRow,
  buildTaskActionRows,
  buildAddTaskModal,
};
