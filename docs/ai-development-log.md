# AI 开发过程日志

> 这是每个阶段的过程摘要，不是完整聊天记录。
> **原始对话请使用编辑器的对话导出功能自行留存**，否则工具不会替你保存。
> 本文件只记录：本阶段目标、关键决策、遇到的问题、修复过程、你的反馈。

---

## 阶段 0 · 环境勘察与方案确认

**目标**：确认开发环境可用，确定产品方向、技术栈与视觉方向。

**做法**
- 探测本地环境：Node v24.16.0 / npm 11.13.0 / pnpm 11.11.0 / Python 3.9.6 / git 2.50.1
- 探测 npm 源可达性（最新 Astro 为 7.4.4）
- 安装并初始化 Trellis（`@mindfoldhq/trellis@0.6.17`，Cursor 平台）
- 提出两套视觉方向供选择

**关键决策**
- 视觉方向选 A「纸本档案」（Editorial Archive）
- 技术栈：Astro 静态输出 + TypeScript strict + Markdown 内容集合 + 手写 CSS
- 部署：静态托管双部署（Cloudflare Pages / Vercel），P7 实测后定主链接
- AI 助手：做，但推迟到基础站点可用之后

**遇到的问题**
- 无。环境一次通过。

**你的反馈**
- 选择方向 A；说明面试官主要在国内；个人内容尚未整理；AI 助手要做，关注费用与 Key 安全。

---

## 规划阶段 · 需求与规划

**目标**：把口头需求落成可验收的文档，避免边写边改。

**做法**
- 创建 Trellis 任务 `10-29-portfolio-site`
- 产出 `prd.md`（需求 + 15 条验收标准）、`design.md`（技术设计与取舍）、`implement.md`（P1–P7 执行清单）
- 研究并记录：AI 助手候选方案与费用量级、内容填写清单
- 审查 `.gitignore`，补齐缺失的安全规则

**关键决策**
- 内容以占位数据搭页面，用 `isPlaceholder` 字段 + 页面可见标识双重保障，不编造真实经历
- AI 助手在真实模型接通前不出现任何入口，不做假聊天界面
- `.trellis/` 与 `.cursor/` 整体不纳入 Git，对外过程记录整理到 `docs/`
- 测试只覆盖三处真实逻辑：标签筛选、AI 检索阈值、内容 schema 校验

**遇到的问题**
- **问题**：初始 `.gitignore` 只有 `.cursor`、`.trellis` 两行，缺少 `node_modules/`、`dist/`、`.env*`。
- **影响**：一旦执行 `npm install` 或接入 API Key，会把依赖目录或密钥提交进仓库。
- **修复**：重写 `.gitignore`，并用 `git check-ignore` 逐条验证：`node_modules`、`dist`、`.env`、`.env.local`、`.astro` 均被忽略；`.env.example` 保持可提交。

**你的反馈**
- 确认可以创建 Trellis 任务并进入规划

**产出**
- `.trellis/tasks/10-29-portfolio-site/{prd,design,implement}.md`
- `docs/ai-development-log.md`、`docs/decisions.md`
- `.gitignore`（已更新并验证）

---

## 阶段 P1 · 地基（实施）

**目标**：搭起能构建、能校验、能渲染数据的骨架，为后续页面提供排版与内容基础。

**做法**
- 用最小模板初始化 Astro 7（不套博客主题）
- 建立设计 token（颜色 / 字体栈 / 流体字号 / 间距）与三层样式基础
- 定义 `posts` / `projects` 两个内容集合的 schema
- 写入带「示例内容」标识的占位数据与占位页面
- 全局布局、导航、页脚、跳转链接

**关键决策**
- 不引入任何 web font 与 CDN：演示面向国内，第三方请求是风险
- 四层样式链：`tokens → base → layout → components`，页面局部样式留在各自的 `.astro` 里
- 三个 stub 页（关于 / 项目 / 文章）保留，避免导航出现死链，并在页面上写明由哪个阶段填充

**遇到的问题**
1. **脚手架会覆盖 `.gitignore`** —— 先备份再恢复，恢复后与原文件逐字节一致。
2. **目标目录非空时，`create-astro` 会在根下新建随机名子目录**（`lunar-limb/`）而不是就地写入 —— 把产物移回仓库根，删除该子目录。
3. **实现子代理报告其写文件工具产出 0 字节文件** —— 改用 shell 落盘。事后逐个核对磁盘上的文件：全部非空、内容正确、构建通过，该问题未影响最终结果。
4. **质量检查发现 3 个真实缺陷** —— 已修复：
   - `astro.config.mjs` 未显式声明 `output: 'static'`（只依赖默认值）
   - 占位角标样式写在 layout 层，违反四层分层约定 → 新增 `src/styles/components.css`
   - 占位外链 `github.com/example` 可能指向真实第三方账号 → 改为 `your-handle`

**验收结果**
- `npm run check`：13 个文件，0 错误 0 警告 0 提示
- `npm run build`：4 个页面构建成功，产物中无任何 JS 文件、无外部 URL
- AC-8 负向测试：删除文章的 `description` 字段 → 构建失败并点名 `example-post.md` 的 `description: Required`，退出码 1；恢复后构建重新通过
- AC-9：`isPlaceholder` 置为 `false` 时，页面不产出角标文本也不产出空标签
- 无障碍：每页 `lang="zh-CN"`、唯一 `<h1>`、跳转链接与 `#main` 配对、`aria-current` 跟随当前页
- 对比度（按 token 手算）：正文 16.4:1、次要文本 5.31:1、强调色 6.38:1，均达 WCAG AA

**你的反馈**
- P1 通过

**产出**
- `astro.config.mjs`、`tsconfig.json`、`package.json`
- `src/content.config.ts`、`src/data/{profile,site}.ts`、`src/content/{posts,projects}/`
- `src/styles/{tokens,base,layout,components}.css`
- `src/layouts/BaseLayout.astro`、`src/components/{SiteHeader,SiteFooter,PlaceholderBadge}.astro`
- `src/pages/{index,about,projects,posts}.astro`

---

## 阶段 P2 · 首页 + 关于（含真实资料接入）

**目标**：把首页与关于页从占位骨架换成真实内容，并完成资料筛选。

**做法**
- 清点 `/Users/Admin/Documents/resume` 下的 40 余个文件，只取**简历本身**已面向雇主公开的字段
- 把筛选结果写入 `src/data/profile.ts` 与 3 个项目条目
- 首页：介绍 / 代表项目 / 近期文章三个区块，全部读数据文件
- 关于页：教育、实习与工作、技能、论文、联系方式、简历下载位
- 新增 `SectionHeader`、`ProjectEntry`、`PostEntry`、`TimelineEntry` 四个展示型组件

**关键决策**
- **只公开雇主本来就会看到的内容**。初始排除：手机号、年龄与性别、成绩单与学籍验证报告、四六级证书扫描件、目标公司清单、面经 / 口播 / 冲刺 / 八股 / 笔试记录
- 简历 PDF **不接入**。`profile.resume` 置为 `null` 时，关于页整个下载区块不渲染——宁可暂时没有入口，也不放一个指向未确认内容的链接
- 3 个项目用 `order` 显式排序，而不是依赖文件名巧合
- 首页的项目与文章条目不做成链接：详情页还不存在，链接过去就是 404

**遇到的问题**
1. **同年项目导致按年份排序失效** —— 三个项目都是 2026 年，实际顺序变成按文件名排（Lazetrade / Lisa / Mail），与简历顺序不一致。加 `order` 字段后恢复为 Lazetrade / Mail / Lisa。
2. **质量检查发现 3 个无障碍缺陷，均已修复**：
   - 教育条目用字符串拼接 `计算机技术 · 硕士`，「·」进入了屏幕阅读器的朗读内容 → 改为数组 + CSS 视觉分隔
   - 「示例内容」角标被渲染在 `<h3>` 内部，标题的可访问名称变成「示例文章 · 请替换示例内容」→ 移到标题外的元信息行
   - 13 个 `list-style: none` 的列表在 Safari/VoiceOver 下会丢失列表语义 → 全部补 `role="list"`
3. **检查脚本自身有一次假通过** —— `grep --include=*.css` 在 zsh 下会被通配符展开导致 grep 根本没执行，`|| echo` 于是打印了成功提示。引号补上后结论不变，但过程值得记录下来。

