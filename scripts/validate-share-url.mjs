import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import ts from "typescript";

const definitions = JSON.parse(readFileSync("src/data/test-definitions.json", "utf8"));
const source = readFileSync("src/features/assessment/shareUrl.ts", "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const executableSource = transpiled.outputText.replace(
  /import \{ TESTS \} from "\.\.\/\.\.\/data\/tests";/u,
  `const TESTS = ${JSON.stringify(definitions)};`,
);
assert.ok(!executableSource.includes('from "../../data/tests"'));
const moduleUrl = `data:text/javascript;base64,${Buffer.from(executableSource).toString("base64")}`;
const {
  MAX_SHARE_PAYLOAD_LENGTH,
  MAX_SHARE_URL_LENGTH,
  SCORING_VERSION,
  SHARE_FORMAT_VERSION,
  createShareUrl,
  parseShareHash,
} = await import(moduleUrl);

function sampleScores(testId) {
  return definitions[testId].domains.map((domain, domainIndex) => ({
    id: domain.id,
    score: 3 + domainIndex / 10,
    facets: domain.facets.map((facet, facetIndex) => ({
      id: facet.id,
      score: 2.5 + facetIndex / 10,
    })),
  }));
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function legacyPayload(testId) {
  const scores = sampleScores(testId);
  return {
    v: 1,
    test: testId,
    scoring: SCORING_VERSION,
    scores: Object.fromEntries(scores.map((domain) => [domain.id, Math.round(domain.score * 100)])),
    facets: Object.fromEntries(
      scores.flatMap((domain) =>
        domain.facets.map((facet) => [facet.id, Math.round(facet.score * 100)]),
      ),
    ),
  };
}

for (const testId of ["60", "100"]) {
  const url = createShareUrl("https://example.com/path?mode=test#old", testId, sampleScores(testId));
  assert.ok(url.length <= MAX_SHARE_URL_LENGTH);
  const hash = new URL(url).hash;
  assert.ok(hash.slice("#share=".length).length < 250);
  assert.ok(hash.slice("#share=".length).length <= MAX_SHARE_PAYLOAD_LENGTH);
  const parsed = parseShareHash(hash, url.length);
  assert.equal(parsed.kind, "valid");
  assert.equal(parsed.result.testId, testId);
  assert.equal(parsed.result.scoringVersion, SCORING_VERSION);
  assert.equal(parsed.result.payload.v, SHARE_FORMAT_VERSION);
  assert.equal(parsed.result.scores[0].score, 3);
  assert.equal(parseShareHash(hash, url.length).result.fingerprint, parsed.result.fingerprint);
  const payload = JSON.parse(Buffer.from(hash.slice("#share=".length), "base64url").toString("utf8"));
  assert.deepEqual(Object.keys(payload), ["v", "t", "s", "x"]);
  assert.equal("answers" in payload, false);
  assert.equal("reports" in payload, false);
  assert.deepEqual(parseShareHash(hash, MAX_SHARE_URL_LENGTH + 1), { kind: "invalid" });
  payload.x[0] = 501;
  assert.deepEqual(parseShareHash(`#share=${encodePayload(payload)}`, 500), { kind: "invalid" });

  const legacy = parseShareHash(`#share=${encodePayload(legacyPayload(testId))}`, 1_000);
  assert.equal(legacy.kind, "valid");
  assert.equal(legacy.result.payload.v, 1);
  assert.equal(legacy.result.testId, testId);
  assert.equal(legacy.result.scores[0].score, 3);
  assert.match(legacy.result.fingerprint, /^share-v1-/u);
}

assert.deepEqual(parseShareHash("", 20), { kind: "none" });
assert.deepEqual(parseShareHash("#share=<script>", 30), { kind: "invalid" });
assert.deepEqual(parseShareHash(`#share=${"a".repeat(MAX_SHARE_PAYLOAD_LENGTH + 1)}`, 30), {
  kind: "invalid",
});

const incompletePayload = {
  v: 1,
  test: "60",
  scoring: SCORING_VERSION,
  scores: { honesty: 319 },
  facets: {},
};
assert.deepEqual(parseShareHash(`#share=${encodePayload(incompletePayload)}`, 500), {
  kind: "invalid",
});

const unsupportedPayload = { ...incompletePayload, scoring: "hexaco-ja-999" };
assert.deepEqual(parseShareHash(`#share=${encodePayload(unsupportedPayload)}`, 500), {
  kind: "invalid",
});

const invalidCompactPayload = { v: 2, t: 60, s: 999, x: Array(30).fill(300) };
assert.deepEqual(parseShareHash(`#share=${encodePayload(invalidCompactPayload)}`, 500), {
  kind: "invalid",
});

console.log("Share URL v2 validation and v1 compatibility checks passed.");
