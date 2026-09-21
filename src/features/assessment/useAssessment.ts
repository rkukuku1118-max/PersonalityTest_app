import { useMemo, useState } from "react";
import { TESTS, type TestId } from "../../data/tests";
import {
  deleteAssessmentDraft,
  loadAssessmentDrafts,
  saveAssessmentDraft,
} from "./draftStorage";
import { loadAssessmentHistory, MAX_HISTORY_ENTRIES, saveAssessmentHistory } from "./historyStorage";
import { calculateScores } from "./scoring";
import { parseShareHash, SCORING_VERSION, type SharedResult } from "./shareUrl";
import type {
  AnswersByTest,
  AssessmentHistoryEntry,
  AssessmentScreen,
  DomainScore,
  GeneratedReport,
  ResultSource,
  TextReportCategoryId,
} from "./types";

const INITIAL_ANSWERS: AnswersByTest = {
  "60": {},
  "100": {},
};

type DraftState = Record<
  TestId,
  {
    savedAt: string | null;
    isDirty: boolean;
    error: string | null;
  }
>;

type ResultView = {
  id: string | null;
  testId: TestId;
  testLabel: string;
  scores: DomainScore[];
  completedAt: string | null;
  source: ResultSource;
  scoringVersion: string;
  reports: Partial<Record<TextReportCategoryId, GeneratedReport>>;
  isSharedSaved: boolean;
  isSharedResult: boolean;
};

function createHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadInitialShare() {
  if (typeof window === "undefined") return { kind: "none" } as const;
  return parseShareHash(window.location.hash, window.location.href.length);
}

