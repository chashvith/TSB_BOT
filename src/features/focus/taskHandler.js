class FocusTaskHandler {
  constructor({ sessionManager, logger, config, voiceTracker }) {
    this.sessionManager = sessionManager;
    this.logger = logger;
    this.config = config;
    this.voiceTracker = voiceTracker;
  }

  markTaskDone(member) {
    const guildId = member?.guild?.id;
    const userId = member?.id;

    if (!guildId || !userId) {
      return { ok: false, code: "INVALID_MEMBER" };
    }

    const session = this.sessionManager.getActiveSession(guildId, userId);
    if (!session) {
      return { ok: false, code: "NO_ACTIVE_SESSION" };
    }

    const channel = member.voice?.channel || null;
    const isInFocusVC = this.voiceTracker.isFocusChannel(channel);
    if (!isInFocusVC) {
      return { ok: false, code: "NOT_IN_FOCUS_VC" };
    }

    const maxTasks = Number(this.config.focusMaxTasksPerSession || 5);
    if (session.tasksCompleted >= maxTasks) {
      return { ok: false, code: "TASK_LIMIT_REACHED", maxTasks };
    }

    const cooldownMinutes = Number(this.config.focusTaskCooldownMinutes || 10);
    const cooldownMs = cooldownMinutes * 60_000;
    const now = Date.now();

    if (session.lastTaskAt && now - session.lastTaskAt < cooldownMs) {
      const remainingMs = cooldownMs - (now - session.lastTaskAt);
      return {
        ok: false,
        code: "TASK_COOLDOWN",
        cooldownMinutes,
        remainingMinutes: Math.ceil(remainingMs / 60_000),
      };
    }

    const result = this.sessionManager.addTaskCompletion(guildId, userId, now);
    if (!result.ok) {
      this.logger.warn("Task completion failed for active focus session", {
        guildId,
        userId,
        code: result.code,
      });
      return result;
    }

    const xpPerTask = Number(this.config.focusTaskXpPerTask || 15);
    return {
      ok: true,
      tasksCompleted: result.tasksCompleted,
      taskXp: xpPerTask,
      taskXpTotal: result.tasksCompleted * xpPerTask,
      maxTaskXp: maxTasks * xpPerTask,
    };
  }
}

module.exports = {
  FocusTaskHandler,
};
