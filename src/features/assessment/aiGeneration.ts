export type TextGenerationResult = {
  content: string;
  model: string;
};

type GenerateTextOptions = {
  prompt: string;
  signal?: AbortSignal;
};

function isTextGenerationResult(value: unknown): value is TextGenerationResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return typeof result.content === "string" && typeof result.model === "string";
}

export async function generateText({ prompt, signal }: GenerateTextOptions) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      "生成APIから正しい応答を受け取れませんでした。Cloudflare Pages Functionsの設定を確認してください。",
    );
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "生成に失敗しました。時間をおいてもう一度お試しください。";
    throw new Error(message);
  }

  if (!isTextGenerationResult(payload)) {
    throw new Error("生成結果の形式が正しくありません。");
  }

  return payload;
}
