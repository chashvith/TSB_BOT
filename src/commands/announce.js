const {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an announcement to a selected channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Target channel")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Announcement message")
        .setRequired(true),
    ),

  async execute(interaction, { config }) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const hasRole = config.adminRoleId
      ? interaction.member?.roles?.cache?.has(config.adminRoleId)
      : false;
    const hasAdmin = interaction.memberPermissions?.has(
      PermissionsBitField.Flags.Administrator,
    );

    if (!hasRole && !hasAdmin) {
      await interaction.reply({
        content: "You are not allowed to use this command.",
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.options.getChannel("channel", true);
    const message = interaction.options.getString("message", true);

    if (!channel.isTextBased()) {
      await interaction.reply({
        content: "Please choose a text channel.",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Announcement!")
      .setDescription(message)
      .setColor(0x5865f2)
      .setFooter({
        text: `Announcement by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await channel.send({ embeds: [embed] });
    await interaction.reply({
      content: `Your announcement sent to <#${channel.id}>`,
      ephemeral: true,
    });
  },
};
