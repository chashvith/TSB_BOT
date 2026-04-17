const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

function buildAlertPanelMessage() {
  const embed = new EmbedBuilder()
    .setTitle("Study Reminder Hub")
    .setDescription(
      [
        "Plan your sessions and never miss focused study time.",
        "",
        "• Choose reminder time and days",
        "• Deliver privately in DM or in a chat channel",
        "• Add an optional title and quote",
      ].join("\n"),
    )
    .setColor(0x7c9cff)
    .setFooter({ text: "Tip: Keep one daily reminder for each study block." });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("alert:set")
      .setLabel("Create Reminder")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("alert:view")
      .setLabel("My Reminders")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("alert:delete")
      .setLabel("Delete Alert")
      .setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row] };
}

function buildAlertSetModal() {
  const modal = new ModalBuilder()
    .setCustomId("alert:set")
    .setTitle("Create Study Reminder");

  const hour = new TextInputBuilder()
    .setCustomId("hour")
    .setLabel("Hour (1-12)")
    .setPlaceholder("Example: 08")
    .setStyle(TextInputStyle.Short);
  const minute = new TextInputBuilder()
    .setCustomId("minute")
    .setLabel("Minute (0-59)")
    .setPlaceholder("Example: 30")
    .setStyle(TextInputStyle.Short);
  const ampm = new TextInputBuilder()
    .setCustomId("ampm")
    .setLabel("AM / PM")
    .setPlaceholder("AM")
    .setMaxLength(2)
    .setStyle(TextInputStyle.Short);
  const title = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Reminder title (optional)")
    .setPlaceholder("Physics revision")
    .setRequired(false)
    .setStyle(TextInputStyle.Short);
  const quote = new TextInputBuilder()
    .setCustomId("quote")
    .setLabel("Reminder quote (optional)")
    .setPlaceholder("You can do this. Stay focused.")
    .setRequired(false)
    .setStyle(TextInputStyle.Paragraph);

  modal.addComponents(
    new ActionRowBuilder().addComponents(hour),
    new ActionRowBuilder().addComponents(minute),
    new ActionRowBuilder().addComponents(ampm),
    new ActionRowBuilder().addComponents(title),
    new ActionRowBuilder().addComponents(quote),
  );

  return modal;
}

function buildDeliverySelectRow(selected = "CHAT") {
  const select = new StringSelectMenuBuilder()
    .setCustomId("alert:delivery")
    .setPlaceholder("Choose DM or chat")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions([
      {
        label: "DM",
        value: "DM",
        description: "Send the reminder in direct messages",
        default: selected === "DM",
      },
      {
        label: "CHAT",
        value: "CHAT",
        description: "Ping you in the alert channel",
        default: selected === "CHAT",
      },
    ]);

  return new ActionRowBuilder().addComponents(select);
}

function buildScheduleSelectRow(selected = "RECURRING") {
  const select = new StringSelectMenuBuilder()
    .setCustomId("alert:schedule")
    .setPlaceholder("Choose schedule type")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions([
      {
        label: "Recurring",
        value: "RECURRING",
        description: "Use weekday selection for repeating reminders",
        default: selected === "RECURRING",
      },
      {
        label: "Today (one-time)",
        value: "TODAY",
        description: "Trigger only once today",
        default: selected === "TODAY",
      },
      {
        label: "Tomorrow (one-time)",
        value: "TOMORROW",
        description: "Trigger only once tomorrow",
        default: selected === "TOMORROW",
      },
    ]);

  return new ActionRowBuilder().addComponents(select);
}

function buildDaySelectRow(selected = ["Daily"]) {
  const select = new StringSelectMenuBuilder()
    .setCustomId("alert:days")
    .setPlaceholder("Select days")
    .setMinValues(1)
    .setMaxValues(7)
    .addOptions(
      [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
        "Daily",
      ].map((day) => ({
        label: day,
        value: day,
        default: selected.includes(day),
      })),
    );

  return new ActionRowBuilder().addComponents(select);
}

function buildAlertActionRow() {
  const saveButton = new ButtonBuilder()
    .setCustomId("alert:save")
    .setLabel("Save Reminder")
    .setStyle(ButtonStyle.Success);

  const cancelButton = new ButtonBuilder()
    .setCustomId("alert:cancel")
    .setLabel("Cancel Setup")
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder().addComponents(saveButton, cancelButton);
}

function buildAlertSetupEmbed(tempData) {
  const scheduleLabel = tempData.targetDateKey
    ? `One-time (${tempData.targetDateKey})`
    : `Recurring (${tempData.days.join(", ")})`;

  const embed = new EmbedBuilder()
    .setTitle("Review Your Reminder")
    .setDescription(
      "Use the controls below to finalize delivery, days, and schedule.",
    )
    .setColor(0x57f287)
    .addFields(
      {
        name: "Title",
        value: tempData.title || "No title",
        inline: true,
      },
      {
        name: "Time",
        value: `${tempData.hour}:${tempData.minute} ${tempData.ampm}`,
        inline: true,
      },
      {
        name: "Delivery",
        value: tempData.delivery || "DM",
        inline: true,
      },
      {
        name: "Schedule",
        value: scheduleLabel,
        inline: false,
      },
    );

  if (tempData.quote) {
    embed.addFields({
      name: "Quote",
      value: `"${tempData.quote}"`,
      inline: false,
    });
  }

  return embed;
}

function normalizeAlertModalInput(interaction) {
  const parsedHour = Number(
    interaction.fields.getTextInputValue("hour").trim(),
  );
  const parsedMinute = Number(
    interaction.fields.getTextInputValue("minute").trim(),
  );
  const quote = interaction.fields.getTextInputValue("quote").trim();
  const rawAmPm = interaction.fields
    .getTextInputValue("ampm")
    .trim()
    .toUpperCase();

  if (!Number.isInteger(parsedHour) || parsedHour < 1 || parsedHour > 12) {
    throw new Error("Hour must be between 1 and 12.");
  }

  if (
    !Number.isInteger(parsedMinute) ||
    parsedMinute < 0 ||
    parsedMinute > 59
  ) {
    throw new Error("Minute must be between 0 and 59.");
  }

  if (rawAmPm !== "AM" && rawAmPm !== "PM") {
    throw new Error("AM / PM must be AM or PM.");
  }

  return {
    hour: String(parsedHour).padStart(2, "0"),
    minute: String(parsedMinute).padStart(2, "0"),
    ampm: rawAmPm,
    title: interaction.fields.getTextInputValue("title").trim() || null,
    targetDateKey: null,
    quote: quote || null,
  };
}

module.exports = {
  buildAlertPanelMessage,
  buildAlertSetModal,
  buildDeliverySelectRow,
  buildScheduleSelectRow,
  buildDaySelectRow,
  buildAlertActionRow,
  buildAlertSetupEmbed,
  normalizeAlertModalInput,
};
