const { EmbedBuilder } = require("discord.js");

const FALLBACK_FACTS = [
  "Bananas are technically berries, but strawberries aren’t.",
  "Octopuses have three hearts.",
  "Honey never spoils.",
  "Sharks existed before trees.",
  "A day on Venus is longer than a year on Venus.",
  "Wombats have cube-shaped poop.",
  "The Eiffel Tower can grow taller in summer due to heat expansion.",
  "There are more stars in the universe than grains of sand on Earth.",
  "Your brain uses about 20% of your body’s energy.",
  "A group of flamingos is called a 'flamboyance'.",

  "Sloths can hold their breath longer than dolphins.",
  "The shortest war in history lasted 38–45 minutes.",
  "Hot water can freeze faster than cold water under certain conditions.",
  "Butterflies can taste with their feet.",
  "Some turtles can breathe through their butts.",
  "The first computer bug was an actual bug (a moth).",
  "There are more possible chess games than atoms in the observable universe.",
  "The human nose can remember over 50,000 scents.",
  "A day on Mercury lasts about 59 Earth days.",
  "Cows have best friends and get stressed when separated.",

  "The inventor of the Pringles can is buried in one.",
  "Dolphins have names for each other.",
  "A single cloud can weigh more than a million kilograms.",
  "The dot over the letter 'i' is called a tittle.",
  "Penguins propose with pebbles.",
  "You can’t hum while holding your nose.",
  "The average person spends about 6 months of their life waiting at red lights.",
  "There are more fake flamingos than real ones.",
  "A group of crows is called a murder.",
  "Cats can rotate their ears 180 degrees.",

  "The first alarm clock could only ring at 4 AM.",
  "Some frogs can freeze without dying.",
  "The longest English word has 189,819 letters.",
  "Your stomach gets a new lining every few days.",
  "A bolt of lightning is five times hotter than the surface of the sun.",
  "Humans share about 60% of their DNA with bananas.",
  "The moon has moonquakes.",
  "An octopus can fit through anything larger than its beak.",
  "There are more trees on Earth than stars in the Milky Way.",
  "The smell of rain is called petrichor.",

  "Some metals explode when they touch water.",
  "A day used to be shorter—Earth’s rotation is slowing down.",
  "The world’s oldest toy is a stick.",
  "You blink about 20,000 times a day.",
  "The human body contains enough carbon to make around 900 pencils.",
  "The longest hiccuping spree lasted 68 years.",
  "A snail can sleep for up to 3 years.",
  "The first oranges weren’t orange—they were green.",
  "You can hear a blue whale’s heartbeat from miles away.",
  "There’s a species of jellyfish that is biologically immortal.",
];

class FactsService {
  constructor({ storage, logger, config }) {
    this.storage = storage;
    this.logger = logger;
    this.config = config;
    this.intervalHandle = null;

    this.data = this.storage.loadData(this.logger);
  }

  getPingRoleId() {
    return this.config.qotdRoleId || this.config.factsRoleId || null;
  }

  isEnabled() {
    return Boolean(this.config.factsChannelId && this.getPingRoleId());
  }

  getIntervalDays() {
    const intervalDays = Number(this.config.factsIntervalDays || 7);
    return Number.isFinite(intervalDays) && intervalDays > 0 ? intervalDays : 7;
  }

  getLastPostedAt() {
    return this.data.lastPostedAt ? new Date(this.data.lastPostedAt) : null;
  }

  shouldPostNow(now = new Date()) {
    const lastPostedAt = this.getLastPostedAt();
    if (!lastPostedAt || Number.isNaN(lastPostedAt.getTime())) {
      return true;
    }

    const intervalMs = this.getIntervalDays() * 24 * 60 * 60 * 1000;
    return now.getTime() - lastPostedAt.getTime() >= intervalMs;
  }

  markPosted() {
    this.data.lastPostedAt = new Date().toISOString();
    this.storage.saveData(this.data, this.logger);
  }

