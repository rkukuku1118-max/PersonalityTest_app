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
    activeDraftState,
    answerCurrentQuestion,
    goToPreviousQuestion,
    goToNextQuestion,
    goToQuestion,
    jumpToNextMissing,
    saveDraft,
    showResults,
    resetAssessment,
  } = assessment;
  const progressLabel = Math.round(progress);
  const answerChoices = activeTest.responseOptions
    .map((label, index) => ({ label, value: index + 1 }))
    .reverse();

  function confirmReset() {
    if (answeredCount === 0 || window.confirm("最初からやり直しますか？ここまでの回答は消去されます。")) {
      resetAssessment();
    }
  }

  return (
    <div className="view assessment-view">
      <section className="assessment-status" aria-label="回答状況">
        <div className="assessment-status__summary">
          <span className="assessment-status__value">{progressLabel}%</span>
          <span className="assessment-status__label">
            ここまで {answeredCount} / {questionCount} 問
          </span>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-label="診断の進捗"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressLabel}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="assessment-status__actions">
          <button type="button" className="button button--ghost" onClick={jumpToNextMissing} disabled={isComplete}>
            まだ答えていない質問へ
          </button>
          <button type="button" className="button button--primary" onClick={showResults} disabled={!isComplete}>
            結果を見る
          </button>
        </div>
      </section>

      <section className="question-card" aria-labelledby="question-heading">
        <div className="question-card__meta">
          <span className="question-card__count">{questionIndex + 1}問目 / 全{questionCount}問</span>
          <span className="question-card__test">{activeTest.label}</span>
        </div>
        <h2 id="question-heading">{currentQuestion.text}</h2>
        <span className="sr-only" aria-live="polite">
          質問 {questionIndex + 1} を表示中
        </span>

        <div className="answer-scale">
          <div
            className="answer-scale__options"
            role="radiogroup"
            aria-label="回答。左ほどあてはまり、右ほどあてはまりません"
          >
          {answerChoices.map(({ label, value }) => {
            const selected = answers[currentQuestion.id] === value;
            const tone = value > 3 ? "agree" : value < 3 ? "disagree" : "neutral";
            const strength = Math.abs(value - 3) === 2 ? "strong" : Math.abs(value - 3) === 1 ? "mild" : "neutral";

            return (
              <button
                key={value}
                type="button"
                className={`answer-scale__option answer-scale__option--${tone} answer-scale__option--${strength}${selected ? " is-selected" : ""}`}
                onClick={() => answerCurrentQuestion(value)}
                role="radio"
                aria-checked={selected}
                aria-label={label}
                title={label}
              >
                <span className="answer-scale__circle" aria-hidden="true" />
              </button>
            );
          })}
          </div>
          <div className="answer-scale__labels" aria-hidden="true">
            <span>あてはまる</span>
            <span>あてはまらない</span>
          </div>
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
          <div className="question-navigation__position" aria-live="polite">
            <strong>{questionIndex + 1}</strong>
            <span>/ {questionCount}</span>
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

        <details className="question-overview">
          <summary>
            <span>ほかの質問を見る</span>
            <small>ここまで {answeredCount}問</small>
          </summary>
          <div className="question-overview__grid" aria-label="質問ナビゲーション">
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
                aria-label={`質問${question.id}${answers[question.id] ? "、回答済み" : "、未回答"}`}
                aria-current={index === questionIndex ? "step" : undefined}
                onClick={() => goToQuestion(index)}
              >
                {question.id}
              </button>
            ))}
          </div>
          <div className="question-overview__legend" aria-hidden="true">
            <span><i className="is-current" />現在</span>
            <span><i className="is-answered" />回答済み</span>
            <span><i />未回答</span>
          </div>
        </details>

        <div className="question-card__utilities">
          <div className="draft-controls">
            <button
              type="button"
              className="button button--secondary"
              onClick={saveDraft}
              disabled={answeredCount === 0 || (!activeDraftState.isDirty && Boolean(activeDraftState.savedAt))}
            >
              ここでひと休み
            </button>
            <p
              className={activeDraftState.error ? "draft-status is-error" : "draft-status"}
              role="status"
            >
              {activeDraftState.error
                ? activeDraftState.error
                : activeDraftState.isDirty && activeDraftState.savedAt
                  ? "保存後に変更があります"
                  : activeDraftState.savedAt
                    ? `続きから再開できます · ${new Intl.DateTimeFormat("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(activeDraftState.savedAt))}`
                    : "ここまでの回答を、このブラウザーに保存できます"}
            </p>
          </div>
          <button
            type="button"
            className="button button--danger"
            onClick={confirmReset}
            disabled={answeredCount === 0}
          >
            最初からやり直す
          </button>
        </div>
      </section>
    </div>
  );
}
