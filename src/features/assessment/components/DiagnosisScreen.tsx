import type { AssessmentController } from "../useAssessment";

type DiagnosisScreenProps = {
  assessment: AssessmentController;
};

export function DiagnosisScreen({ assessment }: DiagnosisScreenProps) {
  const {
    activeTest,
    answers,
    currentQuestion,
    questionIndex,
    answeredCount,
    questionCount,
    progress,
    isComplete,
    answerCurrentQuestion,
    goToPreviousQuestion,
    goToNextQuestion,
    goToQuestion,
    jumpToNextMissing,
    showResults,
    resetAssessment,
  } = assessment;

  return (
    <div className="view assessment-view">
      <section className="assessment-status" aria-label="回答状況">
        <div>
          <span className="assessment-status__value">
            {answeredCount}/{questionCount}
          </span>
          <span className="assessment-status__label">回答済み</span>
        </div>
        <div className="progress-bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="assessment-status__actions">
          <button type="button" className="button button--ghost" onClick={jumpToNextMissing} disabled={isComplete}>
            次の未回答
          </button>
          <button type="button" className="button button--primary" onClick={showResults} disabled={!isComplete}>
            診断結果を見る
          </button>
        </div>
      </section>

      <section className="question-card" aria-labelledby="question-heading">
        <div className="question-card__meta">
          <span>Q{currentQuestion.id}</span>
          <span>{activeTest.label}</span>
        </div>
        <h2 id="question-heading">{currentQuestion.text}</h2>

        <div className="answer-list" role="radiogroup" aria-label="回答">
          {activeTest.responseOptions.map((label, index) => {
            const value = index + 1;
            const selected = answers[currentQuestion.id] === value;

            return (
              <button
                key={label}
                type="button"
                className={selected ? "answer-option is-selected" : "answer-option"}
                onClick={() => answerCurrentQuestion(value)}
                aria-pressed={selected}
              >
                <span className="answer-option__number">{value}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="question-navigation">
          <button
            type="button"
            className="button button--secondary"
            onClick={goToPreviousQuestion}
            disabled={questionIndex === 0}
          >
            前へ
          </button>
          <div className="question-navigation__dots" aria-label="質問ナビゲーション">
            {activeTest.questions.map((question, index) => (
              <button
                key={question.id}
                type="button"
                className={[
                  index === questionIndex ? "is-current" : "",
                  answers[question.id] ? "is-answered" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={`質問${question.id}`}
                onClick={() => goToQuestion(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={goToNextQuestion}
            disabled={questionIndex === questionCount - 1}
          >
            次へ
          </button>
        </div>

        <div className="question-card__utilities">
          <button
            type="button"
            className="button button--danger"
            onClick={resetAssessment}
            disabled={answeredCount === 0}
          >
            回答をクリア
          </button>
        </div>
      </section>
    </div>
  );
}
