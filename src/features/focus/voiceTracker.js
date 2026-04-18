const { ChannelType } = require("discord.js");

class FocusVoiceTracker {
  constructor({ logger, config, sessionManager }) {
    this.logger = logger;
    this.config = config;
    this.sessionManager = sessionManager;
    this.activeVoiceState = new Map();
    this.joinToCreateByGuild = new Map();
    this.temporaryRooms = new Set();
  }

  getStateKey(guildId, userId) {
    return `${String(guildId)}:${String(userId)}`;
  }

  isFocusChannel(channel) {
    if (!channel || !this.config.focusCategoryId) {
      return false;
    }

    return String(channel.parentId) === String(this.config.focusCategoryId);
  }

  buildVoiceSnapshot(voiceState) {
    const channel = voiceState?.channel || null;
    const inVoice = Boolean(channel);
    const nonBotMembers = inVoice
      ? channel.members.filter((member) => !member.user?.bot).size
      : 0;

    return {
      startTime: Date.now(),
      inVoice,
      channelId: inVoice ? String(channel.id) : null,
      isFocusVC: this.isFocusChannel(channel),
      isStreaming: Boolean(voiceState?.selfStream),
      isAlone: inVoice ? nonBotMembers <= 1 : false,
    };
  }

  getCurrentSnapshot(guildId, userId) {
    return this.activeVoiceState.get(this.getStateKey(guildId, userId)) || null;
  }

  async ensureJoinToCreateChannels(client) {
    if (!this.config.focusCategoryId) {
      return;
    }

    for (const guild of client.guilds.cache.values()) {
      const category = guild.channels.cache.get(this.config.focusCategoryId);
      if (!category || category.type !== ChannelType.GuildCategory) {
        continue;
      }

      let joinChannel = null;
      if (this.config.focusJoinToCreateChannelId) {
        joinChannel =
          guild.channels.cache.get(this.config.focusJoinToCreateChannelId) ||
          null;
      }

      if (!joinChannel) {
        joinChannel = guild.channels.cache.find(
          (channel) =>
            channel.type === ChannelType.GuildVoice &&
            channel.parentId === category.id &&
            channel.name === this.config.focusJoinToCreateChannelName,
        );
      }

      if (!joinChannel) {
        joinChannel = await guild.channels.create({
          name: this.config.focusJoinToCreateChannelName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          reason: "Auto-create focus join-to-create channel",
        });
      }

      this.joinToCreateByGuild.set(String(guild.id), String(joinChannel.id));
      this.logger.info("Focus join-to-create channel ready", {
        guildId: guild.id,
        channelId: joinChannel.id,
      });
    }
  }

  isJoinToCreateChannel(guildId, channelId) {
    if (!guildId || !channelId) {
      return false;
    }

    return (
      String(this.joinToCreateByGuild.get(String(guildId))) ===
      String(channelId)
    );
  }

  async handleVoiceStateUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user?.bot) {
      return;
    }

    const guildId = String(member.guild.id);
    const userId = String(member.id);
    const key = this.getStateKey(guildId, userId);

    const previousState = this.activeVoiceState.get(key) || null;
    const nextSnapshot = this.buildVoiceSnapshot(newState);

    const channelChanged = oldState.channelId !== newState.channelId;
    const streamChanged =
      Boolean(oldState.selfStream) !== Boolean(newState.selfStream);
    const connectedChanged =
      Boolean(oldState.channelId) !== Boolean(newState.channelId);

    if (channelChanged || streamChanged || connectedChanged) {
      this.sessionManager.updateVoiceState(guildId, userId, nextSnapshot);
      if (nextSnapshot.inVoice) {
        this.activeVoiceState.set(key, nextSnapshot);
      } else {
        this.activeVoiceState.delete(key);
      }
    } else {
      if (nextSnapshot.inVoice && previousState) {
        this.activeVoiceState.set(key, {
          ...nextSnapshot,
          startTime: previousState.startTime,
        });
      } else if (nextSnapshot.inVoice) {
        this.activeVoiceState.set(key, nextSnapshot);
      } else {
        this.activeVoiceState.delete(key);
      }
    }

    await this.handleJoinToCreate(member, newState);
    await this.cleanupTempRoom(oldState);
  }

  async handleJoinToCreate(member, newState) {
    const channelId = newState.channelId;
    if (!channelId) {
      return;
    }

    if (!this.isJoinToCreateChannel(member.guild.id, channelId)) {
      return;
    }

    const channel = await member.guild.channels.create({
      name: `${this.config.focusRoomNamePrefix} - ${member.user.username}`,
      type: ChannelType.GuildVoice,
      parent: this.config.focusCategoryId,
      reason: "Temporary focus room",
    });

    this.temporaryRooms.add(String(channel.id));

    await member.voice.setChannel(channel).catch((error) => {
      this.logger.error("Failed moving user to temporary focus room", {
        guildId: member.guild.id,
        userId: member.id,
        channelId: channel.id,
        error: error.message,
      });
    });
  }

  async cleanupTempRoom(oldState) {
    const oldChannel = oldState.channel;
    if (!oldChannel) {
      return;
    }

    if (!this.temporaryRooms.has(String(oldChannel.id))) {
      return;
    }

    const remainingMembers = oldChannel.members.filter(
      (member) => !member.user?.bot,
    ).size;

    if (remainingMembers > 0) {
      return;
    }

    await oldChannel.delete("Temporary focus room is empty").catch((error) => {
      this.logger.error("Failed deleting empty temporary focus room", {
        channelId: oldChannel.id,
        error: error.message,
      });
    });

    this.temporaryRooms.delete(String(oldChannel.id));
  }
}

module.exports = {
  FocusVoiceTracker,
};
