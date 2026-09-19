import { TESTS, type TestId } from "../../data/tests";
import type { Answers } from "./types";

const STORAGE_KEY = "hexaco-assessment-drafts";
const STORAGE_VERSION = 1;

export type AssessmentDraft = {
  answers: Answers;
  questionIndex: number;
  updatedAt: string;
};

export type AssessmentDrafts = Partial<Record<TestId, AssessmentDraft>>;

export type DraftLoadResult = {
  drafts: AssessmentDrafts;
  error: string | null;
};

type StoredDrafts = {
  version: number;
  drafts: AssessmentDrafts;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDraft(value: unknown, testId: TestId): value is AssessmentDraft {
  if (
    !isRecord(value) ||
    !isRecord(value.answers) ||
    typeof value.questionIndex !== "number" ||
    !Number.isInteger(value.questionIndex) ||
    typeof value.updatedAt !== "string" ||
    Number.isNaN(Date.parse(value.updatedAt))
  ) {
    return false;
  }

  const test = TESTS[testId];
  const questionIds = new Set(test.questions.map((question) => question.id));
  const answersAreValid = Object.entries(value.answers).every(([rawId, answer]) => {
    const questionId = Number(rawId);
    return (
      Number.isInteger(questionId) &&
      questionIds.has(questionId) &&
      typeof answer === "number" &&
      Number.isInteger(answer) &&
      answer >= 1 &&
      answer <= test.responseOptions.length
    );
  });

  return (
    answersAreValid &&
    value.questionIndex >= 0 &&
    value.questionIndex < test.questions.length
  );
}

function readStoredDrafts(): DraftLoadResult {
  if (typeof window === "undefined") return { drafts: {}, error: null };

  try {
    const rawDrafts = window.localStorage.getItem(STORAGE_KEY);
    if (!rawDrafts) return { drafts: {}, error: null };

    const stored: unknown = JSON.parse(rawDrafts);
    if (!isRecord(stored) || stored.version !== STORAGE_VERSION || !isRecord(stored.drafts)) {
      return { drafts: {}, error: "途中保存データを読み込めませんでした。" };
    }

    const storedDrafts = stored.drafts;
    const drafts: AssessmentDrafts = {};
    const invalidDraftExists = (["60", "100"] as TestId[]).some((testId) => {
      const draft = storedDrafts[testId];
      if (draft === undefined) return false;
      if (!isValidDraft(draft, testId)) return true;
      drafts[testId] = draft;
      return false;
    });

    return {
      drafts,
      error: invalidDraftExists ? "一部の途中保存データを読み込めませんでした。" : null,
    };
  } catch {
    return { drafts: {}, error: "ブラウザーの途中保存データを利用できません。" };
  }
}

export function loadAssessmentDrafts(): DraftLoadResult {
  return readStoredDrafts();
}

export function saveAssessmentDraft(
  testId: TestId,
  answers: Answers,
  questionIndex: number,
): string | null {
  if (typeof window === "undefined") return null;

  const updatedAt = new Date().toISOString();
  const currentDrafts = readStoredDrafts().drafts;
  const stored: StoredDrafts = {
    version: STORAGE_VERSION,
    drafts: {
      ...currentDrafts,
      [testId]: { answers, questionIndex, updatedAt },
    },
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return updatedAt;
  } catch {
    return null;
  }
}

export function deleteAssessmentDraft(testId: TestId): boolean {
  if (typeof window === "undefined") return false;

  try {
    const drafts = readStoredDrafts().drafts;
    delete drafts[testId];

    if (Object.keys(drafts).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      const stored: StoredDrafts = { version: STORAGE_VERSION, drafts };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
    return true;
  } catch {
    return false;
  }
}
