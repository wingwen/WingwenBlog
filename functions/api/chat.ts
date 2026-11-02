/**
 * Cloudflare Pages Functions 的薄适配器。
 *
 * 这里只做三件事：读绑定、扣当天额度、把环境变量交给平台无关的 handleChat。
 * 业务逻辑一律留在 src/server/，换宿主只需要重写这个文件。
 */
import { handleChat, type ChatEnvironment, type RateLimiterBinding } from '../../src/server/chat';
import { consumeDailyBudget, type BudgetDatabase } from '../../src/server/budget';

interface PagesEnvironment {
  DEEPSEEK_API_KEY?: string;
  LLM_BASE_URL?: string;
  LLM_MODEL?: string;
  ALLOWED_ORIGINS?: string;
  CHAT_RATE_LIMITER?: RateLimiterBinding;
  /** D1 绑定，用来卡当天总调用数；没绑定时不扣额度。 */
  CHAT_BUDGET_DB?: BudgetDatabase;
}

interface PagesContext {
  request: Request;
  env: PagesEnvironment;
}

function jsonError(code: string, status: number): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const onRequestPost = async (context: PagesContext): Promise<Response> => {
  const env = context.env ?? {};

  const chatEnv: ChatEnvironment = {
    DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY,
    LLM_BASE_URL: env.LLM_BASE_URL,
    LLM_MODEL: env.LLM_MODEL,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
    CHAT_RATE_LIMITER: env.CHAT_RATE_LIMITER,
  };

  return handleChat(context.request, chatEnv, {
    // 只有通过全部校验、真的要调模型时才扣当日额度。
    consumeBudget: env.CHAT_BUDGET_DB
      ? () => consumeDailyBudget(env.CHAT_BUDGET_DB as BudgetDatabase, new Date())
      : undefined,
  });
};

export const onRequest = async (context: PagesContext): Promise<Response> => {
  if (context.request.method !== 'POST') return jsonError('method_not_allowed', 405);
  return onRequestPost(context);
};
