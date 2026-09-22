import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateText } from "../aiGeneration";
import { evaluationText, formatScore } from "../scoring";
import type { DomainScore, GeneratedReport, TextReportCategoryId } from "../types";

type PromptCategoryId = "overall" | "relationship" | "work" | "impression" | "manual";

type PromptCategory = {
  id: PromptCategoryId;
  label: string;
  description: string;
  badge?: string;
};

const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: "overall",
    label: "総合診断",
    description: "性格全体を、強みや注意点まで含めて詳しく分析",
  },
  {
    id: "relationship",
    label: "恋愛・パートナーシップ",
    description: "距離感や愛情表現、すれ違いやすい場面を分析",
  },
  {
    id: "work",
    label: "仕事・適性",
    description: "役割や働き方、力を発揮しやすい環境を分析",
  },
  {
    id: "impression",
    label: "周囲から見たあなた",
    description: "第一印象や、親しくなった後との違いを分析",
  },
  {
    id: "manual",
    label: "あなたの取扱説明書",
    description: "性格を一枚の画像にして、保存・共有しやすく",
    badge: "画像生成",
  },
];

const CATEGORY_REQUESTS: Record<PromptCategoryId, string> = {
  overall: `【今回の分析テーマ：総合診断】
このプロフィールの核となる特徴を、個々のスコアではなく「因子の組み合わせ」として読み解いてください。

次の構成で回答してください。
1. 「ひとことで表すと」：この人らしさが伝わる要約を2〜3文
2. 「性格の中核」：重要度の高い特徴を3つ。各特徴について、根拠となる因子や具体的な特徴と、日常で表れそうな具体例を示す
3. 「強みが活きる場面」：自然に発揮しやすい強みと、それが価値になる状況
4. 「裏目に出るとき」：同じ特徴が弱点として表れる条件や、ストレス時に起こりやすい変化
5. 「合いやすい環境」：人間関係、自由度、刺激量、ルール、ペースの観点から説明
6. 「より自分らしく過ごすヒント」：無理に性格を変えずに試せる、具体的な行動を3つ

最後に、このプロフィールの魅力を表す短い一文を添えてください。`,
  relationship: `【今回の分析テーマ：恋愛・パートナーシップ】
全因子を恋愛に無理やり結び付けず、関係づくりに影響しそうな特徴を選び、因子同士の組み合わせとして読み解いてください。

次の構成で回答してください。
1. 「恋愛での基本スタイル」：関係の始まり方、距離の縮め方、親密さの示し方
2. 「相手が感じやすい魅力」：パートナーから見た長所と、そう考えられる根拠
3. 「安心できる関係」：相手の性格を決めつけず、相性がよくなりやすい関係性・会話・距離感の条件
4. 「すれ違いのパターン」：起こり得る場面を2〜3例挙げ、本人側と相手側の見え方を対比する
5. 「衝突したとき」：取りやすい反応と、関係を修復しやすくする伝え方
6. 「関係を育てるヒント」：明日から実行できる具体的な工夫を3つ

愛着スタイル、恋愛経験、性的指向など、結果から分からないことは推測しないでください。`,
  work: `【今回の分析テーマ：仕事・適性】
職業名との安易なマッチングではなく、成果を出しやすい「役割・進め方・環境」を中心に、全体プロフィールを読み解いてください。

次の構成で回答してください。
1. 「仕事の進め方」：着手、計画、判断、完遂の各場面で表れそうな傾向
2. 「自然に担いやすい役割」：強みが活きる役割を3つ挙げ、スコア上の根拠も説明
3. 「チームでの見え方」：上司・同僚・部下から、それぞれどう見られやすいか
4. 「力を発揮しやすい職場」：裁量、変化、競争、協働、ルール、対人接触の観点から具体化
5. 「消耗しやすい条件」：苦手と決めつけず、負荷が続きやすい状況と対策を説明
6. 「適性の例」：相性が考えられる役割・仕事領域を5つ。名称だけでなく、適性が活きる条件と注意点を添える
7. 「働き方の実験」：現在の仕事や学習で小さく試せる工夫を3つ

採用、昇進、転職などの重要な判断を、この結果だけで勧めないでください。`,
  impression: `【今回の分析テーマ：周囲から見たあなた】
本人の内面を断定するのではなく、行動として外から観察されやすい特徴と、内面とのギャップを中心に読み解いてください。

次の構成で回答してください。
1. 「初対面の印象」：短時間の会話や集団の場で、どう見られやすいか
2. 「親しくなると見える一面」：第一印象から変化しそうな点
3. 「立場別の見え方」：友人、同僚、あまり親しくない人の3者からの印象
4. 「好意的に受け取られやすいところ」：周囲が信頼・魅力として感じやすい特徴
5. 「誤解されやすいところ」：本人の意図と相手の受け取り方を対比した具体例を2〜3個
6. 「伝わり方を整えるヒント」：自分を演じずに誤解を減らす具体的な工夫を3つ

見た目、年齢、性別、社会的立場など、診断結果にない属性は推測しないでください。`,
  manual: `【今回の制作テーマ：あなたの取扱説明書】
以下の性格診断結果をもとに、SNSで保存・共有したくなる「わたしの取扱説明書」の画像を1枚作成してください。
分析文、制作意図、画像案の説明は出力せず、完成画像だけを提示してください。

【基本方針】
- 1080×1350px相当、縦長4:5の日本語インフォグラフィック
- タイトルは「わたしの取扱説明書」
- 一般的なカード型インフォグラフィックではなく、上質な「パーソナル診断レポート」「プロフィールレポート」のようなデザイン
- ライフスタイル誌、カルチャー誌、ビジネス誌、ブランドの診断コンテンツのような、特定の性別に偏らない清潔感と編集感のあるレイアウト
- 特定の作品を再現せず、情報が整理された診断レポートというデザインジャンルのみを参考にする
- 大小の情報ブロックを組み合わせ、単調な5段カード構成にはしない
- 余白を十分に使いながら、1枚の中に情報量とメリハリを持たせる

【配色・デザイン】
- スマートフォンで読める大きさの日本語を使い、見出し・本文・数値の情報階層を明確にする
- 日本語を中心とし、意味のない英語装飾や過剰なイラストは入れない
- 必要に応じて、細い罫線、控えめな図形、シンプルな線画アイコンを使用する

【人物ペルソナの扱い】
- タイトルの「わたし」は性別を示さない一人称であり、必ず女性を意味するわけではありません
- 若い女性、長い髪、メイク、女性的な服装を無意識のデフォルトにしない。男性的、中性的、女性的な表現やさまざまな年代を等しく候補にし、固定化された人物像への偏りを避ける
- ペルソナは診断された本人の再現ではなく、性格の雰囲気を視覚化する象徴的な架空人物として扱う
- 実在人物、著名人、既存キャラクターの容姿は再現しない

【数値の扱い】
- 診断で実際に得られた因子スコアは掲載してよい
- 掲載するときは小数第1位に丸め、「3.0 / 5」のように控えめに表示する
- 存在しない総合点、偏差値、順位、パーセンタイル、割合は作らない
- 数値は人格の良し悪しではなく「傾向の目安」として扱う
- 数値だけで終わらず、日常でどのように表れやすいかを必ず文章でも示す
- 個々の特徴の数値は画像内に羅列せず、文章を考えるための根拠として使用する

【プロフィールサマリー】
- 主要6因子をコンパクトにまとめたエリアを作る
- 診断結果に利他性がある場合は、主要6因子とは分けて補足指標として小さく配置する
- 数値は小さめに表示し、横棒、ドット、目盛りなどで視覚的に整理してよい
- グラフを画面の主役にはしない

【メインコピー】
- 因子同士の組み合わせから、その人らしさを表す短いコピーを作る
- 大きめの文字で、1〜2行に収める
- 「今回の回答から見える傾向」として表現し、人格を断定しない

【掲載する5項目】
1. 「基本性格」：全体像と、場面によって表れ方が変わる特徴
2. 「得意なこと」：自然に発揮しやすい強みと、それが活きる場面
3. 「苦手なこと」：能力の否定ではなく、ペースを乱したり消耗したりしやすい条件
4. 「接し方のコツ」：周囲に知ってもらえると、本人が力を出しやすくなる関わり方
5. 「ご機嫌になる条件」：気持ちや集中力を回復しやすい時間、環境、声のかけ方

各項目は、見出しと2〜3文の読みやすい本文で構成してください。因子名の言い換えではなく、仕事、人付き合い、休日、考え事などの日常場面に結び付けてください。

【表現上の注意】
- 診断結果だけで人格や将来を断定しない
- 「あなたは絶対に〜」などの固定的な表現を避ける
- 長所と短所を固定せず、状況によって表れ方が変わることを前提にする
- 医療・心理上の診断を思わせる表現は使わない
- 過度な称賛、説教、人格を傷つける表現は避ける
- 日本語の誤字、脱字、文字化けがないよう、生成前に表記を確認する

【仕上がり】
一目で「自分の特徴」がつかめ、少し読み込むと「日常での扱い方」まで分かる構成にしてください。診断結果のスクリーンショットではなく、編集された上質なパーソナルレポートとして完成させてください。`,
};

