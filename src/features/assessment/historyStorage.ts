import type { TestId } from "../../data/tests";
import type {
  AssessmentHistoryEntry,
  DomainScore,
  FacetScore,
  GeneratedReport,
  TextReportCategoryId,
} from "./types";

const STORAGE_KEY = "hexaco-assessment-history";
const STORAGE_VERSION = 1;
export const MAX_HISTORY_ENTRIES = 50;

type StoredHistory = {
  version: number;
  entries: AssessmentHistoryEntry[];
};

export type HistoryLoadResult = {
  entries: AssessmentHistoryEntry[];
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOptionalFiniteNumber(value: unknown): value is number | undefined {
  return value === undefined || isFiniteNumber(value);
}

function isOptionalNorm(value: unknown) {
  return (
    value === undefined ||
    (isRecord(value) && isFiniteNumber(value.mean) && isFiniteNumber(value.sd))
  );
}

function isFacetScore(value: unknown): value is FacetScore {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isFiniteNumber(value.score) &&
    isFiniteNumber(value.answered) &&
    isFiniteNumber(value.total) &&
    isOptionalNorm(value.norm) &&
    isOptionalFiniteNumber(value.z)
  );
}

function isDomainScore(value: unknown): value is DomainScore {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isFiniteNumber(value.score) &&
    isFiniteNumber(value.answered) &&
    isFiniteNumber(value.total) &&
    isOptionalNorm(value.norm) &&
    isOptionalFiniteNumber(value.z) &&
    Array.isArray(value.facets) &&
    value.facets.every(isFacetScore)
  );
}

function isTestId(value: unknown): value is TestId {
  return value === "60" || value === "100";
}

const REPORT_CATEGORY_IDS: TextReportCategoryId[] = [
  "overall",
  "relationship",
  "work",
  "impression",
];

function isGeneratedReport(value: unknown): value is GeneratedReport {
  return (
    isRecord(value) &&
    typeof value.content === "string" &&
    typeof value.model === "string" &&
    typeof value.generatedAt === "string" &&
    !Number.isNaN(Date.parse(value.generatedAt))
  );
}

function isGeneratedReports(
  value: unknown,
): value is Partial<Record<TextReportCategoryId, GeneratedReport>> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([category, report]) =>
        REPORT_CATEGORY_IDS.includes(category as TextReportCategoryId) && isGeneratedReport(report),
    )
  );
}

function isHistoryEntry(value: unknown): value is AssessmentHistoryEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isTestId(value.testId) &&
    typeof value.testLabel === "string" &&
    typeof value.completedAt === "string" &&
    !Number.isNaN(Date.parse(value.completedAt)) &&
    Array.isArray(value.scores) &&
    value.scores.every(isDomainScore) &&
    (value.reports === undefined || isGeneratedReports(value.reports)) &&
    (value.scoringVersion === undefined || typeof value.scoringVersion === "string") &&
    (value.source === undefined || value.source === "shared") &&
    (value.sharedFingerprint === undefined || typeof value.sharedFingerprint === "string") &&
    (value.sharedLabel === undefined ||
      (typeof value.sharedLabel === "string" && value.sharedLabel.length <= 60)) &&
    (value.source !== "shared" ||
      (typeof value.sharedFingerprint === "string" &&
        typeof value.sharedLabel === "string" &&
        typeof value.scoringVersion === "string"))
  );
}

export function loadAssessmentHistory(): HistoryLoadResult {
  if (typeof window === "undefined") return { entries: [], error: null };

  try {
    const rawHistory = window.localStorage.getItem(STORAGE_KEY);
    if (!rawHistory) return { entries: [], error: null };

    const stored: unknown = JSON.parse(rawHistory);
    if (
      !isRecord(stored) ||
      stored.version !== STORAGE_VERSION ||
      !Array.isArray(stored.entries)
    ) {
      return { entries: [], error: "保存済みの履歴を読み込めませんでした。" };
    }

    const entries = stored.entries.filter(isHistoryEntry).slice(0, MAX_HISTORY_ENTRIES);
    return {
      entries,
      error: entries.length === stored.entries.length ? null : "一部の履歴を読み込めませんでした。",
    };
  } catch {
    return { entries: [], error: "ブラウザのローカルストレージを利用できません。" };
  }
}

export function saveAssessmentHistory(entries: AssessmentHistoryEntry[]): boolean {
  if (typeof window === "undefined") return false;

  const stored: StoredHistory = {
    version: STORAGE_VERSION,
    entries: entries.slice(0, MAX_HISTORY_ENTRIES),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}
