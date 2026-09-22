import { useEffect, useRef, useState } from "react";
import type { AssessmentController } from "../useAssessment";
import { AiPromptBuilder } from "./AiPromptBuilder";
import { FactorResults } from "./ScoreCards";
import { ShareLinkDialog } from "./ShareLinkDialog";

type ResultsScreenProps = {
  assessment: AssessmentController;
};

export function ResultsScreen({ assessment }: ResultsScreenProps) {
  const aiSectionRef = useRef<HTMLDivElement>(null);
  const [isAiSectionVisible, setIsAiSectionVisible] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharedLabel, setSharedLabel] = useState("");
  const {
    resultView,
    historyError,
    reviewAnswers,
    resetAssessment,
    saveGeneratedReport,
    saveSharedResult,
    sharedSaveError,
    showHistory,
    startAssessmentFromShared,
  } = assessment;
  const {
    id,
    testId,
    testLabel,
    scores,
    completedAt,
    source,
    reports,
    isSharedSaved,
    isSharedResult,
  } = resultView;
  const isHistory = source === "history";
  const isShared = source === "shared";
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
          <span className="status-pill">
            {isShared ? "共有リンクから表示中" : isHistory ? "保存済み" : "集計完了"}
          </span>
          <h2 id="results-heading">{isHistory ? "過去の診断結果" : "診断結果"}</h2>
          {completedAtLabel && <p className="results-header__date">実施日時: {completedAtLabel}</p>}
        </div>
      </div>

      {source === "current" && (
        <p className={historyError ? "storage-notice storage-notice--error" : "storage-notice"} role="status">
          {historyError ?? "この結果は、このブラウザのローカルストレージに保存されました。"}
        </p>
      )}

      {isShared && (
        <section className="shared-save" aria-labelledby="shared-save-heading">
          {isSharedSaved ? (
            <p className="shared-save__saved" id="shared-save-heading" role="status">
              この端末に保存済み
            </p>
          ) : (
            <>
              <div>
                <h3 id="shared-save-heading">この結果を端末に保存</h3>
                <p>
                  この共有結果はまだこの端末に保存されていません。保存すると診断履歴から確認できます。
                </p>
              </div>
              <div className="shared-save__controls">
                <label>
                  <span>共有元がわかるラベル</span>
                  <input
                    type="text"
                    value={sharedLabel}
                    maxLength={60}
                    placeholder="例：友人Aの結果"
                    onChange={(event) => setSharedLabel(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="button button--primary"
                  disabled={!sharedLabel.trim()}
                  onClick={() => saveSharedResult(sharedLabel)}
                >
                  この結果を端末に保存
                </button>
              </div>
              {sharedSaveError && (
                <p className="shared-save__error" role="alert">
                  {sharedSaveError}
                </p>
              )}
            </>
          )}
        </section>
      )}

      <FactorResults key={id} scores={scores} />

      <div ref={aiSectionRef} id="ai-analysis">
        <AiPromptBuilder
          resultId={id}
          testLabel={testLabel}
          scores={scores}
          savedReports={reports}
          onSaveReport={saveGeneratedReport}
          reportStorage={isShared && !isSharedSaved ? "memory" : "saved"}
        />
      </div>

      <div className="results-view__actions">
        {!isSharedResult && (
          <button type="button" className="button button--ghost" onClick={() => setIsShareDialogOpen(true)}>
            共有リンクを作る
          </button>
        )}
        {isShared ? (
          <button type="button" className="button button--primary" onClick={startAssessmentFromShared}>
            自分も診断する
          </button>
        ) : isHistory ? (
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

      {isShareDialogOpen && (
        <ShareLinkDialog
          testId={testId}
          scores={scores}
          onClose={() => setIsShareDialogOpen(false)}
        />
      )}
    </section>
  );
}