**验收结果**
- `npm run check`：17 个文件，0 错误 0 警告 0 提示
- `npm run build`：4 个页面构建成功
- 隐私核查：`src/` 与 `dist/` 中检索手机号与任何 11 位手机号形状串，均无命中
- 事实核查：页面上的公司名、学校名、项目名、数字（72%、96/133、100%）逐条可追溯到数据文件
- 链接核查：首页与关于页的 `<a href>` 仅指向已存在的页面，无死链
- 响应式：375px 与 1440px 下 `scrollWidth === clientWidth`，无横向溢出

**你的反馈**
- P2 通过；并给出 6 项内容核对意见（见下）

**产出**
- `src/data/profile.ts`（真实资料）
- `src/content/projects/{lazetrade,mail,lisa}.md`
- `src/pages/{index,about}.astro`
- `src/components/{SectionHeader,ProjectEntry,PostEntry,TimelineEntry}.astro`
- `src/styles/components.css`

### P2 修正（按你的核对结果）

| 你的要求 | 落地 |
|---|---|
| 现居城市改深圳，广州大学保留 | `profile.location` 改为深圳；教育经历不动 |
| 公司全称可公开 | 保持全称 |
| 72%（96/133）、100% Code Review 确认 | 保持原文 |
| 加上 GPA | 硕士 3.81 / 5.0、本科 3.41 / 5.0，渲染在教育条目副标题 |
| GitHub | `https://github.com/wingwen`，关于页联系方式区 |
| 使用个人照 | 头像进 `src/assets/`，经 `astro:assets` 优化为 webp（100KB → 11KB），只出现在关于页 |

**关于头像的处理**：素材是蓝底证件照，在纸色底上是一块偏冷的色块。当前按原色呈现；如果觉得跳，在 `about.astro` 的 `.about-intro__portrait` 里加一行 `filter: grayscale(1) sepia(0.12)`（暖调单色）或 `filter: saturate(0.65)`（保留色彩、降低饱和度）即可，两种都试过、都不影响布局。

---

## 阶段 P3 · 项目列表 + 项目详情

**目标**：让项目成为可以点进去读的条目，而不是首页上的一段摘要。

**做法**
- `/projects` 列表页：按年份从新到旧，条目带编号，无项目时显示空态
- `/projects/{id}` 详情页：背景 / 我的职责 / 结果 / 正文，底部有「其他项目」导航
- 抽出 `src/lib/projects.ts`（排序、href、时间段展示）与 `src/lib/format.ts`（编号），首页、列表、详情三处共用
- 首页的「代表项目」条目接上详情页链接

**关键决策**
- 排序只在一处定义。首页、列表页、详情页的「其他项目」都走同一个函数，避免三个地方各写一套导致顺序不一致
- 条目标题的 `<h2>` / `<h3>` 由调用方决定：列表页挂在 `<h1>` 下用 h2，首页挂在「代表项目」`<h2>` 下用 h3，两边都不会跳级

**遇到的问题**
1. **首页与列表页各自维护了一套排序和编号** —— 首页按 `order` 优先、列表页按 `year` 优先，三个项目恰好都是 2026 年才没暴露。统一到 `sortProjectsNewestFirst`。
2. **首页项目条目不跳转** —— 详情页做好后，首页仍是纯文本条目。已接上链接，并加了一条「全部项目 →」。
3. **项目标题的 hover 无效果** —— 组件内的 `text-decoration-thickness: 1px` 编译后选择器优先级 (0,2,0)，压过了全局 `a:hover` 的 (0,1,1)，导致 1px→2px 的悬停下划线从未生效。补了 scoped `:hover` 规则。
4. **占位角标在项目条目里丢失** —— `ProjectEntry` 完全没接 `isPlaceholder`，示例项目会以真实项目的面貌出现在列表里。已补上。
5. **`public/` 里有一个未被引用的头像副本** —— 87KB 的死资源会跟着部署走。已删除，正式用的那份在 `src/assets/`。

**验收结果**
- `npm run check`：20 个文件，0 错误 0 警告 0 提示
- `npm run build`：7 个页面，头像优化为 webp（约 11KB）
- 排序一致性：首页 `Lazetrade → Mail → Lisa`，列表页同序，详情页「其他项目」保持同一相对顺序
- 链接完整性：7 个页面全部内链逐条解析到实际产物，失效链接 0
- 隐私：手机号在 `src/`、`dist/` 中零命中
- 无障碍：每页唯一 `<h1>`，标题层级无跳跃，列表语义完整，占位角标不污染标题
- 响应式：首页、关于、项目列表、项目详情在 375px 下 `scrollWidth === clientWidth`，无横向溢出

**你的反馈**
- P3 通过

**产出**
- `src/pages/projects.astro`、`src/pages/projects/[slug].astro`
- `src/lib/{projects,format}.ts`
- `src/components/ProjectEntry.astro`（补 `href` / `headingLevel` / `isPlaceholder`）
- `src/assets/portrait.jpg`

---

## 阶段 P4 · 文章列表、详情与标签筛选

> **2026-11-01 更新：本阶段已整体撤销。** 3 篇示例文章、`/posts` 列表与详情、`/tags/{tag}` 标签页、`posts` 内容集合、`lib/posts.ts` 及其 15 条测试、`PostEntry` 组件全部删除，AC-4 作废，详见 v4.13。
> 下面这段保留原样，作为当时的过程记录，不再代表站点现状。

**目标**：把文章从占位页做成可读、可筛选、可分享的完整链路。

**做法**
- 补充两篇示例文章，共 3 篇，标签互有重叠，让标签筛选有东西可展示
- 文章列表页：标题、简介、标签行（带篇数）
- 文章详情页：元信息、正文、由标题层级自动生成的目录
- 标签页 `/tags/{tag}`：筛选结果可通过 URL 直接分享，刷新后不变
- 抽出 `src/lib/posts.ts` 纯函数（排序、去草稿、标签筛选、标签统计、链接与日期格式化）
- 引入 Vitest，只测这几个纯函数

**关键决策**
- **目录不需要客户端 JS**。标题的 `id` 与目录锚点在构建时生成，页面 `<script>` 数量为 0。
- **代码高亮在构建时完成**（Shiki，`github-light` 主题），并把 Shiki 自带的 `<pre>` 背景去掉，改用纸色背景。
- **标签页是可静态生成的独立路由**，而不是前端筛选：URL 能分享、能刷新、能收藏，且不需要 JS。
- 测试只写有价值的断言，不为组件写渲染测试。

**遇到的问题**
1. **中文标签的 URL 编码**。请求行里直接放原始 UTF-8 字节会被 Node 的 HTTP 解析器拒绝（400）。浏览器会自动编码，所以 `href` 里保留原始中文、实际请求变成 `%E6%8E%92%E7%89%88` 这种形式，返回 200。已用构建产物（`astro preview`）逐个标签验证，全部 200。
2. **两条单测是「无效断言」**。质量检查用变异测试发现：把排序的并列比较删掉、把标签比较改成子串匹配，原来的测试依然全绿。补充了三条用例（插入顺序无关、标签首尾空格、空输入），测试数从 12 增加到 15。

**验收结果**
- `npm run check`：24 个文件，0 错误 0 警告 0 提示
- `npm run build`：15 个页面（首页、关于、项目列表 + 3 详情、文章列表 + 3 详情、5 个标签页）
- `npm test`：15 条断言全部通过
- 标签路由：在**构建产物**上用 `astro preview` 逐个验证，`/tags/笔记`、`/tags/排版`、`/tags/前端`、`/tags/示例`、`/tags/Markdown` 全部 200
- 目录：5 个锚点与 5 个标题 `id` 一一对应，无重复 `id`
- 文章页 `<script>` 数量为 0，代码块为构建期高亮
- 无 token 外的硬编码颜色

**你的反馈**
- 待填写

**产出**
- `src/pages/posts.astro`、`src/pages/posts/[slug].astro`、`src/pages/tags/[tag].astro`
- `src/lib/posts.ts`、`src/lib/posts.test.ts`
- `src/content/posts/{layout-demo,short-demo}.md`
- `astro.config.mjs`（Shiki 主题）、`package.json`（vitest）

---

## 阶段 P5 · 打磨（404 / SEO / sitemap / 无障碍 / 性能）

**目标**：让站点达到"可以递给面试官"的完成度——能被搜索引擎和社交平台正确读取，能被键盘和读屏软件使用，并被真实测分。

