import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export interface TagCount {
  tag: string;
  count: number;
}

/** 草稿只存在于写作阶段，列表、标签页与详情页都不应该看到它们。 */
export function visiblePosts(posts: Post[]): Post[] {
  return posts.filter((post) => !post.data.draft);
}

export function sortPostsNewestFirst(posts: Post[]): Post[] {
  // 同一天发布的文章用 id 兜底，避免顺序随读取顺序变化。
  return [...posts].sort(
    (left, right) =>
      right.data.pubDate.getTime() - left.data.pubDate.getTime() ||
      left.id.localeCompare(right.id),
  );
}

// 标签是精确匹配：搜索「前」不应该命中「前端」。两侧空白来自手写 frontmatter，一并去掉。
export function filterPostsByTag(posts: Post[], tag: string): Post[] {
  const normalizedTag = tag.trim();

  return posts.filter((post) =>
    post.data.tags.some((postTag) => postTag.trim() === normalizedTag),
  );
}

export function collectTags(posts: Post[]): TagCount[] {
  const countsByTag = new Map<string, number>();

  for (const post of posts) {
    for (const rawTag of post.data.tags) {
      const tag = rawTag.trim();

      if (tag.length === 0) {
        continue;
      }

      countsByTag.set(tag, (countsByTag.get(tag) ?? 0) + 1);
    }
  }

  return [...countsByTag.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));
}

export function postHref(id: string): string {
  return `/posts/${id}`;
}

// 中文标签在 href 中保持原样，交给浏览器按需编码；提前编码会得到双层转义的链接。
export function tagHref(tag: string): string {
  return `/tags/${tag}`;
}

// frontmatter 日期按 UTC 零点解析，用本地 getter 会在负时区把日期减一天。
export function formatPostDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}
