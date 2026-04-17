const { EmbedBuilder } = require("discord.js");

class CodeforcesService {
  constructor({ logger, config, storage }) {
    this.logger = logger;
    this.config = config;
    this.storage = storage;

    this.notifiedContestIds = this.storage.loadNotifiedContestIds(this.logger);
    this.intervalHandle = null;
  }

  isEnabled() {
    return Boolean(
      this.config.codeforcesPingRoleId && this.config.codeforcesAlertChannelId,
    );
  }

  start(client) {
    if (!this.isEnabled()) {
      this.logger.warn(
        "Codeforces notifier is disabled due to missing config",
        {
          hasRoleId: Boolean(this.config.codeforcesPingRoleId),
          hasChannelId: Boolean(this.config.codeforcesAlertChannelId),
        },
      );
      return;
    }

    if (this.intervalHandle) {
      return;
    }

    const intervalMs = this.config.codeforcesPollIntervalMinutes * 60 * 1000;

    this.intervalHandle = setInterval(() => {
      this.checkAndNotify(client).catch((error) => {
        this.logger.error("Codeforces poll failed", error);
      });
    }, intervalMs);

    this.intervalHandle.unref();

    this.checkAndNotify(client).catch((error) => {
      this.logger.error("Initial Codeforces poll failed", error);
    });

    this.logger.info("Codeforces notifier started", {
      pollIntervalMinutes: this.config.codeforcesPollIntervalMinutes,
      reminderLeadMinutes: this.config.codeforcesReminderLeadMinutes,
    });
  }

  stop() {
    if (!this.intervalHandle) {
      return;
    }

    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  async checkAndNotify(client) {
    const contests = await this.fetchUpcomingContests();
    if (!contests.length) {
      return;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const leadSeconds = this.config.codeforcesReminderLeadMinutes * 60;

    const candidates = contests.filter((contest) => {
      const startsAt = Number(contest.startTimeSeconds || 0);
      if (!startsAt || startsAt <= nowSeconds) {
        return false;
      }

      const secondsUntilStart = startsAt - nowSeconds;
      return secondsUntilStart <= leadSeconds;
    });

    if (!candidates.length) {
      return;
    }

    const channel = await client.channels
      .fetch(this.config.codeforcesAlertChannelId)
      .catch((error) => {
        this.logger.error("Failed to fetch Codeforces alert channel", {
          channelId: this.config.codeforcesAlertChannelId,
          error: error.message,
        });
        return null;
      });

    if (!channel || !channel.isTextBased()) {
      this.logger.warn(
        "Configured Codeforces alert channel is not text based",
        {
          channelId: this.config.codeforcesAlertChannelId,
        },
      );
      return;
    }

    for (const contest of candidates) {
      const contestId = String(contest.id);
      if (this.notifiedContestIds.has(contestId)) {
        continue;
      }

      const embed = this.buildContestEmbed(contest);

      try {
        await channel.send({
          content: `<@&${this.config.codeforcesPingRoleId}> Codeforces contest reminder!`,
          embeds: [embed],
          allowedMentions: { roles: [this.config.codeforcesPingRoleId] },
        });

        this.notifiedContestIds.add(contestId);
      } catch (error) {
        this.logger.error("Failed to send Codeforces contest reminder", {
          contestId,
          contestName: contest.name,
          error: error.message,
        });
      }
    }

    this.storage.saveNotifiedContestIds(this.notifiedContestIds, this.logger);
  }

  async fetchUpcomingContests() {
    const response = await fetch("https://codeforces.com/api/contest.list");
    if (!response.ok) {
      throw new Error(`Codeforces API error: ${response.status}`);
    }

    const payload = await response.json();
    if (payload.status !== "OK" || !Array.isArray(payload.result)) {
      throw new Error("Codeforces API payload is not valid");
    }

    return payload.result.filter((contest) => contest.phase === "BEFORE");
  }

  buildContestEmbed(contest) {
    const startUnix = Number(contest.startTimeSeconds || 0);
    const durationMinutes = Math.floor(
      Number(contest.durationSeconds || 0) / 60,
    );

    return new EmbedBuilder()
      .setTitle("Codeforces Contest Incoming")
      .setDescription(`[${contest.name}](https://codeforces.com/contests)`)
      .setColor(0xf39c12)
      .addFields(
        {
          name: "Starts",
          value: startUnix
            ? `<t:${startUnix}:F> (<t:${startUnix}:R>)`
            : "Unknown",
          inline: false,
        },
        {
          name: "Duration",
          value: durationMinutes ? `${durationMinutes} minutes` : "Unknown",
          inline: true,
        },
        {
          name: "Type",
          value: contest.type || "Unknown",
          inline: true,
        },
      )
      .setFooter({ text: "Good luck and have fun coding." });
  }
}

module.exports = {
  CodeforcesService,
};
