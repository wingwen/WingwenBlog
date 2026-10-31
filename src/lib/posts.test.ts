import { describe, expect, it } from 'vitest';
import {
  collectTags,
  filterPostsByTag,
  formatPostDate,
  postHref,
  sortPostsNewestFirst,
  tagHref,
  visiblePosts,
  type Post,
} from './posts';

interface PostFixture {
  id: string;
  pubDate: string;
  tags?: string[];
  draft?: boolean;
}

function createPost({ id, pubDate, tags = [], draft = false }: PostFixture): Post {
  return {
    id,
    collection: 'posts',
    data: {
      title: id,
      description: `${id} 的简介`,
      pubDate: new Date(pubDate),
      tags,
      draft,
      isPlaceholder: true,
    },
  };
}

describe('sortPostsNewestFirst', () => {
  it('按 pubDate 从新到旧排列，且不修改传入数组', () => {
    const oldest = createPost({ id: 'oldest', pubDate: '2026-01-01' });
    const newest = createPost({ id: 'newest', pubDate: '2026-03-01' });
    const middle = createPost({ id: 'middle', pubDate: '2026-02-01' });
    const posts = [oldest, newest, middle];

    expect(sortPostsNewestFirst(posts).map((post) => post.id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
    expect(posts.map((post) => post.id)).toEqual(['oldest', 'newest', 'middle']);
  });

  it('日期相同时按 id 升序兜底', () => {
    const beta = createPost({ id: 'beta', pubDate: '2026-01-01' });
    const alpha = createPost({ id: 'alpha', pubDate: '2026-01-01' });

    expect(sortPostsNewestFirst([beta, alpha]).map((post) => post.id)).toEqual([
      'alpha',
      'beta',
    ]);
  });
});

describe('visiblePosts', () => {
  it('剔除草稿，保留已发布文章', () => {
    const published = createPost({ id: 'published', pubDate: '2026-01-01' });
    const draft = createPost({ id: 'draft', pubDate: '2026-01-02', draft: true });

    expect(visiblePosts([published, draft]).map((post) => post.id)).toEqual(['published']);
  });
});

describe('filterPostsByTag', () => {
  const frontend = createPost({ id: 'frontend', pubDate: '2026-01-01', tags: ['前端'] });
  const frontendEngineering = createPost({
    id: 'frontend-engineering',
    pubDate: '2026-01-02',
    tags: ['前端工程'],
  });
  const backend = createPost({ id: 'backend', pubDate: '2026-01-03', tags: ['后端'] });

  it('只保留标签完全相同的文章', () => {
    expect(filterPostsByTag([frontend, frontendEngineering, backend], '前端').map((post) => post.id)).toEqual([
      'frontend',
    ]);
  });

  it('标签的子串不构成匹配', () => {
    expect(filterPostsByTag([frontend, frontendEngineering, backend], '端')).toEqual([]);
    expect(filterPostsByTag([frontend, frontendEngineering, backend], '前端工')).toEqual([]);
  });

  it('比较前去掉标签两侧的空白', () => {
    expect(filterPostsByTag([frontend, backend], '  前端  ').map((post) => post.id)).toEqual([
      'frontend',
    ]);
  });

  // frontmatter 里手写的标签可能自带空白；trim 后仍然要匹配上，否则标签页会渲染成空列表。
  it('文章标签自带空白时也能匹配', () => {
    const messy = createPost({ id: 'messy', pubDate: '2026-01-04', tags: [' 前端 '] });

    expect(filterPostsByTag([messy, backend], '前端').map((post) => post.id)).toEqual(['messy']);
  });

  it('没有文章使用该标签时返回空数组', () => {
    expect(filterPostsByTag([frontend, backend], '数据库')).toEqual([]);
  });
});

describe('collectTags', () => {
  it('统计每个标签的文章数，先按数量降序、再按标签名升序', () => {
    const posts = [
      createPost({ id: 'a', pubDate: '2026-01-01', tags: ['css', 'js'] }),
      createPost({ id: 'b', pubDate: '2026-01-02', tags: ['css', 'html'] }),
      createPost({ id: 'c', pubDate: '2026-01-03', tags: ['html'] }),
    ];

    expect(collectTags(posts)).toEqual([
      { tag: 'css', count: 2 },
      { tag: 'html', count: 2 },
      { tag: 'js', count: 1 },
    ]);
  });

  it('去掉标签两侧空白后再计数', () => {
    const posts = [
      createPost({ id: 'a', pubDate: '2026-01-01', tags: [' css '] }),
      createPost({ id: 'b', pubDate: '2026-01-02', tags: ['css'] }),
    ];

    expect(collectTags(posts)).toEqual([{ tag: 'css', count: 2 }]);
  });

  // 这条与上一条的区别：数量相同的两个标签，出现顺序与字母序相反，
  // 因此只按数量排序（依赖插入顺序）会得到 html 在前的错误结果。
  it('数量相同时按标签名升序，与出现顺序无关', () => {
    const posts = [
      createPost({ id: 'a', pubDate: '2026-01-01', tags: ['html'] }),
      createPost({ id: 'b', pubDate: '2026-01-02', tags: ['css'] }),
    ];

    expect(collectTags(posts)).toEqual([
      { tag: 'css', count: 1 },
      { tag: 'html', count: 1 },
    ]);
  });

  it('没有文章时返回空数组', () => {
    expect(collectTags([])).toEqual([]);
  });
});

describe('链接与日期格式', () => {
  it('文章链接指向 /posts/{id}', () => {
    expect(postHref('layout-demo')).toBe('/posts/layout-demo');
  });

  it('中文标签链接保持原文，不做百分号编码', () => {
    expect(tagHref('排版')).toBe('/tags/排版');
  });

  it('日期按 UTC 输出 YYYY.MM.DD', () => {
    expect(formatPostDate(new Date('2026-01-03'))).toBe('2026.01.03');
    expect(formatPostDate(new Date('2026-01-03T23:30:00-08:00'))).toBe('2026.01.04');
  });
});
