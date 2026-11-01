import { describe, expect, it } from 'vitest';
import { displayPeriod, projectHref, sortProjectsNewestFirst, type Project } from './projects';

/**
 * 只需要 id 与 data 里参与排序/展示的字段，其余字段用不到，
 * 所以用类型断言构造，避免为测试写一份完整的 frontmatter。
 */
function makeProject(id: string, year: number, order?: number, period?: string): Project {
  return {
    id,
    collection: 'projects',
    data: { year, order, period },
  } as unknown as Project;
}

function idsOf(projects: Project[]): string[] {
  return projects.map((project) => project.id);
}

describe('sortProjectsNewestFirst', () => {
  it('年份不同时从新到旧，与 order 取值无关', () => {
    const older = makeProject('older', 2025, 1);
    const newer = makeProject('newer', 2026, 9);

    expect(idsOf(sortProjectsNewestFirst([older, newer]))).toEqual(['newer', 'older']);
  });

  it('同一年内按 order 升序，而不是按文件名字母序', () => {
    const lisaProject = makeProject('lisa', 2026, 3);
    const crmProject = makeProject('lazetrade', 2026, 1);
    const mailProject = makeProject('mail', 2026, 2);

    expect(idsOf(sortProjectsNewestFirst([lisaProject, mailProject, crmProject]))).toEqual([
      'lazetrade',
      'mail',
      'lisa',
    ]);
  });

  it('没写 order 的项目排在显式 order 之后，不会被当成 0 挤到最前', () => {
    const withOrder = makeProject('with-order', 2026, 5);
    const withoutOrder = makeProject('without-order', 2026);

    expect(idsOf(sortProjectsNewestFirst([withoutOrder, withOrder]))).toEqual([
      'with-order',
      'without-order',
    ]);
  });

  it('排序键完全相同时按 id 兜底，结果与传入顺序无关', () => {
    const alpha = makeProject('alpha', 2026, 1);
    const beta = makeProject('beta', 2026, 1);

    expect(idsOf(sortProjectsNewestFirst([alpha, beta]))).toEqual(['alpha', 'beta']);
    expect(idsOf(sortProjectsNewestFirst([beta, alpha]))).toEqual(['alpha', 'beta']);
  });

  it('不改动传入的数组', () => {
    const first = makeProject('first', 2025);
    const second = makeProject('second', 2026);
    const input = [first, second];

    sortProjectsNewestFirst(input);

    expect(idsOf(input)).toEqual(['first', 'second']);
  });
});

describe('displayPeriod', () => {
  it('有 period 时用写好的时间段', () => {
    expect(displayPeriod(makeProject('demo', 2026, undefined, '2026.05 – 至今'))).toBe(
      '2026.05 – 至今',
    );
  });

  it('没有 period 时回退为年份字符串', () => {
    expect(displayPeriod(makeProject('demo', 2024))).toBe('2024');
  });
});

describe('projectHref', () => {
  it('指向详情页路由', () => {
    expect(projectHref('lazetrade')).toBe('/projects/lazetrade');
  });
});
