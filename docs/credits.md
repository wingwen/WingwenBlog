# 第三方素材与许可

> 记录站点实际使用的第三方字体、素材与设计参考，以及各自的分发许可。
> 原则：所有运行时资源都随仓库自托管，页面在加载时不向第三方域名发起任何请求。

---

## 字体

### Newsreader（拉丁可变衬线体）

| 项目 | 内容 |
|---|---|
| 字体名 | Newsreader |
| 授权 | SIL Open Font License 1.1（OFL） |
| 版权 | Copyright 2020 The Newsreader Project Authors（http://github.com/productiontype/Newsreader） |
| 来源 | Google Fonts，字体页 https://fonts.google.com/specimen/Newsreader |
| 下载地址 | `https://fonts.gstatic.com/s/newsreader/v26/cY9AfjOCX1hbuyalUrK4397yjIJFJpc.woff2`（常规）、`https://fonts.gstatic.com/s/newsreader/v26/cY9CfjOCX1hbuyalUrK439vCjohCBJWxZA.woff2`（斜体） |
| 版本标识 | Google Fonts 分发版本 `v26`（即 CSS API 路径中的 `/newsreader/v26/`） |
| 许可全文 | `public/fonts/OFL.txt` |

**本地文件**

| 文件 | 字重轴 | 大小 | SHA-256 |
|---|---|---|---|
| `public/fonts/newsreader-latin-wght-normal.woff2` | `wght 200–800`（常规） | 131,848 B | `01817351be3edfc1714fe6d60ddea6a22a169a5ebd033b50c7f9495e5d9c386a` |
| `public/fonts/newsreader-latin-wght-italic.woff2` | `wght 200–800`（斜体） | 147,060 B | `a99fb127682b9af538780d21420037452197b0d37dfd273eb108f8a3665d5501` |

**使用方式**

- 两个文件都是 Google Fonts 的 **latin 子集**，不含任何中文字形。
- `src/styles/fonts.css` 中声明，`unicode-range: U+0000-00FF, U+2013-2014`：
  只有页面出现拉丁字母、数字或破折号时才会下载；中文字符不在范围内，继续走系统字体栈
  （`Songti SC` / `STSong` / `Noto Serif CJK SC` / `Source Han Serif SC`），不会因为这次改动多下载一个中文字体。
- `--font-serif` 的第一位是 `Newsreader`，系统字体栈整体保留在后面作为回退。
- 常规体在 `BaseLayout` 的 `<head>` 里 preload；斜体只在关于页的 `<cite>` 用到，按需加载。
- 字体文件与站点同源，没有任何 CDN 或第三方域名参与加载。

---

## 设计参考

设计方向「纸本档案」的组织方式（编号条目、细分隔线、等宽元信息）参考了公开作品的排版思路，
没有复制其代码、样式表或整站结构。具体参考来源在部署阶段（P7）整理后补入本节。

---

## 目前**没有**使用的第三方资源

- 无 CDN、无 web font 服务、无图标库、无分析脚本、无评论系统。
- 页面运行时对第三方域名的请求数：0（已在构建产物上抓包核实）。