const INTERPRETATION_GUIDE = `【分析の品質基準】
- 高低だけを順番に説明せず、目立つ因子、平均付近の因子、因子内の特徴のばらつきを比較してください。
- 一見矛盾するスコアがあれば、矛盾として処理せず「状況によって切り替わる特徴」として解釈してください。
- 各解釈には、根拠となる因子または具体的な特徴を自然な形で示してください。
- 誰にでも当てはまる曖昧な表現を避け、このスコア構成だから言える内容を優先してください。
- 平均付近の値を無理に特徴づけず、極端な値も善悪で評価しないでください。
- 診断結果は傾向を示す参考情報として扱い、「〜の可能性があります」「〜しやすいかもしれません」など適切な確度で表現してください。
- 数値の復唱は最小限にし、行動、場面、周囲との関わり方へ翻訳してください。`;

type AiPromptBuilderProps = {
  resultId: string | null;
  testLabel: string;
  scores: DomainScore[];
  savedReports: Partial<Record<TextReportCategoryId, GeneratedReport>>;
  onSaveReport: (category: TextReportCategoryId, report: GeneratedReport) => boolean;
  reportStorage: "saved" | "memory";
};

function isTextReportCategory(category: PromptCategoryId): category is TextReportCategoryId {
  return category !== "manual";
}

