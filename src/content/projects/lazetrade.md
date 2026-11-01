---
title: 'Lazetrade · 外贸 CRM 智能客服'
year: 2026
period: '2026.05 – 至今'
order: 1
role: '全栈开发'
stack: ['TypeScript', 'Nuxt 3', 'Vue 3', 'Prisma + PostgreSQL', 'pgvector', 'RESTful API']
summary: '面向外贸客户管理与产品运营的一体化平台，覆盖多租户 CRM、交易协同、产品 RAG 检索与移动端作业。'
background: '外贸客户管理与产品运营原本分散在表格与多个系统之间。这个平台把它们收敛到一处，并让产品检索从关键词匹配走向可解释的混合召回。'
responsibilities:
  - '搭建产品 RAG 全链路：以 Outbox 捕获产品变更，完成事实文档生成、Embedding 与 pgvector 版本化索引；查询侧经术语归一化、结构化 / 关键词 / 向量三路召回、硬条件过滤、融合重排及主库回查，返回可解释结果。'
  - '构建产品检索评测：覆盖多条件检索、同义改写与无结果场景；混合召回 Top-3 命中率 86%、Top-1 准确率 78%，并通过全量回归验证重排效果与检索稳定性。'
  - '构建 H5 独立视图系统：拆分移动端路由与组件层，复用客户、交易、邮件和产品接口，保留登录回跳、查询参数及权限上下文，使核心 CRM 操作在桌面端与移动端保持一致。'
  - '迭代客户交易功能：面向 170+ API 路由、68 个数据模型的 CRM 平台，交付客户标记与筛选、报价与订单、入账及提成备注等需求，联动调整页面、接口与数据展示。'
outcomes:
  - '产品检索 Top-3 命中率 86%，Top-1 准确率 78%'
  - '核心 CRM 操作在桌面端与移动端保持一致'
links: []
screenshots:
  - src: '/images/projects/lazetrade-app.jpg'
    alt: 'Lazetrade 产品管理页面截图'
    width: 1024
    height: 580
    caption: '产品管理 · 商品列表'
liveUrl: 'https://wachater.com/products'
isPlaceholder: false
---

Lazetrade 是外贸业务线里承载客户、交易与产品的平台。产品检索的难点不在于「能不能搜到」，而在于搜到的结果是可解释、可评估、可回归的——因此这条链路从数据变更捕获、索引版本化，到多路召回与重排，每一步都留了可验证的出口。
