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

export function DomainScoreCard({ domain }: DomainScoreCardProps) {
  const complete = domain.answered === domain.total;

  return (
    <article className="domain-card">
      <div className="domain-card__header">
        <div>
          <h4>{domain.label}</h4>
          <span>{scoreProgress(domain.answered, domain.total, domain.z)}</span>
        </div>
        <strong>{complete ? formatScore(domain.score) : "--"}</strong>
      </div>
      <ScoreBar score={domain.score} complete={complete} />
      <div className="facet-list" aria-label={`${domain.label}の下位尺度`}>
        {domain.facets.map((facet) => (
          <FacetScoreRow key={facet.id} facet={facet} />
        ))}
      </div>
    </article>
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