  async fetchRandomFact() {
    const apis = [
      {
        url: "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en",
        parse: (payload) => payload?.text,
      },
      {
        url: "https://catfact.ninja/fact",
        parse: (payload) => payload?.fact,
      },
    ];

    for (const api of apis) {
      try {
        const response = await fetch(api.url);
        if (!response.ok) {
          continue;
        }

        const payload = await response.json();
        const fact = String(api.parse(payload) || "").trim();
        if (fact) {
          return fact;
        }
      } catch (error) {
        this.logger.warn("Random facts API failed", {
          url: api.url,
          error: error.message,
        });
      }
    }

    const fallbackIndex = Math.floor(Math.random() * FALLBACK_FACTS.length);
    return FALLBACK_FACTS[fallbackIndex];
  }

  normalizeFact(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async fetchWeeklyFacts(count = 7) {
    const targetCount = Number.isFinite(count) && count > 0 ? count : 7;
    const facts = [];
    const seen = new Set();

    const maxApiAttempts = targetCount * 5;
    for (
      let index = 0;
      index < maxApiAttempts && facts.length < targetCount;
      index += 1
    ) {
      const fact = this.normalizeFact(await this.fetchRandomFact());
      if (!fact) {
        continue;
      }

      const key = fact.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      facts.push(fact);
    }

    if (facts.length < targetCount) {
      const shuffledFallback = [...FALLBACK_FACTS].sort(
        () => Math.random() - 0.5,
      );
      for (const fallback of shuffledFallback) {
        if (facts.length >= targetCount) {
          break;
        }

        const fact = this.normalizeFact(fallback);
        const key = fact.toLowerCase();
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        facts.push(fact);
      }
    }

    return facts.slice(0, targetCount);
  }

  buildFactEmbed(facts) {
    const lines = facts.map((fact, index) => `**${index + 1}.** ${fact}`);

    return new EmbedBuilder()
      .setTitle("7 Random Facts of the Week")
      .setDescription(lines.join("\n\n"))
      .setColor(0x1abc9c)
      .setFooter({ text: "Come back next week for 7 more facts." })
      .setTimestamp();
  }

  async postFact(client) {
    if (!this.isEnabled()) {
      return { ok: false, code: "FACTS_DISABLED" };
    }

    const channel = await client.channels
      .fetch(this.config.factsChannelId)
      .catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return { ok: false, code: "INVALID_CHANNEL" };
    }

    const facts = await this.fetchWeeklyFacts(7);
    if (!facts.length) {
      return { ok: false, code: "NO_FACTS_AVAILABLE" };
    }

    const embed = this.buildFactEmbed(facts);

    const roleId = this.getPingRoleId();

    await channel.send({
      content: `<@&${roleId}>`,
      embeds: [embed],
      allowedMentions: {
        roles: [roleId],
      },
    });

    this.markPosted();
    return { ok: true, facts };
  }

  async runTick(client) {
    if (!this.isEnabled()) {
      return;
    }

    if (!this.shouldPostNow(new Date())) {
      return;
    }

    const result = await this.postFact(client);
    if (!result.ok) {
      this.logger.warn("Weekly fact tick skipped", result);
    }
  }

  start(client) {
    if (!this.isEnabled()) {
      this.logger.info(
        "Random facts disabled: set FACTS_CHANNEL_ID and QOTD_ROLE_ID",
      );
      return;
    }

    if (this.intervalHandle) {
      return;
    }

    this.intervalHandle = setInterval(
      () => {
        this.runTick(client).catch((error) => {
          this.logger.error("Random facts scheduler failed", {
            error: error.message,
          });
        });
      },
      60 * 60 * 1000,
    );

    this.intervalHandle.unref();

    this.logger.info("Random facts scheduler started", {
      channelId: this.config.factsChannelId,
      roleId: this.getPingRoleId(),
      intervalDays: this.getIntervalDays(),
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
  FactsService,
};
