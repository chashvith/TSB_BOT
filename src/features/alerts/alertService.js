const { getCurrentTimeParts } = require("../../utils/time");
const { EmbedBuilder } = require("discord.js");

class AlertService {
  constructor({ storage, logger }) {
    this.storage = storage;
    this.logger = logger;

    const loadedAlerts = this.storage.loadAlerts(this.logger);
    this.alerts = Array.isArray(loadedAlerts)
      ? loadedAlerts.map((alert) => {
          const normalized = this.normalizeAlert(alert);
          if (!normalized.id) {
            normalized.id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          }
          return normalized;
        })
      : [];

    this.storage.saveAlerts(this.alerts, this.logger);
    this.tempAlertData = new Map();
    this.triggeredAlerts = new Set();
    this.currentMinuteBucket = null;
    this.intervalHandle = null;
  }

  setTempData(userId, tempData) {
    this.tempAlertData.set(userId, tempData);
  }

  getTempData(userId) {
    return this.tempAlertData.get(userId);
  }

  clearTempData(userId) {
    this.tempAlertData.delete(userId);
  }

  addAlert(alert) {
    const normalized = this.normalizeAlert(alert);
    if (!normalized.id) {
      normalized.id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    this.alerts.push(normalized);
    this.storage.saveAlerts(this.alerts, this.logger);
  }

  getAlertsByUser(userId) {
    const normalizedUserId = String(userId);

    return this.alerts
      .filter((alert) => String(alert.userId) === normalizedUserId)
      .map((alert) => this.normalizeAlert(alert));
  }

  deleteAlertsByUser(userId) {
    const normalizedUserId = String(userId);
    const before = this.alerts.length;
    this.alerts = this.alerts.filter(
      (alert) => String(alert.userId) !== normalizedUserId,
    );
    this.storage.saveAlerts(this.alerts, this.logger);
    return before - this.alerts.length;
  }

  async checkAndDispatch(client) {
    const now = new Date();
    const parts = getCurrentTimeParts(now);
    const minuteBucket = `${parts.dateKey}-${parts.hour}-${parts.minute}-${parts.ampm}`;

    if (this.currentMinuteBucket !== minuteBucket) {
      this.triggeredAlerts.clear();
      this.currentMinuteBucket = minuteBucket;
    }

    for (let index = this.alerts.length - 1; index >= 0; index -= 1) {
      const originalAlert = this.alerts[index];
      const alert = this.normalizeAlert(originalAlert);

      // Auto-clean one-time reminders that are already in the past.
      if (alert.targetDateKey && alert.targetDateKey < parts.dateKey) {
        this.alerts.splice(index, 1);
        this.storage.saveAlerts(this.alerts, this.logger);
        continue;
      }

      const oneTimeMatches = alert.targetDateKey
        ? alert.targetDateKey === parts.dateKey
        : null;

      if (alert.targetDateKey && !oneTimeMatches) {
        continue;
      }

      if (!alert.targetDateKey) {
        const dayMatches =
          alert.days.includes("Daily") || alert.days.includes(parts.day);
        if (!dayMatches) {
          continue;
        }
      }

      if (
        alert.hour !== parts.hour ||
        alert.minute !== parts.minute ||
        alert.ampm !== parts.ampm
      ) {
        continue;
      }

      const key = `${alert.id || `idx_${index}`}_${parts.dateKey}_${parts.hour}_${parts.minute}_${parts.ampm}`;
      if (this.triggeredAlerts.has(key)) {
        continue;
      }

      this.triggeredAlerts.add(key);

      await this.sendReminder(client, alert);

      if (alert.targetDateKey) {
        this.alerts.splice(index, 1);
        this.storage.saveAlerts(this.alerts, this.logger);
      }
    }
  }

  normalizeAlert(alert) {
    const parsedHour = Number(alert.hour);
    const parsedMinute = Number(alert.minute);
    const normalizedAmPm = String(alert.ampm || "")
      .trim()
      .toUpperCase();
    const hasValidAmPm = normalizedAmPm === "AM" || normalizedAmPm === "PM";

    let hour12 = Number.isInteger(parsedHour) ? parsedHour : 1;
    let ampm = hasValidAmPm ? normalizedAmPm : "AM";

    // Handle legacy records that stored 24-hour time values.
    // Preserve explicitly selected AM/PM for normal 1-12 inputs.
    if (hour12 === 0 || hour12 > 12) {
      ampm = hour12 >= 12 ? "PM" : "AM";
      hour12 = hour12 % 12 || 12;
    }

    if (hour12 < 1 || hour12 > 12) {
      hour12 = 1;
    }

    const minute =
      Number.isInteger(parsedMinute) && parsedMinute >= 0 && parsedMinute <= 59
        ? parsedMinute
        : 0;

    const validDaySet = new Set([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
      "Daily",
    ]);
    const normalizedDays = Array.isArray(alert.days)
      ? alert.days
          .map((day) => {
            const text = String(day || "").trim();
            if (!text) {
              return null;
            }

            const lower = text.toLowerCase();
            if (lower === "daily") {
              return "Daily";
            }

            return `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}`;
          })
          .filter((day) => day && validDaySet.has(day))
      : [];

    return {
      ...alert,
      id: alert.id || null,
      userId: String(alert.userId || ""),
      hour: String(hour12).padStart(2, "0"),
      minute: String(minute).padStart(2, "0"),
      ampm,
      scheduleType: alert.targetDateKey ? "ONE_TIME" : "RECURRING",
      delivery:
        (alert.delivery || "CHAT").toUpperCase() === "CHAT" ? "CHAT" : "DM",
      targetDateKey: alert.targetDateKey || null,
      quote: alert.quote || null,
      days: normalizedDays.length ? normalizedDays : ["Daily"],
    };
  }

  buildReminderEmbed(alert, userTag) {
    const embed = new EmbedBuilder()
      .setTitle(alert.title ? `⏰ ${alert.title}` : "⏰ Study Reminder")
      .setDescription(
        "It is study time. Open your plan and start a focused session.",
      )
      .setColor(0x57f287)
      .addFields(
        {
          name: "Schedule",
          value: alert.targetDateKey
            ? `${alert.hour}:${alert.minute} ${alert.ampm} on ${alert.targetDateKey}`
            : `${alert.hour}:${alert.minute} ${alert.ampm} (${alert.days.join(", ")})`,
          inline: false,
        },
        {
          name: "Delivery",
          value: alert.delivery,
          inline: true,
        },
      )
      .setFooter({ text: `Reminder for ${userTag}` });

    if (alert.quote) {
      embed.addFields({
        name: "Quote",
        value: `"${alert.quote}"`,
        inline: false,
      });
    }

    return embed;
  }

  async sendReminder(client, alert) {
    try {
      if (alert.delivery === "CHAT") {
        const user = await client.users.fetch(alert.userId).catch(() => null);
        const embed = this.buildReminderEmbed(
          alert,
          user ? user.tag || user.username : String(alert.userId),
        );
        const channelId =
          client.config?.alertChannelId || client.config?.alertPanelChannelId;
        if (!channelId) {
          this.logger.warn(
            "No chat channel configured for CHAT alert, falling back to DM",
            {
              userId: alert.userId,
            },
          );
          await user.send({ embeds: [embed] });
          return;
        }

        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
          this.logger.warn(
            "Configured chat alert channel is not text based, falling back to DM",
            {
              userId: alert.userId,
              channelId,
            },
          );
          await user.send({ embeds: [embed] });
          return;
        }

        await channel.send({
          content: `<@${alert.userId}>`,
          embeds: [embed],
        });
        return;
      }

      const user = await client.users.fetch(alert.userId);
      const embed = this.buildReminderEmbed(alert, user.tag || user.username);

      await user.send({ embeds: [embed] });
    } catch (error) {
      this.logger.error("Failed to deliver reminder", {
        userId: alert.userId,
        delivery: alert.delivery,
        error: error.message,
      });

      if (alert.delivery === "DM") {
        await this.sendChatFallback(client, alert, error);
      } else {
        await this.sendDmFallback(client, alert, error);
      }
    }
  }

