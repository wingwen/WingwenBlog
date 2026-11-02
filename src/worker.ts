/**
 * Cloudflare Worker 入口。
 *
 * 项目在控制台里是 Worker（不是 Pages），所以静态站点与 /api/chat 由同一个 Worker 承担：
 * 除 /api/chat 之外的请求全部交给静态资源绑定（ASSETS），聊天请求交给平台无关的 handleChat。
 */
import { handleChat, type ChatEnvironment } from './server/chat';
import { consumeDailyBudget, consumeIpBudget, type BudgetDatabase } from './server/budget';

interface StaticAssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: StaticAssetsBinding;
  DEEPSEEK_API_KEY?: string;
  LLM_BASE_URL?: string;
  LLM_MODEL?: string;
  ALLOWED_ORIGINS?: string;
  /** D1 绑定：日额度与单 IP 分钟桶都记在这里。没有绑定时不扣额度。 */
  CHAT_BUDGET_DB?: BudgetDatabase;
}

const CHAT_PATH = '/api/chat';

function jsonError(code: string, status: number): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function chatEnvironment(env: Env): ChatEnvironment {
  return {
    DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY,
    LLM_BASE_URL: env.LLM_BASE_URL,
    LLM_MODEL: env.LLM_MODEL,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
  };
}

async function handleChatRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return jsonError('method_not_allowed', 405);

  const database = env.CHAT_BUDGET_DB;

  return handleChat(request, chatEnvironment(env), {
    // 只有通过全部校验、真要调模型时才扣额度：
    // 先按 IP 挡突发，再扣当天总量。两条都落在 D1 上，写入串行、计数可信。
    consumeBudget: database
      ? async () => {
          const now = new Date();
          const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

          const burst = await consumeIpBudget(database, now, ip);
          if (!burst.allowed) return { allowed: false, reason: 'rate_limited' as const };

          const daily = await consumeDailyBudget(database, now);
          return { allowed: daily.allowed, reason: 'daily_budget_exhausted' as const };
        }
      : undefined,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === CHAT_PATH) return handleChatRequest(request, env);

    return env.ASSETS.fetch(request);
  },
};
