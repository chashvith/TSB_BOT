function optionalId(value) {
  if (!value) {
    return null;
  }

  return String(value).trim();
}

function optionalList(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadConfig(env = process.env) {
  const studyVcIds = optionalList(env.STUDY_VC_IDS);
  const singleStudyVcId = optionalId(env.STUDY_VC_ID);
  const distractionRoleNames = optionalList(env.DISTRACTION_ROLE_NAMES);
  const hasDistractionRolesConfig = Object.prototype.hasOwnProperty.call(
    env,
    "DISTRACTION_ROLE_NAMES",
  );

  if (!studyVcIds.length && singleStudyVcId) {
    studyVcIds.push(singleStudyVcId);
  }

  const config = {
    token: env.TOKEN,
    studyVcIds,
    studyVcId: studyVcIds[0] || null,
    alertChannelId: optionalId(env.ALERT_CHANNEL_ID),
    welcomeChannelId: optionalId(env.WELCOME_CHANNEL_ID),
    introPanelChannelId: optionalId(env.INTRO_PANEL_CHANNEL_ID),
    introOutputChannelId: optionalId(env.INTRO_OUTPUT_CHANNEL_ID),
    adminRoleId: optionalId(env.ADMIN_ROLE_ID),
    alertPanelChannelId: optionalId(env.ALERT_PANEL_CHANNEL_ID),
    leaderboardChannelId: optionalId(env.LEADERBOARD_CHANNEL_ID),
    factsChannelId: optionalId(env.FACTS_CHANNEL_ID),
    factsRoleId: optionalId(env.FACTS_ROLE_ID),
    factsIntervalDays: Number(env.FACTS_INTERVAL_DAYS || 7),
    riddleChannelId: optionalId(env.RIDDLE_CHANNEL_ID),
    riddleDelayMinutes: Number(env.RIDDLE_DELAY_MINUTES || 60),
    qotdChannelId: optionalId(env.QOTD_CHANNEL_ID),
    qotdRoleId: optionalId(env.QOTD_ROLE_ID || env.QOTD_PING_ROLE_ID),
    qotdIntervalDays: Number(env.QOTD_INTERVAL_DAYS || 2),
    qotdQueuedIntervalDays: Number(env.QOTD_QUEUED_INTERVAL_DAYS || 1),
    codeforcesPingRoleId: optionalId(env.CODEFORCES_PING_ROLE_ID),
    codeforcesAlertChannelId: optionalId(env.CODEFORCES_ALERT_CHANNEL_ID),
    codeforcesPollIntervalMinutes: Number(
      env.CODEFORCES_POLL_INTERVAL_MINUTES || 30,
    ),
    codeforcesReminderLeadMinutes: Number(
      env.CODEFORCES_REMINDER_LEAD_MINUTES || 180,
    ),
    focusCategoryId: optionalId(env.FOCUS_CATEGORY_ID),
    focusJoinToCreateChannelId: optionalId(env.FOCUS_JOIN_TO_CREATE_CHANNEL_ID),
    focusJoinToCreateChannelName: (
      env.FOCUS_JOIN_TO_CREATE_CHANNEL_NAME || "Join to Create Focus Room"
    ).trim(),
    focusRoomNamePrefix: (env.FOCUS_ROOM_NAME_PREFIX || "Focus Room").trim(),
    focusMinimumSessionMinutes: Number(env.FOCUS_MINIMUM_SESSION_MINUTES || 5),
    focusTaskCooldownMinutes: Number(env.FOCUS_TASK_COOLDOWN_MINUTES || 10),
    focusMaxTasksPerSession: Number(env.FOCUS_MAX_TASKS_PER_SESSION || 5),
    focusTaskXpPerTask: Number(env.FOCUS_TASK_XP_PER_TASK || 15),
    aloneXpMultiplier: Number(env.ALONE_XP_MULTIPLIER || 1),
    focusModeRoleName: (env.FOCUS_MODE_ROLE_NAME || "Focus Mode").trim(),
    distractionRoleNames: hasDistractionRolesConfig
      ? distractionRoleNames
      : ["Normal", "General Access"],
  };

  if (!config.token) {
    throw new Error("Missing TOKEN in .env");
  }

  if (
    !Number.isFinite(config.codeforcesPollIntervalMinutes) ||
    config.codeforcesPollIntervalMinutes <= 0
  ) {
    config.codeforcesPollIntervalMinutes = 30;
  }

  if (
    !Number.isFinite(config.codeforcesReminderLeadMinutes) ||
    config.codeforcesReminderLeadMinutes <= 0
  ) {
    config.codeforcesReminderLeadMinutes = 180;
  }

  if (
    !Number.isFinite(config.qotdIntervalDays) ||
    config.qotdIntervalDays <= 0
  ) {
    config.qotdIntervalDays = 2;
  }

  if (
    !Number.isFinite(config.qotdQueuedIntervalDays) ||
    config.qotdQueuedIntervalDays <= 0
  ) {
    config.qotdQueuedIntervalDays = 1;
  }

  if (
    !Number.isFinite(config.factsIntervalDays) ||
    config.factsIntervalDays <= 0
  ) {
    config.factsIntervalDays = 7;
  }

  if (
    !Number.isFinite(config.riddleDelayMinutes) ||
    config.riddleDelayMinutes <= 0
  ) {
    config.riddleDelayMinutes = 60;
  }

  if (
    !Number.isFinite(config.focusMinimumSessionMinutes) ||
    config.focusMinimumSessionMinutes <= 0
  ) {
    config.focusMinimumSessionMinutes = 5;
  }

  if (
    !Number.isFinite(config.focusTaskCooldownMinutes) ||
    config.focusTaskCooldownMinutes <= 0
  ) {
    config.focusTaskCooldownMinutes = 10;
  }

  if (
    !Number.isFinite(config.focusMaxTasksPerSession) ||
    config.focusMaxTasksPerSession <= 0
  ) {
    config.focusMaxTasksPerSession = 5;
  }

  if (
    !Number.isFinite(config.focusTaskXpPerTask) ||
    config.focusTaskXpPerTask <= 0
  ) {
    config.focusTaskXpPerTask = 15;
  }

  if (
    !Number.isFinite(config.aloneXpMultiplier) ||
    config.aloneXpMultiplier < 0
  ) {
    config.aloneXpMultiplier = 1;
  }

  return config;
}

module.exports = {
  loadConfig,
};