**做法**
- 新增 404 页、每页独立的 title / description、Open Graph 全套与 canonical
- `@astrojs/sitemap` 生成 sitemap；`robots.txt` 改为端点路由，从 `Astro.site` 推导，避免手写地址漂移
- 自托管 Newsreader 可变衬线体（拉丁子集），补齐 P2 遗留的字体项
- 生成分享图 `og-default.png`（构建期由端点路由渲染）
- 补 favicon

**关键决策**
- **域名不猜**。`site` 取 `SITE_URL` 环境变量，缺省是 `example.com` 占位。canonical / og:url / sitemap / robots 四处全部从它推导，P7 只改环境变量。已验证换值后四处同时更新。
- **robots.txt 用端点而不是静态文件**：静态文件里的域名会和配置各存一份，迟早不一致。
- **分享图在构建期用端点路由生成**，文案直接读 `profile.ts`，不另写一份；先前尝试用独立 Node 脚本，但 Node 无法直接导入 `.ts`，改用 Astro 端点后路径问题自然消失。
- **配图不额外维护文本**：OG 图上的姓名、定位、状态全部来自数据层。

**遇到的问题**
1. **缺少 favicon 导致控制台报错** —— 浏览器自动请求 `/favicon.ico` 得到 404，Lighthouse 的 best-practices 因此扣到 96。补 `favicon.svg` 并在 head 声明后恢复满分。
2. **代码高亮主题在纸色底上对比度不足** —— `github-light` 的橙色 token 只有 3.29:1，`min-light` 的蓝色 4.34:1，都低于 AA 要求的 4.5:1。连续换过两个主题后选定 `github-light-high-contrast`，其全部 token 都在 7.6:1 以上。这个差异只有在**真实跑分**时才暴露，肉眼看不出来。
3. **两个修法都失效过** —— 先试 Shiki 的 `span` 钩子逐节点改色、再试 `postprocess` 整段替换，构建产物都没变化（Astro 的 markdown 管线并不会调用这两个钩子）。改用"换一个本身就达标的主题"这个更笨但可靠的办法。
4. **项目列表页的 description 过长** —— 原先拼接了三个项目的 summary，169 字，超过搜索结果约 160 字的截断点，而且每加一个项目就变长。改为按条目数描述。
5. **文档与实现不一致** —— 日志里写着头像做了去色处理，代码里其实没有；已把两边改成一致，并把"要不要去色"留给用户决定。
6. **本地跑分一度全部失败** —— 报 "Chrome prevented page load with an interstitial"，排查后发现是我重启预览服务时进程被回收，页面根本打不开。这类"测试环境本身坏了"的假失败，比被测对象出问题更容易误导人。

**验收结果**
- `npm run check`：26 个文件，0 错误 0 警告 0 提示
- `npm test`：15 条断言通过
- `npm run build`：16 个页面（新增 404）
- **Lighthouse 移动端**（对构建产物跑，非 dev 服务器）：

  | 页面 | Performance | Accessibility | Best Practices | SEO |
  |---|---|---|---|---|
  | 首页 | 100 | 100 | 100 | 100 |
  | 关于 | 100 | 100 | 100 | 100 |
  | 文章详情（含代码块） | 100 | 100 | 100 | 100 |
  | 项目详情 | 100 | 100 | 100 | 100 |
  | 标签页（中文路径） | 100 | 100 | 100 | 100 |

- 16 个页面：title 与 description 全部非空且互不重复，canonical 与 og:url 一致
- sitemap 的 15 条 `<loc>` 全部指向真实产物；404 未进 sitemap
- 产物中 `<script>` 数量为 0，外部请求 0（字体为同源自托管）
- 48 组（16 页 × 375/768/1440）横向溢出检查全部为 0

**你的反馈**
- 待填写

**产出**
- `src/pages/404.astro`、`src/pages/robots.txt.ts`、`src/pages/og-default.png.ts`
- `src/styles/fonts.css`、`public/fonts/*`、`public/favicon.svg`
- `docs/credits.md`
- `src/layouts/BaseLayout.astro`（SEO / OG / canonical / preload / icon）

---

## 视觉改版 · 首页（粉色格纹 + 小窗口 + 贴纸）

**目标**：按用户提供的参考图调整首页气质，同时保留全部真实资料与项目内容。

**做法**
- 新增 `src/styles/home.css`，全部样式限定在 `body.home-page` 内，其他页面不受影响
- 新增 `WindowCard`（带标题栏与三个小圆点的卡片）与 `Sticker`（猫脸 / 四叶草 / 星芒 / 叶子四个手写 SVG）
- 首页重排为：个人信息窗口 + 代表项目窗口 + 近期文章窗口
- `BaseLayout` 增加可选 `bodyClass`，让单页可以有自己的底色

**关键决策**
- **不引入任何外部图片**。所有装饰都是内联 SVG，由我按线条手写，没有第三方素材、没有版权问题、没有额外请求
- **参考了元素，没有照搬角色**。从用户提到的喜好里取的是「青绿色 + 猫 + 手绘线条」这类抽象特征；没有临摹任何现有角色，也没有使用用户发来的那张猫耳头像（它不是我方素材，且可能涉及他人角色）
- **参考图里的文字与项目是假的，全部丢弃**，站内内容一律取自 `profile.ts` 与 `content/`
- 真实资料与项目条目一处不改，只换呈现方式

**遇到的问题**
1. **贴纸被卡片裁掉** —— 卡片 `overflow: hidden` 会剪掉定位在边界外的贴纸。改为把贴纸放在卡片外的定位容器里。
2. **首次截图看起来手机端被切** —— 实际是 headless Chrome 有最小窗口宽度，`--window-size=390` 并未按 390 布局，截的是裁剪图。改用同源 iframe 固定 375px 宽度渲染，再居中裁剪，才得到真实手机版。
3. **粉色标签对比度 4.31:1**，低于 AA 的 4.5:1。把深玫瑰文字从 `#b03a5f` 调到 `#9c3255`（5.2:1），重新跑分为 100。

**验收结果**
- `npm run check`：0 错误；`npm test`：15 通过；`npm run build`：16 页
- 首页 Lighthouse 移动端：性能 / 无障碍 / 最佳实践 / SEO 均 100
- 375px 与 1400px：`scrollWidth === clientWidth`，无横向溢出，无越界元素
- `.home-page` 只出现在首页 `<body>`；关于 / 项目 / 文章 / 标签 / 404 均返回 200 且外观未变

**你的反馈**
- 待填写

### 视觉改版 v3：版式骨架 + 图片占位位

**目标**：不再手绘装饰，先把**版式密度和留白**做到位，图片位置用中性占位框标出，等用户提供素材。

**做法**
- 背景改为淡粉 + 淡绿两套格纹叠加（粉 26px / 绿 40px，相位错开）
- 容器上限 1180 → 1400，栅格 19rem + 自适应，1440 屏下内容铺满
- 顶栏：logo 占位 + 4 个带图标的胶囊 + 右侧状态；「问问知屿」入口按开关预留
- 左栏三卡：个人资料 / 联系我 / 喜欢的东西（纯文字，含 4 项喜好）；末尾一块可伸展的装饰位
- 右栏：欢迎横幅（左侧文案 + 右侧插画位）、项目更新（每条一个 16:10 图位）、近期文章、角落贴纸位
- 移除此前手绘的猫咪、贴纸与项目插画组件

**关键决策**
- **占位一律用中性虚线框**，框内写清楚「放什么 + 建议尺寸」，避免用大图标假装修饰
- **AI 入口用开关控制**（`features.aiAssistant = false`），真实模型接通前页面上不出现任何可点击的聊天入口
- 左侧装饰位随列高伸展，让两栏底部对齐，不至于右栏很长、左栏空一半

**遇到的问题**
1. **两栏高度差 700px** —— 右栏三个项目加文章列表远高于左栏三张卡。让左栏最后一块占位区按剩余高度伸展，底部对齐。
2. **缩略图链接的可访问名不匹配** —— 图位里有「项目图」等可见文字，外面又加了 `aria-label`，触发 label-content-name-mismatch。改为把整块缩略图标记为装饰（`aria-hidden` + `tabindex="-1"`），键盘用户走标题链接。

**验收结果**
- `npm run check` 0 错误；`npm test` 15 通过；`npm run build` 16 页
- 首页 Lighthouse 移动端四项 100，无不达标审计项
- 375 / 1440 无横向溢出、无越界元素
- 其余页面 200 且外观未变（新增的导航项只作用于首页变体）

