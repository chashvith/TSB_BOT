const { PermissionsBitField } = require("discord.js");

class FocusModeService {
  constructor({ logger, config }) {
    this.logger = logger;
    this.config = config;
    this.removedRoleCache = new Map();

    const vcIds = Array.isArray(this.config.studyVcIds)
      ? this.config.studyVcIds
      : this.config.studyVcId
        ? [this.config.studyVcId]
        : [];

    this.studyVcIdSet = new Set(vcIds);
  }

  async handleVoiceStateUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member) {
      return;
    }

    const previousChannelId = oldState.channelId;
    const nextChannelId = newState.channelId;
    const wasInStudyVc = this.isStudyVc(previousChannelId);
    const isInStudyVc = this.isStudyVc(nextChannelId);

    if (!wasInStudyVc && isInStudyVc) {
      await this.enableFocusMode(member);
      return;
    }

    if (wasInStudyVc && !isInStudyVc) {
      await this.disableFocusMode(member);
    }
  }

  isStudyVc(channelId) {
    if (!channelId) {
      return false;
    }

    return this.studyVcIdSet.has(channelId);
  }

  getMemberKey(member) {
    return `${member.guild.id}:${member.id}`;
  }

  getRoleByName(guild, roleName) {
    if (!roleName) {
      return null;
    }

    const normalized = String(roleName).trim();
    const mentionMatch = normalized.match(/^<@&(\d+)>$/);
    const roleId = mentionMatch ? mentionMatch[1] : normalized;

    if (/^\d+$/.test(roleId)) {
      const byId = guild.roles.cache.get(roleId);
      if (byId) {
        return byId;
      }
    }

    return guild.roles.cache.find(
      (role) => role.name.toLowerCase() === normalized.toLowerCase(),
    );
  }

  canManageRole(member, role) {
    const botMember = member.guild.members.me;
    if (!botMember) {
      this.logger.warn("Bot member not found while checking role hierarchy", {
        guildId: member.guild.id,
      });
      return false;
    }

    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      this.logger.warn("Bot lacks ManageRoles permission", {
        guildId: member.guild.id,
      });
      return false;
    }

    if (!member.manageable) {
      this.logger.warn("Target member is not manageable", {
        guildId: member.guild.id,
        userId: member.id,
      });
      return false;
    }

    if (role.position >= botMember.roles.highest.position) {
      this.logger.warn("Role is above bot in hierarchy", {
        guildId: member.guild.id,
        roleId: role.id,
        roleName: role.name,
      });
      return false;
    }

    return true;
  }

  async enableFocusMode(member) {
    const focusRoleName = this.config.focusModeRoleName;
    const distractionRoleNames = this.config.distractionRoleNames || [];

    const focusRole = this.getRoleByName(member.guild, focusRoleName);
    if (!focusRole) {
      this.logger.warn("Focus role not found", {
        guildId: member.guild.id,
        roleName: focusRoleName,
      });
      return;
    }

    const cacheKey = this.getMemberKey(member);
    if (!this.removedRoleCache.has(cacheKey)) {
      this.removedRoleCache.set(cacheKey, []);
    }

    const removedRoles = this.removedRoleCache.get(cacheKey);

    for (const roleName of distractionRoleNames) {
      const role = this.getRoleByName(member.guild, roleName);
      if (!role) {
        this.logger.warn("Distraction role not found", {
          guildId: member.guild.id,
          roleName,
        });
        continue;
      }

      if (!member.roles.cache.has(role.id)) {
        continue;
      }

      if (!this.canManageRole(member, role)) {
        continue;
      }

      try {
        await member.roles.remove(
          role,
          "Entering study VC - enable Focus Mode",
        );
        if (!removedRoles.includes(role.id)) {
          removedRoles.push(role.id);
        }
      } catch (error) {
        this.logger.error("Failed to remove distraction role", {
          guildId: member.guild.id,
          userId: member.id,
          roleId: role.id,
          roleName: role.name,
          error: error.message,
        });
      }
    }

    if (member.roles.cache.has(focusRole.id)) {
      return;
    }

    if (!this.canManageRole(member, focusRole)) {
      return;
    }

    try {
      await member.roles.add(
        focusRole,
        "Entering study VC - enable Focus Mode",
      );
    } catch (error) {
      this.logger.error("Failed to add focus role", {
        guildId: member.guild.id,
        userId: member.id,
        roleId: focusRole.id,
        roleName: focusRole.name,
        error: error.message,
      });
    }
  }

  async disableFocusMode(member) {
    const cacheKey = this.getMemberKey(member);
    const removedRoleIds = this.removedRoleCache.get(cacheKey) || [];
    const focusRole = this.getRoleByName(
      member.guild,
      this.config.focusModeRoleName,
    );

    if (focusRole && member.roles.cache.has(focusRole.id)) {
      if (this.canManageRole(member, focusRole)) {
        try {
          await member.roles.remove(
            focusRole,
            "Left study VC - disable Focus Mode",
          );
        } catch (error) {
          this.logger.error("Failed to remove focus role", {
            guildId: member.guild.id,
            userId: member.id,
            roleId: focusRole.id,
            roleName: focusRole.name,
            error: error.message,
          });
        }
      }
    }

    for (const roleId of removedRoleIds) {
      const role = member.guild.roles.cache.get(roleId);
      if (!role) {
        this.logger.warn("Skipped restoring role because it no longer exists", {
          guildId: member.guild.id,
          roleId,
          userId: member.id,
        });
        continue;
      }

      if (member.roles.cache.has(role.id)) {
        continue;
      }

      if (!this.canManageRole(member, role)) {
        continue;
      }

      try {
        await member.roles.add(role, "Left study VC - restore previous role");
      } catch (error) {
        this.logger.error("Failed to restore role", {
          guildId: member.guild.id,
          userId: member.id,
          roleId: role.id,
          roleName: role.name,
          error: error.message,
        });
      }
    }

    this.removedRoleCache.delete(cacheKey);
  }
}

module.exports = {
  FocusModeService,
};
