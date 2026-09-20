import { onRequest } from "../functions/api/generate";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate") {
      const clientKey = request.headers.get("CF-Connecting-IP") ?? "unknown-client";
      const { success } = await env.AI_RATE_LIMITER.limit({ key: `ai:${clientKey}` });
      if (!success) {
        return Response.json(
          { error: "短時間の生成回数が上限に達しました。1分ほど待ってから再度お試しください。" },
          {
            status: 429,
            headers: {
              "Cache-Control": "no-store",
              "Retry-After": "60",
              "X-Content-Type-Options": "nosniff",
            },
          },
        );
      }

      return onRequest({ request, env });
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        { error: "APIエンドポイントが見つかりません。" },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }

    return env.ASSETS.fetch(request);
  },
};
