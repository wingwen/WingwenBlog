// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 真实域名要等 P7 在 Cloudflare Pages / Vercel 实测后才确定，所以这里不猜。
// 构建产物中的 canonical、og:url、sitemap 与 robots.txt 全部从 `site` 推导，
// 部署时只要把环境变量 SITE_URL 设成真实域名（例如 SITE_URL=https://example.org npm run build），
// 四处地址会一起更新，不会出现互相矛盾的链接。
// ⚠️ 部署前必须替换下面的占位值，否则所有对外链接都会指向 example.com。
const siteUrl = process.env.SITE_URL ?? 'https://example.com';

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // 选 github-light-high-contrast 而不是 github-light / min-light：
      // 后两者的 token 色（#E36209 橙 3.29:1、#1976D2 蓝 4.34:1）在纸色底上达不到
      // AA 要求的 4.5:1。高对比版全部 token 都在 7.6:1 以上。
      theme: 'github-light-high-contrast',
      transformers: [
        {
          // Shiki 会把主题的白底写进 <pre> 的 style，去掉后由 base.css 用 token 决定代码块表面。
          pre(node) {
            node.properties.style = undefined;
          },
        },
      ],
    },
  },
});
