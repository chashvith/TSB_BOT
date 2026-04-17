const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

function rankLabel(index) {
  if (index === 0) {
    return "🥇";
  }
  if (index === 1) {
    return "🥈";
  }
  if (index === 2) {
    return "🥉";
  }
  return `#${index + 1}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show weekly study leaderboard"),

  async execute(interaction, { leaderboardService }) {
    const rows = leaderboardService.getLeaderboardRows();

    if (!rows.length || !rows.some((row) => row.score > 0)) {
      await interaction.reply({
        content:
          "Leaderboard is empty this week. Start with /tasks and study in the VC.",
        ephemeral: true,
      });
      return;
    }

    const topRows = rows.slice(0, 10);
    const lines = await Promise.all(
      topRows.map(async (row, index) => {
        const user = await interaction.client.users
          .fetch(row.userId)
          .catch(() => null);
        const username = user ? user.username : `User ${row.userId}`;

        return `${rankLabel(index)} ${username} | Tasks: ${row.tasksCompleted} | Study: ${leaderboardService.formatStudyTime(row.studyTime)} | Score: ${row.score}`;
      }),
    );

    const embed = new EmbedBuilder()
      .setTitle("Weekly Study Leaderboard")
      .setDescription(lines.join("\n"))
      .setColor(0xf1c40f)
      .setFooter({ text: "Score = (tasksCompleted × 10) + studyTimeMinutes" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
