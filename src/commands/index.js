const fs = require("fs");
const path = require("path");

function loadCommands(logger) {
  const commands = new Map();
  const commandData = [];

  const commandsPath = __dirname;
  const files = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  for (const file of files) {
    const command = require(path.join(commandsPath, file));

    if (!command?.data || typeof command.execute !== "function") {
      logger.warn("Skipped invalid command module", { file });
      continue;
    }

    commands.set(command.data.name, command);
    commandData.push(command.data.toJSON());
  }

  return { commands, commandData };
}

module.exports = {
  loadCommands,
};
