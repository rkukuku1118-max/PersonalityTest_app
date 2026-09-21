import {
  evaluationText,
  evaluationTone,
  formatScore,
  scorePercent,
  scoreProgress,
} from "../scoring";
import type { DomainScore, FacetScore } from "../types";

type DomainScoreCardProps = {
  domain: DomainScore;
};

type ScoreOverviewProps = {
  scores: DomainScore[];
};

export function ScoreOverview({ scores }: ScoreOverviewProps) {
  return (
    <section className="score-overview" aria-labelledby="score-overview-heading">
      <div className="score-overview__heading">
        <div>
          <span>まずは全体を確認</span>
          <h3 id="score-overview-heading">あなたの性格因子のスコア</h3>
          <p>因子ごとの平均です。詳しい内訳は下で確認できます。</p>
        </div>
        <a href="#score-details">詳しい内訳を見る</a>
      </div>

      <div className="score-overview__grid">
        {scores.map((domain) => {
          const complete = domain.answered === domain.total;

          return (
            <article className="score-overview__item" key={domain.id}>
              <div className="score-overview__item-header">
                <strong>{domain.label}</strong>
                <span>{complete ? formatScore(domain.score) : "--"}<small> / 5</small></span>
              </div>
              <ScoreBar score={domain.score} complete={complete} />
              <small className={`score-overview__evaluation score-overview__evaluation--${evaluationTone(domain.score, domain.z)}`}>
                {complete ? evaluationText(domain.score, domain.z) : `${domain.answered}/${domain.total}問に回答`}
              </small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function DomainScoreCard({ domain }: DomainScoreCardProps) {
  const complete = domain.answered === domain.total;

  return (
    <details className="domain-card">
      <summary className="domain-card__header">
        <div>
          <h4>{domain.label}</h4>
          <span>{scoreProgress(domain.answered, domain.total, domain.z)}</span>
        </div>
        <div className="domain-card__summary-score">
          <strong>{complete ? formatScore(domain.score) : "--"}</strong>
          <i aria-hidden="true" />
        </div>
      </summary>
      <div className="domain-card__details">
        <ScoreBar score={domain.score} complete={complete} />
        <div className="facet-list" aria-label={`${domain.label}の下位尺度`}>
          {domain.facets.map((facet) => (
            <FacetScoreRow key={facet.id} facet={facet} />
          ))}
        </div>
      </div>
    </details>
  );
}

function FacetScoreRow({ facet }: { facet: FacetScore }) {
  const complete = facet.answered === facet.total;

  return (
    <article className="facet-score">
      <div className="facet-score__header">
        <span>{facet.label}</span>
        <strong>{complete ? formatScore(facet.score) : "--"}</strong>
      </div>
      <ScoreBar score={facet.score} complete={complete} />
      <div className="facet-score__meta">
        {complete ? (
          <span className={`score-label score-label--${evaluationTone(facet.score, facet.z)}`}>
            評価: {evaluationText(facet.score, facet.z)}
          </span>
        ) : (
          <small>回答: {facet.answered}/{facet.total}</small>
        )}
      </div>
    </article>
  );
}

function ScoreBar({ score, complete }: { score: number; complete: boolean }) {
  return (
    <div className="score-bar" aria-hidden="true">
      <span style={{ width: `${complete ? scorePercent(score) : 0}%` }} />
    </div>
  );
}
