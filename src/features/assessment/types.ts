import type { Norm, TestId } from "../../data/tests";

export type Answers = Record<number, number>;
export type AnswersByTest = Record<TestId, Answers>;
export type AssessmentScreen = "diagnosis" | "results" | "history" | "share-error";
export type ResultSource = "current" | "history" | "shared";

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

export type TextReportCategoryId = "overall" | "relationship" | "work" | "impression";

export type GeneratedReport = {
  content: string;
  model: string;
  generatedAt: string;
};

export type AssessmentHistoryEntry = {
  id: string;
  testId: TestId;
  testLabel: string;
  completedAt: string;
  scores: DomainScore[];
  reports?: Partial<Record<TextReportCategoryId, GeneratedReport>>;
  scoringVersion?: string;
  source?: "shared";
  sharedFingerprint?: string;
  sharedLabel?: string;
};

export type EvaluationTone = "high" | "average" | "low";
