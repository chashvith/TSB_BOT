const fs = require("fs");
const path = require("path");

function registerEvents(client, deps) {
  const eventsPath = __dirname;
  const files = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  for (const file of files) {
    const register = require(path.join(eventsPath, file));
    register(client, deps);
    deps.logger.info("Loaded event handler", { file });
  }
}

module.exports = {
  registerEvents,
};
