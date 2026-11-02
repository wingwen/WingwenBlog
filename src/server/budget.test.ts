import { describe, expect, it } from 'vitest';
import { consumeDailyBudget, dayKey, type BudgetDatabase } from './budget';

/**
 * 够用的 D1 替身：只需要支持建表、自增取回这两个语句。
 * 真实 D1 由 Cloudflare 的本地运行时验证，这里只测计数与切天逻辑。
 */
function fakeDatabase(): { database: BudgetDatabase; counters: Map<string, number>; queries: string[] } {
  const counters = new Map<string, number>();
  const queries: string[] = [];

  const database: BudgetDatabase = {
    prepare(query: string) {
      queries.push(query);

      const statement = {
        boundValues: [] as unknown[],
        bind(...values: unknown[]) {
          statement.boundValues = values;
          return statement;
        },
        async first<T>() {
          if (!query.includes('RETURNING')) return null as T | null;
          const key = String(statement.boundValues[0]);
          const next = (counters.get(key) ?? 0) + 1;
          counters.set(key, next);
          return { used: next } as T;
        },
        async run() {
          return {};
        },
      };

      return statement;
    },
  };

  return { database, counters, queries };
}

describe('dayKey', () => {
  it('按北京时间切天', () => {
    // UTC 15:59 = 北京 23:59，仍算当天
    expect(dayKey(new Date('2026-11-01T15:59:00Z'))).toBe('2026-11-01');
    // UTC 16:01 = 北京次日 00:01
    expect(dayKey(new Date('2026-11-01T16:01:00Z'))).toBe('2026-11-02');
  });
});

describe('consumeDailyBudget', () => {
  it('每次调用自增一次并返回当前用量', async () => {
    const { database } = fakeDatabase();
    const now = new Date('2026-11-01T02:00:00Z');

    const first = await consumeDailyBudget(database, now, 3);
    const second = await consumeDailyBudget(database, now, 3);

    expect(first).toEqual({ allowed: true, used: 1, limit: 3 });
    expect(second).toEqual({ allowed: true, used: 2, limit: 3 });
  });

  it('超过额度后拒绝，但计数继续累加', async () => {
    const { database } = fakeDatabase();
    const now = new Date('2026-11-01T02:00:00Z');

    await consumeDailyBudget(database, now, 2);
    await consumeDailyBudget(database, now, 2);
    const third = await consumeDailyBudget(database, now, 2);

    expect(third.allowed).toBe(false);
    expect(third.used).toBe(3);
  });

  it('跨天重新计数', async () => {
    const { database, counters } = fakeDatabase();

    await consumeDailyBudget(database, new Date('2026-11-01T02:00:00Z'), 10);
    const nextDay = await consumeDailyBudget(database, new Date('2026-11-02T02:00:00Z'), 10);

    expect(nextDay.used).toBe(1);
    expect([...counters.keys()]).toEqual(['2026-11-01', '2026-11-02']);
  });

  it('先建表再自增', async () => {
    const { database, queries } = fakeDatabase();
    await consumeDailyBudget(database, new Date('2026-11-01T02:00:00Z'), 10);

    expect(queries[0]).toContain('CREATE TABLE IF NOT EXISTS chat_budget');
    expect(queries[1]).toContain('ON CONFLICT(day) DO UPDATE');
  });
});