**产出**
- `src/components/home/ImageSlot.astro`
- `src/styles/home.css`（重写）
- `src/pages/index.astro`（重排）
- `src/data/site.ts`（features 开关）、`src/data/profile.ts`（interests 字段）

**目标**：上一版只是「原站点加了格纹和边框」，与参考图的**布局**差距仍然明显。这一版改骨架而不是改配色。

**做法**
- 顶部：普通文字导航 → 胶囊导航条（左侧品牌 + 中间带图标的胶囊导航 + 右侧状态）
- 左栏：整幅个人横幅 → 独立的「个人资料」窗口（头像 + 姓名 + 定位胶囊 + 简介 + 坐标/专业/学校/状态）与「联系我」窗口
- 中栏：新增欢迎横幅（虚线网格装饰 + 原创猫咪吉祥物 + 快速入口胶囊）
- 项目：纯文字条目 → 左侧 16:10 封面 + 右侧信息的列表，封面是三张手绘 SVG
- 页脚：普通文字行 → 胶囊状横条
- 贴纸：从零散两个 → 标题栏小徽章、侧栏吉祥物组合、横幅内装饰

**关键决策**
- **插画全部原创**：三张项目封面与吉祥物都是手写内联 SVG，没有位图、没有第三方素材、没有 AI 生成图，也没有在描摹任何现有角色
- **不改动数据**：姓名、项目、文章全部来自 `profile.ts` 与 `content/`
- 首页用 `headerVariant="blog"` 独立渲染导航，其他页面的顶栏一行未动

**遇到的问题**
1. **缩略图链接没有可访问名称** —— 封面 SVG 标了 `aria-hidden`，包住它的 `<a>` 就变成无名链接，Lighthouse 的无障碍掉到 96。补 `aria-label` 后回到 100。
2. **再次踩到截图工具的坑** —— 按测量高度截图时页脚被裁掉几像素，因为先前的测量与截图使用的宽度略有差异。最终改为先量、再按同一宽度出图。

**验收结果**
- `npm run check` 0 错误；`npm test` 15 通过；`npm run build` 16 页
- 首页 Lighthouse 移动端四项均 100
- 375px 与 1400px：`scrollWidth === clientWidth`，越界元素 0
- 其余页面（关于 / 项目 / 文章 / 标签 / 404）全部 200 且外观未变

**你的反馈**
- 待填写

---

### 视觉统一 v4：Wingwen's Blog 与三页共用外壳

**目标**：把首页、项目页、关于页收进同一套「小窗口」外壳，并把面向访客的名称从暂定的「知屿 · Folio」统一为「Wingwen's Blog」。

**做法**
- 站点名称：`site.name` 改为 `Wingwen’s Blog`；`profile` 增加 `alias: 'Wingwen'`；页脚、OG 图、favicon、浏览器标题一起更新
- 导航收敛为三项：博客（`/`）、项目（`/projects`）、关于（`/about`）；文章归档仍在 `/posts`，从首页「查看全部」与标签页进入
- 抽出 `Window`、`ProfileSidebar`、`BlogShell`、`PageHead` 四个共用组件；`home.css` 迁移为 `blog.css`，格纹与 `--blog-*` token 提到全局
- 项目页：页面标题 + 简介 + 两列真实项目卡片（名称、技术标签、简述、详情入口）；第三张跨列；GitHub 贡献区是空状态，只写「待接入真实数据」
- 关于页：自我介绍、教育与经历、技能与研究、个人兴趣、联系方式、简历六个窗口章节
- 文章详情、项目详情、标签页、文章归档、404 统一顶栏与格纹底，正文包进 `solo-shell` + `Window`

**关键决策**
- **窗口是唯一卡片单元**：标题栏、圆点、描边、投影都只在 `Window` 里定义，页面不再复制一组卡片样式
- **手机端主内容在前**：`BlogShell` 的 DOM 顺序是主内容 → 资料栏，桌面端用 `grid-template-areas` 把资料栏放回左侧；这样首屏就能看到 h1
- **GitHub 贡献不画格子**：没有数据形状之前，空状态比一张假日历更诚实，避免把「空」读成「零贡献」
- **简历走待补充分支**：`profile.resume` 仍为 `null`，关于页显示「PDF 待补充」与邮件索取入口，不放空文件链接
- **保留品牌的粉绿格纹、窗口投影、等宽小字与胶囊导航**：这些是用户指定的 2000 年代个人博客语言，与通用设计规范冲突时以用户方向为准，并在截图检查中按品牌例外放行

**遇到的问题**
1. **首次构建的 HTML 全是 0 字节** —— 新建的源文件写入失败，`astro build` 仍报成功。重新逐文件写入并复核 `dist` 体积后修复；最终 16 页全部有内容，空文件 0 个。
2. **手机端 h1 被资料栏挤到 1251px 以下** —— 侧栏在 DOM 里排在前面。改为主内容优先、桌面端用网格区域换位，首屏标题恢复正常。
3. **1440px 下 h1 过大导致三行** —— 放大到 4.6vw 后正文列只有 50%，`Wingwen’s Blog` 被拆成三行。把正文列调到 51%、高亮内边距收到 0.06em，回到两行。
4. **页头内容右侧多出 45px** —— 装饰星星被量成空白。检查后确认页面主栅格左右各 277px（1920 下实测），属于检查工具对装饰元素的误判，未改布局。

**验收结果**
- `npm run check`：0 错误 0 警告；`npm test`：15 通过；`npm run build`：16 页
- 构建产物：0 个空文件；内部链接缺失 0 个
- 浏览器检查：首页 0 FAIL / 2 WARN；项目页与关于页各 1 FAIL（「few-pictures」，因为真实项目只有 3 个、真实照片只有 1 张，不补造素材）
- 1440 / 768 / 390：无横向溢出；手机端首屏即标题；导航三项高亮正确
- 截图：`docs/screenshots/{home,projects,about}-{desktop,mobile}.png`

**你的反馈**
- 待填写

---

### v4.1：真实 GitHub 贡献、简历下载与手机抽屉

**目标**：把项目页的贡献占位区接成真实公开数据，启用附件里的简历 PDF，并把手机端的资料栏改成汉堡菜单抽屉。

**GitHub 数据**
- 公开来源：`https://github.com/users/wingwen/contributions`，个人主页 `https://github.com/wingwen`
- GitHub 的日历接口按自然年返回，忽略 `from` / `to` 的跨年请求。脚本抓取 2025 与 2026 两个自然年，再裁成截止日向前 365 天
- 快照范围：`2025-11-02` 至 `2026-11-01`。2025 年公开贡献为 0，2026 年页面显示 355 次，逐日求和与页面总数一致
- 核对结果：355 次贡献，58 天有记录，单日最高 20 次。未来日期没有非零记录
- 数据文件：`src/data/contributions.json`；刷新命令：`npm run contributions`
- 构建时会再校验一次总数与活跃天数，逐日数据对不上就拒绝构建
- 页面展示：粉色深浅五级、总次数、活跃天数、数据截至日期、范围、GitHub 主页链接。没有渲染任何伪造格子

**简历**
- 文件：`public/profile.resume.pdf`（781,287 字节），构建后同源提供
- `profile.resume` 指向 `/profile.resume.pdf`，关于页显示「PDF 简历 / 下载简历（PDF）↓」按钮
- 原来的待补充与邮件索取分支保留，只有 `profile.resume` 为空时才会出现

**手机抽屉**
- 顶栏左上角新增汉堡按钮，仅在 `< 64em` 显示
- 使用原生 `<dialog>` + `showModal()`：焦点被困在面板内，Escape 关闭，关闭后焦点回到按钮
- 抽屉内容复用 `ProfileSidebar`，因此资料栏只有一套组件；桌面端仍固定在左栏，手机端 `.blog-side` 隐藏，不再追加在主内容之后
- 遮罩点击关闭，抽屉内链接点击后关闭，打开时锁定页面滚动，屏幕变宽到桌面断点时自动关闭
- 没有 JS 时通过 `<noscript>` 恢复主内容下方的资料栏，并隐藏汉堡按钮

