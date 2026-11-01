// 从 GitHub 公开贡献日历生成一份静态快照。
// 用法：node scripts/fetch-contributions.mjs [YYYY-MM-DD]
// 缺省以当天为截止日，向前取 365 天。GitHub 的接口按自然年返回，
// 所以脚本会抓取截止日所在年份与上一年，再裁成滚动一年。
// 任何一步对不上（年份、格子数、总数）都会直接失败，不覆盖已有快照。

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const USERNAME = 'wingwen';
const OUTPUT = path.join(process.cwd(), 'src', 'data', 'contributions.json');

function addDays(isoDate, offset) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function sumCounts(map) {
  let total = 0;
  for (const count of map.values()) total += count;
  return total;
}

function parseCalendar(html, year) {
  const from = html.match(/data-from="(\d{4}-\d{2}-\d{2})/);
  if (!from || from[1].slice(0, 4) !== String(year)) {
    throw new Error(`日历年份不对，期望 ${year}，实际 ${from?.[1] ?? '缺失'}`);
  }

  const cells = [...html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g)].map((match) => match[1]);
  const tooltips = [...html.matchAll(/<tool-tip[^>]*>([^<]*)<\/tool-tip>/g)].map((match) => match[1]);

  if (cells.length !== tooltips.length) {
    throw new Error(`格子与提示数量不一致：${cells.length} / ${tooltips.length}`);
  }

  const countsByDate = new Map();
  for (let index = 0; index < cells.length; index += 1) {
    const tooltip = tooltips[index].trim();
    let count = 0;

    if (!/^No contributions/.test(tooltip)) {
      const matched = tooltip.match(/^([\d,]+) contributions?/);
      if (!matched) throw new Error(`无法解析贡献数量：${tooltip}`);
      count = Number(matched[1].replace(/,/g, ''));
    }

    countsByDate.set(cells[index], count);
  }

  const summary = html.match(/id="js-contribution-activity-description"[^>]*>([\s\S]*?)<\/h2>/);
  const summaryTotal = summary?.[1].replace(/\s+/g, ' ').match(/([\d,]+) contributions?/);
  if (!summaryTotal) throw new Error('页面没有贡献总数，可能是登录页或限流页');
  if (Number(summaryTotal[1].replace(/,/g, '')) !== sumCounts(countsByDate)) {
    throw new Error(`页面总数与逐日求和不一致：${summaryTotal[1]} / ${sumCounts(countsByDate)}`);
  }

  return countsByDate;
}

async function fetchYear(year) {
  const url = `https://github.com/users/${USERNAME}/contributions?from=${year}-01-01&to=${year}-12-31`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WingwenBlog/1.0)' },
  });

  if (!response.ok) {
    throw new Error(`请求 ${year} 年日历失败：HTTP ${response.status}`);
  }

  return parseCalendar(await response.text(), year);
}

const requestedEnd = process.argv[2] ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedEnd)) {
  throw new Error('截止日期必须是 YYYY-MM-DD');
}

const rangeEnd = requestedEnd;
const rangeStart = addDays(rangeEnd, -364);
const endYear = Number(rangeEnd.slice(0, 4));
const previousYear = endYear - 1;

const calendars = new Map([
  ...(await fetchYear(previousYear)),
  ...(await fetchYear(endYear)),
]);

const days = [];
for (let offset = 0; offset < 365; offset += 1) {
  const date = addDays(rangeStart, offset);
  if (!calendars.has(date)) throw new Error(`缺少 ${date} 的贡献数据`);
  days.push({ date, count: calendars.get(date) });
}

const total = days.reduce((sum, day) => sum + day.count, 0);
const activeDays = days.filter((day) => day.count > 0).length;
const maxPerDay = Math.max(...days.map((day) => day.count));

const snapshot = {
  username: USERNAME,
  profileUrl: `https://github.com/${USERNAME}`,
  sourceUrl: `https://github.com/users/${USERNAME}/contributions`,
  rangeStart,
  rangeEnd,
  fetchedAt: new Date().toISOString(),
  total,
  activeDays,
  maxPerDay,
  days,
};

await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(
  `已写入 ${path.relative(process.cwd(), OUTPUT)}：${rangeStart} → ${rangeEnd}，${total} 次贡献，${activeDays} 天有记录，单日最高 ${maxPerDay}`,
);
