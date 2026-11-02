/**
 * 每日调用额度与单 IP 突发限制。
 *
 * 平台层的限流（Rate Limiting binding、WAF 规则）在 Pages 上用不了：
 * `wrangler pages deploy` 会拒绝 `[[ratelimits]]` 配置，而内存计数在多实例下不算数。
 * 所以两种限制都落到 D1 单主库上——写入串行，计数可信。
 */

/** 每天最多放行多少次模型调用。这个数字是设计值，真实成本换算尚未用真实 Key 核实。 */
export const DAILY_BUDGET = 200;

/** 单个 IP 每分钟最多放行多少次。 */
export const IP_MINUTE_LIMIT = 8;

export interface BudgetStatement {
  bind(...values: unknown[]): BudgetStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
  all?<T = unknown>(): Promise<{ results?: T[] }>;
}

export interface BudgetDatabase {
  prepare(query: string): BudgetStatement;
}

export interface BudgetVerdict {
  allowed: boolean;
  used: number;
  limit: number;
}

const CREATE_DAILY_TABLE = `CREATE TABLE IF NOT EXISTS chat_budget (
  day TEXT PRIMARY KEY,
  used INTEGER NOT NULL
)`;

const CREATE_RATE_TABLE = `CREATE TABLE IF NOT EXISTS chat_rate (
  bucket TEXT PRIMARY KEY,
  used INTEGER NOT NULL
)`;

// 同一个 isolate 内只建一次表：D1 的 DDL 语句很便宜，但没必要每个请求都跑。
const readyDatabases = new WeakSet<BudgetDatabase>();

async function ensureSchema(database: BudgetDatabase): Promise<void> {
  if (readyDatabases.has(database)) return;
  await database.prepare(CREATE_DAILY_TABLE).run();
  await database.prepare(CREATE_RATE_TABLE).run();
  readyDatabases.add(database);
}

/** 按北京时间切天：站点受众在国内，避免「凌晨 8 点重置」这种反直觉行为。 */
export function dayKey(now: Date): string {
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().slice(0, 10);
}

/** 按分钟切桶，北京时间的 `YYYY-MM-DDTHH:mm`。 */
export function minuteKey(now: Date): string {
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().slice(0, 16);
}

/**
 * 尝试消耗一次每日额度。
 *
 * 用 `ON CONFLICT ... RETURNING` 一条语句完成「自增并取回新值」，
 * D1 单主库会串行化写入，因此并发请求不会拿到同一个计数。
 */
export async function consumeDailyBudget(
  database: BudgetDatabase,
  now: Date,
  limit: number = DAILY_BUDGET,
): Promise<BudgetVerdict> {
  await ensureSchema(database);

  const key = dayKey(now);
  const row = await database
    .prepare(
      'INSERT INTO chat_budget (day, used) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET used = used + 1 RETURNING used',
    )
    .bind(key)
    .first<{ used: number }>();

  const used = typeof row?.used === 'number' ? row.used : 0;

  return { allowed: used <= limit, used, limit };
}

/**
 * 单 IP 每分钟的突发限制。计数按「分钟 + IP」分桶，跨分钟自动重新计数。
 * 便宜的拦截放在每日额度之前，先挡住刷接口的脚本，再谈当天总预算。
 */
export async function consumeIpBudget(
  database: BudgetDatabase,
  now: Date,
  ip: string,
  limit: number = IP_MINUTE_LIMIT,
): Promise<BudgetVerdict> {
  await ensureSchema(database);

  const bucket = `${minuteKey(now)}:${ip}`;
  const row = await database
    .prepare(
      'INSERT INTO chat_rate (bucket, used) VALUES (?, 1) ON CONFLICT(bucket) DO UPDATE SET used = used + 1 RETURNING used',
    )
    .bind(bucket)
    .first<{ used: number }>();

  const used = typeof row?.used === 'number' ? row.used : 0;

  return { allowed: used <= limit, used, limit };
}
