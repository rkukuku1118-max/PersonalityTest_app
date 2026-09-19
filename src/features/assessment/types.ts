import type { Norm, TestId } from "../../data/tests";

export type Answers = Record<number, number>;
export type AnswersByTest = Record<TestId, Answers>;
export type AssessmentScreen = "diagnosis" | "results";

export type FacetScore = {
  id: string;
  label: string;
  score: number;
  answered: number;
  total: number;
  norm?: Norm;
  z?: number;
};

export type DomainScore = {
  id: string;
  label: string;
  score: number;
  answered: number;
  total: number;
  norm?: Norm;
  z?: number;
  facets: FacetScore[];
};

export type EvaluationTone = "high" | "average" | "low";
