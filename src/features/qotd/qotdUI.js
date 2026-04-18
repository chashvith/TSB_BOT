const { EmbedBuilder } = require("discord.js");

function buildQotdEmbed(questionText, { dateKey, requestedBy = null } = {}) {
  return new EmbedBuilder()
    .setTitle("Question of the Day")
    .setDescription(questionText)
    .setColor(0x00b894)
    .addFields(
      {
        name: "How to answer",
        value: "Reply inside the thread that the bot creates below.",
        inline: false,
      },
      {
        name: "Question asked by",
        value: requestedBy ? requestedBy : "Default queue",
        inline: true,
      },
    )
    .setFooter({ text: `QOTD for ${dateKey}` })
    .setTimestamp();
}

function buildQotdThreadPrompt(questionText) {
  void questionText;
  return [
    "Use this thread to post your answer.",
    "Reply in this thread with your answer.",
    "You can submit your own QOTD using `/qotd suggest`.",
  ].join("\n");
}

module.exports = {
  buildQotdEmbed,
  buildQotdThreadPrompt,
};