  async sendDmFallback(client, alert, chatError) {
    try {
      const user = await client.users.fetch(alert.userId);
      const embed = this.buildReminderEmbed(alert, user.tag || user.username);

      await user.send({
        content:
          "Your chat reminder could not be posted in the server, so I sent it here instead.",
        embeds: [embed],
      });
    } catch (fallbackError) {
      this.logger.error("Failed to deliver reminder DM fallback", {
        userId: alert.userId,
        originalError: chatError.message,
        fallbackError: fallbackError.message,
      });
    }
  }

  async sendChatFallback(client, alert, dmError) {
    const channelId =
      client.config?.alertChannelId || client.config?.alertPanelChannelId;

    if (!channelId) {
      this.logger.warn(
        "No chat fallback channel configured for failed DM reminder",
        {
          userId: alert.userId,
          error: dmError.message,
        },
      );
      return;
    }

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        this.logger.warn("Chat fallback channel is not text based", {
          userId: alert.userId,
          channelId,
        });
        return;
      }

      const user = await client.users.fetch(alert.userId).catch(() => null);
      const embed = this.buildReminderEmbed(
        alert,
        user ? user.tag || user.username : String(alert.userId),
      );

      await channel.send({
        content: `<@${alert.userId}> Your DM reminder could not be delivered, so I posted it here.`,
        embeds: [embed],
      });
    } catch (fallbackError) {
      this.logger.error("Failed to deliver reminder chat fallback", {
        userId: alert.userId,
        channelId,
        error: fallbackError.message,
      });
    }
  }

  start(client) {
    if (this.intervalHandle) {
      return;
    }

    this.intervalHandle = setInterval(() => {
      this.checkAndDispatch(client).catch((error) => {
        this.logger.error("Alert check failed", error);
      });
    }, 5000);

    this.intervalHandle.unref();
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
  AlertService,
};
