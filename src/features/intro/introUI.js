const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

function buildIntroPanelMessage() {
  const embed = new EmbedBuilder()
    .setTitle("👋 Introduce Yourself")
    .setDescription(
      "Click the button below and introduce yourself to the study community!",
    )
    .setColor(0x57f287);

  const button = new ButtonBuilder()
    .setCustomId("intro:open")
    .setLabel("INTRODUCE")
    .setEmoji("👋")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  return { embeds: [embed], components: [row] };
}

function buildIntroModal() {
  const modal = new ModalBuilder()
    .setCustomId("intro:submit")
    .setTitle("Introduce Yourself");

  const fields = [
    new TextInputBuilder()
      .setCustomId("name")
      .setLabel("Name / Nickname")
      .setStyle(TextInputStyle.Short),
    new TextInputBuilder()
      .setCustomId("age")
      .setLabel("Age / Pronouns")
      .setStyle(TextInputStyle.Short),
    new TextInputBuilder()
      .setCustomId("study")
      .setLabel("What are you studying / Which year")
      .setStyle(TextInputStyle.Short),
    new TextInputBuilder()
      .setCustomId("subjects")
      .setLabel("Subjects or skills you're focusing on")
      .setStyle(TextInputStyle.Short),
    new TextInputBuilder()
      .setCustomId("goals")
      .setLabel("Your study goals / preferred study times")
      .setStyle(TextInputStyle.Paragraph),
  ];

  for (const field of fields) {
    modal.addComponents(new ActionRowBuilder().addComponents(field));
  }

  return modal;
}

function buildIntroSubmissionEmbed(interaction) {
  return new EmbedBuilder()
    .setTitle("📚 New Study Buddy Introduction")
    .setColor(0x5865f2)
    .setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      {
        name: "Name/Nickname",
        value: interaction.fields.getTextInputValue("name"),
        inline: false,
      },
      {
        name: "Age / Pronouns",
        value: interaction.fields.getTextInputValue("age"),
        inline: false,
      },
      {
        name: "Study / Year",
        value: interaction.fields.getTextInputValue("study"),
        inline: false,
      },
      {
        name: "Subjects / Skills",
        value: interaction.fields.getTextInputValue("subjects"),
        inline: false,
      },
      {
        name: "Study Goals",
        value: interaction.fields.getTextInputValue("goals"),
        inline: false,
      },
    );
}

module.exports = {
  buildIntroPanelMessage,
  buildIntroModal,
  buildIntroSubmissionEmbed,
};
