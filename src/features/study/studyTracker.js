class StudyTracker {
  constructor({ storage, logger, config }) {
    this.storage = storage;
    this.logger = logger;
    this.config = config;
    this.activeSessions = new Map();
  }

  isStudyChannel(channelId) {
    if (!channelId) {
      return false;
    }

    const studyVcIds = Array.isArray(this.config.studyVcIds)
      ? this.config.studyVcIds
      : [];

    return studyVcIds.includes(String(channelId));
  }

  ensureUser(data, userId) {
    const id = String(userId);
    if (!data.users[id]) {
      data.users[id] = {
        tasksCompleted: 0,
        studyTime: 0,
        totalXp: 0,
      };
    }

    return data.users[id];
  }

  addStudyMinutes(userId, minutes) {
    const safeMinutes = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
    if (!safeMinutes) {
      return;
    }

    const data = this.storage.loadData(this.logger);
    const user = this.ensureUser(data, userId);
    user.studyTime += safeMinutes;
    this.storage.saveData(data, this.logger);
  }

  async handleVoiceStateUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user?.bot) {
      return;
    }

    const userId = String(member.id);
    const oldChannelId = oldState.channelId ? String(oldState.channelId) : null;
    const newChannelId = newState.channelId ? String(newState.channelId) : null;

    const wasInStudy = this.isStudyChannel(oldChannelId);
    const isInStudy = this.isStudyChannel(newChannelId);

    if (!wasInStudy && isInStudy) {
      if (!this.activeSessions.has(userId)) {
        this.activeSessions.set(userId, Date.now());
      }
      return;
    }

    if (wasInStudy && !isInStudy) {
      const startedAt = this.activeSessions.get(userId);
      if (!startedAt) {
        return;
      }

      this.activeSessions.delete(userId);
      const durationMs = Date.now() - startedAt;
      const minutes = Math.max(1, Math.ceil(durationMs / 60000));
      this.addStudyMinutes(userId, minutes);
    }
  }
}

module.exports = {
  StudyTracker,
};
