const { EmbedBuilder } = require("discord.js");

const FALLBACK_RIDDLES = [
  {
    riddle: "What has to be broken before you can use it?",
    answer: "An egg.",
  },
  {
    riddle: "What has keys but can't open locks?",
    answer: "A piano.",
  },
  {
    riddle: "What can travel around the world while staying in one spot?",
    answer: "A stamp.",
  },
  {
    riddle: "What gets wetter the more it dries?",
    answer: "A towel.",
  },
  {
    riddle: "I’m tall when I’m young, and I’m short when I’m old. What am I?",
    answer: "A candle.",
  },
];

class RiddleService {
  constructor({ storage, factsStorage, logger, config }) {
    this.storage = storage;
    this.factsStorage = factsStorage;
    this.logger = logger;
    this.config = config;
    this.intervalHandle = null;

    this.data = this.storage.loadData(this.logger);
  }

  getDelayMinutes() {
    const value = Number(this.config.riddleDelayMinutes || 60);
    return Number.isFinite(value) && value > 0 ? value : 60;
  }

  getChannelId() {
    return (
      this.config.riddleChannelId ||
      this.config.factsChannelId ||
      this.config.qotdChannelId
    );
  }

  getPingRoleId() {
    return this.config.qotdRoleId || this.config.factsRoleId || null;
  }

  isEnabled() {
    return Boolean(this.getChannelId() && this.getPingRoleId());
  }

  getFactsLastPostedAt() {
    const factsData = this.factsStorage.loadData(this.logger);
    return factsData?.lastPostedAt || null;
  }

  shouldPostNow(now = new Date()) {
    const factsLastPostedAt = this.getFactsLastPostedAt();
    if (!factsLastPostedAt) {
      return false;
    }

    if (this.data.lastPostedForFactsAt === factsLastPostedAt) {
      return false;
    }

    const factsTime = new Date(factsLastPostedAt);
    if (Number.isNaN(factsTime.getTime())) {
      return false;
    }

    const delayMs = this.getDelayMinutes() * 60 * 1000;
    return now.getTime() - factsTime.getTime() >= delayMs;
  }

  markPosted(factsTimestamp) {
    this.data.lastPostedAt = new Date().toISOString();
    this.data.lastPostedForFactsAt = factsTimestamp;
    this.storage.saveData(this.data, this.logger);
  }

  async fetchRiddle() {
    const apiSources = [
      {
        url: "https://riddles-api.vercel.app/random",
        parse: (payload) => ({
          riddle: String(payload?.riddle || "").trim(),
          answer: String(payload?.answer || "").trim(),
        }),
      },
    ];

    for (const source of apiSources) {
      try {
        const response = await fetch(source.url);
        if (!response.ok) {
          continue;
        }

        const payload = await response.json();
        const parsed = source.parse(payload);
        if (parsed.riddle && parsed.answer) {
          return {
            ...parsed,
            source: "api",
          };
        }
      } catch (error) {
        this.logger.warn("Riddle API failed", {
          url: source.url,
          error: error.message,
        });
      }
    }

    const fallback =
      FALLBACK_RIDDLES[Math.floor(Math.random() * FALLBACK_RIDDLES.length)];
    return {
      ...fallback,
      source: "fallback",
    };
  }

  buildRiddleEmbed({ riddle, answer }) {
    return new EmbedBuilder()
      .setTitle("Riddle Time")
      .setDescription(riddle)
      .addFields({
        name: "Answer",
        value: `||${answer}||`,
        inline: false,
      })
      .setColor(0x9b59b6)
      .setFooter({ text: "Weekly follow-up after random facts." })
      .setTimestamp();
  }

  async postRiddle(client, { pingRole = true } = {}) {
    const channelId = this.getChannelId();
    const roleId = this.getPingRoleId();

    if (!channelId || (pingRole && !roleId)) {
      return { ok: false, code: "RIDDLE_DISABLED" };
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return { ok: false, code: "INVALID_CHANNEL" };
    }

    const riddle = await this.fetchRiddle();
    const embed = this.buildRiddleEmbed(riddle);

    await channel.send({
      content: pingRole && roleId ? `<@&${roleId}>` : undefined,
      embeds: [embed],
      allowedMentions: pingRole && roleId ? { roles: [roleId] } : undefined,
    });

    return {
      ok: true,
      riddle,
    };
  }

  async runTick(client) {
    if (!this.isEnabled()) {
      return;
    }

    if (!this.shouldPostNow(new Date())) {
      return;
    }

    const factsTimestamp = this.getFactsLastPostedAt();
    const result = await this.postRiddle(client, { pingRole: true });
    if (!result.ok) {
      this.logger.warn("Weekly riddle tick skipped", result);
      return;
    }

    this.markPosted(factsTimestamp);
  }

  start(client) {
    if (!this.isEnabled()) {
      this.logger.info(
        "Riddles disabled: set QOTD_ROLE_ID and FACTS_CHANNEL_ID or RIDDLE_CHANNEL_ID",
      );
      return;
    }

    if (this.intervalHandle) {
      return;
    }

    this.intervalHandle = setInterval(
      () => {
        this.runTick(client).catch((error) => {
          this.logger.error("Riddle scheduler failed", {
            error: error.message,
          });
        });
      },
      15 * 60 * 1000,
    );

    this.intervalHandle.unref();

    this.logger.info("Riddle scheduler started", {
      channelId: this.getChannelId(),
      roleId: this.getPingRoleId(),
      delayMinutes: this.getDelayMinutes(),
    });
  }

  stop() {
    if (!this.intervalHandle) {
      return;
    }

    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }
}

module.exports = {
  RiddleService,
};
