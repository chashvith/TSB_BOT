const { mergeUniqueQuestions } = require("./dedupe");
const {
  ensureThemeFiles,
  readThemeQuestions,
  writeThemeQuestions,
} = require("./fileManager");

async function refillThemeToMinimum({
  theme,
  currentQuestions,
  minCount,
  batchSize,
  logger,
  generateQuestions,
}) {
  let merged = [...currentQuestions];

  if (merged.length >= minCount) {
    return merged;
  }

  const missing = minCount - merged.length;
  const callsNeeded = Math.ceil(missing / batchSize);

  for (let index = 0; index < callsNeeded; index += 1) {
    const generated = await generateQuestions({
      theme,
      count: batchSize,
      logger,
    });

    if (!generated.length) {
      break;
    }

    merged = mergeUniqueQuestions(merged, generated);
    if (merged.length >= minCount) {
      break;
    }
  }

  return merged;
}

async function preloadQuizQuestions({
  themes,
  logger,
  minDynamicCount = 50,
  batchSize = 20,
  generateQuestions,
}) {
  ensureThemeFiles(themes);

  const dynamicPools = {};
  const fallbackPools = {};

  for (const theme of themes) {
    const fallbackLoaded = readThemeQuestions("fallback", theme, logger);
    const dynamicLoaded = readThemeQuestions("dynamic", theme, logger);

    const fallbackQuestions = writeThemeQuestions(
      "fallback",
      theme,
      fallbackLoaded,
      logger,
    );

    const dynamicRefilled = await refillThemeToMinimum({
      theme,
      currentQuestions: dynamicLoaded,
      minCount: minDynamicCount,
      batchSize,
      logger,
      generateQuestions,
    });

    const dynamicQuestions = writeThemeQuestions(
      "dynamic",
      theme,
      dynamicRefilled,
      logger,
    );

    dynamicPools[theme] = dynamicQuestions;
    fallbackPools[theme] = fallbackQuestions;

    logger.info("Quiz theme preloaded", {
      theme,
      dynamicCount: dynamicQuestions.length,
      fallbackCount: fallbackQuestions.length,
    });
  }

  return {
    dynamicPools,
    fallbackPools,
  };
}

module.exports = {
  preloadQuizQuestions,
};
