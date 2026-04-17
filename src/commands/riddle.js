const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("riddle")
    .setDescription("Fetch a fresh random riddle"),

  async execute(interaction, { riddleService }) {
    const riddle = await riddleService.fetchRiddle();
    const embed = riddleService.buildRiddleEmbed(riddle);

    await interaction.reply({
      embeds: [embed],
    });
  },
};
