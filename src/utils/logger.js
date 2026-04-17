function formatMeta(meta) {
  if (!meta) {
    return "";
  }

  if (meta instanceof Error) {
    return ` | ${meta.stack || meta.message}`;
  }

  try {
    return ` | ${JSON.stringify(meta)}`;
  } catch {
    return ` | ${String(meta)}`;
  }
}

function log(level, message, meta) {
  const time = new Date().toISOString();
  console.log(`[${time}] [${level}] ${message}${formatMeta(meta)}`);
}

module.exports = {
  info(message, meta) {
    log("INFO", message, meta);
  },
  warn(message, meta) {
    log("WARN", message, meta);
  },
  error(message, meta) {
    log("ERROR", message, meta);
  },
};
