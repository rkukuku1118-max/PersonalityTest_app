import type { Norm, TestDefinition } from "../../data/tests";
import type { Answers, DomainScore, EvaluationTone } from "./types";

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scoreAnswer(answer: number | undefined, reverse: boolean) {
  if (answer === undefined) return undefined;
  return reverse ? 6 - answer : answer;
}

function zScore(score: number, norm?: Norm) {
  if (!norm) return undefined;
  return (score - norm.mean) / norm.sd;
}

function normInterpretation(z?: number) {
  if (z === undefined) return undefined;
  if (z >= 1) return "高め";
  if (z >= 0.35) return "やや高め";
  if (z <= -1) return "低め";
  if (z <= -0.35) return "やや低め";
  return "平均付近";
}

function rawScoreInterpretation(score: number) {
  if (score >= 4) return "高い";
  if (score >= 3.35) return "やや高い";
  if (score <= 2) return "低い";
  if (score <= 2.65) return "やや低い";
  return "平均的";
}

export function calculateScores(test: TestDefinition, answers: Answers): DomainScore[] {
  return test.domains.map((domain) => {
    const facets = domain.facets.map((facet) => {
      const scoredItems = facet.items
        .map((item) => scoreAnswer(answers[item.number], item.reverse))
        .filter((value): value is number => value !== undefined);
      const score = mean(scoredItems);
      const norm = test.norms.facets[facet.id];

      return {
        id: facet.id,
        label: facet.label,
        score,
        answered: scoredItems.length,
        total: facet.items.length,
        norm,
        z: scoredItems.length === facet.items.length ? zScore(score, norm) : undefined,
      };
    });

    const domainItems = domain.facets.flatMap((facet) => facet.items);
    const scoredItems = domainItems
      .map((item) => scoreAnswer(answers[item.number], item.reverse))
      .filter((value): value is number => value !== undefined);
    const score = mean(scoredItems);
    const norm = test.norms.domains[domain.id];

    return {
      id: domain.id,
      label: domain.label,
      score,
      answered: scoredItems.length,
      total: domainItems.length,
      norm,
      z: scoredItems.length === domainItems.length ? zScore(score, norm) : undefined,
      facets,
    };
  });
}

export function formatScore(value: number) {
  return value.toFixed(2);
}

export function scoreProgress(answered: number, total: number, z?: number) {
  if (answered !== total) return `${answered}/${total}`;
  return normInterpretation(z) ?? "参考値";
}

export function evaluationText(score: number, z?: number) {
  return normInterpretation(z) ?? rawScoreInterpretation(score);
}

export function evaluationTone(score: number, z?: number): EvaluationTone {
  if (z === undefined) {
    if (score >= 3.35) return "high";
    if (score <= 2.65) return "low";
    return "average";
  }
  if (z >= 0.35) return "high";
  if (z <= -0.35) return "low";
  return "average";
}
