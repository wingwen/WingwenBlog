export const site = {
  name: 'Wingwen’s Blog',
} as const;

export const features = {
  /**
   * 站点 AI 助手开关。
   * 为 false 时，资料栏只显示一张不可点击的说明卡，写明「还没接通」这个真实状态，
   * 全站不会出现指向未完成页面的链接，也不写「即将上线」之类的预告。
   * 接通模型后改成 true，卡片和导航右侧入口会一起变成可点击的对话入口。
   */
  aiAssistant: false,
} as const;

export const assistant = {
  /** 接通后对话入口指向的路径，由 P6 的 /assistant 页承接。 */
  href: '/assistant',
  /** 接通后的引导语。 */
  hint: '项目、经历、技术栈，都可以直接问我。',
  /** 未接通时说明真实情况，不用预告式文案。 */
  pendingHint: '还在接线，接通后这里会变成对话入口。',
  /** 接通后卡片底部显示的动作文字。 */
  readyLabel: '开始对话',
} as const;
