import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("src/data/test-definitions.json", "utf8"));

const expectedQuestionCounts = {
  "60": 60,
  "100": 100,
};

// HEXACO-60 の各項目が、HEXACO-100 のどの項目に対応するかを表す。
// 共有項目の文言が片方だけ変更され、回答体験に差が出ることを防ぐ。
const sharedQuestionMap60To100 = [
  1, 26, 3, 4, 5, 30, 7, 32, 9, 10, 11, 12, 37, 38, 15, 64, 17, 18, 19, 20,
  21, 46, 23, 72, 49, 74, 27, 52, 53, 54, 79, 80, 57, 34, 35, 60, 61, 62, 39, 88,
  41, 90, 43, 44, 69, 94, 71, 96, 85, 86, 81, 76, 77, 78, 91, 92, 63, 58, 95, 84,
];

for (const [testId, test] of Object.entries(data)) {
  const expectedCount = expectedQuestionCounts[testId];

  if (!expectedCount) {
    throw new Error(`Unexpected test id: ${testId}`);
  }

  if (test.questions.length !== expectedCount) {
    throw new Error(`${testId}: expected ${expectedCount} questions, got ${test.questions.length}`);
  }

  const questionIds = new Set(test.questions.map((question) => question.id));

  for (const domain of test.domains) {
    for (const facet of domain.facets) {
      for (const item of facet.items) {
        if (!questionIds.has(item.number)) {
          throw new Error(`${testId}: scoring item ${item.number} is missing from questions`);
        }
      }
    }
  }
}

const questions100 = new Map(data["100"].questions.map((question) => [question.id, question.text]));

data["60"].questions.forEach((question, index) => {
  const question100Id = sharedQuestionMap60To100[index];
  const question100Text = questions100.get(question100Id);

  if (question.text !== question100Text) {
    throw new Error(
      `Shared wording mismatch: 60-item #${question.id} and 100-item #${question100Id}`,
    );
  }
});

console.log("Data validation passed.");
