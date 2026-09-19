import { useMemo, useState } from "react";
import { TESTS, type TestId } from "../../data/tests";
import { calculateScores } from "./scoring";
import type { AnswersByTest, AssessmentScreen } from "./types";

const INITIAL_ANSWERS: AnswersByTest = {
  "60": {},
  "100": {},
};

export function useAssessment() {
  const [activeTestId, setActiveTestId] = useState<TestId>("100");
  const [answersByTest, setAnswersByTest] = useState<AnswersByTest>(INITIAL_ANSWERS);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [screen, setScreen] = useState<AssessmentScreen>("diagnosis");

  const activeTest = TESTS[activeTestId];
  const answers = answersByTest[activeTestId];
  const currentQuestion = activeTest.questions[questionIndex];
  const answeredCount = Object.keys(answers).length;
  const questionCount = activeTest.questions.length;
  const progress = (answeredCount / questionCount) * 100;
  const isComplete = answeredCount === questionCount;
  const scores = useMemo(() => calculateScores(activeTest, answers), [activeTest, answers]);
  const completeDomainCount = scores.filter((score) => score.answered === score.total).length;

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
      setScreen("results");
    } else if (questionIndex < questionCount - 1) {
      setQuestionIndex((index) => index + 1);
    }
  }

  function switchTest(testId: TestId) {
    setActiveTestId(testId);
    setQuestionIndex(0);
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
    setQuestionIndex(0);
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
    completeDomainCount,
    screen,
    answerCurrentQuestion,
    switchTest,
    goToQuestion,
    goToPreviousQuestion: () => goToQuestion(questionIndex - 1),
    goToNextQuestion: () => goToQuestion(questionIndex + 1),
    jumpToNextMissing,
    showResults: () => setScreen("results"),
    reviewAnswers: () => setScreen("diagnosis"),
    resetAssessment,
  };
}

export type AssessmentController = ReturnType<typeof useAssessment>;