**遇到的问题**
1. GitHub 接口按自然年返回，`from` / `to` 没有跨年效果。改为抓两年再裁滚动窗口，并在脚本里校验页面总数与逐日求和不一致就失败
2. 抽屉最初用 grid，四张卡被压成等高，正文被卡片裁掉。改为 flex column + `flex: 0 0 auto`，内容按自身高度排列，整块滚动
3. 贡献图在 390px 放不下 53 周。保留横向滚动并在手机上提示「左右滑动查看完整日历」；768px 把格子降到 9px 后可完整放下

**验证**
- `npm run check`：0 错误 0 警告；`npm test`：15 通过；`npm run build`：16 页
- 构建产物 0 空文件，内部链接缺失 0 个；简历 PDF 以 200 返回
- 浏览器检查：首页 0 FAIL / 2 WARN；项目页 1 FAIL（few-pictures）1 WARN（贡献图在 390 横向滚动）；关于页 1 FAIL（few-pictures）0 WARN
- 抽屉手动检查：打开、关闭按钮、Escape、焦点归还、滚动锁定、桌面断点自动关闭均通过

**截图**
- `docs/screenshots/{home,projects,about}-{desktop,mobile}.png`
- `docs/screenshots/profile-drawer-mobile.png`
- `docs/screenshots/projects-contributions.png`
- `docs/screenshots/about-resume.png`

---

### v4.2：GitHub 仓库自动同步

**目标**：在项目页增加自动同步的 GitHub 公开仓库区，展示仓库名、简介和技术标签，不手写仓库数据。

**数据来源**
- `https://api.github.com/users/wingwen/repos` 拉取公开仓库
- 每个仓库再请求 `/languages` 取语言字节占比，取前 4 个作为标签；GitHub Topics 有值时一并合并
- 抓取时共有 3 个公开仓库

| 仓库 | 简介 | 标签 | 备注 |
|---|---|---|---|
| WingwenBlog | 站点本身的公开仓库 | Astro / CSS / TypeScript / JavaScript | 非 fork |
| Mem-RAG | 仓库未填写简介 | Python / HTML | 页面显示「仓库未填写简介。」，没有补写 |
| CoreCoder-Agent | 扩展 Fork，基于 he-yufeng/CoreCoder | Python | 标记 Fork |

- 所有 Topics 都是空的，所以技术标签实际来自语言统计
- 快照：`src/data/repositories.json`；刷新命令：`npm run repositories`，两个 GitHub 快照一起刷新用 `npm run github`
- 页面构建时校验仓库数量与链接归属，避免把别的账号的链接渲染进来

**展示**
- 项目页顺序为页面标题、GitHub 贡献、精选项目卡片、GitHub 仓库
- 桌面 3 列、平板 2 列、手机 1 列；卡片含名称、简介、标签、更新时间与「查看仓库」入口
- 仓库名和「查看仓库」都链接到仓库主页，窗口标题栏另有「GitHub 主页」
- 数据截至抓取日，页面标注 `数据截至 2026.11.01`

**验证**
- `npm run check`：0 错误 0 警告；`npm test`：15 通过；`npm run build`：16 页
- 构建产物 0 空文件，内部链接缺失 0 个
- 项目页浏览器检查：1 FAIL（few-pictures，仍是 3 张项目图）1 WARN（贡献图在 390 横向滚动）
- 仓库区没有新增失败项，正文大小回到 16px

**截图**
- `docs/screenshots/projects-repositories.png`
- `docs/screenshots/projects-desktop.png` 与 `projects-mobile.png` 已更新

---

### v4.3：侧栏「个人标签」

**目标**：把侧栏的「喜欢的东西」改成「个人标签」，换成用户给定的 24 个标签，并删掉侧栏的「技能」卡片。

**做法**
- `profile` 新增独立的 `tags` 字段，保留原有 `interests`，关于页的「个人兴趣」不受影响
- 侧栏标题改为「个人标签」，内容改为 flex 标签云，粉绿交替的圆角 chip，保留猫猫贴纸
- 侧栏删除「技能」窗口，关于页的「技能与研究」仍在
- 标签里的 emoji 按用户原文保留，没有替换成文字
- 标签变多后侧栏高度到 1034px，原 sticky 侧栏在 900px 屏幕上会永久裁掉底部。改为普通屏幕随页面滚动，只有视口高度 ≥1080px 时才 sticky

**验收**
- `npm run check`：0 错误 0 警告；`npm run build`：16 页；内部链接缺失 0 个
- 侧栏截图 320×1034，24 个标签全部渲染；侧栏不再出现「喜欢的东西」和「技能」
- 浏览器检查：首页因标签中的 emoji 报 1 FAIL，按用户明确要求放行；项目页 1 FAIL（few-pictures）1 WARN（贡献图在 390 滚动）；关于页 1 FAIL（few-pictures）
- 关于页的「个人兴趣」仍是原来的四项，等待用户决定是否同步

**截图**
- `docs/screenshots/profile-sidebar-tags.png`
- `docs/screenshots/profile-drawer-mobile.png`
- `docs/screenshots/{home,projects,about}-desktop.png` 已更新

---

### v4.4：侧栏身份调整与首页精简

**改动**
- 侧栏个人资料删除真实姓名，只保留 Wingwen
- 职位从「计算机技术硕士在读 · 做全栈开发与 LLM 应用落地」改为「数据定价 · 全栈开发实习生」，这是共享 tagline，首页、关于页、OG 图一起更新
- 侧栏简介改为独立的 `siteIntro`：「这里是我的个人网站，记录热爱与成长。喜欢动漫编程，乐享生活，期待相遇✨」，关于页长简介不变
- 侧栏「个人标签」里的贴纸从黑猫换成史莱姆
- 页脚删除 `sticker--footer` 史莱姆贴纸
- 首页删除「近期文章」卡片，欢迎横幅的入口从「近期文章」改为「文章」，仍指向 `/posts`
- 清理不再使用的 `.profile-name`、`.post-item*`、`.sticker--post`、`.sticker--footer` 样式

**需要确认**
- 真实姓名仍出现在首页欢迎语、关于页标题简介、页脚、OG 图和证件照 alt 中。这次只按选中节点删了侧栏姓名，是否全站统一改用 Wingwen，等用户决定。

**验证**
- `npm run check`：0 错误 0 警告；`npm test`：15 通过；`npm run build`：16 页
- 构建产物 0 空文件，内部链接缺失 0 个
- 首页不再包含「近期文章」和页脚贴纸；侧栏不再包含 `profile-name`
- 浏览器检查：首页 0 FAIL / 2 WARN（emoji 按用户要求放行）；项目页 1 FAIL（few-pictures）1 WARN（贡献图在 390 滚动）；关于页 1 FAIL（few-pictures）0 WARN
- 侧栏高度 994px，普通屏幕随页面滚动，高屏才 sticky

**截图**
- `docs/screenshots/profile-sidebar-tags.png`
- `docs/screenshots/profile-drawer-mobile.png`
- `docs/screenshots/{home,projects,about}-{desktop,mobile}.png` 已更新

---

### v4.5：标签贴纸并排与资料说明便签

**改动**
- 史莱姆贴纸改为浮动在标签右侧，落在标签区右下角，不再单独占一行
- 标签列表改为行内标签，文字围绕贴纸换行
- 标签下方新增撕边便签：浅黄卡纸、细横纹、轻微旋转与投影，左上角淡粉胶带
- 便签文案：「本网站图片素材均来源于网络，有任何问题请联系我删除」，「联系我」是 mailto 链接
- 便签右下角放缩小版 `sticker-miku.webp`，比例约 2.9rem
- 侧栏高度增至 1026px，移除了 sticky，普通屏幕随页面滚动，保证便签完整可见

**样式入口**
- 便签颜色由 `.notice-note` 的 `--notice-bg` 与 `--notice-ink` 控制，当前浅黄；换奶蓝或淡粉只改这两个变量

**验证**
- `npm run check`：0 错误 0 警告；`npm run build`：16 页；内部链接缺失 0 个
- 浏览器检查：首页 0 FAIL / 2 WARN（emoji 放行）；项目页 1 FAIL（few-pictures）1 WARN（贡献图在 390 滚动）；关于页 1 FAIL（few-pictures）0 WARN
- 侧栏截图 320×1026，标签、贴纸、便签与 miku 完整显示，便签文字没有截断

**截图**
- `docs/screenshots/profile-sidebar-tags.png`
- `docs/screenshots/profile-drawer-mobile.png`
- `docs/screenshots/{home,projects,about}-desktop.png` 已更新

---

### v4.6：关于页精简与职位补全

