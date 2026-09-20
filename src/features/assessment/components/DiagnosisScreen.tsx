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

  function confirmReset() {
    if (answeredCount === 0 || window.confirm("現在の回答をすべて消去しますか？この操作は元に戻せません。")) {
      resetAssessment();
    }
  }

  return (
    <div className="view assessment-view">
      <section className="assessment-status" aria-label="回答状況">
        <div className="assessment-status__summary">
          <span className="assessment-status__value">{progressLabel}%</span>
          <span className="assessment-status__label">
            {answeredCount} / {questionCount} 問回答済み
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
            次の未回答
          </button>
          <button type="button" className="button button--primary" onClick={showResults} disabled={!isComplete}>
            診断結果を見る
          </button>
        </div>
      </section>

      <section className="question-card" aria-labelledby="question-heading">
        <div className="question-card__meta">
          <span className="question-card__count">質問 {questionIndex + 1} / {questionCount}</span>
          <span className="question-card__test">{activeTest.label}</span>
        </div>
        <h2 id="question-heading">{currentQuestion.text}</h2>
        <p className="question-card__hint">もっとも近いものを1つ選んでください。選択すると次へ進みます。</p>
        <span className="sr-only" aria-live="polite">
          質問 {questionIndex + 1} を表示中
        </span>

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
                role="radio"
                aria-checked={selected}
              >
                <span className="answer-option__number">{value}</span>
                <span>{label}</span>
                <span className="answer-option__indicator" aria-hidden="true" />
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
            <span>質問一覧から移動</span>
            <small>{answeredCount}問回答済み</small>
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
              途中保存
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
                    ? `保存済み ${new Intl.DateTimeFormat("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(activeDraftState.savedAt))}`
                    : "このブラウザーに回答と再開位置を保存します"}
            </p>
          </div>
          <button
            type="button"
            className="button button--danger"
            onClick={confirmReset}
            disabled={answeredCount === 0}
          >
            回答をクリア
          </button>
        </div>
      </section>
    </div>
  );
}
