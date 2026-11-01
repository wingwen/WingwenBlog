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
  name: string;
  /** 对外使用的英文昵称，与站名一起出现，不替代正式姓名。 */
  alias: string;
  tagline: string;
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
  /** 个人喜好，只以文字形式出现，不使用任何角色形象。 */
  interests: string[];
  isPlaceholder: boolean;
}

export const profile: Profile = {
  name: '庞楚雯',
  alias: 'Wingwen',
  tagline: '计算机技术硕士在读 · 做全栈开发与 LLM 应用落地',
  intro:
    '2027 届计算机技术硕士，求职方向是开发与 AI Agent。做过外贸 B2B 客服系统的邮件全链路、Agent 行为评测体系，以及基于 pgvector 的产品检索。我关心的不是模型能不能答出来，而是把模型能力接进真实业务之后，怎么让它可控、可验证、能兜底。',
  location: '深圳',
  status: '2027 届 · 在读硕士 · 求职中',
  email: '2592959544@qq.com',
  portrait: {
    src: portraitImage,
    alt: '庞楚雯的证件照',
  },
  links: [{ label: 'GitHub', href: 'https://github.com/wingwen' }],
  // 简历 PDF 的公开版本尚未确认。填入 { href: '/resume.pdf', label: '下载简历（PDF）' }
  // 并把文件放到 public/resume.pdf，下载入口会自动出现在关于页。
  resume: null,
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
  interests: ['初音未来', '猫猫', '罗小黑', '利姆鲁'],
  isPlaceholder: false,
};