**改动**
- 关于页删除「自我介绍」「个人兴趣」「联系方式」三个窗口，只保留「教育与经历」「技能与研究」「简历」
- 关于页标题简介改为「你好👋，我是Wingwen，广州大学计算机专业硕士在读。」
- 侧栏职位补全为「计算机技术专业 · 数据定价 · 全栈开发实习生」
- 职位按 ` · ` 拆成不可断行的片段，行尾带分隔点，避免第二行以孤立的「·」开头
- 关于页正文的证件照随「自我介绍」卡片一起移除；侧栏头像仍在
- 清理关于页不再使用的自介、事实、兴趣、联系方式样式与 Image 引用

**验证**
- `npm run check`：0 错误 0 警告；`npm test`：15 通过；`npm run build`：16 页
- 构建产物 0 空文件，内部链接缺失 0 个
- 关于页检查 1 FAIL / 1 WARN。FAIL 是 `few-pictures`，因为正文照片随卡片移除，页面只剩装饰图；WARN 是 `name-only-title`，因为新简介长度不到检查器的解释阈值，按用户给定文案保留
- 关于页正文不再出现真实姓名；首页欢迎语、页脚、OG 图与证件照 alt 仍保留，等待用户决定是否统一改用 Wingwen

**截图**
- `docs/screenshots/about-desktop.png` 与 `about-mobile.png`
- `docs/screenshots/profile-sidebar-tags.png` 与 `profile-drawer-mobile.png`

---

### v4.7：毕设内容、页脚统一与 About 标题

**改动**
- 侧栏职位删除「数据定价」，改为「计算机技术专业 · 全栈开发实习生」
- 关于页「教育与经历」窗口新增「毕设 / 论文：数据定价」：研究简介、主要工作三点（TDS 方法族、SUCV 估值框架、统一评估协议）
- 英文缩写之间补齐空格，保持与页面其他技术文本一致
- 关于页 h1 从「关于」改为「About」，导航仍保留中文「关于」
- 页脚装饰（花、樱花、星）从首页插槽移入 `SiteFooter`，首页、项目页、关于页及其他页面现在共用同一份页脚
- 关于页删除自我介绍、个人兴趣、联系方式后，正文只剩教育与经历、技能与研究、简历

**验证**
- `npm run check`：0 错误 0 警告；`npm test`：15 通过；`npm run build`：16 页
- 构建产物 0 空文件，内部链接缺失 0 个
- 关于页 1 FAIL / 1 WARN。FAIL 是 `few-pictures`，因为正文没有照片；WARN 是 `name-only-title`，新简介长度不到检查器阈值，文案按用户给定保留
- 页脚装饰在首页、项目页、关于页均存在

**截图**
- `docs/screenshots/about-thesis.png`
- `docs/screenshots/footer-shared.png`
- `docs/screenshots/about-desktop.png` 与 `about-mobile.png`
- `docs/screenshots/profile-sidebar-tags.png` 与 `profile-drawer-mobile.png`

---

### v4.8：项目标题在线入口

**改动**
- `projects` 内容 schema 增加可选 `liveUrl`，只接受合法 URL
- `mail.md` 配置 `liveUrl: 'https://wachater.com/email'`
- 项目详情页标题在存在 `liveUrl` 时渲染为链接，悬停或键盘聚焦时显示粉色高亮与深玫瑰文字
- 没有 `liveUrl` 的项目（Lazetrade、Lisa）标题保持纯文本，不出现空链接

**验证**
- `npm run check`：0 错误 0 警告；`npm run build`：16 页
- Mail 详情页标题链接为 `https://wachater.com/email`，其他项目没有该链接
- 悬停截图确认粉色高亮生效

**截图**
- `docs/screenshots/project-mail-title-hover.png`

---

### v4.9：全站 Wingwen、关于页头像与项目新标签页

**改动**
- `profile.name` 从真实姓名改为 Wingwen，`alias` 保持 Wingwen
- 首页欢迎语、页脚、页面描述、OG 图说明、OG 图片标题、关于页 meta、简历索取主题、证件照 alt 全部改用 Wingwen
- 页脚不再出现「Wingwen · Wingwen」重复，只保留一个 Wingwen
- 关于页页头右侧贴纸换成指定的 `3a7a6391394a68bf88f44d7baa0087a5aa57c20c.jpg@240w_240h_1c_1s_!web-avatar-nav.webp`，PageHead 增加方形贴纸的宽高参数
- Lazetrade 详情页标题配置 `https://wachater.com/products`，Mail 详情页标题保持 `https://wachater.com/email`
- 两个项目标题链接都改为新标签页打开，并加 `aria-label` 说明
- 项目详情页原本已有「系统截图」区块，Lazetrade 使用 `lazetrade-app.jpg`，Mail 使用 `mail-app.png`；清理了重复的 `liveUrl` 与临时 `detailImage` 字段
- 共享页脚继续覆盖首页、项目页、关于页

**验证**
- `npm run check`：0 错误 0 警告；`npm test`：15 通过；`npm run build`：16 页
- 全站 16 个 HTML 中真实姓名出现 0 次
- 内部链接缺失 0 个；两张项目截图均存在
- 首页 0 FAIL / 2 WARN；项目页 1 FAIL / 1 WARN；关于页 1 FAIL / 1 WARN，均为既有的图片数量与短标题提示

**说明**
- 简历 PDF 的内容没有改，文件本身仍包含真实姓名
- 项目截图里的姓名、邮箱属于图片内容，没有做图像修改

**截图**
- `docs/screenshots/home-desktop.png`、`about-desktop.png` 与手机版
- `docs/screenshots/footer-shared.png`
- `docs/screenshots/project-mail-screenshot.png`
- `docs/screenshots/project-lazetrade-screenshot.png`
- `docs/screenshots/project-mail-title-hover.png`

---

### v4.10：汉堡按钮移入导航栏左侧

**改动**
- `.drawer-toggle` 从品牌之前移到 `.blog-bar__nav` 内部，位于导航链接左侧
- `.blog-bar__nav` 改为 flex 行，按钮与导航胶囊之间留 0.5rem
- 手机端布局变为：第一行品牌与星星贴纸，第二行汉堡按钮 + 三个导航入口
- 桌面端按钮仍隐藏，导航位置不变
- 抽屉脚本、焦点归还与滚动锁逻辑不变

**验证**
- `npm run check`：0 错误 0 警告；`npm run build`：16 页
- 390px 下按钮在导航内，按钮左边与导航左边同为 28px
- 点击按钮后 `dialog.open = true`，`aria-expanded = true`
- 首页 0 FAIL / 2 WARN

**截图**
- `docs/screenshots/header-mobile.png`
- `docs/screenshots/home-mobile.png` 已更新

---

### v4.11：职位去掉分隔点与项目页罗小黑

**改动**
- 侧栏职位不再渲染 ` · ` 分隔点，按空格拆成「计算机技术专业」与「全栈开发实习生」两行
- 首页欢迎横幅里可见的职位也去掉分隔点
- `profile.tagline` 本身仍保留 ` · `，只用于 meta 与 OG 文案，不影响页面可见文本
- 项目页 PageHead 右侧贴纸从 `sticker-star.webp` 换成 `sticker-cat-black.webp`（罗小黑），按 300×274 的真实比例传参
- 关于页页头仍使用指定的方形头像

**验证**
- `npm run check`：0 错误 0 警告；`npm test`：15 通过；`npm run build`：16 页
- 内部链接缺失 0 个
- 首页 0 FAIL / 2 WARN；项目页 1 FAIL / 1 WARN；关于页 1 FAIL / 1 WARN
- 项目页头部贴纸 `src` 为 `/images/home/sticker-cat-black.webp`

**截图**
- `docs/screenshots/profile-sidebar-tags.png` 与 `profile-drawer-mobile.png`
- `docs/screenshots/projects-header-black-cat.png`
- `docs/screenshots/projects-desktop.png` 与 `projects-mobile.png`
- `docs/screenshots/home-desktop.png`、`about-desktop.png` 与手机版已更新

### v4.12：侧栏 AI 助手入口卡

