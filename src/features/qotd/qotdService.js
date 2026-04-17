const { buildQotdEmbed, buildQotdThreadPrompt } = require("./qotdUI");
const { randomUUID } = require("crypto");

class QotdService {
  constructor({ storage, logger, config }) {
    this.storage = storage;
    this.logger = logger;
    this.config = config;
    this.intervalHandle = null;

    this.data = this.storage.loadData(this.logger);
  }

  getUtcDateKey(date = new Date()) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  isEnabled() {
    return Boolean(this.config.qotdChannelId);
  }

  getIntervalDays() {
    const intervalDays = Number(this.config.qotdIntervalDays || 2);
    return Number.isFinite(intervalDays) && intervalDays > 0 ? intervalDays : 2;
  }

  getQueuedIntervalDays() {
    return Number(this.config.qotdQueuedIntervalDays || 1) > 0
      ? Number(this.config.qotdQueuedIntervalDays || 1)
      : 1;
  }

  getBasePostDate(now = new Date()) {
    const lastPostedAt = this.getLastPostedAt();
    if (lastPostedAt && !Number.isNaN(lastPostedAt.getTime())) {
      return lastPostedAt;
    }

    return now;
  }

  formatDateForDisplay(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  estimateQuestionPostDate(position, now = new Date()) {
    const queuePosition = Number(position);
    if (!Number.isFinite(queuePosition) || queuePosition < 1) {
      return null;
    }

    const baseDate = this.getBasePostDate(now);
    const daysUntilPost =
      queuePosition * this.getQueuedIntervalDays() +
      (this.hasQueuedQuestions() ? 0 : 0);

    const estimated = new Date(baseDate.getTime());
    estimated.setDate(estimated.getDate() + daysUntilPost);
    return estimated;
  }

  hasQueuedQuestions() {
    return Array.isArray(this.data.queue) && this.data.queue.length > 0;
  }

  pickRandomDefaultQuestion() {
    const questions = this.data.questions || [];
    if (!questions.length) {
      return null;
    }

    const index = Math.floor(Math.random() * questions.length);
    return questions[index];
  }

  enqueueQuestion(questionText, { userId, username }) {
    const normalizedQuestion = String(questionText || "").trim();
    const normalizedUserId = String(userId || "").trim();

    if (!normalizedQuestion) {
      return { ok: false, code: "EMPTY_QUESTION" };
    }

    if (!Array.isArray(this.data.queue)) {
      this.data.queue = [];
    }

    const existingByUserIndex = this.data.queue.findIndex(
      (item) => String(item.userId || "") === normalizedUserId,
    );
    if (existingByUserIndex !== -1) {
      const existingItem = this.data.queue[existingByUserIndex];
      const position = existingByUserIndex + 1;
      const estimatedPostDate = this.estimateQuestionPostDate(position);

      return {
        ok: false,
        code: "USER_ALREADY_HAS_QUESTION",
        item: existingItem,
        position,
        estimatedPostDate,
      };
    }

    const duplicate = this.data.queue.find(
      (item) =>
        String(item.question || "")
          .trim()
          .toLowerCase() === normalizedQuestion.toLowerCase(),
    );
    if (duplicate) {
      return { ok: false, code: "DUPLICATE_QUEUE_QUESTION" };
    }

    const item = {
      id: randomUUID(),
      question: normalizedQuestion,
      userId: normalizedUserId,
      username: String(username || "").trim() || "Unknown",
      createdAt: new Date().toISOString(),
    };

    this.data.queue.push(item);
    this.storage.saveData(this.data, this.logger);

    const position = this.data.queue.length;
    const estimatedPostDate = this.estimateQuestionPostDate(position);

    return {
      ok: true,
      item,
      position,
      estimatedPostDate,
    };
  }

  dequeueQuestion() {
    if (this.hasQueuedQuestions()) {
      const item = this.data.queue.shift();
      this.storage.saveData(this.data, this.logger);
      return {
        question: item.question,
        requestedBy: item.username,
        source: "queue",
      };
    }

    const question = this.pickRandomDefaultQuestion();
    if (!question) {
      return null;
    }

    return { question, requestedBy: null, source: "default" };
  }

  getLastPostedAt() {
    return this.data.lastPostedAt ? new Date(this.data.lastPostedAt) : null;
  }

  shouldPostNow(now = new Date()) {
    const lastPostedAt = this.getLastPostedAt();
    if (!lastPostedAt || Number.isNaN(lastPostedAt.getTime())) {
      return true;
    }

    const intervalDays = this.hasQueuedQuestions()
      ? this.getQueuedIntervalDays()
      : this.getIntervalDays();
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    return now.getTime() - lastPostedAt.getTime() >= intervalMs;
  }

  markPosted() {
    this.data.lastPostedAt = new Date().toISOString();
    this.storage.saveData(this.data, this.logger);
  }

  buildThreadName(questionText) {
    const cleaned = String(questionText || "qotd")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);

    return `qotd-${cleaned}`;
  }

