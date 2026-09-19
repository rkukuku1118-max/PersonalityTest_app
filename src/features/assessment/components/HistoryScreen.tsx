import { formatScore } from "../scoring";
import type { AssessmentController } from "../useAssessment";

type HistoryScreenProps = {
  assessment: AssessmentController;
};

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function HistoryScreen({ assessment }: HistoryScreenProps) {
  const {
    history,
    historyError,
    reviewAnswers,
    viewHistoryEntry,
    deleteHistoryEntry,
    clearHistory,
  } = assessment;

  function confirmDelete(id: string) {
    if (window.confirm("この診断履歴を削除しますか？この操作は元に戻せません。")) {
      deleteHistoryEntry(id);
    }
  }

  function confirmClear() {
    if (window.confirm("保存されている診断履歴をすべて削除しますか？この操作は元に戻せません。")) {
      clearHistory();
    }
  }

  return (
    <section className="view history-view" aria-labelledby="history-heading">
      <div className="history-header">
        <div>
          <span className="status-pill">この端末のみ</span>
          <h2 id="history-heading">診断履歴</h2>
          <p>完了した診断の集計結果を、このブラウザ内に最大50件保存します。</p>
        </div>
        <button type="button" className="button button--secondary" onClick={reviewAnswers}>
          診断に戻る
        </button>
      </div>

      <p className="history-privacy-note">
        サーバーへの送信や端末間の同期は行いません。ブラウザのデータを消去すると履歴も削除されます。
      </p>
      {historyError && <p className="storage-notice storage-notice--error">{historyError}</p>}

      {history.length === 0 ? (
        <div className="history-empty">
          <h3>保存された履歴はありません</h3>
          <p>60問版または100問版を最後まで回答すると、結果が自動的に保存されます。</p>
          <button type="button" className="button button--primary" onClick={reviewAnswers}>
            診断を始める
          </button>
        </div>
      ) : (
        <>
          <div className="history-list">
            {history.map((entry) => (
              <article className="history-card" key={entry.id}>
                <div className="history-card__heading">
                  <div>
                    <h3>{entry.testLabel}</h3>
                    <time dateTime={entry.completedAt}>{dateFormatter.format(new Date(entry.completedAt))}</time>
                  </div>
                  <span>{entry.scores.length}因子</span>
                </div>
                <dl className="history-card__scores">
                  {entry.scores.map((score) => (
                    <div key={score.id}>
                      <dt>{score.label}</dt>
                      <dd>{formatScore(score.score)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="history-card__actions">
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() => confirmDelete(entry.id)}
                  >
                    削除
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => viewHistoryEntry(entry.id)}
                  >
                    結果を見る
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="history-footer">
            <button type="button" className="button button--danger" onClick={confirmClear}>
              履歴をすべて削除
            </button>
          </div>
        </>
      )}
    </section>
  );
}