**改动**
- 新增 `src/components/AssistantEntry.astro`：资料栏「个人标签」下方加一张对话框造型的入口卡，圆角卡面加一只朝上的小尾巴，标题后面跟打字省略号，配色沿用窗口的粉线、奶油底与偏移阴影
- 组件挂在 `ProfileSidebar` 末尾，桌面左栏和手机抽屉共用同一份，不各写一套
- 卡片名字取 `问问 ${profile.alias}`，与导航右侧入口同源，站点改昵称后不会留下旧名字
- `src/data/site.ts` 新增 `assistant` 配置，`href`、引导语、未接通文案与动作文字集中在一处
- `features.aiAssistant` 仍为 `false`：卡片渲染成不可点击的 `div` 并写明「未接通」，全站不会出现指向 `/assistant` 的链接；接通模型后改成 `true`，同一个组件自动换成 `a` 标签

**验证**
- `npm run check`：0 错误 0 警告；`npm test`：15 通过；`npm run build`：16 页
- `dist/index.html` 中 `href="/assistant"` 出现 0 次，卡片标记各出现 2 次（左栏与手机抽屉各一份）
- 桌面 1440 截图可见卡片在侧栏底部；手机 390 打开抽屉滚到底可见同一张卡

**截图**
- `docs/screenshots/home-desktop.png` 与 `home-mobile.png`（换新卡后更新）
- `docs/screenshots/assistant-card-mobile.png`（抽屉滚到底）

### v4.13：移除文章栏目

**改动**
- 删除 3 篇示例文章 `example-post` / `layout-demo` / `short-demo`，以及整个 `src/content/posts/` 目录
- 删除文章页面：`pages/posts.astro`、`pages/posts/[slug].astro`、`pages/tags/[tag].astro`（含 5 个标签页）
- 删除只为文章服务的代码：`lib/posts.ts`、`lib/posts.test.ts`、`components/PostEntry.astro`
- `content.config.ts` 去掉 `posts` 集合，`collections` 只剩 `projects`
- 首页欢迎横幅去掉「文章」胶囊，引导语改为「记录项目和最近在做的事」
- 404 页去掉「文章归档」入口，描述同步收窄
- 项目数不变，页数从 16 降到 7

**关键决策**
- **连 schema 和工具函数一起删**。只删页面会留下一个没人用的集合定义和一套死函数，下次改 schema 还要为它做决定
- **不留「文章即将上线」之类的占位**。栏目整个去掉，导航与入口一处不剩，将来要恢复直接从 Git 取回这批文件
- `npm test` 改为 `vitest run --passWithNoTests`。原来的 15 条测试全部是文章工具函数的，随代码一起删掉了，脚本不能因此报失败

**验证**
- `npm run check`：0 错误 0 警告 0 提示
- `npm run build`：7 个页面（首页、关于、项目列表、3 个项目详情、404）
- `npm test`：无测试文件，退出码 0
- `dist` 中 `href="/posts*"` 与 `href="/tags*"` 均为 0 条；sitemap 6 条，无 posts / tags
- `astro preview` 下 `/posts` 返回 404，首页 200

**截图**
- `docs/screenshots/home-desktop.png` 与 `home-mobile.png`（去掉文章入口后更新）

### v4.14：文档收口与项目测试补齐

**改动**
- 删除两张过时截图 `posts-empty-desktop.png`、`posts-empty-mobile.png`（文章空态，功能已不存在）
- 新建 `README.md`。仓库此前没有 README，这次按当前实现写：页面清单、技术栈、命令、改内容的入口、部署变量、已知限制
- 需求文档 `prd.md`：首页区块与 R1 改为两区块；R4 与 AC-4 标记作废；AC-1 / AC-6 / AC-8 改为只针对项目；新增 §7 变更记录，写明移除范围与恢复方式
- 技术设计 `design.md`：目录结构删去 `posts/`；4.2 标记集合已移除；排序规则补全为「年份倒序 → order 升序 → id 兜底」；占位策略与布局描述去掉文章；6.4 补上与侧栏说明卡一致的表述
- 执行计划 `implement.md`：P2 改两区块，P4 整节划掉并注明撤销原因与现状，回滚点与测试范围同步更新
- 内容清单 `content-checklist.md`：文章一节改为「已取消」；占位写法约定与加分项里的文章配图删掉
- 技术决策 `decisions.md`：D1 去掉「文章」、D6 的规模例子改为条目数、D7 重写为「项目排序 + AI 检索 + schema」并记录中间曾无单元测试
- 开发日志：P4 段首加撤销说明，正文作为历史记录原样保留，不篡改当时的过程

**关于测试**
- 文章栏目删除后，原本的 15 条测试随 `lib/posts.ts` 一起消失，仓库**一度没有单元测试**，当时把 `npm test` 临时改成带 `--passWithNoTests` 才不报错
- 现在补了 `src/lib/projects.test.ts`，8 条用例覆盖：年份倒序、同年按 `order` 升序、缺省 `order` 排最后、并列时按 `id` 稳定、输入数组不被修改、`displayPeriod` 两个分支、`projectHref`
- `test` 脚本恢复为 `vitest run`，没有测试文件时会直接失败，不允许沉默通过
- 变异测试确认不是空断言：把 `PROJECTS_WITHOUT_EXPLICIT_ORDER` 从 `Number.MAX_SAFE_INTEGER` 改成 `0`，对应用例立即失败；改回后 8 条全绿

**验证**
- `npm run check`：0 错误 0 警告 0 提示
- `npm test`：8 条通过（1 个文件）
- `npm run build`：7 页
- `README.md`、`docs/`、`.trellis/tasks/10-29-portfolio-site/` 中剩余的「文章」字样全部出现在「已移除」的说明或变更记录里，不再是当前功能描述

### v4.15：P6a · 助手的语料与核心函数

**目标**：把 AI 助手的服务端核心写完并测透，不部署、不接真实 Key、页面无变化。

**改动**
- `scripts/build-ai-corpus.mjs`：只读 `profile.ts` 与三个项目 md，生成 `src/server/corpus.generated.ts`（派生文件，已 gitignore）；语料里出现 `/posts`、`/tags`、「文章」时构建失败
- `src/server/prompt.ts`：系统指令、材料拼接、历史拼装、输入清洗（去尖括号、压空白、限 300 字）
- `src/server/chat.ts`：`handleChat(request, env, deps)`，纯 Web 标准；网络与限流从参数注入
- `src/server/chat.test.ts`：19 条测试
- `package.json` 增加 `corpus` 脚本并挂到 `prebuild` / `pretest`

**关键决策**
- **语料生成 TS 而不是 JSON**。Node 原生导入 JSON 需要 import attributes，本地脚本与单测都会被绊一下；生成 `.ts` 后可以直接当普通模块导入
- **模型回调与限流器都注入**。单测不触网、不花钱，也不依赖任何平台绑定
- **拒答用短标记判定**（`不在我的公开资料里`），不比对整句，容忍模型在固定话术外多说几个字

**遇到的问题**
1. **profile.ts 里有图片导入，Node 跑不起来** —— 生成脚本先把头像那行替换成占位常量，写进临时目录再 import，临时目录用完即删。若哪天导入行变了，脚本会显式报错而不是静默生成空资料
2. **项目 frontmatter 里有嵌套对象**（`screenshots` 的每一项是对象） —— 手写解析器遇到缩进的 `key:` 就整块跳过，语料本来也不需要截图；其它无法识别的写法仍然直接报错
3. **冒烟脚本一开始直接 import 源码失败** —— Node 的 ESM 不会给无扩展名的相对导入补 `.ts`。改用 Vite 的 SSR 加载器跑真实 `handleChat`，与单测同一条解析链

**验证**
- `npm test`：27 通过（8 + 19）；`astro check`：0 错误 0 警告；`npm run build`：7 页
- 语料：5 个来源、3516 字符、约 2200 tokens；system prompt 实测 4025 字符
- 本地假上游冒烟 8 个场景：200（带来源）/ 拒答清空来源 / 越界来源被过滤 / 400 / 403 / 429 / 502 / 503 全部符合预期
- 部署与密钥：均未触碰

### v4.16：P6b · 本地函数适配与 Cloudflare 能力验证

**目标**：把 Pages Functions 适配器与限流接上，用 `wrangler pages dev` 在本机验证平台能力；不部署、不配线上 Secret。

**改动**
- `functions/api/chat.ts`：薄适配器，读绑定、注入额度检查、转调 `handleChat`
- `src/server/budget.ts` + `budget.test.ts`：D1 日额度（北京时间切天，`ON CONFLICT ... RETURNING` 自增）
- `wrangler.toml`：`pages_build_output_dir`、`[[ratelimits]]` 绑定；D1 绑定留占位注释
- `.gitignore`：`.dev.vars` → `.dev.vars*`
- `.env.example`：只列变量名
- `wrangler` 装为 devDependency

