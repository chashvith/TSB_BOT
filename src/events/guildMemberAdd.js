const { EmbedBuilder } = require("discord.js");
const { fetchTextChannel } = require("../utils/discord");

module.exports = (client, deps) => {
  const { logger, config } = deps;

  client.on("guildMemberAdd", async (member) => {
    const channel = await fetchTextChannel(
      client,
      config.welcomeChannelId,
      logger,
      "welcome channel",
    );
    if (!channel) {
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Welcome to the Server!")
      .setDescription(`Hello ${member}, welcome to **${member.guild.name}**!`)
      .setColor(0x3498db)
      .setThumbnail(member.displayAvatarURL({ size: 256 }))
      .setFooter({ text: `Member Count: ${member.guild.memberCount}` });

    if (member.guild.iconURL()) {
      embed.setAuthor({
        name: member.guild.name,
        iconURL: member.guild.iconURL(),
      });
    }

    embed.addFields({
      name: "Get Started",
      value:
        "• Read the rules\n• Introduce yourself\n• Join Study VC\n• Make Your Journal\n• Start Studying",
      inline: false,
    });

    try {
      await channel.send({ embeds: [embed] });
    } catch (error) {
      logger.error("Failed to send welcome embed", error);
    }
  });
};
