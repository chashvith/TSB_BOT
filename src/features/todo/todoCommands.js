const { EmbedBuilder } = require("discord.js");

function buildTodoResultEmbed({ title, description, color = 0x57f287 }) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

function truncate(text, max = 120) {
  const normalized = String(text || "");
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 3)}...`;
}

function buildTasksEmbed({ username, tasks }) {
  const embed = new EmbedBuilder()
    .setTitle(`${username}'s Tasks`)
    .setColor(0x7c9cff)
    .setTimestamp();

  if (!tasks.length) {
    embed.setDescription("No tasks yet. Add one with /addtask.");
    return embed;
  }

  const lines = tasks.map((task) => {
    const marker = task.completed ? "✅" : "🟨";
    return `${marker} ${task.id} | ${truncate(task.text, 90)}`;
  });

  embed.setDescription(lines.join("\n"));
  return embed;
}

module.exports = {
  buildTodoResultEmbed,
  buildTasksEmbed,
};
