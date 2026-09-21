import { useEffect, useRef, useState } from "react";
import type { AssessmentController } from "../useAssessment";
import { AiPromptBuilder } from "./AiPromptBuilder";
import { DomainScoreCard, ScoreOverview } from "./ScoreCards";

type ResultsScreenProps = {
  assessment: AssessmentController;
};

export function ResultsScreen({ assessment }: ResultsScreenProps) {
  const aiSectionRef = useRef<HTMLDivElement>(null);
  const [isAiSectionVisible, setIsAiSectionVisible] = useState(false);
  const {
    resultView,
    historyError,
    reviewAnswers,
    resetAssessment,
    saveGeneratedReport,
    showHistory,
  } = assessment;
  const { id, testLabel, scores, completedAt, isHistory, reports } = resultView;
  const completedAtLabel = completedAt
    ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(completedAt),
      )
    : null;

  useEffect(() => {
    const aiSection = aiSectionRef.current;
    if (!aiSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsAiSectionVisible(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(aiSection);

    return () => observer.disconnect();
  }, [id]);

  const showAiSection = () => {
    aiSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="view results-view" aria-labelledby="results-heading">
      <div className="results-header">
        <div>
          <span className="status-pill">{isHistory ? "保存済み" : "集計完了"}</span>
          <h2 id="results-heading">{isHistory ? "過去の診断結果" : "診断結果"}</h2>
          {completedAtLabel && <p className="results-header__date">実施日時: {completedAtLabel}</p>}
        </div>
      </div>

      {!isHistory && (
        <p className={historyError ? "storage-notice storage-notice--error" : "storage-notice"} role="status">
          {historyError ?? "この結果は、このブラウザのローカルストレージに保存されました。"}
        </p>
      )}

      <ScoreOverview scores={scores} />

      <div ref={aiSectionRef} id="ai-analysis">
        <AiPromptBuilder
          resultId={id}
          testLabel={testLabel}
          scores={scores}
          savedReports={reports}
          onSaveReport={saveGeneratedReport}
        />
      </div>

      <section className="results-list" id="score-details" aria-labelledby="score-details-heading">
        <div className="results-list__heading">
          <div>
            <span>詳しく確認する</span>
            <h3 id="score-details-heading">因子と下位尺度</h3>
          </div>
          <p>因子をタップすると、下位尺度のスコアが開きます。</p>
        </div>
        <div className="results-list__grid">
          {scores.map((domain) => (
            <DomainScoreCard key={domain.id} domain={domain} />
          ))}
        </div>
      </section>

      <div className="results-view__actions">
        {isHistory ? (
          <>
            <button type="button" className="button button--secondary" onClick={showHistory}>
              履歴一覧に戻る
            </button>
            <button type="button" className="button button--primary" onClick={resetAssessment}>
              新しく診断する
            </button>
          </>
        ) : (
          <>
            <button type="button" className="button button--secondary" onClick={reviewAnswers}>
              回答を見直す
            </button>
            <button type="button" className="button button--primary" onClick={resetAssessment}>
              もう一度診断する
            </button>
          </>
        )}
      </div>

      <p className="source-note">
        質問文と採点情報は変換済みJSONを参照しています。心理・医療上の診断ではありません。
      </p>

      {!isAiSectionVisible && Object.keys(reports).length === 0 && (
        <button type="button" className="ai-quick-action" onClick={showAiSection}>
          <span aria-hidden="true">✦</span>
          <span>
            <strong>AIレポートを作る</strong>
            <small>テーマを選んで分析する</small>
          </span>
          <i aria-hidden="true">↓</i>
        </button>
      )}
    </section>
  );
}