function clearShareFragment() {
  if (typeof window === "undefined" || !window.location.hash.startsWith("#share=")) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

export function useAssessment() {
  const initialHistory = useMemo(loadAssessmentHistory, []);
  const initialDrafts = useMemo(loadAssessmentDrafts, []);
  const initialShare = useMemo(loadInitialShare, []);
  const latestDraftTestId = useMemo<TestId>(() => {
    const testIds: TestId[] = ["60", "100"];
    return testIds.reduce<TestId>((latest, testId) => {
      const latestTime = initialDrafts.drafts[latest]?.updatedAt ?? "";
      const candidateTime = initialDrafts.drafts[testId]?.updatedAt ?? "";
      return candidateTime > latestTime ? testId : latest;
    }, "100");
  }, [initialDrafts.drafts]);
  const [activeTestId, setActiveTestId] = useState<TestId>(
    initialShare.kind === "valid" ? initialShare.result.testId : latestDraftTestId,
  );
  const [answersByTest, setAnswersByTest] = useState<AnswersByTest>({
    "60": initialDrafts.drafts["60"]?.answers ?? INITIAL_ANSWERS["60"],
    "100": initialDrafts.drafts["100"]?.answers ?? INITIAL_ANSWERS["100"],
  });
  const [questionIndexes, setQuestionIndexes] = useState<Record<TestId, number>>({
    "60": initialDrafts.drafts["60"]?.questionIndex ?? 0,
    "100": initialDrafts.drafts["100"]?.questionIndex ?? 0,
  });
  const [draftState, setDraftState] = useState<DraftState>({
    "60": {
      savedAt: initialDrafts.drafts["60"]?.updatedAt ?? null,
      isDirty: false,
      error: initialDrafts.error,
    },
    "100": {
      savedAt: initialDrafts.drafts["100"]?.updatedAt ?? null,
      isDirty: false,
      error: initialDrafts.error,
    },
  });
  const [screen, setScreen] = useState<AssessmentScreen>(
    initialShare.kind === "valid"
      ? "results"
      : initialShare.kind === "invalid"
        ? "share-error"
        : "diagnosis",
  );
  const [history, setHistory] = useState<AssessmentHistoryEntry[]>(initialHistory.entries);
  const [historyError, setHistoryError] = useState<string | null>(initialHistory.error);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [attemptHistoryIds, setAttemptHistoryIds] = useState<Record<TestId, string | null>>({
    "60": null,
    "100": null,
  });
  const [sharedResult, setSharedResult] = useState<SharedResult | null>(
    initialShare.kind === "valid" ? initialShare.result : null,
  );
  const [sharedReports, setSharedReports] = useState<
    Partial<Record<TextReportCategoryId, GeneratedReport>>
  >(() => {
    if (initialShare.kind !== "valid") return {};
    return (
      initialHistory.entries.find(
        (entry) => entry.sharedFingerprint === initialShare.result.fingerprint,
      )?.reports ?? {}
    );
  });
  const [sharedSaveError, setSharedSaveError] = useState<string | null>(null);

  const activeTest = TESTS[activeTestId];
  const answers = answersByTest[activeTestId];
  const questionIndex = questionIndexes[activeTestId];
  const activeDraftState = draftState[activeTestId];
  const currentQuestion = activeTest.questions[questionIndex];
  const answeredCount = Object.keys(answers).length;
  const questionCount = activeTest.questions.length;
  const progress = (answeredCount / questionCount) * 100;
  const isComplete = answeredCount === questionCount;
  const scores = useMemo(() => calculateScores(activeTest, answers), [activeTest, answers]);
  const selectedHistory = history.find((entry) => entry.id === selectedHistoryId) ?? null;
  const activeHistoryId = attemptHistoryIds[activeTestId];
  const activeHistory = history.find((entry) => entry.id === activeHistoryId) ?? null;
  const savedSharedEntry = sharedResult
    ? history.find((entry) => entry.sharedFingerprint === sharedResult.fingerprint) ?? null
    : null;
  const resultView: ResultView = selectedHistory
    ? {
        id: selectedHistory.id,
        testId: selectedHistory.testId,
        testLabel: selectedHistory.testLabel,
        scores: selectedHistory.scores,
        completedAt: selectedHistory.completedAt,
        source: "history",
        scoringVersion: selectedHistory.scoringVersion ?? SCORING_VERSION,
        reports: selectedHistory.reports ?? {},
        isSharedSaved: false,
        isSharedResult: selectedHistory.source === "shared",
      }
    : sharedResult
      ? {
          id: sharedResult.fingerprint,
          testId: sharedResult.testId,
          testLabel: TESTS[sharedResult.testId].label,
          scores: sharedResult.scores,
          completedAt: null,
          source: "shared",
          scoringVersion: sharedResult.scoringVersion,
          reports: { ...savedSharedEntry?.reports, ...sharedReports },
          isSharedSaved: savedSharedEntry !== null,
          isSharedResult: true,
        }
    : {
        id: activeHistory?.id ?? null,
        testId: activeTestId,
        testLabel: activeTest.label,
        scores,
        completedAt: null,
        source: "current",
        scoringVersion: activeHistory?.scoringVersion ?? SCORING_VERSION,
        reports: activeHistory?.reports ?? {},
        isSharedSaved: false,
        isSharedResult: false,
      };
  function commitHistory(nextHistory: AssessmentHistoryEntry[], keepInMemoryOnFailure = true) {
    const limitedHistory = nextHistory.slice(0, MAX_HISTORY_ENTRIES);
    const saved = saveAssessmentHistory(limitedHistory);
    if (saved || keepInMemoryOnFailure) setHistory(limitedHistory);
    setHistoryError(
      saved ? null : "履歴を保存できませんでした。ブラウザの設定または空き容量を確認してください。",
    );
    return saved;
  }

  function saveGeneratedReport(category: TextReportCategoryId, report: GeneratedReport) {
    if (sharedResult && !selectedHistoryId) {
      setSharedReports((current) => ({ ...current, [category]: report }));
      const savedEntry = history.find(
        (entry) => entry.sharedFingerprint === sharedResult.fingerprint,
      );
      if (!savedEntry) return true;
      return commitHistory(
        history.map((entry) =>
          entry.id === savedEntry.id
            ? { ...entry, reports: { ...entry.reports, [category]: report } }
            : entry,
        ),
        false,
      );
    }

    const resultId = selectedHistoryId ?? attemptHistoryIds[activeTestId];
    if (!resultId) return false;

    let found = false;
    const nextHistory = history.map((entry) => {
      if (entry.id !== resultId) return entry;
      found = true;
      return {
        ...entry,
        reports: {
          ...entry.reports,
          [category]: report,
        },
      };
    });

    return found && commitHistory(nextHistory, false);
  }

  function saveCompletedAssessment(nextAnswers: AnswersByTest[TestId]) {
    const nextScores = calculateScores(activeTest, nextAnswers);
    const existingId = attemptHistoryIds[activeTestId];

    if (existingId && history.some((entry) => entry.id === existingId)) {
      commitHistory(
        history.map((entry) => (entry.id === existingId ? { ...entry, scores: nextScores } : entry)),
      );
      return;
    }

    const entry: AssessmentHistoryEntry = {
      id: createHistoryId(),
      testId: activeTestId,
      testLabel: activeTest.label,
      completedAt: new Date().toISOString(),
      scores: nextScores,
      scoringVersion: SCORING_VERSION,
    };
    setAttemptHistoryIds((current) => ({ ...current, [activeTestId]: entry.id }));
    commitHistory([entry, ...history]);
  }

  function answerCurrentQuestion(value: number) {
    const wasComplete = Object.keys(answers).length === questionCount;
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };

    setAnswersByTest((current) => ({
      ...current,
      [activeTestId]: nextAnswers,
    }));
    setDraftState((current) => ({
      ...current,
      [activeTestId]: { ...current[activeTestId], isDirty: true, error: null },
    }));

    if (Object.keys(nextAnswers).length === questionCount) {
      deleteAssessmentDraft(activeTestId);
      setDraftState((current) => ({
        ...current,
        [activeTestId]: { savedAt: null, isDirty: false, error: null },
      }));
      saveCompletedAssessment(nextAnswers);
      if (!wasComplete) {
        setSelectedHistoryId(null);
        setScreen("results");
      }
    } else if (questionIndex < questionCount - 1) {
      setQuestionIndexes((current) => ({
        ...current,
        [activeTestId]: current[activeTestId] + 1,
      }));
    }
  }

  function switchTest(testId: TestId) {
    clearShareFragment();
    setSharedResult(null);
    setSharedReports({});
    setSharedSaveError(null);
    setActiveTestId(testId);
    setSelectedHistoryId(null);
    setScreen("diagnosis");
  }

  function goToQuestion(index: number) {
    const nextIndex = Math.max(0, Math.min(questionCount - 1, index));
    setQuestionIndexes((current) => ({ ...current, [activeTestId]: nextIndex }));
  }

  function jumpToNextMissing() {
    const nextMissing = activeTest.questions.findIndex((question) => !answers[question.id]);
    if (nextMissing >= 0) goToQuestion(nextMissing);
  }

  function saveDraft() {
    const savedAt = saveAssessmentDraft(activeTestId, answers, questionIndex);
    setDraftState((current) => ({
      ...current,
      [activeTestId]: savedAt
        ? { savedAt, isDirty: false, error: null }
        : {
            ...current[activeTestId],
            error: "途中保存できませんでした。ブラウザーの設定または空き容量を確認してください。",
          },
    }));
  }

  function resetAssessment() {
    clearShareFragment();
    setSharedResult(null);
    setSharedReports({});
    setSharedSaveError(null);
    deleteAssessmentDraft(activeTestId);
    setAnswersByTest((current) => ({
      ...current,
      [activeTestId]: {},
    }));
    setDraftState((current) => ({
      ...current,
      [activeTestId]: { savedAt: null, isDirty: false, error: null },
    }));
    setAttemptHistoryIds((current) => ({ ...current, [activeTestId]: null }));
    setSelectedHistoryId(null);
    setQuestionIndexes((current) => ({ ...current, [activeTestId]: 0 }));
    setScreen("diagnosis");
  }

  function showHistory() {
    clearShareFragment();
    setSharedResult(null);
    setSharedReports({});
    setSharedSaveError(null);
    setSelectedHistoryId(null);
    setScreen("history");
  }

  function viewHistoryEntry(id: string) {
    const entry = history.find((item) => item.id === id);
    if (!entry) return;
    clearShareFragment();
    setSharedResult(null);
    setSharedReports({});
    setSharedSaveError(null);
    setActiveTestId(entry.testId);
    setSelectedHistoryId(id);
    setScreen("results");
  }

  function deleteHistoryEntry(id: string) {
    commitHistory(history.filter((entry) => entry.id !== id));
    setAttemptHistoryIds((current) => ({
      "60": current["60"] === id ? null : current["60"],
      "100": current["100"] === id ? null : current["100"],
    }));
    if (selectedHistoryId === id) showHistory();
  }

  function clearHistory() {
    commitHistory([]);
    setAttemptHistoryIds({ "60": null, "100": null });
    setSelectedHistoryId(null);
  }

  function saveSharedResult(label: string) {
    if (!sharedResult) return false;
    const normalizedLabel = label.trim();
    if (!normalizedLabel) {
      setSharedSaveError("この結果を識別するためのラベルを入力してください。");
      return false;
    }
    if (history.some((entry) => entry.sharedFingerprint === sharedResult.fingerprint)) {
      setSharedSaveError(null);
      return true;
    }

    const entry: AssessmentHistoryEntry = {
      id: createHistoryId(),
      testId: sharedResult.testId,
      testLabel: TESTS[sharedResult.testId].label,
      completedAt: new Date().toISOString(),
      scores: sharedResult.scores,
      reports: sharedReports,
      scoringVersion: sharedResult.scoringVersion,
      source: "shared",
      sharedFingerprint: sharedResult.fingerprint,
      sharedLabel: normalizedLabel.slice(0, 60),
    };
    const saved = commitHistory([entry, ...history], false);
    setSharedSaveError(
      saved
        ? null
        : "共有結果を保存できませんでした。ブラウザの設定または空き容量を確認してください。",
    );
    return saved;
  }

  function startAssessmentFromShared() {
    clearShareFragment();
    setSharedResult(null);
    setSharedReports({});
    setSharedSaveError(null);
    setSelectedHistoryId(null);
    setScreen("diagnosis");
  }

  return {
    activeTestId,
    activeTest,
    answers,
    currentQuestion,
    questionIndex,
    answeredCount,
    questionCount,
    progress,
    isComplete,
    scores,
    resultView,
    screen,
    history,
    historyError,
    sharedSaveError,
    activeDraftState,
    answerCurrentQuestion,
    switchTest,
    goToQuestion,
    goToPreviousQuestion: () => goToQuestion(questionIndex - 1),
    goToNextQuestion: () => goToQuestion(questionIndex + 1),
    jumpToNextMissing,
    saveDraft,
    showResults: () => {
      setSelectedHistoryId(null);
      setScreen("results");
    },
    reviewAnswers: () => {
      setSelectedHistoryId(null);
      setScreen("diagnosis");
    },
    showHistory,
    viewHistoryEntry,
    deleteHistoryEntry,
    clearHistory,
    resetAssessment,
    saveGeneratedReport,
    saveSharedResult,
    startAssessmentFromShared,
  };
}

export type AssessmentController = ReturnType<typeof useAssessment>;
