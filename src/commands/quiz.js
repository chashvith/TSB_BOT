const { SlashCommandBuilder } = require("discord.js");
const { SUPPORTED_THEMES } = require("../features/quiz/quizService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Play a 2-player quiz duel")
    .addSubcommand((sub) =>
      sub
        .setName("duel")
        .setDescription("Challenge someone to a quiz duel")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to challenge")
            .setRequired(true),
        )
        .addStringOption((option) => {
          const optionBuilder = option
            .setName("theme")
            .setDescription("Quiz theme")
            .setRequired(true);

          for (const theme of SUPPORTED_THEMES) {
            optionBuilder.addChoices({ name: theme, value: theme });
          }

          return optionBuilder;
        }),
    )
    .addSubcommand((sub) =>
      sub
        .setName("leaderboard")
        .setDescription("Show quiz duel leaderboard")
        .addStringOption((option) =>
          option
            .setName("scope")
            .setDescription("Leaderboard range")
            .setRequired(false)
            .addChoices(
              { name: "all_time", value: "all_time" },
              { name: "weekly", value: "weekly" },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("themes")
        .setDescription("Show available quiz themes and question counts"),
    ),

  async execute(interaction, { quizDuelService, quizQuestionService }) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "themes") {
      const rows = quizQuestionService.getThemeQuestionCounts();
      const lines = rows.map((row) =>
        `• ${row.theme}: dynamic ${row.dynamicCount}, fallback ${row.fallbackCount}, total ${row.totalCount}`,
      );

      await interaction.reply({
        content: [`Available quiz themes:`, ...lines].join("\n"),
      });
      return;
    }

    if (sub === "leaderboard") {
      const scope = interaction.options.getString("scope") || "all_time";
      const entries = quizDuelService.getLeaderboard(interaction.guild.id, {
        scope,
      });
      const me = quizDuelService.getUserPosition(
        interaction.guild.id,
        interaction.user.id,
        { scope },
      );

      if (!entries.length) {
        await interaction.reply({
          content: `No ${scope} duel results yet. Start with /quiz duel.`,
          ephemeral: true,
        });
        return;
      }

      const top = entries.slice(0, 10);
      const users = await Promise.all(
        top.map((entry) =>
          interaction.client.users.fetch(entry.userId).catch(() => null),
        ),
      );

      const lines = top.map((entry, idx) => {
        const user = users[idx];
        const username = user ? user.username : `User ${entry.userId}`;
        return `${idx + 1}. ${username} - ${entry.wins}W/${entry.losses}L/${entry.draws}D | WR ${entry.gamesPlayed ? Math.round((entry.wins / entry.gamesPlayed) * 100) : 0}% | Streak ${entry.winStreak}`;
      });

      if (me) {
        const meUser = await interaction.client.users
          .fetch(interaction.user.id)
          .catch(() => null);
        const meName = meUser ? meUser.username : `User ${interaction.user.id}`;
        lines.push(
          "",
          `Your position (${meName}): #${me.rank}/${me.totalPlayers} (${me.entry.wins} wins, best streak ${me.entry.bestWinStreak})`,
        );
      }

      await interaction.reply({
        content: [`Quiz Leaderboard (${scope})`, ...lines].join("\n"),
      });
      return;
    }

    const challengedUser = interaction.options.getUser("user", true);
    const theme = interaction.options.getString("theme", true);

    if (challengedUser.bot) {
      await interaction.reply({
        content: "You can only challenge human users.",
        ephemeral: true,
      });
      return;
    }

    if (String(challengedUser.id) === String(interaction.user.id)) {
      await interaction.reply({
        content: "You cannot duel yourself.",
        ephemeral: true,
      });
      return;
    }

    const result = await quizDuelService.createDuelChallenge(interaction, {
      challengedUser,
      theme,
    });

    if (result.ok) {
      return;
    }

    const messages = {
      INVALID_THEME: "Invalid theme selected.",
      CHALLENGER_BUSY: "You are already in an active duel.",
      OPPONENT_BUSY: "That user is already in an active duel.",
      THEME_LOAD_FAILED:
        "Failed to load that theme right now. Please try another theme.",
      INSUFFICIENT_QUESTIONS:
        "That theme does not have enough questions yet. Add more to the JSON file.",
    };

    const errorMessage = messages[result.code] || "Could not start duel.";

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
      return;
    }

    await interaction.reply({ content: errorMessage, ephemeral: true });
  },
};
