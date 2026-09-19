import type { AssessmentController } from "../useAssessment";
import { AiPromptBuilder } from "./AiPromptBuilder";
import { DomainScoreCard } from "./ScoreCards";

type ResultsScreenProps = {
  assessment: AssessmentController;
};

export function ResultsScreen({ assessment }: ResultsScreenProps) {
  const { activeTest, scores, completeDomainCount, reviewAnswers, resetAssessment } = assessment;

  return (
    <section className="view results-view" aria-labelledby="results-heading">
      <div className="results-header">
        <div>
          <span className="status-pill">集計完了</span>
          <h2 id="results-heading">診断結果</h2>
          <p>{activeTest.label}の因子と下位尺度の5段階平均です。</p>
        </div>
        <div className="results-header__completion" aria-label={`${completeDomainCount}因子を集計`}>
          <strong>{completeDomainCount}</strong>
          <span>/ {scores.length} 因子</span>
        </div>
      </div>

      <AiPromptBuilder testLabel={activeTest.label} scores={scores} />

      <section className="results-list" aria-label="因子と下位尺度のスコア">
        <h3>因子と下位尺度</h3>
        <div className="results-list__grid">
          {scores.map((domain) => (
            <DomainScoreCard key={domain.id} domain={domain} />
          ))}
        </div>
      </section>

      <div className="results-view__actions">
        <button type="button" className="button button--secondary" onClick={reviewAnswers}>
          回答を見直す
        </button>
        <button type="button" className="button button--primary" onClick={resetAssessment}>
          もう一度診断する
        </button>
      </div>

      <p className="source-note">
        質問文と採点情報は変換済みJSONを参照しています。心理・医療上の診断ではありません。
      </p>
    </section>
  );
}
