# Wingwen's Blog

一个用真实内容支撑远程面试演示的个人站点：介绍我是谁、做过什么，以及怎么联系我。

静态构建，没有账号、没有评论、没有后台。内容写在数据文件和 Markdown 里，改内容不需要改模板。

## 现在有什么

7 个 HTML 页面：

| 路由 | 内容 |
|---|---|
| `/` | 欢迎横幅、个人资料栏、代表项目 |
| `/about` | 教育、实习与工作、技能、论文、联系方式、简历下载 |
| `/projects` | 项目列表，按年份从新到旧 |
| `/projects/{id}` | 项目详情：背景、职责、结果、其他项目（3 个） |
| `404` | 自定义 404 |

另有构建期生成的 `/robots.txt`、`/sitemap-index.xml` 与分享图 `/og-default.png`。

文章栏目曾在 P4 实现，后来按需求整体移除，仓库里不留相关代码与内容。

## 技术栈

- Astro 7，`output: 'static'`
- TypeScript strict
- Content Collections + Zod schema（字段写错会在构建时报错）
- 手写 CSS + CSS 自定义属性，无 CSS 框架
- Vitest，只测纯函数

## 本地运行

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 产物在 dist/
npm run preview    # 预览构建产物
```

质量检查：

```bash
npm run check      # astro check：类型 + 内容 schema
npm test           # vitest run
npm run build
```

当前状态：`check` 0 错误 0 警告；`test` 8 条通过；`build` 7 个页面。

## 改内容

| 想改什么 | 改哪里 |
|---|---|
| 姓名、定位、联系方式、教育、实习、技能 | `src/data/profile.ts` |
| 站点名、AI 助手开关与文案 | `src/data/site.ts` |
| 项目 | `src/content/projects/*.md` |
| 简历 PDF | 替换 `public/profile.resume.pdf` |
| 颜色与圆角 | `src/styles/blog.css` 顶部的 CSS 变量 |

新增一个项目 = 新增一个 `.md` 文件，字段由 `src/content.config.ts` 的 schema 约束。

## 目录

```
src/
├── content.config.ts    # 集合 schema
├── content/projects/    # 项目 Markdown
├── data/                # profile.ts、site.ts、GitHub 快照
├── components/          # 导航、页脚、窗口、资料栏、AI 入口卡
├── layouts/             # 页面骨架：SEO / OG / canonical
├── lib/                 # 纯函数：项目排序、格式化（含测试）
├── pages/               # 路由
└── styles/              # tokens → base → layout → components → blog
public/                  # 图片、字体、简历、favicon
assets-source/           # 设计原图备份，已加入 .gitignore
```

## 部署

静态托管即可（Cloudflare Pages / Vercel 都行）。构建时设置环境变量：

```bash
SITE_URL=https://your-domain.example npm run build
```

`canonical`、`og:url`、`sitemap`、`robots.txt` 四处都从它推导；不设置时会回退到 `example.com` 占位。

## 已知限制

- AI 助手尚未接通模型。资料栏有一张静态说明卡，写明「未接通」，不产生任何指向 `/assistant` 的链接；`src/data/site.ts` 的 `features.aiAssistant` 改成 `true` 后才会变成入口。
- 图片素材来源于网络，页面底部有署名说明；正式对外前请确认可用性，详见 `docs/credits.md`。
- 单元测试只覆盖 `src/lib/projects.ts`，页面渲染靠人工验收。

## 文档

- `docs/ai-development-log.md` — 分阶段开发过程摘要
- `docs/decisions.md` — 技术选型与取舍，含「什么情况下应该重新考虑」
- `docs/credits.md` — 字体与素材来源、许可证
