const { EmbedBuilder } = require("discord.js");

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

class LeaderboardService {
  constructor({ storage, logger, resetDays = 7 }) {
    this.storage = storage;
    this.logger = logger;
    this.resetDays = resetDays;
    this.intervalHandle = null;
  }

  formatStudyTime(minutes) {
    const totalMinutes = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  buildLeaderboardEmbed(rows, title = "Weekly Study Leaderboard") {
    const visibleRows = rows.slice(0, 10);

    if (!visibleRows.length || !visibleRows.some((row) => row.score > 0)) {
      return new EmbedBuilder()
        .setTitle(title)
        .setDescription("No activity this week yet.")
        .setColor(0x5865f2)
        .setTimestamp();
    }

    const lines = visibleRows.map((row, index) => {
      const username = row.username || `User ${row.userId}`;
      return `${rankLabel(index)} ${username} | Tasks: ${row.tasksCompleted} | Study: ${this.formatStudyTime(row.studyTime)} | Score: ${row.score}`;
    });

    return new EmbedBuilder()
      .setTitle(title)
      .setDescription(lines.join("\n"))
      .setColor(0xf1c40f)
      .setFooter({ text: "Score = (tasksCompleted × 10) + studyTimeMinutes" })
      .setTimestamp();
  }

  getLeaderboardRows() {
    const data = this.storage.loadData(this.logger);

    const rows = Object.entries(data.users || {}).map(([userId, stats]) => {
      const tasksCompleted = Number(stats.tasksCompleted || 0);
      const studyTime = Number(stats.studyTime || 0);
      const score = tasksCompleted * 10 + studyTime;

      return {
        userId,
        username: stats.username || null,
        tasksCompleted,
        studyTime,
        score,
      };
    });

    return rows.sort((left, right) => right.score - left.score);
  }

  resetWeeklyStats(reason = "scheduled") {
    const data = this.storage.loadData(this.logger);
    const previousSnapshot = {
      users: JSON.parse(JSON.stringify(data.users || {})),
      at: new Date().toISOString(),
      reason,
    };

    for (const userId of Object.keys(data.users || {})) {
      data.users[userId].tasksCompleted = 0;
      data.users[userId].studyTime = 0;
    }

    data.meta = data.meta || {};
    data.meta.history = Array.isArray(data.meta.history)
      ? data.meta.history
      : [];
    data.meta.history.push(previousSnapshot);
    data.meta.lastResetAt = new Date().toISOString();

    this.storage.saveData(data, this.logger);
    this.logger.info("Weekly productivity stats reset", {
      reason,
      usersReset: Object.keys(data.users || {}).length,
    });
  }

  shouldReset(now, lastResetAt) {
    const nowMs = now.getTime();
    const lastResetMs = new Date(lastResetAt || 0).getTime();

    if (!Number.isFinite(lastResetMs)) {
      return true;
    }

    const resetIntervalMs = this.resetDays * 24 * 60 * 60 * 1000;
    return nowMs - lastResetMs >= resetIntervalMs;
  }

  async publishWeeklyLeaderboard(client) {
    const channelId = client.config?.leaderboardChannelId;
    if (!channelId) {
      this.logger.info(
        "Leaderboard channel not configured; skipping weekly post",
      );
      return;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      this.logger.warn("Configured leaderboard channel is not text based", {
        channelId,
      });
      return;
    }

    const rows = await Promise.all(
      this.getLeaderboardRows().map(async (row) => {
        const user = await client.users.fetch(row.userId).catch(() => null);
        return {
          ...row,
          username: user ? user.username : row.username || `User ${row.userId}`,
        };
      }),
    );

    const embed = this.buildLeaderboardEmbed(
      rows,
      "This Week's Study Leaderboard",
    );
    await channel.send({ embeds: [embed] });
  }

  async checkAndResetWeeklyStats(client) {
    const data = this.storage.loadData(this.logger);
    const lastResetAt = data.meta?.lastResetAt;

    if (this.shouldReset(new Date(), lastResetAt)) {
      if (client) {
        await this.publishWeeklyLeaderboard(client).catch((error) => {
          this.logger.error("Failed to publish weekly leaderboard", {
            error: error.message,
          });
        });
      }

      this.resetWeeklyStats("interval");
    }
  }

  startWeeklyResetScheduler(client) {
    if (this.intervalHandle) {
      return;
    }

    this.checkAndResetWeeklyStats(client);

    this.intervalHandle = setInterval(() => {
      try {
        this.checkAndResetWeeklyStats(client);
      } catch (error) {
        this.logger.error("Weekly reset scheduler failed", {
          error: error.message,
        });
      }
    }, 60 * 1000);

    this.intervalHandle.unref();
  }

  stopWeeklyResetScheduler() {
    if (!this.intervalHandle) {
      return;
    }

    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }
}

module.exports = {
  LeaderboardService,
};