function scoreSummary(domain: DomainScore) {
  const facets = domain.facets
    .filter((facet) => facet.answered === facet.total)
    .map(
      (facet) =>
        `  - ${facet.label}: ${formatScore(facet.score)} / 5（${evaluationText(facet.score, facet.z)}）`,
    )
    .join("\n");

  return `- ${domain.label}: ${formatScore(domain.score)} / 5（${evaluationText(domain.score, domain.z)}）${
    facets ? `\n${facets}` : ""
  }`;
}

function buildPrompt(category: PromptCategoryId, testLabel: string, scores: DomainScore[]) {
  const resultText = scores.map(scoreSummary).join("\n");

  return `あなたは、HEXACO性格モデルに精通し、統計的な結果を日常の行動へ丁寧に翻訳できる性格分析の専門家です。
以下は私の${testLabel}の結果です。スコアは1〜5の平均値で、括弧内は基準値と比較した評価です。

${CATEGORY_REQUESTS[category]}

${INTERPRETATION_GUIDE}

【回答上の注意】
- 医療・心理上の診断ではありません。人格、能力、将来を断定しないでください。
- 長所と短所を固定せず、同じ特徴が状況によって異なる形で表れることを考慮してください。
- 専門用語に頼らず、本人が納得できる自然で具体的な日本語を使ってください。
- 診断結果から判断できない属性や経験は推測しないでください。

【診断結果：全因子とその内訳】
${resultText}`;
}

