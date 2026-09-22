import { useState } from "react";
import {
  evaluationText,
  evaluationTone,
  formatScore,
} from "../scoring";
import { domainDescription, facetDescription } from "../terminology";
import type { DomainScore, FacetScore } from "../types";

type FactorResultsProps = {
  scores: DomainScore[];
};

type DomainResultProps = {
  domain: DomainScore;
  isOpen: boolean;
  openFacetKey: string | null;
  onToggle: () => void;
  onToggleFacet: (facetKey: string) => void;
};

export function FactorResults({ scores }: FactorResultsProps) {
  const [openDomainId, setOpenDomainId] = useState<string | null>(null);
  const [openFacetKey, setOpenFacetKey] = useState<string | null>(null);

  const toggleDomain = (domainId: string) => {
    setOpenDomainId((current) => (current === domainId ? null : domainId));
    setOpenFacetKey(null);
  };

  const toggleFacet = (facetKey: string) => {
    setOpenFacetKey((current) => (current === facetKey ? null : facetKey));
  };

  return (
    <section className="factor-results" aria-labelledby="factor-results-heading">
      <div className="factor-results__heading">
        <span>診断結果</span>
        <h3 id="factor-results-heading">性格因子パラメータ</h3>
        <p>因子をタップすると、説明とパラメータの構成要素を確認できます。</p>
      </div>
      <div className="factor-accordion">
        {scores.map((domain) => (
          <DomainResult
            key={domain.id}
            domain={domain}
            isOpen={openDomainId === domain.id}
            openFacetKey={openFacetKey}
            onToggle={() => toggleDomain(domain.id)}
            onToggleFacet={toggleFacet}
          />
        ))}
      </div>
    </section>
  );
}

function DomainResult({
  domain,
  isOpen,
  openFacetKey,
  onToggle,
  onToggleFacet,
}: DomainResultProps) {
  const complete = domain.answered === domain.total;
  const panelId = `domain-panel-${domain.id}`;

  return (
    <article className={`factor-accordion__item${isOpen ? " is-open" : ""}`}>
      <h4>
        <button
          type="button"
          className="factor-accordion__trigger"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="factor-accordion__label">{domain.label}</span>
          <span className="factor-accordion__result">
            <strong>{complete ? `${formatScore(domain.score)}/5` : "--/5"}</strong>
            <small className={complete ? `result-tone--${evaluationTone(domain.score, domain.z)}` : undefined}>
              {complete ? evaluationText(domain.score, domain.z) : `${domain.answered}/${domain.total}問`}
            </small>
          </span>
          <i className="accordion-icon" aria-hidden="true" />
        </button>
      </h4>
      <div className="factor-accordion__panel" id={panelId} hidden={!isOpen}>
        <p className="factor-accordion__description">{domainDescription(domain.id)}</p>
        <h5>因子パラメータの構成要素</h5>
        <div className="facet-accordion">
          {domain.facets.map((facet) => {
            const facetKey = `${domain.id}:${facet.id}`;

            return (
              <FacetResult
                key={facet.id}
                domainId={domain.id}
                facet={facet}
                isOpen={openFacetKey === facetKey}
                onToggle={() => onToggleFacet(facetKey)}
              />
            );
          })}
        </div>
      </div>
    </article>
  );
}

function FacetResult({
  domainId,
  facet,
  isOpen,
  onToggle,
}: {
  domainId: string;
  facet: FacetScore;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const complete = facet.answered === facet.total;
  const panelId = `facet-panel-${domainId}-${facet.id}`;

  return (
    <article className={`facet-accordion__item${isOpen ? " is-open" : ""}`}>
      <h6>
        <button
          type="button"
          className="facet-accordion__trigger"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span>{facet.label}</span>
          <span className="facet-accordion__result">
            <strong>{complete ? `${formatScore(facet.score)}/5` : "--/5"}</strong>
            <small className={complete ? `result-tone--${evaluationTone(facet.score, facet.z)}` : undefined}>
              {complete ? evaluationText(facet.score, facet.z) : `${facet.answered}/${facet.total}問`}
            </small>
          </span>
          <i className="accordion-icon accordion-icon--small" aria-hidden="true" />
        </button>
      </h6>
      <div className="facet-accordion__panel" id={panelId} hidden={!isOpen}>
        <p>{facetDescription(facet.id)}</p>
      </div>
    </article>
  );
}
