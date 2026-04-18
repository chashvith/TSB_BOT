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
    .setDescription("Show focus XP leaderboard"),

  async execute(interaction, { leaderboardService }) {
    const rows = leaderboardService.getLeaderboardRows();

    if (!rows.length || !rows.some((row) => row.totalXp > 0)) {
      await interaction.reply({
        content: "Leaderboard is empty. Start a session with /focus start.",
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

        return `${rankLabel(index)} ${username} | XP: ${row.totalXp} | Tasks: ${row.tasksCompleted} | Study: ${leaderboardService.formatStudyTime(Math.round(row.studyTime))}`;
      }),
    );

    const embed = new EmbedBuilder()
      .setTitle("Focus XP Leaderboard")
      .setDescription(lines.join("\n"))
      .setColor(0xf1c40f)
      .setFooter({ text: "XP = weighted VC minutes + (session tasks × 15)" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
