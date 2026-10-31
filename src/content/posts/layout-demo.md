---
title: '示例文章 · 排版与代码块演示'
description: '这是一篇占位文章，用来演示标题层级、目录、代码高亮与列表的排版效果，请替换为你的真实文章。'
pubDate: 2026-01-03
tags: ['排版', 'Markdown']
draft: false
isPlaceholder: true
---

这一篇的唯一作用是让版式有东西可排。它刻意写成通用内容，不包含任何关于作者的判断或经历。

## 目录是怎么来的

文章的目录由标题层级自动生成，不需要在正文里手动维护。写成二级标题，它就成为目录的一级条目；写成三级标题，它就成为子条目。

### 三级标题的一个例子

上面的标题会出现在右侧目录里，并带有一个缩进层级。这样读者可以快速跳到关心的段落。

## 代码块

行内代码长这样：`const total = items.length`。

围栏代码块会做语法高亮，样式在构建时生成，运行时不需要额外的脚本：

```ts
interface TagCount {
  tag: string;
  count: number;
}

export function collectTags(posts: Post[]): TagCount[] {
  const counter = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1);
    }
  }

  return [...counter.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));
}
```

## 列表与引用

无序列表：

- 第一条
- 第二条
- 第三条

引用块用来放一句需要被强调的话：

> 占位内容的价值不在于写得像真的，而在于让版式在真实内容到位之前也能被检验。

## 这一篇需要你做的事

把它替换成你自己的文章，或者直接删掉它。删除后，文章列表与标签页会自动少一条，不需要改任何代码。
