import { describe, expect, it } from 'vitest';
import {
  consumeDailyBudget,
  consumeIpBudget,
  dayKey,
  minuteKey,
  type BudgetDatabase,
} from './budget';

/**
 * 够用的 D1 替身：只需要支持建表与「自增并取回」这两类语句。
 * 真正的 D1 运行时在本地 wrangler 与线上验证，这里只测计数与切桶逻辑。
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

describe('时间分桶', () => {
  it('按北京时间切天', () => {
    expect(dayKey(new Date('2026-11-01T15:59:00Z'))).toBe('2026-11-01');
    expect(dayKey(new Date('2026-11-01T16:01:00Z'))).toBe('2026-11-02');
  });

  it('按北京时间切分钟', () => {
    expect(minuteKey(new Date('2026-11-01T02:00:20Z'))).toBe('2026-11-01T10:00');
    expect(minuteKey(new Date('2026-11-01T02:01:59Z'))).toBe('2026-11-01T10:01');
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
    expect(queries[queries.length - 1]).toContain('ON CONFLICT(day) DO UPDATE');
  });
});

describe('consumeIpBudget', () => {
  it('按「分钟 + IP」分桶自增', async () => {
    const { database, counters } = fakeDatabase();
    const now = new Date('2026-11-01T02:00:20Z');

    await consumeIpBudget(database, now, '1.2.3.4', 5);
    await consumeIpBudget(database, now, '1.2.3.4', 5);

    expect([...counters.keys()]).toEqual(['2026-11-01T10:00:1.2.3.4']);
    expect(counters.get('2026-11-01T10:00:1.2.3.4')).toBe(2);
  });

  it('超过每分钟上限后拒绝', async () => {
    const { database } = fakeDatabase();
    const now = new Date('2026-11-01T02:00:20Z');

    const results = [];
    for (let index = 0; index < 4; index += 1) {
      results.push(await consumeIpBudget(database, now, '1.2.3.4', 3));
    }

    expect(results.map((result) => result.allowed)).toEqual([true, true, true, false]);
  });

  it('不同 IP 各自计数', async () => {
    const { database } = fakeDatabase();
    const now = new Date('2026-11-01T02:00:20Z');

    await consumeIpBudget(database, now, '1.1.1.1', 3);
    const other = await consumeIpBudget(database, now, '2.2.2.2', 3);

    expect(other.used).toBe(1);
  });

  it('跨分钟重新计数', async () => {
    const { database } = fakeDatabase();

    await consumeIpBudget(database, new Date('2026-11-01T02:00:59Z'), '1.1.1.1', 3);
    const nextMinute = await consumeIpBudget(database, new Date('2026-11-01T02:01:01Z'), '1.1.1.1', 3);

    expect(nextMinute.used).toBe(1);
  });

  it('两个限制共用一套建表逻辑，不会重复建表', async () => {
    const { database, queries } = fakeDatabase();
    const now = new Date('2026-11-01T02:00:20Z');

    await consumeIpBudget(database, now, '1.1.1.1', 3);
    await consumeDailyBudget(database, now, 3);

    expect(queries.filter((query) => query.includes('CREATE TABLE')).length).toBe(2);
  });
});