**关键决策**
- **预算从 DO 改成 D1**。Cloudflare 文档明确写「不能在 Pages 项目内部署 Durable Object」，必须另建 Worker 绑定，与统一部署冲突。D1 是 Pages 原生单主库，够承担日额度。
- **额度只在真正调模型前扣**。第一版放在适配器最前面，实测发现 403/400/405 也会扣额度，等于让攻击者用空请求烧掉预算；改成通过注入的 `consumeBudget` 在校验与限流之后执行。

**实测（本地 `wrangler pages dev`，假上游，无真实 Key）**

| 验证点 | 结果 |
|---|---|
| Pages Functions 能否 import `src/server/*` | 通过，`Compiled Worker successfully` |
| `ratelimits` 绑定能否在 Pages 声明 | 通过，启动信息 `Rate Limit 8 requests/60s` |
| 限流是否真的生效 | 通过，探针第 9 次起 `success:false`；`/api/chat` 超限返回 429 |
| D1 绑定与建表 | 通过，`chat_budget` 自动建表并自增 |
| 额度只在实际调用时扣 | 通过，403/400/405 后计数不变，仅两次 200 使 count = 2 |
| `.dev.vars` 是否被忽略 | 通过，`git check-ignore` 命中 `.dev.vars*` |
| WAF 速率规则 | 未验证，需真实账号与自定义域名 |

**遇到的问题**
1. **项目 frontmatter 里的嵌套字段**：`screenshots` 每项是对象，简易解析器原先直接报错，改为整块跳过。
2. **额度扣在错误的层级**：见上，已重构到模型调用前。
3. **本地后台进程被回收**：`(npx wrangler pages dev &)` 这种方式起的服务在 shell 调用结束后会消失，改用工具托管的后台任务。

**产物**
- `functions/api/chat.ts`、`src/server/budget.ts`、`src/server/budget.test.ts`、`wrangler.toml`、`.env.example`
- `npm test` 35 通过；`astro check` 0 错误；`npm run build` 7 页
- 页面仍然没有任何变化，入口留到 P6c

### v4.17：P6c · 对话面板与入口

**目标**：把「问问 Wingwen」从一张说明卡变成可用的对话面板，用假上游把交互跑通；不接真实 Key、不部署。

**改动**
- `src/components/AssistantChat.astro`：`<dialog>` 面板（标题栏 / 消息区 / 快捷问题 / 输入区 / 字数与清空提示）
- `src/scripts/assistant-chat.ts`：会话状态与请求逻辑单独成模块，严格类型
- `AssistantEntry.astro` 改成 `<button data-chat-open>`；顶部导航的「问问 Wingwen」同步改成按钮
- `blog.css`：面板、气泡、快捷问题、输入区、错误气泡与重试按钮
- `features.aiAssistant` 打开

**关键决策**
- **会话只在内存里**。不写 localStorage / sessionStorage / cookie，刷新即清空；关闭面板再打开保留当前会话
- **每次只带最近 3 轮**，且强制以用户发言开头；服务端仍会再裁一次，前端裁剪只是减少传输
- **失败也是消息**。错误以琥珀色气泡出现在会话里，带重试按钮，点一下原问题重发，不清空输入

**遇到的问题**
1. **内联 `<script>` 触发 28 个类型错误**。Astro 会对 `<script>` 做类型检查，隐式 any 全部报错；把逻辑抽到 `src/scripts/assistant-chat.ts` 后归零
2. **快捷问题隐藏不掉**。`hidden` 属性被 `.chat__quick { display: flex }` 覆盖，补 `.chat__quick[hidden] { display: none }`
3. **开场白会被 render() 清掉**。改为首次从 DOM 读一次文案，之后每次渲染都把它放在最前面，且不进会话数组、不发模型
4. **导航里的胶囊指向不存在的 `/assistant`**。开关打开后它变成死链，改成按钮，与卡片共用同一个面板

**验证（1440×900 与 390×844，`wrangler pages dev` + 假上游）**
- 打开面板、快捷问题、多轮追问、来源链接、上游 500、错误气泡、重试成功，全部按预期
- 刷新后气泡数回到 1，`localStorage + sessionStorage + cookie` 长度为 0
- `npm test` 35 通过；`astro check` 0 错误；`npm run build` 7 页

**截图**
- `docs/screenshots/chat-desktop-{open,multiturn,error,retry}.png`
- `docs/screenshots/chat-mobile-{open,multiturn,error}.png`

**费用口径修正**：之前的「日额度 200 次 ≈ 2 元/天」是估算，未用真实 Key 核对。已把 §5.3 改成「费用控制（待核实）」，写明单价、单次 token 用量、拒答率都需接入真实 Key 后复测；预充余额与关闭自动续费是当前唯一不依赖估算的兜底。

### v4.18：P7 首次部署 · 两次失败与修正

**第一次失败**：部署命令填了 `npx wrangler deploy`（Workers 的命令）。构建本身成功，wrangler 提示应改用 `wrangler pages deploy`，随后报 `Missing entry-point to Worker script`。

**第二次失败**：改成 `npx wrangler pages deploy dist` 后，配置校验拒绝：

```
Configuration file for Pages projects does not support "ratelimits"
```

**这是一条必须记下来的判断错误**：P6b 时我看到本地 `wrangler pages dev` 接受 `[[ratelimits]]` 并能生效，就写成了「Pages 支持限流绑定」。实际上本地开发用的 miniflare 会模拟这个绑定，而 `wrangler pages deploy` 在推送到 Pages 时做配置校验，直接判定不支持。**本地能跑 ≠ 平台支持**，验证时要跑到真实部署的那一步。

**修正**
- `wrangler.toml` 去掉 `[[ratelimits]]`，加注释说明原因
- 单 IP 限流改由 D1 的分钟桶承担（`chat_rate` 表，key = `分钟:IP`），与每日额度共用一套计数逻辑
- `handleChat` 的额度依赖改为可回传拒绝原因（`rate_limited` / `daily_budget_exhausted`）
- 测试从 35 条增到 42 条，覆盖分钟分桶、跨分钟重置、不同 IP 独立计数、拒绝原因映射

**本地实测**（`wrangler pages dev` + D1，连续 10 次请求）：前 8 次 200，第 9、10 次 429 `rate_limited`。

### v4.19：P7 上线与真实联调

**线上地址**：`https://wingwenblog.2592959544.workers.dev`

**过程中的两次路线错误**
1. 部署命令填 `npx wrangler deploy`，但仓库当时是 Pages 形态（`functions/` + `pages_build_output_dir`），报 `Missing entry-point`。
2. 换成 `wrangler pages deploy dist` 后，配置校验拒绝 `[[ratelimits]]`（Pages 不支持）；去掉后仍失败，因为账号里只有 Worker，没有同名 Pages 项目。

根因是项目类型判断错了：控制台里 `wingwenblog` 是 Worker。最终把仓库改成 Worker 形态——`src/worker.ts` 作为入口，`[assets]` 托管 `dist`，`/api/chat` 走同一入口，`functions/` 删除。改完一次部署成功。

**真实联调结果**

| 场景 | 结果 |
|---|---|
| 正常提问「你实习做了什么」 | 200，答案与 profile 一致，来源 `/about`，1.9s |
| 项目提问「Lisa 的评测怎么做」 | 200，引用 `/projects/lisa`，细节与 lisa.md 一致 |
| 站外提问「今天深圳天气」 | 200，固定拒答话术，`sources: []`，1.2s |
| 连续请求 | 第 9 次起 429 `rate_limited`（D1 分钟桶） |
| 来源链接 | `/about/`、`/projects/lisa/` 均 200 |
| 静态页 / 资源 / 404 | 全部正常，404 命中自定义页 |

**配置要点**
- `SITE_URL` 是构建期变量，配完要重新部署；canonical / robots / sitemap 已随之更新
- `ALLOWED_ORIGINS` 放在 `wrangler.toml` 的 `[vars]`，跟着代码走
- `DEEPSEEK_API_KEY` 用 `npx wrangler secret put DEEPSEEK_API_KEY` 写入，只在 Worker 运行时可见
- 控制台的「构建变量」只在 build 阶段可见，不会进入 Worker 运行时——这一点踩过一次

**清理**：`public/` 下的 `.DS_Store` 会在构建时被复制进 `dist` 并上传，已删除。



