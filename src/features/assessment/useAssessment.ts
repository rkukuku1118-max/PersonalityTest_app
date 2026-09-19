import { useMemo, useState } from "react";
import { TESTS, type TestId } from "../../data/tests";
import { loadAssessmentHistory, MAX_HISTORY_ENTRIES, saveAssessmentHistory } from "./historyStorage";
import { calculateScores } from "./scoring";
import type {
  AnswersByTest,
  AssessmentHistoryEntry,
  AssessmentScreen,
  DomainScore,
} from "./types";

const INITIAL_ANSWERS: AnswersByTest = {
  "60": {},
  "100": {},
};

type ResultView = {
  testLabel: string;
  scores: DomainScore[];
  completedAt: string | null;
  isHistory: boolean;
};

function createHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useAssessment() {
  const initialHistory = useMemo(loadAssessmentHistory, []);
  const [activeTestId, setActiveTestId] = useState<TestId>("100");
  const [answersByTest, setAnswersByTest] = useState<AnswersByTest>(INITIAL_ANSWERS);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [screen, setScreen] = useState<AssessmentScreen>("diagnosis");
  const [history, setHistory] = useState<AssessmentHistoryEntry[]>(initialHistory.entries);
  const [historyError, setHistoryError] = useState<string | null>(initialHistory.error);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [attemptHistoryIds, setAttemptHistoryIds] = useState<Record<TestId, string | null>>({
    "60": null,
    "100": null,
  });

  const activeTest = TESTS[activeTestId];
  const answers = answersByTest[activeTestId];
  const currentQuestion = activeTest.questions[questionIndex];
  const answeredCount = Object.keys(answers).length;
  const questionCount = activeTest.questions.length;
  const progress = (answeredCount / questionCount) * 100;
  const isComplete = answeredCount === questionCount;
  const scores = useMemo(() => calculateScores(activeTest, answers), [activeTest, answers]);
  const selectedHistory = history.find((entry) => entry.id === selectedHistoryId) ?? null;
  const resultView: ResultView = selectedHistory
    ? {
        testLabel: selectedHistory.testLabel,
        scores: selectedHistory.scores,
        completedAt: selectedHistory.completedAt,
        isHistory: true,
      }
    : {
        testLabel: activeTest.label,
        scores,
        completedAt: null,
        isHistory: false,
      };
  const completeDomainCount = resultView.scores.filter((score) => score.answered === score.total).length;

  function commitHistory(nextHistory: AssessmentHistoryEntry[]) {
    const limitedHistory = nextHistory.slice(0, MAX_HISTORY_ENTRIES);
    setHistory(limitedHistory);
    setHistoryError(
      saveAssessmentHistory(limitedHistory)
        ? null
        : "履歴を保存できませんでした。ブラウザの設定または空き容量を確認してください。",
    );
  }

  function saveCompletedAssessment(nextAnswers: AnswersByTest[TestId]) {
    const nextScores = calculateScores(activeTest, nextAnswers);
    const existingId = attemptHistoryIds[activeTestId];

    if (existingId) {
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
    };
    setAttemptHistoryIds((current) => ({ ...current, [activeTestId]: entry.id }));
    commitHistory([entry, ...history]);
  }

  function answerCurrentQuestion(value: number) {
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };

    setAnswersByTest((current) => ({
      ...current,
      [activeTestId]: nextAnswers,
    }));

    if (Object.keys(nextAnswers).length === questionCount) {
      saveCompletedAssessment(nextAnswers);
      setSelectedHistoryId(null);
      setScreen("results");
    } else if (questionIndex < questionCount - 1) {
      setQuestionIndex((index) => index + 1);
    }
  }

  function switchTest(testId: TestId) {
    setActiveTestId(testId);
    setQuestionIndex(0);
    setSelectedHistoryId(null);
    setScreen("diagnosis");
  }

  function goToQuestion(index: number) {
    setQuestionIndex(Math.max(0, Math.min(questionCount - 1, index)));
  }

  function jumpToNextMissing() {
    const nextMissing = activeTest.questions.findIndex((question) => !answers[question.id]);
    if (nextMissing >= 0) setQuestionIndex(nextMissing);
  }

  function resetAssessment() {
    setAnswersByTest((current) => ({
      ...current,
      [activeTestId]: {},
    }));
    setAttemptHistoryIds((current) => ({ ...current, [activeTestId]: null }));
    setSelectedHistoryId(null);
    setQuestionIndex(0);
    setScreen("diagnosis");
  }

  function showHistory() {
    setSelectedHistoryId(null);
    setScreen("history");
  }

  function viewHistoryEntry(id: string) {
    const entry = history.find((item) => item.id === id);
    if (!entry) return;
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
    completeDomainCount,
    screen,
    history,
    historyError,
    answerCurrentQuestion,
    switchTest,
    goToQuestion,
    goToPreviousQuestion: () => goToQuestion(questionIndex - 1),
    goToNextQuestion: () => goToQuestion(questionIndex + 1),
    jumpToNextMissing,
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
  };
}

export type AssessmentController = ReturnType<typeof useAssessment>;
