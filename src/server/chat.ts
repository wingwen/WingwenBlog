/**
 * 问问 Wingwen 的核心处理函数。
 *
 * 只用 Web 标准（Request / Response / fetch），不依赖任何平台 API：
 * Cloudflare Pages Functions、独立 Worker、本地脚本都能直接调用它。
 * 网络与限流都从参数注入，因此单测不需要真实密钥，也不会产生调用费用。
 */
import { corpus, corpusSourceKeys, corpusSourceRefs } from './corpus';
import {
  buildMessages,
  finalizeAnswer,
  normalizeHistory,
  sanitizeQuestion,
  type ChatTurn,
} from './prompt';

const MAX_BODY_BYTES = 4096;
const REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-flash';

export interface RateLimiterBinding {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}

export interface ChatEnvironment {
  DEEPSEEK_API_KEY?: string;
  LLM_BASE_URL?: string;
  LLM_MODEL?: string;
  /** 逗号分隔的白名单来源，例如 `https://wingwen.example,https://blog.example`。 */
  ALLOWED_ORIGINS?: string;
  /** Cloudflare 限流绑定；没有绑定时不做过期检查，只依赖平台的其它防线。 */
  CHAT_RATE_LIMITER?: RateLimiterBinding;
}

export interface ChatDependencies {
  fetch: typeof fetch;
  /**
   * 调用模型之前的额度检查。只有走到这一步才扣额度，
   * 参数校验失败与跨源请求不会消耗当日预算。
   */
  consumeBudget?: () => Promise<{ allowed: boolean }>;
}

type ErrorCode =
  | 'method_not_allowed'
  | 'origin_not_allowed'
  | 'payload_too_large'
  | 'invalid_json'
  | 'invalid_question'
  | 'question_too_long'
  | 'invalid_history'
  | 'rate_limited'
  | 'not_configured'
  | 'daily_budget_exhausted'
  | 'budget_unavailable'
  | 'upstream_failed'
  | 'upstream_timeout';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function errorResponse(code: ErrorCode, status: number): Response {
  return jsonResponse({ error: code }, status);
}

function isOriginAllowed(request: Request, allowedOrigins: string | undefined): boolean {
  const origin = request.headers.get('origin');
  // 没有 Origin 的请求来自非浏览器客户端（curl、服务端调用），交给限流与预算兜底。
  if (!origin) return true;

  const allowed = (allowedOrigins ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowed.length === 0) return false;
  return allowed.includes(origin);
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function rateLimitKey(request: Request): string {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  return `chat:${ip}`;
}

export async function handleChat(
  request: Request,
  env: ChatEnvironment,
  deps: Partial<ChatDependencies> = {},
): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('method_not_allowed', 405);
  }

  if (!isOriginAllowed(request, env.ALLOWED_ORIGINS)) {
    return errorResponse('origin_not_allowed', 403);
  }

  const rawBody = await request.text();
  if (byteLength(rawBody) > MAX_BODY_BYTES) {
    return errorResponse('payload_too_large', 413);
  }

  let payload: { question?: unknown; history?: unknown };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse('invalid_json', 400);
  }
  if (!payload || typeof payload !== 'object') {
    return errorResponse('invalid_json', 400);
  }

  const question = sanitizeQuestion(payload.question);
  if (!question.ok) {
    return errorResponse(question.reason === 'too_long' ? 'question_too_long' : 'invalid_question', 400);
  }

  const history = normalizeHistory(payload.history);
  if (!history.ok) {
    return errorResponse('invalid_history', 400);
  }

  if (env.CHAT_RATE_LIMITER) {
    const verdict = await env.CHAT_RATE_LIMITER.limit({ key: rateLimitKey(request) }).catch(() => null);
    if (verdict && !verdict.success) {
      return errorResponse('rate_limited', 429);
    }
  }

  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return errorResponse('not_configured', 503);
  }

  if (deps.consumeBudget) {
    let verdict: { allowed: boolean };
    try {
      verdict = await deps.consumeBudget();
    } catch {
      return errorResponse('budget_unavailable', 503);
    }
    if (!verdict.allowed) {
      return errorResponse('daily_budget_exhausted', 429);
    }
  }

  const messages = buildMessages(
    corpus.material,
    corpusSourceKeys,
    history.value as ChatTurn[],
    question.value,
  );

  const baseUrl = (env.LLM_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await (deps.fetch ?? fetch)(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: env.LLM_MODEL ?? DEFAULT_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        // deepseek-flash 默认开启思考模式，会让首字变慢且推理 token 按输出计费。
        thinking: { type: 'disabled' },
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return errorResponse(aborted ? 'upstream_timeout' : 'upstream_failed', aborted ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }

  if (!upstream.ok) {
    return errorResponse('upstream_failed', 502);
  }

  let completion: unknown;
  try {
    completion = await upstream.json();
  } catch {
    return errorResponse('upstream_failed', 502);
  }

  const content = (completion as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]
    ?.message?.content;

  let parsed: { answer?: unknown; sources?: unknown };
  try {
    parsed = JSON.parse(typeof content === 'string' ? content : '');
  } catch {
    return errorResponse('upstream_failed', 502);
  }

  const result = finalizeAnswer(parsed?.answer, parsed?.sources, corpusSourceRefs);
  if (!result) {
    return errorResponse('upstream_failed', 502);
  }

  return jsonResponse({ answer: result.answer, sources: result.sources }, 200);
}
