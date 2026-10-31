import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { profile } from '../data/profile';

// 社交平台普遍不认 SVG，所以这里在构建期把 SVG 栅格化成 1200×630 的 PNG。
// 文案直接读 profile，避免 OG 图与站内信息各维护一份。
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const serifStack = 'Songti SC, STSong, Noto Serif CJK SC, Source Han Serif SC, serif';
const monoStack = 'Menlo, Consolas, monospace';

export const GET: APIRoute = async () => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="#FAF8F4"/>
  <rect x="64" y="64" width="1072" height="1" fill="#DED8CC"/>
  <rect x="64" y="565" width="1072" height="1" fill="#DED8CC"/>
  <text x="64" y="110" font-family="${monoStack}" font-size="22" letter-spacing="4" fill="#6B675E">ZHIYU · FOLIO</text>
  <text x="64" y="292" font-family="${serifStack}" font-size="120" fill="#1A1A18">${escapeXml(profile.name)}</text>
  <text x="64" y="356" font-family="${serifStack}" font-size="34" fill="#6B675E">${escapeXml(profile.tagline)}</text>
  <rect x="64" y="398" width="72" height="2" fill="#9B3D2E"/>
  <text x="64" y="500" font-family="${monoStack}" font-size="22" letter-spacing="2" fill="#6B675E">${escapeXml(profile.status)}</text>
</svg>`;

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
