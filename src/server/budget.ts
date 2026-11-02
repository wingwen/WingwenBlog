/**
 * 每日调用额度。
 *
 * 平台层的限流（Rate Limiting binding、WAF 规则）都是近似值或按 Cloudflare 位置独立计数，
 * 而且需要账号侧配置。真正保证「这一天最多花多少钱」的必须是强一致计数器：
 * 这里用 D1 的单主库实现，每条被接受的请求消耗 1 次额度，超出即拒绝，不再调用模型。
 *
 * 每分钟粒度的突发限制交给 Rate Limiting binding 或 WAF 规则；
 * 两者都不可用时，只有这个日额度兜底——这一点写在 docs/decisions.md 里。
 */

/** 每天最多放行多少次模型调用。这个数字是设计值，真实成本换算尚未用真实 Key 核实。 */
export const DAILY_BUDGET = 200;

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

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS chat_budget (
  day TEXT PRIMARY KEY,
  used INTEGER NOT NULL
)`;

/** 按北京时间切天：站点受众在国内，避免「凌晨 8 点重置」这种反直觉行为。 */
export function dayKey(now: Date): string {
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().slice(0, 10);
}

/**
 * 尝试消耗一次额度。
 *
 * 用 `ON CONFLICT ... RETURNING` 一条语句完成「自增并取回新值」，
 * D1 单主库会串行化写入，因此并发请求不会拿到同一个计数。
 */
export async function consumeDailyBudget(
  database: BudgetDatabase,
  now: Date,
  limit: number = DAILY_BUDGET,
): Promise<BudgetVerdict> {
  await database.prepare(CREATE_TABLE).run();

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
