# 部署说明

> 线上地址：`https://wingwenblog.2592959544.workers.dev`
> 平台：**Cloudflare Worker**（不是一个 Pages 项目）。静态站点与 `/api/chat` 由同一个 Worker 承担。

## 1. 线上到底是什么

| 事实 | 依据 |
|---|---|
| 项目类型是 Worker | 控制台路径 `Workers & Pages → wingwenblog → 生产`；`npx wrangler deployments list --name wingwenblog` 能列出 Worker 版本 |
| 账号里没有 Pages 项目 | `npx wrangler pages project list` 返回空 |
| 静态站点由 Worker 托管 | `wrangler.toml` 的 `[assets] directory = "./dist"`，部署日志里显示 `env.ASSETS Assets` |
| 聊天接口在同一个 Worker 里 | `src/worker.ts` 把 `/api/chat` 交给 `src/server/chat.ts`，其余请求交给 `ASSETS` |

**没走 Pages 的原因**：早先按 Pages 设计过（`functions/` 目录 + `pages_build_output_dir` + `wrangler pages deploy`）。部署时连续失败两次——一次是命令用错，一次是 Pages 配置不支持 `[[ratelimits]]`；把配置修掉后仍然失败，因为账号里只有 Worker，`wrangler pages deploy` 找不到同名 Pages 项目。改成 Worker 入口后一次部署成功。

## 2. 仓库里与部署相关的文件

```
wrangler.toml        Worker 名称、入口、静态资源、D1 绑定、[vars]
src/worker.ts        Worker 入口：/api/chat → handleChat，其余 → ASSETS
src/server/chat.ts   与平台无关的请求处理（Web 标准 Request/Response）
src/server/budget.ts D1 计数：日额度 + 单 IP 分钟桶
scripts/build-ai-corpus.mjs  构建期生成语料
.env.example         变量名样例，不含真实值
.dev.vars            本地机密，已被 .gitignore 忽略
```

## 3. 配置项

| 名称 | 放哪 | 值 | 说明 |
|---|---|---|---|
| `SITE_URL` | Cloudflare 构建变量 | `https://wingwenblog.2592959544.workers.dev` | **构建期**使用，决定 canonical / og:url / sitemap / robots；改完要重新构建 |
| `ALLOWED_ORIGINS` | `wrangler.toml` 的 `[vars]` | 同上 | 运行期；改了要重新部署 |
| `DEEPSEEK_API_KEY` | `npx wrangler secret put DEEPSEEK_API_KEY` | 真实 Key | 运行期机密，不进仓库、不进构建日志 |
| `CHAT_BUDGET_DB` | `wrangler.toml` 的 `[[d1_databases]]` | `605da921-8de8-46f0-9419-05f29ae5273d` | D1 库 `wingwen-chat-budget`（region APAC） |

**踩过的坑**：控制台的「构建变量」只在 build 阶段可见，不会进入 Worker 运行时。`DEEPSEEK_API_KEY` 和 `ALLOWED_ORIGINS` 必须走 Worker 的「变量和机密」或 `wrangler.toml`。

## 4. 第一次部署 / 以后每次部署

```bash
npm install
npm run build            # prebuild 会自动生成 AI 语料
npx wrangler deploy      # 上传 Worker + 静态资源
```

Git 侧也接了自动构建：推送到 `portfolio-site` 会触发构建，构建命令 `npm run build`、部署命令 `npx wrangler deploy`。

首次部署前需要一次性准备：

```bash
npx wrangler d1 create wingwen-chat-budget    # 拿到 database_id 填进 wrangler.toml
npx wrangler secret put DEEPSEEK_API_KEY      # 在项目目录执行
```

## 5. 本地开发

```bash
npm run dev                              # 只跑静态站点，/api/chat 不可用
npx wrangler dev --local                 # 跑完整 Worker：静态资源 + /api/chat + 本地 D1
```

`wrangler dev` 会读 `.dev.vars`，里面放本地假 Key 与本地假上游地址即可，不要放真实 Key。

## 6. 部署后自查清单

```bash
B=https://wingwenblog.2592959544.workers.dev
curl -s $B/ | grep canonical            # 应指向线上域名
curl -s $B/about/ -o /dev/null -w '%{http_code}\n'
curl -s $B/nope -o /dev/null -w '%{http_code}\n'   # 404
curl -s $B/profile.resume.pdf -o /dev/null -w '%{http_code}\n'
curl -s -X POST $B/api/chat -H 'content-type: application/json' \
  -H "origin: $B" -d '{"question":"你实习做了什么？"}'
```

## 7. 已知限制

- **`workers.dev` 在国内访问不稳定**，演示前建议绑自定义域名。换域名时要同时改 `SITE_URL`（构建变量）与 `wrangler.toml` 里的 `ALLOWED_ORIGINS`，否则助手会 403、canonical 仍指旧域名。
- **单 IP 每分钟 8 次是全局共享的**：同一个 NAT 后面的多个访客会共用这个额度。演示够用，公开推广时要调。
- **D1 未绑定则两层限制都不生效**：此时只有 DeepSeek 账户余额兜底。
- **没有自定义域名的 WAF 速率规则**，突发拦截只靠 D1 计数（在函数内，不是边缘）。
- **费用数字待核实**：单次调用成本目前只有官方价目表的量级估算，没有绑定账单做实测。
- 对话记录只存在页面内存，刷新即清空；没有账号与跨设备同步。
