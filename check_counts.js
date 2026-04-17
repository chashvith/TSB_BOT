const fs = require("fs");
["math", "puzzles", "general"].forEach((f) => {
  const data = JSON.parse(
    fs.readFileSync(`src/features/quiz/questions/${f}.json`),
  );
  console.log(`${f}.json: ${data.length} questions`);
});
