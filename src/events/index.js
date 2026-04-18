const fs = require("fs");
const path = require("path");

function registerEvents(client, deps) {
  // Guard against accidental double bootstrap that would attach listeners twice.
  if (client.__tsbEventsRegistered) {
    deps.logger.warn("Skipped event registration: handlers already registered");
    return;
  }

  const eventsPath = __dirname;
  const files = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  for (const file of files) {
    const register = require(path.join(eventsPath, file));
    register(client, deps);
    deps.logger.info("Loaded event handler", { file });
  }

  client.__tsbEventsRegistered = true;
}

module.exports = {
  registerEvents,
};
