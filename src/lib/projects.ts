import type { CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

// 缺少 order 的项目排在所有显式排序之后，而不是被当成 0 挤到最前。
const PROJECTS_WITHOUT_EXPLICIT_ORDER = Number.MAX_SAFE_INTEGER;

/**
 * 列表页与详情页的“其他项目”必须共用同一份顺序，所以排序只在这里定义一次。
 */
export function sortProjectsNewestFirst(projects: Project[]): Project[] {
  return [...projects].sort(
    (left, right) =>
      right.data.year - left.data.year ||
      (left.data.order ?? PROJECTS_WITHOUT_EXPLICIT_ORDER) -
        (right.data.order ?? PROJECTS_WITHOUT_EXPLICIT_ORDER) ||
      left.id.localeCompare(right.id),
  );
}

export function projectHref(id: string): string {
  return `/projects/${id}`;
}

export function displayPeriod(project: Project): string {
  return project.data.period ?? String(project.data.year);
}
