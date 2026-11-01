// 从 GitHub 公开 API 生成仓库快照。
// 用法：node scripts/fetch-repositories.mjs
// 名称、简介、语言标签都来自仓库本身；没有简介的仓库保留空字符串，
// 由页面明确显示「仓库未填写简介」，不补写。任何一次请求失败都不覆盖旧快照。

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const USERNAME = 'wingwen';
const API = 'https://api.github.com';
const OUTPUT = path.join(process.cwd(), 'src', 'data', 'repositories.json');
const HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'WingwenBlog/1.0',
};

async function getJson(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    throw new Error(
      `GitHub API ${response.status} for ${url}${remaining === null ? '' : `（剩余额度 ${remaining}）`}`,
    );
  }
  return response.json();
}

const repos = await getJson(`${API}/users/${USERNAME}/repos?per_page=100&sort=updated`);
if (!Array.isArray(repos)) throw new Error('仓库列表不是数组');
if (repos.length === 0) throw new Error('没有公开仓库');

const records = [];

for (const repo of repos) {
  const languages = await getJson(`${API}/repos/${USERNAME}/${repo.name}/languages`);
  const topLanguages = Object.entries(languages)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([name]) => name);

  const tags = [...new Set([...topLanguages, ...(repo.topics ?? [])])].slice(0, 6);

  records.push({
    name: repo.name,
    description: repo.description ?? '',
    url: repo.html_url,
    homepage: repo.homepage ?? '',
    language: repo.language ?? '',
    tags,
    fork: Boolean(repo.fork),
    archived: Boolean(repo.archived),
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
  });
}

records.sort(
  (left, right) =>
    (right.pushedAt ?? '').localeCompare(left.pushedAt ?? '') || left.name.localeCompare(right.name),
);

const snapshot = {
  username: USERNAME,
  profileUrl: `https://github.com/${USERNAME}`,
  sourceUrl: `${API}/users/${USERNAME}/repos`,
  fetchedAt: new Date().toISOString(),
  repos: records,
};

await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(
  `已写入 ${path.relative(process.cwd(), OUTPUT)}：${records.length} 个仓库，${records
    .map((repo) => `${repo.name}（${repo.tags.join(' / ') || '无标签'}）`)
    .join('，')}`,
);
