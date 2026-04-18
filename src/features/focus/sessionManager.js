const {
  getEffectiveMultiplier,
  calculateSessionXp,
} = require("./xpCalculator");

class FocusSessionManager {
  constructor({ storage, logger, config }) {
    this.storage = storage;
    this.logger = logger;
    this.config = config;
    this.activeSessions = new Map();
  }

  getSessionKey(guildId, userId) {
    return `${String(guildId)}:${String(userId)}`;
  }

  getActiveSession(guildId, userId) {
    return this.activeSessions.get(this.getSessionKey(guildId, userId)) || null;
  }

  startSession({ guildId, userId, durationMinutes, initialVoiceState }) {
    const safeDuration = Number(durationMinutes);
    if (!Number.isFinite(safeDuration) || safeDuration <= 0) {
      return { ok: false, code: "INVALID_DURATION" };
    }

    const key = this.getSessionKey(guildId, userId);
    if (this.activeSessions.has(key)) {
      return { ok: false, code: "SESSION_ALREADY_ACTIVE" };
    }

    if (!initialVoiceState?.inVoice) {
      return { ok: false, code: "USER_NOT_IN_VC" };
    }

    const now = Date.now();
    const endsAt = now + safeDuration * 60_000;

    const session = {
      key,
      guildId: String(guildId),
      userId: String(userId),
      startedAt: now,
      endsAt,
      durationMinutes: safeDuration,
      weightedMinutes: 0,
      tasksCompleted: 0,
      lastTaskAt: 0,
      currentVoiceState: { ...initialVoiceState },
      lastStateChangedAt: now,
      closed: false,
      timeoutHandle: null,
    };

    session.timeoutHandle = setTimeout(() => {
      this.completeSession(key);
    }, safeDuration * 60_000);
    session.timeoutHandle.unref();

    this.activeSessions.set(key, session);
    return {
      ok: true,
      session: {
        startedAt: session.startedAt,
        endsAt: session.endsAt,
        durationMinutes: session.durationMinutes,
      },
    };
  }

  updateVoiceState(guildId, userId, nextVoiceState) {
    const key = this.getSessionKey(guildId, userId);
    const session = this.activeSessions.get(key);
    if (!session || session.closed) {
      return;
    }

    const now = Date.now();
    this.accrueVoiceTime(session, now);

    session.currentVoiceState = { ...nextVoiceState };
    session.lastStateChangedAt = now;

    if (!nextVoiceState?.inVoice) {
      this.cancelSession(key, "LEFT_VC_EARLY");
    }
  }

  addTaskCompletion(guildId, userId, at = Date.now()) {
    const session = this.getActiveSession(guildId, userId);
    if (!session) {
      return { ok: false, code: "NO_ACTIVE_SESSION" };
    }

    session.tasksCompleted += 1;
    session.lastTaskAt = at;

    return {
      ok: true,
      tasksCompleted: session.tasksCompleted,
    };
  }

  completeSession(sessionKey) {
    const session = this.activeSessions.get(sessionKey);
    if (!session || session.closed) {
      return { ok: false, code: "SESSION_NOT_FOUND" };
    }

    const now = Date.now();
    this.accrueVoiceTime(session, now);

    if (!session.currentVoiceState?.inVoice) {
      return this.cancelSession(sessionKey, "LEFT_VC_EARLY");
    }

    const elapsedMinutes = (now - session.startedAt) / 60_000;
    const minimumMinutes = Number(this.config.focusMinimumSessionMinutes || 5);

    if (elapsedMinutes < minimumMinutes) {
      this.stopAndForgetSession(session);
      return {
        ok: true,
        awarded: false,
        code: "SESSION_TOO_SHORT",
        elapsedMinutes,
      };
    }

    const { timeXp, taskXp, totalXp } = calculateSessionXp({
      weightedMinutes: session.weightedMinutes,
      tasksCompleted: session.tasksCompleted,
      taskXpPerTask: this.config.focusTaskXpPerTask || 15,
    });

    const persisted = this.addXpToUser(session.userId, {
      totalXp,
      weightedMinutes: session.weightedMinutes,
      tasksCompleted: session.tasksCompleted,
    });

    this.stopAndForgetSession(session);

    return {
      ok: true,
      awarded: true,
      elapsedMinutes,
      weightedMinutes: session.weightedMinutes,
      tasksCompleted: session.tasksCompleted,
      timeXp,
      taskXp,
      totalXp,
      userTotals: persisted,
    };
  }

  cancelSession(sessionKey, reason = "CANCELLED") {
    const session = this.activeSessions.get(sessionKey);
    if (!session || session.closed) {
      return { ok: false, code: "SESSION_NOT_FOUND" };
    }

    this.stopAndForgetSession(session);

    return {
      ok: true,
      awarded: false,
      code: reason,
    };
  }

  stopAndForgetSession(session) {
    if (session.closed) {
      return;
    }

    session.closed = true;
    if (session.timeoutHandle) {
      clearTimeout(session.timeoutHandle);
    }

    this.activeSessions.delete(session.key);
  }

  accrueVoiceTime(session, nowMs) {
    const startedAt = Number(session.lastStateChangedAt || nowMs);
    const endedAt = Number(nowMs);
    const elapsedMs = endedAt - startedAt;

    if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
      return;
    }

    const elapsedMinutes = elapsedMs / 60_000;
    const multiplier = getEffectiveMultiplier(session.currentVoiceState, {
      aloneXpMultiplier: this.config.aloneXpMultiplier,
    });

    session.weightedMinutes += elapsedMinutes * multiplier;
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

    if (!Number.isFinite(Number(data.users[id].totalXp))) {
      data.users[id].totalXp = 0;
    }

    if (!Number.isFinite(Number(data.users[id].tasksCompleted))) {
      data.users[id].tasksCompleted = 0;
    }

    if (!Number.isFinite(Number(data.users[id].studyTime))) {
      data.users[id].studyTime = 0;
    }

    return data.users[id];
  }

  addXpToUser(userId, { totalXp, weightedMinutes, tasksCompleted }) {
    const data = this.storage.loadData(this.logger);
    const user = this.ensureUser(data, userId);

    user.totalXp = Number(
      (Number(user.totalXp || 0) + Number(totalXp || 0)).toFixed(2),
    );
    user.studyTime = Number(user.studyTime || 0) + Number(weightedMinutes || 0);
    user.tasksCompleted =
      Number(user.tasksCompleted || 0) + Number(tasksCompleted || 0);

    this.storage.saveData(data, this.logger);

    return {
      totalXp: user.totalXp,
      studyTime: user.studyTime,
      tasksCompleted: user.tasksCompleted,
    };
  }
}

module.exports = {
  FocusSessionManager,
};
