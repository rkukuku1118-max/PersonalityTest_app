import { TESTS, type TestDefinition, type TestId } from "../../data/tests";
import type { DomainScore } from "./types";

export const SHARE_FORMAT_VERSION = 2;
export const SCORING_VERSION = "hexaco-ja-1";
export const MAX_SHARE_PAYLOAD_LENGTH = 6_000;
export const MAX_SHARE_URL_LENGTH = 8_000;

const LEGACY_SHARE_FORMAT_VERSION = 1;
const SCORING_VERSION_CODE = 1;

type ScoreMap = Record<string, number>;

type LegacySharePayload = {
  v: typeof LEGACY_SHARE_FORMAT_VERSION;
  test: TestId;
  scoring: typeof SCORING_VERSION;
  scores: ScoreMap;
  facets: ScoreMap;
};

export type SharePayload = {
  v: typeof SHARE_FORMAT_VERSION;
  t: 60 | 100;
  s: typeof SCORING_VERSION_CODE;
  x: number[];
};

type SupportedSharePayload = LegacySharePayload | SharePayload;

type DecodedPayload = {
  formatVersion: 1 | 2;
  test: TestId;
  scoring: typeof SCORING_VERSION;
  scores: ScoreMap;
  facets: ScoreMap;
};

export type SharedResult = {
  payload: SupportedSharePayload;
  canonicalPayload: string;
  fingerprint: string;
  testId: TestId;
  scoringVersion: typeof SCORING_VERSION;
  scores: DomainScore[];
};

export type ShareParseResult =
  | { kind: "none" }
  | { kind: "valid"; result: SharedResult }
  | { kind: "invalid" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(record: Record<string, unknown>, allowedKeys: string[]) {
  const keys = Object.keys(record);
  return keys.length === allowedKeys.length && keys.every((key) => allowedKeys.includes(key));
}

function expectedIds(test: TestDefinition) {
  return {
    domains: test.domains.map((domain) => domain.id),
    facets: test.domains.flatMap((domain) => domain.facets.map((facet) => facet.id)),
  };
}

function isEncodedScore(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 500;
}

function isScoreMap(value: unknown, ids: string[]): value is ScoreMap {
  if (!isRecord(value) || !hasOnlyKeys(value, ids)) return false;
  return ids.every((id) => isEncodedScore(value[id]));
}

function validateLegacyPayload(value: Record<string, unknown>) {
  if (!hasOnlyKeys(value, ["v", "test", "scoring", "scores", "facets"])) return null;
  if (
    value.v !== LEGACY_SHARE_FORMAT_VERSION ||
    (value.test !== "60" && value.test !== "100") ||
    value.scoring !== SCORING_VERSION
  ) {
    return null;
  }

  const ids = expectedIds(TESTS[value.test]);
  if (!isScoreMap(value.scores, ids.domains) || !isScoreMap(value.facets, ids.facets)) {
    return null;
  }

  const payload: LegacySharePayload = {
    v: LEGACY_SHARE_FORMAT_VERSION,
    test: value.test,
    scoring: SCORING_VERSION,
    scores: value.scores,
    facets: value.facets,
  };
  const decoded: DecodedPayload = {
    formatVersion: LEGACY_SHARE_FORMAT_VERSION,
    test: payload.test,
    scoring: payload.scoring,
    scores: payload.scores,
    facets: payload.facets,
  };
  return { payload, decoded };
}

function validateCompactPayload(value: Record<string, unknown>) {
  if (!hasOnlyKeys(value, ["v", "t", "s", "x"])) return null;
  if (
    value.v !== SHARE_FORMAT_VERSION ||
    (value.t !== 60 && value.t !== 100) ||
    value.s !== SCORING_VERSION_CODE ||
    !Array.isArray(value.x)
  ) {
    return null;
  }

  const testId: TestId = String(value.t) as TestId;
  const ids = expectedIds(TESTS[testId]);
  if (value.x.length !== ids.domains.length + ids.facets.length || !value.x.every(isEncodedScore)) {
    return null;
  }

  const payload: SharePayload = {
    v: SHARE_FORMAT_VERSION,
    t: value.t,
    s: SCORING_VERSION_CODE,
    x: [...value.x],
  };
  const decoded: DecodedPayload = {
    formatVersion: SHARE_FORMAT_VERSION,
    test: testId,
    scoring: SCORING_VERSION,
    scores: Object.fromEntries(ids.domains.map((id, index) => [id, payload.x[index]])),
    facets: Object.fromEntries(
      ids.facets.map((id, index) => [id, payload.x[ids.domains.length + index]]),
    ),
  };
  return { payload, decoded };
}

function validatePayload(value: unknown) {
  if (!isRecord(value)) return null;
  if (value.v === LEGACY_SHARE_FORMAT_VERSION) return validateLegacyPayload(value);
  if (value.v === SHARE_FORMAT_VERSION) return validateCompactPayload(value);
  return null;
}

function canonicalizePayload(payload: SupportedSharePayload) {
  if (payload.v === LEGACY_SHARE_FORMAT_VERSION) {
    const ids = expectedIds(TESTS[payload.test]);
    return JSON.stringify({
      v: payload.v,
      test: payload.test,
      scoring: payload.scoring,
      scores: Object.fromEntries(ids.domains.map((id) => [id, payload.scores[id]])),
      facets: Object.fromEntries(ids.facets.map((id) => [id, payload.facets[id]])),
    });
  }
  return JSON.stringify({ v: payload.v, t: payload.t, s: payload.s, x: payload.x });
}

function encodeBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error("Invalid Base64URL");
  const remainder = value.length % 4;
  if (remainder === 1) throw new Error("Invalid Base64URL length");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - remainder) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function scoreToInteger(score: number) {
  return Math.max(100, Math.min(500, Math.round(score * 100)));
}

