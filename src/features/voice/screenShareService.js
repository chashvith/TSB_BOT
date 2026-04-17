class ScreenShareService {
  constructor({ logger, config }) {
    this.logger = logger;
    this.config = config;
    this.activeTimers = new Map();

    const vcIds = Array.isArray(this.config.studyVcIds)
      ? this.config.studyVcIds
      : this.config.studyVcId
        ? [this.config.studyVcId]
        : [];

    this.studyVcIdSet = new Set(vcIds);
  }

  cancelTimer(memberId) {
    const token = this.activeTimers.get(memberId);
    if (token) {
      token.cancelled = true;
      this.activeTimers.delete(memberId);
    }
  }

  async handleVoiceStateUpdate(client, oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member) {
      return;
    }

    const previousChannelId = oldState.channelId;
    const nextChannelId = newState.channelId;
    const wasInStudyVc = this.isStudyVc(previousChannelId);
    const isInStudyVc = this.isStudyVc(nextChannelId);

    if (previousChannelId !== nextChannelId && isInStudyVc) {
      this.cancelTimer(member.id);

      const token = { cancelled: false };
      this.activeTimers.set(member.id, token);

      await this.sendAlert(
        client,
        `${member} 👋 Welcome to the Screen Share VC! Please start screen sharing within **2 minutes**.`,
      );
      this.runTimer(client, member, token);
    }

    if (wasInStudyVc && !isInStudyVc) {
      this.cancelTimer(member.id);
    }
  }

  isStudyVc(channelId) {
    if (!channelId) {
      return false;
    }

    return this.studyVcIdSet.has(channelId);
  }

  async sendAlert(client, message) {
    if (!this.config.alertChannelId) {
      return;
    }

    try {
      const channel = await client.channels.fetch(this.config.alertChannelId);
      if (channel && channel.isTextBased()) {
        await channel.send(message);
      }
    } catch (error) {
      this.logger.error("Failed to send screen share alert", error);
    }
  }

  async runTimer(client, member, token) {
    try {
      await this.sleep(60_000);
      if (token.cancelled) {
        return;
      }

      const memberAfter60 = await this.refreshMember(member);
      if (!this.requiresScreenShare(memberAfter60)) {
        return;
      }

      await this.sendAlert(
        client,
        `${member} ⏳ 1 minute remaining to start screen sharing.`,
      );

      await this.sleep(45_000);
      if (token.cancelled) {
        return;
      }

      const memberAfter105 = await this.refreshMember(member);
      if (!this.requiresScreenShare(memberAfter105)) {
        return;
      }

      await this.sendAlert(
        client,
        `${member} ⚠️ 15 seconds left to present your screen.`,
      );

      await this.sleep(15_000);
      if (token.cancelled) {
        return;
      }

      const memberAfter120 = await this.refreshMember(member);
      if (!this.requiresScreenShare(memberAfter120)) {
        return;
      }

      try {
        await memberAfter120.voice.setChannel(null);
      } catch (error) {
        this.logger.error("Failed to remove member from voice channel", error);
      }

      await this.sendAlert(
        client,
        `${member} ❌ Removed for not presenting screen.`,
      );
    } finally {
      this.activeTimers.delete(member.id);
    }
  }

  async refreshMember(member) {
    try {
      return await member.guild.members.fetch(member.id);
    } catch (error) {
      this.logger.error("Failed to refresh guild member", error);
      return null;
    }
  }

  requiresScreenShare(member) {
    if (!member) {
      return false;
    }

    return this.isStudyVc(member.voice.channelId) && !member.voice.selfStream;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = {
  ScreenShareService,
};
