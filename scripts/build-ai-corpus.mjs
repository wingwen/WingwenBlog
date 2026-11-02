#!/usr/bin/env node
/**
 * 生成 AI 助手语料：只读公开个人资料与三个项目，输出 src/server/corpus.generated.json。
 *
 * 两条硬约束：
 * 1. 语料里出现已删除的文章栏目内容时直接失败，避免旧内容被重新喂回模型。
 * 2. 只取白名单字段，头像、isPlaceholder 这类实现细节不进语料。
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputFile = path.join(projectRoot, 'src/server/corpus.generated.ts');

const projectIds = ['lazetrade', 'mail', 'lisa'];
const projectUrlPrefix = '/projects/';
const forbiddenInMaterial = ['/posts', '/tags', '文章'];

async function loadProfile() {
  // 用 Vite 的 SSR 加载器读 profile.ts：它同时处理 TypeScript 与图片导入，
  // 并且不依赖 Node 版本对 TS 的原生支持（Cloudflare Pages 的构建镜像 Node 版本不由我们决定）。
  const { createServer } = await import('vite');

  const vite = await createServer({
    root: projectRoot,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });

  try {
    const module = await vite.ssrLoadModule('/src/data/profile.ts');
    return module.profile;
  } finally {
    await vite.close();
  }
}

function unquote(text) {
  const trimmed = text.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function parseValue(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith('[')) return unquote(trimmed);
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];
  return inner
    .split(',')
    .map((piece) => unquote(piece))
    .filter((piece) => piece !== '');
}

/**
 * 只支持项目 frontmatter 实际用到的写法：标量、单行数组、块状数组。
 * 遇到嵌套对象（例如 screenshots 的每一项是对象）时整块跳过——语料不用这些字段。
 * 其它无法识别的新写法仍然直接报错，而不是猜。
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('项目文件缺少 frontmatter');

  const [, head, body] = match;
  const data = {};
  const nestedKeys = new Set();
  let currentKey = null;

  for (const line of head.split('\n')) {
    if (!line.trim()) continue;

    if (!/^\s/.test(line)) {
      const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
      if (!keyMatch) throw new Error(`无法解析的 frontmatter 行：${line}`);
      const [, key, rest] = keyMatch;
      currentKey = key;
      data[key] = rest.trim() === '' ? [] : parseValue(rest);
      continue;
    }

    // 缩进行都属于 currentKey。
    if (/^\s+-\s+[A-Za-z_][A-Za-z0-9_]*:\s/.test(line) || /^\s+[A-Za-z_][A-Za-z0-9_]*:\s/.test(line)) {
      nestedKeys.add(currentKey);
      continue;
    }

    const itemMatch = line.match(/^\s+-\s+(.*)$/);
    if (itemMatch && currentKey && !nestedKeys.has(currentKey)) {
      data[currentKey].push(unquote(itemMatch[1]));
      continue;
    }

    if (itemMatch && nestedKeys.has(currentKey)) continue;

    throw new Error(`无法解析的 frontmatter 行：${line}`);
  }

  for (const key of nestedKeys) delete data[key];

  return { data, body: body.trim() };
}

function asList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (value === undefined || value === null || value === '') return [];
  return [String(value)];
}

function buildProfileText(profile) {
  const lines = [];
  lines.push(`姓名：${profile.name}`);
  if (profile.alias && profile.alias !== profile.name) lines.push(`昵称：${profile.alias}`);
  lines.push(`定位：${profile.tagline}`);
  lines.push(`侧栏介绍：${profile.siteIntro}`);
  lines.push(`自我介绍：${profile.intro}`);
  lines.push(`所在城市：${profile.location}`);
  lines.push(`当前状态：${profile.status}`);
  lines.push(`邮箱：${profile.email}`);

  for (const link of profile.links ?? []) {
    lines.push(`${link.label}：${link.href}`);
  }

  lines.push('');
  lines.push('教育经历：');
  for (const item of profile.education ?? []) {
    const gpa = item.gpa ? `，GPA ${item.gpa}` : '';
    lines.push(`- ${item.school}｜${item.major}｜${item.degree}｜${item.period}${gpa}`);
  }

  lines.push('');
  lines.push('实习与工作：');
  for (const item of profile.experience ?? []) {
    lines.push(`- ${item.org}｜${item.role}｜${item.period}`);
    for (const point of item.points ?? []) lines.push(`  · ${point}`);
  }

  lines.push('');
  lines.push('技能：');
  for (const group of profile.skills ?? []) {
    lines.push(`- ${group.group}：${asList(group.items).join('、')}`);
  }

  const publications = asList((profile.publications ?? []).map((item) => `${item.title}（${item.venue}）`));
  if (publications.length > 0) {
    lines.push('');
    lines.push('论文：');
    for (const item of publications) lines.push(`- ${item}`);
  }

  const tags = asList(profile.tags);
  if (tags.length > 0) {
    lines.push('');
    lines.push(`个人标签：${tags.join('、')}`);
  }

  const interests = asList(profile.interests);
  if (interests.length > 0) lines.push(`喜欢的东西：${interests.join('、')}`);

  return lines.join('\n');
}

function buildProjectText(data, body) {
  const lines = [];
  lines.push(`项目名称：${data.title}`);
  if (data.period) lines.push(`时间：${data.period}`);
  else lines.push(`年份：${data.year}`);
  lines.push(`角色：${data.role}`);

  const stack = asList(data.stack);
  if (stack.length > 0) lines.push(`技术栈：${stack.join('、')}`);

  if (data.summary) {
    lines.push('');
    lines.push(`一句话说明：${data.summary}`);
  }
  if (data.background) {
    lines.push('');
    lines.push('背景：');
    lines.push(String(data.background));
  }

  const responsibilities = asList(data.responsibilities);
  if (responsibilities.length > 0) {
    lines.push('');
    lines.push('我负责的部分：');
    for (const item of responsibilities) lines.push(`- ${item}`);
  }

  const outcomes = asList(data.outcomes);
  if (outcomes.length > 0) {
    lines.push('');
    lines.push('结果：');
    for (const item of outcomes) lines.push(`- ${item}`);
  }

  if (body) {
    lines.push('');
    lines.push(`补充说明：${body}`);
  }

  return lines.join('\n');
}

const profile = await loadProfile();

const sources = [
  {
    key: 'home',
    title: '首页',
    url: '/',
    text: '这是 Wingwen 的个人网站首页，包含欢迎横幅、个人资料栏与三个代表项目的摘要。',
  },
  {
    key: 'about',
    title: '关于',
    url: '/about',
    text: buildProfileText(profile),
  },
];

for (const id of projectIds) {
  const raw = await readFile(path.join(projectRoot, `src/content/projects/${id}.md`), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  sources.push({
    key: `project:${id}`,
    title: `${data.title?.split('·')[0]?.trim() ?? id} 项目`,
    url: `${projectUrlPrefix}${id}`,
    text: buildProjectText(data, body),
  });
}

const material = sources.map((source) => `「${source.title}」\n${source.text}`).join('\n\n');

for (const forbidden of forbiddenInMaterial) {
  if (material.includes(forbidden)) {
    throw new Error(`语料里出现了已删除的文章栏目内容（${forbidden}），请检查数据来源`);
  }
}

const characterCount = [...material].length;
const corpus = {
  generatedAt: new Date().toISOString(),
  characterCount,
  estimatedTokens: Math.ceil(characterCount / 1.6),
  sources,
  material,
};

// 生成 TS 而不是 JSON：Node 原生跑 TS 时不需要 import attributes，
// 本地脚本与单测可以像普通模块一样直接导入。
const fileContent = [
  '// 由 scripts/build-ai-corpus.mjs 生成，请勿手工编辑。',
  "import type { Corpus } from './corpus';",
  '',
  `export const corpusData: Corpus = ${JSON.stringify(corpus, null, 2)};`,
  '',
].join('\n');

await writeFile(outputFile, fileContent, 'utf8');

console.log(`语料已生成：${path.relative(projectRoot, outputFile)}`);
console.log(`来源 ${sources.length} 个，${characterCount} 字符，约 ${corpus.estimatedTokens} tokens`);
for (const source of sources) {
  console.log(`  - ${source.key}  ${source.title}  ${[...source.text].length} 字符  ${source.url}`);
}
