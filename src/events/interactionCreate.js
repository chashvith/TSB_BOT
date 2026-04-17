const { fetchTextChannel } = require("../utils/discord");
const {
  buildAlertActionRow,
  buildAlertSetupEmbed,
  buildAlertSetModal,
  buildDeliverySelectRow,
  buildScheduleSelectRow,
  buildDaySelectRow,
  normalizeAlertModalInput,
} = require("../features/alerts/alertUI");
const {
  buildTasksEmbed,
  buildTaskSelectRow,
  buildTaskActionRows,
  buildAddTaskModal,
} = require("../features/todo/todoUI");
const {
  buildIntroModal,
  buildIntroSubmissionEmbed,
} = require("../features/intro/introUI");

module.exports = (client, deps) => {
  const {
    logger,
    commands,
    alertService,
    config,
    todoService,
    leaderboardService,
    qotdService,
    factsService,
    riddleService,
    buddyService,
    quizDuelService,
  } = deps;

  function getDateKey(offsetDays = 0) {
    const now = new Date();
    now.setDate(now.getDate() + offsetDays);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        if (!command) {
          await interaction.reply({
            content: "Unknown command.",
            ephemeral: true,
          });
          return;
        }

        await command.execute(interaction, {
          config,
          logger,
          alertService,
          todoService,
          leaderboardService,
          qotdService,
          factsService,
          riddleService,
          buddyService,
          quizDuelService,
        });
        return;
      }

      if (interaction.isButton()) {
        if (interaction.customId === "intro:open") {
          await interaction.showModal(buildIntroModal());
          return;
        }

        if (
          interaction.customId === "todo:add-open" ||
          interaction.customId === "todo:complete-selected" ||
          interaction.customId === "todo:remove-selected" ||
          interaction.customId === "todo:refresh"
        ) {
          if (interaction.customId === "todo:add-open") {
            await interaction.showModal(buildAddTaskModal());
            return;
          }

          const tasks = todoService.getTasksByUser(interaction.user.id);
          const selectedTaskId = todoService.getSelectedTask(
            interaction.user.id,
          );

          if (interaction.customId === "todo:refresh") {
            const embed = buildTasksEmbed(
              interaction.user.username,
              tasks,
              selectedTaskId,
            );
            const components = tasks.length
              ? [
                  buildTaskSelectRow(tasks, selectedTaskId),
                  ...buildTaskActionRows(selectedTaskId),
                ]
              : [];

            await interaction.update({ embeds: [embed], components });
            return;
          }

          if (!selectedTaskId) {
            await interaction.reply({
              content: "Pick a task from the dropdown first.",
              ephemeral: true,
            });
            return;
          }

          const task = todoService.getTaskByUserAndId(
            interaction.user.id,
            selectedTaskId,
          );

          if (!task) {
            todoService.clearSelectedTask(interaction.user.id);
            await interaction.reply({
              content: "That selected task no longer exists. Refresh the list.",
              ephemeral: true,
            });
            return;
          }

          if (interaction.customId === "todo:complete-selected") {
            const result = todoService.completeTask(
              interaction.user.id,
              selectedTaskId,
            );

            if (!result.ok) {
              await interaction.reply({
                content: "That task is already completed or invalid.",
                ephemeral: true,
              });
              return;
            }

            todoService.clearSelectedTask(interaction.user.id);

            const refreshedTasks = todoService.getTasksByUser(
              interaction.user.id,
            );
            const embed = buildTasksEmbed(
              interaction.user.username,
              refreshedTasks,
            );
            const components = refreshedTasks.length
              ? [buildTaskSelectRow(refreshedTasks), ...buildTaskActionRows()]
              : [];

            await interaction.update({ embeds: [embed], components });
            return;
          }

          if (interaction.customId === "todo:remove-selected") {
            const result = todoService.removeTask(
              interaction.user.id,
              selectedTaskId,
            );

            if (!result.ok) {
              await interaction.reply({
                content: "Could not remove that task.",
                ephemeral: true,
              });
              return;
            }

            todoService.clearSelectedTask(interaction.user.id);

            const refreshedTasks = todoService.getTasksByUser(
              interaction.user.id,
            );
            const embed = buildTasksEmbed(
              interaction.user.username,
              refreshedTasks,
            );
            const components = refreshedTasks.length
              ? [buildTaskSelectRow(refreshedTasks), ...buildTaskActionRows()]
              : [];

            await interaction.update({ embeds: [embed], components });
            return;
          }
        }

        if (interaction.customId === "alert:set") {
          await interaction.showModal(buildAlertSetModal());
          return;
        }

        if (interaction.customId === "alert:view") {
          const userAlerts = alertService.getAlertsByUser(interaction.user.id);
          if (!userAlerts.length) {
            await interaction.reply({
              content: "You have no saved reminders yet.",
              ephemeral: true,
            });
            return;
          }

          const message = [
            "Your Reminders:",
            "",
            ...userAlerts.map(
              (alert) =>
                `• Study reminder — ${alert.hour}:${alert.minute} ${alert.ampm} | ${alert.delivery} | ${alert.targetDateKey ? `One-time on ${alert.targetDateKey}` : alert.days.join(", ")}${alert.quote ? ` | \"${alert.quote}\"` : ""}`,
            ),
          ].join("\n");

          await interaction.reply({ content: message, ephemeral: true });
          return;
        }

        if (interaction.customId === "alert:delete") {
          const deletedCount = alertService.deleteAlertsByUser(
            interaction.user.id,
          );

          if (!deletedCount) {
            await interaction.reply({
              content: "No alerts to delete.",
              ephemeral: true,
            });
            return;
          }

          await interaction.reply({
            content: "Alerts deleted.",
            ephemeral: true,
          });
          return;
        }

        if (interaction.customId === "alert:save") {
          const tempData = alertService.getTempData(interaction.user.id);
          if (!tempData) {
            await interaction.reply({
              content: "Your reminder setup expired. Please create it again.",
              ephemeral: true,
            });
            return;
          }

          const alert = alertService.normalizeAlert({
            userId: interaction.user.id,
            ...tempData,
          });

          alertService.addAlert(alert);
          alertService.clearTempData(interaction.user.id);

          await interaction.update({
            content: `Saved: Study reminder at ${alert.hour}:${alert.minute} ${alert.ampm} via ${alert.delivery}${alert.targetDateKey ? ` on ${alert.targetDateKey}` : ""}.`,
            embeds: [],
            components: [],
          });
          return;
        }

        if (interaction.customId === "alert:cancel") {
          alertService.clearTempData(interaction.user.id);
          await interaction.update({
            content: "Reminder setup cancelled.",
            embeds: [],
            components: [],
          });
          return;
        }
        return;
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId === "intro:submit") {
          const channel = await fetchTextChannel(
            client,
            config.introOutputChannelId,
            logger,
            "intro output channel",
          );
          if (!channel) {
            await interaction.reply({
              content: "Introduction output channel is not configured.",
              ephemeral: true,
            });
            return;
          }

          const embed = buildIntroSubmissionEmbed(interaction);
          await channel.send({ embeds: [embed] });

          await interaction.reply({
            content: "Your introduction has been posted!",
            ephemeral: true,
          });
          return;
        }

        if (interaction.customId === "alert:set") {
          let normalized;

          try {
            normalized = normalizeAlertModalInput(interaction);
          } catch (validationError) {
            await interaction.reply({
              content: `Invalid reminder input: ${validationError.message}`,
              ephemeral: true,
            });
            return;
          }

          alertService.setTempData(interaction.user.id, {
            ...normalized,
            scheduleType: "RECURRING",
            delivery: "CHAT",
            days: ["Daily"],
          });

          const tempData = alertService.getTempData(interaction.user.id);
          const components = [
            buildScheduleSelectRow("RECURRING"),
            buildDeliverySelectRow("CHAT"),
          ];
          if (tempData.scheduleType === "RECURRING") {
            components.push(buildDaySelectRow(["Daily"]));
          }
          components.push(buildAlertActionRow());

          await interaction.reply({
            embeds: [buildAlertSetupEmbed(tempData)],
            components,
            content: "Choose the reminder options below, then save it.",
            ephemeral: true,
          });
          return;
        }

        if (interaction.customId === "todo:add-modal") {
          const text = interaction.fields.getTextInputValue("task").trim();

          if (!text) {
            await interaction.reply({
              content: "Task cannot be empty.",
              ephemeral: true,
            });
            return;
          }

          const result = todoService.addTask(interaction.user.id, text);
          if (!result.ok && result.code === "DUPLICATE_TASK") {
            await interaction.reply({
              content: "You already have the same pending task.",
              ephemeral: true,
            });
            return;
          }

          const tasks = todoService.getTasksByUser(interaction.user.id);
          const selectedTaskId = todoService.getSelectedTask(
            interaction.user.id,
          );
          const embed = buildTasksEmbed(
            interaction.user.username,
            tasks,
            selectedTaskId,
          );
          const components = tasks.length
            ? [
                buildTaskSelectRow(tasks, selectedTaskId),
                ...buildTaskActionRows(selectedTaskId),
              ]
            : [];

          await interaction.reply({
            content: "Task added.",
            embeds: [embed],
            components,
            ephemeral: true,
          });
          return;
        }
        return;
      }

      if (
        interaction.isStringSelectMenu() &&
        (interaction.customId === "alert:days" ||
          interaction.customId === "alert:schedule" ||
          interaction.customId === "alert:delivery" ||
          interaction.customId === "todo:select-task")
      ) {
        if (interaction.customId === "todo:select-task") {
          todoService.setSelectedTask(
            interaction.user.id,
            interaction.values[0],
          );

          const tasks = todoService.getTasksByUser(interaction.user.id);
          const selectedTaskId = todoService.getSelectedTask(
            interaction.user.id,
          );
          const embed = buildTasksEmbed(
            interaction.user.username,
            tasks,
            selectedTaskId,
          );
          const components = tasks.length
            ? [
                buildTaskSelectRow(tasks, selectedTaskId),
                ...buildTaskActionRows(selectedTaskId),
              ]
            : [];

          await interaction.update({ embeds: [embed], components });
          return;
        }

        const tempData = alertService.getTempData(interaction.user.id);
        if (!tempData) {
          await interaction.reply({
            content: "Error: alert data expired. Please set the alert again.",
            ephemeral: true,
          });
          return;
        }

        if (interaction.customId === "alert:schedule") {
          const scheduleType = interaction.values[0];
          tempData.scheduleType = scheduleType;

          if (scheduleType === "TODAY") {
            tempData.targetDateKey = getDateKey(0);
          } else if (scheduleType === "TOMORROW") {
            tempData.targetDateKey = getDateKey(1);
          } else {
            tempData.targetDateKey = null;
          }
        } else if (interaction.customId === "alert:delivery") {
          tempData.delivery = interaction.values[0];
        } else if (interaction.customId === "alert:days") {
          let selectedDays = [...interaction.values];
          if (selectedDays.includes("Daily")) {
            selectedDays = ["Daily"];
          }
          tempData.days = selectedDays;
        }

        alertService.setTempData(interaction.user.id, tempData);

        const components = [
          buildScheduleSelectRow(tempData.scheduleType || "RECURRING"),
          buildDeliverySelectRow(tempData.delivery || "CHAT"),
        ];
        if ((tempData.scheduleType || "RECURRING") === "RECURRING") {
          components.push(buildDaySelectRow(tempData.days));
        }
        components.push(buildAlertActionRow());

        await interaction.update({
          content: "Choose the reminder options below, then save it.",
          embeds: [buildAlertSetupEmbed(tempData)],
          components,
        });
      }
    } catch (error) {
      logger.error("interactionCreate handler failed", error);

      if (interaction.deferred || interaction.replied) {
        await interaction
          .followUp({
            content: "Something went wrong while handling that action.",
            ephemeral: true,
          })
          .catch((followUpError) =>
            logger.warn("Failed to send interaction follow-up", followUpError),
          );
      } else {
        await interaction
          .reply({
            content: "Something went wrong while handling that action.",
            ephemeral: true,
          })
          .catch((replyError) =>
            logger.warn("Failed to send interaction error reply", replyError),
          );
      }
    }
  });
};
