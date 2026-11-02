# Wingwen's Blog

一个用真实内容支撑远程面试演示的个人站点：介绍我是谁、做过什么，以及怎么联系我。

静态构建，没有账号、没有评论、没有后台。内容写在数据文件和 Markdown 里，改内容不需要改模板。

站点跑在 Cloudflare Worker 上：同一个 Worker 既发静态资源，也提供 `/api/chat`（站内问答助手）。

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

当前状态：`check` 0 错误 0 警告；`test` 42 条通过；`build` 7 个页面。

## 改内容

| 想改什么 | 改哪里 |
|---|---|
| 姓名、定位、联系方式、教育、实习、技能 | `src/data/profile.ts` |
| 站点名、AI 助手开关与文案 | `src/data/site.ts` |
| 项目 | `src/content/projects/*.md` |
| 简历 PDF | 替换 `public/profile.resume.pdf` |
| 颜色与圆角 | `src/styles/blog.css` 顶部的 CSS 变量 |
| AI 助手的语料范围 | `scripts/build-ai-corpus.mjs` |

新增一个项目 = 新增一个 `.md` 文件，字段由 `src/content.config.ts` 的 schema 约束。

## 目录

```
src/
├── content.config.ts    # 集合 schema
├── content/projects/    # 项目 Markdown
├── data/                # profile.ts、site.ts、GitHub 快照
├── components/          # 导航、页脚、窗口、资料栏、AI 入口卡与对话面板
├── layouts/             # 页面骨架：SEO / OG / canonical
├── lib/                 # 纯函数：项目排序、格式化（含测试）
├── pages/               # 路由
├── scripts/             # 对话面板的客户端逻辑
├── server/              # 问答助手：prompt、chat、budget（含测试）
├── styles/              # tokens → base → layout → components → blog
└── worker.ts            # Worker 入口：/api/chat + 静态资源
scripts/                 # 语料生成
public/                  # 图片、字体、简历、favicon
wrangler.toml            # Worker 配置：入口、静态资源、D1 绑定
```

## 部署

Cloudflare Worker（不是 Pages）：`wrangler.toml` 里 `main` 指向 `src/worker.ts`，`[assets]` 指向 `./dist`。

```bash
npm run build
npx wrangler deploy
```

构建时设置环境变量 `SITE_URL=https://<域名>`；Worker 侧需要在控制台配置
`DEEPSEEK_API_KEY`（Secret）与 `ALLOWED_ORIGINS`，并绑定 D1 的 `CHAT_BUDGET_DB`。
缺这些时静态站点照常工作，助手返回明确的「未接通」。

## 已知限制

- 助手只在配置了密钥后可用；未配置时面板会提示「助手还没接通」，不静默失败。
- 对话记录只存在页面内存里，刷新即清空；没有账号，也没有跨设备同步。
- 每日 200 次额度与单 IP 每分钟 8 次都由 D1 计数；D1 未绑定时这两层都不生效。
- 图片素材来源于网络，页面底部有署名说明；正式对外前请确认可用性，详见 `docs/credits.md`。

## 文档

- `docs/ai-development-log.md` — 分阶段开发过程摘要
- `docs/decisions.md` — 技术选型与取舍，含「什么情况下应该重新考虑」
- `docs/credits.md` — 字体与素材来源、许可证