  async postQuestion(client, questionText, { requestedBy = null } = {}) {
    if (!this.isEnabled()) {
      return { ok: false, code: "QOTD_DISABLED" };
    }

    const channel = await client.channels
      .fetch(this.config.qotdChannelId)
      .catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return { ok: false, code: "INVALID_CHANNEL" };
    }

    const dateKey = this.getUtcDateKey();
    const content = this.config.qotdRoleId
      ? `<@&${this.config.qotdRoleId}>`
      : null;
    const embed = buildQotdEmbed(questionText, {
      dateKey,
      requestedBy,
    });

    const message = await channel.send({
      content,
      embeds: [embed],
      allowedMentions: this.config.qotdRoleId
        ? { roles: [this.config.qotdRoleId] }
        : undefined,
    });

    let thread = null;
    try {
      thread = await message.startThread({
        name: this.buildThreadName(questionText),
        autoArchiveDuration: 1440,
        reason: "QOTD response thread",
      });

      await thread.send(buildQotdThreadPrompt(questionText));
    } catch (error) {
      this.logger.warn("Failed to create QOTD thread", {
        error: error.message,
        questionText,
      });
    }

    this.markPosted();
    return {
      ok: true,
      dateKey,
      question: questionText,
      threadId: thread?.id || null,
    };
  }

  async postDueQuestion(client) {
    const selected = this.dequeueQuestion();
    if (!selected) {
      return { ok: false, code: "NO_QUESTIONS" };
    }

    return this.postQuestion(client, selected.question, {
      requestedBy: selected.requestedBy,
    });
  }

  async postRandomQuestion(client, options = {}) {
    const question = this.pickRandomDefaultQuestion();
    if (!question) {
      return { ok: false, code: "NO_QUESTIONS" };
    }

    return this.postQuestion(client, question, options);
  }

  async runTick(client) {
    if (!this.isEnabled()) {
      return;
    }

    if (!this.shouldPostNow(new Date())) {
      return;
    }

    const result = await this.postDueQuestion(client);
    if (!result.ok) {
      this.logger.warn("QOTD tick skipped", result);
    }
  }

  start(client) {
    if (!this.isEnabled()) {
      this.logger.info("QOTD disabled: set QOTD_CHANNEL_ID to enable");
      return;
    }

    if (this.intervalHandle) {
      return;
    }

    this.intervalHandle = setInterval(
      () => {
        this.runTick(client).catch((error) => {
          this.logger.error("QOTD scheduler failed", {
            error: error.message,
          });
        });
      },
      30 * 60 * 1000,
    );

    this.intervalHandle.unref();

    this.logger.info("QOTD scheduler started", {
      channelId: this.config.qotdChannelId,
      baseIntervalDays: this.getIntervalDays(),
      queuedIntervalDays: this.getQueuedIntervalDays(),
    });
  }

  async addQuestionToQueue(questionText, user) {
    return this.enqueueQuestion(questionText, {
      userId: user.id,
      username: user.username,
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
  QotdService,
};
