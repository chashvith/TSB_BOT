const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} = require("discord.js");
const { QUIZ_THEMES } = require("./questionService");

const ACCEPT_TIMEOUT_MS = 30_000;
const QUESTION_TIMEOUT_MS = 10_000;
const TOTAL_QUESTIONS_PER_DUEL = 7;
const DEFAULT_WEEK_KEY_FN = (date) => {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);

  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(current.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
};

class QuizDuelService {
  constructor({ storage, logger, questionService }) {
    this.storage = storage;
    this.logger = logger;
    this.questionService = questionService;
    this.activeDuels = new Map();
  }

  createDuelId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  statKey(guildId, userId) {
    return `${String(guildId)}:${String(userId)}`;
  }

  normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  isUserInActiveDuel(guildId, userId) {
    for (const duel of this.activeDuels.values()) {
      if (duel.guildId !== String(guildId)) {
        continue;
      }

      if (
        duel.status !== "finished" &&
        (duel.challengerId === String(userId) ||
          duel.opponentId === String(userId))
      ) {
        return true;
      }
    }

    return false;
  }

  pickUniqueQuestions(allQuestions, count) {
    // Fisher-Yates shuffle to guarantee random non-repeating picks per duel.
    const shuffled = [...allQuestions];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }

  buildAnswerRow(duelId, disabled = false) {
    const labels = ["A", "B", "C", "D"];

    return new ActionRowBuilder().addComponents(
      labels.map((label, idx) =>
        new ButtonBuilder()
          .setCustomId(`quiz:answer:${duelId}:${idx}`)
          .setLabel(label)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled),
      ),
    );
  }

  async disableMessageButtons(message) {
    try {
      const disabledRows = message.components.map((row) =>
        ActionRowBuilder.from(row).setComponents(
          row.components.map((component) =>
            ButtonBuilder.from(component).setDisabled(true),
          ),
        ),
      );

      await message.edit({ components: disabledRows });
    } catch (error) {
      this.logger.warn("Failed to disable quiz buttons", {
        error: error.message,
      });
    }
  }

  isCorrectChoice(question, selectedIndex) {
    const answerKey = this.normalizeText(question.answer);
    const optionText = this.normalizeText(question.options[selectedIndex]);

    const letterMap = ["a", "b", "c", "d"];
    if (letterMap.includes(answerKey)) {
      return letterMap[selectedIndex] === answerKey;
    }

    return optionText === answerKey;
  }

  ensureStatEntry(data, key) {
    if (!data[key]) {
      data[key] = {
        wins: 0,
        losses: 0,
        draws: 0,
        gamesPlayed: 0,
        winStreak: 0,
        bestWinStreak: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    return data[key];
  }

  getLeaderboard(guildId, options = {}) {
    const scope = options.scope === "weekly" ? "weekly" : "all_time";
    const data = this.storage.loadData(this.logger);
    const prefix = `${String(guildId)}:`;
    const now = new Date();
    const weekKeyFn = this.storage.getWeekKeyFromDate || DEFAULT_WEEK_KEY_FN;
    const weekKey = weekKeyFn(now);
    const statsMap =
      scope === "weekly"
        ? data.weeklyStats?.[weekKey] || {}
        : data.allTimeStats || {};

    return Object.entries(statsMap)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => ({
        userId: key.slice(prefix.length),
        wins: Number(value.wins) || 0,
        losses: Number(value.losses) || 0,
        draws: Number(value.draws) || 0,
        gamesPlayed: Number(value.gamesPlayed) || 0,
        winStreak: Number(value.winStreak) || 0,
        bestWinStreak: Number(value.bestWinStreak) || 0,
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }

        const aWinRate = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
        const bWinRate = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
        if (bWinRate !== aWinRate) {
          return bWinRate - aWinRate;
        }

        if (b.bestWinStreak !== a.bestWinStreak) {
          return b.bestWinStreak - a.bestWinStreak;
        }

        if (a.losses !== b.losses) {
          return a.losses - b.losses;
        }

        return b.gamesPlayed - a.gamesPlayed;
      });
  }

  getUserPosition(guildId, userId, options = {}) {
    const board = this.getLeaderboard(guildId, options);
    const index = board.findIndex(
      (entry) => String(entry.userId) === String(userId),
    );

    if (index < 0) {
      return null;
    }

    return {
      rank: index + 1,
      totalPlayers: board.length,
      entry: board[index],
    };
  }

  recordResult(guildId, challengerId, opponentId, winnerId) {
    const data = this.storage.loadData(this.logger);
    const weekKeyFn = this.storage.getWeekKeyFromDate || DEFAULT_WEEK_KEY_FN;
    const weekKey = weekKeyFn(new Date());

    if (!data.weeklyStats) {
      data.weeklyStats = {};
    }
    if (!data.weeklyStats[weekKey]) {
      data.weeklyStats[weekKey] = {};
    }

    const challengerKey = this.statKey(guildId, challengerId);
    const opponentKey = this.statKey(guildId, opponentId);

    const allTimeChallenger = this.ensureStatEntry(
      data.allTimeStats,
      challengerKey,
    );
    const allTimeOpponent = this.ensureStatEntry(
      data.allTimeStats,
      opponentKey,
    );
    const weeklyChallenger = this.ensureStatEntry(
      data.weeklyStats[weekKey],
      challengerKey,
    );
    const weeklyOpponent = this.ensureStatEntry(
      data.weeklyStats[weekKey],
      opponentKey,
    );

    const bucketPairs = [
      [allTimeChallenger, allTimeOpponent],
      [weeklyChallenger, weeklyOpponent],
    ];

    for (const [challengerStats, opponentStats] of bucketPairs) {
      challengerStats.gamesPlayed += 1;
      opponentStats.gamesPlayed += 1;

      if (!winnerId) {
        challengerStats.draws += 1;
        opponentStats.draws += 1;
        challengerStats.winStreak = 0;
        opponentStats.winStreak = 0;
      } else if (String(winnerId) === String(challengerId)) {
        challengerStats.wins += 1;
        opponentStats.losses += 1;
        challengerStats.winStreak += 1;
        opponentStats.winStreak = 0;
      } else {
        opponentStats.wins += 1;
        challengerStats.losses += 1;
        opponentStats.winStreak += 1;
        challengerStats.winStreak = 0;
      }

      challengerStats.bestWinStreak = Math.max(
        challengerStats.bestWinStreak || 0,
        challengerStats.winStreak || 0,
      );
      opponentStats.bestWinStreak = Math.max(
        opponentStats.bestWinStreak || 0,
        opponentStats.winStreak || 0,
      );

      challengerStats.updatedAt = new Date().toISOString();
      opponentStats.updatedAt = new Date().toISOString();
    }

    data.allTimeStats[challengerKey] = allTimeChallenger;
    data.allTimeStats[opponentKey] = allTimeOpponent;
    data.weeklyStats[weekKey][challengerKey] = weeklyChallenger;
    data.weeklyStats[weekKey][opponentKey] = weeklyOpponent;
    this.storage.saveData(data, this.logger);
  }

  async createDuelChallenge(interaction, { challengedUser, theme }) {
    const guildId = interaction.guild.id;
    const challengerId = interaction.user.id;
    const opponentId = challengedUser.id;
    const normalizedTheme = this.normalizeText(theme);

    if (!this.questionService?.isSupportedTheme(normalizedTheme)) {
      return {
        ok: false,
        code: "INVALID_THEME",
      };
    }

    if (this.isUserInActiveDuel(guildId, challengerId)) {
      return { ok: false, code: "CHALLENGER_BUSY" };
    }

    if (this.isUserInActiveDuel(guildId, opponentId)) {
      return { ok: false, code: "OPPONENT_BUSY" };
    }

    const questions = this.questionService.getQuestionsForDuel(
      normalizedTheme,
      TOTAL_QUESTIONS_PER_DUEL,
    );

    if (questions.length < TOTAL_QUESTIONS_PER_DUEL) {
      return {
        ok: false,
        code: "INSUFFICIENT_QUESTIONS",
      };
    }

    const duelId = this.createDuelId();

    const acceptRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz:duel:accept:${duelId}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quiz:duel:decline:${duelId}`)
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({
      content: `<@${challengerId}> challenged <@${opponentId}> to a **${normalizedTheme}** quiz duel.\n<@${opponentId}>, you have 30 seconds to accept.`,
      components: [acceptRow],
      allowedMentions: {
        users: [challengerId, opponentId],
      },
    });

    const challengeMessage = await interaction.fetchReply();

    const duelState = {
      duelId,
      guildId: String(guildId),
      channelId: String(interaction.channelId),
      challengeMessageId: String(challengeMessage.id),
      challengerId: String(challengerId),
      opponentId: String(opponentId),
      theme: normalizedTheme,
      questions,
      currentQuestionIndex: 0,
      status: "pending",
      scores: {
        [String(challengerId)]: 0,
        [String(opponentId)]: 0,
      },
    };

    this.activeDuels.set(duelId, duelState);

    const collector = challengeMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: ACCEPT_TIMEOUT_MS,
      filter: (btnInteraction) =>
        btnInteraction.customId === `quiz:duel:accept:${duelId}` ||
        btnInteraction.customId === `quiz:duel:decline:${duelId}`,
    });

    collector.on("collect", async (btnInteraction) => {
      // Only the challenged user can accept; challenger can decline/cancel.
      const isAccepted =
        btnInteraction.customId === `quiz:duel:accept:${duelId}`;

      if (
        String(btnInteraction.user.id) !== String(opponentId) &&
        !(
          !isAccepted && String(btnInteraction.user.id) === String(challengerId)
        )
      ) {
        await btnInteraction.reply({
          content: "Only the challenged user can accept this duel.",
          ephemeral: true,
        });
        return;
      }

      if (!this.activeDuels.has(duelId) || duelState.status !== "pending") {
        await btnInteraction.reply({
          content: "This duel is no longer active.",
          ephemeral: true,
        });
        return;
      }

      if (isAccepted) {
        duelState.status = "in_progress";
        await btnInteraction.update({
          content: `Duel accepted by <@${opponentId}>. Starting now...`,
          components: [],
          allowedMentions: { users: [opponentId] },
        });

        collector.stop("accepted");
        await this.startDuel(duelState, interaction.channel);
        return;
      }

      duelState.status = "finished";
      await btnInteraction.update({
        content: `Duel declined.`,
        components: [],
      });
      this.activeDuels.delete(duelId);
      collector.stop("declined");
    });

    collector.on("end", async (_collected, reason) => {
      if (!this.activeDuels.has(duelId)) {
        return;
      }

      if (reason === "time" && duelState.status === "pending") {
        duelState.status = "finished";
        this.activeDuels.delete(duelId);

        try {
          await challengeMessage.edit({
            content: `Duel request timed out.`,
            components: [],
          });
        } catch (error) {
          this.logger.warn("Failed to edit timed out duel challenge", {
            error: error.message,
          });
        }
      }
    });

    return { ok: true };
  }

  async startDuel(duelState, channel) {
    // Main duel loop: ask 7 unique questions one by one.
    for (
      let index = 0;
      index < TOTAL_QUESTIONS_PER_DUEL && duelState.status === "in_progress";
      index += 1
    ) {
      duelState.currentQuestionIndex = index;
      const question = duelState.questions[index];
      await this.askQuestion(duelState, channel, question, index);
    }

    if (duelState.status === "in_progress") {
      await this.endGame(duelState, channel);
    }
  }

  async askQuestion(duelState, channel, question, questionIndex) {
    const duelId = duelState.duelId;
    const startedAt = Date.now();
    const answeredUsers = new Set();

    const embed = new EmbedBuilder()
      .setTitle(
        `Quiz Duel • ${duelState.theme.toUpperCase()} • Q${questionIndex + 1}/${TOTAL_QUESTIONS_PER_DUEL}`,
      )
      .setDescription(
        [
          question.question,
          "",
          `A) ${question.options[0]}`,
          `B) ${question.options[1]}`,
          `C) ${question.options[2]}`,
          `D) ${question.options[3]}`,
          "",
          "You have 10 seconds. First correct answer gets the point.",
        ].join("\n"),
      )
      .setColor(0x5865f2);

    const questionMessage = await channel.send({
      embeds: [embed],
      components: [this.buildAnswerRow(duelId)],
    });

    let questionResolved = false;

    await new Promise((resolve) => {
      let isDone = false;

      const done = () => {
        if (isDone) {
          return;
        }

        isDone = true;
        resolve();
      };

      const collector = questionMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: QUESTION_TIMEOUT_MS,
        // Restrict to this duel's answer buttons only.
        filter: (btnInteraction) =>
          btnInteraction.customId.startsWith(`quiz:answer:${duelId}:`),
      });

      collector.on("collect", async (btnInteraction) => {
        await this.handleAnswer({
          duelState,
          question,
          btnInteraction,
          startedAt,
          answeredUsers,
          collector,
          onResolved: () => {
            questionResolved = true;
          },
        });
      });

      collector.on("end", async (_collected, reason) => {
        await this.disableMessageButtons(questionMessage);

        if (!questionResolved) {
          if (reason === "time") {
            await channel.send("Time up. No correct answer this round.");
          } else if (reason === "all_attempted") {
            await channel.send(
              "Both players answered incorrectly. No points this round.",
            );
          }
        }

        done();
      });
    });
  }

  async handleAnswer({
    duelState,
    question,
    btnInteraction,
    startedAt,
    answeredUsers,
    collector,
    onResolved,
  }) {
    if (duelState.status !== "in_progress") {
      await btnInteraction.reply({
        content: "This duel is no longer active.",
        ephemeral: true,
      });
      return;
    }

    const userId = String(btnInteraction.user.id);
    const isPlayer =
      userId === duelState.challengerId || userId === duelState.opponentId;

    if (!isPlayer) {
      await btnInteraction.reply({
        content: "Only the two duel players can answer this question.",
        ephemeral: true,
      });
      return;
    }

    if (answeredUsers.has(userId)) {
      await btnInteraction.reply({
        content: "You already answered this question.",
        ephemeral: true,
      });
      return;
    }

    const parts = btnInteraction.customId.split(":");
    const selectedIndex = Number(parts[3]);
    if (
      !Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex > 3
    ) {
      await btnInteraction.reply({
        content: "Invalid answer option.",
        ephemeral: true,
      });
      return;
    }

    answeredUsers.add(userId);

    if (!this.isCorrectChoice(question, selectedIndex)) {
      await btnInteraction.reply({
        content: "Wrong answer.",
        ephemeral: true,
      });

      if (answeredUsers.size >= 2) {
        collector.stop("all_attempted");
      }
      return;
    }

    const elapsedMs = Date.now() - startedAt;
    // Optional speed bonus: fast answers within 3 seconds.
    const speedBonus = elapsedMs <= 3_000 ? 1 : 0;
    const pointsEarned = 1 + speedBonus;

    duelState.scores[userId] += pointsEarned;

    await btnInteraction.reply({
      content:
        speedBonus > 0
          ? `<@${userId}> got it correct quickly and earned **${pointsEarned}** points (+1 speed bonus).`
          : `<@${userId}> answered correctly and earned **1** point.`,
      allowedMentions: { users: [userId] },
    });

    onResolved();
    collector.stop("correct");
  }

  async endGame(duelState, channel) {
    duelState.status = "finished";

    const challengerScore = duelState.scores[duelState.challengerId] || 0;
    const opponentScore = duelState.scores[duelState.opponentId] || 0;

    let winnerId = null;
    let winnerText = "Draw";

    if (challengerScore > opponentScore) {
      winnerId = duelState.challengerId;
      winnerText = `<@${duelState.challengerId}>`;
    } else if (opponentScore > challengerScore) {
      winnerId = duelState.opponentId;
      winnerText = `<@${duelState.opponentId}>`;
    }

    this.recordResult(
      duelState.guildId,
      duelState.challengerId,
      duelState.opponentId,
      winnerId,
    );

    const challengerPosition = this.getUserPosition(
      duelState.guildId,
      duelState.challengerId,
    );
    const opponentPosition = this.getUserPosition(
      duelState.guildId,
      duelState.opponentId,
    );

    const resultLines = [
      `Final Scores`,
      `<@${duelState.challengerId}>: **${challengerScore}** points`,
      `<@${duelState.opponentId}>: **${opponentScore}** points`,
      winnerId ? `Winner: ${winnerText} 🎉` : "Result: Draw",
      "",
      `Leaderboard Position`,
      `<@${duelState.challengerId}>: #${challengerPosition?.rank || "-"}/${challengerPosition?.totalPlayers || "-"}`,
      `<@${duelState.opponentId}>: #${opponentPosition?.rank || "-"}/${opponentPosition?.totalPlayers || "-"}`,
    ];

    await channel.send({
      content: resultLines.join("\n"),
      allowedMentions: {
        users: [duelState.challengerId, duelState.opponentId],
      },
    });

    this.activeDuels.delete(duelState.duelId);
  }
}

module.exports = {
  QuizDuelService,
  SUPPORTED_THEMES: QUIZ_THEMES,
};