function fingerprint(canonicalPayload: string, formatVersion: 1 | 2) {
  let hash = 0xcbf29ce484222325n;
  const bytes = new TextEncoder().encode(canonicalPayload);
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `share-v${formatVersion}-${hash.toString(16).padStart(16, "0")}`;
}

function restoreScores(payload: DecodedPayload): DomainScore[] {
  const test = TESTS[payload.test];
  return test.domains.map((domain) => {
    const domainScore = payload.scores[domain.id] / 100;
    const domainNorm = test.norms.domains[domain.id];
    const facets = domain.facets.map((facet) => {
      const score = payload.facets[facet.id] / 100;
      const norm = test.norms.facets[facet.id];
      return {
        id: facet.id,
        label: facet.label,
        score,
        answered: facet.items.length,
        total: facet.items.length,
        norm,
        z: norm ? (score - norm.mean) / norm.sd : undefined,
      };
    });
    const total = domain.facets.reduce((count, facet) => count + facet.items.length, 0);
    return {
      id: domain.id,
      label: domain.label,
      score: domainScore,
      answered: total,
      total,
      norm: domainNorm,
      z: domainNorm ? (domainScore - domainNorm.mean) / domainNorm.sd : undefined,
      facets,
    };
  });
}

export function createSharePayload(testId: TestId, scores: DomainScore[]): SharePayload {
  const test = TESTS[testId];
  const domainScores = new Map(scores.map((score) => [score.id, score]));
  function requireScore(id: string, score: number | undefined) {
    if (score === undefined || !Number.isFinite(score) || score < 1 || score > 5) {
      throw new Error(`共有対象のスコアが不足しています: ${id}`);
    }
    return scoreToInteger(score);
  }

  const encodedScores = test.domains.map((domain) =>
    requireScore(domain.id, domainScores.get(domain.id)?.score),
  );
  for (const domain of test.domains) {
    const facets = new Map(
      (domainScores.get(domain.id)?.facets ?? []).map((facet) => [facet.id, facet]),
    );
    encodedScores.push(
      ...domain.facets.map((facet) => requireScore(facet.id, facets.get(facet.id)?.score)),
    );
  }

  return {
    v: SHARE_FORMAT_VERSION,
    t: Number(testId) as 60 | 100,
    s: SCORING_VERSION_CODE,
    x: encodedScores,
  };
}

export function createShareUrl(baseUrl: string, testId: TestId, scores: DomainScore[]) {
  const canonicalPayload = canonicalizePayload(createSharePayload(testId, scores));
  const encoded = encodeBase64Url(canonicalPayload);
  const url = `${baseUrl.split("#", 1)[0]}#share=${encoded}`;
  if (encoded.length > MAX_SHARE_PAYLOAD_LENGTH || url.length > MAX_SHARE_URL_LENGTH) {
    throw new Error("共有リンクが想定サイズを超えています。");
  }
  return url;
}

export function parseShareHash(hash: string, fullUrlLength: number): ShareParseResult {
  if (!hash.startsWith("#share=")) return { kind: "none" };
  const encoded = hash.slice("#share=".length);
  if (
    encoded.length === 0 ||
    encoded.length > MAX_SHARE_PAYLOAD_LENGTH ||
    fullUrlLength > MAX_SHARE_URL_LENGTH
  ) {
    return { kind: "invalid" };
  }

  try {
    const validated = validatePayload(JSON.parse(decodeBase64Url(encoded)));
    if (!validated) return { kind: "invalid" };
    const canonicalPayload = canonicalizePayload(validated.payload);
    return {
      kind: "valid",
      result: {
        payload: validated.payload,
        canonicalPayload,
        fingerprint: fingerprint(canonicalPayload, validated.decoded.formatVersion),
        testId: validated.decoded.test,
        scoringVersion: validated.decoded.scoring,
        scores: restoreScores(validated.decoded),
      },
    };
  } catch {
    return { kind: "invalid" };
  }
}
