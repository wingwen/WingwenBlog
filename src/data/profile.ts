import type { ImageMetadata } from 'astro';
import portraitImage from '../assets/portrait.jpg';

export interface ProfileLink {
  label: string;
  href: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface EducationItem {
  school: string;
  major: string;
  degree: string;
  period: string;
  gpa?: string;
}

export interface ExperienceItem {
  org: string;
  role: string;
  period: string;
  points: string[];
}

export interface Publication {
  title: string;
  venue: string;
}

export interface ResumeFile {
  href: string;
  label: string;
}

export interface Portrait {
  src: ImageMetadata;
  alt: string;
}

export interface Profile {
  /** 对外统一显示名。 */
  name: string;
  /** 与站名一起出现的名字，目前与 name 相同。 */
  alias: string;
  tagline: string;
  /** 侧栏顶部的一句话介绍，和关于页的长简介分开。 */
  siteIntro: string;
  intro: string;
  location: string;
  status: string;
  email: string;
  portrait: Portrait | null;
  links: ProfileLink[];
  resume: ResumeFile | null;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillGroup[];
  publications: Publication[];
  /** 侧栏「个人标签」的短标签，顺序按给定内容展示。 */
  tags: string[];
  /** 个人喜好，只以文字形式出现，不使用任何角色形象。 */
  interests: string[];
  isPlaceholder: boolean;
}

export const profile: Profile = {
  name: 'Wingwen',
  alias: 'Wingwen',
  tagline: '计算机技术专业 · 全栈开发实习生',
  siteIntro: '这里是我的个人网站，记录热爱与成长。喜欢动漫编程，乐享生活，期待相遇✨',
  intro:
    '2027 届计算机技术硕士，求职方向是开发与 AI Agent。做过外贸 B2B 客服系统的邮件全链路、Agent 行为评测体系，以及基于 pgvector 的产品检索。我关心的不是模型能不能答出来，而是把模型能力接进真实业务之后，怎么让它可控、可验证、能兜底。',
  location: '深圳',
  status: '2027 届 · 在读硕士 · 求职中',
  email: '2592959544@qq.com',
  portrait: {
    src: portraitImage,
    alt: 'Wingwen 的证件照',
  },
  links: [{ label: 'GitHub', href: 'https://github.com/wingwen' }],
  // 公开版简历放在 public/profile.resume.pdf，构建后由站点同源提供。
  resume: {
    href: '/profile.resume.pdf',
    label: '下载简历（PDF）',
  },
  education: [
    {
      school: '广州大学',
      major: '计算机技术',
      degree: '硕士',
      period: '2024.09 – 2027.06',
      gpa: '3.81 / 5.0',
    },
    {
      school: '桂林理工大学',
      major: '计算机科学与技术',
      degree: '本科',
      period: '2020.09 – 2024.06',
      gpa: '3.41 / 5.0',
    },
  ],
  experience: [
    {
      org: '深圳市一站通易链实业有限公司',
      role: '全栈开发实习生',
      period: '2026.04 – 至今',
      points: [
        '参与外贸 B2B AI 客服系统研发，交付邮件系统全链路与 Agent 行为评测体系。',
        '开发提交占 72%（96 / 133，Git 可复核）。',
      ],
    },
    {
      org: '湖南蓝布科技有限公司',
      role: 'Profiling 开发与模型精度测试',
      period: '2025.12 – 2026.04',
      points: [
        '完成三款 AI 芯片模拟器的 Profiling 与 Constraint 功能开发，100% 通过 Code Review 并合入主线分支。',
        '负责 LLM、语音、视觉、OCR、多模态模型的浮点精度测试，输出精度对比数据与测试报告，项目验收合格。',
      ],
    },
  ],
  skills: [
    {
      group: '语言基础',
      items: ['TypeScript', 'Node.js', 'Python', 'C / C++', 'PostgreSQL + Prisma'],
    },
    {
      group: 'Agent 开发',
      items: [
        '多模型接入与结构化输出',
        '生成内容门控与人工确认',
        'RAG 检索增强',
        'Agent 行为评测体系',
        'Prompt Engineering',
        'MCP 与自动化工作流',
        'AI 辅助开发（Cursor / Codex）',
      ],
    },
    {
      group: '前后端开发',
      items: ['NestJS', 'Vue 3 / Nuxt 3', 'FastAPI', 'RESTful API', 'WebSocket', '微服务拆分'],
    },
    {
      group: '工程能力',
      items: ['BFF 代理架构', '结构化日志', 'Git / GitHub 协作', 'Linux 基础与网络配置', 'Matlab 信号处理'],
    },
    {
      group: '语言与其他',
      items: ['英语 CET-4 / CET-6'],
    },
  ],
  publications: [
    {
      title: 'Backdoor Watermarking for Continuous Prompt Learning Models in Industrial Systems',
      venue: 'CCF-B',
    },
  ],
  tags: [
    '猫猫🐱',
    '狗狗🐶',
    'coding',
    '初音未来miku',
    'YOYO酱',
    '游泳🏊',
    '载酒寻歌',
    '罗小黑',
    '利姆鲁',
    '动漫',
    'JOJO',
    '平和',
    '游戏',
    'steam',
    '👀玄学',
    '音乐🎵',
    '喝水💦',
    'bilibili',
    '鹅肝',
    '散步🚶',
    '成长型',
    '爱好和平',
    '榴莲',
    '米饭🍚',
  ],
  interests: ['初音未来', '猫猫', '罗小黑', '利姆鲁'],
  isPlaceholder: false,
};
