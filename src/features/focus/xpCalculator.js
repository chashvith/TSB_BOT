const DEFAULT_MULTIPLIERS = {
  focusAndStream: 1.2,
  focusOnly: 1.0,
  normalVoice: 0.6,
};

function clampNonNegative(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function getVoiceMultiplier({ inVoice, isFocusVC, isStreaming }) {
  if (!inVoice) {
    return 0;
  }

  if (isFocusVC && isStreaming) {
    return DEFAULT_MULTIPLIERS.focusAndStream;
  }

  if (isFocusVC) {
    return DEFAULT_MULTIPLIERS.focusOnly;
  }

  return DEFAULT_MULTIPLIERS.normalVoice;
}

function getEffectiveMultiplier(voiceState, { aloneXpMultiplier = 1 } = {}) {
  const base = getVoiceMultiplier(voiceState || {});
  if (!base) {
    return 0;
  }

  if (voiceState?.isAlone && aloneXpMultiplier < 1) {
    return base * Math.max(0, aloneXpMultiplier);
  }

  return base;
}

function calculateSessionXp({
  weightedMinutes,
  tasksCompleted,
  taskXpPerTask = 15,
}) {
  const safeWeightedMinutes = clampNonNegative(weightedMinutes);
  const safeTasksCompleted = clampNonNegative(tasksCompleted);
  const safeTaskXpPerTask = clampNonNegative(taskXpPerTask);

  const timeXp = Number(safeWeightedMinutes.toFixed(2));
  const taskXp = Number((safeTasksCompleted * safeTaskXpPerTask).toFixed(2));

  return {
    timeXp,
    taskXp,
    totalXp: Number((timeXp + taskXp).toFixed(2)),
  };
}

module.exports = {
  getVoiceMultiplier,
  getEffectiveMultiplier,
  calculateSessionXp,
};
