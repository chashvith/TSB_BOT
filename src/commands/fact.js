const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fact")
    .setDescription("Fetch a random fact now"),

  async execute(interaction, { factsService }) {
    const fact = await factsService.fetchRandomFact();

    const embed = new EmbedBuilder()
      .setTitle("Random Fact")
      .setDescription(fact)
      .setColor(0x1abc9c)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
