type AiBinding = {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
};

type Env = {
  AI: AiBinding;
};

type PagesContext = {
  request: Request;
  env: Env;
};

const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const MAX_PROMPT_LENGTH = 24_000;

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getGeneratedText(result: unknown) {
  if (!result || typeof result !== "object") return undefined;
  const value = result as Record<string, unknown>;

  if (typeof value.response === "string") return value.response;

  const choices = Array.isArray(value.choices) ? value.choices : [];
  const first = choices[0];
  if (!first || typeof first !== "object") return undefined;
  const message = (first as Record<string, unknown>).message;
  if (!message || typeof message !== "object") return undefined;
  const content = (message as Record<string, unknown>).content;
  return typeof content === "string" ? content : undefined;
}

export async function onRequestPost({ request, env }: PagesContext) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== requestUrl.origin) {
    return json({ error: "このサイト以外からは生成APIを利用できません。" }, 403);
  }

  if (!env.AI || typeof env.AI.run !== "function") {
    return json({ error: "Workers AI binding（AI）が設定されていません。" }, 503);
  }

  let body: { prompt?: unknown };
  try {
    body = (await request.json()) as { prompt?: unknown };
  } catch {
    return json({ error: "リクエストの形式が正しくありません。" }, 400);
  }

  if (typeof body.prompt !== "string") {
    return json({ error: "プロンプトを入力してください。" }, 400);
  }

  const prompt = body.prompt.trim();
  if (!prompt) return json({ error: "プロンプトを入力してください。" }, 400);
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return json({ error: `プロンプトは${MAX_PROMPT_LENGTH.toLocaleString("ja-JP")}文字以内にしてください。` }, 400);
  }

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        {
          role: "system",
          content:
            "回答は自然な日本語で、最終回答だけを出力してください。内部の思考過程や分析手順は表示しないでください。",
        },
        { role: "user", content: prompt },
      ],
      chat_template_kwargs: {
        enable_thinking: false,
      },
      max_completion_tokens: 1_200,
      temperature: 0.5,
    });
    const content = getGeneratedText(result);

    if (!content) {
      console.error(
        JSON.stringify({
          message: "Workers AI returned no final content",
          model: MODEL,
          responseKeys: result && typeof result === "object" ? Object.keys(result) : [],
        }),
      );
      return json(
        {
          error:
            "AIの応答に本文が含まれていませんでした。生成設定を確認するか、時間をおいて再度お試しください。",
        },
        502,
      );
    }
    return json({ content, model: MODEL });
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Workers AI generation failed",
        model: MODEL,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return json(
      {
        error:
          "無料生成枠の上限、混雑、または一時的なモデルエラーにより生成できませんでした。時間をおいて再度お試しください。",
      },
      503,
    );
  }
}

export function onRequest(context: PagesContext) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({ error: "POSTメソッドを使用してください。" }, 405);
}
