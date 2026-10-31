import type { APIRoute } from 'astro';

// robots.txt 由构建期生成，而不是写死在 public/ 里：
// Sitemap 地址从 astro.config.mjs 的 `site` 推导，换域名时不可能和 sitemap 脱节。
export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error('astro.config.mjs 未配置 `site`，无法为 robots.txt 生成 Sitemap 地址。');
  }

  const sitemapUrl = new URL('sitemap-index.xml', site);
  const body = ['User-agent: *', 'Allow: /', `Sitemap: ${sitemapUrl.href}`, ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
