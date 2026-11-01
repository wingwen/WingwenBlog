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