export function AiPromptBuilder({
  resultId,
  testLabel,
  scores,
  savedReports,
  onSaveReport,
  reportStorage,
}: AiPromptBuilderProps) {
  const [category, setCategory] = useState<PromptCategoryId>("overall");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [generationState, setGenerationState] = useState<"idle" | "loading" | "success" | "error">(
    savedReports.overall ? "success" : "idle",
  );
  const [generationResult, setGenerationResult] = useState<GeneratedReport | null>(
    savedReports.overall ?? null,
  );
  const [generationError, setGenerationError] = useState("");
  const [storageError, setStorageError] = useState("");
  const generationAbortRef = useRef<AbortController | null>(null);

  const prompt = useMemo(
    () => buildPrompt(category, testLabel, scores),
    [category, scores, testLabel],
  );
  const supportsGeneration = isTextReportCategory(category);
  const selectedCategory = PROMPT_CATEGORIES.find((item) => item.id === category) ?? PROMPT_CATEGORIES[0];
  const savedReport = supportsGeneration ? savedReports[category] : undefined;

  useEffect(() => {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setGenerationResult(savedReport ?? null);
    setGenerationState(savedReport ? "success" : "idle");
    setGenerationError("");
    setStorageError("");
  }, [category, resultId]);

  useEffect(
    () => () => {
      generationAbortRef.current?.abort();
    },
    [],
  );

  function resetGeneration() {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setGenerationState("idle");
    setGenerationResult(null);
    setGenerationError("");
    setStorageError("");
  }

  function chooseCategory(nextCategory: PromptCategoryId) {
    setCategory(nextCategory);
    setCopyState("idle");
    resetGeneration();
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand("copy");
      textArea.remove();
      return copied;
    }
  }

  async function copyPrompt() {
    setCopyState((await copyText(prompt)) ? "copied" : "failed");
  }

  async function generateReport() {
    if (!isTextReportCategory(category) || generationState === "loading") return;

    generationAbortRef.current?.abort();
    const controller = new AbortController();
    generationAbortRef.current = controller;
    setGenerationState("loading");
    setGenerationError("");
    setStorageError("");

    try {
      const result = await generateText({ prompt, signal: controller.signal });
      const report: GeneratedReport = {
        ...result,
        generatedAt: new Date().toISOString(),
      };
      setGenerationResult(report);
      setGenerationState("success");
      if (!onSaveReport(category, report)) {
        setStorageError(
          "生成結果をローカルストレージに保存できませんでした。ブラウザの設定または空き容量を確認してください。",
        );
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setGenerationError(error instanceof Error ? error.message : "生成に失敗しました。");
      setGenerationState("error");
    } finally {
      if (generationAbortRef.current === controller) generationAbortRef.current = null;
    }
  }

  return (
    <section className="ai-prompt" aria-labelledby="ai-prompt-heading">
      <div className="ai-prompt__intro">
        <span className="ai-prompt__eyebrow">AIでもっとわかりやすく</span>
        <h3 id="ai-prompt-heading">診断結果に基づいてAIレポートを作る</h3>
        <p>知りたいテーマを選ぶと、分析してAIレポートを作れます。</p>
      </div>

      <div className="prompt-step">
        <div className="prompt-step__heading">
          <span>1</span>
          <div>
            <h4>レポートのテーマを選ぶ</h4>
            <p>詳しく知りたいテーマを選んでください。</p>
          </div>
        </div>
        <div className="prompt-categories" role="radiogroup" aria-label="分析テーマ">
          {PROMPT_CATEGORIES.map((item) => (
            <button
              type="button"
              role="radio"
              aria-checked={category === item.id}
              className={`prompt-category${category === item.id ? " is-selected" : ""}`}
              key={item.id}
              onClick={() => chooseCategory(item.id)}
            >
              <span className="prompt-category__topline">
                <strong>{item.label}</strong>
                {item.badge && <small>{item.badge}</small>}
              </span>
              <span>{item.description}</span>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className={`prompt-step prompt-step--action${supportsGeneration ? "" : " prompt-step--image"}`}>
        <div className="prompt-step__heading">
          <span>2</span>
          <div>
            <h4>{supportsGeneration ? "このテーマでAIレポートを作る" : "取扱説明書を作る準備"}</h4>
            <p>
              {supportsGeneration
                ? "診断結果を組み合わせて、あなただけのレポートを作ります。"
                : "AIに貼り付ける画像生成用の依頼文をコピーします。"}
            </p>
          </div>
        </div>

        <div className="prompt-selected-theme" aria-label="選択中のテーマ">
          <span>選択中</span>
          <div>
            <strong>{selectedCategory.label}</strong>
            <small>{selectedCategory.description}</small>
          </div>
        </div>

        {supportsGeneration ? (
          <>
            <button
              type="button"
              className="prompt-generate-button"
              disabled={generationState === "loading"}
              onClick={generateReport}
            >
              <span aria-hidden="true">✦</span>
              {generationState === "loading"
                ? "レポートを作成しています…"
                : generationResult
                  ? "AIレポートを再生成"
                  : "AIレポートを生成"}
            </button>

            <div className="generation-status" aria-live="polite" aria-busy={generationState === "loading"}>
              {generationState === "loading" && (
                <div className="generation-status__loading" role="status">
                  <div className="generation-status__visual" aria-hidden="true">
                    <span className="generation-status__orbit generation-status__orbit--outer" />
                    <span className="generation-status__orbit generation-status__orbit--inner" />
                    <span className="generation-status__node generation-status__node--one" />
                    <span className="generation-status__node generation-status__node--two" />
                    <span className="generation-status__node generation-status__node--three" />
                    <span className="generation-status__spark">✦</span>
                  </div>
                  <div className="generation-status__content">
                    <span className="generation-status__eyebrow">
                      <i aria-hidden="true" />
                      AI ANALYSIS
                    </span>
                    <strong>{selectedCategory.label}のレポートを構成しています</strong>
                    <p>複数のスコアを照らし合わせ、特徴の組み合わせを日常の言葉に変換しています。</p>
                    <div className="generation-status__signal" aria-hidden="true">
                      <i /><i /><i /><i /><i /><i /><i />
                    </div>
                    <div className="generation-status__progress" aria-hidden="true">
                      <span />
                    </div>
                    <div className="generation-status__steps" aria-hidden="true">
                      <span>因子を比較</span>
                      <span>特徴を統合</span>
                      <span>文章を構成</span>
                    </div>
                    <small>この画面を開いたままお待ちください。完了すると自動で表示されます。</small>
                  </div>
                </div>
              )}
              {generationState === "error" && (
                <div className="generation-status__error" role="alert">
                  <p>{generationError}</p>
                  <button type="button" onClick={generateReport}>
                    もう一度試す
                  </button>
                </div>
              )}
              {generationResult && (
                <article className="generation-result">
                  <div className="generation-result__header">
                    <div>
                      <strong>生成結果</strong>
                      <small>
                        作成日時：
                        {new Intl.DateTimeFormat("ja-JP", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(generationResult.generatedAt))}
                      </small>
                    </div>
                    {!storageError && (
                      <span className="generation-result__saved">
                        {reportStorage === "saved" ? "ローカルストレージ保存済み" : "この画面で一時保持中"}
                      </span>
                    )}
                  </div>
                  <div className="generation-result__body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {generationResult.content}
                    </ReactMarkdown>
                  </div>
                </article>
              )}
              {storageError && (
                <p className="generation-result__storage-error" role="alert">
                  {storageError}
                </p>
              )}
            </div>

            <details className="prompt-preview">
              <summary>
                <span>詳しいプロンプトを見る</span>
                <small>外部のAIでも利用できます</small>
              </summary>
              <pre>{prompt}</pre>
              <div className="prompt-preview__footer">
                <button
                  type="button"
                  className={`prompt-copy-button prompt-copy-button--secondary${copyState === "copied" ? " is-copied" : ""}`}
                  onClick={copyPrompt}
                >
                  <span aria-hidden="true">{copyState === "copied" ? "✓" : "□"}</span>
                  {copyState === "copied" ? "コピーしました" : "プロンプトをコピー"}
                </button>
                <p className="prompt-copy-status" aria-live="polite">
                  {copyState === "copied" && "お使いのAIに、そのまま貼り付けて利用できます。"}
                  {copyState === "failed" && "コピーできませんでした。上の内容を手動でコピーしてください。"}
                </p>
              </div>
            </details>
          </>
        ) : (
          <>
            <div className="prompt-image-guide">
              <strong>画像は外部のAIサービスを使って作成します</strong>
              <p>下のボタンで依頼文をコピーし、お使いのChatGPTもしくはGeminiに貼り付けてください。</p>
            </div>
            <button
              type="button"
              className={`prompt-copy-button${copyState === "copied" ? " is-copied" : ""}`}
              onClick={copyPrompt}
            >
              <span aria-hidden="true">{copyState === "copied" ? "✓" : "□"}</span>
              {copyState === "copied" ? "コピーしました" : "画像作成用の依頼文をコピー"}
            </button>
            <p className="prompt-copy-status" aria-live="polite">
              {copyState === "copied" && "お使いのAIサービスを開いて、そのまま貼り付けてください。"}
              {copyState === "failed" && "コピーできませんでした。内容を開いて手動でコピーしてください。"}
            </p>
            <details className="prompt-preview prompt-preview--image">
              <summary>
                <span>詳しいプロンプトを見る</span>
              </summary>
              <pre>{prompt}</pre>
            </details>
          </>
        )}
      </div>

      {supportsGeneration ? (
        <p className="ai-prompt__note">
          「AIレポートを生成」を押したときだけ、診断スコアを文章生成AIへ送信します。氏名や個々の質問への回答は含まれません。
        </p>
      ) : (
        <p className="ai-prompt__note">
          このアプリから画像生成AIへデータは送信しません。コピー後は、利用するAIサービスのデータ取り扱いをご確認ください。
        </p>
      )}
    </section>
  );
}
